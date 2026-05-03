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
		class="flex shrink-0 flex-col items-stretch justify-center border-b border-[var(--glass-border)] bg-[var(--bg-base)]/72 pt-[calc(env(safe-area-inset-top,0px)+0.625rem)] pr-[max(0.75rem,env(safe-area-inset-right,0px))] pb-2.5 pl-[max(0.75rem,env(safe-area-inset-left,0px))] backdrop-blur-2xl backdrop-saturate-150"
		aria-label="App"
	>
		<div class="mx-auto flex min-h-10 w-full max-w-[600px] items-center justify-between">
			{#if page.url.pathname !== '/app/scan'}
				<button
					type="button"
					class="inline-flex min-h-10 flex-row items-center justify-center rounded-[var(--radius-sm)] px-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--glass-bg)] hover:text-[var(--accent)]"
					onclick={() => {
						clearReviewSession();
						void goto(resolve('/app/scan'));
					}}
				>
					<img src="/icons/chevron-left.svg" alt="Back" class="block h-7 w-7 shrink-0 opacity-90" />
					<img
						src="/icons/scan-text.svg"
						alt="Start new scan"
						class="block h-7 w-7 shrink-0 opacity-90"
					/>
				</button>
			{:else}
				<div class="min-h-10 w-7 shrink-0" aria-hidden="true"></div>
			{/if}

			<button
				type="button"
				class="inline-flex min-h-10 items-center justify-center px-2 text-[0.9375rem] font-medium text-[var(--text)] transition-colors hover:text-[var(--accent)]"
				onclick={() => (settingsOpen = true)}
			>
				<img src="/icons/user-cog.svg" alt="Settings" class="block h-7 w-7 shrink-0" />
			</button>
		</div>
	</nav>

	<div
		class="mx-auto flex min-h-0 w-full max-w-[600px] min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto px-5 pt-1 pb-8"
	>
		{@render children()}
	</div>
</div>

<SettingsModal open={settingsOpen} onClose={() => (settingsOpen = false)} />
