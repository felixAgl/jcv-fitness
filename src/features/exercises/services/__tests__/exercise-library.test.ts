import { describe, it, expect, vi, afterEach } from "vitest";
import {
  loadExerciseLibrary,
  resetExerciseLibraryCache,
  searchExercises,
  filterExercises,
  getLibraryExercise,
  getMediaUrls,
  extractDatasetId,
} from "../exercise-library";
import type { LibraryExercise } from "../../types";

function makeExercise(
  overrides: Partial<LibraryExercise> = {}
): LibraryExercise {
  return {
    id: "0001",
    name: "3/4 sit-up",
    category: "waist",
    body_part: "waist",
    equipment: "body weight",
    target: "abs",
    secondary_muscles: ["hip flexors", "lower back"],
    instructions: {
      es: "Túmbate sobre tu espalda con las rodillas flexionadas.",
      en: "Lie flat on your back with your knees bent.",
    },
    instruction_steps: {
      es: ["Túmbate sobre tu espalda.", "Coloca las manos detrás de la cabeza."],
      en: ["Lie flat on your back.", "Place your hands behind your head."],
    },
    image: "images/0001-2gPfomN.jpg",
    gif: "videos/0001-2gPfomN.gif",
    ...overrides,
  };
}

const fixture: LibraryExercise[] = [
  makeExercise(),
  makeExercise({
    id: "0025",
    name: "barbell bench press",
    category: "chest",
    body_part: "chest",
    equipment: "barbell",
    target: "pectorals",
    image: "images/0025-abc.jpg",
    gif: "videos/0025-abc.gif",
  }),
  makeExercise({
    id: "0030",
    name: "dumbbell shoulder press",
    category: "shoulders",
    body_part: "shoulders",
    equipment: "dumbbell",
    target: "delts",
  }),
  makeExercise({
    id: "0041",
    name: "cable triceps extensión",
    category: "upper arms",
    body_part: "upper arms",
    equipment: "cable",
    target: "triceps",
  }),
];

describe("searchExercises", () => {
  it("matches by case-insensitive name substring", () => {
    const result = searchExercises(fixture, "PRESS");
    expect(result.map((e) => e.id)).toEqual(["0025", "0030"]);
  });

  it("is accent-insensitive: plain query matches accented name", () => {
    const result = searchExercises(fixture, "extension");
    expect(result.map((e) => e.id)).toEqual(["0041"]);
  });

  it("is accent-insensitive: accented query matches plain name", () => {
    const result = searchExercises(fixture, "prés");
    expect(result.map((e) => e.id)).toEqual(["0025", "0030"]);
  });

  it("returns the full list for an empty or whitespace query", () => {
    expect(searchExercises(fixture, "")).toEqual(fixture);
    expect(searchExercises(fixture, "   ")).toEqual(fixture);
  });

  it("returns an empty array when nothing matches", () => {
    expect(searchExercises(fixture, "zzz-no-match")).toEqual([]);
  });
});

describe("filterExercises", () => {
  it("filters by category", () => {
    const result = filterExercises(fixture, { category: "chest" });
    expect(result.map((e) => e.id)).toEqual(["0025"]);
  });

  it("filters by equipment", () => {
    const result = filterExercises(fixture, { equipment: "body weight" });
    expect(result.map((e) => e.id)).toEqual(["0001"]);
  });

  it("filters by target", () => {
    const result = filterExercises(fixture, { target: "delts" });
    expect(result.map((e) => e.id)).toEqual(["0030"]);
  });

  it("combines multiple filters with AND semantics", () => {
    expect(
      filterExercises(fixture, { category: "chest", equipment: "barbell" })
    ).toHaveLength(1);
    expect(
      filterExercises(fixture, { category: "chest", equipment: "dumbbell" })
    ).toHaveLength(0);
  });

  it("returns the full list when no filters are provided", () => {
    expect(filterExercises(fixture, {})).toEqual(fixture);
  });
});

describe("getLibraryExercise", () => {
  it("finds an exercise by id", () => {
    expect(getLibraryExercise(fixture, "0030")?.name).toBe(
      "dumbbell shoulder press"
    );
  });

  it("returns undefined for an unknown id", () => {
    expect(getLibraryExercise(fixture, "9999")).toBeUndefined();
  });
});

describe("getMediaUrls", () => {
  it("prepends the dataset base URL to image and gif paths", () => {
    expect(getMediaUrls(fixture[1])).toEqual({
      image: "https://media.jcv24fitness.com/images/0025-abc.jpg",
      gif: "https://media.jcv24fitness.com/videos/0025-abc.gif",
    });
  });
});

describe("extractDatasetId", () => {
  it("extracts the id prefix from a full media URL", () => {
    expect(
      extractDatasetId(
        "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/images/0043-qXTaZnJ.jpg"
      )
    ).toBe("0043");
  });

  it("extracts the id prefix from a relative path", () => {
    expect(extractDatasetId("videos/0001-2gPfomN.gif")).toBe("0001");
  });

  it("returns undefined when the filename has no id prefix", () => {
    expect(extractDatasetId("images/logo.png")).toBeUndefined();
    expect(extractDatasetId("")).toBeUndefined();
  });
});

describe("loadExerciseLibrary", () => {
  afterEach(() => {
    resetExerciseLibraryCache();
    vi.unstubAllGlobals();
  });

  it("fetches the library once and caches the result", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(fixture),
    });
    vi.stubGlobal("fetch", fetchMock);

    const [a, b] = await Promise.all([
      loadExerciseLibrary(),
      loadExerciseLibrary(),
    ]);
    await loadExerciseLibrary();

    expect(a).toEqual(fixture);
    expect(b).toBe(a);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/data/exercise-library.json");
  });

  it("throws on a non-ok response and allows a retry", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 404, statusText: "Not Found" })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(fixture) });
    vi.stubGlobal("fetch", fetchMock);

    await expect(loadExerciseLibrary()).rejects.toThrow("404");
    await expect(loadExerciseLibrary()).resolves.toEqual(fixture);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
