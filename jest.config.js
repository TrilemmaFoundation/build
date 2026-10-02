module.exports = {
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    '^@theme/(.*)$': '<rootDir>/src/__mocks__/@theme/$1',
    '^@docusaurus/(.*)$': '<rootDir>/src/__mocks__/@docusaurus/$1',
    '^@site/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.[jt]sx?$': [
      'babel-jest',
      {
        presets: [
          ['@babel/preset-env', {targets: {node: 'current'}}],
          ['@babel/preset-react', {runtime: 'automatic'}],
          '@babel/preset-typescript',
        ],
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-loadable-ssr-addon-v5-slorber|@docusaurus)/)',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverage: false,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/__mocks__/**',
    '!src/**/__tests__/**',
    '!src/theme/Navbar/**',
    // Framework chrome is exercised by the real-browser suite, including focus/inert.
    '!src/components/foundation/**',
    '!src/theme/Footer/**',
    '!src/theme/CodeBlock/**',
    '!src/plugins/docReadTimes/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 90,
      functions: 90,
      lines: 90,
    },
    './src/data/': {statements: 100, branches: 100, functions: 100, lines: 100},
    './src/utils/': {statements: 100, branches: 100, functions: 100, lines: 100},
    './src/client/': {statements: 100, branches: 100, functions: 100, lines: 100},
    './src/plugins/authorPages/index.ts': {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
  },
};
