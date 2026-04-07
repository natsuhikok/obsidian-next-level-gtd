import { App, moment, TFile } from 'obsidian';
import { NextActionCollection } from './NextActionCollection';
import { NoteState } from './NoteState';

export class GTDNote {
	readonly file: TFile;
	readonly state: NoteState;
	private readonly collection: NextActionCollection<TFile>;
	private readonly today: string;

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

	private get hasTodayOrFutureScheduledNextAction() {
		return this.nextActions.some((a) => a.scheduled !== null && a.scheduled >= this.today);
	}

	get alerts() {
		return this.state.computeAlerts(
			this.hasNextAction,
			this.hasTodayOrFutureScheduledNextAction,
		);
	}

	private constructor(file: TFile, fm: Record<string, unknown> | null, content: string) {
		this.file = file;
		this.state = NoteState.parse(fm);
		this.today = moment().format('YYYY-MM-DD');
		this.collection = new NextActionCollection([{ source: file, content }], this.today);
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
