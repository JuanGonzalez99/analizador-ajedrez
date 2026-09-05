# Analizador de partidas — traspaso

Documento para retomar el proyecto. Vive en el repo: **se actualiza en el mismo
commit que el cambio que describe.** Escrito sobre la v17, al día en la **v0.41**.

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

**Repo:** GitHub Pages. **Archivos que la página pide:**

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

**Partirlo es razonable**, pero conviene que sea el único cambio de esa tanda,
para que si rompe se sepa qué fue. No mezclarlo con cambios de lógica.

### Cómo se prueba sin navegador

```bash
npm test
```

Las pruebas viven en `pruebas/` y son archivos del repo desde la v18 (antes se
armaban a mano en cada sesión).

Hay **dos bloques extraíbles**, cada uno delimitado por dos marcadores. Ninguno
toca el DOM ni el motor al cargarse, así que se sacan del HTML y corren en node:

| Extractor | Bloque | Qué tiene |
|---|---|---|
| `pruebas/extraer.mjs` | análisis | `derivarFilas`, `categorizar`, `quedaComible`, `capturaBuena`, `winPct`… |
| `pruebas/extraer-tablas.mjs` | tablas | `pct`, `esMala`, `tasa`, `contraste`, `textoDesglose`, `textoSolape` |

**Los cuatro marcadores son contrato: si se mueven, se rompe el arnés.** Los
extractores detectan solos qué exportar, así que agregar una función no obliga
a tocar nada.

Lo que no se puede probar así es el motor y el DOM. Para eso está
`pruebas/estaticos.mjs`, con cinco chequeos que ya agarraron errores reales:

1. Todo `id` referenciado en JS existe en el HTML.
2. Toda tabla tiene su elemento de leyenda.
3. Todo lugar que asigna la partida elegida rehabilita los botones.
4. No quedan tablas ni leyendas huérfanas — restos de una tabla borrada a medias.
5. Toda tabla vive dentro de un contenedor que scrollea.
6. El `<script type="module">` entero parsea. Los extractores solo miran dos
   pedazos, así que un error de sintaxis en la interfaz o en el motor no lo
   agarraba nada y aparecía como pantalla en blanco en el celu.
7. El traspaso dice en qué versión está al día, y coincide con el HTML.

**Aun así, nada de esto ve la pantalla.** Los dos errores más caros de esta
tanda —una columna recortada en el celu y una tabla que contestaba la pregunta
equivocada— aparecieron mirando el celular, no corriendo pruebas.

---

## 3. Mapa del archivo

| Zona | Qué hay |
|---|---|
| `<script>` clásico | registro, captura de errores, panel de diagnóstico |
| bloque de análisis | evaluación, geometría, categorías, `derivarFilas`, `repartir` |
| motor | clase `Motor`, grupo de motores, `evaluarPosiciones` |
| caché | IndexedDB |
| análisis | `analizarPartida`, barrido, híbrido |
| interfaz | tablero SVG, mes, banco de pruebas, revisión, resúmenes |

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
jugador, cada franja queda con dos o tres, y como debajo de 30 no se muestra
porcentaje (§5.2), tres de las cuatro filas eran guiones. No estaba rota: no
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

## 4septies. Ganadas, empatadas y perdidas (v0.39)

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

## 5. Reglas de método — valen para cualquier número que muestre la app

Estas no son opiniones de estilo. Cada una viene de un error que ya se cometió.

1. **Todo porcentaje va con su denominador.** "La mayoría de mis errores salen
   de X" no significa nada sin saber qué porcentaje del juego transcurre en X.
   Las tablas muestran siempre casos y total, no solo el porcentaje.
2. **Debajo de 30 jugadas no se muestra porcentaje**, se muestra un guion. Con
   pocas jugadas malas, cualquier corte deja celdas de dos casos, y un "7,3%"
   sobre 41 jugadas invita a conclusiones que el dato no aguanta.
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

- **tasa** (`tablaTasas`): columna "% de estas jugadas que salió mal", contra el
  mínimo de 30 jugadas. Lleva pegada la definición de jugada mala.
- **contraste** (`tablaContrastes`): igual, más **una referencia en la leyenda**
  —cuántas de todas tus jugadas salieron mal, con su denominador— contra la que
  se lee cada fila. Sin esa referencia un mecanismo no dice nada (§5.7). Avisa
  si dos filas se solapan. Hasta la v0.35 la referencia era una columna
  "% resto"; ver abajo por qué se fue.
- **reparto** (`tablaReparto`): las filas parten un mismo total y los
  porcentajes suman 100. No lleva la definición de jugada mala, porque sus
  porcentajes no son de jugadas malas; sí declara su denominador.

**Todo porcentaje pasa por `pct()`**, que aplica el mínimo de 30. Hay una prueba
que falla si alguna tabla vuelve a calcularlo por su cuenta — que es justo lo
que le había pasado a la tabla de franjas.

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

## 7. Trabajo acordado, en orden

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

8. **Estadísticas que tomen el tiempo en cuenta.** Pedido por el usuario. **Los
   datos están y se comprobó**: 14 de las 15 partidas del mes 2026-09 traen
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

Lo que falta de esa dirección, y es la próxima tanda: rehacer la disposición de
`zonaRevision` (barra de evaluación vertical al costado del tablero, las tres
métricas de la jugada, la lista de jugadas completa en vez de la tira
horizontal).

**Regla de trabajo que salió de acá:** proponer el enfoque y esperar el visto
bueno antes de construir. Y antes de dibujar algo, mirar si ya existe público:
el juego de piezas se eligió mirándolo en lichess, no renderizándolo acá.

9. Pasada visual completa. **Tocar estilos y estructura visual, no la lógica de
   análisis.** Varias constantes que parecen arbitrarias costaron mediciones:
   están comentadas en el código y los comentarios explican por qué. En esta
   pasada entra también el repaso de los textos de las leyendas, que se fueron
   escribiendo de a una y nunca se leyeron juntas.

## 8. Pendientes de fondo, sin resolver

*(Los cuatro pendientes chicos de la v26 se resolvieron: barra de progreso en la
v33, `textoDesglose` y la columna "% resto" en la v0.36, y el historial de
resultados en la v0.39.)*

### De interfaz

- **La paleta tiene luminosidades desparejas.** El ámbar de Imprecisión llama
  más la atención que el verde de Bien sin que eso signifique nada. Los
  símbolos de la v0.35 arreglaron la **legibilidad**, no el **volumen**. La
  propuesta medida —seis colores a la misma luminosidad percibida— está en
  §4quinquies con los ocho hex ya calculados, para no rehacer la cuenta.

- **El listado de partidas está sin rediseñar.** Tiene un `max-height: 34vh`
  puesto en la v33 para que el botón de analizar quede a la vista; es un parche,
  no un diseño. Falta decidir cuántas mostrar, cómo se ven y cómo se busca.

- **No hay pantalla de configuración.** Los dos `<select>` —tema del tablero y
  dónde va la evaluación— viven sueltos en la fila de controles de la vista
  Partida, y ahí adentro también tendría que ir la preferencia de "mostrar la
  mejor" (§4bis). Es además el lugar donde irían los juegos de piezas
  configurables, que están costurados pero sin hacer (§4bis).

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
  - con 78 jugadas partidas en dos estratos, uno queda debajo del mínimo de 30.
    **Necesita la funcionalidad 6 primero.**

  Hay un paso previo barato: ver si el confundidor existe, comparando qué
  porcentaje de cada grupo son posiciones de una sola buena. Si da parecido, no
  hay confundidor y el hallazgo se sostiene.

- **Los dos mecanismos se solapan.** Una jugada puede dejar la pieza comible y
  además venir después de una mala. Desde la v25 la leyenda dice cuántas caen
  en las dos filas, pero no está resuelto: sigue habiendo dos filas que en
  parte miden lo mismo. Hacerlas excluyentes se descartó, porque obliga a
  elegir arbitrariamente cuál gana.

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

- **"Genial" se dispara ~2 veces por partida**, demasiado para una categoría que
  debería marcar algo excepcional. La sospecha es que la mitad que se dispara
  por cambio de banda de evaluación es muy generosa: en partidas de principiante
  la evaluación cruza el ±2 todo el tiempo.

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
  cambiar la pregunta y esa decisión es del usuario. Para lo que no toca tablas,
  aplicar y contar.
- **Un cambio invasivo por tanda.** Si además hay que refactorizar, va solo.
- **`npm test` antes de dar nada por bueno**, y una prueba nueva por cada
  arreglo. Los errores que no agarran son siempre los del DOM y los de la
  pregunta equivocada: para eso hay que mirar el celu.
- **Verificar que cada parche se haya aplicado.** Un reemplazo de texto que no
  encuentra su objetivo falla en silencio y deja una leyenda vieja diciendo algo
  falso. Ya pasó. Los scripts de edición conviene que aborten si no encuentran
  su objetivo exactamente una vez.
- **Nunca afirmar de memoria una posición de ajedrez.** Verificarla con
  chess.js. Ya se escribió una prueba con una torre supuestamente defendida que
  en realidad estaba colgada.
- **La versión se muestra en pantalla** y va en cada línea del registro. Subirla
  en cada cambio, o los reportes del usuario no se pueden ubicar.
- **Este documento se actualiza en el mismo commit que el cambio que describe.**
  Vive en el repo justamente para eso.
