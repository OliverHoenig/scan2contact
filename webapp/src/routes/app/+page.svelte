<script lang="ts">
	import CameraCapture from '$lib/components/scan/CameraCapture.svelte';
	import ContactForm from '$lib/components/scan/ContactForm.svelte';
	import VcfDownloadButton from '$lib/components/scan/VcfDownloadButton.svelte';
	import { contactSchema, type Contact } from '$lib/contact';

	const emptyContact: Contact = {
		firstName: '',
		lastName: '',
		company: '',
		role: '',
		title: '',
		emails: [],
		phones: [],
		website: '',
		address: '',
		notes: ''
	};

	let selectedFile = $state<File | null>(null);
	let contact = $state<Contact>({ ...emptyContact });
	let loading = $state(false);
	let error = $state('');
	let consentNotice = $state('');
	let offline = $state(false);
	let step = $state<'capture' | 'processing' | 'review'>('review');

	let cameraRef = $state<{
		captureFrame: () => Promise<File>;
		toggleLight?: () => Promise<void>;
	} | null>(null);
	let scanBusy = $state(false);
	let lightSupported = $state(false);
	let lightEnabled = $state(false);

	type FollowupTemplate = { id: string; label: string; description: string; subject: string; body: string };

	const followupTemplates: FollowupTemplate[] = [
		{
			id: 'stay-in-touch',
			label: 'Stay in touch',
			description: 'Short note after meeting someone new.',
			subject: 'Nice to meet you',
			body: 'Hi {firstName},\n\nIt was great meeting you. I would love to stay in touch.\n\nBest regards,'
		},
		{
			id: 'thank-you',
			label: 'Thank you',
			description: 'Thanks for their time.',
			subject: 'Thank you',
			body: 'Hi {firstName},\n\nThank you for your time today. I enjoyed our conversation.\n\nBest regards,'
		},
		{
			id: 'follow-up',
			label: 'Follow up',
			description: 'Suggest another conversation.',
			subject: 'Following up',
			body: 'Hi {firstName},\n\nFollowing up on our conversation — let me know if you would like to connect again.\n\nBest regards,'
		},
		{
			id: 'connect-linkedin',
			label: 'Connect on LinkedIn',
			description: 'Invite to connect professionally.',
			subject: 'Connection request',
			body: 'Hi {firstName},\n\nIt was great meeting you. I would like to connect here on LinkedIn as well.\n\nBest regards,'
		}
	];

	let followupModalOpen = $state(false);
	let selectedFollowupId = $state<string | null>(null);

	function primaryEmail(c: Contact): string | undefined {
		const raw = c.emails?.find((e) => e.trim().length > 0);
		return raw?.trim();
	}

	function personalizeTemplate(text: string): string {
		const name = contact.firstName?.trim() || 'there';
		return text.replaceAll('{firstName}', name);
	}

	function buildMailtoUrl(to: string, subject: string, body: string): string {
		const q = `subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
		return `mailto:${encodeURIComponent(to)}?${q}`;
	}

	function openFollowupModal() {
		selectedFollowupId = followupTemplates[0]?.id ?? null;
		followupModalOpen = true;
	}

	function closeFollowupModal() {
		followupModalOpen = false;
	}

	function openMailWithTemplate() {
		const to = primaryEmail(contact);
		if (!to || !selectedFollowupId) return;
		const tpl = followupTemplates.find((t) => t.id === selectedFollowupId);
		if (!tpl) return;
		const subject = personalizeTemplate(tpl.subject);
		const body = personalizeTemplate(tpl.body);
		window.location.href = buildMailtoUrl(to, subject, body);
		closeFollowupModal();
	}

	async function handleScan() {
		if (offline || scanBusy || loading) return;
		if (!cameraRef) {
			error = 'Camera is still loading — try again in a moment.';
			return;
		}
		scanBusy = true;
		error = '';
		try {
			const file = await cameraRef.captureFrame();
			await scanImage(file);
		} catch (unknownError) {
			error = unknownError instanceof Error ? unknownError.message : 'Scan failed';
		} finally {
			scanBusy = false;
		}
	}

	async function handleToggleLight() {
		await cameraRef?.toggleLight?.();
	}

	async function scanImage(fileOverride?: File) {
		const file = fileOverride ?? selectedFile;
		if (!file) return;
		selectedFile = file;
		step = 'processing';
		loading = true;
		error = '';
		try {
			const formData = new FormData();
			formData.append('image', file);
			const response = await fetch('/api/scan', { method: 'POST', body: formData });
			const payload = await response.json().catch(async () => ({
				error: `OCR failed (${response.status})`,
				hint: await response.text().catch(() => '')
			}));
			if (!response.ok) {
				const hint = payload.hint ? ` ${payload.hint}` : '';
				throw new Error((payload.error || 'OCR failed') + hint);
			}
			// Accept both response shapes and normalize through shared schema.
			const parsedContact = contactSchema.safeParse(payload?.contact ?? payload);
			if (!parsedContact.success) {
				throw new Error('OCR returned an invalid contact payload');
			}
			contact = parsedContact.data;
			consentNotice = payload.consentNotice || '';
			step = 'review';
		} catch (unknownError) {
			error = unknownError instanceof Error ? unknownError.message : 'Unknown error';
			step = 'capture';
		} finally {
			loading = false;
		}
	}

	function restartFlow() {
		step = 'capture';
		selectedFile = null;
		contact = { ...emptyContact };
		error = '';
		consentNotice = '';
	}

	if (typeof window !== 'undefined') {
		offline = !window.navigator.onLine;
		window.addEventListener('online', () => (offline = false));
		window.addEventListener('offline', () => (offline = true));
	}
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

<main
	class={`box-border ${step === 'capture' ? 'flex h-full min-h-0 w-full max-w-none flex-col overflow-hidden p-0' : 'm-auto grid min-h-0 w-full max-w-[600px] gap-5 px-5 py-6 pb-8'}`}
>
	{#if step === 'capture'}
		<section class="relative h-full min-h-0 overflow-hidden">
			{#if offline}
				<p
					class="absolute top-3 right-[0.85rem] left-[0.85rem] z-[21] m-0 rounded-[var(--radius-sm)] border border-[var(--warn-border)] bg-[var(--warn-bg)] px-3 py-[0.55rem] text-[0.8125rem] leading-[1.35] text-[var(--warn-text)]"
				>
					You are offline. OCR requires an internet connection.
				</p>
			{/if}
			<div class="absolute inset-0 z-0 h-[calc(100%-80px)]">
				<CameraCapture
					bind:this={cameraRef}
					autoStart={true}
					fullBleed
					on:lightstate={(event: CustomEvent<{ supported: boolean; enabled: boolean }>) => {
						lightSupported = event.detail.supported;
						lightEnabled = event.detail.enabled;
					}}
				/>
			</div>
			<div
				class="absolute right-0 bottom-0 left-0 z-[25] mb-6 box-border flex flex-nowrap items-center justify-center gap-3 bg-gradient-to-t from-[rgba(6,6,7,0.92)] via-[rgba(6,6,7,0.55)] to-transparent px-4 py-[0.65rem] backdrop-blur-[16px]"
			>
				<button
					type="button"
					class="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-gray-400/80 bg-[rgba(12,12,15,0.82)] text-[var(--text)] backdrop-blur-[12px] transition-[border-color,background,color,transform] duration-200 ease-out active:scale-[0.97] disabled:opacity-45"
					onclick={handleToggleLight}
					disabled={!lightSupported || offline || scanBusy || loading}
					aria-label={lightEnabled ? 'Turn light off' : 'Turn light on'}
					title={lightEnabled ? 'Turn light off' : 'Turn light on'}
				>
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
						stroke-linecap="round"
						stroke-linejoin="round"
						class={`h-5 w-5 ${lightEnabled ? 'text-[var(--accent)]' : ''}`}
						aria-hidden="true"
					>
						<path d="M10.5 3.75h3l1.1 4.3h-5.2l1.1-4.3Z" />
						<path
							d="M8.75 8.05h6.5v8.9a2.15 2.15 0 0 1-2.15 2.15h-2.2a2.15 2.15 0 0 1-2.15-2.15v-8.9Z"
						/>
						<path d="M9.5 12.1h5" />
					</svg>
				</button>
				<button
					type="button"
					class="min-h-12 w-full max-w-80 rounded-full border-0 bg-gradient-to-br from-[var(--accent)] to-[#2dd4bf] px-5 py-[0.65rem] text-[0.9375rem] font-semibold tracking-[0.03em] text-[var(--accent-ink)] uppercase shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12),0_4px_24px_rgba(45,212,191,0.25)] transition-[transform,box-shadow] duration-200 ease-out active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
					onclick={handleScan}
					disabled={offline || scanBusy || loading}
				>
					Scan
				</button>
			</div>
			{#if error}
				<p
					class="absolute top-3 right-3 left-3 z-[22] m-0 rounded-[var(--radius-sm)] border border-[rgba(248,113,113,0.35)] bg-[var(--danger-bg)] px-[0.7rem] py-[0.55rem] text-[0.8125rem] leading-[1.35] text-white backdrop-blur-[8px]"
				>
					{error}
				</p>
			{/if}
		</section>
	{/if}

	{#if step === 'processing'}
		<section
			class="grid justify-items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[linear-gradient(165deg,rgba(24,24,30,0.92)_0%,rgba(12,12,15,0.96)_100%)] px-5 py-[1.35rem] text-center shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04),0_24px_64px_rgba(0,0,0,0.45)] sm:px-6 sm:py-6"
		>
			<h2
				class="mt-[0.15rem] w-full justify-self-stretch text-left text-[1.35rem] font-semibold tracking-[-0.02em] sm:text-center"
			>
				Processing
			</h2>
			<div
				class="my-2 h-11 w-11 animate-spin rounded-full border-[3px] border-[var(--border)] border-t-[var(--accent)]"
				aria-hidden="true"
			></div>
			<p class="m-0 max-w-[26ch] text-[0.9375rem] leading-[1.5] text-[var(--text-muted)]">
				Extracting text with OCR. Usually a few seconds.
			</p>
		</section>
	{:else if step === 'review'}
		<section class="flex flex-col sm:px-6 sm:py-6">
			<h2 class="mt-[0.15rem] text-[1.35rem] font-semibold tracking-[-0.02em]">Review contact</h2>
			<p class="m-0 mb-16 text-[0.9375rem] leading-[1.5] text-[var(--text-muted)]">
				Check and correct fields before opening or sharing your contact.
			</p>
			{#if consentNotice}
				<p class="m-0 text-sm leading-[1.5] text-[var(--text-muted)]">{consentNotice}</p>
			{/if}
			<ContactForm bind:contact />
			<div class="mt-16 flex flex-col items-center gap-3 pt-1">
				<VcfDownloadButton {contact} disabled={loading} />
				<button
					type="button"
					class="flex min-h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] border-gray-400/80 bg-transparent px-[1.15rem] py-[0.85rem] text-[0.9375rem] font-semibold text-[var(--text-muted)] transition-[background,border-color,color] duration-200 ease-out hover:border-[rgba(255,255,255,0.18)] hover:text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-45"
					onclick={openFollowupModal}
					disabled={loading || !primaryEmail(contact)}
					title={!primaryEmail(contact) ? 'Add at least one email address above' : undefined}
				>
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
						<path
							d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Z"
						/>
						<path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
					</svg>
					Send follow-up email
				</button>
				<button
					type="button"
					class="min-h-12 w-full rounded-[var(--radius-md)] border border-[var(--border)] border-gray-400/80 bg-transparent px-[1.15rem] py-[0.85rem] text-[0.9375rem] font-semibold text-[var(--text-muted)] transition-[background,border-color,color] duration-200 ease-out hover:border-[rgba(255,255,255,0.18)] hover:text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-45"
					onclick={restartFlow}>Scan another card</button
				>
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
				<div class="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
					<div class="min-w-0">
						<h3 id="followup-dialog-title" class="m-0 text-[1.05rem] font-semibold tracking-[-0.02em]">
							Follow-up email
						</h3>
						<p id="followup-dialog-desc" class="m-0 mt-1 text-[0.8125rem] leading-[1.45] text-[var(--text-muted)]">
							Pick a template. Your mail app opens with the recipient, subject, and message filled in — you
							can edit before sending.
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
					<p class="m-0 mb-2 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-[var(--text-muted)]">
						Templates
					</p>
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
								<span class="block text-[0.9375rem] font-semibold text-[var(--text)]">{tpl.label}</span>
								<span class="mt-0.5 block text-[0.8125rem] leading-[1.4] text-[var(--text-muted)]"
									>{tpl.description}</span
								>
								<span class="mt-1.5 block truncate text-[0.75rem] text-[var(--text-muted)] opacity-90"
									>Subject: {personalizeTemplate(tpl.subject)}</span
								>
							</button>
						{/each}
					</div>
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
						disabled={!selectedFollowupId}
					>
						Open in mail app
					</button>
				</div>
			</div>
		</div>
	{/if}
</main>
