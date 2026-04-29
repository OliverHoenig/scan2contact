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
		expect(await response.text()).toContain('BEGIN:VCARD');
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
