<script lang="ts">
	let { file }: { file: File | null } = $props();
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
	<div class="preview">
		<h2>Image preview</h2>
		<img src={previewUrl} alt="Selected business card" />
		<p>{file.name} ({Math.round(file.size / 1024)} KB)</p>
	</div>
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
</style>
