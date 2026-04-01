import { ItemView, Keymap, MarkdownView, TFile, WorkspaceLeaf } from 'obsidian';
import { GTDNote } from '../GTDNote';
import { t } from '../i18n';
import type NextLevelGtdPlugin from '../main';

export const VIEW_TYPE_INBOX = 'gtd-inbox';

type Tab = 'inbox' | 'alert';

export class InboxView extends ItemView {
	private tab: Tab = 'inbox';
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
		return this.plugin.settings.excludedFolders.some((ef) => file.path.startsWith(ef + '/'));
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
		const files = this.app.vault
			.getMarkdownFiles()
			.filter((file) => !excludedFolders.some((ef) => file.path.startsWith(ef + '/')));
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
		const inboxNotes = notes.filter((n) => n.isInbox);
		const alertNotes = notes.filter((n) => n.alerts.length > 0);
		const activeFilePath = this.app.workspace.getActiveFile()?.path;

		const header = contentEl.createDiv({ cls: 'nav-header' });

		const tabBar = header.createDiv({ cls: 'gtd-tab-bar' });
		const inboxBtn = tabBar.createEl('button', {
			cls: `gtd-tab${this.tab === 'inbox' ? ' is-active' : ''}`,
		});
		inboxBtn.createSpan({ text: t('inboxViewTitle') });
		if (inboxNotes.length > 0) {
			inboxBtn.createSpan({ text: String(inboxNotes.length), cls: 'gtd-tab-badge' });
		}
		inboxBtn.addEventListener('click', (event) => {
			this.tab = 'inbox';
			this.render();
			if (Keymap.isModEvent(event)) {
				Object.values(this.noteCache)
					.filter((n) => n.isInbox)
					.forEach((note) => {
						this.openNote(note.file.path);
					});
			}
		});

		const alertBtn = tabBar.createEl('button', {
			cls: `gtd-tab${this.tab === 'alert' ? ' is-active' : ''}`,
		});
		alertBtn.createSpan({ text: t('alertViewTitle') });
		if (alertNotes.length > 0) {
			alertBtn.createSpan({ text: String(alertNotes.length), cls: 'gtd-tab-badge' });
		}
		alertBtn.addEventListener('click', (event) => {
			this.tab = 'alert';
			this.render();
			if (Keymap.isModEvent(event)) {
				Object.values(this.noteCache)
					.filter((n) => n.alerts.length > 0)
					.forEach((note) => {
						this.openNote(note.file.path);
					});
			}
		});

		if (this.tab === 'inbox') {
			this.renderInbox(contentEl, inboxNotes, activeFilePath);
		} else {
			this.renderAlerts(contentEl, alertNotes, activeFilePath);
		}
	}

	private renderInbox(
		contentEl: HTMLElement,
		inboxNotes: GTDNote[],
		activeFilePath: string | undefined,
	) {
		if (inboxNotes.length === 0) {
			contentEl.createEl('p', { text: t('noInboxItems'), cls: 'gtd-empty' });
			return;
		}

		const container = contentEl.createDiv({ cls: 'nav-files-container' });
		inboxNotes.forEach((note) => {
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

	private renderAlerts(
		contentEl: HTMLElement,
		alertNotes: GTDNote[],
		activeFilePath: string | undefined,
	) {
		if (alertNotes.length === 0) {
			contentEl.createEl('p', { text: t('noAlerts'), cls: 'gtd-empty' });
			return;
		}

		const container = contentEl.createDiv({ cls: 'nav-files-container' });
		alertNotes.forEach((note) => {
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
