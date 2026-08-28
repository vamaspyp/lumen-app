# A1 · Auditoría acumulativa única de base y código

Fecha: 2026-08-28
ACTO: A1 · F1 · Embrión que late
Actor efectivo: chatgpt-conductor-alternate vía V25
Estado de este informe: CERRABLE contra DoD de A1; no modifica producto, base ni autoridad.

## Contrato de verificación

Cada dato material está clasificado como **LEÍDO**, **DERIVADO** o **NO_VERIFICADO**. LEÍDO significa observado directamente en la fuente real; DERIVADO significa conclusión lógica explícita a partir de datos LEÍDOS; NO_VERIFICADO significa que la evidencia disponible no alcanza para sostenerlo.

Autoridad leída: V3 Sistema de Conducción; V4 Especificación vigente del Embrión; V25 Skill de construcción; V30 Catálogo canónico de Gestos; V32 Modelo IA-Native/EXO-Lean/autopoiético. V6 figura VIGENTE en ACTIVOS, pero su artefacto individual no fue resuelto y leído en esta ejecución: toda comparación normativa específica contra V6 queda NO_VERIFICADO.

## 1. Código y bus técnico

- **LEÍDO** · Repo real: `vamaspyp/lumen-app`. `main` = `5821d6c8c456ea12d7889ef0c0fb7d7ed892c1a9` al auditar.
- **LEÍDO** · CI de ese commit en `main`: GitHub Actions run `32597848400`, conclusión `success`.
- **LEÍDO** · Frontend React/TypeScript/Vite. `src/App.tsx` consume estado/acciones desde `useLumi`.
- **LEÍDO** · Camino ordinario de acciones: `useLumi.dispatch` llama `supabase.rpc('lumi_dispatch', { p_action, p_params })`.
- **LEÍDO** · RPCs directos acotados fuera del dispatcher en frontend: `lumi_update_share_light_text`, `lumi_complete_share_light`, `lumi_open_shared_light`, `lumi_get_init_data`; además Supabase Auth. `start_scan` y `native_share_light` se resuelven localmente por ser efectos técnicos/cliente.
- **DERIVADO** · La arquitectura real es mayormente compatible con “Supabase decide → dispatcher ejecuta → React renderiza”, pero React no es literalmente pasivo: contiene efectos técnicos locales, un guard de navegación en recepción de Circular Luz y composición de algunas acciones de check-in. No se observó un segundo motor de matching en React.
- **LEÍDO** · `e2e/smoke.spec.ts` sólo certifica montaje mínimo del shell y ausencia de errores de página; no certifica recorrido end-to-end del organismo ni órganos germinales.
- **NO_VERIFICADO** · Estado desplegado actual en Vercel/producción. No fue necesario ni había integración Vercel efectiva para A1.

## 2. Base real y contratos

- **LEÍDO** · Supabase `xezolunwsizllyqaxdkc`, estado `ACTIVE_HEALTHY`, PostgreSQL 17.6.1.063.
- **LEÍDO** · Conteos exactos durante la auditoría: `users=94`, `sessions=673`, `experiences=86`, `experience_hypotheses=211`, `resources=158`, `experience_runs=165`, `sanctuary_items=2`, `person_capability_signals=0`, `share_light_circulations=5`, `lumen_nodes=95`.
- **LEÍDO** · Rutinas públicas: 99 `lumi_*` y 3 `gaia_*`. Hay 196 hipótesis activas, 80 experiencias activas y 73 recursos activos.
- **LEÍDO** · No existen relaciones públicas cuyo nombre contenga `gest` o `cell`.
- **LEÍDO** · `lumi_dispatch(p_action,p_params)` es `SECURITY DEFINER`, transforma dinámicamente una acción en `lumi_<action>` y ejecuta esa función; no contiene `auth.uid()`.
- **LEÍDO** · `lumi_select_experience` y `lumi_checkin_candidates` referencian `experience_hypotheses`; no contienen referencias textuales a `gesture` ni `cell`. `lumi_select_experience` persiste `experience_hypothesis_id`/`hypothesis_json` en `experience_runs`.
- **DERIVADO** · El matching operativo actual sigue materializado sobre hipótesis/capacidades/hemisferios y conserva legado; la identidad canónica de Gestos existe en V30, pero su traducción a la implementación actual no está materializada mediante relaciones Gestos/Celdas nombradas. Si esto viola o no el diseño técnico V6 es **NO_VERIFICADO** hasta leer V6 individualmente.
- **LEÍDO** · De 165 `experience_runs`, 88 están completados, 12 tienen `canonical_help_signal`, 45 `perceived_capability_key` y 82 `experience_hypothesis_id`.
- **LEÍDO** · `person_capability_signals` existe pero tiene 0 filas al momento de la auditoría.
- **DERIVADO** · Hay infraestructura de evidencia longitudinal real, pero la señalización canónica/capacidad está todavía parcialmente poblada; no corresponde inferir calidad de aprendizaje sólo por existencia de tablas.

## 3. Órganos germinales relevantes para F1/A19

- **LEÍDO** · MERCADO: 0 funciones dedicadas con `market/mercad` y 0 nodos dedicados con `market/mercad`.
- **LEÍDO** · COMÚN: 0 funciones dedicadas y 0 nodos dedicados por identidad `comun/common`.
- **LEÍDO** · COMUNIDAD/participación: existe `lumi_open_contribution_form` y nodos de contribución, pero `CONTRIBUTION_FORM` emite `submit_contribution` y no existe `lumi_submit_contribution`.
- **LEÍDO** · CÍRCULOS: existe `lumi_open_circulos`, pero referencia `public.lumi_get_circulos_activities`, función inexistente. Los nodos `CIRCULOS_EMPTY`, `CIRCULOS_ENTRY`, `ACTIVITY_DETAIL` e `INTEREST_EXPRESSED` están `active=false`; `lumi_get_node` sólo devuelve nodos activos.
- **LEÍDO** · Auditoría automática de referencias internas `public.lumi_*` encontró una única llamada interna inexistente: `lumi_open_circulos → lumi_get_circulos_activities`.
- **LEÍDO** · Acciones de nodos sin handler `lumi_*`: `express_interest`, `native_share_light`, `start_scan`, `submit_contribution`. `native_share_light` y `start_scan` están verificados como handlers técnicos locales del frontend; `submit_contribution` se despacha al backend y carece de handler. `express_interest` pertenece a nodos inactivos y no se encontró handler frontend específico.
- **DERIVADO** · A19 está correctamente abierto: los cuatro órganos no pueden considerarse vivos/reproducibles todavía. Este informe no construye esos órganos.

## 4. Guardarraíl E4 / seguridad de la base

- **LEÍDO** · Las tablas base públicas inspeccionadas tienen RLS deshabilitado.
- **LEÍDO** · `anon` y `authenticated` poseen privilegios amplios sobre numerosas tablas públicas, incluidas `users`, `sessions`, `experience_runs` y `sanctuary_items`.
- **LEÍDO** · Supabase Security Advisor marca `rls_disabled_in_public` como **ERROR** para tablas del esquema `public` expuestas a PostgREST, incluidas las anteriores; también marca dos vistas `SECURITY DEFINER` (`view_sanctuary_items`, `v_sanctuary_cards`).
- **LEÍDO** · Existen 97 funciones `SECURITY DEFINER` en `public`; 95 son ejecutables por `anon`; sólo 4 de las 97 contienen referencia textual a `auth.uid()`.
- **LEÍDO** · Security Advisor además marca múltiples funciones `SECURITY DEFINER` ejecutables por `anon/authenticated`, y `lumi_dispatch`/otras funciones con `search_path` mutable.
- **DERIVADO** · Existe un desvío material de seguridad/privacidad que debe tratarse como guardarraíl E4. La explotabilidad exacta y la corrección correcta de cada RPC/política no se determinan en A1; eso pertenece a A11, ya abierto.
- **NO_VERIFICADO** · Qué subconjunto exacto de los privilegios amplios es intencional por diseño. Requiere A11 y autoridad técnica específica.

## 5. Legado y transición

- **LEÍDO** · Persisten 3 rutinas `gaia_*` en `public`; Security Advisor confirma que son `SECURITY DEFINER` ejecutables por roles cliente.
- **LEÍDO** · Esquema actual conserva campos legacy como `ik_key`, `help_intent_key`, `legacy_ik_key`, `legacy_help_intent_key` en varias tablas, a la vez que conviven `hemisphere_key`, `faro_key`, `selected_capability_key`, `primary_capability_key` y `canonical_help_signal`.
- **DERIVADO** · La base está en transición acumulativa, no limpia desde cero. La mera presencia de columnas legacy no prueba que gobiernen decisiones; sí obliga a verificar cada flujo antes de eliminarlas o apoyarse en ellas.

## 6. NO_VERIFICADO consolidado

1. Contenido individual y contrato técnico exacto de V6; el índice ACTIVOS lo declara VIGENTE, pero esta ejecución no resolvió el archivo puntual.
2. Estado desplegado actual de Vercel/producción y correspondencia exacta con `main`.
3. Explotabilidad concreta de cada exposición/RPC detectada y política de seguridad deseada; pertenece a A11.
4. Calidad real del matching y del aprendizaje humano: A1 verifica implementación/estado, no impacto en personas.
5. Ejecución end-to-end completa del Embrión y los cuatro órganos germinales: pertenecen a A2/A19.

## 7. Resultado A1

La pasada acumulativa de código y base quedó realizada con origen explícito por dato y pendientes materiales marcados como NO_VERIFICADO. No se modificó código de producto, esquema, datos, Norte, Objetivos, Señales ni Focos.

Hallazgos que ya tienen contenedor en el Sistema y no crean trabajo paralelo:
- A11: seguridad/guardarraíl E4.
- A19: Mercado, Comunidad, Círculos y Común germinales.
- A2: recorrido completo y cortes de punta a punta.

## 8. Devolución estructurada

ESTADO: CERRADO

EVIDENCIA: repo/main `5821d6c8c456ea12d7889ef0c0fb7d7ed892c1a9`; CI main `32597848400`; Supabase `xezolunwsizllyqaxdkc`; V25; este informe; consultas de catálogo, contratos, conteos, seguridad y referencias internas realizadas 2026-08-28.

RESULTADO: estado real consolidado de código/base con diferencias verificables, sin proponer ni ejecutar correcciones fuera de A1.

APRENDIZAJE: el mayor riesgo inmediato no es sólo legado funcional; existe deuda de seguridad E4 confirmada por el advisor. En F1, los vestigios de Círculos/participación no equivalen a órganos vivos. La implementación de matching sigue apoyada en hipótesis y necesita ser comparada contra V6 antes de decidir refactor.

REFERENCIAS: A1 · F1 · V3 · V4 · V7 · V8 · V11 · V25 · V30 · V32 · A2 · A11 · A19.

ESFUERZO REAL: `persona_h=0; agente_sesiones=1`.
