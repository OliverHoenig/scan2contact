import type { Contact } from '$lib/contact';

export type PlaceholderKey = 'title' | 'firstName' | 'lastName';

export const MAIL_TEMPLATE_PLACEHOLDERS: ReadonlyArray<{
	key: PlaceholderKey;
	/** Shown on the chip and insert button */
	label: string;
	/** Longer copy for the help dialog */
	help: string;
}> = [
	{
		key: 'title',
		label: 'Job title',
		help: 'The job title saved on the contact card.'
	},
	{
		key: 'firstName',
		label: 'First name',
		help: 'The first name. If it is empty when you send, the greeting uses “there” instead.'
	},
	{
		key: 'lastName',
		label: 'Last name',
		help: 'The last name saved on the contact card.'
	}
];

const KNOWN = new Set<PlaceholderKey>(MAIL_TEMPLATE_PLACEHOLDERS.map((p) => p.key));

export function isPlaceholderKey(s: string): s is PlaceholderKey {
	return KNOWN.has(s as PlaceholderKey);
}

const SPLIT_RE = /(\{(?:title|firstName|lastName)\})/;

export type TemplateSegment = { type: 'text'; text: string } | { type: 'var'; key: PlaceholderKey };

export function parseTemplateToSegments(raw: string): TemplateSegment[] {
	const parts = raw.split(SPLIT_RE);
	const out: TemplateSegment[] = [];
	for (const part of parts) {
		if (!part) continue;
		const m = /^\{(title|firstName|lastName)\}$/.exec(part);
		if (m && isPlaceholderKey(m[1])) out.push({ type: 'var', key: m[1] });
		else out.push({ type: 'text', text: part });
	}
	return out;
}

/** Walks a contenteditable root: text nodes, `<br>`, chip spans (`data-token`), and nested nodes from paste. */
export function serializeTemplateEditor(root: HTMLElement): string {
	let out = '';
	for (const child of root.childNodes) {
		if (child.nodeType === Node.TEXT_NODE) {
			out += child.textContent ?? '';
		} else if (child.nodeType === Node.ELEMENT_NODE) {
			const el = child as HTMLElement;
			if (el.tagName === 'BR') {
				out += '\n';
			} else if (el.dataset.token && isPlaceholderKey(el.dataset.token)) {
				out += `{${el.dataset.token}}`;
			} else {
				out += serializeTemplateEditor(el);
			}
		}
	}
	return out;
}

export function personalizeMailTemplate(text: string, contact: Contact): string {
	return text
		.replaceAll('{title}', contact.title?.trim() ?? '')
		.replaceAll('{firstName}', contact.firstName?.trim() || 'there')
		.replaceAll('{lastName}', contact.lastName?.trim() ?? '');
}
