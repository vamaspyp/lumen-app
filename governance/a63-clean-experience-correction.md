# A63 · Corrección material de experiencia contra V58 §22.13

Corrección sobre PR31 y el backend Greenfield real. Base: `26b5f5d2f93def24406d7843907208b065896dc4`. POV y V58 completa recuperadas antes de modificar código; F6 ACTIVO, A63 EN CURSO. Se inspeccionó la única lámina integrada en §22.13. La orden humana de Inicio sin chips prevalece sobre sus textos ilustrativos. No se cambia el DoD ni se acredita EXPERIENCE/HUMAN PASS.

## G98 aplicado

**PRESERVADOS:** modelo válido; OTP; autorización y consentimiento separados; custodia; original de Momento; propuesta, aceptación individual, edición y validación N:M de Área/Potenciales; conflicto/versiones de Faro; composición integral y restauración sin pérdida; Fuente única; renderers específicos; progreso; feedback; reconocimiento explícito de lo propio; recurrencia consentida; aprendizaje gobernado; privacy/export/olvido; safety y NO_MATCH. Los dobles de regresión sólo prueban contratos, no cobertura editorial.

**REEMPLAZADOS:** Inicio con chips y rutas competitivas; cabeceras/formularios de comprensión en Nivel 1; exposición permanente de controles de Faro/Constelación; grilla de posibilidades contextuales; navegación de Santuario por pestañas de recursos; explicaciones automáticas de LUMI; salida directa de Vivir a feedback; reglas CSS heredadas incompatibles. Se reutilizan los contratos existentes desde una composición de pantallas limpia.

**AJUSTADOS:** Áreas con Faros acordados y recorrido pertinente; Experiencias vividas desde registros reales independientes de guardar; cuatro modos de Explorar con límite léxico explícito; cinco secciones de Santuario; controles secundarios invocados mediante LUMI/disclosures; limpieza de estados personales al salir/olvidar. El reloj causal del emisor privado registra el instante real de los nuevos eventos: la prueba V62 detectó empates de `now()` dentro de una transacción. Migración aplicada `20261005104607`; mismo contrato/ACL/payload y ningún historial reescrito. Los seis paquetes SQL volvieron a pasar.

## V58 §22.13 → experiencia construida → evidencia

| Regla | Runtime/acción y estado verificables | Evidencia |
|---|---|---|
| RV-01 | Cinco puertas canónicas; cuenta en segundo nivel; Constelación contextual; LUMI transversal; Vivir sin chrome | E2E navegación/host/accesibilidad; capturas de cinco puertas |
| RV-02 / CF-01 | Pregunta, expresión libre, Continuar; sin chips, dashboard ni rutas genéricas; una continuidad priorizada; OTP antes de Momento | `clean-experience`, identidad/revocación/continuidad; `01-inicio-real` |
| RV-03 | Mi Vida: Áreas → Faros del acuerdo → recorrido pertinente; Santuario separado; cuatro lentes cerradas | E2E Área/lentes/memoria; `puerta-Mi-Vida`, `area-mi-vida-real` |
| RV-04 / CF-03 | Potencial/Área/Momento/Libre sobre una Fuente; procedencia, selección voluntaria; texto declara búsqueda por palabras | E2E cuatro entradas y selección; cuatro capturas `explorar-*` |
| RV-05 | Vida con Vida; círculos/encuentros privados; pedir acompañamiento humano bajo demanda; sin feed/directorio | E2E crear/invitar/compartir/salir y servicio atribuido; SQL ownership; `puerta-Tejido` |
| RV-06 / CF-04–05 | Piezas guardadas, vividas, reflexiones, composiciones completas, propio; abrir Faro/Área/Potenciales/referencias/recorrido/versiones; recuperar y enriquecer | Browser real v1 → v2 → restaurar v1 como v3; cinco secciones de Santuario y detalle vivo |
| RV-07 / CF-02,06 | Expresión → lectura provisional → ajuste → composición → Vivir; no stepper rígido; terminar ofrece volver; señal/guardar/continuar separados | Regresiones comprensión/aceptación/regeneración; prueba sin feedback al terminar; capturas `02`–`07` |
| RV-08 / CF-05,07,08 | Edición/reordenamiento/expansión/versiones/recurrencia/privacidad sólo en segundo nivel; memoria, feedback y propio no se infieren entre sí | E2E persistencia/exclusiones/consentimientos; SQL CAS, pausa/revocación/refutación/rollback; `08`–`10`, ajustes/aprendizaje |
| RV-09 | Serif/navy/crema/azul y fotos existentes; foco/espacio/disclosures; sin voz ficticia ni autoplay; responsive; estados honestos | Capturas reales 390×844 y 1440×900; axe A/AA; antes/después contra única referencia |
| RV-10 / CF-09–10 | Pantalla → CTA → estado → contrato → DB → regresión → captura; exacto SHA/preview/CI en manifest de entrega | 89 unidades; 92 regresiones; build/lint/custodia; seis SQL transaccionales; Auth/RPC reales sin mocks personales |

## Pantallas y deltas comprobados

| Pantalla | Antes en SHA base | Corrección material | Nueva captura |
|---|---|---|---|
| Inicio | Chips y rutas compiten con expresión | Un gesto libre y una continuidad pertinente | `01-inicio-real` |
| Comprensión | Campos/maquinaria expuestos | Área y significados legibles; Ajustar abre campos | `02-comprension-nivel1-real` + `02-comprension-real` |
| Faro | Composición de formulario | Dirección primaria; edición, estados, tiempo e historia bajo demanda | `03-faro-area-potenciales-real` |
| Constelación | Grilla/controlados simultáneos | Posibilidades en composición vertical; conservar/enriquecer/ajustar en disclosure | `05-enriquecida-real`, `09-recuperacion-real` |
| NO_MATCH | Mensajes y controles redundantes | Una explicación honesta, Explorar y revisión discretos | `04-no-match-nivel1-real` |
| Mi Vida / Área | Área lleva directamente a buscador | Área propia con Faros acordados y recorrido; Fuente/Santuario conectados | `puerta-Mi-Vida`, `area-mi-vida-real` |
| Explorar | Modo léxico ambiguo | Cuatro entradas visibles; límite explícito por Potencial/Momento | `puerta-Explorar`, `explorar-*` |
| Tejido | Secundarios compiten con encuentro | Vida con Vida y petición; conexiones sólo pertinentes | `puerta-Tejido` |
| Santuario | Tabs/listas/formulario permanentes | Cinco significados distintos y detalle de unidad conservada | `puerta-Santuario`, `santuario-*`, `09-santuario-composicion-viva-real` |
| LUMI | Habla/explica automáticamente | P0 silenciosa; P1 invocada; P2 voluntaria; explicación en profundidad | `lumi-contextual-real`, `lumi-conversacion-invocada-real` |
| Vivir / terminado | Fin lleva a feedback | Renderer preservado; Terminaste → volver; feedback opt-in | `06-vivir-practica-real`, `07-terminada-sin-feedback-real` |
| Retorno / ritmo | Fisiología válida | Entrada voluntaria; conservar, señal, propio y recurrencia independientes | `07-retorno-real`, `08-ritmo-consentido-real` |
| Versiones / privacidad / aprendizaje | Fisiología válida | Mantener segundo nivel y relectura real | `10-restauracion-sin-perdida-real`, `ajustes-real`, `aprendizaje-real` |

Las escenas no dibujadas individualmente en la lámina se contrastan con RV-07–09 y su lógica inferior; no se inventan pantallas de referencia. El archivo de evidencia conserva la lámina íntegra y capturas reales de la base y del cambio, en ambos tamaños, incluyendo sectores inferiores.

## BLOCK reales restantes

### Reejecución material · 2026-10-06

POV y V58 completas recuperadas nuevamente; F6 ACTIVO, A63 EN CURSO y §22.13 sin cambio. Se sincronizó la copia local atrasada con PR31 antes de construir. La entrega previa no se usó como autoridad.

Se corrigió una omisión RV-06/CF-06: Experiencias vividas dependía exclusivamente de outcomes/feedback. El contrato existente `lumen_living_map_snapshot` ahora proyecta, por separado, experiencias terminadas desde posición persistida y retornos explícitos desde los mismos registros. Finalizar no afirma beneficio, guardado ni apropiación; abrir o guardar posición sin finalizar no acredita experiencia vivida. Ownership, memoria consentida, olvido y ACL se preservan. Sin nueva tabla, entidad o motor. Migration real `20261006152214`.

La UI relee ese hilo al entrar en Santuario y muestra «Sin retorno registrado» cuando no hay feedback. La salida de Vivir es inmediata; se estabilizó el callback de progreso para evitar escrituras repetidas por renders ajenos al avance. En la lectura inicial se muestra primero el Área y después los Potenciales, conforme al orden perceptual aprobado. La interpretación extensa y expresión original se abren bajo demanda; el CTA de aceptación queda visible sobre la navegación mobile. Se distinguen las composiciones como «Constelación conservada» y LUMI vuelve al origen real de la experiencia, también en Explorar y Tejido.

G98: PRESERVAR persistencia de episodios/selecciones/posición, feedback, guardado y propio; AJUSTAR proyección de lectura y actualización de Santuario; REEMPLAZAR dependencia visual vivido→feedback y retorno contextual incorrecto. Nueva regresión en ambos viewports conserva el vivido sin feedback tras refresh. SQL real transaccional prueba apertura/fin/retorno, independencia, ownership, consentimiento, olvido y ACL; fixtures revertidos. La matriz RV-06/RV-07 agrega `07-vivida-sin-feedback-real` y el contrato `tests/a63-lived-independent-live.sql`. Verificación: 89 unidades y 94 E2E; siete paquetes SQL reales, build/lint y gates. Capturas finales, SHA/preview/CI y comparación íntegra se identifican en el manifest de entrega; las pasadas fallidas no son evidencia final.

- B1 editorial: 86 conceptos y 169 relaciones candidatas, 0 revisadas/admitidas. NO_MATCH longitudinal real; no se acredita cobertura nutrida con fixtures.
- Reproducción del video externo no demostrada y accesibilidad del iframe del proveedor incompleta; dos audios reales sí reproducidos. No se reemplaza el contenido aprobado por uno inventado.
- Representantes admitidos/condiciones/derechos completos de las once familias y matching semántico/generalización de conversación no acreditados por esta corrección.
- Entrega humana de OTP, latido de primeras vidas y revisión perceptual humana de runtime exacto pendientes. A63 sigue EN CURSO; sin merge/promoción ni HUMAN/EXPERIENCE PASS.
