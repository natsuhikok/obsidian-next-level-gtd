import type { NextAction } from './NextActionCollection';

export class ContextOrder {
	private readonly orderedContexts: readonly string[];

	constructor(contexts: readonly string[]) {
		this.orderedContexts = contexts
			.map((context) => context.trim().toLowerCase().replace(/^#/, ''))
			.filter((context) => context !== '')
			.filter((context, index, contexts) => contexts.indexOf(context) === index);
	}

	get contexts(): readonly string[] {
		return this.orderedContexts;
	}

	contextsFor<T>(actions: readonly NextAction<T>[]): readonly string[] {
		const presentContexts = actions
			.flatMap((action) => this.normalizedContextsOf(action))
			.filter((context, index, contexts) => contexts.indexOf(context) === index);
		const configuredContexts = this.orderedContexts.filter((context) =>
			presentContexts.includes(context),
		);
		const unconfiguredContexts = presentContexts
			.filter((context) => !this.orderedContexts.includes(context))
			.sort();
		return [...configuredContexts, ...unconfiguredContexts];
	}

	bestConfiguredIndexOf<T>(action: NextAction<T>): number | null {
		const indexes = this.normalizedContextsOf(action)
			.map((context) => this.orderedContexts.indexOf(context))
			.filter((index) => index >= 0)
			.sort((a, b) => a - b);
		return indexes[0] ?? null;
	}

	bestUnconfiguredContextOf<T>(action: NextAction<T>): string {
		return (
			this.normalizedContextsOf(action)
				.filter((context) => !this.orderedContexts.includes(context))
				.sort()[0] ?? ''
		);
	}

	contains(tag: string): boolean {
		return this.orderedContexts.includes(tag.toLowerCase());
	}

	private normalizedContextsOf<T>(action: NextAction<T>): readonly string[] {
		return action.context
			.map((context) => context.toLowerCase())
			.filter((context, index, contexts) => contexts.indexOf(context) === index);
	}
}
