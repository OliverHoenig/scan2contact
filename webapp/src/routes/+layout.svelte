<script lang="ts">
	import { browser } from '$app/environment';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	if (browser && 'serviceWorker' in navigator) {
		navigator.serviceWorker.register('/service-worker.js').catch(() => {
			// silent fail - app still works without offline shell
		});
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="manifest" href="/manifest.webmanifest" />
	<meta name="theme-color" content="#18181b" />
</svelte:head>
{@render children()}
