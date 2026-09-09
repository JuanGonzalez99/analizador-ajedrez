# Cómo trabajar en este repo

**El documento del proyecto es `TRASPASO.md`.** Ahí está todo: las decisiones
medidas, el mapa del archivo, las reglas de método y los pendientes. Leerlo
antes de tocar nada, y **actualizarlo en el mismo commit** que el cambio que
describe. §10 tiene las reglas de trabajo.

## Cómo hablar con el usuario

- **No usar la herramienta de tarjeta de preguntas (`AskUserQuestion`).** En el
  celular del usuario **se tilda al responder**: queda colgada y hay que
  reescribir la respuesta. Las opciones se ofrecen **en texto**, numeradas o con
  viñetas, y él contesta escribiendo.
- **Antes de cualquier decisión visual, mostrar cómo va a quedar y esperar el
  ok.** Vale para todo lo que se ve, no solo para las tablas: el texto de una
  etiqueta, la forma de una marca, cuánto se llena una barra. Se dibuja con el
  arnés (`npm run mirar`), se mandan las alternativas y él elige mirando. Ya
  evitó dos cambios que no le gustaban y destapó uno que se había colado.
- **EXCEPCIÓN, y es decisión suya (v0.85–v0.90): lo que se ve SOLO en PC no lo
  revisa.** Sus palabras: *"no voy a revisar nada de lo que sea solo PC"*, y
  *"no te frenes cuando termines cada punto"*. O sea que ahí se aplica y se
  cuenta, en commits separados, y se le resume al final. **La regla de arriba
  sigue entera para todo lo que se vea en el celular**, que es donde usa la app.
  Lo que reemplaza a la mirada suya en lo de PC es **comparar byte a byte las 28
  capturas de celular contra la versión anterior**, en cada versión: es lo único
  que prueba que un cambio de PC no se filtró al celu. Sale así, y con las de la
  tanda anterior guardadas en un directorio aparte:
  `for f in viejas/*.png; do cmp -s "$f" "capturas/$(basename $f)" || echo "$f"; done`
  —salteando las que empiezan con `ancho`, `tres`, `marcas` y `previa`, que son
  las de PC y tienen que cambiar—.
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
  tres columnas a 3000×1600 (**~6.400**). Son **45** y mirarlas todas serían
  ~116.000 tokens, o sea más que el archivo entero. Se miran una o dos, las que
  contestan la pregunta; el resumen de texto que imprime el arnés son 400 tokens
  y suele alcanzar.

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
