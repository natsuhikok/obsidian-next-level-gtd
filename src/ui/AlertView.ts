import { App, ItemView, TFile, WorkspaceLeaf } from 'obsidian';
import { detectNoteAlerts } from '../alert';
import { t } from '../i18n';
import { hasNextAction } from '../nextAction';
import { Alert, AlertType } from '../types';

export const VIEW_TYPE_ALERT = 'gtd-alerts';

export class AlertView extends ItemView {
	private alertCache: Record<string, readonly AlertType[]> = {};

	constructor(
		leaf: WorkspaceLeaf,
		private readonly pluginApp: App,
	) {
		super(leaf);
	}

	getViewType() {
		return VIEW_TYPE_ALERT;
	}

	getDisplayText() {
		return t('alertViewTitle');
	}

	getIcon() {
		return 'alert-triangle';
	}

	async onOpen() {
		await this.fullScan();
		this.render();
	}

	async onClose() {
		this.contentEl.empty();
	}

	async onFileChange(file: TFile) {
		const content = await this.pluginApp.vault.cachedRead(file);
		const fm = this.pluginApp.metadataCache.getFileCache(file)?.frontmatter ?? null;
		const noteHasNextAction = hasNextAction(content);
		const alerts = detectNoteAlerts(fm, noteHasNextAction);
		this.alertCache = { ...this.alertCache, [file.path]: alerts };
		this.render();
	}

	private async fullScan() {
		const files = this.pluginApp.vault.getMarkdownFiles();
		const results = await Promise.all(
			files.map(async (file) => {
				const content = await this.pluginApp.vault.cachedRead(file);
				const fm = this.pluginApp.metadataCache.getFileCache(file)?.frontmatter ?? null;
				const noteHasNextAction = hasNextAction(content);
				const alerts = detectNoteAlerts(fm, noteHasNextAction);
				return [file.path, alerts] as const;
			}),
		);
		this.alertCache = results.reduce<Record<string, readonly AlertType[]>>(
			(acc, [path, alerts]) => ({ ...acc, [path]: alerts }),
			{},
		);
	}

	private render() {
		const { contentEl } = this;
		contentEl.empty();

		const header = contentEl.createDiv({ cls: 'nav-header' });
		header.createEl('span', { text: t('alertViewTitle'), cls: 'nav-header-title' });
		const refreshBtn = header.createEl('button', { text: t('refresh') });
		refreshBtn.addEventListener('click', () => {
			void this.fullScan().then(() => this.render());
		});

		const alertEntries = Object.entries(this.alertCache).filter(
			([, types]) => types.length > 0,
		);

		if (alertEntries.length === 0) {
			contentEl.createEl('p', { text: t('noAlerts'), cls: 'gtd-empty' });
			return;
		}

		const alertTypeLabels: Record<AlertType, string> = {
			referenceHasNextAction: t('alertReferenceHasNextAction'),
			actionableInProgressNoNextAction: t('alertActionableInProgressNoNextAction'),
			actionableDoneHasNextAction: t('alertActionableDoneHasNextAction'),
			frontmatterInvalid: t('alertFrontmatterInvalid'),
		};

		const grouped = alertEntries.reduce<Record<AlertType, Alert[]>>(
			(acc, [filePath, types]) => {
				const file = this.pluginApp.vault.getAbstractFileByPath(filePath);
				if (!(file instanceof TFile)) return acc;
				const alert: Alert = {
					filePath,
					fileName: file.basename,
					types,
				};
				return types.reduce(
					(inner, type) => ({
						...inner,
						[type]: [...(inner[type] ?? []), alert],
					}),
					acc,
				);
			},
			{
				referenceHasNextAction: [],
				actionableInProgressNoNextAction: [],
				actionableDoneHasNextAction: [],
				frontmatterInvalid: [],
			},
		);

		const alertTypeOrder: readonly AlertType[] = [
			'frontmatterInvalid',
			'referenceHasNextAction',
			'actionableInProgressNoNextAction',
			'actionableDoneHasNextAction',
		];

		alertTypeOrder.forEach((type) => {
			const alerts = grouped[type];
			if (alerts.length === 0) return;

			const section = contentEl.createEl('section', { cls: 'gtd-alert-section' });
			section.createEl('h3', { text: alertTypeLabels[type], cls: 'gtd-alert-type' });
			const list = section.createEl('ul', { cls: 'gtd-alert-list' });
			alerts.forEach((alert) => {
				const item = list.createEl('li', { cls: 'gtd-alert-item' });
				item.createEl('button', {
					text: alert.fileName,
					cls: 'gtd-note-name',
				}).addEventListener('click', () => {
					void this.app.workspace.openLinkText(alert.filePath, '', false);
				});
			});
		});
	}
}
