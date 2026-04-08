import { describe, expect, it } from 'vitest';
import { ContextClassifier } from './ContextClassifier';
import { NextAction } from './NextActionCollection';

function action(context: readonly string[]): NextAction<string> {
	return new NextAction('test', 'タスク', false, null, null, context);
}

describe('ContextClassifier', () => {
	describe('環境コンテキストの判定', () => {
		it('設定済み環境に一致するタグは環境コンテキストと判定される', () => {
			const c = new ContextClassifier(['home']);
			expect(c.isEnvironmentContext('home')).toBe(true);
		});

		it('設定済み環境にないタグは環境コンテキストと判定されない', () => {
			const c = new ContextClassifier(['home']);
			expect(c.isEnvironmentContext('quick')).toBe(false);
		});

		it('大文字小文字を区別しない', () => {
			const c = new ContextClassifier(['home']);
			expect(c.isEnvironmentContext('Home')).toBe(true);
			expect(c.isEnvironmentContext('HOME')).toBe(true);
		});

		it('環境コンテキスト名は小文字に正規化して保持される', () => {
			const c = new ContextClassifier(['Home', 'OFFICE']);
			expect(c.environmentContexts).toEqual(['home', 'office']);
		});
	});

	describe('環境タグの分類', () => {
		it('設定済み環境に一致するタグは環境タグとして分類される', () => {
			const c = new ContextClassifier(['home']);
			expect(c.environmentTagsOf(action(['home', 'quick']))).toEqual(['home']);
		});

		it('環境設定にないタグは環境タグとして分類されない', () => {
			const c = new ContextClassifier(['home']);
			expect(c.environmentTagsOf(action(['quick']))).toEqual([]);
		});

		it('タグ比較は case-insensitive', () => {
			const c = new ContextClassifier(['home']);
			expect(c.environmentTagsOf(action(['Home', 'QUICK']))).toEqual(['Home']);
		});
	});

	describe('性質タグの分類', () => {
		it('環境設定にないタグは性質タグとして分類される', () => {
			const c = new ContextClassifier(['home']);
			expect(c.propertyTagsOf(action(['home', 'quick']))).toEqual(['quick']);
		});

		it('タグ比較は case-insensitive', () => {
			const c = new ContextClassifier(['home']);
			expect(c.propertyTagsOf(action(['Home', 'QUICK']))).toEqual(['QUICK']);
		});
	});

	describe('環境コンテキストなし判定', () => {
		it('環境タグが1つもない場合は no context', () => {
			const c = new ContextClassifier(['home']);
			expect(c.isNoEnvironmentContext(action(['quick']))).toBe(true);
		});

		it('環境タグがある場合は no context ではない', () => {
			const c = new ContextClassifier(['home']);
			expect(c.isNoEnvironmentContext(action(['home']))).toBe(false);
		});
	});
});
