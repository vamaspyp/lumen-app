# LUMEN — Briefing para Claude Code (actualizado 27 jun 2026)

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
- **Supabase decide - dispatcher ejecuta - React renderiza pasivamente**
- lumi_dispatch(p_action, p_params) es el dispatcher universal
- gaia_submit_session_action es el único punto de registro de señales
- Componentes son **pasivos**: leen content, no state del backend
- **Una sola voz a la vez** — nunca dos mensajes simultáneos de LUMI
- **Pills son la voz de la persona** — primera persona, no comandos
- Node-chaining canónico: nunca dos conjuntos de acciones en un nodo
- Pill variants (solid/outline/ghost) vienen del backend en actions_json

## Modelo de ayuda canónico MVP
Estado - Prevalencia - Intervention Key - Patrón - Instancia (Recurso) - Feedback - Santuario

## 12 Intervention Keys canónicas
abrir_sentido, bajar_la_velocidad, cerrar_el_dia, cultivar_gratitud,
dar_un_paso_minimo, descansar_sin_exigirte, nombrar_lo_que_pasa,
ordenar_lo_que_importa, recordar_un_vinculo, suavizar_la_friccion,
volver_a_lo_que_ayudo, volver_al_cuerpo

## 9 Estados MVP
abierto, ansioso, bajo, bien, cansado, cargado, confundido, irritado, solo

## Contenido actual
- 12 prácticas Capa 1 (LUMEN nativas, español, GuidedPractice)
- 33 recursos Capa 2 (YouTube español embebido) — con depth_level para filtro de redescubrimiento
- 3 escaneos de llegada (SCAN_BREATHE, SCAN_BODY, SCAN_COMPASSION)

## Tablas y funciones backend activas (post 26 jun 2026)
- `user_life_model` — modelo de vida del usuario (creada hoy)
- `help_capacity_index` — índice de capacidad de ayuda (creada hoy)
- `lumi_dispatch` — dispatcher universal
- `lumi_select_experience` — con filtro depth_level; versión legacy eliminada
- `lumi_open_sanctuary` — con depth condicional (redescubrimiento)
- `lumi_get_init_data` — incluye momentos de reflejo sobrio
- `gaia_submit_session_action` — único punto de registro de señales

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

## Deployado 26 jun 2026
- CTA dinámico en ResourceCard
- Filtro "Necesito" en ListFilterPanel
- Redescubrimiento en Santuario: lumi_open_sanctuary con depth condicional
- No-match copy actualizado; Nortes copy unificado y redundancia eliminada
- depth_level en resources + filtro en lumi_select_experience; legacy eliminada
- user_life_model y help_capacity_index creadas
- Momentos de reflejo sobrio: lumi_get_init_data + render en App.tsx

## Deployado hoy (27 jun 2026)
- Anonymous Auth: ensureUser + linkAccount en useLumi (acceso sin registro)
- ExperiencePreview.tsx: ficha extendida de La Fuente (nuevo componente)
- ContentArea: handler experience_preview conectado al nuevo componente
- RegisterForm.tsx: componente de registro LUMI-céntrico (nuevo componente)
- Conexión RegisterForm en ContentArea y App.tsx
- SanctuaryDetail: ajustes hacia experiencia completa (+121 líneas)

## Pendientes próxima sesión (prioridad)
- Auditoría de fuentes (verificar que todos los recursos son válidos/embebibles)
- QA 90 segundos pre-beta (flujo completo end-to-end)

### Backend (medio plazo)
- Crear tabla patterns (pattern_key, intervention_key, name, description)
- Crear tabla state_intervention_prevalence (state, IK, priority, weight)
- Agregar pattern_id a resources, sessions, session_events, sanctuary_items
- Agregar selected_intervention_key y selected_pattern_id a sessions
- Poblar patrones (~36-60) y prevalencia (9x12)
- Evolucionar motor para usar prevalencia + patrones

### Frontend (mejoras)
- Layout LUMI/mensaje/pills en pantalla completa
- Colores Fuente vs Santuario más diferenciados
- LUMI sticky al scrollear
- Íconos por área de vida (esperando decisión de Pauli)
- PWA (manifest + service worker + íconos)

### Post-MVP
- Audio Capa 1 (ElevenLabs)
- Factor sonoro (Suno AI)
- HCI complejo
- Comunidad + autopoiesis
- Modo proactivo
