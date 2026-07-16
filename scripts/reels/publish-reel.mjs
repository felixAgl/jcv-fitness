#!/usr/bin/env node
/**
 * publish-reel.mjs — Publish a generated Reel to Instagram via the Meta Graph
 * API (Content Publishing, resumable upload — no public URL needed).
 *
 * Usage:
 *   IG_USER_ID=... IG_ACCESS_TOKEN=... node scripts/reels/publish-reel.mjs \
 *     --video reels-out/2026-07-15-0043.mp4 --caption reels-out/2026-07-15-0043.txt
 *
 * Env:
 *   IG_USER_ID        Instagram professional account id (numeric)
 *   IG_ACCESS_TOKEN   Long-lived Meta access token with instagram_content_publish
 *   GRAPH_API_VERSION Optional, default v21.0
 *
 * When IG_USER_ID / IG_ACCESS_TOKEN are absent this script prints setup
 * instructions and exits 0 with "GENERATED ONLY" so CI never fails.
 *
 * IMPORTANT — MEDIA LICENSE: the exercise clips are (c) Gymvisual. The owner's
 * Gymvisual license is still IN PROGRESS. Do not configure the publish secrets
 * until that license is finalized; until then the pipeline generates only.
 */

import { readFileSync, statSync } from "node:fs";

const API_VERSION = process.env.GRAPH_API_VERSION || "v21.0";
const IG_USER_ID = process.env.IG_USER_ID;
const IG_ACCESS_TOKEN = process.env.IG_ACCESS_TOKEN;

function parseArgs(argv) {
  const args = { video: null, caption: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--video") args.video = argv[++i];
    else if (argv[i] === "--caption") args.caption = argv[++i];
  }
  if (!args.video) throw new Error("Usage: publish-reel.mjs --video <file.mp4> [--caption <file.txt>]");
  return args;
}

const SETUP_INSTRUCTIONS = `
================================================================
 IG publish skipped — IG_USER_ID / IG_ACCESS_TOKEN not set.
 The reel was GENERATED ONLY. Download it from the workflow
 artifacts and post it manually, or set up API publishing:

 1. Convert the Instagram account to Professional (Business or
    Creator) and link it to a Facebook Page you admin
    (Instagram app > Settings > Account type and tools).
 2. Create a Meta app at https://developers.facebook.com/apps
    (type "Business"), add the "Instagram Graph API" product.
 3. In Graph API Explorer, generate a User token with scopes:
    instagram_basic, instagram_content_publish,
    pages_read_engagement, business_management.
 4. Exchange it for a long-lived token (~60 days):
    GET https://graph.facebook.com/v21.0/oauth/access_token
      ?grant_type=fb_exchange_token&client_id=APP_ID
      &client_secret=APP_SECRET&fb_exchange_token=SHORT_TOKEN
 5. Get the IG user id:
    GET /v21.0/me/accounts               -> page id
    GET /v21.0/{page-id}?fields=instagram_business_account
 6. Add GitHub repo secrets IG_USER_ID and IG_ACCESS_TOKEN
    (Settings > Secrets and variables > Actions).

 LICENSE GATE: exercise media is (c) Gymvisual — only enable
 these secrets once the Gymvisual license is finalized.
================================================================
`;

async function graph(path, { method = "GET", body } = {}) {
  const url = `https://graph.facebook.com/${API_VERSION}/${path}`;
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/x-www-form-urlencoded" } : undefined,
    body: body ? new URLSearchParams(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(`Graph API ${method} /${path} failed: ${JSON.stringify(json.error ?? json)}`);
  }
  return json;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!IG_USER_ID || !IG_ACCESS_TOKEN) {
    console.log(SETUP_INSTRUCTIONS);
    console.log("GENERATED ONLY");
    process.exit(0);
  }

  const caption = args.caption ? readFileSync(args.caption, "utf8") : "";
  const fileSize = statSync(args.video).size;

  // 1. Create a resumable REELS media container
  console.log("Creating media container...");
  const container = await graph(`${IG_USER_ID}/media`, {
    method: "POST",
    body: {
      media_type: "REELS",
      upload_type: "resumable",
      caption,
      share_to_feed: "true",
      access_token: IG_ACCESS_TOKEN,
    },
  });
  const containerId = container.id;
  console.log(`Container ${containerId} created, uploading ${fileSize} bytes...`);

  // 2. Upload the local file via the resumable upload endpoint
  const uploadRes = await fetch(
    `https://rupload.facebook.com/ig-api-upload/${API_VERSION}/${containerId}`,
    {
      method: "POST",
      headers: {
        Authorization: `OAuth ${IG_ACCESS_TOKEN}`,
        offset: "0",
        file_size: String(fileSize),
        "Content-Type": "application/octet-stream",
      },
      body: readFileSync(args.video),
    }
  );
  const uploadJson = await uploadRes.json().catch(() => ({}));
  if (!uploadRes.ok || uploadJson.success === false) {
    throw new Error(`Video upload failed: ${JSON.stringify(uploadJson)}`);
  }

  // 3. Poll container status until processed (max ~5 min)
  console.log("Waiting for Instagram to process the video...");
  const deadline = Date.now() + 5 * 60 * 1000;
  for (;;) {
    const status = await graph(`${containerId}?fields=status_code,status&access_token=${IG_ACCESS_TOKEN}`);
    if (status.status_code === "FINISHED") break;
    if (status.status_code === "ERROR" || status.status_code === "EXPIRED") {
      throw new Error(`Container processing failed: ${status.status}`);
    }
    if (Date.now() > deadline) throw new Error("Timed out waiting for container processing");
    await sleep(10_000);
  }

  // 4. Publish
  const published = await graph(`${IG_USER_ID}/media_publish`, {
    method: "POST",
    body: { creation_id: containerId, access_token: IG_ACCESS_TOKEN },
  });
  console.log(`PUBLISHED — IG media id ${published.id}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
