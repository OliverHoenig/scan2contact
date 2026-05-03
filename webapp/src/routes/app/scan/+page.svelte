<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import CameraCapture from '$lib/components/scan/CameraCapture.svelte';
	import { contactSchema } from '$lib/contact';
	import { appendCreatedTimestampToNotes } from '$lib/format-contact-created';
	import { loadReviewSession, saveReviewSession, type ReviewSessionState } from '$lib/scan-flow/review-session';

	let resumeChecked = $state(false);
	let selectedFile = $state<File | null>(null);
	let loading = $state(false);
	let error = $state('');
	let offline = $state(false);
	let step = $state<'capture' | 'processing'>('capture');

	let cameraRef = $state<{
		captureFrame: () => Promise<File>;
		toggleLight?: () => Promise<void>;
	} | null>(null);
	let scanBusy = $state(false);
	let lightSupported = $state(false);
	let lightEnabled = $state(false);

	if (typeof window !== 'undefined') {
		offline = !window.navigator.onLine;
		window.addEventListener('online', () => (offline = false));
		window.addEventListener('offline', () => (offline = true));
	}

	onMount(() => {
		try {
			if (loadReviewSession()) {
				void goto(resolve('/app/contact'));
			}
		} finally {
			resumeChecked = true;
		}
	});

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
			const parsedContact = contactSchema.safeParse(payload?.contact ?? payload);
			if (!parsedContact.success) {
				throw new Error('OCR returned an invalid contact payload');
			}
			const data = parsedContact.data;
			const next: ReviewSessionState = {
				contact: {
					...data,
					notes: appendCreatedTimestampToNotes(data.notes)
				},
				consentNotice: payload.consentNotice || '',
				savedViaSkip: false,
				savedActions: { followupSent: false, linkedinOpened: false },
				saveTriggeredAt: null
			};
			saveReviewSession(next);
			void goto(resolve('/app/contact'));
		} catch (unknownError) {
			error = unknownError instanceof Error ? unknownError.message : 'Unknown error';
			step = 'capture';
		} finally {
			loading = false;
		}
	}
</script>

{#if !resumeChecked}
	<main
		class="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-5 py-10 text-center"
		aria-busy="true"
	>
		<div
			class="h-9 w-9 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]"
			aria-hidden="true"
		></div>
		<p class="m-0 text-[0.9375rem] text-[var(--text-muted)]">Opening scanner…</p>
	</main>
{:else}
	<main
		class={`box-border ${step === 'capture' ? 'flex min-h-0 flex-1 flex-col overflow-hidden p-0' : 'm-auto grid min-h-0 w-full min-w-0 max-w-[600px] gap-5 py-6 pb-8 pl-[max(1.25rem,env(safe-area-inset-left,0px))] pr-[max(1.25rem,env(safe-area-inset-right,0px))]'}`}
	>
		{#if step === 'capture'}
			<section class="relative min-h-0 flex-1 overflow-hidden">
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
					class="absolute right-0 bottom-0 left-0 z-[25] mb-6 box-border flex flex-nowrap items-center justify-center gap-3 bg-gradient-to-t from-[rgba(5,5,7,0.94)] via-[rgba(5,5,7,0.55)] to-transparent px-4 py-[0.65rem] backdrop-blur-[16px]"
				>
					<button
						type="button"
						class="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text)] shadow-[0_0_24px_-8px_rgba(0,0,0,0.5)] backdrop-blur-[12px] transition-[border-color,background,color,transform] duration-200 ease-out active:scale-[0.97] disabled:opacity-45"
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
						class="min-h-12 w-full max-w-80 rounded-full border-0 bg-gradient-to-br from-[var(--accent)] to-[var(--accent-end)] px-5 py-[0.65rem] text-[0.9375rem] font-semibold tracking-[0.03em] text-[var(--accent-ink)] uppercase shadow-[var(--shadow-btn-primary-sm)] transition-[transform,box-shadow] duration-200 ease-out active:scale-[0.98] disabled:opacity-40 disabled:shadow-none"
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
				class="grid justify-items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[linear-gradient(165deg,rgba(14,32,52,0.92)_0%,rgba(5,13,22,0.96)_100%)] px-5 py-[1.35rem] text-center shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04),0_24px_64px_rgba(0,0,0,0.45)] sm:px-6 sm:py-6"
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
		{/if}
	</main>
{/if}
