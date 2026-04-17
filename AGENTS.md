# Agent Guidance

This repository is an Obsidian plugin for GTD workflows. Keep changes small, focused, and consistent with the existing TypeScript and Obsidian plugin patterns.

## Package Manager and Validation

Use npm. CI installs with `npm ci` and runs:

- `npm run build --if-present`
- `npm run check`
- `npm run test`

Run the relevant commands before finishing changes.

## Project Conventions

- Prefer named exports, one export per file, and file names that match their primary export. Keep framework-required exceptions narrow.
- Put user-facing strings behind `t()` in `src/i18n.ts`; add both English and Japanese values when introducing a key.
- Write Vitest `describe` and `it` names in Japanese, describing domain behavior rather than implementation details.
- Write thrown error messages in Japanese.
- Keep domain behavior in the domain class that owns it, and avoid broad utility-style helpers.
- Do not broaden scope into README, package scripts, CI, or runtime behavior unless the task explicitly requires it.
