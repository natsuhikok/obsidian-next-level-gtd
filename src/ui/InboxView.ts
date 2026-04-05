import { ItemView, MarkdownView, TFile, WorkspaceLeaf } from 'obsidian';
import { GTDNote } from '../GTDNote';
import { t } from '../i18n';
import type NextLevelGtdPlugin from '../main';

export const VIEW_TYPE_INBOX = 'gtd-inbox';

export class InboxView extends ItemView {
	private noteCache: Record<string, GTDNote> = {};

	constructor(
		leaf: WorkspaceLeaf,
		private readonly plugin: NextLevelGtdPlugin,
	) {
		super(leaf);
	}

	getViewType() {
		return VIEW_TYPE_INBOX;
	}

	getDisplayText() {
		return t('inboxViewTitle');
	}

	getIcon() {
		return 'inbox';
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
		if (this.isFullyExcluded(file)) {
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

	private isFullyExcluded(file: TFile): boolean {
		return this.plugin.settings.excludedFolders.some(
			(ef) => !ef.showAlert && file.path.startsWith(ef.path + '/'),
		);
	}

	private openNote(filePath: string) {
		const leaves = this.app.workspace.getLeavesOfType('markdown');
		const existing = leaves.find((leaf) => (leaf.view as MarkdownView).file?.path === filePath);
		if (existing) {
			void this.app.workspace.revealLeaf(existing);
		} else {
			void this.app.workspace.openLinkText(filePath, '', leaves.length > 0);
		}
	}

	private async fullScan() {
		const { excludedFolders } = this.plugin.settings;
		const fullyExcludedPaths = excludedFolders
			.filter((ef) => !ef.showAlert)
			.map((ef) => ef.path);
		const files = this.app.vault
			.getMarkdownFiles()
			.filter((file) => !fullyExcludedPaths.some((p) => file.path.startsWith(p + '/')));
		const notes = await Promise.all(files.map((file) => GTDNote.load(this.app, file)));
		this.noteCache = notes.reduce<Record<string, GTDNote>>(
			(acc, note) => ({ ...acc, [note.file.path]: note }),
			{},
		);
	}

	private render() {
		const { contentEl } = this;
		contentEl.empty();

		const { excludedFolders } = this.plugin.settings;
		const alertOnlyPaths = excludedFolders.filter((ef) => ef.showAlert).map((ef) => ef.path);

		const notes = Object.values(this.noteCache);
		const displayNotes = notes.filter((n) => {
			const isAlertOnly = alertOnlyPaths.some((p) => n.file.path.startsWith(p + '/'));
			return isAlertOnly ? n.alerts.length > 0 : n.isInbox || n.alerts.length > 0;
		});
		const activeFilePath = this.app.workspace.getActiveFile()?.path;

		if (displayNotes.length === 0) {
			contentEl.createEl('p', { text: t('noInboxOrAlerts'), cls: 'gtd-empty' });
			return;
		}

		const container = contentEl.createDiv({ cls: 'nav-files-container' });
		displayNotes.forEach((note) => {
			const isActive = note.file.path === activeFilePath;
			const title = container.createDiv({ cls: 'nav-file' }).createDiv({
				cls: `nav-file-title${isActive ? ' is-active' : ''}`,
			});
			title.createSpan({ text: note.file.basename, cls: 'nav-file-title-content' });
			title.addEventListener('click', () => {
				this.openNote(note.file.path);
			});
		});
	}
}
