import type { ContextClassifier } from './ContextClassifier';
import type { FilterSelection } from './FilterSelection';
import type { NextAction } from './NextActionCollection';

export class NextActionsQuery<T> {
	constructor(
		private readonly classifier: ContextClassifier,
		private readonly selection: FilterSelection,
		private readonly actions: readonly NextAction<T>[],
		private readonly today: string,
	) {}

	get normalizedSelection(): FilterSelection {
		return this.selection
			.withEnvironmentsPrunedTo(this.classifier.environmentContexts)
			.withSelectedPropertiesPruned(this.allPropertyCandidates);
	}

	get allPropertyCandidates(): readonly string[] {
		return this.actions
			.flatMap((a) => this.classifier.propertyTagsOf(a).map((t) => t.toLowerCase()))
			.filter((t, i, arr) => arr.indexOf(t) === i)
			.sort();
	}

	get enabledPropertyCandidates(): ReadonlySet<string> {
		const ns = this.normalizedSelection;
		return new Set(
			this.actions
				.filter((a) => this.passesDateFilter(a, ns) && this.passesEnvironmentFilter(a, ns))
				.flatMap((a) => this.classifier.propertyTagsOf(a).map((t) => t.toLowerCase())),
		);
	}

	get hasPropertylessCandidate(): boolean {
		const ns = this.normalizedSelection;
		return this.actions.some(
			(a) =>
				this.passesDateFilter(a, ns) &&
				this.passesEnvironmentFilter(a, ns) &&
				this.classifier.propertyTagsOf(a).length === 0,
		);
	}

	get filteredActions(): readonly NextAction<T>[] {
		const ns = this.normalizedSelection;
		const filtered = this.actions.filter(
			(a) =>
				this.passesDateFilter(a, ns) &&
				this.passesEnvironmentFilter(a, ns) &&
				this.passesPropertyFilter(a, ns),
		);
		return this.sortedByDate(filtered);
	}

	private passesDateFilter(action: NextAction<T>, ns: FilterSelection): boolean {
		if (action.blocked) return false;
		if (ns.dateMode === 'actionable') {
			return action.scheduled !== null ? action.scheduled <= this.today : true;
		}
		return action.scheduled !== null || action.due !== null;
	}

	private passesEnvironmentFilter(action: NextAction<T>, ns: FilterSelection): boolean {
		const envTags = this.classifier.environmentTagsOf(action).map((t) => t.toLowerCase());
		if (envTags.length === 0) return ns.noContextSelected;
		return envTags.some((t) => ns.selectedEnvironments.includes(t));
	}

	private passesPropertyFilter(action: NextAction<T>, ns: FilterSelection): boolean {
		if (ns.selectedProperties.length === 0 && !ns.noPropertySelected) return true;
		const propTags = this.classifier.propertyTagsOf(action).map((t) => t.toLowerCase());
		if (propTags.length === 0) return ns.noPropertySelected;
		if (ns.selectedProperties.length === 0) return false;
		return ns.selectedProperties.every((p) => propTags.includes(p));
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
