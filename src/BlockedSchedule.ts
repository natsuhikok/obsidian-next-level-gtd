export class BlockedSchedule {
	constructor(
		readonly actionScheduled: string | null,
		readonly blockerSchedules: readonly (string | null)[],
	) {}

	get isInconsistent() {
		const actionScheduled = this.actionScheduled;
		if (actionScheduled === null) {
			return false;
		}

		return this.blockerSchedules.some(
			(blockerSchedule) => blockerSchedule === null || blockerSchedule > actionScheduled,
		);
	}
}
