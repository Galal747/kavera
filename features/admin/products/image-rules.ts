// نوع الملف → الامتداد. الامتداد بيتحدد من النوع، مش من اسم الملف اللي المستخدم كتبه.
export const ALLOWED_IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type AllowedImageType = keyof typeof ALLOWED_IMAGE_TYPES;

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_IMAGES_PER_PRODUCT = 8;

export function validateImageFile(file: File): string | null {
  if (!(file.type in ALLOWED_IMAGE_TYPES)) {
    return `${file.name}: only JPG, PNG or WebP images are allowed.`;
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return `${file.name}: the image is larger than 5 MB.`;
  }
  return null;
}