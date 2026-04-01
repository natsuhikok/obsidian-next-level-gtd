import NextLevelGtdPlugin from 'main';

export class ExcludedFoldersManager {
	constructor(private readonly plugin: NextLevelGtdPlugin) {}

	getAll(): readonly string[] {
		return this.plugin.settings.excludedFolders;
	}

	includes(folder: string): boolean {
		return this.plugin.settings.excludedFolders.includes(folder);
	}

	async add(folder: string): Promise<void> {
		this.plugin.settings = {
			...this.plugin.settings,
			excludedFolders: [...this.plugin.settings.excludedFolders, folder],
		};
		await this.plugin.saveSettings();
	}

	async remove(folder: string): Promise<void> {
		this.plugin.settings = {
			...this.plugin.settings,
			excludedFolders: this.plugin.settings.excludedFolders.filter((f) => f !== folder),
		};
		await this.plugin.saveSettings();
	}
}
