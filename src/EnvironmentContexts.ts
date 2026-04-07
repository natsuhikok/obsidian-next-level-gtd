import NextLevelGtdPlugin from 'main';

export class EnvironmentContexts {
	constructor(private readonly plugin: NextLevelGtdPlugin) {}

	getAll(): readonly string[] {
		return this.plugin.settings.environmentContexts;
	}

	includes(tag: string): boolean {
		return this.plugin.settings.environmentContexts.includes(tag.toLowerCase());
	}

	async add(tag: string): Promise<void> {
		const normalized = tag.toLowerCase();
		this.plugin.settings = {
			...this.plugin.settings,
			environmentContexts: [...this.plugin.settings.environmentContexts, normalized],
		};
		await this.plugin.saveSettings();
	}

	async remove(tag: string): Promise<void> {
		this.plugin.settings = {
			...this.plugin.settings,
			environmentContexts: this.plugin.settings.environmentContexts.filter((t) => t !== tag),
		};
		await this.plugin.saveSettings();
	}
}
