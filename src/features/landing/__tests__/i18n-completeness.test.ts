import { describe, it, expect } from "vitest";
import { LANDING_STRINGS } from "../i18n";

/**
 * Guards against half-translated releases:
 *
 * 1. Shape completeness — `en` must mirror `es` exactly (same keys, same
 *    array lengths, same value types). A key added only to `es` fails here
 *    even though TypeScript would already flag most cases.
 * 2. Spanish-marker denylist — no `en` string may contain a small set of
 *    obviously-Spanish markers. This is a pragmatic heuristic, NOT a full
 *    language detector: it only catches the words that have already leaked
 *    to production once (workout/nutrition vocabulary). Extend the list when
 *    a new class of leak is found.
 */

type Tree = Record<string, unknown>;

function collectPaths(node: unknown, prefix: string, out: Map<string, string>): void {
  if (typeof node === "string") {
    out.set(prefix, "string");
    return;
  }
  if (Array.isArray(node)) {
    out.set(prefix, `array:${node.length}`);
    node.forEach((item, i) => collectPaths(item, `${prefix}[${i}]`, out));
    return;
  }
  if (node !== null && typeof node === "object") {
    out.set(prefix, "object");
    for (const key of Object.keys(node as Tree)) {
      collectPaths((node as Tree)[key], prefix ? `${prefix}.${key}` : key, out);
    }
    return;
  }
  out.set(prefix, typeof node);
}

function collectStrings(node: unknown, prefix: string, out: Array<[string, string]>): void {
  if (typeof node === "string") {
    out.push([prefix, node]);
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((item, i) => collectStrings(item, `${prefix}[${i}]`, out));
    return;
  }
  if (node !== null && typeof node === "object") {
    for (const key of Object.keys(node as Tree)) {
      collectStrings((node as Tree)[key], prefix ? `${prefix}.${key}` : key, out);
    }
  }
}

// Case-insensitive markers of Spanish copy that must never appear in `en`.
const SPANISH_MARKERS = ["ejercicio", "semana", "dias de", "descanso"];

// Keys where identical es/en values are expected (brand names, shared labels).
// Everything else is only reported, not failed, when identical — see below.

describe("LANDING_STRINGS i18n completeness", () => {
  it("en mirrors the shape of es (same keys, array lengths and types)", () => {
    const esPaths = new Map<string, string>();
    const enPaths = new Map<string, string>();
    collectPaths(LANDING_STRINGS.es, "", esPaths);
    collectPaths(LANDING_STRINGS.en, "", enPaths);

    const missingInEn = [...esPaths.keys()].filter((p) => !enPaths.has(p));
    const extraInEn = [...enPaths.keys()].filter((p) => !esPaths.has(p));
    expect(missingInEn, `paths missing in en: ${missingInEn.join(", ")}`).toEqual([]);
    expect(extraInEn, `paths only in en: ${extraInEn.join(", ")}`).toEqual([]);

    for (const [path, kind] of esPaths) {
      expect(enPaths.get(path), `type/shape mismatch at "${path}"`).toBe(kind);
    }
  });

  it("no en value is empty", () => {
    const enStrings: Array<[string, string]> = [];
    collectStrings(LANDING_STRINGS.en, "", enStrings);
    const empty = enStrings.filter(([, v]) => v.trim() === "");
    // features.titlePost is intentionally empty in en (sentence order differs).
    const allowedEmpty = new Set(["features.titlePost"]);
    const unexpected = empty.filter(([p]) => !allowedEmpty.has(p));
    expect(unexpected, `empty en values: ${unexpected.map(([p]) => p).join(", ")}`).toEqual([]);
  });

  it("no en value contains obviously-Spanish markers", () => {
    const enStrings: Array<[string, string]> = [];
    collectStrings(LANDING_STRINGS.en, "", enStrings);

    const offenders = enStrings.filter(([, value]) => {
      const lower = value.toLowerCase();
      return SPANISH_MARKERS.some((marker) => lower.includes(marker));
    });

    expect(
      offenders,
      `en strings containing Spanish markers: ${offenders
        .map(([p, v]) => `${p}="${v}"`)
        .join("; ")}`
    ).toEqual([]);
  });
});
