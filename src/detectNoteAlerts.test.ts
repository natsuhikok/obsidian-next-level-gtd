import { describe, expect, it } from 'vitest';
import { NoteState } from './NoteState';

describe('NoteState.alerts', () => {
	describe('frontmatterInvalid', () => {
		it('frontmatter が null の場合は frontmatterInvalid を返す', () => {
			expect(NoteState.parse(null).alerts(false, false)).toContain('frontmatterInvalid');
		});

		it('classification が未設定の場合は frontmatterInvalid を返す', () => {
			expect(NoteState.parse({}).alerts(false, false)).toContain('frontmatterInvalid');
		});

		it('classification が不正値の場合は frontmatterInvalid を返す', () => {
			expect(NoteState.parse({ classification: 'Foo' }).alerts(false, false)).toContain(
				'frontmatterInvalid',
			);
		});

		it('Actionable で status が未設定の場合は frontmatterInvalid を返す', () => {
			expect(
				NoteState.parse({ classification: 'Actionable' }).alerts(false, false),
			).toContain('frontmatterInvalid');
		});

		it('Actionable で status が不正値の場合は frontmatterInvalid を返す', () => {
			expect(
				NoteState.parse({ classification: 'Actionable', status: 'done' }).alerts(
					false,
					false,
				),
			).toContain('frontmatterInvalid');
		});

		it('frontmatterInvalid の場合は他のアラートを返さない', () => {
			const result = NoteState.parse({ classification: 'Foo' }).alerts(true, true);
			expect(result).toHaveLength(1);
			expect(result[0]).toBe('frontmatterInvalid');
		});
	});

	describe('referenceHasNextAction', () => {
		it('Reference に next action がある場合はアラートを返す', () => {
			expect(NoteState.parse({ classification: 'Reference' }).alerts(true, false)).toContain(
				'referenceHasNextAction',
			);
		});

		it('Reference に next action がない場合はアラートを返さない', () => {
			expect(
				NoteState.parse({ classification: 'Reference' }).alerts(false, false),
			).not.toContain('referenceHasNextAction');
		});
	});

	describe('actionableInProgressNoNextAction', () => {
		it('進行中 かつ next action が 0 件の場合はアラートを返す', () => {
			expect(
				NoteState.parse({ classification: 'Actionable', status: '進行中' }).alerts(
					false,
					false,
				),
			).toContain('actionableInProgressNoNextAction');
		});

		it('進行中 かつ next action がある場合はアラートを返さない', () => {
			expect(
				NoteState.parse({ classification: 'Actionable', status: '進行中' }).alerts(
					true,
					false,
				),
			).not.toContain('actionableInProgressNoNextAction');
		});

		it('保留 の場合はアラートを返さない', () => {
			expect(
				NoteState.parse({ classification: 'Actionable', status: '保留' }).alerts(
					false,
					false,
				),
			).not.toContain('actionableInProgressNoNextAction');
		});
	});

	describe('actionableDoneHasNextAction', () => {
		it('完了 かつ next action がある場合はアラートを返す', () => {
			expect(
				NoteState.parse({ classification: 'Actionable', status: '完了' }).alerts(
					true,
					false,
				),
			).toContain('actionableDoneHasNextAction');
		});

		it('廃止 かつ next action がある場合はアラートを返す', () => {
			expect(
				NoteState.parse({ classification: 'Actionable', status: '廃止' }).alerts(
					true,
					false,
				),
			).toContain('actionableDoneHasNextAction');
		});

		it('完了 かつ next action がない場合はアラートを返さない', () => {
			expect(
				NoteState.parse({ classification: 'Actionable', status: '完了' }).alerts(
					false,
					false,
				),
			).not.toContain('actionableDoneHasNextAction');
		});
	});

	describe('dormantNoFutureScheduledNextAction', () => {
		it('休眠 かつ今日以降の scheduled next action がない場合はアラートを返す', () => {
			expect(
				NoteState.parse({ classification: 'Actionable', status: '休眠' }).alerts(
					false,
					false,
				),
			).toContain('dormantNoFutureScheduledNextAction');
		});

		it('休眠 かつ今日以降の scheduled next action がある場合はアラートを返さない', () => {
			expect(
				NoteState.parse({ classification: 'Actionable', status: '休眠' }).alerts(
					true,
					true,
				),
			).not.toContain('dormantNoFutureScheduledNextAction');
		});

		it('休眠 は actionableInProgressNoNextAction を返さない', () => {
			expect(
				NoteState.parse({ classification: 'Actionable', status: '休眠' }).alerts(
					false,
					false,
				),
			).not.toContain('actionableInProgressNoNextAction');
		});

		it('休眠 は actionableDoneHasNextAction を返さない', () => {
			expect(
				NoteState.parse({ classification: 'Actionable', status: '休眠' }).alerts(
					true,
					false,
				),
			).not.toContain('actionableDoneHasNextAction');
		});
	});

	describe('アラートなし', () => {
		it('正常な Reference はアラートを返さない', () => {
			expect(
				NoteState.parse({ classification: 'Reference' }).alerts(false, false),
			).toHaveLength(0);
		});

		it('正常な Actionable 進行中はアラートを返さない', () => {
			expect(
				NoteState.parse({ classification: 'Actionable', status: '進行中' }).alerts(
					true,
					false,
				),
			).toHaveLength(0);
		});

		it('正常な Actionable 保留はアラートを返さない', () => {
			expect(
				NoteState.parse({ classification: 'Actionable', status: '保留' }).alerts(
					true,
					false,
				),
			).toHaveLength(0);
		});

		it('正常な Actionable 休眠（今日以降の scheduled あり）はアラートを返さない', () => {
			expect(
				NoteState.parse({ classification: 'Actionable', status: '休眠' }).alerts(
					true,
					true,
				),
			).toHaveLength(0);
		});

		it('正常な Actionable 完了はアラートを返さない', () => {
			expect(
				NoteState.parse({ classification: 'Actionable', status: '完了' }).alerts(
					false,
					false,
				),
			).toHaveLength(0);
		});
	});
});
