export default {
  testEnvironment: 'node',
  testTimeout: 60000,
  setupFilesAfterEnv: ['./__tests__/jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/__tests__/jest.setup.js']
}
