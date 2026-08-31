# T1 · Preproducción · Check-in → Match → Run

Fecha: 2026-08-31  
Estado: **IMPLEMENTADO EN RAMA / NO APLICADO A SUPABASE**  
Rama: `acto/A19-organos-germinales`  
Autoridad: Especificación Funcional Embrión V2 + Especificación Técnica V1 + `T1-precondicion-contrato-checkin-match-run-2026-08-31.md`.

## Resultado

Se materializó la separación canónica resuelta antes de T1:

- `sessions` = Momento / contexto mutable de entrada;
- `session_events` = journal append-only;
- `experience_runs` = verdad de ejecución/Retorno;
- **MATCH != RUN**.

No se modificó Supabase real ni producción Vercel.

## Delta versionado

### `docs/backend/pending/T1_01_run_contract.sql`

- agrega de forma aditiva a `experience_runs`:
  - `selection_source`;
  - `served_capability_key`;
  - `realization_type`;
  - `offer_snapshot`;
- agrega checks lógicos sin exigir backfill total;
- agrega índice único por `offer_snapshot.offer_token` para idempotencia de `Empezar`;
- backfill conservador sólo de equivalencias verificables;
- no inventa `offer_snapshot` histórico;
- normalizador existente pasa a canonical-first y usa `hypothesis_json` sólo como fallback.

Commit inicial de esta pieza: `72bf116e2ffbfc13d86d30567db65fa0adc94a11`.

### `docs/backend/pending/T1_02_checkin_match_run_functions.sql`

Prepara las funciones de transición:

- `lumi_select_experience`: devuelve oferta + `offer_token`; deja de crear Run y deja de escribir `sessions.selected_experience_id` / `last_no_match_*`;
- NO_MATCH escribe `session_events(action_type='no_match', metadata=...)` con contrato válido;
- `lumi_start_experience`: PRE del motor sin Run;
- `lumi_open_experience`: PRE de Fuente sin Run;
- `lumi_restart_experience`: PRE de Santuario sin Run;
- `lumi_open_resource_viewer`: frontera de aceptación/inicio.

Commit inicial: `836e707934beabc58692b7430c529f9c2b9b76e0`.

### `docs/backend/pending/T1_03_accept_boundary_hardening.sql`

Definición final/autoritativa de `lumi_open_resource_viewer` para T1:

- `experience_id` solo **no** puede crear Run;
- un Run nuevo exige `offer_token` emitido por PRE;
- revalida experiencia/recurso y, para motor, la hipótesis específica contra el Momento actual;
- no vuelve a correr ranking ni consulta `session_experience_shown` al aceptar;
- idempotencia: doble `Empezar` con mismo token reutiliza exactamente el mismo Run;
- Fuente no importa contexto mutable de sesión como autoridad;
- Santuario toma lineage del run original;
- journal `opened` canónico enlaza `experience_run_id` y no escribe IK/help_intent/pattern;
- viewer legacy sin token/run sigue por adaptador existente sin redefinirlo como arquitectura nueva.

Commit: `9a6b7988626fdda0c9ea28194133c26f4782cc38`.

### `docs/backend/pending/T1_verify.sql`

Prueba reproducible transaccional, con `ROLLBACK`, que exige:

1. MATCH positivo devuelve oferta y crea 0 Runs;
2. PRE sin `Empezar` deja 0 Runs;
3. `Empezar` crea exactamente 1 Run canónico;
4. doble `Empezar` con mismo token sigue en 1 Run;
5. Retorno actualiza ese mismo Run sin duplicar feedback en `session_events`;
6. NO_MATCH crea 0 Runs + exactamente 1 journal válido;
7. no se escriben `sessions.selected_experience_id` ni `last_no_match_*` en el flujo nuevo;
8. eventos canónicos no escriben claves legacy.

Commit: `ba7af1ab0a6b89104927130524c48fb9180f1cf8`.

## Verificaciones realizadas sin escribir producción

### DB viva

Se reconfirmó el contrato real de `sessions`, `session_events`, `experience_runs` y funciones relacionadas antes de escribir los scripts.

Datos relevantes verificados:

- `experience_runs`: 165 filas; 94 con sesión; 71 sin sesión; `moment_id` 0/165;
- `session_events`: 430 filas; 7 enlazadas a run en el baseline leído;
- `sessions`: 673 filas en el baseline leído;
- no hay valores H1 de `experience_hypotheses.life_area_key` incompatibles con el enum `public.life_area`;
- existen 5.828 combinaciones usuario/hipótesis H1 elegibles para que `T1_verify.sql` encuentre baseline sin hardcodear IDs.

### React / dispatcher

No se requirió UI nueva:

- `useLumi` ya transporta `currentExperienceId`, `currentResourceId`, `currentExperienceRunId`, `session_id` y `source`;
- el `value` de una action ya se envía como parámetro;
- por eso la PRE puede transportar el token efímero en la action `open_resource_viewer` sin crear tabla `pending_offers` ni estado React paralelo.

### CI

Head funcional previo a este archivo de evidencia: `ba7af1ab0a6b89104927130524c48fb9180f1cf8`.

GitHub Actions run `33443609357` → **success**. El workflow completó `npm run verify`.

Nota: el CI existente valida frontend/build/e2e, pero no ejecuta SQL pendiente. No se presenta como prueba de compilación PL/pgSQL.

## Lo que NO está todavía verificado

`LEÍDO / DERIVADO`:

- contratos de tablas/funciones vivas;
- compatibilidad de transporte frontend;
- coherencia del delta con E2;
- CI del repo.

`NO_VERIFICADO hasta aplicar en entorno DB controlado`:

- compilación efectiva de los `CREATE OR REPLACE FUNCTION` nuevos;
- ejecución PASS de `T1_verify.sql`;
- comportamiento runtime real posterior a la migración.

No se simula esa evidencia.

## Frontera real siguiente

Para avanzar desde preproducción a verificación material de T1 hace falta autorización humana explícita para modificar Supabase real o, alternativamente, un branch DB de Supabase autorizado.

Antes de aplicar persistentemente se debe:

1. capturar snapshot/rollback de las funciones vivas reemplazadas;
2. aplicar `T1_01` → `T1_02` → `T1_03` en una transacción/migración controlada;
3. ejecutar `T1_verify.sql`;
4. abortar/restaurar si cualquier assertion falla;
5. sólo con PASS persistir evidencia y evaluar cierre de T1.

## Guardarraíl

No se creó `moments`, `experience_evidence`, `pending_offers` ni otra arquitectura paralela. Las estructuras legacy permanecen físicamente para compatibilidad pero dejan de recibir autoridad nueva. El objetivo fue estrangulamiento gradual, no big bang.
