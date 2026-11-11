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
- [ ] **[PC] Lavado de cara de la Partida en la compu, entera** (Juan, 9-nov,
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
- [ ] **Lavado de cara de la entrada desplegada** (revisor, v0.120). Con
      "cambiar" (o sin usuario guardado) el renglón tiene campo de 44, "Buscar"
      de 44 y "o pegar un PGN" de 36: tres alturas y dos pesos. En la v0.120,
      con "cambiar", el PGN no aparece porque no entraba en un renglón.
      Pregunta: ¿cambiar de usuario y pegar un PGN son la misma acción? ¿El PGN
      va en el mismo renglón, en la hoja, o en un "más" del campo? Con variantes.
- [ ] **El color de la barra de progreso** (revisor, v0.120). Es `--texto`, casi
      blanca: mientras corre el mes es lo más luminoso de la pantalla y le gana
      al botón principal. §1.1 no dice qué color tiene el progreso; va a
      `DISENO.md` como propuesta (es sistema de diseño: no se cambia de noche
      sin Juan, se propone).
- [ ] **Lavado de cara: la lista "Partidas" del Mes** (revisor, v0.119; celu y
      PC). Es el título más grande de la pantalla (h2 de 18 contra 14 de las
      secciones) y está al fondo de todo: con las secciones abiertas, a ~1560
      px. Repite el texto del volver ("‹ Partidas"), así que hay dos "Partidas"
      que significan cosas distintas, y abrir una partida desde acá es
      probablemente lo que más se toca. ¿Es la salida principal del Mes (y va
      antes de las secciones, o a un toque) o un apéndice (y lleva título de
      sección)? ¿Cómo se llama para no chocar con el volver? No va a la columna
      izquierda de la compu: con 30 partidas rompe el resumen fijo. Pariente del
      lavado del inicio. Con variantes.
- [ ] **[PC] La fila de la lista a 1280: ¿necesita 640?** (revisor, v0.122).
      Con las columnas de la v0.122, entre el nombre y "Ganada" quedan ~390 px
      vacíos y el resultado flota a mitad de la tarjeta. No frenó (es tabla,
      chess.com hace lo mismo). Pregunta: ¿con ~520 la fila se lee más junta, y
      el sobrante va a la columna izquierda? Con variantes, si se reabre el
      inicio de la compu.
- [ ] **Lavado de cara: el idioma de las aperturas** (revisor, v0.123; celu y
      PC). Desde la v0.123 la apertura es el subtítulo de cada partida, y los
      nombres de `aperturas.json` están en inglés ("Italian Game: Giuoco Piano,
      Therkatz-Herzog Variation") en una app que habla en castellano. ¿Nombres
      en castellano como chess.com en español (Giuoco Piano, Defensa
      Siciliana), y hasta dónde: familia y variante, o completo?
      **Juan (10-nov):** no sabe si le copa la apertura de subtítulo, *"sobre
      todo cuando el nombre es muy largo"* (hoy se corta con "…"). Que las
      variantes prueben también el largo: solo la familia, un nombre corto, o
      la apertura en otro lugar.

- [ ] **Lavado de cara: la fila de datos cuando no hay jugada** (revisor,
      v0.124; celu). En la posición inicial Pérdida, Caída y Pensó dicen "—" y
      solo Mejor dice algo: tres cuadritos vacíos con protagonismo. ¿Qué
      muestra la fila cuando no hay jugada que juzgar: los cuatro en "—", solo
      Mejor, o nada? De paso: en la última jugada de la partida de prueba
      Pensó dice "·" y no "—" (puede ser que esa partida no traiga relojes).
      Con variantes.

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
  el cuadrito Mejor. La otra: que abra en la inicial pero sin tarjeta, con el
  tablero subiendo a su lugar.
- Del revisor (v0.124), para el lavado de las preferencias del tablero: Girar
  al costado mide 27×44 a 386 de ancho, lejos de los 48 de toque, y ahora se ve
  en la primera pantalla de cada partida.
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
