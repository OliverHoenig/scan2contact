import { describe, expect, it } from 'vitest';
import { parseBusinessCardText } from './parse-business-card';

describe('parseBusinessCardText', () => {
	it('extracts core fields from plain OCR text', () => {
		const result = parseBusinessCardText(`Max Mustermann
Senior Sales Manager
Example GmbH
max@example.com
+49 170 1234567
www.example.com
Musterstrasse 12, Berlin`);

		expect(result.fullName).toBe('Max Mustermann');
		expect(result.company).toContain('GmbH');
		expect(result.title).toContain('Manager');
		expect(result.emails).toEqual(['max@example.com']);
		expect(result.phones[0]).toContain('+491701234567');
		expect(result.website).toContain('example.com');
	});
});
