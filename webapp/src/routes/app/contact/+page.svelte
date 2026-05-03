<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import ContactForm from '$lib/components/scan/ContactForm.svelte';
	import VcfDownloadButton from '$lib/components/scan/VcfDownloadButton.svelte';
	import { DEFAULT_MAIL_TEMPLATES_SEED } from '$lib/mail-templates/defaults';
	import type { Contact } from '$lib/contact';
	import {
		clearReviewSession,
		isFollowupEligible,
		loadReviewSession,
		saveReviewSession,
		type ReviewSessionState
	} from '$lib/scan-flow/review-session';

	type ReviewStage = 'edit' | 'saved';
	type NextCta = 'followup' | 'linkedin' | 'scan' | null;
	type AddContactGuideMode = 'popup' | 'download';
	const RETURN_NUDGE_WINDOW_MS = 60 * 1000;

	const ADD_CONTACT_GUIDE_STEPS: Record<AddContactGuideMode, string[]> = {
		popup: [
			'If you get a message to open the contact card, allow it.',
			'If a popup opens search for a button like "Add to Contacts", "Create New Contact", or similar (The exact label depends on your device. Perhaps you need to scroll down).',
			'If you’re asked where to save it, pick the account or address book you want.',
			'Tap "Save" or "Done" to add the contact.'
		],
		download: [
			'If the file gets downloaded, open your browser’s downloads list or your Files / Downloads folder and find the .vcf (or .vcard) file.',
			'Tap or open that file.',
			'When your device asks, choose "Contacts", "People", or "Add to address book" to import the contact card to your address book.',
			'If needed, confirm the Save in the contact app of your choice.'
		]
	};

	type FollowupTemplate = {
		id: string;
		label: string;
		description: string;
		subject: string;
		body: string;
	};

	let hydrated = $state(false);
	let reviewStage = $state<ReviewStage>('edit');
	let contact = $state<Contact | null>(null);
	let consentNotice = $state('');
	let savedViaSkip = $state(false);
	let savedActions = $state<ReviewSessionState['savedActions']>({
		followupSent: false,
		linkedinOpened: false
	});
	let saveTriggeredAt = $state<number | null>(null);
	let loading = $state(false);
	let storageReady = $state(false);
	let vcfOpenError = $state('');
	let vcfOpening = $state(false);
	let returnNudgeKey = $state(0);
	let pulsingCta = $state<NextCta>(null);
	let addContactGuideMode = $state<AddContactGuideMode>('popup');

	let followupTemplates = $state<FollowupTemplate[]>([]);
	let followupTemplatesLoading = $state(false);
	let followupModalOpen = $state(false);
	let selectedFollowupId = $state<string | null>(null);

	function bodyPreview(body: string): string {
		const line = body
			.split('\n')
			.map((l) => l.trim())
			.find(Boolean);
		const t = line ?? '';
		return t.length > 120 ? `${t.slice(0, 117)}…` : t;
	}

	function builtinFollowupTemplates(): FollowupTemplate[] {
		return DEFAULT_MAIL_TEMPLATES_SEED.map((t, i) => ({
			id: `builtin-${i}`,
			label: t.displayName,
			description: bodyPreview(t.body),
			subject: t.subject,
			body: t.body
		}));
	}

	function rowsToFollowup(
		rows: { id: string; displayName: string; subject: string; body: string }[]
	): FollowupTemplate[] {
		return rows.map((r) => ({
			id: r.id,
			label: r.displayName,
			description: bodyPreview(r.body),
			subject: r.subject,
			body: r.body
		}));
	}

	async function loadFollowupTemplatesForModal() {
		followupTemplatesLoading = true;
		try {
			const res = await fetch(resolve('/api/mail-templates'));
			if (res.ok) {
				const data = (await res.json()) as {
					templates: { id: string; displayName: string; subject: string; body: string }[];
				};
				followupTemplates = rowsToFollowup(data.templates ?? []);
			} else {
				followupTemplates = builtinFollowupTemplates();
			}
		} catch {
			followupTemplates = builtinFollowupTemplates();
		} finally {
			followupTemplatesLoading = false;
			if (!selectedFollowupId || !followupTemplates.some((t) => t.id === selectedFollowupId)) {
				selectedFollowupId = followupTemplates[0]?.id ?? null;
			}
		}
	}

	function primaryEmail(c: Contact): string | undefined {
		const raw = c.emails?.find((e) => e.trim().length > 0);
		return raw?.trim();
	}

	function personalizeTemplate(text: string): string {
		const name = contact?.firstName?.trim() || 'there';
		return text.replaceAll('{firstName}', name);
	}

	function buildMailtoUrl(to: string, subject: string, body: string): string {
		const q = `subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
		return `mailto:${encodeURIComponent(to)}?${q}`;
	}

	function openFollowupModal() {
		selectedFollowupId = null;
		followupModalOpen = true;
		void loadFollowupTemplatesForModal();
	}

	function closeFollowupModal() {
		followupModalOpen = false;
	}

	function openMailWithTemplate() {
		if (!contact) return;
		const to = primaryEmail(contact);
		if (!to || !selectedFollowupId) return;
		const tpl = followupTemplates.find((t) => t.id === selectedFollowupId);
		if (!tpl) return;
		const subject = personalizeTemplate(tpl.subject);
		const body = personalizeTemplate(tpl.body);
		savedActions = { ...savedActions, followupSent: true };
		saveTriggeredAt = Date.now();
		window.location.href = buildMailtoUrl(to, subject, body);
		closeFollowupModal();
	}

	function linkedinPeopleSearchKeywords(c: Contact): string {
		const parts = [c.firstName, c.lastName, c.company]
			.map((s) => (typeof s === 'string' ? s.trim() : ''))
			.filter(Boolean);
		return parts.join(' ');
	}

	function canOpenLinkedInSearch(c: Contact): boolean {
		return linkedinPeopleSearchKeywords(c).length > 0;
	}

	function openLinkedInSearch() {
		if (!contact) return;
		const keywords = linkedinPeopleSearchKeywords(contact);
		if (!keywords) return;
		const url = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(keywords)}`;
		savedActions = { ...savedActions, linkedinOpened: true };
		saveTriggeredAt = Date.now();
		window.open(url, '_blank', 'noopener,noreferrer');
	}

	const ALERT_WAIT_OTHER = 'Please wait — another action is still in progress.';
	const ALERT_WAIT_VCF = 'Please wait — the contact card is still being prepared.';

	function onFollowupCtaClick() {
		if (loading) {
			window.alert(ALERT_WAIT_OTHER);
			return;
		}
		if (!contact || !primaryEmail(contact)) {
			window.alert(
				"You can't send a follow-up email yet because this contact has no email address. Add one under 'Edit details' and try again."
			);
			return;
		}
		openFollowupModal();
	}

	function onLinkedInCtaClick() {
		if (loading) {
			window.alert(ALERT_WAIT_OTHER);
			return;
		}
		if (!contact || !canOpenLinkedInSearch(contact)) {
			window.alert(
				"You can't open LinkedIn search yet. Add at least a first name, last name, or company under Edit details so we can find this person."
			);
			return;
		}
		openLinkedInSearch();
	}

	function onGuideOpenContactClick() {
		if (vcfOpening) {
			window.alert(ALERT_WAIT_VCF);
			return;
		}
		if (loading) {
			window.alert(ALERT_WAIT_OTHER);
			return;
		}
		void openContactInContactsApp();
	}

	function onEditDetailsWhileBusyClick() {
		if (vcfOpening) {
			window.alert(ALERT_WAIT_VCF);
			return;
		}
		if (loading) {
			window.alert(ALERT_WAIT_OTHER);
			return;
		}
		backToEdit();
	}

	function onOpenMailAppClick() {
		if (followupTemplatesLoading) {
			window.alert('Please wait — templates are still loading.');
			return;
		}
		if (followupTemplates.length === 0) {
			window.alert(
				'No email templates are available. Add templates under Settings → Follow-up mail templates.'
			);
			return;
		}
		if (!selectedFollowupId) {
			window.alert('Please choose an email template first.');
			return;
		}
		openMailWithTemplate();
	}

	function nextPendingCta(): NextCta {
		if (!contact) return 'scan';
		if (!savedActions.followupSent && !!primaryEmail(contact)) return 'followup';
		if (!savedActions.linkedinOpened && canOpenLinkedInSearch(contact)) return 'linkedin';
		return 'scan';
	}

	async function openContactInContactsApp() {
		if (!contact) return;
		vcfOpenError = '';
		vcfOpening = true;
		try {
			const response = await fetch('/api/vcf', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ contact })
			});
			if (!response.ok) {
				throw new Error('Failed to generate vCard');
			}
			const blob = await response.blob();
			const url = URL.createObjectURL(blob);
			saveTriggeredAt = Date.now();
			savedViaSkip = false;
			reviewStage = 'saved';
			saveReviewSession({
				contact,
				consentNotice,
				savedViaSkip: false,
				savedActions,
				saveTriggeredAt
			});
			window.location.assign(url);
		} catch (unknownError) {
			vcfOpenError =
				unknownError instanceof Error ? unknownError.message : 'Could not open contact file';
		} finally {
			vcfOpening = false;
		}
	}

	function triggerReturnNudge() {
		if (typeof document === 'undefined') return;
		if (document.visibilityState !== 'visible') return;
		if (reviewStage !== 'saved') return;
		if (!saveTriggeredAt) return;
		if (Date.now() - saveTriggeredAt > RETURN_NUDGE_WINDOW_MS) return;
		pulsingCta = nextPendingCta();
		returnNudgeKey++;
		window.setTimeout(() => {
			pulsingCta = null;
		}, 1400);
	}

	function backToEdit() {
		vcfOpenError = '';
		reviewStage = 'edit';
	}

	function restartFlow() {
		clearReviewSession();
		void goto(resolve('/app/scan'));
	}

	function persistSavedForFollowup() {
		saveTriggeredAt = Date.now();
		savedViaSkip = false;
		reviewStage = 'saved';
	}

	function afterShareShowSavedSection() {
		reviewStage = 'saved';
	}

	function skipToFollowup() {
		savedViaSkip = true;
		reviewStage = 'saved';
	}

	onMount(() => {
		const s = loadReviewSession();
		if (!s) {
			void goto(resolve('/app/scan'));
			return;
		}
		contact = s.contact;
		consentNotice = s.consentNotice;
		savedViaSkip = s.savedViaSkip;
		savedActions = s.savedActions;
		saveTriggeredAt = s.saveTriggeredAt;
		reviewStage = isFollowupEligible(s) ? 'saved' : 'edit';
		hydrated = true;
		storageReady = true;

		const onVisible = () => triggerReturnNudge();
		const onPageShow = () => triggerReturnNudge();
		document.addEventListener('visibilitychange', onVisible);
		window.addEventListener('pageshow', onPageShow);
		return () => {
			document.removeEventListener('visibilitychange', onVisible);
			window.removeEventListener('pageshow', onPageShow);
		};
	});

	$effect(() => {
		if (!storageReady || !hydrated || !contact) return;
		saveReviewSession({
			contact,
			consentNotice,
			savedViaSkip,
			savedActions,
			saveTriggeredAt
		});
	});
</script>

<svelte:window
	onkeydown={(e) => {
		if (!followupModalOpen) return;
		if (e.key === 'Escape') {
			e.preventDefault();
			closeFollowupModal();
		}
	}}
/>

{#if !hydrated}
	<main
		class="flex min-h-0 flex-col items-center justify-center gap-3 text-center"
		aria-busy="true"
	>
		<div
			class="h-9 w-9 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]"
			aria-hidden="true"
		></div>
		<p class="m-0 text-[0.9375rem] text-[var(--text-muted)]">Loading contact…</p>
	</main>
{:else if contact}
	<main class="flex min-h-0 w-full flex-col gap-5">
		{#if reviewStage === 'edit'}
			<section
				class="flex flex-col rounded-[var(--radius-lg)] border border-[var(--glass-border)] bg-[var(--glass-bg)] p-5 shadow-[var(--shadow-card)] backdrop-blur-md sm:p-6"
			>
				<h2 class="mt-1 text-[1.35rem] font-semibold tracking-[-0.02em]">Review contact</h2>
				<p class="m-0 mb-10 text-[0.9375rem] leading-[1.5] text-[var(--text-muted)]">
					Check and correct fields, then save the contact to your phone — or skip straight to
					follow-up options below.
				</p>
				{#if consentNotice}
					<p class="m-0 mb-4 text-sm leading-[1.5] text-[var(--text-muted)]">{consentNotice}</p>
				{/if}
				<ContactForm bind:contact />
				<div class="mt-12 flex flex-col items-stretch gap-2 pt-1">
					<VcfDownloadButton
						{contact}
						disabled={loading}
						onSaveTriggered={persistSavedForFollowup}
						onAfterShare={afterShareShowSavedSection}
					/>
					<button
						type="button"
						class="mt-1 self-center text-[0.8125rem] font-medium text-[var(--text-muted)] underline underline-offset-4 transition-colors hover:text-[var(--text)]"
						onclick={skipToFollowup}
					>
						Skip saving — go to follow-up options
					</button>
				</div>
				<div class="mt-10 flex justify-center">
					<button
						type="button"
						class="text-[0.8125rem] font-medium text-[var(--text-muted)] underline underline-offset-4 transition-colors hover:text-[var(--text)]"
						onclick={restartFlow}
					>
						Scan another card
					</button>
				</div>
				<div class="min-h-10 w-full"></div>
			</section>
		{:else}
			<section class="flex flex-col">
				<div
					class="mt-5 rounded-lg border border-(--border) bg-[linear-gradient(165deg,rgba(14,32,52,0.92)_0%,rgba(5,13,22,0.96)_100%)] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04),0_24px_64px_rgba(0,0,0,0.45)]"
				>
					<div>
						<h2 class="m-0 text-[1.15rem] font-semibold">What next?</h2>
						<ul class="m-0 mt-0.5 text-[0.875rem]">
							{#if savedViaSkip}
								<li>
									1. You skipped opening the contact card. Continue with the steps below when you
									need help to add it to your Contacts app.
								</li>
								<li>
									2. You can trigger follow-up options below. (e.g. send an email, connect on
									LinkedIn, etc.)
								</li>
							{:else}
								<li>
									1. The contact card was shared or opened. If you need help to add it to your
									Contacts app, continue with the steps below.
								</li>
								<li>
									2. You can trigger follow-up options below. (e.g. send an email, connect on
									LinkedIn, etc.)
								</li>
							{/if}
						</ul>
					</div>

					<details
						class="add-contact-guide mt-4 rounded-md border border-(--border) bg-white/3 [&_summary::-webkit-details-marker]:hidden"
					>
						<summary
							class="flex cursor-pointer list-none items-center justify-between gap-2 py-2.5 pr-3 pl-3 text-[0.875rem] font-medium select-none"
						>
							<span>How do I add this contact?</span>
							<svg
								class="add-contact-guide__chevron h-4 w-4 shrink-0 transition-transform duration-200"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-hidden="true"
							>
								<path d="m6 9 6 6 6-6" />
							</svg>
						</summary>
						<div class="border-t border-[var(--border)] px-3 pt-3 pb-3">
							<div class="mb-3 flex flex-wrap gap-1.5">
								<button
									type="button"
									class={`rounded-[var(--radius-sm)] border px-2.5 py-1.5 text-[0.8125rem] font-medium transition-colors ${addContactGuideMode === 'popup' ? 'border-[var(--accent)] bg-[var(--fill-accent-12)] text-[var(--text)]' : 'border-[var(--border)] bg-transparent text-[var(--text-muted)] hover:border-[rgba(255,255,255,0.14)] hover:text-[var(--text)]'}`}
									onclick={() => (addContactGuideMode = 'popup')}
								>
									Popup
								</button>
								<button
									type="button"
									class={`rounded-[var(--radius-sm)] border px-2.5 py-1.5 text-[0.8125rem] font-medium transition-colors ${addContactGuideMode === 'download' ? 'border-[var(--accent)] bg-[var(--fill-accent-12)] text-[var(--text)]' : 'border-[var(--border)] bg-transparent text-[var(--text-muted)] hover:border-[rgba(255,255,255,0.14)] hover:text-[var(--text)]'}`}
									onclick={() => (addContactGuideMode = 'download')}
								>
									Download
								</button>
							</div>

							<p class="m-0 mb-2 text-[0.8125rem] leading-[1.45] text-[var(--text-muted)]">
								{#if addContactGuideMode === 'popup'}
									The browser opens a contact preview or sheet (for example Safari on iOS).
								{:else}
									The card gets saved as a vCard file.
								{/if}
							</p>
							<ol
								class="m-0 list-decimal space-y-2 pl-5 text-[0.8125rem] leading-[1.5] text-[var(--text-muted)]"
							>
								<li class="pl-0.5">
									<button
										type="button"
										class="text-left underline underline-offset-4 transition-colors hover:text-[var(--text)] aria-disabled:cursor-not-allowed aria-disabled:opacity-45"
										aria-disabled={vcfOpening || loading}
										onclick={onGuideOpenContactClick}
									>
										{vcfOpening ? 'Preparing…' : 'Click here to open contact card'}
									</button>
								</li>
								{#each ADD_CONTACT_GUIDE_STEPS[addContactGuideMode] as step, i (i)}
									<li class="pl-0.5">{step}</li>
								{/each}
							</ol>
						</div>
					</details>

					<!-- reopen contact-->
				</div>

				<p
					class="m-0 mt-6 mb-3 text-[0.6875rem] font-medium tracking-[0.08em] text-[var(--text-muted)] uppercase"
				>
					Next steps
				</p>
				<div class="flex flex-col items-stretch gap-3">
					<button
						type="button"
						class={`btn-accent-primary btn-accent-primary--r-md relative flex min-h-12 w-full max-w-full min-w-0 items-center justify-center gap-2 overflow-hidden px-[1.35rem] py-[0.85rem] text-center text-[0.9375rem] font-semibold tracking-[0.02em] whitespace-normal text-[var(--accent-ink)] shadow-[var(--shadow-btn-primary)] transition-[transform,filter] duration-200 ease-out not-[aria-disabled=true]:hover:brightness-[1.06] not-[aria-disabled=true]:active:scale-[0.98] aria-disabled:cursor-not-allowed aria-disabled:opacity-45 aria-disabled:shadow-none ${savedActions.followupSent ? 'opacity-90' : ''}`}
						onclick={onFollowupCtaClick}
						aria-disabled={loading || !primaryEmail(contact)}
						title={!primaryEmail(contact)
							? 'Add at least one email address (Edit details)'
							: undefined}
					>
						{#if pulsingCta === 'followup'}
							{#key returnNudgeKey}
								<span class="cta-pulse" aria-hidden="true"></span>
							{/key}
						{/if}
						<svg
							class="h-[1.1em] w-[1.1em] shrink-0 opacity-90"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.75"
							stroke-linecap="round"
							stroke-linejoin="round"
							aria-hidden="true"
						>
							<path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Z" />
							<path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
						</svg>
						<span class="min-w-0"
							>{savedActions.followupSent ? 'Sent — send another' : 'Send follow-up email'}</span
						>
						{#if savedActions.followupSent}
							<svg
								class="h-[1.05em] w-[1.05em] shrink-0"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2.5"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-hidden="true"
							>
								<path d="m5 12 5 5L20 7" />
							</svg>
						{/if}
					</button>

					<button
						type="button"
						class={`relative flex min-h-12 w-full min-w-0 items-center justify-center gap-2 overflow-hidden rounded-[var(--radius-md)] border border-gray-400/80 bg-transparent px-[1.15rem] py-[0.85rem] text-center text-[0.9375rem] font-semibold whitespace-normal text-[var(--text-muted)] transition-[background,border-color,color] duration-200 ease-out not-[aria-disabled=true]:hover:border-[rgba(255,255,255,0.18)] not-[aria-disabled=true]:hover:text-[var(--text)] aria-disabled:cursor-not-allowed aria-disabled:opacity-45`}
						onclick={onLinkedInCtaClick}
						aria-disabled={loading || !canOpenLinkedInSearch(contact)}
						title={!canOpenLinkedInSearch(contact)
							? 'Add first name, last name, or company (Edit details)'
							: undefined}
					>
						{#if pulsingCta === 'linkedin'}
							{#key returnNudgeKey}
								<span class="cta-pulse" aria-hidden="true"></span>
							{/key}
						{/if}
						<svg
							class="h-[1.1em] w-[1.1em] shrink-0 opacity-90"
							viewBox="0 0 24 24"
							fill="currentColor"
							aria-hidden="true"
						>
							<path
								d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z"
							/>
						</svg>
						<span class="min-w-0"
							>{savedActions.linkedinOpened ? 'Opened on LinkedIn' : 'Connect on LinkedIn'}</span
						>
						{#if savedActions.linkedinOpened}
							<svg
								class="h-[1.05em] w-[1.05em] shrink-0"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2.5"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-hidden="true"
							>
								<path d="m5 12 5 5L20 7" />
							</svg>
						{/if}
					</button>
				</div>

				{#if vcfOpenError}
					<p class="m-0 mt-4 text-center text-[0.8125rem] leading-[1.4] text-[var(--danger)]">
						{vcfOpenError}
					</p>
				{/if}

				<div
					class="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[0.8125rem] font-medium text-[var(--text-muted)]"
				>
					<button
						type="button"
						class="underline underline-offset-4 transition-colors hover:text-[var(--text)] aria-disabled:cursor-not-allowed aria-disabled:opacity-45"
						onclick={onEditDetailsWhileBusyClick}
						aria-disabled={vcfOpening || loading}
					>
						Edit details
					</button>
					{#if savedViaSkip}
						<button
							type="button"
							class="underline underline-offset-4 transition-colors hover:text-[var(--text)] aria-disabled:cursor-not-allowed aria-disabled:opacity-45"
							onclick={onGuideOpenContactClick}
							aria-disabled={vcfOpening || loading}
						>
							{vcfOpening ? 'Preparing…' : 'Save to Contacts'}
						</button>
					{:else}
						<button
							type="button"
							class="underline underline-offset-4 transition-colors hover:text-[var(--text)] aria-disabled:cursor-not-allowed aria-disabled:opacity-45"
							onclick={onGuideOpenContactClick}
							aria-disabled={vcfOpening || loading}
						>
							{vcfOpening ? 'Preparing…' : 'Re-open in Contacts'}
						</button>
					{/if}
					<button
						type="button"
						class={`relative underline underline-offset-4 transition-colors hover:text-[var(--text)] ${pulsingCta === 'scan' ? 'text-[var(--accent)]' : ''}`}
						onclick={restartFlow}
					>
						{#if pulsingCta === 'scan'}
							{#key returnNudgeKey}
								<span class="cta-pulse cta-pulse-text" aria-hidden="true"></span>
							{/key}
						{/if}
						Scan another card
					</button>
				</div>
				<div class="min-h-10 w-full"></div>
			</section>
		{/if}

		{#if followupModalOpen}
			<div
				class="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
				role="presentation"
				onclick={(e) => e.target === e.currentTarget && closeFollowupModal()}
			>
				<div class="absolute inset-0 bg-black/55 backdrop-blur-[6px]" aria-hidden="true"></div>
				<div
					class="relative z-[1] flex max-h-[min(90dvh,32rem)] w-full max-w-[440px] flex-col rounded-t-[var(--radius-lg)] border border-[var(--border)] bg-[linear-gradient(165deg,rgba(24,24,30,0.98)_0%,rgba(12,12,15,0.99)_100%)] shadow-[0_-8px_48px_rgba(0,0,0,0.5),inset_0_0_0_1px_rgba(255,255,255,0.05)] sm:rounded-[var(--radius-lg)]"
					role="dialog"
					aria-modal="true"
					aria-labelledby="followup-dialog-title"
					aria-describedby="followup-dialog-desc"
				>
					<div
						class="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-4"
					>
						<div class="min-w-0">
							<h3
								id="followup-dialog-title"
								class="m-0 text-[1.05rem] font-semibold tracking-[-0.02em]"
							>
								Follow-up email
							</h3>
							<p
								id="followup-dialog-desc"
								class="m-0 mt-1 text-[0.8125rem] leading-[1.45] text-[var(--text-muted)]"
							>
								Pick a template. Your mail app opens with the recipient, subject, and message filled
								in — you can edit before sending.
							</p>
						</div>
						<button
							type="button"
							class="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-sm)] border border-white/10 bg-white/5 text-[var(--text-muted)] transition-[background,color] hover:bg-white/10 hover:text-[var(--text)]"
							onclick={closeFollowupModal}
							aria-label="Close"
						>
							<svg
								class="h-4 w-4"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								aria-hidden="true"
							>
								<path d="M18 6 6 18M6 6l12 12" />
							</svg>
						</button>
					</div>
					<div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-3">
						<p
							class="m-0 mb-2 text-[0.6875rem] font-medium tracking-[0.08em] text-[var(--text-muted)] uppercase"
						>
							Templates
						</p>
						{#if followupTemplatesLoading}
							<div class="flex justify-center py-8" role="status" aria-live="polite">
								<div
									class="h-9 w-9 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]"
								></div>
							</div>
						{:else if followupTemplates.length === 0}
							<p class="m-0 text-[0.875rem] text-[var(--text-muted)]">
								No templates available. Add some in Settings → Follow-up mail templates.
							</p>
						{:else}
							<div class="grid gap-2" role="listbox" aria-label="Email templates">
								{#each followupTemplates as tpl (tpl.id)}
									<button
										type="button"
										role="option"
										aria-selected={selectedFollowupId === tpl.id}
										class={`w-full rounded-[var(--radius-md)] border px-3.5 py-3 text-left transition-[border-color,background,box-shadow] duration-150 ${
											selectedFollowupId === tpl.id
												? 'border-[var(--accent)] bg-[var(--fill-accent-8)] shadow-[var(--ring-accent-inner)]'
												: 'border-[var(--border)] bg-white/[0.03] hover:border-[rgba(255,255,255,0.14)]'
										}`}
										onclick={() => (selectedFollowupId = tpl.id)}
									>
										<span class="block text-[0.9375rem] font-semibold text-[var(--text)]"
											>{tpl.label}</span
										>
										<span
											class="mt-0.5 block text-[0.8125rem] leading-[1.4] text-[var(--text-muted)]"
											>{tpl.description}</span
										>
										<span
											class="mt-1.5 block truncate text-[0.75rem] text-[var(--text-muted)] opacity-90"
											>Subject: {personalizeTemplate(tpl.subject)}</span
										>
									</button>
								{/each}
							</div>
						{/if}
					</div>
					<div
						class="flex shrink-0 flex-col-reverse gap-2 border-t border-[var(--border)] px-5 py-4 sm:flex-row sm:justify-end"
					>
						<button
							type="button"
							class="min-h-11 w-full rounded-[var(--radius-md)] border border-white/15 bg-transparent px-4 py-2.5 text-[0.875rem] font-semibold text-[var(--text)] sm:w-auto"
							onclick={closeFollowupModal}
						>
							Cancel
						</button>
						<button
							type="button"
							class="btn-accent-primary btn-accent-primary--r-md min-h-11 w-full px-4 py-2.5 text-[0.875rem] font-semibold text-[var(--accent-ink)] transition-[filter,transform] not-[aria-disabled=true]:hover:brightness-[1.06] not-[aria-disabled=true]:active:scale-[0.98] aria-disabled:cursor-not-allowed aria-disabled:opacity-45 sm:w-auto"
							onclick={onOpenMailAppClick}
							aria-disabled={!selectedFollowupId ||
								followupTemplatesLoading ||
								followupTemplates.length === 0}
						>
							Open in mail app
						</button>
					</div>
				</div>
			</div>
		{/if}
	</main>
{/if}

<style>
	.cta-pulse {
		position: absolute;
		inset: 0;
		border-radius: inherit;
		pointer-events: none;
		box-shadow: 0 0 0 0 var(--accent-pulse);
		animation: cta-pulse-ring 1.2s ease-out 1;
	}
	.cta-pulse-text {
		inset: -4px -8px;
	}
	@keyframes cta-pulse-ring {
		0% {
			box-shadow: 0 0 0 0 var(--accent-pulse);
		}
		100% {
			box-shadow: 0 0 0 14px rgba(0, 237, 255, 0);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.cta-pulse {
			animation: none;
		}
	}
	.add-contact-guide[open] .add-contact-guide__chevron {
		transform: rotate(180deg);
	}
</style>
