import { App } from 'obsidian';

const MOCK_FOLDER = 'GTD-Mock';

interface MockNote {
	readonly path: string;
	readonly content: string;
}

function randomId(): string {
	return Math.random().toString(36).slice(2, 10);
}

function buildNoteTemplates(): readonly MockNote[] {
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
		// E: Reference with next action only inside a fenced code block → no alert expected
		{
			path: `${MOCK_FOLDER}/alert-E-codeblock-task-${id()}.md`,
			content:
				'---\nclassification: Reference\n---\n通常テキスト（next action なし）\n\n```js\n// - [ ] これはコードブロック内なので無視される\n```\n',
		},
		// F: Actionable / 進行中 with multiple unchecked tasks → for cancel-all-next-actions command testing
		{
			path: `${MOCK_FOLDER}/cancel-all-test-${id()}.md`,
			content:
				'---\nclassification: Actionable\nstatus: 進行中\n---\n- [ ] タスク1\n- [ ] タスク2\n- [x] 完了済みタスク\n- [-] 中止済みタスク\n',
		},

		// G: Context filter testing – tasks with various context tags
		{
			path: `${MOCK_FOLDER}/context-office-${id()}.md`,
			content:
				'---\nclassification: Actionable\nstatus: 進行中\n---\n- [ ] 書類を提出する #office\n- [ ] 会議室を予約する #office #電話\n',
		},
		{
			path: `${MOCK_FOLDER}/context-home-${id()}.md`,
			content:
				'---\nclassification: Actionable\nstatus: 進行中\n---\n- [ ] 掃除をする #home\n- [ ] 買い物リストを作る #home\n',
		},
		{
			path: `${MOCK_FOLDER}/context-phone-${id()}.md`,
			content:
				'---\nclassification: Actionable\nstatus: 進行中\n---\n- [ ] 担当者に電話する #電話\n- [ ] 見積もりを依頼する #電話 #office\n',
		},
		{
			path: `${MOCK_FOLDER}/context-none-${id()}.md`,
			content:
				'---\nclassification: Actionable\nstatus: 進行中\n---\n- [ ] context なしのタスクA\n- [ ] context なしのタスクB\n',
		},

		// H: Scheduled filter testing – tasks with ⏳ scheduled dates
		{
			path: `${MOCK_FOLDER}/scheduled-past-${id()}.md`,
			content:
				'---\nclassification: Actionable\nstatus: 進行中\n---\n- [ ] 過去にスケジュールされたタスク ⏳ 2026-03-15 #office\n- [ ] スケジュールなしのタスク #office\n',
		},
		{
			path: `${MOCK_FOLDER}/scheduled-today-${id()}.md`,
			content:
				'---\nclassification: Actionable\nstatus: 進行中\n---\n- [ ] 今日のタスク ⏳ 2026-04-03\n- [ ] 別の今日のタスク ⏳ 2026-04-03 #home\n',
		},
		{
			path: `${MOCK_FOLDER}/scheduled-future-${id()}.md`,
			content:
				'---\nclassification: Actionable\nstatus: 進行中\n---\n- [ ] 来週のタスク ⏳ 2026-04-10 #仕事\n- [ ] 来月のタスク ⏳ 2026-05-01\n',
		},
		{
			path: `${MOCK_FOLDER}/due-date-${id()}.md`,
			content:
				'---\nclassification: Actionable\nstatus: 進行中\n---\n- [ ] 期限付きタスク 📅 2026-04-05 #office\n- [ ] 別の期限付きタスク 📅 2026-04-20\n',
		},
	];
}

export class MockNoteBuilder {
	constructor(private readonly app: App) {}

	async build(): Promise<number> {
		const folderExists = await this.app.vault.adapter.exists(MOCK_FOLDER);
		if (!folderExists) await this.app.vault.createFolder(MOCK_FOLDER);
		const notes = buildNoteTemplates();
		await Promise.all(
			notes.map(async ({ path, content }) => {
				const exists = await this.app.vault.adapter.exists(path);
				if (!exists) await this.app.vault.create(path, content);
			}),
		);
		return notes.length;
	}
}
