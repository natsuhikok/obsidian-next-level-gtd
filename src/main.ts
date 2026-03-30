import { Plugin, TFile } from 'obsidian';
import { DEFAULT_SETTINGS, NextLevelGtdSettings, NextLevelGtdSettingTab } from './settings';
import { t } from './i18n';
import { AlertView, VIEW_TYPE_ALERT } from './ui/AlertView';
import { InboxView, VIEW_TYPE_INBOX } from './ui/InboxView';
import { StatusBar, renderBannerForActiveView, updateBanner } from './ui/StatusBar';
import { StatusChangeModal } from './ui/StatusChangeModal';
import { setStatus } from './frontmatter';
import { Status } from './types';

export default class NextLevelGtdPlugin extends Plugin {
	settings: NextLevelGtdSettings;
	private statusBar: StatusBar;

	async onload() {
		await this.loadSettings();
		const settingTab = new NextLevelGtdSettingTab(this.app, this);

		this.addSettingTab(settingTab);

		this.registerView(VIEW_TYPE_INBOX, (leaf) => new InboxView(leaf, this.app));
		this.registerView(VIEW_TYPE_ALERT, (leaf) => new AlertView(leaf, this.app));

		const statusBarItem = this.addStatusBarItem();
		this.statusBar = new StatusBar(this.app, statusBarItem);

		this.addCommand({
			id: 'open-inbox-view',
			name: t('openInboxViewCommand'),
			callback: () => {
				this.activateView(VIEW_TYPE_INBOX).catch(console.error);
			},
		});

		this.addCommand({
			id: 'open-alert-view',
			name: t('openAlertViewCommand'),
			callback: () => {
				this.activateView(VIEW_TYPE_ALERT).catch(console.error);
			},
		});

		this.addCommand({
			id: 'change-status',
			name: t('changeStatusCommand'),
			callback: () => {
				const file = this.app.workspace.getActiveFile();
				if (file == null) return;
				new StatusChangeModal(this.app, (status: Status) => {
					void setStatus(this.app, file, status).then(() => {
						this.statusBar.update(file);
						updateBanner(this.app, file);
					});
				}).open();
			},
		});

		const statusCommands: { id: string; name: string; status: Status }[] = [
			{
				id: 'set-status-in-progress',
				name: t('setStatusInProgressCommand'),
				status: '進行中',
			},
			{ id: 'set-status-on-hold', name: t('setStatusOnHoldCommand'), status: '保留' },
			{ id: 'set-status-completed', name: t('setStatusCompletedCommand'), status: '完了' },
			{ id: 'set-status-abandoned', name: t('setStatusAbandonedCommand'), status: '廃止' },
		];

		statusCommands.forEach(({ id, name, status }) => {
			this.addCommand({
				id,
				name,
				callback: () => {
					const file = this.app.workspace.getActiveFile();
					if (file == null) return;
					void setStatus(this.app, file, status).then(() => {
						this.statusBar.update(file);
						updateBanner(this.app, file);
					});
				},
			});
		});

		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () => {
				const file = this.app.workspace.getActiveFile();
				this.statusBar.update(file);
				renderBannerForActiveView(this.app);
			}),
		);

		this.registerEvent(
			this.app.metadataCache.on('changed', (changedFile) => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile?.path === changedFile.path) {
					this.statusBar.update(changedFile);
					updateBanner(this.app, changedFile);
				}
				this.notifyAlertView(changedFile);
			}),
		);

		this.registerEvent(
			this.app.vault.on('modify', (abstractFile) => {
				if (abstractFile instanceof TFile) {
					this.notifyAlertView(abstractFile);
				}
			}),
		);
	}

	onunload() {}

	async loadSettings() {
		const data = (await this.loadData()) as Partial<NextLevelGtdSettings> | null;
		this.settings = { ...DEFAULT_SETTINGS, ...data };
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private async activateView(viewType: string): Promise<void> {
		const { workspace } = this.app;
		const existing = workspace.getLeavesOfType(viewType);
		if (existing.length > 0 && existing[0] != null) {
			await workspace.revealLeaf(existing[0]);
			return;
		}
		const leaf = workspace.getLeftLeaf(false);
		if (leaf == null) return;
		await leaf.setViewState({ type: viewType, active: true });
		await workspace.revealLeaf(leaf);
	}

	private notifyAlertView(file: TFile): void {
		for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_ALERT)) {
			const view = leaf.view;
			if (view instanceof AlertView) {
				view.onFileChange(file).catch(console.error);
			}
		}
	}
}
