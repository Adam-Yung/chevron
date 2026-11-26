module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  extends: ['eslint:recommended', 'plugin:react/recommended', 'plugin:react-hooks/recommended'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['react'],
  settings: { react: { version: '18.2' } },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off'
  },
  overrides: [
    {
      files: ['scripts/**', 'tools/**', 'services/**', 'vite.config.js', '*.cjs'],
      env: { node: true, browser: false }
    },
    {
      files: ['scripts/e2e/**'],
      // page.evaluate callbacks run in the browser
      env: { node: true, browser: true }
    },
    {
      files: ['**/*.test.js', '**/*.test.jsx', 'test/**'],
      globals: { vi: 'readonly', describe: 'readonly', it: 'readonly', expect: 'readonly', beforeEach: 'readonly', afterEach: 'readonly', beforeAll: 'readonly', afterAll: 'readonly' }
    }
  ]
}
