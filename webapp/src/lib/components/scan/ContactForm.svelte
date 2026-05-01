<script lang="ts">
	import type { Contact } from '$lib/contact';

	let { contact = $bindable() } = $props<{ contact: Contact }>();

	function updateList(field: 'emails' | 'phones', value: string) {
		contact[field] = value
			.split(',')
			.map((item) => item.trim())
			.filter(Boolean);
	}

	function listValue(field: 'emails' | 'phones'): string {
		return contact[field].join(', ');
	}

	const labelClass =
		'grid gap-2 text-[0.95rem] font-medium tracking-[0.01em] text-[var(--text-muted)] sm:text-base';
	const controlClass =
		'min-h-12 rounded-[var(--radius-sm)] border border-gray-400/80 bg-[var(--bg-input)] px-[0.9rem] py-[0.75rem] text-base leading-6 text-[var(--text)] transition-[border-color,box-shadow] duration-200 ease-out placeholder:text-[var(--text-subtle)] placeholder:text-[0.95rem] hover:border-gray-400 focus:border-[var(--border-focus)] focus:outline-none focus:ring-[3px] focus:ring-[var(--accent-muted)]';
</script>

<div class="grid gap-4">
	<label class={labelClass}>First name <input class={controlClass} bind:value={contact.firstName} /></label>
	<label class={labelClass}>Last name <input class={controlClass} bind:value={contact.lastName} /></label>
	<label class={labelClass}>Company <input class={controlClass} bind:value={contact.company} /></label>
	<label class={labelClass}>Role <input class={controlClass} bind:value={contact.role} /></label>
	<label class={labelClass}>Job title <input class={controlClass} bind:value={contact.title} /></label>
	<label class={labelClass}
		>Email(s), comma-separated <input
			class={controlClass}
			value={listValue('emails')}
			oninput={(e) => updateList('emails', e.currentTarget.value)}
		/></label
	>
	<label class={labelClass}
		>Phone(s), comma-separated <input
			class={controlClass}
			value={listValue('phones')}
			oninput={(e) => updateList('phones', e.currentTarget.value)}
		/></label
	>
	<label class={labelClass}
		>Website <input
			class={controlClass}
			bind:value={contact.website}
			placeholder="https://example.com"
		/></label
	>
	<label class={labelClass}>Address <input class={controlClass} bind:value={contact.address} /></label>
	<label class={labelClass}
		>Notes <textarea class={`${controlClass} min-h-28 resize-y`} bind:value={contact.notes} rows="4"></textarea></label
	>
</div>
