import NextLevelGtdPlugin from 'main';
import { ExcludedFolder } from 'types';

export class ExcludedFoldersManager {
	constructor(private readonly plugin: NextLevelGtdPlugin) {}

	getAll(): readonly ExcludedFolder[] {
		return this.plugin.settings.excludedFolders;
	}

	includes(path: string): boolean {
		return this.plugin.settings.excludedFolders.some((ef) => ef.path === path);
	}

	async add(path: string): Promise<void> {
		this.plugin.settings = {
			...this.plugin.settings,
			excludedFolders: [...this.plugin.settings.excludedFolders, { path, showAlert: true }],
		};
		await this.plugin.saveSettings();
	}

	async remove(path: string): Promise<void> {
		this.plugin.settings = {
			...this.plugin.settings,
			excludedFolders: this.plugin.settings.excludedFolders.filter((ef) => ef.path !== path),
		};
		await this.plugin.saveSettings();
	}

	async setShowAlert(path: string, showAlert: boolean): Promise<void> {
		this.plugin.settings = {
			...this.plugin.settings,
			excludedFolders: this.plugin.settings.excludedFolders.map((ef) =>
				ef.path === path ? { ...ef, showAlert } : ef,
			),
		};
		await this.plugin.saveSettings();
	}
}
