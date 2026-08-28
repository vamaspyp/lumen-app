# Runtime mínimo de ejecución agentic — A20

Este directorio materializa la infraestructura mínima pedida por A20. No es un framework de agentes ni una segunda capa de gobierno: es un adaptador pequeño entre un ACTO autorizado y un actor ejecutor.

## Qué garantiza

1. **Contrato**: un work package debe declarar ACTO, FOCO, propósito, DoD, autoridades, acciones pedidas y candidatos.
2. **Lectura de autoridad**: el ejecutor sólo recibe un paquete si el manifest de autoridad trae referencias verificadas y fecha de lectura. La lectura real del contenido la realiza el actor con los conectores disponibles; el runtime no copia ni congela el canon.
3. **Routing**: selecciona únicamente actores disponibles, con capacidad mínima y permisos efectivos para todos los targets. Capacidad y ajuste al riesgo pesan más que costo.
4. **Permisos**: acciones destructivas, irreversibles, de secretos o producción requieren autorización explícita. La ausencia de permiso efectivo bloquea; la capacidad nominal no alcanza.
5. **Invocación**: `prepare` produce un envelope autocontenido para el actor seleccionado. No acopla el runtime a un proveedor ni exige una API key concreta.
6. **Verificación**: `verify` valida el retorno obligatorio y el origen de evidencia (`LEÍDO`, `DERIVADO`, `NO_VERIFICADO`).
7. **Write-back**: el retorno exige `estado`, `evidencia`, `resultado`, `aprendizaje`, `referencias`, `esfuerzo_real` y `dod_check`. GitHub conserva package y evidencia; el Sistema de Conducción recibe el write-back operativo.

## Uso

```bash
node .claude/runtime/run.mjs prepare .claude/work/A1.json > /tmp/A1-envelope.json
node .claude/runtime/run.mjs verify .claude/evidence/A1-A20-pilot.json
```

Código de salida `2` en `prepare` significa **BLOQUEADO** por ausencia de actor elegible. Código `1` significa contrato inválido.

## Criterio de evolución

Mantenerlo pequeño. Sólo agregar automatización cuando una ejecución real muestre fricción repetida. Las fichas siguen siendo doctrina; los skills son procedimiento operativo. La promoción de nuevas fichas a skills no se resuelve aquí.
