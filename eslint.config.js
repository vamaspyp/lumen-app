import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommended, reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: { globals: globals.browser },
  },
  {
    // App is still the transitional semantic shell. React synchronization with
    // Supabase is intentional here. A60 moved Path writes into CultivationPanel;
    // keep the one historical binding tolerated until App is split, while ESLint
    // remains the single owner of unused-symbol enforcement for the project.
    files: ['src/App.tsx'],
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^addPathItem$' }],
    },
  },
])
