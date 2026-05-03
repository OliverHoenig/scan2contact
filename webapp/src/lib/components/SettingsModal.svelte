<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { env } from '$env/dynamic/public';
	import { authClient } from '$lib/auth/client/authClient';
	import MailTemplatesPanel from '$lib/components/MailTemplatesPanel.svelte';
	import { clearReviewSession } from '$lib/scan-flow/review-session';

	type Props = {
		open: boolean;
		onClose: () => void;
		userEmail: string;
	};

	let { open, onClose, userEmail }: Props = $props();

	type Panel = 'menu' | 'mail-templates' | 'delete-account';
	let panel = $state<Panel>('menu');

	let logoutBusy = $state(false);
	let deletePassword = $state('');
	let deleteAck = $state(false);
	let deleteBusy = $state(false);
	let deleteError = $state('');

	$effect(() => {
		if (!open) {
			panel = 'menu';
			deletePassword = '';
			deleteAck = false;
			deleteError = '';
			deleteBusy = false;
			logoutBusy = false;
		}
	});

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}

	async function handleLogout() {
		if (logoutBusy) return;
		logoutBusy = true;
		try {
			await authClient.signOut();
			clearReviewSession();
			onClose();
			await goto(resolve('/auth/login'));
		} finally {
			logoutBusy = false;
		}
	}

	function handleManageSubscription() {
		const url = env.PUBLIC_BILLING_PORTAL_URL?.trim();
		if (url) {
			window.open(url, '_blank', 'noopener,noreferrer');
		} else {
			void goto(resolve('/support'));
		}
	}

	async function handleDeleteAccount() {
		if (deleteBusy || !deleteAck) return;
		deleteBusy = true;
		deleteError = '';
		try {
			const password = deletePassword.trim();
			const { error } = password
				? await authClient.deleteUser({
						password,
						callbackURL: '/auth/login',
						fetchOptions: { throw: false }
					})
				: await authClient.deleteUser({
						callbackURL: '/auth/login',
						fetchOptions: { throw: false }
					});

			if (error) {
				deleteError =
					error.message ??
					'Could not delete your account. Check your password or try signing in again.';
				return;
			}
			clearReviewSession();
			onClose();
			await goto(resolve('/auth/login'));
		} finally {
			deleteBusy = false;
		}
	}

	const menuRowClass =
		'flex w-full items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-white/[0.03] px-3.5 py-3 text-left text-[0.9375rem] font-medium text-[var(--text)] transition-[border-color,background] hover:border-[rgba(255,255,255,0.14)]';
	const sectionLabelClass =
		'mb-2 mt-6 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] first:mt-0';
</script>

{#if open}
	<div
		class="fixed inset-0 z-[50] flex items-start justify-center bg-black/65 px-4 pt-[calc(env(safe-area-inset-top,0px)+1.25rem)] pb-4 backdrop-blur-md"
		role="presentation"
		onclick={handleBackdropClick}
	>
		<div
			class="flex max-h-[min(92dvh,40rem)] w-full max-w-[560px] flex-col rounded-[var(--radius-lg)] border border-[var(--glass-border)] bg-[var(--glass-bg)] p-5 shadow-[var(--shadow-glow),0_24px_64px_rgba(0,0,0,0.5)] backdrop-blur-xl"
			role="dialog"
			aria-modal="true"
			aria-label="Settings"
		>
			<div class="flex shrink-0 items-center justify-between gap-3">
				<h2 class="m-0 text-[1.25rem] font-semibold tracking-[-0.02em]">Settings</h2>
				<button
					type="button"
					class="rounded-[var(--radius-sm)] border border-[var(--glass-border)] bg-white/[0.04] px-2.5 py-1.5 text-sm text-[var(--text-muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text)]"
					onclick={onClose}
				>
					Close
				</button>
			</div>

			<div class="mt-3 min-h-0 flex-1 overflow-y-auto">
				{#if panel === 'menu'}
					<p class="m-0 max-w-[44ch] text-[0.9375rem] leading-[1.5] text-[var(--text-muted)]">
						Manage preferences, your account, and follow-up emails.
					</p>

					<p class={sectionLabelClass}>Preferences</p>
					<ul class="m-0 list-none space-y-2 p-0">
						<li>
							<button type="button" class={menuRowClass} onclick={() => (panel = 'mail-templates')}>
								<span>Follow-up mail templates</span>
								<span class="text-[var(--text-muted)]" aria-hidden="true">→</span>
							</button>
						</li>
					</ul>

					<p class={sectionLabelClass}>Account</p>
					<p
						class="m-0 mb-3 truncate text-[0.8125rem] leading-normal text-[var(--text-muted)]"
						title={userEmail}
					>
						Signed in as <span class="font-medium text-[var(--text)]">{userEmail}</span>
					</p>
					<ul class="m-0 list-none space-y-2 p-0">
						<li>
							<button type="button" class={menuRowClass} onclick={handleManageSubscription}>
								<span>Manage subscription</span>
								<span class="text-[var(--text-muted)]" aria-hidden="true">↗</span>
							</button>
						</li>
						<li>
							<button
								type="button"
								class={menuRowClass}
								disabled={logoutBusy}
								onclick={() => void handleLogout()}
							>
								<span>Log out</span>
								{#if logoutBusy}
									<span class="text-[var(--text-muted)] text-sm">…</span>
								{:else}
									<span class="text-[var(--text-muted)]" aria-hidden="true">→</span>
								{/if}
							</button>
						</li>
						<li>
							<button
								type="button"
								class="{menuRowClass} border-rose-500/25 text-rose-100 hover:border-rose-400/40 hover:bg-rose-500/[0.06]"
								onclick={() => (panel = 'delete-account')}
							>
								<span>Delete account</span>
								<span class="text-rose-200/70" aria-hidden="true">→</span>
							</button>
						</li>
					</ul>
				{:else if panel === 'mail-templates'}
					<MailTemplatesPanel onBack={() => (panel = 'menu')} />
				{:else}
					<div class="space-y-4">
						<button
							type="button"
							class="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:underline"
							onclick={() => {
								panel = 'menu';
								deletePassword = '';
								deleteAck = false;
								deleteError = '';
							}}
						>
							<span aria-hidden="true">←</span> Back to settings
						</button>

						<div
							class="rounded-[var(--radius-md)] border border-rose-500/30 bg-rose-500/[0.07] p-4 text-[0.9375rem] leading-[1.55] text-rose-50/95"
						>
							<p class="m-0 font-semibold text-rose-100">Delete your account permanently</p>
							<p class="mt-2 mb-0 text-[0.875rem] text-rose-100/85">
								This removes your profile, sessions, and saved mail templates. You will not be able
								to recover this data.
							</p>
						</div>

						<div>
							<label for="delete-account-password" class="block text-sm font-medium text-[var(--text-muted)]">
								Password <span class="font-normal text-[var(--text-muted)]/80">(required)</span>
							</label>
							<input
								id="delete-account-password"
								type="password"
								autocomplete="current-password"
								class="mt-2 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-white/[0.04] px-3 py-2.5 text-[0.9375rem] text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
								placeholder="Enter your password to confirm"
								bind:value={deletePassword}
							/>
							<p class="mt-2 mb-0 text-[0.8125rem] text-[var(--text-muted)]">
								If you signed in very recently, you can try leaving the password empty and delete
								again—otherwise your password is required.
							</p>
						</div>

						<label class="flex cursor-pointer items-start gap-3 text-[0.875rem] leading-snug text-[var(--text)]">
							<input
								type="checkbox"
								class="mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--border)]"
								bind:checked={deleteAck}
							/>
							<span>I understand this cannot be undone.</span>
						</label>

						{#if deleteError}
							<p class="m-0 text-[0.875rem] text-rose-200">{deleteError}</p>
						{/if}

						<button
							type="button"
							class="w-full rounded-[var(--radius-md)] border border-rose-500/50 bg-rose-600/90 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-45"
							disabled={deleteBusy || !deleteAck}
							onclick={() => void handleDeleteAccount()}
						>
							{deleteBusy ? 'Deleting…' : 'Delete my account permanently'}
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
