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
}
