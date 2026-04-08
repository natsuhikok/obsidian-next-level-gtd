import { ContextClassifier } from './ContextClassifier';
import type { NextAction } from './NextAction';
import { FilterSelection } from './FilterSelection';

export class NextActionsQuery<T> {
	readonly normalizedSelection: FilterSelection;
	readonly classifier: ContextClassifier;

	constructor(
		selection: FilterSelection,
		environmentContexts: readonly string[],
		private readonly actions: readonly NextAction<T>[],
		private readonly today: string,
	) {
		const currentEnvContexts = environmentContexts.map((e) => e.toLowerCase());
		this.classifier = new ContextClassifier(currentEnvContexts);

		const envPruned = new FilterSelection(
			currentEnvContexts,
			selection.selectedEnvironments.filter((e) => currentEnvContexts.includes(e)),
			selection.noContextSelected,
			selection.selectedProperties,
			selection.noPropertySelected,
			selection.dateMode,
		);

		this.normalizedSelection = envPruned.withSelectedPropertiesPruned(
			this.computeAllPropertyCandidates(),
		);
	}

	get filteredActions(): readonly NextAction<T>[] {
		return this.actions.filter(
			(a) =>
				this.passesDateFilter(a) &&
				this.passesEnvironmentFilter(a) &&
				this.passesPropertyFilter(a),
		);
	}

	get sortedFilteredActions(): readonly NextAction<T>[] {
		return [...this.filteredActions].sort((a, b) => {
			const groupA = a.due !== null ? 0 : a.scheduled !== null ? 1 : 2;
			const groupB = b.due !== null ? 0 : b.scheduled !== null ? 1 : 2;
			if (groupA !== groupB) return groupA - groupB;
			const dateA = a.due ?? a.scheduled ?? '';
			const dateB = b.due ?? b.scheduled ?? '';
			return dateA.localeCompare(dateB);
		});
	}

	get allPropertyCandidates(): readonly string[] {
		return this.computeAllPropertyCandidates();
	}

	get propertyCandidates(): readonly string[] {
		return this.actions
			.filter((a) => this.passesDateFilter(a) && this.passesEnvironmentFilter(a))
			.flatMap((a) => this.classifier.propertyTagsOf(a).map((t) => t.toLowerCase()))
			.filter((t, i, arr) => arr.indexOf(t) === i)
			.sort();
	}

	get hasPropertylessCandidate(): boolean {
		return this.actions.some(
			(a) =>
				this.passesDateFilter(a) &&
				this.passesEnvironmentFilter(a) &&
				this.classifier.propertyTagsOf(a).length === 0,
		);
	}

	private computeAllPropertyCandidates(): readonly string[] {
		return this.actions
			.flatMap((a) => this.classifier.propertyTagsOf(a).map((t) => t.toLowerCase()))
			.filter((t, i, arr) => arr.indexOf(t) === i)
			.sort();
	}

	private passesDateFilter(action: NextAction<T>): boolean {
		if (action.blocked) return false;
		if (this.normalizedSelection.dateMode === 'actionable') {
			return action.isAvailable(this.today);
		}
		return action.scheduled !== null || action.due !== null;
	}

	private passesEnvironmentFilter(action: NextAction<T>): boolean {
		const envTags = this.classifier.environmentTagsOf(action).map((t) => t.toLowerCase());
		if (envTags.length === 0) {
			return this.normalizedSelection.noContextSelected;
		}
		return envTags.some((t) => this.normalizedSelection.selectedEnvironments.includes(t));
	}

	private passesPropertyFilter(action: NextAction<T>): boolean {
		const { selectedProperties, noPropertySelected } = this.normalizedSelection;
		if (selectedProperties.length === 0 && !noPropertySelected) return true;
		const propTags = this.classifier.propertyTagsOf(action).map((t) => t.toLowerCase());
		if (propTags.length === 0) return noPropertySelected;
		if (selectedProperties.length === 0) return false;
		return selectedProperties.every((p) => propTags.includes(p));
	}
}
