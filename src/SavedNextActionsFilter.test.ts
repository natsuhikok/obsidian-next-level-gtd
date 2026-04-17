import { describe, expect, it } from 'vitest';
import { NextActionFilterCriterion } from './NextActionFilterCriterion';
import { NextActionFilterExpression } from './NextActionFilterExpression';
import { NextActionFilterGroup } from './NextActionFilterGroup';
import { SavedNextActionsFilter } from './SavedNextActionsFilter';

describe('SavedNextActionsFilter', () => {
	it('保存したフィルター名と条件式を復元できる', () => {
		const saved = new SavedNextActionsFilter(
			'filter-1',
			'Home Quick',
			new NextActionFilterExpression([
				new NextActionFilterGroup([
					new NextActionFilterCriterion('environment', 'home'),
					new NextActionFilterCriterion('property', 'quick'),
				]),
			]),
		);

		const restored = SavedNextActionsFilter.from(saved.serialized);

		expect(restored?.id).toBe('filter-1');
		expect(restored?.name).toBe('Home Quick');
		expect(restored?.expression.groups[0]?.criteria.map((criterion) => criterion.kind)).toEqual(
			['environment', 'property'],
		);
	});
});
