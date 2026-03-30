import { AlertType } from './types';
import { isValidClassification, isValidStatus } from './inbox';

export function detectNoteAlerts(
	frontmatter: Record<string, unknown> | null | undefined,
	noteHasNextAction: boolean,
): readonly AlertType[] {
	const fm = frontmatter ?? {};
	const classification = fm['classification'];
	const status = fm['status'];

	const alerts: AlertType[] = [];

	const validClassification = isValidClassification(classification);
	const validStatus = classification === 'Actionable' ? isValidStatus(status) : true;

	if (!validClassification || !validStatus) {
		alerts.push('frontmatterInvalid');
		return alerts;
	}

	if (classification === 'Reference' && noteHasNextAction) {
		alerts.push('referenceHasNextAction');
	}

	if (classification === 'Actionable') {
		if (status === '進行中' && !noteHasNextAction) {
			alerts.push('actionableInProgressNoNextAction');
		}
		if ((status === '完了' || status === '廃止') && noteHasNextAction) {
			alerts.push('actionableDoneHasNextAction');
		}
	}

	return alerts;
}
