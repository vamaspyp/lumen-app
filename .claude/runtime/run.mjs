#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const EXIT_BLOCKED = 2;

function fail(message, details = []) {
  console.error(JSON.stringify({ status: 'INVALID', message, details }, null, 2));
  process.exit(1);
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    fail(`No se pudo leer JSON: ${file}`, [String(error.message || error)]);
  }
}

function required(value, name, errors) {
  if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
    errors.push(`Falta ${name}`);
  }
}

function validateWorkPackage(pkg) {
  const errors = [];
  required(pkg.acto_id, 'acto_id', errors);
  required(pkg.focus_id, 'focus_id', errors);
  required(pkg.purpose, 'purpose', errors);
  required(pkg.dod, 'dod', errors);
  required(pkg.authorities, 'authorities', errors);
  required(pkg.requested_actions, 'requested_actions', errors);
  required(pkg.candidates, 'candidates', errors);

  for (const [i, auth] of (pkg.authorities || []).entries()) {
    required(auth.id, `authorities[${i}].id`, errors);
    required(auth.location, `authorities[${i}].location`, errors);
    if (auth.status !== 'VERIFIED') errors.push(`Autoridad ${auth.id || i} no está VERIFIED`);
    required(auth.checked_at, `authorities[${i}].checked_at`, errors);
  }

  const forbidden = (pkg.requested_actions || []).filter(a =>
    a.destructive === true || a.touches_secrets === true || a.production === true || a.irreversible === true
  );
  for (const action of forbidden) {
    if (action.explicit_authorization !== true) {
      errors.push(`Acción ${action.id || action.target || '?'} requiere autorización explícita`);
    }
  }

  return errors;
}

function candidateEligible(candidate, actions) {
  if (!candidate.available) return { ok: false, reason: 'unavailable' };
  if (candidate.capacity_score < 3) return { ok: false, reason: 'capacity_below_minimum' };

  const requiredTargets = [...new Set(actions.map(a => a.target).filter(Boolean))];
  const missing = requiredTargets.filter(target => !candidate.effective_permissions?.includes(target));
  if (missing.length) return { ok: false, reason: `missing_effective_permissions:${missing.join(',')}` };

  return { ok: true };
}

function score(candidate) {
  const capacity = Number(candidate.capacity_score || 0);
  const risk = Number(candidate.risk_fit_score || 0);
  const reversibility = Number(candidate.reversibility_fit_score || 0);
  const cost = Number(candidate.cost_efficiency_score || 0);
  return Number((capacity * 0.45 + risk * 0.25 + reversibility * 0.15 + cost * 0.15).toFixed(3));
}

function route(pkg) {
  const evaluated = (pkg.candidates || []).map(candidate => {
    const eligibility = candidateEligible(candidate, pkg.requested_actions || []);
    return {
      id: candidate.id,
      preferred: Boolean(candidate.preferred),
      eligible: eligibility.ok,
      reason: eligibility.ok ? 'eligible' : eligibility.reason,
      score: eligibility.ok ? score(candidate) : null,
    };
  });

  const eligible = evaluated
    .filter(x => x.eligible)
    .sort((a, b) => (b.score - a.score) || Number(b.preferred) - Number(a.preferred));

  return { selected: eligible[0]?.id || null, evaluated };
}

function buildEnvelope(pkg) {
  const routing = route(pkg);
  if (!routing.selected) {
    return {
      status: 'BLOQUEADO',
      acto_id: pkg.acto_id,
      focus_id: pkg.focus_id,
      blocker: 'No hay actor elegible con disponibilidad y permisos efectivos para las acciones requeridas.',
      routing,
      created_at: new Date().toISOString(),
    };
  }

  return {
    status: 'READY',
    acto_id: pkg.acto_id,
    focus_id: pkg.focus_id,
    actor: routing.selected,
    purpose: pkg.purpose,
    dod: pkg.dod,
    authority_manifest: pkg.authorities,
    permissions: pkg.requested_actions,
    routing,
    skill: pkg.skill || null,
    return_contract: {
      required: ['estado', 'evidencia', 'resultado', 'aprendizaje', 'referencias', 'esfuerzo_real', 'dod_check'],
      evidence_origin_values: ['LEÍDO', 'DERIVADO', 'NO_VERIFICADO'],
      effort_format: 'persona_h=<horas reales>; agente_sesiones=<n reales>',
    },
    created_at: new Date().toISOString(),
  };
}

function validateResult(result) {
  const errors = [];
  for (const field of ['acto_id','estado','evidencia','resultado','aprendizaje','referencias','esfuerzo_real','dod_check']) {
    required(result[field], field, errors);
  }
  if (!['CERRADO','BLOQUEADO','EN_CURSO'].includes(result.estado)) errors.push('estado inválido');
  if (!/^persona_h=\d+(?:\.\d+)?; agente_sesiones=\d+$/.test(result.esfuerzo_real || '')) {
    errors.push('esfuerzo_real debe usar: persona_h=<horas>; agente_sesiones=<n>');
  }
  for (const [i, ev] of (result.evidencia || []).entries()) {
    required(ev.origin, `evidencia[${i}].origin`, errors);
    if (ev.origin && !['LEÍDO','DERIVADO','NO_VERIFICADO'].includes(ev.origin)) {
      errors.push(`evidencia[${i}].origin inválido`);
    }
    required(ev.statement, `evidencia[${i}].statement`, errors);
    required(ev.reference, `evidencia[${i}].reference`, errors);
  }
  for (const [i, item] of (result.dod_check || []).entries()) {
    required(item.item, `dod_check[${i}].item`, errors);
    if (!['PASS','FAIL','PARTIAL'].includes(item.status)) errors.push(`dod_check[${i}].status inválido`);
    required(item.evidence, `dod_check[${i}].evidence`, errors);
  }
  return errors;
}

const [command, inputArg] = process.argv.slice(2);
if (!command || !inputArg || !['prepare','verify'].includes(command)) {
  fail('Uso: node .claude/runtime/run.mjs <prepare|verify> <archivo.json>');
}

const input = readJson(path.resolve(inputArg));

if (command === 'prepare') {
  const errors = validateWorkPackage(input);
  if (errors.length) fail('Work package inválido', errors);
  const envelope = buildEnvelope(input);
  console.log(JSON.stringify(envelope, null, 2));
  if (envelope.status === 'BLOQUEADO') process.exit(EXIT_BLOCKED);
}

if (command === 'verify') {
  const errors = validateResult(input);
  if (errors.length) fail('Retorno inválido', errors);
  console.log(JSON.stringify({ status: 'VERIFIED', acto_id: input.acto_id, estado: input.estado }, null, 2));
}
