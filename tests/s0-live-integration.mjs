import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'

function parseEnv(source) {
  return Object.fromEntries(
    source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const separator = line.indexOf('=')
        return [line.slice(0, separator), line.slice(separator + 1)]
      }),
  )
}

const env = parseEnv(await readFile('.env.production', 'utf8'))
const url = env.VITE_LUMEN_SUPABASE_URL
const key = env.VITE_LUMEN_SUPABASE_PUBLISHABLE_KEY

assert.match(url ?? '', /^https:\/\/vbuixagaguasejputubp\.supabase\.co$/)
assert.match(key ?? '', /^sb_publishable_/)

const authSettings = await fetch(`${url}/auth/v1/settings`, {
  headers: { apikey: key },
})
assert.equal(authSettings.status, 200, 'Supabase Auth settings endpoint must be reachable with publishable key')

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
})
const { data, error } = await supabase.rpc('lumen_foundation_health')
assert.equal(error, null, `Foundation health RPC failed: ${error?.message ?? 'unknown'}`)
assert.deepEqual(data, { status: 'ok', slice: 'S0', contract_version: 's0.v1' })

console.log('S0 live integration PASS: Auth endpoint + greenfield health RPC')
