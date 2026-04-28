<script lang="ts">
	import CameraCapture from '$lib/components/scan/CameraCapture.svelte';
	import ContactForm from '$lib/components/scan/ContactForm.svelte';
	import ImagePreview from '$lib/components/scan/ImagePreview.svelte';
	import VcfDownloadButton from '$lib/components/scan/VcfDownloadButton.svelte';
	import { contactSchema, type Contact } from '$lib/contact';

	const emptyContact: Contact = {
		firstName: '',
		lastName: '',
		fullName: '',
		company: '',
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

	async function onCapture(file: File, mode: 'manual' | 'auto') {
		selectedFile = file;
		error = '';
		if (mode === 'auto') await scanImage(file);
	}

	function onFileChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		selectedFile = input.files?.[0] || null;
		error = '';
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

<main class="page">
	<header>
		<h1>Scan2Contact</h1>
		<p>Hold a business card in view, wait for auto-scan, then verify and export as .vcf.</p>
	</header>

	{#if offline}
		<p class="warn">You are offline. OCR requires an internet connection.</p>
	{/if}

	{#if step === 'capture'}
		<section class="card">
			<h2>1. Capture card</h2>
			<CameraCapture onCaptured={onCapture} autoStart={true} />

			<label class="upload">
				Upload image (alternative)
				<input type="file" accept="image/png,image/jpeg,image/webp" onchange={onFileChange} />
			</label>
			<!--
			<ImagePreview file={selectedFile} />
			<button
				type="button"
				onclick={() => scanImage()}
				disabled={!selectedFile || loading || offline}
			>
				Scan selected image
			</button>

			-->

			{#if error}
				<p class="error">{error}</p>
			{/if}
		</section>
	{:else if step === 'processing'}
		<section class="card processing">
			<h2>2. Processing card</h2>
			<div class="loader" aria-hidden="true"></div>
			<p>We are extracting text with OCR. This may take a few seconds.</p>
		</section>
	{:else}
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
		max-width: 52rem;
		margin: 0 auto;
		padding: 1rem;
		display: grid;
		gap: 1rem;
	}
	.card {
		padding: 1rem;
		border: 1px solid #e4e4e7;
		border-radius: 0.8rem;
		display: grid;
		gap: 0.8rem;
	}
	.upload {
		display: grid;
		gap: 0.35rem;
		font-weight: 600;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
	}
	button {
		width: fit-content;
		padding: 0.7rem 0.95rem;
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
	.error {
		color: #b91c1c;
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
</style>
