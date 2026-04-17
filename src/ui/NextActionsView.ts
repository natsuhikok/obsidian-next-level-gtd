import {
	ItemView,
	Keymap,
	MarkdownView,
	Notice,
	TFile,
	WorkspaceLeaf,
	moment,
	setIcon,
} from 'obsidian';
import { ContextClassifier } from '../ContextClassifier';
import { FilterSelection } from '../FilterSelection';
import { GTDNote } from '../GTDNote';
import { NextActionFilterCriterion } from '../NextActionFilterCriterion';
import type { NextAction } from '../NextActionCollection';
import { NextActionsQuery } from '../NextActionsQuery';
import { NoteEditor } from '../NoteEditor';
import { SavedNextActionsFilter } from '../SavedNextActionsFilter';
import { t } from '../i18n';
import type NextLevelGtdPlugin from '../main';
import { SavedFilterNameModal } from './SavedFilterNameModal';

export const VIEW_TYPE_NEXT_ACTIONS = 'gtd-next-actions';

export class NextActionsView extends ItemView {
	private noteCache: Record<string, GTDNote> = {};
	private selection: FilterSelection;

	constructor(
		leaf: WorkspaceLeaf,
		private readonly plugin: NextLevelGtdPlugin,
	) {
		super(leaf);
		this.selection = FilterSelection.initial();
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
		const allActions = Object.values(this.noteCache).flatMap((note) => [...note.nextActions]);
		const today = moment().format('YYYY-MM-DD');
		const query = new NextActionsQuery(classifier, this.selection, allActions, today);

		this.selection = query.normalizedSelection;

		const { contentEl } = this;
		contentEl.empty();

		contentEl.createDiv({ cls: 'nav-header' });

		const filterBar = contentEl.createDiv({ cls: 'gtd-context-filter' });
		this.renderSavedFiltersBlock(filterBar);
		this.renderFilterGroupBlock(filterBar);
		this.renderEnvBlock(filterBar, classifier);

		const allPropertyCandidates = query.allPropertyCandidates;
		if (allPropertyCandidates.length > 0) {
			this.renderPropertyBlock(
				filterBar,
				allPropertyCandidates,
				query.enabledPropertyCandidates,
				query.hasPropertylessCandidate,
			);
		}

		this.renderDateBlock(filterBar);

		if (allActions.length === 0) {
			contentEl.createEl('p', { text: t('noNextActions'), cls: 'gtd-empty' });
			return;
		}

		const filteredActions = query.filteredActions;

		if (filteredActions.length === 0) return;

		const container = contentEl.createDiv({ cls: 'nav-files-container' });

		filteredActions.forEach((action) => {
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
		});

		contentEl.createDiv({
			cls: 'gtd-next-action-count',
			text: `${String(filteredActions.length)} actions`,
		});
	}

	private renderSavedFiltersBlock(filterBar: HTMLElement) {
		const row = filterBar.createDiv({ cls: 'gtd-context-filter-row' });
		const savedFilters = this.plugin.settings.savedNextActionsFilters;
		const select = row.createEl('select', { cls: 'gtd-saved-filter-select' });
		savedFilters.forEach((filter) => {
			select.createEl('option', { value: filter.id, text: filter.name });
		});
		select.disabled = savedFilters.length === 0;

		const applyButton = row.createEl('button', {
			cls: 'gtd-context-chip',
			text: t('filterApplySaved'),
		});
		applyButton.disabled = savedFilters.length === 0;
		applyButton.addEventListener('click', () => {
			const selected = savedFilters.find((filter) => filter.id === select.value);
			if (selected == null) return;
			this.selection = FilterSelection.fromExpression(selected.expression);
			this.render();
		});

		const saveButton = row.createEl('button', {
			cls: 'gtd-context-chip',
			text: t('filterSaveCurrent'),
		});
		saveButton.addEventListener('click', () => {
			new SavedFilterNameModal(this.app, (name) => {
				void this.saveCurrentFilter(name);
			}).open();
		});

		const deleteButton = row.createEl('button', {
			cls: 'gtd-context-chip',
			text: t('filterDeleteSaved'),
		});
		deleteButton.disabled = savedFilters.length === 0;
		deleteButton.addEventListener('click', () => {
			void this.deleteSavedFilter(select.value);
		});
	}

	private renderFilterGroupBlock(filterBar: HTMLElement) {
		const row = filterBar.createDiv({ cls: 'gtd-context-filter-row' });
		this.selection.expression.groups.forEach((_, index) => {
			const active = this.selection.activeGroupIndex === index;
			const chip = row.createEl('button', {
				cls: 'gtd-context-chip' + (active ? ' is-active' : ''),
				text: `${t('filterOrGroup')} ${String(index + 1)}`,
			});
			chip.addEventListener('click', () => {
				this.selection = this.selection.withActiveGroup(index);
				this.render();
			});
		});

		const addButton = row.createEl('button', {
			cls: 'gtd-context-chip',
			text: t('filterAddOrGroup'),
		});
		addButton.addEventListener('click', () => {
			this.selection = this.selection.withGroupAdded();
			this.render();
		});

		const removeButton = row.createEl('button', {
			cls: 'gtd-context-chip',
			text: t('filterRemoveOrGroup'),
		});
		removeButton.disabled = this.selection.expression.groups.length === 1;
		removeButton.addEventListener('click', () => {
			this.selection = this.selection.withGroupRemoved();
			this.render();
		});
	}

	private renderEnvBlock(filterBar: HTMLElement, classifier: ContextClassifier) {
		const envContexts = classifier.environmentContexts;
		const row = filterBar.createDiv({ cls: 'gtd-context-filter-row' });

		const addEnvChip = (label: string, value: string) => {
			const criterion =
				value === '__no_context__'
					? new NextActionFilterCriterion('noEnvironment')
					: new NextActionFilterCriterion('environment', value);
			const active =
				value === '__all__'
					? this.selection.isAllEnvironmentsSelected(envContexts)
					: value === '__no_context__'
						? this.selection.hasActiveCriterion(criterion)
						: this.selection.hasActiveCriterion(criterion);
			const chip = row.createEl('button', {
				cls: 'gtd-context-chip' + (active ? ' is-active' : ''),
				text: label,
			});
			chip.addEventListener('click', () => {
				if (value === '__all__') {
					this.selection = this.selection.withAllEnvironmentsToggled(envContexts);
				} else {
					this.selection = this.selection.withActiveCriterionToggled(criterion);
				}
				this.render();
			});
		};

		// addEnvChip(t('filterEnvAll'), '__all__');
		addEnvChip(t('filterEnvNoContext'), '__no_context__');
		envContexts.forEach((ctx) => addEnvChip('#' + ctx, ctx));
	}

	private renderPropertyBlock(
		filterBar: HTMLElement,
		candidates: readonly string[],
		enabledCandidates: ReadonlySet<string>,
		hasPropertylessCandidate: boolean,
	) {
		const row = filterBar.createDiv({ cls: 'gtd-context-filter-row' });

		const noPropertyActive = this.selection.noPropertySelected;
		const noPropertyCriterion = new NextActionFilterCriterion('noProperty');
		const noPropertyChip = row.createEl('button', {
			cls:
				'gtd-context-chip' +
				(this.selection.hasActiveCriterion(noPropertyCriterion) ? ' is-active' : ''),
			text: t('filterPropNoContext'),
		});
		noPropertyChip.disabled = !noPropertyActive && !hasPropertylessCandidate;
		noPropertyChip.addEventListener('click', () => {
			this.selection = this.selection.withActiveCriterionToggled(noPropertyCriterion);
			this.render();
		});

		candidates.forEach((prop) => {
			const criterion = new NextActionFilterCriterion('property', prop);
			const active = this.selection.hasActiveCriterion(criterion);
			const enabled = active || enabledCandidates.has(prop);
			const chip = row.createEl('button', {
				cls: 'gtd-context-chip' + (active ? ' is-active' : ''),
				text: '#' + prop,
			});
			chip.disabled = !enabled;
			chip.addEventListener('click', () => {
				this.selection = this.selection.withActiveCriterionToggled(criterion);
				this.render();
			});
		});
	}

	private renderDateBlock(filterBar: HTMLElement) {
		const row = filterBar.createDiv({ cls: 'gtd-context-filter-row' });
		const addDateChip = (label: string, mode: 'actionable' | 'withDate') => {
			const criterion = new NextActionFilterCriterion(mode);
			const active = this.selection.hasActiveCriterion(criterion);
			const chip = row.createEl('button', {
				cls: 'gtd-context-chip' + (active ? ' is-active' : ''),
				text: label,
			});
			chip.addEventListener('click', () => {
				this.selection = this.selection.withActiveCriterionToggled(criterion);
				this.render();
			});
		};

		addDateChip(t('filterDateActionable'), 'actionable');
		addDateChip(t('filterDateWithDate'), 'withDate');
	}

	private async saveCurrentFilter(name: string) {
		const savedFilter = new SavedNextActionsFilter(
			String(Date.now()),
			name,
			this.selection.expression,
		);
		this.plugin.settings = {
			...this.plugin.settings,
			savedNextActionsFilters: [...this.plugin.settings.savedNextActionsFilters, savedFilter],
		};
		await this.plugin.saveSettings();
		new Notice(t('filterSavedNotice'));
		this.render();
	}

	private async deleteSavedFilter(id: string) {
		if (id === '') return;
		this.plugin.settings = {
			...this.plugin.settings,
			savedNextActionsFilters: this.plugin.settings.savedNextActionsFilters.filter(
				(filter) => filter.id !== id,
			),
		};
		await this.plugin.saveSettings();
		this.render();
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
