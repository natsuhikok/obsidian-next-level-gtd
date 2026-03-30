/**
 * Determines whether the given note content contains at least one next action.
 *
 * Rules:
 * - Completed checkboxes `[x]` (case-insensitive) are not next actions.
 * - Cancelled checkboxes `[-]` are not next actions.
 * - Unchecked checkboxes tagged with `#temp` are not next actions.
 * - All other unchecked checkboxes `[ ]` are counted as next actions.
 */
export function hasNextAction(content: string): boolean {
	const lines = content.split('\n');
	return lines.some((line) => {
		const unchecked = /^(\s*[-*+]|\s*\d+\.)\s+\[ \]/.test(line);
		if (!unchecked) return false;
		const isTemp = /#temp\b/.test(line);
		return !isTemp;
	});
}
