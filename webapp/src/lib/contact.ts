import { z } from 'zod';

export const contactSchema = z.object({
	firstName: z.string().trim().max(120).optional().default(''),
	lastName: z.string().trim().max(120).optional().default(''),
	company: z.string().trim().max(200).optional().default(''),
	role: z.string().trim().max(200).optional().default(''),
	title: z.string().trim().max(200).optional().default(''),
	emails: z.array(z.string().email().max(320)).max(5).optional().default([]),
	phones: z.array(z.string().trim().max(50)).max(5).optional().default([]),
	website: z.string().trim().url().max(300).optional().or(z.literal('')).default(''),
	address: z.string().trim().max(400).optional().default(''),
	notes: z.string().trim().max(1000).optional().default('')
});

export type Contact = z.infer<typeof contactSchema>;
