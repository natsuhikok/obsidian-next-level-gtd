import { AlertType, Status } from './types';

function isValidStatus(value: unknown): value is Status {
	return (
		value === '進行中' ||
		value === '保留' ||
		value === '休眠' ||
		value === '完了' ||
		value === '廃止'
	);
}

export class NoteState {
	readonly kind: 'inbox' | 'reference' | 'actionable' | 'invalid';
	readonly status: Status | null;

	private constructor(kind: NoteState['kind'], status: Status | null = null) {
		this.kind = kind;
		this.status = status;
	}

	static parse(fm: Record<string, unknown> | null | undefined): NoteState {
		const c = fm?.['classification'];
		if (c === 'Reference') return new NoteState('reference');
		if (c === 'Actionable') {
			const s = fm?.['status'];
			return isValidStatus(s) ? new NoteState('actionable', s) : new NoteState('invalid');
		}
		return new NoteState('inbox');
	}

	get isInbox(): boolean {
		return this.kind === 'inbox';
	}

	get isReference(): boolean {
		return this.kind === 'reference';
	}

	get isActionable(): boolean {
		return this.kind === 'actionable';
	}

	get isInvalid(): boolean {
		return this.kind === 'invalid';
	}

	computeAlerts(
		noteHasNextAction: boolean,
		hasTodayOrFutureSchedulableNextAction: boolean,
		hasInconsistentBlockedScheduledNextAction: boolean = false,
	): readonly AlertType[] {
		if (this.isInbox || this.isInvalid) {
			return ['frontmatterInvalid'];
		}

		if (this.isReference) {
			return noteHasNextAction ? ['referenceHasNextAction'] : [];
		}

		return [
			...(this.status === '進行中' && !noteHasNextAction
				? ['actionableInProgressNoNextAction' as const]
				: []),
			...((this.status === '完了' || this.status === '廃止') && noteHasNextAction
				? ['actionableDoneHasNextAction' as const]
				: []),
			...(hasInconsistentBlockedScheduledNextAction
				? ['blockedScheduledNextActionHasInconsistentPrerequisiteSchedule' as const]
				: []),
			...(this.status === '休眠' && !hasTodayOrFutureSchedulableNextAction
				? ['dormantNoFutureScheduledNextAction' as const]
				: []),
		];
	}
}
