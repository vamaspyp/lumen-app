# A40 · Primeras 3–5 vidas reales

Estado: PREPARADO · no iniciar personas reales hasta completar preflight
Foco: F6 · Nacimiento del Embrión y primeras vidas reales

## Objetivo

Observar si una persona que no conoce el modelo siente que LUMEN la entiende, le ofrece algo pertinente y útil, y se comporta como una presencia coherente en vez de una colección de funciones.

No buscamos aprobación general ni métricas de crecimiento. Buscamos aprendizaje experiencial de alta señal.

## Participantes

3–5 personas adultas de confianza, suficientemente diversas entre sí y que sepan explícitamente que están probando un embrión experimental.

No seleccionar personas en crisis ni invitar a usar LUMEN como sustituto de atención médica, psicológica o de emergencia.

## Preflight obligatorio antes del primer participante

1. Auth estable en el dominio/preview elegido y magic-link probado de punta a punta.
2. Envío de correo apto para varias personas (SMTP propio o mecanismo equivalente), sin depender del mailer de prueba de Supabase.
3. `PRELAUNCH RESET` ejecutado inmediatamente antes de abrir a personas reales, eliminando actividad sintética y preservando sólo referencia/Fuente/configuración necesaria.
4. CI verde sobre el HEAD que se mostrará.
5. Link único y probado en el mismo flujo que recibirán los participantes.
6. Invitación breve que explique carácter experimental, privacidad básica y salida libre.

## Invitación sugerida

> Estoy probando una versión muy temprana de LUMEN, un compañero digital pensado para acompañar momentos de la vida con pequeñas ayudas y espacios de continuidad. Me serviría que lo uses unos minutos como te salga, sin intentar “probar funciones”. Es experimental y no reemplaza ayuda profesional ni servicios de emergencia. Después te haría cuatro preguntas muy breves sobre cómo se sintió la experiencia. Podés dejarlo cuando quieras.

## Consigna

No explicar Fuente, Santuario, Trayectoria ni Tejido antes del uso. No sugerir una frase de prueba. Pedir simplemente:

> Entrá y usalo desde algo real que hoy puedas compartir sin incomodarte.

Si la persona no quiere compartir algo personal, puede explorar Fuente y la observación sigue siendo válida.

## Cuatro preguntas posteriores

1. ¿Sentiste que entendió lo que te estaba pasando? ¿Por qué?
2. ¿Lo que te ofreció te pareció pertinente para ese momento?
3. ¿Te dejó algo útil —aunque sea pequeño—: calma, claridad, compañía o un próximo gesto?
4. ¿Cómo describirías la experiencia: se sintió humana/LUMEN o más como una app de consejos? ¿En qué momento lo sentiste?

Pregunta opcional sólo si surge naturalmente:

- ¿Hubo algo que te confundió, te enfrió o te hizo querer salir?

## Observación del conductor

Registrar sólo señales de producto, no contenido íntimo del participante:

- punto de entrada elegido;
- fricción/abandono;
- ayuda aceptada o rechazada;
- outcome breve ya capturado por LUMEN;
- órgano visitado espontáneamente;
- frase de feedback posterior, sólo con permiso;
- categoría del problema: interpretación / matching / contenido / presencia / circuito / auth.

No copiar el Momento personal ni reconstruirlo en notas externas.

## Criterio de ajuste

Un comentario aislado es señal, no mandato. Corregir inmediatamente sólo si:

- hay bug reproducible;
- una fricción bloquea el circuito;
- aparece una incoherencia de privacidad/safety;
- la misma fricción experiencial aparece en varias personas o es claramente grave.

El resto se acumula hasta terminar las 3–5 vidas para evitar zigzag y sobreajuste.

## Señal mínima de vida

A40 no exige perfección. Consideramos que hay una primera señal fundacional si varias personas, sin ser guiadas, expresan alguna combinación de:

- “me entendió”;
- “esto tenía sentido para lo que me pasaba”;
- “me sirvió algo”;
- “se sintió distinto a buscar consejos”;
- regreso voluntario o deseo explícito de conservar/volver a una ayuda.

Los NO_MATCH honestos no cuentan como fracaso si fueron apropiados.

## Cierre

Después de 3–5 personas: consolidar patrones, separar bugs de hipótesis, hacer una única ronda breve de afinación y decidir siguiente exposición. No ampliar arquitectura por defecto.
