import { App, TFile } from 'obsidian';
import { NoteContent } from './NoteContent';
import { Status } from './types';

export class NoteEditor {
	constructor(private readonly app: App) {}

	async setState(file: TFile, target: 'reference' | Status): Promise<void> {
		await this.app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
			if (target === 'reference') {
				fm['classification'] = 'Reference';
				delete fm['status'];
			} else {
				fm['classification'] = 'Actionable';
				fm['status'] = target;
			}
		});
	}

	async cancelAllNextActions(file: TFile): Promise<void> {
		const raw = await this.app.vault.read(file);
		const updated = new NoteContent(raw).cancelAllNextActions();
		await this.app.vault.modify(file, updated.value);
	}

	async completeNextAction(file: TFile, actionText: string): Promise<void> {
		const raw = await this.app.vault.read(file);
		const updated = new NoteContent(raw).completeNextAction(actionText);
		await this.app.vault.modify(file, updated.value);
	}
}
