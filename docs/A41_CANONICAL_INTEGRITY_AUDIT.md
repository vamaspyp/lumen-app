# A41 · Integridad canónica del Embrión antes de vidas reales

Estado: EN CURSO
Foco: F6 · Nacimiento del Embrión y primeras vidas reales

## Motivo

A40 queda en espera antes de personas reales. La revisión contra el Mapa Canónico del Embrión V5 y el modelo canónico de Fuente muestra dos riesgos de integridad que deben resolverse primero:

1. el embrión técnico actual S0–S7 no demuestra todavía, de forma explícita, presencia germinal de los 11 órganos canónicos;
2. Fuente funciona como cobertura y matching, pero su modelo/presentación no expresa todavía con suficiente claridad Gesto → Unidad de Acompañamiento → Recurso ni la procedencia rica prevista.

No se reabre arquitectura completa ni se persigue perfección. Se materializa la expresión mínima limpia de lo canonizado.

## Autoridad aplicada

- Mapa Canónico del Embrión V5: once órganos, todos presentes al nacer; expresión germinal mínima y crecimiento posterior condicionado por BANCO.
- Modelo Canónico de Matching Vida ↔ Fuente: el Recurso es el vehículo; la Unidad de Acompañamiento es el encuadre humano completo y la unidad principal de matching del MVP.
- Modelo objetivo de Fuente: Gesto de Ayuda → Unidad de Acompañamiento → Recurso; procedencia/derechos/confianza son atributos de primera clase del Recurso.
- Engineering Guardrails: cambios en capa responsable, sin bypasses; comportamiento estabilizado protegido; CI/live como gate de cierre.

## Auditoría repo actual · primera pasada

La clasificación siguiente es deliberadamente conservadora. “Parcial” significa que existe capacidad relacionada pero no toda la expresión germinal canónica. La certificación final requiere contraste contra DB live, no sólo contra repo.

| Órgano | Estado inicial | Evidencia actual | Brecha canónica a comprobar/resolver |
|---|---|---|---|
| Fuente | PARCIAL | help_possibilities, providers, coverage, Source discover, intake/autopoiesis | Modelo actual colapsa demasiado encuadre + vehículo; procedencia visible insuficiente; nativos VA+LUMEN requieren linaje/origen verificable o reclasificación editorial |
| Motor | PARCIAL | S1 interpreta y ordena ayudas por need/intent | Canon V5 exige decidir ofertas realizables en varios órganos, no sólo ayudas de Fuente |
| Santuario | PARCIAL | memoria opt-in, entries, repertorio | Confirmar expresión germinal completa: ayuda vivida, lecciones y personas; hoy entries son treasure/reflection/note |
| Continuidad | PARCIAL/ALTA | Faros, Camino, repertorio, proactividad, followups | Verificar Compromiso, Retorno, profundidad ganada y delta de Faro como señales explícitas |
| DA+ / Derrame | NO MATERIALIZADO EXPLÍCITAMENTE | no aparece como bounded capability/surface en repo | Expresión germinal: seis vías en esquema; dos abiertas, cuatro por invitación curada |
| Tejido | PARCIAL | Círculos privados, compartir ayudas, reportar/salir | Contrastar con V5: testigo elegido, contemporaneidad, recomendación, derrame de experiencia; revisar semántica de roles host/member vs “sin roles” |
| Marketplace | NO MATERIALIZADO EXPLÍCITAMENTE | no aparece capacidad/surface dedicada | Expresión germinal: superficie separada, proveedores acreditados manualmente, comisión plana; motor no ve dinero |
| Sostén | NO MATERIALIZADO EXPLÍCITAMENTE | no aparece capacidad dedicada | Expresión germinal mínima: contribución destinada + regla 5% a dotación desde primer peso; no requiere pagos reales si no son necesarios para nacimiento |
| Común | NO MATERIALIZADO EXPLÍCITAMENTE | no aparece contrato/licencia/taxonomía publicada | Expresión germinal: licencia abierta declarada, esquema separable, taxonomía publicada como hipótesis |
| Vínculo Sostenido | PARCIAL | múltiples espacios de reentrada + continuidad voluntaria | Falta expresar conscientemente puertas múltiples y pertenencia sin dependencia; membresía germinal si corresponde al V5 |
| Autopoiesis | PARCIAL/ALTA | S3 intake/lifecycle + S4 knowledge/evolution + señales/ledger | Confirmar BANCO explícito con condiciones de activación y latencia señal→mejora como métrica |

## Hallazgo estructural de Fuente

El modelo de datos actual usa principalmente:

- `help_possibilities`;
- `help_versions`;
- `help_localizations`;
- `coverage_cells`;
- `providers`.

Esto permitió cerrar rápidamente Momento→Ayuda→Retorno y cobertura, pero no representa limpiamente el modelo canónico maduro:

**Gesto de Ayuda → Unidad de Acompañamiento → Recurso**.

El Recurso debe concentrar lo determinado por la obra: título, autor, tradición, formato, duración, idioma, modalidad/canal, cuerpo o URL, procedencia, referencia, nota de curaduría, derechos, confianza, revisión y estado.

La Unidad debe concentrar el encuadre contextual: gesto, hemisferio, profundidad, capacidad esperada, pre/post, `why_now`, `minimum_step`, `after_prompt`, restricciones, sensibilidad, provider_kind y estado editorial.

El motor debe matchear Unidades/ofertas; no recursos desnudos.

## Hallazgo de presentación de Fuente

La UI actual sólo materializa una fracción del contrato ya disponible: título, resumen, contenido breve, duración/energía, proveedor y enlace externo. Aunque el RPC ya entrega `provider.provenance`, `provider.rights`, `localization_provenance`, `risk_class`, `evidence_class` y `needs`, esos datos no se presentan.

Eso explica que Fuente se perciba como un catálogo simplón. La corrección mínima debe mostrar trazabilidad y contexto editorial sin convertir cada tarjeta en una ficha burocrática.

## Diseño mínimo de una tarjeta/ficha de Recurso

Vista resumida:

- título;
- tipo/formato + duración;
- autor u organización;
- tradición/disciplina/origen;
- resumen humano;
- etiqueta de confianza/procedencia;
- acción principal.

Detalle expandible:

- fuente/proveedor;
- referencia/original;
- procedencia;
- nota de curaduría LUMEN;
- derechos/condición de uso;
- idioma y revisión/estado editorial;
- advertencias cuando correspondan;
- enlace original si es externo.

La UI no inventa campos faltantes. Si un recurso no tiene metadato requerido, el problema pertenece a curaduría/datos, no al componente visual.

## Política para los 34 recursos “nativos” A37

No se elimina cobertura a ciegas. Cada pieza se clasifica antes de seguir activa como Recurso canónico:

1. **Adaptación/síntesis con linaje verificable** → conservar, declarar tradición/fuente/referencia y nota de curaduría.
2. **Obra original VA+LUMEN con fundamento explícito** → puede existir como recurso propio si el canon vigente lo admite, pero no se presenta como “sabiduría universal” ni como validación externa.
3. **Microencuadre que en realidad pertenece a una UA** → mover el encuadre a la UA y vincularlo a un Recurso real.
4. **Sin procedencia responsable suficiente** → retirar/restringir hasta curación.

El criterio rector del V5 prevalece: LUMEN no se convierte en fuente de sí misma ni inventa autoridad.

## Secuencia de ejecución A41

1. Auditoría live DB contra esta matriz 11/11.
2. Diseñar migración mínima y evolucionable de Fuente canónica sin perder historial ni Ledger.
3. Curar el corpus actual: separar Recurso/UA/Gesto y completar procedencia real donde exista.
4. Ajustar el Motor para decidir UA/oferta, preservando safety, NO_MATCH e intent matching.
5. Renovar Fuente UI para mostrar procedencia y detalle editorial con jerarquía visual sobria.
6. Materializar expresiones germinales faltantes de órganos, sólo en escala mínima V5.
7. Agregar tests/regresiones canónicos 11/11 + Fuente.
8. `npm run verify` + certificación live + smoke de experiencia.
9. Recién entonces reanudar A40, resolver Auth/SMTP, ejecutar PRELAUNCH RESET con autorización y abrir primeras vidas.

## DoD A41

A41 sólo cierra cuando:

- existe matriz 11/11 certificada contra implementación live;
- cada órgano está PRESENTE en expresión germinal V5 o existe decisión explícita de autoridad que modifique el V5;
- Fuente diferencia operacionalmente Gesto / UA / Recurso sin duplicación innecesaria;
- ningún Recurso activo carece de procedencia mínima exigida por el canon;
- la experiencia Fuente muestra origen/procedencia/confianza/derechos/referencia de forma usable;
- matching opera sobre UA/oferta y no confunde Recurso con decisión;
- safety, privacidad, NO_MATCH, continuidad y regresiones existentes permanecen verdes;
- migraciones son versionadas y reversibles razonablemente;
- CI + live PASS sobre HEAD final;
- A40 continúa sin PRELAUNCH RESET previo accidental.

## Bloqueo operativo puntual

En el inicio de A41 la integración directa a Supabase quedó temporalmente no disponible durante la consulta de auditoría. No se inventa estado live. El repo y migraciones fueron inspeccionados, y la mutación de DB queda detenida hasta recuperar acceso; el PRELAUNCH RESET permanece sin ejecutar.
