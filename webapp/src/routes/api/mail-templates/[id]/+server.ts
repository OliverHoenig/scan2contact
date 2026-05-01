import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { auth } from '$lib/auth/server/auth';
import { updateMailTemplate, deleteMailTemplate } from '$lib/server/mail-templates/service';

const patchBodySchema = z.object({
	displayName: z.string().trim().min(1).max(120),
	subject: z.string().trim().min(1).max(300),
	body: z.string().min(1).max(12000)
});

function serialize(dto: NonNullable<Awaited<ReturnType<typeof updateMailTemplate>>>) {
	return {
		id: dto.id,
		displayName: dto.displayName,
		subject: dto.subject,
		body: dto.body,
		createdAt: dto.createdAt.toISOString(),
		updatedAt: dto.updatedAt.toISOString()
	};
}

export const PATCH: RequestHandler = async (event) => {
	const session = await auth.api.getSession({ headers: event.request.headers });
	if (!session?.user?.id) throw error(401, 'Unauthorized');

	let body: unknown;
	try {
		body = await event.request.json();
	} catch {
		throw error(400, 'Invalid JSON');
	}
	const parsed = patchBodySchema.safeParse(body);
	if (!parsed.success) throw error(400, 'Invalid body');

	const updated = await updateMailTemplate(session.user.id, event.params.id, parsed.data);
	if (!updated) throw error(404, 'Not found');

	return json({ template: serialize(updated) });
};

export const DELETE: RequestHandler = async (event) => {
	const session = await auth.api.getSession({ headers: event.request.headers });
	if (!session?.user?.id) throw error(401, 'Unauthorized');

	const ok = await deleteMailTemplate(session.user.id, event.params.id);
	if (!ok) throw error(404, 'Not found');

	return new Response(null, { status: 204 });
};
