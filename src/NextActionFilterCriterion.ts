import type { ContextClassifier } from './ContextClassifier';
import type { NextAction } from './NextActionCollection';

type CriterionKind =
	| 'environment'
	| 'property'
	| 'noEnvironment'
	| 'noProperty'
	| 'actionable'
	| 'withDate'
	| 'never';

export class NextActionFilterCriterion {
	readonly kind: CriterionKind;
	readonly value: string | null;

	constructor(kind: CriterionKind, value: string | null = null) {
		if ((kind === 'environment' || kind === 'property') && value == null) {
			throw new Error('タグ条件には値が必要です');
		}
		if (kind !== 'environment' && kind !== 'property' && value != null) {
			throw new Error('この条件には値を指定できません');
		}
		this.kind = kind;
		this.value = value?.toLowerCase() ?? null;
	}

	static from(value: unknown): NextActionFilterCriterion | null {
		if (typeof value !== 'object' || value == null) return null;
		const obj = value as Record<string, unknown>;
		const kind = obj['kind'];
		const criterionValue = obj['value'];
		if (
			kind !== 'environment' &&
			kind !== 'property' &&
			kind !== 'noEnvironment' &&
			kind !== 'noProperty' &&
			kind !== 'actionable' &&
			kind !== 'withDate' &&
			kind !== 'never'
		) {
			return null;
		}
		if (kind === 'environment' || kind === 'property') {
			return typeof criterionValue === 'string'
				? new NextActionFilterCriterion(kind, criterionValue)
				: null;
		}
		return new NextActionFilterCriterion(kind);
	}

	get serialized(): { readonly kind: CriterionKind; readonly value?: string } {
		return this.value == null ? { kind: this.kind } : { kind: this.kind, value: this.value };
	}

	hasSameIdentity(other: NextActionFilterCriterion): boolean {
		return this.kind === other.kind && this.value === other.value;
	}

	matches<T>(action: NextAction<T>, classifier: ContextClassifier, today: string): boolean {
		if (this.kind === 'environment') {
			return classifier
				.environmentTagsOf(action)
				.map((tag) => tag.toLowerCase())
				.includes(this.value ?? '');
		}
		if (this.kind === 'property') {
			return classifier
				.propertyTagsOf(action)
				.map((tag) => tag.toLowerCase())
				.includes(this.value ?? '');
		}
		if (this.kind === 'noEnvironment') return classifier.isNoEnvironmentContext(action);
		if (this.kind === 'noProperty') return classifier.propertyTagsOf(action).length === 0;
		if (this.kind === 'withDate') return action.scheduled !== null || action.due !== null;
		if (this.kind === 'never') return false;
		return action.scheduled !== null ? action.scheduled <= today : true;
	}
}
