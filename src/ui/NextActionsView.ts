import { ItemView, Keymap, MarkdownView, TFile, WorkspaceLeaf, moment, setIcon } from 'obsidian';
import { GTDNote } from '../GTDNote';
import type { NextAction } from '../NextActionCollection';
import { NoteEditor } from '../NoteEditor';
import { t } from '../i18n';
import type NextLevelGtdPlugin from '../main';

export const VIEW_TYPE_NEXT_ACTIONS = 'gtd-next-actions';

export class NextActionsView extends ItemView {
	private noteCache: Record<string, GTDNote> = {};
	private selectedContexts: readonly string[] = [''];
	private showScheduledOnly = false;

	constructor(
		leaf: WorkspaceLeaf,
		private readonly plugin: NextLevelGtdPlugin,
	) {
		super(leaf);
	}

	getViewType() {
		return VIEW_TYPE_NEXT_ACTIONS;
	}

	getDisplayText() {
		return t('nextActionsViewTitle');
	}

	getIcon() {
		return 'list-checks';
	}

	async onOpen() {
		await this.fullScan();
		this.render();
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', (leaf) => {
				if (leaf !== this.leaf) this.render();
			}),
		);
	}

	async onClose() {
		this.contentEl.empty();
	}

	async onFileChange(file: TFile) {
		if (this.isExcluded(file)) {
			this.noteCache = Object.fromEntries(
				Object.entries(this.noteCache).filter(([key]) => key !== file.path),
			);
			this.render();
			return;
		}
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		const note =
			activeView?.file?.path === file.path
				? GTDNote.from(
						file,
						this.app.metadataCache.getFileCache(file)?.frontmatter ?? null,
						activeView.editor.getValue(),
					)
				: await GTDNote.load(this.app, file);
		this.noteCache = { ...this.noteCache, [note.file.path]: note };
		this.render();
	}

	onFileDelete(path: string) {
		if (!(path in this.noteCache)) return;
		this.noteCache = Object.fromEntries(
			Object.entries(this.noteCache).filter(([key]) => key !== path),
		);
		this.render();
	}

	private isExcluded(file: TFile): boolean {
		return this.plugin.settings.excludedFolders.some((ef) =>
			file.path.startsWith(ef.folder + '/'),
		);
	}

	private openNote(filePath: string, event: MouseEvent, actionText?: string) {
		const file = this.app.vault.getFileByPath(filePath);
		if (file == null) return;
		if (actionText == null) {
			void this.app.workspace.getLeaf(Keymap.isModEvent(event)).openFile(file);
			return;
		}
		this.app.vault
			.cachedRead(file)
			.then((content) => {
				const lineRe = /^\s*(?:[-*+]|\d+\.)\s+\[ \]\s*/;
				const lines = content.split('\n');
				let offset = 0;
				let matchStart = -1;
				let matchEnd = -1;
				for (const line of lines) {
					const m = lineRe.exec(line);
					if (m != null && line.slice(m[0].length) === actionText) {
						matchStart = offset + m[0].length;
						matchEnd = matchStart + actionText.length;
						break;
					}
					offset += line.length + 1;
				}
				const eState =
					matchStart !== -1
						? { match: { content, matches: [[matchStart, matchEnd]] } }
						: undefined;
				void this.app.workspace
					.getLeaf(Keymap.isModEvent(event))
					.openFile(file, { eState });
			})
			.catch(console.error);
	}

	private async fullScan() {
		const { excludedFolders } = this.plugin.settings;
		const files = this.app.vault
			.getMarkdownFiles()
			.filter((file) => !excludedFolders.some((ef) => file.path.startsWith(ef.folder + '/')));
		const notes = await Promise.all(files.map((file) => GTDNote.load(this.app, file)));
		this.noteCache = notes.reduce<Record<string, GTDNote>>(
			(acc, note) => ({ ...acc, [note.file.path]: note }),
			{},
		);
	}

	private render() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createDiv({ cls: 'nav-header' });

		const allActions = Object.values(this.noteCache).flatMap((note) => [
			...note.availableActions,
		]);

		if (allActions.length === 0) {
			contentEl.createEl('p', { text: t('noNextActions'), cls: 'gtd-empty' });
			return;
		}

		const today = moment().format('YYYY-MM-DD');

		const allContexts = allActions
			.flatMap((a) => a.context)
			.filter((ctx, i, arr) => arr.indexOf(ctx) === i)
			.sort();

		const filterBar = contentEl.createDiv({ cls: 'gtd-context-filter' });
		const addChip = (label: string, value: string) => {
			const active = this.selectedContexts.includes(value);
			const chip = filterBar.createEl('button', {
				cls: 'gtd-context-chip' + (active ? ' is-active' : ''),
				text: label,
			});
			chip.addEventListener('click', () => {
				this.showScheduledOnly = false;
				this.selectedContexts = this.selectedContexts.includes(value)
					? this.selectedContexts.filter((c) => c !== value)
					: [...this.selectedContexts, value];
				this.render();
			});
		};
		addChip(t('contextFilterNoContext'), '');
		allContexts.forEach((ctx) => addChip('#' + ctx, ctx));

		filterBar.createDiv({ cls: 'gtd-context-filter-sep' });

		const scheduledChip = filterBar.createEl('button', {
			cls: 'gtd-context-chip' + (this.showScheduledOnly ? ' is-active' : ''),
			text: t('contextFilterScheduledOnly'),
		});
		scheduledChip.addEventListener('click', () => {
			this.showScheduledOnly = !this.showScheduledOnly;
			if (this.showScheduledOnly) {
				this.selectedContexts = [];
			} else {
				this.selectedContexts = [''];
			}
			this.render();
		});

		const filteredActions = this.showScheduledOnly
			? Object.values(this.noteCache)
					.flatMap((note) => [...note.nextActions])
					.filter(
						(action) =>
							!action.blocked && (action.scheduled !== null || action.due !== null),
					)
			: allActions.filter((action) =>
					this.selectedContexts.some((ctx) =>
						ctx === '' ? action.context.length === 0 : action.context.includes(ctx),
					),
				);

		if (filteredActions.length === 0) return;

		const sorted = [...filteredActions].sort((a, b) => {
			const da = a.scheduled ?? a.due ?? '9999-99-99';
			const db = b.scheduled ?? b.due ?? '9999-99-99';
			return da.localeCompare(db);
		});

		const container = contentEl.createDiv({ cls: 'nav-files-container' });

		sorted.forEach((action) => {
			const item = container.createDiv({ cls: 'gtd-next-action-item' });
			item.addEventListener('click', (e) => {
				this.openNote(action.source.path, e, action.text);
			});

			const completeBtn = item.createEl('button', { cls: 'gtd-next-action-complete' });
			completeBtn.setAttribute('aria-label', t('completeNextAction'));
			setIcon(completeBtn, 'circle');
			completeBtn.addEventListener('click', () => {
				this.completeAction(action);
			});

			const body = item.createDiv({ cls: 'gtd-next-action-body' });

			body.createDiv({ cls: 'gtd-next-action-text', text: stripTaskMetadata(action.text) });

			const meta = body.createDiv({ cls: 'gtd-next-action-meta' });

			const dateStr = action.due ?? action.scheduled;
			if (dateStr !== null) {
				const isOverdue = dateStr < today;
				const isToday = dateStr === today;
				const cls = [
					'gtd-next-action-date',
					isOverdue ? 'is-overdue' : '',
					isToday ? 'is-today' : '',
				]
					.filter(Boolean)
					.join(' ');
				meta.createSpan({
					cls,
					text: (action.due !== null ? '📅' : '⏳') + ' ' + dateStr,
				});
			}

			const projectLink = meta.createSpan({
				cls: 'gtd-next-action-project',
				text: action.source.basename,
			});
			projectLink.addEventListener('click', (e) => {
				e.stopPropagation();
				this.openNote(action.source.path, e, action.text);
			});
		});

		contentEl.createDiv({
			cls: 'gtd-next-action-count',
			text: `${String(sorted.length)} actions`,
		});
	}

	private completeAction(action: NextAction<TFile>) {
		new NoteEditor(this.app)
			.completeNextAction(action.source, action.text)
			.catch(console.error);
	}
}

const TASK_METADATA_RE = /[📅⏳🛫➕✅❌]\s*\d{4}-\d{2}-\d{2}|🔁\S*|[🔺⏫🔼🔽]/gu;
const WIKILINK_RE = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
const MDLINK_RE = /\[([^\]]*)\]\([^)]*\)/g;
const TAG_DISPLAY_RE = /#\S+/g;

function stripTaskMetadata(text: string): string {
	return text
		.replace(TASK_METADATA_RE, '')
		.replace(WIKILINK_RE, '$1')
		.replace(MDLINK_RE, '$1')
		.replace(TAG_DISPLAY_RE, '')
		.trim();
}
