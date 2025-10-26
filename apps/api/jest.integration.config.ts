import type { Config } from 'jest';

const config: Config = {
  displayName: 'integration',
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: 'test/integration/.*\\.integration\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup-integration.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  testTimeout: 10000,
  maxWorkers: 1,
  bail: false,
  verbose: true,
};

export default config;
