import { z } from 'zod';

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const uploadSchema = z.object({
	image: z.instanceof(File)
});

export function validateImageUpload(image: File, maxSizeBytes: number): string | null {
	if (image.size > maxSizeBytes) {
		return `Image too large. Max ${Math.floor(maxSizeBytes / 1_000_000)}MB.`;
	}
	if (!ALLOWED_IMAGE_TYPES.includes(image.type)) {
		return 'Only JPG, PNG, and WEBP images are supported.';
	}
	return null;
}
