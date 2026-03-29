# Coding Guide

Keep Immutable and Minimal.

Follow all rules unless explicitly overridden.

- Prefer immutability. Do NOT use `Set`, or `Map`.
- Use `map`/`filter`/`reduce` over `push`/`pop`/`splice`
- Use spread (`[...arr]`, `{...obj}`) over in-place mutation
- Code comments are unnecessary unless explicitly instructed. Do not delete existing comments.
- Test names((`describe`, `it`)) and error messages must be written in Japanese.
- Avoid defining types or interfaces that are not reused.
- Never use `any`.
- Make class properties `readonly` when possible.
- Omit return type annotations unless required for correctness.
- Unless specified otherwise, add only the minimum tests needed for correctness.

# Before submitting

Always run the following and fix any errors before finishing:

```
npm run format
npm run check
npm run test
```

# Obsidian Plugin development Rules

- All user-facing strings **must** use `t()` — never hardcode display strings.
- All "Sample" code is intentionally thin and meant to be renamed or deleted.

## Adding an i18n key

1. Add key to `PluginStrings` interface in `src/i18n.ts`.
2. Add values to `en` and `ja` objects.
3. Call `t('yourKey')` where needed.

## Adding a command

Add `this.addCommand({ id, name: t('key'), callback })` in `MyPlugin.onload()` in `src/main.ts`.

## Adding a setting

Add field to `MyPluginSettings` → add default to `DEFAULT_SETTINGS` → add `new Setting(containerEl)` in `SampleSettingTab.display()` → add i18n keys.

## References

- API documentation: https://docs.obsidian.md
- Developer policies: https://docs.obsidian.md/Developer+policies
- Plugin guidelines: https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines
- Style guide: https://help.obsidian.md/style-guide
