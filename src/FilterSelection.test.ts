import { describe, expect, it } from 'vitest';
import { FilterSelection } from './FilterSelection';

const ENV_CONTEXTS = ['home', 'office'];

describe('FilterSelection', () => {
	describe('初期状態', () => {
		it('環境コンテキストなしのみが選択された状態で初期化される', () => {
			const s = FilterSelection.initial();
			expect(s.noContextSelected).toBe(true);
			expect(s.selectedEnvironments).toEqual([]);
		});

		it('性質コンテキストなしのみが選択された状態で初期化される', () => {
			const s = FilterSelection.initial();
			expect(s.noPropertySelected).toBe(true);
			expect(s.selectedProperties).toEqual([]);
		});

		it('日付モードは actionable', () => {
			expect(FilterSelection.initial().dateMode).toBe('actionable');
		});
	});

	describe('すべての環境の選択判定', () => {
		it('全環境と環境コンテキストなしが選択されていればすべての環境が選択された状態', () => {
			const s = new FilterSelection(['home'], true, [], false, 'actionable');
			expect(s.isAllEnvironmentsSelected(['home'])).toBe(true);
		});

		it('全環境が選択されていても環境コンテキストなしが未選択ならすべての環境が選択された状態ではない', () => {
			const s = new FilterSelection(['home'], false, [], false, 'actionable');
			expect(s.isAllEnvironmentsSelected(['home'])).toBe(false);
		});

		it('一部の環境が未選択なら false', () => {
			const s = new FilterSelection(['home'], true, [], false, 'actionable');
			expect(s.isAllEnvironmentsSelected(['home', 'office'])).toBe(false);
		});

		it('環境設定が空でも環境コンテキストなしが選択されていればすべての環境が選択された状態', () => {
			const s = new FilterSelection([], true, [], false, 'actionable');
			expect(s.isAllEnvironmentsSelected([])).toBe(true);
		});
	});

	describe('環境の選択切り替え', () => {
		it('未選択環境を選択状態にする', () => {
			const s = new FilterSelection(['home'], true, [], false, 'actionable');
			expect(s.withEnvironmentToggled('office').selectedEnvironments).toContain('office');
		});

		it('選択済み環境を解除する', () => {
			const s = new FilterSelection(['home'], true, [], false, 'actionable');
			expect(s.withEnvironmentToggled('home').selectedEnvironments).not.toContain('home');
		});

		it('環境コンテキストなしの選択状態は変わらない', () => {
			const s = new FilterSelection(['home'], true, [], false, 'actionable');
			expect(s.withEnvironmentToggled('home').noContextSelected).toBe(true);
		});
	});

	describe('すべての環境の選択切り替え', () => {
		it('全環境未選択時: すべての環境と環境コンテキストなしを選択する', () => {
			const s = new FilterSelection([], false, [], false, 'actionable');
			const updated = s.withAllEnvironmentsToggled(ENV_CONTEXTS);
			expect(updated.isAllEnvironmentsSelected(ENV_CONTEXTS)).toBe(true);
			expect(updated.noContextSelected).toBe(true);
		});

		it('全環境選択時: すべての環境と環境コンテキストなしを解除する', () => {
			const s = new FilterSelection(['home', 'office'], true, [], false, 'actionable');
			const updated = s.withAllEnvironmentsToggled(ENV_CONTEXTS);
			expect(updated.selectedEnvironments).toEqual([]);
			expect(updated.noContextSelected).toBe(false);
		});

		it('一部選択時: すべての環境と環境コンテキストなしを選択する', () => {
			const s = new FilterSelection(['home'], false, [], false, 'actionable');
			const updated = s.withAllEnvironmentsToggled(ENV_CONTEXTS);
			expect(updated.isAllEnvironmentsSelected(ENV_CONTEXTS)).toBe(true);
		});
	});

	describe('環境コンテキストなしの選択切り替え', () => {
		it('未選択から選択に切り替わる', () => {
			const s = new FilterSelection(['home'], false, [], false, 'actionable');
			expect(s.withNoContextToggled().noContextSelected).toBe(true);
		});

		it('選択から未選択に切り替わる', () => {
			const s = new FilterSelection(['home'], true, [], false, 'actionable');
			expect(s.withNoContextToggled().noContextSelected).toBe(false);
		});

		it('環境の選択状態は変わらない', () => {
			const s = new FilterSelection(['home'], false, [], false, 'actionable');
			expect(s.withNoContextToggled().selectedEnvironments).toEqual(['home']);
		});
	});

	describe('性質の選択切り替え', () => {
		it('未選択性質を選択状態にする', () => {
			expect(
				FilterSelection.initial().withPropertyToggled('quick').selectedProperties,
			).toContain('quick');
		});

		it('選択済み性質を解除する', () => {
			const s = new FilterSelection([], true, ['quick'], false, 'actionable');
			expect(s.withPropertyToggled('quick').selectedProperties).not.toContain('quick');
		});
	});

	describe('性質コンテキストなしの選択切り替え', () => {
		it('未選択から選択に切り替わる', () => {
			const s = new FilterSelection([], true, [], false, 'actionable');
			expect(s.withNoPropertyToggled().noPropertySelected).toBe(true);
		});

		it('選択から未選択に切り替わる', () => {
			const s = new FilterSelection([], true, [], true, 'actionable');
			expect(s.withNoPropertyToggled().noPropertySelected).toBe(false);
		});

		it('性質の選択状態は変わらない', () => {
			const s = new FilterSelection([], true, ['quick'], false, 'actionable');
			expect(s.withNoPropertyToggled().selectedProperties).toEqual(['quick']);
		});
	});

	describe('日付モードの切り替え', () => {
		it('日付モードを切り替えられる', () => {
			const s = FilterSelection.initial();
			expect(s.withDateMode('withDate').dateMode).toBe('withDate');
			expect(s.withDateMode('actionable').dateMode).toBe('actionable');
		});
	});

	describe('環境の正規化', () => {
		it('有効な環境コンテキスト以外の選択は除去される', () => {
			const s = new FilterSelection(['home', 'office'], true, [], false, 'actionable');
			expect(s.withEnvironmentsPrunedTo(['home']).selectedEnvironments).toEqual(['home']);
		});

		it('有効な環境コンテキストの選択は維持される', () => {
			const s = new FilterSelection(['home'], true, [], false, 'actionable');
			expect(s.withEnvironmentsPrunedTo(['home', 'office']).selectedEnvironments).toEqual([
				'home',
			]);
		});
	});

	describe('性質の選択状態の正規化', () => {
		it('存在しなくなった性質タグは選択状態から取り除かれる', () => {
			const s = new FilterSelection([], true, ['quick', 'deep'], true, 'actionable');
			expect(s.withSelectedPropertiesPruned(['deep']).selectedProperties).toEqual(['deep']);
		});

		it('候補に残っている性質タグは選択状態を維持する', () => {
			const s = new FilterSelection([], true, ['quick'], false, 'actionable');
			const updated = s.withSelectedPropertiesPruned(['quick', 'deep']);
			expect(updated.selectedProperties).toEqual(['quick']);
			expect(updated.noPropertySelected).toBe(false);
		});
	});

	describe('受け入れ条件', () => {
		it('すべての環境 → 環境コンテキストなしクリック: 環境コンテキストなしが解除されすべての環境が選択された状態ではなくなる', () => {
			const s = new FilterSelection(['home'], true, [], false, 'actionable');
			const toggled = s.withNoContextToggled();
			expect(toggled.noContextSelected).toBe(false);
			expect(toggled.isAllEnvironmentsSelected(['home'])).toBe(false);
		});

		it('すべての環境 → #home クリック: home が解除されすべての環境が選択された状態ではなくなる', () => {
			const s = new FilterSelection(['home', 'office'], true, [], false, 'actionable');
			const toggled = s.withEnvironmentToggled('home');
			expect(toggled.selectedEnvironments).toEqual(['office']);
			expect(toggled.isAllEnvironmentsSelected(['home', 'office'])).toBe(false);
		});
	});
});
