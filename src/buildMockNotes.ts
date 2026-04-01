export const MOCK_FOLDER = 'GTD-Mock';

interface MockNote {
	readonly path: string;
	readonly content: string;
}

function randomId(): string {
	return Math.random().toString(36).slice(2, 10);
}

export function buildMockNotes(): readonly MockNote[] {
	const id = () => randomId();
	return [
		// 1. Inbox notes (no frontmatter) – for Inbox view testing
		{
			path: `${MOCK_FOLDER}/inbox-${id()}.md`,
			content: 'Inbox note without classification.\n',
		},
		{ path: `${MOCK_FOLDER}/inbox-${id()}.md`, content: 'Another inbox note.\n' },
		{ path: `${MOCK_FOLDER}/inbox-${id()}.md`, content: 'Third inbox note.\n' },

		// 2. Reference note – for init / classify testing
		{
			path: `${MOCK_FOLDER}/reference-${id()}.md`,
			content: '---\nclassification: Reference\n---\nA reference note.\n',
		},

		// 3. Actionable notes with various statuses – for status bar / command testing
		{
			path: `${MOCK_FOLDER}/actionable-inprogress-${id()}.md`,
			content:
				'---\nclassification: Actionable\nstatus: 進行中\n---\nThis actionable is in progress.\n',
		},
		{
			path: `${MOCK_FOLDER}/actionable-onhold-${id()}.md`,
			content:
				'---\nclassification: Actionable\nstatus: 保留\n---\nThis actionable is on hold.\n',
		},
		{
			path: `${MOCK_FOLDER}/actionable-completed-${id()}.md`,
			content:
				'---\nclassification: Actionable\nstatus: 完了\n---\nThis actionable is completed.\n',
		},
		{
			path: `${MOCK_FOLDER}/actionable-abandoned-${id()}.md`,
			content:
				'---\nclassification: Actionable\nstatus: 廃止\n---\nThis actionable is abandoned.\n',
		},

		// 4. Alert test notes
		// A: Reference with next action → alertReferenceHasNextAction
		{
			path: `${MOCK_FOLDER}/alert-A-reference-task-${id()}.md`,
			content: '---\nclassification: Reference\n---\n- [ ] タスク\n',
		},
		// B: Actionable / 進行中 with no checkbox → alertActionableInProgressNoNextAction
		{
			path: `${MOCK_FOLDER}/alert-B-inprogress-notask-${id()}.md`,
			content: '---\nclassification: Actionable\nstatus: 進行中\n---\nチェックボックスなし\n',
		},
		// C: Actionable / 完了 with remaining next action → alertActionableDoneHasNextAction
		{
			path: `${MOCK_FOLDER}/alert-C-completed-task-${id()}.md`,
			content: '---\nclassification: Actionable\nstatus: 完了\n---\n- [ ] 残タスク\n',
		},
		// D: No frontmatter → alertFrontmatterInvalid (treated as inbox)
		{
			path: `${MOCK_FOLDER}/alert-D-nofrontmatter-${id()}.md`,
			content: 'No frontmatter at all.\n',
		},
	];
}
