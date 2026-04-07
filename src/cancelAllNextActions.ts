const CODE_BLOCK_PATTERN = /```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]+`/g;

function transformCheckboxes(text: string): string {
	return text.replace(/^((\s*[-*+]|\s*\d+\.)\s+)\[ \]/gm, '$1[-]');
}

export function cancelAllNextActions(content: string): string {
	const parts: string[] = [];
	let lastIndex = 0;
	let match: RegExpExecArray | null;
	const re = new RegExp(CODE_BLOCK_PATTERN.source, 'g');
	while ((match = re.exec(content)) !== null) {
		parts.push(transformCheckboxes(content.slice(lastIndex, match.index)));
		parts.push(match[0]);
		lastIndex = match.index + match[0].length;
	}
	parts.push(transformCheckboxes(content.slice(lastIndex)));
	return parts.join('');
}
