import { NextActionFilterExpression } from './NextActionFilterExpression';

export class SavedNextActionsFilter {
	readonly id: string;
	readonly name: string;
	readonly expression: NextActionFilterExpression;

	constructor(id: string, name: string, expression: NextActionFilterExpression) {
		if (id.trim() === '') throw new Error('保存フィルターの ID が必要です');
		if (name.trim() === '') throw new Error('保存フィルター名が必要です');
		this.id = id;
		this.name = name.trim();
		this.expression = expression;
	}

	static from(value: unknown): SavedNextActionsFilter | null {
		if (typeof value !== 'object' || value == null) return null;
		const obj = value as Record<string, unknown>;
		const id = obj['id'];
		const name = obj['name'];
		const expression = NextActionFilterExpression.from(obj['expression']);
		if (typeof id !== 'string' || typeof name !== 'string' || expression == null) return null;
		return new SavedNextActionsFilter(id, name, expression);
	}

	get serialized(): {
		readonly id: string;
		readonly name: string;
		readonly expression: NextActionFilterExpression['serialized'];
	} {
		return {
			id: this.id,
			name: this.name,
			expression: this.expression.serialized,
		};
	}
}
