<script lang="ts">
	import SettingsModal from '$lib/components/SettingsModal.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { clearReviewSession } from '$lib/scan-flow/review-session';

	let { children } = $props();
	let settingsOpen = $state(false);
</script>

<div class="flex h-dvh max-h-dvh min-w-0 flex-col overflow-hidden bg-[var(--bg-base)]">
	<nav
		class="flex shrink-0 flex-col items-center justify-center border-b border-[var(--border)] bg-[var(--bg-base)]/88 pt-[env(safe-area-inset-top,0px)] pr-[max(0.75rem,env(safe-area-inset-right,0px))] pb-2 pl-[max(0.75rem,env(safe-area-inset-left,0px))] backdrop-blur-[12px]"
		aria-label="App"
	>
		<div class="mx-auto flex w-full max-w-[600px] items-center justify-between">
			<button
				type="button"
				class="rounded-[var(--radius-sm)] px-2 py-1 text-[0.9375rem] font-medium text-[var(--text)] transition-colors hover:text-[var(--accent)]"
				onclick={() => {
					clearReviewSession();
					void goto(resolve('/app/scan'));
				}}
			>
				Start new scan
			</button>
			<button
				type="button"
				class="rounded-[var(--radius-sm)] px-2 py-1 text-[0.9375rem] font-medium text-[var(--text)] transition-colors hover:text-[var(--accent)]"
				onclick={() => (settingsOpen = true)}
			>
				Settings
			</button>
		</div>
	</nav>

	<div
		class="mx-auto flex min-h-0 w-full max-w-[600px] min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto"
	>
		{@render children()}
	</div>
</div>

<SettingsModal open={settingsOpen} onClose={() => (settingsOpen = false)} />
