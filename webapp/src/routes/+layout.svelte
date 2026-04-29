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
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
	<link
		href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
	<meta name="theme-color" content="#060607" />
</svelte:head>
{@render children()}
