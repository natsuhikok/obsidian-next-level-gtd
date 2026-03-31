import { App, TFile } from 'obsidian';
import { Status } from './types';

type NoteStateTarget = 'reference' | Status;

export async function setNoteState(app: App, file: TFile, target: NoteStateTarget): Promise<void> {
	await app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
		if (target === 'reference') {
			fm['classification'] = 'Reference';
			delete fm['status'];
		} else {
			fm['classification'] = 'Actionable';
			fm['status'] = target;
		}
	});
}
