<script lang="ts">
	import SettingsModal from '$lib/components/SettingsModal.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { clearReviewSession } from '$lib/scan-flow/review-session';
	import { page } from '$app/state';

	let { children } = $props();
	let settingsOpen = $state(false);
</script>

<div class="flex h-dvh max-h-dvh min-w-0 flex-col overflow-hidden bg-[var(--bg-base)]">
	<nav
		class="flex shrink-0 flex-col items-center justify-center border-b border-[var(--glass-border)] bg-[var(--bg-base)]/72 pt-[env(safe-area-inset-top,0px)] pr-[max(0.75rem,env(safe-area-inset-right,0px))] pb-2.5 pl-[max(0.75rem,env(safe-area-inset-left,0px))] backdrop-blur-2xl backdrop-saturate-150"
		aria-label="App"
	>
		<div class="mx-auto flex w-full max-w-[600px] items-center justify-between">
			{#if page.url.pathname !== '/app/scan'}
				<button
					type="button"
					class="flex flex-row items-center rounded-[var(--radius-sm)] px-2 py-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--glass-bg)] hover:text-[var(--accent)]"
					onclick={() => {
						clearReviewSession();
						void goto(resolve('/app/scan'));
					}}
				>
					<img src="/icons/chevron-left.svg" alt="Back" class="h-7 w-7 opacity-90" />
					<img src="/icons/scan-text.svg" alt="Start new scan" class="h-7 w-7 opacity-90" />
				</button>
			{:else}
				<div class="h-7 w-7"></div>
			{/if}

			<button
				type="button"
				class="rounded-[var(--radius-sm)] px-2 py-1 text-[0.9375rem] font-medium text-[var(--text)] transition-colors hover:text-[var(--accent)]"
				onclick={() => (settingsOpen = true)}
			>
				<img
					src="/icons/user-cog.svg"
					alt="Settings"
					class="h-9 w-9 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] p-1 shadow-[0_0_20px_-6px_var(--accent-glow)]"
				/>
			</button>
		</div>
	</nav>

	<div
		class="mx-auto flex min-h-0 w-full max-w-[600px] min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto px-5 pb-8 pt-1"
	>
		{@render children()}
	</div>
</div>

<SettingsModal open={settingsOpen} onClose={() => (settingsOpen = false)} />
