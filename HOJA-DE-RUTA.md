# Hoja de ruta

De dónde sale lo que hace cada noche la tarea programada (`TAREA-NOCTURNA.md`).
El norte está en `NORTE.md`; esto es el orden. **Se toma siempre el primer
ítem sin tachar de la etapa en curso** que no esté marcado `⏸ espera a Juan`
(y, como mucho uno por noche, el primero de "Arreglos"). Al terminar uno se
tacha acá, en el mismo commit.

**Estado (28-nov-2026).** La etapa 1 cerró con la v1.0 (22-nov) y la etapa 2
el 25-nov. **La etapa en curso es "La compu, hecha para la compu"** (Juan,
27-nov); después sigue Posiciones (etapa 4). Lo ya hecho, con todo su
detalle, vive en `HOJA-DE-RUTA-HECHO.md`: no se lee cada noche.

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
- **Un ítem cita pedazo y función, nunca un número de renglón** (revisor
  de rumbo, 28-nov): la partición del 25-nov dejó a varios apuntando a
  nada, y cualquier cambio corre los renglones. `npm test` lo controla.
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

## Arreglos

Errores verificados de lo que la app dice o hace. Como mucho uno por noche
(perilla "Por noche"), el primero de la lista.

- [ ] **Posiciones: el al paso con la casilla de origen ocupada** (revisor
      de ajedrez, v1.1.2; leve). `4k3/4p3/8/3Pp3/8/8/8/4K3 w - e6 0 1`:
      `limpiarFen` deja e6 aunque e7 está ocupada; chess.js ofrece dxe6 y
      Stockfish no. Pedir también la casilla de origen del doble paso vacía,
      con el FEN sumado a la prueba de `limpiarFen`.
- [ ] **Posiciones: una triple repetición que chess.js no cuenta** (revisor
      de ajedrez, v1.1.2; leve, nunca dice algo falso: falta el "Tablas").
      Desde `4k3/4p3/8/8/8/8/8/4K1N1 b - - 0 1`, e5 Nf3 Kd8 Ng1 Ke8 Nf3 Kd8
      Ng1 Ke8: chess.js compara la casilla de al paso que dejó e5 aunque
      nadie pueda comer; Stockfish sí ve la repetición. Contar con `POS.fens`
      limpiados del al paso, comparando los cuatro primeros campos.

- [ ] **Las partidas Chess960 se analizan como si fueran normales**
      (revisor de ajedrez, v1.5). Desde la v1.5 el arranque sale de la
      cabecera FEN, así que una `[Variant "Chess960"]` de chess.com se
      analiza desde su posición, pero el motor contesta enroques de 960
      (`bestmove f1g1` en `bqnbrkrn/…/BQNBRKRN w KQkq`) que chess.js no pasa
      a notación: la tarjeta mostraría el UCI crudo. Decir "Chess960 no se
      analiza" en la fila y al abrirla (lo honesto y chico), o usar
      `UCI_Chess960`. Antes se analizaban desde la inicial, que era peor.

- [ ] **El "0s" de la primera jugada de cada lado** (§4duotrigies): chess.com
      escribe el reloj inicial intacto y Pensó da 0 aunque se haya pensado; lo
      honesto es "·", como sin reloj. **No está resuelto** (mirado el
      21-nov: el comentario de `segundosPensados` dice que la primera de cada
      lado "da 0 aunque se haya pensado una décima", y el código recorta en
      0). Falta mostrar "·" en esa jugada.

## La compu, hecha para la compu (Juan, 27-nov) · etapa en curso, antes de seguir con Posiciones

Juan la usó un día en la compu: *"es una app de celu adaptada a PC… no
resulta tan cómoda como podría serlo"* (diagnóstico en `DISENO.md`, No le
copa). Va antes que lo que queda de Posiciones porque es lo que él siente al
usarla, y Posiciones en la compu ya se rehizo en la v1.6.1. **Todo es solo de
compu**: las capturas del celu tienen que salir idénticas byte a byte en cada
ítem. Cada uno con variantes dibujadas a **1366×768 y 1920×1080**, además de
1280×800, que hasta hoy era el único tamaño de compu que se miraba. `npm run
mirar` ya los saca (`ancho-1366-*`, `ancho-1920-*`, y la línea `monitores:`).
**Cómo cierra:** cada ítem es una versión con variantes y lleva como mucho
dos tandas. Si el revisor termina las dos en "ninguna", se tacha "sin
cambio, ver Relleno" y lo que se intentó va a Relleno: no frena Posiciones.
Lo que se levante mientras tanto va a Arreglos o a Relleno, **no acá**.
Cuenta estimada: 4 a 6 noches.

- [x] ~~**La Partida de la compu, con componentes de compu**~~ (hecho en la v1.8: la A del revisor entre tres, cabecera de una pieza y planilla con encabezado; C, el comentario a lo lichess, descartada) (Juan, 28-nov,
      sobre la v1.7: *"no me gusta ninguna. siento que se trató de amontonar
      todo… la idea de las pestañas es buena, pero no es suficiente"*). La
      v1.7 dejó el tablero al alto y el Resumen en una pestaña, pero el panel
      sigue siendo los componentes del celu apilados (tarjeta, cuatro
      cuadritos, curva, caja de las mejores, planilla). Rediseñarlos para la
      compu, no reubicarlos: ¿cómo serían la tarjeta y los cuadritos si
      fueran una sola cabecera de la jugada?, ¿la curva, una línea de tiempo
      bajo el tablero o en el panel?, ¿las mejores, una pestaña más?, ¿la
      planilla, con columnas de compu (se suman los tres de Relleno sobre la
      planilla: el "·" suelto, el fundido arriba y las columnas; no suman
      trabajo porque esa zona se rehace igual, y si el rediseño no los
      resuelve, vuelven a Relleno)?
      Variantes que cambien los componentes, no solo dónde van, a 1366 y
      1920. Ceros siempre a la vista en el Resumen.
      **Alcanza con**: la cabecera de la jugada (tarjeta y cuadritos en una
      sola pieza) y la planilla con columnas de compu, en una versión. La
      curva y las mejores se rediseñan solo si una variante lo resuelve de
      paso; si no, quedan como en la v1.7 y lo que falte va a Relleno. Lo
      que se ve con una variante abierta queda como hoy (espera a Juan, "La
      variante como modo").
- [ ] **Ajustes como menú colgado de la tuerca** en la compu, no como hoja
      que sube desde abajo con tirador y tapa el tablero: la regla de
      `DISENO.md` §3 (Posiciones en la compu) aplicada a la otra hoja.
- [ ] **Navegar como en una app de escritorio**: el riel a la vista también
      en la Partida y en Estadísticas, con lo que hoy es el "‹" como camino
      (Análisis › Octubre › vs MewoneX) y no como única salida. El riel en el
      mismo lugar en el inicio, la Partida y Estadísticas (en la v1.3.1 se
      aceptó el salto de borde).
- [ ] **Pasar jugadas con lo que tiene la compu**: los ‹ › de 48 de alto
      pasan a una barra de controles chica bajo el tablero (principio, ‹, ›,
      final, girar), cada uno con su atajo en el título al pasar el mouse, y
      una tecla `?` que muestra todos los atajos (←/→, Inicio/Fin, n, Esc ya
      andan y no lo dice nada: hay 4 `title` en todo el HTML).
- [ ] **El inicio como tabla**: la lista de partidas con columnas
      (rival y elo, color, resultado, precisión, apertura, cadencia, fecha),
      encabezados y la fila entera iluminada al pasar el mouse; el mes, el
      botón de analizar y Estadísticas en una franja arriba, a todo el ancho.
      Con su estado antes de buscar (hoy, a 1280, una columna de 400
      pegada a la izquierda).
- [ ] **Posiciones y Armar, de escritorio** (Juan, 27-nov: *"se sigue
      sintiendo como una adaptación del celu"*, después de la v1.6.1). Lo que
      `mirar` marca a 1366 y 1920: botones de dedo (Deshacer, Analizar, las
      opciones del menú, blancas/negras, Jugar), el "+" y el de nivel y color
      solo con ícono, el menú de Nueva partida con "Listo" y botones
      apilados, la columna del costado con cuatro cosas arriba (13–19 % del
      alto del tablero) y, en Armar, el tablero en 640 a 1920×1080. La
      columna pasa a ser un panel a la altura del tablero (quién juega, la
      planilla de lo jugado, los controles abajo), como lichess. Criterio
      entero en `DISENO.md` §1.12, no solo los botones.
      Y que al pasar de Posiciones a Armar el tablero no cambie de tamaño ni
      de lugar (se aceptó en la v1.4, con la columna de entonces).
- [ ] **Hover y foco en todo lo que se clickea**, que es el estado que
      `DISENO.md` §1.10 deja "para cuando se aplique": se escribe acá y se
      pasa por todas las pantallas.

## Etapa 4 · Posiciones, y el puente con el profe — primer módulo nuevo

**El primer módulo nuevo, después de partir `index.html`** (reordenamiento
del 20-nov). La etapa 3 (animaciones) pasó a Relleno: los números quedan como
estaban para no romper las referencias de otros documentos. Es el más chico de los cuatro, sirve
desde el primer día (el profe hoy manda links de lichess) y es la base de
Práctica y Lecciones, que también son "jugar desde una posición".

- [ ] **Que el motor no conteste al instante** (Juan, 26-nov: *"jugaba
      rapidísimo, pensé que ya estaba consultando una tabla"*). Un tiempo
      mínimo que varíe (del orden de medio segundo a un segundo y medio, lo
      afina el revisor de UX), y la pieza que se mueve animada. El sonido,
      opcional y apagado de fábrica.
- [ ] **Mandar lo jugado al profe** (Juan, 26-nov; el revisor de ajedrez
      llegó a lo mismo). Un botón que copia la posición, la partida en PGN
      y, si hay objetivo, si se cumplió; Juan lo pega en el proyecto del
      profe. Va después de "Analizar lo que jugaste".
- [ ] **El objetivo en el link** (revisor de ajedrez y Juan, 26-nov):
      `ganar` o `tablas` (contra la máquina y sin reloj, ganar es dar mate:
      no son dos objetivos). Al terminar, "Lo lograste" o "Era ganado y
      quedó tablas", siempre medido con el motor. Definir el formato junto
      con el texto para el profe. Va antes que la Pista: la pista ayuda
      hacia un objetivo. (Los de "encontrá cómo ganar material", que pueden
      ser varias jugadas, van en Práctica.)
- [ ] **La apertura que juega el motor, desde el link** (Juan, 26-nov). El
      profe dice qué apertura va a intentar el motor (por nombre, contra
      `aperturas.json`, o por jugadas) y el motor la sigue mientras pueda,
      reaccionando a lo que juega Juan: si Juan se va de la línea, elige
      entre las jugadas que siguen dentro de esa apertura y, si ya no
      queda ninguna, juega por su cuenta. Primero el criterio con el
      revisor de ajedrez (qué es "seguir intentando" una apertura cuando el
      rival se desvía).
- [ ] **Variedad del motor, configurable** (revisor de ajedrez y Juan,
      26-nov). Que entre jugadas de evaluación parecida elija distinto cada
      vez, para que repetir una posición no sea repetir una línea. Se
      elige en la pantalla y puede venir en el link (`&variedad=no|poca|
      mucha`). De fábrica, poca.
- [ ] **Mis posiciones** (revisor de ajedrez, 26-nov; Juan: "me sirve"). Cada link que se abre queda guardado solo, con la fecha y,
      si tiene objetivo, si se logró, para volver sin buscar el mensaje del
      profe. Que muestre lo logrado y no solo lo pendiente. Después del
      objetivo.
- [ ] **Pista** (Juan, 26-nov): un botón que ayuda sin dar la jugada
      entera. Primero el criterio con el revisor de ajedrez (¿la pieza que
      se mueve, la casilla, la idea?), después se dibuja.
      Con la fila de tres acciones (Deshacer, Pista, Analizar) en un solo
      renglón a 386: variantes junto con la Pista (revisor de UX, v1.5).
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
- [ ] **Ejercicios de "encontrá cómo ganar"** (Juan, 26-nov): no siempre es
      una jugada; puede ser una simplificación de varias de la que salís
      ganando. El tablero se frena cuando la ventaja queda clara (medida con
      el motor) o cuando Juan se equivoca. Que el profe también los pueda
      mandar por link.
- [ ] Link directo a un tema o a un ejercicio, para el profe.
- [ ] La licencia de los puzzles a la vista, y con ella la pantalla "Acerca
      de" (Juan, 15-nov: la atribución de las piezas, la ayuda, el link del
      profe).

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
- [ ] ⏸ va con el dial · **Lavado de cara: los grupos de la hoja de Ajustes** (revisor, v0.160;
      celu y PC). "El tablero" tiene un solo renglón, "Cómo se ve la partida"
      dos, y "La explicación" queda vacía cuando se elijan los diales a prueba.
      Un título con raya para un renglón pesa más de lo que vale. ¿Grupos, una
      lista corta sin títulos, o dos grupos como mucho? Depende de
      "La variante como modo" (⏸, el dial): no se toma hasta que Juan elija.
- [ ] ⏸ va con "la variante como modo" · Propuestas del revisor de ajedrez para más adelante: qué amenaza el
  rival en la posición de la variante; la evaluación como número en la
  tarjeta de la variante con el modo "en la tarjeta"; la línea corta del
  motor; resumen de la variante contra la partida; aviso de confianza
  cuando la variante se alarga.

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
      - **La coronación que es un sacrificio que funciona** (revisor de
        ajedrez, v0.178.4). Si coronar desvía una pieza y gana, la cuenta del
        cambio la ve "perdida" y la tarjeta calla "Coronás" (bien), pero no dice
        qué gana. Pide entender la táctica; va con "Que la tarjeta cuente ideas".
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

- [ ] **[PC] La barra de evaluación y la curva pesan más que la tarjeta**
      (revisor, v0.179). En crema casi blanco son lo más luminoso de la
      pantalla, más que el veredicto (la regla de "la barra de progreso casi
      blanca", `DISENO.md`). ¿Cuánto tiene que pesar la evaluación? Con
      variantes; toca el sistema de diseño si cambia el color.
- [ ] **La precisión del Mes, entera en todos lados** (revisor, v1.0). El
      cuadro dice "84.6" (`prec.toFixed(1)`, en `src/mes.js` o `src/mes-pintar.js`: grep `toFixed(1)`) y "Partida por
      partida" e inicio dicen "85": el mismo dato de dos maneras en la misma
      pantalla. Entera, por §1.4 (no prometer un decimal que no se tiene).
- [ ] **"Mediana 0.00" del Mes no dice de qué** (revisor, v1.0): solo se
      entiende abriendo "Cómo se leen estos números". ¿Qué palabra la explica?
- [ ] **[PC] La fila de "Partida por partida" estirada a 640** (revisor,
      v1.0): "Ganada" y "prec. 85" flotan lejos del nombre y la fecha. ¿Ancho
      tope, o columnas alineadas con las tablas de abajo?
- [ ] **El renglón técnico de la cabecera del Mes** (revisor, v1.0; celu):
      "1 partida · 18 jugadas · prof 16 · crítico" arriba de lo que más se
      mira. ¿Hace falta a la vista, o va adentro de "Cómo se leen…"?

- [ ] **El inicio con usuario guardado mientras la app arranca** (revisor
      de UX, v1.0.10; celu). Con mala señal se ven ~10 s el campo vacío y
      Buscar, y al arrancar salta a "juancito · cambiar" y busca sola: un
      salto que nadie tocó, y mientras tanto la app parece no acordarse de
      él. ¿El script clásico arma la fila "ya usuario" desde
      `localStorage.usuario` en el primer cuadro y el módulo solo larga la
      búsqueda?

- [ ] **Posiciones: elegir la pieza al coronar** (v1.1). Hoy va siempre a
      dama. Una fila de cuatro piezas sobre la casilla, como lichess.
- [ ] **Posiciones: avisar que hay jugadas atrás** (revisor de UX,
      v1.1.2; celu). El renglón de jugadas, corrido al final, arranca justo
      en el borde y puede cortar una jugada a la mitad. Un difuminado de 24
      a la izquierda cuando `scrollLeft > 0`.
- [ ] **[PC] Posiciones con teclado** (revisor de UX, v1.1): Tab se saltea
      el tablero; el resto de la app se juega con teclado desde la v0.153.
- [ ] **Arrastrar piezas en Posiciones y en Armar**:
  - **Posiciones: arrastrar la pieza** (v1.1). Hoy es tocar y tocar; el
        arrastre de la Partida está atado a `#tablero`.
  - **Arrastrar piezas al armar una posición** (revisor de UX, v1.4),
        como en lichess: arrastrar para mover, soltar afuera para sacar, y de
        la paleta al tablero. Hoy mover una pieza son tres toques. Juan quiso
        el arrastre en la Partida porque "se siente como un tablero de
        verdad".
- [ ] **Lavado de cara: Posiciones vacía** (revisor de UX, v1.3). Desde la
      barra, sin link y sin nada jugado, la pantalla es la posición inicial,
      "Todavía no se jugó nada." y un Deshacer apagado: es la primera
      impresión del módulo. ¿Qué ve Juan la primera vez que entra sin link?
      (la última posición, un "pegá un link o armala a mano", o lo que traiga
      "Armar una posición a mano", que es el ítem que sigue en la etapa 4).
      Desde la v1.4 "Armar" existe, pero solo se llega por la hoja: el
      revisor pidió que el estado vacío tenga también un acceso directo. Y
      la hoja se titula "La partida", y armar una posición no es un ajuste
      de la partida: decidir por dónde se llega (revisor de UX, v1.4).

- [ ] **[PC] La pantalla de la Partida a 1920** (revisor de UX, v1.8). Sigue
      siendo un bloque centrado con ~240 vacíos a cada lado y ~50 sobrantes
      abajo de los botones. ¿El tablero y el panel usan el ancho, o el panel
      crece hasta un tope y el sobrante va al costado del tablero?
- [ ] **[PC] La jugada elegida en la planilla lleva dos marcas** (revisor de
      UX, v1.8; ya estaba): la caja de la categoría y el subrayado del
      acento. ¿Cuál dice "elegida" y cuál "categoría", igual en toda la app?
- [ ] **[PC] La tabla del Resumen no entra a 1366** (revisor de UX, v1.8;
      ya estaba): se corta en "Omisión" y las columnas de los dos jugadores
      quedan tiradas a los bordes, con el sobrante entre el rótulo y los
      números. ¿Dos columnas de categorías, filas de 20, columnas de ancho
      fijo al lado del rótulo? Con los ceros a la vista.

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

- [ ] **Limpieza de comentarios y restos (interno)**:
  - **Recortar el relato en comentarios largos del análisis de esta
        semana**: `cambioEn` (`src/analisis-posicion.js`), "LO QUE SE PIERDE EN EL CAMBIO" (grep,
        que arranca diciendo "desde dos peones" cuando el código pide uno),
        `puedeComer`, "CÓMO SE SALVÓ" y el mecanismo del cambio (grep en
        `src/analisis-*.js`). Quedarse con el porqué medido y los FEN. ~600 tokens; solo
        comentarios (`git diff -w`). Interno.
  - **El script clásico**: dos comentarios que dicen lo mismo (`src/registro.js`)
        y uno falso ("corre en la cabeza": corre al principio del body); la
        rama `e.reason` de `mostrarError`, que no corre nunca; el
        `URL.createObjectURL` de Descargar sin liberar. Interno.
  - (Menor) El redondeo de la precisión repetido en `pintarFilas` y
        `pintarLista`: que viva en `filaDePartida`. Interno.
  - **Comentarios huérfanos que el corte dejó a la vista** (revisor de
        código, 25-nov, sobre la etapa 2). `src/mes.js` termina con "Por debajo
        de esta cantidad de jugadas no se muestra porcentaje…", que ya es falso
        (`tablas.js` abre con "Ya no hay mínimo para los porcentajes (v0.50)");
        y al principio de `tablas.js`, "Una fila por mecanismo…", pegado a otro:
        confirmar si le falta su código antes de borrarlo. Interno.

### La tarjeta y las tablas (revisor de ajedrez)

- [ ] **El orden de las frases con lo que de verdad gana la clavada**
      (revisor de ajedrez, v0.177). Hoy la clavada vale lo que la pieza
      clavada; mejor la clavada menos la que clava: en
      `r3k3/1p6/2n5/8/P7/8/8/4KB2 w`, f1b5 sale "Clava el caballo…" antes que
      "Salva tu peón de a4" y el caballo está defendido. Y en las de libro el
      orden viejo sigue (salvar antes que el ataque).

- [ ] **La clavada vieja que la jugada cobra** (revisor de ajedrez, v0.178).
      Hoy solo se dicen las clavadas nuevas. En `7k/8/4qr2/8/3Bn3/8/8/4Q1K1 w`,
      Bxf6+ cobra la clavada del caballo de e4 (que ya estaba: tras cualquier
      respuesta cae el caballo o la dama), y la tarjeta solo dice "El rival
      tiene Qxf6", que suena a que se pierde el alfil. Decir "el caballo de e4
      sigue clavado y cae" cuando la jugada la aprovecha. Revisor de ajedrez sí.

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

### Que se sienta bien (la vieja etapa 3: animaciones)

- [ ] La pieza que se mueve al pasar de jugada (abre las demás animaciones).
- [ ] El tablero sigue al dedo al deslizar.
- [ ] La tira se centra con movimiento; la hoja de ajustes sube. (Lo de la
      tarjeta que cambia de alto pasó a la etapa 1 como lavado de cara, v0.148:
      no es animarlo, es que el tablero no se mueva.)
- [ ] `prefers-reduced-motion` en todas.

### Sueltos del traspaso (20-nov, rescatados de §4 y §8)

Pendientes que estaban anotados solo en el traspaso.

- [ ] **La jerga en las frases** (§4octodecies): "los chanchos en la séptima"
      y compañía. Tanda propia, con su mirada en el celu; primero contestar
      hasta dónde, sin perder la capacidad de decir un número. Revisor de
      ajedrez sí.
- [ ] **El cierre de la tira** (§6, "Dos pendientes"; lo marcó Juan):
  - **"regla de 50 jugadas · 61 jugadas"** (§6, "Dos pendientes"): "jugadas"
        dos veces con dos significados. De las cuatro salidas dibujadas, la que
        no fuerza nada es callar el largo en ese caso.
  - **Dónde vive "cómo terminó"** (§6, mismo lugar; lo marcó Juan): el
        cierre de la tira solo se ve al final de la lista y repite el largo que
        la lista ya dice un renglón arriba.
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

### Sueltos de los revisores (25 al 28-nov)

- [ ] (Menor) **Partir `src/revision.js`** (revisor de código, 25-nov): es el
      pedazo más grande (~20.000 tokens) y casi la mitad de abajo son gestos y
      teclado (desde el arrastre hasta las teclas): un `gestos.js` aparte, sumado a `ORDEN`. Interno, armado
      idéntico al byte.
- [ ] **El toque de 48 en lo que ya estaba** (la medida nueva de `mirar`,
      26-nov; ya estaba). El renglón "toque" marca, a 412: en la Partida
      "‹ ›" de 34×44 y Girar de 33×48; en el Mes los dos selects y el "?"
      de 44–45 de alto; en el inicio el select de meses de 45. §1.7 pide
      48 contando el `::before`/`::after` invisible. Que el revisor diga
      cuáles agrandar (los de la fila de la jugada tienen su excepción de
      40) y que el renglón quede en `[]` o con la excepción escrita.
- [ ] **Dónde vive la versión** (revisor de UX, v1.2; ya estaba). El
      "v1.2" al pie queda suelto debajo del contenido en todas las pantallas
      del celu. ¿Al pie de la hoja de Ajustes (y de la de Posiciones) en vez
      de flotar sobre el fondo? Ojo: es lo que Juan busca para saber si le
      llegó el cambio; que siga a un toque.
- [ ] **`mirar mate` y `mirar ahogado` se caen en la pasada de la compu**
      (26-nov; ya estaba). Las partidas cortas rompen un `waitFor` de `mirar.mjs` y
      el arrastre (no hay jugada `from`), así que nunca llegan al final
      del arnés. Que salteen lo que pide más jugadas de las que tienen.
      Interno.
- [ ] **Un PGN pegado con un arranque imposible** (revisor de ajedrez,
      v1.5): peón en la octava, sin rey, el que no mueve en jaque.
      `prepararPartida` lo acepta; Stockfish contesta `(none)` y no se
      cuelga, pero el análisis no sirve. Pasarlo por `problemaDelFen` (hoy
      en `posicion.js`) y decir "la posición de arranque no es válida".

- [ ] **"Destapa" también cuando la pieza destapada es más cara que su
      atacante** (revisor de ajedrez, v1.7.1). `observarJugada` calcula
      `destapada` solo para el motivo "sin defensa"; con el motivo "menor"
      (la dama a tiro de una torre) no. Bxa7 en
      `r3r1k1/p4ppp/8/8/8/4B3/4Q1PP/6K1 w` es una descubierta de libro sobre
      la dama y la tarjeta dice "queda a tiro", que es cierto pero no dice cómo.
