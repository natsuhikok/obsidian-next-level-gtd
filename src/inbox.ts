import { Classification, Status } from './types';

export function isValidClassification(value: unknown): value is Classification {
	return value === 'Reference' || value === 'Actionable';
}

export function isValidStatus(value: unknown): value is Status {
	return value === '進行中' || value === '保留' || value === '完了' || value === '廃止';
}

export function isInbox(frontmatter: Record<string, unknown> | null | undefined): boolean {
	if (frontmatter == null) return true;
	return !isValidClassification(frontmatter['classification']);
}
