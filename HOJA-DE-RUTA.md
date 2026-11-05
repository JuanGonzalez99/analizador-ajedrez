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
- **Por noche:** un ítem. Dos si el primero salió chico. Nunca se deja nada a
  medio hacer sin commitear: mejor uno más chico y entero.

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
- [ ] Escribir el sistema de diseño en `DISENO.md` §1 a partir de la elegida:
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
      **Claro y oscuro:** la oscura es la principal. La app sigue lo que diga
      el teléfono, y la clara se arma del mismo sistema, para el amigo de la
      PC (recomendación, va al resumen).
- [ ] Llevarlo al código como variables en `:root` de `index.html`, sin
      cambiar todavía nada que se vea (parche).
- [ ] Aplicarlo pantalla por pantalla, una versión cada una, con revisor:
      entrada y listado, revisión (tarjeta, tablero, tira, curva, cuadritos),
      vista del mes y sus tablas, hoja de ajustes.
- [ ] Repaso final del revisor sobre la app entera, celu y PC.

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
