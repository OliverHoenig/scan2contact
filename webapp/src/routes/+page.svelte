<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<svelte:head>
	<title>scan2contact — Turn business cards into contacts in seconds</title>
	<meta
		name="description"
		content="Scan business cards at events and meetings. Get clean contacts ready for your phone—built for professionals who network."
	/>
</svelte:head>

<div class="min-h-dvh bg-[var(--bg-base)] text-[var(--text)]">
	<!-- Background wash -->
	<div class="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
		<div
			class="absolute top-[-20%] left-1/2 h-[min(70vh,520px)] w-[min(140%,900px)] -translate-x-1/2 rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(94,234,212,0.12)_0%,transparent_65%)]"
		></div>
		<div
			class="absolute right-[-10%] bottom-[-15%] h-[45vh] w-[45vh] rounded-full bg-[radial-gradient(circle,rgba(94,234,212,0.06)_0%,transparent_70%)] blur-2xl"
		></div>
	</div>

	<header
		class="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--bg-base)]/75 backdrop-blur-xl"
	>
		<div
			class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8"
		>
			<a
				href={resolve('/')}
				class="text-lg font-semibold tracking-tight text-[var(--text)] transition hover:text-[var(--accent)]"
			>
				scan2contact
			</a>
			<nav class="flex items-center gap-2 sm:gap-3" aria-label="Primary">
				<a
					href={resolve('/auth/login')}
					class="rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium text-[var(--text-muted)] transition hover:bg-[var(--accent-muted)] hover:text-[var(--text)]"
				>
					Log in
				</a>
				<a
					href={resolve('/auth/signup')}
					class="inline-flex min-h-10 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-ink)] shadow-sm transition hover:bg-[var(--accent-hover)] active:scale-[0.98]"
				>
					Get started
				</a>
			</nav>
		</div>
	</header>

	<main>
		<!-- Hero -->
		<section class="mx-auto max-w-6xl px-4 pt-14 pb-20 sm:px-6 sm:pt-20 sm:pb-28 lg:px-8">
			<div class="mx-auto max-w-3xl text-center">
				<p class="text-xs font-semibold tracking-[0.2em] text-[var(--accent)] uppercase sm:text-sm">
					For people who network
				</p>
				<h1 class="mt-4 text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
					Never lose another lead from a business card.
				</h1>
				<p
					class="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-pretty text-[var(--text-muted)] sm:text-xl"
				>
					Scan the business card and turn it into a clean contact you can save in seconds, so follow
					ups happen while the conversation is still fresh.
				</p>
				<div
					class="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center"
				>
					<a
						href={resolve('/auth/signup')}
						class="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent)] px-8 text-base font-semibold text-[var(--accent-ink)] shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset] transition hover:bg-[var(--accent-hover)] active:scale-[0.99]"
					>
						Start scanning free
					</a>
					<a
						href={resolve('/app')}
						class="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-8 text-base font-semibold text-[var(--text)] transition hover:border-[var(--border-focus)] hover:bg-[var(--bg-raised)] active:scale-[0.99]"
					>
						Open the app
					</a>
				</div>
				<p class="mt-4 text-sm text-[var(--text-subtle)]">
					Free to try · Works on your phone · No credit card
				</p>
			</div>

			<!-- Product preview card -->
			<div class="mx-auto mt-16 max-w-2xl lg:mt-20">
				<video
					src="/videos/preview.mp4"
					autoplay
					muted
					loop
					class="h-full w-full rounded-[var(--radius-lg)] rounded-md border border-white object-cover"
				></video>
			</div>
		</section>

		<!-- Benefits -->
		<section
			class="border-t border-[var(--border)] bg-[var(--bg-raised)]/50 py-20 sm:py-24"
			aria-labelledby="benefits-heading"
		>
			<div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
				<div class="mx-auto max-w-2xl text-center">
					<h2 id="benefits-heading" class="text-3xl font-semibold tracking-tight sm:text-4xl">
						Built for busy professionals
					</h2>
					<p class="mt-3 text-[var(--text-muted)]">
						Less admin, more relationships. Everything is tuned for the moments right after you meet
						someone.
					</p>
				</div>
				<ul class="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
					<li
						class="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-surface)] p-6 transition hover:border-[var(--border-strong)]"
					>
						<div
							class="flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent-muted)] text-[var(--accent)]"
						>
							<svg
								class="h-5 w-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								aria-hidden="true"
							>
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
						</div>
						<h3 class="mt-4 text-lg font-semibold">Scan in one tap</h3>
						<p class="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
							Use your camera at events, coffee meetings, or on the plane home. No stacks of cards
							in your jacket pocket.
						</p>
					</li>
					<li
						class="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-surface)] p-6 transition hover:border-[var(--border-strong)]"
					>
						<div
							class="flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent-muted)] text-[var(--accent)]"
						>
							<svg
								class="h-5 w-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
								/>
							</svg>
						</div>
						<h3 class="mt-4 text-lg font-semibold">Clean, editable details</h3>
						<p class="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
							Names, titles, emails, and phones—organized so you can fix anything before it hits
							your address book.
						</p>
					</li>
					<li
						class="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-surface)] p-6 transition hover:border-[var(--border-strong)] sm:col-span-2 lg:col-span-1"
					>
						<div
							class="flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent-muted)] text-[var(--accent)]"
						>
							<svg
								class="h-5 w-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M13 10V3L4 14h7v7l9-11h-7z"
								/>
							</svg>
						</div>
						<h3 class="mt-4 text-lg font-semibold">Follow up while it matters</h3>
						<p class="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
							Get from introduction to “nice to meet you” email before the next session starts—not
							after the trade show ends.
						</p>
					</li>
				</ul>
			</div>
		</section>

		<!-- Steps -->
		<section class="py-20 sm:py-24" aria-labelledby="steps-heading">
			<div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
				<h2
					id="steps-heading"
					class="text-center text-3xl font-semibold tracking-tight sm:text-4xl"
				>
					How it works
				</h2>
				<ol class="mx-auto mt-14 grid max-w-4xl gap-8 sm:grid-cols-3 sm:gap-6">
					<li class="relative text-center sm:text-left">
						<span
							class="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-bold text-[var(--accent-ink)] sm:mx-0"
							>1</span
						>
						<h3 class="mt-4 font-semibold">Capture the card</h3>
						<p class="mt-2 text-sm text-[var(--text-muted)]">
							Frame the card in good light—we handle the rest.
						</p>
					</li>
					<li class="relative text-center sm:text-left">
						<span
							class="mx-auto flex h-10 w-10 items-center justify-center rounded-full border-2 border-[var(--accent)] bg-[var(--accent-muted)] text-sm font-bold text-[var(--accent)] sm:mx-0"
							>2</span
						>
						<h3 class="mt-4 font-semibold">Review & refine</h3>
						<p class="mt-2 text-sm text-[var(--text-muted)]">
							Quick pass to confirm spelling and roles—takes seconds.
						</p>
					</li>
					<li class="relative text-center sm:text-left">
						<span
							class="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)] text-sm font-bold text-[var(--text)] sm:mx-0"
							>3</span
						>
						<h3 class="mt-4 font-semibold">Save the contact</h3>
						<p class="mt-2 text-sm text-[var(--text-muted)]">
							Add to your phone and keep your pipeline moving.
						</p>
					</li>
				</ol>
			</div>
		</section>

		<!-- Value line -->
		<section class="border-y border-[var(--border)] bg-[var(--bg-surface)] py-16 sm:py-20">
			<div class="mx-auto max-w-3xl px-4 text-center sm:px-6">
				<p class="text-xl leading-relaxed font-medium text-[var(--text)] sm:text-2xl">
					A business card should start a relationship—not end up in a drawer.
				</p>
				<p class="mt-6 text-sm leading-relaxed text-[var(--text-muted)]">
					scan2contact is for people who leave conferences with real connections, not a pile of
					paper they will “deal with Monday.”
				</p>
			</div>
		</section>

		<!-- Final CTA -->
		<section class="py-20 sm:py-28">
			<div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
				<div
					class="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-raised)] px-6 py-14 text-center sm:px-12 sm:py-16"
				>
					<div
						class="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-[var(--accent)]/10 blur-3xl"
						aria-hidden="true"
					></div>
					<h2 class="relative text-3xl font-semibold tracking-tight sm:text-4xl">
						Ready for your next event?
					</h2>
					<p class="relative mx-auto mt-4 max-w-lg text-[var(--text-muted)]">
						Create an account and turn the next stack of cards into real relationships.
					</p>
					<div class="relative mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
						<a
							href={resolve('/auth/signup')}
							class="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent)] px-8 text-base font-semibold text-[var(--accent-ink)] transition hover:bg-[var(--accent-hover)] active:scale-[0.99]"
						>
							Get started free
						</a>
						<a
							href={resolve('/app')}
							class="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-strong)] px-8 text-base font-semibold text-[var(--text)] transition hover:bg-[var(--bg-surface)] active:scale-[0.99]"
						>
							I already have an account
						</a>
					</div>
				</div>
			</div>
		</section>
	</main>

	<footer class="border-t border-[var(--border)] py-10">
		<div
			class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6 lg:px-8"
		>
			<p class="text-sm text-[var(--text-subtle)]">© {new Date().getFullYear()} scan2contact</p>
			<nav class="flex flex-wrap items-center justify-center gap-6 text-sm" aria-label="Footer">
				<a
					href={resolve('/auth/login')}
					class="text-[var(--text-muted)] transition hover:text-[var(--accent)]">Log in</a
				>
				<a
					href={resolve('/auth/signup')}
					class="text-[var(--text-muted)] transition hover:text-[var(--accent)]">Sign up</a
				>
				<a
					href={resolve('/app')}
					class="text-[var(--text-muted)] transition hover:text-[var(--accent)]">App</a
				>
			</nav>
		</div>
	</footer>
</div>
