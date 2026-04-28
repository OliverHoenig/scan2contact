import { env } from '$env/dynamic/private';
import { TesseractOcrProvider } from './provider-tesseract';
import type { OcrProvider } from './provider';

export function getOcrProvider(): OcrProvider {
	const provider = (env.OCR_PROVIDER || 'tesseract').toLowerCase();
	if (provider === 'tesseract') {
		return new TesseractOcrProvider();
	}

	throw new Error(`Unsupported OCR provider: ${provider}`);
}
