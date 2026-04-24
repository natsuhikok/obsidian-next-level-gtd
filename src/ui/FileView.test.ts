import { describe, expect, it, vi, type Mock } from 'vitest';
import { Keymap, TFile, WorkspaceLeaf } from 'obsidian';
import { FileView } from './FileView';
import { DEFAULT_SETTINGS } from '../settings';

type PluginForFileView = {
	readonly settings: typeof DEFAULT_SETTINGS;
	readonly fileParticipatesInFileView: Mock;
	readonly isFilePinned: Mock;
	readonly toggleFilePin: Mock;
};

function createPlugin(): PluginForFileView {
	return {
		settings: DEFAULT_SETTINGS,
		fileParticipatesInFileView: vi.fn(() => true),
		isFilePinned: vi.fn(() => false),
		toggleFilePin: vi.fn(() => Promise.resolve()),
	};
}

function createFile(path: string) {
	const file = new TFile();
	file.path = path;
	file.name = path.split('/').at(-1) ?? path;
	file.basename = file.name.replace(/\.md$/, '');
	file.extension = 'md';
	return file;
}

function invokeOpenNote(view: FileView, file: TFile, event: MouseEvent) {
	const openNote = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(view), 'openNote')
		?.value as
		| ((this: FileView, targetFile: TFile, clickEvent: MouseEvent) => void)
		| undefined;
	openNote?.call(view, file, event);
}

describe('ファイルビューのファイルオープン', () => {
	it('フィルター付きの一覧から開くとフィルターを解除してから対象ファイルを開く', () => {
		const plugin = createPlugin();
		const view = new FileView(new WorkspaceLeaf(), plugin as never);
		const openFile = vi.fn();
		const getLeaf = vi.fn(() => ({ openFile }));
		const render = vi
			.spyOn(view as unknown as { render: () => void }, 'render')
			.mockImplementation(() => {});
		const event = {} as MouseEvent;
		const file = createFile('projects/alpha.md');
		(view.app.workspace as unknown as { getLeaf: Mock }).getLeaf = getLeaf;
		(view as unknown as { filterText: string }).filterText = 'alpha';
		const isModEvent = vi.spyOn(Keymap, 'isModEvent').mockReturnValue(false);

		invokeOpenNote(view, file, event);

		expect((view as unknown as { filterText: string }).filterText).toBe('');
		expect(render).toHaveBeenCalledOnce();
		expect(getLeaf).toHaveBeenCalledWith(false);
		expect(isModEvent).toHaveBeenCalledWith(event);
		expect(openFile).toHaveBeenCalledWith(file);
	});

	it('修飾キーで別リーフに開く場合もフィルターを解除する', () => {
		const plugin = createPlugin();
		const view = new FileView(new WorkspaceLeaf(), plugin as never);
		const openFile = vi.fn();
		const getLeaf = vi.fn(() => ({ openFile }));
		const render = vi
			.spyOn(view as unknown as { render: () => void }, 'render')
			.mockImplementation(() => {});
		const file = createFile('projects/beta.md');
		(view.app.workspace as unknown as { getLeaf: Mock }).getLeaf = getLeaf;
		(view as unknown as { filterText: string }).filterText = 'beta';
		const isModEvent = vi.spyOn(Keymap, 'isModEvent').mockReturnValue(true);

		invokeOpenNote(view, file, {} as MouseEvent);

		expect((view as unknown as { filterText: string }).filterText).toBe('');
		expect(render).toHaveBeenCalledOnce();
		expect(getLeaf).toHaveBeenCalledWith(true);
		expect(isModEvent).toHaveBeenCalled();
		expect(openFile).toHaveBeenCalledWith(file);
	});
});
