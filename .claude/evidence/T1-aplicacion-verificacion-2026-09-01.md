# T1 · Aplicación y verificación real · Check-in → Match → Run

Fecha: 2026-09-01
Estado material: CERRADO / PASS
Proyecto Supabase: `xezolunwsizllyqaxdkc`
Rama de evidencia/código: `acto/A19-organos-germinales`

## Resultado

T1 quedó aplicado en Supabase real y verificado con rollback transaccional de toda la evidencia de prueba.

Contrato vigente:

- `sessions` = Momento / contexto decisional mutable de check-in.
- `session_events` = journal append-only de hechos/decisiones; no segunda fuente de estado ni de Retorno.
- `experience_runs` = verdad canónica de una ayuda efectivamente iniciada/vivida y su Retorno.
- `MATCH != RUN`: match/PRE no crea Run; `Empezar` crea o reutiliza exactamente un Run.

## Historia de ejecución y seguridad

La primera aplicación de `T1_01` fue abortada antes de tocar funciones porque el runtime anterior no podía garantizar la transferencia íntegra de los SQL largos. Se ejecutó rollback completo y se verificó que la base volviera a 0 columnas/constraints/index T1 y 165 runs.

Con capacidad de lectura por rangos exactos, T1 se reaplicó de forma atómica por unidades versionadas:

1. `t1_01_run_contract_reapply`
2. `t1_02_selector_match_without_run`
3. `t1_02_start_experience_pre_without_run`
4. `t1_02_fuente_pre_without_run`
5. `t1_02_sanctuary_replay_pre_without_run`
6. `t1_03_accept_boundary_hardening`

La migración histórica `t1_rollback_after_incomplete_apply` queda deliberadamente en el historial como evidencia del rollback seguro del primer intento.

## Cambio vivo

`public.experience_runs` incorpora de forma aditiva:

- `selection_source text`
- `served_capability_key text`
- `realization_type text`
- `offer_snapshot jsonb`

Guardarraíles:

- `experience_runs_selection_source_check`
- `experience_runs_realization_type_check`
- índice único parcial `experience_runs_offer_token_uidx` sobre `offer_snapshot->>'offer_token'`

Backfill conservador verificado sobre 165 runs históricos:

- 111 con `selection_source` derivable.
- 111 con `realization_type` derivable.
- 145 con `served_capability_key` derivable.
- no se inventó `offer_snapshot` histórico.

El trigger `lumi_normalize_experience_run_context` quedó `canonical-first` con fallback legacy.

## Funciones vivas

### `lumi_select_experience`

- resuelve oferta, no crea `experience_run`;
- no escribe `sessions.selected_experience_id`;
- no escribe `sessions.last_no_match_*`;
- NO_MATCH se registra como `session_events.action_type='no_match'` con metadata reconstruible;
- `session_experience_shown` conserva el hecho de oferta mostrada.

### `lumi_start_experience`

- devuelve `EXPERIENCE_PRE` sin Run;
- propaga `offer_token` en la acción `open_resource_viewer`;
- deja `currentExperienceRunId=''` y conserva `currentExperienceId/currentResourceId`.

### `lumi_open_experience`

- Fuente abre PRE, no Run;
- emite `offer_token` y snapshot de origen mínimo.

### `lumi_restart_experience`

- replay desde Santuario abre PRE, no Run;
- valida item/origen y emite token sin materializar ejecución.

### `lumi_open_resource_viewer`

- es la frontera única de inicio para motor/Fuente/Santuario;
- exige PRE válida (`experience_id + offer_token`) para crear Run nuevo;
- revalida la oferta específica del motor sin rerankear;
- soporta idempotencia por token;
- conserva viewer legacy sin token/experiencia como adaptador transitorio;
- registra evento `opened` accesorio enlazado al Run cuando hay sesión, sin duplicar Retorno.

## Verificación reproducible

Se ejecutó `docs/backend/pending/T1_verify.sql` exactamente contra Supabase real dentro de transacción con `ROLLBACK` final.

Resultado: PASS sin excepción. El script verifica:

1. MATCH positivo devuelve oferta y no crea Run.
2. PRE sin `Empezar` deja cero Runs.
3. `Empezar` crea exactamente un Run canónico.
4. doble `Empezar` con mismo token reutiliza el mismo Run.
5. Retorno actualiza el mismo Run sin duplicar feedback en `session_events`.
6. NO_MATCH crea cero Runs y exactamente un journal canónico.
7. no se escriben claves legacy como autoridad nueva.

Además se ejecutó un smoke transaccional por `lumi_dispatch` usando payload equivalente a `useLumi.buildParams()`:

- motor: PASS;
- Fuente: PASS;
- Santuario: PASS;
- viewer legacy sin oferta canónica: PASS.

Esto verifica compatibilidad real de la frontera React → dispatcher → RPC, no sólo invocaciones directas de funciones.

## Postcondición de datos

Después de todas las pruebas y rollbacks:

- `experience_runs`: 165 (sin runs de prueba persistidos).
- sesiones de test T1 persistidas: 0.
- eventos de test T1 persistidos: 0.
- runs live con `offer_snapshot.contract='t1_checkin_match_run_v1'`: 0, esperado porque todas las pruebas fueron rollback.
- columnas T1: 4.
- constraints T1: 2.
- índice T1: 1.

## DoD T1

1. MATCH positivo sin Run: PASS.
2. Ahora no / PRE sin inicio: PASS.
3. Empezar crea exactamente un Run con semántica canónica: PASS.
4. Retorno actualiza mismo Run sin evidencia duplicada: PASS.
5. NO_MATCH = cero Runs + journal: PASS.
6. sin nuevas escrituras legacy de autoridad: PASS.
7. compatibilidad transitoria existente: PASS, incluida ruta dispatcher y viewer legacy.

## Guardarraíles respetados

- no se creó `moments`;
- no se creó `pending_offers`;
- no se creó `experience_evidence`;
- no se borraron columnas legacy;
- no se consolidó `experience_hypotheses` como arquitectura nueva;
- no se tocó frontend ni Vercel;
- no se mergeó PR/branch a `main`.

## Aprendizaje

Para SQL versionado extenso, la unidad segura de ejecución no debe depender de copiar un archivo completo a través de una interfaz truncable. La vía usada finalmente fue: leer rangos exactos del artefacto versionado, aplicar unidades atómicas trazables y verificar cada una antes de continuar.

T1 queda materialmente cerrado. A19 continúa siendo el ACTO mayor vigente y no se considera cerrado por este hito.