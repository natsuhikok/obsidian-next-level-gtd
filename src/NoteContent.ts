const CODE_BLOCK_RE = /(```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]+`)/g;

export class NoteContent {
	constructor(readonly value: string) {}

	private get segments(): readonly string[] {
		return this.value.split(CODE_BLOCK_RE);
	}

	cancelAllNextActions(): NoteContent {
		function transformCheckboxes(text: string): string {
			return text.replace(/^((\s*[-*+]|\s*\d+\.)\s+)\[ \]/gm, '$1[-]');
		}
		return new NoteContent(
			this.segments
				.map((part, i) => (i % 2 === 0 ? transformCheckboxes(part) : part))
				.join(''),
		);
	}

	completeNextAction(actionText: string): NoteContent {
		function escapeRegExp(s: string): string {
			return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		}
		const lineRe = new RegExp(
			`^(\\s*(?:[-*+]|\\d+\\.)\\s+)\\[ \\](\\s*${escapeRegExp(actionText)})$`,
			'm',
		);
		const { result } = this.segments.reduce<{
			readonly result: readonly string[];
			readonly replaced: boolean;
		}>(
			(acc, part, i) => {
				if (i % 2 !== 0 || acc.replaced) return { ...acc, result: [...acc.result, part] };
				const updated = part.replace(lineRe, '$1[x]$2');
				return { result: [...acc.result, updated], replaced: updated !== part };
			},
			{ result: [], replaced: false },
		);
		return new NoteContent(result.join(''));
	}
}
