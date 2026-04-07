import { AlertType } from './AlertType';
import { Status } from './Status';

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

	alerts(hasNextAction: boolean, hasTodayOrFutureScheduled: boolean): readonly AlertType[] {
		if (this.isInbox || this.isInvalid) {
			return ['frontmatterInvalid'];
		}

		if (this.isReference) {
			return hasNextAction ? ['referenceHasNextAction'] : [];
		}

		return [
			...(this.status === '進行中' && !hasNextAction
				? ['actionableInProgressNoNextAction' as const]
				: []),
			...((this.status === '完了' || this.status === '廃止') && hasNextAction
				? ['actionableDoneHasNextAction' as const]
				: []),
			...(this.status === '休眠' && !hasTodayOrFutureScheduled
				? ['dormantNoFutureScheduledNextAction' as const]
				: []),
		];
	}
}
