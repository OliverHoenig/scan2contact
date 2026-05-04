<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import TemplateFieldWithPlaceholders from '$lib/components/TemplateFieldWithPlaceholders.svelte';
	import { MAIL_TEMPLATE_PLACEHOLDERS } from '$lib/mail-templates/placeholders';

	type Props = { onBack: () => void };

	let { onBack }: Props = $props();

	type TemplateRow = {
		id: string;
		displayName: string;
		subject: string;
		body: string;
	};

	let view = $state<'list' | 'detail'>('list');
	let list = $state<TemplateRow[]>([]);
	let loading = $state(true);
	let saving = $state(false);
	let error = $state('');
	let unauthorized = $state(false);

	let editingId = $state<string | null>(null);
	let formDisplayName = $state('');
	let formSubject = $state('');
	let formBody = $state('');
	/** Bumps when opening the editor so placeholder fields remount with fresh DOM. */
	let templateEditorKey = $state(0);
	let variablesDialogEl = $state<HTMLDialogElement | null>(null);

	function openVariablesHelp() {
		variablesDialogEl?.showModal();
	}

	function onVariablesDialogClick(e: MouseEvent) {
		if (e.target === variablesDialogEl) variablesDialogEl?.close();
	}

	async function fetchList() {
		loading = true;
		error = '';
		unauthorized = false;
		try {
			const res = await fetch(resolve('/api/mail-templates'));
			if (res.status === 401) {
				unauthorized = true;
				list = [];
				return;
			}
			if (!res.ok) {
				error = `Could not load templates (${res.status})`;
				return;
			}
			const data = (await res.json()) as { templates: TemplateRow[] };
			list = data.templates ?? [];
		} catch {
			error = 'Could not load templates';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		void fetchList();
	});

	function openNew() {
		editingId = null;
		formDisplayName = '';
		formSubject = '';
		formBody = '';
		templateEditorKey += 1;
		view = 'detail';
	}

	function openEdit(row: TemplateRow) {
		editingId = row.id;
		formDisplayName = row.displayName;
		formSubject = row.subject;
		formBody = row.body;
		templateEditorKey += 1;
		view = 'detail';
	}

	function backToList() {
		view = 'list';
		editingId = null;
		void fetchList();
	}

	async function save() {
		error = '';
		const payload = {
			displayName: formDisplayName.trim(),
			subject: formSubject.trim(),
			body: formBody
		};
		if (!payload.displayName || !payload.subject || !payload.body.trim()) {
			error = 'Please fill in display name, subject, and message.';
			return;
		}
		saving = true;
		try {
			if (editingId) {
				const res = await fetch(resolve(`/api/mail-templates/${editingId}`), {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload)
				});
				if (res.status === 401) {
					unauthorized = true;
					return;
				}
				if (!res.ok) {
					error = 'Could not save template';
					return;
				}
			} else {
				const res = await fetch(resolve('/api/mail-templates'), {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(payload)
				});
				if (res.status === 401) {
					unauthorized = true;
					return;
				}
				if (!res.ok) {
					error = 'Could not create template';
					return;
				}
			}
			backToList();
		} finally {
			saving = false;
		}
	}

	async function remove() {
		if (!editingId) return;
		if (!confirm('Delete this template? This cannot be undone.')) return;
		error = '';
		saving = true;
		try {
			const res = await fetch(resolve(`/api/mail-templates/${editingId}`), { method: 'DELETE' });
			if (res.status === 401) {
				unauthorized = true;
				return;
			}
			if (!res.ok) {
				error = 'Could not delete template';
				return;
			}
			backToList();
		} finally {
			saving = false;
		}
	}

	const fieldClass =
		'mt-1 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-[0.9375rem] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]';
	const labelClass = 'text-[0.8125rem] font-medium text-[var(--text-muted)]';
</script>

<div class="flex min-h-0 flex-1 flex-col">
	{#if view === 'list'}
		<div class="flex items-center gap-2 border-b border-[var(--border)] pb-3">
			<button
				type="button"
				class="rounded-[var(--radius-sm)] border border-[var(--border)] px-2 py-1 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
				onclick={onBack}
			>
				← Back
			</button>
		</div>
		<h3 class="m-0 mt-3 text-[1.05rem] font-semibold tracking-[-0.02em]">
			Follow-up mail templates
		</h3>
		<p class="m-0 mt-2 text-[0.875rem] leading-[1.45] text-[var(--text-muted)]">
			Used when you send a follow-up email after a scan.
		</p>

		{#if unauthorized}
			<p class="m-0 mt-4 text-[0.9375rem] leading-[1.5] text-[var(--text-muted)]">
				Sign in to manage your templates.
			</p>
			<a
				href={resolve('/auth/login')}
				class="btn-accent-primary btn-accent-primary--r-md mt-3 inline-flex min-h-10 items-center justify-center px-4 text-[0.875rem] font-semibold text-[var(--accent-ink)] no-underline"
			>
				Sign in
			</a>
		{:else if loading}
			<p class="m-0 mt-6 text-[0.9375rem] text-[var(--text-muted)]">Loading…</p>
		{:else if error && list.length === 0}
			<p class="m-0 mt-4 text-[0.875rem] text-[var(--danger)]">{error}</p>
			<button
				type="button"
				class="mt-3 text-sm font-medium text-[var(--accent)] underline-offset-2 hover:underline"
				onclick={fetchList}
			>
				Try again
			</button>
		{:else}
			<button
				type="button"
				class="mt-4 min-h-11 w-full rounded-[var(--radius-md)] border border-dashed border-white/25 bg-white/[0.04] px-3 py-2.5 text-[0.875rem] font-semibold text-[var(--text)] transition-colors hover:border-[var(--accent)] hover:bg-white/[0.07]"
				onclick={openNew}
			>
				+ New template
			</button>
			<ul class="m-0 mt-3 max-h-[min(50vh,22rem)] list-none space-y-2 overflow-y-auto p-0">
				{#each list as row (row.id)}
					<li>
						<button
							type="button"
							class="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-white/[0.03] px-3.5 py-3 text-left transition-[border-color,background] hover:border-[rgba(255,255,255,0.14)]"
							onclick={() => openEdit(row)}
						>
							<span class="block text-[0.9375rem] font-semibold text-[var(--text)]"
								>{row.displayName}</span
							>
							<span class="mt-0.5 block truncate text-[0.8125rem] text-[var(--text-muted)]"
								>{row.subject}</span
							>
						</button>
					</li>
				{/each}
			</ul>
			{#if error}
				<p class="m-0 mt-2 text-[0.8125rem] text-[var(--danger)]">{error}</p>
			{/if}
		{/if}
	{:else}
		<div class="flex items-center gap-2 border-b border-[var(--border)] pb-3">
			<button
				type="button"
				class="rounded-[var(--radius-sm)] border border-[var(--border)] px-2 py-1 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
				onclick={backToList}
				disabled={saving}
			>
				← Templates
			</button>
		</div>
		<div class="mt-3 flex items-start justify-between gap-2">
			<h3 class="m-0 flex-1 text-[1.05rem] font-semibold tracking-[-0.02em]">
				{editingId ? 'Edit template' : 'New template'}
			</h3>
			<button
				type="button"
				class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] text-[var(--text-muted)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--text)]"
				onclick={openVariablesHelp}
				disabled={saving}
				aria-label="About contact variables"
				title="Variables"
			>
				<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5" />
					<path stroke="currentColor" stroke-width="1.5" stroke-linecap="round" d="M12 16v-5M12 8h.01" />
				</svg>
			</button>
		</div>

		<dialog
			bind:this={variablesDialogEl}
			class="fixed left-1/2 top-1/2 z-[70] m-0 w-[min(560px,calc(100vw-2rem))] max-h-[min(90dvh,32rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-base)] p-0 text-[var(--text)] shadow-lg outline-none [&::backdrop]:bg-black/50"
			onclick={onVariablesDialogClick}
		>
			<div class="border-b border-[var(--border)] px-4 py-3">
				<p class="m-0 text-[0.9375rem] font-semibold">Contact variables</p>
			</div>
			<div class="max-h-[min(60dvh,22rem)] overflow-y-auto px-4 py-3">
				<p class="m-0 text-[0.8125rem] leading-snug text-[var(--text-muted)]">
					+ inserts a chip at the cursor. × removes it. On send, chips become the saved contact
					data.
				</p>
				<ul class="m-0 mt-3 list-none space-y-2.5 p-0">
					{#each MAIL_TEMPLATE_PLACEHOLDERS as row (row.key)}
						<li class="text-[0.8125rem] leading-snug">
							<span class="font-semibold text-[var(--text)]">{row.label}</span>
							<span class="text-[var(--text-muted)]"> — {row.help}</span>
						</li>
					{/each}
				</ul>
			</div>
			<div class="border-t border-[var(--border)] px-4 py-3">
				<form method="dialog">
					<button
						type="submit"
						class="btn-accent-primary btn-accent-primary--r-md min-h-9 w-full px-3 text-[0.8125rem] font-semibold text-[var(--accent-ink)]"
					>
						Got it
					</button>
				</form>
			</div>
		</dialog>

		<div class="mt-4 grid min-h-0 flex-1 gap-4">
			<div>
				<label class={labelClass} for="tpl-display">Display name</label>
				<input
					id="tpl-display"
					type="text"
					class={fieldClass}
					autocomplete="off"
					bind:value={formDisplayName}
					placeholder="e.g. Stay in touch"
				/>
			</div>
			{#key templateEditorKey}
				<div>
					<!-- Editor is contenteditable; it uses aria-labelledby → this label. -->
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label id="mail-tpl-subject-lbl" class={labelClass}>Subject</label>
					<TemplateFieldWithPlaceholders
						id="tpl-subject"
						labelledBy="mail-tpl-subject-lbl"
						bind:value={formSubject}
						multiline={false}
						disabled={saving}
						{fieldClass}
						placeholder="Subject line"
					/>
				</div>
				<div class="flex min-h-0 flex-1 flex-col">
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label id="mail-tpl-body-lbl" class={labelClass}>Message</label>
					<TemplateFieldWithPlaceholders
						id="tpl-body"
						labelledBy="mail-tpl-body-lbl"
						bind:value={formBody}
						multiline={true}
						disabled={saving}
						{fieldClass}
						placeholder="Message"
					/>
				</div>
			{/key}
		</div>

		{#if error}
			<p class="m-0 mt-3 text-[0.875rem] text-[var(--danger)]">{error}</p>
		{/if}

		<div class="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
			{#if editingId}
				<button
					type="button"
					class="min-h-11 w-full rounded-[var(--radius-md)] border border-[rgba(248,113,113,0.4)] bg-transparent px-4 py-2.5 text-[0.875rem] font-semibold text-[var(--danger)] sm:w-auto"
					onclick={remove}
					disabled={saving}
				>
					Delete
				</button>
			{:else}
				<div class="hidden sm:block sm:flex-1"></div>
			{/if}
			<div class="flex flex-col-reverse gap-2 sm:flex-row sm:gap-2">
				<button
					type="button"
					class="min-h-11 w-full rounded-[var(--radius-md)] border border-white/15 bg-transparent px-4 py-2.5 text-[0.875rem] font-semibold text-[var(--text)] sm:w-auto"
					onclick={backToList}
					disabled={saving}
				>
					Cancel
				</button>
				<button
					type="button"
					class="btn-accent-primary btn-accent-primary--r-md min-h-11 w-full px-4 py-2.5 text-[0.875rem] font-semibold text-[var(--accent-ink)] disabled:opacity-45 sm:w-auto"
					onclick={save}
					disabled={saving}
				>
					{saving ? 'Saving…' : 'Save'}
				</button>
			</div>
		</div>
	{/if}
</div>
