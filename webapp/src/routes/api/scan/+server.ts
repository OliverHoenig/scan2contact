import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getOcrProvider } from '$lib/server/ocr';
import { contactSchema } from '$lib/contact';
import type { RequestHandler } from './$types';
import { uploadSchema, validateImageUpload } from '$lib/server/scan/validation';

export const POST: RequestHandler = async ({ request }) => {
	const formData = await request.formData();
	const parsed = uploadSchema.safeParse({ image: formData.get('image') });
	if (!parsed.success) {
		return json({ error: 'Please upload an image file.' }, { status: 400 });
	}

	const image = parsed.data.image;
	const maxSize = Number(env.OCR_MAX_FILE_SIZE_BYTES || 6_000_000);
	const validationError = validateImageUpload(image, maxSize);
	if (validationError) {
		return json(
			{ error: validationError },
			{ status: validationError.includes('too large') ? 413 : 415 }
		);
	}

	const imageBuffer = Buffer.from(await image.arrayBuffer());
	try {
		const ocr = getOcrProvider();
		const ocrResult = await ocr.extractText(imageBuffer, image.type);
		console.log('========== ocrResult ==========');
		console.log(ocrResult);
		const parsedContact = contactSchema.parse({ notes: ocrResult.text });

		console.log('========== parsedContact ==========');
		console.log(parsedContact);

		return json(parsedContact);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unexpected OCR error';
		const status = message.includes('Unsupported OCR provider') ? 500 : 502;
		return json(
			{
				error: `OCR failed: ${message}`,
				hint: 'Check OCR_PROVIDER=tesseract, OCR_TESSERACT_LANG, and server resources (RAM/CPU).'
			},
			{ status }
		);
	}
}
