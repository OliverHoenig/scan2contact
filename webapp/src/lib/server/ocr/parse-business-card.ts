import type { Contact } from '$lib/contact';

const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const phonePattern =
	/(?:(?:\+|00)\d{1,3}[\s./-]?)?(?:\(?\d{2,5}\)?[\s./-]?){2,5}\d{2,5}/g;
const websitePattern = /\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+\.[a-z]{2,}(?:\/\S*)?/i;

const roleHints = ['manager', 'director', 'founder', 'engineer', 'sales', 'marketing', 'consultant'];
const companyHints = ['gmbh', 'ag', 'llc', 'ltd', 'inc', 'kg', 'solutions', 'studio', 'company'];

function hasCompanyHint(line: string): boolean {
	const lower = line.toLowerCase();
	return companyHints.some((hint) => new RegExp(`\\b${hint}\\b`, 'i').test(lower));
}

function dedupe(values: string[]): string[] {
	return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
}

function sanitizePhone(phone: string): string {
	return phone.replace(/[^\d+]/g, '').replace(/^00/, '+');
}

export function parseBusinessCardText(text: string): Contact {
	const lines = text
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean);

	const emails = dedupe((text.match(emailPattern) || []).map((m) => m.toLowerCase()));
	const websites = dedupe((text.match(new RegExp(websitePattern, 'gi')) || []).map((m) => m.trim()));
	const phones = dedupe((text.match(phonePattern) || []).map(sanitizePhone)).filter(
		(phone) => phone.length >= 7
	);

	const cleanedLines = lines.filter(
		(line) =>
			!emails.includes(line.toLowerCase()) &&
			!phones.includes(sanitizePhone(line)) &&
			!websitePattern.test(line)
	);

	const fullName = cleanedLines[0] || '';
	const nameParts = fullName.split(/\s+/).filter(Boolean);
	const firstName = nameParts.slice(0, -1).join(' ') || nameParts[0] || '';
	const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

	const title = cleanedLines.find((line) =>
		roleHints.some((hint) => line.toLowerCase().includes(hint))
	);
	const company =
		cleanedLines.find((line) => hasCompanyHint(line)) ||
		cleanedLines.find((line) => line !== title && line.toUpperCase() === line && line.length > 3);
	const address = cleanedLines.find((line) => /\d/.test(line) && /[a-zA-Z]/.test(line)) || '';

	return {
		firstName,
		lastName,
		fullName,
		company: company || '',
		title: title || '',
		emails,
		phones,
		website: websites[0] || '',
		address,
		notes: text
	};
}
