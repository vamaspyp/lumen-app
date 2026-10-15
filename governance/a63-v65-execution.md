# A63 · Ejecución V65 · 2026-10-07

PR31 sobre `a63-v60-intuitive`; baseline `e9c44661d5b5345d6a626fc11d7fffd32b4f3689`. POV vigente recuperado antes del cambio: F6 ACTIVO, A63 EN CURSO, V64 y V65 VIGENTES. V65 es la evidencia de integridad vertical registrada en ACTIVOS del Sistema de Conducción. V64 fija la precedencia; V58 vigente y su única lámina §22.13 gobiernan la experiencia. No se reabre el frente visual histórico de V63 ni se modifica el DoD.

## Corrección material y G98

PRESERVAR: shell conforme, cinco puertas, Inicio libre, progressive disclosure, contratos y modelo de datos, Auth/OTP, consentimiento, custodia, N:M Faro/Potenciales, versionado, composición integral, Fuente única, NO_MATCH, once renderers específicos, vivido independiente de retorno/guardar/propio, recurrencia, feedback, aprendizaje, safety, exportar/olvidar y regresiones válidas.

AJUSTAR: adaptador de video original. Identifica origen y referrer ante el proveedor, conserva fuente y subtítulos, evita autoplay, respeta un viewport mínimo de 200px, valida HTTPS y ofrece salida independiente hacia el original. El reproductor sólo se carga tras una acción expresa. El fallo no completa una experiencia ni produce retorno.

REEMPLAZAR: iframe sin recuperación por un adaptador local con aviso de indisponibilidad, desmontaje, reintento y restitución de foco. No se altera ni reemplaza el contenido editorial. No se agrega un motor, una entidad, otra biblioteca ni una experiencia distinta.

La regresión de falla sustituye únicamente el transporte de YouTube: acredita recuperación y foco, nunca reproducción ni accesibilidad del proveedor. Auth, Fuente y RPCs de esa prueba son reales. La prueba runtime `cf-runtime-real.mjs` usa Auth/RPC/browser reales, sin mocks personales, con cuentas QA sintéticas eliminadas después; no acredita OTP humano.

## Matriz vigente V65 → runtime

PASS significa verificación técnica acotada por la evidencia indicada. GAP significa una falta conocida. NO VERIFICADO significa que el juicio o evidencia exigidos siguen pendientes. CONTRADICCIÓN se reserva a una incompatibilidad de autoridad o comportamiento demostrado; ninguna nueva contradicción de autoridad fue encontrada. No hay HUMAN PASS ni EXPERIENCE PASS.

| Núcleo V65 / dependencia | Estado | Evidencia y límite |
|---|---|---|
| Conducción, jerarquía V64 y continuidad A63 | PASS | POV vivo; snapshots y gate. F6/A63/DoD preservados. |
| V58 §§22.10–13 / cinco puertas / Nivel 1 | PASS | Capa existente preservada; regresiones desktop/mobile y recorrido runtime. Revisión humana perceptual pendiente. |
| Comprensión corregible, original y acuerdo N:M | PASS | SQL `core-cycle`, `faro-agreement`, `comprehension-potentials`; ajustes/versiones/ownership/consentimiento. |
| B1: relaciones editoriales admitidas | GAP | DB real: 86 conceptos, 169 candidatas, 0 revisadas. V63 exige curaduría humana y prohíbe promoción automática. Paquete de revisión de las 169 relaciones y versiones reales entregado. |
| NO_MATCH honesto / cobertura no inventada | PASS | DB y browser reales; guardar la composición vacía y enriquecerla voluntariamente preserva versiones. Fixtures SQL revierten y no acreditan cobertura. |
| Matching semántico / generalización | GAP | Backend actual usa patrones y etiquetas léxicas; no hay funciones edge desplegadas. Falta servicio semántico configurado y evaluación legítima. El límite sigue explícito. |
| B2: efecto, continuidad y apropiación separados | PASS | SQL real V62/CF con dos ocasiones, consentimiento, corrección, reversión y futuras decisiones. No demuestra causalidad ni dos vidas humanas. |
| B2: STOPPED_HELPING y autonomía prudente | PASS | Contratos/regresiones existentes y SQL real V62; ausencia de retorno permanece neutra. |
| B3: composición flexible, más de tres, exclusiones | PASS | SQL real V63 y E2E; no se limita la composición a tres. |
| Conservación integral, orden, enriquecimiento y recuperación | PASS | SQL CF y browser real v1 → v2 → restauración como v3 sin borrar historia. |
| Vivir, retornar, guardar, propio y continuidad independientes | PASS | SQL `a63-lived-independent-live`; browser real de fin sin feedback y guardado independiente. |
| B4: recuperación de video y teclado del host | PASS | Nueva regresión en ambos viewports: opt-in, origen/referrer, altura, desmontaje, foco, fuente externa, reintento y salida sin terminar. |
| B4: reproducción real del video original | GAP | El reproductor real no demostró avance de tiempo en este entorno; registró errores de red del proveedor. Cargar iframe no es reproducción. El fallo y la salida independiente quedan explícitos en `result.json`. |
| B4: accesibilidad interna del iframe | GAP | Adaptador host corregido; el documento externo no está bajo control del host. Auditoría real y juicio humano pendientes para el contenido interno. |
| B4: audio real | PASS | Dos fuentes OPS/OMS existentes; prueba runtime registra avance real y pausa, sin sustituir audio. |
| B4: representantes reales de once familias | GAP | Fuente actual: práctica 24, editorial 28, externa 18, acción 14, audio 2, video 1, humano 1, material 1; grupo/evento/silencio 0. Once renderers no equivalen a once representantes admitidos. |
| B4: procedencia, derechos y condiciones suficientes | NO VERIFICADO | Inventario completo de 89 piezas y metadatos entregado. URL pública/terms genéricos no prueban permiso de reproducción ni admisión editorial. Revisión humana pendiente. |
| B5: contraste perceptual V58 / §22.13 | NO VERIFICADO | Capturas exactas 1440×900 y 390×844, referencia íntegra y recorrido técnico; juicio de Quality Bar V55 y EXPERIENCE PASS requieren revisión humana. |
| B6: propiedad, consentimiento, exportar/olvidar | PASS | Siete paquetes SQL reales transaccionales y recorrido Auth/RPC; fixtures revertidos y cuentas temporales limpiadas. |
| B6: OTP humano antes de Momento y primeras vidas | NO VERIFICADO | El gate de identidad se preserva. Una cuenta QA por contraseña no acredita entrega OTP ni dos ocasiones humanas. |
| B6: HUMAN / EXPERIENCE / cierre | NO VERIFICADO | DoD vigente no satisfecho mientras queden los BLOCK anteriores. A63 EN CURSO, PR draft, sin merge/promoción. |

## Dependencias agotadas y decisión requerida

1. B1 no se activa automáticamente: la definición autoritativa exige curaduría humana. `b1-curaduria-humana.tsv` contiene las 169 relaciones, versión precisa y campos de procedencia, derechos, condiciones, pertinencia, decisión, revisor, fecha y motivo. Todas permanecen NO ADMITIDO; cero mutaciones editoriales.
2. Semántica general requiere servicio/proveedor del lado servidor, credenciales de despliegue y evaluación. Ninguno existe en el runtime conectado. Agregar patrones o declarar fixtures PASS sería falsear V65.
3. Video requiere evidencia de reproducción y AX del proveedor; se corrigió lo controlable en el host, se preservó el original y la alternativa textual/fuente.
4. Las familias sin representante y la admisión por derechos/condiciones dependen de piezas y decisiones editoriales reales. No se fabricaron encuentros, grupos ni contenido silencioso.
5. OTP real, primeras vidas y juicio perceptual humano dependen de participantes/revisor humano sobre el SHA y preview exactos. No se sustituyen por automatización.

## Trazabilidad

El manifest de entrega fija SHA, preview exacto, estado CI, capturas por viewport, resultados Auth/RPC/browser, siete SQL y limpieza QA. Los logs fallidos anteriores no son la evidencia final. El paquete distingue fuente real, pruebas de contrato y juicio pendiente.

Referencias técnicas del adaptador: [YouTube iframe API](https://developers.google.com/youtube/iframe_api_reference) y [Required Minimum Functionality](https://developers.google.com/youtube/terms/required-minimum-functionality). Estas reglas no certifican los derechos del contenido ni su accesibilidad.
