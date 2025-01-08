/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

const nextJest = require('next/jest.js');

const createJestConfig = nextJest({
  dir: './',
})

/** @type {import('jest').Config} */
const config = {
  workerThreads: true,
  testPathIgnorePatterns: ['<rootDir>/__tests__/test-utils'],
  coveragePathIgnorePatterns: ['/test-utils/'],
  clearMocks: true,
  coverageProvider: 'babel',
  moduleNameMapper: {
    '^@/api/(.*)$': '<rootDir>/api/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/config': '<rootDir>/config/index.js',
    '^@/constants': '<rootDir>/constants/index.js',
    '^@/localization': '<rootDir>/localization/index.js',
    '^@/pages/(.*)$': '<rootDir>/pages/$1',
    '^@/public/(.*)$': '<rootDir>/public/$1',
    '^@/screens/(.*)$': '<rootDir>/screens/$1',
    '^@/services/(.*)$': '<rootDir>/services/$1',
    '^@/services': '<rootDir>/services/index.js',
    '^@/styles/(.*)$': '<rootDir>/styles/$1',
    '^@/storage/(.*)$': '<rootDir>/storage/$1',
    '^@/storage': '<rootDir>/storage/index.js',
    '^@/utils/(.*)$': '<rootDir>/utils/$1',
  },
  transform: {},
  transformIgnorePatterns: [
    '/node_modules/(?!(symbol-sdk)/)',
  ],
  resetMocks: true,
	restoreMocks: true,
	testEnvironment: 'jsdom',
	testTimeout: 2500,
	extensionsToTreatAsEsm: ['.jsx'],
	setupFilesAfterEnv: ['<rootDir>/setupTests.js']
};

module.exports = async () => ({
  ...(await createJestConfig(config)()),
  transformIgnorePatterns: [
    '/node_modules/(?!(symbol-sdk)/)',
  ]
});
