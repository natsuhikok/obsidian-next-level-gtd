import { describe, expect, it } from 'vitest';
import { NoteState } from './NoteState';

describe('NoteState.parse', () => {
	describe('inbox', () => {
		it('frontmatter が null の場合は inbox になる', () => {
			expect(NoteState.parse(null).kind).toBe('inbox');
		});

		it('frontmatter が undefined の場合は inbox になる', () => {
			expect(NoteState.parse(undefined).kind).toBe('inbox');
		});

		it('classification が設定されていない場合は inbox になる', () => {
			expect(NoteState.parse({}).kind).toBe('inbox');
		});

		it('classification が不正値の場合は inbox になる', () => {
			expect(NoteState.parse({ classification: 'Foo' }).kind).toBe('inbox');
		});
	});

	describe('reference', () => {
		it('"Reference" の場合は reference になる', () => {
			expect(NoteState.parse({ classification: 'Reference' }).kind).toBe('reference');
		});
	});

	describe('actionable', () => {
		it('"Actionable" + 有効 status の場合は actionable になる', () => {
			const state = NoteState.parse({ classification: 'Actionable', status: '進行中' });
			expect(state.kind).toBe('actionable');
			expect(state.status).toBe('進行中');
		});
	});

	describe('invalid', () => {
		it('"Actionable" + status 未設定の場合は invalid になる', () => {
			expect(NoteState.parse({ classification: 'Actionable' }).kind).toBe('invalid');
		});

		it('"Actionable" + status 不正値の場合は invalid になる', () => {
			expect(NoteState.parse({ classification: 'Actionable', status: 'done' }).kind).toBe(
				'invalid',
			);
		});
	});

	describe('isInbox', () => {
		it('inbox のみ isInbox が true になる', () => {
			expect(NoteState.parse(null).isInbox).toBe(true);
		});

		it('invalid は isInbox でない', () => {
			expect(NoteState.parse({ classification: 'Actionable' }).isInbox).toBe(false);
		});

		it('reference は isInbox でない', () => {
			expect(NoteState.parse({ classification: 'Reference' }).isInbox).toBe(false);
		});
	});
});
