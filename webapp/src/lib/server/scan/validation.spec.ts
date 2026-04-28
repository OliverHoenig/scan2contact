import { describe, expect, it } from 'vitest';
import { validateImageUpload } from './validation';

describe('validateImageUpload', () => {
	it('accepts supported image payload', () => {
		const file = new File(['sample'], 'card.jpg', { type: 'image/jpeg' });
		expect(validateImageUpload(file, 2_000_000)).toBeNull();
	});

	it('rejects oversized uploads', () => {
		const file = new File([new Uint8Array(10)], 'card.png', { type: 'image/png' });
		expect(validateImageUpload(file, 1)).toContain('too large');
	});

	it('rejects unsupported mime types', () => {
		const file = new File(['hello'], 'card.txt', { type: 'text/plain' });
		expect(validateImageUpload(file, 2_000_000)).toContain('Only JPG');
	});
});
