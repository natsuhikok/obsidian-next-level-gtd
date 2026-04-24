import { RangeSetBuilder, type Extension } from '@codemirror/state';
import {
	Decoration,
	EditorView,
	ViewPlugin,
	type DecorationSet,
	type ViewUpdate,
	WidgetType,
} from '@codemirror/view';
import { editorInfoField, editorLivePreviewField, setIcon, TFile } from 'obsidian';
import { NextAction } from '../NextActionCollection';
import { NextActionCollection } from '../NextActionCollection';
import { t } from '../i18n';
import type NextLevelGtdPlugin from '../main';

const TASK_LINE_RE = /^(\s*(?:[-*+]|\d+\.)\s+)\[ \]\s*(.*)$/;

export class LiveEditActionPinToggle {
	private readonly editorViews = new Set<EditorView>();

	constructor(private readonly plugin: NextLevelGtdPlugin) {}

	get extension(): Extension {
		const track = (view: EditorView) => this.track(view);
		const untrack = (view: EditorView) => this.untrack(view);
		const decorationsForEditor = (view: EditorView) => this.decorationsForEditor(view);
		return ViewPlugin.fromClass(
			class {
				decorations: DecorationSet;

				constructor(private readonly view: EditorView) {
					this.decorations = Decoration.none;
					this.refresh();
					track(view);
				}

				update(update: ViewUpdate) {
					if (
						update.docChanged ||
						update.viewportChanged ||
						update.selectionSet ||
						update.focusChanged ||
						update.geometryChanged ||
						update.transactions.length > 0
					) {
						this.refresh();
					}
				}

				destroy() {
					untrack(this.view);
				}

				private refresh() {
					this.decorations = decorationsForEditor(this.view);
				}
			},
			{
				decorations: (value) => value.decorations,
			},
		);
	}

	refresh(): void {
		this.editorViews.forEach((view) => {
			if (!view.dom.isConnected) {
				this.editorViews.delete(view);
				return;
			}
			view.dispatch({});
		});
	}

	private track(view: EditorView): void {
		this.editorViews.add(view);
	}

	private untrack(view: EditorView): void {
		this.editorViews.delete(view);
	}

	inlinePinsFor(file: TFile, content: string) {
		const eligibleActionTexts = new NextActionCollection(
			[{ source: file, content }],
			'',
			this.plugin.settings.evaluateStructuralNextActionBlocking,
		).nextActions.map((action) => action.text);

		return content.split('\n').reduce<{
			readonly offset: number;
			readonly pins: readonly {
				readonly position: number;
				readonly actionText: string;
				readonly pinned: boolean;
			}[];
		}>(
			(state, line) => {
				const match = TASK_LINE_RE.exec(line);
				const nextOffset = state.offset + line.length + 1;
				if (match == null || !eligibleActionTexts.includes(match[2]!)) {
					return { offset: nextOffset, pins: state.pins };
				}
				const actionText = match[2]!;
				const pinned = this.plugin.isActionPinned(
					new NextAction(file, actionText, false, null, null, []),
				);
				return {
					offset: nextOffset,
					pins: [
						...state.pins,
						{
							position: state.offset + match[1]!.length,
							actionText,
							pinned,
						},
					],
				};
			},
			{ offset: 0, pins: [] },
		).pins;
	}

	decorationsForEditor(view: EditorView): DecorationSet {
		const info = view.state.field(editorInfoField, false);
		const livePreviewEnabled = view.state.field(editorLivePreviewField, false);
		const file = info?.file;
		if (
			!livePreviewEnabled ||
			file == null ||
			!this.plugin.fileParticipatesInNextActions(file)
		) {
			return Decoration.none;
		}

		const content = view.state.doc.toString();
		const inlinePins = this.inlinePinsFor(file, content);
		if (inlinePins.length === 0) {
			return Decoration.none;
		}

		const builder = new RangeSetBuilder<Decoration>();
		inlinePins.forEach((inlinePin) => {
			builder.add(
				inlinePin.position,
				inlinePin.position,
				Decoration.widget({
					side: -1,
					widget: new LiveEditActionPinWidget(
						this.plugin,
						file,
						inlinePin.actionText,
						inlinePin.pinned,
					),
				}),
			);
		});
		return builder.finish();
	}
}

class LiveEditActionPinWidget extends WidgetType {
	constructor(
		private readonly plugin: NextLevelGtdPlugin,
		private readonly file: TFile,
		private readonly actionText: string,
		private readonly pinned: boolean,
	) {
		super();
	}

	eq(other: LiveEditActionPinWidget): boolean {
		return (
			this.file.path === other.file.path &&
			this.actionText === other.actionText &&
			this.pinned === other.pinned
		);
	}

	toDOM() {
		const button = document.createElement('button');
		button.type = 'button';
		button.className = 'gtd-live-edit-action-pin' + (this.pinned ? ' is-pinned' : '');
		const label = this.pinned ? t('unpinNextAction') : t('pinNextAction');
		button.setAttribute('aria-label', label);
		button.setAttribute('aria-pressed', String(this.pinned));
		button.setAttribute('title', label);
		setIcon(button, 'pin');
		button.addEventListener('mousedown', (event) => {
			event.preventDefault();
		});
		button.addEventListener('click', (event) => {
			event.preventDefault();
			event.stopPropagation();
			this.plugin.toggleActionPin(this.file, this.actionText).catch(console.error);
		});
		return button;
	}

	ignoreEvent(): boolean {
		return false;
	}
}
