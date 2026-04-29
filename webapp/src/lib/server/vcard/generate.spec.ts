import { describe, expect, it } from 'vitest';
import { generateVCard } from './generate';

describe('generateVCard', () => {
	it('returns valid vCard markers and values', () => {
		const output = generateVCard({
			firstName: 'Max',
			lastName: 'Mustermann',
			company: 'Example GmbH',
			role: '',
			title: 'CTO',
			emails: ['max@example.com'],
			phones: ['+491701234567'],
			website: 'https://example.com',
			address: 'Musterstrasse 12',
			notes: 'Scanned from card'
		});

		expect(output).toContain('BEGIN:VCARD');
		expect(output).toContain('VERSION:3.0');
		expect(output).toContain('FN:Max Mustermann');
		expect(output).toContain('EMAIL;TYPE=INTERNET:max@example.com');
		expect(output).toContain('END:VCARD');
	});
});
