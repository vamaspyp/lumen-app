import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const experience = fs.readFileSync('src/app/Experience.tsx','utf8')
const sourceFeedback = fs.readFileSync('src/greenfield/application/source-feedback.ts','utf8')
const migration = fs.readFileSync('supabase/migrations/20260917164500_a63_source_direct_experience_feedback.sql','utf8')

test('A63 restores a sovereign post-experience return across direct Source resources', () => {
  assert.match(experience, /DESPUÉS DE VIVIRLO/)
  assert.match(experience, /Me ayudó/)
  assert.match(experience, /No estoy segura/)
  assert.match(experience, /No me ayudó/)
  assert.match(experience, /Prefiero no responder/)
})

test('direct Source feedback is attributed through existing episode selection outcome anatomy', () => {
  assert.match(sourceFeedback, /lumen_source_begin_experience/)
  assert.match(experience, /recordOutcome\(directEpisodeId, effect\)/)
  assert.match(migration, /insert into gf_core\.accompaniment_episodes/)
  assert.match(migration, /insert into gf_core\.candidate_exposures/)
  assert.match(migration, /insert into gf_core\.help_selections/)
  assert.doesNotMatch(migration, /create table/i)
})

test('direct Source experience RPC is authenticated-only', () => {
  assert.match(migration, /revoke all on function public\.lumen_source_begin_experience\(uuid,text,text,uuid\) from public, anon/i)
  assert.match(migration, /grant execute on function public\.lumen_source_begin_experience\(uuid,text,text,uuid\) to authenticated/i)
})