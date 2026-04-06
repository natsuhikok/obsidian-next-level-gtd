import { describe, expect, it } from 'vitest';
import { detectNoteAlerts } from './detectNoteAlerts';
import { NoteState } from './NoteState';

describe('detectNoteAlerts', () => {
	describe('frontmatterInvalid', () => {
		it('frontmatter が null の場合は frontmatterInvalid を返す', () => {
			expect(detectNoteAlerts(NoteState.parse(null), false, false)).toContain(
				'frontmatterInvalid',
			);
		});

		it('classification が未設定の場合は frontmatterInvalid を返す', () => {
			expect(detectNoteAlerts(NoteState.parse({}), false, false)).toContain(
				'frontmatterInvalid',
			);
		});

		it('classification が不正値の場合は frontmatterInvalid を返す', () => {
			expect(
				detectNoteAlerts(NoteState.parse({ classification: 'Foo' }), false, false),
			).toContain('frontmatterInvalid');
		});

		it('Actionable で status が未設定の場合は frontmatterInvalid を返す', () => {
			expect(
				detectNoteAlerts(NoteState.parse({ classification: 'Actionable' }), false, false),
			).toContain('frontmatterInvalid');
		});

		it('Actionable で status が不正値の場合は frontmatterInvalid を返す', () => {
			expect(
				detectNoteAlerts(
					NoteState.parse({ classification: 'Actionable', status: 'done' }),
					false,
					false,
				),
			).toContain('frontmatterInvalid');
		});

		it('frontmatterInvalid の場合は他のアラートを返さない', () => {
			const result = detectNoteAlerts(NoteState.parse({ classification: 'Foo' }), true, true);
			expect(result).toHaveLength(1);
			expect(result[0]).toBe('frontmatterInvalid');
		});
	});

	describe('referenceHasNextAction', () => {
		it('Reference に next action がある場合はアラートを返す', () => {
			expect(
				detectNoteAlerts(NoteState.parse({ classification: 'Reference' }), true, false),
			).toContain('referenceHasNextAction');
		});

		it('Reference に next action がない場合はアラートを返さない', () => {
			expect(
				detectNoteAlerts(NoteState.parse({ classification: 'Reference' }), false, false),
			).not.toContain('referenceHasNextAction');
		});
	});

	describe('actionableInProgressNoNextAction', () => {
		it('進行中 かつ next action が 0 件の場合はアラートを返す', () => {
			expect(
				detectNoteAlerts(
					NoteState.parse({ classification: 'Actionable', status: '進行中' }),
					false,
					false,
				),
			).toContain('actionableInProgressNoNextAction');
		});

		it('進行中 かつ next action がある場合はアラートを返さない', () => {
			expect(
				detectNoteAlerts(
					NoteState.parse({ classification: 'Actionable', status: '進行中' }),
					true,
					false,
				),
			).not.toContain('actionableInProgressNoNextAction');
		});

		it('保留 の場合はアラートを返さない', () => {
			expect(
				detectNoteAlerts(
					NoteState.parse({ classification: 'Actionable', status: '保留' }),
					false,
					false,
				),
			).not.toContain('actionableInProgressNoNextAction');
		});
	});

	describe('actionableDoneHasNextAction', () => {
		it('完了 かつ next action がある場合はアラートを返す', () => {
			expect(
				detectNoteAlerts(
					NoteState.parse({ classification: 'Actionable', status: '完了' }),
					true,
					false,
				),
			).toContain('actionableDoneHasNextAction');
		});

		it('廃止 かつ next action がある場合はアラートを返す', () => {
			expect(
				detectNoteAlerts(
					NoteState.parse({ classification: 'Actionable', status: '廃止' }),
					true,
					false,
				),
			).toContain('actionableDoneHasNextAction');
		});

		it('完了 かつ next action がない場合はアラートを返さない', () => {
			expect(
				detectNoteAlerts(
					NoteState.parse({ classification: 'Actionable', status: '完了' }),
					false,
					false,
				),
			).not.toContain('actionableDoneHasNextAction');
		});
	});

	describe('dormantNoFutureScheduledNextAction', () => {
		it('休眠 かつ未来の scheduled next action がない場合はアラートを返す', () => {
			expect(
				detectNoteAlerts(
					NoteState.parse({ classification: 'Actionable', status: '休眠' }),
					false,
					false,
				),
			).toContain('dormantNoFutureScheduledNextAction');
		});

		it('休眠 かつ未来の scheduled next action がある場合はアラートを返さない', () => {
			expect(
				detectNoteAlerts(
					NoteState.parse({ classification: 'Actionable', status: '休眠' }),
					true,
					true,
				),
			).not.toContain('dormantNoFutureScheduledNextAction');
		});

		it('休眠 は actionableInProgressNoNextAction を返さない', () => {
			expect(
				detectNoteAlerts(
					NoteState.parse({ classification: 'Actionable', status: '休眠' }),
					false,
					false,
				),
			).not.toContain('actionableInProgressNoNextAction');
		});

		it('休眠 は actionableDoneHasNextAction を返さない', () => {
			expect(
				detectNoteAlerts(
					NoteState.parse({ classification: 'Actionable', status: '休眠' }),
					true,
					false,
				),
			).not.toContain('actionableDoneHasNextAction');
		});
	});

	describe('アラートなし', () => {
		it('正常な Reference はアラートを返さない', () => {
			expect(
				detectNoteAlerts(NoteState.parse({ classification: 'Reference' }), false, false),
			).toHaveLength(0);
		});

		it('正常な Actionable 進行中はアラートを返さない', () => {
			expect(
				detectNoteAlerts(
					NoteState.parse({ classification: 'Actionable', status: '進行中' }),
					true,
					false,
				),
			).toHaveLength(0);
		});

		it('正常な Actionable 保留はアラートを返さない', () => {
			expect(
				detectNoteAlerts(
					NoteState.parse({ classification: 'Actionable', status: '保留' }),
					true,
					false,
				),
			).toHaveLength(0);
		});

		it('正常な Actionable 休眠（未来の scheduled あり）はアラートを返さない', () => {
			expect(
				detectNoteAlerts(
					NoteState.parse({ classification: 'Actionable', status: '休眠' }),
					true,
					true,
				),
			).toHaveLength(0);
		});

		it('正常な Actionable 完了はアラートを返さない', () => {
			expect(
				detectNoteAlerts(
					NoteState.parse({ classification: 'Actionable', status: '完了' }),
					false,
					false,
				),
			).toHaveLength(0);
		});
	});
});
