const browserGlobals = [
  'window',
  'document',
  'navigator',
  'location',
  'localStorage',
  'devicePixelRatio',
  'performance',
  'Response',
  'EventTarget',
  'WebSocket',
  'matchMedia',
  'Image',
  'URL',
  'Blob',
  'fetch',
  'console',
  'AbortController',
  'setTimeout',
  'clearTimeout',
  'requestAnimationFrame',
  'cancelAnimationFrame',
];

export default [
  { ignores: ['node_modules/**', 'dist/**', 'public/**', '.browser-*/**', '.npm-cache/**'] },
  {
    files: ['src/**/*.js', 'tests/**/*.js', 'scripts/**/*.mjs', '*.config.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: Object.fromEntries(
        [...browserGlobals, 'process', 'Buffer', 'global'].map(name => [name, 'readonly']),
      ),
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none', varsIgnorePattern: '^_' }],
      'no-unreachable': 'error',
      'no-duplicate-imports': 'error',
      'constructor-super': 'error',
      'valid-typeof': 'error',
    },
  },
];
