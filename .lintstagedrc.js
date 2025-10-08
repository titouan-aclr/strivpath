module.exports = {
  // TypeScript/TSX - Lint puis format
  // Respecte automatiquement .eslintignore et .prettierignore
  '**/*.{ts,tsx}': [
    'eslint --fix --max-warnings 0', // Auto-fix + fail si warnings
    'prettier --write', // Format (config centralisée)
  ],

  // Markdown - Format uniquement
  '**/*.md': 'prettier --write',
};
