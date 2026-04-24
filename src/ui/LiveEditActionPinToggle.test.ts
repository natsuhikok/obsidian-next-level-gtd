import { describe, expect, it, vi, type Mock } from 'vitest';
import {
	TFile,
	type App,
	type PluginManifest,
	editorInfoField,
	editorLivePreviewField,
} from 'obsidian';
import type { DecorationSet, EditorView } from '@codemirror/view';
import NextLevelGtdPlugin from '../main';
import { DEFAULT_SETTINGS } from '../settings';
import { NextActionPin } from '../NextActionPin';
import { LiveEditActionPinToggle } from './LiveEditActionPinToggle';

type PluginWithWorkspace = NextLevelGtdPlugin & {
	readonly app: {
		readonly workspace: {
			readonly getLeavesOfType: Mock;
		};
	};
};

function pluginWithSettings() {
	const manifest: PluginManifest = {
		id: 'obsidian-next-level-gtd',
		name: 'Next Level GTD',
		author: 'test',
		version: '1.0.0',
		minAppVersion: '1.0.0',
		description: 'test',
	};
	const plugin = new NextLevelGtdPlugin({} as App, manifest) as PluginWithWorkspace;
	plugin.settings = {
		excludedFolders: [],
		environmentContexts: [],
		contextOrder: [],
		evaluateStructuralNextActionBlocking: true,
		pinnedFileNames: [],
		pinnedActionPins: [],
		recentFilePaths: DEFAULT_SETTINGS.recentFilePaths,
		_placeholder: null,
	};
	return plugin;
}

function markdownFile(path: string, name: string) {
	const file = new TFile();
	file.path = path;
	file.name = name;
	file.basename = name.replace(/\.md$/, '');
	file.extension = 'md';
	return file;
}

function collectDecorations(decorations: DecorationSet) {
	const collected: number[] = [];
	decorations.between(0, 10_000, (from, _to, value) => {
		if (value != null) {
			collected.push(from);
		}
	});
	return collected;
}

function livePreviewView(file: TFile, content: string, livePreview = true): EditorView {
	return {
		state: {
			field: vi.fn((field: unknown) => {
				if (field === editorInfoField) return { file };
				if (field === editorLivePreviewField) return livePreview;
				return undefined;
			}),
			doc: {
				toString: () => content,
			},
		},
	} as unknown as EditorView;
}

function decorationsFor(
	toggle: LiveEditActionPinToggle,
	file: TFile,
	content: string,
	livePreview = true,
) {
	return toggle.decorationsForEditor(livePreviewView(file, content, livePreview));
}

describe('ライブ編集のアクションピン', () => {
	it('対象の未完了アクション行だけにインラインピンを置く', () => {
		const plugin = pluginWithSettings();
		const file = markdownFile('projects/action.md', 'action.md');
		const toggle = new LiveEditActionPinToggle(plugin);
		const pins = toggle.inlinePinsFor(
			file,
			'- [ ] 最初\n- [x] 完了\n- [ ] #temp 一時\n1. [ ] 次',
		);

		expect(pins).toEqual([
			{ position: 2, actionText: '最初', pinned: false },
			{ position: 36, actionText: '次', pinned: false },
		]);
	});

	it('保存済みのアクションピン状態をライブ編集の表示に反映する', () => {
		const plugin = pluginWithSettings();
		const file = markdownFile('projects/action.md', 'action.md');
		plugin.settings = {
			...plugin.settings,
			pinnedActionPins: [new NextActionPin('action.md', '次にやること')],
		};
		const toggle = new LiveEditActionPinToggle(plugin);
		const pins = toggle.inlinePinsFor(file, '- [ ] 次にやること');

		expect(pins).toEqual([{ position: 2, actionText: '次にやること', pinned: true }]);
	});

	it('ライブプレビュー以外と除外フォルダでは表示しない', () => {
		const plugin = pluginWithSettings();
		plugin.settings = {
			...plugin.settings,
			excludedFolders: [{ folder: 'archive', showAlertBanner: true }],
		};
		const file = markdownFile('archive/action.md', 'action.md');
		const toggle = new LiveEditActionPinToggle(plugin);
		const decorations = decorationsFor(toggle, file, '- [ ] 最初', false);

		expect(collectDecorations(decorations)).toEqual([]);
	});
});
