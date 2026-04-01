export interface NextAction<T> {
	readonly source: T;
	readonly text: string;
	readonly blocked: boolean;
	readonly scheduled: string | null;
	readonly due: string | null;
	readonly available: boolean;
}

interface ListItem {
	readonly indent: number;
	readonly listType: 'bullet' | 'ordered';
	readonly checkboxState: 'unchecked' | 'checked' | 'cancelled' | null;
	readonly body: string;
	readonly children: ListItem[];
}

function stripCodeSpans(content: string): string {
	return content
		.replace(/```[\s\S]*?```/g, '')
		.replace(/~~~[\s\S]*?~~~/g, '')
		.replace(/`[^`\n]+`/g, '');
}

const LIST_LINE_RE = /^(\s*)([-*+]|\d+\.)\s+(?:\[([ xX-])\]\s*)?(.*)/;
const SCHEDULED_RE = /⏳ (\d{4}-\d{2}-\d{2})/;
const DUE_RE = /📅 (\d{4}-\d{2}-\d{2})/;

function parseLine(line: string): ListItem | null {
	const m = LIST_LINE_RE.exec(line);
	if (!m) return null;
	const [, indent, marker, checkbox, body] = m;
	const checkboxState =
		checkbox === ' '
			? ('unchecked' as const)
			: checkbox === '-'
				? ('cancelled' as const)
				: checkbox !== undefined
					? ('checked' as const)
					: null;
	return {
		indent: indent!.length,
		listType: /^\d+\.$/.test(marker!) ? 'ordered' : 'bullet',
		checkboxState,
		body: body!,
		children: [],
	};
}

function splitListGroups(content: string): readonly (readonly ListItem[])[] {
	const { groups, current } = stripCodeSpans(content)
		.split('\n')
		.reduce<{
			readonly groups: readonly (readonly ListItem[])[];
			readonly current: readonly ListItem[];
		}>(
			(acc, line) => {
				const item = parseLine(line);
				if (item) return { ...acc, current: [...acc.current, item] };
				if (acc.current.length === 0) return acc;
				return { groups: [...acc.groups, acc.current], current: [] };
			},
			{ groups: [], current: [] },
		);
	return current.length > 0 ? [...groups, current] : groups;
}

interface TreeNode {
	readonly indent: number;
	readonly item: ListItem | null;
	readonly children: TreeNode[];
}

function buildTree(items: readonly ListItem[]): readonly TreeNode[] {
	const root: TreeNode = { indent: -1, item: null, children: [] };
	const stack: TreeNode[] = [root];

	for (const item of items) {
		const node: TreeNode = { indent: item.indent, item, children: [] };
		while (stack.length > 1 && stack[stack.length - 1]!.indent >= item.indent) {
			stack.pop();
		}
		stack[stack.length - 1]!.children.push(node);
		stack.push(node);
	}

	return root.children;
}

function hasDescendantCheckbox(node: TreeNode): boolean {
	return node.children.some(
		(child) => child.item?.checkboxState !== null || hasDescendantCheckbox(child),
	);
}

function isBlockedByPriorSibling(node: TreeNode, siblings: readonly TreeNode[]): boolean {
	if (node.item?.listType !== 'ordered') return false;

	const idx = siblings.indexOf(node);
	for (let i = idx - 1; i >= 0; i--) {
		const sibling = siblings[i]!;
		if (sibling.item?.listType !== 'ordered') break;
		if (sibling.item?.checkboxState === 'unchecked') return true;
	}
	return false;
}

function extractDates(body: string): { scheduled: string | null; due: string | null } {
	const scheduledMatch = SCHEDULED_RE.exec(body);
	const dueMatch = DUE_RE.exec(body);
	return scheduledMatch
		? { scheduled: scheduledMatch[1]!, due: null }
		: { scheduled: null, due: dueMatch?.[1] ?? null };
}

function collectFromNodes<T>(
	nodes: readonly TreeNode[],
	source: T,
	today: string,
): readonly NextAction<T>[] {
	return nodes.flatMap((node) => {
		const childActions = collectFromNodes(node.children, source, today);
		if (!node.item || node.item.checkboxState !== 'unchecked') return childActions;
		if (/#temp\b/.test(node.item.body)) return childActions;

		const blockedByChildren = hasDescendantCheckbox(node);
		const blockedBySibling = isBlockedByPriorSibling(node, nodes);
		const blocked = blockedByChildren || blockedBySibling;

		const { scheduled, due } = extractDates(node.item.body);

		const available = !blocked && (scheduled !== null ? scheduled <= today : true);

		return [
			{ source, text: node.item.body, blocked, scheduled, due, available },
			...childActions,
		];
	});
}

export interface ContentEntry<T> {
	readonly source: T;
	readonly content: string;
}

export class NextActionCollection<T> {
	readonly nextActions: readonly NextAction<T>[];

	constructor(entries: readonly ContentEntry<T>[], today: string) {
		this.nextActions = entries.flatMap((entry) =>
			splitListGroups(entry.content).flatMap((items) => {
				const tree = buildTree(items);
				return collectFromNodes(tree, entry.source, today);
			}),
		);
	}

	get hasNextAction(): boolean {
		return this.nextActions.length > 0;
	}

	get availableActions(): readonly NextAction<T>[] {
		return this.nextActions.filter((a) => a.available);
	}
}
