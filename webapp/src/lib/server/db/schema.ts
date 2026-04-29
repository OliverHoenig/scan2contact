import { pgTable, serial, integer, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const task = pgTable('task', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	priority: integer('priority').notNull().default(1)
});

export const scanJob = pgTable('scan_job', {
	id: serial('id').primaryKey(),
	userId: text('user_id'),
	status: text('status').notNull().default('completed'),
	originalImageName: text('original_image_name').notNull(),
	originalImageMimeType: text('original_image_mime_type').notNull(),
	ocrProvider: text('ocr_provider').notNull(),
	rawOcrJson: jsonb('raw_ocr_json').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const contactCandidate = pgTable('contact_candidate', {
	id: serial('id').primaryKey(),
	scanJobId: integer('scan_job_id')
		.notNull()
		.references(() => scanJob.id, { onDelete: 'cascade' }),
	firstName: text('first_name'),
	lastName: text('last_name'),
	company: text('company'),
	title: text('title'),
	emails: jsonb('emails').$type<string[]>().notNull().default([]),
	phones: jsonb('phones').$type<string[]>().notNull().default([]),
	website: text('website'),
	address: text('address'),
	notes: text('notes'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export * from './auth.schema';
