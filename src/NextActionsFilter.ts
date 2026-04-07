import type { NextAction } from './NextActionCollection';

export class NextActionsFilter {
	readonly environmentContexts: readonly string[];
	readonly selectedEnvironments: readonly string[];
	readonly selectedProperties: readonly string[];
	readonly dateMode: 'actionable' | 'withDate';

	constructor(
		environmentContexts: readonly string[],
		selectedEnvironments: readonly string[],
		selectedProperties: readonly string[],
		dateMode: 'actionable' | 'withDate',
	) {
		this.environmentContexts = environmentContexts.map((e) => e.toLowerCase());
		this.selectedEnvironments = selectedEnvironments;
		this.selectedProperties = selectedProperties;
		this.dateMode = dateMode;
	}

	static initial(environmentContexts: readonly string[]): NextActionsFilter {
		const normalized = environmentContexts.map((e) => e.toLowerCase());
		return new NextActionsFilter(normalized, ['anywhere', ...normalized], [], 'actionable');
	}

	get isAllEnvironmentsSelected(): boolean {
		const allEnvs = ['anywhere', ...this.environmentContexts];
		return allEnvs.every((e) => this.selectedEnvironments.includes(e));
	}

	environmentTagsOf<T>(action: NextAction<T>): readonly string[] {
		return action.context.filter((t) => this.environmentContexts.includes(t.toLowerCase()));
	}

	propertyTagsOf<T>(action: NextAction<T>): readonly string[] {
		return action.context.filter((t) => !this.environmentContexts.includes(t.toLowerCase()));
	}

	isAnywhere<T>(action: NextAction<T>): boolean {
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
		if (this.isAllEnvironmentsSelected) return true;
		const envTags = this.environmentTagsOf(action).map((t) => t.toLowerCase());
		if (envTags.length === 0) {
			return this.selectedEnvironments.includes('anywhere');
		}
		return envTags.some((t) => this.selectedEnvironments.includes(t));
	}

	passesPropertyFilter<T>(action: NextAction<T>): boolean {
		if (this.selectedProperties.length === 0) return true;
		const propTags = this.propertyTagsOf(action).map((t) => t.toLowerCase());
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
			this.selectedProperties,
			this.dateMode,
		);
	}

	withAllEnvironmentsSelected(): NextActionsFilter {
		const allEnvs = ['anywhere', ...this.environmentContexts];
		return new NextActionsFilter(
			this.environmentContexts,
			allEnvs,
			this.selectedProperties,
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
			updated,
			this.dateMode,
		);
	}

	withDateMode(mode: 'actionable' | 'withDate'): NextActionsFilter {
		return new NextActionsFilter(
			this.environmentContexts,
			this.selectedEnvironments,
			this.selectedProperties,
			mode,
		);
	}
}
