# V25 — Skill de construcción

Estado: piloto A20.

## Propósito

Ejecutar trabajo técnico autorizado por un ACTO sin alterar gobierno ni canon, preservando la arquitectura canónica y devolviendo evidencia verificable.

## Entrada obligatoria

Recibir un envelope generado por `.claude/runtime/run.mjs prepare` con:
- ACTO y FOCO;
- propósito y DoD;
- manifest de autoridad verificado;
- acciones autorizadas y límites;
- actor seleccionado y motivo de routing;
- contrato de retorno.

## Procedimiento

1. Leer las autoridades indicadas en el manifest usando la fuente real disponible. Si alguna no puede leerse, no inventar: marcar `NO_VERIFICADO` y bloquear si es necesaria para una decisión material.
2. Verificar estado real antes de modificar: repo/código, esquema/funciones/datos, integraciones y permisos efectivos según corresponda.
3. Respetar la arquitectura canónica: **Supabase decide → dispatcher ejecuta → React renderiza**. No introducir lógica paralela por comodidad.
4. Ejecutar sólo las acciones incluidas en el ACTO. Favorecer cambios aditivos, mínimos y reversibles.
5. No tocar Norte, Objetivos, Señales, Focos, alcance estratégico, canon, secretos, acciones destructivas o producción fuera de autorización explícita.
6. Verificar el resultado contra el DoD. Para cambios significativos del repo, usar la verificación vigente del repositorio; para cambios de base, verificar esquema/funciones/datos reales después del cambio.
7. Devolver el contrato completo y distinguir el origen de cada evidencia relevante: `LEÍDO`, `DERIVADO` o `NO_VERIFICADO`.
8. Registrar esfuerzo real. No estimar horas humanas no realizadas.

## Routing y fallback

Claude Code es preferente cuando capacidad, riesgo, costo y disponibilidad lo justifican. Si no está efectivamente disponible, usar un actor alternativo competente con permisos reales. Si ninguno cumple, devolver `BLOQUEADO` con causa; nunca simular ejecución.

## Retorno mínimo

- `estado`
- `evidencia[]` con `origin`, `statement`, `reference`
- `resultado`
- `aprendizaje`
- `referencias`
- `esfuerzo_real` en formato `persona_h=<horas reales>; agente_sesiones=<n reales>`
- `dod_check[]`

El skill no cambia la autoridad de las fichas ni promueve otras fichas a skills. Esa promoción queda fuera de V25 y sujeta al ACTO correspondiente.
