import { env } from '$env/dynamic/private';
import { createWorker, type Worker } from 'tesseract.js';
import type { OcrProvider, OcrResult } from './provider';



export class TesseractOcrProvider implements OcrProvider {

	async extractText(imageBuffer: Buffer): Promise<OcrResult> {
		try {
			const worker = await createWorker('deu');
			const result = await worker.recognize(imageBuffer);
			await worker.terminate();
			return {
				text: result.data.text.trim(),
				raw: result.data,
				provider: 'tesseract'
			};
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown tesseract error';
			throw new Error(`Tesseract OCR failed: ${message}`);
		}
	}
}
