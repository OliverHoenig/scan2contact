import type { Contact } from '$lib/contact';

function escapeValue(value: string): string {
	return value
		.replace(/\\/g, '\\\\')
		.replace(/\n/g, '\\n')
		.replace(/;/g, '\\;')
		.replace(/,/g, '\\,');
}

export function generateVCard(contact: Contact): string {
	const fullName = contact.fullName || [contact.firstName, contact.lastName].filter(Boolean).join(' ');
	const lines = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${escapeValue(fullName)}`];

	lines.push(`N:${escapeValue(contact.lastName || '')};${escapeValue(contact.firstName || '')};;;`);

	if (contact.company) lines.push(`ORG:${escapeValue(contact.company)}`);
	if (contact.title) lines.push(`TITLE:${escapeValue(contact.title)}`);
	if (contact.website) lines.push(`URL:${escapeValue(contact.website)}`);
	if (contact.address) lines.push(`ADR:;;${escapeValue(contact.address)};;;;`);
	if (contact.notes) lines.push(`NOTE:${escapeValue(contact.notes)}`);

	for (const email of contact.emails) {
		lines.push(`EMAIL;TYPE=INTERNET:${escapeValue(email)}`);
	}

	for (const phone of contact.phones) {
		lines.push(`TEL;TYPE=CELL:${escapeValue(phone)}`);
	}

	lines.push('END:VCARD');
	return `${lines.join('\r\n')}\r\n`;
}
