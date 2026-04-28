export type OcrResult = {
	text: string;
	raw: unknown;
	provider: string;
};

export interface OcrProvider {
	extractText(imageBuffer: Buffer, mimeType: string): Promise<OcrResult>;
}
