/**
 * Share card (idea #11): a 1080x1920 canvas-composed branded story card with
 * the day-1 and latest progress photos side by side. Layout and referral-code
 * logic are pure (unit-tested); only generateShareCard/shareOrDownload touch
 * the DOM. Sharing is client-side only, on explicit user action.
 */

export const SHARE_CARD_WIDTH = 1080;
export const SHARE_CARD_HEIGHT = 1920;

/** Brand palette (matches the app's dark graphite + cyan design system). */
export const SHARE_CARD_COLORS = {
  background: "#0d1117",
  backgroundAccent: "#161b22",
  cyan: "#22d3ee",
  white: "#ffffff",
  gray: "#8b949e",
} as const;

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ShareCardLayout {
  width: number;
  height: number;
  /** "JCV FITNESS" wordmark baseline position + size. */
  logo: { x: number; y: number; size: number };
  /** "40 DIAS" hero text. */
  title: { x: number; y: number; size: number };
  photoLeft: Rect;
  photoRight: Rect;
  labelLeft: { x: number; y: number };
  labelRight: { x: number; y: number };
  /** Referral code footer. */
  code: { x: number; y: number; size: number };
  footer: { x: number; y: number; size: number };
}

/** Referral code: first 8 chars of the user id, uppercased. */
export function referralCodeFrom(userId: string): string {
  return userId.replace(/-/g, "").slice(0, 8).toUpperCase();
}

/**
 * Pure layout for the 1080x1920 card: two photos side by side in the middle
 * band, wordmark on top, "40 DIAS" hero above the photos, referral footer.
 */
export function computeShareCardLayout(
  width = SHARE_CARD_WIDTH,
  height = SHARE_CARD_HEIGHT
): ShareCardLayout {
  const margin = Math.round(width * 0.06); // 64 at 1080
  const gap = Math.round(width * 0.03); // 32 at 1080
  const photoWidth = Math.round((width - margin * 2 - gap) / 2);
  const photoHeight = Math.round(photoWidth * 1.5); // 3:2 portrait crop
  const photoY = Math.round(height * 0.28);
  const centerX = width / 2;

  return {
    width,
    height,
    logo: { x: centerX, y: Math.round(height * 0.09), size: Math.round(width * 0.075) },
    title: { x: centerX, y: Math.round(height * 0.2), size: Math.round(width * 0.16) },
    photoLeft: { x: margin, y: photoY, width: photoWidth, height: photoHeight },
    photoRight: { x: margin + photoWidth + gap, y: photoY, width: photoWidth, height: photoHeight },
    labelLeft: { x: margin + photoWidth / 2, y: photoY + photoHeight + Math.round(height * 0.035) },
    labelRight: {
      x: margin + photoWidth + gap + photoWidth / 2,
      y: photoY + photoHeight + Math.round(height * 0.035),
    },
    code: { x: centerX, y: Math.round(height * 0.88), size: Math.round(width * 0.055) },
    footer: { x: centerX, y: Math.round(height * 0.93), size: Math.round(width * 0.026) },
  };
}

/**
 * Source rect for drawImage that center-crops `img` to cover `target`
 * (object-fit: cover). Pure, so the crop math is testable without a canvas.
 */
export function coverCrop(
  imgWidth: number,
  imgHeight: number,
  target: Rect
): Rect {
  const targetRatio = target.width / target.height;
  const imgRatio = imgWidth / imgHeight;
  if (imgRatio > targetRatio) {
    // Image wider than the slot: crop the sides.
    const cropWidth = imgHeight * targetRatio;
    return { x: (imgWidth - cropWidth) / 2, y: 0, width: cropWidth, height: imgHeight };
  }
  // Image taller than the slot: crop top/bottom.
  const cropHeight = imgWidth / targetRatio;
  return { x: 0, y: (imgHeight - cropHeight) / 2, width: imgWidth, height: cropHeight };
}

export interface ShareCardOptions {
  day1Url: string;
  latestUrl: string;
  latestLabel: string;
  userId: string;
  /** Hero text, e.g. "40 DIAS". */
  title?: string;
}

/** Minimal drawable image contract so tests can stub without <img>. */
export interface DrawableImage {
  width: number;
  height: number;
}

type Canvas2D = CanvasRenderingContext2D;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Signed Supabase Storage URLs are cross-origin; needed for canvas export.
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar la imagen: ${url}`));
    img.src = url;
  });
}

/**
 * Draw the full card onto a 2D context. Images are passed in already loaded
 * (as CanvasImageSource) so this stays synchronous and easy to smoke-test.
 */
export function drawShareCard(
  ctx: Canvas2D,
  images: { day1: CanvasImageSource & DrawableImage; latest: CanvasImageSource & DrawableImage },
  options: ShareCardOptions,
  layout: ShareCardLayout = computeShareCardLayout()
): void {
  const { background, backgroundAccent, cyan, white, gray } = SHARE_CARD_COLORS;

  // Dark graphite background with a subtle vertical accent gradient.
  const gradient = ctx.createLinearGradient(0, 0, 0, layout.height);
  gradient.addColorStop(0, backgroundAccent);
  gradient.addColorStop(0.5, background);
  gradient.addColorStop(1, backgroundAccent);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, layout.width, layout.height);

  ctx.textAlign = "center";

  // JCV wordmark (Bebas with system fallback; the font may not be loaded in
  // the canvas context — the layout works either way).
  ctx.fillStyle = white;
  ctx.font = `${layout.logo.size}px "Bebas Neue", "Arial Narrow", sans-serif`;
  ctx.fillText("JCV FITNESS", layout.logo.x, layout.logo.y);

  // Hero title in cyan.
  ctx.fillStyle = cyan;
  ctx.font = `${layout.title.size}px "Bebas Neue", "Arial Narrow", sans-serif`;
  ctx.fillText(options.title ?? "40 DIAS", layout.title.x, layout.title.y);

  // Photos, center-cropped to cover their slots, with cyan borders.
  const slots: Array<[CanvasImageSource & DrawableImage, Rect]> = [
    [images.day1, layout.photoLeft],
    [images.latest, layout.photoRight],
  ];
  for (const [img, slot] of slots) {
    const crop = coverCrop(img.width, img.height, slot);
    ctx.drawImage(
      img,
      crop.x, crop.y, crop.width, crop.height,
      slot.x, slot.y, slot.width, slot.height
    );
    ctx.strokeStyle = cyan;
    ctx.lineWidth = 6;
    ctx.strokeRect(slot.x, slot.y, slot.width, slot.height);
  }

  // Labels under the photos.
  const labelSize = Math.round(layout.width * 0.045);
  ctx.fillStyle = white;
  ctx.font = `${labelSize}px "Bebas Neue", "Arial Narrow", sans-serif`;
  ctx.fillText("DIA 1", layout.labelLeft.x, layout.labelLeft.y);
  ctx.fillText(options.latestLabel, layout.labelRight.x, layout.labelRight.y);

  // Referral code + footer.
  ctx.fillStyle = cyan;
  ctx.font = `${layout.code.size}px "Bebas Neue", "Arial Narrow", sans-serif`;
  ctx.fillText(`CODIGO: ${referralCodeFrom(options.userId)}`, layout.code.x, layout.code.y);

  ctx.fillStyle = gray;
  ctx.font = `${layout.footer.size}px sans-serif`;
  ctx.fillText("jcv24fitness.com", layout.footer.x, layout.footer.y);
}

/** Compose the card and return it as a JPEG blob (browser only). */
export async function generateShareCard(options: ShareCardOptions): Promise<Blob> {
  const [day1, latest] = await Promise.all([
    loadImage(options.day1Url),
    loadImage(options.latestUrl),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = SHARE_CARD_WIDTH;
  canvas.height = SHARE_CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D no disponible");

  drawShareCard(ctx, { day1, latest }, options);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob fallo"))),
      "image/jpeg",
      0.9
    );
  });
}

/**
 * navigator.share with the image file when supported; otherwise download the
 * JPEG. Returns which path was taken ("shared" | "downloaded").
 */
export async function shareOrDownload(
  blob: Blob,
  filename = "mi-transformacion-jcv.jpg"
): Promise<"shared" | "downloaded"> {
  const file = new File([blob], filename, { type: "image/jpeg" });
  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
  };
  if (typeof nav.share === "function" && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: "Mi transformacion - JCV Fitness" });
      return "shared";
    } catch {
      // User cancelled or share failed: fall through to download.
    }
  }
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return "downloaded";
}
