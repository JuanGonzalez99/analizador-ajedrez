# Hoja de ruta

De dónde sale lo que hace cada noche la tarea programada (`TAREA-NOCTURNA.md`).
El norte está en `NORTE.md`; esto es el orden. **Se toma siempre el primer
ítem sin tachar de la etapa en curso** que no esté marcado `⏸ espera a Juan`
(y, como mucho uno por noche, el primero de "Arreglos"). Al terminar uno se
tacha acá, en el mismo commit.

**Estado: reordenada con Juan el 20-nov-2026.** La etapa 1 se cierra con lo
que dice "Para cerrar la etapa 1" y sale la **v1.0** (decisión de Juan). Desde
ahí la app suma módulos nuevos. Lo ya hecho, con todo su detalle, vive en
`HOJA-DE-RUTA-HECHO.md`: no se lee cada noche.

## Cómo entra lo nuevo (Juan, 20-nov-2026)

La etapa 1 tardó porque **cada lavado de cara que levantaban los revisores
entraba a la etapa en curso**, y la tarea de la noche siempre toma el primero
sin tachar: mientras hubiera uno, la app no sumaba nada nuevo. Juan: *"no
avanzamos más, nos quedamos en correcciones de lo hecho"*. La regla:

- **Un error de lo que la app dice o hace** (algo falso en la tarjeta, un
  veredicto mal puesto, algo que se rompe), verificado y no supuesto → al
  final de **"Arreglos"**.
- **Un lavado de cara, un retoque, una limpieza de código o una idea** →
  al final de **"Relleno"**. Relleno no pasa nunca adelante de la etapa en
  curso: se toma solo si todo lo que queda de la etapa espera a Juan, o si
  el revisor de rumbo sube un ítem (como mucho uno por semana, diciendo por
  qué).
- **Lo que pide Juan** va donde él diga; si no dice, donde recomiende quien lo
  anota, y se cuenta en el resumen.
- **Las decisiones que serían de Juan no se guardan como preguntas** (Juan,
  20-nov: *"no le suelo dar bola a los 'no sé si esto te copa'. Cuando me
  levanto veo el chat, y si veo algo raro se lo digo"*). Se toma la
  recomendación, se aplica y se cuenta en el resumen; él la da vuelta si no
  le gusta. Solo se le pregunta lo marcado `⏸`, y eso vive en "Esperan a
  Juan".
- **A la etapa en curso solo entra lo que ella misma rompe o deja a medias**:
  si el revisor frena un cambio porque es un parche sobre lo que el ítem
  construye, el lavado se hace dentro del ítem. Si es sobre otra zona, va a
  Relleno.

## Perillas

- **Revisor:** después de cada cambio.
  *(La otra opción es "una vez al final de la noche". Se pasa a esa si el
  consumo se come el tope semanal; lo dice Juan o lo propone la mañana.)*
- **Revisor de ajedrez:** después de cada cambio que toque lo que la app dice
  de una partida (explicación, categorías, cuadritos, tablas, análisis), y una
  pasada sobre partidas reales los domingos (Juan, 17-nov).
- **Revisor de código:** los miércoles, desde la tarea nocturna (Juan,
  18-nov): lo que cambió en la semana y una zona que rota. **Próxima zona: 3,
  el bloque de análisis, primera mitad** (`src/analisis-evaluacion.js`:
  evaluación, categorías, `derivarFilas`; la 1, el CSS, se miró el 18-nov y la 2, el script clásico,
  el 25-nov) (el orden está en `.claude/agents/revisor-codigo.md`).
- **Revisor de rumbo:** los sábados, desde la tarea nocturna (Juan, 20-nov):
  mira la hoja de ruta, el norte y estos documentos con mirada global, y los
  ordena (`.claude/agents/revisor-rumbo.md`).
- **Por noche: hasta dos ítems** (decisión de Juan, 6-nov). Pasa al segundo
  solo si el primero terminó **aprobado por el revisor**, con o sin
  correcciones en el medio. Si después de las dos vueltas de corrección el
  revisor sigue sin aprobar, para ahí y lo cuenta en el resumen.
  Nunca se deja nada a medio hacer sin commitear: mejor uno solo y entero que
  dos a medias. **De los dos, como mucho uno sale de "Arreglos"**: el otro es
  de la etapa en curso (20-nov), para que los arreglos no vuelvan a frenar lo
  nuevo.

---

## Para cerrar la etapa 1 · v1.0

La identidad visual está hecha y aplicada en toda la app (56 ítems, en
`HOJA-DE-RUTA-HECHO.md`). Antes de cerrarla, Juan pidió terminar los errores
de lo que dice la app y los retoques que quedaban (20-nov). Quedan tres ítems y el cierre (lo demás salió en la v0.177 y la v0.178);
cuenta estimada: 2 o 3 noches. **Si un lavado de acá termina dos tandas con
el revisor en "ninguna", se tacha "sin cambio, ver Relleno" y lo que se
intentó va al final de Relleno: no frena la v1.0.** Lo que se levante mientras
tanto va a Arreglos o a Relleno, **no acá**.

- [x] ~~**[PC] Lavado de cara: cómo termina la lista de jugadas cuando no
      entra entera**~~ (hecho en la v0.179: un fundido de 32 abajo) (revisor, v0.149; ya estaba). A 1600×900 la lista se
      corta a mitad de una fila contra el borde de abajo (asoma la 14). Variantes:
      cortar en una fila completa, un fundido, una sombra que diga "hay más".
- [x] ~~**[PC] Lavado de cara: la caja vacía de las tres mejores debajo de la
      curva**~~ (hecho en la v0.180: sin caja, el revisor eligió entre cuatro) (Juan, 17-nov, sobre la v0.150; revisor, v0.151). Sin pedirlas
      son ~115 px de tarjeta con un rótulo y un botón suelto: se lee como un
      hueco. **No se calculan solas** (Juan: *"dudo que uno quiera ver las 3
      mejores de cada movimiento"*; lo tentaba solo el cuadro vacío).
      Variantes: las tres filas en tenue en vez del botón suelto (la del
      revisor), una caja que solo reserva el alto sin borde, y otra cosa de la
      jugada mientras no se piden. Sin que la lista ni "‹ ›" salten. Con variantes.
- [x] ~~**Tres retoques chicos, sin variantes**~~ (hechos en la v0.182, v0.182.1 y v0.182.2) (una versión para el celu y otra
      para la compu, como siempre: PC en commits separados):
  - [x] ~~**Retoque: cómo empieza y termina la tira de la variante en "la
        lista abajo"**~~ (hecho en la v0.182) (revisor, v0.160; celu). Junto a "‹" asoma un pedazo
        cortado de la jugada anterior y la elegida queda pegada a "›". Ya
        estaba, pero ahora es la forma que Juan usa.
  - [x] ~~**[PC] El orden de Tab en la Partida**~~ (hecho en la v0.182.1) (revisor, v0.153). Salta por
        la pantalla: volver (arriba) → tuerca → Girar (abajo de todo) → "Ver
        las tres mejores" → lista → "›" → cuadrito Mejor (arriba). Tendría que
        seguir el de lectura: volver, tuerca, Mejor, las tres mejores, lista,
        "‹ ›", Girar. Sin `tabindex` positivos; si hay que mover nodos que
        comparte el celu, cuidar la comparación byte a byte.
  - [x] ~~**[PC] El cuadrito "Mejor" corta "la juga…"**~~ (hecho en la v0.182.2) (revisor, v0.150; leve,
        ya estaba). Cuando la jugada fue la mejor, a 1000 de ancho el valor del
        cuadrito sale con puntos suspensivos. Una palabra cortada no se lee:
        un texto más corto ("esta") o que entre entero. Arreglo chico, sin
        variantes.
- [x] ~~**Cierre: v1.0.**~~ (hecho el 22-nov: el revisor no marcó errores; cinco retoques a Relleno) Cuando lo de arriba esté tachado: una pasada del
      revisor de UX sobre la app entera, celu y PC (como la de la v0.104),
      y lo que marque va a Relleno salvo que sea un error. La versión que
      sale esa noche es la **v1.0** (Juan lo decidió el 20-nov; es la única
      vez que la tarea de la noche sube el número mayor). En el resumen, con
      capturas de las cuatro pantallas.

## Arreglos

Errores verificados de lo que la app dice o hace. Como mucho uno por noche
(perilla "Por noche"), el primero de la lista.

- [x] ~~**La dama recién coronada que se pierde habla de un peón**~~ (hecho en
      la v0.178.4, con la subcoronación y la defendida que igual se pierde) (Juan,
      20-nov, sobre la v0.178). En `3r3k/2P5/8/8/8/8/8/6K1 w`, c8=Q (Rxc8 y
      no hay recaptura) dice "Tu peón queda comible en c8. Coronás: el peón
      vuelve como dama.": nombra un peón que ya no está y festeja una
      coronación que se pierde. Juan propuso "tu peón coronado": **"Tu peón
      coronado queda comible en c8."**, y sin la frase de "Coronás" cuando la
      pieza coronada cuelga o se pierde en el cambio. Revisor de ajedrez sí.
- [x] ~~**El cambio no ve las clavadas contra la dama**~~ (hecho en la v0.180.1) (revisor de ajedrez,
      v0.178; Juan lo pasó a Arreglos el 20-nov). `cambioEn` (y `quedaComible`,
      de antes) cuenta como buena una recaptura con una pieza clavada contra
      su propia dama: un peón de e6 que recaptura y deja la dama de e8 a tiro
      de la torre de e1. Hoy lo frena el corte de pérdida ≥ 0,5 del motor;
      primero buscar con chess.js un caso que llegue a la tarjeta, y que la
      recaptura que entrega la dama no cuente como recaptura. Si no aparece
      un caso que llegue a la tarjeta, se anota en §8 del traspaso y pasa a
      Relleno. Si entran juntos, va en la misma versión que el de abajo (los
      dos son `cambioEn`).

- [x] ~~**La cuenta del cambio no ve lo que deja la pieza que recaptura**~~ (hecho en la v1.0.2)
      (Juan, 20-nov, sobre la v0.178.1). `cambioEn` solo mira la casilla: en
      `r1b1k1nr/pppp1pQp/2n2q2/8/2B1P3/8/PPP2PPP/RNB1K2R w`, Bh6 Nxh6 da "pierdo
      el alfil", pero el caballo cuidaba la torre de h8 y sigue Qxh8+ (igual
      Bxf7+ Qxf7 Qxh8+). Mirar, después de cada recaptura, si quedó colgado lo
      que esa pieza defendía. Con esto hecho: volver a decir el caso sin nada
      del rival ("queda comible", que la v0.178.1 calló) y bajar el corte de
      dos peones a uno (medido en §6, v0.178.1: el corte casi no cambia nada).
      Revisor de ajedrez sí.

- [x] ~~**"Salva" exagera cuando la jugada solo defiende**~~ (hecho en la v1.0.4) (Juan, 20-nov,
      sobre la v0.178.1). Hoy toda pieza que deja de estar en peligro sin
      moverse sale "Salva tu X de Y, que estaba sin defender", aunque siga
      atacada y el rival pueda cambiarla (Bh6 en
      `r1b1k1nr/pppp1pQp/2n2q2/8/2B1P3/8/PPP2PPP/RNB1K2R w`: el alfil cuida la
      dama de g7, pero Qxg7 Bxg7 cambia damas). Distinguir por cómo se salva:
      si la pieza movida ahora cuida esa casilla, **"Defiende tu dama de g7,
      que estaba sola."**; si se interpuso, **"Tapa el ataque a tu dama de
      g7."**; si la pieza se fue, "Saca…" como hoy. Con "a tiro de" (atacada
      por algo que vale menos) la cola sigue siendo esa. Revisor de ajedrez sí.

- [x] ~~**"Se queda con la pareja de alfiles" a mitad de un cambio**~~ (hecho en la v1.0.6, también con el otro alfil colgado) (revisor
      de ajedrez, pasada del 22-nov sobre las partidas del repo). En
      `r1bqk2r/ppp1nppp/3p1b2/3P2B1/2B1R3/5N2/PP3PPP/R2Q2K1 b kq - 1 12`,
      Bxg5 lo dice, pero sigue Nxg5 y quedan uno y uno. `hayPareja` mira solo
      la posición de después: que no lo diga si el alfil que comió puede ser
      recapturado (o que mire después de `mejorRival`). Revisor de ajedrez sí.
- [x] ~~**"Queda sin defender" cuando nunca tuvo defensa**~~ (hecho en la v1.0.7, también con la clavada que se suelta) (revisor de
      ajedrez, 22-nov). En `r1bqk1nr/pppp1ppp/8/4n3/2BQP3/8/PPP2PPP/RNB1K2R b KQkq - 0 6`,
      Nc6 da "El peón de g7 queda sin defender": no tenía defensores antes
      ni después; lo nuevo es que el caballo destapó la dama (Qxg7). Si antes
      no tenía defensores: "Destapa el peón de g7: queda a tiro de la dama."
- [ ] **La grave que no nombra la dama que se pierde** (revisor de ajedrez,
      22-nov). En `1nbqkbnr/1pQpppp1/7r/7p/8/4P3/PPPP1PPP/RNB1KBNR w KQk - 1 5`,
      h4 (pérdida 10,4) dice "Había Qxb8, que se llevaba el caballo." y nada
      de la dama de c7, que sigue colgada (Qxc7). Si una pieza ya colgada
      sigue colgada y la pérdida es grande: "Tu dama sigue comible en c7."
      primero. Misma familia que el de la pareja: la tarjeta mira una sola
      posición y no lo que sigue.
- [ ] **"Queda comible" en un cambio parejo** (revisor de ajedrez, 22-nov,
      ya estaba). En `r1b1k1nr/pppp1pQp/2n2q2/8/2B1P3/8/PPP2PPP/RNB1K2R w KQkq - 0 1`,
      Qxf6 (pérdida 0,81) dice "Tu dama queda comible en f6.", y es Qxf6
      Nxf6: un cambio de damas. `colgada` (`quedaComible`) no descuenta lo
      que la jugada comió: que exija que el cambio menos lo comido sea ≥ 1,
      con su prueba. Revisor de ajedrez sí.
- [ ] **"Atrapa la dama" con la pieza que atrapa comible** (revisor de
      ajedrez, 22-nov, ya estaba). En `r1bqk2r/pppp1ppp/2n5/8/2BPn3/2b2N2/PP3PPP/R1BQ1RK1 w kq - 0 9`,
      Bg5 dice "Atrapa la dama de d8: no tiene salida.", y Nxg5 se come el
      alfil. Que no se diga si se puede comer la pieza que atrapa (sin
      perder en el cambio), con su prueba. Revisor de ajedrez sí.
- [ ] **"Se planta" a mitad de un cambio** (revisor de ajedrez, v1.0.6; ya
      estaba). En `r4rk1/pppbbppp/q4n2/4N3/8/3B4/PP3PPP/RNB1K2R w KQ - 0 1`,
      Nxd7 dice "El caballo de d7 se planta" y sigue Nfxd7. El `cuelga` de la
      tarjeta solo calla lo logrado si la pieza queda comible o pierde en el
      cambio, no en un cambio parejo. Mismo arreglo que la pareja
      (`seLaLlevan`), y mirar con `npm run frases -- --frase planta`.
      Revisor de ajedrez sí.

- [x] ~~**Con señal mala, Buscar no responde y no avisa**~~ (hecho en la v1.0.10) (revisor de UX,
      v1.0.9; ya estaba). Mientras el módulo carga (con mala señal, ~10 s) el
      campo y "Buscar" se ven listos, pero el manejador se engancha recién al
      arrancar: el toque no hace nada. Que el toque se guarde y corra al
      arrancar, o que el botón diga que carga; no volver a mostrar `#diag` en
      modo simple. Pasa por el revisor de UX.

- [x] ~~**Con señal mala, un cartel rojo de "el módulo no arrancó" falso que
      no se va**~~ (hecho en la v1.0.9; adelantado a los otros arreglos
      porque la prevención del mono pedía hacerlo junto con su regla) (revisor de código, 25-nov; ya estaba). Script clásico, el
      temporizador de 6 s (~1674–1686) y `mostrarError` (~1650). Si el módulo
      tarda más de 6 s (medido con Playwright: a 200 kbps arranca a los
      10,7 s), pide los tres archivos y llama a `mostrarError` aunque
      respondan 200: aparece la caja `#errores` (también en modo simple), y
      cuando el módulo arranca no se borra. Además baja `aperturas.json`
      entero (942 KB) compitiéndole al módulo. Arreglo: la línea dice "el
      módulo tarda…", los archivos se piden con `{ method: "HEAD" }`, y
      `mostrarError` solo si `!r.ok` o el tipo no es javascript/json (si no,
      `LOG.add("!", …)`). Verificar a 200 kbps o con chess.js demorado 7 s
      (caja oculta, sin `hubo-error`) y con chess.js en 404 (la caja sale y
      nombra el archivo). Pasa por el revisor de UX.

## Etapa 2 · Partir `index.html`

El motivo es **tokens y orden**, no algo que Juan vaya a notar (lo aclaró él).
Las dos formas ahorran lo mismo: en las dos las sesiones leen archivos chicos
de `src/` y nunca el `index.html` armado. Lo que las separa es solo la caché del
celu, y por eso la recomendación es juntarlos al pushear.

Hoy cada sesión paga ~103.000 tokens en leerlo por partes, y cada módulo nuevo
lo agranda. Va **sola en su tanda**, como pide el traspaso (§2).

**Recomendación:** fuentes partidas en `src/` (estilos, tablero, análisis,
vistas…) y un paso que las **junta en el `index.html` de siempre** antes de
pushear. Así las sesiones leen archivos chicos y el teléfono sigue recibiendo un
solo archivo, que es lo que evita el problema de la caché de GitHub Pages con
módulos de versiones distintas (§2). (La v1.0 pasó a ser el cierre de la etapa 1, 20-nov.)

**Por qué va antes del primer módulo** (20-nov): cada módulo nuevo agranda el
archivo, y partirlo después cuesta más y cada noche de módulo paga la lectura
entera. Es una o dos noches y Juan no ve nada distinto. Antes, una noche de
limpieza: lo que está muerto no se parte.

- [x] ~~**Limpieza antes de partir, en una o dos versiones**~~ (hecha: v1.0.1, v1.0.3, v1.0.5 y las pruebas del 25-nov) (revisor de código,
      18-nov; interno, sin cambios que se vean):
  - [x] ~~**Sacar los restos de "la lista adentro" de la v0.160**~~ (hecho en la v1.0.1) (revisor de
        código, 18-nov; interno). `tiraDeLaVariante()`, la rama
        `fp.lista === "adentro"`, el `<div id="pLinea">`, el CSS `.vlinea` /
        `.vj` / `#pLinea`, el campo `reemplaza` de `FORMAS_PRUEBA` (siempre
        true) y `listaAdentro` en `mirar.mjs`: ninguna forma pide la lista
        adentro desde la v0.160. ~1.200 tokens. Reescribir la prueba "con una
        prueba abierta la tarjeta real se esconde" (protege el renglón muerto
        palabra por palabra). Capturas de la variante byte a byte.
  - [x] ~~**Sacar las marcas de la curva que ya no se usan ("punto" y "raya")**~~ (hecho en la v1.0.3)
        (revisor de código, 18-nov; interno). `MARCAS_CURVA`, `MARGEN_MARCA`,
        la rama `modo === "raya"` y el `aro` del punto grande en
        `dibujarCurva`: Juan eligió "punto chico" en la v0.160. ~1.300 tokens.
        Ojo: las pruebas de analisis.test.mjs ~1496, 1528 y 1542–1559 usan esa
        rama como límite; se reescriben en el mismo cambio.
  - [x] ~~**CSS muerto en la fila de Girar**~~ (hecho en la v1.0.5) (revisor de código, 18-nov;
        interno). `.soloAncho` (nadie la lleva desde la v0.160),
        `.acciones > button.prendido`, el `:not(.revcab)`, `.acciones`
        declarada dos veces seguidas, y comentarios que hablan de "Siempre la
        mejor", que ya no está. ~800 tokens. Las pruebas que buscan
        `.colLista, .soloAncho { display: none; }` pasan a `.colLista`. La
        regla de `max-width: 359px` que esconde el ícono NO se toca.
  - [x] ~~**Dos pruebas que no prueban lo que dicen**~~ (hecho el 25-nov, sin versión: solo pruebas) (revisor de código,
        18-nov; interno). La del Escape de Ajustes (analisis.test.mjs ~2632)
        busca `tecla === "Escape"`, que está en tres lugares: tiene que buscar
        el renglón entero de `verAjustes(false)`. La de `data-sq="` (~2162)
        matchea también las marcas de la explicación: buscar la del tablero.
- [x] ~~Partir y armar el paso que junta; `npm test` y `mirar` idénticos al byte.~~
      (hecho el 25-nov, sin versión: el `index.html` armado es idéntico al
      byte; 19 pedazos en `src/`, `npm run juntar`)

## Etapa 4 · Posiciones, y el puente con el profe — primer módulo nuevo

**El primer módulo nuevo, después de partir `index.html`** (reordenamiento
del 20-nov). La etapa 3 (animaciones) pasó a Relleno: los números quedan como
estaban para no romper las referencias de otros documentos. Es el más chico de los cuatro, sirve
desde el primer día (el profe hoy manda links de lichess) y es la base de
Práctica y Lecciones, que también son "jugar desde una posición".

- [ ] **La barra de navegación abajo, con los módulos** (Juan, 7-nov: eligió
      esta opción). Cuando llegue el segundo módulo, una barra fija abajo con
      ícono y texto (Análisis, Posiciones, y después Práctica y Lecciones), que
      **se esconde al deslizar para arriba y vuelve al deslizar para abajo**,
      así no tapa la fila de botones de la jugada. Adentro de Análisis sigue el
      caminito de la v0.110 (Partidas → Partida → Mes, con "‹"). Es la variante
      A de la estructura, que a Juan le encantó; se descartó para Partidas /
      Partida / Mes porque esas no son pestañas independientes.
- [ ] Abrir una posición desde un link (`…/#fen=…`) y jugarla contra el motor,
      con el nivel elegible.
- [ ] Armar una posición a mano en el tablero.
- [ ] Que el profe pueda mandar links: un texto para su proyecto de claude.ai
      que le explique el formato.

## Estadísticas del Mes (pedidos de Juan, 20-nov) · después de Posiciones

- [ ] **"Por tramo" pasa a etapas: apertura, juego medio y final** (Juan,
      20-nov: *"en vez de 'de la 1 a la 10' se podría poner 'en apertura'"*).
      **Por el tablero, no por número de jugada**: la jugada 10 cae en
      momentos muy distintos según la partida. La regla recomendada es la de
      lichess: el juego medio arranca cuando quedan pocas piezas menores y
      mayores o una primera fila se vació; el final, cuando entre los dos
      quedan seis o menos (sin peones ni reyes); lo anterior es apertura. Sale
      del FEN con chess.js, sin motor. Ojo: "La mejor" no cuenta las de libro
      (v0.157), así que la fila de Apertura mide sobre menos jugadas: decirlo
      en la tabla, no esconderlo. La columna Seg. sigue igual, ahora por
      etapa. Revisor de ajedrez sí (verificar la división en partidas reales).
- [ ] **El apuro: cuánto te quedaba en el reloj** (Juan, 20-nov; idea vieja
      de `TRASPASO.md` §7.8 y §4nonies, nunca pasada acá). Lo que piensa cada
      jugada ya está (Pensó y la columna Seg.); falta la otra pregunta: ¿cómo
      salen las jugadas cuando queda poco reloj? `segundosPensados` ya calcula
      `restan` y no lo emite. Dos trampas medidas: una sola cadencia (como
      toda la vista Mes) y el confundidor de siempre —con poco reloj suelen
      ser posiciones más complicadas—, que se separa estratificando (§8). Una
      tabla más en el Mes, con los mismos cortes de §5. Ojo: en la v0.93 se
      rechazaron ocho maneras de mostrar el reloj alrededor del tablero; esto
      es otra cosa, una tabla, y no reabre eso.

- [ ] **Comparar dos jugadores** (`TRASPASO.md` §7.7): historial cara a
      cara y precisión de los dos, solo sobre las partidas entre ellos. Los
      datos ya están (se descargan enteras y la precisión sale para ambos).
- [ ] **Elo estimado a partir de la precisión** (§7.9), contra el rating de
      los rivales. Siempre con rango y cantidad de partidas, nunca un número
      solo: el rating de chess.com es inestable y contra rivales flojos la
      precisión sube sola.

## Etapa 5 · Práctica

Ejercicios sin tope, ordenados por lo que Juan quiere aprender, no por sus
errores.

- [ ] Banco de ejercicios: la base pública de puzzles de lichess (licencia
      libre), filtrada por tema y nivel y partida en archivos chicos.
- [ ] Elegir tema (mates en dos, clavadas, finales…) y hacer todos los que
      quiera.
- [ ] Link directo a un tema o a un ejercicio, para el profe.

## Etapa 6 · Lecciones

Repetibles, que muestran la idea en vez de explicarla, al estilo de la jaula
del rey.

- [ ] Rey y torre contra rey (la jaula), como primera lección y molde.
- [ ] Finales de torres, de damas.

## Etapa 7 · Análisis automático

**Recomendación: el proceso de afuera**, una acción de GitHub que corre cada
tanto, baja las partidas nuevas de Juan y del amigo, las analiza con Stockfish
y deja los resultados en el repo para que la app los lea. No toca el resto del
stack; la app nativa queda como proyecto aparte.

- [ ] Probar que una acción de GitHub puede correr Stockfish y cuánto tarda
      una partida.
- [ ] El formato de los resultados y que la app los lea en vez de analizar.

---

## Esperan a Juan

Nada de esto se toma de noche. Cuando Juan conteste, pasa a la etapa en curso,
a Arreglos o a Relleno según lo que sea.

### La variante (de "probar jugadas", 18-nov)

- [ ] ⏸ a prueba con Juan (18-nov: *"eso no sé, lo voy probando y
      vemos"*) · **El cuadrito Mejor y la flecha verde en la
      variante**: hoy la mejor de la posición que se ve (la respuesta
      del rival, decisión de la v0.94); el revisor de UX propone "la
      que había en vez de la probada", como afuera (gusto de la v0.139).
- [ ] ⏸ espera a Juan · **La variante como modo, y que no se pierda**
      (Juan, 18-nov, sobre guardarla: *"en principio no, pero depende de
      cómo quede puede ser. acepto propuestas, llegado el momento"*: no
      se hace sola; cuando toque, se le llevan variantes dibujadas):
      con "sin la lista" la tira y la curva siguen en la partida (dos
      "estás acá"); se tira sin aviso por siete caminos (Volver, Esc,
      la tira, la curva, la lista de la compu…) y no vuelve. Propuesta:
      guardarla por posición de arranque con una marca violeta en la
      tira que la reabre, y que con variante todo hable de la línea. El
      revisor recomienda quedarse con "la lista abajo" del dial.
      **El dial no se le vuelve a preguntar** (Juan, 18-nov: *"estoy
      probando todavía, no me apures"*): lo dice él cuando elija.
- [ ] ⏸ [PC] Lavado de cara (revisor, v0.171): con una variante abierta,
      el panel dice "estás en una variante" tres veces y de tres
      maneras (la tarjeta punteada, "En lugar de…" y el párrafo de la
      planilla). ¿Dónde vive eso en un solo lugar? Va con "la variante
      como modo", que espera a Juan: se le llevan dibujadas juntas.

### La revisión de las evaluaciones (14 y 15-nov-2026)

Lo que salió de la revisión de los veredictos y de las frases de la tarjeta
(detalle y números en `TRASPASO.md` §8, "La revisión de las evaluaciones").
El jaque en los detectores y la nueva definición de "a salvo" ya están hechos
(v0.133). Lo que queda:

- [ ] ⏸ espera a Juan · Las engañosas: "Toma la columna abierta" cuando la
      torre ya estaba ahí, "Tu X queda comible" cuando acaba de comer algo que
      vale lo mismo o más, y una frase de mérito en las tarjetas de error.
- [ ] ⏸ espera a Juan · H3: "Genial, era la única" con la segunda ganando igual
      (medir el hueco en probabilidad de ganar y no en centipeones).
- [ ] ⏸ espera a Juan · **Que la tarjeta cuente ideas e intenciones**, no solo
      lo que pasó: "amenaza mate", qué amenaza el rival, como las amenazas de
      chess.com. Pedido de Juan (15-nov): es un trabajo aparte, se anota y no se
      empieza.
- [ ] ⏸ espera a Juan · **La clavada que no funciona y la idea de la pieza que
      se pierde** (Juan, 17-nov, sobre la v0.163; va con el ítem de arriba).
      Dos casos que la v0.163 resolvió callando y que Juan prefiere decir:
      - **La clavada que no funciona**: la pieza clavada puede comerse a la que
        clava (torre contra torre). Técnicamente es clavada (Juan: *"¿no es
        clavada igual?"*); hoy no se dice. Opciones: callarla, o decirla con su
        matiz ("…pero la torre puede comerse a la que clava").
      - **La idea detrás de la pieza que se pierde**: hoy, si la pieza movida
        queda comible, no se dice nada de lo que lograba. Juan: *"está bien
        que se marque el error primero, pero quizás se puede señalar la
        idea"* — "Tu torre queda comible en e1. La idea era clavar el caballo
        contra la dama."
      **Cómo se hace**: primero el revisor de ajedrez propone el criterio
      (cuándo decir la idea, cómo sin que suene a elogio, qué hacer con más de
      una, cuándo la clavada con matiz y cuándo callarla), con casos
      verificados con chess.js; se le pasa a Juan para que elija, y recién
      después se programa.

---

## Relleno

Lavados de cara, retoques, limpiezas e ideas. **No pasan adelante de la etapa
en curso** (ver "Cómo entra lo nuevo"). El revisor de rumbo los ordena y
archiva los que pierden sentido.

### Retoques y lavados de cara

- [ ] **Lavado de cara: los grupos de la hoja de Ajustes** (revisor, v0.160;
      celu y PC). "El tablero" tiene un solo renglón, "Cómo se ve la partida"
      dos, y "La explicación" queda vacía cuando se elijan los diales a prueba.
      Un título con raya para un renglón pesa más de lo que vale. ¿Grupos, una
      lista corta sin títulos, o dos grupos como mucho? Depende de
      "La variante como modo" (⏸, el dial): no se toma hasta que Juan elija.
- [ ] **Pantalla propia de "Acerca de"** (Juan, 15-nov, al mudar los créditos
      a Ajustes en la v0.143: la pensaba así, "más a futuro"). Hoy la
      atribución de las piezas vive al pie de la hoja de Ajustes y alcanza.
      Se hace cuando haya qué poner al lado: la ayuda, las licencias de lo
      que se sume (los puzzles de lichess de la etapa 5), el link del profe.
      Antes de eso es una pantalla para tres líneas que no se leen nunca.

- [ ] **[PC] Las filas de la lista sin reloj ni precisión** (revisor, v0.179).
      Cada media jugada termina en un "·" suelto: 26 puntitos en dos columnas
      que no dicen nada. ¿Nada, con la columna que se cierra, o un lugar
      reservado que no parezca un glifo? Con variantes.
- [ ] **[PC] La barra de evaluación y la curva pesan más que la tarjeta**
      (revisor, v0.179). En crema casi blanco son lo más luminoso de la
      pantalla, más que el veredicto (la regla de "la barra de progreso casi
      blanca", `DISENO.md`). ¿Cuánto tiene que pesar la evaluación? Con
      variantes; toca el sistema de diseño si cambia el color.
- [ ] **La precisión del Mes, entera en todos lados** (revisor, v1.0). El
      cuadro dice "84.6" (`prec.toFixed(1)`, index.html ~8470) y "Partida por
      partida" e inicio dicen "85": el mismo dato de dos maneras en la misma
      pantalla. Entera, por §1.4 (no prometer un decimal que no se tiene).
- [ ] **"Mediana 0.00" del Mes no dice de qué** (revisor, v1.0): solo se
      entiende abriendo "Cómo se leen estos números". ¿Qué palabra la explica?
- [ ] **[PC] El fundido de la lista también arriba** (revisor, v1.0): bajada
      hasta el final, la fila de arriba queda cortada por la mitad; el fundido
      de la v0.179 está solo abajo.
- [ ] **[PC] La fila de "Partida por partida" estirada a 640** (revisor,
      v1.0): "Ganada" y "prec. 85" flotan lejos del nombre y la fecha. ¿Ancho
      tope, o columnas alineadas con las tablas de abajo?
- [ ] **El renglón técnico de la cabecera del Mes** (revisor, v1.0; celu):
      "1 partida · 18 jugadas · prof 16 · crítico" arriba de lo que más se
      mira. ¿Hace falta a la vista, o va adentro de "Cómo se leen…"?
- [ ] **[PC] La Partida no abre en el borde del Mes y el inicio** (arnés,
      22-nov: lo mostró el renglón nuevo "bordes en la compu"). A 1280 el Mes
      y el inicio van de 99 a 1171; la Partida, de 88 a 1192 con la barra
      vertical (la de fábrica) y de 108 a 1172 con la horizontal. Pasar de una
      pantalla a otra corre el borde. ¿Mismo ancho total, o la Partida es otra
      grilla a propósito? Que lo juzgue el revisor con las tres capturas.

- [ ] **El inicio con usuario guardado mientras la app arranca** (revisor
      de UX, v1.0.10; celu). Con mala señal se ven ~10 s el campo vacío y
      Buscar, y al arrancar salta a "juancito · cambiar" y busca sola: un
      salto que nadie tocó, y mientras tanto la app parece no acordarse de
      él. ¿El script clásico arma la fila "ya usuario" desde
      `localStorage.usuario` en el primer cuadro y el módulo solo larga la
      búsqueda?
- [ ] **[PC] El inicio antes de buscar** (revisor de UX, v1.0.10). A 1280 es
      una columna de ~400 px pegada a la izquierda (x 99–499) con ~780 vacíos
      a la derecha. ¿Centrar la entrada, o adelantar dónde va a aparecer la
      lista? Con variantes.

### Limpieza de código

- [ ] **Recortar los comentarios de historia del CSS**, en tres noches por
      tramos (renglones 6–500, 500–1000 y el bloque de PC) (revisor de
      código, 18-nov; interno). De los 107 KB del CSS, 65 son comentarios
      (~16.000 tokens) y 48 KB cuentan cómo se llegó (versión, "Juan dijo",
      variantes descartadas). Cada uno queda en una línea con el porqué
      medido y "§7, v0.X"; si el número no está en el traspaso, se muda
      antes de borrar. Verificación: el CSS sin comentarios idéntico antes y
      después, `npm test` y capturas byte a byte. Ahorro: 6.000–8.000 tokens
      por lectura del CSS.

### La tarjeta y las tablas (revisor de ajedrez)

- [ ] **El orden de las frases con lo que de verdad gana la clavada**
      (revisor de ajedrez, v0.177). Hoy la clavada vale lo que la pieza
      clavada; mejor la clavada menos la que clava: en
      `r3k3/1p6/2n5/8/P7/8/8/4KB2 w`, f1b5 sale "Clava el caballo…" antes que
      "Salva tu peón de a4" y el caballo está defendido. Y en las de libro el
      orden viejo sigue (salvar antes que el ataque).
- [ ] **El otro mate y la tabla de capturas** (revisor de ajedrez, v0.177;
      casi no pasa). Con el motor eligiendo Rxa8# y jugada Rd8#
      (`n5k1/5ppp/8/8/8/8/5PPP/R2R2K1 w`), cuenta como "La vi y la tomé"
      sin capturar. Antes contaba una omisión falsa, que era peor.

- [ ] **La clavada vieja que la jugada cobra** (revisor de ajedrez, v0.178).
      Hoy solo se dicen las clavadas nuevas. En `7k/8/4qr2/8/3Bn3/8/8/4Q1K1 w`,
      Bxf6+ cobra la clavada del caballo de e4 (que ya estaba: tras cualquier
      respuesta cae el caballo o la dama), y la tarjeta solo dice "El rival
      tiene Qxf6", que suena a que se pierde el alfil. Decir "el caballo de e4
      sigue clavado y cae" cuando la jugada la aprovecha. Revisor de ajedrez sí.

- [ ] **La coronación que es un sacrificio que funciona** (revisor de
      ajedrez, v0.178.4). Si coronar desvía una pieza y gana, la cuenta del
      cambio la ve "perdida" y la tarjeta calla "Coronás" (bien), pero no dice
      qué gana. Pide entender la táctica; va con "Que la tarjeta cuente ideas".

- [ ] **El cambio que entrega la dama no la resta** (revisor de ajedrez,
      v0.180.1; borde). `entregaLaDama` deja pasar la captura que vale la
      pena, pero `cambioEn` no descuenta la dama que destapa: en
      `4qk2/8/4p3/3Q4/8/2N5/8/4R1K1 b`, d5 da neto 8 (exd5 Nxd5, "tu dama por
      un peón") y en el tablero, con Rxe8+ Kxe8 Nxd5, es 4. No es falso en
      d5, pero cuenta la mitad.

- [ ] **Atacar una pieza sin defensa con algo que vale igual o más**
      (revisor de ajedrez, 22-nov). 10.Bg5 en
      `r1b1k2r/ppp2p1p/2np1n2/8/2B1P3/2N5/PPP2PPP/R1B1K2R w KQkq - 0 10` solo
      dice "El rival tiene Nd7." (la respuesta a una amenaza que no nombra);
      el caballo de f6 está sin defensa. Ídem 7.Qxg7 con la torre de h8.
      Propuesta: "Ataca el caballo de f6, que está sin defender." Va contra
      la regla de §4octodecies (atacar algo que vale igual o menos es oferta
      de cambio): sin defensa no lo es.
- [ ] **"El rival tiene Kg8." cuando es su única jugada legal** (revisor de
      ajedrez, 22-nov; tras 15.Qh5+ en
      `r1bq1r2/ppp1nppk/3p4/3P3Q/2B4R/8/PP3PPP/R5K1 b - - 1 15`). Callarla.
- [ ] **"Ganaba 2 peones en el cambio" cuando es la calidad** (revisor de
      ajedrez, 22-nov). En `1nbqkbnr/1ppppppp/r7/p6Q/8/4P3/PPPP1PPP/RNB1KBNR w KQk - 2 3`
      había Bxa6 (torre por alfil): decir "ganaba la calidad".
- [ ] **"Tapa el ataque" sin decir de quién** (revisor de ajedrez, v1.0.4;
      opcional). Con g6 en
      `r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 3 3`
      el peón de f7 lo atacan la dama y el alfil: "Tapa el ataque de la dama
      a tu peón de f7" dice cuál se cortó.

### Que se sienta bien (la vieja etapa 3: animaciones)

- [ ] La pieza que se mueve al pasar de jugada (abre las demás animaciones).
- [ ] El tablero sigue al dedo al deslizar.
- [ ] La tira se centra con movimiento; la hoja de ajustes sube. (Lo de la
      tarjeta que cambia de alto pasó a la etapa 1 como lavado de cara, v0.148:
      no es animarlo, es que el tablero no se mueva.)
- [ ] `prefers-reduced-motion` en todas.

### Sueltos del traspaso (20-nov, rescatados de §4 y §8)

Pendientes que estaban anotados solo en el traspaso.

- [ ] **El "0s" de la primera jugada de cada lado** (§4duotrigies): chess.com
      escribe el reloj inicial intacto y Pensó da 0 aunque se haya pensado; lo
      honesto es "·", como sin reloj. **No está resuelto** (mirado el
      21-nov: el comentario de `segundosPensados` dice que la primera de cada
      lado "da 0 aunque se haya pensado una décima", y el código recorta en
      0). Falta mostrar "·" en esa jugada.
- [ ] **"regla de 50 jugadas · 61 jugadas"** (§6, "Dos pendientes"): "jugadas"
      dos veces con dos significados. De las cuatro salidas dibujadas, la que
      no fuerza nada es callar el largo en ese caso.
- [ ] **Dónde vive "cómo terminó"** (§6, mismo lugar; lo marcó Juan): el
      cierre de la tira solo se ve al final de la lista y repite el largo que
      la lista ya dice un renglón arriba.
- [ ] **La jerga en las frases** (§4octodecies): "los chanchos en la séptima"
      y compañía. Tanda propia, con su mirada en el celu; primero contestar
      hasta dónde, sin perder la capacidad de decir un número. Revisor de
      ajedrez sí.
- [ ] **Otros sets de piezas para elegir** (§4bis): la costura está
      (`#cb-<color><tipo>`); falta elegir sets y verificarle la licencia a
      cada uno, y el selector va en Ajustes.
- [ ] **La lista de cuentas de entrenador** (§8): tiene un solo nombre.
      Juan (20-nov): *"que se fije si hay alguna manera que lo saque Claude"*.
      Primero investigar, sin tocar la app: la API pública no tiene marca de
      entrenador (`status` solo vale closed, basic, premium, mod o staff),
      pero quizás la haya en otro lado —el perfil web de cada cuenta, el
      directorio de entrenadores de chess.com, algún endpoint de la API que
      no se miró— leído con el navegador del contenedor o con la API. Si sale,
      armar la lista (coincidencia exacta, no por prefijo) y contar de dónde
      salió y cada cuánto hay que refrescarla. Si hace falta permiso de red
      para un host, pedirlo y anotarlo; si no hay manera, decirlo con lo que
      se probó y recién ahí pedirle los nombres a Juan.

### Del revisor de código (25-nov, zona 2 y la semana)

- [ ] **Recortar el relato en comentarios largos del análisis de esta
      semana**: `cambioEn` (~2250), "LO QUE SE PIERDE EN EL CAMBIO" (~4369,
      que arranca diciendo "desde dos peones" cuando el código pide uno),
      `puedeComer` (~4149), "CÓMO SE SALVÓ" (~4108) y el mecanismo del cambio
      (~3253). Quedarse con el porqué medido y los FEN. ~600 tokens; solo
      comentarios (`git diff -w`). Interno.
- [ ] **El script clásico**: dos comentarios que dicen lo mismo (~1546–1553)
      y uno falso ("corre en la cabeza": corre al principio del body); la
      rama `e.reason` de `mostrarError`, que no corre nunca; el
      `URL.createObjectURL` de Descargar sin liberar. Interno.
- [ ] (Menor) El redondeo de la precisión repetido en `pintarFilas` (~6957)
      y `pintarLista` (~8552): que viva en `filaDePartida`. Interno.
- [ ] **Comentarios huérfanos que el corte dejó a la vista** (revisor de
      código, 25-nov, sobre la etapa 2). `src/mes.js` termina con "Por debajo
      de esta cantidad de jugadas no se muestra porcentaje…", que ya es falso
      (`tablas.js` abre con "Ya no hay mínimo para los porcentajes (v0.50)");
      y al principio de `tablas.js`, "Una fila por mecanismo…", pegado a otro:
      confirmar si le falta su código antes de borrarlo. Interno.
- [ ] (Menor) **Partir `src/revision.js`** (revisor de código, 25-nov): es el
      pedazo más grande (~20.000 tokens) y de ~749 a ~1230 son todo gestos y
      teclado: un `gestos.js` aparte, sumado a `ORDEN`. Interno, armado
      idéntico al byte.

### Ideas de los revisores para más adelante

- Propuestas del revisor de ajedrez para más adelante: qué amenaza el
  rival en la posición de la variante; la evaluación como número en la
  tarjeta de la variante con el modo "en la tarjeta"; la línea corta del
  motor; resumen de la variante contra la partida; aviso de confianza
  cuando la variante se alarga.
