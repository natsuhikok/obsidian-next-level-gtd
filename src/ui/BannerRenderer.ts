import { App, MarkdownView, TFile, setIcon } from 'obsidian';
import { GTDNote } from '../GTDNote';
import { t } from '../i18n';
import { AlertType } from '../types';
import { renderNoteStateToggle } from './NoteStateToggle';

const BANNER_ID = 'gtd-banner';

export class BannerRenderer {
	constructor(private readonly app: App) {}

	update(file: TFile | null) {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (view == null) return;

		view.containerEl.querySelector(`#${BANNER_ID}`)?.remove();

		if (file == null || view.file?.path !== file.path) {
			const currentFile = view.file;
			if (currentFile == null) return;
			this.render(view, currentFile);
			return;
		}

		this.render(view, file);
	}

	renderForActiveView() {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (view == null) return;
		view.containerEl.querySelector(`#${BANNER_ID}`)?.remove();
		const file = view.file;
		if (file == null) return;
		this.render(view, file);
	}

	private render(view: MarkdownView, file: TFile) {
		const fm = this.app.metadataCache.getFileCache(file)?.frontmatter ?? null;
		const content = view.getViewData();
		const note = GTDNote.from(file, fm, content);

		const wrapper = view.containerEl.createDiv();
		wrapper.id = BANNER_ID;

		const banner = wrapper.createDiv({ cls: 'gtd-banner' });
		const onChanged = () => this.update(file);

		renderNoteStateToggle(banner, note.state, this.app, file, onChanged);

		if (note.alerts.length > 0) {
			const alertTypeLabels: Record<AlertType, string> = {
				frontmatterInvalid: t('alertFrontmatterInvalid'),
				referenceHasNextAction: t('alertReferenceHasNextAction'),
				actionableInProgressNoNextAction: t('alertActionableInProgressNoNextAction'),
				actionableDoneHasNextAction: t('alertActionableDoneHasNextAction'),
			};

			note.alerts.forEach((alertType) => {
				const callout = wrapper.createDiv({
					cls: 'callout gtd-alert-callout',
					attr: { 'data-callout': 'danger' },
				});
				const titleEl = callout.createDiv({ cls: 'callout-title' });
				const iconEl = titleEl.createDiv({ cls: 'callout-icon' });
				setIcon(iconEl, 'zap');
				titleEl.createDiv({ cls: 'callout-title-inner', text: alertTypeLabels[alertType] });
			});
		}

		view.contentEl.before(wrapper);
	}
}
