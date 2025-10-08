module.exports = {
  // TypeScript/TSX/MD - Lint and format all staged files
  '**/*.{ts,tsx,md}': () => ['pnpm lint', 'pnpm format'],
};
