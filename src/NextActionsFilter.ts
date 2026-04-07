import type { NextAction } from './NextActionCollection';

export class NextActionsFilter {
	readonly environmentContexts: readonly string[];
	readonly selectedEnvironments: readonly string[];
	readonly noContextSelected: boolean;
	readonly selectedProperties: readonly string[];
	readonly noPropertySelected: boolean;
	readonly dateMode: 'actionable' | 'withDate';

	constructor(
		environmentContexts: readonly string[],
		selectedEnvironments: readonly string[],
		noContextSelected: boolean,
		selectedProperties: readonly string[],
		noPropertySelected: boolean,
		dateMode: 'actionable' | 'withDate',
	) {
		this.environmentContexts = environmentContexts.map((e) => e.toLowerCase());
		this.selectedEnvironments = selectedEnvironments;
		this.noContextSelected = noContextSelected;
		this.selectedProperties = selectedProperties;
		this.noPropertySelected = noPropertySelected;
		this.dateMode = dateMode;
	}

	static initial(environmentContexts: readonly string[]): NextActionsFilter {
		const normalized = environmentContexts.map((e) => e.toLowerCase());
		return new NextActionsFilter(normalized, [], true, [], true, 'actionable');
	}

	get isAllEnvironmentsSelected(): boolean {
		return (
			this.noContextSelected &&
			this.environmentContexts.every((e) => this.selectedEnvironments.includes(e))
		);
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

	passesDateFilter<T>(action: NextAction<T>, today: string): boolean {
		if (action.blocked) return false;
		if (this.dateMode === 'actionable') {
			return action.scheduled !== null ? action.scheduled <= today : true;
		}
		return action.scheduled !== null || action.due !== null;
	}

	passesEnvironmentFilter<T>(action: NextAction<T>): boolean {
		const envTags = this.environmentTagsOf(action).map((t) => t.toLowerCase());
		if (envTags.length === 0) {
			return this.noContextSelected;
		}
		return envTags.some((t) => this.selectedEnvironments.includes(t));
	}

	passesPropertyFilter<T>(action: NextAction<T>): boolean {
		if (this.selectedProperties.length === 0 && !this.noPropertySelected) return true;
		const propTags = this.propertyTagsOf(action).map((t) => t.toLowerCase());
		if (propTags.length === 0) return this.noPropertySelected;
		if (this.selectedProperties.length === 0) return false;
		return this.selectedProperties.every((p) => propTags.includes(p));
	}

	propertyCandidates<T>(actions: readonly NextAction<T>[], today: string): readonly string[] {
		const afterDateAndEnv = actions.filter(
			(a) => this.passesDateFilter(a, today) && this.passesEnvironmentFilter(a),
		);
		return afterDateAndEnv
			.flatMap((a) => this.propertyTagsOf(a).map((t) => t.toLowerCase()))
			.filter((t, i, arr) => arr.indexOf(t) === i)
			.sort();
	}

	allPropertyCandidates<T>(actions: readonly NextAction<T>[]): readonly string[] {
		return actions
			.flatMap((a) => this.propertyTagsOf(a).map((t) => t.toLowerCase()))
			.filter((t, i, arr) => arr.indexOf(t) === i)
			.sort();
	}

	filter<T>(actions: readonly NextAction<T>[], today: string): readonly NextAction<T>[] {
		return actions.filter(
			(a) =>
				this.passesDateFilter(a, today) &&
				this.passesEnvironmentFilter(a) &&
				this.passesPropertyFilter(a),
		);
	}

	sort<T>(actions: readonly NextAction<T>[]): readonly NextAction<T>[] {
		return [...actions].sort((a, b) => {
			const groupA = a.due !== null ? 0 : a.scheduled !== null ? 1 : 2;
			const groupB = b.due !== null ? 0 : b.scheduled !== null ? 1 : 2;
			if (groupA !== groupB) return groupA - groupB;
			const dateA = a.due ?? a.scheduled ?? '';
			const dateB = b.due ?? b.scheduled ?? '';
			return dateA.localeCompare(dateB);
		});
	}

	withEnvironmentToggled(env: string): NextActionsFilter {
		const updated = this.selectedEnvironments.includes(env)
			? this.selectedEnvironments.filter((e) => e !== env)
			: [...this.selectedEnvironments, env];
		return new NextActionsFilter(
			this.environmentContexts,
			updated,
			this.noContextSelected,
			this.selectedProperties,
			this.noPropertySelected,
			this.dateMode,
		);
	}

	withAllEnvironmentsToggled(): NextActionsFilter {
		if (this.isAllEnvironmentsSelected) {
			return new NextActionsFilter(
				this.environmentContexts,
				[],
				false,
				this.selectedProperties,
				this.noPropertySelected,
				this.dateMode,
			);
		}
		return new NextActionsFilter(
			this.environmentContexts,
			[...this.environmentContexts],
			true,
			this.selectedProperties,
			this.noPropertySelected,
			this.dateMode,
		);
	}

	withNoContextToggled(): NextActionsFilter {
		return new NextActionsFilter(
			this.environmentContexts,
			this.selectedEnvironments,
			!this.noContextSelected,
			this.selectedProperties,
			this.noPropertySelected,
			this.dateMode,
		);
	}

	withNoPropertyToggled(): NextActionsFilter {
		return new NextActionsFilter(
			this.environmentContexts,
			this.selectedEnvironments,
			this.noContextSelected,
			this.selectedProperties,
			!this.noPropertySelected,
			this.dateMode,
		);
	}

	withPropertyToggled(prop: string): NextActionsFilter {
		const updated = this.selectedProperties.includes(prop)
			? this.selectedProperties.filter((p) => p !== prop)
			: [...this.selectedProperties, prop];
		return new NextActionsFilter(
			this.environmentContexts,
			this.selectedEnvironments,
			this.noContextSelected,
			updated,
			this.noPropertySelected,
			this.dateMode,
		);
	}

	withDateMode(mode: 'actionable' | 'withDate'): NextActionsFilter {
		return new NextActionsFilter(
			this.environmentContexts,
			this.selectedEnvironments,
			this.noContextSelected,
			this.selectedProperties,
			this.noPropertySelected,
			mode,
		);
	}
}
