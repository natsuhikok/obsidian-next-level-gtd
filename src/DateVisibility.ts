export class DateVisibility {
	constructor(readonly mode: 'near' | 'all') {}

	static initial(): DateVisibility {
		return new DateVisibility('near');
	}

	withMode(mode: 'near' | 'all'): DateVisibility {
		return new DateVisibility(mode);
	}

	allows(scheduled: string | null, today: string): boolean {
		return this.mode === 'all' || scheduled === null || scheduled <= today;
	}
}
