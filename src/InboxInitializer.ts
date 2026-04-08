import { NoteState } from './NoteState';
import { NoteEditor } from './NoteEditor';
import { App, TFile } from 'obsidian';

export class InboxInitializer {
	constructor(
		private readonly app: App,
		private readonly excludedFolders: readonly string[],
	) {}

	findTargets(): readonly TFile[] {
		return this.app.vault
			.getMarkdownFiles()
			.filter(
				(f) =>
					!this.excludedFolders.some((ef) => f.path.startsWith(ef + '/')) &&
					NoteState.parse(this.app.metadataCache.getFileCache(f)?.frontmatter ?? null)
						.isInbox,
			);
	}

	async initializeAll(targets: readonly TFile[]): Promise<void> {
		const editor = new NoteEditor(this.app);
		await Promise.all(targets.map((f) => editor.setState(f, 'reference')));
	}
}
