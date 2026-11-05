export const PORTFOLIO_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

// Vercel functions accept bodies below 4.5 MB. Optimize large originals in the
// browser before sending them, while enforcing the 5 MB selection limit first.
export async function preparePortfolioImage(file: File): Promise<Blob> {
  if (file.size > PORTFOLIO_IMAGE_MAX_BYTES) throw new Error("image_too_large");
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("invalid_image");
  if (file.size <= 4 * 1024 * 1024) return file;
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 2048 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("invalid_image");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.85),
    );
    if (!blob || blob.size > 4 * 1024 * 1024) throw new Error("invalid_image");
    return blob;
  } finally {
    bitmap.close();
  }
}
