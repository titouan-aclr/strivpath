import nextConfig from '@repo/eslint-config/nextjs';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      '.next/**',
      'gql/**',
      '__tests__/**',
      'eslint.config.mjs',
      '*.config.js',
      '*.config.mjs',
      '*.config.mts',
    ],
  },
  ...nextConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
