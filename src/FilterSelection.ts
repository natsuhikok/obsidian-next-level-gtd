export class FilterSelection {
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

	static initial(environmentContexts: readonly string[]): FilterSelection {
		const normalized = environmentContexts.map((e) => e.toLowerCase());
		return new FilterSelection(normalized, [], true, [], true, 'actionable');
	}

	get isAllEnvironmentsSelected(): boolean {
		return (
			this.noContextSelected &&
			this.environmentContexts.every((e) => this.selectedEnvironments.includes(e))
		);
	}

	withEnvironmentToggled(env: string): FilterSelection {
		const updated = this.selectedEnvironments.includes(env)
			? this.selectedEnvironments.filter((e) => e !== env)
			: [...this.selectedEnvironments, env];
		return new FilterSelection(
			this.environmentContexts,
			updated,
			this.noContextSelected,
			this.selectedProperties,
			this.noPropertySelected,
			this.dateMode,
		);
	}

	withAllEnvironmentsToggled(): FilterSelection {
		if (this.isAllEnvironmentsSelected) {
			return new FilterSelection(
				this.environmentContexts,
				[],
				false,
				this.selectedProperties,
				this.noPropertySelected,
				this.dateMode,
			);
		}
		return new FilterSelection(
			this.environmentContexts,
			[...this.environmentContexts],
			true,
			this.selectedProperties,
			this.noPropertySelected,
			this.dateMode,
		);
	}

	withNoContextToggled(): FilterSelection {
		return new FilterSelection(
			this.environmentContexts,
			this.selectedEnvironments,
			!this.noContextSelected,
			this.selectedProperties,
			this.noPropertySelected,
			this.dateMode,
		);
	}

	withPropertyToggled(prop: string): FilterSelection {
		const updated = this.selectedProperties.includes(prop)
			? this.selectedProperties.filter((p) => p !== prop)
			: [...this.selectedProperties, prop];
		return new FilterSelection(
			this.environmentContexts,
			this.selectedEnvironments,
			this.noContextSelected,
			updated,
			this.noPropertySelected,
			this.dateMode,
		);
	}

	withNoPropertyToggled(): FilterSelection {
		return new FilterSelection(
			this.environmentContexts,
			this.selectedEnvironments,
			this.noContextSelected,
			this.selectedProperties,
			!this.noPropertySelected,
			this.dateMode,
		);
	}

	withDateMode(mode: 'actionable' | 'withDate'): FilterSelection {
		return new FilterSelection(
			this.environmentContexts,
			this.selectedEnvironments,
			this.noContextSelected,
			this.selectedProperties,
			this.noPropertySelected,
			mode,
		);
	}

	withSelectedPropertiesPruned(candidates: readonly string[]): FilterSelection {
		const allowed = new Set(candidates.map((c) => c.toLowerCase()));
		return new FilterSelection(
			this.environmentContexts,
			this.selectedEnvironments,
			this.noContextSelected,
			this.selectedProperties.filter((p) => allowed.has(p.toLowerCase())),
			this.noPropertySelected,
			this.dateMode,
		);
	}
}
