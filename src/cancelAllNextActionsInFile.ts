import { App, TFile } from 'obsidian';
import { cancelAllNextActions } from './cancelAllNextActions';

export async function cancelAllNextActionsInFile(app: App, file: TFile): Promise<void> {
	const content = await app.vault.read(file);
	const updated = cancelAllNextActions(content);
	await app.vault.modify(file, updated);
}
