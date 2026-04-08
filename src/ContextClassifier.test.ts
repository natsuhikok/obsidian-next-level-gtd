import { describe, expect, it } from 'vitest';
import { ContextClassifier } from './ContextClassifier';
import { NextAction } from './NextAction';

function action(context: readonly string[] = []): NextAction<string> {
	return new NextAction('test', 'タスク', false, null, null, context);
}

describe('ContextClassifier', () => {
	describe('環境コンテキストの大文字小文字正規化', () => {
		it('大文字の環境コンテキストを小文字に正規化する', () => {
			const c = new ContextClassifier(['Home', 'OFFICE']);
			expect(c.environmentContexts).toEqual(['home', 'office']);
		});
	});

	describe('コンテキストタグの分類', () => {
		it('設定済み環境に一致するタグは環境タグとして分類される', () => {
			const c = new ContextClassifier(['home']);
			expect(c.environmentTagsOf(action(['home', 'quick']))).toEqual(['home']);
		});

		it('環境設定にないタグは性質タグとして分類される', () => {
			const c = new ContextClassifier(['home']);
			expect(c.propertyTagsOf(action(['home', 'quick']))).toEqual(['quick']);
		});

		it('タグ比較は case-insensitive', () => {
			const c = new ContextClassifier(['home']);
			expect(c.environmentTagsOf(action(['Home', 'QUICK']))).toEqual(['Home']);
			expect(c.propertyTagsOf(action(['Home', 'QUICK']))).toEqual(['QUICK']);
		});

		it('コンテキストが空の場合は空配列を返す', () => {
			const c = new ContextClassifier(['home']);
			expect(c.environmentTagsOf(action([]))).toEqual([]);
			expect(c.propertyTagsOf(action([]))).toEqual([]);
		});
	});

	describe('環境コンテキストなし判定', () => {
		it('環境タグが1つもない場合は no context', () => {
			const c = new ContextClassifier(['home']);
			expect(c.isNoContext(action(['quick']))).toBe(true);
		});

		it('環境タグがある場合は no context ではない', () => {
			const c = new ContextClassifier(['home']);
			expect(c.isNoContext(action(['home']))).toBe(false);
		});

		it('コンテキストが空の場合は no context', () => {
			const c = new ContextClassifier(['home']);
			expect(c.isNoContext(action([]))).toBe(true);
		});
	});
});
