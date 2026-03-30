import { App, Modal } from 'obsidian';
import { t } from '../i18n';

export class ConfirmModal extends Modal {
	private readonly message: string;
	private readonly onConfirm: () => void;

	constructor(app: App, message: string, onConfirm: () => void) {
		super(app);
		this.message = message;
		this.onConfirm = onConfirm;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('h2', { text: t('confirmModalTitle') });
		contentEl.createEl('p', { text: this.message });

		const buttonRow = contentEl.createDiv({ cls: 'modal-button-container' });

		buttonRow
			.createEl('button', { text: t('confirmModalCancel'), cls: 'mod-warning' })
			.addEventListener('click', () => this.close());

		const executeBtn = buttonRow.createEl('button', {
			text: t('confirmModalExecute'),
			cls: 'mod-cta',
		});
		executeBtn.addEventListener('click', () => {
			this.close();
			this.onConfirm();
		});
	}

	onClose() {
		this.contentEl.empty();
	}
}
