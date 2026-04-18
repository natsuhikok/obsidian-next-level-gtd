import NextLevelGtdPlugin from './main';

export class ContextOrderSetting {
	constructor(private readonly plugin: NextLevelGtdPlugin) {}

	getAll(): readonly string[] {
		return this.plugin.settings.contextOrder;
	}

	includes(tag: string): boolean {
		return this.plugin.settings.contextOrder.includes(tag.toLowerCase());
	}

	async add(tag: string): Promise<void> {
		const normalized = tag.toLowerCase();
		this.plugin.settings = {
			...this.plugin.settings,
			contextOrder: [...this.plugin.settings.contextOrder, normalized],
		};
		await this.plugin.saveSettings();
	}

	async moveUp(tag: string): Promise<void> {
		const index = this.plugin.settings.contextOrder.indexOf(tag);
		if (index <= 0) return;
		await this.replace([
			...this.plugin.settings.contextOrder.slice(0, index - 1),
			this.plugin.settings.contextOrder[index]!,
			this.plugin.settings.contextOrder[index - 1]!,
			...this.plugin.settings.contextOrder.slice(index + 1),
		]);
	}

	async moveDown(tag: string): Promise<void> {
		const index = this.plugin.settings.contextOrder.indexOf(tag);
		if (index < 0 || index >= this.plugin.settings.contextOrder.length - 1) return;
		await this.replace([
			...this.plugin.settings.contextOrder.slice(0, index),
			this.plugin.settings.contextOrder[index + 1]!,
			this.plugin.settings.contextOrder[index]!,
			...this.plugin.settings.contextOrder.slice(index + 2),
		]);
	}

	async remove(tag: string): Promise<void> {
		await this.replace(this.plugin.settings.contextOrder.filter((context) => context !== tag));
	}

	private async replace(contextOrder: readonly string[]): Promise<void> {
		this.plugin.settings = {
			...this.plugin.settings,
			contextOrder,
		};
		await this.plugin.saveSettings();
	}
}
