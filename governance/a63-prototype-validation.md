# A63 · Implementación del prototipo adjunto · 2026-10-03

Publicación de revisión sobre `a63-v60-intuitive`, base `db99dc0`. F6 ACTIVO / A63 EN CURSO, verificados en POV viva. V58 §22.10–22.11 se aplica bajo V46/V51/V52/V53 y los guardrails vigentes. A63 no se cierra y no se declara HUMAN/EXPERIENCE PASS.

## Resultado material

React conserva el runtime, OTP y Supabase existentes. La interfaz adopta las imágenes, paleta, marco móvil, jerarquía de Inicio y cinco puertas del ZIP. Se conserva Vivir por familias y se añade una ficha previa opcional de Fuente. Momento puede alimentar un Faro sin volver a escribir lo original. El mismo espacio permite editar dirección y potenciales, confirmar o conservar sólo el Faro y seguir después. Hay selección de Faros existentes, voluntad/pausa/cierre y navegación por Visión, Potenciales, Constelaciones y Evolución.

La aplicación obtiene propuestas del backend editorial vigente; no copia `POTS`, `RELS`, `potGen`, `compose`, `interp` ni la ontología inferida del LEEME. La relación Faro–Potenciales es privada, N:M y versionada. Admite expresión propia sin clave canónica, reformulación, retiro, restauración, regeneración que conserva aportes propios, áreas y sentido contextual. Un cambio de etiqueta pasa a identidad personal, sin equivalencia automática con un concepto editorial. Confirmar sin cambios no duplica versiones. Puede confirmarse una selección vacía sin convertirla en una recomendación fabricada.

Guardado requiere identidad y memoria consentida. La relectura verifica el acuerdo; conflictos concurrentes y Faro reformulado bloquean composición con una versión vieja. La historia se incluye en la exportación privada y se elimina en cascada al olvidar el Faro/memoria. Desactivar memoria deja de mostrar Faros previos en la proyección personal. El ledger sólo recibe referencias, versión y cantidad, nunca textos íntimos.

## Validación ejecutada

| Capa | Resultado y límite |
|---|---|
| Conducción y Custodia | PASS técnico; A63 permanece IN_PROGRESS, sin BLOCK. Brechas de juicio humano y protección de rama siguen abiertas. |
| Unitarias | 89/89 PASS. |
| `npm run verify` | PASS: unitarias, custodia, lint, build y 60 E2E en Chromium móvil/escritorio. |
| Revocación de memoria añadida al final | Lint/build PASS y 2/2 E2E específicos PASS, uno por superficie. Total de casos E2E del corte: 62. |
| Auth/RPC/Source reales | `npm run test:live` PASS contra el proyecto vigente: salud operacional, 89 ayudas activas, 129 relaciones de aplicabilidad, 6 proveedores y 10 formas semánticas; RPC personales bloqueados para anon. No certifica OTP de una persona real. |
| Acuerdo real en PostgreSQL | `tests/faro-agreement-live.sql` PASS: consentimiento, ownership de lectura/escritura, versiones/historia/idempotencia, exportación, conflicto, stale, NO_MATCH, cascada, ACL y RLS. Todos los datos sintéticos se revirtieron con rollback. |
| Flujo React nuevo | E2E con doble explícito: literal Momento→Faro, potencial propio abierto, rechazo/aceptación de consentimiento, guardado/relectura, gate longitudinal, retiro en nueva versión y alternativa puntual sin acuerdo. No sustituye evidencia SQL ni juicio humano. |
| Fuente/Vivir | E2E usa RPC reales para audio atribuido OPS/OMS (incluye ficha previa y apertura) y servicio humano argentino. Las demás familias conservan su renderer existente. |
| Visual | Capturas revisadas a 390×844 y 1440×900; hero suministrado, hoja crema, cinco puertas flotantes, controles alcanzables y ausencia de overflow. No se declara equivalencia pixel a pixel ni HUMAN PASS. |

Las pruebas Python del ZIP acceden a objetos globales de su simulador (`S`, `A`, etc.). Se usaron como criterios de contraste; no se presentan como ejecutadas exitosamente contra React. La cobertura nueva usa los contratos reales de aplicación y relectura, con el doble de red claramente separado de la prueba viva.

## Cobertura y pendientes gobernados

La DB actual tiene 86 conceptos y 169 relaciones Potencial–Fuente en estado `candidate`, sin relaciones `reviewed`. La Constelación longitudinal excluye candidatas y devuelve un NO_MATCH explicable. Esto no habilita curaduría ni promoción de A66–A68: el embrión mantiene la guía puntual y Explorar. Los potenciales propios pueden conservarse sin inventar una afinidad de Fuente.

Este corte no certifica reproducción de cada detalle del simulador, la interpretación semántica expansiva del catálogo de muestra, una sesión OTP humana, dos ocasiones vividas por Pauli, reproducción multimedia dentro de proveedores externos ni licencia de producción de las fotos del adjunto. No hay HUMAN PASS, cierre de A63, merge ni promoción a producción. El lint conserva una advertencia preexistente en `App.tsx` y Vite advierte sobre el tamaño del bundle.

## Prueba humana

Abrir la publicación de revisión. Desde Inicio: contar un Momento, entrar con OTP, elegir «Cuidar esto como un Faro», revisar la frase, nombrar/reformular un potencial y confirmar con consentimiento. Reabrir el Faro para comprobar la relectura. Explorar permite conocer una ficha y vivir una ayuda; Retorno y Santuario conservan sus permisos separados. La falta de relaciones longitudinales admitidas debe verse como tal, sin ayudas de muestra.
