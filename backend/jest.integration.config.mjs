/**
 * Integration-test config: runs against REAL Docker Mongo + Redis (the same
 * services used in dev). Start them first: `docker-compose up -d`, then
 * `npm run test:integration`. Kept separate from `npm test` so unit tests stay
 * fast and infra-free.
 */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/integration'],
  testMatch: ['**/*.spec.ts'],
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true }],
  },
  testTimeout: 30000,
};
