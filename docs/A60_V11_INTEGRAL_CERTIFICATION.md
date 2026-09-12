# A60 · Certificación integral del Embrión V1.1

## Dictamen

**CERTIFIED · técnicamente listo para revisión Pauli.**

La certificación usa como autoridad V46 + V51 + V52 + V53, con V40/V41/V43 complementarias. La implementación no fue tratada como autoridad: primero se leyó V52/V53 y después se contrastó el runtime.

## Chequeo bidireccional

La matriz `governance/a60-conformity-matrix.json` contiene 30 comprobaciones especificación→runtime y 20 runtime→autoridad. Resultado: **0 gaps materiales abiertos y 0 excesos sin justificación**.

Durante el cruce final aparecieron tres gaps pequeños pero reales y se corrigieron sin nueva anatomía:

1. `DiscoverConstellation` ahora admite contexto mínimo de realización (`max_duration_minutes`, `allowed_energy`, `provider_kind`).
2. `PathItem` puede persistir una intención opcional `cultivation_move` por el mismo contrato público existente, sin programa ni currículum.
3. existe `ResolveCultivationContext` como proyección longitudinal minimizada de Repertorio, Trayectoria/Path, señales y followups; excluye deliberadamente Santuario y texto crudo de Momentos.

## Latido longitudinal live

Se verificó en el proyecto Supabase greenfield con una vida sintética existente y contratos públicos reales:

`Momento → NEW_HELP → Selection → HELPED_NOW → ConfirmRepertoire → regreso → APPLY_IN_CONTEXT → longitudinal signal → followup consentido → regreso → NO_REMINDER_NEEDED → WITHDRAW`.

La prueba confirmó:

- incorporación a Repertorio sólo después de ayuda positiva **y acción voluntaria**;
- reutilización desde Repertorio con `decision_kind` longitudinal;
- evidencia `longitudinal_signal` separada de `help_effect` y atribuida a Selection/HelpVersion/DecisionRun;
- followup de cultivo sólo luego de consentimiento explícito;
- `NO_REMINDER_NEEDED` produce `WITHDRAW`, evento `LumiWithdrew` y cancela followups vinculados;
- Ledger y Evidence conservan trazabilidad sin copiar texto íntimo.

## Profundidad de Fuente

Live, antes de Pauli, Fuente conserva 72 Posibilidades activas, 109 relaciones de aplicabilidad y 10 formas semánticas. Las constelaciones semilla verificadas son:

- `regulation`: 16 posibilidades, 5 tipos, 6 providers, 6 roles de cultivo;
- `discernment`: 16, 5 tipos, 4 providers, 5 roles;
- `agency`: 16, 4 tipos, 3 providers, 5 roles;
- `connection`: 14, 4 tipos, 2 providers, 6 roles;
- `self_compassion`: 9, 4 tipos, 3 providers, 6 roles.

Esto demuestra profundidad suficiente sin convertir Fuente en catálogo inflado ni fingir cobertura universal.

## Guardrails preservados

No se introdujeron tabla Constelación, score de capacidades, habit tracker, streaks, currículum, segundo Motor/Fuente ni memoria longitudinal duplicada. Safety, NO_MATCH, RLS, consentimiento, missingness, independencia legacy y separación Santuario/Repertorio permanecen vigentes.

## Integridad canónica live

`canonical_integrity` final: policy **v7**, `active / integrally_certified`, autoridad `[V46,V51,V52,V53,V40,V41,V43]`, 20 contratos, 0 blockers, matriz 30/20 y release `embryo.v53.1`.

La v6 se conserva como versión histórica y fue retirada al detectar que heredaba el contador de 18 contratos de V1.0. No se reescribió historia.

## Estado previo a Pauli

El PRELAUNCH RESET **no se ejecuta** en A60. Los datos sintéticos siguen siendo útiles para revisión y pruebas. El reset corresponde inmediatamente antes de primeras vidas reales, después del dictamen humano de exposición.

A60 sólo puede cerrarse definitivamente cuando CI completo y deployment del merge estén verdes. El criterio de Pauli-ready es: esta certificación + CI/live PASS + merge + deployment READY verificado.
