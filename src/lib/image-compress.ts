/**
 * Browser-side image optimisation for admin uploads.
 *
 * Phone and camera photos are often 3–15 MB and 4000+ px wide. Before they are
 * uploaded we downscale them (longest side ≤ MAX_SIDE) and re-encode as WebP
 * (JPEG fallback), which typically gives 100–300 KB with no visible loss on the
 * storefront. This keeps uploads fast on mobile data, stays well under the
 * server's request-size limit, and saves Supabase storage.
 *
 * Client-only: uses canvas / createImageBitmap.
 */

export const MAX_SIDE = 1600;
export const QUALITY = 0.85;
/** Originals bigger than this are refused before we even try to decode them. */
export const MAX_ORIGINAL_BYTES = 30 * 1024 * 1024;

export interface CompressedImage {
  blob: Blob;
  type: "image/webp" | "image/jpeg" | "image/png";
  width: number;
  height: number;
  originalBytes: number;
}

async function decode(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; close?: () => void }> {
  // Prefer createImageBitmap: fast and honours EXIF rotation from phones.
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() };
    } catch {
      /* fall through to <img> decoding */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return { source: img, width: img.naturalWidth, height: img.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Resize + re-encode an image file. Throws a user-friendly Error if the file
 * can't be read (e.g. HEIC on a desktop browser).
 */
export async function compressImage(file: File): Promise<CompressedImage> {
  if (file.size > MAX_ORIGINAL_BYTES) {
    throw new Error("This photo is too large (over 30 MB). Please choose a smaller one.");
  }

  let decoded;
  try {
    decoded = await decode(file);
  } catch {
    throw new Error("This photo format isn't supported here. Please use a JPG, PNG or WebP image.");
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(decoded.width, decoded.height));
  const width = Math.max(1, Math.round(decoded.width * scale));
  const height = Math.max(1, Math.round(decoded.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process this image in your browser.");
  // White background so transparent PNGs don't turn black if we fall back to JPEG.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(decoded.source, 0, 0, width, height);
  decoded.close?.();

  let blob = await toBlob(canvas, "image/webp", QUALITY);
  let type: CompressedImage["type"] = "image/webp";
  if (!blob || blob.type !== "image/webp") {
    // Older Safari can't encode WebP — use JPEG instead.
    blob = await toBlob(canvas, "image/jpeg", QUALITY);
    type = "image/jpeg";
  }
  if (!blob) throw new Error("Could not process this image in your browser.");

  // Already small and web-friendly? Keep the original if it's smaller.
  const webFriendly = ["image/jpeg", "image/png", "image/webp"].includes(file.type);
  if (webFriendly && scale === 1 && file.size <= blob.size) {
    return {
      blob: file,
      type: file.type as CompressedImage["type"],
      width,
      height,
      originalBytes: file.size,
    };
  }

  return { blob, type, width, height, originalBytes: file.size };
}

export function formatBytes(n: number): string {
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(n / 1024))} KB`;
}
