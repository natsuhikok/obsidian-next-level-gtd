import type { NextAction } from './NextActionCollection';

export class ContextClassifier {
	private readonly envContexts: readonly string[];

	constructor(environmentContexts: readonly string[]) {
		this.envContexts = environmentContexts.map((e) => e.toLowerCase());
	}

	get environmentContexts(): readonly string[] {
		return this.envContexts;
	}

	isEnvironmentContext(tag: string): boolean {
		return this.envContexts.includes(tag.toLowerCase());
	}

	environmentTagsOf<T>(action: NextAction<T>): readonly string[] {
		return action.context.filter((t) => this.envContexts.includes(t.toLowerCase()));
	}

	propertyTagsOf<T>(action: NextAction<T>): readonly string[] {
		return action.context.filter((t) => !this.envContexts.includes(t.toLowerCase()));
	}

	isNoEnvironmentContext<T>(action: NextAction<T>): boolean {
		return this.environmentTagsOf(action).length === 0;
	}
}
