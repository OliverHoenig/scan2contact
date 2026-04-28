import convert from 'heic-convert';

const HEIC_MIME_TYPES = ['image/heic', 'image/heif'];
const HEIC_EXTENSIONS = ['.heic', '.heif'];

type ConversionResult = {
	buffer: Buffer;
	mimeType: string;
};

export async function convertImageToOcrInput(
	buffer: Buffer,
	mimeType: string,
	filename: string
): Promise<ConversionResult> {
	if (!isHeicInput(mimeType, filename)) {
		return { buffer, mimeType };
	}

	const converted = await convert({
		buffer: new Uint8Array(buffer),
		format: 'JPEG',
		quality: 0.9
	});
	return {
		buffer: Buffer.from(converted),
		mimeType: 'image/jpeg'
	};
}

function isHeicInput(mimeType: string, filename: string): boolean {
	if (HEIC_MIME_TYPES.includes(mimeType)) return true;
	const nameLower = filename.toLowerCase();
	return HEIC_EXTENSIONS.some((extension) => nameLower.endsWith(extension));
}
