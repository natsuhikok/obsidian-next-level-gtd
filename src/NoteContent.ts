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
		return this.releaseNextStoppedOrderedActionChange(previous)?.content ?? this;
	}

	releaseNextStoppedOrderedActionChange(previous: NoteContent): {
		readonly content: NoteContent;
		readonly from: { readonly line: number; readonly ch: number };
		readonly to: { readonly line: number; readonly ch: number };
		readonly replacement: string;
	} | null {
		const previousSegments = previous.segments;
		const currentSegments = this.segments;
		if (previousSegments.length !== currentSegments.length) return null;

		const updated = new NoteContent(
			currentSegments
				.map((part, i) =>
					i % 2 === 0
						? this.releaseNextStoppedOrderedActionInSegment(previousSegments[i]!, part)
						: part,
				)
				.join(''),
		);
		if (updated.value === this.value) return null;

		return {
			content: updated,
			...this.changeRangeTo(updated),
		};
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

	private changeRangeTo(updated: NoteContent) {
		const prefixLength = this.sharedPrefixLength(updated);
		const suffixLength = this.sharedSuffixLength(updated, prefixLength);
		return {
			from: this.positionAt(prefixLength),
			to: this.positionAt(this.value.length - suffixLength),
			replacement: updated.value.slice(prefixLength, updated.value.length - suffixLength),
		};
	}

	private sharedPrefixLength(updated: NoteContent): number {
		let index = 0;
		while (
			index < this.value.length &&
			index < updated.value.length &&
			this.value[index] === updated.value[index]
		) {
			index += 1;
		}
		return index;
	}

	private sharedSuffixLength(updated: NoteContent, prefixLength: number): number {
		let index = 0;
		while (
			index < this.value.length - prefixLength &&
			index < updated.value.length - prefixLength &&
			this.value[this.value.length - 1 - index] ===
				updated.value[updated.value.length - 1 - index]
		) {
			index += 1;
		}
		return index;
	}

	private positionAt(offset: number) {
		const lines = this.value.slice(0, offset).split('\n');
		return {
			line: lines.length - 1,
			ch: lines.at(-1)?.length ?? 0,
		};
	}
}
