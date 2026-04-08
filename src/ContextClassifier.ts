import type { NextAction } from './NextAction';

export class ContextClassifier {
	readonly environmentContexts: readonly string[];

	constructor(environmentContexts: readonly string[]) {
		this.environmentContexts = environmentContexts.map((e) => e.toLowerCase());
	}

	environmentTagsOf<T>(action: NextAction<T>): readonly string[] {
		return action.context.filter((t) => this.environmentContexts.includes(t.toLowerCase()));
	}

	propertyTagsOf<T>(action: NextAction<T>): readonly string[] {
		return action.context.filter((t) => !this.environmentContexts.includes(t.toLowerCase()));
	}

	isNoContext<T>(action: NextAction<T>): boolean {
		return this.environmentTagsOf(action).length === 0;
	}
}
