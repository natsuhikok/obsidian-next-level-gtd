import { App, moment, TFile } from 'obsidian';
import { NextActionCollection } from './NextActionCollection';
import { NoteState } from './NoteState';

export class GTDNote {
	readonly file: TFile;
	readonly state: NoteState;
	private readonly collection: NextActionCollection<TFile>;

	get isInbox() {
		return this.state.isInbox;
	}

	get hasNextAction() {
		return this.collection.hasNextAction;
	}

	get nextActions() {
		return this.collection.nextActions;
	}

	get availableActions() {
		return this.collection.availableActions;
	}

	get alerts() {
		return this.state.computeAlerts(
			this.hasNextAction,
			this.collection.hasTodayOrFutureSchedulableNextAction,
			this.collection.hasInconsistentBlockedScheduledNextAction,
		);
	}

	private constructor(file: TFile, fm: Record<string, unknown> | null, content: string) {
		this.file = file;
		this.state = NoteState.parse(fm);
		this.collection = new NextActionCollection(
			[{ source: file, content }],
			moment().format('YYYY-MM-DD'),
		);
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
