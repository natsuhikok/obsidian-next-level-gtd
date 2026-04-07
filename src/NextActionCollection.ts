import { NextAction } from './NextAction';

interface ListItem {
	readonly indent: number;
	readonly listType: 'bullet' | 'ordered';
	readonly checkboxState: 'unchecked' | 'checked' | 'cancelled' | null;
	readonly body: string;
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
	readonly item: ListItem;
	readonly children: readonly TreeNode[];
}

function takeChildren(parentIndent: number, items: readonly ListItem[]): number {
	const idx = items.findIndex((item) => item.indent <= parentIndent);
	return idx === -1 ? items.length : idx;
}

function buildTreeFromGroup(items: readonly ListItem[]): readonly TreeNode[] {
	if (items.length === 0) return [];
	const [first, ...rest] = items;
	if (!first) return [];
	const childCount = takeChildren(first.indent, rest);
	const childItems = rest.slice(0, childCount);
	const siblingItems = rest.slice(childCount);
	const node: TreeNode = {
		indent: first.indent,
		item: first,
		children: buildTreeFromGroup(childItems),
	};
	return [node, ...buildTreeFromGroup(siblingItems)];
}

function hasDescendantCheckbox(node: TreeNode): boolean {
	return node.children.some(
		(child) => child.item.checkboxState !== null || hasDescendantCheckbox(child),
	);
}

function isBlockedByPriorSibling(node: TreeNode, siblings: readonly TreeNode[]): boolean {
	if (node.item.listType !== 'ordered') return false;

	const idx = siblings.indexOf(node);
	return siblings
		.slice(0, idx)
		.some(
			(sibling) =>
				sibling.item.listType === 'ordered' && sibling.item.checkboxState === 'unchecked',
		);
}

const TAG_RE = /#([^\s#][^\s]*)/g;

function extractContexts(body: string): readonly string[] {
	return [...body.matchAll(TAG_RE)].map((m) => m[1]!).filter((tag) => tag !== 'temp');
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
		if (node.item.checkboxState !== 'unchecked') return childActions;
		if (/#temp\b/.test(node.item.body)) return childActions;

		const blockedByChildren = hasDescendantCheckbox(node);
		const blockedBySibling = isBlockedByPriorSibling(node, nodes);
		const blocked = blockedByChildren || blockedBySibling;

		const { scheduled, due } = extractDates(node.item.body);
		const context = extractContexts(node.item.body);

		return [
			new NextAction(source, node.item.body, blocked, scheduled, due, context, today),
			...childActions,
		];
	});
}

export class NextActionCollection<T> {
	readonly nextActions: readonly NextAction<T>[];

	constructor(
		entries: readonly { readonly source: T; readonly content: string }[],
		today: string,
	) {
		this.nextActions = entries.flatMap((entry) =>
			splitListGroups(entry.content).flatMap((items) => {
				const tree = buildTreeFromGroup(items);
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
