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
		padding: 0.75rem 1rem;
		border-radius: 0.6rem;
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
		margin-top: 0.5rem;
	}
</style>
