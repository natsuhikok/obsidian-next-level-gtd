import type { NextAction } from './NextActionCollection';

export class NextActionPin {
	constructor(
		readonly fileName: string,
		readonly actionName: string,
	) {}

	matches(action: NextAction<{ readonly name: string }>): boolean {
		return action.source.name === this.fileName && action.text === this.actionName;
	}
}
