import type NextLevelGtdPlugin from './main';

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

	async moveEarlier(tag: string): Promise<void> {
		const index = this.plugin.settings.environmentContexts.indexOf(tag);
		if (index <= 0) return;
		await this.reorder(tag, index - 1);
	}

	async moveLater(tag: string): Promise<void> {
		const index = this.plugin.settings.environmentContexts.indexOf(tag);
		if (index === -1 || index >= this.plugin.settings.environmentContexts.length - 1) return;
		await this.reorder(tag, index + 1);
	}

	private async reorder(tag: string, targetIndex: number): Promise<void> {
		const withoutTarget = this.plugin.settings.environmentContexts.filter((t) => t !== tag);
		this.plugin.settings = {
			...this.plugin.settings,
			environmentContexts: [
				...withoutTarget.slice(0, targetIndex),
				tag,
				...withoutTarget.slice(targetIndex),
			],
		};
		await this.plugin.saveSettings();
	}
}
