export type Status = '進行中' | '保留' | '完了' | '廃止';

export const ALL_STATUSES: readonly Status[] = ['進行中', '保留', '完了', '廃止'];

export type AlertType =
	| 'referenceHasNextAction'
	| 'actionableInProgressNoNextAction'
	| 'actionableDoneHasNextAction'
	| 'frontmatterInvalid';

export type ExcludedFolder = { readonly path: string; readonly showAlert: boolean };
