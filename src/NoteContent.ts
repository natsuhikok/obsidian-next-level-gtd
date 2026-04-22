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
		const { result } = this.segments.reduce<{
			readonly result: readonly string[];
			readonly replaced: boolean;
		}>(
			(acc, part, i) => {
				if (i % 2 !== 0 || acc.replaced) return { ...acc, result: [...acc.result, part] };
				const { content, completed } = this.completeNextActionInText(part, actionText);
				return { result: [...acc.result, content], replaced: completed };
			},
			{ result: [], replaced: false },
		);
		return new NoteContent(result.join(''));
	}

	private completeNextActionInText(content: string, actionText: string) {
		const lineRe = new RegExp(
			`^(\\s*)((?:[-*+]|\\d+\\.)\\s+)\\[ \\](\\s*${this.escapeRegExp(actionText)})(\\r?\\n?)$`,
		);
		const parts = content.split('\n');
		const lines = parts.map((line, index) => (index < parts.length - 1 ? `${line}\n` : line));
		const completedIndex = lines.findIndex((line) => lineRe.test(line));
		if (completedIndex === -1) return { content, completed: false };

		const completedLine = lines[completedIndex]!;
		const match = lineRe.exec(completedLine)!;
		const [, indent, marker, body, ending] = match;
		const completedLines = lines.map((line, index) =>
			index === completedIndex ? `${indent}${marker}[x]${body}${ending}` : line,
		);

		if (!/^\d+\.\s+$/.test(marker!)) {
			return { content: completedLines.join(''), completed: true };
		}

		return {
			content: completedLines
				.map((line, index) =>
					index === completedIndex + 1
						? this.resumeStoppedOrderedSuccessor(line, indent!)
						: line,
				)
				.join(''),
			completed: true,
		};
	}

	private resumeStoppedOrderedSuccessor(line: string, indent: string) {
		return line.replace(
			new RegExp(`^(${this.escapeRegExp(indent)}\\d+\\.\\s+)\\[-\\]`),
			'$1[ ]',
		);
	}

	private escapeRegExp(value: string) {
		return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}
}
