import { App, TFile } from 'obsidian';

const CODE_BLOCK_RE = /(```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]+`)/g;

function escapeRegExp(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export class NextActionCompleter {
	complete(content: string, actionText: string): string {
		const lineRe = new RegExp(
			`^(\\s*(?:[-*+]|\\d+\\.)\\s+)\\[ \\](\\s*${escapeRegExp(actionText)})$`,
			'm',
		);

		return content
			.split(CODE_BLOCK_RE)
			.reduce<{ readonly parts: readonly string[]; readonly replaced: boolean }>(
				({ parts, replaced }, seg, i) => {
					if (i % 2 !== 0 || replaced) return { parts: [...parts, seg], replaced };
					const updated = seg.replace(lineRe, '$1[x]$2');
					return { parts: [...parts, updated], replaced: updated !== seg };
				},
				{ parts: [], replaced: false },
			)
			.parts.join('');
	}

	async completeInFile(app: App, file: TFile, actionText: string): Promise<void> {
		const content = await app.vault.read(file);
		await app.vault.modify(file, this.complete(content, actionText));
	}
}
