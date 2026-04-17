import type { ContextClassifier } from './ContextClassifier';
import { NextActionFilterCriterion } from './NextActionFilterCriterion';
import type { NextAction } from './NextActionCollection';

export class NextActionFilterGroup {
	readonly criteria: readonly NextActionFilterCriterion[];

	constructor(criteria: readonly NextActionFilterCriterion[]) {
		this.criteria = criteria.filter(
			(criterion, index, all) =>
				all.findIndex((candidate) => candidate.hasSameIdentity(criterion)) === index,
		);
	}

	static empty(): NextActionFilterGroup {
		return new NextActionFilterGroup([]);
	}

	static from(value: unknown): NextActionFilterGroup | null {
		if (typeof value !== 'object' || value == null) return null;
		const obj = value as Record<string, unknown>;
		const rawCriteria = obj['criteria'];
		if (!Array.isArray(rawCriteria)) return null;
		return new NextActionFilterGroup(
			rawCriteria
				.map((criterion) => NextActionFilterCriterion.from(criterion))
				.filter((criterion): criterion is NextActionFilterCriterion => criterion !== null),
		);
	}

	get serialized(): {
		readonly criteria: readonly {
			readonly kind: NextActionFilterCriterion['kind'];
			readonly value?: string;
		}[];
	} {
		return { criteria: this.criteria.map((criterion) => criterion.serialized) };
	}

	hasCriterion(criterion: NextActionFilterCriterion): boolean {
		return this.criteria.some((candidate) => candidate.hasSameIdentity(criterion));
	}

	withCriterionToggled(criterion: NextActionFilterCriterion): NextActionFilterGroup {
		if (this.hasCriterion(criterion)) {
			return new NextActionFilterGroup(
				this.criteria.filter((candidate) => !candidate.hasSameIdentity(criterion)),
			);
		}
		return new NextActionFilterGroup([...this.criteria, criterion]);
	}

	withCriteriaPruned(
		validEnvironments: readonly string[],
		validProperties: readonly string[],
	): NextActionFilterGroup {
		const environments = validEnvironments.map((environment) => environment.toLowerCase());
		const properties = validProperties.map((property) => property.toLowerCase());
		return new NextActionFilterGroup(
			this.criteria.filter((criterion) => {
				if (criterion.kind === 'environment') {
					return criterion.value != null && environments.includes(criterion.value);
				}
				if (criterion.kind === 'property') {
					return criterion.value != null && properties.includes(criterion.value);
				}
				return true;
			}),
		);
	}

	matches<T>(action: NextAction<T>, classifier: ContextClassifier, today: string): boolean {
		return this.criteria.every((criterion) => criterion.matches(action, classifier, today));
	}
}
