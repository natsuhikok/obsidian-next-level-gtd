import { ItemView, Keymap, MarkdownView, TFile, WorkspaceLeaf, moment, setIcon } from 'obsidian';
import { ContextClassifier } from '../ContextClassifier';
import { ContextOrder } from '../ContextOrder';
import { DateVisibility } from '../DateVisibility';
import { GTDNote } from '../GTDNote';
import type { NextAction } from '../NextActionCollection';
import { NextActionPin } from '../NextActionPin';
import { NextActionsQuery } from '../NextActionsQuery';
import { t } from '../i18n';
import type NextLevelGtdPlugin from '../main';

export const VIEW_TYPE_NEXT_ACTIONS = 'gtd-next-actions';

export class NextActionsView extends ItemView {
	private noteCache: Record<string, GTDNote> = {};
	private pinnedActionPins: readonly NextActionPin[] = [];
	private dateVisibility: DateVisibility;

	constructor(
		leaf: WorkspaceLeaf,
		private readonly plugin: NextLevelGtdPlugin,
	) {
		super(leaf);
		this.pinnedActionPins = plugin.settings.pinnedActionPins;
		this.dateVisibility = DateVisibility.initial();
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
						this.plugin.settings.evaluateStructuralNextActionBlocking,
					)
				: await GTDNote.load(
						this.app,
						file,
						this.plugin.settings.evaluateStructuralNextActionBlocking,
					);
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

	async refresh() {
		await this.fullScan();
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (activeView?.file != null) {
			await this.onFileChange(activeView.file);
			return;
		}
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
		const notes = await Promise.all(
			files.map((file) =>
				GTDNote.load(
					this.app,
					file,
					this.plugin.settings.evaluateStructuralNextActionBlocking,
				),
			),
		);
		this.noteCache = notes.reduce<Record<string, GTDNote>>(
			(acc, note) => ({ ...acc, [note.file.path]: note }),
			{},
		);
	}

	private render() {
		const classifier = new ContextClassifier(this.plugin.settings.environmentContexts);
		const contextOrder = new ContextOrder(this.plugin.settings.contextOrder);
		const allActions = Object.values(this.noteCache).flatMap((note) => [...note.nextActions]);
		this.prunePinnedActionPins(allActions);
		const today = moment().format('YYYY-MM-DD');
		const query = new NextActionsQuery(
			classifier,
			contextOrder,
			this.dateVisibility,
			allActions,
			today,
			(a) => this.isPinned(a),
		);

		const { contentEl } = this;
		contentEl.empty();

		contentEl.createDiv({ cls: 'nav-header' });

		if (allActions.length === 0) {
			contentEl.createEl('p', { text: t('noNextActions'), cls: 'gtd-empty' });
			return;
		}

		const filterBar = contentEl.createDiv({ cls: 'gtd-context-filter' });
		this.renderDateBlock(filterBar);

		const groups = query.displayGroups;

		if (groups.length === 0) {
			contentEl.createEl('p', { text: t('noNextActions'), cls: 'gtd-empty' });
			return;
		}

		const container = contentEl.createDiv({ cls: 'nav-files-container' });

		groups.forEach((group) => {
			const section = container.createDiv({ cls: 'gtd-next-action-group' });
			section.createDiv({
				cls: 'gtd-next-action-group-title',
				text: this.groupTitle(group.title),
			});
			group.actions.forEach((action) =>
				this.renderAction(section, action, classifier, today),
			);
		});

		contentEl.createDiv({
			cls: 'gtd-next-action-count',
			text: `${String(query.groupedActionCount)} actions`,
		});
	}

	private renderDateBlock(filterBar: HTMLElement) {
		const row = filterBar.createDiv({ cls: 'gtd-context-filter-row' });
		const addDateChip = (label: string, mode: 'near' | 'all') => {
			const active = this.dateVisibility.mode === mode;
			const chip = row.createEl('button', {
				cls: 'gtd-context-chip' + (active ? ' is-active' : ''),
				text: label,
			});
			chip.addEventListener('click', () => {
				this.dateVisibility = this.dateVisibility.withMode(mode);
				this.render();
			});
		};

		addDateChip(t('dateVisibilityNear'), 'near');
		addDateChip(t('dateVisibilityAll'), 'all');
	}

	private groupTitle(title: string): string {
		if (title === 'pinned') return t('nextActionGroupPinned');
		if (title === 'dated') return t('nextActionGroupDated');
		if (title === 'default') return t('nextActionGroupDefault');
		return title;
	}

	private renderAction(
		container: HTMLElement,
		action: NextAction<TFile>,
		classifier: ContextClassifier,
		today: string,
	) {
		const pinned = this.isPinned(action);
		const item = container.createDiv({
			cls: 'gtd-next-action-item' + (pinned ? ' is-pinned' : ''),
		});
		item.addEventListener('click', (e) => {
			this.openNote(action.source.path, e, action.text);
		});

		const pinBtn = item.createEl('button', {
			cls: 'gtd-next-action-pin' + (pinned ? ' is-pinned' : ''),
		});
		pinBtn.setAttribute('aria-label', pinned ? t('unpinNextAction') : t('pinNextAction'));
		pinBtn.setAttribute('aria-pressed', String(pinned));
		setIcon(pinBtn, 'pin');
		pinBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			this.togglePinnedAction(action).catch(console.error);
		});

		const body = item.createDiv({ cls: 'gtd-next-action-body' });

		body.createDiv({ cls: 'gtd-next-action-text', text: stripTaskMetadata(action.text) });

		this.renderContextBadges(body, action, classifier);

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
	}

	private renderContextBadges(
		body: HTMLElement,
		action: NextAction<TFile>,
		classifier: ContextClassifier,
	) {
		const envTags = classifier.environmentTagsOf(action);
		const propTags = classifier.propertyTagsOf(action);

		const hasBadges = envTags.length > 0 || propTags.length > 0;
		if (!hasBadges) return;

		const badgeContainer = body.createDiv({ cls: 'gtd-action-context-badges' });

		envTags.forEach((tag) => {
			badgeContainer.createSpan({
				cls: 'gtd-action-context-badge gtd-action-context-badge--env',
				text: '#' + tag,
			});
		});

		propTags.forEach((tag) => {
			badgeContainer.createSpan({
				cls: 'gtd-action-context-badge gtd-action-context-badge--prop',
				text: '#' + tag,
			});
		});
	}

	private async togglePinnedAction(action: NextAction<TFile>) {
		const pin = new NextActionPin(action.source.name, action.text);
		const pinnedActionPins = this.isPinned(action)
			? this.pinnedActionPins.filter((pinned) => !pinned.matches(action))
			: [...this.pinnedActionPins, pin];
		await this.replacePinnedActionPins(pinnedActionPins);
		this.render();
	}

	private isPinned(action: NextAction<TFile>): boolean {
		return this.pinnedActionPins.some((pin) => pin.matches(action));
	}

	private prunePinnedActionPins(actions: readonly NextAction<TFile>[]) {
		const pinnedActionPins = this.pinnedActionPins.filter((pin) =>
			actions.some((action) => pin.matches(action)),
		);
		if (pinnedActionPins.length === this.pinnedActionPins.length) return;
		this.replacePinnedActionPins(pinnedActionPins).catch(console.error);
	}

	private async replacePinnedActionPins(pinnedActionPins: readonly NextActionPin[]) {
		this.pinnedActionPins = pinnedActionPins;
		this.plugin.settings = {
			...this.plugin.settings,
			pinnedActionPins,
		};
		await this.plugin.saveSettings();
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
