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
- **Revisor de ajedrez:** después de cada cambio que toque lo que la app dice
  de una partida (explicación, categorías, cuadritos, tablas, análisis), y una
  pasada sobre partidas reales los domingos (Juan, 17-nov).
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
- [x] **"Siempre la mejor" se lleva mucho protagonismo** (v0.117, 7-nov: la C, el cuadrito Mejor es el interruptor y la fila se fue; Juan, v0.114). Sola
      en la fila de abajo es el botón más grande de la pantalla para algo que es
      una preferencia. ¿Más chico, otro lugar (pegado al cuadrito Mejor, que
      hace lo mismo para una jugada), o que el cuadrito mismo sea el
      interruptor? Con variantes.
- [x] **[PC] Lavado de cara: los anchos del medio, de 700 a 1109** (v0.118, 8-nov: A + B por rangos, el tablero crece de 700 a 949 y dos columnas desde 950; revisor,
      v0.107). Todo bien medido, pero no aprovecha la pantalla: el tablero queda
      fijo en 360 en una columna de 672, con ~160 px vacíos de cada lado, y recién
      en 1110 salta al diseño de compu. A 1000×900 podría andar por 570. Pregunta:
      ¿ese rango es "un celu grande" o "una compu chica"? ¿El tablero crece con el
      alto, como desde 1110, o el corte se corre más abajo? Con variantes.
- [x] **[PC] Lavado de cara: el Mes con el ancho de la compu** (v0.119, 9-nov: la C, resumen fijo a la izquierda y secciones a la derecha; revisor,
      v0.108). La tabla de jugadas del Mes se estira a todo el ancho (1080 a
      1280): "Total" queda a ~680 px de las etiquetas y el ojo se pierde en el
      renglón. ¿Ancho máximo de lectura, o dos tablas/secciones en columnas?
      Con variantes.
- [x] **Lavado de cara del inicio: elegir, bajar y apretar** (v0.120, 10-nov: la C con sus ajustes; revisor, v0.110).
      Con un mes real de 30 a 60 partidas, "Analizar la partida" queda debajo
      de toda la lista. Ahora que la Partida es el detalle de la lista, lo
      esperable (chess.com, Material) es tocar la fila y entrar, analizando si
      hace falta. ¿Y entonces dónde viven Modo, Mate a la vista y "Analizar el
      mes"? Va con la duda de Modo y Mate de abajo, y con la otra pregunta del
      revisor: cuando lleguen práctica y lecciones, ¿el inicio es una entrada a
      módulos o el analizador sigue siendo la pantalla principal? Con variantes.
      **Variantes dibujadas el 9-nov** (mes de 40 partidas, a 412×760): A tocar
      y entrar con Modo y Mate a la tuerca; B igual con Modo y Mate plegados en
      el inicio; C la entrada se pliega a "santico26 · cambiar" y el mes hace de
      título. Filas a la vista: hoy 8, A 7, B 6, C 12. **El revisor eligió C
      con ajustes**; no se construyó esa noche porque pide otra vuelta de
      dibujo antes (2 y 5) y cambia el flujo principal: mejor entero la noche
      siguiente. Lo que pidió:
      1. **Las filas entran en este lavado**: rival (16, elipsis) · "Ganada /
         Perdida / Tablas" (14, sin color) · la precisión de Juan si está
         analizada, si no "sin analizar" (12,5 tenue) · fecha "4 oct" a la
         derecha (12,5 tenue; hoy sale 9/4/2025, formato de EE.UU.). El ritmo
         sale de la fila. Un renglón, sin subir el alto. La marca de la última
         vista queda.
      2. La tarjeta "Estadísticas ›" va entre el renglón resumen y la lista, a
         todo el ancho, 12 arriba y 12 abajo. **Volver a dibujar C con
         `HAY.mes = true`** y mirarla entera antes de construir.
      3. El estado del inicio solo mientras se analiza el mes, en el lugar del
         botón ("Analizando 12 de 40 · Parar"); lo de la última partida sobra.
      4. Volver de la Partida devuelve la página a la misma altura de scroll
         (la lista ya no scrollea sola).
      5. PC: dibujar C a 1280 antes; tope de lectura de 640 para la columna
         del inicio (el lado a lado es el ítem de PC del inicio).
      Y decidió: los tres renglones chicos en uno ("40 partidas · 18 ganadas ·
      0 tablas · 22 perdidas", 12,5 tenue, 12 y 12); sin la pista "Tocá una
      partida…"; el botón dice "Analizar el mes · faltan 40" y no va si no
      falta ninguna; "cambiar" despliega la entrada en el lugar, con toque de
      48, y sin usuario guardado se arranca con la entrada abierta como hoy;
      una sola hoja de ajustes, con el grupo nuevo "El análisis" (Modo, Mate);
      tocar una partida sin analizar entra en seco a la Partida.
- [x] **[PC] Lavado de cara: el inicio con el ancho de la compu** (v0.122, 10-nov: la B, el mes fijo a la izquierda y la lista a la derecha; revisor,
      v0.110). A 1280 es una columna de cosas chicas sobre 1082 de ancho: el
      select del mes mide 140 y la tarjeta de Estadísticas estira el "›" a
      ~1000 px del título. ¿Lista y análisis lado a lado, o un ancho máximo de
      lectura? Pariente del ítem del Mes de arriba. Con variantes.
      **v0.121 (10-nov):** ya tiene un tope de lectura de 640 a la izquierda (el
      borde del Mes). Lo que queda, según el revisor: qué va en los ~540 px
      vacíos de la derecha —la Partida o las estadísticas al lado de la lista,
      o nada— y el hueco largo entre la precisión y la fecha de cada fila.
- [x] **Lavado de cara de la cabecera de la Partida** (v0.123, 10-nov: la B, barra de título con la apertura de subtítulo; y v0.123.1 [PC], el tablero recupera los 21 px; revisor, v0.111). Lo que
      dice qué partida es quedó partido: la apertura arriba, recostada contra
      la tuerca (se lee como si fuera de ella), y rival y resultado abajo, con
      un hueco grande en el medio. ¿Qué identifica la partida de un vistazo
      (rival, resultado, apertura) y en qué renglón vive todo junto, dejando el
      de arriba para navegar y para el estado? Con variantes.

- [x] **Que la Partida arranque en la posición inicial**, antes de la primera
      jugada (v0.124, 11-nov: tarjeta "Posición inicial / Juegan las blancas",
      sin galón ni "‹" para atrás; de paso se fue el salto de 2 px de la
      tarjeta; pedido de Juan, 7-nov). Hoy abre en la jugada 1 (`IDX = 0` es
      `R.filas[0]`): no existe una vista del tablero sin jugadas. Toca la tira,
      la curva, la tarjeta, las flechas y la navegación, así que va en su propia
      tanda. Surgió al discutir Girar en la tarjeta: la posición inicial sería
      el lugar natural para elegir de qué lado verla.
- [x] **[PC] Lavado de cara de la Partida en la compu, entera** (v0.125, 11-nov:
      la D, tablero a la izquierda y un panel a la derecha, sin tira; Juan, 9-nov,
      sobre la v0.118: *"horrible"*; junta dos lavados del revisor de la
      v0.118, que por la regla de "no se parcha lo que hay que rehacer" no van
      por separado). Desde 950: la curva cruza todo el ancho y **queda
      colgando** —arriba a la derecha no tiene nada, la lista termina antes, y
      abajo los cuadritos ocupan solo la izquierda—; la barra vertical es un
      bloque crema alto que pesa más que el tablero; las jugadas aparecen dos
      veces (tira y lista); y desde 1110 la columna de las piezas comidas
      queda vacía en la apertura. Pregunta: ¿cómo se arma esa pantalla para
      que se lea como un todo? ¿Hace falta la tira con la lista a la vista?
      ¿La curva va con la principal? ¿Dónde van las comidas? Con variantes
      miradas **enteras y a tamaño real** (`DISENO.md` §3, v0.118). El revisor
      suma (v0.123.1): a 1280×800 y 1500×800 la fila Mejor / Pérdida / Caída /
      Pensó asoma cortada por el borde de abajo; ¿entra en la primera pantalla o
      es un detalle que se ve bajando y no asoma? Juan eligió
      dejar la v0.118 como está hasta que llegue esto, en vez de volverla atrás.
- [x] **Lavado de cara de la entrada desplegada** (v0.126, 11-nov: la A, el PGN como enlace debajo del campo; v0.126.1 [PC] bordes; revisor, v0.120). Con
      "cambiar" (o sin usuario guardado) el renglón tiene campo de 44, "Buscar"
      de 44 y "o pegar un PGN" de 36: tres alturas y dos pesos. En la v0.120,
      con "cambiar", el PGN no aparece porque no entraba en un renglón.
      Pregunta: ¿cambiar de usuario y pegar un PGN son la misma acción? ¿El PGN
      va en el mismo renglón, en la hoja, o en un "más" del campo? Con variantes.
- [x] **El color de la barra de progreso** (11-nov: propuesta escrita en `DISENO.md` §1.10, el acento; Juan la aprobó y se aplicó en la v0.127; revisor, v0.120). Es `--texto`, casi
      blanca: mientras corre el mes es lo más luminoso de la pantalla y le gana
      al botón principal. §1.1 no dice qué color tiene el progreso; va a
      `DISENO.md` como propuesta (es sistema de diseño: no se cambia de noche
      sin Juan, se propone).
- [x] **Lavado de cara: la lista "Partidas" del Mes** (v0.128, 11-nov: la A,
      una sección más, "Partida por partida", cerrada y con las filas del inicio;
      revisor, v0.119; celu y PC). Es el título más grande de la pantalla (h2 de 18 contra 14 de las
      secciones) y está al fondo de todo: con las secciones abiertas, a ~1560
      px. Repite el texto del volver ("‹ Partidas"), así que hay dos "Partidas"
      que significan cosas distintas, y abrir una partida desde acá es
      probablemente lo que más se toca. ¿Es la salida principal del Mes (y va
      antes de las secciones, o a un toque) o un apéndice (y lleva título de
      sección)? ¿Cómo se llama para no chocar con el volver? No va a la columna
      izquierda de la compu: con 30 partidas rompe el resumen fijo. Pariente del
      lavado del inicio. Con variantes.
- [x] **[PC] La fila de la lista a 1280: ¿necesita 640?** (v0.128.1, 11-nov:
      la B, el rival con tope de 15em y el resultado pegado; sigue en 640; revisor, v0.122).
      Con las columnas de la v0.122, entre el nombre y "Ganada" quedan ~390 px
      vacíos y el resultado flota a mitad de la tarjeta. No frenó (es tabla,
      chess.com hace lo mismo). Pregunta: ¿con ~520 la fila se lee más junta, y
      el sobrante va a la columna izquierda? Con variantes, si se reabre el
      inicio de la compu.
      **Desde la v0.128 vale también para la lista del Mes** ("Partida por
      partida"), que usa la misma fila: arreglando una se arreglan las dos.
- [x] **Lavado de cara: la precisión en la fila de la lista** (v0.129, 12-nov: la D, "prec. 89", y el "—" del Mes se fue; revisor; Juan, 11-nov,
      sobre la v0.128; celu y PC, vale para el inicio y el Mes). El número
      suelto después del resultado ("Ganada 89") no se entiende como
      precisión. Que se entienda sin invadir la pantalla. Variantes a dibujar:
      la pastilla neutra como el archivo de chess.com, "89%", una palabra
      corta ("prec. 89") y un ícono chico delante; a 386 de ancho, que al
      rival no le falte lugar. Con variantes.

- [x] **Lavado de cara: el idioma de las aperturas** (v0.130, 13-nov: la B, familia y variante en castellano, y si no entra solo la familia, nunca "…"; revisor, v0.123; celu y
      PC). Desde la v0.123 la apertura es el subtítulo de cada partida, y los
      nombres de `aperturas.json` están en inglés ("Italian Game: Giuoco Piano,
      Therkatz-Herzog Variation") en una app que habla en castellano. ¿Nombres
      en castellano como chess.com en español (Giuoco Piano, Defensa
      Siciliana), y hasta dónde: familia y variante, o completo?
      **Juan (10-nov):** no sabe si le copa la apertura de subtítulo, *"sobre
      todo cuando el nombre es muy largo"* (hoy se corta con "…"). Que las
      variantes prueben también el largo: solo la familia, un nombre corto, o
      la apertura en otro lugar.

- [x] **Lavado de cara: la fila de datos cuando no hay jugada** (v0.131, 14-nov: la C sin caja, Mejor y una leyenda suelta; Pensó sin reloj dice "sin reloj"; revisor,
      v0.124; celu). En la posición inicial Pérdida, Caída y Pensó dicen "—" y
      solo Mejor dice algo: tres cuadritos vacíos con protagonismo. ¿Qué
      muestra la fila cuando no hay jugada que juzgar: los cuatro en "—", solo
      Mejor, o nada? De paso: en la última jugada de la partida de prueba
      Pensó dice "·" y no "—" (puede ser que esa partida no traiga relojes).
      Con variantes.

- [x] **[PC] Lavado de cara: dónde van las piezas comidas** (v0.132, 14-nov: la B, arriba y abajo del tablero como chess.com, Girar de 32 abajo a la derecha; revisor, v0.125).
      Con la partida recién empezada la columna de las comidas está vacía y
      queda una calle de ~120 px entre el tablero y el panel, con Girar solo en
      el medio. ¿Reservan su columna desde la jugada 1, o viven en otro lado
      —arriba y abajo del tablero, junto a cada jugador, como chess.com—? Con
      variantes.
- [x] **[PC] La Partida en ventanas angostas y altas** (v0.135, 15-nov: la E del revisor, una quinta: solo la curva baja debajo del tablero cuando sobra alto, y la lista se estira; revisor, v0.125). De
      1000 a 1100 de ancho con 900 de alto el tablero lo manda el ancho y
      quedan ~390 px vacíos abajo. **Remedido en la v0.132** (las casillas
      pasaron de ~437 a 496 sin la columna de las comidas): 258 px a
      1000×900 y 194 a 1100×900, con la barra vertical. Mejoró, pero sigue. ¿Otra disposición en ese rango (curva o
      cuadritos debajo del tablero)? Con variantes.
- [x] **[PC] La barra horizontal no se alinea con el tablero** (v0.136, 15-nov: de la columna a al borde del panel, y el título de la cabecera con ellas; revisor,
      v0.132; leve, ya estaba). A 1280 va de x 113 a 1167 y las casillas
      arrancan en 139 (los números de fila en ~127). ¿La barra mide el ancho de
      la página o el del tablero? Con la vertical, la de fábrica, no pasa.
- [x] **[PC] El Resumen al ancho del grupo** (v0.137, 15-nov: de la columna a al borde del panel, como la barra y la curva, y adentro la tabla traspuesta —una fila por jugador—, la D entre cuatro del lavado de cara que pidió el revisor al ver el marco; revisor, v0.125; leve). Debajo
      de la Partida el Resumen mide 1082 centrado y el grupo de arriba otra
      cosa: dos cajas centradas de anchos distintos (a 1600, 27 px corrido).
- [x] **Lavado de cara: la cabecera del inicio con "cambiar"** (v0.138, 15-nov: la B entre cuatro — la cabecera se queda, "cambiar" pasa a "cancelar" y el campo va debajo; revisor,
      v0.126; celu). Con la entrada abierta por "cambiar" no hay cómo volver
      sin buscar (Nielsen 3: falta un "cancelar"), y la cabecera es otra que la
      de la primera vez: el título se va y la tuerca se mete en la fila del
      campo. ¿El renglón del enlace junta las salidas ("o pegar un PGN ·
      cancelar")? ¿La tuerca vive siempre en el mismo lugar del inicio, con
      usuario o sin él? Con variantes.
- [x] **[PC] Revisión de todo lo que responde al mouse y al teclado** (v0.144, 15-nov: seis fallas arregladas — la previa que aparecía sola, la pieza pegada al mouse, el texto pintado de azul, Alt+← comido, las flechas y la rueda con la variante abierta, y el arrastre de la tira; Juan,
      15-nov, después de la v0.139: *"quizás valga la pena una revisión a
      fondo"*). La rueda y las tres mejores estaban mal desde la v0.82 y la
      v0.89 y pasaban el arnés: se midieron ahí y nunca con un mouse de verdad.
      Repasar con esa sospecha: rueda (tablero y tira), previa, arrastre de
      piezas, marcas con clic derecho, `n`/`p` y flechas, los `:hover`, y qué
      pasa con cada uno con la variante abierta.
- [x] **[PC] La tuerca sola arriba a la derecha del inicio** (v0.145, 15-nov: la A entre cuatro — la cabecera entra a la columna del mes, la tuerca termina en el borde del select y la lista sube; revisor, v0.126).
      A 1280 la fila del campo termina en 399 y la tuerca queda sola en 1071,
      sobre la lista. ¿Qué ocupa el ancho de arriba, o la tuerca va en una
      cabecera propia? Pariente del lavado de arriba.
- [x] **Lavado de cara: el Mes como pila de siete secciones iguales**
      (v0.146, 15-nov: la A entre cinco con un ajuste del revisor — arriba lo de partidas, "Cómo terminaron" abierta y "Partida por partida" segunda; abajo, bajo el rótulo "Jugada por jugada" (v0.147, Juan; nació como "Las jugadas malas"), las cinco de consulta; la lista sigue al ritmo; revisor, v0.128; celu). Todas pesan lo mismo, de "Cómo terminaron" a
      "Partida por partida", y la única abierta es la tabla de categorías.
      ¿Cuáles se miran cada vez que uno entra al Mes y cuáles son de consulta?
      Las primeras, a la vista o arriba; las otras, juntas y más abajo. De
      paso: "Partida por partida" lista todas las partidas del mes cargado, de
      cualquier ritmo, mientras las secciones de alrededor siguen al selector
      de ritmo y al de fuente (la ayuda lo dice; ¿la lista debería seguir el
      mismo filtro?). Con variantes.
- [x] **Lavado de cara: qué dice la tarjeta en una jugada de libro** (v0.148, 16-nov: la B entre cuatro — en libro no habla el motor: una frase de lo que se ve en el tablero, o la frase fija; pasaba con partidas de verdad; revisor,
      v0.130; celu y PC). En 3. Bc4, jugada de libro, la tarjeta dice "La mejor
      era Nd4. El rival tiene Rb8.": un "la mejor era" contradice a la
      categoría. Puede ser cosa del motor de mentira de la partida de prueba;
      primero ver si pasa con una partida de verdad, y si pasa, qué tiene que
      decir la tarjeta en el libro. Con variantes si pide forma.
- [x] **[PC] Lavado de cara: la fila de la lista como dos islas** (v0.148.1, 16-nov: la C entre cuatro — rival, resultado y prec. en columnas pegadas, la fecha sola al borde; revisor,
      v0.129; inicio y Mes). A 1280, entre el resultado (columna 2) y la
      precisión ("prec. 89", pegada a la fecha) quedan ~200 px y la fila se lee
      como dos islas. ¿A ≥700 la lista necesita cinco columnas repartidas en
      640, o va el renglón del celu (rival · resultado · prec. · fecha)? La
      v0.128.1 ya achicó el hueco una vez: esto pide forma, no otro número. Con
      variantes.
- [x] **Lavado de cara: el alto de la tarjeta del veredicto** (v0.149, 17-nov: la B entre tres — la frase a todo el ancho, el símbolo en la línea del título, y lugar reservado para dos renglones, tres con "larga"; revisor,
      v0.148; celu, y PC en menor medida). A 386, el ancho de Juan, la tarjeta
      pasa de 61 a 80 y el tablero baja 19 px cada vez que la frase no entra en
      un renglón: en libro, 4 jugadas de 27 (eran 16 antes de la v0.148), con
      una palabra viuda en el segundo renglón; fuera del libro, con cualquier
      par de frases (14… Kxh7 también a 412). En PC el tablero no se mueve
      pero el panel baja 19. El ítem de la etapa 3 lo planteaba como animación
      ("cambia de alto sin parpadeo") y la pregunta es otra: **¿cómo dice la
      tarjeta una o dos frases sin que cambie la posición del tablero?** Con
      variantes, a 386 y con la frase más larga, sin perder "todo lo de la
      jugada sin scrollear". **Juan (16-nov): *"es medio molesto"*; por eso va primero.**
- [x] **[PC] Lavado de cara: qué más merece estar a la vista en la compu
      cuando sobra alto** (v0.150, 17-nov: la D entre cuatro con tres ajustes — la caja de las tres mejores baja debajo de la curva si entra entera, alto fijo, al pie de "‹ ›"; revisor, v0.135; leve). Con la curva abajo siguen
      sobrando ~190 px a 1000×900, con las dos columnas cerradas a la misma
      altura (no se ve armada con pedazos). Si se quiere usar ese alto, la
      pregunta es qué otra cosa de la partida va a la vista —¿las tres
      mejores desplegadas en vez del botón?—, no estirar lo que ya está.

- [x] **La tarjeta de la variante cambia de alto y hace saltar el tablero** (v0.164, 17-nov: mide 101 en todos los estados, como la del veredicto de la v0.149; queda un salto de 21 px al entrar y al salir, duda para Juan)
      (Juan, 17-nov, probando "la lista abajo": *"la tarjeta cuando se
      prueban jugadas no se revisaron, y tienen los saltos de tablero con el
      cambio de tamaño"*). Es el ítem de la etapa 3 ("La tarjeta que se achica
      al probar…", con la nota del revisor de la v0.152), subido acá porque lo
      vio usando la app. La tarjeta del veredicto ya reserva su alto desde la
      v0.149; la de la variante ("Probando…", "pierde 5.46 · en la partida
      Qh5+ pierde 4.66", "No se pudo evaluar") no. Mirar las dos formas que
      quedan ("sin la lista" y "la lista abajo").
- [ ] **Lavado de cara funcional: probar jugadas** (Juan, 18-nov, después
      de probar la v0.164: *"creo que merece un lavado de cara funcional"*).
      Lo que dijo: **al probar jugadas la barra de evaluación no se mueve**,
      *"capaz estaría bueno"*; y *"otras cosas que ahora me estoy olvidando"*.
      Ojo: el revisor de la v0.164 anotó que la barra sí se actualiza con la
      variante, así que primero medir cuál no se mueve (la horizontal de
      arriba, la vertical, el número) y en qué momento (pensando, con
      resultado, al recorrer la variante). Después, recorrer el camino entero
      de probar —tocar, jugar, encadenar, recorrer con ‹ › y la tira, volver—
      como alguien que juega, con el revisor de UX y el de ajedrez (lo que
      dice la tarjeta en la variante), y armar la lista de lo que falta o
      molesta. Lo que Juan recuerde se suma acá. Con variantes donde pida
      forma nueva.
      **Hecho**: la barra sigue a la variante (v0.165), cuadritos y "la
      mejor era" de la probada (v0.166), "…" pensando, el arranque en un
      renglón y dos bordes (v0.167). **Lo que trajo el recorrido (18-nov) y
      falta**, chico primero:
      - [ ] **Cinco arreglos chicos de la variante, en UNA versión** (Juan,
            18-nov: *"son muy chicas, no se pueden unificar?"*; cuenta como un
            ítem de la noche, con los dos revisores al final):
            1. Jugar la jugada que ya está avanza en vez de abrir o cortar:
               la de la partida sin variante avanza la partida; la siguiente
               de la línea, adentro de la variante, avanza sin cortar ni
               llamar al motor (hoy compara "bxa8=Q pierde 0.00 · en la
               partida bxa8=Q").
            2. El "atrás" de Android cierra primero la variante (hoy sale de
               la Partida entera) y n/p no hacen nada con una abierta
               (saltaban de jugada y la tiraban; las flechas ya se
               arreglaron en la v0.144).
            3. Con "la lista abajo", el símbolo de cada probada en el color
               de su categoría y la jugada en `--inventada` (hoy todo
               violeta).
            4. La jugada que da mate dice "Jaque mate." y el ahogado "Ahoga
               al rey: tablas." (también en la tarjeta de la partida;
               `partesDeLaExplicacion`). Revisor de ajedrez.
            5. Probar la misma jugada de la partida dice "· es la de la
               partida" en vez de comparar dos números que con Stockfish
               real pueden no coincidir (con el 1, solo queda el caso de
               "probar otra en su lugar").
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
      - [ ] **Arrastrar piezas con el dedo** (Juan, 18-nov: *"uhh esa estaría
            buena"*). Hoy solo tocar y tocar. Choca con deslizar sobre el
            tablero para pasar jugadas: si el gesto arranca sobre una pieza
            que puede mover, arrastra; si no, desliza (propuesta del revisor).
            Tocar y tocar sigue andando. Va después de lo chico.
      - [ ] [PC] La variante adentro de la planilla, debajo de la jugada de
            donde sale, con sangría (como lichess). Con variantes.
      - Propuestas del revisor de ajedrez para más adelante: qué amenaza el
        rival en la posición de la variante; la evaluación como número en la
        tarjeta de la variante con el modo "en la tarjeta"; la línea corta del
        motor; resumen de la variante contra la partida; aviso de confianza
        cuando la variante se alarga.
- [ ] **Pantalla propia de "Acerca de"** (Juan, 15-nov, al mudar los créditos
      a Ajustes en la v0.143: la pensaba así, "más a futuro"). Hoy la
      atribución de las piezas vive al pie de la hoja de Ajustes y alcanza.
      Se hace cuando haya qué poner al lado: la ayuda, las licencias de lo
      que se sume (los puzzles de lichess de la etapa 5), el link del profe.
      Antes de eso es una pantalla para tres líneas que no se leen nunca.
- [x] **[PC] Lavado de cara: ¿la barra horizontal es de la cabecera o del
      tablero?** (v0.151, 17-nov: la C entre cuatro con ajuste — la barra arriba del panel, en el renglón de las comidas; casillas y panel arrancan juntos; revisor, v0.136; leve, venía de antes). Queda a 12 px del
      subtítulo y a 36 de las casillas y del panel: se agrupa con el título
      pero habla del tablero, y ahora que comparte bordes con lo de abajo se
      nota más. Mover solo ese valor no alcanza: el panel arranca con la
      primera fila de casillas y se movería todo. De paso: a 1000 de ancho el
      panel arranca 4 px arriba de las casillas (104 contra 108). Con variantes.
- [x] **Lavado de cara: la "variante vacía"** (v0.152, 17-nov: la B entre cuatro — tocar una pieza solo la marca, la variante arranca al jugar; revisor, v0.144; celu y PC).
      Un toque suelto en el tablero ya es un modo: tarjeta "Probá otra
      jugada" o "Elegiste a8", "‹ ›" grisados, y hay que tocar "Volver" para
      seguir pasando jugadas. ¿Elegir una pieza tiene que abrir un modo, o la
      variante empieza recién al jugar la primera jugada? Con variantes.
- [x] **[PC] Lavado de cara: el teclado fuera de la Partida** (v0.153, 17-nov: la app entera — Tab llega a las filas, no se escapa de Ajustes, ↑ ↓ Inicio Fin en la lista; revisor,
      v0.144). En el inicio Tab no llega a las filas de partidas; con Ajustes
      abierto se escapa de la hoja a los botones de atrás; la lista de jugadas
      no es enfocable, y ↑/↓ e Inicio/Fin no hacen nada. ¿La app entera se
      puede usar sin mouse, o el teclado es solo para pasar jugadas?
- [x] **[PC] Lavado de cara: el inicio corrido a la izquierda** (v0.154, 17-nov: la C entre cuatro — 400 + 640, los mismos bordes que el Mes; revisor,
      v0.145; ya estaba). A 1280 el bloque va de 99 a 1071: 99 de aire a la
      izquierda y 209 a la derecha (209 y 319 a 1500), y la Partida llega
      hasta 1167. Se nota más desde que la tuerca no marca el borde derecho.
      ¿La lista crece hasta el borde de la página, o el bloque se centra?
      Centrarlo mueve el borde izquierdo respecto del Mes, que es lo que se
      descartó en la v0.122. Con variantes.
- [x] **[PC] Lavado de cara: el hover de los títulos de sección del Mes** (v0.155, 17-nov: la B entre cuatro — sin banda, se aclara la flecha)
      (revisor, v0.146; leve, ya estaba). La banda va de borde a borde de la
      columna y el texto arranca al ras de su borde izquierdo, sin aire.
      ¿El hover necesita banda, o alcanza con el cursor y la flecha?
- [x] **Lavado de cara: que cada sección cerrada del Mes adelante su dato** (v0.156, 17-nov: la A entre tres — un renglón gris debajo del título, solo cerrada; nombra una fila solo si se aparta de verdad)
      (la C de las variantes de la v0.146; revisor: sirve, pero es otro ítem).
      Un titular por tabla bajo el título ("viste 3 de 4"), para leer la pila
      sin abrirla. Hay que definir qué dice cada una. Con variantes.
- [x] **Lavado de cara: el nombre de la apertura "hasta acá"** (v0.159, 17-nov: en la tarjeta de las jugadas de libro; "cuando cambia" de fábrica y "en cada jugada" en Ajustes, elegido con Juan) (revisor,
      v0.148; celu y PC). Ver que con 3. Bc4 ya es la Italiana y con 3… Bc5 el
      Giuoco Piano enseña, pero el dato no tiene dónde vivir: en la tarjeta no
      entra (un renglón, ~45 caracteres a 386) y en la cabecera ya está el
      nombre final. ¿Hace falta ver cómo se afina jugada a jugada, o alcanza el
      final? Si hace falta, ¿dónde, sin tocar el alto de la tarjeta ni la
      cabecera? ¿Qué se muestra en las posiciones sin nombre y con "Variante
      normal" (2… Nc6)? Con variantes.
- [ ] **Lavado de cara: los cuadritos en una jugada de libro** (revisor,
      v0.148; celu y PC). La tarjeta dice "5. d4 — Libro" y ya no habla el
      motor, pero la fila de abajo sigue diciendo Mejor "Bb5 ↗", Pérdida
      "1.20", Caída "11.0 pt": la misma contradicción, un piso más abajo.
      ¿Qué contestan los cuatro cuadritos cuando la jugada es de libro? Es
      duda para Juan (abajo): dato crudo que a veces interesa, o se callan.
- [ ] **[PC] Lavado de cara: cómo termina la lista de jugadas cuando no
      entra entera** (revisor, v0.149; ya estaba). A 1600×900 la lista se
      corta a mitad de una fila contra el borde de abajo (asoma la 14). ¿Se
      corta en una fila completa, o sigue con un fundido o una sombra que diga
      "hay más"? Con variantes.
- [ ] **[PC] Lavado de cara: la caja vacía de las tres mejores debajo de la
      curva** (Juan, 17-nov, sobre la v0.150; revisor, v0.151). Sin pedirlas
      son ~115 px de tarjeta con un rótulo y un botón suelto: se lee como un
      hueco. **No se calculan solas** (Juan: *"dudo que uno quiera ver las 3
      mejores de cada movimiento"*; lo tentaba solo el cuadro vacío). La
      pregunta es la forma: ¿las tres filas marcadas en tenue en vez del
      botón suelto (lo que propuso el revisor)? ¿una caja que solo reserva
      el alto, sin borde? ¿otra cosa de la jugada mientras no se piden?
      Sin que la lista ni "‹ ›" salten. Con variantes.
- [x] **Lavado de cara: las tablas de "Jugada por jugada" solo cuentan
      malas** (v0.157, 17-nov: la columna "La mejor" al lado de Malas, el renglón dice primero lo bueno, Mecanismos al final; propuesta aprobada por Juan) (Juan, 17-nov, sobre la v0.156: *"me hace ruido que los textos
      estén muy centrados en 'jugadas malas'… arrastrado de cómo se armaron
      las tablas"*). Franja, Capturas, Mecanismos, Pieza y Tramo miden todas
      "qué parte sale mala" (pierde 3+), y el renglón de la v0.156 lo hereda.
      Va contra `NORTE.md` ("no gira alrededor de los errores"). Es cambiar
      qué pregunta contesta cada tabla (grande): ¿qué cuentan también —la
      precisión por tramo o por pieza, las veces que jugaste la mejor, dónde
      te va mejor—, sin perder lo que §5 exige (margen, contraste, no
      afirmar lo no medido)? Primero proponer qué mide cada una; después la
      forma. Con variantes.
- [x] **Lavado de cara: cómo se escribe una tasa en toda la app** (v0.158, 17-nov: entero con espacio duro, "25 %"; "<1 %" y ">99 %") (revisor,
      v0.157; ya estaba; celu y PC). El renglón de la sección dice "48 %"
      (entero, con espacio) y la tabla, para la misma cifra, "48.0%". Y el
      decimal promete una precisión que el rango desmiente: "100.0%" sobre 3
      jugadas, con rango 21–100. ¿Una sola forma, y cuándo vale el decimal?
- [x] **Lavado de cara: los diales de "elegilo usando la app" en Ajustes** (v0.160, 17-nov: repasada con Juan — se fueron Marcas de la curva y Las jugadas de al lado, Al probar queda con dos formas)
      (revisor, v0.159; celu). En La explicación, dos de tres filas son
      diales temporales ("Cuánto habla", marcado "SE VA cuando esté
      elegida", y "Nombre de la apertura"), más "Al probar una jugada" en la
      otra sección. Se ven igual que los ajustes de verdad y la hoja ya pide
      scroll. ¿Dónde viven para no confundirse con lo permanente, y cuándo
      se retiran?
- [ ] **Lavado de cara: los grupos de la hoja de Ajustes** (revisor, v0.160;
      celu y PC). "El tablero" tiene un solo renglón, "Cómo se ve la partida"
      dos, y "La explicación" queda vacía cuando se elijan los diales a prueba.
      Un título con raya para un renglón pesa más de lo que vale. ¿Grupos, una
      lista corta sin títulos, o dos grupos como mucho? Cuando se vayan los
      diales.
- [ ] **Lavado de cara: cómo empieza y termina la tira de la variante en "la
      lista abajo"** (revisor, v0.160; celu). Junto a "‹" asoma un pedazo
      cortado de la jugada anterior y la elegida queda pegada a "›". Ya
      estaba, pero ahora es la forma que Juan usa.
- [ ] **Con algunas jugadas que dan jaque, la tarjeta no ve nada** (revisor de
      ajedrez, v0.163; ya estaba). En `7k/8/4qr2/8/3Bn3/8/8/4Q1K1 w`, d4f6
      (Bxf6+), `observarJugada` devuelve todo vacío: ni la clavada nueva del
      caballo de e4. La misma jugada sin jaque (rey en g8) sí la detecta, y
      con Nc7+ anda. Buscar la causa.
- [ ] **"Pierde material en el cambio" como mecanismo** (revisor de ajedrez,
      v0.163). Con Qe1 Rxe1 Kxe1 (`4k3/8/8/8/4r3/8/5K2/Q7 w`, a1e1) la dama no
      queda "comible" porque hay recaptura, así que la tarjeta de un grave
      dice "Toma la columna abierta e." y no que se cambia dama por torre.
      Hace falta decir lo que se pierde cuando `quedaComible` da falso por la
      recaptura y aun así el cambio pierde.
- [ ] **El orden de las frases fuertes** (revisor de ajedrez, v0.163; leve).
      En `4k3/3q4/8/8/P7/8/8/4KB2 w` f1b5 sale primero "Salva tu peón de a4"
      y después "Clava la dama de d7 contra el rey", que gana la dama. La que
      gana más va primero.
- [ ] **[PC] El orden de Tab en la Partida** (revisor, v0.153). Salta por
      la pantalla: volver (arriba) → tuerca → Girar (abajo de todo) → "Ver
      las tres mejores" → lista → "›" → cuadrito Mejor (arriba). Tendría que
      seguir el de lectura: volver, tuerca, Mejor, las tres mejores, lista,
      "‹ ›", Girar. Sin `tabindex` positivos; si hay que mover nodos que
      comparte el celu, cuidar la comparación byte a byte.
- [ ] **[PC] El cuadrito "Mejor" corta "la juga…"** (revisor, v0.150; leve,
      ya estaba). Cuando la jugada fue la mejor, a 1000 de ancho el valor del
      cuadrito sale con puntos suspensivos. Una palabra cortada no se lee:
      un texto más corto ("esta") o que entre entero. Arreglo chico, sin
      variantes.

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
- [ ] La tira se centra con movimiento; la hoja de ajustes sube. (Lo de la
      tarjeta que cambia de alto pasó a la etapa 1 como lavado de cara, v0.148:
      no es animarlo, es que el tablero no se mueva.)
- [ ] `prefers-reduced-motion` en todas.
- [x] (v0.164, ver arriba) La tarjeta que se achica al probar y hace saltar el tablero 78 px (falla
      de la v0.84). **Revisor, v0.152:** desde que tocar solo marca, es lo
      único que mueve el tablero en todo el camino de probar: al jugar la
      primera, ~40 px a 412 (la tarjeta violeta con "pierde 5.46 · en la
      partida Qh5+ pierde 4.66" ocupa dos renglones más). ¿La tarjeta de la
      variante puede reservar el mismo alto que la del veredicto (v0.149)?
      Pide subirlo de prioridad.
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

## Revisión de las evaluaciones (14 y 15-nov-2026)

Lo que salió de la revisión de los veredictos y de las frases de la tarjeta
(detalle y números en `TRASPASO.md` §8, "La revisión de las evaluaciones").
El jaque en los detectores y la nueva definición de "a salvo" ya están hechos
(v0.133). Lo que queda:

- [x] ~~Las frases chicas que no mueven números: el ataque doble que nombra
      dos veces la misma pieza, "Ataca… con un peón" después de coronar, y el
      eco "lo cobraba / Había X".~~ Hecho en la v0.133.1.
- [ ] ⏸ espera a Juan · Las engañosas: "Toma la columna abierta" cuando la
      torre ya estaba ahí, "Tu X queda comible" cuando acaba de comer algo que
      vale lo mismo o más, y una frase de mérito en las tarjetas de error.
- [x] ~~Los que mueven las tablas: H1, H2 y H4.~~ Hechos en la v0.134.
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

## Dudas abiertas para Juan

Lo que la tarea nocturna dejó preguntado y no se contestó todavía. Cuando Juan
contesta en una sesión, la respuesta se anota donde corresponda (`DISENO.md` si
es un gusto) y la duda se borra de acá, en el mismo commit.

- **No sé si esto te copa (v0.156/v0.157):** el renglón gris de cada sección
  cerrada del Mes; desde la v0.157 dice primero lo que sale bien ("Con el
  caballo: 48 % la mejor, contra tu 35 %"). La otra forma era el dato corto a
  la derecha, sin alargar la página.
- **A prueba (v0.159):** el nombre de la apertura en la tarjeta. Juan no se
  decidió entre "cuando cambia" (de fábrica) y "en cada jugada"; quedaron las
  dos en Ajustes → La explicación → "Nombre de la apertura". Cuando elija,
  se saca el ajuste y queda una.
- **A prueba (v0.155, compu):** el hover de los títulos del Mes, solo la
  flecha. Juan: *"es re sutil… dejala así"*; si al usarlo no le gusta, la C
  (banda suave con aire y puntas redondeadas).
- **A prueba (v0.149):** Juan duda entre la B que quedó (el símbolo en la
  línea del título y la frase a todo el ancho) y la A (el símbolo en su
  columna, como antes, con el mismo lugar para dos renglones). Dijo *"por
  ahora dejémoslo así, lo voy usando y vemos qué onda"* (17-nov). No se toca
  hasta que diga; si elige la A, es volver la tarjeta a flex y dejar la
  reserva de renglones (§7 del traspaso, v0.149).
- **No sé si esto te copa (v0.148, del revisor):** en una jugada de libro los
  cuadritos de abajo siguen mostrando la mejor del motor y la pérdida. O se
  dejan, porque es dato crudo y a veces interesa ver que el motor prefiere
  otra; o en libro se callan igual que la tarjeta.
- **No sé si esto te copa (v0.146):** "Partida por partida" subió de última a
  segunda, debajo de "Cómo terminaron", y ahora muestra solo las partidas del
  ritmo elegido arriba (antes, todas las del mes). La otra: al fondo, con su
  rótulo "LAS PARTIDAS".
- **No sé si esto te copa (v0.144, compu):** con una variante abierta (probaste
  una jugada), las flechas del teclado y la rueda sobre el tablero ahora la
  recorren, igual que los botones "‹ ›", y Escape sale. Antes las flechas la
  cerraban sin avisar y pasaban de jugada en la partida, y la rueda no hacía
  nada. La otra: que flechas y rueda sigan siendo siempre "la partida".
- **No sé si esto te copa (v0.138):** en el inicio, "cambiar" ahora deja la
  cabecera donde está, pasa a decir "cancelar" y el campo aparece debajo.
  Antes el renglón con tu nombre se iba y la tuerca saltaba a la fila del
  campo, y no había cómo salir sin buscar. Ganó la B de cuatro (las otras:
  "cancelar" abajo junto a "o pegar un PGN", un "‹" al lado del campo, o con
  el título de la primera vez arriba).
- **No sé si esto te copa (v0.137, compu):** el Resumen debajo de la Partida
  es ahora una tabla dada vuelta: una fila por jugador (nombre, precisión,
  mediana y los diez recuentos al lado) y las categorías de cabecera. En el
  celu sigue como siempre. Ganó la D de cuatro.
- **No sé si esto te copa (v0.130):** la apertura sigue de subtítulo de la
  Partida, ahora en castellano y sin cortarse nunca ("Apertura italiana: Giuoco
  Piano"; si no entra, "Apertura italiana"). La otra es la barra de un renglón
  y la apertura solo en el Resumen. Tira de las cuatro variantes en el resumen
  del 13-nov.
- **Pendiente de Juan, para cuando quiera (9-nov):** revisar lo que cambió en
  el criterio del revisor el domingo 8-nov (commit `1af4576`, "principios en
  vez de casos"). No lo quiso ver todavía; hasta entonces queda aplicado.


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
- **No sé si esto te copa (v0.120):** Modo y Mate a la vista viven ahora solo
  en la hoja de ajustes, al fondo (hay que scrollear la hoja para verlos). Si
  los cambiás seguido, se suben al principio de la hoja; si los ponés una vez,
  quedan bien ahí.
- **No sé si esto te copa (v0.117):** el cuadrito Mejor ahora prende la flecha
  en todas las jugadas hasta que lo volvés a tocar; ya no existe el vistazo de
  una sola jugada (la mejor igual está escrita en el cuadrito y en el
  veredicto), y "Siempre la mejor" se fue de abajo. Si extrañás el vistazo, la
  otra es la D: el cuadrito vuelve a ser vistazo y "siempre" pasa a la tuerca.
- **Pendiente de Juan, para revisar (10-nov):** la apertura de subtítulo en
  la cabecera de la Partida (v0.123): *"no sé si me copa, sobre todo cuando el
  nombre es muy largo"*. Por ahora queda así; se mira junto con el lavado del
  idioma de las aperturas (etapa 1).
- **No sé si esto te copa (v0.123):** arriba de la partida ya no dice "‹
  Partidas": dice "‹ MewoneX 601 · Ganada" y debajo, chiquita, la apertura. La
  flecha y el gesto de atrás te siguen llevando a la lista. La otra: que vuelva
  "Partidas" al lado de la flecha, con el título en un segundo renglón (la
  tarjeta y el tablero bajan ~20).
- **No sé si esto te copa (v0.122, compu):** el inicio en la compu pasa a
  tener el mes a la izquierda (el mes, el botón de analizar, Estadísticas) y la
  lista a la derecha, como ya está el Mes. La otra era todo en una columna
  centrada.
- **No sé si esto te copa (v0.124):** la partida abre en la posición inicial,
  con la tarjeta "Posición inicial · Juegan las blancas." y la mejor jugada en
  el cuadrito Mejor. La otra: que siga abriendo en la jugada 1 y la inicial
  quede a un toque de "‹".
- Del revisor (v0.124), para el lavado de las preferencias del tablero: Girar
  al costado mide 27×44 a 386 de ancho, lejos de los 48 de toque, y ahora se ve
  en la primera pantalla de cada partida.
- **No sé si esto te copa (v0.125, compu):** la partida en la compu es ahora
  el tablero grande a la izquierda (680 en una pantalla de 800 de alto, era
  512) y un panel a la derecha con todo lo de la jugada: tarjeta, cuadritos,
  curva, las mejores y la lista, con "‹ ›" abajo de la lista. **La tira de
  jugadas no está en la compu** (la lista ya está a la vista) y "sin la
  lista" se fue de los ajustes. La otra: dejar la tira abajo del tablero (la A
  de las variantes; el tablero queda en 632).
- **No sé si esto te copa (v0.126):** "o pegar un PGN" es ahora un enlace
  verde debajo del campo, y solo aparece con la entrada abierta (la primera vez
  o después de "cambiar"). La otra: sumarlo al renglón plegado, "Santico26 ·
  cambiar · pegar PGN", para tenerlo a un toque.
- **No sé si esto te copa (v0.128):** la lista de partidas del fondo del Mes
  es ahora una sección más, "Partida por partida", cerrada, con las mismas
  filas del inicio. ¿Abrís partidas desde el Mes, o siempre desde el inicio?
  Si nunca desde el Mes, la otra es sacarla del todo (para abrir una partida
  volvés con "‹ Partidas", que es la misma lista) y pasar la marca de
  "asistida" a la fila del inicio. No se sacó de noche porque es borrar algo
  que capaz usás.
- **Girar al costado del tablero (v0.114, idea de Juan):** si a los días no lo
  usás, se saca.
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
