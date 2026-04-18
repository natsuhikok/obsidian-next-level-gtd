import { ItemView, Keymap, TFile, WorkspaceLeaf, setIcon } from 'obsidian';
import { FilePin } from '../FilePin';
import { FileViewCategory } from '../FileViewCategory';
import { GTDNote } from '../GTDNote';
import { t } from '../i18n';
import type NextLevelGtdPlugin from '../main';

export class FileView extends ItemView {
	static readonly viewType = 'gtd-file-view';
	private noteCache: Record<string, GTDNote> = {};
	private activeCategory = FileViewCategory.inbox();
	private filenameFilter = '';

	constructor(
		leaf: WorkspaceLeaf,
		private readonly plugin: NextLevelGtdPlugin,
	) {
		super(leaf);
	}

	getViewType() {
		return FileView.viewType;
	}

	getDisplayText() {
		return t('fileViewTitle');
	}

	getIcon() {
		return 'files';
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
		if (file.extension !== 'md') return;
		if (this.isExcluded(file)) {
			this.noteCache = Object.fromEntries(
				Object.entries(this.noteCache).filter(([key]) => key !== file.path),
			);
			this.render();
			return;
		}
		const note = await GTDNote.load(this.app, file);
		this.noteCache = { ...this.noteCache, [file.path]: note };
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
		this.render();
	}

	private isExcluded(file: TFile): boolean {
		return this.plugin.settings.excludedFolders.some((ef) =>
			file.path.startsWith(ef.folder + '/'),
		);
	}

	private openNote(file: TFile, event: MouseEvent) {
		void this.app.workspace.getLeaf(Keymap.isModEvent(event)).openFile(file);
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

		const notes = Object.values(this.noteCache);
		const categories = [
			FileViewCategory.inbox(),
			FileViewCategory.inProgress(),
			FileViewCategory.onHold(),
			FileViewCategory.reference(),
			FileViewCategory.all(),
		];
		const normalizedFilter = this.filenameFilter.trim().toLowerCase();
		const matchingNotes = notes.filter((note) => this.activeCategory.matches(note));
		const displayNotes = matchingNotes
			.filter((note) => note.file.basename.toLowerCase().includes(normalizedFilter))
			.sort((a, b) => Number(this.isPinned(b.file)) - Number(this.isPinned(a.file)));
		const activeFilePath = this.app.workspace.getActiveFile()?.path;

		contentEl.createDiv({ cls: 'nav-header' });
		this.renderTabs(contentEl, categories, notes);
		this.renderFilenameFilter(contentEl);

		if (displayNotes.length === 0) {
			contentEl.createEl('p', { text: t('noFileViewItems'), cls: 'gtd-empty' });
			return;
		}

		const container = contentEl.createDiv({ cls: 'nav-files-container' });
		displayNotes.forEach((note) => {
			const isActive = note.file.path === activeFilePath;
			const pinned = this.isPinned(note.file);
			const row = container.createDiv({
				cls: `nav-file gtd-file-view-item${pinned ? ' is-pinned' : ''}`,
			});
			const pinButton = row.createEl('button', {
				cls: `gtd-file-pin${pinned ? ' is-pinned' : ''}`,
			});
			pinButton.setAttribute('aria-label', pinned ? t('unpinFile') : t('pinFile'));
			pinButton.setAttribute('aria-pressed', String(pinned));
			setIcon(pinButton, 'pin');
			pinButton.addEventListener('click', (event) => {
				event.stopPropagation();
				void this.togglePinnedFile(note.file);
			});
			const title = row.createDiv({
				cls: `nav-file-title${isActive ? ' is-active' : ''}`,
			});
			title.createSpan({ text: note.file.basename, cls: 'nav-file-title-content' });
			title.addEventListener('click', (event) => {
				this.openNote(note.file, event);
			});
		});
	}

	private renderTabs(
		contentEl: HTMLElement,
		categories: readonly FileViewCategory[],
		notes: readonly GTDNote[],
	) {
		const tabBar = contentEl.createDiv({ cls: 'gtd-tab-bar' });
		categories.forEach((category) => {
			const isActive = this.activeCategory.id === category.id;
			const tab = tabBar.createEl('button', {
				cls: `gtd-tab${isActive ? ' is-active' : ''}`,
			});
			tab.createSpan({ text: this.categoryName(category) });
			tab.createSpan({
				cls: 'gtd-tab-badge',
				text: String(notes.filter((note) => category.matches(note)).length),
			});
			tab.addEventListener('click', () => {
				this.activeCategory = category;
				this.render();
			});
		});
	}

	private renderFilenameFilter(contentEl: HTMLElement) {
		const filter = contentEl.createDiv({ cls: 'gtd-file-filter' });
		const input = filter.createEl('input', {
			type: 'text',
			placeholder: t('fileFilterPlaceholder'),
		});
		input.value = this.filenameFilter;
		input.addEventListener('input', () => {
			this.filenameFilter = input.value;
			this.render();
		});
	}

	private categoryName(category: FileViewCategory): string {
		if (category.id === 'inbox') return t('fileViewTabInbox');
		if (category.id === 'inProgress') return t('fileViewTabInProgress');
		if (category.id === 'onHold') return t('fileViewTabOnHold');
		if (category.id === 'reference') return t('fileViewTabReference');
		return t('fileViewTabAll');
	}

	private async togglePinnedFile(file: TFile) {
		const pinned = this.isPinned(file);
		this.plugin.settings = {
			...this.plugin.settings,
			filePins: pinned
				? this.plugin.settings.filePins.filter((fileName) => fileName !== file.name)
				: [...this.plugin.settings.filePins, file.name],
		};
		await this.plugin.saveSettings();
		this.render();
	}

	private isPinned(file: TFile): boolean {
		return this.plugin.settings.filePins.some((fileName) =>
			new FilePin(fileName).matches(file),
		);
	}
}
