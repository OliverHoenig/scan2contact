import { describe, expect, it } from 'vitest';
import {
	appendCreatedTimestampToNotes,
	formatContactCreatedLabel
} from './format-contact-created';

describe('formatContactCreatedLabel', () => {
	it('uses dd.mm.yyyy in the local timezone', () => {
		const d = new Date(2026, 4, 2, 12, 0, 0);
		expect(formatContactCreatedLabel(d.getTime())).toBe('Created at: 02.05.2026');
	});
});

describe('appendCreatedTimestampToNotes', () => {
	it('uses only the label when notes are empty', () => {
		const ms = Date.UTC(2026, 4, 2, 12, 0, 0);
		expect(appendCreatedTimestampToNotes('', ms)).toBe(formatContactCreatedLabel(ms));
	});

	it('appends label after non-empty notes', () => {
		const ms = Date.UTC(2026, 4, 2, 12, 0, 0);
		const out = appendCreatedTimestampToNotes('From LLM', ms);
		expect(out.startsWith('From LLM')).toBe(true);
		expect(out).toContain(formatContactCreatedLabel(ms));
	});

	it('stays within 1000 characters', () => {
		const ms = Date.UTC(2026, 4, 2, 12, 0, 0);
		const huge = 'x'.repeat(2000);
		const out = appendCreatedTimestampToNotes(huge, ms);
		expect(out.length).toBeLessThanOrEqual(1000);
		expect(out).toContain(formatContactCreatedLabel(ms));
	});
});
