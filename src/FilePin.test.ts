import { TFile } from 'obsidian';
import { describe, expect, it } from 'vitest';
import { FilePin } from './FilePin';

function file(path: string, name: string): TFile {
	return Object.assign(new TFile(), { path, name });
}

describe('ファイルピン', () => {
	it('同じファイル名のファイルをピン留め済みとして扱う', () => {
		const pin = new FilePin('project.md');

		expect(pin.matches(file('projects/project.md', 'project.md'))).toBe(true);
	});

	it('フォルダが違っても同じファイル名なら同じピンとして扱う', () => {
		const pin = new FilePin('project.md');

		expect(pin.matches(file('archive/project.md', 'project.md'))).toBe(true);
	});

	it('ファイル名が違うファイルはピン留め済みとして扱わない', () => {
		const pin = new FilePin('project.md');

		expect(pin.matches(file('projects/other.md', 'other.md'))).toBe(false);
	});

	it('空のファイル名では作成できない', () => {
		expect(() => new FilePin('')).toThrow('ファイル名が空です');
	});
});
