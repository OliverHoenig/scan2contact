<script lang="ts">
	import type { Contact } from '$lib/contact';

	let {
		contact,
		disabled = false,
		onSaveTriggered
	}: {
		contact: Contact;
		disabled?: boolean;
		onSaveTriggered?: () => void;
	} = $props();
	let loading = $state(false);
	let error = $state('');
	let cachedVcf = $state<{ blob: Blob; filename: string } | null>(null);
	const primaryButtonClass =
		'w-full min-h-12 cursor-pointer rounded-[var(--radius-md)] border-0 bg-[linear-gradient(145deg,var(--accent)_0%,#2dd4bf_100%)] px-[1.35rem] py-[0.85rem] text-[0.9375rem] font-semibold tracking-[0.02em] text-[var(--accent-ink)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12),0_6px_28px_rgba(45,212,191,0.22)] transition-[transform,filter] duration-200 ease-out hover:enabled:brightness-[1.06] active:enabled:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none';
	const secondaryButtonClass =
		'min-h-9 w-full cursor-pointer rounded-[var(--radius-sm)] border-0 bg-transparent px-2 py-1.5 text-[0.8125rem] font-medium text-[var(--text-muted)] underline-offset-4 shadow-none transition-colors duration-150 hover:enabled:text-[var(--text)] hover:enabled:underline disabled:cursor-not-allowed disabled:opacity-45';
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
		error = '';
		onSaveTriggered?.();
		loading = true;
		try {
			const { blob } = await fetchVcf();
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
		error = '';
		onSaveTriggered?.();
		loading = true;
		try {
			const { blob, filename } = await fetchVcf();
			await shareOrDownloadVcf(blob, filename);
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
	onclick={onPrimaryClick}
	disabled={disabled || loading}
>
	{#if loading}
		Preparing...
	{:else}
		Open in Contacts
	{/if}
</button>
<button type="button" class={secondaryButtonClass} onclick={onShareFileClick} disabled={disabled || loading}>
	Share or save contact...
</button>
{#if error}
	<p class={errorClass}>{error}</p>
{/if}
