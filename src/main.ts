import { Plugin, TFile } from 'obsidian';
import { DEFAULT_SETTINGS, NextLevelGtdSettings, NextLevelGtdSettingTab } from './settings';
import { t } from './i18n';
import { InboxView, VIEW_TYPE_INBOX } from './ui/InboxView';
import { NextActionsView, VIEW_TYPE_NEXT_ACTIONS } from './ui/NextActionsView';
import { BannerRenderer } from './ui/BannerRenderer';
import { StatusChangeModal } from './ui/StatusChangeModal';
import { NoteEditor } from './NoteEditor';
import { ExcludedFolder, Status } from './types';

export default class NextLevelGtdPlugin extends Plugin {
	settings: NextLevelGtdSettings;
	private bannerRenderer: BannerRenderer;
	private editorChangeTimer: ReturnType<typeof setTimeout> | null = null;

	async onload() {
		await this.loadSettings();
		this.bannerRenderer = new BannerRenderer(this.app, () => this.settings.excludedFolders);
		const settingTab = new NextLevelGtdSettingTab(this.app, this);

		this.addSettingTab(settingTab);

		this.registerView(VIEW_TYPE_INBOX, (leaf) => new InboxView(leaf, this));
		this.registerView(VIEW_TYPE_NEXT_ACTIONS, (leaf) => new NextActionsView(leaf, this));

		this.addRibbonIcon('inbox', t('openInboxRibbon'), () => {
			this.activateView(VIEW_TYPE_INBOX).catch(console.error);
		});

		this.addRibbonIcon('list-checks', t('openNextActionsRibbon'), () => {
			this.activateView(VIEW_TYPE_NEXT_ACTIONS).catch(console.error);
		});

		this.addCommand({
			id: 'open-inbox-view',
			name: t('openInboxViewCommand'),
			callback: () => {
				this.activateView(VIEW_TYPE_INBOX).catch(console.error);
			},
		});

		this.addCommand({
			id: 'open-next-actions-view',
			name: t('openNextActionsViewCommand'),
			callback: () => {
				this.activateView(VIEW_TYPE_NEXT_ACTIONS).catch(console.error);
			},
		});

		this.addCommand({
			id: 'change-status',
			name: t('changeStatusCommand'),
			callback: () => {
				const file = this.app.workspace.getActiveFile();
				if (file == null) return;
				new StatusChangeModal(this.app, (status: Status) => {
					void new NoteEditor(this.app).setState(file, status).then(() => {
						this.bannerRenderer.update(file);
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
			{ id: 'set-status-dormant', name: t('setStatusDormantCommand'), status: '休眠' },
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
					void new NoteEditor(this.app).setState(file, status).then(() => {
						this.bannerRenderer.update(file);
					});
				},
			});
		});

		this.addCommand({
			id: 'cancel-all-next-actions',
			name: t('cancelAllNextActionsCommand'),
			callback: () => {
				const file = this.app.workspace.getActiveFile();
				if (file == null) return;
				void new NoteEditor(this.app).cancelAllNextActions(file);
			},
		});

		this.registerEvent(
			this.app.workspace.on('file-menu', (menu, abstractFile) => {
				if (!(abstractFile instanceof TFile)) return;
				const file = abstractFile;
				menu.addItem((item) => {
					item.setTitle(t('cancelAllNextActionsCommand'))
						.setIcon('circle-slash')
						.onClick(() => {
							void new NoteEditor(this.app).cancelAllNextActions(file);
						});
				});
			}),
		);

		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () => {
				this.bannerRenderer.renderForActiveView();
			}),
		);

		this.registerEvent(
			this.app.workspace.on('layout-change', () => {
				this.bannerRenderer.renderForActiveView();
			}),
		);

		this.registerEvent(
			this.app.metadataCache.on('changed', (changedFile) => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile?.path === changedFile.path) {
					this.bannerRenderer.update(changedFile);
				}
				this.notifyInboxView(changedFile);
				this.notifyNextActionsView(changedFile);
			}),
		);

		this.registerEvent(
			this.app.workspace.on('editor-change', () => {
				if (this.editorChangeTimer != null) {
					clearTimeout(this.editorChangeTimer);
				}
				this.editorChangeTimer = setTimeout(() => {
					this.bannerRenderer.renderForActiveView();
					const activeFile = this.app.workspace.getActiveFile();
					if (activeFile != null) this.notifyNextActionsView(activeFile);
					this.editorChangeTimer = null;
				}, 300);
			}),
		);

		this.registerEvent(
			this.app.vault.on('modify', (abstractFile) => {
				if (abstractFile instanceof TFile) {
					this.notifyInboxView(abstractFile);
					this.notifyNextActionsView(abstractFile);
					this.bannerRenderer.updateAllViewsForFile(abstractFile).catch(console.error);
				}
			}),
		);

		this.registerEvent(
			this.app.vault.on('delete', (abstractFile) => {
				if (abstractFile instanceof TFile) {
					this.notifyInboxViewDelete(abstractFile.path);
					this.notifyNextActionsViewDelete(abstractFile.path);
				}
			}),
		);

		this.registerEvent(
			this.app.vault.on('rename', (abstractFile, oldPath) => {
				if (abstractFile instanceof TFile) {
					this.notifyInboxViewDelete(oldPath);
					this.notifyNextActionsViewDelete(oldPath);
					this.notifyInboxView(abstractFile);
					this.notifyNextActionsView(abstractFile);
				}
			}),
		);
	}

	onunload() {}

	async loadSettings() {
		const raw = (await this.loadData()) as Record<string, unknown> | null;
		const rawExcluded = raw?.['excludedFolders'];
		const excludedFolders: readonly ExcludedFolder[] = Array.isArray(rawExcluded)
			? rawExcluded.map((ef: unknown) => {
					if (typeof ef === 'string') return { folder: ef, showAlertBanner: true };
					const obj = ef as Record<string, unknown>;
					return {
						folder: obj['folder'] as string,
						showAlertBanner: obj['showAlertBanner'] !== false,
					};
				})
			: [];
		const rawEnvContexts = raw?.['environmentContexts'];
		const environmentContexts: readonly string[] = Array.isArray(rawEnvContexts)
			? rawEnvContexts.filter((v): v is string => typeof v === 'string')
			: [];
		const rawEvaluateStructuralNextActionBlocking =
			raw?.['evaluateStructuralNextActionBlocking'];
		const evaluateStructuralNextActionBlocking =
			typeof rawEvaluateStructuralNextActionBlocking === 'boolean'
				? rawEvaluateStructuralNextActionBlocking
				: DEFAULT_SETTINGS.evaluateStructuralNextActionBlocking;
		const rawPinnedNextActionIds = raw?.['pinnedNextActionIds'];
		const pinnedNextActionIds = Array.isArray(rawPinnedNextActionIds)
			? rawPinnedNextActionIds.filter((v): v is string => typeof v === 'string')
			: [];
		this.settings = {
			...DEFAULT_SETTINGS,
			...(raw as Partial<NextLevelGtdSettings> | null),
			evaluateStructuralNextActionBlocking,
			excludedFolders,
			environmentContexts,
			pinnedNextActionIds,
		};
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

	private notifyInboxView(file: TFile): void {
		for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_INBOX)) {
			const view = leaf.view;
			if (view instanceof InboxView) {
				view.onFileChange(file).catch(console.error);
			}
		}
	}

	private notifyNextActionsView(file: TFile): void {
		for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_NEXT_ACTIONS)) {
			const view = leaf.view;
			if (view instanceof NextActionsView) {
				view.onFileChange(file).catch(console.error);
			}
		}
	}

	private notifyInboxViewDelete(path: string): void {
		for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_INBOX)) {
			const view = leaf.view;
			if (view instanceof InboxView) {
				view.onFileDelete(path);
			}
		}
	}

	private notifyNextActionsViewDelete(path: string): void {
		for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_NEXT_ACTIONS)) {
			const view = leaf.view;
			if (view instanceof NextActionsView) {
				view.onFileDelete(path);
			}
		}
	}
}
