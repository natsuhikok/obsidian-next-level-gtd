import { App, TFile } from 'obsidian';

const CODE_BLOCK_RE = /(```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]+`)/g;

function transformCheckboxes(text: string): string {
	return text.replace(/^((\s*[-*+]|\s*\d+\.)\s+)\[ \]/gm, '$1[-]');
}

export class NextActionCanceller {
	cancel(content: string): string {
		return content
			.split(CODE_BLOCK_RE)
			.map((seg, i) => (i % 2 === 0 ? transformCheckboxes(seg) : seg))
			.join('');
	}

	async cancelInFile(app: App, file: TFile): Promise<void> {
		const content = await app.vault.read(file);
		await app.vault.modify(file, this.cancel(content));
	}
}
