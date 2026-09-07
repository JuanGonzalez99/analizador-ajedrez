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
- **Las capturas se sacan al tamaño de un celular**, no de una pantalla alta:
  su viewport ronda los **412 × 760 CSS**. Una captura de 1500 px de alto no
  deja dimensionar cuánto se ve de verdad.
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
