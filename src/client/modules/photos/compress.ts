const MAX_DIMENSION = 1600;
const QUALITY = 0.8;
const WEBP = "image/webp";
const JPEG = "image/jpeg";

export interface CompressedPhoto {
  blob: Blob;
  contentType: typeof WEBP | typeof JPEG;
}

/** Downscales a photo to at most 1600px and re-encodes it as WebP (JPEG where unsupported). */
export const compressPhoto = async (file: File): Promise<CompressedPhoto> => {
  const bitmap = await createImageBitmap(file);

  const scale = Math.min(
    1,
    MAX_DIMENSION / Math.max(bitmap.width, bitmap.height)
  );

  const canvas = new OffscreenCanvas(
    Math.round(bitmap.width * scale),
    Math.round(bitmap.height * scale)
  );

  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const webp = await canvas.convertToBlob({ quality: QUALITY, type: WEBP });

  if (webp.type === WEBP) {
    return { blob: webp, contentType: WEBP };
  }

  const jpeg = await canvas.convertToBlob({ quality: QUALITY, type: JPEG });

  return { blob: jpeg, contentType: JPEG };
};
