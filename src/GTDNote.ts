import { App, moment, TFile } from 'obsidian';
import { NextAction } from './NextAction';
import { NextActionCollection } from './NextActionCollection';
import { NoteState } from './NoteState';
import { AlertType } from './AlertType';

export class GTDNote {
	readonly file: TFile;
	readonly state: NoteState;
	readonly nextActions: readonly NextAction<TFile>[];
	private readonly today: string;

	get isInbox() {
		return this.state.isInbox;
	}

	get hasNextAction(): boolean {
		return this.nextActions.length > 0;
	}

	get availableActions(): readonly NextAction<TFile>[] {
		return this.nextActions.filter((a) => a.available);
	}

	get alerts(): readonly AlertType[] {
		const hasTodayOrFutureScheduled = this.nextActions.some(
			(a) => a.scheduled !== null && a.scheduled >= this.today,
		);
		return this.state.alerts(this.hasNextAction, hasTodayOrFutureScheduled);
	}

	private constructor(file: TFile, fm: Record<string, unknown> | null, content: string) {
		this.file = file;
		this.state = NoteState.parse(fm);
		this.today = moment().format('YYYY-MM-DD');
		const collection = new NextActionCollection([{ source: file, content }], this.today);
		this.nextActions = collection.nextActions;
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
