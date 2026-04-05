export type Status = '進行中' | '保留' | '完了' | '廃止';

export interface ExcludedFolder {
	readonly folder: string;
	readonly showAlertBanner: boolean;
}

export const ALL_STATUSES: readonly Status[] = ['進行中', '保留', '完了', '廃止'];

export type AlertType =
	| 'referenceHasNextAction'
	| 'actionableInProgressNoNextAction'
	| 'actionableDoneHasNextAction'
	| 'frontmatterInvalid';
