<script lang="ts">
	import type { Contact } from '$lib/contact';

	let {
		contact,
		disabled = false,
		onSaveTriggered,
		onAfterShare
	}: {
		contact: Contact;
		disabled?: boolean;
		/** Called after vCard is ready (primary) or after share/download finishes (secondary). */
		onSaveTriggered?: () => void;
		/** Optional extra step after share (e.g. client-side navigate) without racing the vCard fetch. */
		onAfterShare?: () => void;
	} = $props();
	let loading = $state(false);
	let error = $state('');
	let cachedVcf = $state<{ blob: Blob; filename: string } | null>(null);
	const primaryButtonClass =
		'w-full min-h-12 cursor-pointer rounded-[var(--radius-md)] border-0 bg-[linear-gradient(145deg,var(--accent)_0%,var(--accent-end)_100%)] px-[1.35rem] py-[0.85rem] text-[0.9375rem] font-semibold tracking-[0.02em] text-[var(--accent-ink)] shadow-[var(--shadow-btn-primary)] transition-[transform,filter] duration-200 ease-out not-[aria-disabled=true]:hover:brightness-[1.06] not-[aria-disabled=true]:active:scale-[0.98] aria-disabled:cursor-not-allowed aria-disabled:opacity-45 aria-disabled:shadow-none';
	const secondaryButtonClass =
		'min-h-9 w-full cursor-pointer rounded-[var(--radius-sm)] border-0 bg-transparent px-2 py-1.5 text-[0.8125rem] font-medium text-[var(--text-muted)] underline-offset-4 shadow-none transition-colors duration-150 not-[aria-disabled=true]:hover:text-[var(--text)] not-[aria-disabled=true]:hover:underline aria-disabled:cursor-not-allowed aria-disabled:opacity-45';
	const errorClass = 'mt-2 text-[0.875rem] leading-[1.4] text-[var(--danger)]';

	function triggerBlobDownload(blob: Blob, filename: string) {
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = filename;
		document.body.appendChild(anchor);
		anchor.click();
		document.body.removeChild(anchor);
		URL.revokeObjectURL(url);
	}

	async function fetchVcf(): Promise<{ blob: Blob; filename: string }> {
		if (cachedVcf) return cachedVcf;

		const response = await fetch('/api/vcf', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ contact })
		});

		if (!response.ok) {
			throw new Error('Failed to generate vCard');
		}

		const blob = await response.blob();
		const disposition = response.headers.get('Content-Disposition') || '';
		const filename = disposition.match(/filename="(.+)"/i)?.[1] || 'contact.vcf';
		cachedVcf = { blob, filename };
		return cachedVcf;
	}

	async function shareOrDownloadVcf(blob: Blob, filename: string) {
		const type = blob.type || 'text/vcard';
		const file = new File([blob], filename, { type });
		const shareData: ShareData = {
			files: [file],
			title: 'Contact',
			text: filename.replace(/\.vcf$/i, '')
		};

		if (typeof navigator.share !== 'function') {
			triggerBlobDownload(blob, filename);
			return;
		}
		if (typeof navigator.canShare === 'function' && !navigator.canShare(shareData)) {
			triggerBlobDownload(blob, filename);
			return;
		}
		try {
			await navigator.share(shareData);
		} catch (unknownError) {
			const name =
				unknownError instanceof Error || unknownError instanceof DOMException
					? unknownError.name
					: '';
			if (name === 'AbortError') return;
			triggerBlobDownload(blob, filename);
		}
	}

	async function onPrimaryClick() {
		if (disabled) {
			window.alert("This action isn't available right now. Please try again in a moment.");
			return;
		}
		if (loading) {
			window.alert('Please wait. The contact card is still being prepared.');
			return;
		}
		error = '';
		loading = true;
		try {
			const { blob } = await fetchVcf();
			onSaveTriggered?.();
			const url = URL.createObjectURL(blob);
			// Open in the same browser tab so users can directly import into Contacts.
			window.location.assign(url);
		} catch (unknownError) {
			error = unknownError instanceof Error ? unknownError.message : 'Unknown error';
		} finally {
			loading = false;
		}
	}

	async function onShareFileClick() {
		if (disabled) {
			window.alert("This action isn't available right now. Please try again in a moment.");
			return;
		}
		if (loading) {
			window.alert('Please wait. The contact card is still being prepared.');
			return;
		}
		error = '';
		loading = true;
		try {
			const { blob, filename } = await fetchVcf();
			await shareOrDownloadVcf(blob, filename);
			onSaveTriggered?.();
			onAfterShare?.();
		} catch (unknownError) {
			error = unknownError instanceof Error ? unknownError.message : 'Unknown error';
		} finally {
			loading = false;
		}
	}
</script>

<button
	type="button"
	class={primaryButtonClass}
	aria-disabled={disabled || loading}
	onclick={onPrimaryClick}
>
	{#if loading}
		Preparing...
	{:else}
		Open in Contacts
	{/if}
</button>
<button
	type="button"
	class={secondaryButtonClass}
	aria-disabled={disabled || loading}
	onclick={onShareFileClick}
>
	Share or save contact...
</button>
{#if error}
	<p class={errorClass}>{error}</p>
{/if}
