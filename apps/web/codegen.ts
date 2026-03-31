import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: '../api/src/schema.gql',
  documents: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'graphql/**/*.graphql',
    '!**/*.test.{ts,tsx}',
  ],
  ignoreNoDocuments: true,
  generates: {
    './gql/': {
      preset: 'client',
      presetConfig: {
        fragmentMasking: { unmaskFunctionName: 'getFragmentData' },
      },
      config: {
        useTypeImports: true,
        scalars: {
          DateTime: 'Date',
          BigInt: 'bigint',
        },
      },
    },
  },
};

export default config;
