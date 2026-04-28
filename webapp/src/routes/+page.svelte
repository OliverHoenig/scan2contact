<script lang="ts">
	import CameraCapture from '$lib/components/scan/CameraCapture.svelte';
	import ContactForm from '$lib/components/scan/ContactForm.svelte';
	import ImagePreview from '$lib/components/scan/ImagePreview.svelte';
	import VcfDownloadButton from '$lib/components/scan/VcfDownloadButton.svelte';
	import type { Contact } from '$lib/contact';

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

	async function onCapture(file: File, mode: 'manual' | 'auto') {
		selectedFile = file;
		error = '';
		if (mode === 'auto') {
			await scanImage(file);
		}
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
			contact = payload.contact;
			consentNotice = payload.consentNotice || '';
		} catch (unknownError) {
			error = unknownError instanceof Error ? unknownError.message : 'Unknown error';
		} finally {
			loading = false;
		}
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
		<p>Capture a business card, review the recognized fields, then export a .vcf file.</p>
	</header>

	{#if offline}
		<p class="warn">You are offline. OCR requires an internet connection.</p>
	{/if}

	<section class="card">
		<CameraCapture onCaptured={onCapture} />
		<p class="consent">By scanning, you consent that the image is sent to the configured OCR backend provider.</p>
		<label class="upload">
			Upload image
			<input type="file" accept="image/png,image/jpeg,image/webp" onchange={onFileChange} />
		</label>
		<ImagePreview file={selectedFile} />
		<button type="button" onclick={() => scanImage()} disabled={!selectedFile || loading || offline}>
			{#if loading}Extracting...{:else}Scan card{/if}
		</button>
		{#if error}
			<p class="error">{error}</p>
		{/if}
		{#if consentNotice}
			<p class="consent">{consentNotice}</p>
		{/if}
	</section>

	<section class="card">
		<h2>Review contact fields</h2>
		<ContactForm bind:contact />
		<VcfDownloadButton {contact} disabled={loading} />
	</section>
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
</style>
