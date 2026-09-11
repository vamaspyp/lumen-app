# VA+LUMEN · Conduction Gate

Estado: ACTIVO
Autoridad: deriva de V41 + V42 V1.2 + Sistema de Conducción/POV. Este archivo NO crea doctrina paralela.

## Regla

Ninguna IA puede analizar, diseñar, recomendar, ejecutar o cerrar un cambio material oficial de VA+LUMEN sin resolver primero el Sistema de Conducción vigente.

Secuencia obligatoria:

`POV/ACTIVOS → FOCO → ACTO/DoD → autoridades vigentes aplicables → realidad técnica vigente → ejecución → evidencia → cierre`

Nunca:

`memoria/chat/documento encontrado → diseño → repo/DB`

## Fail closed

Si no puede verificarse cualquiera de estos puntos, el agente se detiene antes de diseñar o mutar:

- POV accesible y vigente;
- FOCO válido y ACTIVO;
- ACTO EN CURSO y DoD explícito;
- autoridad vigente del concepto afectado;
- ausencia de contradicción material entre autoridades;
- realidad actual de código/DB/infra cuando corresponda;
- herramienta, permiso y actor realmente disponibles.

Una fuente histórica, SUPERADA, patrimonial o simplemente hallada no recupera autoridad. La implementación tampoco es autoridad: es realidad a contrastar.

## Contexto ejecutable y atestación POV

El repo mantiene dos piezas distintas:

- `governance/conduction-context.json`: pasaporte técnico del trabajo activo;
- `governance/pov-snapshot.json`: atestación mínima, obtenida de la POV real, de FOCO, ACTO/DoD y autoridades vigentes.

Ninguna reemplaza la POV privada. El snapshot debe renovarse desde Google Drive antes de un cambio material cuando cambia FOCO/ACTO/autoridad y, como defensa adicional contra contexto envejecido, no puede superar la antigüedad máxima declarada. El CI compara snapshot y contexto y falla si divergen.

Todo commit material debe identificar el ACTO vigente en su mensaje. Un cambio de ACTO exige primero actualizar la POV y después regenerar snapshot/contexto desde esa realidad, nunca al revés.

## Frontera anti-bypass

La protección no debe depender de que una IA obedezca instrucciones. Por eso:

1. CI expone un job independiente `Conduction Gate` que corre antes del resto de la verificación.
2. La rama oficial debe estar protegida por ruleset/branch protection y exigir ese check.
3. Los archivos que pueden debilitar el gate (`governance/`, workflow, script, tests y entrypoints de agentes) tienen custodia humana mediante CODEOWNERS y deben requerir Code Owner review.
4. Push forzado, borrado de rama y bypass de administradores deben quedar deshabilitados salvo recuperación extraordinaria deliberada.
5. Una mutación que no atraviesa esta frontera no se considera trabajo oficial de VA+LUMEN aunque técnicamente exista.

## Agentes

Los entrypoints de agentes (`AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md` y equivalentes futuros) sólo apuntan a este gate y a la autoridad vigente. No duplican la Constitución completa. Toda nueva IA o automatización con capacidad de cambio debe incorporar el gate antes de obtener permisos de escritura.

## Validación online de POV

La defensa objetivo es que CI consulte la POV privada con una identidad de sólo lectura y compare FOCO/ACTO/estado/autoridades contra el contexto del cambio. Las credenciales no viven en el repo; se inyectan como secreto/identidad federada de GitHub Actions. Si la consulta online falla o contradice el snapshot, el gate falla cerrado.

Hasta que esa identidad de sólo lectura esté configurada, el snapshot verificado y con caducidad es una defensa intermedia, no una garantía criptográfica de actualidad.

## Límite técnico explícito

La garantía fuerte existe sólo cuando concurren: POV verificable, check `Conduction Gate` verde, rama protegida sin bypass ordinario y custodia humana de los propios controles. Cualquier ausencia se registra como brecha de gobierno y bloquea declarar el sistema invulnerable.
