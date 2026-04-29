<script lang="ts">
	import CameraCapture from '$lib/components/scan/CameraCapture.svelte';
	import ContactForm from '$lib/components/scan/ContactForm.svelte';
	import VcfDownloadButton from '$lib/components/scan/VcfDownloadButton.svelte';
	import { contactSchema, type Contact } from '$lib/contact';

	const emptyContact: Contact = {
		firstName: '',
		lastName: '',
		fullName: '',
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
	let step = $state<'capture' | 'processing' | 'review'>('capture');

	let cameraRef = $state<{ captureFrame: () => Promise<File> } | null>(null);
	let scanBusy = $state(false);

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

	$effect(() => {
		if (typeof document === 'undefined') return;
		if (step !== 'capture') return;
		const html = document.documentElement;
		const body = document.body;
		const prevHtml = html.style.overflow;
		const prevBody = body.style.overflow;
		html.style.overflow = 'hidden';
		body.style.overflow = 'hidden';
		return () => {
			html.style.overflow = prevHtml;
			body.style.overflow = prevBody;
		};
	});
</script>

<main
	class={`m-auto box-border flex h-full min-h-dvh max-w-[600px] flex-col ${step === 'capture' ? 'fixed inset-0 z-[1] m-0 block h-dvh max-h-dvh overflow-hidden p-0' : 'mx-auto grid gap-5 p-5 pb-8'}`}
>
	{#if step === 'capture'}
		<section class="h-full overflow-hidden">
			{#if offline}
				<p
					class="absolute top-[calc(env(safe-area-inset-top,0px)+3rem)] right-[0.85rem] left-[0.85rem] z-[21] m-0 rounded-[var(--radius-sm)] border border-[var(--warn-border)] bg-[var(--warn-bg)] px-3 py-[0.55rem] text-[0.8125rem] leading-[1.35] text-[var(--warn-text)]"
				>
					You are offline. OCR requires an internet connection.
				</p>
			{/if}
			<div class="absolute inset-0 z-0 h-[calc(100%-70px)]">
				<CameraCapture bind:this={cameraRef} autoStart={true} fullBleed />
			</div>
			<div
				class="absolute right-0 bottom-0 left-0 z-[25] box-border flex flex-nowrap items-center justify-center bg-gradient-to-t from-[rgba(6,6,7,0.92)] via-[rgba(6,6,7,0.55)] to-transparent px-4 py-[0.65rem] pb-[calc(0.65rem+env(safe-area-inset-bottom,0px))] backdrop-blur-[16px]"
			>
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
					class="absolute top-[calc(env(safe-area-inset-top,0px)+3.15rem)] right-3 left-3 z-[22] m-0 rounded-[var(--radius-sm)] border border-[rgba(248,113,113,0.35)] bg-[var(--danger-bg)] px-[0.7rem] py-[0.55rem] text-[0.8125rem] leading-[1.35] text-white backdrop-blur-[8px]"
				>
					{error}
				</p>
			{/if}
		</section>
	{:else}
		<header class="pt-1">
			<p
				class="mt-0 mb-2 text-[0.6875rem] font-semibold tracking-[0.2em] text-[var(--accent)] uppercase"
			>
				Business card → vCard
			</p>
			<h1 class="m-0 text-[clamp(2rem,8vw,2.65rem)] leading-[1.08] font-bold tracking-[-0.03em]">
				<span class="inline">Scan</span><span class="inline font-semibold text-[var(--text-subtle)]"
					>2</span
				><span class="inline">Contact</span>
			</h1>
			<p
				class="mt-4 max-w-[32ch] text-[1.0625rem] leading-[1.55] font-normal text-[var(--text-muted)]"
			>
				Point the camera at a card, tap Scan, then refine details and export a clean <code
					class="rounded-[0.35rem] border border-[var(--border)] bg-[var(--bg-surface)] px-[0.35em] py-[0.12em] font-mono text-[0.9em] text-[var(--accent)]"
					>.vcf</code
				>.
			</p>
		</header>

		{#if offline}
			<p
				class="m-0 rounded-[var(--radius-md)] border border-[var(--warn-border)] bg-[var(--warn-bg)] px-[0.9rem] py-3 text-[0.9rem] leading-[1.45] text-[var(--warn-text)]"
			>
				You are offline. OCR requires an internet connection.
			</p>
		{/if}
	{/if}

	{#if step === 'processing'}
		<section
			class="grid justify-items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[linear-gradient(165deg,rgba(24,24,30,0.92)_0%,rgba(12,12,15,0.96)_100%)] px-5 py-[1.35rem] text-center shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04),0_24px_64px_rgba(0,0,0,0.45)] sm:px-6 sm:py-6"
		>
			<p
				class="m-0 w-full justify-self-stretch text-left text-[0.6875rem] font-semibold tracking-[0.18em] text-[var(--text-subtle)] uppercase sm:text-center"
			>
				Step 2
			</p>
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
		<section
			class="grid gap-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[linear-gradient(165deg,rgba(24,24,30,0.92)_0%,rgba(12,12,15,0.96)_100%)] px-5 py-[1.35rem] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04),0_24px_64px_rgba(0,0,0,0.45)] sm:px-6 sm:py-6"
		>
			<p
				class="m-0 text-[0.6875rem] font-semibold tracking-[0.18em] text-[var(--text-subtle)] uppercase"
			>
				Step 3
			</p>
			<h2 class="mt-[0.15rem] text-[1.35rem] font-semibold tracking-[-0.02em]">Review contact</h2>
			<p class="m-0 text-[0.9375rem] leading-[1.5] text-[var(--text-muted)]">
				Check and correct fields before downloading your vCard.
			</p>
			{#if consentNotice}
				<p class="m-0 text-[0.9375rem] leading-[1.5] text-[var(--text-muted)]">{consentNotice}</p>
			{/if}
			<ContactForm bind:contact />
			<div class="flex flex-wrap items-center gap-3 pt-1">
				<VcfDownloadButton {contact} disabled={loading} />
				<button
					type="button"
					class="min-h-12 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-transparent px-[1.15rem] py-[0.85rem] text-[0.9375rem] font-semibold text-[var(--text-muted)] transition-[background,border-color,color] duration-200 ease-out hover:border-[rgba(255,255,255,0.18)] hover:text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-45 sm:w-fit"
					onclick={restartFlow}>Scan another card</button
				>
			</div>
		</section>
	{/if}
</main>
