import { App, TFile } from 'obsidian';

const CODE_BLOCK_PATTERN = /```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]+`/g;

function escapeRegExp(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function completeNextAction(content: string, actionText: string): string {
	const lineRe = new RegExp(
		`^(\\s*(?:[-*+]|\\d+\\.)\\s+)\\[ \\](\\s*${escapeRegExp(actionText)})$`,
		'm',
	);

	const parts: string[] = [];
	let lastIndex = 0;
	let replaced = false;
	const re = new RegExp(CODE_BLOCK_PATTERN.source, 'g');
	let match: RegExpExecArray | null;

	while ((match = re.exec(content)) !== null) {
		const segment = content.slice(lastIndex, match.index);
		if (!replaced) {
			const updated = segment.replace(lineRe, '$1[x]$2');
			if (updated !== segment) replaced = true;
			parts.push(updated);
		} else {
			parts.push(segment);
		}
		parts.push(match[0]);
		lastIndex = match.index + match[0].length;
	}

	const tail = content.slice(lastIndex);
	parts.push(replaced ? tail : tail.replace(lineRe, '$1[x]$2'));
	return parts.join('');
}

export async function completeNextActionInFile(
	app: App,
	file: TFile,
	actionText: string,
): Promise<void> {
	const content = await app.vault.read(file);
	const updated = completeNextAction(content, actionText);
	await app.vault.modify(file, updated);
}
