import { z } from 'zod';

export const ALLOWED_IMAGE_TYPES = [
	'image/jpeg',
	'image/png',
	'image/webp',
	'image/heic',
	'image/heif'
];
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'];

export const uploadSchema = z.object({
	image: z.instanceof(File)
});

export function validateImageUpload(image: File, maxSizeBytes: number): string | null {
	if (image.size > maxSizeBytes) {
		return `Image too large. Max ${Math.floor(maxSizeBytes / 1_000_000)}MB.`;
	}
	const nameLower = image.name.toLowerCase();
	const hasAllowedExtension = ALLOWED_IMAGE_EXTENSIONS.some((extension) =>
		nameLower.endsWith(extension)
	);
	const hasAllowedMimeType = ALLOWED_IMAGE_TYPES.includes(image.type);
	// Some mobile browsers provide HEIC files as application/octet-stream.
	if (!hasAllowedMimeType && !hasAllowedExtension) {
		return 'Only JPG, PNG, WEBP, and HEIC/HEIF images are supported.';
	}
	return null;
}
