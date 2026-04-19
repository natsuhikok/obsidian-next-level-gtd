import { TFile } from 'obsidian';

export class FilePin {
	readonly fileName: string;

	constructor(fileName: string) {
		if (fileName.trim() === '') {
			throw new Error('ファイル名が空です');
		}
		this.fileName = fileName;
	}

	matches(file: TFile): boolean {
		return this.fileName === file.name;
	}
}
