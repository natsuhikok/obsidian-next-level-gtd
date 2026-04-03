import { App, moment, TFile } from 'obsidian';
import { detectNoteAlerts } from './detectNoteAlerts';
import { NextAction, NextActionCollection } from './NextActionCollection';
import { NoteState } from './NoteState';
import { AlertType } from './types';

export class GTDNote {
	readonly file: TFile;
	readonly state: NoteState;
	readonly hasNextAction: boolean;
	readonly nextActions: readonly NextAction<TFile>[];
	readonly availableActions: readonly NextAction<TFile>[];
	readonly alerts: readonly AlertType[];

	get isInbox() {
		return this.state.isInbox;
	}

	private constructor(file: TFile, fm: Record<string, unknown> | null, content: string) {
		this.file = file;
		this.state = NoteState.parse(fm);
		const collection = new NextActionCollection(
			[{ source: file, content }],
			moment().format('YYYY-MM-DD'),
		);
		this.hasNextAction = collection.hasNextAction;
		this.nextActions = collection.nextActions;
		this.availableActions = collection.availableActions;
		this.alerts = detectNoteAlerts(this.state, this.hasNextAction);
	}

	static from(file: TFile, fm: Record<string, unknown> | null, content: string): GTDNote {
		return new GTDNote(file, fm, content);
	}

	static async load(app: App, file: TFile): Promise<GTDNote> {
		const content = await app.vault.cachedRead(file);
		const fm = app.metadataCache.getFileCache(file)?.frontmatter ?? null;
		return new GTDNote(file, fm, content);
	}
}
