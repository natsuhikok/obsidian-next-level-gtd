import { NoteState } from 'NoteState';
import { App, TFile } from 'obsidian';

export class InboxInitializer {
	constructor(
		private readonly app: App,
		private readonly excludedFolders: readonly string[],
	) {}

	findTargets(): TFile[] {
		return this.app.vault
			.getMarkdownFiles()
			.filter(
				(f) =>
					!this.excludedFolders.some((ef) => f.path.startsWith(ef + '/')) &&
					NoteState.parse(this.app.metadataCache.getFileCache(f)?.frontmatter ?? null)
						.isInbox,
			);
	}

	async initializeAll(targets: TFile[]): Promise<void> {
		await Promise.all(
			targets.map((f) => NoteState.fromTarget('reference').applyTo(this.app, f)),
		);
	}
}
