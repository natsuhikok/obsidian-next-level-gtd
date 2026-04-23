import { vi } from 'vitest';

const createElement = () => {
	let attributes: Record<string, string> = {};
	let classes: readonly string[] = [];
	return {
		empty: vi.fn(),
		createDiv: vi.fn(() => createElement()),
		createEl: vi.fn(() => createElement()),
		addClass: vi.fn((className: string) => {
			classes = classes.includes(className) ? classes : [...classes, className];
		}),
		removeClass: vi.fn((className: string) => {
			classes = classes.filter((current) => current !== className);
		}),
		hasClass: vi.fn((className: string) => classes.includes(className)),
		remove: vi.fn(),
		setAttribute: vi.fn((name: string, value: string) => {
			attributes = { ...attributes, [name]: value };
		}),
		getAttribute: vi.fn((name: string) => attributes[name] ?? null),
		setText: vi.fn(),
		appendChild: vi.fn(),
	} as unknown as HTMLElement;
};

export const moment = Object.assign(
	vi.fn(() => ({ format: vi.fn(() => '2026-04-01') })),
	{
		locale: vi.fn(() => 'en'),
	},
);

export class TFile {
	declare path: string;
	declare name: string;
	declare basename: string;
	declare extension: string;
}

export class TFolder {
	declare path: string;
}

export class WorkspaceLeaf {
	view: unknown = null;
	readonly setViewState = vi.fn((_state: { readonly type: string; readonly active: boolean }) =>
		Promise.resolve(),
	);
}

export class MarkdownView {
	file: TFile | null = null;
	readonly editor = {
		getValue: vi.fn(() => ''),
	};
	readonly addAction = vi.fn(
		(_icon: string, _title: string, _callback: (evt: MouseEvent) => unknown) => createElement(),
	);
}

export class App {
	readonly vault = {
		read: vi.fn((_file: TFile): Promise<string> => Promise.resolve('')),
		modify: vi.fn((_file: TFile, _content: string): Promise<void> => Promise.resolve()),
		on: vi.fn((_name: string, _callback: (...args: readonly unknown[]) => void) => ({
			name: 'vault-event',
		})),
		getFiles: vi.fn((): readonly TFile[] => []),
		createFolder: vi.fn((_path: string): Promise<void> => Promise.resolve()),
		create: vi.fn(
			(_path: string, _content: string): Promise<TFile> => Promise.resolve(new TFile()),
		),
		getAbstractFileByPath: vi.fn((_path: string): TFile | TFolder | null => null),
	};

	readonly workspace = {
		on: vi.fn((_name: string, _callback: (...args: readonly unknown[]) => void) => ({
			name: 'workspace-event',
		})),
		getActiveFile: vi.fn((): TFile | null => null),
		getLeavesOfType: vi.fn((_viewType: string): readonly WorkspaceLeaf[] => []),
		revealLeaf: vi.fn((_leaf: WorkspaceLeaf): Promise<void> => Promise.resolve()),
		getLeftLeaf: vi.fn((_split: boolean): WorkspaceLeaf | null => new WorkspaceLeaf()),
		getActiveViewOfType: vi.fn((_viewType: typeof MarkdownView): MarkdownView | null => null),
	};

	readonly metadataCache = {
		on: vi.fn((_name: string, _callback: (...args: readonly unknown[]) => void) => ({
			name: 'metadata-event',
		})),
		getFileCache: vi.fn((_file: TFile) => null),
	};
}

export class Plugin {
	readonly app = new App();
	readonly addCommand = vi.fn((_command: { readonly id: string; readonly name: string }) => {});
	readonly addRibbonIcon = vi.fn(
		(_icon: string, _title: string, _callback: (event: MouseEvent) => void) => createElement(),
	);
	readonly registerView = vi.fn(
		(_viewType: string, _viewCreator: (leaf: WorkspaceLeaf) => unknown) => {},
	);
	readonly addSettingTab = vi.fn((_tab: PluginSettingTab) => {});
	readonly registerEvent = vi.fn((_eventRef: unknown) => {});
	readonly loadData = vi.fn((): Promise<Record<string, unknown> | null> => Promise.resolve(null));
	readonly saveData = vi.fn((_data: unknown): Promise<void> => Promise.resolve());
}

export class PluginSettingTab {
	readonly containerEl = createElement();

	constructor(
		readonly app: App,
		readonly plugin: Plugin,
	) {}
}

export class ItemView {
	readonly app: App;
	readonly contentEl = createElement();

	constructor(readonly leaf: WorkspaceLeaf) {
		this.app = new App();
	}

	registerEvent(_eventRef: unknown): void {}
}

export class Modal {
	constructor(readonly app: App) {}

	open(): void {}
	close(): void {}
}

export class SuggestModal<T> extends Modal {
	inputEl = createElement() as HTMLInputElement;

	getSuggestions(_query: string): readonly T[] {
		return [];
	}

	renderSuggestion(_value: T, _el: HTMLElement): void {}

	onChooseSuggestion(_value: T): void {}
}

export class AbstractInputSuggest<T> {
	constructor(
		readonly app: App,
		readonly inputEl: HTMLInputElement,
	) {}

	getSuggestions(_query: string): readonly T[] {
		return [];
	}

	renderSuggestion(_value: T, _el: HTMLElement): void {}

	selectSuggestion(_value: T): void {}
}

export class Notice {
	constructor(readonly message: string) {}
}

export class TextComponent {
	inputEl = createElement() as HTMLInputElement;

	setValue(_value: string): this {
		return this;
	}

	onChange(_callback: (value: string) => void): this {
		return this;
	}
}

export class Setting {
	constructor(readonly containerEl: HTMLElement) {}

	setName(_name: string): this {
		return this;
	}

	setDesc(_desc: string): this {
		return this;
	}

	addButton(
		callback: (button: {
			setButtonText(label: string): {
				onClick(onClick: () => void): unknown;
			};
		}) => unknown,
	): this {
		callback({
			setButtonText: (_label: string) => ({
				onClick: (_onClick: () => void) => undefined,
			}),
		});
		return this;
	}

	addToggle(
		callback: (toggle: {
			setValue(value: boolean): {
				onChange(onChange: (value: boolean) => void): unknown;
			};
		}) => unknown,
	): this {
		callback({
			setValue: (_value: boolean) => ({
				onChange: (_onChange: (value: boolean) => void) => undefined,
			}),
		});
		return this;
	}

	addText(callback: (text: TextComponent) => unknown): this {
		callback(new TextComponent());
		return this;
	}

	addExtraButton(
		callback: (button: {
			setIcon(icon: string): {
				setTooltip(tooltip: string): {
					onClick(onClick: () => void): unknown;
				};
			};
		}) => unknown,
	): this {
		callback({
			setIcon: (_icon: string) => ({
				setTooltip: (_tooltip: string) => ({
					onClick: (_onClick: () => void) => undefined,
				}),
			}),
		});
		return this;
	}
}

export const setIcon = vi.fn((_el: HTMLElement, _icon: string) => {});

export const Keymap = {
	isModEvent: vi.fn((_event: MouseEvent | KeyboardEvent) => false),
};
