# obsidian-plugin-dev

Boilerplate for building an [Obsidian](https://obsidian.md) community plugin with TypeScript.

Includes: i18n (en/ja), a settings tab, and a sample command — all thin and meant to be renamed or deleted.

## Quick start

```bash
npm install
npm run dev   # watch mode
# or
npm run build # production build
```

Copy `main.js` and `manifest.json` to `<Vault>/.obsidian/plugins/<your-plugin-id>/`, reload Obsidian, and enable the plugin under **Settings → Community plugins**.

## File structure

```
src/
  main.ts       — Plugin entry point. MyPlugin class.
  settings.ts   — MyPluginSettings, DEFAULT_SETTINGS, SampleSettingTab.
  i18n.ts       — Localization. All user-facing strings go through t().
```

## Customization

**Rename the plugin**

1. Update `id`, `name`, `description` in `manifest.json`.
2. Update `name` in `package.json`.
3. Rename `MyPlugin`, `MyPluginSettings`, `SampleSettingTab` in `src/`.

**Add a command** — see `.github/copilot-instructions.md`.

**Add a setting** — see `.github/copilot-instructions.md`.

**Add styles** — create `styles.css` in the root; Obsidian loads it automatically.

## Development

```bash
npm run lint      # ESLint
npm run format    # Prettier
```
