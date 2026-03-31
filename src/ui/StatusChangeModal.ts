import { App, SuggestModal } from 'obsidian';
import { ALL_STATUSES, Status } from '../types';
import { t } from '../i18n';

export class StatusChangeModal extends SuggestModal<Status> {
	private readonly onSelect: (status: Status) => void;

	constructor(app: App, onSelect: (status: Status) => void) {
		super(app);
		this.setPlaceholder(t('selectStatus'));
		this.onSelect = onSelect;
	}

	getSuggestions(): Status[] {
		return [...ALL_STATUSES];
	}

	renderSuggestion(status: Status, el: HTMLElement) {
		el.createEl('div', { text: status });
	}

	onChooseSuggestion(status: Status) {
		this.onSelect(status);
	}
}
