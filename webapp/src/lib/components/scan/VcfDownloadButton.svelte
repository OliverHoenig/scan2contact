<script lang="ts">
	import type { Contact } from '$lib/contact';

	let { contact, disabled = false }: { contact: Contact; disabled?: boolean } = $props();
	let loading = $state(false);
	let error = $state('');
	/** vCard ready but opening in a new tab was blocked until the user taps again (common on iOS after async fetch). */
	let pendingOpen = $state<{ blob: Blob; filename: string } | null>(null);

	const OPEN_REVOKE_MS = 120_000;
	const primaryButtonClass =
		'w-full min-h-12 cursor-pointer rounded-[var(--radius-md)] border-0 bg-[linear-gradient(145deg,var(--accent)_0%,#2dd4bf_100%)] px-[1.35rem] py-[0.85rem] text-[0.9375rem] font-semibold tracking-[0.02em] text-[var(--accent-ink)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12),0_6px_28px_rgba(45,212,191,0.22)] transition-[transform,filter] duration-200 ease-out hover:enabled:brightness-[1.06] active:enabled:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none';
	const secondaryButtonClass =
		'mt-[0.65rem] min-h-11 w-full cursor-pointer rounded-[var(--radius-md)] border border-white/20 bg-white/5 px-4 py-[0.65rem] text-[0.875rem] font-semibold text-inherit shadow-none active:enabled:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45';
	const hintClass = 'mt-[0.65rem] text-[0.8125rem] leading-[1.45] opacity-85';
	const errorClass = 'mt-2 text-[0.875rem] leading-[1.4] text-[var(--danger)]';

	function scheduleRevoke(url: string) {
		setTimeout(() => URL.revokeObjectURL(url), OPEN_REVOKE_MS);
	}

	function tryOpenVcardInNewTab(blob: Blob): boolean {
		const url = URL.createObjectURL(blob);
		const opened = window.open(url, '_blank', 'noopener,noreferrer');
		if (opened) {
			scheduleRevoke(url);
			return true;
		}
		URL.revokeObjectURL(url);
		return false;
	}

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

	function resetPending() {
		pendingOpen = null;
	}

	async function onPrimaryClick() {
		error = '';

		if (pendingOpen) {
			const { blob, filename } = pendingOpen;
			if (tryOpenVcardInNewTab(blob)) {
				resetPending();
				return;
			}
			triggerBlobDownload(blob, filename);
			resetPending();
			return;
		}

		loading = true;
		try {
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
			const matchedFile = disposition.match(/filename="(.+)"/i)?.[1] || 'contact.vcf';

			if (tryOpenVcardInNewTab(blob)) {
				resetPending();
				return;
			}
			pendingOpen = { blob, filename: matchedFile };
		} catch (unknownError) {
			error = unknownError instanceof Error ? unknownError.message : 'Unknown error';
		} finally {
			loading = false;
		}
	}

	async function onShareFileClick() {
		if (!pendingOpen) return;
		const { blob, filename } = pendingOpen;
		await shareOrDownloadVcf(blob, filename);
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
	{:else if pendingOpen}
		Open in Contacts
	{:else}
		Add to contacts
	{/if}
</button>
{#if pendingOpen}
	<p class={hintClass}>
		Opens a preview where you can tap <strong>Add to Contacts</strong>. If nothing happened, tap the
		button again.
	</p>
	<button type="button" class={secondaryButtonClass} onclick={onShareFileClick} {disabled}>
		Share or save file…
	</button>
{/if}
{#if error}
	<p class={errorClass}>{error}</p>
{/if}
