/**
 * Unit-test config: pure domain layer only. NO database, NO Redis, NO network —
 * these run in milliseconds with zero infrastructure. Run: `npm test`.
 *
 * ESM note: the backend is ESM (NodeNext + "type":"module") and source imports
 * use explicit `.js` extensions, so we use ts-jest's ESM preset and map the
 * `.js` specifiers back to their `.ts` sources.
 */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.spec.ts'],
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true }],
  },
};
