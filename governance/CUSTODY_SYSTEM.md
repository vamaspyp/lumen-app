# V54 · Sistema de Custodia Sincrónica del Organismo

## Regla base

Custodia no es una autoridad paralela. Todo custodio empieza por `POV/ACTIVOS → FOCO → ACTO/DoD → autoridad vigente`, hereda V41/V42 y opera bajo el mismo contexto de `governance/conduction-context.json`.

Un custodio puede **observar, contrastar, pedir evidencia, emitir hallazgos y bloquear una certificación por un riesgo duro**. No puede canonizar, cambiar prioridades, escribir runtime ni resolver un conflicto de valores fuera de un ACTO gobernado.

## Instanciación de agentes

Los custodios no necesitan nueve procesos residentes. Un agente de custodia se instancia cargando:

1. `governance/conduction-context.json`
2. `governance/pov-snapshot.json`
3. `governance/custody-registry.json`
4. el perfil `C0..C8` correspondiente
5. evidencia del cambio o sistema a revisar
6. `governance/custody-findings.json`

El agente debe asumir literalmente el `scope`, `authorities` e `invariants` de su perfil. Todo lo que quede fuera de ese contrato se marca fuera de ámbito o se deriva a otro custodio.

## Pregunta común de sincronía

Cada revisión contrasta cinco dimensiones: `NORTE`, `FISIOLOGIA`, `PERSONA`, `ORGANISMO`, `EVOLUCION`.

La pregunta no es sólo “¿mi órgano funciona bien?”. Es: **“¿funciona bien, contribuye al Norte, circula valor con el resto y puede evolucionar sin dañar el organismo?”**

## Formato obligatorio de salida

```text
CUSTODIO: Cx · Nombre
RESULTADO: PASS | GAP | RIESGO | DECISION_HUMANA
SEVERIDAD: INFO | WARN | BLOCK
HALLAZGO: ...
AUTORIDAD AFECTADA: ...
EVIDENCIA: ...
EFECTO LOCAL: ...
EFECTO SISTEMICO: ...
RECOMENDACION MINIMA: ...
DUEÑO SIGUIENTE ACCION: ...
```

No se acepta un `BLOCK` sin autoridad + evidencia + efecto sistémico. No se acepta un `PASS` si faltó evidencia requerida.

## Custodio Integral

C0 consolida resultados. No vota ni promedia. Si dos custodios discrepan, intenta resolver por autoridad vigente. Si la autoridad no alcanza o aparece una decisión de valor/prioridad, devuelve `DECISION_HUMANA`.

## Gate determinístico

`scripts/check-custody-gate.mjs` valida que:

- V54 esté vigente en la POV;
- existan exactamente C0–C8;
- todos declaren alcance, autoridad, invariantes, capacidad de bloqueo y dueño de decisión;
- ningún custodio pueda crear autoridad o mutar sin ACTO;
- los review sets críticos estén completos;
- no existan hallazgos `BLOCK` abiertos.

El gate corre en CI **después de Conduction Gate y antes de verify**.

## Revisión semántica

Los checks determinísticos no sustituyen juicio. Cambios materiales activan el review set de su clase. Para el próximo incremento Fuente + Experiencia previo a Pauli se requiere: `C0 + C1 + C2 + C3 + C7 + C8`.

Cada custodio revisa evidencia real —spec, código, DB, UI, test o experiencia— y registra sólo hallazgos materiales. La custodia no existe para pulir gustos ni buscar perfección.

## Cierre

Un cambio queda custodiado cuando no hay `BLOCK` abierto, todo `GAP/RIESGO` material tiene tratamiento explícito y C0 confirma que ninguna optimización local degradó el todo.
