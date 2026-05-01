/** Line appended to contact notes when a card is scanned (UI + vCard NOTE). */
export function formatContactCreatedLabel(ms: number): string {
	const d = new Date(ms);
	const dd = String(d.getDate()).padStart(2, '0');
	const mm = String(d.getMonth() + 1).padStart(2, '0');
	const yyyy = String(d.getFullYear());
	return `Created at: ${dd}.${mm}.${yyyy}`;
}

const NOTES_MAX = 1000;

/** Appends the created-at line at the end of notes, staying within the contact notes max length. */
export function appendCreatedTimestampToNotes(notes: string, ms: number = Date.now()): string {
	const label = formatContactCreatedLabel(ms);
	const base = notes.trimEnd();
	const suffix = `\n\n${label}`;
	if (!base) {
		return label.length <= NOTES_MAX ? label : label.slice(0, NOTES_MAX);
	}
	if (base.length + suffix.length <= NOTES_MAX) {
		return `${base}${suffix}`;
	}
	const maxBase = Math.max(0, NOTES_MAX - suffix.length);
	const trimmed = maxBase > 0 ? base.slice(0, maxBase).trimEnd() : '';
	return `${trimmed}${suffix}`;
}
