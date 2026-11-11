# Diseño · sistema y gustos

Lo que usa el revisor de UX (`.claude/agents/revisor-ux.md`) para decidir solo
las cosas chicas. Dos partes: **el sistema de diseño**, que sale de la
auditoría de identidad visual (etapa 1 de `HOJA-DE-RUTA.md`), y **los gustos de
Juan**, que se anotan cada vez que dice "me copa" o "no me copa", con su porqué.

Se actualiza en el mismo commit que el cambio que lo motiva, igual que el
traspaso.

---

## 1. El sistema de diseño

**Base: A · Noche, tal cual** (elegida por Juan el 5-nov-2026). Escrito antes
de llevarlo al código: hasta que la etapa 1 lo aplique pantalla por pantalla,
la app sigue viéndose como la v0.95 y **esto es el destino, no la foto**. Los
valores de A salen de la maqueta (la tabla de "Las mezclas" en
`HOJA-DE-RUTA.md`); lo que no estaba en la maqueta lo decidió quien programa,
y va marcado *(elegido)* para que se pueda dar vuelta.

Los contrastes son WCAG, medidos con la fórmula de luminancia, y los
recalculó el revisor de UX el 5-nov. Lo mínimo es
**4,5:1 para texto, 3:1 para íconos, bordes de campos y texto de 18 px o más**.

### 1.1 Color — oscuro, que es el principal

Tres alturas de superficie, de más hundida a más arriba. **En oscuro la altura
se dice con la luz, no con sombras**: lo que está más arriba es más claro.

| variable | valor | para qué | contraste |
|---|---|---|---|
| `--fondo` | `#1d1f22` | la página | — |
| `--superficie` | `#272a2e` | tarjetas, tablas, la hoja de ajustes | — |
| `--elevada` | `#2f3337` | botones secundarios, campos, lo que se toca | — |
| `--linea` | `#3a3d42` | separadores y bordes que solo ordenan | 1,5 sobre fondo, a propósito: no es un borde que haya que ver |
| `--borde-campo` | `#7a7e84` | el borde de un campo o un select | 4,1 / 3,5 / 3,1 sobre fondo / superficie / elevada *(elegido)* |
| `--texto` | `#e9e7e3` | todo el texto | 13,4 sobre fondo |
| `--tenue` | `#a4a19b` | lo secundario: leyendas, ejes, aclaraciones | 6,4 sobre fondo, 4,9 sobre elevada |
| `--acento` | `#7cbf5a` | el botón principal, lo elegido, el foco | 7,4 sobre fondo, 6,5 sobre superficie |
| `--sobre-acento` | `#13210c` | texto encima del acento | 7,6 |
| `--casilla-clara` | `#e6e1d3` | tablero | — |
| `--casilla-oscura` | `#7f9466` | tablero | — |
| `--marca` | `#3f5163` | lo que se dibuja con el botón derecho | (ya existe) |
| el progreso | `--acento` sobre riel `--linea` | la barra de análisis, en el inicio y arriba de la Partida (v0.127) | 4,9 contra el riel |

**El borde de campo no es el que pidió el revisor.** Pidió `#6b6f75` "a 3:1",
y lo da sobre el fondo (3,3) pero **no sobre la superficie (2,85)**, que es
donde viven casi todos los campos: la hoja de ajustes es superficie. Con
`#7a7e84` pasa 3:1 en las tres alturas.

**El tablero de A reemplaza al de madera como tema por defecto.** Los temas
elegibles (§4bis del traspaso) siguen estando; cambia cuál arranca.

**Las variables que hoy se derivan de `currentColor`** (`--linea` y `--tenue`
con `color-mix`) pasan a ser fijas. Se derivaban porque no había paleta y así
seguían solas al esquema del teléfono; con dos paletas escritas ya no hace
falta, y un tenue fijo se puede medir.

### 1.2 Los colores de categoría

**Existen desde antes y se respetan**: son lo que Juan ya aprendió a leer.
Cambian dos, y solo de luz, no de tono.

| categoría | hoy | queda | sobre fondo | sobre superficie |
|---|---|---|---|---|
| brillante | `#26a69a` | igual | 5,5 | 4,8 |
| genial | `#5b8def` | igual | 5,1 | 4,5 |
| mejor | `#4a9d4a` | igual | 4,9 | 4,3 |
| excelente | `#6bb06b` | igual | 6,3 | 5,5 |
| bien | `#86b886` | igual | 7,3 | 6,3 |
| libro | `#b08d63` | igual | 5,4 | 4,7 |
| imprecisión | `#d4a017` | igual | 7,0 | 6,1 |
| error | `#e08030` | igual | 5,7 | 5,0 |
| **omisión** | `#d0453b` | **`#ef6a5e`** | 3,6 → 5,4 | 3,2 → 4,7 |
| **grave** | `#c0392b` | **`#e5534b`** | 3,0 → 4,46 | **2,65** → 3,9 |
| forzada | `#8a8578` | igual | 4,49 | 3,9 |

**Por qué se aplica lo del revisor:** grave sobre superficie daba 2,65, por
debajo hasta del mínimo de un ícono. Es la categoría que más importa que se
vea y era la que menos se veía.

**Lo que preguntó el revisor —cómo se distinguen entre sí— tiene una respuesta
incómoda:** grave y omisión nuevos quedan a 1,2:1 entre ellos, y **omisión y
error a 1,06**: por luz son casi iguales y los separa solo el tono (rojo,
salmón, naranja). No se arregla con color, y no hace falta: **la categoría
nunca va solo con color**, siempre lleva su símbolo (§4quinquies del traspaso),
y esa es la regla que se mantiene. Lo que sí queda prohibido es una marca de
categoría sin símbolo, como un punto suelto.

**No todas pasan 4,5.** Grave (4,46) y forzada (4,49) no llegan ni sobre el
fondo, y mejor, genial, forzada y grave quedan entre 3,9 y 4,5 sobre la
superficie: alcanzan para el símbolo y para
texto en negrita de 14 px, no para texto corrido. **Regla:** el color de
categoría se usa en el símbolo, el borde de la tarjeta y la palabra de la
categoría en negrita; **el texto que explica va en `--texto`**, nunca teñido.

**Sobre el tablero, la categoría va en la insignia, con aro.** Contra la
casilla oscura de A todas dan entre 1,0 y 1,6: ninguna se ve como relleno. La
insignia (el círculo con el símbolo en la esquina de la pieza) ya tiene fondo
propio; lo que se agrega es **un aro de 1,5 px del color `--fondo`** que la
separa de cualquier casilla. Esto resuelve también lo de "libro sobre la
madera" que el revisor marcó para M1, que con A no aplica tal cual.

### 1.3 Color — claro, guardado para más adelante

**La app va siempre en oscuro**, diga lo que diga el teléfono o la compu.
Decisión de Juan (5-nov-2026): *"en principio siempre en oscuro, después vemos
si sumamos modo claro"*. En el código eso es `color-scheme: dark` y una sola
paleta en `:root`, sin `@media (prefers-color-scheme: light)`.

**Lo de abajo no se aplica todavía.** Queda escrito y medido para el día que se
sume el claro, con los mismos nombres de variable.

| variable | valor | contraste |
|---|---|---|
| `--fondo` | `#f4f2ee` | — |
| `--superficie` | `#ffffff` | — |
| `--elevada` | `#ebe8e2` | — |
| `--linea` | `#dcd9d3` | — |
| `--borde-campo` | `#8a877f` | 3,6 sobre superficie |
| `--texto` | `#1d1f22` | 14,8 sobre fondo |
| `--tenue` | `#5c5953` | 6,2 sobre fondo |
| `--acento` | `#3d7a26` | 5,2 sobre blanco |
| `--sobre-acento` | `#ffffff` | 5,2 |
| tablero | igual que en oscuro | — |

**Las categorías no sirven tal cual sobre blanco**: imprecisión da 2,4 y bien
2,3. En claro, **el símbolo y la palabra** usan una versión oscurecida; el
borde de la tarjeta y la insignia del tablero siguen con la original.
**Y el texto de categoría en claro va solo sobre `--superficie`**: sobre
`--fondo` cinco quedan debajo de 4,5 (mejor 4,05, error 4,30, forzada 4,36,
grave 4,37, bien 4,44). En claro grave y omisión quedan a 1,03 entre sí y casi
del mismo tono: ahí el símbolo es todavía más obligatorio.

| categoría | en claro | sobre blanco |
|---|---|---|
| brillante | `#1c7c74` | 5,0 |
| genial | `#446ab3` | 5,3 |
| mejor | `#3f853f` | 4,5 |
| excelente | `#467246` | 5,6 |
| bien | `#577857` | 5,0 |
| libro | `#846a4a` | 5,1 |
| imprecisión | `#8a680f` | 5,2 |
| error | `#a86024` | 4,8 |
| omisión | `#b35046` | 5,1 |
| grave | `#c34740` | 4,9 |
| forzada | `#757166` | 4,9 |

### 1.4 Tipografía

**`system-ui` para todo**, como A. Nada de serif: Android no trae Georgia, y
la de M1 era lo único que la pedía.

Hoy hay **catorce tamaños** en el CSS, de 9,5 a 24 px, cada uno elegido en su
momento. Quedan **seis**:

| nombre | px | peso | para qué | lo que absorbe de hoy |
|---|---|---|---|---|
| título | 22 | 700 | h1, uno por pantalla | 20, 24 |
| subtítulo | 18 | 700 | h2, cabeceras de sección | el 15 del h2, 17, 18 |
| cuerpo | 16 | 400 | texto corrido, botones | 16 |
| secundario | 14 | 400 / 600 | controles chicos, tablas, la tarjeta | 13,5, 14, el resto de los 15 |
| leyenda | 12,5 | 400 | ejes, leyendas, aclaraciones | 12, 12,5, 13 |
| mínimo | 11 | 600 | galones, coordenadas, marcas en la tira | 9,5, 10,5, 11, 11,5 |

**Dónde va cada 15 de hoy**, que es el tamaño que cae entre dos: el `h2` sube a
18 (está fuera de la vista de la jugada); el título de la tarjeta
(`.veredicto .tit`) va a **16 en 700**, que es lo más importante de la tarjeta
y sube un solo píxel; `.seccion > summary` y `.conmutador` bajan a 14 en 600.
La tira (`.tira .jg`, hoy 13) va a 12,5. **En la vista de la jugada ningún
cambio de tamaño puede hacer crecer la pantalla**: si lo hace, se mide antes
de aplicarlo.

**Tres pesos: 400, 600 y 700.** El 800 que hay en dos lugares pasa a 700.
**Números alineados** (`font-variant-numeric: tabular-nums`) en tablas,
relojes y evaluaciones, para que las columnas no bailen.

**El de 11 no baja más.** El `½-½` a 9,5 px ya fue rechazado por apretado
(§2, "No le copa"): nada de texto por debajo de 11.

### 1.5 Espacios

**Escala de 4: 4, 8, 12, 16, 24, 32.** Se suma **2** solo adentro de un
componente denso (el relleno de una pastilla, la distancia entre símbolo y
número).

| | dónde |
|---|---|
| 4 | entre un número y su unidad, ícono y texto pegados |
| 8 | entre elementos de una misma fila, el relleno de un control chico |
| 12 | entre filas de una lista, el relleno de una tarjeta en el celu |
| 16 | el margen de la página en el celu, el relleno de una tarjeta en PC |
| 24 | entre secciones |
| 32 | entre bloques grandes en PC |

Hoy los más usados son 6 y 10, que no están en la escala. **No se corrigen de
un saque**: se pasan a 4, 8 o 12 cuando se aplique cada pantalla, mirando la
captura, porque la pantalla densa (§2) es un gusto de Juan y un 10 que pasa a
12 en cada renglón puede empujar algo fuera de la vista.

### 1.6 Formas

- **Radios:** 10 para botones y campos, 12 para tarjetas y la hoja de ajustes,
  6 para pastillas y galones, círculo para insignias. Las casillas y el tablero
  no llevan radio.
- **Bordes:** 1 px. `--linea` para separar, `--borde-campo` para lo que se
  escribe o se elige, el color de la categoría (3 px, a la izquierda) para la
  tarjeta, como hoy.
- **Sombras:** ninguna en lo que está en la página. **Una sola** para lo que
  flota encima —la hoja de ajustes, la previa al pasar el mouse—:
  `0 8px 24px rgb(0 0 0 / .45)` *(elegido)*.
- **Lo elegido en la tira:** subrayado de 2 px de `--acento` debajo de la
  jugada (lo pidió el revisor, aplica igual a A).

### 1.7 Botones y controles

| | cómo es | alto |
|---|---|---|
| **principal** | relleno `--acento`, texto `--sobre-acento`, peso 600 | 44 (40 en la vista de la jugada) |
| **secundario** | relleno `--elevada`, sin borde, texto `--texto` | 44 (40 en la vista de la jugada) |
| **chico** | como el secundario, 14 px | 36 visibles |
| **ícono** | sin relleno hasta que se toca, ícono de 20 a 24 | 44 |
| **campo / select** | relleno `--elevada`, borde `--borde-campo` | 44 |

- **Uno solo principal por pantalla.** Si hay dos candidatos, uno es
  secundario.
- **Área de toque de 48 en el celu**, aunque lo visible sea más chico: el chico
  de 36 y los de 40 se agrandan con un margen invisible. **40 y no 44 en la
  vista de la jugada** porque hoy los botones miden ~37 y el conmutador 42:
  con 44 cada fila sumaba de 2 a 7 px, y con el poco aire que queda a 412×760
  dos o tres filas empujaban algo fuera de la vista.
- **Entre botones chicos, 12 de separación en el celu**: con 8, las áreas de
  48 de dos vecinos se pisan. En la compu (`pointer: fine`) el
  chico puede quedar en 32.
- **Deshabilitado:** opacidad .4, sin cambio de color.
- **Foco de teclado:** contorno de 2 px de `--acento` separado 2 px, solo con
  `:focus-visible`, que el dedo no lo dispare.
- **Se distinguen campo y botón** como hoy (el comentario de `select.chico` en el CSS): el campo tiene
  borde visible y el botón secundario no.

### 1.8 Movimiento

Hoy hay cinco transiciones (barras y galones), entre 150 y 200 ms. El sistema
fija tres duraciones y dos curvas *(elegido; las tres reglas del traspaso §8,
"animaciones", eran de Juan y van al resumen como recomendación)*:

| | ms | para qué |
|---|---|---|
| corta | 120 | hover, galones, un color que cambia |
| media | 180 | la pieza que se mueve, las barras de evaluación, la tira que se centra |
| larga | 250 | la hoja que sube, la tarjeta que cambia de alto |

- **Curvas:** entrar con `cubic-bezier(.2, 0, 0, 1)` (arranca rápido, frena
  suave); salir con `cubic-bezier(.3, 0, 1, 1)`. Lo que sale dura un tercio
  menos que lo que entra.
- **Si se pasa de jugada antes de que termine, la nueva corta a la anterior y
  la pieza salta al final.** Nunca se encola: revisar una partida es pasar
  jugadas rápido.
- **`prefers-reduced-motion: reduce`:** todo movimiento pasa a 0 ms; quedan
  solo los cambios de opacidad, de 100 ms como mucho. Es obligatorio desde la
  primera animación de movimiento.
- **Nada se mueve solo.** Se anima lo que responde a algo que hizo Juan; nada
  que llame la atención por su cuenta.

### 1.9 Lo que el revisor marcó, y qué se hizo con cada cosa

Lo revisó sobre M1 y M2; con A elegida, cada punto se juzgó de nuevo:

| lo que marcó | ¿aplica a A? | qué queda |
|---|---|---|
| piezas negras comidas, invisibles en el fondo (1,2:1) | **sí**: el negro de Cburnett da 1,3 sobre el fondo de A | van sobre una pastilla de `--casilla-clara` (16:1), radio 6, igual para las dos tandas para que no parezca que una está marcada |
| la curva, bloque crema que encandila | **sí**: el lado blancas es `#f0ece2`, el mismo de la barra | blancas `#d9d5cc` y negras `#33373c`, en la curva y en las dos barras: 8,2 entre ellas, menos luz y se siguen leyendo |
| grave y omisión, por debajo de 3:1 | **sí** | `#e5534b` y `#ef6a5e` (§1.2) |
| cómo se distinguen grave y omisión | sí, y peor: omisión y error también | por el símbolo, que es obligatorio (§1.2) |
| bordes de campo a 3:1 con `#6b6f75` | sí, pero el valor no alcanza sobre superficie | `#7a7e84` (§1.1) |
| libro sobre la casilla de madera *(M1)* | no tal cual, pero **todas** las categorías desaparecen sobre la casilla oscura de A | aro de `--fondo` en la insignia (§1.2) |
| serif solo en títulos grandes *(M1)* | no: A no usa serif | — |
| la jugada elegida, subrayada de acento | sí | §1.6 |

### 1.10 Lo que todavía no está, y se decide al aplicar cada pantalla

El revisor lo marcó como lo que le falta para decidir cosas chicas solo:

- **Colores del tablero:** última jugada, casilla elegida, jaque, flechas.
  `--marca` da 2,46 sobre la casilla oscura de A, así que hay que revisarla.
- **Estados:** hover, apretado, fila elegida en tablas, opción elegida del
  conmutador.
- **Aviso o error que no sea de categoría**, y el velo detrás de la hoja.
- **Una tabla de componente → variable** para la vista de la jugada.

Se escriben acá cuando se aplique la pantalla que los usa, no antes.

**Lo que decidió la pantalla de Revisión (v0.97):**

| | valor | por qué |
|---|---|---|
| `--inventada` | `#b48ce0` | lo inventado (la prueba) como texto o borde: 6,1 sobre fondo. El violeta de la flecha, `#6a1b9a`, da 1,8 y queda solo en el tablero, donde sobre la casilla clara da 7,2 |
| `--senal` | `#e8a33d` | lo que señala la frase: casilla, flecha y frase encendida (con texto `--fondo` encima). Mismo valor de antes, ahora con nombre |
| lo elegido | subrayado de 2 px de `--acento` | en la tira, la variante y el conmutador. En la tira se suma al fondo de la categoría: uno dice qué fue, el otro dónde estás |
| cuadrito encendido | borde `--acento`, fondo acento al 14% sobre superficie | |

**Flechas, medidas sobre las casillas de A y todavía sin tocar:** la azul de
lo jugado (`#1565c0`) da 4,4 sobre la clara y **1,7 sobre la oscura**; la verde
de la mejor (`#2e7d32`), 3,9 y **1,55**. Sobre la casilla oscura las dos quedan
por debajo de 3:1. En la v0.99 se les puso un aro de `--fondo`, y la bolita
de la punta tapaba la pieza de destino. **Desde la v0.100 van como las de
chess.com** (pedido de Juan con capturas): un solo polígono semitransparente
(opacidad ,7), cola de 9 unidades (≈ un quinto de casilla), punta triangular de
~20 de ancho y 15 de largo que termina en el centro de la casilla, la cola
arranca a un cuarto de casilla del centro de origen.
**v0.101, lo que eligió Juan:** la de la mejor pasó a `--f-mejor` `#43c94a`, un
verde más claro y vivo (**v0.102: "muy chillón"; queda `#3a8f44`**, ver §2) (la de lo jugado queda en `--f-jugada` `#1565c0`). Por
luz ningún verde se despega de las dos casillas a la vez (aclarar lo pierde en
la clara); lo que la separa de la oscura de A, oliva apagado, es la
saturación. La del caballo sigue **recta**, no en L. Y **las marcas del botón
derecho usan el mismo polígono**, en `--marca`: las distingue el color.

**Lo que decidió la hoja de ajustes (v0.103):**

| | valor | por qué |
|---|---|---|
| `--velo` | `rgb(0 0 0 / .55)` | lo que va detrás de lo que flota. Con el ,45 de antes la página de atrás no se apagaba y la hoja, en `--superficie`, no se despegaba |
| la hoja | `--superficie`, radio 12 arriba, `--sombra-flota`, 16 a los costados | la sombra cae hacia abajo y casi no se ve: en oscuro la despega la luz, no la sombra (§1.1), y no se inventa una segunda |
| el tirador | 36×4 en `--borde-campo` | 3,5:1 sobre superficie; con `--linea` daba 1,2 y no se veía |
| los selects | 44 de alto, 12 entre uno y otro | son campos (§1.7); "Listo" es chico y queda en 36 |

**El color del progreso: el acento** (revisor, v0.120; propuesta del 11-nov,
**aprobada por Juan y aplicada en la v0.127**). §1.1 no dice de qué
color es la barra de progreso, y hoy sale de `currentColor`, o sea `--texto`
casi blanco: mientras corre el mes es lo más luminoso de la pantalla (8,8:1
sobre su riel en `--linea`). Tres dibujadas sobre el inicio a 412×760, con
"Analizando 12 de 40 · Parar" y el 30 %:

| | relleno | contra el riel (`--linea`) | se lee como |
|---|---|---|---|
| hoy | `--texto` | 8,8 | lo más importante de la pantalla |
| **la recomendada** | `--acento` | 4,9 | "la app está trabajando", como Material (el progreso va en el color primario) |
| la quieta | `--tenue` | 4,2 | un dato más, al nivel del recuento |

**Por qué el acento:** en el inicio, mientras corre, no hay botón principal a
la vista (el botón se vuelve "Analizando… · Parar", y Parar es secundario),
así que no le compite a nada, y es el mismo verde de lo que está activo. El
tenue se lee "en pausa", no "trabajando". Acento (4,9) y tenue (4,2) pasan el
3:1 de un componente que no es texto. **Es la misma regla para los dos
lugares**: también pinta la raya de 3 px de arriba de la Partida y de las
vistas (`body.enVista #zonaEstado .barra`), donde el verde es la barra de carga
de siempre. Si se aprueba, va como `.barra > i { background: var(--acento) }`
y una fila en la tabla de §1.1. El revisor estuvo de acuerdo (11-nov).

### 1.11 Cómo se usa esto

- **En el código son variables en `:root`**, una por fila de las tablas de
  arriba. Solo la oscura por ahora (§1.3). Ningún color,
  tamaño o radio escrito a mano fuera de ahí, salvo las piezas de Cburnett.
- **El revisor decide contra esto.** Un cambio que usa un valor que no está acá
  es un hallazgo, salvo que el commit diga por qué.
- **Cambiar el sistema no se hace de noche** (`TAREA-NOCTURNA.md`): se propone
  como duda.

---

## 2. Los gustos de Juan

Cada entrada: qué, si le copa o no, y el porqué con sus palabras cuando las
hay. Las primeras salen del historial del traspaso.

### Le copa

- **Modo oscuro**: usa el celu así (5-nov-2026).
- **La app siempre en oscuro**, aunque el teléfono esté en claro: *"en
  principio siempre en oscuro, después vemos si sumamos modo claro"*
  (5-nov-2026).
- **La dirección A · Noche** (oscura, carbón frío, acento verde), y de la B ·
  Papel le quedó que *"tiene su encanto"*: títulos de libro y tablero de
  madera. Se le dibujaron dos mezclas y **se quedó con A** (5-nov-2026): es la
  base del sistema de diseño.
- **Que el revisor vaya revisando todo** (5-nov-2026).
- **Lo de PC lo elige el revisor**: Juan no usa la app en la compu. Si le
  mandan capturas elige, pero *"no sé si vale la pena"*. **Excepción: una
  dicotomía**, algo que bifurque la identidad visual; eso sí va a Juan, con
  capturas (6-nov-2026).
- **Las tablas del mes sueltas, con una sola raya entre secciones**, y **la
  flecha de la mejor en `#3a8f44`**: *"la tabla se siente bien"*, *"lo de la
  flecha quedó bien"* (6-nov-2026, v0.102).
- **Las flechas como las de chess.com**: anchas, punta triangular y
  semitransparentes, que se vea la pieza a través. Mandó capturas de chess.com
  para comparar (6-nov-2026, v0.100). La de la mejor, verde y que se lea, pero
  **no chillona**: el `#43c94a` de la v0.101 *"destaca demasiado"*, y hacer
  chillona la azul para emparejar *"pone todo fluorescente"*. Quedó `#3a8f44`,
  un oscuro apenas más vivo que el original (v0.102); la del caballo, **recta**; y las suyas del
  botón derecho, **con la misma forma** (6-nov-2026, v0.101).
- **Pantalla densa, todo lo de la jugada sin scrollear**, antes que tarjetas
  grandes. Lo eligió mirando tres propuestas a ancho de celu (§7 del
  traspaso, "Estética").
- **El análisis de chess.com** como referencia general, y **la jaula del rey**
  como estilo de lección: mostrar la idea en vez de explicarla (`NORTE.md`).
- **Piezas Cburnett**, elegidas mirándolas en lichess: siluetas distintas,
  blancas huecas y negras rellenas (§4bis).
- **La hoja de ajustes que sube desde abajo**, porque deja el tablero a la
  vista mientras se cambia cómo se ve (§4untrigies).
- **La tuerca de engranaje lleno, seis dientes gordos.** Le gustó también el
  ícono de perillas acostadas y lo dejó guardado para otra cosa (§4untrigies).
  **Y el círculo con relleno y borde alrededor**, aunque §1.7 diga "ícono sin
  relleno": se le mostraron la tuerca sola y la de solo borde, en la pantalla
  entera, y se quedó con la suya: *"por ahora la mía me convence"*, sin
  descartar cambiarla más adelante (6-nov-2026, v0.104). Es la excepción a
  §1.7; el revisor no la vuelve a marcar.
- **El borde de la tarjeta con el color de la categoría**: dice más que un
  color fijo (v0.71, §4sexdecies).
- **La jerga en los textos**: *"me gusta la jerga. Quizás podamos apuntar
  nuestras frases a ese lado"*, a partir de "los chanchos en la séptima"
  (§4octodecies).
- **"Tablas" escrito y no `½-½`**: el glifo `½` a 9,5 px se lee apretado.
  Rompe la simetría con `1-0` y `0-1` a propósito (v0.62).
- **Que el revisor detecte solo lo que pide un lavado de cara**, y no tener
  que decirlo él: *"si no depende de mi ojo en todos lados"*. Prefiere **reglas
  generales** a una regla por cada cosa: *"no quiero andar pensando todo.
  Quiero revisar lo que se hizo"*. Para lo que pide forma nueva, **varias
  variantes y que el revisor elija, con derecho a decir "ninguna"** o "esta
  con tal ajuste": si no, *"es una de las cuatro sí o sí y capaz que las
  cuatro están mal"*. Y **ver lo que no se aplicó por respetar algo que eligió
  él**, con captura: *"capaz veía la sugerencia y digo, ah, queda bien y la
  acepto"* (6-nov-2026).
- **La fila de abajo de la jugada en la D** (la misma grilla de cuatro que
  los cuadritos, el estado por color, "Siempre la mejor" y "Rival"): *"creo
  que quedó bien la D"* (7-nov-2026, v0.106). **Y de la C le coparon los
  botones con ícono y texto**, *"sobre todo en la de rotar, que es muy
  gráfico"*. Es un gusto, no una regla: él mismo aclaró *"quizás no sea lo
  ideal, no soy UI UX"*. Así que **no cambia §1.7** (el botón chico es texto):
  lo que pide es que, cuando se rediseñen esos botones (el lavado de "dónde
  viven las preferencias del tablero"), **haya variantes con ícono y texto**
  y el revisor juzgue con criterio de diseño dónde suman y dónde no.
- **El Mes con el mes como título y un rótulo chico arriba** (7-nov-2026,
  v0.109): el selector «Octubre 2026 ▾» hace de título y arriba va
  «ESTADÍSTICAS» en la letra de los cuadritos, tenue. Dudaba entre rótulo o no;
  mirando tres (ese, uno chico en minúsculas, el h2 de 18 de antes) eligió
  este. Él no dijo por qué; la recomendación que tenía era esta o ninguna,
  porque el h2 grande ponía dos títulos seguidos compitiendo con el mes.
- **La barra de pestañas abajo** (la variante A de la estructura, v0.110): *"me
  enamoré"*, el concepto. Lo de que tapa contenido no le parece grave: se
  esconde al deslizar para arriba y vuelve al deslizar para abajo. Pero él
  mismo dudó: Partidas → Partida → Mes *"medio que es un caminito"*, no son
  pestañas independientes. Para destinos de verdad hermanos (los módulos) es
  candidata fuerte (7-nov-2026). **Eligió eso**: el caminito queda con
  "‹", y la barra de abajo vuelve con los módulos, escondiéndose al deslizar
  (`HOJA-DE-RUTA.md`, etapa 4).
- **Cada control donde lo pide cuánto se usa** (7-nov-2026, v0.114): Girar
  se usa al arrancar la partida y casi nunca después, así que va **a mano al
  principio y después se esconde** (al costado del tablero, idea suya); lo que
  se cambia seguido, a un toque; lo que se pone una vez, a la hoja. Y que un
  botón no se lleve más protagonismo que lo que vale: "Siempre la mejor" a
  todo el ancho *"ganó mucho protagonismo"*.
- **El inicio de la v0.120** (la C del revisor con sus ajustes): *"me copa
  cómo quedó"* (10-nov-2026). Es decir: la entrada que se pliega a "usuario ·
  cambiar", el mes como título, un renglón chico de recuento, "Analizar el mes
  · faltan N", la tarjeta de Estadísticas antes de la lista, filas de un
  renglón (rival · resultado · precisión · fecha) y tocar la fila para entrar.
  No dijo por qué; lo que la distinguía de las otras era que entraban más
  partidas a la vista y la partida se abría de un toque, como en chess.com.
- **La barra de progreso en verde** (`--acento`), en vez de casi blanca:
  *"me copa la barra de progreso en verde"* (11-nov-2026, v0.127). Se le
  mostraron tres (blanca, verde, gris); la verde se lee "está trabajando" sin
  ganarle al resto de la pantalla, y no le molestaron los tres verdes juntos
  del inicio.
- **Decidir usando la app** cuando mirando capturas no alcanza: las jugadas
  probadas quedaron en un dial porque *"no me decido, y creo que esta va a ser
  mejor probando la app"*.

### No le copa

- **Cómo se ve hoy la app en conjunto**: *"medio baqueteada, medio feucha"*;
  le falta una visión global (`NORTE.md`).
- **Una app centrada en sus errores.** Un proyecto anterior así quedó
  archivado. Los errores se muestran, pero la práctica y las lecciones se
  ordenan por lo que quiere aprender (`NORTE.md`).
- **Topes diarios**, de ningún tipo (`NORTE.md`).
- **Glifos chicos que hay que descifrar** (el `½-½` de la v0.61).
- **Que el tablero salte** mientras uno está por jugar la siguiente (falla
  anotada en la v0.84, §8).
- **Que la punta de la flecha tape la pieza con algo opaco**: el aro con bolita
  de la v0.99, *"no me copa"* (6-nov-2026). Semitransparente encima de la
  pieza, como chess.com, sí.
- **Dos rayas paralelas casi pegadas** entre una tabla y la sección siguiente:
  *"hay algo ahí que se ve raro"*. Una sola raya entre secciones, y la tabla al
  ras del título y la leyenda (v0.102).
- **El fundido al pasar de pantalla** (v0.110, 120 ms): *"no se sintió bien…
  brusco, medio violento"*. Y que la pantalla **haga algo antes de irse** (la
  barra de progreso que parpadea) y que la nueva **siga haciendo algo al
  llegar** (la barra de la evaluación que se anima desde cero). Lo que cambia de
  pantalla tiene que llegar quieto (7-nov-2026, v0.111).
- **La curva colgando y la pantalla armada con pedazos** (v0.118, compu a
  1000 de ancho): la curva cruza todo el ancho, pero arriba a la derecha no
  tiene nada (la lista termina antes) y abajo los cuadritos ocupan solo la
  izquierda; la barra vertical, un bloque crema alto. *"Cualquier ser humano
  lo ve y dice que está horrible"* (9-nov-2026). Un tablero más grande no
  compensa una pantalla que no se lee como un todo.
- **La apertura en la cabecera de la Partida**, en gris al lado de "‹
  Partidas" y pegada a la tuerca (v0.111): *"no me gustó para nada"*. Se sacó
  en la v0.112; dónde va lo decide el lavado de la cabecera (7-nov-2026).
- **Las tablas metidas en tarjeta** (fondo más claro, borde redondeado, v0.98):
  *"quedaron raras"*. Van sueltas sobre el fondo, con las rayas entre filas
  (6-nov-2026, v0.99). Las tarjetas siguen para lo que es tarjeta: la del
  veredicto, los cuadritos, la lista.

## 3. Lo que el revisor aprobó y a Juan no le copó

Lo que más enseña: no el gusto en sí (eso va en §2) sino **qué miró el revisor,
qué se le pasó y la regla general que sale**. El revisor lo lee antes que nada.
Se anota cada vez que Juan rechaza algo que pasó por el revisor (decisión de
Juan, 7-nov-2026). Las reglas que salen de acá las destila la revisión del
criterio (`TAREA-NOCTURNA.md`) hacia `.claude/agents/revisor-ux.md`.

- **El fundido de 120 ms al cambiar de pantalla** (v0.110). Lo decidió el
  revisor con la duración y la curva de §1.8, y lo verificó congelando el
  cuadro del medio. *Se le pasó*: una foto quieta no dice cómo se siente; y
  la pantalla nueva llegaba con cosas animándose (la barra de la evaluación
  desde cero) y la vieja parpadeaba antes de irse. *Regla*: el movimiento se
  juzga mirando qué se mueve en todo el recorrido —antes, durante y después—
  y no un cuadro; en duda, sin movimiento hasta que se diseñe en serio.
- **La apertura en la cabecera de la Partida** (v0.111). El revisor había
  pedido sacarla del inicio sin decir adónde; quien programa la puso al lado del
  volver, el revisor midió que no empujaba nada, la aprobó, y en el mismo
  informe marcó esa cabecera como lavado de cara. *Se le pasó*: que quede
  bien donde está, no solo que no empuje. *Reglas* (ya en sus instrucciones):
  no se pide mover sin decir adónde, y lo nuevo que rompe una zona es
  CORREGIR, no un lavado para después.
- **Los tres botones de la jugada con ícono y texto, en su fila** (v0.113).
  El revisor eligió entre cuatro midiendo lugar, toque de 48 y que no empuje.
  *Se le pasó*: **cada cuánto se usa cada uno**. Girar se toca al arrancar y
  nunca más, Rival casi nunca, Siempre la mejor seguido: tres frecuencias
  distintas en tres botones iguales. Juan lo vio en la captura. *Regla*: antes
  de decidir dónde va un control, preguntarse cuándo y cada cuánto se toca; lo
  de una vez va escondido o solo en el momento en que se usa, y el lugar a un
  toque es para lo que se cambia seguido.
- **Los anchos del medio de la compu** (v0.118). Quien programa dibujó las
  variantes buscando el tablero más grande; el revisor eligió midiendo lado,
  saltos y desbordes, mirando las variantes achicadas una al lado de la otra.
  Vio que la curva cruzaba dos columnas y los cuadritos una, pero lo mandó a
  lavado "porque ya estaba así en 1110". *Se le pasó*: la pantalla entera, a
  tamaño real, se veía armada con pedazos. *Reglas* (en sus instrucciones): lo
  que se ve mal frena aunque viniera de antes si el cambio lo toca o lo
  extiende —no se parcha lo que hay que rehacer—, y se mira a tamaño real.
