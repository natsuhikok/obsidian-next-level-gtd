import { TFile } from 'obsidian';

export class RecentFileHistory {
	static readonly maxFileCount = 30;
	readonly filePaths: readonly string[];

	constructor(filePaths: readonly string[]) {
		const normalizedFilePaths = filePaths
			.map((filePath) => filePath.trim())
			.filter((filePath) => filePath !== '')
			.filter((filePath, index, paths) => paths.indexOf(filePath) === index);
		if (normalizedFilePaths.length !== filePaths.length) {
			throw new Error('最近開いたファイル履歴が不正です');
		}
		if (normalizedFilePaths.length > RecentFileHistory.maxFileCount) {
			throw new Error('最近開いたファイル履歴が多すぎます');
		}
		this.filePaths = normalizedFilePaths;
	}

	record(file: TFile): RecentFileHistory {
		return new RecentFileHistory(
			[file.path, ...this.filePaths.filter((filePath) => filePath !== file.path)].slice(
				0,
				RecentFileHistory.maxFileCount,
			),
		);
	}

	includes(file: TFile): boolean {
		return this.filePaths.includes(file.path);
	}

	equals(other: RecentFileHistory): boolean {
		return (
			this.filePaths.length === other.filePaths.length &&
			this.filePaths.every((filePath, index) => filePath === other.filePaths[index])
		);
	}

	toJSON() {
		return this.filePaths;
	}

	static fromStoredValue(value: unknown): RecentFileHistory {
		const source =
			typeof value === 'object' &&
			value !== null &&
			'filePaths' in value &&
			Array.isArray(value.filePaths)
				? value.filePaths
				: value;
		const filePaths = Array.isArray(source)
			? source.filter((filePath): filePath is string => typeof filePath === 'string')
			: [];
		return new RecentFileHistory(
			filePaths
				.map((filePath) => filePath.trim())
				.filter((filePath) => filePath !== '')
				.filter((filePath, index, paths) => paths.indexOf(filePath) === index)
				.slice(0, RecentFileHistory.maxFileCount),
		);
	}
}
