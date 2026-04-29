import { z } from 'zod';

function normalizeWebsiteInput(value: string): string {
	const s = value.trim();
	if (!s) return '';
	const withProto = /^https?:\/\//i.test(s) ? s : `https://${s}`;
	try {
		new URL(withProto);
		return withProto;
	} catch {
		return '';
	}
}

export const contactSchema = z.object({
	firstName: z.string().trim().max(120).optional().default(''),
	lastName: z.string().trim().max(120).optional().default(''),
	company: z.string().trim().max(200).optional().default(''),
	role: z.string().trim().max(200).optional().default(''),
	title: z.string().trim().max(200).optional().default(''),
	emails: z.array(z.string().email().max(320)).max(5).optional().default([]),
	phones: z.array(z.string().trim().max(50)).max(5).optional().default([]),
	website: z
		.string()
		.trim()
		.max(300)
		.optional()
		.default('')
		.transform(normalizeWebsiteInput),
	address: z.string().trim().max(400).optional().default(''),
	notes: z.string().trim().max(1000).optional().default('')
});

export type Contact = z.infer<typeof contactSchema>;
