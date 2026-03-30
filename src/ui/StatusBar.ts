import { App, MarkdownView, TFile } from 'obsidian';
import { detectNoteAlerts } from '../alert';
import { t } from '../i18n';
import { isInbox } from '../inbox';
import { hasNextAction } from '../nextAction';
import { AlertType, Status } from '../types';
import { StatusChangeModal } from './StatusChangeModal';
import { setStatus } from '../frontmatter';

const STATUS_BAR_ID = 'gtd-status-bar';

export class StatusBar {
	private readonly el: HTMLElement;

	constructor(
		private readonly app: App,
		statusBarItem: HTMLElement,
	) {
		this.el = statusBarItem;
		this.el.id = STATUS_BAR_ID;
		this.el.addClass('mod-clickable');
		this.el.addEventListener('click', () => this.onClick());
	}

	update(file: TFile | null) {
		if (file == null) {
			this.el.setText('');
			return;
		}
		const fm = this.app.metadataCache.getFileCache(file)?.frontmatter ?? null;
		const classification: unknown = fm?.['classification'];
		const status: unknown = fm?.['status'];

		if (isInbox(fm)) {
			this.el.setText(t('classificationInbox'));
			return;
		}

		const alerts = this.computeAlerts(file, fm);
		const hasAlert = alerts.length > 0;
		const alertSuffix = hasAlert ? ' ⚠' : '';

		if (classification === 'Actionable') {
			const statusLabel = typeof status === 'string' ? status : '';
			this.el.setText(`${t('classificationActionable')} | ${statusLabel}${alertSuffix}`);
		} else {
			this.el.setText(`${t('classificationReference')}${alertSuffix}`);
		}
	}

	private computeAlerts(file: TFile, fm: Record<string, unknown> | null): readonly AlertType[] {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		const content = view?.file?.path === file.path ? view.getViewData() : '';
		const noteHasNextAction = hasNextAction(content);
		return detectNoteAlerts(fm, noteHasNextAction);
	}

	private onClick() {
		const file = this.app.workspace.getActiveFile();
		if (file == null) return;
		const fm = this.app.metadataCache.getFileCache(file)?.frontmatter ?? null;
		if (fm?.['classification'] !== 'Actionable') return;

		new StatusChangeModal(this.app, (status: Status) => {
			void setStatus(this.app, file, status).then(() => this.update(file));
		}).open();
	}
}

const BANNER_ID = 'gtd-banner';

function getClassificationLabel(classification: unknown): string {
	if (classification === 'Reference') return t('classificationReference');
	if (classification === 'Actionable') return t('classificationActionable');
	return t('classificationInbox');
}

function getStatusLabel(status: unknown): string {
	if (typeof status === 'string' && status.length > 0) return status;
	return '';
}

export function updateBanner(app: App, file: TFile | null) {
	const view = app.workspace.getActiveViewOfType(MarkdownView);
	if (view == null) return;

	const existing = view.contentEl.querySelector(`#${BANNER_ID}`);
	if (existing) existing.remove();

	if (file == null || view.file?.path !== file.path) {
		const currentFile = view.file;
		if (currentFile == null) return;
		renderBanner(app, view, currentFile);
		return;
	}

	renderBanner(app, view, file);
}

export function renderBannerForActiveView(app: App) {
	const view = app.workspace.getActiveViewOfType(MarkdownView);
	if (view == null) return;
	const existing = view.contentEl.querySelector(`#${BANNER_ID}`);
	if (existing) existing.remove();
	const file = view.file;
	if (file == null) return;
	renderBanner(app, view, file);
}

function renderBanner(app: App, view: MarkdownView, file: TFile) {
	const fm = app.metadataCache.getFileCache(file)?.frontmatter ?? null;
	const classification: unknown = fm?.['classification'];
	const status: unknown = fm?.['status'];

	const content = view.getViewData();
	const noteHasNextAction = hasNextAction(content);
	const alerts = detectNoteAlerts(fm, noteHasNextAction);

	const banner = view.contentEl.createDiv({ cls: 'gtd-banner' });
	banner.id = BANNER_ID;

	const classLabel = getClassificationLabel(classification);
	const badge = banner.createEl('span', { text: classLabel, cls: 'gtd-badge' });
	badge.dataset['classification'] = typeof classification === 'string' ? classification : 'inbox';

	if (classification === 'Actionable') {
		const statusLabel = getStatusLabel(status);
		if (statusLabel) {
			banner.createEl('span', { text: statusLabel, cls: 'gtd-status-badge' });
		}
	}

	if (alerts.length > 0) {
		banner.createEl('span', { text: '⚠', cls: 'gtd-alert-badge', title: alerts.join(', ') });
	}

	view.contentEl.prepend(banner);
}
