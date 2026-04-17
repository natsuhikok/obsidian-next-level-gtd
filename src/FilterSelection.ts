import { NextActionFilterCriterion } from './NextActionFilterCriterion';
import { NextActionFilterExpression } from './NextActionFilterExpression';
import { NextActionFilterGroup } from './NextActionFilterGroup';

export class FilterSelection {
	readonly selectedEnvironments: readonly string[];
	readonly noContextSelected: boolean;
	readonly selectedProperties: readonly string[];
	readonly noPropertySelected: boolean;
	readonly dateMode: 'actionable' | 'withDate';
	readonly expression: NextActionFilterExpression;
	readonly activeGroupIndex: number;

	constructor(
		selectedEnvironments: readonly string[],
		noContextSelected: boolean,
		selectedProperties: readonly string[],
		noPropertySelected: boolean,
		dateMode: 'actionable' | 'withDate',
		expression: NextActionFilterExpression | null = null,
		activeGroupIndex = 0,
	) {
		this.selectedEnvironments = selectedEnvironments.map((environment) =>
			environment.toLowerCase(),
		);
		this.noContextSelected = noContextSelected;
		this.selectedProperties = selectedProperties.map((property) => property.toLowerCase());
		this.noPropertySelected = noPropertySelected;
		this.dateMode = dateMode;
		this.expression =
			expression ??
			FilterSelection.expressionFromLegacy(
				this.selectedEnvironments,
				noContextSelected,
				this.selectedProperties,
				noPropertySelected,
				dateMode,
			);
		this.activeGroupIndex = Math.max(
			0,
			Math.min(activeGroupIndex, this.expression.groups.length - 1),
		);
	}

	static initial(): FilterSelection {
		return FilterSelection.fromExpression(NextActionFilterExpression.initial());
	}

	static fromExpression(
		expression: NextActionFilterExpression,
		activeGroupIndex = 0,
	): FilterSelection {
		const activeGroup = expression.groups[activeGroupIndex] ?? expression.groups[0]!;
		const selectedEnvironments = activeGroup.criteria
			.filter((criterion) => criterion.kind === 'environment' && criterion.value != null)
			.map((criterion) => criterion.value ?? '');
		const selectedProperties = activeGroup.criteria
			.filter((criterion) => criterion.kind === 'property' && criterion.value != null)
			.map((criterion) => criterion.value ?? '');
		const dateMode = activeGroup.criteria.some((criterion) => criterion.kind === 'withDate')
			? 'withDate'
			: 'actionable';
		return new FilterSelection(
			selectedEnvironments,
			activeGroup.criteria.some((criterion) => criterion.kind === 'noEnvironment'),
			selectedProperties,
			activeGroup.criteria.some((criterion) => criterion.kind === 'noProperty'),
			dateMode,
			expression,
			activeGroupIndex,
		);
	}

	isAllEnvironmentsSelected(environmentContexts: readonly string[]): boolean {
		return (
			this.noContextSelected &&
			environmentContexts.every((e) => this.selectedEnvironments.includes(e))
		);
	}

	withEnvironmentToggled(env: string): FilterSelection {
		const normalized = env.toLowerCase();
		const updated = this.selectedEnvironments.includes(normalized)
			? this.selectedEnvironments.filter((e) => e !== normalized)
			: [...this.selectedEnvironments, normalized];
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
		const normalized = prop.toLowerCase();
		const updated = this.selectedProperties.includes(normalized)
			? this.selectedProperties.filter((p) => p !== normalized)
			: [...this.selectedProperties, normalized];
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
		const allowed = candidates.map((c) => c.toLowerCase());
		return new FilterSelection(
			this.selectedEnvironments,
			this.noContextSelected,
			this.selectedProperties.filter((p) => allowed.includes(p.toLowerCase())),
			this.noPropertySelected,
			this.dateMode,
			this.expression.withCriteriaPruned(this.selectedEnvironments, allowed),
			this.activeGroupIndex,
		);
	}

	hasActiveCriterion(criterion: NextActionFilterCriterion): boolean {
		return this.expression.groups[this.activeGroupIndex]?.hasCriterion(criterion) ?? false;
	}

	withActiveCriterionToggled(criterion: NextActionFilterCriterion): FilterSelection {
		return FilterSelection.fromExpression(
			this.expression.withCriterionToggled(this.activeGroupIndex, criterion),
			this.activeGroupIndex,
		);
	}

	withGroupAdded(): FilterSelection {
		const expression = this.expression.withGroupAdded();
		return FilterSelection.fromExpression(expression, expression.groups.length - 1);
	}

	withGroupRemoved(): FilterSelection {
		const expression = this.expression.withGroupRemoved(this.activeGroupIndex);
		return FilterSelection.fromExpression(
			expression,
			Math.min(this.activeGroupIndex, expression.groups.length - 1),
		);
	}

	withActiveGroup(index: number): FilterSelection {
		return FilterSelection.fromExpression(this.expression, index);
	}

	withExpressionPrunedTo(
		validEnvironments: readonly string[],
		validProperties: readonly string[],
	): FilterSelection {
		const environments = validEnvironments.map((environment) => environment.toLowerCase());
		const properties = validProperties.map((property) => property.toLowerCase());
		return new FilterSelection(
			this.selectedEnvironments.filter((environment) => environments.includes(environment)),
			this.noContextSelected,
			this.selectedProperties.filter((property) => properties.includes(property)),
			this.noPropertySelected,
			this.dateMode,
			this.expression.withCriteriaPruned(validEnvironments, validProperties),
			this.activeGroupIndex,
		);
	}

	private static expressionFromLegacy(
		selectedEnvironments: readonly string[],
		noContextSelected: boolean,
		selectedProperties: readonly string[],
		noPropertySelected: boolean,
		dateMode: 'actionable' | 'withDate',
	): NextActionFilterExpression {
		const environmentAlternatives = [
			...(noContextSelected ? [[new NextActionFilterCriterion('noEnvironment')]] : []),
			...selectedEnvironments.map((environment) => [
				new NextActionFilterCriterion('environment', environment),
			]),
		];
		const propertyAlternatives = [
			...(noPropertySelected ? [[new NextActionFilterCriterion('noProperty')]] : []),
			...(selectedProperties.length > 0
				? [
						selectedProperties.map(
							(property) => new NextActionFilterCriterion('property', property),
						),
					]
				: []),
		];
		const dateCriterion = new NextActionFilterCriterion(dateMode);
		const effectiveEnvironmentAlternatives =
			environmentAlternatives.length > 0
				? environmentAlternatives
				: [[new NextActionFilterCriterion('never')]];
		const effectivePropertyAlternatives =
			propertyAlternatives.length > 0 ? propertyAlternatives : [[]];
		return new NextActionFilterExpression(
			effectiveEnvironmentAlternatives.flatMap((environmentCriteria) =>
				effectivePropertyAlternatives.map(
					(propertyCriteria) =>
						new NextActionFilterGroup([
							...environmentCriteria,
							...propertyCriteria,
							dateCriterion,
						]),
				),
			),
		);
	}
}
