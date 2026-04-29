<script lang="ts">
	type Props = {
		open: boolean;
		onClose: () => void;
	};

	let { open, onClose }: Props = $props();

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-[50] flex items-start justify-center bg-black/60 px-4 pt-[calc(env(safe-area-inset-top,0px)+1.25rem)] pb-4 backdrop-blur-[2px]"
		role="presentation"
		onclick={handleBackdropClick}
	>
		<div
			class="w-full max-w-[560px] rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-[0_24px_64px_rgba(0,0,0,0.45)]"
			role="dialog"
			aria-modal="true"
			aria-label="Settings"
		>
			<div class="flex items-center justify-between gap-3">
				<h2 class="m-0 text-[1.25rem] font-semibold tracking-[-0.02em]">Settings</h2>
				<button
					type="button"
					class="rounded-[var(--radius-sm)] border border-[var(--border)] px-2 py-1 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
					onclick={onClose}
				>
					Close
				</button>
			</div>

			<p class="m-0 mt-3 max-w-[44ch] text-[0.9375rem] leading-[1.5] text-[var(--text-muted)]">
				App preferences will appear here. Use the scanner from the home screen when you are ready to
				capture a card.
			</p>
		</div>
	</div>
{/if}
