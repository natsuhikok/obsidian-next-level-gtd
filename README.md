# Next Level GTD

Next Level GTD is an Obsidian plugin for practicing GTD (Getting Things Done) inside your vault. It classifies notes into **Inbox / Reference / Actionable**, detects next actions from Markdown checkboxes, and gives you focused views for triage and execution.

Key features:

- Classify notes and manage actionable status from the note UI
- Detect next actions automatically from unchecked checkboxes
- Review unclassified notes and GTD rule violations in the Inbox view
- See available next actions across the vault in a dedicated Next Actions view
- Bulk-initialize existing notes and exclude folders from GTD processing

---

## Note Classification

Each note is managed through frontmatter fields: `classification` and `status`.

| Type           | Frontmatter                             | Meaning                     |
| -------------- | --------------------------------------- | --------------------------- |
| **Inbox**      | not set                                 | A note that has not been classified yet |
| **Reference**  | `classification: Reference`             | Reference material with no tasks |
| **Actionable** | `classification: Actionable` + `status` | A note that requires action |

Actionable notes support 5 statuses.

| Status     | Meaning |
| ---------- | ------- |
| In Progress | Currently active |
| On Hold    | Paused for now |
| Dormant    | Waiting for a future scheduled action |
| Completed  | Finished |
| Abandoned  | Intentionally dropped |

---

## Writing Next Actions

Any **unchecked Markdown checkbox** is treated as a next action.

```markdown
- [ ] Write the report
- [x] Gather source material    <- already done, ignored
- [-] Schedule the meeting     <- cancelled, ignored
```

### Nesting and Blocking

Nested checkboxes are treated as blocked by their parent task.

```markdown
- [ ] Prepare the proposal
    - [ ] Draft the outline      <- blocked while the parent task exists
    - [ ] Write the first draft
```

With **ordered lists**, later items are blocked until earlier items are complete.

```markdown
1. [ ] Research the topic
2. [ ] Write the draft          <- blocked until item 1 is done
3. [ ] Request review
```

### Dates

| Emoji | Meaning | Example |
| ----- | ------- | ------- |
| ⏳    | Scheduled date. The action becomes available on or after this day | `⏳ 2025-06-01` |
| 📅    | Due date | `📅 2025-06-30` |

```markdown
- [ ] Submit the monthly report ⏳ 2025-06-01 📅 2025-06-30
```

### Temporary Exclusion

Tasks with the `#temp` tag are ignored by next action detection.

```markdown
- [ ] Think about this later #temp
```

### Context Tags

Tags such as `#home`, `#work`, or `#errands` are collected as contexts and can be used to filter the Next Actions view.

```markdown
- [ ] Buy packing tape #errands
- [ ] Review proposal draft #work
```

---

## Banner UI

When you open a Markdown note, the plugin renders a control banner above the editor.

```text
[ Reference ]  [ In Progress ]  [ On Hold ]  [ Dormant ]  [ Completed ]  [ Abandoned ]
```

The current state is highlighted. Clicking another button updates the note frontmatter immediately.

If the note has GTD alerts, warning callouts are shown under the banner.

---

## Inbox View

Open it from the left ribbon icon or from the command palette.

The Inbox view shows:

- notes with no `classification`
- notes that violate GTD rules

The plugin detects the following alerts.

| Alert | Trigger |
| ----- | ------- |
| Invalid frontmatter | `classification` or `status` contains an invalid value |
| Reference note has next action | A Reference note still contains a checkbox task |
| In-progress Actionable has no next action | The note is `In Progress` but has no next action |
| Done/Abandoned Actionable has next action | The note is `Completed` or `Abandoned` but still has unchecked actions |
| Dormant Actionable has no scheduled next action | The note is `Dormant` but has no scheduled action for today or later |

---

## Next Actions View

Open it from the left ribbon icon or from the command palette.

This view provides a cross-note list of actionable work.

Features:

- show only currently available next actions
- filter by context tags
- show only scheduled or due tasks
- open the source note directly from the list
- mark a next action as completed from the list

---

## Commands

All commands are available from the command palette (`Cmd/Ctrl + P`).

| Command | Description |
| ------- | ----------- |
| **Open Inbox** | Open the Inbox view |
| **Open Next Actions** | Open the Next Actions view |
| **Change status** | Open a modal and choose a new status |
| **Set status: In Progress** | Set the active note to In Progress |
| **Set status: On Hold** | Set the active note to On Hold |
| **Set status: Dormant** | Set the active note to Dormant |
| **Set status: Completed** | Set the active note to Completed |
| **Set status: Abandoned** | Set the active note to Abandoned |
| **Cancel all next actions** | Convert all unchecked checkboxes in the active note to `[-]` |

`Cancel all next actions` is also available from the file context menu.

---

## Settings

### Excluded Folders

Choose folders that should be ignored by Inbox scanning, Next Actions scanning, and vault initialization.

This is useful for template folders, archives, or temporary work areas.

### Initialize Vault

Bulk-set all unclassified notes to `classification: Reference`.

This is useful when you introduce the plugin into an existing vault and want to start from a clean baseline. Notes inside excluded folders are skipped.

### Development Helpers

The settings tab also includes a mock note generator for manual testing.
