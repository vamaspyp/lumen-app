# LUMEN · Paquete Supabase · Ajustes MVP

Base cotejada: `DB - MVP BASE (19-7-2026)`.

## Orden obligatorio

1. `00_PRECHECK.sql`
2. `01_FAROS_MODELO_LIMPIO.sql`
3. `02_CHECKIN_HELPERS.sql`
4. `03_CHECKIN_PROGRESIVO.sql`
5. `04_SANTUARIO_FULL.sql`
6. `05_NODOS.sql`
7. `06_VALIDACION_POST.sql`

Ejecutar cada archivo por separado en Supabase SQL Editor. No continuar si un archivo devuelve una excepción.

## Qué cambia

- Elimina Faros personales de prueba.
- Evoluciona `user_area_faros` a múltiples Faros por área y ciclo `active/paused/closed`.
- Implementa opciones de check-in derivadas de hipótesis + experiencias + recursos realmente ejecutables.
- H1 queda: scan → estado → capacidad → tiempo.
- H2 queda: área con Faros activos → Faro personal activo → capacidad → tiempo.
- Implementa entrada contextual del Santuario y sus cuatro dimensiones.
- Las pills del Santuario solo aparecen cuando la dimensión tiene contenido; el estado vacío invita a crear los primeros Faros.

## Qué no cambia

- No elimina tablas legacy.
- No modifica React.
- No altera el contrato general `lumi_dispatch`.
- No modifica compartir, Fuente, feedback, cuenta ni visor de experiencias.
- No reemplaza `lumi_select_experience`; las opciones progresivas usan exactamente sus criterios principales de elegibilidad.
