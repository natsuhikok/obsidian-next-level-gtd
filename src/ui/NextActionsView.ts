import { ItemView, Keymap, MarkdownView, TFile, WorkspaceLeaf, moment, setIcon } from 'obsidian';
import { GTDNote } from '../GTDNote';
import type { NextAction } from '../NextActionCollection';
import { NextActionsFilter } from '../NextActionsFilter';
import { NoteEditor } from '../NoteEditor';
import { t } from '../i18n';
import type NextLevelGtdPlugin from '../main';

export const VIEW_TYPE_NEXT_ACTIONS = 'gtd-next-actions';

export class NextActionsView extends ItemView {
	private noteCache: Record<string, GTDNote> = {};
	private filter: NextActionsFilter;

	constructor(
		leaf: WorkspaceLeaf,
		private readonly plugin: NextLevelGtdPlugin,
	) {
		super(leaf);
		this.filter = NextActionsFilter.initial(plugin.settings.environmentContexts);
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
		const currentFilter = NextActionsFilter.initial(this.plugin.settings.environmentContexts);
		const allActions = Object.values(this.noteCache).flatMap((note) => [...note.nextActions]);
		const allPropertyCandidates = currentFilter.allPropertyCandidates(allActions);
		this.filter = new NextActionsFilter(
			currentFilter.environmentContexts,
			this.filter.selectedEnvironments.filter((e) =>
				currentFilter.environmentContexts.includes(e),
			),
			this.filter.noContextSelected,
			this.filter.selectedProperties,
			this.filter.noPropertySelected,
			this.filter.dateMode,
		).withSelectedPropertiesPruned(allPropertyCandidates);

		const { contentEl } = this;
		contentEl.empty();

		contentEl.createDiv({ cls: 'nav-header' });

		if (allActions.length === 0) {
			contentEl.createEl('p', { text: t('noNextActions'), cls: 'gtd-empty' });
			return;
		}

		const today = moment().format('YYYY-MM-DD');

		const filterBar = contentEl.createDiv({ cls: 'gtd-context-filter' });
		this.renderEnvBlock(filterBar, allActions, today);

		if (allPropertyCandidates.length > 0) {
			this.renderPropertyBlock(
				filterBar,
				allPropertyCandidates,
				new Set(this.filter.propertyCandidates(allActions, today)),
				this.hasPropertylessCandidate(allActions, today),
			);
		}

		this.renderDateBlock(filterBar);

		const filteredActions = this.filter.filter(allActions, today);

		if (filteredActions.length === 0) return;

		const sorted = this.filter.sort(filteredActions);

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

			this.renderContextBadges(body, action);

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

	private renderEnvBlock(
		filterBar: HTMLElement,
		allActions: readonly NextAction<TFile>[],
		today: string,
	) {
		const envContexts = this.filter.environmentContexts;
		const row = filterBar.createDiv({ cls: 'gtd-context-filter-row' });

		const addEnvChip = (label: string, value: string) => {
			const active =
				value === '__all__'
					? this.filter.isAllEnvironmentsSelected
					: value === '__no_context__'
						? this.filter.noContextSelected
						: this.filter.selectedEnvironments.includes(value);
			const chip = row.createEl('button', {
				cls: 'gtd-context-chip' + (active ? ' is-active' : ''),
				text: label,
			});
			chip.addEventListener('click', () => {
				if (value === '__all__') {
					this.filter = this.filter.withAllEnvironmentsToggled();
				} else if (value === '__no_context__') {
					this.filter = this.filter.withNoContextToggled();
				} else {
					this.filter = this.filter.withEnvironmentToggled(value);
				}
				this.render();
			});
		};

		// addEnvChip(t('filterEnvAll'), '__all__');
		addEnvChip(t('filterEnvNoContext'), '__no_context__');
		envContexts.forEach((ctx) => addEnvChip('#' + ctx, ctx));

		void allActions;
		void today;
	}

	private renderPropertyBlock(
		filterBar: HTMLElement,
		candidates: readonly string[],
		enabledCandidates: ReadonlySet<string>,
		hasPropertylessCandidate: boolean,
	) {
		const row = filterBar.createDiv({ cls: 'gtd-context-filter-row' });

		const noPropertyActive = this.filter.noPropertySelected;
		const noPropertyChip = row.createEl('button', {
			cls: 'gtd-context-chip' + (noPropertyActive ? ' is-active' : ''),
			text: t('filterPropNoContext'),
		});
		noPropertyChip.disabled = !noPropertyActive && !hasPropertylessCandidate;
		noPropertyChip.addEventListener('click', () => {
			this.filter = this.filter.withNoPropertyToggled();
			this.render();
		});

		candidates.forEach((prop) => {
			const active = this.filter.selectedProperties.includes(prop);
			const enabled = active || enabledCandidates.has(prop);
			const chip = row.createEl('button', {
				cls: 'gtd-context-chip' + (active ? ' is-active' : ''),
				text: '#' + prop,
			});
			chip.disabled = !enabled;
			chip.addEventListener('click', () => {
				this.filter = this.filter.withPropertyToggled(prop);
				this.render();
			});
		});
	}

	private hasPropertylessCandidate(
		actions: readonly NextAction<TFile>[],
		today: string,
	): boolean {
		return actions.some(
			(action) =>
				this.filter.passesDateFilter(action, today) &&
				this.filter.passesEnvironmentFilter(action) &&
				this.filter.propertyTagsOf(action).length === 0,
		);
	}

	private renderDateBlock(filterBar: HTMLElement) {
		const row = filterBar.createDiv({ cls: 'gtd-context-filter-row' });
		const addDateChip = (label: string, mode: 'actionable' | 'withDate') => {
			const active = this.filter.dateMode === mode;
			const chip = row.createEl('button', {
				cls: 'gtd-context-chip' + (active ? ' is-active' : ''),
				text: label,
			});
			chip.addEventListener('click', () => {
				this.filter = this.filter.withDateMode(mode);
				this.render();
			});
		};

		addDateChip(t('filterDateActionable'), 'actionable');
		addDateChip(t('filterDateWithDate'), 'withDate');
	}

	private renderContextBadges(body: HTMLElement, action: NextAction<TFile>) {
		const envTags = this.filter.environmentTagsOf(action);
		const propTags = this.filter.propertyTagsOf(action);

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
