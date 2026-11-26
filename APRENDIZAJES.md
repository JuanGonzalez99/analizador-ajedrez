# Aprendizajes: por qué se escapó lo que se escapó

Pedido de Juan (22-nov-2026, después de la v1.0): *"que no solamente diga
'che, hay que cambiar esto', sino también 'y por qué el que lo hizo no se dio
cuenta'. Así se evitan futuros errores del mismo estilo"*. Y que se mejoren
solos, sin que él tenga que pedirlo.

## El circuito

1. **Todo hallazgo trae su porqué.** Cualquier revisor (UX, ajedrez, código,
   rumbo) o el mono, cuando encuentra algo que **ya estaba** o que quien
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

(Ninguna por ahora.)

## Registro

Una línea por caso: qué se escapó, en qué versión se hizo y en cuál se vio,
la causa y qué se cambió. Los catorce primeros salieron del análisis del
22-nov-2026 sobre los lavados de cara de la etapa 1 (9 de 14 son A, B o F: la
zona se juzgaba en el único estado, ancho o pantalla que traía el arnés).

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
