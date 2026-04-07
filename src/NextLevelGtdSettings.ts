import { ExcludedFolder } from './ExcludedFolder';

export class NextLevelGtdSettings {
	static readonly default = new NextLevelGtdSettings(null, []);

	constructor(
		readonly _placeholder: null,
		readonly excludedFolders: readonly ExcludedFolder[],
	) {}
}
