import {
	appendCreatedTimestampToNotes,
	formatContactCreatedLabel
} from '$lib/format-contact-created';
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

	it('includes full notes string in NOTE (e.g. after scan timestamp append)', () => {
		const ms = Date.UTC(2026, 4, 2, 12, 0, 0);
		const notes = appendCreatedTimestampToNotes('Hello', ms);
		const output = generateVCard({
			firstName: 'A',
			lastName: 'B',
			company: '',
			role: '',
			title: '',
			emails: [],
			phones: [],
			website: '',
			address: '',
			notes
		});
		expect(output).toContain('NOTE:');
		expect(output).toContain('Hello');
		const label = formatContactCreatedLabel(ms).replace(/,/g, '\\,').replace(/\n/g, '\\n');
		expect(output).toContain(label);
	});
});
