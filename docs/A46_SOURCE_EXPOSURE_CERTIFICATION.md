# A46 · Certificación final de exposición real · Fuente

## Propósito

A46 no reabre el diseño del Embrión ya certificado por A54/A56. Su función es comprobar que la Fuente que una persona encontrará antes de primeras vidas reales sea suficientemente digna, diversa, honesta y materialmente útil bajo V46/V48/V49/V50/V43, sin confundir nacimiento con cobertura universal.

V37 y V39 se conservaron únicamente como referencias históricas. Ninguna decisión A46 depende de ellas como autoridad vigente.

## Punto de partida

La Fuente viva ya tenía estructura correcta y 60 Posibilidades `active_limited`, con riesgo y clase de evidencia presentes. El problema real era de concentración: 19 prácticas y 17 reflexiones, ambas desde un único provider interno; 17 recursos externos; 4 acciones humanas y 3 lecturas. Varias relaciones relevantes estaban sostenidas por una sola Posibilidad y una sola forma.

Antes de A46, economía×discernimiento, familia/cuidado×autocompasión y vida general×adaptación tenían 1 Posibilidad/1 tipo/1 provider. Trabajo×regulación tenía 2 Posibilidades de un solo tipo/provider. Bienestar×regulación, en cambio, ya estaba suficientemente nutrida y no fue inflada por cantidad.

## Delta ejecutado

A46 agregó 12 Posibilidades mediante el único pipeline vigente `source_intake → activate_source_intake`. No creó nuevas tablas, repositorios, motores ni flujos paralelos.

La ampliación incorporó recursos institucionales oficiales para derechos/herramientas financieras, salud del cuidador y riesgos psicosociales del trabajo; herramientas nativas para adaptación, finanzas y atención; conversaciones para cuidado, carga laboral y duelo; una pregunta de adaptación; y dos puertas reales de apoyo: orientación profesional federal en salud mental y Centros de Acceso a la Justicia en Argentina.

La Fuente pasó a 72 Posibilidades `active_limited`, 109 relaciones `HelpApplicability` y 10 formas semánticas efectivas: recurso externo, práctica, reflexión, acción humana, conversación, lectura, herramienta, pregunta, apoyo profesional y servicio institucional.

## Cobertura reforzada sin cartesiano

No se intentó llenar todas las combinaciones Área×Capacidad. Sólo se reforzaron relaciones relevantes que estaban demasiado frágiles para exposición:

- economía×discernimiento: 1/1/1 → 3 Posibilidades / 3 tipos / 2 providers;
- familia_cuidado×autocompasión: 1/1/1 → 3 / 3 / 2;
- vida_general×adaptación: 1/1/1 → 3 / 3 / 1;
- trabajo×regulación: 2/1/1 → 4 / 3 / 2;
- aprendizaje_crecimiento×atención: ahora 4 Posibilidades / 3 tipos;
- vínculos×integración: ahora 4 Posibilidades / 4 tipos.

El objetivo no es densidad uniforme sino alternativas suficientemente distintas cuando una relación importa.

## Realidad externa y condiciones discriminativas

A46 incorporó puertas humanas/institucionales como posibilidades de primera clase sin inventar pertinencia automática. La línea nacional argentina de orientación en salud mental y los Centros de Acceso a la Justicia son visibles al explorar Fuente pero tienen cero relaciones de aplicabilidad. País, urgencia y naturaleza concreta de la necesidad son condiciones discriminativas que el Motor no debe inferir silenciosamente.

Para sostener esa separación, la prioridad de exploración vive en `HelpVersion.detail.browse_priority`, independiente de `HelpApplicability`. Que algo sea visible en Fuente no significa que LUMEN tenga permiso semántico para recomendarlo automáticamente.

## Diversidad visible

El browse por defecto fue curado para que la pluralidad no exista sólo en base de datos. Dentro de las primeras 40 Posibilidades aparecen las 10 formas semánticas actuales, incluyendo herramienta, conversación, pregunta, lecturas de tradiciones diferentes, apoyo profesional y servicio institucional.

El contrato `lumen_source_taxonomy` expone además las formas semánticas dinámicamente. `lumen_source_discover` devuelve accesibilidad/condiciones de realización junto con procedencia, derechos, riesgo, evidencia, duración y energía.

La UI actual todavía enumera cinco formas históricas en su selector específico. Esto no oculta las nuevas formas del browse general —ya aparecen materialmente—, pero es una inconsistencia experiencial menor que debe ser observada en revisión Pauli y corregida si genera fricción. No justifica bloquear ni reescribir Fuente.

## Procedencia, derechos y custodia

Tras A46, las 72 Posibilidades activas tienen provider con provenance y rights no vacíos, además de `risk_class` y `evidence_class`. MedlinePlus y OPS/OMS, que tenían rights vacíos, quedaron normalizados para linking y términos de fuente.

Los recursos externos se enlazan a su fuente original; LUMEN no copia material protegido como si fuera propio. Las Posibilidades nativas conservan provenance de curación/origen. Las puertas de mayor riesgo no reciben aplicabilidad automática por conveniencia de cobertura.

## Hallazgo de health y corrección

Durante A46, `lumen_embryo_health()` reveló un defecto de honestidad operativa: leía `canonical_integrity` desde `runtime_policies`, donde permanecía una fotografía A51 v4, mientras la certificación gobernada activa A54 v5 vive en `policy_versions`.

La función quedó corregida para leer `canonical_integrity` desde la PolicyVersion activa y el tuning de Source desde `runtime_policies`, respetando ownership real. El resultado live actual es `operational`, `canonical_integrity v5 / integrally_certified`, Fuente 72/109/10 y `prelaunch_reset_required=true`.

## Límites explícitos

Fuente sigue siendo español-Argentina first. No pretende cobertura universal de profesiones, ayudas materiales, geografías ni tradiciones. `active_limited` significa exactamente eso: disponible para exposición prudente y aprendizaje, no canonizada como cobertura definitiva.

No se activó PRELAUNCH RESET porque todavía falta completar A46, revisión Pauli y el preflight inmediatamente anterior a primeras personas reales. Tampoco se promovieron las 72 Posibilidades a `active`: la exposición inicial debe seguir reconociendo que la semilla está aprendiendo.

## Criterio previo a cierre

A46 puede cerrar técnicamente cuando CI + backend live confirmen permanentemente: integridad v5 activa, 72+ Posibilidades, 109+ relaciones, 10 formas visibles, diversidad de providers, refuerzo de las relaciones delgadas, puertas institucionales browseables sin falsa aplicabilidad, provenance/rights/risk/evidence completos y regresión completa del Embrión.

Después de ese PASS, corresponde revisión Pauli de la experiencia ya enriquecida. Pauli no debe reabrir canon ni perfeccionar: sólo detectar fricciones de exposición capaces de impedir comprensión, confianza, uso o sensación de compañía antes de A40.
