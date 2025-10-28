import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: '../api/src/schema.gql',
  documents: ['src/**/*.{ts,tsx}', 'src/graphql/**/*.graphql'],
  ignoreNoDocuments: true,
  generates: {
    './src/gql/': {
      preset: 'client',
      presetConfig: {
        fragmentMasking: { unmaskFunctionName: 'getFragmentData' },
      },
      config: {
        mappers: {
          User: '@repo/graphql-types#User',
          Activity: '@repo/graphql-types#Activity',
          UserPreferences: '@repo/graphql-types#UserPreferences',
          SyncHistory: '@repo/graphql-types#SyncHistory',
          AuthResponse: '@repo/graphql-types#AuthResponse',
        },
        enumValues: {
          SportType: '@repo/graphql-types#SportType',
          ThemeType: '@repo/graphql-types#ThemeType',
          LocaleType: '@repo/graphql-types#LocaleType',
          SyncStatus: '@repo/graphql-types#SyncStatus',
          SyncStage: '@repo/graphql-types#SyncStage',
        },
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
