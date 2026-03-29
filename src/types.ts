export type Classification = 'Reference' | 'Actionable';

export type Status = '進行中' | '保留' | '完了' | '廃止';

export type AlertType =
	| 'referenceHasNextAction'
	| 'actionableInProgressNoNextAction'
	| 'actionableDoneHasNextAction'
	| 'frontmatterInvalid';

export interface Alert {
	readonly filePath: string;
	readonly fileName: string;
	readonly types: readonly AlertType[];
}
