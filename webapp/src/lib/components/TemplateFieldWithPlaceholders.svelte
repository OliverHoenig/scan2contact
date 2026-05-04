<script lang="ts">
	import { onMount } from 'svelte';
	import {
		MAIL_TEMPLATE_PLACEHOLDERS,
		parseTemplateToSegments,
		serializeTemplateEditor,
		type PlaceholderKey
	} from '$lib/mail-templates/placeholders';

	type Props = {
		id: string;
		/** Matches the visible `<label id="…">` (contenteditable is not labelable via `for`). */
		labelledBy: string;
		value?: string;
		multiline?: boolean;
		disabled?: boolean;
		fieldClass: string;
		/** Shown to assistive tech when the field is empty */
		placeholder?: string;
	};

	let {
		id,
		labelledBy,
		value = $bindable(''),
		multiline = true,
		disabled = false,
		fieldClass,
		placeholder = ''
	}: Props = $props();

	let editorEl = $state<HTMLDivElement | null>(null);

	function syncFromEditor() {
		if (!editorEl || disabled) return;
		let next = serializeTemplateEditor(editorEl);
		if (!multiline) next = next.replace(/\r?\n/g, ' ');
		value = next;
	}

	function makeChip(key: PlaceholderKey): HTMLSpanElement {
		const meta = MAIL_TEMPLATE_PLACEHOLDERS.find((p) => p.key === key)!;
		const wrap = document.createElement('span');
		wrap.className =
			'inline-flex max-w-full items-center gap-0.5 rounded-md border border-[var(--accent)]/35 bg-[var(--accent)]/12 px-1.5 py-px align-middle text-[0.8125rem] font-medium text-[var(--text)]';
		wrap.contentEditable = 'false';
		wrap.dataset.token = key;
		wrap.setAttribute('role', 'presentation');

		const lab = document.createElement('span');
		lab.textContent = meta.label;
		lab.className = 'select-none';

		const btn = document.createElement('button');
		btn.type = 'button';
		btn.textContent = '×';
		btn.className =
			'-mr-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-[1rem] leading-none text-[var(--text-muted)] transition-colors hover:bg-white/10 hover:text-[var(--text)]';
		btn.title = `Remove ${meta.label}`;
		btn.setAttribute('aria-label', `Remove ${meta.label}`);
		btn.addEventListener('mousedown', (e) => {
			e.preventDefault();
			e.stopPropagation();
			wrap.remove();
			syncFromEditor();
			editorEl?.focus();
		});

		wrap.append(lab, btn);
		return wrap;
	}

	function fillEditorFromValue() {
		if (!editorEl) return;
		editorEl.replaceChildren();
		for (const seg of parseTemplateToSegments(value)) {
			if (seg.type === 'text') editorEl.appendChild(document.createTextNode(seg.text));
			else editorEl.appendChild(makeChip(seg.key));
		}
	}

	onMount(() => {
		fillEditorFromValue();
	});

	function insertToken(key: PlaceholderKey) {
		if (!editorEl || disabled) return;
		editorEl.focus();
		const sel = window.getSelection();
		let range: Range;
		if (sel && sel.rangeCount > 0 && editorEl.contains(sel.anchorNode)) {
			range = sel.getRangeAt(0);
			range.deleteContents();
		} else {
			range = document.createRange();
			range.selectNodeContents(editorEl);
			range.collapse(false);
		}
		const chip = makeChip(key);
		range.insertNode(chip);
		range.setStartAfter(chip);
		range.collapse(true);
		sel?.removeAllRanges();
		sel?.addRange(range);
		syncFromEditor();
	}

	function onInput() {
		syncFromEditor();
	}

	function onPaste(e: ClipboardEvent) {
		e.preventDefault();
		const raw = e.clipboardData?.getData('text/plain') ?? '';
		const text = multiline ? raw.replace(/\r\n/g, '\n') : raw.replace(/[\r\n]+/g, ' ');
		if (!text) return;
		const sel = window.getSelection();
		if (!sel?.rangeCount || !editorEl?.contains(sel.anchorNode)) return;
		const range = sel.getRangeAt(0);
		range.deleteContents();
		range.insertNode(document.createTextNode(text));
		range.collapse(false);
		sel.removeAllRanges();
		sel.addRange(range);
		syncFromEditor();
	}

	function onKeydown(e: KeyboardEvent) {
		if (disabled) return;
		if (!multiline && e.key === 'Enter') {
			e.preventDefault();
			return;
		}
		if (multiline && e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			document.execCommand('insertLineBreak');
			syncFromEditor();
		}
	}

	const toolbarBtnClass =
		'rounded-[var(--radius-sm)] border border-[var(--border)] bg-white/[0.05] px-2.5 py-1 text-[0.8125rem] font-medium text-[var(--text)] transition-colors hover:border-[var(--accent)]/50 hover:bg-white/[0.08] disabled:pointer-events-none disabled:opacity-45';
</script>

<div class="mt-1">
	<div class="flex flex-wrap gap-1.5" role="group" aria-label="Insert contact field">
		{#each MAIL_TEMPLATE_PLACEHOLDERS as p (p.key)}
			<button
				type="button"
				class={toolbarBtnClass}
				disabled={disabled}
				onclick={() => insertToken(p.key)}
				aria-label="Insert {p.label}"
			>
				+ {p.label}
			</button>
		{/each}
	</div>

	<div
		bind:this={editorEl}
		{id}
		role="textbox"
		aria-labelledby={labelledBy}
		aria-multiline={multiline}
		aria-placeholder={placeholder || undefined}
		contenteditable={disabled ? 'false' : 'true'}
		tabindex={disabled ? -1 : 0}
		class={`${fieldClass} ${multiline ? 'min-h-[10rem] whitespace-pre-wrap break-words leading-[1.45]' : 'min-h-[2.75rem] whitespace-pre-wrap break-words'} mt-2 block w-full font-[inherit] outline-none`}
		oninput={onInput}
		onpaste={onPaste}
		onkeydown={onKeydown}
		onblur={onInput}
	></div>
</div>
