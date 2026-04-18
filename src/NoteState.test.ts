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

		it('"Actionable" + 休眠の場合は invalid になる', () => {
			expect(NoteState.parse({ classification: 'Actionable', status: '休眠' }).kind).toBe(
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

describe('NoteState.computeAlerts', () => {
	describe('frontmatterInvalid', () => {
		it('frontmatter が null の場合は frontmatterInvalid を返す', () => {
			expect(NoteState.parse(null).computeAlerts(false, false)).toContain(
				'frontmatterInvalid',
			);
		});

		it('classification が未設定の場合は frontmatterInvalid を返す', () => {
			expect(NoteState.parse({}).computeAlerts(false, false)).toContain('frontmatterInvalid');
		});

		it('classification が不正値の場合は frontmatterInvalid を返す', () => {
			expect(
				NoteState.parse({ classification: 'Foo' }).computeAlerts(false, false),
			).toContain('frontmatterInvalid');
		});

		it('Actionable で status が未設定の場合は frontmatterInvalid を返す', () => {
			expect(
				NoteState.parse({ classification: 'Actionable' }).computeAlerts(false, false),
			).toContain('frontmatterInvalid');
		});

		it('Actionable で status が不正値の場合は frontmatterInvalid を返す', () => {
			expect(
				NoteState.parse({ classification: 'Actionable', status: 'done' }).computeAlerts(
					false,
					false,
				),
			).toContain('frontmatterInvalid');
		});

		it('Actionable で status が休眠の場合は frontmatterInvalid を返す', () => {
			expect(
				NoteState.parse({ classification: 'Actionable', status: '休眠' }).computeAlerts(
					false,
					false,
				),
			).toContain('frontmatterInvalid');
		});

		it('休眠に今日以降の scheduled next action があっても frontmatterInvalid を返す', () => {
			expect(
				NoteState.parse({ classification: 'Actionable', status: '休眠' }).computeAlerts(
					true,
					true,
				),
			).toEqual(['frontmatterInvalid']);
		});

		it('frontmatterInvalid の場合は他のアラートを返さない', () => {
			const result = NoteState.parse({ classification: 'Foo' }).computeAlerts(true, true);
			expect(result).toHaveLength(1);
			expect(result[0]).toBe('frontmatterInvalid');
		});
	});

	describe('referenceHasNextAction', () => {
		it('Reference に next action がある場合はアラートを返す', () => {
			expect(
				NoteState.parse({ classification: 'Reference' }).computeAlerts(true, false),
			).toContain('referenceHasNextAction');
		});

		it('Reference に next action がない場合はアラートを返さない', () => {
			expect(
				NoteState.parse({ classification: 'Reference' }).computeAlerts(false, false),
			).not.toContain('referenceHasNextAction');
		});
	});

	describe('actionableInProgressNoNextAction', () => {
		it('進行中 かつ next action が 0 件の場合はアラートを返す', () => {
			expect(
				NoteState.parse({ classification: 'Actionable', status: '進行中' }).computeAlerts(
					false,
					false,
				),
			).toContain('actionableInProgressNoNextAction');
		});

		it('進行中 かつ next action がある場合はアラートを返さない', () => {
			expect(
				NoteState.parse({ classification: 'Actionable', status: '進行中' }).computeAlerts(
					true,
					false,
				),
			).not.toContain('actionableInProgressNoNextAction');
		});

		it('保留 の場合はアラートを返さない', () => {
			expect(
				NoteState.parse({ classification: 'Actionable', status: '保留' }).computeAlerts(
					false,
					false,
				),
			).not.toContain('actionableInProgressNoNextAction');
		});
	});

	describe('actionableDoneHasNextAction', () => {
		it('完了 かつ next action がある場合はアラートを返す', () => {
			expect(
				NoteState.parse({ classification: 'Actionable', status: '完了' }).computeAlerts(
					true,
					false,
				),
			).toContain('actionableDoneHasNextAction');
		});

		it('廃止 かつ next action がある場合はアラートを返す', () => {
			expect(
				NoteState.parse({ classification: 'Actionable', status: '廃止' }).computeAlerts(
					true,
					false,
				),
			).toContain('actionableDoneHasNextAction');
		});

		it('完了 かつ next action がない場合はアラートを返さない', () => {
			expect(
				NoteState.parse({ classification: 'Actionable', status: '完了' }).computeAlerts(
					false,
					false,
				),
			).not.toContain('actionableDoneHasNextAction');
		});
	});

	describe('アラートなし', () => {
		it('正常な Reference はアラートを返さない', () => {
			expect(
				NoteState.parse({ classification: 'Reference' }).computeAlerts(false, false),
			).toHaveLength(0);
		});

		it('正常な Actionable 進行中はアラートを返さない', () => {
			expect(
				NoteState.parse({ classification: 'Actionable', status: '進行中' }).computeAlerts(
					true,
					false,
				),
			).toHaveLength(0);
		});

		it('正常な Actionable 保留はアラートを返さない', () => {
			expect(
				NoteState.parse({ classification: 'Actionable', status: '保留' }).computeAlerts(
					true,
					false,
				),
			).toHaveLength(0);
		});

		it('正常な Actionable 完了はアラートを返さない', () => {
			expect(
				NoteState.parse({ classification: 'Actionable', status: '完了' }).computeAlerts(
					false,
					false,
				),
			).toHaveLength(0);
		});
	});
});
