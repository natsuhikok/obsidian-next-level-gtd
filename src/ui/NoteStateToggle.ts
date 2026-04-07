import { App, TFile } from 'obsidian';
import { setNoteState } from '../setNoteState';
import { t } from '../i18n';
import { NoteState } from '../NoteState';
import { Status } from '../Status';

const ALL_STATUSES: readonly Status[] = ['進行中', '保留', '休眠', '完了', '廃止'];

type ToggleOption =
	| { readonly kind: 'reference' }
	| { readonly kind: 'status'; readonly status: Status };

const OPTIONS: readonly ToggleOption[] = [
	{ kind: 'reference' },
	...ALL_STATUSES.map((status): ToggleOption => ({ kind: 'status', status })),
];

const STATUS_LABELS: Record<Status, () => string> = {
	進行中: () => t('statusInProgress'),
	保留: () => t('statusOnHold'),
	休眠: () => t('statusDormant'),
	完了: () => t('statusCompleted'),
	廃止: () => t('statusAbandoned'),
};

export class NoteStateToggle {
	constructor(
		container: HTMLElement,
		state: NoteState,
		app: App,
		file: TFile,
		onChanged: () => void,
	) {
		const pill = container.createDiv({ cls: 'gtd-classify-toggle' });
		OPTIONS.forEach((option) => {
			const active = this.isActive(option, state);
			const btn = pill.createEl('button', {
				text: this.getLabel(option),
				cls: `gtd-classify-option${active ? ' is-active' : ''}`,
			});
			if (!active) {
				btn.addEventListener('click', () => {
					void this.apply(option, app, file).then(onChanged);
				});
			}
		});
	}

	private getLabel(option: ToggleOption): string {
		return option.kind === 'reference'
			? t('classificationReference')
			: STATUS_LABELS[option.status]();
	}

	private isActive(option: ToggleOption, state: NoteState): boolean {
		if (option.kind === 'reference') return state.isReference;
		return state.isActionable && state.status === option.status;
	}

	private async apply(option: ToggleOption, app: App, file: TFile): Promise<void> {
		await setNoteState(app, file, option.kind === 'reference' ? 'reference' : option.status);
	}
}
