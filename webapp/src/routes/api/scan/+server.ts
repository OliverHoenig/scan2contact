import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { contactSchema } from '$lib/contact';
import type { RequestHandler } from './$types';
import { uploadSchema, validateImageUpload } from '$lib/server/scan/validation';
import { convertImageToOcrInput } from '$lib/server/scan/convert-image';
import OpenAI from 'openai';
import { z } from 'zod';

function stripMarkdownCodeFence(raw: string): string {
	let s = raw.trim();
	if (s.startsWith('```')) {
		s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
	}
	return s;
}

function toTrimmedString(value: unknown): string {
	if (value == null) return '';
	return String(value).trim();
}

function toStringList(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value.map((item) => toTrimmedString(item)).filter(Boolean);
	}
	if (typeof value === 'string') {
		return value
			.split(/[,;]+/)
			.map((s) => s.trim())
			.filter(Boolean);
	}
	return [];
}

function takeValidEmails(values: string[]): string[] {
	const email = z.string().email();
	return values.filter((v) => email.safeParse(v).success).slice(0, 5);
}

function parseModelContactJson(content: string | null): Record<string, unknown> {
	if (!content?.trim()) {
		throw new Error('Empty model response');
	}
	const stripped = stripMarkdownCodeFence(content);
	const parsed: unknown = JSON.parse(stripped);
	if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
		throw new Error('Model response was not a JSON object');
	}
	return parsed as Record<string, unknown>;
}

function normalizedContactFromLlm(raw: Record<string, unknown>) {
	const firstName = toTrimmedString(raw.firstName);
	const lastName = toTrimmedString(raw.lastName);

	return {
		firstName,
		lastName,
		company: toTrimmedString(raw.company),
		role: toTrimmedString(raw.role),
		title: toTrimmedString(raw.title),
		emails: takeValidEmails(toStringList(raw.emails)),
		phones: toStringList(raw.phones).slice(0, 5),
		website: toTrimmedString(raw.website),
		address: toTrimmedString(raw.address),
		notes: toTrimmedString(raw.notes)
	};
}

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

		const content = response.choices[0]?.message?.content ?? null;
		const rawObject = parseModelContactJson(content);
		const parsedContact = contactSchema.parse(normalizedContactFromLlm(rawObject));

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
