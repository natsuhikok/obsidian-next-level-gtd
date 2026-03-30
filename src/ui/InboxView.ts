import { App, ItemView, TFile, WorkspaceLeaf } from 'obsidian';
import { setClassification, setClassificationAndStatus } from '../frontmatter';
import { t } from '../i18n';
import { isInbox } from '../inbox';
import { Status } from '../types';
import { ClassifyModal } from './ClassifyModal';

export const VIEW_TYPE_INBOX = 'gtd-inbox';

export class InboxView extends ItemView {
	constructor(
		leaf: WorkspaceLeaf,
		private readonly pluginApp: App,
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
		await this.render();
	}

	async onClose() {
		this.contentEl.empty();
	}

	private async render() {
		const { contentEl } = this;
		contentEl.empty();

		const header = contentEl.createDiv({ cls: 'nav-header' });
		header.createEl('span', { text: t('inboxViewTitle'), cls: 'nav-header-title' });
		const refreshBtn = header.createEl('button', { text: t('refresh') });
		refreshBtn.addEventListener('click', () => {
			void this.render();
		});

		const inboxFiles = this.pluginApp.vault
			.getMarkdownFiles()
			.filter((f) =>
				isInbox(this.pluginApp.metadataCache.getFileCache(f)?.frontmatter ?? null),
			);

		if (inboxFiles.length === 0) {
			contentEl.createEl('p', { text: t('noInboxItems'), cls: 'gtd-empty' });
			return;
		}

		const list = contentEl.createEl('ul', { cls: 'gtd-inbox-list' });
		inboxFiles.forEach((file) => {
			const item = list.createEl('li', { cls: 'gtd-inbox-item' });

			const nameBtn = item.createEl('button', {
				text: file.basename,
				cls: 'gtd-note-name',
			});
			nameBtn.addEventListener('click', () => {
				void this.app.workspace.openLinkText(file.path, '', false);
			});

			const refBtn = item.createEl('button', {
				text: t('classifyAsReference'),
				cls: 'gtd-classify-btn',
			});
			refBtn.addEventListener('click', () => {
				void this.classify(file, { classification: 'Reference' });
			});

			const actBtn = item.createEl('button', {
				text: t('classifyAsActionable'),
				cls: 'gtd-classify-btn mod-cta',
			});
			actBtn.addEventListener('click', () => {
				new ClassifyModal(this.app, (result) => {
					void this.classify(file, result);
				}).open();
			});
		});
	}

	private async classify(
		file: TFile,
		result:
			| { readonly classification: 'Reference' }
			| { readonly classification: 'Actionable'; readonly status: Status },
	) {
		if ('status' in result) {
			await setClassificationAndStatus(this.pluginApp, file, 'Actionable', result.status);
		} else {
			await setClassification(this.pluginApp, file, result.classification);
		}
		await this.render();
	}
}
