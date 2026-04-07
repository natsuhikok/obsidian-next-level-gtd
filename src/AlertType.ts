export type AlertType =
	| 'referenceHasNextAction'
	| 'actionableInProgressNoNextAction'
	| 'actionableDoneHasNextAction'
	| 'dormantNoFutureScheduledNextAction'
	| 'frontmatterInvalid';
