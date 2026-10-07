import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const app = fs.readFileSync('src/app/App.tsx','utf8')
const lumi = fs.readFileSync('src/app/LumiPresence.tsx','utf8')
const contextual = fs.readFileSync('src/app/contextual-orchestration.ts','utf8')

test('A63 Inicio composes a small contextual projection from the existing organism', () => {
  assert.match(app, /composeHomeCues/)
  assert.match(contextual, /followups/)
  assert.match(contextual, /trajectories/)
  assert.match(contextual, /repertoire/)
  assert.match(contextual, /SanctuaryEntry/)
  assert.match(contextual, /Circle/)
  assert.match(contextual, /sourceHelpId/)
  assert.doesNotMatch(contextual, /create table|habit tracker|streak/i)
})

test('cross-organ synergies preserve real provenance instead of painted shortcuts', () => {
  assert.match(app, /relatedSourceToActiveLife/)
  assert.match(app, /relatedSanctuaryToActiveLife/)
  assert.match(app, /RELACIONADO CON TU FARO/)
  assert.match(app, /Conexiones con tu Faro/)
  assert.match(app, /TissueSource items=\{relatedHuman\}/)
})

test('LUMI changes contextual contribution by space without becoming chat-first', () => {
  for (const space of ['home','life','explore','sanctuary','tissue']) assert.match(lumi, new RegExp(space + ':'))
  assert.match(lumi, /lumen:space/)
  assert.match(lumi, /Fuente no es un catálogo/)
  assert.match(lumi, /Esto es tuyo/)
  assert.match(lumi, /La vida también acompaña a la vida/)
  assert.doesNotMatch(lumi, /chatbot|Escribime un mensaje|Enviar mensaje/i)
})

test('contextual orchestration stays a derived view with no new persistent anatomy', () => {
  assert.doesNotMatch(contextual, /supabase|rpc\(|insert|update|delete/i)
  assert.match(contextual, /relatedSourceToActiveLife/)
  assert.match(contextual, /composeHomeCues/)
})
