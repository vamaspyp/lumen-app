# LUMEN · Engineering Guardrails

## Regla madre · No Regresión + Evolución Limpia

Todo comportamiento central o declarado estable de LUMEN debe estar protegido por una prueba automatizada adecuada.

Todo bug reproducible que afecte comportamiento relevante debe incorporar o actualizar una prueba de regresión que demuestre el fallo antes del fix y su resolución después.

Ningún acto de construcción, ajuste o bug fixing se considera cerrado si degrada contratos existentes, rompe arquitectura canónica o deja sin protección automatizada un comportamiento crítico estabilizado.

Los fixes se realizan en la capa responsable del problema. No se aceptan como solución permanente parches laterales, duplicación de lógica ni bypasses que erosionen las fronteras greenfield.

## Reglas operativas

1. **Bug relevante = regresión permanente.** Si un bug pudo ocurrir una vez en un comportamiento relevante, debe quedar cubierto por test para que no reaparezca silenciosamente.
2. **Estable = protegido.** Un comportamiento se considera estable cuando fue aceptado por smoke real, forma parte del circuito vital o protege privacidad, custodia, seguridad o continuidad.
3. **Fix en la capa correcta.** UI corrige UI; aplicación corrige orquestación; adapters corrigen integración; backend/RLS corrige ownership y seguridad. No se compensa una falla de una capa desde otra para “hacerla pasar”.
4. **Arquitectura antes que atajo.** El runtime greenfield mantiene sus fronteras y no incorpora dependencias de negocio legacy ni acceso vendor-specific fuera de los adapters autorizados.
5. **Refactor chico y continuo.** Cuando una pieza empieza a acumular responsabilidades, duplicación o acoplamiento, se simplifica mientras el cambio sigue siendo pequeño y reversible.
6. **CI es gate de cierre.** Ningún cambio relevante se considera integrado con CI rojo o sin ejecutar la suite correspondiente.
7. **Cada falla fortalece al organismo.** El resultado deseado de un bug importante no es sólo “funciona otra vez”, sino “ahora es más difícil que vuelva a romperse”.

## Gate mínimo obligatorio

Todo cambio de producto o infraestructura que pueda afectar comportamiento ejecuta, como mínimo:

- tests unitarios y de contratos arquitectónicos;
- lint;
- build/typecheck;
- regresión E2E del embrión;
- certificación live del backend cuando el cambio toca contratos Supabase o circuitos dependientes de ellos.

El script canónico del repo es `npm run verify`; CI agrega la certificación live.

## Núcleo de regresión del Embrión

La suite E2E debe proteger al menos:

- Home/Ahora permite expresión libre antes de identidad;
- “Ahora no” sale del gate y permite continuar sin quedar bloqueado;
- identidad progresiva usa el callback canónico y no un origen efímero;
- Santuario y Tejido conservan semánticas distintas;
- Fuente puede explorarse sin identidad y muestra procedencia;
- una persona autenticada alcanza Ahora, Trayectoria, Fuente, Santuario y Tejido;
- el circuito Momento → Ayuda → Retorno → Repertorio completa de punta a punta.

La suite live protege al menos:

- `lumen_embryo_health` operativo;
- Fuente pública disponible con cobertura mínima esperada;
- RPC personales bloqueados a anónimo.

## DoD transversal para bug fixing y ajustes

Un fix relevante sólo puede cerrarse cuando:

- la causa está identificada;
- la corrección vive en la capa responsable;
- existe o se actualizó la prueba de regresión correspondiente;
- no se introdujo duplicación o bypass permanente injustificado;
- `npm run verify` pasa;
- si corresponde, la certificación live pasa;
- la evidencia de cierre registra commit y CI.

Esta regla es transversal: no crea un nuevo órgano ni una nueva arquitectura. Es la memoria técnica mínima que permite evolucionar rápido sin degradación acumulativa.
