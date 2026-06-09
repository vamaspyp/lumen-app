# LUMEN — Briefing para Claude Code

## Qué es LUMEN
Plataforma de bienestar en español con un compañero de IA **determinístico** llamado LUMI (cero LLM). La misión: ayudar a cada persona a sentirse un poco mejor ahora y vivir progresivamente mejor con el tiempo.

## Stack técnico
- **Frontend:** React 18 + TypeScript + Vite (este repo)
- **Backend:** Supabase/PostgreSQL (proyecto `xezolunw`)
- **Estado actual:** MVP en desarrollo local (`npm run dev` → localhost:5173)
- **Deploy futuro:** Vercel + PWA (no está implementado todavía)

## Estructura del proyecto
```
src/
  App.tsx          ← componente principal, toda la UI
  main.tsx         ← entry point
  lib/
    useLumi.ts     ← hook principal: auth, state, dispatch al backend
    supabase.ts    ← cliente Supabase
    tokens.ts      ← sistema de tokens cromáticos por módulo (paleta nordic/zen)
    embedHelpers.ts ← helpers para URLs embebibles (YouTube, Spotify, etc.)
docs/
  backend/
    DB - rpcs-dump.csv      ← dump de todas las funciones RPC del backend
    DB - schema con data.csv ← DDL completo con datos
```

## Arquitectura (canon inamovible)
- **Supabase decide → dispatcher ejecuta → React renderiza.** Separación de capas pura.
- `lumi_dispatch(p_action, p_params)` es el dispatcher universal. Recibe una acción como string, llama dinámicamente a `lumi_{action}(p_params)`.
- `gaia_submit_session_action` es el único punto de registro de señales. No dispersar.
- Los componentes son **pasivos**: leen de `content`, nunca de `state` del backend.
- El front usa `useLumi()` hook que expone `{ state, dispatch }`.

## Reglas de LUMI (voz y comportamiento)
- **Una sola voz a la vez.** Nunca dos mensajes simultáneos.
- **Pills son la voz de la persona** en el diálogo — primera persona, no comandos ("Quiero probarlo", no "ABRIR RECURSO").
- **LUMEN no genera ni reinterpreta sabiduría.** Toda fuente debe ser verificable externamente.
- **Recursos viven DENTRO de LUMEN** (embebidos). Salir afuera es excepción forzada.
- **El motor es honesto:** si no hay match, dice "no tengo algo claro" — no inventa.
- **Voz:** amable, gentil, serena, no intrusiva, no coach. Primera persona humilde.

## Módulos y tokens
Cuatro módulos con identidad visual propia (definidos en `tokens.ts`):
- **lumi** (home) — salvia `#8FA38C`
- **fuente** (biblioteca) — bronce `#9B7A52`
- **sanctuary** (espacio personal) — dorado tierra `#A88860`
- **circles** (comunidad) — azul niebla `#7090B5`

Paleta general: fondo tiza arena, textos marrón cálido (no negro), bordes casi imperceptibles.

## Flujo principal (check-in)
1. Usuario llega → `go_home` → LUMI saluda (con nombre si lo tiene)
2. Check-in: estado → área → tiempo (3 pasos, cada uno un dispatch)
3. Motor propone recurso → `resource_card` aparece
4. Usuario abre → viewer (embebido o externo)
5. Cierra viewer → feedback ("Me dejó un poco mejor" / "No era para mí")
6. Puede guardar en Santuario

## Campos clave del state en useLumi
- `currentSessionId` y `currentResourceId` se preservan entre dispatches (no se limpian con strings vacíos del backend)
- `checkinState`, `checkinArea`, `checkinTime` acumulan las selecciones del check-in
- `contentSource` determina qué módulo de tokens aplicar

## Comunicación
- Idioma: español rioplatense, directo
- Entregar archivos completos o bloques completos, no fragmentos quirúrgicos
- Contradecir si algo viola el canon
- Pensar siempre en modo LUMEN desde la visión completa del sistema

## Errores conocidos (no repetir)
- `ResourceCard` NUNCA debe referenciar `state.currentSessionId` directamente (causa ReferenceError silencioso)
- `coalesce(active, true)=true` necesario para nodos con `active=NULL`
- `content.resource_id` es el campo correcto (no `content.id`) para extraer el ID del recurso
- Strings vacíos en `result.state` NO deben limpiar IDs ya seteados en el state del hook
- React 18 StrictMode en dev monta dos veces — usar patrón singleton para auth
