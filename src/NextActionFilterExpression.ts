import type { ContextClassifier } from './ContextClassifier';
import { NextActionFilterCriterion } from './NextActionFilterCriterion';
import { NextActionFilterGroup } from './NextActionFilterGroup';
import type { NextAction } from './NextActionCollection';

export class NextActionFilterExpression {
	readonly groups: readonly NextActionFilterGroup[];

	constructor(groups: readonly NextActionFilterGroup[]) {
		this.groups = groups.length === 0 ? [NextActionFilterGroup.empty()] : groups;
	}

	static initial(): NextActionFilterExpression {
		return new NextActionFilterExpression([
			new NextActionFilterGroup([
				NextActionFilterExpression.noEnvironmentCriterion,
				NextActionFilterExpression.noPropertyCriterion,
				NextActionFilterExpression.actionableCriterion,
			]),
		]);
	}

	static from(value: unknown): NextActionFilterExpression | null {
		if (typeof value !== 'object' || value == null) return null;
		const obj = value as Record<string, unknown>;
		const rawGroups = obj['groups'];
		if (!Array.isArray(rawGroups)) return null;
		const groups = rawGroups
			.map((group) => NextActionFilterGroup.from(group))
			.filter((group): group is NextActionFilterGroup => group !== null);
		return groups.length === 0 ? null : new NextActionFilterExpression(groups);
	}

	static get noEnvironmentCriterion() {
		return new NextActionFilterCriterion('noEnvironment');
	}

	static get noPropertyCriterion() {
		return new NextActionFilterCriterion('noProperty');
	}

	static get actionableCriterion() {
		return new NextActionFilterCriterion('actionable');
	}

	get serialized(): {
		readonly groups: readonly {
			readonly criteria: readonly {
				readonly kind: NextActionFilterCriterion['kind'];
				readonly value?: string;
			}[];
		}[];
	} {
		return { groups: this.groups.map((group) => group.serialized) };
	}

	withGroupAdded(): NextActionFilterExpression {
		return new NextActionFilterExpression([...this.groups, NextActionFilterGroup.empty()]);
	}

	withGroupRemoved(index: number): NextActionFilterExpression {
		if (this.groups.length === 1) return this;
		return new NextActionFilterExpression(
			this.groups.filter((_, groupIndex) => groupIndex !== index),
		);
	}

	withCriterionToggled(
		index: number,
		criterion: NextActionFilterCriterion,
	): NextActionFilterExpression {
		return new NextActionFilterExpression(
			this.groups.map((group, groupIndex) =>
				groupIndex === index ? group.withCriterionToggled(criterion) : group,
			),
		);
	}

	withCriteriaPruned(
		validEnvironments: readonly string[],
		validProperties: readonly string[],
	): NextActionFilterExpression {
		return new NextActionFilterExpression(
			this.groups.map((group) =>
				group.withCriteriaPruned(validEnvironments, validProperties),
			),
		);
	}

	matches<T>(action: NextAction<T>, classifier: ContextClassifier, today: string): boolean {
		if (action.blocked) return false;
		return this.groups.some((group) => group.matches(action, classifier, today));
	}
}
