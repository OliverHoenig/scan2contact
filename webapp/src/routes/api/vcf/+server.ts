import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { contactSchema } from '$lib/contact';
import { generateVCard } from '$lib/server/vcard/generate';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => null);
	const parsed = contactSchema.safeParse(body?.contact);

	if (!parsed.success) {
		return json({ error: 'Invalid contact payload.' }, { status: 400 });
	}

	const contact = parsed.data;
	const vcard = generateVCard(contact);
	const safeName = (`${contact.firstName} ${contact.lastName}`.trim() || 'contact')
		.trim()
		.replace(/[^a-zA-Z0-9_-]+/g, '_');

	return new Response(vcard, {
		status: 200,
		headers: {
			'Content-Type': 'text/vcard; charset=utf-8',
			'Content-Disposition': `attachment; filename="${safeName || 'contact'}.vcf"`
		}
	});
};
