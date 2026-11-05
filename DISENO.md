# Diseño · sistema y gustos

Lo que usa el revisor de UX (`.claude/agents/revisor-ux.md`) para decidir solo
las cosas chicas. Dos partes: **el sistema de diseño**, que sale de la
auditoría de identidad visual (etapa 1 de `HOJA-DE-RUTA.md`), y **los gustos de
Juan**, que se anotan cada vez que dice "me copa" o "no me copa", con su porqué.

Se actualiza en el mismo commit que el cambio que lo motiva, igual que el
traspaso.

---

## 1. El sistema de diseño

**Todavía no existe.** Lo que hay hoy (v0.95) es lo que se fue acumulando:
`system-ui` a 16 px, colores que salen de `currentColor` con `color-mix`,
botones transparentes con borde, el esquema claro u oscuro que diga el
teléfono, y los colores de categoría en `:root` de `index.html`. No hay escala
de espacios ni de tipografía: cada tamaño se eligió en su momento.

Cuando Juan elija una de las direcciones de la etapa 1, acá van:

- **Color:** fondo, superficies, texto, texto tenue, línea, acento, y los
  colores de categoría (que ya existen y se respetan).
- **Tipografía:** familia, escala (cuántos tamaños y cuáles), pesos.
- **Espacios:** la escala (por ejemplo 4/8/12/16/24) y cuál va dónde.
- **Formas:** radios, bordes, sombras.
- **Botones y controles:** primario, secundario, chico, ícono; alto mínimo de
  toque.
- **Movimiento:** duraciones, curvas, qué pasa con `prefers-reduced-motion`.

Mientras no exista, el revisor decide contra Material Design y contra los
gustos de abajo, y **no inventa identidad**: un cambio chico se parece a lo que
ya hay.

---

## 2. Los gustos de Juan

Cada entrada: qué, si le copa o no, y el porqué con sus palabras cuando las
hay. Las primeras salen del historial del traspaso.

### Le copa

- **Modo oscuro**: usa el celu así (5-nov-2026).
- **La dirección A · Noche** (oscura, carbón frío, acento verde), y de la B ·
  Papel le quedó que *"tiene su encanto"*: títulos de libro y tablero de
  madera. Se le dibujaron dos mezclas y **se quedó con A** (5-nov-2026): es la
  base del sistema de diseño.
- **Que el revisor vaya revisando todo** (5-nov-2026).
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
- **El borde de la tarjeta con el color de la categoría**: dice más que un
  color fijo (v0.71, §4sexdecies).
- **La jerga en los textos**: *"me gusta la jerga. Quizás podamos apuntar
  nuestras frases a ese lado"*, a partir de "los chanchos en la séptima"
  (§4octodecies).
- **"Tablas" escrito y no `½-½`**: el glifo `½` a 9,5 px se lee apretado.
  Rompe la simetría con `1-0` y `0-1` a propósito (v0.62).
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
