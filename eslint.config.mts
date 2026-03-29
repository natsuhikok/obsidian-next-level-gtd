import tseslint from 'typescript-eslint';
import obsidianmd from 'eslint-plugin-obsidianmd';
import globals from 'globals';
import { globalIgnores } from 'eslint/config';
import prettierConfig from 'eslint-config-prettier';

const obsidianRecommended = (obsidianmd.configs?.recommended ?? []) as Parameters<
	typeof tseslint.config
>;

export default tseslint.config(
	{
		languageOptions: {
			globals: {
				...globals.browser,
			},
			parserOptions: {
				projectService: {
					allowDefaultProject: ['eslint.config.js', 'manifest.json'],
				},
				tsconfigRootDir: import.meta.dirname,
				extraFileExtensions: ['.json'],
			},
		},
	},
	...obsidianRecommended,
	globalIgnores([
		'node_modules',
		'dist',
		'esbuild.config.mjs',
		'eslint.config.js',
		'version-bump.mjs',
		'versions.json',
		'main.js',
	]),
	{
		files: ['**/*.test.ts'],
		rules: {
			'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
		},
	},
	prettierConfig,
);
