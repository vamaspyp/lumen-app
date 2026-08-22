# LUMEN — Briefing para Claude Code (actualizado 22 ago 2026)

## Qué es LUMEN
Plataforma de bienestar en español con un compañero de IA **determinístico** llamado LUMI (cero LLM). Misión: ayudar a cada persona a sentirse un poco mejor ahora y vivir progresivamente mejor con el tiempo.

## Principio rector
LUMEN no gestiona contenidos. LUMEN gestiona **capacidad de ayuda**.
La unidad estratégica principal no es el recurso — es la ayuda ofrecida.

## Stack técnico
- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Supabase/PostgreSQL (proyecto xezolunw)
- **Deploy:** Vercel → lumen-vamas.vercel.app
- **Repo:** github.com/vamaspyp/lumen-app
- **Dev:** VS Code + Claude Code extension

## Definition of Done
Para cambios significativos, `npm run verify` (lint + build + smoke Playwright) debe quedar verde. Si `verify` falla, el cambio no está terminado.
Cuando el cambio afecte experiencia visible, además de los tests automatizados, usar Playwright MCP para inspección/verificación cuando esté disponible y sea útil.

## Jerarquía operativa

Para decisiones de producto/modelo:
1. Canon vigente y decisiones posteriores explícitamente cerradas.
2. Documentación histórica como contexto, nunca para reintroducir legado.

Para decisiones técnicas:
1. Código actual.
2. DB/RPC/datos actuales verificados.
3. Baseline/dumps fechados solo como evidencia histórica.
4. Documentación técnica.

Ante contradicción técnica, no asumir: verificar estado real antes de proponer o ejecutar cambios.

## VA+LUMEN Base Viva V1

VA+LUMEN Base Viva V1 es la primera expresión mínima pero integral del organismo destinada a operar, aprender y evolucionar.

Sistema operativo:
NORTE → SIGNOS VITALES → SEÑALES → HALLAZGOS → AGENDA EVOLUTIVA (máx. 3) → ACCIÓN MÍNIMA → EJECUCIÓN → RESULTADO → APRENDIZAJE → INTEGRACIÓN → REPETIR.

Signos vitales: Ayuda, Capacidad, Circulación, Evolución, Sustentabilidad.
Guardrails: Autonomía, Confianza, Simplicidad.

Principio: si podemos aprender haciéndolo, hacemos antes de seguir diseñando. Ante igualdad de valor, gana la solución más simple de construir, operar, explicar y evolucionar.

## Estructura del proyecto (post-refactor)
```
src/
  App.tsx              — shell principal (~284 líneas)
  main.tsx             — entry point
  lib/
    useLumi.ts         — hook principal: auth, state, dispatch
    supabase.ts        — cliente Supabase
    tokens.ts          — tokens cromáticos por módulo (paleta nordic/zen)
    embedHelpers.ts    — helpers para URLs embebibles
  components/
    Pill.tsx              — pills (voz de la persona)
    LumiOrb.tsx           — orb con animación sólido-energético
    BottomNav.tsx         — navegación inferior
    ResourceCard.tsx      — ficha de recurso con CTA dinámico
    SanctuaryDetail.tsx   — detalle de ítem del santuario (experiencia completa)
    ExperiencePreview.tsx — ficha extendida de La Fuente (nueva)
    RegisterForm.tsx      — registro LUMI-céntrico (nuevo)
    NamePrompt.tsx        — captura de nombre
    NoteEditor.tsx        — editor de notas
    ListFilterPanel.tsx   — filtros de listas (incl. filtro Necesito)
    GuidedPractice.tsx    — práctica guiada paso a paso (Capa 1)
    ResourceViewer.tsx    — viewer full-screen (createPortal)
    LandingScan.tsx       — escaneo de llegada (momento de aterrizaje)
    ContentArea.tsx       — router de contenido (incl. handler experience_preview)
docs/
  backend/             — dumps de DB y SQLs aplicados
```

## Arquitectura canónica (inamovible)
- **Supabase** = cerebro/orquestador — **React** = shell/render/captura — **Dispatcher** = intérprete técnico — **nodos** = estado conversacional
- **Supabase decide - dispatcher ejecuta - React renderiza pasivamente**
- lumi_dispatch(p_action, p_params) es el dispatcher universal
- gaia_submit_session_action es el único punto de registro de señales
- Componentes son **pasivos**: leen content, no state del backend
- **Una sola voz a la vez** — nunca dos mensajes simultáneos de LUMI
- **Pills son la voz de la persona** — primera persona, no comandos
- Node-chaining canónico: nunca dos conjuntos de acciones en un nodo
- Pill variants (solid/outline/ghost) vienen del backend en actions_json

## HISTÓRICO — Modelo de ayuda MVP y 12 Intervention Keys
No verificado como canon vigente. Contexto histórico únicamente — no reintroducir como motor central sin verificar primero contra el Canon y las decisiones posteriores (ver Jerarquía operativa).

Estado - Prevalencia - Intervention Key - Patrón - Instancia (Recurso) - Feedback - Santuario

abrir_sentido, bajar_la_velocidad, cerrar_el_dia, cultivar_gratitud,
dar_un_paso_minimo, descansar_sin_exigirte, nombrar_lo_que_pasa,
ordenar_lo_que_importa, recordar_un_vinculo, suavizar_la_friccion,
volver_a_lo_que_ayudo, volver_al_cuerpo

## HISTÓRICO — 9 Estados MVP
No verificado como canon vigente. No asumir vigencia sin confirmar.

abierto, ansioso, bajo, bien, cansado, cargado, confundido, irritado, solo

## Contenido actual
- 12 prácticas Capa 1 (LUMEN nativas, español, GuidedPractice)
- 33 recursos Capa 2 (YouTube español embebido) — con depth_level para filtro de redescubrimiento
- 3 escaneos de llegada (SCAN_BREATHE, SCAN_BODY, SCAN_COMPASSION)

## HISTÓRICO — Tablas y funciones backend (snapshot post 26 jun 2026)
No verificado como estado actual — no asumir que describe el backend vigente.
- `user_life_model` — modelo de vida del usuario (creada hoy)
- `help_capacity_index` — índice de capacidad de ayuda (creada hoy)
- `lumi_dispatch` — dispatcher universal
- `lumi_select_experience` — con filtro depth_level; versión legacy eliminada
- `lumi_open_sanctuary` — con depth condicional (redescubrimiento)
- `lumi_get_init_data` — incluye momentos de reflejo sobrio
- `gaia_submit_session_action` — único punto de registro de señales

## Regla de backend
Antes de modificar Supabase, solicitar/obtener evidencia actual de schema, funciones/RPC afectados y datos relevantes. No inferir el backend actual desde dumps históricos.
`docs/backend/LUMEN - DB Full (22-07-2026).csv` es un snapshot histórico y NO fuente actual.

## Paleta Nordic/zen
- LUMI: salvia #8FA38C / deep #5F7A5E
- Fuente: bronce #9B7A52 / deep #6E5536
- Santuario: dorado tierra #A88860 / deep #7A6240
- Círculos: azul niebla #7090B5 / deep #4A6A8E
- Fondo: tiza arena #F4EFE6
- Texto: marrón cálido #3A332A

## Reglas de LUMI
- Amable, gentil, serena, no intrusiva, no coach
- Primera persona humilde
- NO genera ni reinterpreta sabiduría — toda Fuente verificable
- Si no hay match, dice "no tengo algo claro" — no inventa
- Recursos viven DENTRO de LUMEN (embebidos). Salir afuera es excepción
- Santuario: no dispara feedback post-viewer

## Errores conocidos (no repetir)
- ResourceCard NUNCA referencia state.currentSessionId directamente
- Strings vacíos en result.state NO limpian IDs del hook
- React 18 StrictMode monta dos veces — patrón singleton para auth
- content.resource_id (no content.id) para extraer ID del recurso
- buildParams incluye source: state.contentSource para routing post-viewer
- Verificar funciones existentes antes de CREATE OR REPLACE
- Un nodo = un estado. Node-chaining para múltiples fases

