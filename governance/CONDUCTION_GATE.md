# VA+LUMEN · Conduction Gate

Estado: ACTIVO
Autoridad: deriva de V41 + V42 V1.1 + Sistema de Conducción/POV. Este archivo NO crea doctrina paralela.

## Regla

Ninguna IA puede analizar, diseñar, recomendar, ejecutar o cerrar un cambio material oficial de VA+LUMEN sin resolver primero el Sistema de Conducción vigente.

Secuencia obligatoria:

`POV/ACTIVOS → FOCO → ACTO/DoD → autoridades vigentes aplicables → realidad técnica vigente → ejecución → evidencia → cierre`

Nunca:

`memoria/chat/documento encontrado → diseño → repo/DB`

## Fail closed

Si no puede verificarse cualquiera de estos puntos, el agente se detiene antes de diseñar o mutar:

- POV accesible y vigente;
- FOCO válido;
- ACTO ejecutable o en curso;
- DoD del ACTO;
- autoridad vigente del concepto afectado;
- ausencia de contradicción material entre autoridades;
- realidad actual de código/DB/infra cuando corresponda;
- herramienta, permiso y actor realmente disponibles.

Una fuente histórica, SUPERADA, patrimonial o simplemente hallada no recupera autoridad. La implementación tampoco es autoridad: es realidad a contrastar.

## Contexto ejecutable

El repo mantiene `governance/conduction-context.json` como pasaporte técnico del trabajo activo. Debe reflejar el ACTO real que origina el cambio y las autoridades aplicables. No reemplaza la POV: la referencia maestra sigue siendo el Sistema de Conducción en Google Sheets.

Todo commit material posterior a A43 debe identificar el ACTO en su mensaje y ser coherente con el contexto versionado. La suite automática bloquea incoherencias detectables.

## Agentes

Los entrypoints de agentes (`AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md` y equivalentes futuros) sólo deben apuntar a este gate y a la autoridad vigente. No duplican la Constitución completa.

## Límite técnico explícito

Mientras CI no pueda consultar criptográfica/directamente la POV privada y GitHub no tenga una ruleset obligatoria que impida pushes que salteen CI, el enforcement de repositorio es fuerte pero no absoluto. La garantía máxima exige dos controles adicionales: validación online de la POV y protección de rama que haga obligatorio el check de Conduction Gate. Hasta entonces, cualquier vía que pueda escribir ignorando CI se considera una brecha conocida y no debe presentarse como cerrada.
