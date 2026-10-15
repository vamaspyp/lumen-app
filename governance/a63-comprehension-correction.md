# A63 · Corrección de Comprensión y Mi Vida · 05/10/2026 UTC

Esta corrección rectifica una omisión material de la entrega anterior: la primera devolución de Comprensión mostraba Áreas, pero los Potenciales aparecían recién después de elegir Faro. La validación anterior no acreditaba esa escena completa. El título de Mi Vida también estaba debajo de la imagen.

Autoridad: POV/A63 EN CURSO y V58 vigente §22.12 CF02, releídos antes de intervenir. Base comprobada: `7d339ec303dc3c591993903b285fad0eb1545e11`, PR31, rama `a63-v60-intuitive`. Se conservan órganos, excepciones de ayuda puntual/Explorar/safety, DH04 y consentimiento de memoria; no merge ni promoción.

| Especificado | Implementado | Probado / evidencia | Resultado |
|---|---|---|---|
| Devolución conjunta y corregible | Comprensión devuelve lectura, Áreas, dirección posible y N Potenciales, con definición/significado, aceptar, reformular, retirar, agregar y regenerar | `e2e/comprehension-potentials.spec.ts`; `tests/cf-runtime-real.mjs` exige edición antes del Faro y continuidad real | PASS técnico de los casos; suficiencia interpretativa humana pendiente |
| Mantener correcciones hasta construir | El mismo borrador pasa a Faro, sin reproponer ni perder la voz de la persona; confirmar precede composición | E2E desktop/mobile; runtime Auth/RPC real comprueba acuerdo guardado en composición | PASS técnico de conservación; no HUMAN PASS |
| Momento puntual sin crear Faro | Revisión episódica admite sólo Potenciales aceptados/reformulados; original se conserva | `tests/comprehension-potentials-live.sql` en Greenfield; regresión E2E | PASS SQL real; sin memoria/Faro obligatorios |
| Corrección influye en selección | Potenciales revisados participan en matching por relaciones editoriales revisadas; la inferencia anterior no los elude | Prueba SQL con relación revisada temporal produce recurso pertinente y revierte todos los fixtures | PASS mecanismo; cobertura editorial real sigue BLOCK |
| Mi Vida sobre imagen | Título/subtítulo superpuestos a fotografía con contraste, sin duplicación | E2E comprueba geometría desktop/mobile; axe y capturas | PASS técnico; revisión visual humana pendiente |

Migración aplicada mediante conector autorizado: `20261005010835_a63_comprehension_potentials_review.sql`. RPC de cinco argumentos sin defaults ambiguos; la aridad anterior conserva compatibilidad y Potenciales revisados. Ownership, safety, límites y permisos autenticados comprobados. Ninguna relación candidata fue admitida como Fuente.

Verificación local: `npm run verify` (89 unidades, custodia, lint/build, 82 E2E); backend público real PASS. Cinco suites SQL previas y la nueva ejecutadas en Supabase real con rollback. CI, SHA final, preview y capturas posteriores se registran juntos en ACTOS!J43, sin heredar un PASS del SHA anterior.

A63 continúa EN CURSO. Fuente sin relaciones N:M admitidas, equivalencia completa del prototipo, audiovisual/derechos/accesibilidad integral, comprensión general y validación humana permanecen pendientes según la matriz integral. Esta corrección no acredita EXPERIENCE PASS, HUMAN PASS ni cierre del Embrión.
