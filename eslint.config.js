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
    // The clean-room App shell is the composition boundary between the Premium
    // Experience Field and the canonical greenfield application API. On mount it
    // synchronizes remote Supabase snapshots (auth, Fuente, continuity and Tejido)
    // into presentation state. The exception is intentionally limited to this
    // orchestration shell; leaf components remain under the default hooks rule.
    files: ['src/app/App.tsx'],
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },
])
