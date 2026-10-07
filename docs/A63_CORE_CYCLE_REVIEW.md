# A63 · Revisión del ciclo principal e imágenes del prototipo

Fecha: 2026-10-03. FOCO F6 ACTIVO / ACTO A63 EN CURSO, verificados en POV viva; V58 §22.10–22.11 bajo V46/V51/V52/V53/V55/V56. Solicitud humana: revisar escucha → comprensión → inferencia de Áreas/Potenciales → revisión/ajuste → generación de Constelación y recuperar imágenes en los órganos.

## Resultado material

| Paso | Cambio | Evidencia |
|---|---|---|
| Escucha | Texto original privado conservado; modo de revisión no selecciona ni expone ayudas antes del acuerdo | SQL real: episodio sin decision_runs ni exposiciones antes de revisar |
| Comprensión | Lectura provisional editable; incertidumbre pide contexto en la misma escena; falta de cobertura no impide revisar | Browser desktop/mobile: clarify y no_match llegan a comprensión sin inventar Constelación |
| Áreas | Inferencia acumula varios ámbitos; hipótesis visibles, editables y opcionales; selección corregida llega a backend | SQL: trabajo/bienestar/familia; corrección a bienestar; original intacto |
| Potenciales | Propuestas contextuales abiertas, con significado y razón; estado propuesto no es aceptado; sin equivalencia implícita con vocabulario canónico | SQL: reformulación usa Faro actual, negación explícita, safety; browser: pendientes excluidos |
| Ajuste | Aceptar, reformular, retirar y agregar; regenerar conserva aceptados, retirados y aportes personales; salida/retorno conserva borrador sólo en memoria de la sesión | Browser: regeneración, Faro editado, áreas, detour a Explorar |
| Acuerdo | Faro y acuerdo se confirman en una sola transacción; versión/revisión vistas por la persona; creación reintentable con identidad estable | SQL real: error revierte creación y actualización; conflicto no sobrescribe; retry no duplica |
| Generación | Momento usa contexto humano revisado; Faro requiere versión válida y relaciones editoriales admitidas; Fuente única y NO_MATCH honesto | SQL: matching positivo con fixture transaccional, retirada y NO_MATCH; fixture revertido |
| Imágenes | Fotografías originales en las cinco puertas y escenas principales; elementos img evitan el borrado por estilos anteriores | Browser: archivos cargados; revisión visual móvil |

## Validación ejecutada

- `npm run verify`: 89 unitarias, Conduction/Custody Gate, lint sin errores, build y 72 E2E desktop/mobile PASS.
- `NODE_USE_ENV_PROXY=1 npm run test:live`: salud operativa, 89 posibilidades activas, 129 aplicabilidades, 6 proveedores, 10 tipos; acceso personal anónimo bloqueado.
- `tests/core-cycle-live.sql`: SQL real con rollback; multi-área, revisión antes de selección, original, propuestas/reformulación/negación, safety, retry, atomicidad, versiones, ownership, consentimiento, ACL; generación positiva y retirada con fixture editorial visible sólo dentro de la transacción.
- `tests/faro-agreement-live.sql`: regresión real de consentimiento, propiedad, historial, idempotencia, exportación, conflicto, stale gate, NO_MATCH, cascada, ACL y RLS.
- Avisos preexistentes: dependencia useMemo en App.tsx y bundle Vite >500 kB. Revisión React: efectos cancelan carga inicial obsoleta; acciones async serializadas; estado editable conserva identidad; campos etiquetados y controles accesibles.
- Advisors de seguridad: RPC SECURITY DEFINER autenticados son intencionales con search_path vacío y propiedad/consentimiento comprobados. No se habilita ACL directa de tablas privadas. Aviso preexistente de protección de contraseñas filtradas, no utilizado por el acceso OTP; referencia https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection.

## Límites reales y cierre

La comprensión sigue siendo un intérprete de reglas: las mejoras no equivalen a comprensión lingüística general. Las expresiones contextuales son hipótesis corregibles, no un catálogo exhaustivo ni conceptos admitidos de Fuente. No se instala un proveedor LLM ni una nueva ontología. La cobertura longitudinal vigente tiene 86 conceptos y 169 relaciones candidatas, **0 conceptos / 0 relaciones revisadas**. Por ello una Constelación Faro–Potenciales sin relación admitida sigue devolviendo NO_MATCH. El fixture de matching positivo no admite piezas ni relaciones para personas reales: todo se revierte.

A63 permanece abierto. Este cambio aporta ejecución y evidencia técnica; no declara core impecable, suficiencia semántica general, HUMAN/EXPERIENCE PASS ni desbloquea A66/A68. Publicación de revisión en rama aislada; sin merge ni promoción de producción. Para cierre faltan cobertura editorial legítima, evaluación semántica con casos reales y revisión humana del runtime exacto.

## Recuperación

Las migraciones no crean tablas ni alteran datos personales existentes. Un rollback del código debe acompañarse de restauración de las definiciones previas de RPC/arity desde las migraciones anteriores; no borrar acuerdos ni originales. Las ACL de funciones restauradas deben conservar autenticación y ownership. Las pruebas SQL se cierran con rollback y no retienen usuarios sintéticos ni admisiones editoriales.
