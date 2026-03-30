import { App, Modal } from 'obsidian';
import { Status } from '../types';
import { t } from '../i18n';

type ClassifyResult =
	| { readonly classification: 'Reference' }
	| { readonly classification: 'Actionable'; readonly status: Status };

export class ClassifyModal extends Modal {
	private readonly onSelect: (result: ClassifyResult) => void;

	constructor(app: App, onSelect: (result: ClassifyResult) => void) {
		super(app);
		this.onSelect = onSelect;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('h2', { text: t('classifyModalTitle') });

		const buttonRow = contentEl.createDiv({ cls: 'modal-button-container' });

		buttonRow
			.createEl('button', { text: t('classifyAsReference') })
			.addEventListener('click', () => {
				this.close();
				this.onSelect({ classification: 'Reference' });
			});

		buttonRow
			.createEl('button', { text: t('classifyAsActionable'), cls: 'mod-cta' })
			.addEventListener('click', () => {
				this.close();
				this.openStatusPicker();
			});
	}

	private openStatusPicker() {
		const statuses: Status[] = ['進行中', '保留', '完了', '廃止'];
		const statusModal = new Modal(this.app);
		const { contentEl } = statusModal;
		contentEl.createEl('h2', { text: t('statusModalTitle') });
		const list = contentEl.createEl('ul', { cls: 'gtd-status-list' });
		statuses.forEach((status) => {
			const item = list.createEl('li');
			item.createEl('button', { text: status }).addEventListener('click', () => {
				statusModal.close();
				this.onSelect({ classification: 'Actionable', status });
			});
		});
		statusModal.open();
	}

	onClose() {
		this.contentEl.empty();
	}
}
