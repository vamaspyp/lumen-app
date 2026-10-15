# A63 · V55.3 · Experience & Sensation Field — mapa de cobertura

Estado: evidencia de construcción para A63. No reemplaza V55.3, V43, V52 ni V53.

## Regla de no regresión

La versión validada humanamente el 2026-09-13 fija la naturaleza de relación: campo relacional continuo, llegada abierta, expresión libre, presencia sensorial, transformación del mismo Field, órganos invisibles, Explore deliberado, soberanía y retiro. Este mapa sólo puede completar amplitud sin degradar esas propiedades.

## Familias cubiertas en la pieza interactiva

| Familia canónica | Expresión V1.3 | Cobertura |
|---|---|---|
| Primera llegada | `arrive()` sin historia | PASS |
| Regreso limpio | `arrive()` sin cue si no hay memoria pertinente | PASS |
| Faro/continuidad autorizada | cue ambiental + `resumeFaro()` / `faroView()` | PASS |
| Algo propio/Repertorio | cue ambiental + `repertoire()` / `reuse()` | PASS |
| Curiosidad | `explore()` desde llegada sin check-in | PASS |
| Sólo estar / silencio | `silence()` | PASS |
| Proactividad consentida | `proactiveEntry()` + reason + no ahora + apagar | PASS sintético |
| Expresión libre | textarea de llegada | PASS |
| Comprensión suficiente | `listen()` con reflejo tentativo | PASS prototipo |
| Aclaración mínima | `clarify()` | PASS |
| Corrección / desacuerdo | “No del todo” → `clarify()` | PASS |
| Cambio de tema en retorno | `otherReturn()` → nuevo Momento | PASS |
| Nueva Posibilidad | `openPossibilities()` | PASS |
| Constelación | `constellation()` + relaciones en Explore | PASS |
| Recuperar antes que novedad | recomendación longitudinal + `repertoire()` | PASS |
| Repetir | `reuse()` → práctica | PASS |
| Variar | `reuse()` → constelación | PASS |
| Transferir | representado como movimiento de constelación; microinteracción específica pendiente | PARTIAL no bloqueante para Field |
| Continuar Camino/Faro | Faro vivo y retoma contextual | PASS a nivel Field |
| Integrar | `integration()` | PASS |
| Abstenerse | “Con esto alcanza”, “No ahora”, `withdraw()` | PASS |
| NO_MATCH | `noMatch()` sin recomendación de relleno | PASS |
| Safety | `safety()` con menor ambigüedad y derivación humana | PASS prototipo; enlaces reales pertenecen a implementación productiva |
| Perspectiva/reflexión | `perspective()` | PASS |
| Práctica | `practice()` | PASS |
| Audio/off-screen | `audio()` + `offscreen()` | PASS prototipo |
| Acción real | `action()` + `offscreen()` | PASS |
| Recurso/obra | `resource()` con procedencia/condiciones | PASS prototipo |
| Persona/profesional | `support()` + `humanPrep()` | PASS |
| Círculo/grupo | `humanSpace()` con LUMI P0 y salida/reporte | PASS como gramática |
| Evento/lugar | `place()` | PASS prototipo |
| Apoyo material/servicio | `support()` | PASS prototipo |
| Retorno: ayudó | `outcome('helped')` | PASS |
| Retorno: no ayudó | `notHelpful()` | PASS |
| Retorno: no sé | `leaveOpen()` | PASS |
| Retorno: ocurrió otra cosa | `otherReturn()` | PASS |
| Retorno privado | `privateReturn()` | PASS |
| Santuario | `saveMeaning()` / `sanctuary()` | PASS sintético |
| Corregir/olvidar | `forget()`; edición de Faro separada | PASS básico |
| Repertorio / hacer propio | `makeOwn()` / `repertoire()` | PASS |
| Faro editable | `createFaro()` / `editFaro()` / `dropFaro()` | PASS |
| Autonomía creciente | `autonomy()` | PASS |
| Tejido / Vida acompaña Vida | `humanPrep()` / `humanSpace()` | PASS |
| Derramar | `spill()` sin estatus | PASS |
| Retiro P0–P4 | orb normal / tiny / quiet / absent según escena | PASS perceptual |
| Salida soberana | botón persistente Salir + salidas locales | PASS |
| Sonido opt-in | toggle de microambiente, sin autoplay | PASS prototipo |
| Reduced motion | media query | PASS estructural |
| Teclado/Escape | controles nativos + cierre drawers con Escape | PASS básico |
| Multilenguaje / multicultural | contrato preservado en canon; no se materializa selector para evitar convertir QA en feature | STRUCTURAL ONLY |
| Multisuperficie | off-screen y semántica preservada; no se simulan clientes externos | STRUCTURAL ONLY |

## Correspondencia V43 J1–J14

- J1 Primer encuentro → llegada abierta + Explore + valor sin navegación de órganos.
- J2 Momento → expresión → comprensión → posibilidad → experiencia → retiro → retorno → integración.
- J3 Incertidumbre → aclaración mínima.
- J4 NO_MATCH → honestidad + reformular/explorar/propio/ayuda externa/cerrar.
- J5 Experiencia → densidad reducida + salida + retorno breve.
- J6 Fuente → Explore constelacional, no catálogo.
- J7 Trayectoria → Faro editable, pausa y abandono sin fracaso.
- J8 Cultivar/Repertorio → recuperar, repetir, variar, hacer propio, autonomía.
- J9 Santuario → guardar como significado + olvidar.
- J10 Tejido/Círculos → preparación, P0 durante humano, salida/reporte.
- J11 Derramar → ofrecer valor sin estatus.
- J12 Proactividad → razón visible, no ahora, apagar.
- J13 Ayuda humana/profesional/material → puente externo con límites.
- J14 Audio/voz/off-screen → visual baja a P0/P1 y retorno posterior.

## Latido longitudinal V52

`Momento → Posibilidad → Experiencia → Retorno positivo → Guardar/Repertorio/Faro → Regreso posterior → Recuperar/Repetir/Variar → Nuevo retorno → Hacer propio/Autonomía → menor protagonismo de LUMI` puede recorrerse sintéticamente en la pieza con persistencia local.

## Huecos deliberadamente no resueltos en esta capa

1. Copy final por caso, timings exactos, animaciones finales, sonido/voz editorial y microinteracciones: siguiente nivel, después de certificar topología.
2. Datos reales, providers, disponibilidad, enlaces de emergencia, identidad/auth, RLS y telemetría: pertenecen al runtime productivo V53/V44, no a este prototipo Field.
3. Transferencia contextual tiene soporte conceptual y camino de variación, pero merece una microinteracción específica cuando se refine continuidad.
4. Multilenguaje/multiculturalidad/multisuperficie se preservan como contrato; no se agregan controles demostrativos que deformen la experiencia principal.

## Dictamen de esta pasada

La fisiología experiencial del Embrión queda representada sin convertirla en un launcher, un dashboard o catorce journeys separados. Los huecos restantes son de materialización fina o integración productiva, no de anatomía experiencial. Cualquier siguiente iteración debe demostrar que conserva la línea base V55.3 antes de sumar detalle.