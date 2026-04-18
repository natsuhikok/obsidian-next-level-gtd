import type { ContextClassifier } from './ContextClassifier';
import type { DateVisibility } from './DateVisibility';
import type { NextAction } from './NextActionCollection';

interface ActionGroup<T> {
	readonly title: string;
	readonly actions: readonly NextAction<T>[];
}

export class NextActionsQuery<T> {
	constructor(
		private readonly classifier: ContextClassifier,
		private readonly dateVisibility: DateVisibility,
		private readonly actions: readonly NextAction<T>[],
		private readonly today: string,
		private readonly pinnedAction: (action: NextAction<T>) => boolean,
	) {}

	get displayGroups(): readonly ActionGroup<T>[] {
		const eligibleActions = this.sortedByDate(this.actions.filter((a) => this.isEligible(a)));
		const pinnedActions = eligibleActions.filter((a) => this.pinnedAction(a));
		const datedActions = eligibleActions.filter((a) => a.scheduled !== null || a.due !== null);
		const fixedGroups: readonly ActionGroup<T>[] = [
			{ title: 'pinned', actions: pinnedActions },
			{ title: 'dated', actions: datedActions },
		];

		return [...fixedGroups, ...this.contextGroups(eligibleActions)].filter(
			(group) => group.actions.length > 0,
		);
	}

	get groupedActionCount(): number {
		return this.displayGroups.reduce((count, group) => count + group.actions.length, 0);
	}

	private isEligible(action: NextAction<T>): boolean {
		return !action.blocked && this.dateVisibility.allows(action.scheduled, this.today);
	}

	private contextGroups(actions: readonly NextAction<T>[]): readonly ActionGroup<T>[] {
		return [
			this.defaultContextGroup(actions),
			...this.environmentContextGroups(actions),
			...this.propertyContextGroups(actions),
		];
	}

	private environmentContextGroups(actions: readonly NextAction<T>[]): readonly ActionGroup<T>[] {
		return this.classifier.environmentContexts
			.map((context) => ({
				title: '#' + context,
				actions: actions.filter((a) =>
					this.classifier
						.environmentTagsOf(a)
						.map((tag) => tag.toLowerCase())
						.includes(context),
				),
			}))
			.filter((group) => group.actions.length > 0);
	}

	private propertyContextGroups(actions: readonly NextAction<T>[]): readonly ActionGroup<T>[] {
		return this.propertyContextTitles(actions).map((context) => ({
			title: '#' + context,
			actions: actions.filter((a) =>
				this.classifier
					.propertyTagsOf(a)
					.map((tag) => tag.toLowerCase())
					.includes(context),
			),
		}));
	}

	private propertyContextTitles(actions: readonly NextAction<T>[]): readonly string[] {
		return actions
			.flatMap((a) => this.classifier.propertyTagsOf(a).map((tag) => tag.toLowerCase()))
			.filter((tag, index, tags) => tags.indexOf(tag) === index)
			.sort();
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

	private sortedByDate(actions: readonly NextAction<T>[]): readonly NextAction<T>[] {
		return [...actions].sort((a, b) => {
			const groupA = a.actionDate !== null ? 0 : 1;
			const groupB = b.actionDate !== null ? 0 : 1;
			if (groupA !== groupB) return groupA - groupB;
			const dateA = a.actionDate ?? '';
			const dateB = b.actionDate ?? '';
			return dateA.localeCompare(dateB);
		});
	}
}
