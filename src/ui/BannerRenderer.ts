import { App, MarkdownView, TFile, setIcon } from 'obsidian';
import { GTDNote } from '../GTDNote';
import { t } from '../i18n';
import { AlertType, ExcludedFolder } from '../types';
import { renderNoteStateToggle } from './NoteStateToggle';

const BANNER_ID = 'gtd-banner';

export class BannerRenderer {
	constructor(
		private readonly app: App,
		private readonly getExcludedFolders: () => readonly ExcludedFolder[],
	) {}

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

	private render(view: MarkdownView, file: TFile, content?: string) {
		const fm = this.app.metadataCache.getFileCache(file)?.frontmatter ?? null;
		const data = content ?? view.getViewData();
		const note = GTDNote.from(file, fm, data);

		const wrapper = view.containerEl.createDiv();
		wrapper.id = BANNER_ID;

		const banner = wrapper.createDiv({ cls: 'gtd-banner' });
		const onChanged = () => this.update(file);

		renderNoteStateToggle(banner, note.state, this.app, file, onChanged);

		const excludedFolder = this.getExcludedFolders().find((ef) =>
			file.path.startsWith(ef.folder + '/'),
		);
		const showAlertBanner = excludedFolder == null || excludedFolder.showAlertBanner;

		if (showAlertBanner && note.alerts.length > 0) {
			const alertTypeLabels: Record<AlertType, string> = {
				frontmatterInvalid: t('alertFrontmatterInvalid'),
				referenceHasNextAction: t('alertReferenceHasNextAction'),
				actionableInProgressNoNextAction: t('alertActionableInProgressNoNextAction'),
				actionableDoneHasNextAction: t('alertActionableDoneHasNextAction'),
				blockedScheduledNextActionHasInconsistentPrerequisiteSchedule: t(
					'alertBlockedScheduledNextActionHasInconsistentPrerequisiteSchedule',
				),
				dormantNoFutureScheduledNextAction: t('alertDormantNoFutureScheduledNextAction'),
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

	async updateAllViewsForFile(file: TFile): Promise<void> {
		const content = await this.app.vault.cachedRead(file);
		this.app.workspace.getLeavesOfType('markdown').forEach((leaf) => {
			const view = leaf.view;
			if (!(view instanceof MarkdownView)) return;
			if (view.file?.path !== file.path) return;
			view.containerEl.querySelector(`#${BANNER_ID}`)?.remove();
			this.render(view, file, content);
		});
	}
}
