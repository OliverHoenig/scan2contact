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
						href={resolve('/app/scan')}
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
						No manual retyping, no mystery pile of cards, no vague “we should connect” with nothing
						to act on.
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
						<h3 class="mt-4 text-lg font-semibold">End the manual typing</h3>
						<p class="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
							Stop copying name, title, email, and phone by hand. Snap the card—we extract the
							fields so you only adjust what needs a quick fix.
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
									d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
								/>
							</svg>
						</div>
						<h3 class="mt-4 text-lg font-semibold">The card can disappear—the contact won’t</h3>
						<p class="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
							Paper gets lost in bags, hotel rooms, and airport security. Your scan becomes a
							digital record on your device, so the lead isn’t gone when the cardstock is.
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
									d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
								/>
							</svg>
						</div>
						<h3 class="mt-4 text-lg font-semibold">A clear next step, every time</h3>
						<p class="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
							Turn the handshake into something actionable: a contact ready to save, share, or use
							for a same-day follow-up—instead of a card you’ll “deal with later.”
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
						<h3 class="mt-4 font-semibold">Save or share—then follow up</h3>
						<p class="mt-2 text-sm text-[var(--text-muted)]">
							Put the person in your address book or export a vCard so your next email or call is
							obvious, not another open loop.
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
					scan2contact closes the loop: capture without retyping, keep the details even when the
					card is gone, and walk away with a contact you can actually act on.
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
						Ready for your next networking event?
					</h2>
					<p class="relative mx-auto mt-4 max-w-lg text-[var(--text-muted)]">
						Create an account—fewer spreadsheets, fewer lost cards, and follow-ups you can start the
						same day.
					</p>
					<div class="relative mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
						<a
							href={resolve('/auth/signup')}
							class="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent)] px-8 text-base font-semibold text-[var(--accent-ink)] transition hover:bg-[var(--accent-hover)] active:scale-[0.99]"
						>
							Get started free
						</a>
						<a
							href={resolve('/app/scan')}
							class="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-strong)] px-8 text-base font-semibold text-[var(--text)] transition hover:bg-[var(--bg-surface)] active:scale-[0.99]"
						>
							I already have an account
						</a>
					</div>
				</div>
			</div>
		</section>

		<!-- FAQ -->
		<section
			class="border-t border-[var(--border)] bg-[var(--bg-raised)]/30 py-20 sm:py-24"
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
						class="group rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-surface)] px-5 transition open:border-[var(--border-strong)] open:shadow-sm hover:border-[var(--border-strong)]"
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
						class="group rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-surface)] px-5 transition open:border-[var(--border-strong)] open:shadow-sm hover:border-[var(--border-strong)]"
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
						class="group rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-surface)] px-5 transition open:border-[var(--border-strong)] open:shadow-sm hover:border-[var(--border-strong)]"
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
						class="group rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-surface)] px-5 transition open:border-[var(--border-strong)] open:shadow-sm hover:border-[var(--border-strong)]"
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
						class="group rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-surface)] px-5 transition open:border-[var(--border-strong)] open:shadow-sm hover:border-[var(--border-strong)]"
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
						class="group rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-surface)] px-5 transition open:border-[var(--border-strong)] open:shadow-sm hover:border-[var(--border-strong)]"
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
						class="group rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-surface)] px-5 transition open:border-[var(--border-strong)] open:shadow-sm hover:border-[var(--border-strong)]"
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
						class="group rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-surface)] px-5 transition open:border-[var(--border-strong)] open:shadow-sm hover:border-[var(--border-strong)]"
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
						class="group rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-surface)] px-5 transition open:border-[var(--border-strong)] open:shadow-sm hover:border-[var(--border-strong)]"
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
						class="group rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-surface)] px-5 transition open:border-[var(--border-strong)] open:shadow-sm hover:border-[var(--border-strong)]"
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
					href={resolve('/app/scan')}
					class="text-[var(--text-muted)] transition hover:text-[var(--accent)]">App</a
				>
			</nav>
		</div>
	</footer>
</div>
