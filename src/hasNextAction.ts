/**
 * Determines whether the given note content contains at least one next action.
 *
 * Rules:
 * - Completed checkboxes `[x]` (case-insensitive) are not next actions.
 * - Cancelled checkboxes `[-]` are not next actions.
 * - Unchecked checkboxes tagged with `#temp` are not next actions.
 * - Checkboxes inside fenced code blocks (``` or ~~~) are not next actions.
 * - Checkboxes inside inline code (`...`) are not next actions.
 * - All other unchecked checkboxes `[ ]` are counted as next actions.
 */
function stripCodeSpans(content: string): string {
	return content
		.replace(/```[\s\S]*?```/g, '')
		.replace(/~~~[\s\S]*?~~~/g, '')
		.replace(/`[^`\n]+`/g, '');
}

export function hasNextAction(content: string): boolean {
	const lines = stripCodeSpans(content).split('\n');
	return lines.some((line) => {
		const unchecked = /^(\s*[-*+]|\s*\d+\.)\s+\[ \]/.test(line);
		if (!unchecked) return false;
		const isTemp = /#temp\b/.test(line);
		return !isTemp;
	});
}
