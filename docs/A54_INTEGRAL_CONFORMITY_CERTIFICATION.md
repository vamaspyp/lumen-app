# A54 · Certificación Integral de Conformidad del Embrión

## Propósito

A54 no vuelve a diseñar LUMEN. Su función es demostrar, sobre la realidad integrada, que el Embrión construido expresa de manera suficiente, limpia y trazable la Especificación Funcional V48 y la Especificación Técnico-Funcional V49; y, en sentido inverso, que lo construido no contiene piezas materiales sin función vigente que obliguen a mantener deuda conceptual o arquitectónica.

La prueba se realiza en dos direcciones. En **V48/V49 → runtime** se pregunta, función por función, dónde existe el comportamiento exigido y qué evidencia demuestra que puede ocurrir. En **runtime → V48/V49** se toma cada dominio, tabla, RPC, superficie y mecanismo material y se exige una justificación funcional vigente. El archivo `governance/a54-conformity-matrix.json` contiene la matriz ejecutable de esta auditoría.

## Criterio de cierre

Un contrato se considera **CONFORME** cuando la función requerida está realmente conectada y ejecutable. **CONFORME_EMBRIONARIO** no significa deuda oculta: significa que la función vital ya existe de manera suficiente para el nacimiento, mientras su cobertura, sofisticación, automatización o evidencia pueden madurar luego según lo autorizado por V48/V49. A54 no puede cerrar con un **GAP**, **EXCESO** o **DESVÍO** material conocido.

Esta distinción evita dos errores simétricos: declarar incompleto al Embrión porque todavía no tiene madurez de organismo adulto, o declarar completo algo que sólo existe en documentación, esquema o intención.

## Evidencia de recorrido real

La auditoría no se limitó a inspeccionar tablas. Se ejecutaron recorridos sintéticos contra la base greenfield real bajo identidad autenticada, encapsulados en transacciones con `ROLLBACK` para no contaminar el estado de construcción.

El circuito de acompañamiento completó **Momento → interpretación Área/Capacidad → Coverage → decisión → selección exacta → outcome → Repertorio**. El resultado conservó `decision_run_id`, `selection_id`, `help_version_id` y `source_outcome_id` y confirmó que la atribución longitudinal ya no depende de campos duplicados.

El circuito de continuidad completó consentimiento de memoria, creación de Faro/Trayectoria, adición a Camino, guardado y edición de Tesoro en Santuario, habilitación de proactividad, programación y cancelación de follow-up. El circuito Tejido completó creación de Círculo privado, invitación, contribución de una Posibilidad, reporte de límite y salida. Todos se ejecutaron sobre los RPC vigentes y se revirtieron al finalizar la prueba.

La autopoiesis de Fuente fue probada incorporando tanto una Posibilidad externa como una reflexión nativa mediante el mismo pipeline de intake, curación, HelpVersion, localización y HelpApplicability. El ciclo de Conocimiento/Evolución fue recorrido desde EvidenceUnit elegible hasta Claim provisional K0, PolicyVersion candidata, activación con cambio observable y rollback al estado previo.

La exportación privada de expresiones originales y Santuario fue ejecutada sobre la identidad sintética existente. La exportación actual conserva expresión original privada, `taxonomy_version`, `area_keys`, `capacity_keys`, confianza e incertidumbre; no promueve ese contenido a aprendizaje compartido por defecto.

## Hallazgos reales y correcciones

A54 encontró cuatro defectos que una verificación superficial habría dejado pasar.

El primero estaba en Repertorio. Tras la normalización V49, `outcomes_feedback` dejó de duplicar `help_id`, pero `lumen_s2_add_repertoire` todavía intentaba leerlo. La función quedó corregida para recorrer la relación verdadera **Outcome → Selection → Help/HelpVersion**. La prueba live completa pasó después de la corrección.

El segundo estaba en Knowledge/Evolution. `create_policy_version` creaba un Claim usando el default epistemológico histórico `E0`, mientras el contrato de la tabla ya aceptaba sólo `K0..K5`. En consecuencia, el organismo podía capturar evidencia pero no convertirla en una propuesta de cambio. Se alineó el default y la creación explícita a `K0`, manteniendo el Claim provisional, trazable y sustentado por evidencia. Activación y rollback fueron probados live.

El tercero estaba en la autopoiesis de Fuente. El intake común exigía `external_url` incluso para prácticas, reflexiones o acciones humanas nativas. Eso convertía una implementación histórica de recursos externos en una restricción indebida sobre la Fuente Viva. Se mantuvo un único pipeline: `external_resource` exige URL; las Posibilidades nativas requieren `content_payload`. No se creó una tabla ni un flujo por tipo.

El cuarto era funcional/experiencial. Fuente podía explorarse sin un problema previo, pero no permitía guardar una Posibilidad para volver luego. Agregarla directamente a Repertorio habría falsificado el significado de Repertorio, porque descubrir algo no demuestra que haya ayudado. La solución preserva semántica: Fuente guarda explícitamente la Posibilidad como **Tesoro en Santuario**, con `source_help_id` y consentimiento de memoria. Repertorio sigue requiriendo outcome `helped`.

Cada corrección deja una regresión permanente en `tests/a54-conformity.test.mjs` y, para Fuente→guardar, una prueba E2E en `e2e/a54-source-save.spec.ts`. El gate de regresión fue ampliado de un único archivo de smoke a todos los specs Playwright mediante `playwright test`.

## Conformidad funcional

La arquitectura actual da expresión real a las funciones vitales definidas por V48. La llegada no obliga a clasificar; Ahora acepta expresión libre y Fuente puede explorarse sin identidad. Momento conserva original e interpretación separadamente. Safety precede matching. Área, Capacidad y Faro no se confunden. Fuente contiene Posibilidades tipadas y versionadas, y HelpApplicability expresa la relación colectiva Posibilidad×Área×Capacidad sin resucitar `intent/need` ni `coverage_cells`.

Motor deja trazabilidad suficiente para saber qué era elegible, qué se expuso, qué se seleccionó y bajo qué versión. Selection y Delivery permanecen separados. La gramática Preparar→Posibilidad→Integrar vive en Experience y no agregó ontología. Outcome puede faltar; cuando existe, queda enlazado a la selección exacta. Evidence sólo nace bajo consentimiento y conserva la información irrepetible necesaria para aprender sin copiar intimidad.

Trayectoria, Faro, Camino y Repertorio forman continuidad soberana, no un programa prescriptivo. Santuario tiene representación privada única. Tejido cuenta con una vía de circulación humana real y pequeña: Círculos privados por invitación con contribución, reporte y salida. Proactividad exige opt-in y vuelve a comprobar quiet hours/custody al ejecutar. Knowledge/Evolution puede convertir evidencia en una modificación versionada y reversible.

## Conformidad inversa y ausencia de Frankenstein

La pasada runtime→especificación no encontró un segundo Motor, una segunda Fuente, dos memorias, una ontología de Gestos/UA, bridges de V47 ni cadenas públicas `_v3/_v4/_v47_core`. `coverage_cells` y el stub duplicado de Santuario no existen en live. Cada familia de tablas actual tiene una función V48/V49 identificable.

Las migraciones históricas y los datos sintéticos que contienen nombres de versiones anteriores se conservan como provenance. No gobiernan el runtime y no justifican compatibilidad. El reset pre-real-users sigue marcado como obligatorio. El criterio es conservar historia auditable, no conservar dependencia heredada.

## Límites que no son gaps de nacimiento

No todo lo inmaduro debe resolverse antes de nacer. La cobertura de Fuente, especialmente apoyo profesional/material y rutas restringidas, necesita ampliarse en A46. La base es español-first y la infraestructura multicultural está presente, pero su cobertura real todavía debe crecer. Condiciones de realización como disponibilidad geográfica, costo o agenda sólo deben activarse cuando una Posibilidad concreta las vuelva discriminativas. Circle es una expresión germinal de Tejido, no la forma definitiva. Consolidación surge hoy de retorno, Repertorio, Camino y follow-up optativo; no necesita un motor paralelo.

El estado `restricted` existe en HelpApplicability, aunque actualmente no hay relaciones activas con ese estado. El Motor no entrega esas relaciones: la restricción operativa actualmente ejercida es safety/custody. Antes de poblar relaciones restringidas, A46 deberá asociarlas a una vía segura de derivación o mantenerlas no entregables. Esto es un límite explícito de madurez, no una falsificación de Coverage existente.

El Conduction Gate opera con snapshot POV verificado y caducable. La lectura online directa de la POV desde CI continúa siendo el único endurecimiento pendiente de A43. No es dependencia funcional del Embrión y no se crea una segunda infraestructura para resolverlo dentro de A54.

## Dictamen previo a CI final

Tras las correcciones A54, la matriz no contiene GAP, EXCESO ni DESVÍO material abierto. Los elementos marcados `CONFORME_EMBRIONARIO` tienen función vital real y una frontera de madurez explícita autorizada por V48/V49.

Este dictamen todavía debe ser confirmado por el cierre ejecutable del branch A54: unit/arquitectura, lint, build, todas las regresiones Playwright y backend live. Sólo después de ese PASS corresponde promover la certificación A54, integrar el branch y cerrar el ACTO.
