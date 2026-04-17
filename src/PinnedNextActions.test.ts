import { describe, expect, it } from 'vitest';
import { PinnedNextActions } from './PinnedNextActions';

describe('PinnedNextActions', () => {
	describe('ピン状態', () => {
		it('未ピンのアクションをピン留めする', () => {
			expect(new PinnedNextActions([]).toggled('note.md:line:1:indent:0').ids).toEqual([
				'note.md:line:1:indent:0',
			]);
		});

		it('ピン済みのアクションを解除する', () => {
			expect(
				new PinnedNextActions(['note.md:line:1:indent:0']).toggled(
					'note.md:line:1:indent:0',
				).ids,
			).toEqual([]);
		});

		it('現在の next action ではないピンを除去する', () => {
			expect(
				new PinnedNextActions([
					'note.md:line:1:indent:0',
					'note.md:line:2:indent:0',
				]).prunedTo(['note.md:line:2:indent:0']).ids,
			).toEqual(['note.md:line:2:indent:0']);
		});
	});
});
