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
	const RETURN_NUDGE_WINDOW_MS = 60 * 1000;

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
			if (
				!selectedFollowupId ||
				!followupTemplates.some((t) => t.id === selectedFollowupId)
			) {
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

{#if hydrated && contact}
	<main
		class={`m-auto grid min-h-0 w-full max-w-[600px] gap-5 px-5 py-6 pb-8 ${reviewStage === 'edit' ? 'sm:px-6 sm:py-6' : ''}`}
	>
		{#if reviewStage === 'edit'}
			<section class="flex flex-col sm:px-6 sm:py-6">
				<h2 class="mt-[0.15rem] text-[1.35rem] font-semibold tracking-[-0.02em]">Review contact</h2>
				<p class="m-0 mb-10 text-[0.9375rem] leading-[1.5] text-[var(--text-muted)]">
					Check and correct fields, then save the contact to your phone — or skip straight to follow-up
					options below.
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
			</section>
		{:else}
			<section class="flex flex-col sm:px-6 sm:py-6">
				<div
					class="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[linear-gradient(165deg,rgba(24,24,30,0.92)_0%,rgba(12,12,15,0.96)_100%)] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04),0_24px_64px_rgba(0,0,0,0.45)]"
				>
					{#if !savedViaSkip}
						<div class="flex items-start gap-3">
							<span
								class="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[rgba(45,212,191,0.18)] text-[var(--accent)]"
								aria-hidden="true"
							>
								<svg
									class="h-4 w-4"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2.5"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d="m5 12 5 5L20 7" />
								</svg>
							</span>
							<div class="min-w-0">
								<h2 class="m-0 text-[1.15rem] font-semibold tracking-[-0.02em]">Saved</h2>
								<p class="m-0 mt-0.5 text-[0.875rem] leading-[1.45] text-[var(--text-muted)]">
									The contact should now appear in your phone’s Contacts app.
								</p>
							</div>
						</div>
					{:else}
						<div>
							<h2 class="m-0 text-[1.15rem] font-semibold tracking-[-0.02em]">What next?</h2>
							<p class="m-0 mt-0.5 text-[0.875rem] leading-[1.45] text-[var(--text-muted)]">
								You haven’t saved this contact yet — pick what to do.
							</p>
						</div>
					{/if}

					<div class="mt-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-white/[0.03] p-3">
						<p class="m-0 truncate text-[0.9375rem] font-semibold text-[var(--text)]">
							{(`${contact.firstName ?? ''} ${contact.lastName ?? ''}`).trim() || 'Unnamed contact'}
						</p>
						{#if contact.title || contact.role || contact.company}
							<p class="m-0 mt-0.5 truncate text-[0.8125rem] text-[var(--text-muted)]">
								{[contact.title || contact.role, contact.company].filter(Boolean).join(' · ')}
							</p>
						{/if}
						{#if primaryEmail(contact) || contact.phones?.[0]}
							<p class="m-0 mt-1.5 truncate text-[0.75rem] text-[var(--text-muted)] opacity-90">
								{[primaryEmail(contact), contact.phones?.[0]].filter(Boolean).join(' · ')}
							</p>
						{/if}
					</div>
				</div>

				<p
					class="m-0 mt-6 mb-3 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-[var(--text-muted)]"
				>
					Next steps
				</p>
				<div class="flex flex-col items-stretch gap-3">
					<button
						type="button"
						class={`relative flex min-h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-[var(--radius-md)] border-0 bg-[linear-gradient(145deg,var(--accent)_0%,#2dd4bf_100%)] px-[1.35rem] py-[0.85rem] text-[0.9375rem] font-semibold tracking-[0.02em] text-[var(--accent-ink)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12),0_6px_28px_rgba(45,212,191,0.22)] transition-[transform,filter] duration-200 ease-out hover:enabled:brightness-[1.06] active:enabled:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none ${savedActions.followupSent ? 'opacity-90' : ''}`}
						onclick={openFollowupModal}
						disabled={loading || !primaryEmail(contact)}
						title={!primaryEmail(contact) ? 'Add at least one email address (Edit details)' : undefined}
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
						{savedActions.followupSent ? 'Sent — send another' : 'Send follow-up email'}
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
						class={`relative flex min-h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-[var(--radius-md)] border border-gray-400/80 bg-transparent px-[1.15rem] py-[0.85rem] text-[0.9375rem] font-semibold text-[var(--text-muted)] transition-[background,border-color,color] duration-200 ease-out hover:enabled:border-[rgba(255,255,255,0.18)] hover:enabled:text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-45`}
						onclick={openLinkedInSearch}
						disabled={loading || !canOpenLinkedInSearch(contact)}
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
						{savedActions.linkedinOpened ? 'Opened on LinkedIn' : 'Connect on LinkedIn'}
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
						class="underline underline-offset-4 transition-colors hover:text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-45"
						onclick={backToEdit}
						disabled={vcfOpening || loading}
					>
						Edit details
					</button>
					{#if savedViaSkip}
						<button
							type="button"
							class="underline underline-offset-4 transition-colors hover:text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-45"
							onclick={() => void openContactInContactsApp()}
							disabled={vcfOpening || loading}
						>
							{vcfOpening ? 'Preparing…' : 'Save to Contacts'}
						</button>
					{:else}
						<button
							type="button"
							class="underline underline-offset-4 transition-colors hover:text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-45"
							onclick={() => void openContactInContactsApp()}
							disabled={vcfOpening || loading}
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
							class="m-0 mb-2 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-[var(--text-muted)]"
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
												? 'border-[var(--accent)] bg-[rgba(45,212,191,0.08)] shadow-[inset_0_0_0_1px_rgba(45,212,191,0.25)]'
												: 'border-[var(--border)] bg-white/[0.03] hover:border-[rgba(255,255,255,0.14)]'
										}`}
										onclick={() => (selectedFollowupId = tpl.id)}
									>
										<span class="block text-[0.9375rem] font-semibold text-[var(--text)]"
											>{tpl.label}</span
										>
										<span class="mt-0.5 block text-[0.8125rem] leading-[1.4] text-[var(--text-muted)]"
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
							class="min-h-11 w-full rounded-[var(--radius-md)] border-0 bg-[linear-gradient(145deg,var(--accent)_0%,#2dd4bf_100%)] px-4 py-2.5 text-[0.875rem] font-semibold text-[var(--accent-ink)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)] transition-[filter,transform] hover:brightness-[1.06] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
							onclick={openMailWithTemplate}
							disabled={!selectedFollowupId || followupTemplatesLoading || followupTemplates.length === 0}
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
		box-shadow: 0 0 0 0 rgba(45, 212, 191, 0.55);
		animation: cta-pulse-ring 1.2s ease-out 1;
	}
	.cta-pulse-text {
		inset: -4px -8px;
	}
	@keyframes cta-pulse-ring {
		0% {
			box-shadow: 0 0 0 0 rgba(45, 212, 191, 0.55);
		}
		100% {
			box-shadow: 0 0 0 14px rgba(45, 212, 191, 0);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.cta-pulse {
			animation: none;
		}
	}
</style>
