import type { ContextClassifier } from './ContextClassifier';
import type { ContextOrder } from './ContextOrder';
import type { DateVisibility } from './DateVisibility';
import type { NextAction } from './NextActionCollection';

interface ActionGroup<T> {
	readonly title: string;
	readonly actions: readonly NextAction<T>[];
}

export class NextActionsQuery<T> {
	constructor(
		private readonly classifier: ContextClassifier,
		private readonly contextOrder: ContextOrder,
		private readonly dateVisibility: DateVisibility,
		private readonly actions: readonly NextAction<T>[],
		private readonly today: string,
		private readonly pinnedAction: (action: NextAction<T>) => boolean,
	) {}

	get totalActionCount(): number {
		return this.eligibleActions.length;
	}

	get displayGroups(): readonly ActionGroup<T>[] {
		const eligibleActions = this.sortedByDisplayPriority(this.eligibleActions);
		const fixedGroups: readonly ActionGroup<T>[] = [
			{ title: 'pinned', actions: eligibleActions.filter((a) => this.pinnedAction(a)) },
			{
				title: 'dated',
				actions: eligibleActions.filter((a) => a.scheduled !== null || a.due !== null),
			},
			this.defaultContextGroup(eligibleActions),
		];

		return [...fixedGroups, ...this.contextGroups(eligibleActions)].filter(
			(group) => group.actions.length > 0,
		);
	}

	private get eligibleActions(): readonly NextAction<T>[] {
		return this.actions.filter((action) => this.isEligible(action));
	}

	private isEligible(action: NextAction<T>): boolean {
		return !action.blocked && this.dateVisibility.allows(action.scheduled, this.today);
	}

	private contextGroups(actions: readonly NextAction<T>[]): readonly ActionGroup<T>[] {
		return this.contextOrder.contextsFor(actions).map((context) => ({
			title: '#' + context,
			actions: actions.filter((action) =>
				action.context.map((tag) => tag.toLowerCase()).includes(context),
			),
		}));
	}

	private defaultContextGroup(actions: readonly NextAction<T>[]): ActionGroup<T> {
		return {
			title: 'default',
			actions: actions.filter(
				(a) =>
					this.classifier.environmentTagsOf(a).length === 0 &&
					this.classifier.propertyTagsOf(a).length === 0,
			),
		};
	}

	private sortedByDisplayPriority(actions: readonly NextAction<T>[]): readonly NextAction<T>[] {
		return [...actions].sort((a, b) => {
			const groupA = this.displayPriorityOf(a);
			const groupB = this.displayPriorityOf(b);
			if (groupA !== groupB) return groupA - groupB;
			const dateA = a.actionDate ?? '';
			const dateB = b.actionDate ?? '';
			if (dateA !== dateB) return dateA.localeCompare(dateB);
			const contextA = this.contextPriorityOf(a);
			const contextB = this.contextPriorityOf(b);
			if (contextA !== contextB) return contextA - contextB;
			const unconfiguredContextA = this.contextOrder.bestUnconfiguredContextOf(a);
			const unconfiguredContextB = this.contextOrder.bestUnconfiguredContextOf(b);
			if (unconfiguredContextA !== unconfiguredContextB) {
				return unconfiguredContextA.localeCompare(unconfiguredContextB);
			}
			return a.text.localeCompare(b.text);
		});
	}

	private displayPriorityOf(action: NextAction<T>): number {
		if (this.pinnedAction(action)) return 0;
		if (action.scheduled !== null || action.due !== null) return 1;
		if (
			this.classifier.environmentTagsOf(action).length === 0 &&
			this.classifier.propertyTagsOf(action).length === 0
		) {
			return 2;
		}
		return 3;
	}

	private contextPriorityOf(action: NextAction<T>): number {
		const configuredIndex = this.contextOrder.bestConfiguredIndexOf(action);
		if (configuredIndex !== null) return configuredIndex;
		return this.contextOrder.contexts.length + 1;
	}
}
