import type { NextAction } from './NextActionCollection';

export class NextActionPin {
	constructor(
		readonly fileName: string,
		readonly actionName: string,
	) {}

	static fromAction(action: NextAction<{ readonly name: string }>): NextActionPin {
		return new NextActionPin(action.source.name, action.text);
	}

	static fromStored(raw: unknown): NextActionPin | null {
		if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
		const record = raw as Record<string, unknown>;
		const fileName = record['fileName'];
		const actionName = record['actionName'];
		if (typeof fileName !== 'string' || typeof actionName !== 'string') return null;
		return new NextActionPin(fileName, actionName);
	}

	static storedPins(raw: unknown): readonly NextActionPin[] {
		return Array.isArray(raw)
			? raw
					.map((value) => NextActionPin.fromStored(value))
					.filter((pin): pin is NextActionPin => pin !== null)
			: [];
	}

	matches(action: NextAction<{ readonly name: string }>): boolean {
		return action.source.name === this.fileName && action.text === this.actionName;
	}

	remainingIn(actions: readonly NextAction<{ readonly name: string }>[]): boolean {
		return actions.some((action) => this.matches(action));
	}
}
