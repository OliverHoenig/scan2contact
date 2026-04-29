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
			<div class="capture-brand">
				<span class="capture-mark" aria-hidden="true"></span>
				<h1>Scan2Contact</h1>
			</div>
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
			<p class="eyebrow">Business card → vCard</p>
			<h1><span class="title-word">Scan</span><span class="title-word title-word--dim">2</span><span class="title-word">Contact</span></h1>
			<p class="lede">
				Point the camera at a card, tap Scan, then refine details and export a clean <code>.vcf</code>.
			</p>
		</header>

		{#if offline}
			<p class="warn">You are offline. OCR requires an internet connection.</p>
		{/if}
	{/if}

	{#if step === 'processing'}
		<section class="card processing">
			<p class="step-label">Step 2</p>
			<h2>Processing</h2>
			<div class="loader" aria-hidden="true"></div>
			<p class="processing-copy">Extracting text with OCR. Usually a few seconds.</p>
		</section>
	{:else if step === 'review'}
		<section class="card">
			<p class="step-label">Step 3</p>
			<h2>Review contact</h2>
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
		position: relative;
		width: min(100%, 36rem);
		margin: 0 auto;
		padding: 1.25rem 1.125rem 2rem;
		display: grid;
		gap: 1.25rem;
		min-height: 100dvh;
		box-sizing: border-box;
	}
	.page:not(.page--capture)::before {
		content: '';
		position: fixed;
		inset: 0;
		z-index: -1;
		pointer-events: none;
		background:
			radial-gradient(ellipse 120% 80% at 50% -30%, rgba(94, 234, 212, 0.09), transparent 55%),
			radial-gradient(ellipse 70% 50% at 100% 0%, rgba(99, 102, 241, 0.06), transparent 45%),
			var(--bg-base);
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
		padding: calc(0.55rem + env(safe-area-inset-top, 0px)) 1rem 1.25rem;
		background: linear-gradient(to bottom, rgba(6, 6, 7, 0.88) 0%, rgba(6, 6, 7, 0.35) 55%, transparent);
		pointer-events: none;
	}
	.capture-brand {
		display: flex;
		align-items: center;
		gap: 0.55rem;
	}
	.capture-mark {
		width: 0.45rem;
		height: 0.45rem;
		border-radius: var(--radius-pill);
		background: var(--accent);
		box-shadow: 0 0 18px var(--accent);
		flex-shrink: 0;
	}
	.capture-header h1 {
		margin: 0;
		font-size: 0.95rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		color: var(--text);
		text-shadow: 0 1px 12px rgba(0, 0, 0, 0.5);
	}
	.capture-offline {
		position: absolute;
		top: calc(env(safe-area-inset-top, 0px) + 3rem);
		left: 0.85rem;
		right: 0.85rem;
		z-index: 21;
		margin: 0;
		font-size: 0.8125rem;
		padding: 0.55rem 0.75rem;
		border-radius: var(--radius-sm);
		border: 1px solid var(--warn-border);
		background: var(--warn-bg);
		color: var(--warn-text);
		line-height: 1.35;
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
		padding: 0.65rem 1rem calc(0.65rem + env(safe-area-inset-bottom, 0px));
		background: linear-gradient(to top, rgba(6, 6, 7, 0.92) 0%, rgba(6, 6, 7, 0.55) 45%, transparent);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		box-sizing: border-box;
	}
	.toolbar-scan {
		width: 100%;
		max-width: 20rem;
		min-height: 3rem;
		padding: 0.65rem 1.25rem;
		font-size: 0.9375rem;
		font-weight: 600;
		letter-spacing: 0.03em;
		text-transform: uppercase;
		border-radius: var(--radius-pill);
		border: none;
		background: linear-gradient(145deg, var(--accent) 0%, #2dd4bf 100%);
		color: var(--accent-ink);
		box-shadow:
			0 0 0 1px rgba(255, 255, 255, 0.12) inset,
			0 4px 24px rgba(45, 212, 191, 0.25);
		transition:
			transform 0.2s var(--ease-out),
			box-shadow 0.2s var(--ease-out);
	}
	.toolbar-scan:not(:disabled):active {
		transform: scale(0.98);
	}
	.toolbar-scan:disabled {
		opacity: 0.4;
		box-shadow: none;
	}
	.capture-error {
		position: absolute;
		left: 0.75rem;
		right: 0.75rem;
		top: calc(env(safe-area-inset-top, 0px) + 3.15rem);
		z-index: 22;
		margin: 0;
		padding: 0.55rem 0.7rem;
		border-radius: var(--radius-sm);
		border: 1px solid rgba(248, 113, 113, 0.35);
		background: var(--danger-bg);
		backdrop-filter: blur(8px);
		color: #fff;
		font-size: 0.8125rem;
		line-height: 1.35;
	}
	.page-header {
		padding-top: 0.25rem;
	}
	.eyebrow {
		margin: 0 0 0.5rem;
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--accent);
	}
	.page-header h1 {
		margin: 0;
		font-size: clamp(2rem, 8vw, 2.65rem);
		font-weight: 700;
		line-height: 1.08;
		letter-spacing: -0.03em;
	}
	.title-word {
		display: inline;
	}
	.title-word--dim {
		color: var(--text-subtle);
		font-weight: 600;
	}
	.lede {
		margin: 1rem 0 0;
		font-size: 1.0625rem;
		font-weight: 400;
		color: var(--text-muted);
		max-width: 32ch;
		line-height: 1.55;
	}
	.lede code {
		font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', monospace;
		font-size: 0.9em;
		padding: 0.12em 0.35em;
		border-radius: 0.35rem;
		background: var(--bg-surface);
		border: 1px solid var(--border);
		color: var(--accent);
	}
	.step-label {
		margin: 0;
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--text-subtle);
	}
	.card h2 {
		margin: 0.15rem 0 0;
		font-size: 1.35rem;
		font-weight: 600;
		letter-spacing: -0.02em;
	}
	.card {
		padding: 1.35rem 1.25rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: linear-gradient(165deg, rgba(24, 24, 30, 0.92) 0%, rgba(12, 12, 15, 0.96) 100%);
		box-shadow:
			0 0 0 1px rgba(255, 255, 255, 0.04) inset,
			0 24px 64px rgba(0, 0, 0, 0.45);
		display: grid;
		gap: 1rem;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: center;
		padding-top: 0.25rem;
	}
	button {
		width: 100%;
		padding: 0.85rem 1.15rem;
		min-height: 3rem;
		border-radius: var(--radius-md);
		border: 1px solid var(--border-strong, var(--border));
		background: var(--bg-raised);
		color: var(--text);
		font-family: inherit;
		font-size: 0.9375rem;
		font-weight: 600;
		cursor: pointer;
		transition:
			background 0.2s var(--ease-out),
			border-color 0.2s var(--ease-out),
			color 0.2s var(--ease-out);
	}
	button:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.ghost {
		background: transparent;
		border-color: var(--border);
		color: var(--text-muted);
	}
	.ghost:hover:not(:disabled) {
		border-color: rgba(255, 255, 255, 0.18);
		color: var(--text);
	}
	.warn {
		margin: 0;
		color: var(--warn-text);
		background: var(--warn-bg);
		border: 1px solid var(--warn-border);
		padding: 0.75rem 0.9rem;
		border-radius: var(--radius-md);
		font-size: 0.9rem;
		line-height: 1.45;
	}
	.consent {
		margin: 0;
		color: var(--text-muted);
		font-size: 0.9375rem;
		line-height: 1.5;
	}
	.processing {
		justify-items: center;
		text-align: center;
	}
	.processing .step-label,
	.processing h2 {
		justify-self: stretch;
		text-align: left;
		width: 100%;
	}
	.processing .loader {
		margin: 0.5rem 0;
	}
	.processing-copy {
		margin: 0;
		color: var(--text-muted);
		font-size: 0.9375rem;
		max-width: 26ch;
		line-height: 1.5;
	}
	.loader {
		width: 2.75rem;
		height: 2.75rem;
		border-radius: var(--radius-pill);
		border: 3px solid var(--border);
		border-top-color: var(--accent);
		animation: spin 0.85s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	@media (min-width: 640px) {
		.page {
			width: min(100%, 44rem);
			padding: 2rem 1.5rem 3rem;
			gap: 1.5rem;
		}
		.card {
			padding: 1.5rem 1.5rem;
		}
		button {
			width: fit-content;
		}
		.processing {
			text-align: center;
		}
		.processing .step-label,
		.processing h2 {
			text-align: center;
		}
	}
</style>
