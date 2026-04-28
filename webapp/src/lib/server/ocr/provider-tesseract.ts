import { env } from '$env/dynamic/private';
import { preprocessForOcr } from '$lib/server/ocr/preprocess';
import { PSM, createWorker, type Worker } from 'tesseract.js';
import type { OcrProvider, OcrResult } from './provider';

let workerPromise: Promise<Worker> | null = null;

async function getWorker(language: string): Promise<Worker> {
	if (!workerPromise) {
		workerPromise = createWorker(language);
	}
	return workerPromise;
}

export class TesseractOcrProvider implements OcrProvider {
	async extractText(imageBuffer: Buffer): Promise<OcrResult> {
		try {
			const language = 'deu+eng';
			const psmInput = '6';
			const psm = toPsm(psmInput);
			const preprocessed = await preprocessForOcr(imageBuffer);
			const worker = await getWorker(language);
			await worker.setParameters({
				tessedit_pageseg_mode: psm,
				tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz@.-+ /',
				preserve_interword_spaces: '1'
			});
			const result = await worker.recognize(preprocessed);
			if (result.data.confidence < 35) {
				throw new Error('OCR confidence too low. Please retake the photo with better lighting.');
			}
			return {
				text: result.data.text.trim(),
				raw: {
					...result.data,
					meta: {
						language,
						psm: psmInput,
						confidence: result.data.confidence
					}
				},
				provider: 'tesseract'
			};
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown tesseract error';
			throw new Error(`Tesseract OCR failed: ${message}`);
		}
	}
}

function toPsm(value: string): PSM {
	switch (value) {
		case '0':
			return PSM.OSD_ONLY;
		case '1':
			return PSM.AUTO_OSD;
		case '2':
			return PSM.AUTO_ONLY;
		case '3':
			return PSM.AUTO;
		case '4':
			return PSM.SINGLE_COLUMN;
		case '5':
			return PSM.SINGLE_BLOCK_VERT_TEXT;
		case '6':
			return PSM.SINGLE_BLOCK;
		case '7':
			return PSM.SINGLE_LINE;
		case '8':
			return PSM.SINGLE_WORD;
		case '9':
			return PSM.CIRCLE_WORD;
		case '10':
			return PSM.SINGLE_CHAR;
		case '11':
			return PSM.SPARSE_TEXT;
		case '12':
			return PSM.SPARSE_TEXT_OSD;
		case '13':
			return PSM.RAW_LINE;
		default:
			return PSM.SINGLE_BLOCK;
	}
}
