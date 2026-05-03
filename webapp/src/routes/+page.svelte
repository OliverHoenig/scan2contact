<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<svelte:head>
	<title>scan2contact — Turn business cards into contacts in seconds</title>
	<meta
		name="description"
		content="Scan business cards at events and meetings. Save contacts fast and send follow-up emails from your own templates—built for professionals who network."
	/>
</svelte:head>

<div class="min-h-dvh text-[var(--text)]">
	<header class="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--bg-base)]">
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
					href={resolve('/auth/login')}
					class="rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium text-[var(--text-muted)] transition hover:bg-[var(--bg-raised)] hover:text-[var(--text)]"
				>
					Log in
				</a>
				<a
					href={resolve('/auth/signup')}
					class="inline-flex min-h-10 items-center justify-center rounded-[var(--radius-sm)] border border-transparent bg-[linear-gradient(145deg,var(--accent)_0%,var(--accent-end)_100%)] px-4 py-2 text-sm font-semibold text-[var(--accent-ink)] transition hover:brightness-110 active:scale-[0.98]"
				>
					Get started
				</a>
			</nav>
		</div>
	</header>

	<main>
		<!-- Hero -->
		<section
			class="relative mx-auto max-w-6xl overflow-hidden px-4 pt-14 pb-20 sm:px-6 sm:pt-20 sm:pb-28 lg:px-8"
		>
			<div class="ambient-scan-grid ambient-scan-grid--hero" aria-hidden="true"></div>
			<div
				class="relative z-10 mx-auto max-w-6xl rounded-[2rem] border border-[var(--border)] bg-[var(--bg-raised)] px-6 py-12 sm:px-10 sm:py-14 lg:px-14 lg:py-16"
			>
				<div
					class="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(220px,17.5rem)] lg:gap-14 xl:gap-16"
				>
					<div class="text-center lg:text-left">
						<p
							class="text-xs font-semibold tracking-[0.22em] text-[var(--accent)] uppercase sm:text-sm"
						>
							For people who network
						</p>
						<h1
							class="mt-4 text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]"
						>
							Never lose another lead from a business card.
						</h1>
						<p
							class="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-pretty text-[var(--text-muted)] sm:text-xl lg:mx-0"
						>
							Scan the business card and turn it into a clean contact you can save in seconds. Then
							send a follow-up mail with one click based on your individual mail templates while the
							conversation is still fresh.
						</p>
						<div
							class="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center lg:justify-start"
						>
							<a
								href={resolve('/auth/signup')}
								class="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--bg-base)] px-8 text-base font-semibold text-[var(--text)] transition hover:border-[var(--border)] hover:bg-[var(--bg-input)] active:scale-[0.99]"
							>
								Start scanning free
								<svg
									class="h-4 w-4 opacity-90"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									aria-hidden="true"
								>
									<path d="M5 12h14M13 6l6 6-6 6" />
								</svg>
							</a>
							<a
								href={resolve('/app/scan')}
								class="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-md)] border border-transparent bg-[linear-gradient(145deg,var(--accent)_0%,var(--accent-end)_100%)] px-8 text-base font-semibold text-[var(--accent-ink)] transition hover:brightness-110 active:scale-[0.99]"
							>
								Open the app
							</a>
						</div>
						<p class="mt-5 text-sm text-[var(--text-subtle)]">Free to try · No credit card</p>
					</div>

					<div class="hero-scan-demo flex flex-col items-center" aria-hidden="true">
						<div class="hero-scan-phone">
							<span class="hero-scan-phone__power" aria-hidden="true"></span>
							<div class="hero-scan-phone__ledge">
								<div class="hero-scan-phone__notch"></div>
							</div>
							<div class="hero-scan-phone__screen">
								<div class="hero-scan-frame">
									<div class="hero-scan-card-mock">
										<p class="hero-scan-card-mock__kind">Business card</p>
										<p class="hero-scan-card-mock__name">Alex Morgan</p>
										<p class="hero-scan-card-mock__role">Partnerships · Acme Studio</p>
										<div class="hero-scan-card-mock__divider"></div>
										<p class="hero-scan-card-mock__detail">alex@acme.co</p>
										<p class="hero-scan-card-mock__detail hero-scan-card-mock__detail--muted">
											+1 (415) 555‑0142
										</p>
									</div>
									<div class="hero-scan-fx">
										<div class="hero-scan-fx-idle-grid"></div>
										<div class="hero-scan-fx-sweep"></div>
									</div>
								</div>
							</div>
						</div>
						<p class="hero-scan-label">Works on your phone</p>
					</div>
				</div>
			</div>

			<!-- Product preview card -->
			<div class="relative z-10 mx-auto mt-16 max-w-2xl lg:mt-20">
				<div class="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)]">
					<video src="/videos/preview.mp4" autoplay muted loop class="h-full w-full object-cover"
					></video>
				</div>
			</div>
		</section>

		<!-- Benefits -->
		<section
			class="relative overflow-hidden border-t border-[var(--border)] bg-[var(--bg-raised)] py-20 sm:py-24"
			aria-labelledby="benefits-heading"
		>
			<div class="ambient-scan-grid ambient-scan-grid--soft" aria-hidden="true"></div>
			<div class="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
				<div class="mx-auto max-w-2xl text-center">
					<h2 id="benefits-heading" class="text-3xl font-semibold tracking-tight sm:text-4xl">
						Built for busy professionals
					</h2>
					<p class="mt-3 text-[var(--text-muted)]">
						No manual retyping, no mystery pile of cards, no vague “we should connect” with nothing
						to act on.
					</p>
				</div>
				<ul class="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
					<li
						class="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-base)] p-6 transition hover:border-[var(--border-strong)]"
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
									d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
						</div>
						<h3 class="mt-4 text-lg font-semibold">The pile that never becomes action</h3>
						<p class="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
							Buyers, partners, suppliers, candidates: the cards stack up, then names fade and
							follow-ups stall. Scan on the spot so every intro is a real contact while you still
							remember why you met.
						</p>
					</li>
					<li
						class="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-base)] p-6 transition hover:border-[var(--border-strong)]"
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
						<h3 class="mt-4 text-lg font-semibold">End the manual typing</h3>
						<p class="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
							Stop copying name, title, email, and phone by hand. Snap the card and scan2contact
							extracts the contact information so you can save it directly to your phone contacts.
						</p>
					</li>
					<li
						class="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-base)] p-6 transition hover:border-[var(--border-strong)]"
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
									d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
								/>
							</svg>
						</div>
						<h3 class="mt-4 text-lg font-semibold">Follow up the moment you scan</h3>
						<p class="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
							Keep your best intros, thank-yous, and “great to meet you” notes as templates. After a
							scan with one click your mail app opens with To, subject, and body already filled,
							ready to send.
						</p>
					</li>
				</ul>
			</div>
		</section>

		<!-- Steps: four alternating text / video sections -->
		<section
			class="border-t border-[var(--border)] bg-[var(--bg-base)]"
			aria-labelledby="steps-heading"
		>
			<div class="mx-auto max-w-6xl px-4 pt-16 pb-4 text-center sm:px-6 sm:pt-20 lg:px-8">
				<h2
					id="steps-heading"
					class="text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
				>
					How it works
				</h2>
				<p class="mx-auto mt-3 max-w-xl text-sm text-[var(--text-muted)] sm:text-base">
					From scan to saved contact to a follow-up you send while the conversation still matters.
				</p>
			</div>

			<ol class="list-none">
				<!-- 1 Scan contact: copy left, video right -->
				<li class="border-t border-[var(--border)]">
					<div
						class="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:gap-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:gap-16 lg:px-8"
					>
						<div class="text-center lg:text-left">
							<span
								class="inline-flex h-9 min-w-9 items-center justify-center rounded-full border-2 border-[var(--accent)] bg-[var(--accent-muted)] text-sm font-bold text-[var(--accent)]"
								>1</span
							>
							<h3
								class="mt-4 text-2xl font-semibold tracking-tight text-balance uppercase sm:text-3xl"
							>
								Scan contact
							</h3>
							<p
								class="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--text-muted)] lg:mx-0"
							>
								Point your camera at the card. We pull name, title, email, and phone so you skip the
								typing and keep the momentum from the room.
							</p>
							<ul
								class="mx-auto mt-6 max-w-md space-y-3 text-left text-sm text-[var(--text)] lg:mx-0"
							>
								<li class="flex gap-3">
									<span
										class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-muted)] text-[var(--accent)]"
										aria-hidden="true"
									>
										<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="3"
												d="M5 13l4 4L19 7"
											/>
										</svg>
									</span>
									<span>Works in your mobile browser. No new app to install.</span>
								</li>
								<li class="flex gap-3">
									<span
										class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-muted)] text-[var(--accent)]"
										aria-hidden="true"
									>
										<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="3"
												d="M5 13l4 4L19 7"
											/>
										</svg>
									</span>
									<span>Good light and a flat card give the cleanest fields.</span>
								</li>
								<li class="flex gap-3">
									<span
										class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-muted)] text-[var(--accent)]"
										aria-hidden="true"
									>
										<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="3"
												d="M5 13l4 4L19 7"
											/>
										</svg>
									</span>
									<span>Seconds per card, not minutes at the keyboard.</span>
								</li>
							</ul>
						</div>
						<div
							class="aspect-video w-full overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-raised)]"
							role="img"
							aria-label="Video placeholder: scan contact"
						>
							<!-- Replace inner block with <video> when asset is ready -->
							<div
								class="flex h-full w-full flex-col items-center justify-center gap-2 px-6 text-center"
							>
								<svg
									class="h-12 w-12 text-[var(--text-subtle)] opacity-50"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-hidden="true"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="1.5"
										d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
									/>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="1.5"
										d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								<p class="text-sm font-medium text-[var(--text-muted)]">Video: scan contact</p>
								<p class="text-xs text-[var(--text-subtle)]">Placeholder. Add your clip here.</p>
							</div>
						</div>
					</div>
				</li>

				<!-- 2 Review: video left, copy right -->
				<li class="border-t border-[var(--border)]">
					<div
						class="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:gap-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:gap-16 lg:px-8"
					>
						<div
							class="order-2 aspect-video w-full overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-raised)] lg:order-1"
							role="img"
							aria-label="Video placeholder: review"
						>
							<div
								class="flex h-full w-full flex-col items-center justify-center gap-2 px-6 text-center"
							>
								<svg
									class="h-12 w-12 text-[var(--text-subtle)] opacity-50"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-hidden="true"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="1.5"
										d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
									/>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="1.5"
										d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								<p class="text-sm font-medium text-[var(--text-muted)]">Video: review</p>
								<p class="text-xs text-[var(--text-subtle)]">Placeholder. Add your clip here.</p>
							</div>
						</div>
						<div class="order-1 text-center lg:order-2 lg:text-left">
							<span
								class="inline-flex h-9 min-w-9 items-center justify-center rounded-full border-2 border-[var(--accent)] bg-[var(--accent-muted)] text-sm font-bold text-[var(--accent)]"
								>2</span
							>
							<h3
								class="mt-4 text-2xl font-semibold tracking-tight text-balance uppercase sm:text-3xl"
							>
								Review in seconds
							</h3>
							<p
								class="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--text-muted)] lg:mx-0"
							>
								Most fields land correct on the first pass. Change only what looks off and you are
								still faster than typing the whole card by hand.
							</p>
							<ul
								class="mx-auto mt-6 max-w-md space-y-3 text-left text-sm text-[var(--text)] lg:mx-0"
							>
								<li class="flex gap-3">
									<span
										class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-muted)] text-[var(--accent)]"
										aria-hidden="true"
									>
										<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="3"
												d="M5 13l4 4L19 7"
											/>
										</svg>
									</span>
									<span>One screen for names, titles, and company.</span>
								</li>
								<li class="flex gap-3">
									<span
										class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-muted)] text-[var(--accent)]"
										aria-hidden="true"
									>
										<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="3"
												d="M5 13l4 4L19 7"
											/>
										</svg>
									</span>
									<span>Tap to fix a line. Leave the rest as is.</span>
								</li>
								<li class="flex gap-3">
									<span
										class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-muted)] text-[var(--accent)]"
										aria-hidden="true"
									>
										<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="3"
												d="M5 13l4 4L19 7"
											/>
										</svg>
									</span>
									<span>Ten seconds of review beats five minutes of retyping.</span>
								</li>
							</ul>
						</div>
					</div>
				</li>

				<!-- 3 Save as contact: copy left, video right -->
				<li class="border-t border-[var(--border)]">
					<div
						class="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:gap-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:gap-16 lg:px-8"
					>
						<div class="text-center lg:text-left">
							<span
								class="inline-flex h-9 min-w-9 items-center justify-center rounded-full border-2 border-[var(--accent)] bg-[var(--accent-muted)] text-sm font-bold text-[var(--accent)]"
								>3</span
							>
							<h3
								class="mt-4 text-2xl font-semibold tracking-tight text-balance uppercase sm:text-3xl"
							>
								Save as contact
							</h3>
							<p
								class="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--text-muted)] lg:mx-0"
							>
								Put the lead where you will actually use it. Your address book becomes the single
								place you trust when it is time to call, text, or forward the intro.
							</p>
							<ul
								class="mx-auto mt-6 max-w-md space-y-3 text-left text-sm text-[var(--text)] lg:mx-0"
							>
								<li class="flex gap-3">
									<span
										class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-muted)] text-[var(--accent)]"
										aria-hidden="true"
									>
										<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="3"
												d="M5 13l4 4L19 7"
											/>
										</svg>
									</span>
									<span>Save to phone contacts in one tap.</span>
								</li>
								<li class="flex gap-3">
									<span
										class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-muted)] text-[var(--accent)]"
										aria-hidden="true"
									>
										<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="3"
												d="M5 13l4 4L19 7"
											/>
										</svg>
									</span>
									<span>Export a vCard when someone else needs the file.</span>
								</li>
								<li class="flex gap-3">
									<span
										class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-muted)] text-[var(--accent)]"
										aria-hidden="true"
									>
										<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="3"
												d="M5 13l4 4L19 7"
											/>
										</svg>
									</span>
									<span>Paper gets lost. Your digital contact stays.</span>
								</li>
							</ul>
						</div>
						<div
							class="aspect-video w-full overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-raised)]"
							role="img"
							aria-label="Video placeholder: save as contact"
						>
							<div
								class="flex h-full w-full flex-col items-center justify-center gap-2 px-6 text-center"
							>
								<svg
									class="h-12 w-12 text-[var(--text-subtle)] opacity-50"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-hidden="true"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="1.5"
										d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
									/>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="1.5"
										d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								<p class="text-sm font-medium text-[var(--text-muted)]">Video: save as contact</p>
								<p class="text-xs text-[var(--text-subtle)]">Placeholder. Add your clip here.</p>
							</div>
						</div>
					</div>
				</li>

				<!-- 4 Follow-up: video left, copy right -->
				<li class="border-t border-[var(--border)]">
					<div
						class="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:gap-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:gap-16 lg:px-8"
					>
						<div
							class="order-2 aspect-video w-full overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-raised)] lg:order-1"
							role="img"
							aria-label="Video placeholder: follow-up"
						>
							<div
								class="flex h-full w-full flex-col items-center justify-center gap-2 px-6 text-center"
							>
								<svg
									class="h-12 w-12 text-[var(--text-subtle)] opacity-50"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-hidden="true"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="1.5"
										d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
									/>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="1.5"
										d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								<p class="text-sm font-medium text-[var(--text-muted)]">Video: follow-up</p>
								<p class="text-xs text-[var(--text-subtle)]">Placeholder. Add your clip here.</p>
							</div>
						</div>
						<div class="order-1 text-center lg:order-2 lg:text-left">
							<span
								class="inline-flex h-9 min-w-9 items-center justify-center rounded-full border-2 border-[var(--accent)] bg-[var(--accent-muted)] text-sm font-bold text-[var(--accent)]"
								>4</span
							>
							<h3
								class="mt-4 text-2xl font-semibold tracking-tight text-balance uppercase sm:text-3xl"
							>
								Follow-up
							</h3>
							<p
								class="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--text-muted)] lg:mx-0"
							>
								Send the note while the handshake still counts. Templates keep your voice consistent
								so every new lead gets a message that sounds like you, not a blank screen.
							</p>
							<ul
								class="mx-auto mt-6 max-w-md space-y-3 text-left text-sm text-[var(--text)] lg:mx-0"
							>
								<li class="flex gap-3">
									<span
										class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-muted)] text-[var(--accent)]"
										aria-hidden="true"
									>
										<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="3"
												d="M5 13l4 4L19 7"
											/>
										</svg>
									</span>
									<span>Merge their details from the scan. Press send.</span>
								</li>
								<li class="flex gap-3">
									<span
										class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-muted)] text-[var(--accent)]"
										aria-hidden="true"
									>
										<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="3"
												d="M5 13l4 4L19 7"
											/>
										</svg>
									</span>
									<span>Reuse the emails that already earn replies.</span>
								</li>
								<li class="flex gap-3">
									<span
										class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-muted)] text-[var(--accent)]"
										aria-hidden="true"
									>
										<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="3"
												d="M5 13l4 4L19 7"
											/>
										</svg>
									</span>
									<span>Same day follow-up wins more deals than a card in your bag.</span>
								</li>
							</ul>
						</div>
					</div>
				</li>
			</ol>
		</section>

		<!-- Mobile browser: camera + web, no install, optional PWA -->
		<section
			class="relative overflow-hidden border-t border-[var(--border)] bg-[var(--bg-raised)] py-16 sm:py-20"
			aria-labelledby="mobile-web-heading"
		>
			<div class="ambient-scan-grid ambient-scan-grid--soft" aria-hidden="true"></div>
			<div class="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
				<div class="mx-auto max-w-2xl text-center">
					<h2 id="mobile-web-heading" class="text-3xl font-semibold tracking-tight sm:text-4xl">
						Built for your phone
					</h2>
					<p class="mt-3 text-pretty text-[var(--text-muted)] sm:text-lg">
						scan2contact is made for mobile: you scan with your phone's camera inside the browser.
						If your handset has a current mobile browser and a working camera, you are good to go.
					</p>
				</div>
				<div class="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					<div
						class="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-base)] p-6 text-left sm:p-7"
					>
						<div
							class="flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent-muted)] text-[var(--accent)]"
							aria-hidden="true"
						>
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
						</div>
						<h3 class="mt-4 text-lg font-semibold">Any smartphone with a browser and camera</h3>
						<p class="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
							iPhone or Android, Safari or Chrome: open the site, allow camera access, and capture
							the card. The flow is tuned for small screens so you can work quickly right after a
							handshake.
						</p>
					</div>
					<div
						class="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-base)] p-6 text-left sm:p-7"
					>
						<div
							class="flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent-muted)] text-[var(--accent)]"
							aria-hidden="true"
						>
							<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
								/>
							</svg>
						</div>
						<h3 class="mt-4 text-lg font-semibold">Nothing to download</h3>
						<p class="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
							On your phone there is no app store install and no separate file to fetch first. Open
							your link, sign in, and scan. The page loads like any website, so you are not stuck
							behind a download before you capture the lead.
						</p>
					</div>
					<div
						class="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-base)] p-6 text-left sm:col-span-2 sm:p-7 lg:col-span-1"
					>
						<div
							class="flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent-muted)] text-[var(--accent)]"
							aria-hidden="true"
						>
							<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
								/>
							</svg>
						</div>
						<h3 class="mt-4 text-lg font-semibold">Optional: add it to your home screen</h3>
						<p class="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
							scan2contact is a progressive web app. On your phone you can install it or add it to
							your home screen from the browser menu, so it opens in its own window like a native
							app. You still never had to use an app store; the shortcut is optional when you want
							one-tap access after the first visit.
						</p>
					</div>
				</div>
			</div>
		</section>

		<!-- Value line -->
		<section
			class="relative overflow-hidden border-y border-[var(--border)] bg-[var(--bg-raised)] py-16 sm:py-20"
		>
			<div class="ambient-scan-grid ambient-scan-grid--hero" aria-hidden="true"></div>
			<div class="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6">
				<p class="text-xl leading-relaxed font-medium text-[var(--text)] sm:text-2xl">
					A business card should start a relationship—not end up in a drawer.
				</p>
				<p class="mt-6 text-sm leading-relaxed text-[var(--text-muted)]">
					scan2contact closes the loop: capture without retyping, keep the details even when the
					card is gone, and use email templates to turn every scan into a real follow-up before the
					next conversation crowds it out.
				</p>
			</div>
		</section>

		<!-- Final CTA -->
		<section class="py-20 sm:py-28">
			<div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
				<div
					class="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-raised)] text-center"
				>
					<div class="ambient-scan-grid ambient-scan-grid--cta" aria-hidden="true"></div>
					<div class="relative z-10 px-6 py-14 sm:px-12 sm:py-16">
						<h2 class="text-3xl font-semibold tracking-tight sm:text-4xl">
							Ready for your next networking event?
						</h2>
						<p class="mx-auto mt-4 max-w-lg text-[var(--text-muted)]">
							Create an account—fewer spreadsheets, fewer lost cards, and follow-ups you can start
							the same day.
						</p>
						<div class="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
							<a
								href={resolve('/auth/signup')}
								class="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--bg-base)] px-8 text-base font-semibold text-[var(--text)] transition hover:border-[var(--border)] hover:bg-[var(--bg-input)] active:scale-[0.99]"
							>
								Get started free
								<svg
									class="h-4 w-4"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									aria-hidden="true"
								>
									<path d="M5 12h14M13 6l6 6-6 6" />
								</svg>
							</a>
							<a
								href={resolve('/app/scan')}
								class="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-md)] border border-transparent bg-[linear-gradient(145deg,var(--accent)_0%,var(--accent-end)_100%)] px-8 text-base font-semibold text-[var(--accent-ink)] transition hover:brightness-110 active:scale-[0.99]"
							>
								I already have an account
							</a>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- FAQ -->
		<section
			class="border-t border-[var(--border)] bg-[var(--bg-base)] py-20 sm:py-24"
			aria-labelledby="faq-heading"
		>
			<div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
				<div class="text-center">
					<h2 id="faq-heading" class="text-3xl font-semibold tracking-tight sm:text-4xl">
						Frequently asked questions
					</h2>
					<p class="mt-3 text-[var(--text-muted)]">
						Quick answers for people comparing business card scanners and contact capture tools.
					</p>
				</div>
				<div class="mt-12 space-y-3">
					<details
						class="group rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-raised)] px-5 transition open:border-[var(--border-strong)] hover:border-[var(--border-strong)]"
					>
						<summary
							class="cursor-pointer list-none py-4 pr-8 text-left text-base font-semibold text-[var(--text)] marker:content-none [&::-webkit-details-marker]:hidden"
						>
							Is there an app that scans business cards and saves them as contacts?
						</summary>
						<p
							class="border-t border-[var(--border)] pt-3 pb-4 text-sm leading-relaxed text-[var(--text-muted)]"
						>
							Yes. scan2contact is built for exactly that: you photograph the card, we pull out
							name, title, company, email, phone, and more, and you get a clean contact you can save
							or share without retyping every field.
						</p>
					</details>
					<details
						class="group rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-raised)] px-5 transition open:border-[var(--border-strong)] hover:border-[var(--border-strong)]"
					>
						<summary
							class="cursor-pointer list-none py-4 pr-8 text-left text-base font-semibold text-[var(--text)] marker:content-none [&::-webkit-details-marker]:hidden"
						>
							How accurate is the scan? Will I still have to fix mistakes?
						</summary>
						<p
							class="border-t border-[var(--border)] pt-3 pb-4 text-sm leading-relaxed text-[var(--text-muted)]"
						>
							Extraction is strong on typical cards, but no OCR is perfect. You get a fast review
							screen so a 10-second check beats 5 minutes of manual entry, and you only touch what
							actually needs it.
						</p>
					</details>
					<details
						class="group rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-raised)] px-5 transition open:border-[var(--border-strong)] hover:border-[var(--border-strong)]"
					>
						<summary
							class="cursor-pointer list-none py-4 pr-8 text-left text-base font-semibold text-[var(--text)] marker:content-none [&::-webkit-details-marker]:hidden"
						>
							Is it free to try? Do I need a credit card?
						</summary>
						<p
							class="border-t border-[var(--border)] pt-3 pb-4 text-sm leading-relaxed text-[var(--text-muted)]"
						>
							You can start scanning without a credit card. Try the flow on your own cards first;
							when you see how much time it saves at an event, upgrading is a simple decision, not a
							guess.
						</p>
					</details>
					<details
						class="group rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-raised)] px-5 transition open:border-[var(--border-strong)] hover:border-[var(--border-strong)]"
					>
						<summary
							class="cursor-pointer list-none py-4 pr-8 text-left text-base font-semibold text-[var(--text)] marker:content-none [&::-webkit-details-marker]:hidden"
						>
							Does it work on iPhone and Android?
						</summary>
						<p
							class="border-t border-[var(--border)] pt-3 pb-4 text-sm leading-relaxed text-[var(--text-muted)]"
						>
							Yes. It runs in the browser on your phone, so you are not juggling yet another native
							app store install just to capture a lead at a conference.
						</p>
					</details>
					<details
						class="group rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-raised)] px-5 transition open:border-[var(--border-strong)] hover:border-[var(--border-strong)]"
					>
						<summary
							class="cursor-pointer list-none py-4 pr-8 text-left text-base font-semibold text-[var(--text)] marker:content-none [&::-webkit-details-marker]:hidden"
						>
							What happens to my scans and data? Is it private?
						</summary>
						<p
							class="border-t border-[var(--border)] pt-3 pb-4 text-sm leading-relaxed text-[var(--text-muted)]"
						>
							Your contacts are yours. We built this for professionals who care about trust: you are
							not handing business cards to a random consumer app with unclear policies. Use the
							product, judge the experience, and rely on your account like any serious tool.
						</p>
					</details>
					<details
						class="group rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-raised)] px-5 transition open:border-[var(--border-strong)] hover:border-[var(--border-strong)]"
					>
						<summary
							class="cursor-pointer list-none py-4 pr-8 text-left text-base font-semibold text-[var(--text)] marker:content-none [&::-webkit-details-marker]:hidden"
						>
							Can I save to my phone contacts or export a vCard (VCF)?
						</summary>
						<p
							class="border-t border-[var(--border)] pt-3 pb-4 text-sm leading-relaxed text-[var(--text-muted)]"
						>
							Yes. The goal is a contact you can actually use: save to your address book, share a
							vCard with a colleague, or drop the details into your CRM without retyping from a
							photo in your camera roll.
						</p>
					</details>
					<details
						class="group rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-raised)] px-5 transition open:border-[var(--border-strong)] hover:border-[var(--border-strong)]"
					>
						<summary
							class="cursor-pointer list-none py-4 pr-8 text-left text-base font-semibold text-[var(--text)] marker:content-none [&::-webkit-details-marker]:hidden"
						>
							Why not just add people on LinkedIn or type them into Contacts?
						</summary>
						<p
							class="border-t border-[var(--border)] pt-3 pb-4 text-sm leading-relaxed text-[var(--text-muted)]"
						>
							LinkedIn is great for staying connected, but it does not capture everything on the
							card, like direct email, mobile number, or notes from the conversation. Typing works
							until you have twenty cards after one evening. scan2contact is the bridge: structured
							data in seconds, then you choose where it lives.
						</p>
					</details>
					<details
						class="group rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-raised)] px-5 transition open:border-[var(--border-strong)] hover:border-[var(--border-strong)]"
					>
						<summary
							class="cursor-pointer list-none py-4 pr-8 text-left text-base font-semibold text-[var(--text)] marker:content-none [&::-webkit-details-marker]:hidden"
						>
							What if the card is glossy, curved, or the lighting is bad?
						</summary>
						<p
							class="border-t border-[var(--border)] pt-3 pb-4 text-sm leading-relaxed text-[var(--text-muted)]"
						>
							Shoot in reasonable light and lay the card flat when you can. Small habits help any
							camera. When a card is tricky, you still win: fixing a few characters beats typing the
							whole thing, and you already have a digital backup if the paper disappears.
						</p>
					</details>
					<details
						class="group rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-raised)] px-5 transition open:border-[var(--border-strong)] hover:border-[var(--border-strong)]"
					>
						<summary
							class="cursor-pointer list-none py-4 pr-8 text-left text-base font-semibold text-[var(--text)] marker:content-none [&::-webkit-details-marker]:hidden"
						>
							Do I need internet to scan a business card?
						</summary>
						<p
							class="border-t border-[var(--border)] pt-3 pb-4 text-sm leading-relaxed text-[var(--text-muted)]"
						>
							Scanning and extraction run through the product online, so a connection is needed for
							the magic. For venue Wi‑Fi that drops, snap the photo when you can and finish the scan
							when you are back on a stable network, which is still faster than a pile of cards on
							your desk.
						</p>
					</details>
					<details
						class="group rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-raised)] px-5 transition open:border-[var(--border-strong)] hover:border-[var(--border-strong)]"
					>
						<summary
							class="cursor-pointer list-none py-4 pr-8 text-left text-base font-semibold text-[var(--text)] marker:content-none [&::-webkit-details-marker]:hidden"
						>
							Which languages or card layouts are supported?
						</summary>
						<p
							class="border-t border-[var(--border)] pt-3 pb-4 text-sm leading-relaxed text-[var(--text-muted)]"
						>
							Standard business-card layouts and common scripts work well. Unusual designs may need
							an extra tap in review, which is still far less work than manual entry across a
							multilingual stack of cards after a trip.
						</p>
					</details>
				</div>
			</div>
		</section>
	</main>

	<footer class="border-t border-[var(--border)] bg-[var(--bg-base)] py-10">
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
					href={resolve('/app/scan')}
					class="text-[var(--text-muted)] transition hover:text-[var(--accent)]">App</a
				>
			</nav>
		</div>
	</footer>
</div>
