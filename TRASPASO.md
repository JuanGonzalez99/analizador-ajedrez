# Analizador de partidas — traspaso

Documento para retomar el proyecto. Vive en el repo: **se actualiza en el mismo
commit que el cambio que describe.** Escrito sobre la v17, al día en la **v26**.

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

- `analizador.html` — la aplicación entera, un solo archivo
- `chess.js` — chess.js 0.13.4 como módulo ES
- `stockfish-18-lite-single.js` + su `.wasm` — el motor, ~7,3 MB, monohilo
- `aperturas.json` — libro de aperturas: `{ posiciones: [...], nombres: {...} }`

`index.html` es solo un redirect a `analizador.html`, porque la raíz de GitHub
Pages tiene que existir. En la v18 se borraron cuatro archivos muertos
(`analisis.js`, `motor.html`, `motor-1.html`, `motor-2.html`); están en el
historial. Antes de borrar cualquier otro, confirmar que `analizador.html` no
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
- **contraste** (`tablaContrastes`): igual, más la tasa del resto al lado. Sin
  ese contraste un mecanismo no dice nada (§5.7). Avisa si dos filas se solapan.
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

8. **ELO estimado a partir de la precisión** contra el rating de los rivales.
   Cuidado: el rating de chess.com es inestable y contra rivales flojos la
   precisión sube sola. Mostrar siempre el rango y la cantidad de partidas,
   nunca un número solo.

### Estética

9. Pasada visual completa. **Tocar estilos y estructura visual, no la lógica de
   análisis.** Varias constantes que parecen arbitrarias costaron mediciones:
   están comentadas en el código y los comentarios explican por qué. En esta
   pasada entra también el repaso de los textos de las leyendas, que se fueron
   escribiendo de a una y nunca se leyeron juntas.

## 8. Pendientes de fondo, sin resolver

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
