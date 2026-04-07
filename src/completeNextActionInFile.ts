import { App, TFile } from 'obsidian';
import { completeNextAction } from './completeNextAction';

export async function completeNextActionInFile(
	app: App,
	file: TFile,
	actionText: string,
): Promise<void> {
	const content = await app.vault.read(file);
	const updated = completeNextAction(content, actionText);
	await app.vault.modify(file, updated);
}
