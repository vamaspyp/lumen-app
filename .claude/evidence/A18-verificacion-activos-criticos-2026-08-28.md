# A18 · Verificación de activos críticos de ejecución

Fecha: 2026-08-28
ACTO: A18 · F1 · Embrión que late
Actor efectivo: conductor operativo + capacidades GitHub/Supabase/Vercel cloud
Estado material: VERIFICACIÓN TÉCNICA COMPLETA / bloqueado para cierre sólo por write-back estructurado V3

## Contrato de verificación
Cada dato material se marca LEÍDO, DERIVADO o NO_VERIFICADO. No se modificó producto, base ni producción.

## V7 · Repositorio de aplicación
- LEÍDO · Repo real accesible: `vamaspyp/lumen-app`, id `1263575422`, visibilidad pública, default branch `main`.
- LEÍDO · `main` apunta a `5821d6c8c456ea12d7889ef0c0fb7d7ed892c1a9`.
- LEÍDO · La integración GitHub actual tiene lectura y escritura efectivas; la rama `acto/A18-verificar-activos-criticos` fue creada exitosamente para esta evidencia.
- RESULTADO · Ubicación registrada `github.com/vamaspyp/lumen-app`: CONFIRMADA.

## V8 · Base de datos del organismo
- LEÍDO · Proyecto Supabase real: ref/id `xezolunwsizllyqaxdkc`, nombre visible `GAIA MVP`, región `us-east-2`, estado `ACTIVE_HEALTHY`, PostgreSQL 17.6.1.063.
- DERIVADO · La ubicación registrada `Supabase · proyecto LUMEN` identifica el backend correcto por contexto, pero el nombre real del proyecto no es `LUMEN`; la ubicación debe refinarse al ref estable para evitar ambigüedad.
- RESULTADO · Backend real CONFIRMADO; desvío de metadata: nombre/ubicación del activo debe registrar `xezolunwsizllyqaxdkc · GAIA MVP`.

## V9 · Despliegue productivo
- LEÍDO · Integración Vercel cloud conectada y operativa.
- LEÍDO · Team real: `vamaspyps-projects`, id `team_UNaVUNO9ZRXz3fO3rEFYMhX0`.
- LEÍDO · Proyecto real: `lumen-app`, id `prj_7phtbrDLnH2z8C9Tw88iEQQyGY7t`, framework Vite, vinculado por GitHub a `vamaspyp/lumen-app`.
- LEÍDO · Dominios asociados al proyecto incluyen exactamente `lumen-vamas.vercel.app`.
- LEÍDO · Deployment productivo actual identificado: `dpl_FpUxQjZAXNwZmYQkgUAnZzLyYU8c`, estado `READY`, target `production`, branch `main`, commit `5821d6c8c456ea12d7889ef0c0fb7d7ed892c1a9`.
- LEÍDO · Los deployments recientes de ramas A18/A20 son previews (`target: null`); no se promovió ni alteró producción durante esta verificación.
- RESULTADO · Ubicación registrada `Vercel · lumen-vamas.vercel.app`: CONFIRMADA.

## V10 · Corpus de la Fuente
- LEÍDO · En Supabase existen `public.resources` y `public.experiences`; no existe una relación pública separada llamada `accompaniment_units`.
- LEÍDO · `experiences` contiene la columna `accompaniment_unit_key`; 86/86 experiencias tienen ese campo poblado.
- LEÍDO · Conteos actuales: resources=158 total / 73 activos; experiences=86 total / 80 activas.
- DERIVADO · La representación operativa de UAs está materializada en `experiences` mediante `accompaniment_unit_key`, no en una tabla propia.
- RESULTADO · Ubicación lógica `Supabase · recursos y UAs`: CONFIRMADA, con precisión técnica recomendada `public.resources + public.experiences(accompaniment_unit_key)`.

## V11 · Evidencia longitudinal
- LEÍDO · `public.experience_runs` existe con contrato real verificado.
- LEÍDO · Conteos actuales: 165 corridas, 88 con `completed_at` no nulo.
- RESULTADO · Ubicación registrada `Supabase · experience_runs`: CONFIRMADA.

## DoD A18
- V7 ubicación actual confirmada: PASS.
- V8 ubicación actual confirmada: PASS, con desvío nominal identificado.
- V9 ubicación actual confirmada: PASS.
- V10 ubicación actual confirmada: PASS, con precisión de representación UA.
- V11 ubicación actual confirmada: PASS.
- Fecha de verificación en ACTIVOS + desvíos convertidos en estado trazable: PENDIENTE exclusivamente de write-back estructurado a V3.

## Resultado
La verificación técnica de A18 está completa. El ACTO no puede declararse `CERRADO` en la autoridad operativa mientras no se persista de forma segura el write-back estructurado en ACTIVOS/ACTOS del XLSM autoritativo. La limitación es de la capacidad actual de escritura preservando el paquete XLSM, no del modelo de conducción ni de los activos técnicos verificados.

## Aprendizaje
Usar referencias técnicas estables —repo full name, Supabase project ref, Vercel project/team IDs y tabla/contrato real— evita que nombres humanos antiguos (`LUMEN`, `GAIA MVP`, `UA`) se conviertan en falsas discrepancias operativas.

## Referencias
A18 · F1 · V3 · V7 · V8 · V9 · V10 · V11 · V25 · V32 · FICHA Agente de Construcción · FICHA Agente de Datos.

## Esfuerzo real acumulado de esta ejecución
persona_h=0; agente_sesiones=1
