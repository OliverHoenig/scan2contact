<script lang="ts">
	import { resolve } from '$app/paths';
	import { emailPasswordSignUpForm } from '$lib/auth/server/auth.remote';

	let showPassword = $state(false);
	let showConfirmPassword = $state(false);
</script>

<svelte:head>
	<title>Sign up | scan2contact</title>
</svelte:head>

<div class="relative flex min-h-dvh flex-col lg:flex-row">
	<div
		class="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_70%_45%_at_80%_20%,var(--auth-glow),transparent_50%)]"
		aria-hidden="true"
	></div>
	<!-- Form column -->
	<div class="flex flex-1 flex-col justify-center px-4 py-10 sm:px-8 lg:py-16">
		<div class="mx-auto w-full max-w-md">
			<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<header>
					<p class="text-sm font-semibold tracking-wide text-[var(--cc-muted)]">Create account</p>
					<h2 class="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
						Sign up to scan2contact
					</h2>
				</header>
				<p class="text-sm text-[var(--cc-muted)] sm:max-w-[11rem] sm:text-right">
					Already an account?
					<a
						href={resolve('/auth/login')}
						class="font-medium text-[var(--cc-fg)] underline-offset-4 hover:underline">Log in</a
					>
				</p>
			</div>

			<form class="mt-8 space-y-5" {...emailPasswordSignUpForm}>
				<div
					class="rounded-3xl border border-[var(--cc-border)] bg-[var(--cc-surface)] p-5 shadow-sm sm:p-6"
				>
					<label for="signup-name" class="text-sm font-medium text-[var(--cc-muted)]"
						>Your name</label
					>
					<input
						id="signup-name"
						class="mt-2 w-full rounded-xl border border-[var(--cc-border)] bg-[var(--cc-bg)] px-4 py-3 text-[var(--cc-fg)] outline-none placeholder:text-[var(--cc-muted)]/60 focus:border-transparent focus:ring-2 focus:ring-[var(--cc-ring)]"
						placeholder="Your full name"
						required
						autocomplete="name"
						{...emailPasswordSignUpForm.fields.name.as('text')}
					/>
					{#each emailPasswordSignUpForm.fields.name.issues() as issue}
						<p class="mt-2 text-xs text-rose-300">
							{issue.message}
						</p>
					{/each}

					<label for="signup-email" class="mt-4 block text-sm font-medium text-[var(--cc-muted)]"
						>Email</label
					>
					<input
						id="signup-email"
						class="mt-2 w-full rounded-xl border border-[var(--cc-border)] bg-[var(--cc-bg)] px-4 py-3 text-[var(--cc-fg)] outline-none placeholder:text-[var(--cc-muted)]/60 focus:border-transparent focus:ring-2 focus:ring-[var(--cc-ring)]"
						placeholder="you@company.com"
						required
						autocomplete="email"
						{...emailPasswordSignUpForm.fields.email.as('text')}
					/>
					{#each emailPasswordSignUpForm.fields.email.issues() as issue}
						<p class="mt-2 text-xs text-rose-300">
							{issue.message}
						</p>
					{/each}

					<label for="signup-password" class="mt-4 block text-sm font-medium text-[var(--cc-muted)]"
						>Create a password</label
					>
					<div class="relative mt-2">
						<input
							id="signup-password"
							class="w-full rounded-xl border border-[var(--cc-border)] bg-[var(--cc-bg)] py-3 pr-12 pl-4 text-[var(--cc-fg)] outline-none placeholder:text-[var(--cc-muted)]/60 focus:border-transparent focus:ring-2 focus:ring-[var(--cc-ring)]"
							placeholder="At least 8 characters"
							required
							autocomplete="new-password"
							{...emailPasswordSignUpForm.fields._password.as('password')}
							type={showPassword ? 'text' : 'password'}
						/>
						<button
							type="button"
							class="absolute top-1/2 right-3 -translate-y-1/2 rounded-lg p-1 text-[var(--cc-muted)] transition hover:bg-[var(--cc-surface-2)] hover:text-[var(--cc-fg)]"
							onclick={() => (showPassword = !showPassword)}
							aria-label={showPassword ? 'Hide password' : 'Show password'}
						>
							{#if showPassword}
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
										d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
									/>
								</svg>
							{:else}
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
										d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
									/>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
									/>
								</svg>
							{/if}
						</button>
					</div>
					{#each emailPasswordSignUpForm.fields._password.issues() as issue}
						<p class="mt-2 text-xs text-rose-300">
							{issue.message}
						</p>
					{/each}

					<label
						for="signup-confirm-password"
						class="mt-4 block text-sm font-medium text-[var(--cc-muted)]">Confirm password</label
					>
					<div class="relative mt-2">
						<input
							id="signup-confirm-password"
							class="w-full rounded-xl border border-[var(--cc-border)] bg-[var(--cc-bg)] py-3 pr-12 pl-4 text-[var(--cc-fg)] outline-none placeholder:text-[var(--cc-muted)]/60 focus:border-transparent focus:ring-2 focus:ring-[var(--cc-ring)]"
							placeholder="Repeat your password"
							required
							autocomplete="new-password"
							{...emailPasswordSignUpForm.fields.confirmPassword.as('password')}
							type={showConfirmPassword ? 'text' : 'password'}
						/>
						<button
							type="button"
							class="absolute top-1/2 right-3 -translate-y-1/2 rounded-lg p-1 text-[var(--cc-muted)] transition hover:bg-[var(--cc-surface-2)] hover:text-[var(--cc-fg)]"
							onclick={() => (showConfirmPassword = !showConfirmPassword)}
							aria-label={showConfirmPassword
								? 'Hide password confirmation'
								: 'Show password confirmation'}
						>
							{#if showConfirmPassword}
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
										d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
									/>
								</svg>
							{:else}
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
										d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
									/>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
									/>
								</svg>
							{/if}
						</button>
					</div>
					{#each emailPasswordSignUpForm.fields.confirmPassword.issues() as issue}
						<p class="mt-2 text-xs text-rose-300">
							{issue.message}
						</p>
					{/each}

					<div class="mt-5 flex gap-3">
						<input
							id="signup-terms"
							class="mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--cc-border)] bg-[var(--cc-bg)] text-[var(--cc-heat)] focus:ring-2 focus:ring-[var(--cc-ring)]"
							{...emailPasswordSignUpForm.fields.acceptTerms.as('checkbox')}
						/>
						<label for="signup-terms" class="text-sm leading-snug text-[var(--cc-muted)]">
							By creating an account, you agree to our Terms of Service and Privacy Policy.
						</label>
					</div>
					{#each emailPasswordSignUpForm.fields.acceptTerms.issues() as issue}
						<p class="mt-2 text-xs text-rose-300">
							{issue.message}
						</p>
					{/each}
				</div>

				<button
					type="submit"
					class="btn-accent-primary btn-accent-primary--r-md inline-flex min-h-12 w-full items-center justify-center px-6 text-sm font-semibold text-[var(--accent-ink)] shadow-[var(--shadow-btn-primary)] transition hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
				>
					Create account
				</button>

				{#if emailPasswordSignUpForm.result}
					<p
						class="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"
					>
						Account created successfully. You can continue to login.
					</p>
				{/if}
			</form>
			<p class="mt-4 text-center text-sm text-[var(--cc-muted)]">
				Already have an account?
				<a href={resolve('/auth/login')} class="font-medium text-[var(--cc-fg)] hover:underline"
					>Login</a
				>.
			</p>
		</div>
	</div>

	<!-- Value proposition: full width on mobile, left column on lg -->
	<aside
		class="relative overflow-hidden border-b border-[var(--glass-border)] bg-gradient-to-br from-[var(--bg-raised)] via-[var(--bg-base)] to-[#040c18] px-6 py-10 lg:w-[min(44%,520px)] lg:shrink-0 lg:border-r lg:border-b-0 lg:px-10 lg:py-16 xl:px-14"
	>
		<div
			class="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[var(--accent)]/12 blur-3xl"
			aria-hidden="true"
		></div>
		<div
			class="pointer-events-none absolute -bottom-16 left-1/4 h-48 w-48 rounded-full bg-[var(--accent-end)]/18 blur-3xl"
			aria-hidden="true"
		></div>

		<p class="text-xs font-semibold tracking-[0.2em] text-[var(--cc-muted)] uppercase">
			Why teams choose scan2contact
		</p>
		<h1
			class="mt-4 text-2xl leading-tight font-semibold tracking-tight sm:text-3xl lg:text-[1.75rem] xl:text-4xl xl:leading-[1.15]"
		>
			Scan a business card and get the contact information in seconds.
		</h1>
		<p class="mt-4 max-w-md text-sm leading-relaxed text-[var(--cc-muted)] lg:text-[0.9375rem]">
			Scan, edit and done. Its that easy.
		</p>

		<div class="mt-8 flex gap-1" aria-label="5 out of 5 stars">
			{#each Array(5) as _}
				<svg
					class="h-5 w-5 text-[var(--cc-heat)]"
					viewBox="0 0 20 20"
					fill="currentColor"
					aria-hidden="true"
				>
					<path
						d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
					/>
				</svg>
			{/each}
		</div>

		<blockquote
			class="mt-5 border-l-2 border-[var(--cc-heat)]/50 pl-4 text-sm leading-relaxed text-[var(--cc-fg)]/95"
		>
			"The best and easiest tool for scanning business cards. I use it almost every day."
		</blockquote>
		<div class="mt-5 flex items-center gap-3">
			<div
				class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--cc-surface)] text-sm font-semibold text-[var(--cc-fg)] ring-2 ring-[var(--cc-border)]"
			>
				JB
			</div>
			<div>
				<p class="text-sm font-medium text-[var(--cc-fg)]">John Baker</p>
				<p class="text-xs text-[var(--cc-muted)]">Sales Lead, Startup</p>
			</div>
		</div>
	</aside>
</div>
