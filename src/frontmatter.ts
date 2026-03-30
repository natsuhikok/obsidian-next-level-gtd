import { App, TFile } from 'obsidian';
import { Classification, Status } from './types';

export async function setClassification(
	app: App,
	file: TFile,
	classification: Classification,
): Promise<void> {
	await app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
		fm['classification'] = classification;
	});
}

export async function setStatus(app: App, file: TFile, status: Status): Promise<void> {
	await app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
		fm['status'] = status;
	});
}

export async function setClassificationAndStatus(
	app: App,
	file: TFile,
	classification: Classification,
	status: Status,
): Promise<void> {
	await app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
		fm['classification'] = classification;
		fm['status'] = status;
	});
}
