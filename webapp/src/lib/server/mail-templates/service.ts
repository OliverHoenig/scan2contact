import { eq, asc } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { mailTemplate } from '$lib/server/db/schema/mailTemplates.schema';
import { DEFAULT_MAIL_TEMPLATES_SEED } from '$lib/mail-templates/defaults';

export type MailTemplateDTO = {
	id: string;
	displayName: string;
	subject: string;
	body: string;
	createdAt: Date;
	updatedAt: Date;
};

function rowToDto(row: typeof mailTemplate.$inferSelect): MailTemplateDTO {
	return {
		id: row.id,
		displayName: row.displayName,
		subject: row.subject,
		body: row.body,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt
	};
}

export async function listMailTemplatesForUser(userId: string): Promise<MailTemplateDTO[]> {
	const rows = await db
		.select()
		.from(mailTemplate)
		.where(eq(mailTemplate.userId, userId))
		.orderBy(asc(mailTemplate.createdAt));
	return rows.map(rowToDto);
}

export async function listOrSeedMailTemplates(userId: string): Promise<MailTemplateDTO[]> {
	const existing = await listMailTemplatesForUser(userId);
	if (existing.length > 0) return existing;

	const inserts = DEFAULT_MAIL_TEMPLATES_SEED.map((t) => ({
		id: crypto.randomUUID(),
		userId,
		displayName: t.displayName,
		subject: t.subject,
		body: t.body
	}));
	await db.insert(mailTemplate).values(inserts);
	return listMailTemplatesForUser(userId);
}

export async function getMailTemplateForUser(
	userId: string,
	id: string
): Promise<MailTemplateDTO | null> {
	const [row] = await db
		.select()
		.from(mailTemplate)
		.where(eq(mailTemplate.id, id))
		.limit(1);
	if (!row || row.userId !== userId) return null;
	return rowToDto(row);
}

export async function createMailTemplate(
	userId: string,
	data: { displayName: string; subject: string; body: string }
): Promise<MailTemplateDTO> {
	const id = crypto.randomUUID();
	await db.insert(mailTemplate).values({
		id,
		userId,
		displayName: data.displayName,
		subject: data.subject,
		body: data.body
	});
	const created = await getMailTemplateForUser(userId, id);
	if (!created) throw new Error('Failed to create template');
	return created;
}

export async function updateMailTemplate(
	userId: string,
	id: string,
	data: { displayName: string; subject: string; body: string }
): Promise<MailTemplateDTO | null> {
	const existing = await getMailTemplateForUser(userId, id);
	if (!existing) return null;
	await db
		.update(mailTemplate)
		.set({
			displayName: data.displayName,
			subject: data.subject,
			body: data.body
		})
		.where(eq(mailTemplate.id, id));
	return getMailTemplateForUser(userId, id);
}

export async function deleteMailTemplate(userId: string, id: string): Promise<boolean> {
	const existing = await getMailTemplateForUser(userId, id);
	if (!existing) return false;
	await db.delete(mailTemplate).where(eq(mailTemplate.id, id));
	return true;
}
