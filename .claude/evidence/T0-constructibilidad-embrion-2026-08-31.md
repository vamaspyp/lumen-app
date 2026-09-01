# T0 · Preflight y pruebas de realidad del Embrión

Fecha: 2026-08-31
Rama operativa revisada: `acto/A19-organos-germinales`
Autoridad funcional/técnica: Especificación Funcional V2 + Especificación Técnica V1 vigentes.
Alcance: preflight; no se aplicó DDL/DML persistente ni cambio funcional de producto.

## 1. Ramas e identidad de trabajo

Inventario verificado:
- `main`
- `acto/A1-auditoria-base-codigo`
- `acto/A18-verificar-activos-criticos`
- `acto/A19-organos-germinales`
- `acto/A19-organos-germinales-sql`
- `acto/A19-organos-germinales-rollback`
- `acto/A20-runtime-minimo-skills`
- `acto/A20-write-preflight`

Para T0/A19 se revisó `acto/A19-organos-germinales`; no se asumió que `main` contuviera el trabajo reciente.

## 2. Baseline de código

El contenedor de esta sesión no tiene resolución DNS hacia github.com, por lo que no pudo clonar el repo ni ejecutar `npm run verify` localmente. Esta limitación se registra y no se simula.

Evidencia equivalente disponible: GitHub Actions run `33248029730` sobre head `79d706eb17161355d7fc6234f9bee05c856638b3` de `acto/A19-organos-germinales` concluyó `success`. El workflow de esa rama ejecuta `npm ci`, instala Chromium y corre exactamente `npm run verify`.

Resultado baseline: VERDE con evidencia CI para el head A19 revisado.

## 3. Snapshot técnico vivo de Supabase

Proyecto verificado: `GAIA MVP` (`xezolunwsizllyqaxdkc`).

Persistencia pública relevante presente: `sessions`, `session_events`, `experiences`, `experience_hypotheses`, `experience_runs`, `resources`, `sanctuary_items`, `user_area_faros`, `share_light_circulations`, `share_light_events`, `lumen_nodes`, `lumen_evolution_aspects`, `lumen_evolution_findings`, `lumen_evolution_cycles`.

Persistencia destino aún ausente en producción: compromisos, retornos longitudinales, mediciones de Faro, actos genéricos de derrame, testigos, Mercado, Círculos, Común y demás objetos `private` preparados por A19. El schema privado de A19 no fue aplicado.

Funciones vivas verificadas por nombre/definición: `lumi_dispatch`, `lumi_select_experience`, `lumi_start_experience`, `lumi_complete_experience_run`, `lumi_save_experience_to_sanctuary`, `lumi_get_presence_context`, `lumi_open_circulos`, `lumi_open_contribution_form`.

## 4. Prueba reproducible de match / NO_MATCH

MATCH positivo: se invocó `lumi_select_experience` dentro de transacción con rollback usando una combinación viva H1 + capacidad `agencia`. Resultado: `matched=true`, creó `run_id` dentro de la transacción y mantuvo `capability_key=expected_capability=agencia`. El rollback evitó persistencia de datos de prueba.

NO_MATCH: se invocó el mismo selector con capacidad imposible `__t0_no_match__` y sin session_id. Resultado: `matched=false`, `fallback_reason=no_hypothesis_found`.

Conclusión: ambos caminos básicos son reproducibles contra producción sin dejar datos de prueba.

## 5. Inconsistencia `session_events` CONFIRMADA

La tabla viva `public.session_events` expone `action_type`, `feedback`, `metadata`, `experience_id`, `experience_run_id`, etc. No expone `event_type` ni `event_data`.

La definición viva de `lumi_select_experience`, en la rama NO_MATCH con session_id, intenta insertar en `session_events(event_type,event_data,...)`.

Estado: FALLO DE CONTRATO CONFIRMADO por inspección estructural. Debe repararse en T1 y probarse forzando NO_MATCH con una sesión real/transaccional antes de confiar en analítica acumulable.

## 6. Preflight de acciones visibles

Se cruzaron las `actions_json` de nodos activos con funciones públicas `lumi_<action>`.

Todas resolvieron a RPC salvo dos:
- `native_share_light`
- `start_scan`

Ambas son excepciones legítimas y explícitas de frontend:
- `native_share_light` está resuelta por `ShareLightEditor` mediante Web Share API / clipboard y luego registra finalización por RPC;
- `start_scan` es una transición visual local tolerada de `LandingScan`; la continuación sí se despacha al backend.

Regla para el contract test agregado a E2: una action visible debe resolver a RPC/dispatcher, salida externa válida o handler local explícitamente allowlisteado. Cualquier otra action sin resolución debe fallar.

## 7. Revisión de `A19_organos_germinales.sql` contra E2 V1

### Seguridad
MANTENER: schema `private`, mínimos grants, mutaciones privadas para operaciones administrativas y `SECURITY DEFINER` con `search_path` restringido constituyen una buena base.

### Mercado
AJUSTAR antes de aplicar. A19 mezcla provider y oferta en `lumen_market_offers`; E2 exige separación mínima `lumen_providers` + `lumen_market_offers`, acreditación binaria/manual y listado sólo de providers acreditados. Mantener handoff externo y ausencia de pagos.

### Comunidad / curaduría
AJUSTAR antes de aplicar. La cola de `lumen_community_contributions` es reutilizable, pero necesita `contribution_type=resource|provider`, auditoría de revisión y cubrir experiencia donada. Además, E2 exige una bandeja interna mínima operable por Pauli/operador; SQL ad-hoc no es el contrato normal.

### Círculos
MAYORMENTE COMPATIBLE. Mantener persistencia privada + create/close + getter público. Retirar del script la activación automática de nodos `CIRCULOS_ENTRY/CIRCULOS_EMPTY`: la capacidad debe existir germinalmente pero la exposición permanece gobernada por BANCO. No crear participantes si no hay Círculo real activado.

### Común
AJUSTAR antes de aplicar. `lumen_common_entries` captura evidencia privada, pero E2 requiere separar evidencia estructurada y política: `source_kind`, claves/versión de taxonomía, `anonymization_status`, `curation_status`, política/licencia/criterio configurable y una prueba de exportabilidad sin PII. No copiar intimidad del run.

## 8. Resultado T0

T0 CERRADO.

DoD: baseline verde o fallas documentadas antes de escribir → CUMPLIDO.

Bloqueos/fallas trasladables a construcción:
1. reparar contrato NO_MATCH → `session_events` en T1;
2. revisar A19 conforme a los cuatro deltas anteriores antes de aplicar;
3. mantener contract test de acciones visibles con allowlist explícita para handlers locales;
4. ejecución local de `npm run verify` no disponible en este runtime; CI verde es la evidencia efectiva disponible.

No se aplicaron cambios a Supabase real ni se modificó lógica funcional del repo en T0.