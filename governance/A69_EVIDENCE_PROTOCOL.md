# A69 · Protocolo ejecutable de evidencia posterior al commit

Autoridad: V3/ACTO A69 y DoD vigente. Este archivo describe operación; no crea gobierno ni certifica A63/Fuente.

## Entrada única, sin autorreferencia del SHA

1. Fijar el commit objetivo y probarlo. Los recibos/revisiones se generan después de conocer ese SHA; no se versionan dentro del propio commit.
2. Preparar `bundle.json`: `schema_version:1`, `target_sha`, `contracts:{a63:{requirements:[...]},premium:{requirements:[...]}}`, `files:{"receipt.json":{...},"review.json":{...}}`. Los parches identifican requisitos existentes por `id` y sólo pueden aportar estado, criterios, diseño, implementación, tests/casos, evidencia y revisión. No pueden modificar texto, fuente, autoridad, identidad ni eliminar requisitos. `certification` y autorización humana se admiten a nivel de contrato y se verifican por los gates.
3. Cada recibo declara requirement_id, target_sha, status PASS, criterios cubiertos, hashes SHA256 de diseño/implementación/tests y resultados de ejecución sobre ese SHA. Cada revisión declara requisito/SHA, constructor y revisor distintos, tipo, decisión y referencia de ejecución/aprobación. Las referencias locales estructuran trazabilidad; no autentican por sí solas una identidad humana: custodia de cambios y revisión real siguen siendo necesarias.
4. Ejecutar `CONFORMITY_TARGET_SHA=<sha> CONFORMITY_BUNDLE_FILE=<bundle.json> node scripts/prepare-conformity-evidence.mjs`. Escribe sólo `.conformity/<sha>/`, excluido de Git. Imprime las dos rutas efectivas. En GitHub Actions también las exporta a GITHUB_ENV.
5. Ejecutar conformidad, auditor adversarial, PREMIUM y cross-domain con esas mismas rutas (`CONFORMITY_FILE` y `PREMIUM_CONTRACT_FILE`). Los tests declarados se reejecutan; archivo vacío, skip/todo, fallos o evidencia ajena bloquean.

El workflow incorpora entrada manual `evidence_artifact_id`: artifact del mismo repositorio cuyo ZIP contiene `bundle.json`. Descarga y prepara antes de los cuatro validadores. Sin bundle conserva los inventarios canónicos NO_VERIFICADO. El dispatch sólo estará disponible donde esta versión del workflow esté instalada; no se afirma instalación/merge a partir del draft.

`tests/a69-evidence-bundle.test.mjs` demuestra el camino positivo completo y las negativas en copia temporal, con autoridades/inventarios conservados. Sus aprobaciones y resultados son fixtures de protocolo: nunca pruebas humanas o conformidad real de LV/RV/CF/AC/FP.

## POV privada y PR sin ampliar la federación

Push autorizado: OIDC read-only → Sheets ACTOS/FOCOS/ACTIVOS → recibo live por SHA → artifact. PR: mismo SHA/repo/rama de confianza/workflow, Conformity Gate del push terminado SUCCESS, artifact no expirado, recibo PASS con antigüedad máxima una hora. La falta de evidencia o un fallo bloquean el PR. Nunca se usa un push de otro SHA, fork, workflow o una corrida vieja en lugar de la última aplicable.

Esta es reutilización trazable de una lectura autenticada, no una nueva consulta directa desde el evento PR. La identidad Google conserva sus restricciones. La rama emisora actual es `acto/A69-conformidad-ejecutable`; mover la operación a otra rama exige configurar y verificar esa identidad, bajo ACTO. No se presenta como federación universal ya desplegada.

## Fronteras

El reporte no autoemite certificados; un contrato CERTIFIED requiere todas sus pruebas y revisiones y conserva la decisión humana de exposición cuando aplica. El piloto PREMIUM de cuatro controles no equivale a cobertura integral V56. A69 no cierra A63/Fuente ni reemplaza HUMAN/EXPERIENCE PASS. La integración técnica se rige por la autorización de responsable único al final de este protocolo; exposición/promoción a usuarios sigue reservada al humano.

## Integración operativa sobre runtime vigente (2026-10-15)

Candidato construido selectivamente sobre A63 `1f74703e87552fa3058f2568ea910aeb2292d53d`. No modifica `src/`, `supabase/` ni las 96 regresiones E2E del producto. Conserva los cuatro checks y la evidencia completa. La decisión posterior de responsable único sustituye la aprobación humana rutinaria por PR.

`created_under_act` conserva la procedencia A69 de los contratos. `act_id` identifica el ACTO ejecutor y debe coincidir con contexto y POV; una transición requiere renovar los cuatro documentos desde autoridad vigente, sin eliminar requisitos ni alterar fuentes. Las pruebas de transición aceptan un nuevo ACTO coherente y rechazan el obsoleto, la autoridad retirada y la pérdida de cobertura. Son pruebas de mecanismo, no un cambio real de ACTO en POV.

Los triggers cubren pushes de ramas y PRs; la atestación exige el push del mismo SHA y rama del PR, y ACTO/FOCO iguales al snapshot. Esto no amplía la autorización Google: una rama no autorizada falla cerrada. La única emisora comprobada hasta ahora sigue siendo `acto/A69-conformidad-ejecutable`. No conceder acceso indiscriminado a todas las ramas para obtener checks verdes.

Pendientes para cierre operativo: autorización OIDC verificable para las ramas de trabajo/integración aprobadas; ruleset con Conduction Gate, Custody Gate, Conformity Gate y verify obligatorios sobre el destino real `a63-v60-intuitive` y su integración `greenfield-v04-embryo`; configuración compatible con responsable único y ejecución satisfactoria posterior a la integración en destino. No declarar instalación efectiva ni A69 cerrado por existir este candidato.

## Responsable único: autorización explícita de Pablo (2026-10-15)

Fuente vigente: V3/POV, LEEME regla 8, ACTO A69/DoD y MEMORIA del 2026-10-15. Pablo autoriza máxima autonomía operativa con control de proyecto. Esta decisión sustituye la anterior prohibición de integración por agente y la exigencia de segunda aprobación humana en cada PR; no es una dispensa de checks.

Durante una ejecución autorizada, el agente puede implementar, verificar e integrar por PR cambios técnicos dentro del ACTO/DoD aprobado cuando Conduction Gate, Custody Gate, Conformity Gate y verify estén SUCCESS sobre el SHA exacto y una auditoría independiente real no tenga BLOCK. Antes del merge relee POV, destino, SHA, checks y auditoría; ante divergencia se detiene. Después comprueba la corrida de destino y registra evidencia/readback. No implica un servicio permanente fuera de las sesiones de ejecución.

Pablo conserva decisión sobre NORTE, OBJETIVOS, SEÑALES, FOCOS, cambios materiales de alcance/autoridad y exposición/promoción a usuarios. Cambiar los controles o ampliar privilegios requiere autorización humana explícita; no se considera mantenimiento ordinario. Una auditoría IA no se presenta como aprobación humana independiente ni como HUMAN/EXPERIENCE PASS.

Configuración autorizada para responsable único: PR obligatorio; cero aprobaciones humanas requeridas; Code Owner review obligatorio desactivado (CODEOWNERS se conserva como responsabilidad); aprobación del último push desactivada; aprobación adicional de cambios no atribuibles desactivada. Mantener cuatro checks obligatorios y actualizados, conversaciones resueltas, sin bypass ordinario, force push ni borrado. Las reglas coincidentes se acumulan: el ruleset antiguo de greenfield también debe dejar de exigir Code Owner review. Estos ajustes requieren permisos administrativos que el conector actual no posee.

GitHub exige mecánicamente PR y checks; la auditoría independiente, el alcance y las decisiones reservadas son además compromisos del protocolo gobernado. No se afirma que GitHub distinga humano/agente cuando comparten identidad ni que esta modalidad equivalga a separación de dos identidades humanas.
