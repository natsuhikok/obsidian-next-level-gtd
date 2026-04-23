import { MarkdownView, TFile } from 'obsidian';
import { t } from '../i18n';
import type NextLevelGtdPlugin from '../main';

export class NoteFilePinToggle {
	private readonly actionByView = new WeakMap<MarkdownView, HTMLElement>();

	constructor(private readonly plugin: NextLevelGtdPlugin) {}

	renderForActiveView(): void {
		const view = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
		if (view?.file == null) return;
		this.render(view, view.file);
	}

	refreshForFile(file: TFile): void {
		const view = this.plugin.app.workspace.getActiveViewOfType(MarkdownView);
		if (view?.file?.path !== file.path) return;
		this.render(view, file);
	}

	private render(view: MarkdownView, file: TFile): void {
		const existingAction = this.actionByView.get(view);
		if (!this.plugin.fileParticipatesInFileView(file)) {
			existingAction?.remove();
			this.actionByView.delete(view);
			return;
		}

		const action =
			existingAction ??
			view.addAction('pin', this.actionLabel(file), () => {
				this.plugin
					.toggleFilePin(file)
					.then(() => this.refreshForFile(file))
					.catch(console.error);
			});
		this.actionByView.set(view, action);
		this.refreshAction(action, file);
	}

	private refreshAction(action: HTMLElement, file: TFile): void {
		const pinned = this.plugin.isFilePinned(file);
		const label = this.actionLabel(file);
		action.addClass('gtd-note-file-pin');
		action.setAttribute('aria-label', label);
		action.setAttribute('aria-pressed', String(pinned));
		action.setAttribute('title', label);
		if (pinned) {
			action.addClass('is-pinned');
		} else {
			action.removeClass('is-pinned');
		}
	}

	private actionLabel(file: TFile): string {
		return this.plugin.isFilePinned(file) ? t('unpinFile') : t('pinFile');
	}
}
