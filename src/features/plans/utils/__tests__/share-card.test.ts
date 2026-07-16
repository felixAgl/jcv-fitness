import { describe, it, expect, vi } from "vitest";
import {
  SHARE_CARD_WIDTH,
  SHARE_CARD_HEIGHT,
  computeShareCardLayout,
  coverCrop,
  referralCodeFrom,
  drawShareCard,
} from "../share-card";

describe("referralCodeFrom", () => {
  it("is the first 8 chars of the userId (dashes stripped), uppercased", () => {
    expect(referralCodeFrom("a1b2c3d4-e5f6-7890-abcd-ef0123456789")).toBe("A1B2C3D4");
    expect(referralCodeFrom("abc")).toBe("ABC");
  });
});

describe("computeShareCardLayout", () => {
  it("targets a 1080x1920 story card", () => {
    const layout = computeShareCardLayout();
    expect(layout.width).toBe(SHARE_CARD_WIDTH);
    expect(layout.height).toBe(SHARE_CARD_HEIGHT);
  });

  it("places both photos side by side inside the canvas without overlap", () => {
    const { photoLeft, photoRight, width, height } = computeShareCardLayout();
    expect(photoLeft.width).toBe(photoRight.width);
    expect(photoLeft.y).toBe(photoRight.y);
    expect(photoLeft.x + photoLeft.width).toBeLessThan(photoRight.x);
    expect(photoRight.x + photoRight.width).toBeLessThanOrEqual(width);
    expect(photoLeft.y + photoLeft.height).toBeLessThan(height);
  });
});

describe("coverCrop", () => {
  const target = { x: 0, y: 0, width: 100, height: 150 };

  it("crops the sides of a wide image", () => {
    const crop = coverCrop(300, 150, target);
    expect(crop.height).toBe(150);
    expect(crop.width).toBeCloseTo(100);
    expect(crop.x).toBeCloseTo(100);
    expect(crop.y).toBe(0);
  });

  it("crops top/bottom of a tall image", () => {
    const crop = coverCrop(100, 400, target);
    expect(crop.width).toBe(100);
    expect(crop.height).toBeCloseTo(150);
    expect(crop.y).toBeCloseTo(125);
  });
});

/** Minimal recording stub for the 2D context (jsdom has no real canvas). */
function mockContext() {
  const gradient = { addColorStop: vi.fn() };
  return {
    createLinearGradient: vi.fn(() => gradient),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    drawImage: vi.fn(),
    strokeRect: vi.fn(),
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    font: "",
    textAlign: "left",
  } as unknown as CanvasRenderingContext2D;
}

describe("drawShareCard (smoke, mocked 2D context)", () => {
  const fakeImage = { width: 600, height: 900 } as unknown as CanvasImageSource & {
    width: number;
    height: number;
  };

  it("paints background, two photos, branding, labels and referral code", () => {
    const ctx = mockContext();
    drawShareCard(
      ctx,
      { day1: fakeImage, latest: fakeImage },
      {
        day1Url: "blob:a",
        latestUrl: "blob:b",
        latestLabel: "DIA 40",
        title: "40 DIAS",
        userId: "a1b2c3d4-e5f6",
      }
    );

    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT);
    expect(ctx.drawImage).toHaveBeenCalledTimes(2);
    expect(ctx.strokeRect).toHaveBeenCalledTimes(2);

    const texts = (ctx.fillText as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0]);
    expect(texts).toContain("JCV FITNESS");
    expect(texts).toContain("40 DIAS");
    expect(texts).toContain("DIA 1");
    expect(texts).toContain("DIA 40");
    expect(texts).toContain("CODIGO: A1B2C3D4");
    expect(texts).toContain("jcv24fitness.com");
  });
});
