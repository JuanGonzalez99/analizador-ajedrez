# Aprendizajes: por qué se escapó lo que se escapó

Pedido de Juan (22-nov-2026, después de la v1.0): *"que no solamente diga
'che, hay que cambiar esto', sino también 'y por qué el que lo hizo no se dio
cuenta'. Así se evitan futuros errores del mismo estilo"*. Y que se mejoren
solos, sin que él tenga que pedirlo.

## El circuito

1. **Todo hallazgo trae su porqué.** Cualquier revisor (UX, ajedrez, código,
   rumbo), el mono **o Juan** (un "no me copa" sobre algo ya hecho también
   es un hallazgo), cuando encuentra algo que **ya estaba** o que quien
   programó no vio antes de la revisión, dice además **por qué no se vio**:
   una causa de la lista de abajo y **qué cambiar para que no vuelva a
   pasar**, con el archivo y el texto exacto. Si se le escapó a un revisor en
   una revisión anterior, también: el que se equivocó puede ser él.
2. **La prevención se aplica esa misma noche**, sin preguntarle a Juan y sin
   contar como ítem (`TAREA-NOCTURNA.md`, paso 5bis). Puede ser:
   - una regla en el archivo del agente que no lo vio (`.claude/agents/*.md`);
   - una captura o una medida nueva en el arnés (`pruebas/mirar.mjs`), para
     que el caso quede a la vista siempre y no dependa de que alguien se
     acuerde;
   - un chequeo en `npm test` o una regla del mono;
   - un paso en `TAREA-NOCTURNA.md`, si el que no lo vio es quien programa.
   **Mejor una medida que una regla escrita**: lo que mide el arnés no se
   olvida; lo que dice un archivo, a veces sí.
3. **Se anota acá abajo**, una línea por caso, en el mismo commit que la
   prevención. Y va al resumen de la mañana, en "Lo que aprendimos".
4. **Los domingos se mira si funcionó.** La revisión del criterio
   (`TAREA-NOCTURNA.md`, paso 0) lee este registro: **una causa que se repite
   quiere decir que la prevención anterior no alcanzó**, y se cambia por una
   más fuerte (casi siempre: pasar de regla escrita a medida del arnés). Y
   junta los casos en principios para que los archivos no crezcan sin fin.

**Una prevención se escribe contra la causa, no contra el caso que la
destapó** (Juan, 27-nov-2026: *"creo que eso es fundamental"*). La prueba:
**¿qué otros casos atrapa, en otras pantallas o en lo que todavía no
existe?** Si solo atrapa el que la destapó, está escrita contra el caso y no
sirve. Pasó ese día: por "es una app de celu adaptada a PC" se midieron
cuatro síntomas de la Partida (los botones de pasar jugadas por su nombre,
Ajustes por su id), Posiciones dio cero avisos, y Juan la seguía sintiendo
de celu. La que vale mide "botones de dedo en cualquier pantalla de compu",
no "`#ant` mide 44". Por eso en el registro cada prevención dice, además,
qué otros casos cubre.

## Las causas

- **A. Estado no mirado.** Se miró la zona en un solo estado: otro scroll,
  otra jugada, abierta o cerrada, con o sin datos, hover o foco, otra opción
  de Ajustes, otro ancho.
- **B. Encuadre heredado.** El ítem decía qué mirar y se miró solo eso; o una
  regla nueva se aplicó solo donde nació.
- **C. El arnés no tenía el caso.** `mirar.mjs` no lo fotografía ni lo mide.
- **D. Criterio que faltaba.** La regla que lo hace malo no estaba escrita
  todavía.
- **E. Aceptado a sabiendas.** Se vio, se dejó a propósito y nadie lo volvió a
  juzgar.
- **F. Revisión estrecha.** Se revisó lo que cambió y no lo que lo rodea, o
  no se miró dónde más vive lo mismo (otra pantalla, otro rótulo).
- **G. Un vecino cambió después.** Estaba bien cuando se hizo y lo dejó mal un
  cambio posterior en otra zona.

## Prevenciones pendientes

Las que todavía no se aplicaron. **La tarea de la noche las hace primero**,
antes de los ítems, y no cuentan como ítem. Al hacerlas se borran de acá y
quedan en el registro.

**Repaso de las prevenciones viejas, contra la causa** (Juan, 27-nov: lo
anotado antes de esa regla probablemente esté escrito contra el caso). Una
tanda por noche, en este orden, y cada una se borra de acá al terminarla.
En cada prevención se contesta "¿qué otros casos atrapa?"; si solo atrapa
el suyo, se generaliza (la medida a toda pantalla o todo estado, la regla a
principio) o se junta con otra que ya lo cubra. Lo que cambió va al registro
en una línea por tanda y al resumen de la mañana. **Nada de esto cambia la
app**: las capturas del celu tienen que salir idénticas y `npm test` verde.

- [ ] **Tanda 3 · `pruebas/mirar.mjs`**: cada medida con OJO. La señal es
      que mida un elemento con nombre, una sola pantalla o un solo tamaño
      donde la regla vale para todos. *Hecha la primera parte* (28-nov): el
      texto cortado y los bordes en todos los tamaños de compu, y "sube
      desde abajo" en todo diálogo. Falta: las medidas de Posiciones con
      nombre (la hoja que tapa o pega al tablero, Deshacer que se mueve) y
      las de la barra de módulos.
- [ ] **Tanda 4 · el mono y `npm test`** (`pruebas/mono.mjs`,
      `pruebas/estaticos.mjs`, `pruebas/analisis.test.mjs`): las reglas y
      pruebas que nacieron de un error, con la misma pregunta.

- [ ] **Ningún push con `npm test` en rojo, sin depender de acordarse**
      (28-nov: la v1.8.1 y el commit de aprendizajes de la v1.8 salieron con
      dos pruebas rojas; causa C, el paso estaba escrito y nada lo
      controlaba). Un gancho `pre-push` de git versionado en
      `pruebas/ganchos/` que corra `npm test` (4 s), prendido por el hook
      SessionStart de `.claude/settings.json` con `git config
      core.hooksPath pruebas/ganchos`. **Espera a Juan**: tocar los hooks
      de la sesión lo frena el permiso automático; se le pide en el resumen.
      Atrapa todo push rojo, de día y de noche, de cualquier cambio.

- [ ] **`mirar` avisa de lo que pasa de renglón sin más aire afuera que
      adentro**: en todo control con hijos en más de un renglón (chips,
      pastillas, botones, cuadritos), OJO si el espacio entre sus renglones
      es igual o mayor que el que lo separa del siguiente control (revisor
      de UX, v1.9; causa D). Atrapa toda fila que pase de renglón, en
      cualquier pantalla.

Después de la cuarta, lo mantiene la revisión del domingo (`TAREA-NOCTURNA.md`,
paso 0).

## Registro

**Los casos juntos, en principios** (tanda 1 del repaso, 27-nov). Las
reglas de `revisor-ux.md` ya no nombran el caso, salvo como ejemplo:
(1) un grupo junta lo de igual alcance; (2) lo principal de cada pantalla se
lleva el lugar que sobra; (3) todo texto que promete algo se coteja con lo
que hace; (4) una marca, un significado en toda la app; (5) toda regla nueva
se barre por todas las pantallas, y la de compu por los dos monitores; (6)
lo que mide el arnés atrapa lo conocido: un número que rompe una regla es
hallazgo sin OJO; (7) la zona en todos sus estados, incluidos todo
prendido/apagado, cero/pocas/muchas, empezar/mitad/terminada, cada corte
del CSS y el medio de cada tramo, y un estado nuevo con lo que ya estaba;
(8) un camino nuevo hacia una pantalla vieja se mira en celu y compu; (9) el
desenlace de cualquier cosa pesa; (10) las variantes con la configuración de
fábrica de cada ancho.

**Tanda 2 del repaso** (28-nov): en `revisor-ajedrez.md`, siete reglas
pasan a cuatro principios —todo criterio en cada rama y con dos piezas
haciendo lo mismo; la pieza que nombra la frase contra lo que come el
motor, probada donde los atajos difieren; un barrido en cero solo prueba
lo que mira; toda entrada de afuera por la misma limpieza—; en
`revisor-codigo.md`, "¿si borro lo que cuida, se pone roja?" para toda
prueba, medida o regla del mono, y el código muerto de cualquier opción
descartada (no solo la de la v0.160); `revisor-rumbo.md` ya estaba escrito
contra la causa. En `TAREA-NOCTURNA.md` y `pruebas/tira.mjs`, la que estaba
contra el caso: las variantes de compu salían a 1000 y 1280, y desde el
27-nov se miran también los monitores de 1366 y 1920; ahora `pantallas()`
y `mirar` toman los tamaños de un solo lugar (`COMPU`).

Una línea por caso: qué se escapó, en qué versión se hizo y en cuál se vio,
la causa y qué se cambió. Los catorce primeros salieron del análisis del
22-nov-2026 sobre los lavados de cara de la etapa 1 (9 de 14 son A, B o F: la
zona se juzgaba en el único estado, ancho o pantalla que traía el arnés).

- **Los encabezados de la planilla corridos hasta 100 px, y una columna
  entera de "·"** · maqueta de la v1.8 (revisor de UX, mismo día) · B y C:
  se miró que el encabezado existiera, no que cayera sobre lo suyo, y la
  partida de prueba no traía reloj · `mirar` mide en toda tabla con thead
  y toda grilla con `data-encabeza` que cada encabezado caiga a 4 px de un
  texto de su celda, y avisa de columnas de puro relleno. Atrapa las
  tablas del Mes, el Resumen, Estadísticas y las que vengan.
- **La cabecera partida en dos con las tres mejores abiertas** · v1.8
  (revisor de UX, mismo día) · A: se midió el alto en tres estados, todos
  con las mejores cerradas · `mirar` avisa de toda pieza partida (mismo
  borde de color, hueco o radio en la unión) y prende, fotografía y apaga
  todo `[aria-pressed]` a la vista, como con las pestañas. Atrapa la
  tarjeta de la variante, Posiciones y todo botón que se prenda.
- **Las citas de renglón de la hoja de ruta, apuntando a nada** · la
  partición del 25-nov, lo vio el revisor de rumbo el 28-nov · G: la
  partición corrió toda la numeración y nadie revisó las referencias ·
  regla en "Cómo entra lo nuevo" (un ítem cita pedazo y función) y chequeo
  en `npm test` sobre los ítems abiertos. Atrapa cualquier referencia que
  corra un cambio futuro, no solo estas.
- **La v1.7 amontonaba los componentes del celu, y escondía los ceros para
  que entrara** · v1.7, lo vio Juan el 28-nov (*"no me gusta ninguna… se
  trató de amontonar todo"*) · D por tercera vez en dos días sobre la
  compu (la Partida y Posiciones el 27-nov) y B: las cuatro variantes
  reubicaron piezas del celu sin que nadie preguntara cómo serían si
  hubieran nacido en la compu; E: sacar los ceros se aceptó para que
  entrara la tabla · la regla ya estaba en `revisor-ux.md` y `DISENO.md`
  §3 (v1.7.2), pero la ve solo quien juzga; ahora también un paso en
  `TAREA-NOCTURNA.md` (3) para quien dibuja: antes de dibujar, cómo lo
  resuelve una referencia de escritorio, y una variante sale de ahí.
  Atrapa Ajustes, el inicio, Posiciones y todo ítem de compu que venga.
- **El arreglo de la tarjeta que calza con la posición del ítem y falla en
  otra** · v1.2.2 (h4) y v1.7.1 (Bxa7), B repetida · la regla del revisor
  de ajedrez nombraba el desempate; ahora un paso en `TAREA-NOCTURNA.md`
  (4) para quien programa: todo arreglo de la tarjeta se prueba en otra
  posición y con otro mecanismo antes del revisor. Atrapa toda frase que
  se arregle, no solo los desempates.
- **Empezar de nuevo y Armar adentro de las perillas de nivel y color** ·
  v1.2 y v1.4, lo vio Juan el 27-nov (la v1.6 lo arregló) · D: el criterio
  del revisor ubicaba los controles por frecuencia ("lo de una vez, a la
  hoja") y no por alcance (ajustar la partida o tirarla) · regla en
  `revisor-ux.md` y `DISENO.md` §3: un botón agrupa lo que tiene el mismo
  alcance; el ícono promete uno solo.
- **El tablero de Posiciones en la compu, chico con media pantalla vacía** ·
  v1.1.1 y v1.2.1, lo vio Juan el 27-nov (la v1.6.1 lo arregló; además
  estaba en Relleno desde la v1.1 sin tomarse) · D y E: se cuidó que
  entrara sin scroll con el final, y nadie preguntó qué es lo único que hay
  en la pantalla; la columna de dos quedó "para otra noche" · regla en
  `revisor-ux.md`: en la compu, si el tablero es lo único que importa,
  toma el alto entero y lo demás va al costado; y `mirar` mide el lado a
  1280 × 800 (OJO por debajo de 700).
- **La cabecera de la columna de Posiciones corrida 21–42 px del tablero**
  · v1.6.1 (revisor de UX, mismo día) · B: se dio por bueno el
  `margin-top` escrito sin medirlo, y una regla del celu más específica le
  ganaba · `mirar` mide `alineaCab` (OJO si pasa de 2) y que un menú
  abierto se cierre al cambiar la ventana.
- **El "+" de Posiciones con 34 de toque** · v1.6 (revisor de UX, mismo
  día) · C y E: `mirar` imprimía "chicos btnPosNueva 34×34" sin OJO y no
  se leyó · "toque, posición" avisa con OJO si hay chicos o pegados.
- **"Desde esta posición" no hacía lo que decía** · v1.6 (revisor de UX,
  mismo día; se le había escapado también al elegir la C) · D y B: el
  rótulo de la variante se copió sin mirar `deNuevoPos`, y la hoja se miró
  con la posición terminada (el botón apagado) · regla en `revisor-ux.md`:
  el rótulo se coteja con la función que llama y una hoja de opciones se
  mira con todas prendidas.
- **"Se planta" callado también en el puesto de manual** · v1.5.1 (revisor
  de ajedrez, misma noche) · C: en las partidas de prueba ninguna jugada
  tranquila de caballo llega a un puesto con cambio parejo, así que
  `frases` daba las mismas 11 con los dos criterios · la prueba de unidad
  fija la frontera (Nd5 apoyado en e4 contra un Nf6 se planta; Nxd7 Nfxd7
  no). Cuando `frases` no distingue dos criterios, se arma la posición de
  la frontera a mano.
- **Las comidas de la compu contadas contra el juego completo en una
  partida desde una posición** · v1.5 (revisor de UX, misma noche) · A y C:
  la Partida nueva se miró solo en el celu, donde las comidas no se ven, y
  `mirar` no llevaba esa Partida a la compu · `mirar.mjs` suma "partida
  desde una posición" a 1280 contando las piezas de #cArriba/#cAbajo (OJO si
  no dan 0), y regla: una partida que entra a la Partida por un camino nuevo
  se mira también en la compu.
- **El FEN de la cabecera de un PGN llegaba al motor sin limpiar** · v1.5
  (revisor de ajedrez, misma noche) · B: la limpieza de la v1.1 vivía en
  Posiciones y el FEN de afuera entró por un camino nuevo; C: todas las
  partidas de prueba arrancan de la inicial · `limpiarFen` pasa al bloque de
  análisis y `prepararPartida` la usa; prueba de unidad con "KQkq" sin
  torres; regla en `revisor-ajedrez.md` (todo FEN nuevo hacia el motor, por
  `limpiarFen`).
- **Un revisor vació el scratchpad compartido** · v1.5 · D: la regla decía
  "borrá tus andamios" sin decir cuáles · regla en `revisor-ux.md` y
  `revisor-ajedrez.md`: se borra por nombre, nunca la carpeta.
- **"Atrapa…" callado con dos atacantes comibles por separado** · v1.4.1
  (no salió) · D: "con dos atacantes y uno solo comible, la trampa sigue"
  se escribió como "si todos son comibles, se calla"; C: ninguna partida de
  prueba tiene una trampa con dos atacantes · la prueba de unidad suma
  Bd8 en `8/7k/8/1p1n1p2/2P1P2B/P5P1/1P3P2/6K1 w`, y regla en
  `revisor-ajedrez.md`: lo que "el rival puede deshacer" se verifica
  jugando la respuesta y con dos atacantes.
- **Armar posición: la columna de la compu fuera de la pantalla, el "‹" y
  las piezas a 386 sin 48 de toque, y la pieza elegida igual al foco** ·
  v1.4 (no salió) · A y C: el arnés miraba 999 y 1000, no el medio del
  tramo nuevo (768–999, donde el body mide 700 como mucho), y `toques()`
  corría solo a 412; C: "chicos" se imprimía y el OJO no lo miraba; D: el
  revisor pidió para la elegida el anillo del foco · `mirar` mide Armar a
  cada lado de cada corte y en el medio, el margen derecho del último
  control, los toques también a 386, frena con los chicos, y compara la
  elegida con el foco; regla en `revisor-ux.md` ("Lo elegido no se parece
  al foco"). Para quien programa: un número del resumen que no está en la
  condición del OJO no está aprobado.
- **La Partida corrida sin riel en la compu, y el título de Posiciones 4 px
  adentro** · v1.3.1 y v1.3 (no salieron) · F: se miró la pantalla que
  tenía el riel y no las que se corrían sin tenerlo; C: "bordes en la
  compu" mide que abran en el mismo x, no si el corrimiento tiene motivo;
  G: al sacar el "‹" quedó su margen · `mirar` mide que la Partida de la
  compu no tenga riel a 1000, 1110 y 1270, y el título de Posiciones al ras
  de Deshacer por Range. Y una mía: probé el riel en la Partida con la
  evaluación horizontal porque la maqueta arrancaba en el celu, y la de
  fábrica en la compu es la barra (A: estado no mirado); `mirar` sí la usa.
- **Las variantes de la barra de módulos, solo de celu y con un mes de una
  partida** · maqueta del 26-nov (no salió) · B+F: el ítem hablaba del celu
  y nadie dibujó PC (abajo, a 1280, la barra no servía); A+C: "el inicio al
  fondo" con una sola fila no scrollea · `pantallas()` fotografía cada
  variante también a 1000 y 1280 sin que se lo pidan; `mirar` mide la barra
  con un mes largo al fondo y que a 1000 sea vertical (con la v1.3).
- **El descuento de "queda comible" sin la coronación, y `frases` ciego a
  `colgada`** · v1.2.3 (no salió) · B: el descuento se escribió de nuevo en
  vez de copiar el de `cambio` (lo comido más lo coronado); C: `frases` arma
  la fila a mano y nunca calculaba `colgada`, así que "0 diferencias" no
  probaba nada · `frases` calcula `colgada` en la pasada [error]; regla en
  `revisor-ajedrez.md` ("un descuento de material se copia de `cambio`").
- **Bxa7 nombra el alfil y no la dama que destapa** · ya estaba; lo vio el
  revisor de ajedrez en la v1.2.3 · B: la regla "lo que el motor come dice
  qué se pierde" de la v1.2.2 se aplicó solo a `siguen` · regla en
  `revisor-ajedrez.md` (vale para toda pieza que come `mejorRival`); el
  arreglo, a Arreglos.
- **"Tu peón queda comible" con la dama colgada al lado** · ya estaba;
  lo vio el revisor de ajedrez en la v1.2.2 · B+C: el ítem se encuadró
  sobre h4, el único caso sin otro mecanismo, y `frases` no puede verlo (el
  falso nunca come una pieza que venía colgada) · pruebas de g4, Ba6, Rb1 y
  c3, y regla en `revisor-ajedrez.md` ("lo que el motor come dice qué se
  pierde").
- **La hoja de Posiciones a 3 px del tablero a 745, "Otra vez" sin nada
  que hacer y el final a 22/600** · v1.2 (no salió) · A+C: el arnés medía
  la hoja a un solo alto (760) y entraba al final siempre jugando; D: nada
  comparaba la tipografía contra §1.4 · renglones "hoja sobre tablero",
  "llega terminada" y "títulos" en `mirar`.
- **La variante D tapaba Deshacer al terminar** · maqueta del 26-nov (no
  salió) · A: el final se dibujó como un estado aparte y no como la misma
  zona con algo sumado · `mirar` mide la fila y el tablero con 0 jugadas, a
  mitad, con mate y con ahogado (dos posiciones de una jugada al final del
  arnés, porque `mirar mate` se cae antes).
- **Prevención de Posiciones hecha** · 26-nov · `mirar` abre el link, juega
  la partida de prueba contra el falso (que ahora contesta `position … moves`)
  y mide: Deshacer no se mueve con 36 jugadas (0 y 0), nada se corta a 386,
  en la compu entra sin scroll. Y un renglón "toque" en las cuatro pantallas
  del celu. Lo primero que mostró: los botones de Posiciones miden 44 de
  alto (al lavado de cara) y cinco controles viejos no llegan a 48 (a
  Relleno).
- **Posiciones se armó sin variantes y se ve armada, no diseñada** · v1.1 →
  lo vio Juan el 26-nov ("los botones están raros") · D+F: el ítem hablaba
  de lo que hace y no de cómo se ve, así que no lo traté como forma nueva;
  el revisor juzgó medidas (toque, espacios, pliegue) y aprobó sin
  preguntarse si la pantalla se veía pensada · regla en `TAREA-NOCTURNA.md`
  (pantalla nueva = variantes antes del código) y en `revisor-ux.md` (sin
  variantes no se aprueba).
- **Posiciones con FEN imposibles de contenido** · v1.1 (no salió) · D+C:
  creí que chess.js validaba el FEN y solo valida la forma; probé solo FEN
  bien formados · pruebas de unidad con los imposibles (enroque sin torre,
  peón en la octava, al paso sin peón) y regla en `revisor-ajedrez.md`.
- **El al paso que `limpiarFen` deja pasar** · v1.1.2 (leve, a Arreglos) ·
  D: el revisor pidió una condición incompleta y no se comparó con la de
  Stockfish · regla en `revisor-ajedrez.md`: copiar la condición de
  Stockfish y compararla con su `d`.
- **La triple repetición sin historia** · v1.1 (no salió) · D: los estados se
  probaron desde una sola posición · prueba de unidad con la repetición.
- **Posiciones: botones de 36, que se corrían, y el final sin peso** · v1.1
  (no salió) · A+C+F: se miró con 0–2 jugadas, `mirar` no pasa por ahí y
  §1.7 no se mide · regla de peso en `revisor-ux.md`; la pasada de `mirar`
  con 40 jugadas y el toque medido, pendientes.
- **Fundido de la lista solo abajo** · v0.179 → v1.0 · A+B: el ítem decía
  "el borde de abajo" y el arnés fotografía la lista solo arriba de todo; el
  revisor eligió las variantes en ese único estado · los estados de la zona
  en `revisor-ux.md` y la lista bajada en `mirar.mjs`.
- 1 · [PC] La barra horizontal no se alineaba con la columna · v0.125 →
  v0.132 · A: se midió con la vertical, la de fábrica · estados de la zona
  (cada opción de Ajustes).
- 2 · [PC] El inicio corrido a la izquierda · v0.122 → v0.145 · G: la Partida
  se rehízo después y nadie comparó bordes · bordes entre pantallas en
  `mirar.mjs`.
- 3 · [PC] La banda del hover en los títulos del Mes · → v0.146 · A+C: el
  arnés nunca hace hover ahí · hover en `mirar.mjs`.
- 4 · "48 %" y "48.0%" en la misma pantalla · v0.156 → v0.157 · D · regla
  nueva obliga a barrer (`TAREA-NOCTURNA.md`).
- 5 · [PC] La lista cortada a mitad de fila · v0.135 → v0.149 · E: "medio
  renglón se acepta" · lo aceptado vence (`revisor-rumbo.md`).
- 6 · [PC] "la juga…" a 1000 · v0.125 → v0.150 · A: el corte se movió a 1000
  y a 1000 justo no se midió · anchos de corte en los estados; chequeo de "…"
 .
- 7 · Los bordes de la tira en "la lista abajo" · → v0.160 · A+C: opción
  que no era de fábrica · estados de la zona; dial en `mirar.mjs`.
- 8 · [PC] La caja vacía de las tres mejores · v0.150 → v0.151 · E: se vio
  vacía y se aceptó · lo aceptado vence.
- 9 · [PC] El "·" suelto en las filas sin reloj · → v0.179 · F · "¿dónde más
  vive esto?" en `revisor-ux.md`.
- 10 · [PC] "Partida por partida" estirada a 640 · v0.148.1 → v1.0 · F: la
  maqueta se armó solo sobre el inicio y la fila es la misma en el Mes ·
  "¿dónde más vive esto?".
- 11 · El renglón técnico de la cabecera del Mes · v0.108 → v1.0 · E · lo
  aceptado vence.
- 12 · La precisión "84.6" y "85" · v0.158 → v1.0 · B: el barrido de las
  tasas no tocó la precisión · regla nueva obliga a barrer.
- 13 · "Mediana 0.00" sin decir de qué · v0.174 → v1.0 · F: cambió el cálculo
  y no se miró el rótulo · "¿dónde más vive esto?".
- 14 · [PC] La barra y la curva brillan más que la tarjeta · → v0.179 · B: la
  regla era de la barra de progreso y no se aplicó a las otras · regla nueva
  obliga a barrer.
- **Prevenciones de los casos 1–3, 6, 7, 9, 10, 13 y v0.179, hechas** ·
  22-nov · `mirar.mjs` suma las capturas y medidas de los estados que
  faltaban y el Mes de cinco partidas (§2 del traspaso, "Los estados que
  faltaban"). El caso 7 ya tenía la suya (`prueba-forma-abajo`). Lo primero
  que mostró: la Partida no abre en el borde del Mes (a Relleno).
- **Qxf6 "queda comible" en un cambio de damas, y "Atrapa la dama" con el
  alfil comible** · ya estaban; los vio el revisor de ajedrez en la v1.0.2
  · D: no había regla de que la frase sobreviva a la respuesta del rival ni
  de que se descuente lo comido · regla en `revisor-ajedrez.md` (jugar la
  respuesta obvia y la del motor; recorrer todas las legales de las PGN
  antes y después) y los dos a Arreglos con sus FEN.
- **[PC] La Partida no abre en el borde del Mes y el inicio** · el inicio
  se alineó con el Mes en la v0.145/v0.154 y la Partida nunca entró en esa
  comparación → lo mostró el arnés el 22-nov · F+B: la regla "mismo borde"
  se aplicó a las dos pantallas donde nació y no se buscó dónde más valía
  (la Partida tiene su propia grilla, 680 + 380) · el renglón "bordes en la
  compu" de `mirar.mjs`, que además avisa con OJO si a un mismo ancho las
  tres pantallas difieren en más de 2 px; el arreglo, en Relleno.
- **"Defiende" cuando se comió al atacante, y en el enroque** · v1.0.4 (antes
  de salir) → revisor de ajedrez · A+C: la frase nueva se probó solo en las
  posiciones que pensó quien la escribió (Bh6, Bb5, d3), y Bxd4 —que come al
  peón que atacaba al caballo— estaba entre las legales de la partida de
  prueba; el revisor lo vio recorriendo todas las legales contra la versión
  anterior · `npm run frases` hace ese recorrido en un comando (2.312
  jugadas, ~25 s) y lista lo que la tarjeta dice distinto; paso nuevo en
  `TAREA-NOCTURNA.md` (4) antes de pasar al revisor de ajedrez.
- **"Defiende… a tiro de un peón" en cxd4** · v1.0.4, segunda vuelta → el
  mismo revisor de ajedrez en la tercera · B: el arreglo que propuso ("sigue
  atacada") no se cruzó con el motivo "menor", y las partidas del repo no
  tienen ese caso, así que el recorrido no podía verlo · regla en
  `revisor-ajedrez.md`: los criterios de "sigue atacada" se prueban con cada
  motivo y con el atacante comido mientras queda otro; y la prueba de unidad.
- **"Te quedás con la pareja de alfiles" con el otro alfil colgado** · ya
  estaba; lo vio el revisor de ajedrez en la v1.0.6 (antes de salir) · B+C:
  el ítem (escrito por el mismo revisor) hablaba del alfil que comió y el
  arreglo miró solo ese; Nxc4 decía lo mismo antes y después, así que
  `npm run frases`, que lista diferencias, no podía mostrarlo · `--frase` en
  `frases.mjs` (todas las jugadas donde sale la frase), paso en
  `TAREA-NOCTURNA.md` (4), regla en `revisor-ajedrez.md` (las frases de estado
  se prueban contra todas las piezas que las sostienen) y la prueba de unidad.
  "Se planta", con la misma falla, a Arreglos.
- **El cartel rojo falso con la red lenta** · ya estaba → visto el 25-nov
  (revisor de código) · C: el mono frena la API y el motor, pero los
  archivos de la app llegan siempre al toque · el mono demora `chess.js` 7 s
  en uno de cada cuatro recorridos y vigila el cartel (regla 11); nació en
  rojo con la semilla 1.
- **Dos funciones muertas (`entregaMaterial`, `atacadaPor`)** · v0.134 y
  antes → 25-nov · G: el uso se mudó a otra función y la vieja quedó; una
  prueba exigía que existiera · chequeo 6bis de `estaticos.mjs` (toda función
  de nivel superior tiene quien la llame), y las dos fuera en la v1.0.8.
- **"Destapa" cuando la jugada desclavaba al atacante** · v1.0.7 → visto en
  la misma noche (revisor de ajedrez) · D+B: la regla se pensó para la línea
  abierta del ítem y "antes nadie atacaba" no distingue cómo apareció el
  ataque · regla en `revisor-ajedrez.md` (una frase de mecanismo se prueba
  contra los otros mecanismos) y la prueba de unidad con Be2.
- **`npm run frases` no veía las frases de la jugada mala** · v1.0.4 → v1.0.7
  · C: la fila iba sin pérdida, y "no cambia nada" se leyó como cobertura en
  el traspaso · `frases.mjs` dice cada jugada como buena y como error.
- **El mapa del §3 mandaba el arrastre a `tablero.js`** · etapa 2 → visto la
  misma noche (revisor de código) · F: la fila se escribió con el encabezado
  y las funciones de cada pedazo, sin buscar dónde se enganchan los eventos ·
  chequeo 0bis de `estaticos.mjs`: cada nombre de una fila del mapa tiene que
  estar en ese pedazo (y una fila por pedazo: la primera versión daba verde
  sin encontrar el mapa; una prueba se prueba también quitándole lo que lee).
- **Le pedí al revisor juzgar un texto que en modo simple no se ve** · v1.0.9
  · A: miré el cambio en el código y no la pantalla en el modo de Juan ·
  paso en `TAREA-NOCTURNA.md` (4): la captura de un cambio se saca en modo
  simple y se dice si lo cambiado se ve ahí.
- **Buscar no responde mientras carga el módulo** · ya estaba → v1.0.9
  (revisor de UX) · C: nadie tocó nada antes de `MODULO_OK` · prevención
  pendiente en el mono; el arreglo, a Arreglos · las dos hechas en la
  v1.0.10 (regla 6bis del mono: toca Buscar antes de `MODULO_OK`).
- **El arreglo de Buscar repetía todos los botones** · v1.0.10 (primera
  vuelta, no salió) · A+F: probé un solo botón (Buscar) y el oyente era para
  todos los `button[id]`; no me pregunté dónde más vive · la regla 6bis toca
  un botón al azar y vigila que al arrancar no se abra nada, no haya diálogo
  ni descarga.
- **El aviso de Buscar prometía con el módulo roto, y el guardado pisaba lo
  escrito** · v1.0.10 (segunda vuelta, no salió) · A: probé solo el camino
  feliz (módulo lento, sin usuario guardado); el arnés arranca sin usuario
  guardado y el revisor dejó el caso roto sin mirar en la primera · la regla
  6bis escribe otro nombre y mira a quién se pide, y uno de cada tres
  recorridos lentos rompe `chess.js` y mira el aviso.
- **La app en la compu, una de celu acomodada** · Juan, 27-nov, usándola un
  día en la PC · C: el arnés miraba la compu solo a 1280×800, donde no se ve
  ni la columna centrada de 1920 ni la Partida que no entra a 1366×768; D:
  "PC aprovechada" no decía qué era aprovechar, y se leyó como "que entre y no
  se rompa"; E: "Juan no usa la compu" bajó la vara en cada decisión de PC; B:
  la regla de la v1.6.1 (en la compu, menú y no hoja) se aplicó solo en
  Posiciones · `mirar` saca y mide los dos monitores con cuatro OJO (ancho,
  tablero, hojas, botones de dedo), `DISENO.md` §1.12 dice qué es aprovechar
  la compu, y el revisor de UX juzga contra eso, se pregunta si existiría así
  en lichess de escritorio y barre cada regla de compu nueva por todas las
  pantallas.
- **El desempate de lo que come el motor comparaba contra la pieza movida**
  · `siguen` desde la v1.2.2, copiado a `nuevas` en la v1.7.1 (no salió) ·
  B: el ítem se encuadró sobre Bxa7, donde la pieza que cuelga no tiene
  defensa y "lo que vale la movida" es "lo que se lleva el rival"; C:
  `frases` nunca come lo que la jugada deja colgada · `cambio` expone `neto`
  y los dos desempates lo usan; prueba de unidad con Rbxd5 y Rcxd5 (cambio
  con recaptura y el motor comiendo otra torre); regla en
  `revisor-ajedrez.md`: todo desempate así se prueba con un cambio con
  recaptura. Atrapa los dos bloques y los desempates que vengan.
- **La jugada elegida fuera de vista en la planilla** · v1.7, primera
  vuelta (no salió; se le pasó también al revisor en la maqueta) · A: se miró
  la foto de la zona nueva y no si "la elegida a la vista" seguía valiendo
  con otro alto de lista o con la lista escondida · `mirar` mide en toda
  captura de monitor que lo elegido adentro de algo con scroll propio caiga
  en su caja visible, y pasa jugadas con la otra pestaña puesta antes de
  volver. Atrapa también la lista del Mes, la de Posiciones, cualquier menú
  con la opción elegida y la vuelta de toda pestaña.
- **Las pestañas de la Partida dibujadas en un solo estado** · maqueta de la
  v1.7 (no salió) · A: la variante D se fotografió con la pestaña Jugadas y
  con la de Resumen, pero se midió solo la primera; en la otra "‹ ›"
  desaparecían y la tabla quedaba cortada sin aviso · `mirar` toca todo
  `[role=tab]` a la vista en cualquier pantalla de compu, con foto y medida,
  y avisa si un botón de afuera del contenido conmutado deja de verse o si
  algo con scroll propio no entra sin fundido ni barra. Atrapa también las
  pestañas que vengan en Posiciones, Ajustes o el Mes, y cualquier lista o
  menú con scroll propio cortado, haya o no pestañas.
- **Repaso contra la causa, tanda 1 (el registro y `revisor-ux.md`)** ·
  27-nov · siete reglas escritas contra su caso pasan a principio (arriba,
  "Los casos juntos"): el rótulo de un botón → todo texto que promete algo;
  lo elegido y el foco → una marca, un significado; Posiciones en la compu →
  lo principal de cada pantalla; "999 y 1000, 1109 y 1110" → cada corte del
  `@media` y el medio del tramo; el resultado de Posiciones → todo
  desenlace; la hoja de opciones apagada → todo prendido y todo apagado; y
  se suman tres que el registro tenía solo para quien programa (el número
  sin OJO, el camino nuevo, las variantes con la de fábrica de cada ancho).
- **Posiciones sin OJO y todavía de celu** · Juan, 27-nov, el mismo día de la
  prevención de arriba · D otra vez: las cuatro medidas nuevas eran los
  síntomas de la Partida (un botón con nombre, Ajustes), no el criterio, y
  Posiciones y Armar no estaban en el recorrido de monitores (C) · `mirar`
  mide en toda pantalla de compu los botones de dedo, los de solo ícono no
  universal, el "Listo" adentro de lo que se abre y la columna vacía al lado
  del tablero, y recorre el menú de Nueva partida y Armar; `DISENO.md` §1.12
  suma las filas de botones con ícono, menús y panel, y dice que cero OJO no
  es aprobado. *Regla general*: una prevención se escribe contra la causa,
  no contra el caso que la destapó.
- **`npm test` rojo en `main` desde la v1.8.1** · 28-nov, noche · dos
  chequeos que saltaban sin error de verdad (`filaPeon` contenía el rastro
  `aPeon`; "~240 vacíos" pasaba por cita de renglón) y nadie los vio
  porque se pusheó sin correrlo (C: el paso estaba escrito, nada lo
  controlaba) · las dos pruebas buscan la forma y no el pedazo de texto
  (la palabra entera; un número pegado a un archivo o a "renglón"), lo que
  atrapa también los nombres y medidas que vengan; y el gancho pre-push,
  pendiente del permiso de Juan.
- **Las dos prevenciones de la v1.8, hechas** · 28-nov, noche ·
  `recortados()` en `tira.mjs` barre toda la página (no un id) y lo usan
  `pantallas()` contra su línea base en cada tamaño y `mirar` en los cinco;
  `abrirApp()` vigila toda la sesión el anillo de foco que deja un clic, en
  todo elemento, para `mirar` y toda maqueta. Lo primero que atrapó es de
  verdad: Esc y volver a abrir con el mouse deja el anillo en "Listo"
  (a Relleno).
- **Ajustes de la compu (v1.9), tres cosas que se escaparon** · 28-nov,
  noche · (1) la maqueta inventó una segunda marca de lo elegido (18 % sin
  peso) existiendo la de la app (D: la regla estaba y nadie la medía) →
  `mirar` junta los fondos de todo lo elegido y avisa si hay más de dos;
  (2) el menú se midió contra el tablero y no contra los vecinos de la otra
  tuerca, y pisaba la lista del inicio (F) → `mirar` mide lo que cuelga
  contra todo vecino, desde las dos tuercas, y `revisor-ux.md` lo pide para
  todo botón que abra algo; (3) las alturas de compu se miraban a 768 y la
  notebook real deja 657 (C) → `mirar` mide `sobra657` en toda pantalla de
  monitor (lo primero que atrapó: la Partida y Armar, a Relleno); y la
  proximidad (renglones de una fila tan separados como las filas, D) →
  regla en `revisor-ux.md`, y la medida queda pendiente. Se propone a Juan
  sumarla a `DISENO.md` §1.5 (no se cambia el sistema de noche).
- **La repetición con el al paso clavado** · 28-nov, noche, primera vuelta
  de la v1.9.1 · el arreglo copió la condición de Stockfish de donde carga
  un FEN (`set`) y no de donde juega (`do_move`), y se probó solo sin
  comedor y con un comedor libre, no la rama "puede comer pero es ilegal"
  (B) · regla en `revisor-ajedrez.md` (la condición del lugar donde se usa,
  comparada contra `d` después de jugar) y una prueba que compara
  `juegoPos` contra una cuenta independiente por jugadas legales en 600
  partidas al azar, que atrapa cualquier diferencia futura con el
  reglamento y no solo estas posiciones.
- **La tira de variantes de compu, ilegible otra vez** · Juan, 28-nov
  (segunda vez) · `pantallas()` componía toda captura a 412 de ancho, el
  del celu, así que una pantalla de 1366 quedaba a un tercio; y las fotos
  de cada tamaño de compu salían con el menú cerrado, porque la app lo
  cierra al cambiar la ventana (C: el andamio nació para el celu y nadie
  miró la tira que se manda) · cada captura va a su ancho CSS de verdad,
  de a dos por fila en compu, a 2x la que se manda, más una comparación
  por cada tamaño de compu (`-juntas-1366`, …), y la variante se vuelve a
  aplicar después de cada cambio de tamaño. Atrapa toda maqueta de compu
  y todo estado abierto, no solo Ajustes.
