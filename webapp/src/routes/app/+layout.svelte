<script lang="ts">
	import SettingsModal from '$lib/components/SettingsModal.svelte';

	let { children } = $props();
	let settingsOpen = $state(false);
</script>

<div class="flex h-dvh max-h-dvh flex-col overflow-hidden bg-[var(--bg-base)]">
	<nav
		class="flex shrink-0 items-center justify-end border-b border-[var(--border)] bg-[var(--bg-base)]/88 px-3 pt-[env(safe-area-inset-top,0px)] pb-2 backdrop-blur-[12px]"
		aria-label="App"
	>
		<button
			type="button"
			class="rounded-[var(--radius-sm)] px-2 py-1 text-[0.9375rem] font-medium text-[var(--text)] transition-colors hover:text-[var(--accent)]"
			onclick={() => (settingsOpen = true)}
		>
			Settings
		</button>
	</nav>

	<div class="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
		{@render children()}
	</div>
</div>

<SettingsModal open={settingsOpen} onClose={() => (settingsOpen = false)} />
