<script lang="ts">
	import MailTemplatesPanel from '$lib/components/MailTemplatesPanel.svelte';

	type Props = {
		open: boolean;
		onClose: () => void;
	};

	let { open, onClose }: Props = $props();

	type Panel = 'menu' | 'mail-templates';
	let panel = $state<Panel>('menu');

	$effect(() => {
		if (!open) panel = 'menu';
	});

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
			class="flex max-h-[min(92dvh,40rem)] w-full max-w-[560px] flex-col rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-[0_24px_64px_rgba(0,0,0,0.45)]"
			role="dialog"
			aria-modal="true"
			aria-label="Settings"
		>
			<div class="flex shrink-0 items-center justify-between gap-3">
				<h2 class="m-0 text-[1.25rem] font-semibold tracking-[-0.02em]">Settings</h2>
				<button
					type="button"
					class="rounded-[var(--radius-sm)] border border-[var(--border)] px-2 py-1 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
					onclick={onClose}
				>
					Close
				</button>
			</div>

			<div class="mt-3 min-h-0 flex-1 overflow-y-auto">
				{#if panel === 'menu'}
					<p class="m-0 max-w-[44ch] text-[0.9375rem] leading-[1.5] text-[var(--text-muted)]">
						Manage preferences for the scanner and follow-up emails.
					</p>
					<ul class="m-0 mt-4 list-none space-y-2 p-0">
						<li>
							<button
								type="button"
								class="flex w-full items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-white/[0.03] px-3.5 py-3 text-left text-[0.9375rem] font-medium text-[var(--text)] transition-[border-color,background] hover:border-[rgba(255,255,255,0.14)]"
								onclick={() => (panel = 'mail-templates')}
							>
								<span>Follow-up mail templates</span>
								<span class="text-[var(--text-muted)]" aria-hidden="true">→</span>
							</button>
						</li>
					</ul>
				{:else}
					<MailTemplatesPanel onBack={() => (panel = 'menu')} />
				{/if}
			</div>
		</div>
	</div>
{/if}
