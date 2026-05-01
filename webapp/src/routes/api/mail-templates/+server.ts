import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { auth } from '$lib/auth/server/auth';
import { listOrSeedMailTemplates, createMailTemplate } from '$lib/server/mail-templates/service';

const createBodySchema = z.object({
	displayName: z.string().trim().min(1).max(120),
	subject: z.string().trim().min(1).max(300),
	body: z.string().min(1).max(12000)
});

function serialize(dto: Awaited<ReturnType<typeof listOrSeedMailTemplates>>[number]) {
	return {
		id: dto.id,
		displayName: dto.displayName,
		subject: dto.subject,
		body: dto.body,
		createdAt: dto.createdAt.toISOString(),
		updatedAt: dto.updatedAt.toISOString()
	};
}

export const GET: RequestHandler = async (event) => {
	const session = await auth.api.getSession({ headers: event.request.headers });
	if (!session?.user?.id) throw error(401, 'Unauthorized');

	const rows = await listOrSeedMailTemplates(session.user.id);
	return json({ templates: rows.map(serialize) });
};

export const POST: RequestHandler = async (event) => {
	const session = await auth.api.getSession({ headers: event.request.headers });
	if (!session?.user?.id) throw error(401, 'Unauthorized');

	let body: unknown;
	try {
		body = await event.request.json();
	} catch {
		throw error(400, 'Invalid JSON');
	}
	const parsed = createBodySchema.safeParse(body);
	if (!parsed.success) throw error(400, 'Invalid body');

	const created = await createMailTemplate(session.user.id, parsed.data);
	return json({ template: serialize(created) }, { status: 201 });
};
