import {
	appendCreatedTimestampToNotes,
	formatContactCreatedLabel
} from '$lib/format-contact-created';
import { describe, expect, it } from 'vitest';
import { POST } from './+server';

describe('/api/vcf POST', () => {
	it('returns vcard response for valid payload', async () => {
		const request = new Request('http://localhost/api/vcf', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				contact: {
					firstName: 'Max',
					lastName: 'Mustermann',
					company: 'Example GmbH',
					title: 'CTO',
					emails: ['max@example.com'],
					phones: ['+49123456789'],
					website: 'https://example.com',
					address: 'Street 1',
					notes: 'test'
				}
			})
		});

		const response = await POST({ request } as never);
		expect(response.status).toBe(200);
		expect(response.headers.get('Content-Type')).toContain('text/vcard');
		const text = await response.text();
		expect(text).toContain('BEGIN:VCARD');
	});

	it('includes notes with created-at line in NOTE field', async () => {
		const ms = Date.UTC(2026, 4, 2, 12, 0, 0);
		const notes = appendCreatedTimestampToNotes('Meet at fair', ms);
		const request = new Request('http://localhost/api/vcf', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				contact: {
					firstName: 'Max',
					lastName: 'Mustermann',
					company: '',
					role: '',
					title: '',
					emails: ['max@example.com'],
					phones: [],
					website: '',
					address: '',
					notes
				}
			})
		});

		const response = await POST({ request } as never);
		expect(response.status).toBe(200);
		const text = await response.text();
		expect(text).toContain('Meet at fair');
		const label = formatContactCreatedLabel(ms).replace(/,/g, '\\,').replace(/\n/g, '\\n');
		expect(text).toContain(label);
	});

	it('rejects invalid payload', async () => {
		const request = new Request('http://localhost/api/vcf', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ contact: { emails: ['not-an-email'] } })
		});

		const response = await POST({ request } as never);
		expect(response.status).toBe(400);
	});
});
