<script lang="ts">
	import type { Contact } from '$lib/contact';

	let { contact = $bindable<Contact>() } = $props();

	function updateList(field: 'emails' | 'phones', value: string) {
		contact[field] = value
			.split(',')
			.map((item) => item.trim())
			.filter(Boolean);
	}

	function listValue(field: 'emails' | 'phones'): string {
		return contact[field].join(', ');
	}
</script>

<div class="form-grid">
	<label>Full name <input bind:value={contact.fullName} /></label>
	<label>First name <input bind:value={contact.firstName} /></label>
	<label>Last name <input bind:value={contact.lastName} /></label>
	<label>Company <input bind:value={contact.company} /></label>
	<label>Role <input bind:value={contact.role} /></label>
	<label>Job title <input bind:value={contact.title} /></label>
	<label>Email(s), comma-separated <input value={listValue('emails')} oninput={(e) => updateList('emails', e.currentTarget.value)} /></label>
	<label>Phone(s), comma-separated <input value={listValue('phones')} oninput={(e) => updateList('phones', e.currentTarget.value)} /></label>
	<label>Website <input bind:value={contact.website} placeholder="https://example.com" /></label>
	<label>Address <input bind:value={contact.address} /></label>
	<label>Notes <textarea bind:value={contact.notes} rows="4"></textarea></label>
</div>

<style>
	.form-grid {
		display: grid;
		gap: 1rem;
	}
	label {
		display: grid;
		gap: 0.4rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--text-muted);
		letter-spacing: 0.01em;
	}
	input,
	textarea {
		font: inherit;
		padding: 0.7rem 0.85rem;
		min-height: 2.85rem;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
		background: var(--bg-input);
		color: var(--text);
		transition:
			border-color 0.2s var(--ease-out),
			box-shadow 0.2s var(--ease-out);
	}
	input::placeholder,
	textarea::placeholder {
		color: var(--text-subtle);
	}
	input:hover,
	textarea:hover {
		border-color: var(--border-strong);
	}
	input:focus,
	textarea:focus {
		outline: none;
		border-color: var(--border-focus);
		box-shadow: 0 0 0 3px var(--accent-muted);
	}
	textarea {
		min-height: 7rem;
		resize: vertical;
	}
</style>
