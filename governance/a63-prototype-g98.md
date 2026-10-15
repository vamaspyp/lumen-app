# A63 · Contraste del prototipo adjunto · 2026-10-03

POV viva consultada: F6 ACTIVO, A63 EN CURSO. ACTIVOS identifica V58 §22.10–22.11 como derivación constructiva; V46/V51/V52/V53/V55/V56 y V41/V42 conservan precedencia. Rama real `a63-v60-intuitive`, baseline `db99dc0`; Supabase `vbuixagaguasejputubp` e infraestructura Vercel `lumen-app` verificados.

| Pieza | Decisión | Evidencia y delta mínimo |
|---|---|---|
| Contrato de UX adjunto | PRESERVAR/AJUSTAR | Ocho fuentes y pruebas del ZIP inspeccionadas. Mantener jerarquía, cinco puertas y recorridos; sustituir datos y reglas simuladas por contratos de aplicación. |
| OTP, safety, Vivir por familias, Source, Santuario, Tejido, privacidad, continuidad | PRESERVAR | Funciones PostgreSQL y consumidores React vigentes consultados. No segundo runtime, catálogo ni proveedor. |
| Acuerdo Faro–Potenciales | AJUSTAR | §22.10 exige relación versionada, explícita y revisable; falta en el esquema. Añadir cabecera de versión y elementos privados vinculados al Faro, ownership, consentimiento y control de versión. |
| Catálogo `POTS` y mapeo a `capacity_terms` del LEEME | REEMPLAZAR | Son muestra [NV]/inferencia, incompatibles con la depuración de V53. No renombrar ni canonizar legado. Usar conceptos editoriales existentes como hipótesis, y expresión propia abierta. |
| Selección longitudinal | AJUSTAR | Sólo relaciones semánticas admitidas, nunca candidatas. Live: 86 conceptos y 169 relaciones en estado candidate; no hay relaciones reviewed. NO_MATCH es resultado correcto de este corte; Fuente puntual y Explorar permanecen disponibles. No desbloquear A66–A68 ni promover curaduría. |
| Guardado/memoria | AJUSTAR | Guardar Faro/acuerdo requiere consentimiento; desactivar memoria oculta la proyección y olvidar elimina por FK con el Faro. Sin vida personal en localStorage. |
| Imágenes | PRESERVAR | Cuatro JPEG suministrados por el usuario se extraen del ZIP para fidelidad. No se declara licencia de producción verificada. |

Guardrails afectados: G78/G84 (decisión en aplicación/Postgres, UI captura/renderiza); G80 (teclado/foco/contraste/responsive); G87–G90 (sin dependencia legacy, relación normalizada mínima); G98 (inspección viva); seguridad/memoria/NO_MATCH y G113–G114 (sin cierre ni falsa equivalencia). Pruebas: compilación/lint/unit/custodia/conducción, SQL transaccional con rollback y ownership/no-memory/stale/cross-user; E2E móvil/escritorio y revisión de capturas. HUMAN/EXPERIENCE PASS no se infiere de tests.
