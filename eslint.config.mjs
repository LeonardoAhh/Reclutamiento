export default [
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    rules: {
      'no-duplicate-imports': 'error',
      'no-unused-expressions': 'error',
      'no-unused-vars': 'error',
    },
  },
];
