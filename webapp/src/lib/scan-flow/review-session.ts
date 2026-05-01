import { contactSchema, type Contact } from '$lib/contact';

export const SESSION_KEY = 's2c.review';
const SESSION_TTL_MS = 30 * 60 * 1000;

export type SavedActions = { followupSent: boolean; linkedinOpened: boolean };

export type ReviewSessionState = {
	contact: Contact;
	consentNotice: string;
	savedViaSkip: boolean;
	savedActions: SavedActions;
	saveTriggeredAt: number | null;
};

type StoredPayload = ReviewSessionState & { updatedAt: number };

export function loadReviewSession(): ReviewSessionState | null {
	if (typeof window === 'undefined') return null;
	try {
		const raw = window.sessionStorage.getItem(SESSION_KEY);
		if (!raw) return null;
		const data = JSON.parse(raw) as Partial<StoredPayload>;
		const updatedAt = typeof data.updatedAt === 'number' ? data.updatedAt : null;
		if (!updatedAt || Date.now() - updatedAt > SESSION_TTL_MS) {
			clearReviewSession();
			return null;
		}
		const parsed = contactSchema.safeParse(data.contact);
		if (!parsed.success) {
			clearReviewSession();
			return null;
		}
		return {
			contact: parsed.data,
			consentNotice: typeof data.consentNotice === 'string' ? data.consentNotice : '',
			savedViaSkip: !!data.savedViaSkip,
			savedActions: {
				followupSent: !!data.savedActions?.followupSent,
				linkedinOpened: !!data.savedActions?.linkedinOpened
			},
			saveTriggeredAt: typeof data.saveTriggeredAt === 'number' ? data.saveTriggeredAt : null
		};
	} catch {
		clearReviewSession();
		return null;
	}
}

export function saveReviewSession(state: ReviewSessionState): void {
	if (typeof window === 'undefined') return;
	try {
		const payload: StoredPayload = {
			...state,
			updatedAt: Date.now()
		};
		window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
	} catch {
		// ignore storage errors (private mode, quota, etc.)
	}
}

export function clearReviewSession(): void {
	if (typeof window === 'undefined') return;
	try {
		window.sessionStorage.removeItem(SESSION_KEY);
	} catch {
		// ignore
	}
}

export function isFollowupEligible(state: ReviewSessionState): boolean {
	return state.saveTriggeredAt != null || state.savedViaSkip;
}
