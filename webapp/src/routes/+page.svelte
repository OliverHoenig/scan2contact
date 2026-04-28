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

<main class="page" class:page--capture={step === 'capture'}>
	{#if step === 'capture'}
		<header class="capture-header">
			<h1>Scan2Contact</h1>
		</header>
		{#if offline}
			<p class="capture-offline warn">You are offline. OCR requires an internet connection.</p>
		{/if}
		<div
			class="capture-scanner"
			style="--capture-bottom-toolbar: calc(2.95rem + env(safe-area-inset-bottom, 0px));"
		>
			<CameraCapture bind:this={cameraRef} autoStart={true} fullBleed />
		</div>
		<div class="capture-toolbar">
			<button
				type="button"
				class="toolbar-scan"
				onclick={handleScan}
				disabled={offline || scanBusy || loading}
			>
				Scan
			</button>
		</div>
		{#if error}
			<p class="capture-error">{error}</p>
		{/if}
	{:else}
		<header class="page-header">
			<h1>Scan2Contact</h1>
			<p>Point the camera at a business card, press Scan, then verify and export as .vcf.</p>
		</header>

		{#if offline}
			<p class="warn">You are offline. OCR requires an internet connection.</p>
		{/if}
	{/if}

	{#if step === 'processing'}
		<section class="card processing">
			<h2>2. Processing card</h2>
			<div class="loader" aria-hidden="true"></div>
			<p>We are extracting text with OCR. This may take a few seconds.</p>
		</section>
	{:else if step === 'review'}
		<section class="card">
			<h2>3. Review extracted contact</h2>
			<p class="consent">Check and correct fields before downloading your vCard.</p>
			{#if consentNotice}
				<p class="consent">{consentNotice}</p>
			{/if}
			<ContactForm bind:contact />
			<div class="actions">
				<VcfDownloadButton {contact} disabled={loading} />
				<button type="button" class="ghost" onclick={restartFlow}>Scan another card</button>
			</div>
		</section>
	{/if}
</main>

<style>
	.page {
		width: min(100%, 34rem);
		margin: 0 auto;
		padding: 0.875rem;
		display: grid;
		gap: 0.875rem;
		min-height: 100dvh;
		box-sizing: border-box;
	}
	.page--capture {
		position: fixed;
		inset: 0;
		width: 100%;
		max-width: none;
		height: 100dvh;
		max-height: 100dvh;
		margin: 0;
		padding: 0;
		overflow: hidden;
		display: block;
		z-index: 1;
	}
	.capture-header {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		z-index: 20;
		padding: calc(0.45rem + env(safe-area-inset-top, 0px)) 0.75rem 0.65rem;
		background: linear-gradient(to bottom, rgba(0, 0, 0, 0.62), transparent);
		pointer-events: none;
	}
	.capture-header h1 {
		margin: 0;
		font-size: 1.05rem;
		font-weight: 700;
		color: #fafafa;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
	}
	.capture-offline {
		position: absolute;
		top: calc(env(safe-area-inset-top, 0px) + 2.6rem);
		left: 0.65rem;
		right: 0.65rem;
		z-index: 21;
		margin: 0;
		font-size: 0.82rem;
		padding: 0.45rem 0.55rem;
	}
	.capture-scanner {
		position: absolute;
		inset: 0;
		z-index: 0;
	}
	.capture-toolbar {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 25;
		display: flex;
		flex-wrap: nowrap;
		align-items: center;
		justify-content: center;
		padding: 0.4rem 0.75rem calc(0.4rem + env(safe-area-inset-bottom, 0px));
		background: linear-gradient(to top, rgba(0, 0, 0, 0.72), rgba(0, 0, 0, 0.2));
		backdrop-filter: blur(10px);
		box-sizing: border-box;
	}
	.toolbar-scan {
		width: 100%;
		max-width: 20rem;
		min-height: 2.65rem;
		padding: 0.55rem 1rem;
		font-size: 1rem;
		border-radius: 0.55rem;
		border: 1px solid #fafafa;
		background: #fafafa;
		color: #18181b;
		font-weight: 700;
	}
	.toolbar-scan:disabled {
		opacity: 0.45;
	}
	.capture-error {
		position: absolute;
		left: 0.6rem;
		right: 0.6rem;
		top: calc(env(safe-area-inset-top, 0px) + 2.75rem);
		z-index: 22;
		margin: 0;
		padding: 0.45rem 0.55rem;
		border-radius: 0.45rem;
		background: rgba(127, 29, 29, 0.92);
		color: #fff;
		font-size: 0.82rem;
		line-height: 1.3;
	}
	.page-header h1 {
		margin: 0;
		font-size: clamp(1.45rem, 6vw, 1.95rem);
	}
	.page-header p {
		margin: 0.35rem 0 0;
		font-size: 0.98rem;
		color: #3f3f46;
	}
	.card {
		padding: 0.95rem;
		border: 1px solid #e4e4e7;
		border-radius: 0.8rem;
		display: grid;
		gap: 0.8rem;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
	}
	button {
		width: 100%;
		padding: 0.8rem 1rem;
		min-height: 2.9rem;
		border-radius: 0.55rem;
		border: 1px solid #18181b;
		background: #18181b;
		color: #fff;
		font-weight: 700;
	}
	button:disabled {
		opacity: 0.5;
	}
	.ghost {
		background: transparent;
		color: #18181b;
	}
	.warn {
		color: #92400e;
		background: #fef3c7;
		padding: 0.6rem;
		border-radius: 0.55rem;
	}
	.consent {
		color: #3f3f46;
		font-size: 0.92rem;
	}
	.processing {
		justify-items: center;
		text-align: center;
	}
	.loader {
		width: 3rem;
		height: 3rem;
		border-radius: 9999px;
		border: 4px solid #e4e4e7;
		border-top-color: #18181b;
		animation: spin 0.9s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	@media (min-width: 640px) {
		.page {
			width: min(100%, 46rem);
			padding: 1.1rem;
			gap: 1rem;
		}
		.card {
			padding: 1rem;
		}
		button {
			width: fit-content;
		}
	}
</style>
