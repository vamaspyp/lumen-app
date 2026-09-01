# A19 · Construir y verificar los cuatro órganos germinales

Fecha: 2026-08-29
FOCO: F1 · Embrión que late
ACTO estructurado en V3: ABIERTO
Condición material al cierre de esta evidencia: EN CURSO · delta preparado, no aplicado a Supabase real.
Actor efectivo: conductor operativo + Agente de construcción + Agente de datos.

## Autoridad leída
- V3 · Sistema de Conducción vivo: A18 figura CERRADO; no hay ACTO EN CURSO; el primer pulso de F1 exige preguntar si A19 avanzó.
- V4 · Especificación vigente del Embrión: Mercado, Comunidad, Círculos y Común deben existir en forma germinal mínima y verificable, sin convertir madurez futura en requisito de nacimiento.
- V7 · repo real `vamaspyp/lumen-app`.
- V8 · Supabase real `xezolunwsizllyqaxdkc`.
- V27/V32 · contrato de agentes: verificar realidad técnica, ejecutar sólo el ACTO, minimizar permisos y devolver evidencia trazable.

## Auditoría acumulativa real

### Contrato técnico
- LEÍDO · La tabla real de nodos es `public.lumen_nodes`; `public.nodes` no existe.
- LEÍDO · `public.lumi_dispatch(text,jsonb)` construye dinámicamente `lumi_<action>`; por lo tanto una mutación nueva con prefijo `lumi_` ampliaría la superficie privilegiada del dispatcher.
- LEÍDO · React ya renderiza `contribution_form`, `item_list` y `empty_presence`; A19 no necesita nueva UI para demostrar presencia germinal.

### Mercado
- LEÍDO · No existía RPC/tabla específica de Mercado.
- LEÍDO · Existe un recurso externo activo y curado utilizable como representación germinal real: resource `93d49a58-ceca-43f5-9321-635363b7b2a6`, proveedor `Insight Timer`, `resource_kind=curated_external`, `tool_kind=external_url`.
- DERIVADO · Puede satisfacer el Embrión como oferta/proveedor representado + conexión externa, sin pagos ni checkout.

### Comunidad
- LEÍDO · Existe `lumi_open_contribution_form` y React tiene `ContributionForm`.
- LEÍDO · Falta `lumi_submit_contribution`; por lo tanto la acción visible no completa hoy el ciclo.
- DERIVADO · El mínimo limpio es una puerta `open_comunidad` que reutilice el formulario existente y persista la propuesta asociada a una sesión válida; no feed, likes ni rankings.

### Círculos
- LEÍDO · Existe `lumi_open_circulos`, pero depende de `lumi_get_circulos_activities`, que no existe.
- LEÍDO · `CIRCULOS_ENTRY` y `CIRCULOS_EMPTY` existen en `lumen_nodes` pero están inactivos.
- DERIVADO · El mínimo limpio es persistencia privada + create/close controlados + listado público de lectura para el RPC existente; sin participantes reales.

### Común
- LEÍDO · No existía mecanismo específico de captura/recuperación del Común.
- LEÍDO · `public.experience_runs` es la evidencia longitudinal real del organismo.
- DERIVADO · El mínimo limpio es capturar una síntesis/evidencia estructurada vinculada a un run y recuperarla internamente, con `shareable=false` y sin copiar texto íntimo del run.

## Delta preparado
Rama: `acto/A19-organos-germinales`

Archivos:
- `docs/backend/pending/A19_organos_germinales.sql`
- `docs/backend/pending/A19_organos_germinales_rollback.sql`

Decisiones de implementación:
1. Persistencia A19 en schema `private`, fuera del Data API público.
2. RLS también habilitado como defensa en profundidad.
3. Sólo quedan en `public` los RPC necesarios para dispatcher/render: `lumi_open_mercado`, `lumi_open_comunidad`, `lumi_submit_contribution`, `lumi_get_circulos_activities`.
4. Mutaciones administrativas de Círculos y Común quedan en `private` y sólo para `service_role`.
5. Mercado reutiliza un proveedor/recurso real ya curado; no se inventa catálogo comercial.
6. No hay cambios React: se reutilizan content types canónicos existentes.
7. Rollback integral preparado antes de tocar Supabase.

Commits de preparación:
- `8a0cfe6d6a4e5e4820178fc39f17665f60f72bef` · primer delta.
- `22233c22ebf9c2b6371300022a2592cb46170ac5` · frontera privada endurecida.
- `dbfcb8d399fe2b8edbcc9390f4bb7cd12355cd82` · rollback explícito.

## DoD A19 · estado pre-producción
- Mercado representado/conexión externa: PREPARADO, NO APLICADO.
- Comunidad contribución mínima: PREPARADO, NO APLICADO.
- Círculos crear/gestionar controlado: PREPARADO, NO APLICADO.
- Común capturar/recuperar aprendizaje estructurado: PREPARADO, NO APLICADO.
- Evidencia reproducible real en Supabase: PENDIENTE de aplicación autorizada + verificación.

## Frontera real
Aplicar DDL/DML de A19 sobre Supabase `xezolunwsizllyqaxdkc` modifica el backend real. Conforme al Sistema de Conducción, producción requiere autorización humana explícita. No se aplicó ninguna mutación a Supabase en esta fase.

## Resultado
A19 avanzó materialmente hasta quedar listo para implementación controlada. No se abrió otro ACTO y no se modificaron `main`, producción Vercel, Norte, Objetivos, Señales ni Focos.

## Aprendizaje
La presencia germinal de un órgano no exige una plataforma nueva: puede emerger de contratos pequeños, privados y verificables que reutilizan renderer, dispatcher y evidencia ya existentes.

## Esfuerzo acumulado de esta sesión
persona_h=0; agente_sesiones=1
