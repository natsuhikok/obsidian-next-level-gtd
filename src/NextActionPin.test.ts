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
});
