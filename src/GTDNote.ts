import { App, TFile } from 'obsidian';
import { detectNoteAlerts } from './detectNoteAlerts';
import { hasNextAction } from './hasNextAction';
import { NoteState } from './NoteState';
import { AlertType } from './types';

export class GTDNote {
	readonly file: TFile;
	readonly state: NoteState;
	readonly hasNextAction: boolean;
	readonly alerts: readonly AlertType[];

	get isInbox() {
		return this.state.isInbox;
	}

	private constructor(file: TFile, fm: Record<string, unknown> | null, content: string) {
		this.file = file;
		this.state = NoteState.parse(fm);
		this.hasNextAction = hasNextAction(content);
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
