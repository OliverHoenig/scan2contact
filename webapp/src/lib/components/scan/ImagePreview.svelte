<script lang="ts">
	let { file, compact = false }: { file: File | null; compact?: boolean } = $props();
	let previewUrl = $state('');

	$effect(() => {
		if (!file) {
			previewUrl = '';
			return;
		}
		previewUrl = URL.createObjectURL(file);
		return () => URL.revokeObjectURL(previewUrl);
	});
</script>

{#if file && previewUrl}
	{#if compact}
		<div class="preview preview--compact">
			<img src={previewUrl} alt="" class="thumb" />
			<span class="meta" title={file.name}
				>{file.name} · {Math.round(file.size / 1024)} KB</span
			>
		</div>
	{:else}
		<div class="preview">
			<h2>Image preview</h2>
			<img src={previewUrl} alt="Selected business card" />
			<p>{file.name} ({Math.round(file.size / 1024)} KB)</p>
		</div>
	{/if}
{/if}

<style>
	.preview {
		display: grid;
		gap: 0.5rem;
	}
	img {
		width: 100%;
		border-radius: 0.75rem;
		border: 1px solid #d4d4d8;
	}
	.preview--compact {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		min-width: 0;
		flex: 1 1 auto;
	}
	.preview--compact .thumb {
		width: auto;
		height: 2.25rem;
		max-width: 2.5rem;
		object-fit: cover;
		border-radius: 0.35rem;
		border: 1px solid rgba(255, 255, 255, 0.35);
		flex-shrink: 0;
	}
	.preview--compact .meta {
		font-size: 0.72rem;
		color: #e4e4e7;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
