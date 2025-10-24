module.exports = {
  root: true,
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  env: {
    es2022: true,
    browser: true,
    node: true
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    '.next/',
    'coverage/',
    '!.eslintrc.cjs'
  ],
  overrides: [
    {
      files: ['frontend/**/*.{ts,tsx}', 'frontend/**/*.js'],
      extends: ['next/core-web-vitals'],
      settings: {
        next: {
          rootDir: ['frontend']
        }
      },
      rules: {
        '@next/next/no-html-link-for-pages': 'off'
      }
    },
    {
      files: ['backend/**/*.ts'],
      parserOptions: {
        project: ['./backend/tsconfig.json'],
        tsconfigRootDir: __dirname
      },
      env: {
        node: true
      },
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_'
          }
        ]
      }
    }
  ]
};
