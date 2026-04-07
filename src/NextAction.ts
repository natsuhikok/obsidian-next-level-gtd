export class NextAction<T> {
	constructor(
		readonly source: T,
		readonly text: string,
		readonly blocked: boolean,
		readonly scheduled: string | null,
		readonly due: string | null,
		readonly context: readonly string[],
		private readonly today: string,
	) {}

	get available(): boolean {
		return !this.blocked && (this.scheduled !== null ? this.scheduled <= this.today : true);
	}
}
