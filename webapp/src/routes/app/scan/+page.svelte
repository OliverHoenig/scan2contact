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
	/** Increments on each Scan tap to replay the short capture FX (keyed remount). */
	let scanBurstKey = $state(0);

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
		scanBurstKey += 1;
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
				<div class="absolute inset-x-0 top-0 z-0 h-[calc(100%-80px)] min-h-0">
					<CameraCapture
						bind:this={cameraRef}
						autoStart={true}
						fullBleed
						on:lightstate={(event: CustomEvent<{ supported: boolean; enabled: boolean }>) => {
							lightSupported = event.detail.supported;
							lightEnabled = event.detail.enabled;
						}}
					>
						{#snippet overlay()}
							<!-- Between video and hint: FX behind status label + frame -->
							<div class="scan-fx pointer-events-none absolute inset-0 overflow-hidden">
								<div class="scan-fx-idle-grid"></div>
								<div class="scan-fx-sweep"></div>
								{#if scanBurstKey > 0}
									{#key scanBurstKey}
										<div class="scan-fx-capture">
											<div class="scan-fx-capture-flash"></div>
											<div class="scan-fx-capture-line"></div>
										</div>
									{/key}
								{/if}
							</div>
						{/snippet}
					</CameraCapture>
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

<style>
	/*
	 * Sweep uses `top` (percent of the camera box), not translateY — translateY(%) is relative
	 * to the band’s own height, so it never crossed the full preview before.
	 */
	.scan-fx {
		inset: 0;
	}

	/* Continuous top → bottom; loop jumps back to start (no idle bar stuck mid/off-screen) */
	@keyframes scan-fx-sweep-y {
		0% {
			top: -14%;
		}
		100% {
			top: 100%;
		}
	}

	/* Irregular horizontal drift + blur (laser-ish; not perfectly periodic) */
	@keyframes scan-fx-sweep-aura {
		0%,
		100% {
			filter: blur(9px);
			opacity: 0.48;
			transform: translateY(-50%) translateX(-7%);
		}
		17% {
			filter: blur(15px);
			opacity: 0.64;
			transform: translateY(-50%) translateX(5%);
		}
		34% {
			filter: blur(21px);
			opacity: 0.76;
			transform: translateY(-50%) translateX(-3%);
		}
		52% {
			filter: blur(17px);
			opacity: 0.68;
			transform: translateY(-50%) translateX(8%);
		}
		71% {
			filter: blur(12px);
			opacity: 0.56;
			transform: translateY(-50%) translateX(-5%);
		}
		88% {
			filter: blur(19px);
			opacity: 0.72;
			transform: translateY(-50%) translateX(3%);
		}
	}

	/* Horizontal “laser” sweep: wide gradient, position jumps in uneven steps */
	@keyframes scan-fx-laser-x {
		0%,
		100% {
			background-position: 22% 50%;
		}
		13% {
			background-position: 68% 50%;
		}
		27% {
			background-position: 38% 50%;
		}
		41% {
			background-position: 91% 50%;
		}
		55% {
			background-position: 15% 50%;
		}
		69% {
			background-position: 77% 50%;
		}
		84% {
			background-position: 44% 50%;
		}
	}

	@keyframes scan-fx-grid-pulse {
		0%,
		100% {
			opacity: 0.07;
		}
		50% {
			opacity: 0.11;
		}
	}

	@keyframes scan-fx-capture-flash-kf {
		0% {
			opacity: 0;
		}
		14% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}

	@keyframes scan-fx-capture-line-kf {
		0% {
			top: -16%;
			opacity: 0;
		}
		15% {
			opacity: 1;
		}
		100% {
			top: 100%;
			opacity: 0;
		}
	}

	.scan-fx-idle-grid {
		position: absolute;
		inset: 0;
		background-image:
			linear-gradient(rgba(0, 234, 255, 0.42) 1px, transparent 1px),
			linear-gradient(90deg, rgba(0, 234, 255, 0.34) 1px, transparent 1px);
		background-size: 32px 32px;
		animation: scan-fx-grid-pulse 7s ease-in-out infinite;
		-webkit-mask-image: linear-gradient(to bottom, #000 0%, #000 70%, transparent 100%);
		mask-image: linear-gradient(to bottom, #000 0%, #000 70%, transparent 100%);
	}

	/* One crisp line + ::before soft halo (no extra gradient “wings” top/bottom) */
	.scan-fx-sweep {
		position: absolute;
		left: -8%;
		width: 116%;
		height: 14%;
		top: -14%;
		background: transparent;
		animation: scan-fx-sweep-y 2.75s cubic-bezier(0.42, 0.02, 0.58, 0.98) infinite;
		will-change: top;
	}

	.scan-fx-sweep::before {
		content: '';
		position: absolute;
		left: -4%;
		right: -4%;
		top: 50%;
		height: 220%;
		transform: translateY(-50%);
		border-radius: 999px;
		background: radial-gradient(
			ellipse 100% 48% at 50% 50%,
			rgba(0, 245, 255, 0.28) 0%,
			rgba(0, 220, 255, 0.09) 45%,
			transparent 72%
		);
		filter: blur(12px);
		opacity: 0.62;
		animation: scan-fx-sweep-aura 5.5s cubic-bezier(0.42, 0.02, 0.58, 0.98) infinite;
		pointer-events: none;
		will-change: transform, filter, opacity;
	}

	.scan-fx-sweep::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		top: 50%;
		height: 2px;
		transform: translateY(-50%);
		border-radius: 999px;
		background: linear-gradient(
			90deg,
			rgba(0, 160, 255, 0) 0%,
			rgba(0, 210, 255, 0.14) 34%,
			rgba(220, 240, 255, 0.32) 45%,
			rgba(0, 245, 255, 0.98) 50%,
			rgba(190, 210, 255, 0.22) 55%,
			rgba(0, 200, 255, 0.12) 66%,
			rgba(0, 160, 255, 0) 100%
		);
		background-size: 280% 100%;
		background-position: 22% 50%;
		background-repeat: no-repeat;
		box-shadow: 0 0 14px rgba(0, 234, 255, 0.42);
		animation: scan-fx-laser-x 5.5s cubic-bezier(0.45, 0.06, 0.55, 0.94) infinite;
		will-change: background-position;
	}

	.scan-fx-capture {
		position: absolute;
		inset: 0;
		z-index: 2;
		overflow: hidden;
	}

	.scan-fx-capture-flash {
		position: absolute;
		inset: 0;
		background:
			radial-gradient(ellipse 88% 58% at 50% 42%, rgba(0, 234, 255, 0.38), transparent 70%),
			linear-gradient(180deg, rgba(255, 255, 255, 0.12), transparent 55%);
		mix-blend-mode: screen;
		animation: scan-fx-capture-flash-kf 0.36s ease-out forwards;
	}

	.scan-fx-capture-line {
		position: absolute;
		left: -10%;
		width: 120%;
		height: 14%;
		top: -16%;
		background: transparent;
		animation: scan-fx-capture-line-kf 0.38s cubic-bezier(0.22, 1, 0.36, 1) forwards;
		will-change: top, opacity;
	}

	.scan-fx-capture-line::before {
		content: '';
		position: absolute;
		left: -3%;
		right: -3%;
		top: 50%;
		height: 200%;
		transform: translateY(-50%);
		border-radius: 999px;
		background: radial-gradient(
			ellipse 100% 45% at 50% 50%,
			rgba(0, 245, 255, 0.35) 0%,
			rgba(0, 220, 255, 0.12) 48%,
			transparent 70%
		);
		filter: blur(16px);
		opacity: 0.75;
		pointer-events: none;
	}

	.scan-fx-capture-line::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		top: 50%;
		height: 2px;
		transform: translateY(-50%);
		border-radius: 999px;
		background: linear-gradient(
			90deg,
			transparent,
			rgba(255, 255, 255, 0.5) 44%,
			rgba(0, 234, 255, 0.95) 50%,
			rgba(255, 255, 255, 0.5) 56%,
			transparent
		);
		box-shadow: 0 0 28px rgba(0, 234, 255, 0.48);
	}
</style>
