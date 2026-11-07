# Hoja de ruta

De dónde sale lo que hace cada noche la tarea programada (`TAREA-NOCTURNA.md`).
El norte está en `NORTE.md`; esto es el orden. **Se toma siempre el primer
ítem sin tachar** que no esté marcado `⏸ espera a Juan`. Al terminar uno se
tacha acá, en el mismo commit.

**Estado: aprobada por Juan el 5-nov-2026.** La tarea nocturna puede tomar
ítems; lo que esté marcado `⏸` sigue esperando.

## Perillas

- **Revisor:** después de cada cambio.
  *(La otra opción es "una vez al final de la noche". Se pasa a esa si el
  consumo se come el tope semanal; lo dice Juan o lo propone la mañana.)*
- **Por noche: hasta dos ítems** (decisión de Juan, 6-nov). Pasa al segundo
  solo si el primero terminó **aprobado por el revisor**, con o sin
  correcciones en el medio. Si después de las dos vueltas de corrección el
  revisor sigue sin aprobar, para ahí y lo deja como duda en el resumen. Cada
  pantalla de la etapa 1 cuenta como un ítem. Nunca se deja nada a medio hacer
  sin commitear: mejor uno solo y entero que dos a medias.

---

## Etapa 1 · Identidad visual

La app se ve "medio baqueteada, medio feucha". Primero una visión global; todo
lo demás se dibuja contra ella.

- [x] Auditoría y tres direcciones dibujadas sobre la app de verdad: A Noche,
      B Papel, C Material (5-nov).
- [x] Juan eligió: **oscuro** (usa el celu así), le copa **A**, y **B "tiene su
      encanto"**: pidió una mezcla (5-nov).
- [x] Dos mezclas oscuras revisadas por el revisor: **M1 · Noche con libro**
      (la noche fría de A, títulos Georgia, tablero de madera) y **M2 · Noche
      cálida** (marrón tinta, acento ámbar). El revisor recomienda M1: el ámbar
      de M2 tiene el mismo tono que libro, imprecisión y error, y el botón
      principal quedaría del color de "error". El CSS de las dos está abajo,
      en "Las mezclas".
- [x] **Juan eligió A · Noche, tal cual** (5-nov), no las mezclas. Pidió que
      al hacerlo lo vea el revisor, que mencione lo que encuentre para
      arreglar, y que quien programa **juzgue si cada cosa aplica o no**.
- [x] Escribir el sistema de diseño en `DISENO.md` §1 a partir de la elegida:
      color, tipografía, escala de espacios, formas, botones, movimiento.
      **Con lo que el revisor pidió resolver ahí.** Lo revisó sobre M1 y M2;
      con A elegida, juzgar cada uno (los dos marcados *(M1)* no aplican a A
      tal cual, porque A no tiene tablero de madera ni serif):
      - las piezas negras comidas no se ven sobre el fondo oscuro (1,2:1):
        pastilla del color claro del tablero o contorno claro;
      - la curva es un bloque crema que encandila: la parte "blancas" sale de
        un color del sistema, no del blanco;
      - grave `#c0392b` y omisión `#d0453b` no llegan a 3:1 en oscuro: pasar a
        `#e5534b` y `#ef6a5e`, y ver cómo se distinguen entre sí;
      - *(M1)* "libro" `#b08d63` desaparece sobre la casilla oscura de
        madera: sobre el tablero, contorno o ícono, no relleno. Con el tablero
        verdoso de A, medir de nuevo;
      - bordes de los campos a 3:1 (`#6b6f75`);
      - *(M1)* serif solo en h1 y h2 de 15 px para arriba; Android no trae
        Georgia: no aplica, A usa `system-ui`;
      - la jugada elegida en la tira, con subrayado de 2 px del acento.
      **Claro y oscuro:** Juan decidió **siempre oscuro** por ahora (5-nov);
      la clara queda escrita en `DISENO.md` §1.3 para sumarla después.
      **Hecho el 5-nov**: cada punto del revisor está juzgado en §1.9.
- [x] Llevarlo al código como variables en `:root` de `index.html`, sin
      cambiar todavía nada que se vea (v0.95.2, 6-nov). Ojo: `--linea`,
      `--tenue`, `--c-grave` y `--c-omision` NO se cambiaron, porque son
      globales; van en la primera pantalla (el comentario en `:root` lo dice).
- [ ] Aplicarlo pantalla por pantalla, una versión cada una, con revisor.
      **Esto es lo de la tarea nocturna** (lo pidió Juan el 6-nov), cada
      pantalla es un ítem y vale la regla de "Por noche", arriba. En orden:
  - [x] **Entrada y listado** (v0.96, 6-nov). Es la primera, así que trae lo global: pasar
        a `color-scheme: dark` siempre (decisión de Juan, `DISENO.md` §1.3),
        el fondo de la página, y `--linea`, `--tenue`, `--c-grave` y
        `--c-omision` a sus valores nuevos. Eso se ve en toda la app: el
        revisor mira todas las pantallas, no solo esta.
  - [x] **Revisión** (v0.97 celu, v0.97.1 compu, 6-nov): tarjeta, tablero
        (casillas de A como tema por defecto), tira, curva y barras,
        cuadritos, piezas comidas. Flechas con aro oscuro (v0.99, Juan).
  - [x] **Vista del mes y sus tablas** (v0.98, 6-nov). Los `h2` pasaron a 18
        en toda la app.
  - [x] **Hoja de ajustes** (v0.103, 6-nov).
- [x] Repaso final del revisor sobre la app entera, celu y PC (v0.104, 6-nov).
- [x] Lo que dejó el repaso (v0.105, 6-nov): **[PC]** el número de la barra vertical
      (`.evalbar .num`) está a 9,5 y el mínimo es 11; a 11 "+10.00" no entra
      en la barra, así que va con un solo decimal de 10 para arriba ("+10.0").
      Y **mirar el Mes** con los campos nuevos de 44: ninguna partida de prueba
      lo muestra, hace falta una con mes.
- [x] **Lavado de cara de la fila de abajo de la vista de la jugada** (v0.106, 6-nov: la D, misma grilla de cuatro): los
      cuatro cuadritos (Mejor / Pérdida / Caída / Pensó) y los tres botones
      (Mostrar la mejor / Girar tablero / Pintar las dos). Juan, 6-nov: *"medio
      raros… no siento que sea cuestión de agrandar o ajustar algo"*. Son dos
      filas que no comparten columnas y tres botones de anchos distintos. Va
      con variantes (`TAREA-NOCTURNA.md`, paso 3); la pantalla no puede crecer
      (la fila termina en 733 de 760).
- [x] **[PC] La barra vertical lejos del tablero a 1000×700** (v0.107, 7-nov: pegada a 8 de 413 a 1109; revisor,
      v0.105; no lo causó esa versión): la barra queda en x 164–204 y el
      tablero de 360 arranca en 344, a 140 px. A 1280 y 1500 está a 8. Es el
      mismo error que la v0.86 arregló a 1280, en un ancho intermedio que
      `mirar` no mide: pegar barra y tablero como un bloque, a 8, en cualquier
      ancho, y sumarle a la línea "barra vertical:" de `mirar` el caso 1000×700.
- [x] **Lavado de cara de la cabecera del Mes** (v0.108, 7-nov: la C, el selector del mes hace de título; revisor, v0.105): dice
      "Estadísticas" y "El mes seleccionado", pero no **qué mes**: ese está en
      `#meses`, arriba en la entrada, que con el scroll ya no se ve; y la línea
      de resumen repite la cadencia del select de al lado. Pregunta a
      contestar: ¿qué tiene que decir la cabecera para saber, sin subir, de qué
      mes, de qué cadencia y de cuántas partidas son los números? Con variantes.
- [x] **Lavado de cara de la estructura: cuáles son las pantallas y cómo se
      pasa de una a otra** (v0.110, 7-nov: tres pantallas, inicio + Partida + Mes con "‹ Partidas"; revisor, v0.105). Hoy es una sola página larga con
      zonas apiladas (entrada, Mes, Partidas, Revisión, Resumen) y al Mes se
      llega scrolleando. Con práctica y lecciones en camino (`NORTE.md`), ¿qué
      es la pantalla principal y cómo se va de una a otra en el celu sin
      scrollear por las demás? Es grande: va con variantes y a la mañana como
      duda.
      El revisor (v0.108) suma: el contexto activo —usuario, mes, cadencia— no
      tiene un lugar común; ¿una barra fija que lean todas las vistas, en vez de
      que cada una lo repita? Con la v0.108 el mes se elige en dos lugares
      (la entrada y Estadísticas), sincronizados.
- [x] **Lavado de cara: dónde viven las preferencias del tablero** (v0.113, 7-nov: la A, la misma fila con ícono y texto; revisor,
      v0.106). "Siempre la mejor", "Girar" y "Rival" son ajustes de cómo se ve
      el tablero que siguen entre jugadas, y están metidos entre los datos de
      la jugada; además ya hay hoja de ajustes. ¿Van pegados al tablero
      (íconos en su borde, como chess.com), en la hoja o en esta fila?
      Juan (7-nov): la D quedó bien, y de la C le coparon los botones con ícono y texto, *"sobre
      todo en la de rotar"* (`DISENO.md` §2). Que haya variantes con ícono y
      texto; el revisor juzga si suman. Juan eligió esperar a este ítem y no
      ponerle el ícono a "Girar" antes.
- [ ] **[PC] Lavado de cara: los anchos del medio, de 700 a 1109** (revisor,
      v0.107). Todo bien medido, pero no aprovecha la pantalla: el tablero queda
      fijo en 360 en una columna de 672, con ~160 px vacíos de cada lado, y recién
      en 1110 salta al diseño de compu. A 1000×900 podría andar por 570. Pregunta:
      ¿ese rango es "un celu grande" o "una compu chica"? ¿El tablero crece con el
      alto, como desde 1110, o el corte se corre más abajo? Con variantes.
- [ ] **[PC] Lavado de cara: el Mes con el ancho de la compu** (revisor,
      v0.108). La tabla de jugadas del Mes se estira a todo el ancho (1080 a
      1280): "Total" queda a ~680 px de las etiquetas y el ojo se pierde en el
      renglón. ¿Ancho máximo de lectura, o dos tablas/secciones en columnas?
      Con variantes.
- [ ] **Lavado de cara del inicio: elegir, bajar y apretar** (revisor, v0.110).
      Con un mes real de 30 a 60 partidas, "Analizar la partida" queda debajo
      de toda la lista. Ahora que la Partida es el detalle de la lista, lo
      esperable (chess.com, Material) es tocar la fila y entrar, analizando si
      hace falta. ¿Y entonces dónde viven Modo, Mate a la vista y "Analizar el
      mes"? Va con la duda de Modo y Mate de abajo, y con la otra pregunta del
      revisor: cuando lleguen práctica y lecciones, ¿el inicio es una entrada a
      módulos o el analizador sigue siendo la pantalla principal? Con variantes.
- [ ] **[PC] Lavado de cara: el inicio con el ancho de la compu** (revisor,
      v0.110). A 1280 es una columna de cosas chicas sobre 1082 de ancho: el
      select del mes mide 140 y la tarjeta de Estadísticas estira el "›" a
      ~1000 px del título. ¿Lista y análisis lado a lado, o un ancho máximo de
      lectura? Pariente del ítem del Mes de arriba. Con variantes.
- [ ] **Lavado de cara de la cabecera de la Partida** (revisor, v0.111). Lo que
      dice qué partida es quedó partido: la apertura arriba, recostada contra
      la tuerca (se lee como si fuera de ella), y rival y resultado abajo, con
      un hueco grande en el medio. ¿Qué identifica la partida de un vistazo
      (rival, resultado, apertura) y en qué renglón vive todo junto, dejando el
      de arriba para navegar y para el estado? Con variantes.

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
módulos de versiones distintas (§2). Es candidata a v1.0, que es tuya.

- [ ] Partir y armar el paso que junta; `npm test` y `mirar` idénticos al byte.

## Etapa 3 · Que se sienta bien

- [ ] **Elegir "Todo", otro mes o mover el dial de mate MIENTRAS se analiza el
      mes** (revisor, v0.109; leído en el código, no probado): `juntarTodo`
      hace su propio `ocupado(true/false)`, así que esconde "Detener", prende
      los botones y la barra parpadea; y otro mes en el selector lanzaría un
      segundo análisis encima del primero. O se apagan `#fuente` y `#mateVista`
      mientras se trabaja, o `juntarTodo` no toca `ocupado` si ya había algo
      corriendo.

- [ ] La pieza que se mueve al pasar de jugada (abre las demás animaciones).
- [ ] El tablero sigue al dedo al deslizar.
- [ ] La tira se centra con movimiento; la tarjeta cambia de alto sin
      parpadeo; la hoja de ajustes sube.
- [ ] `prefers-reduced-motion` en todas.
- [ ] La tarjeta que se achica al probar y hace saltar el tablero 78 px (falla
      de la v0.84).
- [ ] La jugada que era la mejor y sale marcada Error (falla de la v0.95, ya
      diagnosticada en §8 del traspaso).

## Etapa 4 · Posiciones, y el puente con el profe — primer módulo nuevo

**Recomendación: este va primero.** Es el más chico de los cuatro, sirve
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

## Dudas abiertas para Juan

Lo que la tarea nocturna dejó preguntado y no se contestó todavía. Cuando Juan
contesta en una sesión, la respuesta se anota donde corresponda (`DISENO.md` si
es un gusto) y la duda se borra de acá, en el mismo commit.


- **No sé si esto te copa:** la barra verde a la izquierda de la partida elegida
  en la lista (alternativa: fondo `--elevada` sin barra).
- **No sé si esto te copa:** en la fila del usuario, "Buscar" (alto normal) y "o
  pegar un PGN" (chico) quedan algo desparejos; se resuelve al hacer la
  pasada de botones.
- Del revisor, para toda la app: los "?" de ayuda de cada sección se tocan en
  21 px, lejos de los 48 de §1.7.
- **Tablero de fábrica:** pasó a "Noche" (el verde de A). Si tenías madera
  porque era la de fábrica, ahora ves Noche; si la querés, está en ajustes.
- **No sé si esto te copa (v0.110):** la app pasó de una página larga a
  pantallas. Inicio con usuario, mes y lista; la partida y las estadísticas en
  pantalla entera con "‹ Partidas" arriba, y el gesto de volver del celu hace
  lo mismo. Se descartaron las pestañas fijas abajo o arriba porque cortaban la
  fila de botones de la jugada.
- **Modo y Mate a la vista, y tocar para analizar** (revisor, v0.110):
  (1) Modo y Mate se mudan a la hoja de la tuerca y tocar una partida la abre y
  la analiza directo, como chess.com; (2) quedan en el inicio como hoy. El
  revisor recomienda la 1.
- **No sé si esto te copa (v0.113):** los tres botones de abajo quedaron en
  su fila, con ícono y texto. La otra era Girar como ícono chiquito al borde
  del tablero, como chess.com; el revisor no la eligió porque pierde el texto
  y queda chica para el dedo. Se da vuelta fácil.
  Y la flechita de "Siempre la mejor" va verde, como la flecha que pinta en
  el tablero, y los otros dos íconos blancos; la otra es los tres blancos.
- Del revisor, para toda la app: los botones chicos (~37) todavía no tienen el
  área de toque invisible de 48 de `DISENO.md` §1.7.

---

## Las mezclas (5-nov-2026)

Para no depender de la maqueta, que no se commitea. Todas oscuras, radio de
campos 10 y de tarjetas 12, cuerpo `system-ui`.

| | fondo | superficie | texto | tenue | línea | acento | sobre acento | títulos | botón | tablero claro/oscuro |
|---|---|---|---|---|---|---|---|---|---|---|
| A · Noche | `#1d1f22` | `#272a2e` | `#e9e7e3` | `#a4a19b` | `#3a3d42` | `#7cbf5a` | `#13210c` | system-ui 22 | radio 10, `#2f3337` | `#e6e1d3` / `#7f9466` |
| M1 · Noche con libro | igual que A | | | | | | | Georgia 25 | igual que A | `#ead9bb` / `#a9825a` |
| M2 · Noche cálida | `#1f1b17` | `#2a251f` | `#efe7da` | `#ab9f8e` | `#3d362e` | `#e0a24a` | `#2a1c08` | Georgia 25 | radio 8, `#322c25` | `#ead9bb` / `#a9825a` |

Contrastes medidos por el revisor: texto/fondo 13,4 (A, M1) y 13,9 (M2);
tenue/superficie 5,6 y 5,8; texto sobre acento 7,6 y 7,4.
