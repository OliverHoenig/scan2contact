<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import ContactForm from '$lib/components/scan/ContactForm.svelte';
	import VcfDownloadButton from '$lib/components/scan/VcfDownloadButton.svelte';
	import type { Contact } from '$lib/contact';
	import {
		clearReviewSession,
		isFollowupEligible,
		loadReviewSession,
		saveReviewSession,
		type ReviewSessionState
	} from '$lib/scan-flow/review-session';

	let hydrated = $state(false);
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

	onMount(() => {
		const s = loadReviewSession();
		if (!s) {
			void goto(resolve('/app/scan'));
			return;
		}
		if (isFollowupEligible(s)) {
			void goto(resolve('/app/followup'));
			return;
		}
		contact = s.contact;
		consentNotice = s.consentNotice;
		savedViaSkip = s.savedViaSkip;
		savedActions = s.savedActions;
		saveTriggeredAt = s.saveTriggeredAt;
		hydrated = true;
		storageReady = true;
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

	function handleSaveTriggered() {
		saveTriggeredAt = Date.now();
		savedViaSkip = false;
		if (contact) {
			saveReviewSession({
				contact,
				consentNotice,
				savedViaSkip: false,
				savedActions,
				saveTriggeredAt
			});
		}
		void goto(resolve('/app/followup'));
	}

	function skipToFollowup() {
		savedViaSkip = true;
		if (contact) {
			saveReviewSession({
				contact,
				consentNotice,
				savedViaSkip: true,
				savedActions,
				saveTriggeredAt
			});
		}
		void goto(resolve('/app/followup'));
	}

	function restartFlow() {
		clearReviewSession();
		void goto(resolve('/app/scan'));
	}
</script>

{#if hydrated && contact}
	<main
		class="m-auto grid min-h-0 w-full max-w-[600px] gap-5 px-5 py-6 pb-8 sm:px-6 sm:py-6"
	>
		<section class="flex flex-col">
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
				<VcfDownloadButton {contact} disabled={loading} onSaveTriggered={handleSaveTriggered} />
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
	</main>
{/if}
