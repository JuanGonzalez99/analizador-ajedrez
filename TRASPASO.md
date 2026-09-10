# Analizador de partidas — traspaso

Documento para retomar el proyecto. Vive en el repo: **se actualiza en el mismo
commit que el cambio que describe.** Escrito sobre la v17, al día en la **v0.93**.

Contiene lo necesario para trabajar sobre el código sin repetir mediciones ya
hechas. **No hace falta ningún otro documento del proyecto.** Las reglas de
método que aparecen acá están reescritas para que se entiendan solas.

---

## 1. Qué es

Una página estática que analiza partidas de chess.com con Stockfish corriendo
**dentro del navegador**. No hay servidor: lo único que sale del teléfono es el
pedido de las partidas a la API pública de chess.com.

Se usa casi siempre desde un celular Android, en Chrome. Eso condiciona todo:
pantalla angosta, memoria limitada, y la pestaña se suspende si el usuario
cambia de aplicación.

**Repo:** GitHub Pages, sirviendo `main`. **Los commits van derecho a `main`,
sin rama ni pull request** —decisión del usuario—: es el único que trabaja acá,
no revisa diffs y no puede probar nada hasta que esté publicado, así que la rama
solo agregaba un paso. **El costo hay que tenerlo presente: cada push es un
deploy en vivo**, así que las pruebas y el chequeo estático se corren ANTES de
pushear, siempre, y los cambios de pantalla se miran en un navegador.

**Archivos que la página pide:**

- `index.html` — la aplicación entera, un solo archivo
- `chess.js` — chess.js 0.13.4 como módulo ES
- `stockfish-18-lite-single.js` + su `.wasm` — el motor, ~7,3 MB, monohilo
- `aperturas.json` — libro de aperturas: `{ posiciones: [...], nombres: {...} }`

**Desde la v0.37 la aplicación es `index.html`**, o sea la raíz: la URL quedó
`…github.io/analizador-ajedrez/` en vez de terminar en `/analizador.html`.
`analizador.html` sobrevive como redirect a la raíz, al revés de como estaba,
porque la app vivió ahí muchas versiones y puede estar guardada así en el
teléfono de alguien.

**El redirect lleva un guardia, y no es paranoia.** Quien tenga en caché el
`index.html` **viejo** —el que redirigía a `analizador.html`— entra en un bucle:
ese index manda a `analizador.html` y el nuevo `analizador.html` manda a la
raíz. Pasó de verdad al probarlo. El redirect va en JavaScript y no en un `meta
refresh` para poder marcar el rebote en `sessionStorage`: así ocurre una sola
vez y después queda un mensaje con el enlace, en vez de una pantalla que
parpadea sola. GitHub Pages sirve el HTML con caché corta, así que el caso se
resuelve solo en minutos; el guardia es para esos minutos. En la v18 se borraron cuatro archivos muertos
(`analisis.js`, `motor.html`, `motor-1.html`, `motor-2.html`); están en el
historial. Antes de borrar cualquier otro, confirmar que `index.html` no
lo pide.

---

## 2. Por qué está todo en un archivo

Decisión deliberada, no descuido. La carga de módulos rompió cuatro veces en
este proyecto (extensión `.mjs`, CDN del motor, rutas, un import mal escrito), y
desde un celular no hay consola para diagnosticar. Un archivo elimina esa clase
de fallo entera.

### El balance de hoy (revisado en la v0.92)

El usuario preguntó si esto no había quedado obsoleto, con el argumento de que
el riesgo era de cuando **él subía los archivos a mano desde el celular** y hoy
trabaja con un agente. Vale revisarlo, y la respuesta es que **la decisión sigue
en pie pero por razones distintas de las de entonces**. Conviene tener los tres
grupos separados, porque el que cambie de opinión en el futuro va a necesitar
esto y no el párrafo de arriba solo:

**Lo que ya no es un riesgo:**

- **La subida manual.** Existió y desapareció. Pero mirando el párrafo de
  arriba: **ninguna de las cuatro roturas fue eso.** Fueron extensión, CDN,
  rutas y un import mal escrito. El recuerdo es real, el motivo escrito es otro.
- **Un import roto llegando mudo al celular.** Esto sí se desactivó, y es el
  cambio de fondo desde que se escribió la sección. El chequeo 6 de
  `estaticos.mjs` verifica que el `<script type="module">` entero parsea
  —existe exactamente por eso—, y desde la v0.58 `mirar.mjs` levanta la app en
  un navegador de verdad antes de pushear. Un módulo que no carga ya no se
  descubre en producción.

**Lo que sigue vivo:**

- **Desde el celular no hay consola.** Igual que el primer día. Si algo se rompe
  en vivo, el usuario ve una pantalla en blanco y no puede decir qué pasó; el
  diagnóstico depende de reproducirlo acá.
- **GitHub Pages cachea cada archivo por separado**, y esto no estaba escrito.
  Con varios archivos, un deploy puede quedarle a alguien con el `index.html`
  nuevo y un módulo viejo: los dos se sirvieron bien, y aun así la app está
  rota. Es la misma familia del bucle de redirección del §1, que pasó de verdad.
  **Un archivo único elimina esa clase entera por construcción**, y es hoy el
  argumento más fuerte a favor de no partirlo.

**El argumento NUEVO a favor de partirlo**, que no existía cuando se escribió
esto: el archivo son **368 KB, o sea unos 103.000 tokens**, y no se puede leer
entero. Cada sesión lo paga en greps, y en mantener al día el mapa del §3 para
no tener que leerlo. Partirlo abarataría todas las sesiones futuras. Esa es la
razón de peso hoy, y no la que motivó la pregunta.

**Partirlo es razonable**, pero conviene que sea el único cambio de esa tanda,
para que si rompe se sepa qué fue. No mezclarlo con cambios de lógica. Y está
anotado como **candidato a la v1.0** (§10), que la decide el usuario.

### Cómo se prueba sin navegador

```bash
npm test
```

Las pruebas viven en `pruebas/` y son archivos del repo desde la v18 (antes se
armaban a mano en cada sesión).

**El reporte es `dot` a propósito, y es una decisión medida.** El reporte TAP
que trae node por defecto imprime cuatro renglones por prueba —`ok N`,
`duration_ms`, `type` y el cierre—, o sea **44.338 bytes** con 243 pruebas. Con
`--test-reporter=dot` la misma corrida son **731 bytes**: 60 veces menos. Un
punto por prueba que anda, y **cuando una falla se imprime igual todo lo que
sirve** —el `AssertionError`, el mensaje, `actual` y `expected`, y el archivo
con la línea—; se calla solo la lista de las que anduvieron. Se verificó
inventando una prueba que falla, no suponiéndolo. Importa porque esa salida la
lee un agente con ventana de contexto finita, y 44 KB por corrida es un
presupuesto que se paga en cada `npm test`.

**`.claude/settings.json` se versiona, y es el único de esa carpeta.** Tiene una
sola cosa: denegar el servidor MCP de github, que este repo no usa porque pushea
derecho a `main`. Va commiteado porque la guarda tenía que valer **en las
sesiones nuevas**, y el contenedor clona limpio: un archivo ignorado no existiría
ahí. El `.gitignore` pasó de `.claude/` a `.claude/*` más `!.claude/settings.json`,
así que el resto de la carpeta —que es estado de la herramienta, no del
proyecto— sigue afuera.

Hay **dos bloques extraíbles**, cada uno delimitado por dos marcadores. Ninguno
toca el DOM ni el motor al cargarse, así que se sacan del HTML y corren en node:

| Extractor | Bloque | Qué tiene |
|---|---|---|
| `pruebas/extraer.mjs` | análisis | `derivarFilas`, `categorizar`, `quedaComible`, `capturaBuena`, `winPct`… |
| `pruebas/extraer-tablas.mjs` | tablas | `textoPct`, `rangoWilson`, `esMala`, `tasa`, `contraste`, `censoCadencias`, `desenlace`, `textoDesglose`… |

**Los cuatro marcadores son contrato: si se mueven, se rompe el arnés.** Los
extractores detectan solos qué exportar, así que agregar una función no obliga
a tocar nada.

`pruebas/tira.mjs` es la cuarta pieza y no se corre sola: son funciones que
usan las maquetas y `mirar.mjs` para comparar variantes de un pedazo de
pantalla, medir alineaciones y detectar cosas pegadas o encimadas
(§4untrigies).

Lo que no se puede probar así es el motor y el DOM. Para eso está
`pruebas/estaticos.mjs`, con ocho chequeos que ya agarraron errores reales:

1. Todo `id` referenciado en JS existe en el HTML.
2. Toda tabla tiene su elemento de leyenda.
3. Todo lugar que asigna la partida elegida rehabilita los botones.
4. No quedan tablas ni leyendas huérfanas — restos de una tabla borrada a medias.
5. Toda tabla vive dentro de un contenedor que scrollea.
6. El `<script type="module">` entero parsea. Los extractores solo miran dos
   pedazos, así que un error de sintaxis en la interfaz o en el motor no lo
   agarraba nada y aparecía como pantalla en blanco en el celu.
7. El traspaso dice en qué versión está al día, y coincide con el HTML.
8. **Ningún `/* … */` adentro de un `innerHTML = \`…\``.** Ahí no es un
   comentario, es texto, y se imprime en la pantalla. Rompió cinco tablas en la
   v0.50 (§4terdecies).

**Aun así, nada de esto ve la pantalla.** Los errores más caros del proyecto
—una columna recortada en el celu, una tabla que contestaba la pregunta
equivocada, un comentario impreso en el medio de cinco tablas— aparecieron
mirando el celular, no corriendo pruebas.

**Regla que salió de eso (v0.51): un cambio que toca lo que se dibuja se MIRA en
la pantalla, no solo se mide.** El comentario impreso se escapó porque se
verificó el cambio de forma estrecha —midiendo la alineación de una columna— y
no se miró la página.

### El tercer chequeo: mirar la pantalla (v0.58)

```bash
npm run mirar
```

De la v0.42 a la v0.57 esto se rearmaba a mano en cada sesión. Desde la v0.58
vive en el repo, en `pruebas/mirar.mjs`, por el mismo camino que hicieron las
pruebas en la v18. Levanta un servidor sobre el repo, abre `index.html` en un
Chromium headless **en modo simple**, analiza una partida y deja capturas en
`capturas/` (ignorado por git). **No toca `index.html`**: no viaja al sitio y no
cambia nada de lo que se ve en el celular.

**Entra por la lista del mes, no pegando el PGN, y eso es una regla que costó un
bug.** Desde la v0.63.1 el arnés **falsea también la API de chess.com** —el
listado de meses y el JSON del mes, armados a partir del propio PGN de prueba— y
entra buscando el usuario, eligiendo la partida y tocando "Analizar", que es el
camino que usa el usuario. Antes pegaba el PGN, que era el más fácil de
programar y **el único donde el motivo del final no existe**: por ese atajo se
publicó una versión donde el motivo no se veía nunca. Ver §4terdecies.

**El motor va falseado, y es lo que lo hace usable.** El wasm real tarda minutos
por partida —medido: profundidad 13 sobre 25 jugadas no terminó en 10 minutos en
un contenedor—, así que se sirve un worker de mentira en lugar de
`stockfish-18-lite-single.js`. Habla el pedacito de UCI que usa la clase `Motor`
—`uci` → `uciok`, `position fen`, `go` → dos líneas `info` y un `bestmove`— y
contesta de una tabla FEN → evaluación armada de antemano con chess.js. La
partida corre entera en segundos.

**El mate NO se puede inventar con un número, y por eso el falso lo calcula.**
Devolviendo siempre centipeones, la última jugada de una partida que termina en
mate salía "Error grave, pierde 8.29" y la barra decía "+0.00": la pantalla
donde vivía el bug del `mate 0` era justo la que el arnés no sabía dibujar. Se
resuelve con chess.js, que es barato: posición mateada → `mate 0`, hay una
jugada que matea → `mate 1`. Con eso recorre el mismo camino que el motor real.

**Las capturas salen a 412 x 760, y el tamaño es una medición.** Sobre una
captura del celular del usuario, sacando la escala del tablero —que mide 360 CSS
de ancho—, su viewport es de ~420 x 810 con la barra de direcciones escondida y
~745 de alto cuando está visible. 412 x 760 es el caso apretado. Hasta la v0.64
el arnés dibujaba a 412 x 915, y con 155 px de más no se podía dimensionar
cuánto entra de verdad en la pantalla.

**Hay varias partidas y se elige cuál:** `npm run mirar <nombre>` lee
`pruebas/partida-<nombre>.pgn`. Están la larga de 36 jugadas (`de-prueba`, la de
por defecto), una que termina **en mate**, una que termina **ahogada** y
`doble`, donde en la jugada 5 un peón ataca al alfil y al caballo a la vez. Existen
porque *cómo termina la partida* es una pantalla propia y la larga no llega
nunca a ninguna de ellas.

**El motor falso TARDA a propósito en las jugadas probadas (v0.79).** Una
posición que no está en su tabla es, por definición, una jugada inventada: ahí
demora 400 ms —`MOTOR_LENTO` lo cambia— y en el resto contesta al toque. Sin esa
demora no se puede mirar si el tablero dibuja **antes** de que vuelva el motor,
que es lo único que la v0.79 cambió: contestando en el mismo tick, todo parece
instantáneo y la pantalla pasa la prueba sin haberla dado. El análisis de la
partida no paga nada, porque esas posiciones sí están en la tabla.

**Un artefacto del motor falso, para no perseguirlo:** puede mostrar "MEJOR: la
jugada" al lado de una pérdida grande, porque inventa la mejor y la evaluación
por separado. El motor de verdad no puede decir las dos cosas a la vez.

**Las evaluaciones son inventadas y hay que saberlo:** los veredictos que se ven
en esas capturas no significan nada. Lo que se verifica es la **disposición**.
La forma de la curva está elegida a mano —apertura pareja, desplome,
recuperación, definición— y hay cuatro desplomes de una sola jugada, porque sin
ellos ninguna categoría mala se dispara y la curva sale sin marcas, que es justo
lo que hay que mirar.

**Dos trampas que ya costaron tiempo, las dos anotadas en el archivo:**
- `load_pgn` devuelve `false` y **no tira**. Un PGN de prueba escrito a mano con
  una jugada 19 imposible entró como una partida de cero jugadas y el arnés se
  colgó diez minutos esperando una pantalla que nunca iba a llegar. Es el mismo
  error que la regla de §10: nunca afirmar de memoria una posición.
- Redirigir la salida por un pipe la bufferiza, así que "no imprime nada" no es
  lo mismo que "está colgado". Se pierde media hora ahí.
- **El worker falso se arma con una plantilla, así que una comilla invertida
  adentro la corta al medio.** Pasó escribiendo un comentario en el código del
  worker: el error que tira node es `SyntaxError` en una línea que se ve
  perfecta, y no dice nada de comillas.

---

## 3. Mapa del archivo

| Zona | Qué hay |
|---|---|
| `<script>` clásico | registro, captura de errores, panel de diagnóstico |
| bloque de análisis | evaluación, geometría, categorías, `derivarFilas`, `repartir`, el reloj (`leerCadencia`, `segundosPensados`) |
| motor | clase `Motor`, grupo de motores, `evaluarPosiciones` |
| caché | IndexedDB |
| análisis | `analizarPartida`, barrido, híbrido |
| bloque de tablas | `textoPct`, `rangoWilson`, `tasa`, las tres funciones que pintan tablas, `censoCadencias`, `desenlace` |
| interfaz | tablero SVG (geometría `TAB_S`/`sqX`, `dibujar`, `svgMarcas`), mes, banco de pruebas, revisión, resúmenes |

El **menú de ajustes** (v0.91, §4untrigies) es la excepción a "todo cuelga de su
vista": la hoja vive al final del `<body>`, después de la atribución de las
piezas, porque es `position: fixed`. Ahí adentro están los seis `<select>` de
preferencias, que antes vivían sueltos en la fila del pie.

Desde la v0.80 la vista Partida se parte en **dos columnas de 1110 px para
arriba** (§4duovicies): `.principal` es la de siempre, de 700, y `.lateral` es
la lista de jugadas, que en el celular no existe. Desde la v0.88 la principal
está partida, y desde la v0.90 son tres bloques —`.parriba` (encabezado),
`.tarjetas`, `.pmedio` (tablero y tira)— más `.curva` y `.pabajo`, todos hijos
directos de la grilla. De 1500 px para arriba la tarjeta se muda a una columna
propia a la izquierda (§4trigies). Todo lo demás sigue siendo una
sola columna en cualquier pantalla.

**El registro está en un script clásico a propósito:** corre aunque el módulo
falle, y por eso puede avisar que el módulo falló. Vive en `localStorage` y no
en IndexedDB porque escribir es sincrónico y así sobrevive a un cierre abrupto.
Se abre tocando la línea de versión.

---

## 4. Decisiones medidas — no cambiar sin volver a medir

Cada una de estas salió de una medición, no de una preferencia. El archivo tiene
un banco de pruebas incorporado que las vuelve a medir en dos minutos.

### 4.1 Memoria limpia entre posiciones — la más importante

Antes de cada posición se manda `ucinewgame`. Sin eso el motor arrastra lo
calculado de una posición a la siguiente, y **como qué posición le toca a cada
motor varía entre corridas, el resultado deja de ser reproducible**.

Medido sobre la misma partida: dos corridas sucias dieron precisión 87.2 y 88.1,
mediana 0.39 y 0.35. Dos corridas limpias dieron **cifras idénticas al último
decimal**. Y limpiar además es más rápido: 12,5 s contra 32,4 s.

**Si alguien saca esta línea, los resultados dejan de ser repetibles.**

### 4.2 Cuatro motores, Hash 16 MB

Las posiciones de una partida son independientes, así que se reparten entre
varias copias del motor en Web Workers. No hace falta `SharedArrayBuffer` (que
GitHub Pages no habilita) porque no comparten memoria.

Barrido de 8 combinaciones sobre la misma partida:

| Motores | Hash 1 MB | Hash 16 MB |
|---|---|---|
| 2 | 19,6 s | 21,5 s |
| 4 | 13,4 s | 14,4 s |
| 6 | 12,8 s | 13,9 s |
| 8 | 13,3 s | 14,1 s |

Entre 4, 6 y 8 la diferencia es menor que el ruido del cronómetro (dos corridas
idénticas dieron 15,2 y 14,2 s). **Hash 1 es 5% más rápido pero cambia
veredictos**: con una tabla chica el motor busca peor, la diferencia entre la
mejor y la segunda mejor cae por debajo del corte, y la categoría "Genial" deja
de dispararse. No compensa.

**Control de corrección incorporado:** con memoria limpia, cambiar la cantidad
de motores **no puede** cambiar un veredicto. Las cuatro filas de un mismo Hash
tienen que dar precisión, mediana y graves idénticas. Si alguna vez difieren,
hay un problema de fondo y hay que resolverlo antes de mirar la velocidad.

### 4.3 MultiPV 2

Cuesta el doble que MultiPV 1 (14,4 s contra 6,7 s). Se mantiene porque MultiPV
1 no devuelve la segunda mejor jugada, y sin eso "la única jugada que sostiene
la posición" es **imposible** de detectar.

**Decisión abierta:** es defendible pasar a MultiPV 1 y perder esa mitad de
"Genial". La única otra diferencia observada fue una jugada del rival cuya
pérdida caía a 4 centipeones del umbral. Un modo híbrido —MultiPV 1 en general y
MultiPV 2 solo donde puede haber Genial— se implementó y **no sirve**: como la
evaluación de base sale de la pasada con MultiPV 1, la categoría no aparece
igual. Está en el código y se puede borrar.

### 4.4 La caché guarda evaluaciones, no veredictos

En IndexedDB, con clave `partida | profundidad | variante | versión del motor`.
La identidad de la partida es el `uuid` de chess.com, y un hash del PGN si no
hay. **Nunca fecha más rival**: eso ya fusionó tres partidas distintas una vez.

Guardar evaluaciones y no veredictos es lo que permite que **cambiar de modo de
clasificación sea instantáneo** y que las tablas nuevas se calculen sobre
partidas viejas sin volver a correr el motor. Es la decisión de diseño de la que
cuelgan varias otras. La caché sobrevive a subir una versión nueva al repo.

### 4.5 Optimizaciones probadas y descartadas

No volver a proponerlas sin datos nuevos:

- **Reparto por bloques** (cada motor se lleva un tramo seguido en vez de
  saltear): más lento, 22,9 s contra 19,1 s. Los tramos no cuestan lo mismo y un
  motor queda con el medio juego mientras los otros esperan. El código está y
  hay una casilla para volver a medirlo.
- **Barrido a profundidad 13 con revisión profunda de lo sospechoso:** 1,40×,
  menos que otras opciones, y obliga a mezclar profundidades. El filtro marca
  más de la mitad de las jugadas por más que se apriete.
- **Saltear posiciones con una sola jugada legal:** imposible. La evaluación de
  cada posición la usan dos jugadas —como "después" de una y como "antes" de la
  siguiente—, así que saltear una rompe el cálculo de la anterior.
- **Saltear las aperturas:** ahorra un cuarto del trabajo pero esas jugadas
  dejarían de tener pérdida medida, y eso rompe la comparabilidad con las
  mediciones anteriores. Decisión del usuario: no hacerlo.

---

## 4bis. El tablero — piezas y temas (v27)

### Las piezas son Cburnett, no glifos Unicode

Hasta la v26 las piezas eran los glifos `♔`-`♙` dibujados como
`<text>` con `font-family="serif"`. Dos problemas que no se arreglaban con CSS:
**dependían de la fuente del dispositivo** —en algunos Android salían
cuadraditos— y donde salían eran el set hueco pensado para texto corrido, con el
trazo demasiado fino para leerse a 42 px.

Desde la v27 son **Cburnett**, el mismo juego que usa lichess: doce `<g>` en un
`<defs>` al principio del SVG, y cada pieza es un `<use href="#cb-wn">` escalado
de su caja de 45×45 a la casilla. Pesan 11,4 KB en total, nada al lado del motor
de 7,3 MB.

**Atribución obligatoria, no es opcional:** Colin M.L. Burnett, CC BY-SA 3.0, vía
Wikimedia Commons. La share-alike alcanza a las imágenes, no a la aplicación
—son obras agregadas, no derivadas—. Si alguna vez se **modifican** los paths,
lo modificado sigue bajo CC BY-SA 3.0.

Esto reemplazó una regla de la v26 que decía *"misma silueta para los dos
bandos: el bando se distingue por el relleno"*. Esa regla existía solo porque los
glifos Unicode no daban para más; Cburnett trae la convención de siempre
—siluetas distintas, blancas huecas y negras rellenas— y el usuario la eligió a
propósito.

### Los temas de tablero salen gratis

Las casillas ya se pintaban con `var(--claro)` y `var(--oscuro)`, así que un tema
es **reescribir dos variables CSS**: no toca el dibujo. Hay cinco (`TEMAS`), el
elegido se guarda en `localStorage` y el selector vive al lado de "Girar
tablero". Toda lectura y escritura de `localStorage` va en `try/catch`: en modo
incógnito tira.

### Lo que falta acá

**Juegos de piezas configurables.** La costura está puesta —las piezas se buscan
por `#cb-<color><tipo>`, así que un segundo set es un `<defs>` más y una opción
en un `<select>`—, pero no se hizo, por dos razones: cada set nuevo hay que
buscarlo y **verificarle la licencia de a uno** (los de lichess no comparten
todos las mismas condiciones), y no existe una pantalla de ajustes donde meter el
selector. Hacerla ahora sería hacerla dos veces, porque la disposición se está
rehaciendo. Cuando la vista Partida esté firme, es una tanda corta.

## 4ter. La vista Partida — disposición densa (v28)

La disposición de `zonaRevision` se rehizo según la dirección elegida: **toda la
información de la jugada en una pantalla, sin scrollear**, salvo la lista de
jugadas, que scrollea sola para que el tablero no se mueva de lugar.

### Qué cambió, y por qué

- **La barra de evaluación va vertical, al costado del tablero.** Horizontal se
  comía un renglón entero para mostrar un número, y en un celular lo escaso es
  el alto. Se llena desde abajo, que es donde están las blancas; con el tablero
  girado se llena desde arriba (`.evalbar.girada`). El tablero trae margen
  superior propio para cuando va suelto: dentro de `.revtab` se anula, o las
  dos quedan desalineadas por 10 px.

- **La tira horizontal de jugadas pasó a una lista vertical en pares.** La tira
  mostraba tres jugadas por vez y obligaba a scrollear a ciegas. La lista se
  agrupa por número de jugada —no de a dos por posición, así un PGN que arranca
  con negras no se desfasa— y tiene `max-height: 27vh` con scroll propio.

- **Tres métricas nuevas debajo del veredicto:** mejor, pérdida y caída. La
  mejor jugada la devuelve el motor en UCI (`b8a5`), que no se lee: `sanDeLaMejor`
  la pasa a la notación de la partida. Para eso hace falta la posición
  **anterior**, y cada fila guarda el FEN de *después* — así que la de antes es
  la de la fila `i-1`, y para la primera es el arranque. Si algo no cuadra,
  muestra el UCI crudo antes que nada.

- **Las señales ya no reservan un renglón vacío.** Tenían `min-height: 18px`
  para que no saltara el layout; en una disposición densa un renglón que casi
  siempre está vacío cuesta más de lo que evita.

### Navegar entre jugadas (v29)

Pasar de una jugada a otra es lo que más se repite en esta pantalla, y era lo
más incómodo: `‹` y `›` medían unos 40 px, estaban separados por "Mostrar la
mejor" en el medio, y quedaban al final de la página, después de una lista que
scrollea. Tres cosas que se sumaban.

- **Se puede deslizar sobre el tablero.** Izquierda avanza, derecha retrocede.
  El gesto pide un desplazamiento claramente horizontal —40 px y al menos vez y
  media lo que se movió en vertical— porque si no, scrollear con el dedo apoyado
  en el tablero pasaría jugadas sin querer. **No se llama `preventDefault` en
  `touchmove` a propósito:** bloquearía el scroll vertical, que es como se llega
  al resto de la vista.
- **Los botones son uno solo, pegado y del ancho entero**, 48 px de alto, con
  texto: "‹ Anterior" y "Siguiente ›". El resto de los controles baja a la fila
  secundaria.
- **Las flechas del teclado**, para cuando se abre en la computadora. Se ignoran
  mientras se escribe en un campo.

**Decisión tomada a conciencia:** un gesto no tiene affordance, así que el
deslizamiento **no es descubrible** para quien no viene de chess.com o lichess.
Se dejó sin señalizar igual, porque los botones siguen ahí: el gesto es un
atajo, no el camino. Si al usarlo no resulta natural, lo acordado es agregar dos
galones `‹ ›` muy tenues en los bordes del tablero, no un texto explicativo.

### Ver la mejor jugada: dos maneras, a propósito (v30)

Son dos cosas distintas y por eso están separadas:

- **`VER_MEJOR`** es la **preferencia**. La enciende el botón "Mostrar la mejor"
  y queda puesta de una jugada a la otra. Va a mudarse a un menú de ajustes
  cuando exista.
- **`MEJOR_EN`** es un **vistazo puntual**. Se toca el cuadrito "Mejor" de las
  métricas y muestra la flecha solo en esa jugada. Guarda *en qué* jugada se
  tocó, no un booleano, así que al cambiar de jugada se apaga solo.

Tocar el cuadrito con la preferencia ya encendida **no hace nada**: no habría
nada que mostrar, y apagarla desde ahí sería confuso.

**Toda la navegación pasa por `irA(i)`** —botones, deslizamiento, flechas del
teclado y clic en la lista—, que es el único lugar donde se apaga el vistazo.
Antes cada una movía `IDX` por su cuenta. Si alguien agrega otra forma de
navegar y no usa `irA`, el vistazo queda pegado de una jugada a la otra: es el
motivo de que haya una sola puerta. Los tres lugares que reposicionan al cargar
o rehacer una partida limpian `MEJOR_EN` aparte, porque guarda un número de
jugada que en otra partida apunta a cualquier cosa.

**Ojo con una confusión al probarlo:** cuando la jugada jugada *es* la mejor, no
aparece flecha nueva y el cuadrito no se enciende. No está roto — no hay nada
distinto que mostrar.

### La evaluación: tres formas, elegibles (v31)

Ninguna gana sola, así que se eligen y se guardan (`MODO_EVAL`, en
`localStorage`). Los números son medidos, no estimados:

| Modo | Ancho del tablero | Alto del bloque |
|---|---|---|
| `horizontal` — barra arriba, número adentro **(default)** | **347** | 373 |
| `tarjeta` — vertical fina, número en la tarjeta | 329 | 329 |
| `barra` — vertical ancha, número adentro | 309 | 309 |

**El tablero es cuadrado y lo limita el ancho, así que sacarle ancho le saca
también alto.** La barra vertical comparte los renglones del tablero; la
horizontal se suma. Por eso la vertical sale más barata en alto aunque achique
el tablero — y por eso la horizontal, que no tiene barra al costado, da el
tablero **más grande** de las tres.

**`horizontal` quedó de default**: elegido al probarlo en el celular, y es el que
deja el tablero más grande. El bloque del tablero lleva `margin-bottom` para que
la barra no termine pegada al borde de la tarjeta del veredicto.

Cuando el número viaja en la barra, la tarjeta del veredicto no lo repite: si no
quedaba dos veces en pantalla y en dos puntas opuestas, que es justo el problema
que se estaba resolviendo. El número va en la punta del que va ganando, con
tinta oscura sobre el relleno claro y clara sobre el fondo.

### Galones en el margen del tablero — y son botones (v32)

Avisan que el tablero se puede deslizar. Van dibujados **dentro del SVG, en el
margen de coordenadas** —el borde de 15 px donde viven las letras y los
números—, así que **no le sacan un píxel al tablero**. Quedan a media altura,
donde no hay ninguna etiqueta: las de las filas 4 y 5 pasan a 21 px de ahí. No
**se tocan.** No era el plan —nacieron como aviso— pero al probarlos el usuario
dijo que "parecen más botones", así que se hicieron botones: si la gente los lee
como control, que lo sean.

La zona que recibe el toque es mucho mayor que el dibujo: **toda la altura del
tablero y 10 unidades hacia adentro además del margen**, unos 24×347 px. Queda
por debajo de los 44 px de ancho recomendados —el margen no da para más sin tapar
casillas—, pero al ser tan alta y estar contra el borde de la pantalla se acierta
bien, y los botones grandes de abajo siguen estando. Dos detalles que hacen falta:
el rect va con `fill="transparent"` y no `"none"`, porque con `none` no recibe el
toque; y **se comen los 10 px exteriores de las columnas a y h** — hoy da igual
porque tocar el tablero no hace nada, pero si alguna vez se puede tocar una
casilla hay que achicarlas.

Escucha el contenedor, no cada galón: el SVG se redibuja entero en cada jugada y
habría que volver a atar el evento cada vez.

**Hay un guardia contra el doble salto:** al terminar un deslizamiento el
navegador dispara además un `click`, y si el dedo levantaba sobre un galón se
pasaban dos jugadas. El deslizamiento marca la hora y el galón ignora los clicks
de los 400 ms siguientes.

**Lo que sigue sin resolverse:** los galones avisan que hay algo ahí, pero no
enseñan que el tablero se desliza. Eso lo enseña una transición, no un dibujo
quieto, y las animaciones son una rama sin empezar.

Se descartó a propósito la variante que **sí** era un botón —un galón con fondo
circular sobre las casillas del borde—: resolvía mejor la navegación pero tapaba
piezas en el medio juego. Y quedó dicho que un galón estático avisa que *se
puede* deslizar, pero enseñar *cómo* es trabajo de una animación, que es otra
rama sin empezar.

### Trampa: `.oculto` necesitaba `!important`

`.oculto { display: none }` estaba declarada **antes** que `.evalbar { display:
flex }`. Misma especificidad, gana la última: la barra tenía la clase puesta y
seguía viéndose. **Las pruebas no lo agarran y una verificación por
`classList.contains` tampoco** —la clase está, no surte efecto—; se vio en una
captura. Ahora lleva `!important`, que es lo correcto para una utilidad de un
solo uso. Al verificar algo visual, mirar `getComputedStyle`, no la clase.

### Dos arreglos de la misma tanda

- **La jugada elegida se marca con fondo, no con contorno.** El contorno
  redondeado se leía como un campo de texto editable. El fondo sale del color de
  la propia categoría (`color-mix` sobre `currentColor`).
- **El selector de tema está vestido como los botones**: mismo borde, mismo
  alto, y la flechita dibujada acá en vez de la del navegador, que lo hacía ver
  de otra familia.

### Se sacó el aviso "al filo del umbral"

Avisaba cuando la pérdida de una jugada caía a menos de 0,15 de uno de los
cortes que deciden la categoría (0,5, 1 y 3), porque ahí el ruido del motor
puede cambiarle la etiqueta. **El razonamiento sigue siendo cierto** y por eso
queda escrito acá: una jugada pegada a un corte es una etiqueta poco firme. Lo
que se sacó es el aviso en pantalla —texto en mayúsculas más un color propio en
cada veredicto—, por decisión del usuario: costaba atención en todas las jugadas
para un caso que rara vez cambia lo que uno hace. Se borraron `UMBRALES` y
`alFilo`, que quedaban sin uso.

### Lo que falta de esta vista

La disposición está terminada. Lo que queda es la **paleta**, y está anotado
entre los pendientes de interfaz (§8).

*(La vista Mes en secciones se hizo en la v34 y la barra de progreso se escondió
en la v33; las dos figuraban acá como pendientes hasta la v0.41.)*

## 4quater. Los dos modos de la app (v33)

La app arranca en **modo simple** y ahí es donde vive cualquiera que no sea el
autor. El **modo dev** agrega las perillas de medición. Se marca con una clase
en `<html>` y el resto se resuelve por CSS (`html:not(.dev) .solo-dev`), así no
hay que esconder cada cosa a mano desde JS ni se ve un parpadeo al cargar.

### El modo simple no esconde la configuración: la congela

Es la diferencia que importa. `CONGELADO` fija profundidad 16, 4 motores, Hash
16 MB, MultiPV 2, memoria limpia, sin barrido y sin bloques — **los valores que
ya salieron de las mediciones** (§4.2 y §4.3): Hash 1 cambia veredictos, sin
MultiPV 2 no se puede detectar "Genial", y sin memoria limpia los resultados
dejan de ser repetibles.

Se fijan **en el DOM**, no en el código que analiza, para que haya una sola
fuente de verdad y el resto de la app no se entere de que existen modos.

**"Modo" (crítico/amigable) quedó del lado simple a propósito.** No es una
perilla técnica: decide qué tan duro te juzga la app, así que es del usuario.

### Cómo se entra y se sale

`?dev` en la URL lo prende, `?dev=0` o el botón "Salir del modo dev" lo apagan.
**La URL es cómo se prende; `localStorage` es cómo se queda prendido**: el link
guardado en el teléfono no lleva el parámetro, así que sin recordarlo habría que
escribirlo en cada visita.

### La versión, y dónde se ve cada cosa

Son **tres cosas distintas**, a propósito:

| Qué | Dónde | Cuándo |
|---|---|---|
| La versión sola | al pie, junto a la atribución de las piezas | siempre, en los dos modos |
| La línea de diagnóstico | arriba, con la configuración y el registro a un toque | en modo dev |
| La misma línea | ídem | en modo simple, **solo si hubo un error** |

La versión al pie se escribe desde el **script temprano**, no desde el módulo:
si el módulo no arranca, la versión igual se ve, y es el primer dato que hace
falta para diagnosticar desde un teléfono. Va dentro de un `DOMContentLoaded`
porque ese script vive en la cabeza y el pie todavía no existe cuando corre.

**Se muestra como `v0.35` y no como `v35`.** Es el mismo contador de siempre —no
se reinició nada, v35 es v0.35—, solo que escrito como un número de versión de
verdad. El chequeo 7 acepta las dos formas, porque las secciones viejas de este
documento nombran commits reales que se llaman `v32`, `v33`, etc.

### La red de seguridad que NO se sacó

La línea de diagnóstico se esconde en modo simple, **pero reaparece sola ante
cualquier error** (`html.hubo-error #diag`). Se destapa por las dos puertas por
donde pasan los errores: `mostrarError` y `LOG.add("ERR", …)` — hay errores que
solo pasan por el registro. Sin esto, una pantalla en blanco en el celular no
deja ninguna pista, y no hay consola donde mirar: es el peor modo de falla del
proyecto.

### De la misma tanda

- **El listado de partidas scrollea** (`max-height: 34vh`), así el botón de
  analizar queda a la vista sin bajar por cuarenta partidas. **Provisorio:** la
  lista entera se va a rediseñar, esto es solo para que deje de estorbar.
- **La barra de progreso se esconde al terminar** —pendiente abierto desde la
  v26—. Se muestra con el primer `progreso()` y se esconde en `ocupado(false)`,
  que es el único lugar por donde pasan todos los finales, el bueno y los de
  error. **No** se esconde al llegar a cero: un barrido pasa por `progreso(0)`
  al arrancar cada partida.
- **Los desplegables dejaron de parecer botones.** Tienen relleno y borde tenue;
  los botones tienen borde lleno y fondo transparente. Y la flechita lleva
  **colores explícitos por esquema**: dentro de un `data:` URI el SVG se carga
  como una imagen aparte y **`currentColor` no hereda nada**, así que caía a
  negro y sobre el fondo oscuro no se veía.

### Lo que esto prepara

Es la versión barata de lo que se busca con la migración de infraestructura: si
el modo simple ya funciona con una configuración fija, cuando se migre solo hay
que borrar las perillas que sobraron, y de paso se deja de sostener el análisis
a distintas profundidades.

## 4quinquies. Las tablas: vista Mes y vista Partida (v34)

### La tabla de franjas salió del análisis por partida

Era una pregunta de mes mostrada a escala de partida. Con ~17 jugadas por
jugador, cada franja queda con dos o tres, y como entonces debajo de 30 no se
mostraba porcentaje, tres de las cuatro filas eran guiones. No estaba rota: no
podía contestar nada con esos denominadores. **Decisión del usuario.** La del
mes (`mesFranja`) sigue igual, que es donde la pregunta tiene sentido.

### Precisión y mediana salen de la tabla

En la vista Partida van arriba, como un marcador enfrentando a los dos
jugadores; en la del mes, como tres cuadritos (precisión, mediana, jugadas).
Eran las dos cifras que de verdad comparan y quedaban perdidas entre diez filas
de recuentos casi todas en cero. En el mes, además, esas tres filas traían un
"—" en la columna "Por partida" que no decía nada.

**Los recuentos por categoría se quedan completos, con los ceros incluidos.**
Se evaluó esconderlos y el usuario dijo que no: "Brillante: 0" también es un
dato.

### Los dos emoji, por símbolos

`👍` pasó a `☆` (que hace pareja con el `★` de Mejor) y `📖` pasó a `▤`. Los
emoji se dibujan distinto en cada teléfono y **no toman el color de la
categoría**: eran los dos únicos íconos que quedaban en negro mientras los demás
se pintaban. `▤` es menos literal que un libro; si molesta, se cambia.

### El mes, en secciones que se abren

Las cinco tablas de detalle son `<details class="seccion">`, cerradas por
defecto: así la vista Mes se lee como un índice de qué cortes hay, en vez de un
scroll largo. La leyenda de arriba se partió en dos —lo indispensable a la vista
y el resto plegado en "Cómo se leen estos números"—, porque encadenaba origen,
partidas asistidas, profundidad, modo, definición de mala y desglose en un
párrafo de seis renglones antes del primer número.

**Cuidado al tocar esto:** el chequeo 5 exige que cada `<table>` esté precedido
inmediatamente por `<div class="tw">`. Dentro del `<details>` esa adyacencia se
mantiene.

### La lista de jugadas usa el símbolo, no un punto de color (v35)

El punto de 7 px obligaba a distinguir tonos a ese tamaño, y **tres de las diez
categorías comparten un verde que solo cambia de luminosidad** —`#4a9d4a`,
`#6bb06b`, `#86b886`, los tres en 120° de matiz—, que es lo primero que se
pierde a ese tamaño. Hay una segunda colisión igual de fuerte: Omisión
`#d0453b` y Error grave `#c0392b` son casi el mismo rojo.

Ahora cada jugada lleva el símbolo de su categoría (`★` `☆` `✓` `?!` `??`…), con
ancho fijo de 16 px porque van de uno a dos caracteres y si no las jugadas
bailan de fila en fila. El color se queda como refuerzo.

**Por qué no se cambió la paleta.** Se evaluó una de seis colores, calculados a
la misma luminosidad percibida, agrupando Mejor/Excelente/Bien en un solo verde
—diez categorías no entran en diez colores distinguibles: el extremo bueno no se
puede abrir en más matices sin chocar con el ámbar de Imprecisión—. **El usuario
eligió el cambio mínimo:** los símbolos ya dejan la lista legible sin tocar un
solo hex.

**Lo que queda sin resolver, y sigue siendo cierto:** la paleta tiene
luminosidades desparejas, así que el ámbar de Imprecisión llama más la atención
que el verde de Bien sin que eso signifique nada. Los símbolos arreglan la
legibilidad, no el volumen. Si alguna vez se retoma, la propuesta medida está
acá: brillante `#2ac3bb`, genial `#65a7fa`, bueno `#61bd67`, libro `#ac9c87`,
imprecisión `#e3ae28`, error `#ef852e`, omisión `#ed5350`, grave `#c92e3b`.

### La columna "% resto" se fue (v0.36)

Era la referencia contra la que se leía cada mecanismo, y **mezclaba dos
denominadores distintos sin decirlo**:

- para "Dejé comible la pieza que moví", el resto eran *todas* las demás
  jugadas — o sea casi todas, prácticamente la tasa general;
- para "Jugada siguiente a una mala", era el `resto` de `paresDeErrores()`, que
  además **excluye la primera jugada de cada partida**.

Dos universos en la misma columna. Diagnóstico del usuario, que lo dijo así: la
tasa general "está buena, pero no va ahí".

**El contraste no se perdió**, que es lo que exige §5.7: ahora va **una sola
vez, en la leyenda**, sobre una base bien definida —todas las jugadas del
usuario— y declarada con su denominador, como manda la regla 1 de §5. Cada fila
se lee contra ese número.

Para volver atrás alcanza con devolver `sin: tasa(todas.filter(f => !test(f)))`
en `contraste` y la columna en `tablaContrastes`. Hay una prueba que falla si la
columna vuelve.

### El chequeo 2 estaba verde por casualidad

Pedía que `<table id="mesX">` tuviera un id `capX`. Esa convención **no describía
la realidad**: la leyenda de `mesFranja` se llama `capMesFranja` y la de
`mesResumen` se llama `capMes`. El chequeo pasaba porque existían `capFranja` y
`capResumen` — que eran las leyendas de **otras** tablas, las de la vista
Partida. Al borrar la tabla de franjas por partida quedó al descubierto.

Ahora mira la estructura y no el nombre: antes de cada tabla, dentro de una
ventana de 200 caracteres, tiene que haber un `class="cap"`. **Cubre todas las
tablas y no solo las del mes.** Se verificó que falla borrando una leyenda a
propósito, que es lo que el anterior no hacía.

## 4sexies. Partida y Mes son dos vistas, y se conmutan (v0.38)

Cierra la decisión tomada al empezar el refactor: **dos vistas equivalentes**, no
una apilada debajo de la otra. Se ve una por vez.

### Una sola puerta

`mostrarVista()` es el **único** lugar que prende o apaga `zonaRevision`,
`zonaResumen` y `zonaMes`. Antes cada final de análisis lo hacía por su cuenta;
con dos vistas eso se desincroniza al primer descuido —quedan las dos visibles,
o ninguna, o una pestaña que no corresponde—. **Hay una prueba que falla si
aparece un `ver()` de esas zonas fuera de esa función.**

`HAY.partida` y `HAY.mes` dicen qué vista tiene contenido. **El conmutador
aparece solo cuando hay las dos**: con una sola no hay nada que conmutar y dos
pestañas, una vacía, confunden. Y analizar una partida **ya no borra la vista
del mes**: sus datos siguen siendo válidos, y perderla sería perder una pestaña.

### Cómo se vuelve

El agujero del primer plan era este: en Android lo que uno hace es el gesto de
volver, y sin historial ese gesto **saca de la aplicación**. Peor que no tener
vuelta.

- **Solo el salto lista → partida empuja una entrada de historial**, sobre la
  misma URL (para que una recarga no dé 404 en Pages). Es el único que tiene un
  "de dónde venías"; conmutar con la pestaña es navegación deliberada.
- El gesto de Android, la flecha del navegador, el botón "‹ Volver al mes" y la
  pestaña Mes van **todos por el mismo camino**: si se llegó desde la lista,
  `history.back()`.
- El botón aparece **solo cuando hay a dónde volver**.

### Tres trampas del scroll, las tres medidas

1. **El anclaje de scroll del navegador.** Al esconder una zona grande, Chrome
   reajusta la posición por su cuenta y peleaba con la nuestra: el tablero
   terminaba **643 px por encima del borde** según desde dónde vinieras. El
   `body` lleva `overflow-anchor: none`.
2. **`requestAnimationFrame` no corre en una pestaña que no se está viendo**, así
   que el salto no pasaba nunca. Va con `setTimeout(…, 0)`.
3. **`history.scrollRestoration` por defecto es "auto"**: el navegador guarda su
   propia posición por entrada y la restaura pisando la nuestra. Sin ponerlo en
   `"manual"`, volver al mes devolvía a una posición vieja de otra navegación en
   vez de a donde estabas.

Verificado en el navegador: desde scroll 0, 600 y 1200, abrir una partida deja
el tablero **entero** en pantalla y volver restaura la posición exacta.

## 4septies. Ganadas, empatadas y perdidas (v0.39, y el listado en la v0.42)

Debajo de las tres cifras del mes, en palabras: *"7 ganadas · 1 empatada · 6
perdidas"*. **No como "7-1-6"**: esa abreviatura hay que decodificarla y encima
el orden cambia según el país.

### Las decisiones que hubo que tomar

**El historial excluye las partidas asistidas**, igual que los promedios. No es
prolijidad: en "todo lo analizado" esas partidas ni se guardan (`barrerCache`
las descarta antes de acumular), así que contarlas solo en un modo daría dos
totales distintos para lo mismo. Se cuenta sobre **exactamente** el mismo
conjunto que los promedios (`conMias`), y la leyenda ya avisa cuántas quedaron
afuera.

**No saber el resultado no es empatar.** `resultadoDeLado` devuelve `null`
cuando no se sabe de qué lado jugaba el usuario o la partida quedó sin terminar
(`Result "*"`), y esos casos se cuentan aparte como "sin resultado conocido".
Contarlos como tablas sería inventar un resultado.

**El resultado va por partida, no en cada fila flaca.** Son decenas de filas por
partida y el dato es uno solo: `barrerCache` lo guarda en un arreglo paralelo a
`porPartida`. Por eso `CAMPOS_FLACOS` quedó como estaba.

**Funciona con un PGN pegado a mano**, que no tiene el JSON de chess.com:
`resultadoDeLado` cae al encabezado `Result` del PGN.

### Verificado contra los datos crudos

Sobre el mes de 2026-09: la API cruda da 8 ganadas, 1 empatada y 6 perdidas en
15 partidas; la app muestra 7-1-6 en 14. La diferencia es **exactamente** la
partida contra `Coach-DrWolf`, que es asistida y está en `ENTRENADORES`.

### El mismo marcador arriba del listado, sin analizar nada (v0.42)

Pedido por el usuario. El listado del mes ahora abre, apenas se elige el mes,
con dos renglones:

```
15 partidas del mes            ← gris, 12,5 px
8 ganadas · 1 empatada · 6 perdidas
```

**El resultado ya viene en el JSON de chess.com**, así que no cuesta ni una
corrida del motor. Es el número que antes había que analizar el mes entero para
ver.

**Por qué en dos renglones y no en uno.** Se dibujaron cuatro variantes a ancho
de celular (412 px) con este mismo mes y se eligió mirándolas, no de memoria:

| | |
|---|---|
| `15 partidas del mes · 8 ganadas · …` | se parte en dos renglones y corta por donde le toque |
| `15 del mes · 8 ganadas · …` | entra en uno, **justo**: con tres cifras, o con el "· N sin resultado conocido", se vuelve a partir. Y sin la palabra *partidas* el denominador se apoya en el título de arriba |
| cantidad arriba, resultados abajo | nunca se parte, digan lo que digan los números |
| **la misma, con la cantidad tenue** | **elegida** |

La cantidad es el **denominador** y los resultados son la **respuesta**: el gris
`--tenue` y los 12,5 px los separan, y son los mismos que ya usan `p.cap` y los
datos de apoyo del listado, así que no se inventó ningún estilo. Cuesta un
renglón más que la variante corta; se aceptó porque no se parte nunca.

`.marcadorMes .deQue` tiene que seguir siendo `display: block`, o la frase
vuelve a partirse sola. Hay una prueba que lo mira.

**Los dos marcadores dan distinto a propósito, y ahora se ven juntos.** Es
exactamente la diferencia medida acá arriba: el del listado son las 15 del mes,
el de la vista Mes son las 14 analizadas y sin asistencia. Por eso el del
listado lleva su denominador escrito —"15 partidas del mes"— y el de la vista
Mes se apoya en la leyenda que ya tenía encima (§5.1). Sin eso, el mismo mes
mostraría 8-1-6 en una pantalla y 7-1-6 en la otra sin ninguna explicación.

**Las palabras se eligen en un solo lugar.** `textoMarcador()` arma la frase y
la usan los dos; el denominador NO va adentro, porque es lo único que difiere.
Si cada pantalla escribiera su texto, se irían separando con el tiempo.

**Hay una segunda función para el lado del usuario.** `ladoDelUsuario()` mira
las cabeceras del PGN ya parseado, y el listado todavía no parseó nada: tiene el
JSON y nada más. `ladoEnJuego(g, usuario)` lee `g.white.username` /
`g.black.username`, recibe el usuario por parámetro en vez de leer la global —
así es pura y tiene pruebas— y devuelve `null` si el usuario no juega esa
partida, que `resultadoDeLado` ya traduce a "no se sabe".

**Lo que quedó afuera a propósito:** el motivo del desenlace (`timeout`,
`checkmate`, `resigned`, que vienen en el mismo JSON y son gratis) y el
resultado desde el lado del usuario en cada fila del listado, que hoy sigue
mostrando el marcador neutro "1-0". Las dos se discutieron y el usuario las
quiere en otro lado, no acá.

## 4octies. Dos fallas reportadas desde el celular (v0.40)

### Un PGN válido que no se podía leer

Un PGN pegado a mano daba **"no pude leer ese PGN"** con las 77 jugadas
perfectamente legales. La causa: **chess.js exige una línea en blanco entre las
cabeceras y las jugadas**, y si falta no lee nada — devuelve `false` y no dice
por qué. El texto reportado tenía el `1. e4` pegado al último `[TimeControl]`.

Se comprobó aplicando las jugadas de a una: **77 de 77 entraban**. O sea que el
problema nunca fue el ajedrez, sino el parseo.

`normalizarPgn()` agrega la línea si falta. **Mira línea por línea y NO usa
`lastIndexOf("]")`**: los PGN de chess.com traen los relojes como
`{[%clk 0:05:00]}` dentro de las jugadas, así que el último `]` del texto
está en el medio de la partida, no al final de las cabeceras. Hay una prueba
con relojes justamente por eso.

**Límite conocido:** si el `1. e4` viene en la MISMA línea que la última
cabecera, esto no lo arregla.

De paso, el mensaje de error dejó de ser un callejón sin salida y ahora dice qué
mirar.

### El registro no se abría en modo simple

Cuando un error destapaba la línea de diagnóstico —la red de seguridad de la
v33— tocarla **no hacía nada**. `#panelLog` tenía la clase `solo-dev`, y esa
regla lleva `!important`: el toque quitaba `oculto` pero el panel seguía
escondido por la otra regla.

Se le sacó `solo-dev`. Sigue naciendo `oculto`, y en modo simple la única
forma de llegar a él es a través del diagnóstico, que solo aparece si hubo un
error — que es exactamente cuando hace falta.

**La lección se repite:** una clase puesta no es un efecto conseguido. Es el
mismo error que con `.evalbar` en la v31, y las dos veces se vio mirando la
pantalla, no el código.

## 4nonies. El reloj: dónde se va el tiempo (v0.43)

Primera de las tres formas de §7.8, y la que se eligió empezar porque **es la
única que no puede engañar**: no afirma que el tiempo cause nada, solo dice
dónde se va. Además su plomería es la que después necesitan las otras dos.

### Lo que se ve

Una columna **Seg.** en las tablas "por pieza" y "por tramo": la **mediana** de
segundos pensados en las jugadas de esa fila. No hay tabla nueva ni corte nuevo.

### El dato se verificó, no se supuso

Sobre un PGN real del usuario (5+0, 62 jugadas): chess.js devolvió los 62
comentarios y se leyeron los 62 relojes. Además ese PGN traía un segundo campo
que no estaba en §7.8, **`[%timestamp N]`**, que son las décimas de segundo
gastadas en la jugada —o sea la respuesta ya calculada—. Se usó como control
independiente: **la resta de relojes coincide con él en 60 de 62 jugadas**. Las
dos que no son `1. e4` y `1... Nf6`, donde chess.com escribe el reloj inicial
intacto y el timestamp dice 0,1 s: es el redondeo del arranque.

**Se usa `%clk` y no `%timestamp`**, aunque el segundo sea directo: `%clk` es el
único que además contesta *cuánto te quedaba* —la otra pregunta de §7.8— y ya
estaba verificado sobre 14 partidas; el `%timestamp` se vio en un solo archivo.

### La cadencia, que era el problema de fondo

Lo señaló el usuario por su cuenta, y es la advertencia que §7.8 ya tenía
escrita: **diez segundos en un 5+0 es muchísimo y en un 10+0 no tanto.** Si las
tablas mezclan cadencias, los segundos no significan nada.

**No alcanza con `time_class`.** "Blitz" mete 3+0 y 5+0 en la misma bolsa y son
casi el doble uno del otro. La unidad de comparación es el `TimeControl` exacto:
`leerCadencia()` lo lee y arma el nombre `5+0`, `3+2`. Las de correspondencia
(`"1/259200"`) devuelven `null` y quedan afuera de todo lo que hable de tiempo.

Se evaluaron tres salidas y se eligió mirando el volumen real del usuario:

| | |
|---|---|
| un selector de cadencia | lo propuso el usuario. Con ~15 partidas por mes, elegir deja grupos muy chicos *(entonces se veían guiones; desde la v0.50, márgenes anchos)*. Suma además un tercer `<select>` suelto a la fila de controles, que §8 ya marca como problema |
| **la cadencia dominante, y decirlo** | **elegida.** Cero controles nuevos. En 2026-09 el 80% de las partidas son de una sola cadencia: el selector serviría para elegir entre un grupo de 12 y uno de 2 |
| porcentaje del reloj en vez de segundos | no hay que separar nada y entran todas, pero "el 3% de tu reloj" se lee peor que "8,7 s", y con incremento el reloj inicial deja de ser un denominador claro |

El selector queda anotado para **cuando exista la pantalla de configuración**
(§8), y tiene más sentido en "todo lo analizado", que junta meses y ahí sí hay
muestra para varias cadencias.

### Las decisiones que hubo que tomar

**Las partidas de otra cadencia no se borran: pierden el `seg` y nada más.**
Siguen contando para las malas. Son dos denominadores distintos y por eso `tasa`
devuelve `conSeg` aparte de `total`.

**`unaSolaCadencia()` no muta las filas.** Son las mismas que usa la pantalla de
revisión: a la que hay que cambiarle el `seg` se le hace una copia. Hay una
prueba que lo mira.

**`null` no es cero.** Una jugada sin reloj no "se pensó al instante": no se
sabe. Las medianas saltean los `null` (§5.12).

**La columna aparece solo si hay de dónde sacarla.** Una columna entera de
guiones se lee como "no hay", no como "no se midió"; si no hay segundos, no hay
columna, y la leyenda lo explica.

**La mediana usaba el mismo mínimo de 30 que los porcentajes.** *(Duró hasta la
v0.48: era consistencia mal aplicada. Una mediana es mucho más robusta que una
tasa de casos raros. Hoy tiene su propio piso, `NMIN_MEDIANA = 5`, y los
porcentajes no tienen ninguno — §4terdecies.)*

**Un reloj que sube no da un gasto negativo.** chess.com redondea y el resto a
veces cae abajo de cero: se recorta en 0, igual que hace `perdida`.

**El segundo entró a `CAMPOS_FLACOS`**, o "todo lo analizado" perdería la
columna sin decir por qué. La **cadencia**, en cambio, es un dato por partida y
va en un arreglo paralelo a `porPartida`, igual que el resultado (§4septies).

### Lo que falta

Las otras dos formas de §7.8: **el apuro** (cuánto quedaba en el reloj) y
**cuánto pensaste**. El mismo bucle que calcula el gasto ya tiene `restan`; no
se emite hasta que haya algo que lo use, porque cada campo pesa también en las
filas flacas.

## 4decies. Las leyendas se parten en dos (v0.44)

Pedido por el usuario: *"son mucho para leer, más de una línea no lo va a leer
nadie"*. La leyenda de "por tramo" eran **245 caracteres, cinco renglones** en
un celular.

### El criterio del corte, que no es el largo

- **Arriba queda lo que cambia CÓMO se lee el número**: qué cuenta como mala, de
  qué partidas sale, contra qué referencia se lee cada fila. Eso no se puede
  plegar sin dejar el número sin universo (§5.1, §5.7, §5.12).
- **Detrás del `?` va el porqué**: qué compara la tabla, para qué está cada
  control, cuál es el confundidor. Se lee una vez y no hace falta tenerlo
  delante en cada mirada.

Lo escribe `pintarLeyenda(idCap, corto, ayuda)`, que las tres funciones que
pintan tablas usan. Los dos textos van en el **mismo elemento** —un `.corto` y
un `.ayudaPanel` dentro del `<p class="cap">`— para no inventar un id por tabla,
y los dos se escriben con `textContent`: nada de lo que se interpola puede
entrar como HTML.

### Tres cambios que ganaron el renglón

1. **"Mala = pierde 3+ peones"** en vez de "pérdida de 3 peones o más". Idea del
   usuario. Ahorra 8 caracteres en las cuatro tablas.
2. **"mediana" pasó al encabezado de la columna** (`Seg.` con un subtítulo), que
   es donde no cuesta un renglón y queda al lado del número que califica.
3. **La cadencia pasó al título de la sección**, y solo cuando hay más de una.
   En el título se ve **con la sección plegada**: se sabe el alcance sin abrir.

Se dibujaron cuatro variantes a 412 px antes de elegir. Resultado sobre "por
tramo": **de 245 caracteres a 41**, de cinco renglones a uno.

### Los nombres de cadencia son los de chess.com

Decisión del usuario: *"5+0 no me parece amigable para aficionados"*. Se muestra
**"5 min"**, y **"3 | 2"** cuando hay incremento —"3 min" perdería el
incremento—, que es la convención de la aplicación de donde salen las partidas.

Eso obligó a separar dos cosas que antes eran una: `leerCadencia` devuelve
**`clave`** (`"300+0"`, exacta y normalizada, la unidad de comparación) y
**`nombre`** (lo que se muestra). `unaSolaCadencia` agrupa por `clave`, así
`"300"` y `"300+0"` no caen en dos grupos y `3 min` nunca se mezcla con `5 min`.

### Dos cosas que solo se vieron al probarlo en el navegador

- **El `?` plegaba la sección.** Vive dentro del `<summary>`: sin
  `preventDefault` cerraba justo lo que se quería leer. Y si la sección estaba
  cerrada, ahora se abre sola, porque si no el texto aparece donde no se ve.
- **El título prometía un alcance que la tabla no tenía.** "Por pieza movida ·
  5 min" con la tabla sin columna de segundos. El chip lo decide ahora
  `tablaTasas`, que es la que sabe si dibujó la columna, y no el que la llama.

Las dos tienen prueba.

### La cabecera del mes (v0.45)

`capMesDetalle` **nunca fue el problema**: ya vivía dentro del plegable "Cómo se
leen estos números", o sea que el patrón corto/largo ya existía ahí, hecho con
otra forma. El problema era `capMes`, que está siempre a la vista y **repetía lo
que la pantalla ya dice**: empezaba con "El mes seleccionado:", que es
exactamente lo que dice el `<select>` de arriba, y con "de USUARIO", que está en
el buscador. De sus 90 caracteres, la mitad era eco.

```
antes  El mes seleccionado: 14 partidas y 490 jugadas de santico26. Profundidad 16, modo crítico.
ahora  14 partidas · 490 jugadas · prof 16 · crítico
```

Lo largo se fue a `origenLargo()`, dentro del plegable que ya existía. Lo que
**no** se pliega es cuántas partidas quedaron afuera: va como `· N afuera` en la
línea corta, sumando las asistidas y las de otra configuración. Que algo no se
haya contado no se puede callar (§5.12); el desglose de por qué, sí.

**Se decidió NO unificar el `?` con el plegable.** Se dibujaron las dos
opciones. El argumento del usuario, que ganó: la explicación general está en
medio de números que un aficionado no sabe leer, y ahí una frase con nombre
—"Cómo se leen estos números"— se ve; un `?` chiquito en la esquina queda lejos
y apartado. El `?` se queda para las tablas, donde el título ya dice de qué se
trata y el ícono solo amplía.

### Tres arreglos reportados desde el celular

- **Los `?` caían en columnas distintas.** `.seccion > summary` era
  `space-between`, y con el chip de cadencia eran cuatro elementos
  repartiéndose el ancho. Ahora el título se lleva el sobrante (`.tit` con
  `flex: 1`) y el `?` queda último: los cinco alinean en x. El `gap: 14px` lo
  despega del chevron, que si no se tocan por error.
- **El `?` seguía pintado con la sección plegada.** El panel vive adentro: al
  cerrar, el texto se escondía y el botón seguía diciendo que estaba abierto.
  Ahora plegar cierra también la ayuda (`toggle`, que no burbujea, así que se
  engancha por sección).
- **Decía "critico" sin tilde.** El `value` del `<select>` es ASCII a propósito.
  `nombreModo()` lo traduce, y se arreglaron de paso los otros tres lugares que
  lo escribían crudo.

### Lo que falta

**`capResumen` y `capBanco` siguen largas**, las dos del banco de pruebas, que
es modo dev. **La lista está escrita en la prueba "cada tabla con leyenda tiene
su ?"**, que además falla si aparece una tabla nueva sin `?`.

**La de mecanismos quedó en dos renglones** (91 caracteres): lleva la referencia
de §5.7 *y* el aviso de solapamiento de §5.11, y las dos son de las que no se
pueden plegar. Es el caso donde el criterio y el renglón chocan de verdad.

## 4undecies. La cadencia pasa a ser el alcance de toda la vista (v0.46)

Lo empezó el usuario mirando la pantalla: *"las leyendas «5 min» meten ruido en
la cabecera, porque dan a entender que toda la tabla analiza solo esas
partidas"*. Y tenía razón dos veces.

**Era un error real, introducido en la v0.43.** En "Por tramo · 5 min"
convivían dos denominadores: `Malas` y `Jugadas` eran de **todas** las partidas
y `Seg.` solo de las de 5 min. El título nombraba uno solo. Es el mismo bug que
se había arreglado en la v0.44 para "Por pieza", con otra cara.

**Y el argumento era más grande que el error.** El usuario siguió solo: si el
nivel de las jugadas depende del tiempo que hay para pensar, entonces *todas*
las estadísticas tendrían que estar bajo la misma cadencia, no solo los
segundos. Es correcto. La tasa de errores no es la misma variable en bullet que
en rapid, y "por tramo" menos todavía: el apuro final de un 3+0 no se parece al
de un 15+10.

### Lo que se hizo

**La cadencia dejó de ser un detalle de una columna y pasó a ser el alcance de
la vista Mes entera.** Hay un `<select id="cadencia">` al lado del que ya elige
"El mes seleccionado / Todo lo analizado", porque es el mismo tipo de control:
*qué universo estoy mirando*.

- **Por defecto manda la que más partidas tiene.** Decisión del usuario.
- **Con una sola cadencia el selector queda deshabilitado**, no escondido:
  se sigue leyendo como el alcance de la vista, pero no invita a tocar algo sin
  alternativas. También del usuario.
- **El chip de cadencia desapareció de los cinco títulos.** El alcance se dice
  una vez, en la cabecera: `10 min · 1 partida · 31 jugadas · prof 13 · crítico
  · 2 afuera`.
- **Cambiar de cadencia no toca el motor.** Las filas ya están; lo único que
  cambia es cuáles entran. Es instantáneo, igual que cambiar de modo.

### La decisión de fondo: se filtra UNA vez

El error de la v0.43 fue filtrar cada cosa por su lado. Ahora `datosDeTablas`
arma el conjunto crudo, elige los **índices** de las partidas de la cadencia, y
de esos índices salen las filas, el historial y todos los denominadores. Si algo
nuevo se agrega a la vista, tiene que salir de `idx` o vuelve el problema.

`barrerCache` ahora devuelve `resultados` además del `marcador`, porque el
historial se recalcula sobre el subconjunto y ya no puede venir precontado.

### Lo que esto le cuesta a lo ya medido

**Varias mediciones de §8 se tomaron con las cadencias mezcladas** —la franja de
ventaja, "por pieza", "Genial se dispara ~2 veces por partida"—. Con el filtro
puesto, esos números **ya no corresponden con lo anotado**: hay que volver a
medirlos por cadencia antes de sacar conclusiones de ellos. No es motivo para no
hacerlo; es motivo para no leer §8 como si siguiera vigente tal cual.

**Filtrar achica todo.** Un mes repartido 6/5/3 deja muy pocas jugadas por fila.
El selector muestra la cantidad de partidas de cada cadencia justamente para que
eso se vea venir. *(Cuando se escribió esto, el costo eran guiones; desde la
v0.50 no hay corte y el costo son márgenes anchísimos, que dicen lo mismo pero
mejor.)*

### Lo que no se hizo

**No hay opción "todas las cadencias".** Se descartó porque es exactamente lo
que se está arreglando: mezclar. Si alguna vez hace falta —por muestra chica—,
tendría que venir con la columna de segundos escondida, porque ahí sí no se
puede calcular.

## 4duodecies. Cómo terminaron: el desglose de desenlaces (v0.47)

Esto empezó como "derrotas por tiempo", una de las cuatro ideas de tiempo. El
usuario la reubicó: *"la dejaría dentro de una mejora en la que se vea el
desglose de motivos de victoria - empate - derrota"*. Tiene razón — el "perdí
por tiempo" solo dice algo al lado de "perdí por mate".

**No cuesta motor ni relojes.** El motivo ya viene en el JSON de chess.com.

```
Cómo terminaron                        ?
Sobre 5 partidas · muy pocas para porcentajes, van los casos
Desenlace              Veces    %
Gané por abandono          1    —
Gané por mate              1    —
Empaté por acuerdo         1    —
Perdí por abandono         1    —
Perdí por tiempo           1    —
```

### Lo que hay que saber para tocarlo

**El motivo lo escribe siempre el que NO ganó.** chess.com le pone `"win"` al
ganador y el detalle —`checkmated`, `resigned`, `timeout`— al otro. Así que para
una ganada hay que mirar el campo del **rival** y para una perdida el propio. En
las tablas los dos lados traen el mismo motivo. Es el error fácil de esta
función y tiene prueba.

**Un motivo que la API sume mañana no se descarta**: cae en "otro motivo" y se
anota en el registro. Descartarlo dejaría creyendo que se contó y dio cero
(§5.12).

**Las filas se agrupan por resultado y dentro por cantidad**, no todas por
cantidad: así se barre con el ojo "cómo gano" y "cómo pierdo" sin leer fila por
fila.

**El desglose y el marcador salen de los mismos índices.** Si no, la suma de las
filas no daría el "2 ganadas · 1 empatada · 2 perdidas" de arriba y no habría
forma de saber cuál está mal. Los dos cuelgan de `idx`, que es el filtro de
cadencia de la v0.46.

**`tablaReparto` ganó dos parámetros**, los dos por la misma razón: la tabla
reparte cosas distintas según quién la use.
- La columna **Malas** solo aparece si las filas la tienen: el desglose reparte
  PARTIDAS y ahí una columna vacía se leería como "cero malas", que sería falso.
- La **unidad** es un parámetro: decía "Sobre 5 situaciones" arriba de un
  desglose de partidas. Se vio al probarlo en el navegador.

### Un efecto no buscado, y que conviene dejar

"Riesgo por franja de ventaja" **también muestra ahora la columna Seg.**, porque
`tablaTasas` la dibuja sola cuando las filas la traen. Queda "cuánto pensás
según la ventaja que tenías", que es un corte legítimo y gratis. Es válido
porque desde la v0.46 toda la vista es una sola cadencia; **si alguna vez vuelve
a haber cadencias mezcladas en la misma vista, esta columna miente.**

## 4terdecies. El número flojo se marca, no se esconde (v0.48)

Lo abrió el usuario mirando el desglose de desenlaces: *"no le veo sentido a la
restricción de porcentaje a esa tabla. Por más que hayan sido 10 partidas, el
porcentaje es un dato, no una tendencia"*. Y de ahí a repensar el mínimo entero.

### La distinción que faltaba: dos clases de porcentaje

- **Composición de un conjunto cerrado.** "De mis 10 partidas, 3 las perdí por
  tiempo." El denominador **es** la población de la que se habla. No se estima
  nada: 30% es exactamente cierto de esas 10 partidas. Un mínimo ahí no protege
  de nada. → tablas de reparto: desenlaces, capturas.
- **Tasa como estimación de una propensión.** "De mis jugadas de dama, el 14%
  sale mal." Las 21 jugadas no son el tema: son la muestra con la que se quiere
  decir algo sobre cómo se juega. → tablas de tasas: pieza, tramo, mecanismos,
  franja.

El mínimo se escribió para la segunda y se estaba aplicando a la primera.

### Los tres cambios

1. **Las tablas de reparto perdieron el mínimo.** Siempre muestran el
   porcentaje, sin margen, y la ayuda dice por qué: "reparte estas mismas
   partidas, no estima nada, las cuenta".
2. **La mediana de segundos salió del mínimo de 30** y tiene el suyo,
   `NMIN_MEDIANA = 5`. El de 30 se lo había puesto yo en la v0.43 por
   consistencia, y la consistencia estaba mal elegida: una mediana es mucho más
   robusta que una tasa de casos raros. 2 malas de 21 es ruido; 12 tiempos
   ordenados, no.
3. **En las tablas de tasas el guion se fue.** El número se muestra siempre y
   debajo de `NMIN` va marcado. *(Dos versiones después se cayó también ese
   corte: hoy el margen va en todas las filas. Ver más abajo.)*

### Por qué el margen y no el guion

El guion **no escondía nada**: al lado están los casos y el total, y cualquiera
divide. Lo que hacía era cobrar una división y, peor, **tratar igual una fila de
21 jugadas y una de 29**, que no son igual de flojas.

```
antes   Dejé comible la pieza que moví   5   15    —
ahora   Dejé comible la pieza que moví   5   15   33.3% (15–58)
```

Ese `(15–58)` dice lo que el guion no podía: el número podría ser 15% o podría
ser 58%, así que no sirve para decidir nada. Y al lado, un `13.3%` sin
paréntesis se lee como firme.

### El cálculo

`rangoWilson(k, n)`. **Wilson y no el margen de manual** `p ± z·√(p(1-p)/n)`:
ese, con pocos casos, se va abajo de cero o arriba de cien —"una tasa de -3%" no
se puede mostrar— y se rompe del todo cuando no hubo ningún caso, que es
justamente la fila `0 de 15` que sí queremos poder mostrar como `0.0% (0–20)`.

`z = 1,96` es el 95%: repetido muchas veces, el rango contiene la tasa real unas
95 de cada 100. **Con pocas jugadas la etiqueta es aproximada** —una simulación
de 100.000 corridas sobre 21 jugadas dio 98 y no 95— porque no existe media
jugada mala y los rangos saltan de a escalones.

### El interruptor existió doce horas, y cumplió su función (v0.48 → v0.50)

Se dejó configurable —`margen` o `gris`— porque no estaba claro cuál ganaba, y
para decidirlo **con la app usada y no de memoria**. El usuario la usó y decidió:
gana el margen. El interruptor, el modo gris y `localStorage.marcaFlojo` se
fueron. Queda como método: cuando dos formas se defienden solas, ponerlas las
dos y mirar.

### Y después se cayó el corte entero (v0.50)

El usuario aplicó su propio argumento contra mi número: *"¿solo pone el rango
para métricas con menos de 30 muestras? ¿Eso lo hace confiable? ¿Cuánto umbral
tiene una métrica con 35 muestras?"*. Tiene razón:

```
 3 de  29  =  10.3%   (3.6 a 26.4)   ancho 22.8 pts   ← mostraba el margen
 3 de  30  =  10.0%   (3.5 a 25.6)   ancho 22.2 pts   ← lo escondía
 4 de  35  =  11.4%   (4.5 a 26.0)   ancho 21.4 pts   ← lo escondía
```

**Misma incertidumbre, tratamiento opuesto.** 30 no marca ninguna frontera: es
un número redondo. Y una tasa no se pone firme hasta los cientos de jugadas —20
de 200 todavía va de 6,6 a 14,9—, así que con los volúmenes de un jugador
aficionado **casi ninguna fila es firme** y el corte estaba avalando como firmes
un montón de números que no lo son.

**Se sacó el corte: el margen va siempre.** Sin umbral no hay arbitrariedad, y
el ancho del paréntesis pasa a ser el semáforo. `50.0% (24–76)` sobre 10 jugadas
y `50.0% (39–61)` sobre 74 son el mismo 50% y se ve cuál sirve.

El costo, asumido: **todas las filas pasan a dos renglones** y las tablas crecen
de alto. `NMIN` desapareció del código; el único piso que queda es
`NMIN_MEDIANA = 5`, que es de otra clase de número.

### La columna se llama "Tasa"

Un `%` solo, en una columna ancha, flota sin decir de qué es. `Tasa` nombra la
cantidad y de paso le da cuerpo al encabezado. **La tabla de reparto se queda
con `%` a propósito**: ahí el número no es una tasa sino qué parte del total es
cada fila.

Medido a 412 px con 1, 2 y 3 dígitos y con los tres mezclados: encabezado y
números alinean en todos los casos.

### El comentario que se imprimió en pantalla (v0.51)

Al hacer ese cambio metí el comentario que explica por qué dice "Tasa"
**adentro del template literal**. Ahí `/* … */` no es un comentario: es texto, y
se imprimió en el medio de la tabla. Había otro igual en `tablaReparto`, así que
**cinco tablas mostraban un párrafo de código en pantalla**. Lo vio el usuario.

**Ni las pruebas ni la verificación en el navegador lo agarraron**, y eso es lo
que hay que aprender: las pruebas miran cadenas del fuente, y la medición de
alineación miraba `thead th` y `tbody tr` —el texto suelto caía justo afuera de
las dos—. Además, en esa tanda verifiqué el cambio *estrechamente*, midiendo la
alineación, y no miré la pantalla.

Hay chequeo estático: **"sin comentarios adentro del HTML"**, que busca
`/* … */` dentro de cualquier `innerHTML = \`…\``. Se comprobó que falla
reintroduciendo el error a propósito: un chequeo que pasa con el código limpio
pero no atrapa el caso real no sirve de nada.

**Regla que sale de acá:** un cambio que toca lo que se dibuja se mira en la
pantalla, no solo se mide.

### El margen va abajo del número, y es por alineación (v0.49)

Lo reportó el usuario desde el celular: *"hay filas con números fijos y otras
con márgenes, y queda raro. Además, no queda alineado con la columna %"*.

Las dos cosas eran **el mismo problema**. Con el paréntesis al lado, lo que se
pega a la derecha de la celda es el paréntesis, así que el porcentaje de esa
fila queda corrido respecto de los demás; y el encabezado `%`, que también se
alinea a la derecha, termina alineado con el paréntesis en vez de con los
números.

**Se midió en el navegador antes de elegir**, sobre los números reales del
usuario:

| | encabezado `%` | los cuatro porcentajes |
|---|---|---|
| al lado (v0.48) | 334 | 334, 334, 334, **299** |
| centrado *(idea del usuario)* | **304** | 315, 315, 315, **299** |
| reservándole ancho al paréntesis | **334** | 291, 291, 291, 291 |
| **abajo (elegida)** | 334 | 334, 334, 334, 334 |

**Centrar no alcanzaba**: el problema no es de qué lado se alinea la celda sino
que las celdas tienen anchos distintos. Y **reservarle un ancho fijo al
paréntesis** alineaba los números pero dejaba el encabezado peor todavía — era
la alternativa que yo consideraba válida, y la medición la descartó.

Abajo, además, no gasta ancho —que es lo escaso en un celular—, deja el
paréntesis subordinado al número en vez de compitiendo al lado, y repite un
patrón que ya estaba en la app: el encabezado `Seg. / mediana`.

`.rango` tiene que seguir siendo `display: block` y **sin espacio antes del
`<span>`**, o el renglón del paréntesis abre con un hueco. Hay prueba de las dos.

### Un chequeo estático que se arregló de paso

"Cada tabla tiene leyenda" miraba una **ventana de 200 caracteres** antes de
cada tabla. Agregar el interruptor la corrió y el chequeo falló sin que hubiera
nada mal. Ahora mira el tramo **desde la tabla anterior hasta esta**: no tiene
número mágico y además es más fuerte, porque exige leyenda **propia** y no la de
la tabla de arriba.

## 4quaterdecies. La curva de quién va ganando (v0.58)

Era el primero de los tres pendientes de §8, y el enunciado decía qué faltaba:
*"el dato ya está en las filas y no cuesta una corrida más; falta decidir cómo
se dibuja —el eje comprimido, porque un +9 aplasta todo lo demás—, dónde va, y
si las categorías se marcan encima como puntos."* Las tres decisiones, y por qué.

### El eje vertical es `winPct`, no los centipeones

Era el problema declarado y se resuelve sin inventar nada: `winPct` **ya está en
la app**. Es la que llena la barra de evaluación y la que da la caída en puntos
de victoria, así que la curva y la barra dicen literalmente lo mismo y no hay
una escala nueva que aprender.

Comprime sola, que es lo que se pedía: con `TOPE` en 1000 centipeones los
extremos caen en 2,5% y 97,5%, o sea que **la línea nunca toca el borde** —ni
con mate— y siempre se ve. Con centipeones crudos, un +9 contra un +0,50 deja a
la segunda pegada a la mitad y a la primera contra el techo.

Se descartó inventar un eje propio —logarítmico, o por tramos—: sería una
tercera forma de expresar la misma cantidad, después de los centipeones y de los
puntos de victoria, y habría que explicar cuál mira cada pantalla. Es el mismo
problema que la regla 9 de §5 evita adentro de una tabla: dos jueces para lo
mismo dan filas que leídas en voz alta no cierran.

### Hay N+1 puntos, y el punto 0 no se supone

El punto 0 es la posición **antes de la primera jugada**, y sale de `franja`
—`antesMio`, en peones desde el que mueve—, no de dar por hecho que la partida
arranca igualada. Un PGN desde una posición cualquiera arranca donde arranca, y
uno que empieza con negras también. Hay prueba de las dos cosas.

### Dónde va: pegada arriba de la tira de jugadas

Todo lo que está arriba en `zonaRevision` habla de **una** jugada —el tablero, el
veredicto, las tres métricas, las señales—; la curva y la tira de jugadas
recorren la **partida entera**. Puestas juntas quedan las dos formas de moverse
por la partida una al lado de la otra, y el corte entre "esta jugada" y "toda la
partida" cae en un solo lugar.

Cuesta 46 px de alto y no le saca ninguno al tablero.

### Las blancas van siempre abajo, aunque el tablero esté girado

La barra se da vuelta con el tablero porque **está pegada a él** y tiene que
acompañarlo. La curva no está pegada a nada, y dar vuelta un eje de tiempo a
mitad de camino deja al usuario sin saber qué mitad está mirando. Cuál de las
dos jugadas es la tuya lo dicen las marcas, que es para lo que están.

### Sí se marcan las categorías, pero seis de diez

Marcar las diez alfombra la tira: "Mejor", "Excelente", "Bien", "Libro" y
"Forzada" son la enorme mayoría de las jugadas, así que marcarlas no distingue
nada. Quedan las seis que vale la pena buscar —Brillante, Genial, Imprecisión,
Error, Omisión y Error grave—, en `CATS_EN_LA_CURVA`.

La marca se filtra con la **misma regla de lado que la tira de jugadas**: solo
las jugadas propias, salvo que esté puesto "Pintar las dos" o que no se sepa de
qué lado jugaba el usuario. Si las dos reglas se separaran, la curva marcaría en
color jugadas que la tira pinta en gris. Hay una prueba que fija que comparten
`lado` y `VER_AMBOS`, calculados una sola vez.

**Cómo se dibuja la marca es elegible desde la v0.59**, y por qué está abajo.

La forzada tapa a la categoría, igual que en todos lados: pasa por `presentar`,
así que una jugada grave que además era la única legal **no** se marca. No hubo
nada que decidir.

### Se toca para ir a esa jugada

Un manejador solo en el contenedor y la cuenta a partir del ancho, en vez de N
zonas invisibles: con 100 jugadas serían 100 rectángulos redibujados en cada
paso, y cada uno mediría 3 px, o sea menos que un dedo. Así el dedo cae siempre
en algo y la jugada la decide el redondeo. `jugadaEnLaCurva` es la inversa de
`ejeX` y está aparte del manejador para poder probarla sin un DOM.

Con esto la curva pasa de ser un dibujo a ser un **índice**: se ve dónde se dio
vuelta la partida y se va ahí de un toque, sin recorrer la tira de jugadas.

### La trampa del SVG: `preserveAspectRatio="none"` deforma el eje x

La tira se estira al ancho que haya, así que el SVG no conserva la proporción y
**todo se deforma en el eje x**. Lo que va adentro del SVG y lleva trazo —la
línea, la mitad, el "estás acá" y la raya— se defiende con
`vector-effect="non-scaling-stroke"`, que deja el grosor en píxeles de pantalla:
se ve igual de fino con 20 jugadas que con 200. Hay un chequeo que lo fija.

**Lo que NO se puede defender así es un círculo**, que saldría óvalo y de un
ancho distinto en cada partida. Por eso los puntos de la v0.59 **no van adentro
del SVG**: son elementos HTML posicionados en porcentaje encima de él. El
porcentaje se mide contra el contenedor, que no está deformado, y un
`border-radius` de CSS es un círculo de verdad. Van después del SVG en el HTML,
así que quedan encima sin necesidad de `z-index`.

### Las marcas: tres formas, elegibles (v0.59)

**La raya sola no aguantó el uso.** Con 28 unidades de alto y una partida de 77
jugadas —19 marcas— la tira se leía como un código de barras y tapaba la curva.
Lo reportó el usuario desde el celular, con la captura al lado: es exactamente
el tipo de cosa que ni las pruebas ni el arnés cazan, porque las dos miran una
partida de prueba de 36 jugadas y pocas marcas.

Se dibujaron cuatro variantes sobre una partida de 77 jugadas con las 19 marcas
en su sitio y se eligió mirándolas. **Quedaron tres**, elegibles y guardadas
igual que el tema del tablero y el modo de eval:

| forma | qué es | qué le pasa |
|---|---|---|
| **punto** (por defecto) | punto de 7 px con aro claro | el aro lo despega del fondo oscuro y separa dos marcas pegadas |
| **punto chico** | punto de 6 px, sin aro | más limpio; las que caen sobre lo oscuro pierden contraste |
| **raya** | la de la v0.58, **a la mitad de alto** | sigue siendo un trazo vertical compitiendo con la línea |

**La diferencia entre el punto y la raya no es estética.** Una raya vertical dice
*"acá pasa algo en todo este momento"* y un punto dice *"acá, en esta jugada"*.
Lo segundo es lo que la marca significa. Y además deja la raya vertical para una
sola cosa —el "estás acá"—, que con 19 rayas de colores al lado no se distinguía.

**Las marcas se dibujan DESPUÉS del "estás acá", en las tres formas.** En la
v0.58 no era así y la marca de la jugada que se estaba mirando quedaba tapada
justo por la raya que dice que la estás mirando, que es la única que nunca puede
desaparecer. Lo pidió el usuario y hay prueba del orden.

**Va en el renglón de controles de la vista Partida**, al lado del tema y del
modo de eval. Es una preferencia de *cómo se ven* las cosas, así que por la
regla de §4ter va a configuración; como esa pantalla no existe todavía (§8),
vive donde viven las otras dos y las tres se mudan juntas cuando exista.

**`MARGEN_MARCA` no es un número mágico:** es cuánto hay que correr la marca
para adentro cuando la curva está pegada al borde, y sale de su medio tamaño
sobre los 46 px de la tira. El punto con aro mide 10 px de punta a punta, o sea
11%. Media marca cortada se leería como una marca más chica, y ahí el tamaño
dejaría de significar lo mismo en todas.

### Qué es puro y qué no

`curvaVentaja` y `jugadaEnLaCurva` viven en el **bloque de análisis** y no tocan
el DOM: devuelven puntos y marcas, no dibujo. `dibujarCurva` arma el SVG y vive
al lado del tablero. Es el mismo reparto de siempre y es lo que deja probar la
geometría en node.

## 4quindecies. La explicación por jugada (v0.64)

Hasta la v0.63 la tarjeta del veredicto decía la misma frase para las 400
jugadas de un mes: "Empeora la posición". El mecanismo lo contaba la línea de
señales, en telegrama y sin nombrar la jugada —"la pieza movida queda
comible"—. Lo que falta va en §8: chess.com escribe una frase por jugada.

`explicarJugada(f, mejorSan, mio)` la redacta. Es **pura**, vive en el bloque de
análisis y se prueba en node.

### Se deriva al pintar, y por eso no hay migración

La explicación **no se guarda en ningún lado**. Lo que está en la caché son las
evaluaciones, no las filas, así que una partida analizada hace un mes estrena el
texto sin volver a correr el motor y sin tocar el esquema. Es la misma razón por
la que "todo lo analizado" puede cambiar de modo sin rehacer el barrido (§4.4:
la caché guarda evaluaciones, no veredictos).

Lo que sí hubo que agregar a la fila son **cuatro campos que ya se calculaban y
se tiraban**: `oportunidad`, `cap`, `mateContra` y `unicaBuena`. Hasta la v0.63
lo único que salía de ahí eran las señales, que son texto ya armado y no se
puede volver a redactar. Ninguno entra a `CAMPOS_FLACOS`: la explicación vive en
la revisión, que trabaja sobre filas enteras.

`unicaBuena` en la fila es, de paso, **lo que §8 pedía** para estratificar por
dificultad: estaba calculado y no se emitía.

### La regla que la gobierna: no se afirma nada que no esté medido

Es §5 regla 1 aplicada a una frase en vez de a un número, y es lo que separa
esto de escribir lindo. "Debilita el enroque" o "gana espacio" **no se pueden
decir** por más que suenen a entrenador: no los medimos. Cada frase sale de un
campo que calculó chess.js o el motor.

De la misma regla sale que **devuelve `""` cuando no hay nada honesto que
decir**, en vez de rellenar. Una frase de relleno en todas las jugadas enseña a
no leer la tarjeta, y entonces la que sí importa tampoco se lee.

**Como mucho dos frases.** Es una tarjeta de celular y compite con el tablero
por la pantalla. El orden decide cuáles dos sobreviven: mérito, mecanismo, qué
había, rumbo.

### Las decisiones de redacción que hubo que tomar

| decisión | por qué |
|---|---|
| el saldo va en **peones**, no en "puntos" | la tarjeta ya dice "12,3 puntos de victoria" un renglón más arriba; dos "puntos" con significados distintos en la misma tarjeta es el error de denominadores de la columna "% resto" |
| la pieza se nombra **solo si no hay recaptura** (v0.67) | sin recaptura, chess.js dice exactamente qué cae y decirlo es más claro que cualquier número; con recaptura lo que queda es un saldo, y nombrar la pieza mentiría porque cobrás una y entregás otra |
| el rumbo usa **`banda`**, la que ya decide "Genial" por cruce | inventar una segunda escala de "cómo va la partida" sería tener dos respuestas para la misma pregunta en la misma pantalla |
| **solo se tutea la pieza** ("tu caballo"), el resto queda impersonal | con un PGN pegado no se sabe de qué lado jugaba el usuario, y una frase que tutea a medias se lee peor que una que no tutea nunca |
| una **forzada** no se explica | no hubo decisión; cualquier cosa que se agregue juzga algo que no se eligió |

**Y la que evita mentir:** "Genial" se dispara por dos motivos distintos
—`unicaBuena` o el cruce de banda— y **solo uno de los dos significa "no había
otra"**. La frase "Era la única" sale únicamente cuando entró por el hueco;
cuando entró por el cruce, el mérito lo cuenta el rumbo. Sin esa distinción, la
mitad de los Geniales afirmaría algo falso, y hay prueba que lo fija.

### El mate en contra y la evaluación saturada

Con mate forzado —a favor o en contra— el rumbo **se calla**. La evaluación está
topeada en 1000, así que "pasa de ganando a ganando" sería falso de puro
saturado. Es el mismo tope que ya obligó a tratar el mate aparte en la barra
(v0.62) y en la categoría (v0.53).

### Dónde va: decidido en la v0.72, y los números se fueron

El interruptor de tres posiciones vivió de la v0.64 a la v0.72 y cumplió su
función, igual que el de margen contra gris de la v0.48: estaban las tres
puestas, el usuario las miró en el celu y eligió.

**Quedó una sola forma: la explicación OCUPA EL LUGAR de la frase fija de la
categoría, pero con el aspecto que tenía cuando iba aparte** —tinta de texto
normal, renglón propio, concepto tocable—. Las dos nunca aparecen juntas: cuando
hay explicación va ella, y cuando no, la frase fija en gris. Repetirlas sería el
eco que la v0.44 le sacó a las leyendas.

**Y de la misma mirada salieron los números.** La tarjeta decía "pierde 0.00 (0
cp) · 0.0 puntos de victoria" mientras los cuadritos de abajo decían PÉRDIDA
`0.00` y CAÍDA `0 pt`: **el mismo número dos veces a un dedo de distancia**, y
uno de los dos era la única cosa de la tarjeta que no cambiaba de jugada a
jugada. Lo vio el usuario.

Con ellos se fue **el caso especial de la forzada** de la v0.54: existía para
que una jugada sin elección no mostrara números que invitaran a juzgar algo que
no se decidió, y ahora no los muestra ninguna. La regla sigue viva en
`explicarJugada`, que en una forzada devuelve vacío.

**No se perdió nada de la pérdida**: 166 cp son 1,66 peones, que es lo que el
cuadrito PÉRDIDA dice con sus dos decimales. Lo pensé al revés al escribirlo y
lo corrigió el usuario.

**Lo que sí se perdía era un decimal de la caída**, y se arregló en la v0.72.1:
el cuadrito redondeaba a entero —"21 pt"— mientras la tarjeta decía "20,9". No
es adorno: la caída es la medida en la que se apoyan el modo amigable y la
precisión, así que redondearla borra la diferencia justo en el rango donde una
imprecisión y una jugada buena más se parecen.

### Cuánto habla, y qué se hizo cuando hablaba poco (v0.67)

En la v0.64 hablaba en **5 de 36 jugadas** del arnés. El usuario lo marcó como
un problema de uso, y tenía razón: una tarjeta que casi siempre calla es una
tarjeta que no se lee. **La respuesta NO fue aflojar la regla** —seguir sin
afirmar nada que no esté medido— sino **medir más cosas de las que ya estaban
calculadas y se tiraban**. En la v0.67 habla en **34 de 36**.

Las cuatro que se agregaron, todas de datos que ya existían:

| frase | de dónde sale | por qué recién ahora |
|---|---|---|
| "se llevaba el caballo" | `hecho.captured` de chess.js | estaba en `capturaBuena` y no se devolvía; la app decía "ganaba 3 peones", que es cierto y no se entiende |
| "ganaba 4 peones en el cambio" | `gana` distinto del bruto | cuando hay recaptura, nombrar la pieza **mentiría**: cobrás la dama y entregás la torre |
| "Es una recaptura: el material ya estaba perdido" | `esRecaptura` | ya se usaba para sacarle falsos positivos a "Genial" (§8) y nunca se le había dicho al usuario |
| "El rival tiene Nc6" | `evs[i + 1].mejor` | **la mejor de la posición siguiente ya estaba evaluada** y no se emitía |

La última es la que más cambia el uso, y no cuesta una sola llamada más al
motor: es la mejor jugada de la posición que quedó, que el motor calculó igual.
Además **es la puerta a la variante**: la tarjeta te nombra la jugada que vas a
querer probar, y el tablero ya se toca.

**El orden importa y está elegido:** mérito, mecanismo, qué había, rumbo,
la alternativa, la respuesta del rival. Las dos últimas van al final porque casi
siempre existen: adelante taparían a todo lo demás. Y la alternativa **no se
dice si la frase anterior ya nombró esa jugada** — "Había mate forzado en 8, con
Rd5. La mejor era Rd5." es el mismo eco que la v0.44 le sacó a las leyendas.

**Sigue devolviendo vacío cuando no hay nada honesto que decir.** Son 2 de 36, y
son las jugadas donde la partida ya terminó.

### Mirar la posición, y no solo la fila (v0.68)

El usuario pasó cinco capturas de la revisión de chess.com. Lo que dicen ahí es
de otra clase que lo nuestro: *"Echas al alfil rival con un peón"*, *"Parece que
dejaste un peón sin defender"*, *"ganar un caballo a través de un ataque
doble"*. **No son números de la jugada: son cosas que se ven en la posición.**

`observarJugada(f)` las mira, y **NO vive en `derivarFilas`**. Esa es la decisión
de fondo y es lo que la hace posible:

> `derivarFilas` corre en el bucle que recorre un año de partidas, así que todo
> lo que se meta ahí se paga cientos de miles de veces. **La explicación se
> arma al pintar UNA tarjeta**, así que ahí se puede gastar: dar vuelta el turno
> del FEN, pedirle jugadas a chess.js quince veces, recorrer el tablero entero.
> Es la misma división que la app ya tenía —`derivarFilas` calcula lo que las
> TABLAS miden— dicha de nuevo para lo que se describe.

Lo que mira hoy:

| observación | cómo se calcula | por qué así |
|---|---|---|
| **qué ataca la jugada** | se da vuelta el turno del FEN y se le piden a chess.js las jugadas de la pieza que se movió | después de mover es el turno del rival, y las jugadas de mi pieza no se pueden pedir de otra forma |
| **qué pieza mía queda colgada, que no es la que moví** | `quedaComible` sobre cada pieza propia | es el error más común de todos, y hasta la v0.67 la app **solo miraba la pieza movida**: te podías dejar la dama en otro lado y la tarjeta hablaba del peón que empujaste |

**Dos trampas del turno dado vuelta**, las dos anotadas en el código:
- **el paso al vuelo hay que limpiarlo**, o el FEN es inválido;
- **si la jugada da jaque, chess.js ofrece capturar al rey.** Se saca de la
  lista: atacar al rey es dar jaque y eso ya lo dice el propio SAN con su "+".

**Solo cuenta atacar algo que vale MÁS que la pieza que movés.** Atacar algo que
vale igual o menos es una oferta de cambio, no una amenaza: el rival no está
obligado a nada. Es lo que hace que la frase no se dispare en cada jugada.

### No te lo explica, te lo muestra (v0.69)

Otra captura del usuario, y es la que más cambia el diseño: cuando chess.com
resalta una palabra —"indefenso"— **no te la explica, te la MUESTRA**: la
posición de la que habla queda encendida en el tablero. No es un glosario.

Así que **la explicación dejó de ser una cadena y pasó a ser una lista de
partes**, cada una con su referencia: `{ txt, sq }` para una pieza y
`{ txt, uci }` para una jugada. `explicarJugada` sigue existiendo y es el join
de las partes, así que todo lo que la probaba sigue valiendo.

**La frase entera es el botón, no una palabra suelta.** En un celular una
palabra de seis letras es un objetivo de 40 px y la frase entera es de 300. El
subrayado punteado dice "esto se toca" sin convertir el texto en un bloque de
color; el fondo ámbar aparece recién al tocarla, y es el mismo ámbar que se
enciende en el tablero.

**El ámbar es el cuarto color y no pisa a ninguno**: azul es lo que se jugó,
verde lo que decía el motor, violeta lo inventado, ámbar lo que la frase está
señalando. El resaltado de casillas va **debajo de las piezas** —es un fondo, no
una marca— o taparía justo la pieza de la que habla.

### Comparar antes contra después (v0.69)

`observarJugada` ahora recibe también la posición de ANTES, y eso es lo que
separa **"esto pasa"** de **"esto lo causó la jugada"**. Es la frase de la
captura: *"tu peón estaba defendido, pero ahora está indefenso"*. Sin la
comparación, una pieza que venía colgada de tres jugadas atrás se le echaría a
esta.

De ahí salen dos frases nuevas, y son espejo una de la otra:

| frase | cuándo |
|---|---|
| "Tu peón de e4 queda sin defender." | estaba defendido y **esta jugada** lo dejó solo |
| "Salva tu peón de e4, que estaba sin defender." | estaba colgado y **esta jugada** lo defendió |
| "Saca tu peón de e4, que estaba sin defender." | estaba colgado y la jugada **lo movió**, que no es lo mismo que defenderlo |

La segunda es la que faltaba para poder decir algo de **las jugadas del rival**:
*"tu rival defendió su peón amenazado"* es media revisión de chess.com.

**Sin la posición de antes, `nuevas` y `salvadas` quedan vacías en vez de
adivinar**, y hay una prueba que lo fija.

### La línea de señales se fue (v0.73)

Era un renglón entre los cuadritos y la curva que **aparecía y desaparecía**
según la jugada, así que la curva y la lista de jugadas **saltaban unos píxeles**
al pasar de una a otra. Una pantalla que se mueve sola se lee peor que una que
dice menos. Lo marcó el usuario.

**Y no dice menos, y eso se midió antes de sacarlo**: 405 jugadas de las cuatro
partidas de prueba, con cinco juegos de evaluaciones inventadas cada una para
caer en muchas categorías; de las 29 que traían señales, **ninguna decía algo
que la tarjeta no dijera** —y la tarjeta lo dice mejor, porque nombra la pieza y
la casilla—. La prueba que lo fija corre ese mismo barrido, así que si alguna
vez una señal deja de estar cubierta, se cae ahí y no en el celu.

Lo único que la explicación no dice es la **segunda opinión a más profundidad**,
que no es una señal sino un dato del análisis. El renglón sigue existiendo solo
para eso, y como el barrido está apagado en modo simple, **en la app del usuario
no aparece nunca**: la disposición no se mueve.

### El botón dice qué hacer ahora (v0.68)

Lo primero que se ve en las capturas de chess.com no es el texto: es que **el
botón grande cambia con el veredicto**. Jugada buena, verde y dice "Siguiente";
jugada mala, rojo y dice "Reintentar".

Acá es el mismo mecanismo con los tres botones grandes —`‹`, "Probar otra",
"Siguiente ›"— y **el color no decora: dice cuál de los dos es**. Rellenos y no
solo con borde, porque en una fila de botones iguales el que importa tiene que
ganar por peso y no por matiz.

Esto es lo que la variante necesitaba: hasta la v0.67 "Probar" era un botón
chico entre las perillas, o sea una función escondida. **La jugada mala es
justo la que da ganas de probar otra cosa**, así que ahí la app la propone.

**El criterio es `CATS_PARA_REINTENTAR` y NO `esMala`**, y la diferencia importa:

- `esMala` (`perdida >= 3`) contesta *"¿esto cuenta como jugada mala en la
  estadística?"* y **mueve los números de todas las tablas**;
- `CATS_PARA_REINTENTAR` contesta *"¿le ofrezco al usuario volver a jugar esta
  posición?"*, y ahí una imprecisión también cuenta —es lo que hace chess.com—.

Tocar ese conjunto no toca ningún número: solo cuál botón es el grande.

**Y el botón NO nombra la jugada.** "En vez de Qh5+" se probó, se miró la
captura y se partía en dos renglones, saliéndose de los 48 px. Además era
redundante: el título de la tarjeta, dos dedos más abajo, ya dice "15. Qh5+ —
Error grave". El botón dice qué **hace**; qué jugada reemplaza lo dice la
pantalla.

## 4sexdecies. Probar jugadas: la variante (v0.65, rehecha en la v0.66)

El "Reintentar" de chess.com, pero navegable. En la v0.65 se probaba **una**
jugada y ahí terminaba. El usuario pidió tres cosas que son la misma: encadenar,
poder jugar también las del rival, e ir y volver por lo inventado. Y dio el
criterio de fondo, que ordena todo lo de abajo: **la experiencia de uso primero**.

### Las tres reglas de fondo, que no cambiaron

**1. No toca nada guardado.** No escribe en `R.filas` ni en la caché. Cada
jugada inventada se juzga con `derivarFilas` —el mismo llamado de una jugada
suelta que ya hacía la segunda opinión del barrido— así que trae categoría,
señales y explicación **sin una línea de código paralela**: el día que cambie
cómo se juzga una jugada, cambia también acá. La variante se tira al salir.

**2. Se evalúa a `R.profBase`**, la profundidad de la partida. Números de
distinta profundidad no se comparan (§5.3).

**3. Una evaluación por jugada, no dos.** La posición de la que sale cada jugada
**ya está evaluada**: es la de arranque para la primera —que viene de la
partida— y la que dejó la anterior para el resto. Encadenar diez jugadas cuesta
diez llamadas al motor, no veinte, y eso es lo que hace que encadenar sea usable
en un celular. Ir y volver por la variante no llama al motor ni una vez.

### Dos puertas, porque son dos preguntas

| pregunta | puerta | arranca en |
|---|---|---|
| *"¿y si en vez de esto jugaba otra cosa?"* | el botón, que **nombra la jugada**: "Probar en vez de Re1" | la posición **antes** de la jugada |
| *"¿y ahora qué?"* | **tocar una pieza**, sin abrir nada | la posición **después**, o sea la del rival |

La segunda es también la que contesta "probar las del rival", que era el pedido:
en la posición de después le toca a él. Y el botón **nombra la jugada que
reemplaza** porque sin eso no se sabe desde qué posición arranca, y el tablero
saltando una jugada atrás al tocarlo se lee como un error.

### Las zonas de toque de los galones se fueron

El comentario de la v32 lo venía anunciando: *"se comen los 10 px exteriores de
las columnas a y h… si alguna vez se puede tocar una casilla, hay que
reducirlas"*. Llegó ese día y **no se redujeron: se sacaron**.

El criterio, que es del usuario y sirve para más cosas que esta: **tocar una
pieza gana sobre tocar para navegar, porque navegar tiene otros cuatro caminos
—el deslizamiento, los botones, la tira de jugadas y la curva— y el toque sobre
la pieza no tiene ninguno.**

**El dibujo del galón se queda.** Es lo que avisa que el tablero se desliza, que
es para lo que la v32 lo puso; lo que se fue es el rectángulo invisible que
recibía el toque. Sacar también el dibujo dejaría el deslizamiento sin nada que
lo anuncie, y eso es lo que la v32 ya había resuelto.

### Anterior y siguiente recorren la variante

Adentro de una variante, los botones y el deslizamiento se mueven **por la
variante**. Es la misma promesa de siempre —la posición anterior y la
siguiente— y no dos botones que significan una cosa u otra según dónde estés: lo
que cambia es qué línea se está recorriendo. De la variante se sale por el
botón, que es lo único que dice "volver".

La **tira de la variante** vive adentro de su tarjeta y lleva el símbolo y el
color de cada categoría, igual que la tira de jugadas de la partida. Envuelve en
vez de scrollear: un carrusel horizontal adentro de una tarjeta que ya vive
adentro de una página que scrollea son tres scrolls encimados.

Jugar estando parado en el medio de la variante **corta lo que venía después**,
que es lo que hace cualquier tablero: la continuación que había ya no sale de
esa posición.

### Los colores no se mezclan

**Azul es una jugada de la partida y violeta una inventada**, y nunca hay las
dos a la vez: parado en el arranque de la variante hay azul —lo que se jugó de
verdad desde ahí, que es contra lo que se compara— y no hay violeta; una jugada
adentro, al revés, porque la partida ya no pasa por esa posición.

Por el mismo motivo **la comparación contra la jugada real es solo para la
primera** de la variante: de la segunda en adelante la posición ya no es la de
la partida, así que no hay contra qué comparar.

### Lo demás

- No se puede probar mientras corre un análisis: los dos usan el mismo grupo de
  motores y `pool.asegurar` puede cambiarle el MultiPV o el Hash a motores que
  están trabajando, que es justo lo que §4.2 midió. El botón se apaga desde
  `ocupado()`.
- La coronación va a **dama** y no pregunta. Es el caso más raro de todos y
  preguntar es una pantalla entera; si alguna vez hace falta subascender, se
  agrega ahí.
- Salir de la jugada por cualquiera de los caminos de la partida —la tira, la
  curva— cierra la variante, y eso vive en `irA` porque ahí pasan todos.

### Dos cosas que se decidieron mirándolas (v0.71)

- **El borde de la tarjeta se queda con el color de la categoría.** Se dibujaron
  las dos —esa y el violeta siempre— y el usuario eligió la primera. El violeta
  queda solo para el estado en que todavía no hay categoría, o sea mientras el
  motor piensa. Que el borde y la flecha del tablero dejen de hacer juego es el
  precio, y se aceptó: la categoría dice más.
- **La tira de la variante no tiene eslabón para la posición de arranque.** Lo
  tuvo, decía "◂ desde acá", y lo sacó el usuario: para volver al arranque ya
  están el botón `‹` y el deslizamiento, así que era un tercer camino para lo
  mismo ocupando el lugar más visible de la tira. Parado en el arranque no hay
  ningún eslabón marcado, y eso se lee solo.

### Una tarjeta y no dos, y el dial de las cuatro formas (v0.76)

Reportado por el usuario mirando el celu: **con una prueba abierta había dos
tarjetas apiladas** —la punteada de la prueba arriba y la de la jugada real
abajo— y pidió que la punteada **reemplace** a la real en vez de sumarse.

Eso está hecho y no es un dial: con una prueba abierta la tarjeta real se
esconde. **Cuesta poco y por eso se pudo hacer entero**: la comparación contra
lo que se jugó de verdad ya viaja en la punteada —`pierde 0.00 · en la partida
exd4 pierde 1.66`— y de la segunda jugada de la variante en adelante no hay
contra qué comparar, así que ahí la tarjeta real no estaba diciendo nada.

**Lo que no se pudo decidir mirando capturas es dónde van las jugadas
probadas.** Hoy son una tira que envuelve en dos renglones adentro de la
tarjeta. Se dibujaron cuatro formas a 412 × 760 y el usuario no eligió: *"no me
decido, y creo que esta va a ser mejor probando la app"*. Así que van las
cuatro, en un dial, y se decide usando la app — la regla de §10, la misma que
resolvió margen contra gris en la v0.48 con un interruptor que duró dos
versiones.

**Lo que ocupa cada cosa, medido con el arnés** sobre una pantalla de 760: la
tarjeta real son **92 px** y la tira de jugadas probadas otros **58**.

| forma del dial | la real | las probadas | recupera |
|---|---|---|---|
| **Prueba: sin la lista** *(por defecto)* | se esconde | no se ven | 150 px |
| **Prueba: la lista adentro** | se esconde | adentro de la tarjeta | 92 px |
| **Prueba: la lista abajo** | se esconde | en la tira, en violeta | 150 px |
| **Prueba: las dos tarjetas** | se queda | en la tira, en violeta | 58 px |

Son **dos ejes** —¿reemplaza o conviven? y ¿dónde van las probadas?— y de ahí
salen las cuatro. El por defecto es "sin la lista", que es la más limpia.

**La forma "abajo" mueve una decisión ya tomada, y por eso es la que hay que
mirar con más cuidado.** Este mismo documento dice que la tira de la variante
vive adentro de su tarjeta "y no al lado de la otra": esa forma la pone
justamente ahí. La tira **corta la partida en el punto donde se abrió la
prueba** y sigue con lo inventado, en violeta —el color que ya significa
"inventada" en la flecha del tablero—, con un corte punteado igual al borde de
su tarjeta. Lo jugado de verdad queda a la izquierda del corte y se llega
scrolleando, igual que a todo el resto de la tira.

Dos cosas que hubo que resolver ahí, y las dos por el mismo motivo —**no puede
haber dos "estás acá" en el mismo renglón**—:
- adentro de la variante **ninguna jugada de la partida queda marcada**: la
  elegida es una inventada. Parado en el arranque, al revés: no hay ninguna
  inventada marcada y la elegida vuelve a ser la de la partida.
- **el cierre de la tira no va mientras se prueba.** Dice cómo terminó la
  partida, y la partida inventada no termina así.

El centrado automático sale gratis: `centrarTira` centra la elegida, sea de la
partida o inventada.

**El dial se va cuando el usuario elija.** Con él se van las otras tres formas,
las dos pruebas que lo fijan y el bucle de capturas del arnés. Queda anotado
acá para que el que lo saque sepa qué sacar.

### Lo que quedó abierto

- **Dónde van las jugadas probadas.** Es lo que el dial de la v0.76 está
  preguntando: adentro de la tarjeta, abajo en la tira, o no mostrarlas. Se
  decide usando la app en el celular.
- **La variante no se guarda.** Al salir se tira. Guardarla —para volver a una
  línea que encontraste— es otra tanda y toca la caché.

## 4septdecies. La vista Partida, rehecha (v0.74)

Se dibujaron **seis distribuciones completas** a 412 × 760 antes de tocar una
línea de `index.html`, moviendo el DOM de la página abierta desde el arnés. El
usuario las miró en el celular y eligió. Es la misma regla de §10 que ya había
ganado dos veces, aplicada esta vez a la pantalla entera.

### El orden, y por qué

```
cabecera · barra · TARJETA · tablero · tira · curva · cuadritos · controles
```

**La tarjeta va ARRIBA del tablero**, y es lo que ninguna de las otras cinco
distribuciones probaba. Se lee primero: bajás la vista, encontrás el veredicto y
recién entonces mirás la posición, que es el orden en el que uno mira —"¿qué
pasó?" y después "a ver…"—. Con la tarjeta abajo llegás a ella después de haber
mirado el tablero sin saber qué buscar.

Y entra todo en una pantalla, sin scrollear.

### La lista vertical volvió a ser una tira horizontal

De la v28 a la v0.73 fue una lista vertical en pares. La tira horizontal que
había ANTES de la v28 se había ido por un motivo anotado: *"mostraba tres
jugadas por vez y obligaba a scrollear a ciegas"*. Esta no es aquella, y la
diferencia está en dos cosas que aquella no tenía:

1. **lleva la partida entera y se centra sola en la jugada actual**, así que
   nunca hay que buscar dónde estás;
2. **los galones dan el paso fino sin arrastrar**, y el dedo el paso grueso.

De la primera sale, sin ninguna regla extra, lo que pidió el usuario: **siempre
se ve que hay más para los dos lados cuando lo hay**, y en el arranque y el
final no se ve, que es la información correcta.

**El panorama de la partida pasa a ser la curva.** En la tira entran cuatro
jugadas, así que no puede ser el lugar donde se busca dónde se rompió la
partida; la curva lo hace mejor porque es un dibujo. Cada una hace lo que sabe:
la curva es para mirar, la tira para moverse.

### El desvanecido de las puntas

Sin recuadro alrededor de cada jugada, las de las puntas se cortaban en seco.
Una **máscara de degradado** de 24 px las disuelve contra el papel al acercarse
al galón, y eso dice "hay más para allá" sin dibujar nada. Es una máscara y no
opacidad sobre el elemento: no depende del color de fondo y anda igual con
cualquier tema de tablero.

### La tipografía se MIDE, no se estima

Tres veces seguidas la tira se vio corrida mientras las cuentas decían que
estaba centrada, y las tres el problema fue **el mismo**: se estaba midiendo la
caja del renglón, que incluye el espacio de las colas y las tildes, cuando lo
que el ojo alinea es **la mayúscula**.

Lo que quedó, en `medirTira()`:

- **el chevron se DIBUJA, no se escribe.** `‹` y `›` son comillas angulares: en
  casi toda tipografía se apoyan a la altura de la minúscula, así que la caja
  mide centrada y el dibujo se ve arriba. Dibujado es además la misma forma que
  los galones del tablero, que son el mismo gesto.
- **el vértice del chevron va al centro de la mayúscula**, y la altura de la
  mayúscula sale de `actualBoundingBoxAscent` de canvas.
- **la base del renglón se mide con una sonda** —un `inline-block` de alto cero
  apoya su borde inferior exactamente en la base— y no se calcula: calcularla
  obliga a suponer cómo reparte el interlineado el navegador.
- **el relleno del recuadro de la jugada actual se reparte** para que no
  sobresalga por abajo, que es lo que pasa al alinear por la base.

**No hay números fijos y no puede haberlos**: `system-ui` es Roboto en Android y
otra cosa en cada aparato, así que un número escrito a mano alinearía bien en
uno y mal en el resto.

**Y el orden importa**: primero el recuadro, después el galón. Repartir el
relleno **corre la base de todo el renglón** —con la alineación por base, la fija
el elemento que más sube por encima de ella—, así que el galón hay que
calcularlo contra la base nueva. Se ve en la medición: la corrección del
recuadro baja el renglón 0.8 px, y el usuario lo notó en una captura.

**Sin layout no hay medición.** La primera pintada pasa con `zonaRevision`
todavía oculta y todos los rectángulos dan cero: ahí se sale **sin** marcar la
medición como hecha, para que la próxima —ya visible— la haga de verdad. Sin esa
guarda la corrección quedaba congelada en un disparate.

### Lo que se fue, y lo que eso se llevó puesto

**La fila de botones grandes.** Vivía abajo de todo, o sea donde no se ve el
tablero, y el usuario lo resumió así: *"cualquier navegación que se haga sin ver
lo que se navega no sirve de nada"*. Con ella se fueron:

- el botón que **abría una variante "en vez de esta jugada"**. Ahora la única
  puerta es **tocar una pieza**, que arranca de la posición de después; para
  reemplazar una jugada propia se vuelve una con el galón y se toca ahí, que es
  lo mismo que hace el "Reintentar" de chess.com;
- el botón que **cambiaba de color según el veredicto** (v0.68) y con él
  `CATS_PARA_REINTENTAR`, que no usaba nadie más;
- el `disabled` que impedía probar durante un análisis: ahora es una bandera,
  `TRABAJANDO`, que mira el tablero. Lo que se apaga es el toque, no un botón.

**La salida de la variante vive en la tarjeta de la variante**, que es la única
pantalla que la necesita.

### El error que la regla de §10 agarró en el acto

Al reordenar, la barra de evaluación y la tarjeta quedaron **pegadas**: la barra
no tenía margen abajo y la tarjeta no tenía margen arriba, y hasta la v0.73 no
hacía falta porque entre las dos estaba el tablero. Es exactamente lo que dice
la regla: **mover un elemento le cambia los márgenes a sus DOS vecinos**.

## 4octodecies. Tres conceptos de ajedrez en la explicación (v0.75)

La v0.64 dejó la explicación hablando de **material y amenazas**: qué se comía,
qué quedaba colgado, qué se salvaba. Todo eso sale de contar piezas. Lo que
faltaba era lo que se ve **en la posición** y no en el conteo, y de la lluvia de
ideas del usuario salieron tres que se pueden **medir**:

- **la clavada** — `estaClavada(fen, sq, rey)`;
- **el peón pasado** — `esPasado(tablero, sq, color)`;
- **la columna abierta** — `columnaAbierta(tablero, sq)`.

Los tres viven en `observarJugada`, o sea **a la hora de pintar la tarjeta y no
en `derivarFilas`**. Es la misma división de la v0.64 y es lo que permite que
sean caros: el barrido de un año no los paga, y una partida vieja de la caché
estrena el texto sin migrar nada.

### Cómo se contesta cada uno

**La clavada se contesta sacando la pieza del tablero.** Si al sacarla el rey
queda en jaque, estaba tapando: eso es la clavada absoluta, y no hay que
enumerar líneas ni direcciones. El detalle que hace falta es que después de
sacarla hay que **poner el turno del color de la pieza** —`in_check()` mira al
que juega— y **borrar el al paso**, que con el tablero cambiado deja el FEN
inválido. Es la misma trampa del FEN dado vuelta de la v0.64, anotada de nuevo
acá porque volvió a aparecer.

Cargar un FEN por casilla es caro, así que antes va un **filtro geométrico**:
solo puede estar clavada una pieza que comparta fila, columna o diagonal con su
rey. De quince piezas quedan tres o cuatro.

**El peón pasado** mira su columna y las dos de al lado, **solo hacia adelante**.
Un peón rival que quedó atrás no lo frena, y hay una prueba para eso.

**La columna abierta no tiene peones de nadie.** Con un peón del rival está
*semiabierta*, que es otra cosa; decirle abierta sería afirmar algo que no es, o
sea §5 regla 1. Y la toman **la torre y la dama**: un caballo en una columna sin
peones no significa nada.

### Los tres se comparan contra ANTES

Igual que las colgadas de la v0.64: **lo que ya estaba no lo causó esta jugada**.
Si el caballo ya estaba clavado, la jugada no clavó nada; si el peón ya era
pasado antes de avanzar, tampoco. Sin esa comparación la tarjeta le atribuye a
la jugada la posición entera, que es la forma más fácil de mentir sin decir
ninguna falsedad.

### Un solo renglón para los tres, y por qué

En la tarjeta entran **como mucho dos frases**. Si cada concepto tuviera su
lugar en el orden, entre los tres taparían al mecanismo y a la alternativa, que
son las que dicen qué pasó y qué había que jugar. Así que hay **una sola ranura
`posicional`**, con un `if/else` que elige, y esa ranura entra al orden después
del ataque y antes del rumbo.

El orden adentro de la ranura es **cuánto cambia la partida**: la clavada obliga
al rival ya mismo, el peón pasado decide finales, la columna abierta es una
mejora.

### Lo que se dejó afuera a propósito

De la lluvia de ideas quedaron **sin hacer** —no descartados—: pieza atrapada,
jaque descubierto, ataque a la descubierta, columna semiabierta, peón pasado del
rival, la pareja de alfiles y el rey sin enrocar. **Pieza atrapada es la que más
dice y la que más fácil se equivoca** —hay que probar que todas las casillas de
escape están atacadas, y una casilla defendida no es lo mismo que una atacada—,
así que va aparte y con su medición.

Y quedaron **rechazados por no medibles**, que es distinto: "debilita el
enroque", "gana espacio", "iniciativa", "controlás el centro", "mejorás la peor
pieza". Suenan a libro y no hay número atrás; §5 regla 1 los deja afuera.

### La lluvia de la v0.77: qué entró, qué no, y por qué

Se hizo una lluvia de frases nuevas y el usuario las marcó una por una. Esto es
el resultado, y vale sobre todo por lo que dice que **NO** hay que volver a
proponer.

**Entran, y ninguna necesita datos nuevos:**

| frase | con qué se contesta |
|---|---|
| salir del libro | `aperturas.json`, que ya viaja en la fila |
| se corona | el SAN trae `=Q` |
| enrocaste | el SAN trae `O-O` |
| peón aislado | ningún peón mío en las columnas de al lado |
| peones doblados | dos míos en la misma columna |
| pieza atrapada | `quedaComible` en cada casilla adonde puede ir |
| jaque descubierto y ataque a la descubierta | la línea que abrió la casilla que dejé |
| la mejor era X **y qué hacía** | `mejor`, que ya está evaluada |

**Entran con condición**, y la condición es la parte importante:

- **"El rival acababa de errar"** solo si además dice **cómo se cobraba**. Decir
  que erró y no decir con qué no le sirve a nadie.
- **"Casi no había opción"** solo si las pocas jugadas legales eran **parecidas
  entre sí**. Y ahí hay un techo real: con MultiPV 2 el motor devuelve la mejor
  y la segunda, así que se puede afirmar que **las dos mejores** estaban
  parejas, nunca que "las tres eran lo mismo".

**Quedan para mirar, sin decidir:** caballo plantado (*outpost*), torre en la
séptima, se van las damas, torres conectadas, al rival le quedan pocas legales
(el aviso de ahogado), y los cuatro de la tanda corta —columna semiabierta, peón
pasado del rival, la pareja de alfiles, pierde el enroque—.

**No entran, y esto es lo que no hay que volver a proponer:**

- **"El rey rival se quedó en el centro."** Descartada por el usuario: *"suena
  raro"*. Es medible —perdió los dos enroques y sigue en la columna e— así que
  no se cayó por §5 regla 1 sino por cómo se lee.
- **Cuánto tardaste en jugarla.** El dato está (`seg`, desde la v0.43) y la
  frase salía sola, pero **no va a la tarjeta**: es del usuario la decisión, y
  lo que pidió en su lugar es **ver el reloj en el tablero**, que está anotado
  entre los pendientes de interfaz (§8).
- **Una palabra sola es muy seca.** Vale para toda frase de una palabra:
  "Coronás." tiene que decir algo más. Es criterio de redacción, no de medición.
  La forma elegida es `Coronás: el peón vuelve como dama.` — dice el mecanismo,
  que es lo que se puede aprender de una tarjeta.

### La jerga, que apareció explicando un concepto y quedó pendiente

Explicándole al usuario qué era "torre en la séptima" salió, de paso, **"los
chanchos en la séptima"** —las dos torres ahí—, y le gustó cómo suena: *"me gusta
la jerga. Quizás podamos apuntar nuestras frases a ese lado"*.

**Queda como pendiente y NO se rehace lo escrito.** Es su condición, y es la
correcta: las frases de la v0.64 a la v0.77 se redactaron y se miraron una por
una, así que reescribirlas todas para cambiarles el tono es una tanda propia y
con su propia mirada en el celu, no un arreglo al pasar.

Cuando se haga, la pregunta que hay que contestar primero es **hasta dónde**: la
jerga nombra conceptos que el jugador después reconoce en otros lados ("los
chanchos", "la clavada", "peón pasado"), y eso enseña; pero un texto que se
pasa de coloquial deja de poder decir un número. Es la misma tensión que §5
regla 1 resuelve para los datos, ahora sobre el tono.

## 4novodecies. Catorce conceptos más, y el dial de cuánto habla (v0.77)

La v0.75 dejó tres conceptos entrando por **una sola ranura**. La lluvia sumó
catorce más, y con eso la pregunta dejó de ser cuáles se pueden medir y pasó a
ser **cuáles caben**.

### Los catorce, y con qué se contesta cada uno

Ninguno necesita un dato nuevo ni una llamada más al motor: todos son barrer el
tablero o leer el SAN y el FEN, y viven en `observarJugada`, o sea a la hora de
pintar la tarjeta.

| frase | cómo se contesta |
|---|---|
| `Acá se terminó la teoría.` | la fila anterior es "Libro" y esta no |
| `Coronás: el peón vuelve como dama.` | el SAN trae `=` |
| `Enrocás y el rey se pone a salvo.` | el SAN trae `O-O` |
| `Pierde el enroque corto.` | el campo 3 del FEN, contra el de antes |
| `El peón de d4 queda aislado.` | ningún peón propio en las columnas de al lado |
| `Te quedan peones doblados en la c.` | dos propios en la columna adonde fue |
| `El caballo de d5 se planta: ningún peón lo puede echar.` | ningún peón rival puede llegar a atacarla |
| `La torre entra en la séptima.` | la fila de destino: 7 en blancas, 2 en negras |
| `Se van las damas del tablero.` | había damas antes y ya no |
| `Las torres quedan conectadas.` | se ven, sin nada en el medio |
| `Toma la columna semiabierta d.` | sin peones míos, con peones del rival |
| `Queda un peón pasado en contra en b5.` | `esPasado` mirando los del rival |
| `Te quedás con la pareja de alfiles.` | dos míos y el rival ya sin los dos |
| `Al rival le quedan 2 jugadas: ojo con el ahogado.` | jugadas legales del rival, sin jaque |

Tres decisiones adentro de esa tabla, que no son obvias:

- **`esAislado` mira las columnas ENTERAS y `esPasado` solo hacia adelante**, y
  es a propósito: un peón propio que quedó atrás igual puede venir a defender,
  pero un peón rival que ya te pasó no vuelve a frenarte.
- **El puesto avanzado pide estar del medio para adelante** —fila 5 o más en
  blancas—. Un caballo inechable en la propia fila 2 no es un puesto avanzado,
  es un caballo en su casa.
- **El aviso de ahogado solo sale si el que movió VA GANANDO.** Ahogar es un
  accidente del que gana; al que pierde, el ahogado lo salva, y avisarle sería
  avisarle de algo bueno.

### Los dos pesos, y la prueba que los destapó

El usuario los pidió: los conceptos que se agregaban "con un valor menor a la
hora de decidir cuál entra". Quedó así: **fuertes** —clava, peón pasado, corona,
aislado, doblados— y **menores**, que son los otros nueve.

**Y el peso no es solo entre ellos: es en todo el orden de la tarjeta.** Puestos
arriba, los menores ganaban lugares que no les tocaban, y eso lo agarró una
prueba que ya existía: `Pierde el enroque corto.` le tapó a `había Bxd7, que
ganaba 9 peones`. O sea que un concepto menor estaba tapando **una oportunidad
perdida**, que es de lo más caro que la tarjeta tiene para decir. Los menores
entran ahora **después de la alternativa**, y hay una prueba que lo fija.

### El dial: corta, media y larga

| posición | qué cambia |
|---|---|
| **corta** | una ranura: la posición y "cómo llegaste" compiten por el mismo lugar. Dos frases |
| **media** *(por defecto)* | dos ranuras, una para cada familia. Dos frases |
| **larga** | igual que media, y entra una tercera frase |

"Cómo llegaste" es la otra familia: no habla de la posición sino de cómo se
llegó a jugar eso. Hoy tiene **un solo miembro** —salir del libro— y en la v0.78
suma "el rival acababa de errar".

**Medido con el arnés sobre la partida de prueba entera (36 jugadas):**

| | jugadas que hablan | frases | la más larga |
|---|---|---|---|
| corta | 34 | 64 | 82 caracteres |
| media | 34 | 64 | 82 |
| larga | 34 | 80 | 119 |

**Corta y media dan IDÉNTICO, y el motivo importa:** la familia "cómo llegaste"
tiene hoy una sola frase y esa frase dispara **una vez por partida**. Así que
hasta la v0.78 el dial es en los hechos de dos posiciones, no de tres. Está
anotado para que nadie mida esto de nuevo esperando otra cosa.

### Lo que quedó afuera a propósito

- **"Acá se terminó la teoría" no nombra la apertura.** El nombre está —el libro
  trae 3810— pero viene con el código ECO y en inglés (`B01 Scandinavian
  Defense`), y la cabecera ya lo muestra. Meterlo en la frase la alarga y mezcla
  idiomas para repetir algo que está dos renglones más arriba.
- **La séptima no dice "los chanchos"** cuando están las dos torres. Es una
  línea, y no se hizo porque el tono es una tanda propia (la jerga, en
  §4octodecies).
- **Los doblados que le quedan AL RIVAL** no se dicen, solo los propios.

## 4vicies. Los cinco caros, y la tarjeta que salió más barata (v0.78)

Las cinco que faltaban de lo acordado con el usuario. Las tres primeras miran
la posición y cargan FENs; las dos últimas usan datos que ya viajaban en la fila.

### Atrapar una pieza

`estaAtrapada(fen, sq)` pide **las dos cosas**: que la pieza esté comible donde
está, y que **no tenga ninguna casilla adonde ir** donde deje de estarlo. Eso es
exactamente lo que dice la frase —"no tiene salida"— y ni una palabra más: no
promete que no haya otra forma de salvarla (defenderla, tapar, contraatacar).

Quién contesta si una casilla es segura es `quedaComible`, y es el que sabe la
distinción que el traspaso venía avisando: **una casilla defendida no es lo
mismo que una casilla atacada**.

**Y una pieza CLAVADA no está atrapada, está clavada.** Esto se vio en la
pantalla, no en una prueba: la jugada 10 de la partida de prueba decía "Atrapa
el caballo de e4" cuando lo que pasaba era que estaba clavado contra su rey. Una
clavada **no tiene salidas legales**, así que cumplía la definición por el
motivo equivocado, y encima ya hay una frase que lo dice mejor. Se descarta con
`estaClavada` —no con la lista `clavadas`, que solo trae las nuevas: una pieza
clavada desde hace tres jugadas sigue sin estar atrapada—.

### Las dos descubiertas, y por qué hizo falta geometría propia

**chess.js no puede contestar si una pieza ataca al rey**: `moves()` nunca
genera la captura del rey, que es justo el caso que hace falta para saber si el
jaque lo da la pieza que se movió o una que estaba tapada detrás. Y el truco de
`estaClavada` —sacar la pieza del tablero y ver si queda jaque— **acá no sirve**:
sacarla también podría abrir la línea de otra pieza mía, y eso daría un
descubierto que no existe.

Por eso `ataca(tablero, desde, hasta)`, que es geometría pura y camina la línea
mirando bloqueos. Con eso:

- **jaque descubierto** = hay jaque y `ataca(donde, reyRival)` es falso;
- **ataque a la descubierta** = una pieza mía que antes no atacaba y ahora sí,
  **con la casilla que se dejó justo en el medio** de esa línea (`enElMedio`).
  Sin la condición del medio, cualquier ataque nuevo se llamaría descubierta.
  Y solo cuenta contra algo que vale más, que es el mismo criterio de las
  amenazadas: atacar algo que vale igual o menos es una oferta de cambio.

### El error del rival, y la condición del usuario

`El rival acababa de errar: Bb5 lo cobraba.` La condición la puso él y es la que
hace la frase: **solo si dice cómo se cobraba**. Cuando la jugada que se hizo ya
era la mejor no hay nada que ofrecer y la frase cambia a `El rival erró y lo
cobraste.`

**Solo se dice en las jugadas del usuario.** La frase habla del "rival" del que
movió: mirando una jugada del rival, el que erró antes es el usuario, y "el
rival acababa de errar" diría exactamente lo contrario de lo que pasó. Con el
lado desconocido —un PGN pegado— tampoco se dice.

Y **la imprecisión no cuenta como error**: "el rival acababa de errar" por una
imprecisión de 0,3 es prometer más de lo que pasó. Solo error, error grave y
omisión.

### Qué hacía la mejor

`La mejor era Bb5, que se llevaba un caballo.` El dato ya viajaba: `f.cap` lo
llena `capturaBuena`, que trae la pieza que se comía **y** la ganancia neta, ya
restada la recaptura. Por eso son dos frases y no una: *"se llevaba el caballo"*
cuando nadie recapturaba y *"ganaba 2 peones en el cambio"* cuando sí. Si la
mejor no era una captura buena no se agrega nada: no hay dato que decir.

**Y no se repite con el error del rival**: si la llegada ya nombró la mejor,
decir después "La mejor era Bb5" es el eco que la v0.44 le sacó a las leyendas.

### La tarjeta salió MÁS BARATA que antes, y ese es el número que importa

Sumar tres conceptos que cargan FENs debería haberla encarecido. Midiendo, lo
caro no era ninguno de ellos: era `colgadasDe`, que llama a `quedaComible` por
**cada pieza del color** y se llamaba dos veces por tarjeta.

**Una pieza que no ataca nadie no puede ser comible**, y eso se contesta con
geometría (`atacadaPor`) antes de cargar un solo FEN. Medido sobre la partida de
prueba entera, con el mismo arnés:

| | por tarjeta | la peor |
|---|---|---|
| v0.77, en vivo | 52,8 ms | 95 ms |
| v0.78, con los tres conceptos nuevos | **21,6 ms** | **51 ms** |

**2,4 veces más rápida**, con más para decir. El filtro no cambia ni un
resultado y eso se verificó, no se supuso: `colgadasDe` de las dos versiones
sobre las cuatro partidas de prueba, **170 llamadas comparadas, 0 distintas**.

Por qué el filtro no se puede comer un caso: toda captura que chess.js genera
—incluida la de peón que corona— cumple `ataca`. Al revés sí sobra alguna (la
captura al paso apunta a otra casilla), y sobrar no importa, porque lo que pasa
el filtro lo decide igual `quedaComible`. Hay una prueba con la captura que
corona, que es la que menos se parece a las otras.

## 4unvicies. La prueba no espera al motor (v0.79)

Pedido del usuario, y son dos cosas que resultaron ser la misma: *"que la
evaluación cargue de fondo, así no demora el dibujo en el tablero, y además, si
quiere probar varias seguidas, puede hacerlo"*.

Antes, tocar el tablero para probar una jugada hacía esto: se pintaba
"Probando Xx" en la tarjeta y ahí se esperaba al motor. El **tablero no se
movía** —la jugada todavía no estaba en la línea, así que `posicionVista`
seguía devolviendo la posición anterior— y cualquier toque nuevo **volvía sin
hacer nada**, porque `tocarCasilla` cortaba con la variante pensando.

### El estado pasó a vivir en cada jugada

Era de la variante entera —`estado: "pensando" | "eligiendo" | "error"`— y ahora
es de cada jugada de la línea: **tiene fila** (veredicto), **tiene error**, o
está pensando. Ese cambio es el que deja encadenar: con la lista de estados
separada, una jugada puede estar lista mientras la siguiente todavía piensa.

`probarJugada` ya no espera nada: mete la jugada en la línea sin veredicto,
pinta —y ahí el tablero ya muestra la jugada— y encola. **No es `async`, y hay
una prueba que verifica que no tenga un solo `await`**: es lo único que
garantiza que el dibujo no dependa del motor.

### La cola: de a una y en orden

De a una porque **el grupo de motores es uno solo** y `pool.asegurar` le puede
cambiar el MultiPV o el Hash a un motor que está trabajando, que es justo lo que
§4.2 midió. Y en orden porque **la jugada k se juzga con la evaluación de la
k-1**: eso es lo que mantiene la regla 3 de §4sexdecies —una evaluación por
jugada, no dos— encadenando diez.

Si una jugada falla, las que venían atrás no se pueden juzgar: se les pone el
error en vez de dejarlas pensando para siempre.

**Lo que vuelve tarde se descarta por IDENTIDAD, no por el largo.** Antes
alcanzaba con comparar `p.linea.length !== k`, porque solo podía haber una
jugada en el aire. Encadenando, el largo cambia todo el tiempo sin que la jugada
que volvió deje de ser la misma, así que ahora se compara el objeto:
`p.linea[k] !== e`. Es lo que hace que cortar la línea —jugar parado en el
medio— descarte sola la evaluación que ya no sirve.

### Cómo se ve una jugada sin veredicto

En las dos tiras —la de la tarjeta y la de abajo— la jugada **se dibuja igual**,
en gris y con `…` en lugar del símbolo de la categoría. Se ve lo que jugaste
mientras el motor piensa, que es lo que hace usable encadenar.

### Medido contra la versión en vivo

El arnés hace lo mismo en las dos: juega una prueba, mira la pantalla sin
esperar, y encadena otra encima.

| | v0.78 | v0.79 |
|---|---|---|
| la casilla de origen quedó vacía al toque (o sea, **el tablero ya movió**) | no | **sí** |
| eslabones en la línea después de encadenar dos | 6 (ninguna entró) | **8** |
| jugadas dibujadas sin veredicto todavía | 0 | **2** |

**El arnés necesitó un motor falso que TARDE.** Contesta en el mismo tick, así
que sin demora todo parece instantáneo y no se puede mirar lo único que esta
versión cambia. Ahora demora 400 ms (`MOTOR_LENTO`) **solo en las posiciones que
no están en su tabla**, que son exactamente las jugadas inventadas: el análisis
de la partida no paga nada.

**Dos trampas que costaron una medición cada una**, anotadas para no repetirlas:

- **Mirar la casilla de DESTINO no sirve**: si la jugada es una captura, ahí hay
  una pieza en las dos versiones —la que se come— y el número da "sí" aunque el
  tablero no se haya movido. Se mira el **origen**, que o quedó vacío o no.
- **La tarjeta no es testigo del tablero.** La versión vieja también decía
  "Probando Xx" enseguida; lo que no hacía era mover el tablero. Medir la
  tarjeta habría dado "arreglado" sin arreglar nada.

## 4duovicies. La app en una compu (v0.80)

Hasta acá **el archivo entero tenía UNA media query y era la de claro contra
oscuro**. La app era la misma columna de 700 px en un celular y en un monitor de
27 pulgadas. Nadie la había mirado nunca en una compu, y eso no se notaba porque
el usuario usa el celular: las tres fallas de esta versión las reportó un amigo
suyo que la usa en PC, una de ellas con captura.

Las tres salen de lo mismo, y por eso van juntas.

**1. Los combos salían blancos sobre blanco.** Chrome en Windows dibuja el menú
desplegable de un `<select>` con el **fondo del propio select**, y el nuestro es
`background: transparent`. El menú salía blanco, y el texto de las opciones
—que hereda el color del papel oscuro— también. Se leía **una sola opción**: la
resaltada, que el sistema fuerza a contraste. En el celular nunca se vio porque
ahí el menú lo dibuja Android con sus propios colores.

El arreglo es un renglón, `option { background-color: Canvas; color: CanvasText; }`,
y los colores tienen que ser **de sistema y no fijos**: así siguen solos el
esquema claro/oscuro, que es lo que hace el resto de la pantalla. Poner un gris
a mano habría arreglado el esquema que se probó y roto el otro.

**Esto no se puede verificar con el arnés**, y conviene saberlo antes de
intentarlo: los desplegables nativos los dibuja el sistema operativo y **no
salen en las capturas de Chromium headless**. Lo que el arnés sí prueba es que
el combo cerrado no cambió. Que el menú abierto se arregló lo confirma quien lo
reportó.

**2. La tira no se podía arrastrar con el mouse.** Con el dedo se scrollea sola;
con mouse, arrastrar un `overflow-x` no la mueve, **selecciona el texto**. Y la
rueda vertical tampoco: sobre un contenedor horizontal el navegador no hace
nada y se va la página para abajo. Se agregaron las dos cosas, y ninguna toca lo
que pasa con el dedo —`pointerType` filtra el mouse—.

Dos detalles que no son opcionales:

- **Umbral de 4 px antes de contar como arrastre.** Sin eso el temblor de la
  mano al apretar contaba como arrastre, y tocar una jugada dejaba de llevarte a
  esa jugada. El clic se cancela en captura y **solo si hubo arrastre**.
- **La rueda solo se roba el gesto cuando hay para dónde ir.** En una partida de
  seis jugadas la tira entra entera, y ahí la rueda tiene que seguir scrolleando
  la página, que es lo que se espera de una rueda.

**3. La lista de jugadas vuelve, en una segunda columna.** Es la lista vertical
que vivió de la v28 a la v0.73 —y que ya era una planilla: `nº | blancas |
negras`—, traída de vuelta **solo donde el ancho sobra**. Lo que la v0.74
decidió sigue en pie: en el celular, la tira y nada más.

El corte va en **1050 px**, y es una suma y no un número redondo:

| | px |
|---|---|
| columna principal | 700 |
| separación | 22 |
| lista | 300 |
| márgenes del papel | 28 |
| **total** | **1050** |

**Estuvo en 1000 y estaba mal.** Se vio midiendo: ahí los tres no entraban, así
que la columna principal se achicaba a **650** y el tablero con ella. Los 700 no
se tocan —es la medida en la que están hechas todas las decisiones de la vista—
así que el corte tiene que ser el ancho donde las dos columnas entran **enteras**.
Los 300 de la lista son lo que necesita un `Qxg5+` para no cortarse.

El dial nuevo tiene dos formas y el apagado, y **la diferencia no es cosmética**:

- **planilla**: `nº | blancas | negras`, la de la v0.73 tal cual. Densa, la
  partida entera de un vistazo.
- **una por renglón**: gasta el doble de alto y a cambio entra **cuánto perdió
  cada jugada**, que en la planilla no cabe porque las dos columnas ya están
  ocupadas por los dos colores.
- **sin la lista**: una sola columna, como en el celular.

Va con las dos puestas por la misma razón que el margen contra gris de la v0.48:
son dos densidades y cuál sirve se sabe usándolas. **El dial se va cuando el
usuario elija.**

**Tres trampas de esta tanda**, anotadas porque las tres se rompieron al
escribirlas y ninguna la habrían agarrado las pruebas de unidad:

- **La regla base va ANTES de la media query.** `.lateral { display: none }`
  puesta *después* le gana al `display: block` de adentro —misma especificidad,
  gana la última— y la lista no se ve nunca. Lo agarró la medición, no la vista:
  la columna existía con ancho 0. Hay una prueba que fija el orden.
- **Devolverle el `display` a lo que se escondió.** Adentro de la media query
  estaba el `position: sticky` de la lateral pero no su `display`, y sin eso la
  regla base la seguía tapando.
- **Las dos columnas tienen que empezar a la misma altura.** La lista arrancaba
  24 px más arriba que el título "Revisión" de al lado, porque el `h2` trae su
  margen y la lista no. Se vio en la captura, no en los números.

**4. El tablero crece, y lo que manda es el alto.** Recién con las dos columnas
puestas se vio que el tablero seguía midiendo los 360 px del celular, centrado
en una columna de 700 y con aire a los dos lados. Crecerlo es fácil; lo que hay
que entender es **contra qué**.

No es contra el ancho. Si el tablero se lleva los 680 disponibles, **la tira y la
curva se van abajo del pliegue**, y son la navegación: para pasar de jugada
habría que scrollear. El presupuesto es vertical y está medido sobre la vista:

| | px |
|---|---|
| arriba del tablero (título, cabecera, tarjeta) | 185 |
| abajo, hasta que termina la curva | 110 |
| aire para que la curva no quede pegada al filo | 25 |
| **se descuenta del alto de la ventana** | **330** |

De ahí sale `max-width: clamp(360px, calc(100vh - 330px), 680px)`. Medido en
cuatro ventanas: a 800 de alto el tablero da 470, a 900 da 570, a 1080 llega al
techo de 680 —ahí ya lo limita el ancho— y en las tres quedan 24 px de aire
abajo de la curva.

**El piso de 360 no es adorno.** Con un `min` en vez de un `clamp`, en una
ventana baja y ancha —1280 × 600— la cuenta da menos de 360 y el tablero
terminaría **más chico que en el celular**, que es exactamente al revés de lo que
se quiso. Con el piso, a 600 de alto el tablero se queda en 360 y es la curva la
que no entra: no hay forma de que entren las dos cosas, y entre achicar el
tablero o scrollear un poco, se scrollea.

**5. Y estaba clavada a la izquierda (v0.81).** Con las dos columnas puestas y
el tablero grande, la primera captura desde la compu del amigo mostró lo que
faltaba: **todo el bloque pegado al borde izquierdo**, con 850 px de vacío a la
derecha en un monitor de 1900.

La causa es de una palabra: `body` tenía `margin: 0` en vez de `margin: 0 auto`.
**Venía de antes de la v0.80** —con la columna de 700 pasaba exactamente lo
mismo— y nadie lo había visto porque en un celular no se nota: sin ancho de
sobra, `auto` es cero. Es el mismo patrón que las otras tres de esta tanda, una
cosa que solo existe en una pantalla que nadie miraba.

Medido después del arreglo, a 1886 × 820 —el tamaño de su ventana, sacado de que
el tablero le da 490 y la cuenta del alto lo confirma—: 418 px de margen a cada
lado, y el cuerpo en sus 1050.

**El arnés ahora tiene una pasada ancha** (`npm run mirar`, al final): dibuja a
1280, y además a **1050 y 1049**, que son los dos lados del corte y donde se
rompe si alguien toca los anchos. Además maneja el mouse de verdad y mide que la
tira se arrastre, que **no** seleccione texto, que un clic siga navegando y que
la rueda no se lleve la página puesta.

---

## 4trevicies. La app empieza a responder al mouse (v0.82)

De trece ideas que se le ofrecieron al usuario de PC, eligió **todas**, y una con
nombre propio: *"ver cuánto tiempo pensaste cada jugada: fundamental"*. Esta
tanda es la mitad que **no mueve nada de lugar**; las de disposición van aparte,
porque una tanda invasiva va sola (§10).

**El tiempo por jugada.** El dato ya estaba: `fila.seg`, los segundos pensados,
que el reloj (§4nonies) calcula desde la v0.43 y que hasta acá solo se usaba
para la mediana de la vista Mes. Va en su **propia columna** de la lista lateral,
en la forma "una por renglón", y no pegado a la pérdida: son dos magnitudes
distintas y juntas se leen como una sola. Sin reloj dice **una raya y no un
cero**, porque `null` es "no se sabe" y un cero sería mentira (§5).

**En la v0.82 quedaron solo en la forma "una por renglón", y el usuario lo
reportó enseguida**: la planilla es la que viene puesta de fábrica, así que la
mitad de la gente no los veía. Desde la **v0.83** la planilla tiene cinco
columnas —`nº | blancas | reloj | negras | reloj`—, que es como está impresa una
planilla de papel. El reloj va **pegado a su jugada** y no los dos al final,
porque al final habría que contar cuál es de quién. La celda del reloj se dibuja
aunque no haya jugada: si no, en una partida que termina con blancas la última
fila se corre de columna.

Para poder mirarlo hubo que agregar una partida de prueba: ninguna de las cuatro
traía relojes, así que la columna salía toda rayas. Está en
`pruebas/partida-reloj.pgn` y se dibuja con **`npm run mirar reloj`**.

**Ver una jugada sin ir a ella.** Pasar el mouse por una jugada —en la lista o en
la tira— muestra esa posición en el tablero, y al salir vuelve todo. Deja
recorrer la partida con el ojo sin perder dónde estabas parado.

Se implementa **guardando el HTML del tablero y devolviéndolo**, no repintando la
vista al salir. Repintar era lo obvio y es peor: `pintarRevision` recentra la
tira y vuelve a scrollear la lista, así que el renglón se movía abajo del mouse y
disparaba el hover del de al lado. Guardar y devolver no puede desincronizarse,
porque lo que vuelve es exactamente lo que había. El arnés lo mide comparando el
tablero **entero** antes y después.

**La rueda sobre el tablero pasa jugadas.** Con acumulador: un trackpad manda
docenas de eventos chiquitos por gesto, y una jugada por evento hacía volar la
partida de un manotazo. Se pasa de jugada cada 40 de desplazamiento juntado.

**La tecla `n` salta al próximo error** (`p` al anterior), entre las jugadas
propias y usando las categorías que ya están calculadas. Una partida se revisa
por los errores, no jugada por jugada.

**Y el archivo pasa a tener reglas `:hover`, que no tenía ninguna.** Cero,
contadas. Reportado como *"no responde nada"*.

**Dos trampas de esta tanda**, las dos agarradas mirando y no midiendo:

- **El mouse SUBRAYA, no rellena.** Primero se hizo rellenando más suave que la
  elegida —10% contra 20%— y en la captura **las dos se veían iguales**: quedaban
  dos "estás acá" en la misma lista. El problema no era la intensidad sino que
  era la MISMA MARCA. Con un subrayado no hay confusión posible a ninguna
  intensidad, porque son dos cosas distintas. Por eso tampoco se tiñe el
  renglón: ese tono ya significa "acá".
- **Todo el hover va adentro de `@media (hover: hover)`.** En una pantalla táctil
  el navegador deja el estado pegado después de tocar, así que la última jugada
  tocada se quedaría iluminada como si estuviera elegida. Con la consulta puesta,
  el celular no ve una sola de esas reglas.

**Dos cosas que se rompieron en el arnés y eran del arnés, no de la app:**

- **Las capturas dependían de dónde hubiera quedado el mouse.** Al agregar el
  hover, seis capturas del celular cambiaron: el puntero seguía encima del último
  elemento clickeado y lo dejaba iluminado. En un celular eso no pasa nunca.
  Ahora `foto()` y `fotoDe()` **estacionan el puntero** en la esquina antes de
  disparar, lo que además hace la captura repetible — antes no lo era, y nadie
  se había dado cuenta porque no había una sola regla que dependiera del mouse.
- **`hasTouch` no sirve, aunque sea lo honesto.** Con él la página dice
  `hover: none` y `pointer: coarse`, que es la verdad de un celular; pero se fija
  al crear el contexto y no se puede revertir, así que la pasada ancha no podría
  probar nada de lo que solo existe con mouse. Probado y descartado: forzar la
  consulta de medios por CDP tampoco alcanza, porque en Chromium `hover` y
  `pointer` **salen** de la emulación táctil, y apagarla a mitad de camino no
  recalcula la consulta.

**Y una que sí era de la app, encontrada por ese camino.** La previa leía
`matchMedia("(hover: hover)").matches` **una sola vez al cargar** y guardaba el
booleano. Ahora se guarda la consulta y se lee `.matches` cada vez. No es un
detalle del arnés: a una tablet a la que le enchufan un teclado con trackpad le
cambia la respuesta sin recargar la página, y con el booleano congelado la previa
no aparecía nunca.

**El ancho de la lista y el corte están atados.** La lista pasó de 300 a 360 para
que entrara la columna del tiempo, y el corte se movió con ella: 700 + 22 + 360 +
28 = **1110**. Mover uno sin el otro deja una franja donde las columnas no entran
y la principal se achica de nuevo — pasó al escribirlo, y lo agarró la prueba.
Por eso ahora el corte **se calcula** en la prueba a partir del ancho de la
lista, en vez de estar escrito dos veces.

---

## 4quattuorvicies. Arrastrar la pieza (v0.84)

Con mouse, arrastrar es lo que la mano espera. El clic-clic de siempre no se
toca y sigue siendo el único camino con el dedo.

**NO ES UN CAMINO NUEVO PARA MOVER, y eso es la decisión de diseño.** Apretar
hace exactamente lo que hacía tocar —`tocarCasilla` con la casilla de origen, que
abre la variante y enciende los destinos— y soltar hace lo que hacía el segundo
toque. Así, todo lo que ya estaba decidido sobre qué se puede probar y desde
dónde (§4sexdecies, las dos puertas) vale igual sin repetirlo en ningún lado. Si
mañana cambia esa regla, el arrastre la sigue solo.

**La trampa, y costó encontrarla:** `tocarCasilla` llama a `pintarRevision`, que
redibuja el SVG entero. O sea que **la pieza que se agarró deja de existir en ese
mismo instante**. Hay que volver a buscarla después de encender los destinos, y
para poder buscarla cada pieza lleva ahora `data-pz` con su casilla. De paso,
esa es la razón de que el arrastre arranque recién al **cuarto píxel**: si
arrancara en el `pointerdown`, redibujaría el tablero en cada apretón, incluido
el que era solo un clic.

Tres detalles que no son opcionales:

- **La pieza en el aire va al final del SVG y sorda al mouse.** Al final para
  quedar arriba de las otras; sorda (`pointer-events: none`) porque las 64
  casillas transparentes que reciben el toque están por encima de las piezas, y
  una pieza que escucha le tapa el `pointerup` a la casilla de abajo.
- **El corrimiento se prepone al transform que la pieza ya tenía**, no lo pisa:
  las transformaciones de SVG se aplican de izquierda a derecha. Y va en
  **unidades del SVG**, no en píxeles: el tablero se dibuja en su propio sistema
  y se escala al ancho que haya, así que hay que dividir por esa escala. Medido a
  1280 de ancho: 14 px de mouse son 9.67 unidades.
- **El click que el navegador dispara al final del arrastre se cancela**, o
  soltar sobre una casilla la elegiría dos veces.

**Soltar en la misma casilla deja la pieza ELEGIDA**, no todo como estaba. No es
un descuido: agarrar ya fue un `tocarCasilla`, así que levantar la pieza y volver
a apoyarla termina igual que hacerle un clic, que es lo que pasa en cualquier
tablero de internet. Medido: la tarjeta queda diciendo "Elegiste a8".

**La manito abierta se dibuja solo donde hay una pieza.** Sobre una casilla vacía
prometería algo que no se puede hacer.

El arnés arrastra con el mouse de verdad y mide las tres cosas: que la pieza se
corra mientras está en el aire, que quede sorda al mouse, y que al soltar la
jugada haya entrado en la variante.

---

## 4quinvicies. Dibujar sobre el tablero (v0.85)

Botón derecho: apretar y soltar en la misma casilla la pinta, apretar en una y
soltar en otra dibuja una flecha, repetir el mismo gesto lo borra, soltar afuera
del tablero cancela. Es la convención de lichess y de chess.com, o sea que **no
hay nada que aprender y no hay dónde explicarlo**: quien la conoce la prueba, y
quien no, no se topa con ella nunca.

**NO SON UNA JUGADA, y esa es la decisión.** No pasan por `tocarCasilla`, no
abren la variante y no tocan nada guardado. Son un lápiz sobre el tablero para
pensar —"esta pieza mira acá", "el problema son estas dos casillas"—, y por eso
tampoco hay nada que decidir sobre qué se puede marcar y desde dónde: se marca
cualquier casilla, incluso una vacía, porque no se está proponiendo nada.

**Se borran al cambiar de posición**, y no hubo que acordarse de hacerlo en cada
camino: las limpia `pintarRevision`, que es por donde pasan todos —navegar,
girar el tablero, entrar y salir de la variante, soltar una pieza arrastrada—.
Una flecha señala UNA posición; arrastrarla a la siguiente sería señalar en un
tablero que ya no es el que se dibujó. De ahí sale gratis lo otro que hace
lichess: **el clic izquierdo las borra todas**, porque cualquier clic en el
tablero termina en `tocarCasilla` y entonces en `pintarRevision`.

**Dos capas y no una.** Las casillas van DEBAJO de las piezas, igual que el
resaltado de la explicación (§4-la del resalte ámbar): son un fondo y no pueden
tapar la pieza de la que hablan. Las flechas van ARRIBA, porque una flecha que
pasa por debajo de una pieza se corta a la mitad. Los dos grupos —`#mBajo` y
`#mAlto`— se dibujan siempre, vacíos o no, y así `pintarMarcas` los encuentra
por id.

**`pintarMarcas` reescribe SOLO esos dos grupos y no repinta la vista.** No es
optimización: `pintarRevision` recentra la tira y vuelve a scrollear la lista
—es el mismo problema que ya había obligado a la previa a guardar y devolver el
HTML del tablero (§4trevicies)—, y dibujar una flecha no tiene por qué mover
nada de lugar abajo del mouse. Para poder dibujar afuera de `dibujar` hubo que
sacarle la geometría: `TAB_S`, `TAB_M`, `sqX`, `sqY`, `sqCx` y `sqCy` ahora
viven arriba y las usan las dos.

**LA PUNTA es lo que las distingue de las cuatro flechas de la app**, que son
una línea con una bolita en el extremo. Un color se puede confundir con otro
—los cuatro que significan algo ya están tomados: azul lo jugado, verde lo que
decía el motor, violeta lo probado, ámbar lo que señala la frase—; una forma
distinta, no. La cola arranca a 13 unidades del centro del origen y la punta
termina a 5 del centro del destino, así no tapa ni la pieza que sale ni la que
llega, que son justo las dos que se están mirando.

**El color se eligió mirando**, con las mismas cuatro marcas dibujadas en gris
pizarra, en el verde de lichess y en cian. Salió el **gris pizarra** (`--marca:
#3f5163`): es el único que no compite con ninguno de los cuatro que ya
significan algo, y se lee como "esto lo dibujaste vos, no lo dice la app". Vive
en una variable CSS, o sea que cambiarlo es una línea y vale para los cinco
tableros.

**La previa no muestra las marcas** (`sinMarcas` en la capa): son de otra
posición y pintarlas encima sería mentir. Y `volverDeLaPrevia` llama a
`pintarMarcas`, porque el HTML que devuelve es de ANTES de la previa y volvería
sin la marca que se dibujó mientras tanto.

**Es solo con mouse**, y no hace falta más: con el dedo no hay botón derecho, y
el gesto de dos dedos de lichess costaría inventar una forma de cancelar que
hoy no existe. En el celular la app no cambió en nada.

El arnés lo mide con el mouse de verdad: que las cuatro marcas aparezcan, que
repetir el gesto las borre, que soltar afuera no dibuje nada, que el clic
izquierdo limpie todo y que el menú del navegador quede cancelado.

---

## 4sexvicies. La evaluación, vertical en la compu (v0.86)

**La misma medición da dos respuestas distintas, y por eso el default depende del
ancho.** La barra horizontal se SUMA al alto —16 px de barra más 10 de margen—;
la vertical lo COMPARTE con el tablero. En el celular el tablero está limitado
por el ANCHO, así que sumar alto sale gratis y horizontal gana, que es lo que se
eligió mirando en su momento. En una compu el tablero está limitado por el ALTO
(§4duovicies), así que esos 26 px salen del tablero. **Medido a 1280 × 800: el
lado del tablero pasa de 470 a 496.**

**No se escribe el default al arrancar.** `aplicarModoEval` ahora recibe si tiene
que guardar, y desde el arranque va en falso: si el default se guardara solo,
quedaría congelado el ancho de la PRIMERA carga y la pantalla dejaría de mandar.
Se guarda cuando el usuario elige, que es cuando hay algo que recordar. La
preferencia guardada le sigue ganando al ancho, siempre.

**El presupuesto de alto sigue a la forma que está puesta, no a la de fábrica.**
Las tres formas se siguen pudiendo elegir a mano, así que `pintarRevision` prende
`.sinEvalH` en `#zonaRevision` y el CSS baja el presupuesto de 330 a 304. El lado
del tablero vive ahora en `--ladoTab` porque lo necesitan dos reglas —el tamaño
del SVG y el ancho de su caja—, y escrito dos veces se despegarían al primer
ajuste.

**Dos errores que solo se vieron en la captura**, y ninguno lo agarraba una
cuenta:

- **La barra quedaba a 170 px del tablero.** En el celular la columna mide lo
  mismo que el tablero y el problema no existe. En una compu la columna son 700 y
  el tablero 496: con `flex: 1`, la caja del tablero se estiraba a los 700, el
  SVG se centraba adentro y la barra se quedaba sola contra el borde izquierdo.
  Ahora la caja mide `var(--ladoTab)` y la fila se centra entera. Medido: 8 px
  entre la barra y el tablero, que es el `gap` y nada más.
- **"+0.26" salía CORTADO.** La barra ancha medía 30 px y el número no entraba;
  como la barra tiene `overflow: hidden` por las esquinas redondeadas del
  relleno, lo que no entra no se ve. **El error tenía tres versiones** y no lo
  vio nadie porque nadie usaba la vertical: se destapó al volverla el default.
  Son 36 px ahora, y no le cuestan tablero porque lo que manda es el alto.

El arnés mide las tres formas y lo que cuesta cada una, que la barra quede pegada
y que el número entre entero. El default por ancho se mide aparte, con dos cargas
limpias: el valor se decide una sola vez, al arrancar, así que hay que recargar.

---

## 4septvicies. Las piezas comidas, al costado (v0.87)

Al lado de cada jugador va lo que comió **él** —por eso las piezas que se muestran
arriba son blancas: arriba juega el negro—, y el número es la diferencia de
material, que va **solo del lado del que va ganando**: "+3" en las dos puntas
sería el mismo dato dos veces con el signo cambiado.

**VA EN LA FILA DEL TABLERO Y NO ARRIBA NI ABAJO.** Lo que escasea en una compu
es el ALTO —es lo que limita el tablero, §4duovicies— y lo que sobra es el ancho.
Sumar una fila arriba le habría sacado tablero, que es lo contrario de lo que
viene haciendo esta tanda. Medido: con la tira puesta, el lado del tablero sigue
siendo 496. En una ventana de 1010 px de alto para arriba el tablero llega a los
680 y ahí sí le cede los 132 a la tira; es el único caso donde cuesta, y ahí el
tablero ya es enorme.

**Solo existe en la compu.** Es `display: none` afuera de la media query, y por
eso las 28 capturas del celular siguen idénticas byte a byte.

**Dos números que salen de dos lugares distintos, a propósito:**

- **Las piezas comidas salen de una RESTA** —lo que había al empezar menos lo que
  hay— y por eso **mienten con una coronación**: un peón blanco coronado en dama
  deja al blanco con 7 peones y 2 damas, así que la resta dice "el negro le comió
  un peón" y no ve la dama de más. Mirando una sola posición no hay forma de
  distinguirlo; la alternativa sería recorrer la partida entera para cada
  posición. Es la misma aproximación que hacen lichess y chess.com y se elige a
  sabiendas. Hay una prueba que la deja escrita.
- **La diferencia de material sale del TABLERO**, sumando lo que hay de cada
  lado, y esa sí es exacta con coronaciones. La fila de piezas cuenta la historia
  y el número dice el estado: por eso no se deriva uno del otro.

**La tira lee el MISMO FEN que el tablero**, guardado en una variable sola
(`fenVisto`, y `FEN_VISTO` para poder volver de la previa). Sin eso las dos se
podían desincronizar y la tira contaría las comidas de una posición que no es la
que se ve. La previa también la mueve, por lo mismo.

**El "+3" no entraba al lado de las piezas** y se caía a un renglón propio: la
tira medía 108 px y son 100 de las cinco piezas más el hueco más el número. Son
132. Se vio en la captura.

**Y apareció otra vez el recorte silencioso de la barra de evaluación**, dos
versiones seguidas: "+10.00" no entra en 36 px a 9,5 y la barra tiene
`overflow: hidden`, así que lo que sobra desaparece sin avisar. Ensancharla otra
vez no alcanzaba —"-100.00" son siete caracteres—, así que el número se achica a
8 px cuando pasa de cinco. El arnés ahora lo mide en dos jugadas, una con el
número corto y otra con el largo.

---

## 4octovicies. La curva cruza las dos columnas (v0.88)

**Es el único elemento que mejora siendo ancho**, y por eso es el único que se
movió: es una serie de tiempo de 40 a 100 puntos, y a 700 px cada jugada tiene 7
px contra 15 a 1082. El tablero es cuadrado y la tarjeta es texto: ninguno de los
dos gana nada con más ancho.

**EL PRECIO QUE PARECÍA TENER NO SE PAGÓ.** Estaba anotado que sacar la curva a
una fila propia de la grilla la dejaría DEBAJO de los cuadritos y los botones, o
sea cambiando el orden que se decidió mirando en la v0.74. No hizo falta: en vez
de mover la curva al final, se **partió la columna principal en dos** —`.parriba`
hasta la tira, `.pabajo` de los cuadritos para abajo— con la curva en el medio y
como hija directa de la grilla. El orden vertical queda igual que antes, y en el
celular, que es una sola columna, esto se apila exactamente como estaba: las 28
capturas siguen idénticas byte a byte.

**Las cuatro piezas van puestas a mano** (`grid-row`/`grid-column` explícitos) y
no por acomodo automático: con la curva de hija directa, el automático la habría
mandado a la columna de al lado de la primera mitad.

**Y salieron dos cosas que sí había que pagar, las dos medidas:**

- **La lista de al lado podía empujar la curva abajo del pliegue.** La curva
  arranca debajo de la MÁS ALTA de las dos columnas, y la lista, suelta, llega al
  tope de `100vh - 28` —una partida de 40 jugadas son 2000 px de renglones—.
  Ahí ganaba la lista y la curva se iba de pantalla, que es exactamente lo que la
  v0.80 no quería: la tira y la curva son la navegación. Ahora la lista **no
  puede ser más alta que la columna de al lado**: el tope sale de MEDIR la
  columna en `pintarRevision` y no de una cuenta, porque su alto depende del
  tablero, que depende del alto de la ventana y de qué barra de evaluación esté
  puesta. La lista ya scrolleaba sola: lo único que cambia es que empieza a
  scrollear un poco antes.
- **El hueco de 22 de la grilla se comía el aire de la curva.** Ese hueco es
  entre las COLUMNAS, no entre estas filas, que son la misma vista partida al
  medio. Sin corregirlo la curva bajaba 22 px y quedaba a 13 del filo, cuando la
  v0.74 le había reservado 25 a propósito —descuenta 330 y no los 305 que da la
  suma justamente para que no se lea como cortada—. Los márgenes de un hijo de
  grilla no se colapsan con nada, así que el negativo es exacto: `-12` en la
  curva (22 menos los 10 que ya traía) y `-22` en la mitad de abajo. **Medido a
  1280 × 800: 25 px de aire, en las dos formas de la evaluación.**

El arnés mide el ancho de la curva, el orden vertical leído de la pantalla —tira,
curva, cuadritos— y el aire de abajo en las dos formas de la evaluación.

---

## 4novovicies. Las tres mejores del motor (v0.89)

Es lo que más acerca esto a una app de análisis: hasta acá el motor decía UNA
jugada y por qué la tuya era peor, y ahora dice **qué otras cosas había**.

**EL DATO NO VIAJABA, aunque este documento decía que sí.** `evs[i].segunda`
existe solo donde el usuario jugó la primera del motor —es lo que la pasada
híbrida necesita para decidir "era la única"—, o sea en una minoría de las
posiciones, y de la tercera no había nada: el MultiPV del barrido es 2. Lo que sí
estaba era toda la plomería: `Motor.analizar` ya parseaba las líneas de MultiPV
y tiraba de la tercera para arriba. Ahora devuelve `tercera`, simétrica de
`segunda`, y viene en null salvo con MultiPV 3.

**NO SE CALCULAN SOLAS, y es la decisión de fondo.** Cada posición es una corrida
de motor a la profundidad de la partida: pedirlas al pasar de jugada sería una
corrida por flecha del teclado, peleando con la variante por el mismo grupo de
motores. Se piden con un botón y **se guardan por posición y profundidad**, así
que ir y volver por la partida no vuelve a pagar.

**SON LAS MEJORES DE LA POSICIÓN QUE SE VE, y por eso se llaman "de acá".** El
tablero muestra la posición DESPUÉS de la jugada, así que estas tres contestan
"¿y ahora qué?", que es la misma pregunta que contesta la variante y por eso
tocar una **abre la variante con esa jugada**: el panel no es un cartel. Ojo con
la tentación de compararlas contra el cuadrito "Mejor": ese habla de la posición
ANTERIOR, la de antes de la jugada, y son dos tableros distintos. Alternativas a
la jugada jugada serían las de ese otro tablero, y el panel estaría hablando de
algo que no se está viendo.

**La primera de las tres ES la mejor jugada de esa posición**, y se deja: sacarla
dejaría al panel diciendo "las otras dos", que no es una lista de las mejores. Va
marcada con el verde que ya significa eso.

**UNA SOLA FILA PARA TODO LO QUE LE PIDE AL MOTOR A DEMANDA.** Eran dos cosas
—la variante— y ahora son tres, y `pool.asegurar` le puede cambiar el MultiPV o
el Hash a un motor que está trabajando (§4.2). `COLA_MOTOR` encadena los pedidos;
el `then(fn, fn)` es para que un error no deje la fila trabada para siempre. El
barrido de la partida no pasa por ahí: se cubre con `TRABAJANDO`, que apaga hasta
el toque en el tablero.

**Dos detalles que costaron una vuelta cada uno:**

- **Sin repetidas.** Un motor que manda la misma jugada en dos líneas dejaría el
  panel diciendo dos veces lo mismo, y eso se lee como un error de la app. El
  motor falso del arnés lo hacía —mandaba `mejor` en las tres líneas—, así que
  ahora manda dos jugadas legales distintas, y la tercera **solo si se la
  pidieron**: la segunda se sigue mandando igual que siempre para no correr ni
  un veredicto de las capturas viejas.
- **El margen del panel también le come alto a la lista.** `offsetHeight` no
  cuenta el margen, así que la lista quedaba 10 px más alta que la columna de al
  lado, empujaba la curva y le comía el aire: los 25 px de la v0.88 pasaban a ser
  15. El margen se lee del CSS con `getComputedStyle` en vez de repetirlo en el
  código, que es lo que evita que se despeguen.

El arnés pide las tres, mide que antes de pedirlas el panel esté vacío, que las
tres jugadas sean legales en la posición que se ve, que el botón desaparezca al
llegar la respuesta y que tocar la segunda abra la variante con esa jugada.

---

## 4trigies. Tres columnas: la tarjeta al costado (v0.90)

El cambio invasivo de la tanda, y el que más tablero compra. **De 1500 px para
arriba** la vista se parte en tres: la tarjeta a la izquierda, el tablero en el
medio, la lista a la derecha, y la curva cruzando las tres. Abajo de ese ancho
siguen valiendo las dos columnas de la v0.80, intactas.

**LA v0.74 PUSO LA TARJETA ARRIBA PORQUE "SE LEE PRIMERO", y eso no se
contradice:** en una pantalla ancha la izquierda también es primero. Lo que se
mueve es dónde está el "antes", no que esté antes.

**El corte es 1500 y no menos porque la cuenta no cierra:** 300 de tarjeta, 360
de lista, 44 de barra de evaluación, 132 de piezas comidas y dos huecos de 22 son
880 px sin una sola casilla de tablero.

**Lo que compra, medido: el lado del tablero pasa de 496 a 569 a 1500 × 800.**
Son **73 px, no los ~90** que decía la lista de pendientes, y la diferencia no es
redondeo: el presupuesto de alto se ajustó hasta que quedaran los mismos **25 px
de aire abajo de la curva** que en dos columnas, que es la reserva que la v0.74
puso a propósito para que la curva no se lea cortada. La primera estimación
—descontar "lo que mide la tarjeta"— erraba por 17 px. Los números salen de
medir, no de sumar el CSS.

**Las dos tarjetas viven ahora en un bloque propio** (`.tarjetas`, con el
veredicto y la de la variante), hijo directo de la grilla, que es lo que deja
mudarlas de columna. En el celular y en dos columnas es un div de más y nada
cambia: las 28 capturas siguen idénticas byte a byte.

**Y el hueco de la grilla pasó a ser solo entre COLUMNAS** (`column-gap: 22px;
row-gap: 0`). Las filas son la misma vista partida en pedazos, así que cada
bloque se separa con su propio margen, igual que cuando eran hermanos adentro de
un solo div. Esto reemplaza a los márgenes negativos de la v0.88, que eran la
misma corrección hecha a mano y que con cinco filas habría habido que repetir
cuatro veces.

**LA TRAMPA, y es la que costó la vuelta:** el tope de alto de la lista se mide
sobre la columna del tablero, y la lista **cruza las filas de la grilla**. O sea
que si la lista es más alta las estira, y medir la columna de punta a punta
estaría midiendo la lista misma: **la medida se define en función de sí misma**.
La primera pintada, cuando todavía no hay medida y vale el `100vh` de reserva, la
deja inflada, y de ahí no baja nunca —queda trabada arriba, no diverge, que es
peor porque parece estable—. Se vio en el aire de la curva: 25 px pasaron a -2.
Se corta sacando la lista de la pantalla un instante (`display: none`), midiendo,
y devolviéndola: el navegador pinta recién al terminar la función, así que no se
ve nada.

El arnés dibuja 1500 y 1499, que son los dos lados del corte, mide que la tarjeta
termine antes de donde empieza el tablero, el ancho de la curva y el aire de
abajo en las dos formas de la evaluación.

## 4untrigies. El menú de ajustes (v0.91)

La fila de controles al pie de la vista Partida tenía **cinco `<select>`** y
ocupaba **156 px de los 760** del celular: cuatro renglones. El pendiente de §8
lo venía marcando desde la v0.76 —*"no hay pantalla de configuración, y ya va
tocando"*, palabra del usuario— y cada dial nuevo lo empujaba. Ahora hay menú y
la fila mide **33 px**: los tres botones, en un renglón.

### Las cuatro decisiones, y qué las decidió

Todas se dibujaron y las eligió el usuario mirando, que es la regla de §10. Lo
que sigue es **por qué** ganó cada una, que es lo que no se puede recuperar de
una captura:

| decisión | por qué |
|---|---|
| **una hoja que sube desde abajo**, no un desplegable en línea ni una pantalla propia | la hoja mide 447 px de 760, o sea que **el tablero sigue a la vista arriba** mientras se toca el tema. El desplegable empujaba el tablero fuera de pantalla justo cuando se elige cómo se ve el tablero; la pantalla propia lo tapaba del todo y con cinco perillas quedaba medio vacía |
| **la puerta arriba**, en el renglón del título "Revisión" | gana los mismos píxeles que acortar los nombres de los tres botones —la otra forma dibujada de meter la puerta en un renglón— pero **sin tocar ninguna etiqueta**, y la deja siempre en el mismo lugar en vez de al final de todo lo que haya. Un botón flotante en la esquina se le monta encima a lo que haya abajo a la derecha, que en el dibujo era "Pintar las dos" |
| **la tuerca sola**, sin la palabra "Ajustes" | al lado del título eran dos textos peleándose el renglón |
| **el círculo de borde tenue** | de seis envases dibujados. El borde lleno —que es la gramática de los botones de la app (§4quater)— al lado de un título en negrita gana la pulseada; los rellenos se leen como campos y no como acciones; los cuadrados repiten la forma de las tarjetas de abajo y se pierden |

### Qué entró y qué no

Entró **lo que cambia cómo se ven las cosas**, que es la regla que salió en §8:
tema del tablero, dónde va la evaluación, marcas de la curva, los dos diales
temporales —cuánto habla la explicación (§4novodecies) y la forma de la prueba
(§4sexdecies)— y, **solo en pantalla ancha**, las jugadas de al lado.

**No entró** lo que cambia *qué* datos se miran ni lo que actúa sobre la partida
que se está mirando: "Mostrar la mejor", "Girar tablero" y "Pintar las dos" son
acciones y se quedan en la fila; "Modo" (crítico/amigable) y "Mate a la vista"
cambian lo que **significan** los números y se quedan en Análisis; la cadencia y
"el mes / todo lo analizado" son alcance de los datos y se quedan en la vista.

### Cómo está hecho

**Los `<select>` son los mismos de antes, mudados adentro de la hoja.** No hay
estado nuevo, ni una segunda fuente de verdad, y todo lo que ya escuchaba sus
`onchange` sigue igual: el cambio es de dónde viven, no de qué hacen. Lo único
que cambió de ellos es **el texto de las opciones**, que ya no se autonombran
—la etiqueta está al lado— y quedaron cortas: "sin la lista" en vez de "Prueba:
sin la lista". Una prueba fija que cada uno aparezca **una sola vez** en el
archivo, porque duplicarlos dejaría a uno de los dos mudo.

La hoja vive **al final del `<body>`** y no adentro de la vista: es
`position: fixed` y así no depende de en qué columna de la grilla haya caído
nada. En una compu no se estira: `max-width: 700px` y centrada, o sea del ancho
de la columna, como el resto de la app.

**Tres salidas**: el botón "Listo", tocar afuera y la tecla Escape. Una hoja que
tapa el 59% de la pantalla sin forma evidente de cerrarse es una trampa, y eso
es lo que fija la prueba. El foco va a "Listo" al abrir y vuelve a la tuerca al
cerrar; el anillo de foco **solo aparece con teclado** —medido con
`:focus-visible`—, así que el dedo no lo ve nunca.

### Las rayas y el renglón que sobraba (v0.91.1)

La primera versión ponía una raya entre cada dos perillas. Adentro de un grupo
eso separa lo que va junto: dos perillas del mismo grupo quedaban tan lejos una
de otra como del grupo de al lado, y los tres bloques dejaban de leerse. Ahora
**la única raya es la que cierra el título del grupo** y adentro separa el aire.
La hoja pasó de 447 px a 457.

Se fue también el renglón "Se guardan solos y quedan puestos para la próxima
vez": lo pidió el usuario y tiene razón, es lo que cualquiera espera de una
pantalla de ajustes, así que decirlo era ocupar un renglón para no informar
nada.

### La alineación de la tuerca, y una medición que mentía

La tuerca va **centrada contra la mayúscula del título**, no contra la caja del
renglón: la caja reserva lugar para colas y tildes que "Revisión" no tiene, y
centrar contra ella la deja alta. Es la misma lección del chevron contra la "N"
de la v0.74.

Lo que hay que anotar es el error, porque va a volver: la primera versión de la
medición **calculaba dónde caía el renglón a partir del relleno del elemento**, y
eso solo vale cuando el texto arranca arriba de todo. Adentro de un botón con
`place-items: center` el renglón ya está centrado, así que la cuenta se
equivocaba en la mitad del sobrante —**8 px**— y mandaba corregir lo que ya
estaba bien. **Con esa corrección de más se dibujó la tira de las seis formas que
eligió el usuario**: las seis tenían la tuerca 8 px baja, y la elección de la
forma no cambia por eso pero la captura mentía. La medición buena usa un `Range`
sobre el texto, que devuelve la caja del renglón **ya ubicada**, sin suponer
nada. Corregido, la tuerca queda a 0,2 px de la "R", con un `translateY(1px)`.

### La tuerca estaba flaca, y era un glifo del sistema (v0.92)

Lo reportó el usuario usando la app: *"se ve raro, muy flaco... me da la
impresión que es por ser un ícono nativo o similar"*. Y era eso: el botón decía
`&#9881;`, o sea el ⚙ de Unicode, **dibujado por la fuente del aparato**. Es el
mismo problema que tenían las piezas hasta la v27 (§4bis) y tiene el mismo
diagnóstico escrito ahí: un glifo depende del dispositivo, y donde sale es el
set hueco pensado para texto corrido, con el trazo demasiado fino. Vale la pena
anotarlo como patrón: **la app no puede pedirle un dibujo a la fuente**. Quedan
todavía dos emoji por símbolos en las tablas (§4quinquies) y ese camino ya se
eligió a propósito, pero cualquier ícono nuevo se dibuja.

Se dibujaron cinco variantes en el renglón real de "Revisión", a tamaño real y
ampliadas, y el usuario eligió la **C: engranaje lleno de seis dientes gordos**.
Le gustó también la D —perillas acostadas, tres rieles con su perilla— y la
dejó anotada para otra cosa más adelante, así que **no es una idea descartada
sino una guardada**.

| variante | qué era | qué pasó |
|---|---|---|
| A | el glifo de ahora | el punto de comparación |
| B | engranaje lleno, 8 dientes | a 20 px los ocho dientes se empastan |
| **C** | **engranaje lleno, 6 dientes gordos** | **elegida**: la que más cuerpo tiene sin que los dientes se junten |
| D | perillas acostadas | gustó, pero cambia el significado del botón; guardada para otra cosa |
| E | perillas paradas | la misma idea en vertical, y se lee peor |

El engranaje **se genera por geometría** —cuerpo, seis dientes redondeados
rotados de a 60°, y el agujero recortado con una `<mask>`— y no es un path
copiado: así se puede mover un diente o el agujero cambiando un número. La
máscara es lo que deja el resto en `currentColor`, o sea que **sigue el color
del texto en los dos temas** sin una regla aparte. Pesa **900 bytes**, va
adentro del HTML y no pide nada a la red.

**El `translateY` pasó de +1 px a -0,5 px, y eso es una consecuencia, no un
retoque.** El glifo vivía en una caja de texto que el `place-items: center` ya
centraba; un SVG de 20×20 centrado por la grilla cae **1,5 px más arriba**. Se
midió con el `Range` de acá arriba —la medición buena, la que no supone dónde
arranca el renglón— antes de dibujar las variantes, así que **la captura que
decidió no venía con el error adentro**, que es justo lo que había pasado en la
v0.91. El `font-size: 17px` del botón se fue con el glifo: sin texto adentro no
decía nada.

### El andamio de las tiras salió a `pruebas/tira.mjs` (v0.92)

**La regla de las maquetas no cambió: lo que se tira sigue siendo la decisión
temporal.** Lo que se descubrió es que el andamio era siempre el mismo, y que
ese andamio es el grueso del costo. Desglosado sobre la tanda de las tuercas:
escribir la maqueta fueron **~1.600 tokens**, mirar las capturas ~2.080,
aplicar el cambio y documentarlo ~1.500, y **el dibujo en sí ~100**. O sea que
lo caro no era decidir el ícono: era volver a escribir el mismo clonador por
tercera vez.

`pruebas/tira.mjs` es ese andamio, y **no es una maqueta**: se commitea, porque
sirve para todas las tandas y no para una. Tiene cuatro funciones:

| función | qué hace |
|---|---|
| `abrirApp()` | servidor sobre el repo + Chromium a 412 de ancho, con la app cargada. NO analiza ninguna partida: una decisión de forma no la necesita, y el motor de mentira de `mirar.mjs` son 150 líneas |
| `tira()` | clona un pedazo de la pantalla una vez por variante, le aplica el cambio a cada clon y fotografía todo junto, en las **dos escalas** |
| `alinear()` | el centro de una mayúscula contra el centro del vecino, con `Range` y métricas de fuente |
| `espacios()` | qué quedó encimado y qué quedó pegado adentro de un contenedor |

Con eso, la maqueta de las cinco tuercas se rehizo en **37 líneas**, de las
cuales 14 son el generador de engranajes —o sea contenido, no andamio—.

**Las dos escalas están en el ayudante a propósito, y no es simetría:** la de
escala CSS es para quien programa (26 tokens por variante) y la de 2x es para
mandarle al usuario, que la lee en un teléfono. Mandar no cuesta nada; mirar,
sí. Invertirlo sale caro: la misma tira a 2x son 627 tokens.

**Dos fallas que aparecieron probándolo, y las dos valen como lección:**

1. **El clon perdía el CSS de sus `id`.** Hay que sacarle el `id` —repetirlo
   rompe todo lo que lo busque— y esta app estila mucho por id: `#btnAjustes`
   trae el redondeado, el borde y el tamaño. La primera corrida mostró **el
   botón cuadrado cuando en la app es un círculo**. No es un detalle del
   andamio: es una decisión tomada mirando algo que no era la pantalla, que es
   justo lo que las tiras existen para evitar. Ahora `tira()` copia las reglas
   de `#x` a `.v-x` leyendo las hojas de estilo de verdad, entrando en los
   `@media` para no perder cuál gana. En la v0.91 y la v0.92 eso se había
   resuelto repitiendo el CSS a mano en la maqueta, o sea acordándose.
2. **`espacios()` se medía sobre la vitrina.** Reportaba dos "pegados" que eran
   los rótulos y las celdas de la tira contra sus clones. Se arregló midiendo
   sobre la tira a tamaño real, antes de rearmar la ampliada, y marcando lo que
   agrega el andamio con `data-tira`.

**`mirar.mjs` usa `alinear` y `espacios` en cada corrida**, y eso es a propósito:
las maquetas son desechables, así que sin un uso fijo el ayudante se rompería
sin que se entere nadie. Imprime `cabecera de la vista`, con la tuerca contra la
"R" —la medición que en la v0.91 salió mal y mandó corregir 8 px que ya estaban
bien—. Hoy da **-0,25 px**. `tira()` no queda cubierto por eso: si se rompe, se
rompe con una maqueta delante y se arregla ahí.

### El arnés tuvo que aprender a abrir el menú

`mirar.mjs` tocaba las perillas con `pg.selectOption("#largoExp", …)` en 21
lugares, y adentro de la hoja escondida eso ya no es visible. Ahora hay un
ayudante `elegir(sel, valor)` que **abre el menú, elige y cierra**, que es el
camino de verdad: no es un rodeo del arnés, es lo que hace el usuario. Devuelve
el scroll a donde estaba, porque abrir el menú obliga a llevar la tuerca a la
vista y eso mueve la página, y cierra siempre: si quedara abierto, la captura
siguiente saldría con la hoja tapando media pantalla.

### Lo que queda para adentro del menú

- **Los juegos de piezas** (§4bis). La costura está puesta desde la v27 y no se
  hacía porque no existía dónde poner el selector. Ya existe.
- **La preferencia de "mostrar la mejor"** (§4bis), que hoy es un botón de
  acción y podría tener además su valor por defecto acá adentro.
- **El selector de cadencia NO va acá** (§4undecies): es alcance de los datos.

---

## 4duotrigies. Cuánto pensó la jugada (v0.93)

Un cuarto cuadrito en la fila de la jugada: **Pensó**, al lado de Mejor,
Pérdida y Caída. Es la segunda de las tres formas del tiempo de §7.8 —la
primera fue la columna Seg. de la v0.43— y **no costó plomería nueva**: `f.seg`
viaja en la fila desde entonces y no lo usaba nadie más que las tablas.

### Empezó como "el reloj en el tablero" y terminó en otro lado

Lo pidió así el usuario, y el recorrido vale más que el resultado porque explica
por qué el cuadrito está donde está. **Se dibujaron ocho ubicaciones alrededor
del tablero y las rechazó todas**, con un criterio consistente que recién al
final quedó dicho:

| tanda | qué se probó | por qué no |
|---|---|---|
| 1 | arriba y abajo del tablero; los dos juntos arriba; encima del tablero; en el renglón del rival | las dos primeras le sacan alto al tablero; la tercera tapa piezas —*"hacerlo menos opaco no lo resolvería"*—; la cuarta está lejos y comparte renglón con texto variable, que puede taparlo |
| 2 | la misma de arriba pero flaca; parada al costado; en el renglón de "Revisión"; solo el que movió | la parada hay que leerla ladeando la cabeza y queda a 0,0 px del tablero; la del título sigue estando lejos |

De ahí salió la restricción entera, que ninguna cumplía a la vez: **cerca del
tablero, sin costar alto, sin tapar piezas y sin compartir renglón con texto
variable.** Alrededor del tablero no sobra alto, y lo único que no cuesta alto o
está encima del tablero o está lejos.

**Lo destrabó el usuario replanteando el dato**, no el lugar: *"podríamos
explorar la posibilidad de ver cuánto tiempo se pensó la jugada, que en el fondo
es lo que uno quiere ver"*. Y si el dato es **cuánto pensó**, entonces es un
dato **de la jugada**, igual que la pérdida y la caída, y su lugar es la fila
donde ya viven los datos de la jugada. Ahí no pelea con ninguna de las cuatro
objeciones: **cero px de empuje, cero superposición, y el renglón ya existía.**

Es además el dato más honesto de los dos: el reloj dice *cuánto le quedaba*, que
depende de toda la partida anterior; esto dice *qué pasó en esta jugada*, que es
lo que se está mirando cuando uno está parado en ella.

**El reloj de los dos jugadores queda pendiente, no descartado.** Si alguna vez
se retoma, las dos formas que sobrevivieron son la flaca arriba y abajo del
tablero (14 px de empuje, alineada al borde VISIBLE del tablero) y la del
renglón de "Revisión" (cero px, pero lejos).

### La alineación al borde visible, que no es el del contenedor

Anotado porque va a volver: el `<div id="tablero">` mide **384** y el `<svg>` de
adentro **360**, centrado. O sea que alinear algo "a la derecha del tablero" con
el borde del contenedor lo deja **12 px afuera** del tablero que se ve. El
usuario lo marcó mirando la captura —*"quizás mejor alineados"*— y la medición
lo confirmó: el número caía en 398 y el tablero termina en 386.

### El formato: la décima solo cuando el dato la trae

Se dibujaron cuatro formas y el usuario eligió **`12.4s` cuando el reloj trae la
décima y `12s` cuando no**, sin espacio antes de la `s`. Sin espacio porque
`tiempoCorto()` ya existía y ya escribe así en la tira de jugadas: con espacio,
el mismo dato se vería de dos maneras en la misma pantalla.

**Por qué no siempre una décima**, que era lo que el usuario iba a elegir: la app
no MIDE el tiempo pensado, lo **resta** de dos relojes del PGN, así que la
décima existe solo si chess.com la escribió. Medido sobre `partida-reloj.pgn`
(10+0): los 36 relojes vienen al segundo entero y los 36 gastos salen enteros,
o sea que un formato con décima fija mostraría `12.0s` y `0.0s` siempre.
`normalizarPgn` documenta que chess.com también escribe `{[%clk 0:04:58.4]}`
—blitz, presumiblemente—, y **eso no está verificado contra un PGN del
usuario**: queda como el único cabo suelto, y se cierra el día que mande una
partida de blitz.

**El grid pasó a `auto-fit`** en vez de `repeat(3, …)`. La clase `.metricas` la
usan dos filas —la de la jugada, ahora de cuatro, y la cabecera del mes, de
tres— y con `auto-fit` cada una arma tantas columnas como hijos tenga, sin una
clase aparte ni el número escrito dos veces. **El mínimo tiene que ser un ancho
de verdad y no `0`**: con `minmax(0, 1fr)` auto-fit no puede contar cuántas
entran. Medido en cinco anchos —360, 412, 700, 1280 y 1900—: **cuatro columnas
en una sola fila en todos**, y 78,5 px cada una en el caso más angosto.

### Lo que queda pendiente de esto

**El `0s` de la primera jugada de cada lado es un artefacto, no un dato.**
chess.com escribe el reloj inicial intacto, así que la resta da cero aunque se
haya pensado; está medido en §4nonies contra `%timestamp`, que coincidió en 60
de 62 jugadas y falló justo en `1. e4` y `1... Nf6`. Lo honesto sería mostrar
`·` ahí, igual que cuando no hay reloj. **Se le ofreció al usuario y prefirió no
mezclarlo con esta tanda**, así que queda para una propia.

---

## 5. Reglas de método — valen para cualquier número que muestre la app

Estas no son opiniones de estilo. Cada una viene de un error que ya se cometió.

1. **Todo porcentaje va con su denominador.** "La mayoría de mis errores salen
   de X" no significa nada sin saber qué porcentaje del juego transcurre en X.
   Las tablas muestran siempre casos y total, no solo el porcentaje.
2. **Toda tasa va con su margen, siempre y sin corte** (v0.50). No hay mínimo
   de jugadas: `18.2% (10–30)`. El ancho del paréntesis es el semáforo —"(7–14)"
   se lee firme y "(3–31)" se lee "no sé nada"— y eso es más información que
   cualquier binario. Ver §4terdecies.
   **Y esta regla es solo para TASAS.** Un porcentaje de composición —"de mis
   10 partidas, 3 fueron por tiempo"— no estima nada: el denominador es la
   población, no una muestra. Ahí no hay margen ni mínimo.
3. **Números de distinta profundidad no se comparan.** Ni entre sí ni con los
   que muestra chess.com. La profundidad va escrita en el encabezado de cada
   tabla. Lo mismo el modo de clasificación.
4. **Antes de reportar un porcentaje, decir qué cuenta como acierto.** Hay un
   error abierto de esto ahora mismo: ver la sección 7.
5. **Cuidado con los confundidores.** Contra rivales flojos la pérdida baja
   sola, porque las posiciones son más fáciles. No comparar entre jugadores de
   distinta fuerza sin decirlo.
6. **Nunca afirmar de memoria que una casilla está atacada o defendida.** Se
   verifica con código. Ya se dio por colgada una dama que defendía un peón.
7. **Cada mecanismo va con su contraste.** Saber que un mecanismo aparece en el
   24% de las jugadas malas no dice nada si también aparece en el 20% de las
   buenas.
8. **Las partidas con asistencia en vivo no miden juego propio** y no entran a
   ningún promedio. El entrenador de chess.com muestra la evaluación todo el
   tiempo, avisa cuando hay mate y deja rehacer jugadas. Se separan pero **no se
   borran**: los episodios sirven, porque el aviso funciona como control.
9. **Un solo juez por tabla.** Si una columna dice "había una buena captura"
   según una heurística de material y la de al lado dice "fue mala" según el
   motor, cuando discrepan sale una fila que leída textual no tiene sentido.
   Pasó, y la fila decía "había captura ganadora, la tomé, y fue mala".
   Verificar leyendo cada fila en voz alta como una frase.
10. **Antes de mostrar una tasa, preguntarse si no es circular.** Si el grupo
    está definido por "no jugó la mejor jugada del motor", que pierda
    evaluación no es un hallazgo, es la definición.
11. **Cuando dos filas pueden darse en la misma jugada, decirlo.** Si no, el
    mismo efecto se muestra dos veces con nombres distintos y parece que hay
    dos hallazgos.
12. **Ausencia de aviso no es lo mismo que ausencia del problema.** Si algo no
    se pudo calcular, decir que no se calculó; callarse deja al lector creyendo
    que se midió y dio cero.

---

## 6. Estado actual

Configuración por defecto: profundidad 16, 4 motores, Hash 16 MB, memoria
limpia, MultiPV 2, modo crítico.

**Rendimiento:** ~15 s por partida de 50 jugadas la primera vez, instantáneo
después. 50 partidas tardaron 700 s en el celu y 288 s en la PC, con la misma
configuración. El rendimiento se mide siempre contra el celu, que es donde de
verdad se usa; los 4 motores y el Hash 16 están elegidos para ese aparato. La
caché es IndexedDB, o sea **por dispositivo**: analizar en la PC no le ahorra
nada al celu.

**Dos modos de clasificación**, que cambian **solo las etiquetas**: la pérdida y
la mediana son idénticas en los dos.

- **crítico** — corta por centipeones perdidos (0,5 / 1 / 3). Señala los
  desplomes desde posición ganada.
- **amigable** — corta por puntos de victoria perdidos, como chess.com. La curva
  es casi plana en los extremos, así que un desplome de +10 a +6 casi no se
  castiga.

Una jugada grave en crítico y buena en amigable **es**, por construcción, un
desplome desde posición ganada. Eso podría ser un filtro y no está aprovechado.

### Las tablas del mes, y qué pregunta contesta cada una

| Tabla | Tipo | Pregunta |
|---|---|---|
| Resumen | recuento | cuántas jugadas de cada categoría, y el desglose que concilia con "Malas" |
| Franjas de ventaja | tasa | desde cada nivel de ventaja, qué parte salió mal |
| Capturas | **reparto** | de las veces que había material a la vista, cuántas se vio |
| Mecanismos | **contraste** | cada mecanismo contra la tasa del resto de las jugadas |
| Por pieza / Por tramo | tasa | qué parte salió mal en cada grupo |

Tres formas distintas, y no son intercambiables:

- **tasa** (`tablaTasas`): columna **Tasa**, "qué parte de estas jugadas salió
  mal", **siempre con su margen** (§4terdecies). Lleva pegada la definición de
  jugada mala.
- **contraste** (`tablaContrastes`): igual, más **una referencia en la leyenda**
  —cuántas de todas tus jugadas salieron mal, con su denominador— contra la que
  se lee cada fila. Sin esa referencia un mecanismo no dice nada (§5.7). Avisa
  si dos filas se solapan. Hasta la v0.35 la referencia era una columna
  "% resto"; ver abajo por qué se fue.
- **reparto** (`tablaReparto`): las filas parten un mismo total y los
  porcentajes suman 100. No lleva la definición de jugada mala, porque sus
  porcentajes no son de jugadas malas; sí declara su denominador.

**Toda tasa pasa por `textoPct()`**, que le pone su margen. Hay una prueba que
falla si alguna tabla vuelve a calcularla por su cuenta — que es justo lo que le
había pasado a la tabla de franjas. *(Hasta la v0.47 la función era `pct()` y lo
que aplicaba era el mínimo de 30.)*

### Qué cuenta como jugada mala

Una sola definición: **pérdida de 3 peones o más**, igual en los dos modos. No
es lo mismo que la categoría "Error grave", y el resumen del mes lleva un
desglose calculado que dice a dónde fue cada jugada mala:

| Destino | Cuándo |
|---|---|
| Error grave | el caso normal |
| Omisión | además dejó pasar mate o material |
| Libro | es jugada de apertura |
| otra etiqueta | solo en modo amigable, donde la categoría se decide por puntos de victoria |

Y al revés: "Omisión" se lleva jugadas de pérdida menor a 3, que no son malas.

### El interruptor: el mes, o todo lo analizado

Mueve **todo el panel menos la lista de partidas**, que es del mes elegido
siempre porque sirve para abrir una partida y revisarla. Si el resumen mirara
un mes y las tablas de abajo un año, el desglose que concilia "Malas" con las
categorías dejaría de cerrar.

"Todo lo analizado" lo arma `barrerCache()`, **sin tocar el motor**:

1. Bajar el JSON de cada mes del usuario; ahí viene el `uuid` y el PGN.
2. Preguntarle a la caché por el `uuid`. Sin acierto, se ignora.
3. Solo las que aciertan se parsean y se derivan.

El orden importa: el costo escala con lo que analizaste, no con tu historial.
Parsear un PGN cuesta ~5,8 ms en PC, o sea ~10 s para 700 partidas en el celu.

De cada fila se guardan **solo diez campos** (`CAMPOS_FLACOS`). Se tiran fens,
evaluaciones, jugadas y PGN, que son para la pantalla de revisión. Un año de
filas flacas pesa 9 MB de JSON contra 35 MB del objeto entero.

**Cada fila lleva sus dos etiquetas** (`cats.critico` y `cats.amigable`). El
modo se usa en un solo lugar de `derivarFilas` y `categorizar()` es aritmética
—20.000 llamadas en 3 ms—, así que calcular las dos sale gratis y cambiar de
modo en "todo lo analizado" es instantáneo sin haber guardado las evaluaciones.

**Lo juntado se descarta** cuando cambia la profundidad o la configuración —son
parte de la clave de la caché— y cuando se analizan partidas nuevas.

Las partidas analizadas a **otra profundidad** no se mezclan, pero se cuentan y
el encabezado avisa que existen: si no, parecería que se perdieron.

### Qué es una buena captura

La decide **el motor**, no una heurística de material: hay una buena captura
cuando la mejor jugada del motor es una captura **y además** gana material. Las
dos condiciones — solo con la primera se llena de recapturas e intercambios que
se ven sí o sí.

Lo mismo vale para la categoría "Omisión" desde la v23. Y la omisión se dispara
por **no haber jugado esa captura**, no por no haber capturado nada: antes,
capturar otra cosa la tapaba.

**Con una excepción, desde la v0.52: tomar el mismo material con otra pieza.**
El endurecimiento de la v23 se había pasado de largo. Pedía la jugada EXACTA del
motor, así que una recaptura hecha con la pieza equivocada contaba como material
dejado pasar, y eso es falso: el material se cobró.

El caso que lo destapó es real y está en las pruebas. Tras `6...Qxd1+` hay
**exactamente dos jugadas legales y las dos comen la dama**: `Kxd1`, que es la
del motor, y `Nxd1`, que es la que se jugó. Salía "Omisión" con el cartel
*"había Kxd1, que ganaba 9"* —nueve puntos que en realidad se cobraron—, cuando
lo que costó elegir la otra fue **1,36**: el caballo de c3 deja de defender e4 y
entra `Nxe4`. O sea que la jugada era un **Error**, y como Error se etiqueta
ahora.

Se mira la **casilla de destino**, que es donde estaba el material, y vive en una
variable aparte, `tomoConOtra`. Aparte y no un `tomoBuena` más flojo, por el
canario: "La vi y la tomé" tiene que dar **cero** jugadas malas, y tomar con la
pieza equivocada sí puede perder. Por eso la tabla de capturas pasó de tres
situaciones a **cuatro**:

| Situación | Qué es |
|---|---|
| La vi y la tomé | se jugó la del motor — canario, va en cero |
| La tomé con otra pieza | mismo material, otra unidad — **no** es omisión |
| Tomé otra | se capturó en otra casilla |
| No capturé | no se capturó nada |

Solo las dos últimas cuentan como oportunidad perdida.

### Forzada: cuando no hubo decisión (v0.54)

Una jugada con **una sola jugada legal** no es buena ni mala: no la elegiste, te
tocó. Desde la v0.54 la revisión la muestra como **Forzada**, con flecha y color
neutro, en vez de "Mejor".

**No es una categoría, y eso es la mitad del diseño.** `FORZADA` vive fuera de
`CATEGORIAS` y fuera de `ORDEN` a propósito, y `forzada` no está en
`CAMPOS_FLACOS`. Contarla mentiría en las dos direcciones: sumaría "Mejor" que
no son mérito, y el denominador de las tasas incluiría jugadas donde no había
ninguna decisión que tomar. Las tablas siguen viendo la categoría de siempre; lo
único que cambia es lo que se lee mirando la partida.

Los **dos** lugares que dibujan una jugada —la tarjeta del veredicto y la tira
de jugadas— pasan por `presentar(f)`, que devuelve nombre, ícono y clave de
color. Es una función y no dos ramas sueltas porque si uno se olvida, la misma
jugada sale Forzada en un lado y Mejor en el otro; hay una prueba que lo fija.

En la tarjeta, una forzada **no muestra los números**: "pierde 0,00" invita a
juzgar algo que no se decidió.

`legales` ya se calculaba para la regla de Genial, así que el dato no cuesta
nada nuevo. Nota para calibrar expectativas: **en la partida de referencia hay
cero jugadas forzadas** —103 jugadas—, así que es una etiqueta rara. La captura
de chess.com que la mostró venía de su modo "Reintentar", explorando una
variante, no de la partida.

### El mate soltado y el dial "mate a la vista" (v0.53)

La omisión tenía un segundo agujero, y del lado opuesto: **un mate forzado
soltado no se marcaba nunca.**

La causa es que `categorizar` exigía las dos cosas —oportunidad Y pérdida de 1
peón o más—, y **la pérdida está saturada justo donde la omisión más importa**.
La evaluación se topea en 1000 cuando hay mate (`TOPE`, §"aBlancas"), así que
soltar un mate en 8 para quedar en +9,80 mueve la pérdida **0,20**. Nunca
llegaba al corte. La app veía el mate y hasta lo escribía en la señal —"había
mate forzado en 8"— y la etiqueta decía "Bien".

Ahora la oportunidad de mate no pasa por el corte de pérdida:

```js
if (d.oportunidad && (d.oportunidad.tipo === "mate" || x >= c.error)) return "omision";
```

La de material sigue pasando, y a propósito: material disponible que no costó
nada no es una omisión.

**Qué mate cuenta lo decide el usuario**, con el dial `mateVista`, que arranca
en 3. No es una perilla de medición sino la misma pregunta que "Modo" —qué tan
duro te juzga la app—, y por eso es suya: *un mate en 8 marcado como omisión a
570 de Elo no enseña nada, porque nadie a ese nivel lo iba a encontrar; un mate
en 2 soltado sí*. Sube a medida que el jugador mejora, o sea que funciona como
un dial de entrenamiento. Es además lo que impide que toda partida ganada se
llene de omisiones por mates de quince jugadas.

El dial se lee del DOM **fuera** del bloque de análisis, con `MATE_VISTA()`, y
entra a `derivarFilas` por parámetro: el bloque sigue siendo puro y probable en
node. Los siete llamados tienen que pasarlo, y hay una prueba que los cuenta,
porque uno olvidado se queda con el valor por defecto en silencio.

**Cambiarlo obliga a rebarrer "todo lo analizado"**, al revés que cambiar de
Modo. Las filas flacas llevan las dos etiquetas de Modo precalculadas pero no
llevan las evaluaciones, así que con otro corte no se pueden reetiquetar. El
barrido no toca el motor —lee la caché de evaluaciones y nada más—, así que se
paga en milisegundos y **la caché no se toca**: no hay que reanalizar nada.

Desde la v0.55 se rebarre **en el lugar**: mover un dial no es pedir cambiar de
vista, y antes te devolvía a "el mes seleccionado" sin que lo hubieras pedido
—lo que además hacía parecer que había que volver a analizar—. El barrido salió
a `juntarTodo()`, que usan los dos caminos que lo necesitan: elegir la fuente y
mover el dial. Una función y no dos copias, porque dos copias se desincronizan.

**Dónde nos separamos de chess.com a propósito:** ellos marcan Miss cuando el
mate se ALARGA (jugada 40 de la partida de referencia, de mate en 8 a mate en
13); nosotros exigimos que se pierda. Alargar un mate no cuesta la partida.

### Dar el mate no es soltarlo: `mate 0` (v0.60)

Reportado desde el celular, con la captura al lado: un **`40. Qxg7#` salía
"Omisión — había mate o material y se dejó pasar"**, con pérdida 0,00 y con
"MEJOR: la jugada" en el cuadrito. Leído en voz alta no cerraba, que es
exactamente el chequeo de la regla 9 de §5.

La causa era una comparación. El mate que le queda al rival se mira así:

```js
const sig = evs[i + 1].mate;              // el mate visto por EL QUE MUEVE DESPUÉS
if (!(sig !== null && sig !== undefined && sig <= 0)) oportunidad = { tipo: "mate", n: eMate };
```

`sig` viene del rival, así que si el mate sigue siendo mío él lo ve negativo.
**Pero cuando el mate se EJECUTA el motor dice `mate 0`**, que en UCI significa
"el que mueve ya está mateado" — o sea que el mate no se soltó, se dio. Con
`< 0` el cero caía del lado equivocado.

Lo llamativo, y por eso el `<=` va con un cartel al lado en el código: **el
resto de la app ya leía bien el `mate 0`**. `aBlancas` lo manda a −10000 para el
que mueve, que es lo correcto. Esta comparación era la única excepción.

De la misma tanda, la barra dejó de decir **"M0"**: es como lo dice el motor y
no como lo diría una persona. Ahora dice `mate`. Quién ganó ya lo dice la barra,
que en esa posición está llena de una sola punta.

### El mate EN CONTRA no existía (v0.60)

Toda la lógica de mate miraba `evs[i].mate > 0`, o sea **el mate a favor del que
mueve**. El que te hacen a vos no estaba en ningún lado, así que una jugada que
regala mate en 1 mostraba *"Error · Empeora la posición · la pieza movida queda
comible"* mientras la barra, tres centímetros más arriba, decía `−M1`.

Falla por el **mismo motivo** que el mate soltado, y es su espejo: la evaluación
está topeada en 1000, así que caer de −8,16 a mate da **1,84** y no llega al
corte de 3 de "Error grave". El corte está saturado justo donde el aviso más
importa.

**Por ahora es SOLO una señal y no toca la categoría**, por decisión del
usuario: cambiar la etiqueta movería los conteos de todas las tablas y de lo
acumulado, y eso se decide con la app en la mano. La señal no mueve ningún
número; solo deja de callarse, que es la regla 12 de §5.

```js
if (teMatan && !yaTeMataban) senales.push(`permite mate forzado en ${mateDespues}`);
```

**"No lo había antes" es necesario**, y es la misma decisión que la del mate
estirado: si ya te estaban matando, permitirlo de nuevo no es un hallazgo. Como
la condición pide que el mate *aparezca*, la señal se dispara **una vez**, en la
jugada que lo crea, y no en todas las que siguen. Sin eso una partida perdida se
llenaría del mismo cartel repetido.

**No pasa por `MATE_A_LA_VISTA` a propósito:** ese dial dice qué tan duro te
juzga la app, y esto no juzga nada, describe.

*(La discusión de si además tiene que cambiar la categoría quedó abierta, y el
usuario la ve como parte de "los textos de las categorías son genéricos" (§8):
`senales` es justo la materia prima de esa tarea.)*

### Cómo termina la partida: el remate (v0.61)

Con la partida terminada la barra mostraba `mate` o `+0.00`, que es la
evaluación de una posición que ya no se juega. Ahora muestra **el resultado**
—`1-0`, `0-1` o `Tablas`— y se llena **entera** del color del que ganó, o
partida al medio en tablas.

**Se llama "Tablas" y no "½-½", y costó una versión.** El `½-½` de la v0.61 se
puso sin dibujarlo: el glifo `½` es diminuto a los **9,5 px** del número de la
barra y se leía apretado. Se dibujaron las seis formas al tamaño real —`½-½`,
`Tablas`, `Empate`, `=`, `½`, `½ – ½`— y el usuario eligió mirándolas. Rompe la
simetría con `1-0` y `0-1` a propósito: esos dos se leen y `½-½` no.

`remateEnTablero` devuelve una **clave** (`"1-0"`, `"0-1"`, `"tablas"`) y el
texto vive en `TEXTO_REMATE`. Eso es lo que hizo que cambiarlo fuera una línea
en vez de una cacería, y hay una prueba que lo fija.

**La línea que decide cuándo se pisa la evaluación es de fondo, no cosmética:
solo cuando la partida terminó EN EL TABLERO.** Ahí no hay evaluación que
perder — el `mate 0` del mate y el `cp 0` del ahogado no son la opinión del
motor sobre la posición, son la regla del juego, así que "1-0" no tapa nada. En
cambio un abandono o una perdida por tiempo terminan en una posición **viva**, y
ahí el −8,16 sí dice algo —qué tan perdido estabas— que "0-1" taparía. Esas no
se tocan.

**El tope de la barra se saltea a propósito.** El `Math.max(2, Math.min(98, …))`
existe para que la barra nunca se vea vacía: con la evaluación en su máximo
queda siempre una astilla del otro color, y esa astilla dice *"todavía se
juega"*. Con la partida terminada eso es mentira, así que el remate va derecho a
100, 0 o 50.

**`remateEnTablero` no es `desenlace`.** La segunda vive en el bloque de tablas,
sale de las cabeceras del PGN y contesta "cómo terminó" para el mes. Esta mira
el FEN y contesta si la posición está terminada, que es otra pregunta.

**Se calcula solo en la última fila**, y no en todas: una posición terminal corta
la partida, así que ninguna otra puede serlo. Evita duplicar el `new Chess()` por
fila que ya paga `legales`, que en el barrido de un año se cuenta por cientos de
miles.

**Qué caza y qué no.** Del FEN pelado salen el mate, el ahogado, el material
insuficiente y la regla de las 50 jugadas —el contador va en el propio FEN—.
**No sale la triple repetición**, que está en la historia de la partida y no en
la posición: chess.js la mira sobre las jugadas jugadas y acá se arranca de una
posición suelta. Unas tablas por repetición o por acuerdo siguen mostrando la
evaluación, igual que un abandono. Hay una prueba que fija la limitación, para
que sea una decisión escrita y no una sorpresa.

### El mate forzado también llena la barra (v0.62)

Lo propuso el usuario para *"que quede visual que la partida se le escapó al que
tenía el mate"*, y al dibujarlo apareció un argumento más fuerte que ese.

**Un mate en 5 y un +9,90 pintaban casi la misma barra: 97,5% contra 97,2%.**
La evaluación se topea en 1000 (`TOPE`), así que arriba de todo se aplasta. Es
**la misma saturación** que obligó a inventar "Omisión" en la v0.53 —soltar un
mate movía la pérdida 0,20 y nunca llegaba al corte—, solo que en la barra y sin
que nadie la hubiera mirado. Llenarla entera **desatura lo único que la escala
no puede expresar**, así que no es una decisión estética: es la misma corrección
aplicada en otro lugar.

Y hace visible lo que el usuario quería: la barra estaba llena, el mate se
soltó, y se despega.

**El argumento en contra, anotado para no rediscutirlo:** el tope de 2 y 98
existe justo para que quede la astilla que dice "todavía se juega", y con un
mate forzado la partida efectivamente sigue y se puede soltar. Pesa menos porque
el número sigue diciendo `M5`, y porque **ver que se escapó es más útil que que
te recuerden que se puede escapar**.

**LA CURVA NO SE TOCA, y es decisión y no olvido.** Tiene la misma saturación,
pero ahí el borde es donde la línea se hace invisible: se dibujaría pegada al
marco y se dejaría de ver la forma. El mismo criterio da distinto resultado
porque el dibujo es distinto.

Los tres llenados viven juntos en `llenadoBarra`, que es puro y por eso se
prueba en node sin un DOM. El orden importa: **el remate le gana al mate
forzado**, porque la última jugada de un mate tiene las dos cosas y lo que
corresponde mostrar es el resultado.

### Cómo terminó, también cuando NO terminó en el tablero (v0.63)

Un abandono o una perdida por tiempo terminan con la posición **viva**, así que
`remateEnTablero` no las ve y la barra muestra la evaluación —con razón, ese
−8,16 dice qué tan perdido estabas—. Pero **nada decía que la partida había
terminado**. Ese era el agujero.

Se llena en dos lugares, y contestan preguntas distintas:

| dónde | qué dice | cuándo se ve |
|---|---|---|
| **cabecera**, al lado del rival | `1-0`, `0-1` o `Tablas` | siempre, en cualquier jugada |
| **cierre de la tira de jugadas** | `1-0 · abandono · 40 jugadas` | al llegar al final |

**`comoTermino` no es `remateEnTablero` ni `desenlace`.** La primera mira el FEN
y solo sabe de mate, ahogado, material insuficiente y 50 jugadas. `desenlace`
contesta desde el lado del usuario para contar el mes ("Perdí por abandono").
Esta sale del encabezado `Result` y del JSON de chess.com, y devuelve el
resultado **en notación y sin lado**, porque se muestra al lado del nombre del
rival y no adentro de una frase.

**El motivo lo escribe siempre el que no ganó** —chess.com le pone "win" al
ganador y el detalle al otro—, y en tablas ninguno ganó y los dos lo traen, así
que mirar al blanco alcanza. Es la regla de `motivoDesenlace` pero **sin
necesitar de qué lado jugaba el usuario**: un PGN pegado no lo sabe, y aun así
el resultado se puede mostrar. Sin `meta` no hay motivo y el cierre queda en
`1-0 · 40 jugadas`; sin `Result` no aparece nada, porque callarse es mejor que
inventar.

**El cierre cuenta jugadas de ajedrez y no filas.** `filas.length` son medias
jugadas: en la partida de prueba da 36 cuando en ajedrez son 18. Sale del `n` de
la última fila, que es el mismo número que muestra la tarjeta.

**La lista baja hasta el fondo en la última jugada, y sin eso el cierre NO SE VE
NUNCA.** El scroll de siempre deja la jugada elegida pegada al fondo del
recuadro, y el cierre queda justo abajo, fuera de vista — o sea invisible
exactamente en la única jugada donde importa. Se descubrió mirándolo.

#### El contador "jugada N de M" se fue

Contaba **medias jugadas**, así que la misma posición tenía dos números en la
misma pantalla: la tarjeta decía `18… Kg8` y el contador `36 de 36`.

Y lo que hacía —ubicarte en la partida— lo hacen mejor las dos cosas que ya
están: la **tarjeta**, que da la jugada en el idioma del ajedrez, y la **raya
del "estás acá" de la curva**, que la da en proporción. Al sacarlo queda **un
solo sistema de numeración** en toda la vista.

Se probó acortarlo antes de sacarlo (`1/79`, `1 de 79`, apilado con la palabra
abajo) y ahí apareció el argumento que decidió: **`1-0  36/36` se lee como dos
resultados**, dos pares de números pegados del mismo peso. La palabra "jugada"
estaba haciendo de separador, así que el contador solo convivía con el resultado
siendo largo, que era justo lo que se quería evitar.

#### El nombre del rival cede, el resultado no

El nombre de chess.com puede tener 25 caracteres, así que la cabecera pasó a
tres celdas: el nombre se recorta con puntos suspensivos y el resultado nunca.
Medido sobre 30 combinaciones de nombre y resultado: **0 envuelven**. Sin eso,
un rival de nombre largo parte el renglón y empuja el tablero hacia abajo.

#### El motivo no aparecía, y por qué el arnés no lo vio (v0.63.1)

Reportado por el usuario apenas se publicó: **el motivo no se veía nunca**.

Hay **tres caminos** hasta la revisión y el motivo solo funcionaba en uno:

| camino | ¿llega el JSON del mes? |
|---|---|
| Analizar el mes → elegir de la lista del mes | **sí**, ese camino pega `r.meta = g` por su cuenta |
| Elegir una partida → "Analizar la partida" | **no** — y es el que se usa |
| PGN pegado | no, y no puede: el motivo no está en el PGN |

`analizarPartida` recibe un PGN suelto, así que no sabe ni tiene por qué saber
del JSON. El arreglo es una global, `ELEGIDA_META`, que se guarda al elegir de
la lista y se engancha al resultado; se limpia en los dos lugares donde deja de
haber partida elegida, o una partida pegada heredaría el motivo de la anterior.

**Por qué el arnés no lo agarró, que es la parte que importa.** Entraba
**pegando el PGN**, que es exactamente el único camino donde el motivo no existe
ni tiene que existir. O sea que probaba el caso donde la ausencia es correcta y
nunca tocaba el caso donde era un bug.

Desde la v0.63.1 el arnés **falsea la API de chess.com** —el listado de meses y
el JSON del mes, armados a partir del propio PGN de prueba— y entra **por la
lista**, como el usuario. Con eso recorre el camino de verdad. Además imprime en
texto lo que dicen la cabecera y el cierre:

```
cabecera: "vs MewoneX (601)" "1-0"
cierre:   "1-0 · abandono · 18 jugadas"
```

**Regla que sale de acá:** cuando hay más de un camino hasta la misma pantalla,
el arnés tiene que recorrer **el que usa el usuario**, no el más fácil de
programar. El PGN pegado se eligió porque ahorraba simular la API, y ese atajo
escondió el bug.

#### Dos pendientes que quedaron abiertos acá

- **Dónde tiene que vivir "cómo terminó".** El cierre de la tira solo se ve al
  llegar al final de la lista, y el largo que muestra —"40 jugadas"— repite el
  número que la propia lista tiene un renglón más arriba. Lo marcó el usuario:
  *"si el listado ya cierra con 40, y esto se ve recién al final del listado, no
  me cierra"*. Se publicó igual para no frenar, pero la ubicación está por
  decidirse.
- **`regla de 50 jugadas · 61 jugadas`.** Cuando el motivo es ese, la palabra
  "jugadas" aparece dos veces en el renglón **con dos significados distintos**:
  el largo de la regla y el largo de la partida. Se dibujaron cuatro salidas
  —callar el largo en ese caso, acortar el motivo, reescribirlo como "sin comer
  ni mover peón", o dejarlo— y se dejó como está por ahora. La de callar el
  largo es la que no fuerza nada: no toca el vocabulario que comparte la tabla
  del mes ni inventa un segundo nombre para lo mismo.

## 7. Trabajo acordado, en orden

### LO PRIMERO AL RETOMAR (cortado en la v0.84)

Quedó una tanda a medio hacer, y esto es la lista con la que se sigue. **El
usuario de PC eligió las trece ideas que se le ofrecieron**, y una con nombre
propio: *"ver cuánto tiempo pensaste cada jugada: fundamental"*, que ya está.

**Hechas: 13 de 13** (v0.80 a v0.90, §4duovicies a §4trigies)

| | |
|---|---|
| ✅ | Los combos ya no salen blancos sobre blanco |
| ✅ | La tira se arrastra con el mouse y se mueve con la rueda |
| ✅ | La lista de jugadas vuelve, en una segunda columna |
| ✅ | El tablero crece en PC, limitado por el alto |
| ✅ | El tiempo pensado, en las dos formas de la lista |
| ✅ | Previa al pasar el mouse, rueda sobre el tablero, tecla `n`, y las primeras reglas `:hover` |
| ✅ | Arrastrar la pieza |
| ✅ | Flechas y casillas con el botón derecho |
| ✅ | La barra de evaluación vertical por defecto en PC |
| ✅ | Las piezas comidas al costado del tablero |
| ✅ | El gráfico de la partida a lo ancho de las dos columnas |
| ✅ | La segunda y tercera mejor del motor, al lado del tablero |
| ✅ | Tablero más grande corriendo la tarjeta al costado (tres columnas) |

**La tanda está cerrada: las trece.** Lo de PC se hizo de corrido, sin dibujar y
mostrar antes, porque el usuario lo pidió así —*"no voy a revisar nada de lo que
sea solo PC"*—. **La regla de §10 sigue en pie para todo lo que se vea en el
celular**: eso se dibuja y se espera el ok, siempre. Lo que la reemplazó acá fue
la comparación byte a byte de las 28 capturas de celular en cada versión, que es
lo que prueba que nada de PC se filtró.

**Y las tres anotaciones del usuario que siguen sin hacer**, ya medidas y
diagnosticadas en esta sesión (los números están en §8):

- **En la variante no aparece la mejor jugada**, y de yapa la flecha verde que
  se dibuja al abrir la prueba tocando una pieza **es de la posición
  equivocada**. Las dos las tapa el mismo arreglo.
- **La tarjeta se achica al probar y el tablero salta 78 px**, justo mientras se
  intenta encadenar la jugada siguiente.
- **La partida tarda en aparecer en el listado.** Falta que el usuario haga el
  test de 30 segundos que decide si es el CDN de chess.com o nuestro.

**Cómo se trabajó esta tanda, que conviene repetir:** cada cambio con su
captura mirada de verdad, `npm run mirar` con la pasada ancha, y **la
comparación byte a byte de las 30 capturas de celular contra las de la v0.79**,
que es lo que prueba que nada de PC se filtró al celular.


### Hecho (v18 a v25)

Los cinco arreglos de la lista original están cerrados. Cada uno tiene su
commit y su prueba de regresión:

1. Sacar la tabla "Por color" — era ruido (v18).
2. Sacar el mecanismo "casilla atacada por un peón" — caso particular de "dejé
   comible la pieza que moví" (v19).
3. Las filas "no" de mecanismos pasan a columna (v19).
4. Decir en cada leyenda qué cuenta como jugada mala, y conciliar los totales
   con un desglose calculado (v20).
5. Franjas de ventaja respeta el mínimo de 30 — armaba su propio HTML (v20).

Y además, no previsto: el juez de las capturas (v22), el mismo juez para
"Omisión" (v23), la tabla de capturas de tasa a reparto (v24), el recorte de
columnas en el celu (v21) y el aviso de solapamiento (v25).

### Funcionalidad, lo que sigue

El interruptor "el mes seleccionado" / "todo lo analizado" está hecho (v26); se
describe en §6.

7. **Comparar dos jugadores.** Historial cara a cara y precisión de los dos,
   solo sobre las partidas entre ellos. Los datos ya están: las partidas se
   descargan enteras y la precisión se calcula para ambos lados.

8. **Estadísticas que tomen el tiempo en cuenta.** Pedido por el usuario.
   **HECHA la primera de las tres, en la v0.43** —"dónde se va el reloj", la
   columna Seg.— y con ella toda la plomería: `leerCadencia`,
   `segundosPensados`, el `seg` en la fila y en las filas flacas. Ver §4nonies.
   **Faltan las otras dos** (el apuro y cuánto pensaste) y, del mismo pedido,
   "la jugada larga que no sirvió". El bucle que calcula el gasto ya tiene
   `restan`, que es lo que necesita el apuro; no se emite hasta que haya algo
   que lo use. Lo que sigue vale como registro de por dónde se empezó:
   **Los datos están y se comprobó**: 14 de las 15 partidas del mes 2026-09 traen
   `[%clk 0:05:00]` en el PGN (la que no, es la única *daily*), y chess.js ya
   los parsea —`get_comments()` los devuelve por FEN—, así que **no hace falta
   escribir un lector**. El tiempo por jugada sale de restar relojes
   consecutivos y sumar el incremento del `TimeControl`.

   Son **tres formas distintas** y conviene no mezclarlas:
   - **Cuánto pensaste esa jugada**: tasas por tramo de segundos gastados.
   - **Cuánto te quedaba en el reloj**: la pregunta del apuro. Es otra cosa y
     probablemente más accionable.
   - **Como apoyo**: una columna de segundos medianos en las tablas que ya
     existen (por pieza, por tramo, por franja). Contesta "dónde se me va el
     reloj" sin inventar tablas ni cortes, y es la única de las tres que no
     tiene el problema de abajo.

   **Dos advertencias, cualquiera de las dos invalida el resultado:**
   - **No se pueden mezclar cadencias.** Diez segundos en un 5+0 es muchísimo y
     en un 10+0 no tanto. Ese mes tenía 12 blitz, 2 rapid y 1 daily sin reloj:
     un tramo "menos de 3 segundos" que las mezcle no significa nada. Es el
     mismo problema de denominadores que sacó la columna "% resto". Hay que
     declarar la cadencia o partir por ella.
   - **Hay confundidor**, el mismo de siempre: se piensa más en las posiciones
     difíciles. Si sale que "las jugadas que más pensé salen peor", puede ser
     que pensar de más haga mal, o que las difíciles sean difíciles. Se separa
     estratificando, igual que en §8.

9. **ELO estimado a partir de la precisión** contra el rating de los rivales.
   Cuidado: el rating de chess.com es inestable y contra rivales flojos la
   precisión sube sola. Mostrar siempre el rango y la cantidad de partidas,
   nunca un número solo.

### Estética

El refactor de la interfaz arrancó en la v27. La decisión de fondo, tomada por
el usuario: **la app va a tener dos vistas equivalentes, Partida y Mes**, en vez
de subordinar una a la otra. La dirección visual elegida es densa —toda la
información de la jugada en una pantalla, sin scrollear— y no la de tarjetas
grandes. Se decidió mirando tres propuestas dibujadas a ancho de celular.

~~Lo que falta de esa dirección, y es la próxima tanda: rehacer la disposición
de `zonaRevision`.~~ **HECHO en la v0.74**, y está en §4septdecies. Se dibujaron
seis distribuciones completas antes de tocar código y el usuario eligió mirando.
Dos cosas salieron **al revés** de como estaban anotadas acá, y conviene saberlo
antes de volver a moverlas: la barra de evaluación **no** fue vertical al
costado del tablero —quedó horizontal arriba, que es donde ya estaba— y la lista
de jugadas **volvió a ser la tira horizontal**, que es lo que esta línea quería
sacar. La tira nueva no es la vieja: lleva la partida entera y se centra sola, y
el panorama de la partida ahora lo da la curva.

**Regla de trabajo que salió de acá:** proponer el enfoque y esperar el visto
bueno antes de construir. Y antes de dibujar algo, mirar si ya existe público:
el juego de piezas se eligió mirándolo en lichess, no renderizándolo acá.

9. Pasada visual completa. **Tocar estilos y estructura visual, no la lógica de
   análisis.** Varias constantes que parecen arbitrarias costaron mediciones:
   están comentadas en el código y los comentarios explican por qué.
   *(El repaso de los textos de las leyendas, que figuraba acá, se hizo en la
   v0.44–v0.45: se leyeron juntas, se partieron en corto y `?`, y se les sacó el
   eco. Ver §4decies. Quedan largas `capResumen` y `capBanco`, las dos del banco
   de pruebas, o sea modo dev.)*

## 8. Pendientes de fondo, sin resolver

### Tres fallas reportadas y MEDIDAS, todavía sin arreglar (v0.84)

Las midió la sesión de la v0.80–v0.84 y no llegó a arreglarlas. **Los números
están acá para no volver a medirlos.**

**1. En la variante no aparece la mejor jugada — y hay un bug de yapa.**

Contando las flechas del tablero por color (azul = la jugada de la partida,
verde = la mejor, violeta = la inventada):

```
DENTRO de la variante, con "Mostrar la mejor" prendido : ["violeta"]
FUERA de la variante,  con "Mostrar la mejor" prendido : ["azul", "VERDE"]
```

Está puesto a propósito en `pintarRevision` (`PRUEBA.ver === 0 && verMejor`) y
tiene sentido: `f.mejor` es la mejor de la posición ORIGINAL, y dibujarla sobre
una posición inventada sería mentira. **Pero el dato bueno ya lo tenemos**: cada
jugada de la variante guarda su evaluación, y ahí viene la mejor de esa posición
nueva. `posicionVista().ev.mejor` es exactamente la mejor de la posición que se
está viendo, tanto adentro como afuera de la variante.

**El bug de yapa**: abriendo la prueba TOCANDO UNA PIEZA, la variante arranca de
la posición de *después* de la jugada, pero la flecha verde sigue siendo la de
*antes*. Medido, coordenadas idénticas:

```
fuera de la variante   : VERDE 120,204 → 78,162
recién tocada la pieza : VERDE 120,204 → 78,162   (el tablero ya muestra otra posición)
```

La azul sí cambia como corresponde; la verde se quedó pegada. **Hoy muestra una
flecha equivocada sin avisar.** El mismo arreglo tapa las dos.

**2. La tarjeta se achica al probar y el tablero salta.**

La tarjeta va arriba del tablero (v0.74), así que todo lo que cambie de alto lo
empuja. Medido en los tres momentos:

| momento | alto de la tarjeta | dónde arranca el tablero |
|---|---|---|
| antes de probar | 82 px (veredicto) | y = 836 |
| se toca la pieza y se pone la jugada | 61 px (prueba) | y = 816 |
| contesta el motor | 120 px | y = 874 |

**El tablero se va 20 px para arriba y después baja 58: 78 px de recorrido**
justo mientras se intenta encadenar la jugada siguiente. La salida es reservarle
el alto a la caja de la tarjeta mientras la prueba está abierta, para que no se
achique.

**3. La partida tarda en aparecer en el listado.**

**No se pudo medir desde el entorno remoto**: `api.chess.com` da 403 por la
política de red. Lo que sí es nuestro, y son dos cosas:

- El mes se pide con un `fetch(url)` pelado, o sea con la **caché HTTP del
  navegador por defecto**. Si el navegador la tiene guardada, devuelve el mes
  viejo sin salir a la red.
- **No hay forma de recargar el mes.** El combo reacciona a `onchange`, y elegir
  el mes que ya estaba seleccionado no dispara nada. Hay que apretar "Buscar" de
  nuevo, cosa que no está escrita en ningún lado.

**El test que lo decide, y que el usuario todavía no hizo**: cuando una partida
no aparezca, abrir en otra pestaña
`https://api.chess.com/pub/player/USUARIO/games/AAAA/MM` y buscarla ahí. Si está
y en la app no, es nuestro (caché). Si tampoco está, es el CDN de chess.com y
del lado nuestro solo cabe un botón de recargar.


> ⚠ **Las mediciones de esta sección se tomaron con las cadencias mezcladas y
> sin márgenes.** Desde la v0.46 la vista Mes habla de una sola cadencia, y
> desde la v0.50 toda tasa va con su margen. Las dos cosas cambian estos
> números: varios de los hallazgos de abajo probablemente tengan un margen tan
> ancho que no sostengan nada. **Antes de sacar conclusiones de esta sección hay
> que volver a medirla**, por cadencia y mirando el ancho del paréntesis.

*(Los cuatro pendientes chicos de la v26 se resolvieron: barra de progreso en la
v33, `textoDesglose` y la columna "% resto" en la v0.36, y el historial de
resultados en la v0.39.)*

### Índice de lo abierto, para retomar

Está todo descripto más abajo o en la sección que se indica; esta lista es para
no tener que leer la sección entera para saber qué hay.

**De la tanda de la explicación y la variante (v0.64 a v0.75):**

1. **Medir cuánto habla la tarjeta con motor de verdad.** El 34 de 36 es del
   arnés. Abajo, en "los textos de las categorías".
2. **Más conceptos**, empezando por **pieza atrapada**. La lista y los que se
   rechazaron, en §4octodecies.
3. **Los tres cuadritos** (Mejor / Pérdida / Caída). Abajo, en "De interfaz".
4. **Guardar la variante**: al salir se tira. Toca la caché. Abajo.
5. **La puerta "en vez de esta jugada" y el botón por veredicto**, que se
   fueron con la fila de botones. Abajo, en "De interfaz".
6. **La estética de la navegación por las jugadas**, que el usuario dio por
   servible pero mejorable. Abajo, en "De interfaz".
7. **Dónde van las jugadas probadas** (v0.76). La tarjeta punteada ya reemplaza
   a la real, que era el pedido; lo que falta es elegir entre las cuatro formas
   del dial. En §4sexdecies, con lo que ocupa cada una.
8. **Cuánto habla la tarjeta** (v0.77): corta, media o larga, el otro dial. En
   §4novodecies, con lo que mide cada una. Corta y media **ya se distinguen**:
   la v0.78 sumó la segunda frase de "cómo llegaste", que era lo que las
   igualaba.
9. ~~**La tanda cara de los conceptos**~~ **HECHA en la v0.78**: las cinco, en
   §4vicies. Y con ellas la tarjeta quedó 2,4 veces más rápida que antes,
   porque medir dónde estaba el costo mostró que no estaba en lo nuevo.

**Del resto, lo que sigue vivo:** comparar dos jugadores y las dos estadísticas
de reloj que faltan (§7), el listado de partidas sin rediseñar y la pantalla de
configuración (abajo), la paleta despareja, las animaciones, y las mediciones de
fondo que hay que rehacer por cadencia y con margen (el aviso de acá arriba).

**Estado del repo:** toda la tanda está en `main` y **en vivo**, hasta la
**v0.79** inclusive. La nota vieja de acá decía que la v0.64 a la v0.75 vivía sin
mergear en `claude/cards-explanation-move-testing-maozyk` y que en vivo había
v0.63.1; quedó desactualizada y se corrigió. **Lo que sigue abierto de esta lista
es por decisión pendiente, no porque no esté desplegado.**

### De interfaz

- **La paleta tiene luminosidades desparejas.** El ámbar de Imprecisión llama
  más la atención que el verde de Bien sin que eso signifique nada. Los
  símbolos de la v0.35 arreglaron la **legibilidad**, no el **volumen**. La
  propuesta medida —seis colores a la misma luminosidad percibida— está en
  §4quinquies con los ocho hex ya calculados, para no rehacer la cuenta.

- **El listado de partidas está sin rediseñar.** Tiene un `max-height: 34vh`
  puesto en la v33 para que el botón de analizar quede a la vista; es un parche,
  no un diseño. Falta decidir cuántas mostrar, cómo se ven y cómo se busca.

- ~~**No hay pantalla de configuración**~~ **HECHA en la v0.91**, y está contada
  entera en §4untrigies: la hoja que sube desde abajo, la tuerca en el renglón
  del título, y los seis `<select>` adentro. La fila de controles del pie pasó de
  **156 px a 33**. Lo que sigue abierto de este ítem son dos cosas que ahora
  tienen dónde ir: los **juegos de piezas** (§4bis, costurados desde la v27) y la
  **preferencia de "mostrar la mejor"** (§4bis).

  **El selector de cadencia (v0.46) NO es de este grupo y no se movió acá a
  propósito**: no es una preferencia sino el **alcance de los datos**, igual que
  "El mes seleccionado / Todo lo analizado", así que va al lado de ese y no en
  una pantalla aparte. La regla que salió, y que decidió qué entró al menú: lo
  que cambia *qué datos se miran* va a la vista; lo que cambia *cómo se ven* va
  a configuración.

- **Los tres cuadritos (Mejor / Pérdida / Caída) están sin resolver.** Quedan
  sueltos abajo de la curva y son lo que más lugar ocupa por lo poco que dicen.
  Se dibujó la alternativa —meterlos en un renglón gris adentro de la tarjeta—
  y recuperaba unos 60 px, pero **"Mejor" deja de poder tocarse**, que hoy es el
  atajo para ver la mejor jugada en el tablero. El usuario los dejó como están y
  pidió anotar que hay que revisar cómo dejarlos bien. Las dos formas se
  dibujaron en su momento en el arnés (`dist-E` y `dist-E-compacta`); **ese
  código ya no está** —se fue con la v0.74, como se van todas las maquetas— así
  que para volver a verlas hay que redibujarlas.

  **La estética de la TIRA sí se resolvió** en la misma mirada: sin recuadro en
  cada jugada, galones sin botón, y la actual marcada con el 20% del color de su
  categoría, que es exactamente como la lista vertical la marca desde la v28. Lo
  que NO hay que tocar sin volver a pensarlo es el comportamiento: la tira lleva
  la partida entera y se centra sola en la jugada actual, y de ahí sale que
  siempre se vea que hay más para los dos lados cuando lo hay.

- **La estética de la navegación por las jugadas quedó "servible, mejorable".**
  Es palabra del usuario, mirando la tira de la v0.74: los dos galones dibujados
  a los costados y los eslabones al medio hacen lo que tienen que hacer, pero
  ninguna de las alternativas dibujadas lo dejó lindo. Vale para la tira de la
  partida y para la de la variante, que se dibujan igual desde la v0.74.1.

  No se contradice con el ítem de arriba: ahí lo que se cerró es **cómo se ve
  cada jugada** —sin recuadro, la actual con el 20% del color de su categoría—,
  y lo que queda abierto es **cómo se ven los galones y el conjunto**. Y el
  **comportamiento** de la tira, que sí está cerrado, es lo que no hay que tocar
  sin volver a pensarlo: lleva la partida entera y se centra sola.

- **Dos cosas se fueron con la fila de botones (v0.74) y vale reconsiderarlas.**
  La fila se sacó por un motivo bueno —navegar sin ver el tablero no sirve— pero
  se llevó puestas dos que no tenían nada que ver con eso:

  - **la puerta "en vez de esta jugada"**, que abría la variante reemplazando la
    jugada propia. Hoy la única puerta es tocar una pieza, que arranca de la
    posición de DESPUÉS; para reemplazar hay que volver una con el galón y darse
    cuenta solo de que eso es lo que hay que hacer. Nadie midió si se descubre.
  - **el botón que cambiaba de color según el veredicto** (v0.68), que era la
    única pieza de la pantalla que reaccionaba a la categoría además del texto.

  No es "volver a ponerlos": es decidir si eso que hacían tiene que estar en
  algún lado, ahora que el lugar donde estaban no existe.

- **El reloj no se ve en el tablero.** Pedido del usuario, y salió de descartar
  una frase: la tarjeta podía decir "la jugaste en 2 segundos" —el dato está en
  la fila desde la v0.43— y él prefirió que el tiempo **se vea en el tablero**,
  no que se cuente en la tarjeta. Falta decidir qué se muestra: los segundos que
  gastó esa jugada, lo que quedaba en el reloj, o los dos relojes como en una
  partida en vivo. Lo que quedaba pide `restan`, que el bucle ya calcula y no
  emite (§7.8).

- **Las animaciones son una rama sin empezar.** Apareció al ver que el
  deslizamiento del tablero no resulta intuitivo: un galón estático avisa que
  *se puede*, pero enseñar *cómo* es trabajo de una transición. Es lo que le
  daría el salto de "se ve bien" a "se siente bien".

### De fondo

- **"Jugada siguiente a una mala" tiene un confundidor.** Da 21,8% contra 6,0%
  del resto, pero después de un error la posición está peor y las jugadas son
  más difíciles: puede ser que encadene errores o puede ser la posición. Se
  separa **estratificando** por dificultad, no agregando una fila.

  La medida de dificultad ya está calculada: `unicaBuena`, la diferencia entre
  la mejor y la segunda del motor. Falta emitirla en la fila; son dos palabras.
  Tres advertencias antes de usarla:
  - el corte de 150 centipeones está elegido para disparar "Genial", que es
    otra cosa; para esto conviene guardar la diferencia cruda;
  - cuando el motor no devuelve segunda, `unicaBuena` queda en `false`, y una
    razón de que no la devuelva es que **haya una sola jugada legal** — o sea
    la posición más forzada posible cae en el estrato equivocado. Se arregla
    con `legales`, que se calcula ahí al lado;
  - con 78 jugadas partidas en dos estratos, cada uno queda muy chico. *(Esto
    decía "necesita la funcionalidad 6 primero", porque un estrato caía debajo
    del mínimo de 30 y no se mostraba. Desde la v0.50 no hay mínimo: los dos
    estratos se pueden mostrar ya, con su margen, y el margen va a decir solo
    si alcanzan o no. El bloqueo dejó de ser técnico y pasó a ser de muestra.)*

  Hay un paso previo barato: ver si el confundidor existe, comparando qué
  porcentaje de cada grupo son posiciones de una sola buena. Si da parecido, no
  hay confundidor y el hallazgo se sostiene.

- **Los dos mecanismos se solapan.** Una jugada puede dejar la pieza comible y
  además venir después de una mala. Desde la v25 la leyenda dice cuántas caen
  en las dos filas, pero no está resuelto: sigue habiendo dos filas que en
  parte miden lo mismo. Hacerlas excluyentes se descartó, porque obliga a
  elegir arbitrariamente cuál gana.

- ~~**Falta el dibujo de la curva de quién va ganando.**~~ **HECHO en la
  v0.58**, con las tres decisiones que estaban abiertas resueltas y explicadas
  en §4quaterdecies: el eje es `winPct` —la misma escala que ya llena la barra,
  que comprime sola—, va pegada arriba de la tira de jugadas, y sí se marcan las
  categorías, pero seis de diez. Se toca para ir a esa jugada. **En la v0.59 la
  forma de la marca pasó a ser elegible** —punto, punto chico o raya—, después
  de que la raya sola tapara la curva en una partida de 77 jugadas.

  **Lo que quedó abierto y es de gusto**, no técnico: la curva no distingue el
  lado del usuario —las blancas van siempre abajo—, y las marcas son lo único
  que dice cuáles jugadas son suyas. Si al usarla resulta que se lee al revés
  cuando se juega con negras, se decide ahí.

- **La fila "Tomé otra" no dice cuánto costó.** Sabemos que se capturó otra
  cosa, no qué se perdió por no tomar la buena. Solo se puede saber si la buena
  captura era la mejor o la segunda del motor, que es lo que hay con MultiPV 2.

- **La franja de ventaja no replicó fuera del archivo del usuario.** En un
  segundo jugador dio 5,0 / 9,4 / 6,3 / 10,6: sube, baja y vuelve a subir. No se
  puede distinguir si la forma es propia de un jugador o si se diluye a
  profundidad 16 con memoria limpia. Como está, la tabla no informa.

- **"Por pieza" dio resultados opuestos en los dos jugadores** (peón 12,3 y
  torre 4,5 en uno; peón 6,0 y torre 10,6 en el otro). Un mes de cada uno no
  alcanza para saber si son estilos distintos o dos muestras chicas.

- **"Genial" marca las jugadas equivocadas, no demasiadas.** Esto decía que se
  disparaba ~2 veces por partida y que era mucho. **Medido contra chess.com,
  es falso:** en la partida de referencia damos 3 y 2 por jugador, idéntico a
  ellos, en los dos modos. La frecuencia está bien; lo que falla es *cuáles*.

  De las cinco, tres coinciden (5. dxe5, 25. Kxd4, 31. Nxg4). Nuestros dos
  falsos positivos son `10… fxe6`, una recaptura con peón, y `14… Nc4`, que sale
  por cruce de banda con la primera y la segunda a 33 centipeones. Las dos que
  nos faltan son `7… Nxe4` y `16… Nxf1`.

  Su criterio publicado dice tres disparadores —*perdiendo → igualada*,
  *igualada → ganando*, o *la única jugada buena*— más generosidad según el
  rating. **Los tres son los que ya tenemos**: los dos primeros son nuestro
  `cruce` y el tercero es `unicaBuena`. No hay que rediseñar, hay que calibrar.

  Tres cosas que la medición ya cerró, para no volver a probarlas:
  - **Filtrar por venir ya ganando no sirve.** Mataría `5. dxe5` (+2,05) y
    `31. Nxg4` (+6,12), que son dos de las tres que sí coinciden. Bajaría la
    coincidencia de 3/5 a 1/5.
  - **Bajar el corte de 150 tampoco.** A profundidad 20 —la de chess.com— las
    dos que ellos marcan dan 95 y 47, y las dos que no marcan dan 160 y 96.
    Están entreverados: ningún corte los separa.
  - **`16… Nxf1` no es falta de profundidad.** La diferencia da 0 a prof. 16,
    47 a 20, 40 a 24 y 57 a 30. El hueco no existe a ninguna profundidad.

  **La hipótesis viva** es que las cinco de chess.com son *capturas que no son
  recapturas*, y los dos falsos positivos son justo los que no cumplen eso: uno
  es recaptura, el otro no captura nada. Ajusta las siete jugadas, con dos
  advertencias: son tres condiciones ajustadas a siete puntos —sobreajuste puro
  hasta que se pruebe contra un mes— y la de "única capturadora" hay que contarla
  con `gananciaDeCaptura`, no con las jugadas legales: en `5. dxe5` hay dos
  capturas posibles y `Nxe5` pierde 2 puntos, así que buena hay una sola.

  **El filtro de recaptura se aplicó en la v0.56** y es lo único de todo lo que
  probamos que aguantó: `10… fxe6` da 152 a profundidad 16 y 160 a la 20, o sea
  que dispararía a cualquier profundidad, y chess.com no la marca. Sobre la
  partida entera saca esa jugada y **ninguna otra** —hay 8 recapturas y solo esa
  era Genial—, así que es quirúrgico y no un hachazo. Quedamos en 4 contra sus 5.

  **Cuidado con la definición, que la tuve mal un rato.** Recaptura es *el rival
  comió en una casilla y vos comés de vuelta ahí*: hacen falta las tres
  condiciones. Pedir solo que las dos jugadas terminen en la misma casilla es
  demasiado ancho —en `1.e4 d5 2.exd5` el peón se acababa de mover a d5 y
  comerlo no es recaptura, es cobrar algo colgado, que sí puede ser un
  hallazgo—. Con la definición ancha daban 11 recapturas; con la correcta, 8.
  Hay una prueba con las dos jugadas de la misma partida, `2.exd5` y `2…Qxd5`,
  idénticas en todo lo demás, para que nadie la vuelva a ensanchar.

  El filtro tapa las **dos** mitades de la regla. La evidencia es sobre
  `unicaBuena`, que es por donde entró, pero una recaptura tampoco es un
  hallazgo cuando cambia de banda: la ibas a jugar igual.

  **La hipótesis de "capturas que no son recapturas" está MUERTA como regla, y
  cómo murió es la lección.** Ajustaba las siete jugadas que estábamos mirando,
  y eso convencía. Corrida sobre las 103 de la partida dispara **once** veces
  contra las cinco de chess.com: agarra las cinco, sí, pero agrega seis falsos
  positivos (`6… Qxd1+`, `10. Bxe6`, `25… Rxh4`, `32. Nxg5+`, `33. Nxf3` y el
  `14… Nc4` que ya teníamos). Una captura que no es recaptura es una jugada
  corriente, no una hazaña.

  El error fue probar la hipótesis **solo contra las jugadas que la habían
  sugerido**. Regla que sale de acá: *una regla candidata se corre sobre la
  partida entera antes de creerle, aunque ajuste perfecto en los casos que la
  inspiraron.*

  **Lo que sigue faltando, después de la v0.56.** Quedamos en 4 contra las 5 de
  chess.com, con un falso positivo y dos que no marcamos:
  - `14… Nc4` sale por **cruce de banda** con la primera y la segunda a 33
    centipeones. Es el único falso positivo que queda, y confirma la sospecha
    vieja: esa mitad de la regla es la generosa.
  - `7… Nxe4` (hueco 95) y `16… Nxf1` (hueco 47) no las marcamos, y **ningún
    corte las rescata sin meter a `14… Nc4`** (hueco 96). Ver arriba.

  Las tres necesitan un mes de partidas, no otra vuelta sobre esta. **Desde la
  v0.56.1 los datos para medirlas ya viajan en la fila**: `huecoSegunda` —la
  diferencia CRUDA entre la primera y la segunda, que antes se calculaba y se
  tiraba—, `legales`, y `esRecaptura` desde la v0.56.

  Van `huecoSegunda` **y** `legales`, no solo el hueco: el hueco queda en `null`
  cuando el motor no devuelve segunda, y una razón de que no la devuelva es que
  haya una sola jugada legal, o sea que la posición más forzada posible caería
  en el grupo de "no sé". Es la misma advertencia que estaba anotada acá abajo
  para la estratificación por dificultad, que ahora también queda desbloqueada.

  **No están en `CAMPOS_FLACOS` a propósito:** ninguna tabla los usa todavía y
  un año de filas flacas tiene que pesar poco. Medir sobre las filas completas
  de un mes alcanza para decidir.

  **Cómo se sacan los números (v0.57):** el botón "Copiar medición de Genial",
  solo en modo DEV, vuelca al portapapeles un histograma del hueco entre la
  mejor y la segunda, la lista de las que salieron Genial, y la de las que
  rescataría un corte más bajo. Sale del mes ANALIZADO, no de lo juntado.

  **No va al registro y es a propósito:** el registro es un buffer rotativo de
  500 líneas compartido con todo lo demás, y analizar un mes ya escribe una
  línea por partida; un volcado por jugada se comería sus propios datos.

  **Lo que este volcado NO responde:** cuáles habría marcado chess.com. Sin esas
  etiquetas mide qué tan seguido dispara nuestra regla y dónde cae el corte —o
  sea, si 150 está en un hueco natural de la distribución o en el medio de un
  montón—, pero no si acierta. Para lo segundo hacen falta las etiquetas de
  ellos, que hoy solo se consiguen mirando partida por partida.

#### La medición, ya hecha: 17 partidas, 483 jugadas propias (v0.57)

**Esto ya se corrió. No hace falta repetirlo para volver a discutir el corte.**
De 152 jugadas donde el usuario jugó la mejor del motor —las candidatas a
Genial— salieron **18 Geniales, 1,06 por partida**.

**1. El filtro de recaptura vale mucho más de lo que parecía.** Sacó **10**
Geniales: sin él serían 28. Y el mecanismo quedó medido y no supuesto:

| | pasan el corte de 150 |
|---|---|
| no recapturas | 21 de 130 = **16,2%** |
| recapturas | 10 de 20 = **50,0%** |

Una recaptura tiene **3,1 veces** más chances de pasar el corte. Es la
confirmación numérica de que `unicaBuena` mide "la posición estaba forzada".

**2. La mitad del cruce de banda no dispara.** Los 18 Geniales tienen hueco
≥ 151, o sea que **ninguno se disparó solo por cruce**, en 17 partidas. Su único
disparo observado en todo lo mirado es `14… Nc4` de la partida de referencia, y
fue un falso positivo contra chess.com: historial completo de 1 disparo y 1
error. La explicación es que una jugada que da vuelta la banda casi siempre es
además la única buena, así que `unicaBuena` ya la agarra: el cruce no está mal,
está de más.

**Se dejó puesto por decisión del usuario** —revisar más adelante, no es
prioritario—. Sacarlo es una línea, y esta nota existe para no volver a medirlo.

**3. El corte de 150 no tiene dónde apoyarse.** Distribución del hueco entre las
candidatas que no son recapturas:

```
0-24       60  ████████████████████████████████████████████████████████████
25-49      19  ███████████████████
50-74      11  ███████████
75-99       9  █████████
100-149    10  ██████████
150-199     7  ███████
200-299     3  ███
300+       11  ███████████
```

No hay ningún escalón: a los lados del corte hay 10 y 7. **Los datos no dicen
dónde ponerlo**, cualquier valor entre 50 y 300 se apoya igual de mal. Y bajarlo
sale caro: 100 → 28 Geniales, 75 → 37, 50 → 48.

**4. Queda probado que no se los puede reproducir calibrando este corte.**
chess.com marcó Genial jugadas con hueco **95 y 47**; agarrarlas pide un corte
de ~50, que triplica nuestros Geniales. Pero en la partida de referencia ellos
dieron 3 y 2 por jugador, casi lo mismo que nosotros. Las dos cosas no pueden
ser ciertas si su regla fuera un umbral sobre este número. **Su "única jugada
buena" mide otra cosa**, y mover el 150 no acerca a nada: solo cambia cuántos
hay. Por eso se dejó donde está.

**5. Pregunta de gusto que quedó abierta.** 13 de los 18 Geniales (72%) caen en
posiciones **ya decididas** —9 ganando por más de 2, 4 perdiendo—, y 4 de 18
tenían 4 jugadas legales o menos. No se filtró porque chess.com hace lo mismo
(marcaron `31. Nxg4` con +6,12 y `25. Kxd4` con 4 legales), así que sería una
diferencia deliberada con ellos, como la del mate estirado. Es del usuario
decidir si "Genial" tiene sentido cuando la partida ya está resuelta.

- ~~**Los textos de las categorías son genéricos.**~~ **HECHO en la v0.64**,
  con `explicarJugada` y las decisiones de redacción explicadas en §4quindecies.
  La regla que lo gobierna es §5 regla 1: no se afirma nada que no esté medido,
  y por eso hay jugadas que no dicen nada en vez de decir algo lindo.
  **Dónde va quedó cerrado en la v0.72** (arriba del tablero desde la v0.74; el
  interruptor de tres posiciones se fue). **Cuánto habla** creció mucho: de 5 de
  36 jugadas a **34 de 36**, emitiendo datos que ya se calculaban y se tiraban
  (`oportunidad`, `cap`, `mateContra`, `unicaBuena`, `mejorRival`) más los tres
  conceptos de la v0.75. Con dos salvedades:

  - **el 34 de 36 sale del motor falseado del arnés y no vale como medida.**
    Falta mirarlo en el celular con Stockfish de verdad, sobre un mes.
  - **faltan conceptos, y están listados en §4octodecies**: pieza atrapada —la
    que más dice y la más fácil de equivocar—, jaque descubierto, ataque a la
    descubierta, columna semiabierta, peón pasado del rival, la pareja de
    alfiles y el rey sin enrocar. Los que se rechazaron por no medibles también
    están ahí, para no volver a proponerlos.

- ~~**No se puede jugar una variante y verla evaluada.**~~ **HECHO en la v0.65
  y ampliado en la v0.66**: la variante se encadena, se juegan también las del
  rival y se va y se vuelve por ella. Todo en §4sexdecies. La jugada probada se
  juzga con `derivarFilas`, o sea el mismo camino que las de la partida, y no
  toca ni `R.filas` ni la caché.
  **Lo que falta es guardarla**: al salir se tira, así que una línea que
  encontraste no se puede volver a mirar. Eso toca la caché y es otra tanda.

- **La lista de cuentas de entrenador tiene un solo nombre.** Falta el resto.
  Tiene que ser coincidencia **exacta**, no por prefijo: los nombres de usuario
  de chess.com admiten guiones, así que `Coach-loquesea` es registrable por
  cualquier persona. La API pública no expone ninguna marca de bot ni de
  entrenador; el campo `status` solo puede valer closed, basic, premium, mod o
  staff.

## 9. Lo que no se puede arreglar desde acá

El navegador suspende la pestaña cuando el usuario cambia de aplicación, así que
un análisis largo se frena y no termina. **No lo resuelve cambiar de hosting**:
el problema no es dónde está el sitio sino qué lo ejecuta.

Una notificación al terminar no alcanza, porque el trabajo nunca termina si la
pestaña está dormida. Hay una API para pedir que la pantalla no se apague, que
ayuda pero no garantiza nada.

Lo que sí mitiga y ya está: **cada partida se guarda en caché apenas termina**,
así que el análisis es reanudable — si la pestaña muere en la partida 30, al
volver arranca en la 31.

La solución de verdad es una aplicación nativa. Es un proyecto aparte.

---

## 10. Cómo trabajar

- **Antes de cambiar una tabla, mostrar cómo va a quedar y esperar el ok.** Las
  tablas son el producto: cada una codifica una pregunta, así que cambiarla es
  cambiar la pregunta y esa decisión es del usuario.
- **Y lo mismo vale para CUALQUIER decisión visual, no solo las tablas.** Esta
  regla decía "para lo que no toca tablas, aplicar y contar", y por ese hueco se
  coló el `½-½` de la v0.61: no era una tabla, así que se aplicó sin dibujarlo,
  y el usuario lo rechazó al verlo. La forma de una marca, el texto de una
  etiqueta, cuánto se llena una barra: se **dibuja al tamaño real**, se muestran
  las alternativas y se espera el ok. Sale barato —el arnés (§2) lo hace en
  segundos— y ya se ganó dos veces: las marcas de la curva (v0.59) y el nombre
  de las tablas (v0.62). Lo que se aplica y se cuenta es lo que no se ve:
  arreglos internos, pruebas, rendimiento.
- **La regla de arriba es del CELULAR. Lo que se ve solo en una compu lo decide
  quien programa** —decisión del usuario, v0.91—: *"todas las features que te
  vaya pidiendo, las adaptes al modo PC como vos creas conveniente"*. Empezó
  como la excepción de una tanda (v0.85–v0.90, §7) y ahora es la regla parada:
  **cada feature nueva se piensa para las dos pantallas, la del celular se
  dibuja y se espera el ok, y la adaptación a PC se aplica y se cuenta**, en
  commits separados y resumida al final. Lo que reemplaza a la mirada del
  usuario en lo de PC es la **comparación byte a byte de las capturas de
  celular** contra la versión anterior, en cada versión: es lo único que prueba
  que un cambio de PC no se filtró al celu. Y lo que NO se toca es la mitad de
  arriba: él lo puso en la misma frase —*"lo que no quiero perder es que me
  mandes captura de cómo se vería algo antes de implementarlo"*—.
- **Las maquetas son andamio: no se commitean.** Decisión del usuario, v0.91,
  y la razón es que **son una decisión temporal**: el script que dibuja las
  alternativas vive lo que dura la elección y después estorba. `.gitignore` tiene
  `pruebas/maqueta-*.mjs` para que no se cuele ni por el hook que avisa de
  archivos sin commitear —que fue exactamente cómo se coló la primera vez—. Lo
  que **sí** queda en el repo es lo que se aprendió mirando: los números medidos
  y qué eligió el usuario, escritos en la sección que corresponda. Las maquetas
  viejas se hacían adentro de `mirar.mjs` y se borraban al decidir (`dist-E`,
  v0.74); en un archivo aparte es más cómodo, pero se borra igual.
- **Un cambio invasivo por tanda.** Si además hay que refactorizar, va solo.
- **`npm test` antes de dar nada por bueno**, y una prueba nueva por cada
  arreglo. Los errores que no agarran son siempre los del DOM y los de la
  pregunta equivocada: para eso hay que mirar el celu.
- **Mirar la pantalla incluye mirar los ESPACIOS.** No alcanza con mirar lo que
  se cambió: hay que recorrer la captura entera buscando cosas **pegadas**,
  cortadas o desalineadas. Ya pasó: una maqueta que mudaba la fila de
  navegación al lado del tablero la dejó pegada a la tarjeta de abajo, y lo vio
  el usuario en la captura que le mandamos nosotros. Mover un elemento de lugar
  le cambia los márgenes a sus dos vecinos, no a uno.
- **Cuando algo se ve corrido y las cuentas dicen que está centrado, lo que
  está mal es QUÉ se está midiendo.** Costó tres vueltas en la tira de la v0.74,
  y las tres el error fue el mismo: se medía la caja del renglón —que incluye el
  espacio de las colas y las tildes— cuando lo que el ojo alinea es la
  mayúscula. La salida no es corregir el número sino preguntarle al usuario
  **contra qué** tiene que quedar alineado, y medir eso. Él lo dijo en una
  línea: *"el centro del chevron debería coincidir con el centro de la N"*.
- **Un cambio que toca lo que se dibuja se MIRA en la pantalla, no solo se
  mide.** Se puede levantar la app en un navegador headless, simular la API de
  chess.com y sacar capturas (§2). Verificar de forma estrecha —medir justo lo
  que se tocó— dejó pasar un comentario impreso en el medio de cinco tablas.
- **Se pushea derecho a `main`, sin rama ni PR** (§1), así que **cada push es un
  deploy en vivo**: pruebas, chequeos estáticos y una mirada a la pantalla van
  antes, no después.
- **La sesión remota arranca en una rama `claude/*` que no se usa, y el `main`
  local que trae el contenedor viene viejo.** Son dos cosas distintas y las dos
  muerden. La rama la arma la sesión sola a partir del título y **no hay forma
  de configurarla**: no es una perilla del entorno de nube, que solo maneja red,
  variables y script de arranque. Lo que sí se puede es correr un hook
  `SessionStart` —está en `.claude/settings.json`, versionado como el `deny` del
  MCP y por la misma razón— que deje el checkout parado en `main` antes del
  primer turno. Y tiene que ser `git checkout -B main origin/main`: medido en la
  sesión que agregó el hook, el `main` local estaba **36 commits atrás, en la
  v0.63.1**, mientras que la rama `claude/*` sí apuntaba a la punta. Un
  `git checkout main` a secas te muda a una copia vieja en silencio, y todo lo
  que se lea a partir de ahí —el mapa del §3, una versión, una medición— es de
  otro momento del repo. El hook lleva `matcher: "startup"` a propósito: si
  corriera también en `compact`, un `-B` a mitad de sesión movería la rama y se
  llevaría puestos los commits todavía sin pushear. Además está guardado por
  `git diff --quiet`, así que con el árbol sucio no toca nada y lo dice.
- **Cuando dos formas se defienden solas, ponerlas las dos y decidir usando la
  app.** Se hizo con margen contra gris (§4terdecies): el interruptor duró dos
  versiones, cumplió su función y se fue.
- **Las maquetas se reescriben, no se parchean.** Se rompieron dos veces en la
  misma sesión (v0.91) por editarlas con reemplazos de texto: el script queda
  cortado, node tira un error de sintaxis que no dice dónde, y se van más tokens
  en entender el destrozo que en volver a escribirlo. Son cien líneas: se
  rehacen de cero y listo. Para `index.html` el reemplazo sigue siendo lo
  correcto —ahí no se puede reescribir— y por eso vale la regla de abajo.
- **Verificar que cada parche se haya aplicado.** Un reemplazo de texto que no
  encuentra su objetivo falla en silencio y deja una leyenda vieja diciendo algo
  falso. Ya pasó. Los scripts de edición conviene que aborten si no encuentran
  su objetivo exactamente una vez.
- **Nunca afirmar de memoria una posición de ajedrez.** Verificarla con
  chess.js. Ya se escribió una prueba con una torre supuestamente defendida que
  en realidad estaba colgada.
- **La versión se muestra en pantalla** y va en cada línea del registro. Es una
  **coordenada de depuración**, no marketing: existe para ubicar un reporte del
  usuario en el historial. De ahí sale todo el criterio, y la regla dura es que
  **todo deploy tiene que ser identificable**.

  Tres niveles, desde la v0.56.1:

  | nivel | cuándo | ejemplo |
  |---|---|---|
  | **parche** `0.56.1` | no cambia lo que se ve ni lo que significan los números: arreglo interno, prueba, comentario, un texto | v0.55, que el dial no eche al usuario de la vista |
  | **menor** `0.57` | cambia una etiqueta, una tabla, un criterio, o aparece un control nuevo | v0.52, v0.53, v0.54, v0.56 |
  | **mayor** `1.0` | hay que reaprender algo, o lo guardado deja de servir | ninguno todavía |

  El mayor **lo decide el usuario**, no quien programa. Los candidatos naturales
  ya están en la lista de pendientes: partir el archivo (§2) y cambiar el
  esquema de la caché. Así el número mayor significa algo concreto —"lo que
  tenías guardado cambió de forma"— en vez de ser un estado de ánimo.

  Elegir entre menor y parche queda de quien programa, **y hay que decirle al
  usuario cuál es la versión nueva**: es lo que va a buscar en la pantalla para
  saber si ya le llegó el cambio.

  Nunca se renumera hacia atrás: los registros viejos dicen v0.51 y tienen que
  seguir significando eso. Y la fecha se queda al lado (`v0.57 · 06-09`), que ya
  desambigua dos pushes del mismo día.

  El chequeo estático 8 compara la versión contra la del último commit y falla
  si `index.html` cambió y la versión no subió. Si `index.html` no cambió no
  pide nada: el archivo servido es idéntico y no hay reporte que ubicar.
- **Este documento se actualiza en el mismo commit que el cambio que describe.**
  Vive en el repo justamente para eso.
