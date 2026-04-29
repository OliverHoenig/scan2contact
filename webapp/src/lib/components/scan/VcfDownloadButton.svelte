<script lang="ts">
	import type { Contact } from '$lib/contact';

	let { contact, disabled = false }: { contact: Contact; disabled?: boolean } = $props();
	let loading = $state(false);
	let error = $state('');
	/** vCard ready but opening in a new tab was blocked until the user taps again (common on iOS after async fetch). */
	let pendingOpen = $state<{ blob: Blob; filename: string } | null>(null);

	const OPEN_REVOKE_MS = 120_000;

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

<button type="button" onclick={onPrimaryClick} disabled={disabled || loading}>
	{#if loading}
		Preparing...
	{:else if pendingOpen}
		Open in Contacts
	{:else}
		Add to contacts
	{/if}
</button>
{#if pendingOpen}
	<p class="hint">Opens a preview where you can tap <strong>Add to Contacts</strong>. If nothing happened, tap the button again.</p>
	<button type="button" class="secondary" onclick={onShareFileClick} disabled={disabled}>
		Share or save file…
	</button>
{/if}
{#if error}
	<p class="error">{error}</p>
{/if}

<style>
	button {
		padding: 0.85rem 1.35rem;
		min-height: 3rem;
		border-radius: var(--radius-md);
		border: none;
		background: linear-gradient(145deg, var(--accent) 0%, #2dd4bf 100%);
		color: var(--accent-ink);
		font-family: inherit;
		font-size: 0.9375rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		cursor: pointer;
		box-shadow:
			0 0 0 1px rgba(255, 255, 255, 0.12) inset,
			0 6px 28px rgba(45, 212, 191, 0.22);
		transition:
			transform 0.2s var(--ease-out),
			filter 0.2s var(--ease-out);
	}
	button:not(:disabled):hover {
		filter: brightness(1.06);
	}
	button:not(:disabled):active {
		transform: scale(0.98);
	}
	button:disabled {
		opacity: 0.45;
		cursor: not-allowed;
		box-shadow: none;
	}
	button.secondary {
		margin-top: 0.65rem;
		width: 100%;
		padding: 0.65rem 1rem;
		min-height: 2.75rem;
		border-radius: var(--radius-md);
		border: 1px solid rgba(255, 255, 255, 0.2);
		background: rgba(255, 255, 255, 0.06);
		color: inherit;
		font-family: inherit;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		box-shadow: none;
	}
	button.secondary:not(:disabled):active {
		transform: scale(0.99);
	}
	.hint {
		font-size: 0.8125rem;
		line-height: 1.45;
		margin: 0.65rem 0 0;
		opacity: 0.85;
	}
	.error {
		color: var(--danger);
		font-size: 0.875rem;
		margin: 0.5rem 0 0;
		line-height: 1.4;
	}
</style>
