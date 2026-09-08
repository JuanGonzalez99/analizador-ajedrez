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

## Lo básico

- `npm test` antes de dar nada por bueno: pruebas de unidad más chequeos
  estáticos sobre el HTML.
- `npm run mirar` abre la app en un Chromium headless y saca capturas. Hay
  varias partidas de prueba: `npm run mirar mate`, `npm run mirar ahogado`.
- **Se pushea derecho a `main`, sin rama ni PR**, así que **cada push es un
  deploy en vivo**.
- **La versión de `index.html` tiene que subir en cada push que lo toque**, y
  hay que decirle al usuario cuál es la nueva: es lo que busca en la pantalla
  para saber si ya le llegó el cambio. Los tres niveles están en §10.
