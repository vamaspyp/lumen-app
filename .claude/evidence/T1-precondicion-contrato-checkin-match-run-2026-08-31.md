# T1 · Precondición canónica · Check-in → Match → Run

Fecha: 2026-08-31  
Estado: DECISIÓN TÉCNICA DERIVADA / PRECONDICIÓN DE T1  
Alcance: semántica y fronteras de persistencia. No modifica Supabase, producto ni comportamiento runtime.

## Autoridad y criterio

Esta decisión se deriva de:

- Especificación Funcional Constructiva del Embrión V2: `Momento / entrada` conserva el contexto suficiente para reconstruir la decisión; `Oferta / decisión` conserva qué se decidió y por qué; `Experience Run` es la fuente de verdad de cada ayuda vivida.
- Especificación Técnica Constructiva del Embrión V1: `experience_runs` debe conservarse como verdad de experiencia vivida y T1 debe normalizar run + reparar NO_MATCH sin big bang.
- T0 cerrado: realidad de repo/DB verificada, MATCH y NO_MATCH reproducibles y fallo de contrato `session_events` confirmado.
- Supabase vivo `xezolunwsizllyqaxdkc`, verificado nuevamente antes de esta decisión.

Principio aplicado: conservar lo sano, no duplicar entidades, dejar de escribir semántica legacy antes de retirarla físicamente.

---

## 1. `sessions` = Momento / entrada de una interacción

### Rol canónico

`sessions` es la realización física mínima del **Momento de entrada y contexto decisional mutable** para los flujos que nacen desde check-in.

Debe responder, mientras la interacción está viva:

- quién está atravesando el momento;
- hemisferio H1/H2;
- área/territorio cuando aplique;
- estado del momento cuando aplique;
- Faro activo cuando aplique;
- capacidad que la persona expresa/necesita;
- tiempo disponible;
- preferencia de formato relevante;
- ciclo de vida básico de la interacción.

No es:

- una fuente longitudinal de evidencia de ayuda;
- la verdad de la oferta seleccionada;
- la verdad del Run;
- una tabla de aprendizaje;
- una identidad psicológica de la persona.

### Regla de escritura nueva

Los pasos `lumi_start_checkin` y `lumi_submit_checkin_*` pueden seguir escribiendo el contexto decisional canónico de la sesión.

Se consideran **legacy de transición** y no deben ganar nuevas dependencias:

- `state` antiguo, frente a `state_key`;
- `help_intent_key`;
- `selected_ik_key`;
- `selected_experience_id` como supuesto estado de verdad del match;
- `last_no_match_*` como supuesto estado de verdad de NO_MATCH.

Esas columnas no se eliminan en T1. Se deja de consolidar su semántica y se retiran más adelante cuando no haya lectores reales.

### `moment_id`

No se crea una nueva tabla `moments` para rescatar `experience_runs.moment_id`. En la realidad viva, `moment_id` está 0/165 poblado y no existe una entidad operativa que lo sostenga. Para el Embrión, `sessions` cubre limpiamente el Momento cuando existe una interacción de check-in.

Un Run puede no tener `session_id` cuando nace desde otra puerta válida —por ejemplo Fuente o Santuario— siempre que el propio Run preserve origen y snapshot suficiente para reconstruir la decisión.

---

## 2. `session_events` = journal append-only de hechos y decisiones de interacción

### Rol canónico

`session_events` es un **registro de eventos/auditoría**, no una segunda fuente de estado ni una segunda fuente de evidencia del Run.

Su valor es conservar hechos puntuales que interesa poder reconstruir, especialmente cuando **no existe Run**.

Caso canónico inmediato de T1:

- NO_MATCH → `action_type = 'no_match'` + `metadata` estructurada.

Metadata mínima recomendada para NO_MATCH:

- `reason`;
- `selector_source/version` cuando corresponda;
- hemisferio;
- área/territorio cuando aplique;
- estado cuando aplique;
- Faro cuando aplique;
- capacidad solicitada/servida relevante;
- tiempo disponible;
- preferencia de formato;
- timestamp ya provisto por `created_at`.

NO_MATCH **no crea `experience_run`**.

### Relación con un Run

Cuando un evento describe un hecho accesorio de una ayuda ya iniciada, puede llevar `experience_run_id` como referencia de auditoría. Pero no debe duplicar como autoridad:

- señal de ayuda;
- reflexión;
- capacidad percibida;
- estado final de la experiencia.

Eso pertenece a `experience_runs`.

### Legacy

`intervention_key`, `help_intent_key`, `pattern_key` y el `feedback` histórico permanecen por compatibilidad/historia, pero no gobiernan nuevas decisiones.

`gaia_submit_session_action` se mantiene como adaptador de compatibilidad mientras haya llamadas vivas que lo necesiten. T1 no debe convertirlo en el contrato canónico de ejecución ni extender su semántica legacy.

---

## 3. `experience_runs` = verdad canónica de ejecución y Retorno

### Rol canónico

`experience_runs` es la **única fuente de verdad de una ayuda concreta que la persona efectivamente inició/vivió**.

Un Run debe permitir reconstruir:

- persona;
- puerta/origen de selección;
- sesión, si existió;
- UA/experiencia;
- realización/recurso;
- capacidad servida;
- hemisferio/Faro/contexto relevante;
- snapshot explicable de la oferta/decisión;
- inicio real;
- finalización si ocurrió;
- señal inmediata;
- capacidad percibida;
- reflexión;
- preservación posterior en Santuario.

T1 debe agregar, de modo aditivo, la semántica ya definida por E2:

- `selection_source`;
- `served_capability_key`;
- `realization_type`;
- `offer_snapshot`.

Las columnas `expected_capability_key`, `experience_hypothesis_id`, `hypothesis_json` legacy, `ik_key`, `help_intent_key` y `legacy_*` se mantienen temporalmente para lectura/migración; no deben gobernar lógica nueva.

---

## 4. Frontera crítica: MATCH ≠ RUN

La realidad actual crea `experience_runs` dentro de `lumi_select_experience`, antes de que la persona pulse **Empezar** en `EXPERIENCE_PRE`.

Eso mezcla dos hechos diferentes:

1. **MATCH / OFERTA:** LUMEN encontró algo elegible y lo propuso.
2. **RUN / EJECUCIÓN:** la persona aceptó e inició la ayuda.

La semántica canónica queda fijada así:

### Check-in

1. `lumi_start_checkin` crea/abre `sessions`.
2. `lumi_submit_checkin_*` actualiza sólo el contexto necesario para decidir.

### Match

3. El selector lee `sessions` y resuelve una oferta elegible.
4. Si no hay match: registra `session_events(action_type='no_match', metadata=...)`; no crea Run.
5. Si hay match: devuelve la oferta/decisión para `EXPERIENCE_PRE`; **todavía no crea Run**.

### Run

6. La persona pulsa **Empezar** / acepta la realización.
7. En esa frontera backend se valida nuevamente la oferta y se crea exactamente un `experience_run`.
8. `started_at` significa inicio real de la ayuda, no momento de matching.
9. Viewer/experiencia opera con ese `run_id`.
10. Cierre/feedback actualiza el mismo Run.
11. Santuario referencia ese Run cuando la persona decide conservarlo.

Esta regla debe aplicarse progresivamente también a Fuente/Santuario: abrir una ficha o recibir una PRE no equivale a iniciar un Run. El punto de creación debe converger en una única frontera de aceptación/inicio.

---

## 5. Política de transición / no consolidación legacy

T1 es **aditivo y estrangulador**, no destructivo:

- no borrar columnas legacy;
- no crear tablas paralelas `moments`, `experience_evidence` u otra duplicación;
- no dual-writear `selected_experience_id` ni `last_no_match_*` sólo por compatibilidad si no hay lector real verificado;
- no usar `session_events.feedback` como verdad del Retorno;
- no usar `experience_hypotheses`/`expected_capability_key` como nueva autoridad del motor;
- backfill sólo cuando la equivalencia semántica sea verificable; ante ambigüedad, dejar NULL/NO_VERIFICADO.

---

## 6. DoD añadido a T1

Antes de cerrar T1 debe probarse, además de lo ya previsto en E2:

1. MATCH positivo devuelve una oferta y **no crea Run**.
2. `Ahora no` después de PRE deja **cero Runs nuevos**.
3. `Empezar` crea **exactamente un Run** con `started_at`, `selection_source`, `served_capability_key`, `realization_type` y `offer_snapshot` coherentes.
4. cierre/feedback actualiza ese mismo Run; no crea evidencia duplicada en `session_events`.
5. NO_MATCH crea **cero Runs** y un `session_events.action_type='no_match'` válido con metadata reconstructible.
6. T1 no introduce nuevas escrituras a `sessions.selected_experience_id`, `sessions.last_no_match_*`, `session_events.intervention_key/help_intent_key/pattern_key` ni `experience_runs` legacy como autoridad.
7. los flujos existentes permanecen compatibles mientras las columnas legacy aún existan.

---

## 7. Evidencia viva que motivó la decisión

Supabase leído el 2026-08-31:

- `sessions`: 673 filas; `selected_experience_id` 80; `last_no_match_at` 1. Ninguna función viva distinta de `lumi_select_experience` referencia esos campos; en el selector son escrituras, no consumo posterior verificado.
- `experience_runs`: 165; 94 con `session_id`; 71 sin sesión; 88 completados; 77 no completados; `moment_id` 0/165.
- `session_events`: 430; sólo 7 enlazados a `experience_run_id`; el corpus es predominantemente telemetría/compatibilidad histórica.
- la cadena viva `start_checkin → submit_checkin_* → start_experience → select_experience` usa `sessions` como contexto de decisión.
- `lumi_select_experience` crea hoy el Run durante MATCH y escribe `sessions.selected_experience_id`.
- `EXPERIENCE_PRE` ofrece explícitamente `Empezar` / `Ahora no`, demostrando que el inicio ocurre después del match.
- `lumi_complete_experience_run` y Santuario ya usan `experience_runs` como evidencia de ejecución, confirmando que ésa es la estructura sana a consolidar.

## Resultado

Contrato resuelto. T1 debe implementarse contra esta separación semántica antes de modificar el runtime: **sessions = Momento**, **session_events = journal**, **experience_runs = ejecución real**; y **MATCH no crea RUN**.
