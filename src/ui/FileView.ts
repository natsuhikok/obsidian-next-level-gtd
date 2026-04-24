import { ItemView, Keymap, TFile, WorkspaceLeaf, setIcon } from 'obsidian';
import { GTDNote } from '../GTDNote';
import { t } from '../i18n';
import type NextLevelGtdPlugin from '../main';

type FileTabId = 'inbox' | 'all' | 'recent' | 'inProgress';

type FileTab = {
	readonly id: FileTabId;
	readonly label: string;
	readonly notes: readonly GTDNote[];
	readonly usePinnedOrder: boolean;
};

export class FileView extends ItemView {
	static readonly viewType = 'gtd-files';
	private noteCache: Record<string, GTDNote> = {};
	private selectedTabId: FileTabId = 'inbox';
	private filterText = '';
	private listContainer: HTMLElement | null = null;

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
		return 'folder-open';
	}

	async onOpen() {
		await this.fullScan();
		this.render();
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', (leaf) => {
				if (leaf !== this.leaf) this.renderFileList();
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

	onRecentFileHistoryChange() {
		this.render();
	}

	async refresh() {
		await this.fullScan();
		this.render();
	}

	private isExcluded(file: TFile): boolean {
		return !this.plugin.fileParticipatesInFileView(file);
	}

	private openNote(file: TFile, event: MouseEvent) {
		this.clearFilterForFileOpen();
		void this.app.workspace.getLeaf(Keymap.isModEvent(event)).openFile(file);
	}

	private openNoteInNewTab(file: TFile) {
		void this.app.workspace.getLeaf(true).openFile(file);
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

	private get tabs(): readonly FileTab[] {
		const notes = Object.values(this.noteCache);
		return [
			{
				id: 'inbox',
				label: t('fileViewTabInbox'),
				notes: notes.filter((note) => note.isInbox || note.alerts.length > 0),
				usePinnedOrder: true,
			},
			{
				id: 'all',
				label: t('fileViewTabAll'),
				notes,
				usePinnedOrder: true,
			},
			{
				id: 'recent',
				label: t('fileViewTabRecent'),
				notes: this.plugin.settings.recentFilePaths.filePaths
					.map((filePath) => this.noteCache[filePath])
					.filter((note): note is GTDNote => note != null),
				usePinnedOrder: false,
			},
			{
				id: 'inProgress',
				label: t('fileViewTabInProgress'),
				notes: notes.filter((note) => note.hasActionableStatus('進行中')),
				usePinnedOrder: true,
			},
		];
	}

	private get selectedTab(): FileTab {
		const selectedTab = this.tabs.find((tab) => tab.id === this.selectedTabId);
		if (selectedTab == null) {
			throw new Error('選択中のタブが見つかりません');
		}
		return selectedTab;
	}

	private render() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createDiv({ cls: 'nav-header' });
		this.renderTabs(contentEl);
		this.renderFilter(contentEl);
		this.listContainer = contentEl.createDiv({ cls: 'nav-files-container' });
		this.renderFileList();
	}

	private renderTabs(contentEl: HTMLElement) {
		const tabBar = contentEl.createDiv({ cls: 'gtd-tab-bar' });
		this.tabs.forEach((tab) => {
			const active = tab.id === this.selectedTabId;
			const button = tabBar.createEl('button', {
				cls: 'gtd-tab' + (active ? ' is-active' : ''),
			});
			button.setAttribute('aria-pressed', String(active));
			button.createSpan({ text: tab.label });
			button.createSpan({ cls: 'gtd-tab-badge', text: String(tab.notes.length) });
			button.addEventListener('click', () => {
				this.selectedTabId = tab.id;
				this.render();
			});
		});
	}

	private renderFilter(contentEl: HTMLElement) {
		const filter = contentEl.createDiv({ cls: 'gtd-file-filter' });
		const input = filter.createEl('input', {
			cls: 'gtd-file-filter-input',
			type: 'text',
			value: this.filterText,
			placeholder: t('fileViewFilterPlaceholder'),
		});
		input.addEventListener('input', () => {
			this.filterText = input.value;
			this.renderFileList();
		});
	}

	private renderFileList() {
		if (this.listContainer == null) return;
		this.listContainer.empty();
		const selectedTab = this.selectedTab;
		const notes = this.filteredNotes(selectedTab.notes, selectedTab.usePinnedOrder);

		if (notes.length === 0) {
			this.listContainer.createEl('p', { text: t('noFilesInSelectedTab'), cls: 'gtd-empty' });
			return;
		}

		const activeFilePath = this.app.workspace.getActiveFile()?.path;
		notes.forEach((note) => {
			const isActive = note.file.path === activeFilePath;
			const pinned = this.isPinned(note.file);
			const title = this.listContainer?.createDiv({ cls: 'nav-file' }).createDiv({
				cls: `nav-file-title${isActive ? ' is-active' : ''}`,
			});
			if (title == null) return;
			title.addEventListener('click', (event) => {
				this.openNote(note.file, event);
			});

			const pinButton = title.createEl('button', {
				cls: 'gtd-file-pin' + (pinned ? ' is-pinned' : ''),
			});
			pinButton.setAttribute('aria-label', pinned ? t('unpinFile') : t('pinFile'));
			pinButton.setAttribute('aria-pressed', String(pinned));
			setIcon(pinButton, 'pin');
			pinButton.addEventListener('click', (event) => {
				event.stopPropagation();
				this.togglePinnedFile(note.file).catch(console.error);
			});

			title.createSpan({ text: note.file.basename, cls: 'nav-file-title-content' });
		});
	}

	private filteredNotes(notes: readonly GTDNote[], usePinnedOrder: boolean): readonly GTDNote[] {
		const normalizedFilter = this.filterText.trim().toLowerCase();
		const filtered =
			normalizedFilter === ''
				? notes
				: notes.filter((note) => note.file.name.toLowerCase().includes(normalizedFilter));
		if (!usePinnedOrder) return filtered;
		return [
			...filtered.filter((note) => this.isPinned(note.file)),
			...filtered.filter((note) => !this.isPinned(note.file)),
		];
	}

	private clearFilterForFileOpen() {
		if (this.filterText.trim() === '') return;
		this.filterText = '';
		this.render();
	}

	private async togglePinnedFile(file: TFile) {
		await this.plugin.toggleFilePin(file);
		this.renderFileList();
		this.openNoteInNewTab(file);
	}

	private isPinned(file: TFile): boolean {
		return this.plugin.isFilePinned(file);
	}
}
