module.exports = {
  preset: 'jest-expo',
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.expo/',
    '/dist/',
    '/convex/_generated/',
    '/convex/.*\\.integration\\.test\\.(ts|tsx|js|jsx)$',
  ],
};
