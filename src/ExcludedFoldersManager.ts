import NextLevelGtdPlugin from 'main';
import { ExcludedFolder } from 'types';

export class ExcludedFoldersManager {
	constructor(private readonly plugin: NextLevelGtdPlugin) {}

	getAll(): readonly ExcludedFolder[] {
		return this.plugin.settings.excludedFolders;
	}

	includes(folder: string): boolean {
		return this.plugin.settings.excludedFolders.some((ef) => ef.folder === folder);
	}

	async add(folder: string): Promise<void> {
		this.plugin.settings = {
			...this.plugin.settings,
			excludedFolders: [
				...this.plugin.settings.excludedFolders,
				{ folder, showAlertBanner: true },
			],
		};
		await this.plugin.saveSettings();
	}

	async remove(folder: string): Promise<void> {
		this.plugin.settings = {
			...this.plugin.settings,
			excludedFolders: this.plugin.settings.excludedFolders.filter(
				(ef) => ef.folder !== folder,
			),
		};
		await this.plugin.saveSettings();
	}

	async setShowAlertBanner(folder: string, show: boolean): Promise<void> {
		this.plugin.settings = {
			...this.plugin.settings,
			excludedFolders: this.plugin.settings.excludedFolders.map((ef) =>
				ef.folder === folder ? { ...ef, showAlertBanner: show } : ef,
			),
		};
		await this.plugin.saveSettings();
	}
}
