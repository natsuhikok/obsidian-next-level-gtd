import { NoteState } from './NoteState';
import { AlertType } from './types';

export function detectNoteAlerts(
	state: NoteState,
	noteHasNextAction: boolean,
	hasTodayOrFutureScheduledNextAction: boolean,
): readonly AlertType[] {
	if (state.isInbox || state.isInvalid) {
		return ['frontmatterInvalid'];
	}

	if (state.isReference) {
		return noteHasNextAction ? ['referenceHasNextAction'] : [];
	}

	return [
		...(state.status === '進行中' && !noteHasNextAction
			? ['actionableInProgressNoNextAction' as const]
			: []),
		...((state.status === '完了' || state.status === '廃止') && noteHasNextAction
			? ['actionableDoneHasNextAction' as const]
			: []),
		...(state.status === '休眠' && !hasTodayOrFutureScheduledNextAction
			? ['dormantNoFutureScheduledNextAction' as const]
			: []),
	];
}
