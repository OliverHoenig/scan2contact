import sharp from 'sharp';
import { env } from '$env/dynamic/private';

const DEFAULT_MIN_BLUR_VARIANCE = 0;

export async function preprocessForOcr(imageBuffer: Buffer): Promise<Buffer> {
	const configuredThreshold = Number(env.OCR_MIN_BLUR_VARIANCE ?? DEFAULT_MIN_BLUR_VARIANCE);
	const minBlurVariance = Number.isFinite(configuredThreshold) ? Math.max(0, configuredThreshold) : 0;
	const normalized = sharp(imageBuffer).rotate().grayscale().normalize();
	const { data, info } = await normalized
		.clone()
		.resize({ width: 1800, withoutEnlargement: true })
		.raw()
		.toBuffer({ resolveWithObject: true });
	const blurVariance = estimateLaplacianVariance(data, info.width, info.height, info.channels);
	if (minBlurVariance > 0 && blurVariance < minBlurVariance) {
		throw new Error('Image appears blurry. Please capture a sharper photo.');
	}

	return normalized
		.resize({ width: 1800, withoutEnlargement: true })
		.sharpen(1.2, 1, 2)
		.modulate({ brightness: 1.03 })
		.linear(1.15, -8)
		.threshold(150)
		.png()
		.toBuffer();
}

function estimateLaplacianVariance(
	data: Buffer,
	width: number,
	height: number,
	channels: number
): number {
	if (width < 3 || height < 3) {
		return 0;
	}

	let sum = 0;
	let sumSquared = 0;
	let count = 0;

	for (let y = 1; y < height - 1; y += 2) {
		for (let x = 1; x < width - 1; x += 2) {
			const center = getGrayAt(data, width, channels, x, y);
			const left = getGrayAt(data, width, channels, x - 1, y);
			const right = getGrayAt(data, width, channels, x + 1, y);
			const top = getGrayAt(data, width, channels, x, y - 1);
			const bottom = getGrayAt(data, width, channels, x, y + 1);
			const laplacian = 4 * center - left - right - top - bottom;
			sum += laplacian;
			sumSquared += laplacian * laplacian;
			count += 1;
		}
	}

	if (count === 0) {
		return 0;
	}
	const mean = sum / count;
	return sumSquared / count - mean * mean;
}

function getGrayAt(data: Buffer, width: number, channels: number, x: number, y: number): number {
	const offset = (y * width + x) * channels;
	return data[offset];
}
