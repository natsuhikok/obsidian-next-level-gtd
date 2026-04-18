import { describe, expect, it } from 'vitest';
import { ALL_STATUSES } from './types';

describe('ALL_STATUSES', () => {
	it('選択可能な status に休眠を含まない', () => {
		expect(ALL_STATUSES).not.toContain('休眠');
	});
});
