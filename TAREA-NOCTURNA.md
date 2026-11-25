# La tarea nocturna

Instrucciones completas de lo que hace cada noche la tarea programada de
claude.ai/code/scheduled. **El prompt de la tarea solo apunta acá**, así que
para cambiar cómo trabaja de noche se edita este archivo y se commitea; no hace
falta tocar la tarea.

## El prompt para pegar en la tarea

```
Es la tarea nocturna del analizador de ajedrez. Leé TAREA-NOCTURNA.md en la
raíz del repo y seguilo al pie de la letra. Juan no está: no le preguntes nada
durante la noche; lo que dudes va al resumen de la mañana.
```

Repo: `JuanGonzalez99/analizador-ajedrez`. Una vez por noche, por ejemplo a las
2:13 de Buenos Aires.

---

## Qué hacer cada noche

0. **Los domingos, antes que nada: la revisión del criterio del revisor**
   (decisión de Juan, 7-nov-2026). Lanzá un agente aparte (no el revisor, que
   no se revisa a sí mismo) que lea `DISENO.md` §2 y §3, lo que se agregó en la
   semana (`git log --since="8 days ago" -- DISENO.md HOJA-DE-RUTA.md`) y
   `.claude/agents/revisor-ux.md`, y proponga **principios** en vez de casos:
   (desde el 22-nov también lee `APRENDIZAJES.md` y los archivos de los
   cuatro revisores: **una causa que se repitió pese a su prevención** pide
   una prevención más fuerte —casi siempre, de regla escrita a medida del
   arnés—, y los casos del registro se juntan en principios para que los
   archivos no crezcan sin fin)
   qué reglas generales salen de los gustos y de los errores, cuáles del
   criterio actual sobran o se contradicen. Aplicá lo que proponga a
   `revisor-ux.md` en un commit propio, y en el resumen de la mañana va como
   primera sección, **"El criterio del revisor"**: qué cambió, en una línea
   cada cosa, para que Juan lo apruebe o lo dé vuelta. Esa noche cuenta como
   un ítem.
   **Y los domingos, también: la pasada del revisor de ajedrez sobre partidas
   reales** (decisión de Juan, 17-nov-2026). Lanzalo con el usuario de
   chess.com **Santico26** (no es el de Juan, pero él dijo que se use porque
   tiene más partidas) para que recorra las tarjetas de varias partidas del mes
   y marque lo que no sea cierto, coherente o útil. Lo que encuentre entra a
   `HOJA-DE-RUTA.md` como ítems (lo que sea falso o incoherente, a
   "Arreglos"; las mejoras, a "Relleno") y va al resumen en una sección "Lo que vio el
   revisor de ajedrez". No cuenta como ítem de la noche.
   **Los miércoles: la revisión de código** (decisión de Juan, 18-nov-2026).
   Lanzá el agente `revisor-codigo` (`.claude/agents/revisor-codigo.md`) con
   la zona que dice la perilla "Revisor de código" de `HOJA-DE-RUTA.md`. Lo
   que proponga entra a la hoja de ruta como ítems sin tachar: los errores al
   final de "Arreglos", el resto al final de "Relleno" (regla "Cómo entra lo
   nuevo" de la hoja); actualizá en la perilla qué zona sigue. En el
   resumen de la mañana, una línea sin jerga ("Lo que vio el revisor de
   código"). No edita nada ni cuenta como ítem de la noche.
   **Y los miércoles, también: la tanda larga del mono** (decisión de Juan,
   21-nov-2026). `npm run mono -- --n 30` (~25 min, en segundo plano mientras
   se trabaja). Si no rompe nada, una línea en el resumen ("El mono: 30
   recorridos, nada roto"). Si rompe una regla, la falla entra a "Arreglos"
   de `HOJA-DE-RUTA.md` con la regla, la semilla y los pasos, y va al resumen
   en una línea sin jerga. Si la regla saltó sin un error de verdad, se
   ajusta la regla esa misma noche (§2 del traspaso, "El cuarto chequeo"). No
   cuenta como ítem de la noche.
   **Los sábados: la revisión de rumbo** (decisión de Juan, 20-nov-2026).
   Lanzá el agente `revisor-rumbo` (`.claude/agents/revisor-rumbo.md`).
   Aplicá los cambios que devuelva en un commit propio, antes de elegir el
   trabajo de la noche (puede cambiar cuál es el primero). En el resumen de la
   mañana va una sección **"El rumbo"** con sus dos o tres líneas. No cuenta como ítem de la noche.
1. **Arrancar.** El hook deja el checkout en `main`; confirmalo con
   `git status` (si no, `git checkout -B main origin/main`). **Y confirmá que
   estás en la punta de verdad**: `git fetch origin main` y que `git log -1`
   coincida con `origin/main`. El contenedor puede venir de un clon viejo, y
   una vez arrancó dos versiones atrás y quiso rehacer lo ya hecho.
   `npm install`.
   Leé `CLAUDE.md` y `HOJA-DE-RUTA.md` enteros, `NORTE.md` y `DISENO.md` por
   encima, y del traspaso **solo** §10 y las secciones que toque el ítem.
2. **Elegir el trabajo.** El primer ítem sin tachar de **la etapa en curso**
   de `HOJA-DE-RUTA.md` que no esté marcado `⏸ espera a Juan`; y, como mucho
   uno por noche, el primero de "Arreglos". Si todo lo que queda de la etapa
   espera a Juan, el primero de "Relleno". Si todo espera a Juan, **no hagas
   nada**: el resumen de la mañana dice eso y nada más.
   **Cuántos:** hasta dos ítems por noche, con la regla de la perilla "Por
   noche" de `HOJA-DE-RUTA.md`: el segundo solo si el primero quedó aprobado
   por el revisor. No hay otra regla de cuándo parar; si algo en otro archivo
   parece decir otra cosa, vale esta.
3. **Decisiones.** Las que serían de Juan: elegí tu recomendación, seguí, y
   anotala para el resumen. Las visuales chicas las toma el revisor contra
   `DISENO.md`. Las que el ítem marca `⏸` no se toman nunca de noche.
   **Variantes, cuando el ítem pide forma nueva** (un lavado de cara, una
   pantalla, una disposición) y no un ajuste de valores: dibujá de 3 a 4
   sobre la app de verdad con `pruebas/tira.mjs` (`tira()` para un pedazo,
   `pantallas()` para la pantalla entera), con al menos una que cambie la
   estructura y no solo tamaños. El revisor elige una, la elige con un
   ajuste, o dice **ninguna** y qué probar: en ese caso, otra tanda con esa
   dirección. Como mucho dos tandas; si sigue en "ninguna", no se aplica nada
   y se cuenta en el resumen, con las tiras. Lo que se aplica va igual al
   resumen **con la tira de todas y cuál ganó**, para que Juan pueda elegir
   otra.
   **Lo que no se aplica por respetar una decisión anterior de Juan** (el
   revisor propone algo que contradice algo que él eligió) va al resumen
   igual, **con una captura de cómo quedaba**: se le muestra para que decida,
   no se le aplica sin él.
3bis. **Prevenciones pendientes de `APRENDIZAJES.md`**: si hay, se hacen
   antes del ítem, en su propio commit, y no cuentan como ítem. Son lo que
   evita que vuelva a escaparse algo que ya se escapó.
4. **Construir.** Con las reglas de siempre: un cambio invasivo por tanda,
   el código se edita en `src/` (nunca `index.html` a mano: lo arma
   `npm run juntar`, y `npm test` junta solo),
   `npm test` verde, versión de `index.html` que sube (`src/registro.js`), traspaso actualizado en
   el mismo commit, PC en commits separados, y la comparación byte a byte de
   las capturas del celu contra las de antes del cambio.
   **Antes de pasárselo al revisor, mirá vos lo que él va a mirar** (22-nov):
   la zona en todos sus estados (scroll arriba y abajo, abierta y cerrada,
   hover y foco, cada opción de Ajustes, 386 y los dos lados de cada corte)
   y "¿dónde más vive esto?" (`revisor-ux.md`, "Cómo mirás"). Lo que el
   revisor encuentre que vos podías ver también es un aprendizaje, y tuyo.
   **Si el cambio toca lo que dice la tarjeta**, antes del revisor de
   ajedrez: `npm run frases` (todas las jugadas legales, como buena y como error, de las partidas de
   prueba, contra el último commit; `-- HEAD~1` si ya se commiteó) y mirar en
   el tablero cada familia de frases que cambió (v1.0.4: así se escapaba
   "Defiende" con el atacante comido). **Si se arregla una frase**, además
   `-- --frase <texto>`: lista todas las jugadas donde sale ahora, cambien o
   no, y cada una se mira contra todas las piezas que la sostienen (v1.0.6:
   la pareja de alfiles con el otro alfil colgado decía lo mismo antes y
   después, y la lista de diferencias no podía mostrarla).
   **Si el cambio agrega una regla a `DISENO.md`**, en la misma versión se
   busca en toda la app dónde más vale; lo que aparezca va a Relleno (causa
   B de `APRENDIZAJES.md`: las reglas se aplicaban solo donde nacían).
   **Si algo se acepta a sabiendas** ("se acepta", "queda así"), se escribe
   en el traspaso con esa palabra y su porqué: el revisor de rumbo lo vuelve a
   juzgar los sábados (causa E).
5. **Revisar.** Según la perilla "Revisor" de `HOJA-DE-RUTA.md`:
   - *después de cada cambio*: antes de pushear cada versión, lanzá el
     subagente `revisor-ux` con qué cambió y qué versión es. Si devuelve
     "corregir", corregí y volvé a pasarlo (como mucho dos vueltas; si sigue,
     no se pushea y se cuenta en el resumen).
   - *una vez al final*: una sola pasada sobre todo lo de la noche, antes del
     último push.
   **Si el revisor frena porque es un parche** sobre algo que pide lavado de
   cara (`revisor-ux.md`, "No se parcha lo que hay que rehacer"), el parche no
   se pushea: se vuelve atrás, si el parche es sobre lo que el ítem construye,
   el lavado se hace dentro del ítem, con variantes; si es sobre otra zona,
   va a "Relleno". **Y quien programa también lo dice**, antes de construir: si el
   ítem es mejorar una parte de una zona que se ve mal entera, no lo hace y
   propone el lavado (decisión de Juan, 9-nov-2026).
   **El revisor de ajedrez** (`.claude/agents/revisor-ajedrez.md`) corre
   además, con las mismas reglas de vueltas, cuando el cambio toca lo que la
   app dice de una partida: la explicación, las categorías, los cuadritos, las
   tablas del Mes o el análisis. Si el cambio es solo visual, no.
   Lo que el revisor deja en "dudas para Juan" lo decidís vos con su
   recomendación, y va a "Qué elegí por vos" en una línea. **Lo que deja en
   "lavado de cara" va a `HOJA-DE-RUTA.md`** como ítem nuevo sin tachar, al
   final de **"Relleno"** (o de "Arreglos" si es un error), con lo que dijo el
   revisor; y al resumen, en una línea. **No entra a la etapa en curso** salvo
   que sea un parche sobre lo que el mismo ítem construye (regla "Cómo entra
   lo nuevo", 20-nov: así se alargó la etapa 1).
5bis. **Aprender** (Juan, 22-nov: *"que no solamente diga 'hay que cambiar
   esto', sino también 'y por qué el que lo hizo no se dio cuenta'"*). Todo
   revisor devuelve, por cada hallazgo sobre algo que ya estaba o que quien
   programó podía ver, **por qué no se vio** y **qué prevención** lo evita.
   Esa misma noche: la prevención se aplica (la regla al archivo del agente
   que no lo vio, la captura o la medida a `mirar.mjs`, la prueba a
   `npm test`, el paso a este archivo), se anota una línea en el registro de
   `APRENDIZAJES.md`, todo en un commit propio, y va al resumen en "Lo que
   aprendimos". Si la prevención es código y no entra en la noche, va a
   "Prevenciones pendientes" de `APRENDIZAJES.md`, que la noche siguiente
   hace primero. No cuenta como ítem. Vale igual para el mono y para las
   pasadas de los domingos, miércoles y sábados.
6. **Pushear a `main`.** Cada push es un deploy en vivo, así que solo con todo
   verde. Si el push falla, no insistas más de cuatro veces y ponelo primero en
   el resumen.
7. **Cerrar.** Tachá en `HOJA-DE-RUTA.md` lo hecho (el revisor de rumbo lo
   muda los sábados a `HOJA-DE-RUTA-HECHO.md`), commit y push. Las
   dudas no se guardan en la hoja (Juan, 20-nov).

## El resumen de la mañana

Es el **último mensaje de la sesión**, y es lo único que Juan lee. **Cuenta,
no pregunta**: Juan no contesta los "no sé si esto te copa" (20-nov); lee lo
que se hizo y, si algo le parece raro, lo dice. Corto, en
castellano rioplatense, sin jerga de código, en este orden:

```
**Versión nueva: v0.XX** (o "no hubo cambios")

**Qué hice**
- una línea por cosa, dicha como se ve en la app

**Qué elegí por vos**
- qué decidí y por qué, en una línea; "si no te copa, se da vuelta"
- si hubo variantes: la tira, y cuál eligió el revisor
- lo que no apliqué por respetar algo que elegiste vos, con captura

**El rumbo** (solo los sábados): lo que dijo el revisor de rumbo

**Lo que aprendimos** (si hubo): qué se escapó, por qué, y qué se cambió
para que no vuelva, en una línea cada cosa

**Lavados de cara que vio el revisor** (si hay): qué zona, en una línea;
van a Relleno

**Necesito de vos** (solo si algo quedó trabado esperándote; si no, no va)
- qué, y como mucho dos opciones

(Las capturas van con SendUserFile, a 2x, y se nombran donde corresponda.)

**Lo que sigue** la próxima noche: una línea.
```

Si algo salió mal (un push que falló, una prueba que no pasa, algo que quedó
sin terminar), va **arriba de todo**, antes de la versión.

## Lo que no se hace de noche

- Nada que la hoja de ruta marque `⏸ espera a Juan`.
- Cambiar el sistema de diseño (`DISENO.md` §1): se propone en el resumen y no se aplica.
- Subir el número mayor. **La única excepción es la v1.0**, que Juan ya
  decidió (20-nov): sale con el ítem "Cierre: v1.0" de la hoja de ruta. La
  v2.0 y las siguientes las decide él.
- Borrar algo que Juan usa.
- Usar el MCP de GitHub, abrir PRs o pushear a otra rama que no sea `main`.
