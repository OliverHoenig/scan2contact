<script lang="ts">
	import { resolve } from '$app/paths';

	type Topic = {
		id: string;
		title: string;
		blurb: string;
		icon: 'scan' | 'contact' | 'mail' | 'account' | 'shield' | 'wrench';
	};

	type FaqItem = {
		q: string;
		a: string;
		topicId: string;
		tags: string;
	};

	const SUPPORT_EMAIL = 'support@scan2contact.com';

	const topics: Topic[] = [
		{
			id: 'scan',
			title: 'Scanning & camera',
			blurb: 'Permissions, lighting, capture quality, and OCR accuracy.',
			icon: 'scan'
		},
		{
			id: 'contacts',
			title: 'Contacts & saving',
			blurb: 'Add to phone, vCard download, and fixing extracted fields.',
			icon: 'contact'
		},
		{
			id: 'mail',
			title: 'Templates & follow-ups',
			blurb: 'Email templates, sending follow-ups, and message formatting.',
			icon: 'mail'
		},
		{
			id: 'account',
			title: 'Account & sign-in',
			blurb: 'Login issues, new device, password resets.',
			icon: 'account'
		},
		{
			id: 'privacy',
			title: 'Data & privacy',
			blurb: 'What we process, retention, and your control over data.',
			icon: 'shield'
		},
		{
			id: 'troubleshoot',
			title: 'Connection & errors',
			blurb: 'Slow networks, failed scans, and browser compatibility.',
			icon: 'wrench'
		}
	];

	const faqs: FaqItem[] = [
		{
			topicId: 'scan',
			q: 'The camera preview is black or frozen—what should I check?',
			a: 'Confirm the site has camera permission in your browser settings (Safari: Settings → Safari → Camera; Chrome: lock icon in the address bar). Close other apps using the camera, reload the page, and try again. On iOS, use Safari or Chrome and allow access when prompted.',
			tags: 'camera permission black screen frozen safari chrome'
		},
		{
			topicId: 'scan',
			q: 'The scan missed a line or misread a name—can I fix it?',
			a: 'Yes. After capture, review and edit fields before saving. Good light and holding the card steady reduce errors; glossy or curved cards may need a second shot or a quick manual tweak—still faster than typing everything.',
			tags: 'ocr wrong typo edit review fields'
		},
		{
			topicId: 'scan',
			q: 'Do I need to install an app?',
			a: 'No. scan2contact runs in your mobile browser. Add the page to your home screen if you want quick access like an app.',
			tags: 'install app pwa browser mobile'
		},
		{
			topicId: 'contacts',
			q: 'How do I get the contact onto my phone?',
			a: 'Use the options on the contact screen: many phones can import a vCard from the download, or you can use your platform’s “Add to contacts” flow when offered. Steps vary slightly between iOS and Android—follow the on-screen guide for your device.',
			tags: 'vcard download import ios android address book'
		},
		{
			topicId: 'contacts',
			q: '“Add to contacts” or import did nothing—what now?',
			a: 'Try the alternate method (e.g. open the downloaded .vcf from Files or Downloads). Ensure pop-ups or downloads are not blocked. If one browser fails, try another on the same device.',
			tags: 'not working import failed vcf'
		},
		{
			topicId: 'mail',
			q: 'My follow-up email didn’t send or opened the wrong app.',
			a: 'Follow-up usually opens your default mail client with a pre-filled message. Set your preferred email app as the system default, or copy the draft from the opened compose window. Check that your templates include a valid subject line.',
			tags: 'email send mail template gmail outlook'
		},
		{
			topicId: 'mail',
			q: 'Where do I edit my email templates?',
			a: 'Open the templates area from the app (gear or templates entry point in your logged-in flow). Save changes before starting a new scan session so the latest wording is used for follow-ups.',
			tags: 'templates settings edit subject body'
		},
		{
			topicId: 'account',
			q: 'I can’t log in or I forgot which email I used.',
			a: 'Use the email address you signed up with. Try password reset from the login page. If you use multiple inboxes, search for “scan2contact” or your signup confirmation. Still stuck? Contact support with any email you might have used.',
			tags: 'login password reset forgot email'
		},
		{
			topicId: 'account',
			q: 'Does my subscription or trial affect scanning?',
			a: 'If your organization uses limits or trials, you may see messaging in the app when a limit applies. For billing or seat questions, email support with your account email.',
			tags: 'billing trial limits plan'
		},
		{
			topicId: 'privacy',
			q: 'What happens to the business card image and extracted text?',
			a: 'Processing runs online so extraction can work reliably. Retention and deletion policies depend on your deployment; for product-specific or enterprise terms, ask your admin or contact support. Minimize sensitive cards if your policy requires it.',
			tags: 'privacy gdpr delete data retention'
		},
		{
			topicId: 'troubleshoot',
			q: 'Scans fail or spin forever on bad Wi‑Fi.',
			a: 'Extraction needs a working connection. Snap the photo when you can, then complete the scan when you have stable network—common at conferences. Switching from venue Wi‑Fi to cellular often helps.',
			tags: 'network offline slow loading error'
		},
		{
			topicId: 'troubleshoot',
			q: 'Which browsers work best?',
			a: 'Current versions of Safari (iOS), Chrome, and Firefox generally work well. Keep the browser updated, disable strict blockers for this site if capture fails, and try a private window once to rule out extensions.',
			tags: 'browser compatible safari chrome firefox'
		}
	];

	let query = $state('');
	let activeTopic = $state<string | null>(null);

	const normalizedQuery = $derived(query.trim().toLowerCase());

	const filteredFaqs = $derived.by(() => {
		let list = faqs;
		if (activeTopic) {
			list = list.filter((f) => f.topicId === activeTopic);
		}
		if (!normalizedQuery) return list;
		return list.filter((f) => {
			const topic = topics.find((t) => t.id === f.topicId);
			const hay = `${f.q} ${f.a} ${f.tags} ${topic?.title ?? ''}`.toLowerCase();
			return hay.includes(normalizedQuery);
		});
	});

	const filteredTopics = $derived.by(() => {
		if (!normalizedQuery) return topics;
		return topics.filter((t) => {
			const topicFaqs = faqs.filter((f) => f.topicId === t.id);
			const hay = `${t.title} ${t.blurb} ${topicFaqs.map((f) => f.q + f.a + f.tags).join(' ')}`.toLowerCase();
			return hay.includes(normalizedQuery);
		});
	});

	function clearFilters() {
		query = '';
		activeTopic = null;
	}
</script>

<svelte:head>
	<title>Help &amp; support | scan2contact</title>
	<meta
		name="description"
		content="Self-service help for scan2contact: camera and scanning, saving contacts, email templates, account issues, and troubleshooting."
	/>
</svelte:head>

<div class="min-h-dvh text-[var(--text)]">
	<header class="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--bg-base)]/95 backdrop-blur-md">
		<div
			class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8"
		>
			<a
				href={resolve('/')}
				class="group flex items-center gap-2.5 text-lg font-semibold tracking-tight text-[var(--text)] transition hover:text-[var(--accent)]"
			>
				<span
					class="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-gradient-to-br from-[var(--accent)] to-[var(--accent-end)] text-sm font-bold text-[var(--accent-ink)] transition group-hover:opacity-95"
					aria-hidden="true"
				>
					S
				</span>
				scan2contact
			</a>
			<nav class="flex items-center gap-1.5 sm:gap-2" aria-label="Primary">
				<a
					href={resolve('/')}
					class="rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium text-[var(--text-muted)] transition hover:bg-[var(--bg-raised)] hover:text-[var(--text)]"
				>
					Home
				</a>
				<a
					href={resolve('/auth/login')}
					class="rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium text-[var(--text-muted)] transition hover:bg-[var(--bg-raised)] hover:text-[var(--text)]"
				>
					Log in
				</a>
				<a
					href={resolve('/auth/signup')}
					class="btn-accent-primary btn-accent-primary--r-sm inline-flex min-h-10 items-center justify-center px-4 py-2 text-sm font-semibold text-[var(--accent-ink)] transition hover:brightness-110 active:scale-[0.98]"
				>
					Get started
				</a>
			</nav>
		</div>
	</header>

	<main id="main">
		<!-- Hero -->
		<section
			class="relative border-b border-[var(--border)] bg-[var(--bg-base)] px-4 pt-12 pb-14 sm:px-6 sm:pt-16 sm:pb-16 lg:px-8"
			aria-labelledby="support-hero-heading"
		>
			<div class="ambient-scan-grid ambient-scan-grid--hero opacity-40" aria-hidden="true"></div>
			<div class="relative z-10 mx-auto max-w-3xl text-center">
				<p
					class="text-xs font-semibold tracking-[0.22em] text-[var(--accent)] uppercase sm:text-sm"
				>
					Help center
				</p>
				<h1
					id="support-hero-heading"
					class="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[2.75rem] lg:leading-[1.12]"
				>
					How can we help you today?
				</h1>
				<p class="mx-auto mt-4 max-w-xl text-base leading-relaxed text-pretty text-[var(--text-muted)] sm:text-lg">
					Search common questions, browse topics, or reach the team if something still does not
					click.
				</p>

				<div class="mx-auto mt-8 max-w-xl">
					<label class="sr-only" for="support-search">Search help articles</label>
					<div
						class="flex rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-[var(--bg-raised)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)] focus-within:border-[var(--border-focus)] focus-within:ring-[3px] focus-within:ring-[var(--accent-muted)]"
					>
						<span
							class="grid shrink-0 place-items-center pl-4 text-[var(--text-subtle)]"
							aria-hidden="true"
						>
							<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
								/>
							</svg>
						</span>
						<input
							id="support-search"
							type="search"
							autocomplete="off"
							placeholder="e.g. camera permission, vCard, template…"
							bind:value={query}
							class="min-h-12 w-full bg-transparent px-3 py-3 text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none"
						/>
					</div>
					{#if activeTopic || normalizedQuery}
						<div class="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm">
							<span class="text-[var(--text-subtle)]">Filtered</span>
							<button
								type="button"
								class="rounded-full border border-[var(--border)] bg-[var(--bg-input)] px-3 py-1 font-medium text-[var(--text-muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--text)]"
								onclick={clearFilters}
							>
								Clear filters
							</button>
						</div>
					{/if}
				</div>
			</div>
		</section>

		<!-- Topic grid -->
		<section
			class="border-b border-[var(--border)] bg-[var(--bg-raised)] px-4 py-14 sm:px-6 lg:px-8"
			aria-labelledby="topics-heading"
		>
			<div class="mx-auto max-w-6xl">
				<h2 id="topics-heading" class="text-xl font-semibold tracking-tight sm:text-2xl">
					Browse by topic
				</h2>
				<p class="mt-2 max-w-2xl text-sm text-[var(--text-muted)] sm:text-base">
					Pick the area that matches your question—each section lists answers you can try before
					writing in.
				</p>

				{#if filteredTopics.length === 0}
					<p class="mt-8 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-base)] px-5 py-8 text-center text-sm text-[var(--text-muted)]">
						No topics match “{query.trim()}”. Try a shorter keyword or
						<button
							type="button"
							class="font-semibold text-[var(--accent)] underline underline-offset-4 hover:brightness-110"
							onclick={clearFilters}
						>
							clear the search
						</button>.
					</p>
				{:else}
					<ul class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{#each filteredTopics as topic (topic.id)}
							<li>
								<button
									type="button"
									class="group flex h-full w-full flex-col rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-base)] p-5 text-left transition hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-glow)] {activeTopic ===
									topic.id
										? 'border-[var(--accent)] ring-2 ring-[var(--accent-muted)]'
										: ''}"
									onclick={() => {
										activeTopic = activeTopic === topic.id ? null : topic.id;
									}}
									aria-pressed={activeTopic === topic.id}
								>
									<span
										class="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent-muted)] text-[var(--accent)] transition group-hover:brightness-110"
										aria-hidden="true"
									>
										{#if topic.icon === 'scan'}
											<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
												/>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
												/>
											</svg>
										{:else if topic.icon === 'contact'}
											<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
												/>
											</svg>
										{:else if topic.icon === 'mail'}
											<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
												/>
											</svg>
										{:else if topic.icon === 'account'}
											<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
												/>
											</svg>
										{:else if topic.icon === 'shield'}
											<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
												/>
											</svg>
										{:else}
											<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
												/>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
												/>
											</svg>
										{/if}
									</span>
									<span class="font-semibold text-[var(--text)]">{topic.title}</span>
									<span class="mt-1 text-sm leading-relaxed text-[var(--text-muted)]"
										>{topic.blurb}</span
									>
									<span
										class="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)]"
									>
										{activeTopic === topic.id ? 'Show all topics' : 'Filter articles'}
										<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M19 9l-7 7-7-7"
											/>
										</svg>
									</span>
								</button>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</section>

		<!-- FAQ -->
		<section class="bg-[var(--bg-base)] px-4 py-14 sm:px-6 lg:px-8" aria-labelledby="faq-heading">
			<div class="mx-auto max-w-6xl">
				<h2 id="faq-heading" class="text-xl font-semibold tracking-tight sm:text-2xl">
					Articles
				</h2>
				<p class="mt-2 text-sm text-[var(--text-muted)] sm:text-base">
					{#if activeTopic}
						Showing
						<strong class="font-semibold text-[var(--text)]"
							>{topics.find((t) => t.id === activeTopic)?.title}</strong
						>
						only.
						<button
							type="button"
							class="ml-1 font-medium text-[var(--accent)] underline underline-offset-4 hover:brightness-110"
							onclick={() => (activeTopic = null)}
						>
							Show all
						</button>
					{:else}
						All topics—use search or the cards above to narrow down.
					{/if}
				</p>

				{#if filteredFaqs.length === 0}
					<p class="mt-8 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-raised)] px-5 py-8 text-center text-sm text-[var(--text-muted)]">
						No articles match your filters. Try
						<button
							type="button"
							class="font-semibold text-[var(--accent)] underline underline-offset-4 hover:brightness-110"
							onclick={clearFilters}
						>
							resetting filters
						</button>
						or email us below.
					</p>
				{:else}
					<div class="mt-8 space-y-3">
						{#each filteredFaqs as item, i (item.q + i)}
							{@const topic = topics.find((t) => t.id === item.topicId)}
							<div
								class="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-raised)] px-5 transition open:border-[var(--border-strong)] hover:border-[var(--border-strong)]"
							>
								<details class="group">
									<summary
										class="cursor-pointer list-none py-4 pr-8 text-left text-base font-semibold text-[var(--text)] marker:content-none [&::-webkit-details-marker]:hidden"
									>
										<span class="mb-1 block text-xs font-medium tracking-wide text-[var(--accent)] uppercase"
											>{topic?.title ?? 'Help'}</span
										>
										{item.q}
									</summary>
									<p
										class="border-t border-[var(--border)] pt-3 pb-4 text-sm leading-relaxed text-[var(--text-muted)]"
									>
										{item.a}
									</p>
								</details>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</section>

		<!-- Contact -->
		<section
			class="border-t border-[var(--border)] bg-[var(--bg-raised)] px-4 py-14 sm:px-6 lg:px-8"
			aria-labelledby="contact-heading"
		>
			<div class="mx-auto max-w-6xl">
				<div
					class="grid gap-10 rounded-[2rem] border border-[var(--border)] bg-[var(--bg-base)] p-8 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-12"
				>
					<div>
						<h2 id="contact-heading" class="text-xl font-semibold tracking-tight sm:text-2xl">
							Still stuck?
						</h2>
						<p class="mt-3 max-w-xl text-sm leading-relaxed text-[var(--text-muted)] sm:text-base">
							Tell us what you tried and what you saw (error text, browser, phone model). Screenshots
							help. We read every message and usually reply within one business day.
						</p>
						<ul class="mt-5 space-y-2 text-sm text-[var(--text-muted)]">
							<li class="flex gap-2">
								<span class="text-[var(--accent)]" aria-hidden="true">→</span>
								<span>Include the email address on your account.</span>
							</li>
							<li class="flex gap-2">
								<span class="text-[var(--accent)]" aria-hidden="true">→</span>
								<span>Mention whether the issue is scanning, saving, or email follow-up.</span>
							</li>
						</ul>
					</div>
					<div class="flex flex-col gap-3 sm:flex-row lg:flex-col">
						<a
							href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('scan2contact support')}`}
							class="btn-accent-primary btn-accent-primary--r-md inline-flex min-h-12 items-center justify-center px-6 text-sm font-semibold text-[var(--accent-ink)] transition hover:brightness-110 active:scale-[0.99]"
						>
							Email support
						</a>
						<a
							href={resolve('/app/scan')}
							class="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-transparent px-6 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--border)] hover:bg-[var(--bg-input)] active:scale-[0.99]"
						>
							Open the app
						</a>
					</div>
				</div>
				<p class="mt-6 text-center text-xs text-[var(--text-subtle)]">
					Support:
					<a
						class="text-[var(--text-muted)] underline underline-offset-4 hover:text-[var(--accent)]"
						href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a
					>
				</p>
			</div>
		</section>
	</main>

	<footer class="border-t border-[var(--border)] bg-[var(--bg-base)] py-10">
		<div
			class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6 lg:px-8"
		>
			<p class="text-sm text-[var(--text-subtle)]">© {new Date().getFullYear()} scan2contact</p>
			<nav class="flex flex-wrap items-center justify-center gap-6 text-sm" aria-label="Footer">
				<a href={resolve('/')} class="text-[var(--text-muted)] transition hover:text-[var(--accent)]"
					>Home</a
				>
				<a
					href={resolve('/auth/login')}
					class="text-[var(--text-muted)] transition hover:text-[var(--accent)]">Log in</a
				>
				<a
					href={resolve('/auth/signup')}
					class="text-[var(--text-muted)] transition hover:text-[var(--accent)]">Sign up</a
				>
				<a
					href={resolve('/app/scan')}
					class="text-[var(--text-muted)] transition hover:text-[var(--accent)]">App</a
				>
			</nav>
		</div>
	</footer>
</div>
