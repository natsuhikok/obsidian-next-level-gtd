import { moment } from 'obsidian';

interface PluginStrings {
	// Commands
	openInboxRibbon: string;
	openInboxViewCommand: string;
	setStatusInProgressCommand: string;
	setStatusOnHoldCommand: string;
	setStatusCompletedCommand: string;
	setStatusAbandonedCommand: string;
	changeStatusCommand: string;
	cancelAllNextActionsCommand: string;
	// View titles
	inboxViewTitle: string;
	alertViewTitle: string;
	// Classification labels
	classificationInbox: string;
	classificationReference: string;
	classificationActionable: string;
	// Status labels
	statusInProgress: string;
	statusOnHold: string;
	statusCompleted: string;
	statusAbandoned: string;
	// Alert messages
	alertReferenceHasNextAction: string;
	alertActionableInProgressNoNextAction: string;
	alertActionableDoneHasNextAction: string;
	alertFrontmatterInvalid: string;
	// Settings
	settingInitSectionName: string;
	settingInitSectionDesc: string;
	settingInitButtonLabel: string;
	settingInitConfirmMessage: string;
	settingInitSuccessNotice: string;
	settingDevHeading: string;
	settingGenerateMockSectionName: string;
	settingGenerateMockSectionDesc: string;
	settingGenerateMockButtonLabel: string;
	settingGenerateMockSuccessNotice: string;
	settingNextActionsSectionName: string;
	settingEvaluateStructuralBlockingName: string;
	settingEvaluateStructuralBlockingDesc: string;
	// Excluded folders settings
	settingExcludedFoldersSectionName: string;
	settingExcludedFoldersSectionDesc: string;
	settingExcludedFoldersPlaceholder: string;
	settingExcludedFoldersAddButton: string;
	settingExcludedFoldersRemoveButton: string;
	settingExcludedFoldersShowAlertBannerToggle: string;
	// Context order settings
	settingContextOrderSectionName: string;
	settingContextOrderSectionDesc: string;
	settingContextOrderPlaceholder: string;
	settingContextOrderAddButton: string;
	settingContextOrderMoveUpButton: string;
	settingContextOrderMoveDownButton: string;
	settingContextOrderRemoveButton: string;
	// Next Actions view
	nextActionsViewTitle: string;
	openNextActionsRibbon: string;
	openNextActionsViewCommand: string;
	noNextActions: string;
	pinNextAction: string;
	unpinNextAction: string;
	dateVisibilityNear: string;
	dateVisibilityAll: string;
	nextActionGroupPinned: string;
	nextActionGroupDated: string;
	nextActionGroupDefault: string;
	// Environment contexts settings
	settingEnvContextsSectionName: string;
	settingEnvContextsSectionDesc: string;
	settingEnvContextsPlaceholder: string;
	settingEnvContextsAddButton: string;
	settingEnvContextsRemoveButton: string;
	// UI labels
	classifyAsReference: string;
	classifyAsActionable: string;
	selectStatus: string;
	noInboxItems: string;
	noAlerts: string;
	noInboxOrAlerts: string;
	openNote: string;
	// Modals
	confirmModalTitle: string;
	confirmModalExecute: string;
	confirmModalCancel: string;
	classifyModalTitle: string;
	statusModalTitle: string;
}

const en: PluginStrings = {
	openInboxRibbon: 'Open GTD Inbox',
	openInboxViewCommand: 'Open Inbox',
	setStatusInProgressCommand: 'Set status: In Progress',
	setStatusOnHoldCommand: 'Set status: On Hold',
	setStatusCompletedCommand: 'Set status: Completed',
	setStatusAbandonedCommand: 'Set status: Abandoned',
	changeStatusCommand: 'Change status',
	cancelAllNextActionsCommand: 'Cancel all next actions',
	inboxViewTitle: 'Inbox',
	alertViewTitle: 'Alerts',
	classificationInbox: 'Inbox',
	classificationReference: 'Reference',
	classificationActionable: 'Actionable',
	statusInProgress: '進行中',
	statusOnHold: '保留',
	statusCompleted: '完了',
	statusAbandoned: '廃止',
	alertReferenceHasNextAction: 'Reference note has next action',
	alertActionableInProgressNoNextAction: 'In-progress Actionable has no next action',
	alertActionableDoneHasNextAction: 'Done/Abandoned Actionable has next action',
	alertFrontmatterInvalid: 'Invalid frontmatter (classification or status)',
	settingInitSectionName: 'Initialize Vault',
	settingInitSectionDesc:
		'Set classification: Reference on all notes that have no classification. Notes in excluded folders are skipped.',
	settingInitButtonLabel: 'Initialize',
	settingInitConfirmMessage: 'notes have no classification. Set them all to Reference?',
	settingInitSuccessNotice: 'notes initialized as Reference.',
	settingDevHeading: 'Development',
	settingGenerateMockSectionName: 'Generate Mock Data',
	settingGenerateMockSectionDesc:
		'Generate sample notes for manual testing. Notes are created in the GTD-Mock folder.',
	settingGenerateMockButtonLabel: 'Generate',
	settingGenerateMockSuccessNotice: 'mock notes generated.',
	settingNextActionsSectionName: 'Next Actions',
	settingEvaluateStructuralBlockingName: 'Evaluate structural blocking',
	settingEvaluateStructuralBlockingDesc:
		'Use parent-child checkbox relationships and ordered list sequence to hide blocked next actions.',
	settingExcludedFoldersSectionName: 'Excluded Folders',
	settingExcludedFoldersSectionDesc:
		'Notes in these folders are ignored by Inbox view and Initialize.',
	settingExcludedFoldersPlaceholder: 'Folder path',
	settingExcludedFoldersAddButton: 'Add',
	settingExcludedFoldersRemoveButton: 'Remove',
	settingExcludedFoldersShowAlertBannerToggle: 'Show alert banner',
	settingContextOrderSectionName: 'Context Display Order',
	settingContextOrderSectionDesc:
		'Manage the display order of context tags in Next Actions. This order applies to both environment and property contexts.',
	settingContextOrderPlaceholder: 'Tag name (without #)',
	settingContextOrderAddButton: 'Add',
	settingContextOrderMoveUpButton: 'Move up',
	settingContextOrderMoveDownButton: 'Move down',
	settingContextOrderRemoveButton: 'Remove',
	nextActionsViewTitle: 'Next Actions',
	openNextActionsRibbon: 'Open GTD Next Actions',
	openNextActionsViewCommand: 'Open Next Actions',
	noNextActions: 'No available next actions.',
	pinNextAction: 'Pin',
	unpinNextAction: 'Unpin',
	dateVisibilityNear: 'Show near dates only',
	dateVisibilityAll: 'Show all dates',
	nextActionGroupPinned: 'Pinned',
	nextActionGroupDated: 'Dated',
	nextActionGroupDefault: 'Default',
	settingEnvContextsSectionName: 'Environment Contexts',
	settingEnvContextsSectionDesc:
		'Tags that represent physical or situational environments (e.g. home, office). Tags not listed here are treated as property contexts.',
	settingEnvContextsPlaceholder: 'Tag name (without #)',
	settingEnvContextsAddButton: 'Add',
	settingEnvContextsRemoveButton: 'Remove',
	classifyAsReference: 'Reference',
	classifyAsActionable: 'Actionable',
	selectStatus: 'Select status',
	noInboxItems: 'No unclassified notes.',
	noAlerts: 'No alerts.',
	noInboxOrAlerts: 'No inbox or alert items.',
	openNote: 'Open',
	confirmModalTitle: 'Confirm',
	confirmModalExecute: 'Execute',
	confirmModalCancel: 'Cancel',
	classifyModalTitle: 'Classify note',
	statusModalTitle: 'Change status',
};

const ja: PluginStrings = {
	openInboxRibbon: 'GTD Inbox を開く',
	openInboxViewCommand: 'Inbox を開く',
	setStatusInProgressCommand: 'ステータスを設定: 進行中',
	setStatusOnHoldCommand: 'ステータスを設定: 保留',
	setStatusCompletedCommand: 'ステータスを設定: 完了',
	setStatusAbandonedCommand: 'ステータスを設定: 廃止',
	changeStatusCommand: 'ステータスを変更',
	cancelAllNextActionsCommand: 'すべての next action を中止にする',
	inboxViewTitle: 'Inbox',
	alertViewTitle: 'Alerts',
	classificationInbox: 'Inbox',
	classificationReference: 'Reference',
	classificationActionable: 'Actionable',
	statusInProgress: '進行中',
	statusOnHold: '保留',
	statusCompleted: '完了',
	statusAbandoned: '廃止',
	alertReferenceHasNextAction: 'Reference ノートに next action があります',
	alertActionableInProgressNoNextAction: '進行中の Actionable に next action がありません',
	alertActionableDoneHasNextAction: '完了/廃止の Actionable に next action があります',
	alertFrontmatterInvalid: 'frontmatter の分類または状態が不正です',
	settingInitSectionName: 'Vault の初期化',
	settingInitSectionDesc:
		'classification が未設定のノートすべてに classification: Reference を付与します。除外フォルダ内のノートはスキップします。',
	settingInitButtonLabel: '初期化',
	settingInitConfirmMessage: '件のノートが未分類です。すべて Reference に設定しますか？',
	settingInitSuccessNotice: '件のノートを Reference に初期化しました。',
	settingDevHeading: '開発用',
	settingGenerateMockSectionName: 'モックデータの生成',
	settingGenerateMockSectionDesc:
		'手動テスト用のサンプルノートを生成します。ノートは GTD-Mock フォルダに作成されます。',
	settingGenerateMockButtonLabel: '生成',
	settingGenerateMockSuccessNotice: '件のモックノートを生成しました。',
	settingNextActionsSectionName: 'ネクストアクション',
	settingEvaluateStructuralBlockingName: '構造的なブロックを判定する',
	settingEvaluateStructuralBlockingDesc:
		'親子チェックボックスと順序リストの並びを使って、ブロックされたネクストアクションを非表示にします。',
	settingExcludedFoldersSectionName: '除外フォルダ',
	settingExcludedFoldersSectionDesc:
		'これらのフォルダ内のノートは Inbox ビューと初期化の対象から除外されます。',
	settingExcludedFoldersPlaceholder: 'フォルダパス',
	settingExcludedFoldersAddButton: '追加',
	settingExcludedFoldersRemoveButton: '削除',
	settingExcludedFoldersShowAlertBannerToggle: 'アラートバナーを表示する',
	settingContextOrderSectionName: 'コンテキストの表示順',
	settingContextOrderSectionDesc:
		'ネクストアクションでのコンテキストタグの表示順を管理します。この順序は環境コンテキストと性質コンテキストの両方に適用されます。',
	settingContextOrderPlaceholder: 'タグ名（# 不要）',
	settingContextOrderAddButton: '追加',
	settingContextOrderMoveUpButton: '上へ移動',
	settingContextOrderMoveDownButton: '下へ移動',
	settingContextOrderRemoveButton: '削除',
	nextActionsViewTitle: 'ネクストアクション',
	openNextActionsRibbon: 'GTD ネクストアクションを開く',
	openNextActionsViewCommand: 'ネクストアクションを開く',
	noNextActions: '利用可能なネクストアクションはありません。',
	pinNextAction: 'ピン留め',
	unpinNextAction: 'ピン留めを解除',
	dateVisibilityNear: '近い日付のみ表示',
	dateVisibilityAll: 'すべての日付を表示',
	nextActionGroupPinned: 'ピン留め',
	nextActionGroupDated: '日付あり',
	nextActionGroupDefault: 'デフォルト',
	settingEnvContextsSectionName: '環境コンテキスト',
	settingEnvContextsSectionDesc:
		'物理的・状況的な環境を表すタグ（例: home, office）。ここに登録されていないタグは性質コンテキストとして扱われます。',
	settingEnvContextsPlaceholder: 'タグ名（# 不要）',
	settingEnvContextsAddButton: '追加',
	settingEnvContextsRemoveButton: '削除',
	classifyAsReference: 'Reference',
	classifyAsActionable: 'Actionable',
	selectStatus: 'ステータスを選択',
	noInboxItems: '未分類のノートはありません。',
	noAlerts: 'アラートはありません。',
	noInboxOrAlerts: 'Inbox もアラートもありません。',
	openNote: '開く',
	confirmModalTitle: '確認',
	confirmModalExecute: '実行',
	confirmModalCancel: 'キャンセル',
	classifyModalTitle: 'ノートを分類',
	statusModalTitle: 'ステータスを変更',
};

export function t<K extends keyof PluginStrings>(key: K): PluginStrings[K] {
	const locale = moment.locale();
	return ({ en, ja }[locale] ?? en)[key];
}
