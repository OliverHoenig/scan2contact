declare module 'heic-convert' {
	type HeicOutputFormat = 'JPEG' | 'PNG';

	interface ConvertOptions {
		buffer: Uint8Array;
		format: HeicOutputFormat;
		quality?: number;
	}

	export default function convert(options: ConvertOptions): Promise<Uint8Array>;
}
