export class FilterSelection {
	readonly selectedEnvironments: readonly string[];
	readonly noContextSelected: boolean;
	readonly selectedProperties: readonly string[];
	readonly noPropertySelected: boolean;
	readonly dateMode: 'actionable' | 'withDate';

	constructor(
		selectedEnvironments: readonly string[],
		noContextSelected: boolean,
		selectedProperties: readonly string[],
		noPropertySelected: boolean,
		dateMode: 'actionable' | 'withDate',
	) {
		this.selectedEnvironments = selectedEnvironments;
		this.noContextSelected = noContextSelected;
		this.selectedProperties = selectedProperties;
		this.noPropertySelected = noPropertySelected;
		this.dateMode = dateMode;
	}

	static initial(): FilterSelection {
		return new FilterSelection([], true, [], true, 'actionable');
	}

	isAllEnvironmentsSelected(environmentContexts: readonly string[]): boolean {
		return (
			this.noContextSelected &&
			environmentContexts.every((e) => this.selectedEnvironments.includes(e))
		);
	}

	withEnvironmentToggled(env: string): FilterSelection {
		const updated = this.selectedEnvironments.includes(env)
			? this.selectedEnvironments.filter((e) => e !== env)
			: [...this.selectedEnvironments, env];
		return new FilterSelection(
			updated,
			this.noContextSelected,
			this.selectedProperties,
			this.noPropertySelected,
			this.dateMode,
		);
	}

	withAllEnvironmentsToggled(environmentContexts: readonly string[]): FilterSelection {
		if (this.isAllEnvironmentsSelected(environmentContexts)) {
			return new FilterSelection(
				[],
				false,
				this.selectedProperties,
				this.noPropertySelected,
				this.dateMode,
			);
		}
		return new FilterSelection(
			[...environmentContexts],
			true,
			this.selectedProperties,
			this.noPropertySelected,
			this.dateMode,
		);
	}

	withNoContextToggled(): FilterSelection {
		return new FilterSelection(
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
			this.selectedEnvironments,
			this.noContextSelected,
			updated,
			this.noPropertySelected,
			this.dateMode,
		);
	}

	withNoPropertyToggled(): FilterSelection {
		return new FilterSelection(
			this.selectedEnvironments,
			this.noContextSelected,
			this.selectedProperties,
			!this.noPropertySelected,
			this.dateMode,
		);
	}

	withDateMode(mode: 'actionable' | 'withDate'): FilterSelection {
		return new FilterSelection(
			this.selectedEnvironments,
			this.noContextSelected,
			this.selectedProperties,
			this.noPropertySelected,
			mode,
		);
	}

	withEnvironmentsPrunedTo(validEnvironments: readonly string[]): FilterSelection {
		return new FilterSelection(
			this.selectedEnvironments.filter((e) => validEnvironments.includes(e)),
			this.noContextSelected,
			this.selectedProperties,
			this.noPropertySelected,
			this.dateMode,
		);
	}

	withSelectedPropertiesPruned(candidates: readonly string[]): FilterSelection {
		const allowed = new Set(candidates.map((c) => c.toLowerCase()));
		return new FilterSelection(
			this.selectedEnvironments,
			this.noContextSelected,
			this.selectedProperties.filter((p) => allowed.has(p.toLowerCase())),
			this.noPropertySelected,
			this.dateMode,
		);
	}
}
