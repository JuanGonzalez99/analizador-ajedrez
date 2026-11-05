# Norte · App de ajedrez

Nov 5, 2026 · @Juan

## Qué es

Un lugar para entrenar ajedrez: una versión mejor de chess.com y lichess para todo lo que no es jugar, o sea analizar, practicar y aprender, sin topes diarios. Es un proyecto grande, que crece por módulos durante meses.

Lo usa Juan, casi siempre desde Chrome en Android, y a lo sumo un amigo, que suele usarlo en la PC. El análisis que existe hoy (v0.95) se queda y es la base; lo demás se suma alrededor.

## Lo que no es

No gira alrededor de los errores de Juan. Un proyecto anterior centrado del todo en sus errores quedó archivado porque el enfoque no le copaba. El análisis muestra los errores, pero la práctica y las lecciones se organizan por lo que Juan quiere aprender.

Tampoco es un producto público: cada push a main es deploy en vivo, y está bien así.

## Módulos

Cinco módulos, con una regla común: nada de topes diarios. El orden en que se arman está sin definir.

| Módulo | Qué hace | Referencia |
| --- | --- | --- |
| Análisis | Analiza cada partida: tablero, curva, explicación de jugadas, estadísticas del mes | El de chess.com. Ya existe (v0.95) |
| Análisis automático | Busca las partidas de chess.com y las analiza solas a medida que Juan juega, sin ir una por una | Ya estaba pendiente; choca con que hoy analiza el navegador |
| Práctica | Ejercicios todos los que Juan quiera | En chess.com, 3 por día |
| Lecciones | Lecciones repetibles, con contenido avanzado: finales de torres, de damas, rey y torre contra rey. Muestran la idea en vez de explicarla | Las de chess.com (una por día, no se repiten) y la página de la jaula del rey del proyecto del profe |
| Posiciones | Jugar desde cualquier disposición del tablero | Lichess |

## El profe y la app

El profe vive en su propio proyecto de claude.ai y se apoya en la app como herramienta. Le dice a Juan "hacete tal ejercicio", o Juan le pide practicar algo y el profe lo manda a uno.

Hoy lo hace con links de lichess. El puente: que la app abra una posición o un ejercicio desde un link, y que el profe mande links a la app. Meter al profe adentro de la app queda sin definir.

## UX

La UX es lo que más le importa a Juan, y hoy la app se ve "medio baqueteada, medio feucha": le falta una visión global. Juan no es de UI/UX y no quiere revisar cada cambio.

- **Referencias:** el análisis de chess.com, y la jaula del rey como estilo de lección.
- **Un revisor de UX aparte:** un agente distinto del que programa, porque uno que se revisa a sí mismo no es bueno. Su criterio: las heurísticas de usabilidad de Nielsen, las guías de Material Design (la app se usa en Android) y los "me copa / no me copa" de Juan, anotados con su porqué.
- **Mira de verdad:** revisa las capturas del arnés (npm run mirar), no sólo el código.
- **Identidad visual primero:** el revisor audita toda la app, trae dos o tres direcciones visuales como maquetas, Juan elige una y queda como sistema de diseño (colores, tipografía, espacios, botones). Después, las decisiones chicas se toman contra ese sistema, y a Juan sólo le llegan las grandes.
- **Que se sienta bien, no sólo que se vea bien:** el primer caso son las animaciones del tablero. Sus decisiones chicas (cuánto duran, qué pasa si se pasan jugadas rápido, movimiento reducido) las toma el revisor contra el sistema de diseño.
- **Celu primero, PC aprovechada:** se diseña pensando en el celu, y en PC se aprovecha el espacio y el mouse sin romper nada del celu. El revisor mira capturas de los dos tamaños.

## Cómo trabajamos

Juan es el director: define hacia dónde va y decide lo grande. Claude planifica, construye, prueba y revisa sin consultarle cada paso.

- **De noche:** una tarea programada en la nube avanza cada noche con lo siguiente de la hoja de ruta. De día, Juan puede decir "seguí" cuando quiera.
- **Decisiones de Juan:** Claude elige su recomendación y sigue. Como cada push es deploy y nadie más depende de la app, darla vuelta cuesta poco.
- **A la mañana:** un resumen en la sesión con qué hizo, qué eligió y, aparte, sus dudas del tipo "no sé si esto te copa". Juan mira sólo eso.
- **El revisor:** revisa después de cada cambio, a prueba. Si el consumo se come el tope semanal, pasa a revisar una vez al final de la noche.
- **Decisiones visuales chicas:** dejan de esperar el ok de Juan; las toma el revisor contra el sistema de diseño.
- **El resto del CLAUDE.md actual sigue igual.**

## Abierto

- [ ] Qué módulo va primero.
- [ ] Análisis automático, con dos caminos sin decidir. Uno: un proceso que corre afuera (tipo acción de GitHub), analiza y le pasa los resultados a la app, sin tocar el resto del stack. Otro: la app nativa, que resuelve que el navegador suspenda la pestaña pero cambia todo el stack; el repo la marca como proyecto aparte.
- [ ] Partir index.html: hoy cada sesión paga unos 103.000 tokens en leerlo por partes, y con el plan de $20 abaratar eso pesa. Si se hace, va sola en su tanda.
