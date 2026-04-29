<script lang="ts">
	import type { Contact } from '$lib/contact';

	let { contact, disabled = false }: { contact: Contact; disabled?: boolean } = $props();
	let loading = $state(false);
	let error = $state('');

	async function downloadVcf() {
		loading = true;
		error = '';
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

			const url = URL.createObjectURL(blob);
			const anchor = document.createElement('a');
			anchor.href = url;
			anchor.download = matchedFile;
			document.body.appendChild(anchor);
			anchor.click();
			document.body.removeChild(anchor);
			URL.revokeObjectURL(url);
		} catch (unknownError) {
			error = unknownError instanceof Error ? unknownError.message : 'Unknown error';
		} finally {
			loading = false;
		}
	}
</script>

<button type="button" onclick={downloadVcf} disabled={disabled || loading}>
	{#if loading}Generating...{:else}Download .vcf{/if}
</button>
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
	.error {
		color: var(--danger);
		font-size: 0.875rem;
		margin: 0.5rem 0 0;
		line-height: 1.4;
	}
</style>
