const CODE_BLOCK_RE = /(```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]+`)/g;
const ORDERED_TASK_RE = /^(\s*)\d+\.\s+\[([ xX-])\]/;
const LIST_LINE_RE = /^(\s*)([-*+]|\d+\.)\s+/;

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

	releaseNextStoppedOrderedAction(previous: NoteContent): NoteContent {
		const previousSegments = previous.segments;
		const currentSegments = this.segments;
		if (previousSegments.length !== currentSegments.length) return this;

		return new NoteContent(
			currentSegments
				.map((part, i) =>
					i % 2 === 0
						? this.releaseNextStoppedOrderedActionInSegment(previousSegments[i]!, part)
						: part,
				)
				.join(''),
		);
	}

	private releaseNextStoppedOrderedActionInSegment(
		previousSegment: string,
		currentSegment: string,
	): string {
		const previousLines = previousSegment.split('\n');
		const currentLines = currentSegment.split('\n');
		return currentLines
			.map((line, index, lines) => {
				return this.shouldReleaseOrderedTask(previousLines, lines, index)
					? line.replace(/^(\s*\d+\.\s+)\[-\]/, '$1[ ]')
					: line;
			})
			.join('\n');
	}

	private shouldReleaseOrderedTask(
		previousLines: readonly string[],
		currentLines: readonly string[],
		index: number,
	): boolean {
		const currentState = this.orderedTaskState(currentLines[index]!);
		if (currentState?.state !== '-') return false;

		return currentLines.some((line, candidateIndex) => {
			if (candidateIndex >= index) return false;
			const previousState = this.orderedTaskState(previousLines[candidateIndex] ?? '');
			const candidateState = this.orderedTaskState(line);
			if (
				previousState?.state !== ' ' ||
				(candidateState?.state !== 'x' && candidateState?.state !== 'X')
			) {
				return false;
			}
			return (
				this.followingOrderedSiblingIndex(
					currentLines,
					candidateIndex,
					candidateState.indent,
				) === index
			);
		});
	}

	private followingOrderedSiblingIndex(
		lines: readonly string[],
		currentIndex: number,
		currentIndent: number,
	): number | null {
		for (let index = currentIndex + 1; index < lines.length; index++) {
			const line = lines[index]!;
			const orderedState = this.orderedTaskState(line);
			if (orderedState != null && orderedState.indent <= currentIndent) {
				return orderedState.indent === currentIndent ? index : null;
			}

			const listMatch = LIST_LINE_RE.exec(line);
			if (listMatch != null && listMatch[1]!.length <= currentIndent) return null;
			if (line.trim() === '') return null;
			if (line.search(/\S/) <= currentIndent) return null;
		}
		return null;
	}

	private orderedTaskState(line: string) {
		const match = ORDERED_TASK_RE.exec(line);
		if (match == null) return null;
		return {
			indent: match[1]!.length,
			state: match[2]!,
		};
	}
}
