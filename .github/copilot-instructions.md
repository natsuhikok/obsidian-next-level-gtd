# TypeScript Implementation Rules

Apply all rules in this document unless doing so would conflict with constraints imposed by the required library or framework.

## Principles

- Prefer immutability.
- Follow a Rich Domain Model approach.
- Model domain concepts as `class` when they carry domain meaning, behavior, or invariants.
- Keep state and behavior together when that improves domain clarity.
- Keep business rules and invariants inside domain objects whenever possible.
- Do not introduce named types unnecessarily when an inline type is sufficient.
- Use `type` or `interface` when they improve clarity, expressiveness, or reuse.
- Do not create utility functions or utility classes.
- Objects must be valid immediately after construction.
- Do not store derivable values.
- Use a `getter` for derived values without arguments.
- Use a method for behavior that requires arguments.
- Use `named export` only.
- Match the file name to the named export.
- Match test file names to the file under test, for example `Todo.ts` and `Todo.test.ts`.
- Use one export per file.
- Use concrete, domain-specific names for functions, classes, and types.
- Make class properties `readonly` when possible.
- Never use `any`.
- Omit return type annotations unless required for correctness.
- Code comments are unnecessary unless explicitly instructed. Do not delete existing comments.
- Test names (`describe`, `it`) and error messages must be written in Japanese.
- Unless specified otherwise, add only the minimum tests needed for correctness.

## Mechanical Rules

1. When adding new code, decide which class owns the responsibility.
2. Prefer adding behavior to a domain object over extracting it into a helper.
3. If something has domain meaning and should own behavior or invariants, model it as a `class`.
4. If it fits an existing class naturally, add it there.
5. Otherwise, create a new class with a specific responsibility.
6. Do not expose public helper functions with `export const`.
7. Do not create static-only classes.
8. Require all mandatory values in the constructor.
9. Do not allow incomplete objects.
10. Do not keep duplicated or derivable state.
11. Before treating strings, numbers, or dates as primitives, check whether they should be encapsulated in a domain class.
12. Prefer `map` / `filter` / `reduce` over `push` / `pop` / `splice`.
13. Prefer spread syntax over in-place mutation.
14. Do not use `Set` or `Map` unless they are clearly the simplest correct representation.
15. Use inline object types when they are local and obvious.
16. Introduce `type` or `interface` only when reuse, naming, or type-level expressiveness makes the code clearer.
17. Do not create named types only to avoid writing a small inline type.
18. Name each file after its named export.
19. Name each test file after the file under test using the `.test.ts` suffix.

## Prohibited

- `default export`
- Multiple exports in one file
- Utility-style names such as `Util`, `Helper`, `Manager`, `Data`, `Info`
- Public utility functions such as `formatXxx()` or `calculateXxx()`
- Utility classes such as `DateUtils` or `StringUtils`
- Classes that can exist without required values
- Storing derivable values as fields
- `any`

## Priority Order

1. Does it have domain meaning?
2. Should it be a dedicated domain class?
3. Can it belong to an existing class?
4. Can it be expressed as a new class with a specific responsibility?
5. Can it be valid immediately after construction?
6. Can derivable state be computed instead of stored?
7. Should it be a `getter` or a method?
8. Is the name concrete and domain-specific?
9. Is a named type actually needed, or is an inline type clearer here?

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
