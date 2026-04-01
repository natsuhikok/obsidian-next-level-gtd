import { vi } from 'vitest';

export const moment = Object.assign(
	vi.fn(() => ({ format: vi.fn(() => '2026-04-01') })),
	{
		locale: vi.fn(() => 'en'),
	},
);

export class TFile {
	declare path: string;
}

export class App {
	readonly vault = {
		read: vi.fn((_file: TFile): Promise<string> => Promise.resolve('')),
		modify: vi.fn((_file: TFile, _content: string): Promise<void> => Promise.resolve()),
	};
}
