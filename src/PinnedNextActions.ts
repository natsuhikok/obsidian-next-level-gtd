export class PinnedNextActions {
	constructor(readonly ids: readonly string[]) {}

	includes(id: string): boolean {
		return this.ids.includes(id);
	}

	toggled(id: string): PinnedNextActions {
		return this.includes(id)
			? new PinnedNextActions(this.ids.filter((pinnedId) => pinnedId !== id))
			: new PinnedNextActions([...this.ids, id]);
	}

	prunedTo(activeIds: readonly string[]): PinnedNextActions {
		return new PinnedNextActions(this.ids.filter((id) => activeIds.includes(id)));
	}

	equals(ids: readonly string[]): boolean {
		return this.ids.length === ids.length && this.ids.every((id, index) => id === ids[index]);
	}
}
