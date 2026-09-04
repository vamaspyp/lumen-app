import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import test from 'node:test'

const ROOT = process.cwd()
const MIGRATION = join(ROOT, 'supabase', 'migrations', '20260904150300_greenfield_v04_s0_public_api_and_core_events.sql')

test('S0 public RPCs remain invoker-scoped and authenticated-only', async () => {
  const sql = await readFile(MIGRATION, 'utf8')

  for (const fn of ['lumen_bootstrap_person', 'lumen_get_consent_state', 'lumen_set_consent']) {
    assert.match(sql, new RegExp(`function public\\.${fn}`))
  }
  assert.match(sql, /security invoker/g)
  assert.match(sql, /revoke execute on function public\.lumen_bootstrap_person\(uuid\) from public, anon/)
  assert.match(sql, /grant execute on function public\.lumen_bootstrap_person\(uuid\) to authenticated/)
  assert.match(sql, /anonymous users are not eligible/)
})

test('S0 core changes emit ledger and outbox transactionally', async () => {
  const sql = await readFile(MIGRATION, 'utf8')
  assert.match(sql, /PersonBootstrapped/)
  assert.match(sql, /ConsentChanged/)
  assert.match(sql, /insert into gf_ledger\.domain_events/)
  assert.match(sql, /insert into gf_ledger\.outbox/)
  assert.match(sql, /'ledger:' \|\| v_event_id::text/)
  assert.match(sql, /revoke all on function gf_ledger\.audit_core_insert\(\) from public, anon, authenticated/)
})

test('operational logging is traceable and filters sensitive attribute names', async () => {
  const source = await readFile(join(ROOT, 'src', 'greenfield', 'kernel', 'observability.ts'), 'utf8')
  assert.match(source, /traceId/)
  for (const marker of ['email', 'content', 'token', 'secret', 'password']) {
    assert.match(source, new RegExp(`'${marker}'`))
  }
})
