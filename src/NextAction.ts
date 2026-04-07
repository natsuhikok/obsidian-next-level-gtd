export interface NextAction<T> {
	readonly source: T;
	readonly text: string;
	readonly blocked: boolean;
	readonly scheduled: string | null;
	readonly due: string | null;
	readonly available: boolean;
	readonly context: readonly string[];
}
