import { App, TFile } from 'obsidian';
import { NoteState } from '../NoteState';
import { t } from '../i18n';
import { Status } from '../Status';

type ToggleOption =
	| { readonly kind: 'reference' }
	| { readonly kind: 'status'; readonly status: Status };

const OPTIONS: readonly ToggleOption[] = [
	{ kind: 'reference' },
	...NoteState.allStatuses.map((status): ToggleOption => ({ kind: 'status', status })),
];

const STATUS_LABELS: Record<Status, () => string> = {
	進行中: () => t('statusInProgress'),
	保留: () => t('statusOnHold'),
	休眠: () => t('statusDormant'),
	完了: () => t('statusCompleted'),
	廃止: () => t('statusAbandoned'),
};

function getLabel(option: ToggleOption): string {
	return option.kind === 'reference'
		? t('classificationReference')
		: STATUS_LABELS[option.status]();
}

function isActive(option: ToggleOption, state: NoteState): boolean {
	if (option.kind === 'reference') return state.isReference;
	return state.isActionable && state.status === option.status;
}

export class NoteStateToggle {
	constructor(
		private readonly container: HTMLElement,
		private readonly state: NoteState,
		private readonly app: App,
		private readonly file: TFile,
		private readonly onChanged: () => void,
	) {}

	render(): void {
		const pill = this.container.createDiv({ cls: 'gtd-classify-toggle' });
		OPTIONS.forEach((option) => {
			const active = isActive(option, this.state);
			const btn = pill.createEl('button', {
				text: getLabel(option),
				cls: `gtd-classify-option${active ? ' is-active' : ''}`,
			});
			if (!active) {
				btn.addEventListener('click', () => {
					void this.applyOption(option).then(this.onChanged);
				});
			}
		});
	}

	private async applyOption(option: ToggleOption): Promise<void> {
		const target = option.kind === 'reference' ? 'reference' : option.status;
		await NoteState.fromTarget(target).applyTo(this.app, this.file);
	}
}
