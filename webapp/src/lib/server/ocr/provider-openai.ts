import { env } from '$env/dynamic/private';
import type { OcrProvider, OcrResult } from './provider';

type OpenAIOutputItem = {
	type?: string;
	text?: string;
	content?: Array<{ type?: string; text?: string }>;
};

export class OpenAIOcrProvider implements OcrProvider {
	private apiKey = env.OCR_API_KEY;
	private model = env.OCR_MODEL || 'gpt-4.1-mini';
	private endpoint = env.OCR_API_URL || 'https://api.openai.com/v1/responses';

	async extractText(imageBuffer: Buffer, mimeType: string): Promise<OcrResult> {
		if (!this.apiKey) {
			throw new Error('OCR_API_KEY is not configured');
		}

		const imageDataUrl = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
		const prompt =
			'Read this business card image and return all visible text exactly as seen. Keep line breaks and do not interpret.';

		const response = await fetch(this.endpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${this.apiKey}`
			},
			body: JSON.stringify({
				model: this.model,
				input: [
					{
						role: 'user',
						content: [
							{ type: 'input_text', text: prompt },
							{ type: 'input_image', image_url: imageDataUrl }
						]
					}
				]
			})
		});

		if (!response.ok) {
			const message = await response.text();
			throw new Error(`OCR provider failed (${response.status}): ${message}`);
		}

		const raw = (await response.json()) as {
			output_text?: string;
			output?: OpenAIOutputItem[];
		};

		const text = raw.output_text ?? this.fallbackOutputText(raw.output) ?? '';
		return { text: text.trim(), raw, provider: 'openai' };
	}

	private fallbackOutputText(output: OpenAIOutputItem[] | undefined): string {
		if (!output?.length) return '';
		return output
			.flatMap((item) => item.content || [{ text: item.text }])
			.map((part) => part.text || '')
			.filter(Boolean)
			.join('\n');
	}
}
