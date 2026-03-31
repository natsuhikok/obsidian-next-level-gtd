import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import NextLevelGtdPlugin from './main';
import { t } from './i18n';
import { NoteState } from './NoteState';
import { setNoteState } from './setNoteState';
import { ConfirmModal } from './ui/ConfirmModal';

const MOCK_FOLDER = 'GTD-Mock';

function randomId(): string {
	return Math.random().toString(36).slice(2, 10);
}

interface MockNote {
	readonly path: string;
	readonly content: string;
}

function buildMockNotes(): readonly MockNote[] {
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

export interface NextLevelGtdSettings {
	_placeholder: null;
}

export const DEFAULT_SETTINGS: NextLevelGtdSettings = {
	_placeholder: null,
};

export class NextLevelGtdSettingTab extends PluginSettingTab {
	readonly plugin: NextLevelGtdPlugin;

	constructor(app: App, plugin: NextLevelGtdPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName(t('settingInitSectionName'))
			.setDesc(t('settingInitSectionDesc'))
			.addButton((btn) =>
				btn.setButtonText(t('settingInitButtonLabel')).onClick(() => {
					const targets = this.app.vault
						.getMarkdownFiles()
						.filter(
							(f) =>
								NoteState.parse(
									this.app.metadataCache.getFileCache(f)?.frontmatter ?? null,
								).isInbox,
						);
					const count = targets.length;
					const message = `${count} ${t('settingInitConfirmMessage')}`;
					new ConfirmModal(this.app, message, () => {
						void Promise.all(
							targets.map((f) => setNoteState(this.app, f, 'reference')),
						).then(() => {
							new Notice(`${count} ${t('settingInitSuccessNotice')}`);
						});
					}).open();
				}),
			);

		new Setting(containerEl)
			.setName(t('settingGenerateMockSectionName'))
			.setDesc(t('settingGenerateMockSectionDesc'))
			.addButton((btn) =>
				btn.setButtonText(t('settingGenerateMockButtonLabel')).onClick(async () => {
					const folderExists = await this.app.vault.adapter.exists(MOCK_FOLDER);
					if (!folderExists) await this.app.vault.createFolder(MOCK_FOLDER);
					const notes = buildMockNotes();
					await Promise.all(
						notes.map(async ({ path, content }) => {
							const exists = await this.app.vault.adapter.exists(path);
							if (!exists) await this.app.vault.create(path, content);
						}),
					);
					new Notice(`${notes.length} ${t('settingGenerateMockSuccessNotice')}`);
				}),
			);
	}
}
