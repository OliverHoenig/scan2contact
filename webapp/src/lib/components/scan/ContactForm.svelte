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
		gap: 0.75rem;
	}
	label {
		display: grid;
		gap: 0.35rem;
		font-size: 0.92rem;
		font-weight: 600;
	}
	input,
	textarea {
		font: inherit;
		padding: 0.65rem;
		min-height: 2.75rem;
		border-radius: 0.5rem;
		border: 1px solid #d4d4d8;
	}
	textarea {
		min-height: 7rem;
	}
</style>
