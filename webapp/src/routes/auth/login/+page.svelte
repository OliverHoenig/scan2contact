<script lang="ts">
	import { resolve } from '$app/paths';
	import { emailPasswordSignInForm } from '$lib/auth/server/auth.remote';
</script>

<svelte:head>
	<title>Login | scan2contact</title>
</svelte:head>

<div class="mx-auto min-h-dvh w-full max-w-md px-4 pt-8 pb-12 sm:pt-12">
	<header class="mt-8">
		<p class="text-sm font-semibold tracking-wide text-[var(--cc-muted)]">
			Login with your account
		</p>
		<h1 class="mt-2 text-3xl font-semibold tracking-tight">Login to scan2contact</h1>
		<p class="mt-2 text-sm text-[var(--cc-muted)]">
			The easiest way to add business cards to your contacts.
		</p>
	</header>

	<form class="mt-8 space-y-5" {...emailPasswordSignInForm}>
		<div class="rounded-2xl border border-[var(--cc-border)] bg-[var(--cc-surface)] p-5 shadow-sm">
			<label for="email-password" class="mt-4 block text-sm font-medium text-[var(--cc-muted)]"
				>Email</label
			>
			<input
				class="mt-2 w-full rounded-xl border border-[var(--cc-border)] bg-[var(--cc-surface)] px-4 py-3 text-[var(--cc-fg)] outline-none placeholder:text-[var(--cc-muted)]/60 focus:border-transparent focus:ring-2 focus:ring-[var(--cc-ring)]"
				placeholder="you@company.com"
				required
				autocomplete="off"
				{...emailPasswordSignInForm.fields.email.as('text')}
			/>
			{#each emailPasswordSignInForm.fields.email.issues() as issue}
				<p class="mt-2 text-xs text-rose-200">
					{issue.message}
				</p>
			{/each}

			<label for="password" class="mt-4 block text-sm font-medium text-[var(--cc-muted)]"
				>Password</label
			>
			<input
				class="mt-2 w-full rounded-xl border border-[var(--cc-border)] bg-[var(--cc-surface)] px-4 py-3 text-[var(--cc-fg)] outline-none placeholder:text-[var(--cc-muted)]/60 focus:border-transparent focus:ring-2 focus:ring-[var(--cc-ring)]"
				placeholder="••••••••"
				required
				{...emailPasswordSignInForm.fields._password.as('password')}
			/>
			{#each emailPasswordSignInForm.fields._password.issues() as issue}
				<p class="mt-2 text-xs text-rose-200">
					{issue.message}
				</p>
			{/each}
		</div>

		<button
			type="submit"
			class="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[var(--cc-accent)] px-6 text-sm font-semibold text-[var(--cc-accent-fg)] shadow-sm transition hover:brightness-105 active:scale-[0.99] disabled:opacity-60"
		>
			Login
		</button>

		{#if emailPasswordSignInForm.result}
			<p
				class="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"
			>
				Logged in successfully. You can continue to the app.
			</p>
		{/if}
	</form>

	<p class="mt-4 text-center text-sm text-[var(--cc-muted)]">
		Don't have an account?
		<a href={resolve('/auth/signup')} class="font-medium text-[var(--cc-fg)] hover:underline"
			>Sign up</a
		>.
	</p>
</div>
