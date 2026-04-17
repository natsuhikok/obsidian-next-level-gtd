import { App, Modal, TextComponent } from 'obsidian';
import { t } from '../i18n';

export class SavedFilterNameModal extends Modal {
	private readonly onSubmit: (name: string) => void;

	constructor(app: App, onSubmit: (name: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl('h2', { text: t('filterSaveCurrent') });
		const input = new TextComponent(contentEl);
		input.setPlaceholder(t('filterSavePrompt'));
		input.inputEl.focus();

		const buttonRow = contentEl.createDiv({ cls: 'modal-button-container' });
		buttonRow
			.createEl('button', { text: t('confirmModalCancel') })
			.addEventListener('click', () => this.close());
		const saveButton = buttonRow.createEl('button', {
			text: t('filterSaveCurrent'),
			cls: 'mod-cta',
		});
		saveButton.addEventListener('click', () => {
			const name = input.getValue().trim();
			if (name === '') return;
			this.close();
			this.onSubmit(name);
		});
		input.inputEl.addEventListener('keydown', (event) => {
			if (event.key !== 'Enter') return;
			const name = input.getValue().trim();
			if (name === '') return;
			this.close();
			this.onSubmit(name);
		});
	}

	onClose() {
		this.contentEl.empty();
	}
}
