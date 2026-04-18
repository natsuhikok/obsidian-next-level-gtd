import { describe, expect, it } from 'vitest';
import { FilePin } from './FilePin';

describe('FilePin', () => {
	it('同じファイル名のファイルに一致する', () => {
		const pin = new FilePin('project.md');

		expect(pin.matches({ name: 'project.md' })).toBe(true);
	});

	it('パスが変わってもファイル名が同じなら一致する', () => {
		const pin = new FilePin('project.md');
		const movedFile = { name: 'project.md', path: 'archive/project.md' };

		expect(pin.matches(movedFile)).toBe(true);
	});

	it('ファイル名が異なるファイルには一致しない', () => {
		const pin = new FilePin('project.md');

		expect(pin.matches({ name: 'other.md' })).toBe(false);
	});
});
