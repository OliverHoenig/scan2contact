import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getOcrProvider } from '$lib/server/ocr';
import { contactSchema } from '$lib/contact';
import type { RequestHandler } from './$types';
import { uploadSchema, validateImageUpload } from '$lib/server/scan/validation';
import { convertImageToOcrInput } from '$lib/server/scan/convert-image';
import OpenAI from "openai";

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
		const converted = await convertImageToOcrInput(imageBuffer, image.type, image.name);
		/*
		const ocr = getOcrProvider();
		const ocrResult = await ocr.extractText(converted.buffer, converted.mimeType);
		const parsedContact = contactSchema.parse({ notes: ocrResult.text });*/

		const client = new OpenAI({
			baseURL: "https://api.scaleway.ai/279b4503-9e22-427a-826e-a221dc1a4539/v1",
			apiKey: env.SCALEWAY_AI_API_KEY // Replace SCW_SECRET_KEY with your IAM API key,
		});

		const response = await client.chat.completions.create({
			model: "mistral-small-3.2-24b-instruct-2506",
			messages: [
				{
					role: 'system',
					content: `You are a reliable business card scanner. You will be given a business card image and you will need to extract the text from the image. And output it in the specified json schema.
					The json schema is as follows:
					{
						firstName: <the first name of the person>,
						lastName: <the last name of the person>,
						company: <the company>,
						role: <the role of the person>,
						title: <the title of the person>,
						emails: <the emails>,
						phones: <the phone numbers>,
						website: <the website>,
						address: <the address>,
						notes: <other interesting information about the person or the company on the business card that is not in the other fields>
					}
					Output the json schema only, no other text or markdown or anything else.
					`
				},
				{
					role: "user",
					content: [
						{ type: "text", text: "Extract the text from the buisness card image. And output it in the specified json schema." },
						{ type: "image_url", image_url: { url: `data:${converted.mimeType};base64,${converted.buffer.toString('base64')}` } },
					]
				}
			],
			temperature: 0.7,
			max_tokens: 2048,
			top_p: 0.9
		});

		console.log(response.choices[0].message.content);
		const parsedContact = contactSchema.parse({ notes: response.choices[0].message.content });




		return json(parsedContact);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unexpected OCR error';
		const status = message.includes('Unsupported OCR provider') ? 500 : 502;
		const qualityHint = message.toLowerCase().includes('blurry')
			? 'Try again with steadier hands and better focus.'
			: message.toLowerCase().includes('confidence too low')
				? 'Retake the photo in brighter light and keep the card flat.'
				: 'Check OCR_PROVIDER=tesseract, OCR_TESSERACT_LANG, OCR_TESSERACT_PSM, and server resources (RAM/CPU).';
		return json(
			{
				error: `OCR failed: ${message}`,
				hint: qualityHint
			},
			{ status }
		);
	}
}
