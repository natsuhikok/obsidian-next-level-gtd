import { App, TFile } from 'obsidian';
import { setNoteState } from '../setNoteState';
import { t } from '../i18n';
import { NoteState } from '../NoteState';
import { ALL_STATUSES, Status } from '../types';

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

async function apply(option: ToggleOption, app: App, file: TFile): Promise<void> {
	await setNoteState(app, file, option.kind === 'reference' ? 'reference' : option.status);
}

export function renderNoteStateToggle(
	container: HTMLElement,
	state: NoteState,
	app: App,
	file: TFile,
	onChanged: () => void,
): void {
	const pill = container.createDiv({ cls: 'gtd-classify-toggle' });
	OPTIONS.forEach((option) => {
		const active = isActive(option, state);
		const btn = pill.createEl('button', {
			text: getLabel(option),
			cls: `gtd-classify-option${active ? ' is-active' : ''}`,
		});
		if (!active) {
			btn.addEventListener('click', () => {
				void apply(option, app, file).then(onChanged);
			});
		}
	});
}
