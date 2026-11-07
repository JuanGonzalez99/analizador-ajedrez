# Cómo trabajar en este repo

**Hacia dónde va el proyecto está en `NORTE.md`**, y el orden en
`HOJA-DE-RUTA.md`. El sistema de diseño y los gustos de Juan, en `DISENO.md`.
Lo que hace cada noche la tarea programada, en `TAREA-NOCTURNA.md`.

**El documento del proyecto es `TRASPASO.md`.** Ahí está todo: las decisiones
medidas, el mapa del archivo, las reglas de método y los pendientes. Leerlo
antes de tocar nada, y **actualizarlo en el mismo commit** que el cambio que
describe. §10 tiene las reglas de trabajo.

## Cómo hablar con el usuario

- **No usar la herramienta de tarjeta de preguntas (`AskUserQuestion`).** En el
  celular del usuario **se tilda al responder**: queda colgada y hay que
  reescribir la respuesta. Las opciones se ofrecen **en texto**, numeradas o con
  viñetas, y él contesta escribiendo.
- **Las decisiones visuales ya no esperan el ok de Juan** (desde el 5-nov-2026,
  `NORTE.md`, "Cómo trabajamos"). Reemplaza a la regla vieja de "dibujar y
  esperar el ok" para todo lo del celu. Ahora:
  - **Las chicas las toma el revisor de UX** (`.claude/agents/revisor-ux.md`)
    contra el sistema de diseño y los gustos de `DISENO.md`: un espacio, un
    tamaño, el texto de una etiqueta, la forma de una marca, una duración.
  - **Las grandes** —cambiar el sistema de diseño, qué pregunta contesta una
    tabla, una pantalla entera nueva, sacar algo que Juan usa— **tampoco
    frenan**: se elige la recomendación, se sigue, y van al resumen como duda
    ("no sé si esto te copa"), con captura. Darla vuelta cuesta poco.
  - **El revisor es otro agente**, no el que programa, y mira capturas de celu
    **y** de PC. Revisa después de cada cambio; si el consumo se come el tope
    semanal, una vez al final (perilla en `HOJA-DE-RUTA.md`).
  - **Lo que Juan diga "me copa / no me copa" se anota en `DISENO.md` con su
    porqué**, en el mismo commit. Es lo que deja al revisor decidir como él.
  - **Lo de PC sigue igual que desde la v0.91**: se decide, se aplica y se
    cuenta. Y sigue la **comparación byte a byte de las capturas de celular**
    contra la versión anterior, en cada versión: es lo que prueba que un
    cambio de PC no se filtró al celu. Sale así, con las de la tanda anterior
    guardadas en un directorio aparte:
    `for f in viejas/*.png; do cmp -s "$f" "capturas/$(basename $f)" || echo "$f"; done`
    —salteando las que empiezan con `ancho`, `tres`, `marcas` y `previa`, que
    son las de PC y tienen que cambiar—.
  - **Excepción**: lo que `HOJA-DE-RUTA.md` marque `⏸ espera a Juan` (por
    ejemplo, elegir la dirección visual) sí espera.
- **Las maquetas no se commitean.** El script que dibuja las alternativas es
  andamio de una decisión temporal: se corre, se mandan las capturas y se tira.
  `.gitignore` ya lo ataja (`pruebas/maqueta-*.mjs`). En el repo queda lo que se
  aprendió —los números y lo que eligió el usuario— en el traspaso, no el script.
  **Pero el andamio sí se commitea, y vive en `pruebas/tira.mjs`** (v0.92):
  `abrirApp()` levanta la app al ancho del celular, `tira()` clona un pedazo de
  la pantalla una vez por variante y lo fotografía en las dos escalas, y
  `alinear()` y `espacios()` contestan con números lo que uno iría a buscar a la
  captura. **Importarlo, no reescribirlo**: con eso una maqueta son ~35 líneas
  en vez de ~110, que es de dónde salía el grueso del costo de una tanda.
- **Toda versión que cambia algo que se ve va con sus capturas, sin que Juan
  las pida**, de día y de noche: celu a 2x, con `SendUserFile`, en el mismo
  mensaje que dice la versión nueva. Si lo que cambió no se ve en una foto (una
  transición), se dice. Pasó con la v0.111: hubo que pedirlas (7-nov-2026).
- **Mirar la captura no es mirar lo que cambiaste: es mirar la pantalla.**
  Incluye los **espacios**: que nada quede pegado a nada. Ya pasó —una fila de
  botones mudada de lugar quedó pegada a la tarjeta de abajo, y lo vio el
  usuario en la captura que le mandé yo—. Antes de mandar una captura, recorrerla
  entera buscando cosas pegadas, cortadas o desalineadas.
- **Las capturas se sacan al tamaño de un celular**, no de una pantalla alta.
  Medido sobre una captura suya, sacando la escala del tablero (que mide 360 CSS
  de ancho): su viewport es de **≈420 × 810 CSS** con la barra de direcciones
  escondida, y ~745 de alto cuando está visible. **Dibujar a 412 × 760**, que es
  el caso apretado. Una captura de 1500 px de alto no deja dimensionar cuánto se
  ve de verdad.
- Se escribe en **castellano rioplatense**, igual que el código y el traspaso.

## Dos archivos que no se leen enteros

Son los dos más grandes del repo y los dos se pagan en contexto:

- **`aperturas.json` es una sola línea de 942 KB** (`wc -l` da 0, no es un
  error). O sea que **cualquier `grep` que matchee devuelve el archivo entero**
  como un único renglón: unos 236.000 tokens de golpe. Se lo toca solo con
  `-c`, con `-o`, o con `head -c`. Nunca `cat`, nunca `grep` a secas.
- **`index.html` son ~103.000 tokens** (v0.90). No se lee entero nunca: para eso
  está el mapa del §3 del traspaso, que dice qué función vive en qué zona. Se
  grepea el nombre y se leen los renglones de alrededor. Mantener ese mapa al día
  no es prolijidad: es lo que evita leer el archivo completo. Lo mismo vale para
  el propio `TRASPASO.md`, que ya va por ~66.000: se lee por secciones.
  **Ojo con los greps demasiado abiertos ahí adentro**: `grep -n "^const PIEZAS"`
  devuelve la constante entera con los doce dibujos de Cburnett, que son unos
  10.000 tokens de un saque. Si un nombre puede estar pegado a un bloque enorme,
  `grep -c` primero.
- Las **capturas** de `npm run mirar` **ya no son todas del mismo tamaño**, y la
  diferencia importa: las del celular salen a 824×1520 (**~1.670 tokens** cada
  una si se las mira), las de la pasada ancha a 2560×1600 (**~5.500**) y las de
  tres columnas a 3000×1600 (**~6.400**). Son **48** y mirarlas todas serían
  ~116.000 tokens, o sea más que el archivo entero. Se miran una o dos, las que
  contestan la pregunta; el resumen de texto que imprime el arnés son 400 tokens
  y suele alcanzar.

## Mirar barato (medido en la v0.91)

Mandarle capturas al usuario **no cuesta nada** —`SendUserFile` devuelve una
lista de identificadores, no las imágenes—. Lo que se paga es **mirarlas uno**, y
eso se puede bajar diez veces sin perder nada. En orden de cuánto rinde:

1. **Medir en vez de mirar.** Lo que uno va a buscar en la captura es casi
   siempre lo mismo —¿algo quedó pegado, tapado, cortado o desalineado?— y eso
   son rectángulos. El arnés puede recorrer los vecinos y decir *"el flotante se
   superpone con #btnAmbos"* o *"quedan 9 px hasta el rival"*: son ~100 tokens y
   contestan lo que contestan 1.670. **Ojo con las alineaciones**: la cuenta que
   deduce dónde cae el renglón a partir del relleno solo vale si el texto arranca
   arriba de todo; adentro de algo centrado se equivoca en la mitad del sobrante
   —8 px, pasó— y manda corregir lo que ya está bien. Un `Range` sobre el texto
   devuelve la caja del renglón ya ubicada (§4untrigies).
2. **Las capturas para uno van a escala CSS**, no a 2x: `scale: "css"` en
   Playwright. La pantalla entera del celular pasa de **1.670 a 417 tokens** y
   para revisar espacios alcanza y sobra. La de 2x se saca igual, pero **solo
   para mandársela al usuario**, que es quien la tiene que leer.
3. **Recortar** con `locator.screenshot()`: el renglón que se está decidiendo son
   **~70 tokens** contra 1.670 de la pantalla entera. La pantalla completa se
   mira una sola vez, la de la variante que se recomienda, que es donde vale la
   regla de recorrer los espacios.
4. **Una tira con todas las variantes juntas.** Se clona el renglón una vez por
   opción, se le pone el envase de cada una y se fotografía todo junto: seis
   opciones en una imagen, comparadas pegadas, que es como se decide. **A escala
   CSS son 157 tokens las seis**, o sea 26 por variante. Ojo: **la misma tira a
   2x sale 627**, más cara que seis recortes sueltos; el ahorro es la escala, no
   la tira.
5. **Menos variantes por tanda.** Con los números primero, varias se descartan
   solas y no llegan a ser imagen nunca.

Una tanda de seis variantes pasa de ~10.000 tokens a ~700 con esto. El gasto que
quedaba arriba era **escribir el script de la maqueta** (~1.600 de salida), y
por eso desde la v0.92 el andamio está escrito: se importa de `pruebas/tira.mjs`
y la maqueta queda en ~35 líneas. Sigue valiendo la regla de §10 de reescribirla
en vez de parcharla —un parche que la corta cuesta más que el archivo entero—,
solo que ahora reescribir son 35 líneas y no 110.

**Para decidir la pantalla ENTERA está `pantallas()`**, que es otro problema:
no clona —aplica cada variante sobre la app de verdad, fotografía y deshace— y
compara lado a lado, que es como entran. Ahí el ahorro es mucho menor y conviene
saberlo: una pantalla a escala CSS son 417 tokens y tres, 1.250, se las junte o
no. Lo que evita mirar de más es lo que mide sola: **cuánto empuja cada variante
—el tablero y la página— y qué encima o pega que no estuviera antes**, medido
contra una línea base porque si no el ruido preexistente de la app tapa la
señal.

**El MCP de github está denegado** en `.claude/settings.json`, que por eso es el
único archivo de `.claude/` que se versiona: si no se commitea, no existe en la
sesión siguiente —el contenedor clona limpio— y la guarda no serviría para lo
que se puso. Tenerlo prendido no cuesta nada (sus herramientas están diferidas,
o sea que solo viajan los nombres), pero **usarlo sí**: cada esquema que se carga
son de 200 a 1.400 tokens y se queda en la ventana toda la sesión. Este repo
pushea derecho a `main`, sin PRs ni issues, así que no hay nada ahí que
necesite. `git` no lo toca: sale por el proxy del entorno con su propia
credencial. Si alguna vez hace falta un PR, se saca el `deny`.

## Lo básico

- `npm test` antes de dar nada por bueno: pruebas de unidad más chequeos
  estáticos sobre el HTML.
- `npm run mirar` abre la app en un Chromium headless y saca capturas. Hay
  varias partidas de prueba: `npm run mirar mate`, `npm run mirar ahogado`.
  **Desde la v0.92 el arranque vive en dos módulos** y `mirar.mjs` lo usa en
  tres líneas: `pruebas/falso.mjs` arma la partida y el motor de mentira, y
  `abrirApp({ partida })` de `tira.mjs` levanta servidor, navegador y el camino
  de entrada. Una maqueta que necesite la app **con datos** —la pantalla entera,
  no un renglón— pide eso y no reescribe nada.
  **En una sesión remota hay que correr `npm install` primero** —el repo se
  clona limpio y Playwright no viene—; son 2 segundos, pero sin eso `mirar`
  explota con `ERR_MODULE_NOT_FOUND` y se pierde una corrida en descubrirlo.
- **Se pushea derecho a `main`, sin rama ni PR**, así que **cada push es un
  deploy en vivo**.
- **La rama `claude/*` que asigna la sesión se ignora**, no se pregunta por ella
  y no se pushea ahí: el trabajo va en `main`. Un hook `SessionStart` en
  `.claude/settings.json` ya deja el checkout parado en `main` al arrancar. Si
  alguna vez no corrió, el que corrige es `git checkout -B main origin/main`
  —**anclado a `origin/main`**, porque el `main` local que trae el contenedor
  viene viejo: llegó a estar 36 commits atrás—. Un `git checkout main` a secas
  te deja trabajando sobre una copia vieja sin que se note.
- **La versión de `index.html` tiene que subir en cada push que lo toque**, y
  hay que decirle al usuario cuál es la nueva: es lo que busca en la pantalla
  para saber si ya le llegó el cambio. Los tres niveles están en §10.
