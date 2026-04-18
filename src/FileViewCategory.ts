import { GTDNote } from './GTDNote';
import { Status } from './types';

type FileViewCategoryId = 'inbox' | 'inProgress' | 'onHold' | 'reference' | 'all';

export class FileViewCategory {
	private constructor(
		readonly id: FileViewCategoryId,
		private readonly status: Status | null = null,
	) {}

	static inbox(): FileViewCategory {
		return new FileViewCategory('inbox');
	}

	static inProgress(): FileViewCategory {
		return new FileViewCategory('inProgress', '進行中');
	}

	static onHold(): FileViewCategory {
		return new FileViewCategory('onHold', '保留');
	}

	static reference(): FileViewCategory {
		return new FileViewCategory('reference');
	}

	static all(): FileViewCategory {
		return new FileViewCategory('all');
	}

	matches(note: GTDNote): boolean {
		if (this.id === 'all') return true;
		if (this.id === 'inbox') return note.state.isInbox;
		if (this.id === 'reference') return note.state.isReference;
		return note.state.isActionable && note.state.status === this.status;
	}
}
