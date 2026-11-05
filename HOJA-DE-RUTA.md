# Hoja de ruta

De dónde sale lo que hace cada noche la tarea programada (`TAREA-NOCTURNA.md`).
El norte está en `NORTE.md`; esto es el orden. **Se toma siempre el primer
ítem sin tachar** que no esté marcado `⏸ espera a Juan`. Al terminar uno se
tacha acá, en el mismo commit.

**Estado: propuesta del 5-nov-2026, esperando el ok de Juan.** Hasta que diga
que sí, la tarea nocturna no arranca nada de acá.

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
- [ ] ⏸ espera a Juan: elegir una dirección (o una mezcla).
- [ ] Escribir el sistema de diseño en `DISENO.md` §1 a partir de la elegida:
      color, tipografía, escala de espacios, formas, botones, movimiento.
- [ ] Llevarlo al código como variables en `:root` de `index.html`, sin
      cambiar todavía nada que se vea (parche).
- [ ] Aplicarlo pantalla por pantalla, una versión cada una, con revisor:
      entrada y listado, revisión (tarjeta, tablero, tira, curva, cuadritos),
      vista del mes y sus tablas, hoja de ajustes.
- [ ] Repaso final del revisor sobre la app entera, celu y PC.

## Etapa 2 · Partir `index.html`

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

- ¿Cuál de las tres direcciones (A Noche, B Papel, C Material)?
- ¿Usás el teléfono en modo claro u oscuro? Hoy la app sigue lo que diga el
  teléfono.
