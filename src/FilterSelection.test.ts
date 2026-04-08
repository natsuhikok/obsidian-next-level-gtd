import { describe, expect, it } from 'vitest';
import { FilterSelection } from './FilterSelection';

describe('FilterSelection', () => {
	describe('初期状態', () => {
		it('環境コンテキストなしのみが選択された状態で初期化される', () => {
			const s = FilterSelection.initial(['home', 'office']);
			expect(s.noContextSelected).toBe(true);
			expect(s.selectedEnvironments).toEqual([]);
			expect(s.isAllEnvironmentsSelected).toBe(false);
		});

		it('性質コンテキストなしのみが選択された状態で初期化される', () => {
			const s = FilterSelection.initial(['home']);
			expect(s.noPropertySelected).toBe(true);
			expect(s.selectedProperties).toEqual([]);
		});

		it('日付モードは actionable', () => {
			const s = FilterSelection.initial(['home']);
			expect(s.dateMode).toBe('actionable');
		});

		it('環境コンテキスト名の大文字小文字を区別しない', () => {
			const s = FilterSelection.initial(['Home', 'OFFICE']);
			expect(s.environmentContexts).toEqual(['home', 'office']);
		});
	});

	describe('すべての環境の選択判定', () => {
		it('全環境と環境コンテキストなしが選択されていればすべての環境が選択された状態', () => {
			const s = new FilterSelection(['home'], ['home'], true, [], false, 'actionable');
			expect(s.isAllEnvironmentsSelected).toBe(true);
		});

		it('全環境が選択されていても環境コンテキストなしが未選択ならすべての環境が選択された状態ではない', () => {
			const s = new FilterSelection(['home'], ['home'], false, [], false, 'actionable');
			expect(s.isAllEnvironmentsSelected).toBe(false);
		});

		it('一部の環境が未選択なら false', () => {
			const s = new FilterSelection(
				['home', 'office'],
				['home'],
				true,
				[],
				false,
				'actionable',
			);
			expect(s.isAllEnvironmentsSelected).toBe(false);
		});

		it('環境設定が空でも環境コンテキストなしが選択されていればすべての環境が選択された状態', () => {
			const s = new FilterSelection([], [], true, [], false, 'actionable');
			expect(s.isAllEnvironmentsSelected).toBe(true);
		});

		it('環境設定が空でも環境コンテキストなしが未選択ならすべての環境が選択された状態ではない', () => {
			const s = new FilterSelection([], [], false, [], false, 'actionable');
			expect(s.isAllEnvironmentsSelected).toBe(false);
		});
	});

	describe('環境の選択切り替え', () => {
		it('未選択環境を選択状態にする', () => {
			const s = new FilterSelection(
				['home', 'office'],
				['home'],
				true,
				[],
				false,
				'actionable',
			);
			expect(s.withEnvironmentToggled('office').selectedEnvironments).toContain('office');
		});

		it('選択済み環境を解除する', () => {
			const s = new FilterSelection(['home'], ['home'], true, [], false, 'actionable');
			expect(s.withEnvironmentToggled('home').selectedEnvironments).not.toContain('home');
		});

		it('環境コンテキストなしの選択状態は変わらない', () => {
			const s = new FilterSelection(['home'], ['home'], true, [], false, 'actionable');
			expect(s.withEnvironmentToggled('home').noContextSelected).toBe(true);
		});
	});

	describe('すべての環境の選択切り替え', () => {
		it('全環境未選択時: すべての環境と環境コンテキストなしを選択する', () => {
			const s = new FilterSelection(['home', 'office'], [], false, [], false, 'actionable');
			const updated = s.withAllEnvironmentsToggled();
			expect(updated.isAllEnvironmentsSelected).toBe(true);
			expect(updated.noContextSelected).toBe(true);
		});

		it('全環境選択時: すべての環境と環境コンテキストなしを解除する', () => {
			const s = new FilterSelection(
				['home', 'office'],
				['home', 'office'],
				true,
				[],
				false,
				'actionable',
			);
			const updated = s.withAllEnvironmentsToggled();
			expect(updated.selectedEnvironments).toEqual([]);
			expect(updated.noContextSelected).toBe(false);
		});

		it('一部選択時: すべての環境と環境コンテキストなしを選択する', () => {
			const s = new FilterSelection(
				['home', 'office'],
				['home'],
				false,
				[],
				false,
				'actionable',
			);
			const updated = s.withAllEnvironmentsToggled();
			expect(updated.isAllEnvironmentsSelected).toBe(true);
			expect(updated.noContextSelected).toBe(true);
		});
	});

	describe('環境コンテキストなしの選択切り替え', () => {
		it('未選択から選択に切り替わる', () => {
			const s = new FilterSelection(['home'], ['home'], false, [], false, 'actionable');
			expect(s.withNoContextToggled().noContextSelected).toBe(true);
		});

		it('選択から未選択に切り替わる', () => {
			const s = new FilterSelection(['home'], ['home'], true, [], false, 'actionable');
			expect(s.withNoContextToggled().noContextSelected).toBe(false);
		});

		it('環境の選択状態は変わらない', () => {
			const s = new FilterSelection(['home'], ['home'], false, [], false, 'actionable');
			expect(s.withNoContextToggled().selectedEnvironments).toEqual(['home']);
		});
	});

	describe('性質の選択切り替え', () => {
		it('未選択性質を選択状態にする', () => {
			const s = FilterSelection.initial(['home']);
			expect(s.withPropertyToggled('quick').selectedProperties).toContain('quick');
		});

		it('選択済み性質を解除する', () => {
			const s = new FilterSelection(['home'], ['home'], true, ['quick'], false, 'actionable');
			expect(s.withPropertyToggled('quick').selectedProperties).not.toContain('quick');
		});
	});

	describe('性質コンテキストなしの選択切り替え', () => {
		it('未選択から選択に切り替わる', () => {
			const s = new FilterSelection(['home'], ['home'], true, [], false, 'actionable');
			expect(s.withNoPropertyToggled().noPropertySelected).toBe(true);
		});

		it('選択から未選択に切り替わる', () => {
			const s = new FilterSelection(['home'], ['home'], true, [], true, 'actionable');
			expect(s.withNoPropertyToggled().noPropertySelected).toBe(false);
		});

		it('性質の選択状態は変わらない', () => {
			const s = new FilterSelection(['home'], ['home'], true, ['quick'], false, 'actionable');
			expect(s.withNoPropertyToggled().selectedProperties).toEqual(['quick']);
		});
	});

	describe('日付モードの切り替え', () => {
		it('日付モードを切り替えられる', () => {
			const s = FilterSelection.initial([]);
			expect(s.withDateMode('withDate').dateMode).toBe('withDate');
			expect(s.withDateMode('actionable').dateMode).toBe('actionable');
		});
	});

	describe('性質の選択状態の正規化', () => {
		it('存在しなくなった性質タグは選択状態から取り除かれる', () => {
			const s = new FilterSelection(
				['home'],
				['home'],
				true,
				['quick', 'deep'],
				true,
				'actionable',
			);
			const updated = s.withSelectedPropertiesPruned(['deep']);
			expect(updated.selectedProperties).toEqual(['deep']);
		});

		it('候補に残っている性質タグは選択状態を維持する', () => {
			const s = new FilterSelection(['home'], ['home'], true, ['quick'], false, 'actionable');
			const updated = s.withSelectedPropertiesPruned(['quick', 'deep']);
			expect(updated.selectedProperties).toEqual(['quick']);
			expect(updated.noPropertySelected).toBe(false);
		});
	});

	describe('すべての環境選択 → 部分解除', () => {
		it('すべての環境 → #home クリック: home が解除されすべての環境が選択された状態ではなくなる', () => {
			const s = new FilterSelection(
				['home', 'office'],
				['home', 'office'],
				true,
				[],
				false,
				'actionable',
			);
			const toggled = s.withEnvironmentToggled('home');
			expect(toggled.selectedEnvironments).toEqual(['office']);
			expect(toggled.isAllEnvironmentsSelected).toBe(false);
		});

		it('すべての環境 → 環境コンテキストなしクリック: 環境コンテキストなしが解除されすべての環境が選択された状態ではなくなる', () => {
			const s = new FilterSelection(['home'], ['home'], true, [], false, 'actionable');
			const toggled = s.withNoContextToggled();
			expect(toggled.noContextSelected).toBe(false);
			expect(toggled.isAllEnvironmentsSelected).toBe(false);
		});
	});
});
