import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  classifyType,
  summarize,
  detectOutliers,
  validateManifest,
  buildManifest,
} from "../validate-pack.mjs";

describe("classifyType", () => {
  it("maps known extensions to type buckets", () => {
    expect(classifyType("Treinos (1).mp4")).toBe("mp4");
    expect(classifyType("Rosca cabo (1).GIF")).toBe("gif");
    expect(classifyType("Planilla.docx")).toBe("docx");
    expect(classifyType("manual.pdf")).toBe("pdf");
    expect(classifyType("foto.jpg")).toBe("image");
    expect(classifyType("foto.png")).toBe("image");
    expect(classifyType("weird.xyz")).toBe("other");
    expect(classifyType("no-extension")).toBe("other");
  });
});

describe("summarize", () => {
  it("counts by type and sums sizes", () => {
    const files = [
      { type: "mp4", size: 100 },
      { type: "mp4", size: 200 },
      { type: "gif", size: 50 },
      { type: "pdf", size: 10 },
    ];
    expect(summarize(files)).toEqual({
      total: 4,
      byType: { mp4: 2, gif: 1, pdf: 1 },
      totalSize: 360,
    });
  });

  it("handles an empty list", () => {
    expect(summarize([])).toEqual({ total: 0, byType: {}, totalSize: 0 });
  });
});

describe("detectOutliers", () => {
  const base = (over) => ({
    type: "mp4",
    corrupt: false,
    w: 720,
    h: 1280,
    duration: 25,
    path: "x.mp4",
    ...over,
  });

  it("flags duration outliers beyond 4x / below 0.25x median", () => {
    const files = [
      base({ path: "a.mp4" }),
      base({ path: "b.mp4" }),
      base({ path: "c.mp4" }),
      base({ path: "long.mp4", duration: 500 }),
      base({ path: "short.mp4", duration: 2 }),
    ];
    const outliers = detectOutliers(files);
    const paths = outliers.map((o) => o.path);
    expect(paths).toContain("long.mp4");
    expect(paths).toContain("short.mp4");
    expect(paths).not.toContain("a.mp4");
  });

  it("flags resolution outliers only when a modal resolution dominates (>=60%)", () => {
    const dominant = [
      base({ path: "a.mp4" }),
      base({ path: "b.mp4" }),
      base({ path: "c.mp4" }),
      base({ path: "d.mp4" }),
      base({ path: "odd.mp4", w: 360, h: 640 }),
    ];
    expect(detectOutliers(dominant).map((o) => o.path)).toEqual(["odd.mp4"]);

    // 50/50 split: no modal dominance, no resolution outliers
    const split = [
      base({ path: "a.mp4" }),
      base({ path: "b.mp4", w: 360, h: 640 }),
      base({ path: "c.mp4" }),
      base({ path: "d.mp4", w: 360, h: 640 }),
    ];
    expect(detectOutliers(split)).toEqual([]);
  });

  it("ignores corrupt entries and small groups", () => {
    const files = [
      base({ path: "a.mp4" }),
      base({ path: "b.mp4", corrupt: true, duration: 9999 }),
    ];
    expect(detectOutliers(files)).toEqual([]);
  });
});

describe("validateManifest", () => {
  const validManifest = () => ({
    generatedAt: new Date().toISOString(),
    root: "/tmp/pack",
    summary: { total: 1, byType: { mp4: 1 }, totalSize: 100 },
    corrupt: [],
    outliers: [],
    files: [
      {
        name: "a.mp4",
        path: "a.mp4",
        type: "mp4",
        size: 100,
        w: 720,
        h: 1280,
        duration: 20,
        corrupt: false,
      },
    ],
  });

  it("accepts a well-formed manifest", () => {
    expect(validateManifest(validManifest())).toEqual({ valid: true, errors: [] });
  });

  it("rejects non-object input", () => {
    expect(validateManifest(null).valid).toBe(false);
    expect(validateManifest([]).valid).toBe(false);
  });

  it("rejects missing top-level fields", () => {
    const m = validManifest();
    delete m.corrupt;
    const res = validateManifest(m);
    expect(res.valid).toBe(false);
    expect(res.errors.join()).toContain("corrupt");
  });

  it("requires w/h on non-corrupt media but not on corrupt ones", () => {
    const m = validManifest();
    m.files[0].w = null;
    expect(validateManifest(m).valid).toBe(false);

    m.files[0].corrupt = true;
    expect(validateManifest(m).valid).toBe(true);
  });

  it("allows null duration on readable media (no duration metadata)", () => {
    const m = validManifest();
    m.files[0].duration = null;
    expect(validateManifest(m).valid).toBe(true);

    m.files[0].duration = -3;
    expect(validateManifest(m).valid).toBe(false);
  });

  it("does not require dimensions for non-media files", () => {
    const m = validManifest();
    m.files[0] = { name: "doc.pdf", path: "doc.pdf", type: "pdf", size: 5 };
    expect(validateManifest(m).valid).toBe(true);
  });

  it("catches summary.total mismatch", () => {
    const m = validManifest();
    m.summary.total = 99;
    const res = validateManifest(m);
    expect(res.valid).toBe(false);
    expect(res.errors.join()).toContain("summary.total");
  });
});

describe("buildManifest (small fixture, injected probe — no real media)", () => {
  let dir;

  beforeAll(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "media-pack-fixture-"));
    await fs.mkdir(path.join(dir, "sub"));
    await fs.writeFile(path.join(dir, "ok.mp4"), "fake-mp4-bytes");
    await fs.writeFile(path.join(dir, "sub", "ok.gif"), "fake-gif");
    await fs.writeFile(path.join(dir, "sub", "broken.mp4"), "corrupt");
    await fs.writeFile(path.join(dir, "notes.pdf"), "pdf");
    await fs.writeFile(path.join(dir, ".hidden"), "skip me");
  });

  afterAll(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  const fakeProbe = async (file) => {
    if (file.endsWith("broken.mp4")) throw new Error("ffprobe exit 1");
    return file.endsWith(".gif")
      ? { w: 360, h: 360, duration: 2.4 }
      : { w: 720, h: 1280, duration: 25 };
  };

  it("produces a schema-valid manifest with correct counts and corrupt detection", async () => {
    const manifest = await buildManifest(dir, { probe: fakeProbe });

    expect(validateManifest(manifest)).toEqual({ valid: true, errors: [] });
    expect(manifest.summary.total).toBe(4); // hidden file skipped
    expect(manifest.summary.byType).toEqual({ mp4: 2, gif: 1, pdf: 1 });
    expect(manifest.corrupt).toEqual([path.join("sub", "broken.mp4")]);

    const ok = manifest.files.find((f) => f.name === "ok.mp4");
    expect(ok).toMatchObject({ type: "mp4", w: 720, h: 1280, duration: 25, corrupt: false });
    expect(ok.size).toBeGreaterThan(0);

    const pdf = manifest.files.find((f) => f.name === "notes.pdf");
    expect(pdf.w).toBeNull(); // non-media files are not probed
  });

  it("uses paths relative to the scanned root", async () => {
    const manifest = await buildManifest(dir, { probe: fakeProbe });
    const gif = manifest.files.find((f) => f.name === "ok.gif");
    expect(gif.path).toBe(path.join("sub", "ok.gif"));
  });
});
