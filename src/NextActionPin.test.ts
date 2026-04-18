import { describe, expect, it } from 'vitest';
import { NextAction } from './NextActionCollection';
import { NextActionPin } from './NextActionPin';

function action(
	source: { readonly name: string },
	text: string,
): NextAction<{ readonly name: string }> {
	return new NextAction(source, text, false, null, null, []);
}

describe('NextActionPin', () => {
	it('同じファイル名とアクション名の未完了アクションに一致する', () => {
		const pin = new NextActionPin('project.md', '次にやること');

		expect(pin.matches(action({ name: 'project.md' }, '次にやること'))).toBe(true);
	});

	it('ファイル名が異なるアクションには一致しない', () => {
		const pin = new NextActionPin('project.md', '次にやること');

		expect(pin.matches(action({ name: 'other.md' }, '次にやること'))).toBe(false);
	});

	it('アクション名が異なるアクションには一致しない', () => {
		const pin = new NextActionPin('project.md', '次にやること');

		expect(pin.matches(action({ name: 'project.md' }, '別のこと'))).toBe(false);
	});

	it('保存済みのファイル名とアクション名から復元できる', () => {
		const pins = NextActionPin.storedPins([
			{ fileName: 'project.md', actionName: '次にやること' },
			{ fileName: 'other.md' },
			'不正な値',
		]);

		expect(pins).toEqual([new NextActionPin('project.md', '次にやること')]);
	});

	it('対応する未完了アクションがなくなったピンは残らない', () => {
		const pin = new NextActionPin('project.md', '次にやること');

		expect(pin.remainingIn([action({ name: 'project.md' }, '次にやること')])).toBe(true);
		expect(pin.remainingIn([action({ name: 'project.md' }, '完了したこと')])).toBe(false);
	});
});
