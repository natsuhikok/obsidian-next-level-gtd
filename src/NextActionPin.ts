import type { NextAction } from './NextActionCollection';

export class NextActionPin {
	constructor(
		readonly fileName: string,
		readonly actionName: string,
	) {}

	static fromStoredValue(value: unknown): NextActionPin | null {
		if (typeof value !== 'object' || value === null) return null;
		const pin = value as Record<string, unknown>;
		const fileName = pin['fileName'];
		const actionName = pin['actionName'];
		if (typeof fileName !== 'string' || typeof actionName !== 'string') return null;
		return new NextActionPin(fileName, actionName);
	}

	matches(action: NextAction<{ readonly name: string }>): boolean {
		return action.source.name === this.fileName && action.text === this.actionName;
	}

	equals(other: NextActionPin): boolean {
		return this.fileName === other.fileName && this.actionName === other.actionName;
	}
}
