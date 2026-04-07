import { App, SuggestModal } from 'obsidian';
import { Status } from '../Status';
import { t } from '../i18n';

const ALL_STATUSES: readonly Status[] = ['進行中', '保留', '休眠', '完了', '廃止'];

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
