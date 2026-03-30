import { moment } from 'obsidian';

interface PluginStrings {
	// Commands
	openInboxViewCommand: string;
	openAlertViewCommand: string;
	setStatusInProgressCommand: string;
	setStatusOnHoldCommand: string;
	setStatusCompletedCommand: string;
	setStatusAbandonedCommand: string;
	changeStatusCommand: string;
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
	// UI labels
	classifyAsReference: string;
	classifyAsActionable: string;
	selectStatus: string;
	noInboxItems: string;
	noAlerts: string;
	refresh: string;
	openNote: string;
	// Modals
	confirmModalTitle: string;
	confirmModalExecute: string;
	confirmModalCancel: string;
	classifyModalTitle: string;
	statusModalTitle: string;
}

const en: PluginStrings = {
	openInboxViewCommand: 'Open Inbox',
	openAlertViewCommand: 'Open Alerts',
	setStatusInProgressCommand: 'Set status: In Progress',
	setStatusOnHoldCommand: 'Set status: On Hold',
	setStatusCompletedCommand: 'Set status: Completed',
	setStatusAbandonedCommand: 'Set status: Abandoned',
	changeStatusCommand: 'Change status',
	inboxViewTitle: 'GTD Inbox',
	alertViewTitle: 'GTD Alerts',
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
		'Set classification: Reference on all notes that have no classification.',
	settingInitButtonLabel: 'Initialize',
	settingInitConfirmMessage: 'notes have no classification. Set them all to Reference?',
	settingInitSuccessNotice: 'notes initialized as Reference.',
	classifyAsReference: 'Reference',
	classifyAsActionable: 'Actionable',
	selectStatus: 'Select status',
	noInboxItems: 'No unclassified notes.',
	noAlerts: 'No alerts.',
	refresh: 'Refresh',
	openNote: 'Open',
	confirmModalTitle: 'Confirm',
	confirmModalExecute: 'Execute',
	confirmModalCancel: 'Cancel',
	classifyModalTitle: 'Classify note',
	statusModalTitle: 'Change status',
};

const ja: PluginStrings = {
	openInboxViewCommand: 'Inbox を開く',
	openAlertViewCommand: 'アラートを開く',
	setStatusInProgressCommand: 'ステータスを設定: 進行中',
	setStatusOnHoldCommand: 'ステータスを設定: 保留',
	setStatusCompletedCommand: 'ステータスを設定: 完了',
	setStatusAbandonedCommand: 'ステータスを設定: 廃止',
	changeStatusCommand: 'ステータスを変更',
	inboxViewTitle: 'GTD Inbox',
	alertViewTitle: 'GTD アラート',
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
		'classification が未設定のノートすべてに classification: Reference を付与します。',
	settingInitButtonLabel: '初期化',
	settingInitConfirmMessage: '件のノートが未分類です。すべて Reference に設定しますか？',
	settingInitSuccessNotice: '件のノートを Reference に初期化しました。',
	classifyAsReference: 'Reference',
	classifyAsActionable: 'Actionable',
	selectStatus: 'ステータスを選択',
	noInboxItems: '未分類のノートはありません。',
	noAlerts: 'アラートはありません。',
	refresh: '更新',
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
