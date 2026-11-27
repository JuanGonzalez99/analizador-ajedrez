let Chess;
try {
  ({ Chess } = await import("./chess.js"));
} catch (e) {
  window.mostrarError("chess.js", e.message || e);
  throw e;
}

/* ==========================================================================
   Lo que sigue es el bloque de análisis: no toca el DOM ni el motor, así que
   se puede extraer tal cual a un archivo suelto y probarlo aparte. Va acá
   adentro para que la página no dependa de traer un segundo archivo.
   ========================================================================== */

/* ============ evaluación ============ */
const TOPE = 1000;

function aBlancas(ev, turno) {
  let cp;
  if (ev.mate !== null && ev.mate !== undefined) cp = ev.mate > 0 ? 10000 : -10000;
  else cp = ev.cp === null || ev.cp === undefined ? 0 : ev.cp;
  if (turno === "b") cp = -cp;
  return Math.max(-TOPE, Math.min(TOPE, cp));
}

/* probabilidad de victoria — curva de lichess, documentada en §E del apéndice */
function winPct(cp) {
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368 * cp)) - 1);
}

/* precisión de una jugada a partir de cuántos puntos de probabilidad perdió */
function precisionJugada(caidaPuntos) {
  const v = 103.1668 * Math.exp(-0.04354 * caidaPuntos) - 3.1669;
  return Math.max(0, Math.min(100, v));
}

/* LA PRECISIÓN SIN EL LIBRO (v0.174, revisor de ajedrez): el promedio de las
   jugadas FUERA del libro, como la tasa de la mejor del Mes (`tasa`,
   `fueraDeLibro`): en el libro no se elige, y contarlas inflaba las partidas
   cortas. La usan los cuatro lugares que promedian —inicio y lista del Mes
   (`precisionDe`), cabecera del Mes, Resumen de la Partida y el banco— para
   que ninguno diga otro número. Sin jugadas fuera del libro: null. */
function precisionMedia(fs) {
  const fuera = fueraDelLibro(fs);
  return fuera.length ? fuera.reduce((a, x) => a + x.precision, 0) / fuera.length : null;
}
/* la mediana de la pérdida, sobre las MISMAS jugadas que la precisión: van en
   la misma caja (revisores, v0.174). Las de libro pierden ~0 y la achataban. */
function medianaFuera(fs) {
  const fuera = fueraDelLibro(fs);
  return fuera.length ? mediana(fuera.map(f => f.perdida)) : null;
}
function fueraDelLibro(fs) { return fs.filter(f => f.cat !== "libro"); }

/* ============ geometría ============ */
const VALOR = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

/* LAS PIEZAS COMIDAS (v0.87). Salen del FEN y no cuestan motor: se cuenta lo que
   hay en el tablero y se resta de lo que había al empezar.

   LA CUENTA DE COMIDAS ES APROXIMADA CUANDO HAY CORONACIÓN, y no se puede
   arreglar mirando una sola posición: un peón blanco coronado en dama deja al
   blanco con 7 peones y 2 damas, o sea que la resta dice "el negro le comió un
   peón" y que no le comió ninguna dama. Es la misma aproximación que hacen
   lichess y chess.com, y la alternativa sería recorrer la partida entera para
   cada posición. Se elige a sabiendas.

   LA DIFERENCIA DE MATERIAL NO SE SACA DE LAS COMIDAS SINO DEL TABLERO, y eso sí
   es exacto con coronaciones: se suma lo que hay de cada lado. Son dos números y
   por eso salen de dos lugares distintos —el de arriba puede mentir, el de abajo
   no—, que es justo lo que se quiere: la fila de piezas cuenta la historia y el
   número dice el estado. */
const INICIALES = { q: 1, r: 2, b: 2, n: 2, p: 8 };
const ORDEN_COMIDAS = ["q", "r", "b", "n", "p"];
/* `desde` (v1.5): una partida jugada desde una posición no arranca con el
   juego completo, y contra INICIALES K+P contra K "había comido" todo
   (revisor de UX). Lo que falta se cuenta contra su arranque. */
function contarPiezas(fen) {
  const hay = { w: { q: 0, r: 0, b: 0, n: 0, p: 0 }, b: { q: 0, r: 0, b: 0, n: 0, p: 0 } };
  for (const fila of new Chess(fen).board()) for (const c of fila)
    if (c && c.type !== "k") hay[c.color][c.type]++;
  return hay;
}
function piezasComidas(fen, desde = null) {
  const hay = contarPiezas(fen);
  const base = desde ? contarPiezas(desde) : { w: INICIALES, b: INICIALES };
  let dif = 0;
  for (const col of ["w", "b"]) for (const t of ORDEN_COMIDAS)
    dif += (col === "w" ? 1 : -1) * VALOR[t] * hay[col][t];
  /* `faltan.w` son piezas BLANCAS que ya no están, o sea lo que comió el negro */
  const faltan = col => {
    const o = {};
    for (const t of ORDEN_COMIDAS) {
      const n = base[col][t] - hay[col][t];
      if (n > 0) o[t] = n;
    }
    return o;
  };
  return { w: faltan("w"), b: faltan("b"), dif };
}

/* ¿la jugada `m` le deja la dama propia a tiro de algo que no es una dama?
   (v0.180.1, revisor de ajedrez) Es la clavada contra la dama: chess.js solo
   frena la pieza clavada contra el rey, así que un peón de e6 que come en d5
   y destapa la dama de e8 a la torre de e1 contaba como una captura más. Se
   compara contra los ataques de antes, con el turno dado vuelta: lo que ya
   estaba atacado no es culpa de esta jugada. La dama que se mueve ella misma
   no entra: su riesgo ya lo cuenta el cambio.
   Devuelve null, o la pieza más barata que ahora ataca la dama y si la dama
   está defendida (o sea, si comerla le cuesta esa pieza). */
function destapaLaDama(fen, m) {
  if (m.piece === "q") return null;
  const atacan = f => new Chess(f).moves({ verbose: true })
    .filter(x => x.captured === "q" && x.piece !== "q");
  const j = new Chess(fen);
  try { if (!j.move(m)) return null; } catch (e) { return null; }
  const despues = atacan(j.fen());
  if (!despues.length) return null;
  const p = fen.split(" ");
  p[1] = p[1] === "w" ? "b" : "w"; p[3] = "-";
  let antes;
  try { antes = new Set(atacan(p.join(" ")).map(x => x.from + x.to)); } catch (e) { antes = new Set(); }
  const nuevas = despues.filter(x => !antes.has(x.from + x.to))
    .sort((a, b) => (a.piece === "k" ? 100 : VALOR[a.piece]) - (b.piece === "k" ? 100 : VALOR[b.piece]));
  if (!nuevas.length) return null;
  const x = nuevas[0], j2 = new Chess(j.fen());
  j2.move(x);
  return { pieza: x.piece, defendida: j2.moves({ verbose: true }).some(y => y.to === x.to) };
}
/* LA CAPTURA QUE ENTREGA LA DAMA NO CUENTA solo si lo que come, más lo que
   cuesta cobrarle la dama, no llega a una dama (revisor de ajedrez, v0.180.1):
   Qd5?? exd5 Rxe8+ Kxe8 deja al negro una torre arriba, así que exd5 sigue
   siendo una captura de verdad y "queda comible" se sigue diciendo. */
function entregaLaDama(fen, m) {
  const d = destapaLaDama(fen, m);
  if (!d) return false;
  return (VALOR[m.captured] || 0) + (d.defendida && d.pieza !== "k" ? VALOR[d.pieza] : 0) < VALOR.q;
}

/* ¿la pieza parada en `sq` se la llevan sin devolución? Ni la captura ni la
   devolución cuentan si entregan la dama (`entregaLaDama`).
   `comido` es lo que la jugada se llevó al llegar (revisor de ajedrez,
   22-nov): Qxf6 Nxf6 es un cambio de damas, no "tu dama queda comible".
   Cuenta solo si lo que se pierde menos lo comido llega a un peón. */
function quedaComible(fenDespues, sq, comido = 0) {
  const j = new Chess(fenDespues);
  const aca = j.get(sq);
  if (aca && aca.type !== "k" && (VALOR[aca.type] || 0) - comido < 1) return false;
  const capturas = j.moves({ verbose: true })
    .filter(m => m.to === sq && !entregaLaDama(fenDespues, m));
  if (!capturas.length) return false;
  for (const c of capturas) {
    const j2 = new Chess(fenDespues);
    j2.move(c);
    const f2 = j2.fen();
    if (!j2.moves({ verbose: true }).some(m => m.to === sq && !entregaLaDama(f2, m))) return true;
  }
  return false;
}

/* EL CAMBIO EN UNA CASILLA (20-nov, revisor de ajedrez): cuánto gana el que
   mueve en `fen` cambiando en `sq`, con la jugada que más le conviene en cada
   paso y pudiendo parar cuando seguir le cuesta. Es el "static exchange" de
   los motores: se come siempre con la pieza más barata (el rey, la última), y
   la legalidad la pone chess.js, así que una pieza clavada no recaptura, y
   desde la v0.180.1 tampoco la clavada contra su dama (`entregaLaDama`).
   `quedaComible` contesta otra pregunta —¿hay recaptura?— y por eso con
   Qe1 Rxe1 Kxe1 daba falso aunque el cambio pierda la dama por una torre.
   Devuelve el neto y la línea de capturas.

   LO QUE DEJA LA PIEZA QUE COME (v1.0.2, Juan sobre la v0.178.1): la cuenta
   miraba solo la casilla. En `r1b1k1nr/pppp1pQp/2n2q2/8/2B1P3/8/PPP2PPP/RNB1K2R w`,
   Bh6 Nxh6 daba "pierde el alfil", pero el caballo de g8 cuidaba la dama de
   f6 y sigue Qxf6. Ahora, en la PRIMERA captura (la del rival sobre la pieza
   que se movió), el que movió puede recapturar o cobrar lo que esa captura
   dejó colgado (`loQueDeja`), lo que le dé más; y como la más barata ya no es
   siempre la mejor, se prueban todas. Si cobra afuera, `cobra` dice qué
   pieza: la frase la nombra entre las del rival. Solo en la primera, a
   propósito: más abajo una pérdida que se suma por lo que deja una
   recaptura no la nombraría la línea, y la frase diría un cambio parejo.
   Y es lo que cuesta: con todas las capturas costaba diez veces más. */
function cambioEn(fen, sq, prof = 0, mirarDeja = true) {
  const nada = { neto: 0, linea: [] };
  if (prof > 12) return nada;
  const j = new Chess(fen);
  const caras = t => t === "k" ? 100 : (VALOR[t] || 0);
  const capt = j.moves({ verbose: true })
    .filter(m => m.to === sq && m.captured && (!m.promotion || m.promotion === "q") &&
                 !entregaLaDama(fen, m))
    .sort((a, b) => caras(a.piece) - caras(b.piece));
  const deja = mirarDeja && prof === 0;
  let mejor = nada;
  for (const m of deja ? capt : capt.slice(0, 1)) {
    const j2 = new Chess(fen);
    j2.move(m);
    const r = cambioEn(j2.fen(), sq, prof + 1, false);
    const afuera = deja && (VALOR[m.captured] || 0) - r.neto > mejor.neto ? loQueDeja(j2.fen(), m) : null;
    const neto = (VALOR[m.captured] || 0) - Math.max(r.neto, afuera ? afuera.neto : 0);
    if (neto > mejor.neto)
      mejor = afuera && afuera.neto > r.neto ? { neto, linea: [m], cobra: afuera.entera ? afuera.pieza : null }
                                             : { neto, linea: [m, ...r.linea] };
  }
  return mejor;
}
/* ¿qué dejó colgado la captura `m`, que llevó a `despues`, fuera de la
   casilla del cambio? Lo más que el que mueve en `despues` gana cambiando en
   otra casilla, contra lo que ganaba ahí con la pieza que comió todavía en su
   casilla de salida: así cuenta solo lo que esa pieza cuidaba (o tapaba), y
   no lo que ya estaba colgado. Se compara así y no dando vuelta el turno de
   la posición de antes porque con un jaque esa posición no es legal (Bxf7+:
   el rey en jaque no podía recapturar en la cuenta, y la torre parecía
   colgada desde antes). Solo se miran las casillas que el otro puede comer.
   Devuelve null o { neto, pieza }. */
function loQueDeja(despues, m) {
  const j = new Chess(despues), yo = j.turn() === "w" ? "b" : "w";
  const blancos = [...new Set(j.moves({ verbose: true })
    .filter(x => x.captured && x.captured !== "k" && x.to !== m.to).map(x => x.to))];
  if (!blancos.length) return null;
  const sinMover = new Chess(despues);
  sinMover.remove(m.to);
  sinMover.put({ type: m.piece, color: yo }, m.from);
  const fenSin = sinMover.fen();
  let peor = null;
  for (const x of blancos) {
    const ahora = cambioEn(despues, x, 1, false).neto;
    if (ahora <= (peor ? peor.neto : 0)) continue;
    const gana = ahora - cambioEn(fenSin, x, 1, false).neto;
    /* `entera`: con la pieza en su casilla ahí no se ganaba nada. Si ya se
       ganaba algo (revisor de ajedrez: Ng5 Nxg5 con bxc3 ya posible), lo que
       suma es la diferencia y la pieza no se nombra entera */
    if (gana > (peor ? peor.neto : 0)) peor = { neto: gana, pieza: j.get(x).type, entera: gana === ahora };
  }
  return peor;
}

/* ganancia estimada de una captura: lo que como menos lo que me pueden devolver */
function gananciaDeCaptura(fen, mov) {
  const j = new Chess(fen);
  const hecho = j.move(mov);
  if (!hecho || !hecho.captured) return 0;
  const gana = VALOR[hecho.captured] || 0;
  const recaptura = j.moves({ verbose: true }).some(m => m.to === hecho.to);
  return recaptura ? gana - (VALOR[hecho.piece] || 0) : gana;
}

/* ¿Había una buena captura? La decide el MOTOR, no la heurística de material:
   es buena cuando la mejor jugada del motor es una captura Y además gana
   material. Las dos condiciones, porque solo con la primera se llenaba de
   recapturas e intercambios que se ven sí o sí.

   Antes lo decidía una búsqueda de material a un ply, y entonces convivían dos
   jueces: el material para decir que había captura y el motor para decir que
   la jugada fue mala. Cuando discrepaban salía la fila sin sentido "había
   captura ganadora, la tomé, y fue mala": lo que pasaba de verdad es que la
   captura nunca había sido buena y la heurística la etiquetó mal. Lo mismo
   valía para la categoría "Omisión", que usaba el mismo juez equivocado. */
function capturaBuena(fen, mejorUci) {
  if (!mejorUci || mejorUci.length < 4) return null;
  const mov = { from: mejorUci.slice(0, 2), to: mejorUci.slice(2, 4),
                promotion: mejorUci[4] || undefined };
  /* gananciaDeCaptura da 0 si no es captura, así que el >= 1 pide las dos cosas */
  const gana = gananciaDeCaptura(fen, mov);
  if (gana < 1) return null;
  const j = new Chess(fen);
  const hecho = j.move(mov);
  /* `comida` es la pieza que se capturaba, y se sabe con certeza: la devuelve
     chess.js. `gana` es otra cosa —el valor NETO, ya restada la recaptura—, y
     por eso van los dos: con los dos se puede decir "se llevaba el caballo"
     cuando nadie recapturaba, y "ganaba 2 peones en el cambio" cuando sí. */
  return hecho ? { san: hecho.san, gana, comida: hecho.captured } : null;
}

/* ============ categorías ============ */
const CATEGORIAS = {
  brillante:  { nombre: "Brillante",   icono: "!!", desc: "Un sacrificio que además es la mejor jugada." },
  genial:     { nombre: "Genial",      icono: "!",  desc: "La única que sostiene la posición, o la que cambia el rumbo." },
  mejor:      { nombre: "Mejor",       icono: "★",  desc: "La primera elección del motor." },
  excelente:  { nombre: "Excelente",   icono: "☆", desc: "Casi tan buena como la mejor." },
  bien:       { nombre: "Bien",        icono: "✓",  desc: "Una buena jugada, pero no la mejor." },
  libro:      { nombre: "Libro",       icono: "▤", desc: "Jugada de apertura conocida." },
  imprecision:{ nombre: "Imprecisión", icono: "?!", desc: "Una jugada débil." },
  error:      { nombre: "Error",       icono: "?",  desc: "Empeora la posición." },
  omision:    { nombre: "Omisión",     icono: "✗",  desc: "Había mate o material y se dejó pasar." },
  grave:      { nombre: "Error grave", icono: "??", desc: "Pierde material o la partida." }
};

const ORDEN = ["brillante", "genial", "mejor", "excelente", "bien", "libro",
                      "imprecision", "error", "omision", "grave"];


/* FORZADA no es una categoría y por eso NO está en CATEGORIAS ni en ORDEN.
   Cuando hay una sola jugada legal no hay nada que juzgar: no la elegiste, te
   tocó. Contarla entre las categorías mentiría en las dos direcciones —sumaría
   "Mejor" que no son mérito, y el denominador de las tasas incluiría jugadas
   donde no había decisión que tomar—.
   Vive solo en la pantalla de revisión, que es donde sirve: mirando la partida
   querés saber que ahí no había nada que pensar. Las tablas siguen viendo la
   categoría de siempre, y por eso `forzada` tampoco viaja en la fila flaca. */
const FORZADA = { nombre: "Forzada", icono: "\u2192",
                  desc: "Era la única jugada legal." };

/* Lo que se dibuja para una fila: la forzada tapa a la categoría, y devuelve
   también la clave del color para que los dos lugares que pintan —la tarjeta
   del veredicto y la tira de jugadas— no se separen nunca. */
const presentar = f => f.forzada ? { ...FORZADA, clave: "forzada" }
                                 : { ...CATEGORIAS[f.cat], clave: f.cat };

/* ============ la curva de quién va ganando ============ */

/* Qué categorías se marcan encima de la curva. NO van todas: "Mejor",
   "Excelente", "Bien", "Libro" y "Forzada" son la enorme mayoría de las
   jugadas, así que marcarlas alfombra la tira y no distingue nada. Quedan las
   que valen la pena buscar —las dos buenas de verdad y las cuatro malas—, que
   además son las que ya tienen símbolo y color propios en la tira de jugadas.
   La lista se comparte con nadie a propósito: la tira de jugadas las pinta a
   todas porque ahí hay lugar; acá no lo hay. */
const CATS_EN_LA_CURVA = new Set(["brillante", "genial", "imprecision", "error",
                                  "omision", "grave"]);

/* La curva de quién va ganando, en un cuadrado de 100 x 100 con el 0 ARRIBA,
   que es como mide el SVG. Es pura: devuelve puntos, no dibujo.

   EL EJE VERTICAL ES `winPct` Y NO LOS CENTIPEONES, y esa era la decisión que
   estaba pendiente. Con centipeones un +9 aplasta todo lo demás contra el
   borde y la partida entera queda en una franja de dos píxeles. `winPct` ya
   está en la app —es la misma curva que llena la barra de evaluación y la que
   da la caída en puntos de victoria—, así que la curva y la barra dicen
   exactamente lo mismo y no hay una escala nueva que aprender. El aplastamiento
   lo resuelve sola: con TOPE en 1000 centipeones los extremos caen en 2,5% y
   97,5%, o sea que la línea nunca toca el borde y siempre se ve.

   EL PUNTO 0 ES LA POSICIÓN ANTES DE LA PRIMERA JUGADA, y sale de `franja`
   —`antesMio`, en peones desde el que mueve— y no de una suposición de que la
   partida arranca igualada: un PGN desde una posición cualquiera arranca donde
   arranca. Por eso hay N+1 puntos para N jugadas.

   `lado` y `verAmbos` son la misma regla que usa la tira de jugadas: sin saber
   de qué lado jugaba el usuario se marcan todas. */
function curvaVentaja(filas, lado, verAmbos) {
  if (!filas.length) return { puntos: [], marcas: [] };
  const N = filas.length;
  const ejeX = k => k * 100 / N;
  const ejeY = cp => 100 - winPct(cp);

  const f0 = filas[0];
  const inicio = (f0.turno === "w" ? f0.franja : -f0.franja) * 100;
  const puntos = [{ x: ejeX(0), y: ejeY(inicio) }];
  filas.forEach((f, i) => puntos.push({ x: ejeX(i + 1), y: ejeY(f.evalBlancas) }));

  const marcas = [];
  filas.forEach((f, i) => {
    const p = presentar(f);
    if (!CATS_EN_LA_CURVA.has(p.clave)) return;
    if (lado && !verAmbos && f.turno !== lado) return;
    marcas.push({ i, x: ejeX(i + 1), y: ejeY(f.evalBlancas), clave: p.clave });
  });
  return { puntos, marcas };
}

/* De un toque sobre la tira a un índice de jugada. `t` es la fracción del ancho,
   de 0 a 1. Es la inversa de `ejeX`: el punto k está en k/N, y el punto k es la
   jugada k-1 porque el 0 es la posición inicial. Vive acá y no en el manejador
   para que se pueda probar sin un DOM. */
function jugadaEnLaCurva(t, n) {
  if (n <= 0) return -1;
  /* desde la v0.124 el punto 0 también se puede elegir: es la posición inicial,
     que es IDX = -1 */
  return Math.max(-1, Math.min(n - 1, Math.round(t * n) - 1));
}

/*
  DOS MODOS. Cambian SOLO las etiquetas: la pérdida en centipeones y la mediana
  son las mismas en los dos, para que la línea de base del apéndice siga
  sirviendo de referencia.

  - crítico: corta por centipeones perdidos (0.5 / 1 / 3), la convención de
    lichess y del apéndice. Señala el desplome desde posición ganada, que es
    el punto ciego principal del usuario.
  - amigable: corta por puntos de victoria perdidos, como la clasificación V2
    de chess.com. La curva es casi plana en los extremos, así que un desplome
    de +10 a +6 casi no se castiga.

  Una jugada grave en crítico y buena en amigable ES, por construcción, un
  desplome desde posición ganada.
*/
const CORTES = {
  critico:  { excelente: 0.1, imprecision: 0.5, error: 1, grave: 3, medida: f => f.perdida },
  amigable: { excelente: 2,   imprecision: 5,   error: 10, grave: 20, medida: f => f.caida }
};

/* MATE A LA VISTA. Hasta cuántas jugadas de mate cuentan como una oportunidad
   que se podía ver.

   No es una perilla de medición: es la misma pregunta que "Modo" —qué tan duro
   te juzga la app— y por eso es del usuario. Un mate en 8 marcado como omisión
   a 570 de Elo no enseña nada, porque nadie a ese nivel lo iba a encontrar; un
   mate en 2 soltado sí. El valor sube a medida que el jugador mejora, así que
   funciona como un dial de entrenamiento y no como un umbral fijo.

   Es también lo que impide que la regla de abajo se dispare de más: sin corte,
   toda partida ganada se llenaría de omisiones por mates de quince jugadas. */
const MATE_A_LA_VISTA = 3;

/* bandas de la posición, en peones y desde el lado del que mueve */
const banda = x => x <= -2 ? "perdiendo" : x >= 2 ? "ganando" : "parejo";

/* ¿Es Genial? Solo se pregunta para la mejor del motor (lo filtra `categorizar`). */
function esGenial(d) {
  /* Genial: la única jugada que sostiene la posición, O la que cambia de banda.
     La segunda mitad venía de chess.com y nos faltaba, y es justo el momento
     que el apéndice marca como más peligroso: el cruce a posición ganada. */
  const cruce = banda(d.antesMio) !== banda(d.despuesMio) &&
                banda(d.despuesMio) !== "perdiendo";
  /* Una RECAPTURA no es un hallazgo, y era el falso positivo que destapó el
     usuario: recapturar con un peón salía "Genial".

     El motivo es que `unicaBuena` mide "la posición estaba forzada" —la mejor le
     saca 150 centipeones a la segunda— y eso es lo CONTRARIO de "encontraste
     algo difícil". Después de que te comen algo, recuperar vale más que
     cualquier otra jugada, así que el hueco de 150 se abre solo.

     Medido contra chess.com: `10… fxe6` da 152 a profundidad 16 y 160 a la 20,
     o sea que dispararía a cualquier profundidad —no es que midamos poco
     hondo—, y ellos no la marcan. Es lo único de todo lo que probamos que
     aguantó los dos caminos.

     Se aplica a las DOS mitades de la regla. La evidencia es sobre `unicaBuena`,
     porque es por donde entró, pero una recaptura tampoco es un hallazgo cuando
     cambia de banda: la ibas a jugar igual. */
  return (d.unicaBuena || cruce) && d.legales >= 2 && !d.esRecaptura;
}

function categorizar(d, modo = "critico") {
  const c = CORTES[modo] || CORTES.critico;
  const x = c.medida(d);

  if (d.esLibro) return "libro";
  /* Un mate forzado soltado es Omisión valga lo que valga en centipeones.
     El corte de pérdida está SATURADO justo donde la omisión más importa: si
     vas ganando por mate y lo soltás, la evaluación casi no se mueve —en la
     partida que lo destapó, 0,20 peones— así que nunca llegaba al corte de 1 y
     la omisión no se disparaba NUNCA. La app veía el mate y hasta lo escribía
     en la señal; lo que fallaba era la etiqueta.
     CUÁL mate cuenta como oportunidad lo decide MATE_A_LA_VISTA, arriba, no
     esta línea: acá ya llega decidido. */
  /* LA MEJOR DEL MOTOR NO PUEDE SER MALA (v0.134, H4 de la revisión; el 17.
     Bxe2 de Juan salía Imprecisión). "Mejor" es "jugaste la que el motor
     eligió" y "Error" es "perdiste contra lo que el motor eligió": las dos no
     pueden ser ciertas a la vez. La pérdida que aparece igual es ruido entre dos
     búsquedas separadas (la de antes y la de después), y la de antes ya tiene
     adentro lo que la posición costaba. Medido: 22 de 373 mejores salían
     Imprecisión o Error a profundidad 16.
     Por eso el bloque de `esMejor` va arriba de los cortes. La Omisión no se
     pierde: `oportunidad` no puede existir junto con `esMejor` (las dos formas
     de armarla lo excluyen). */
  if (d.esMejor) {
    /* Brillante: un sacrificio bueno. Las dos condiciones son de chess.com y a
       la nuestra le faltaban: no quedar peor después, y no venir ya ganando de
       todos modos — entregar material en +10 no tiene mérito. */
    if (d.entrega && d.despuesMio >= -0.5 && d.antesMio < 3) return "brillante";
    if (esGenial(d)) return "genial";
    return "mejor";
  }

  /* EL ERROR GRAVE VA ANTES QUE LA OMISIÓN DE MATERIAL (v0.134, H1). Si la
     jugada perdió 6 peones, lo que pasó es eso, y no que había una captura que
     ganaba uno: salía "Omisión: había Qxg3, que ganaba un peón" sobre una
     jugada que perdía 5,92 (20 de 42 omisiones medidas tenían pérdida >= 3).
     La frase de lo que había se sigue diciendo en la tarjeta.
     El mate soltado sigue siendo Omisión valga lo que valga: con el tope de
     1000, soltar un mate y quedar +6 "pierde 4" de pura saturación. */
  const omiteMate = d.oportunidad && d.oportunidad.tipo === "mate";
  if (omiteMate || (d.oportunidad && x >= c.error && x < c.grave)) return "omision";
  if (x >= c.grave) return "grave";
  if (x >= c.error) return "error";
  if (x >= c.imprecision) return "imprecision";

  if (x < c.excelente) return "excelente";
  return "bien";
}

function textoEval(ev, turno) {
  /* `mate 0` es la partida terminada: el que mueve está mateado. "M0" es como
     lo dice el motor y no como lo diría una persona. Quién ganó ya lo dice la
     barra, que en esa posición está llena de una sola punta. */
  if (ev.mate === 0) return "mate";
  if (ev.mate !== null && ev.mate !== undefined) {
    const blancasGanan = (ev.mate > 0) === (turno === "w");
    return (blancasGanan ? "M" : "-M") + Math.abs(ev.mate);
  }
  const cp = turno === "b" ? -(ev.cp || 0) : (ev.cp || 0);
  return (cp >= 0 ? "+" : "") + (cp / 100).toFixed(2);
}

/* El mismo número, acortado para la barra VERTICAL (v0.105). La barra mide 40
   de ancho, 38 adentro del borde, y el número va en el mínimo del sistema, 11
   (§1.4): medido en Chromium, "+9.99" y "+10.0" ocupan 31 px y "+10.00", 38,5,
   o sea que no entra.
   Así que de 10 para arriba va con un decimal, y de 100 para arriba sin
   ninguno. Antes se resolvía achicando la letra a 8 —debajo del mínimo— y el
   número largo se leía peor justo cuando la partida está más definida. La
   barra horizontal y la tarjeta tienen lugar y siguen con los dos decimales. */
function textoBarra(t) {
  const m = /^([+-])(\d+\.\d\d)$/.exec(t);
  if (!m) return t;
  const v = Number(m[2]);
  if (v >= 100) return m[1] + Math.round(v);
  if (v >= 10) return m[1] + v.toFixed(1);
  return t;
}

/* La partida terminada EN EL TABLERO, o null si la posición sigue viva.

   La distinción es la que decide si se pisa la evaluación con el resultado, y
   es de fondo: en una posición terminal NO HAY EVALUACIÓN QUE PERDER. El
   `mate 0` del mate y el `cp 0` del ahogado no son la opinión del motor sobre
   la posición, son la regla del juego. Poner "1-0" ahí no tapa nada.

   En cambio una partida abandonada o perdida por tiempo termina en una posición
   viva, y ahí el −8,16 sí dice algo —qué tan perdido estabas— que "0-1" taparía.
   Por eso esas NO se tocan.

   Se lee del FEN pelado, que es lo único que hay acá, y eso alcanza para el
   mate, el ahogado, el material insuficiente y la regla de las 50 jugadas —el
   contador va en el propio FEN—.

   LO QUE NO CAZA es la triple repetición, que no está en el FEN sino en la
   historia de la partida: chess.js la mira sobre las jugadas jugadas, y acá se
   arranca de una posición suelta. Una partida tablas por repetición o por
   acuerdo sigue mostrando la evaluación, que es lo mismo que hace con un
   abandono. */
function remateEnTablero(fen) {
  const c = new Chess(fen);
  if (c.in_checkmate()) return c.turn() === "w" ? "0-1" : "1-0";
  if (c.in_draw()) return "tablas";
  return null;
}

/* Devuelve una CLAVE y no el texto, y el texto vive acá. Es para que cambiar
   cómo se llama sea una línea y no una cacería: "½-½" duró una versión —el
   glifo es diminuto a los 9,5 px del número de la barra y se leía apretado—
   y "Tablas" se eligió mirando las seis formas dibujadas al tamaño real.
   Rompe la simetría con 1-0 y 0-1, a propósito: esos dos se leen y ½-½ no. */
const TEXTO_REMATE = { "1-0": "1-0", "0-1": "0-1", tablas: "Tablas" };

/* Cuánto se llena la barra de evaluación, de 0 a 100 y desde las blancas.

   El tope de 2 y 98 existe para que la barra nunca se vea vacía: con la
   evaluación en su máximo queda siempre una astilla del otro color, y esa
   astilla dice "todavía se puede dar vuelta". Los dos casos que se lo saltean
   son los dos donde eso sería mentira o inútil:

   1. LA PARTIDA TERMINADA. Ya no hay nada que dar vuelta.

   2. EL MATE FORZADO, y este es el que no era obvio. La evaluación se topea en
      1000 (`TOPE`), así que un mate en 5 y un +9,90 pintan casi la misma barra:
      97,5% contra 97,2%. Es LA MISMA SATURACIÓN que obligó a inventar "Omisión"
      en la v0.53 —soltar un mate movía la pérdida 0,20 y nunca llegaba al
      corte—, solo que en la barra y sin que nadie la hubiera mirado. Llenarla
      entera desatura lo único que la escala no puede expresar, y hace visible
      el mate que se escapa: la barra estaba llena y se despega.

      La partida sigue viva y el mate se puede soltar, sí. Eso lo dice el
      número, que sigue siendo "M5"; ver que se escapó es más útil que que te
      recuerden que se puede escapar.

   LA CURVA NO SE TOCA, y es una decisión y no un olvido: ahí el borde es donde
   la línea se hace invisible —se dibujaría pegada al marco y se dejaría de ver
   la forma—, así que el mismo criterio da distinto resultado. */
function llenadoBarra(f) {
  if (f.remate) return { "1-0": 100, "0-1": 0 }[f.remate] ?? 50;
  if (f.mateDe) return f.mateDe === "w" ? 100 : 0;
  return Math.max(2, Math.min(98, winPct(f.evalBlancas)));
}

const claveLibro = fen => fen.split(" ").slice(0, 4).join(" ");

/* Lee el PGN y devuelve las jugadas y las posiciones. No usa el motor: es la
   parte que se puede rehacer gratis cuando el análisis viene de la caché. */
/* ---------------------- el reloj ----------------------
   Los PGN de chess.com traen el reloj de cada jugada como {[%clk 0:04:58.4]}, y
   chess.js ya los parsea: `get_comments()` los devuelve por FEN. No hace falta
   escribir ningún lector.

   La cadencia sale del encabezado TimeControl: "300" es 5+0, "180+2" es 3+2.
   Las partidas por correspondencia lo traen como "1/259200" —una jugada cada
   tantos segundos—, y ahí el reloj no mide lo mismo ni de lejos: se devuelve
   null y quedan afuera de todo lo que hable de tiempo. */
function leerCadencia(cab) {
  const tc = ((cab && cab.TimeControl) || "").trim();
  if (!tc || tc === "-" || tc.includes("/")) return null;
  const [b, i] = tc.split("+");
  const base = +b, inc = +(i || 0);
  if (!isFinite(base) || base <= 0 || !isFinite(inc) || inc < 0) return null;
  /* Dos cosas distintas y por eso dos campos.

     `clave` es la unidad de COMPARACIÓN, y es exacta: "blitz" no sirve, porque
     mete 3+0 y 5+0 en la misma bolsa y son casi el doble uno del otro (§7.8).
     Se normaliza para que "300" y "300+0", que son la misma cadencia escrita de
     dos maneras, no queden en dos grupos.

     `nombre` es lo que se MUESTRA, y usa la convención de chess.com —"5 min",
     "3 | 2"— porque es la que el usuario ya ve en la aplicación de donde salen
     las partidas. "5+0" es más preciso y no lo entiende un aficionado.
     Sale de dos números y nunca del texto crudo del PGN, así que es seguro
     escribirlo en la pantalla. */
  const clave = `${base}+${inc}`;
  const cuerpo = base % 60 === 0 ? `${base / 60}` : `${base} seg`;
  const nombre = inc ? `${cuerpo} | ${inc}`
               : base % 60 === 0 ? `${cuerpo} min` : cuerpo;
  return { tc, base, inc, clave, nombre };
}

const HMS = /\[%clk\s+([\d:.]+)\]/;

/* Segundos que se pensó cada jugada, alineados con `jugadas`, con null donde no
   hay reloj. Se resta el reloj propio anterior menos el actual, más el
   incremento —que chess.com ya sumó antes de escribir el valor—.

   Los relojes vienen redondeados, así que un gasto apenas negativo es ruido y
   no un dato: se recorta en 0, igual que hace `perdida`. La primera jugada de
   cada lado es el caso conocido: chess.com escribe el reloj inicial intacto,
   así que da 0 aunque se haya pensado una décima. */
function segundosPensados(base, jugadas, fens, cad) {
  if (!cad) return jugadas.map(() => null);
  const porFen = new Map(base.get_comments().map(c => [c.fen, c.comment]));
  const queda = { w: cad.base, b: cad.base };
  return jugadas.map((j, i) => {
    const m = HMS.exec(porFen.get(fens[i + 1]) || "");
    if (!m) return null;
    const p = m[1].split(":").map(Number);
    if (p.some(x => !isFinite(x))) return null;
    const restan = p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2]
                 : p.length === 2 ? p[0] * 60 + p[1] : p[0];
    const gasto = queda[j.color] - restan + cad.inc;
    queda[j.color] = restan;
    /* Este mismo bucle tiene `restan`, que es "cuánto te quedaba" —la otra
       pregunta del tiempo, §7.8—. No se emite hasta que haya algo que la use:
       cada campo que se agrega acá pesa también en las filas flacas. */
    return Math.max(0, Math.round(gasto * 10) / 10);
  });
}

/* LO QUE EL FEN DICE Y EL TABLERO NO SOSTIENE, se limpia en silencio
   (revisor de ajedrez, v1.1): un editor deja "KQkq" por defecto, y un
   enroque sin su torre o sin el rey en su casilla CUELGA a Stockfish (no
   contesta nunca) y chess.js lo ofrece igual. El al paso sin el peón que
   acaba de avanzar, lo mismo: chess.js lo juega y Stockfish no. */
function limpiarFen(fen) {
  const p = fen.split(" ");
  const c = new Chess();
  if (!c.load(fen)) return fen;
  const hay = (sq, t) => { const x = c.get(sq); return !!x && x.type + x.color === t; };
  const ok = { K: hay("e1", "kw") && hay("h1", "rw"), Q: hay("e1", "kw") && hay("a1", "rw"),
               k: hay("e8", "kb") && hay("h8", "rb"), q: hay("e8", "kb") && hay("a8", "rb") };
  p[2] = [...p[2]].filter(x => ok[x]).join("") || "-";
  if (p[3] !== "-") {
    const col = p[3][0], fila = p[3][1];
    const peon = p[1] === "w" ? col + "5" : col + "4", tipo = p[1] === "w" ? "pb" : "pw";
    if (!(fila === (p[1] === "w" ? "6" : "3") && hay(peon, tipo) && !c.get(p[3]))) p[3] = "-";
  }
  return p.join(" ");
}

function prepararPartida(pgn) {
  const base = new Chess();
  if (!base.load_pgn(normalizarPgn(pgn), { sloppy: true }))
    throw new Error("no pude leer ese PGN. Fijate que las jugadas estén en " +
                    "notación algebraica (e4, Nf3, O-O)");
  const jugadas = base.history({ verbose: true });
  if (!jugadas.length) throw new Error("el PGN no tiene jugadas");
  /* DESDE UNA POSICIÓN (v1.5): una partida jugada en Posiciones trae su
     arranque en la cabecera FEN, como manda el PGN, y se rejuega desde ahí.
     El arranque sale de lo que chess.js cargó (deshaciendo todo), no de
     `cab.FEN`, que no ve un "[Fen" en minúsculas; y pasa por `limpiarFen`:
     un PGN pegado con "KQkq" sin torres colgaba a Stockfish (revisor de
     ajedrez). Si después alguna jugada no entra, el PGN no se puede leer. */
  const cab = base.header();
  let rep = new Chess();
  if (/\[\s*fen\s/i.test(pgn)) {
    /* solo si trae FEN: las de chess.com no pagan una segunda lectura */
    const arranque = new Chess();
    arranque.load_pgn(normalizarPgn(pgn), { sloppy: true });
    while (arranque.undo());
    rep = new Chess(limpiarFen(arranque.fen()));
  }
  const fens = [rep.fen()];
  for (const j of jugadas) {
    if (!rep.move({ from: j.from, to: j.to, promotion: j.promotion }))
      throw new Error("no pude leer ese PGN: la posición de arranque no deja jugar " + j.san);
    fens.push(rep.fen());
  }
  const cadencia = leerCadencia(cab);
  return { cab, jugadas, fens, cadencia,
           tiempos: segundosPensados(base, jugadas, fens, cadencia) };
}

/* Arma las filas a partir de las evaluaciones. Todo lo de acá es derivable, y
   por eso la caché guarda `evs` y no las filas: si mañana cambia una regla de
   categorización, las partidas ya analizadas no hay que volver a correrlas. */
/* La caída en probabilidad de ganar del que mueve, con las dos evaluaciones
   ya en escala de blancas. Aparte desde la v0.175 porque la usan
   `derivarFilas` y `precisionesRapidas`, y la precisión tiene que ser una. */
function caidaDe(antes, despues, turno) {
  const wAntes = turno === "w" ? winPct(antes) : 100 - winPct(antes);
  const wDespues = turno === "w" ? winPct(despues) : 100 - winPct(despues);
  return Math.max(0, wAntes - wDespues);
}

/* LA PRECISIÓN SIN EL RESTO (v0.175). La fila del inicio solo necesita el
   número, y rehacerlo con `derivarFilas` costaba ~60 ms por partida en PC
   (colgadas, capturas, sacrificios: chess.js en cada jugada), o sea varios
   segundos en el celu con treinta partidas guardadas: la lista salía pelada y
   un rato después aparecían el botón y la tarjeta, empujándola (Juan,
   20-nov). Esto devuelve filas mínimas —turno, si es de libro y precisión—,
   que es todo lo que leen `precisionMedia` y `filasDelUsuario`; la cuenta es
   la misma de `derivarFilas`, y una prueba lo compara contra ella. */
/* EL TURNO Y EL NÚMERO SALEN DEL FEN (v1.5), no de contar desde la jugada
   1 con blancas: una partida jugada desde una posición puede arrancar con
   negras o en la jugada 23. Sin FEN (alguna prueba), la cuenta de siempre. */
function turnoDeFila(fen, k) {
  const t = fen ? fen.split(" ")[1] : null;
  return t === "w" || t === "b" ? t : k % 2 === 0 ? "w" : "b";
}
function numeroDeFila(fen, k) {
  const n = fen ? +fen.split(" ")[5] : 0;
  return n >= 1 ? n : Math.floor(k / 2) + 1;
}
function precisionesRapidas(fens, evs, libro, desde = 0) {
  const filas = [];
  for (let i = 0; i + 1 < fens.length; i++) {
    const turno = turnoDeFila(fens[i], desde + i);
    const rival = turno === "w" ? "b" : "w";
    const caida = caidaDe(aBlancas(evs[i], turno), aBlancas(evs[i + 1], rival), turno);
    filas.push({ turno, cat: libro.pos.has(claveLibro(fens[i + 1])) ? "libro" : "",
                 precision: precisionJugada(caida) });
  }
  return filas;
}

function derivarFilas(jugadas, fens, evs, libro, desde = 0, modo = "critico", tiempos = null,
                      mateALaVista = MATE_A_LA_VISTA, previa = null) {
  let apertura = "";
  const filas = [];
  for (let i = 0; i < jugadas.length; i++) {
    const j = jugadas[i];
    const k = desde + i;
    const turno = turnoDeFila(fens[i], k);
    const rival = turno === "w" ? "b" : "w";
    const antes = aBlancas(evs[i], turno);
    const despues = aBlancas(evs[i + 1], rival);
    const perdida = Math.max(0, turno === "w" ? antes - despues : despues - antes) / 100;

    const caida = caidaDe(antes, despues, turno);
    const precision = precisionJugada(caida);

    const uci = j.from + j.to + (j.promotion || "");
    /* UN MATE ES UN MATE (v0.177, revisor de ajedrez): con dos mates en 1, el
       que no elegía el motor salía "Excelente" con pérdida 0 (Ra8# en
       `6k1/5ppp/8/8/8/8/5PPP/R2R2K1 w`, con Rd8# del motor). Si había mate en
       1 y la jugada lo da, es la mejor. chess.js solo se pregunta en ese caso. */
    const esMejor = evs[i].mejor === uci ||
                    (evs[i].mate === 1 && new Chess(fens[i + 1]).in_checkmate());
    const clave = claveLibro(fens[i + 1]);
    const esLibro = libro.pos.has(clave);
    if (esLibro && libro.nombres[clave]) apertura = libro.nombres[clave];

    /* El hueco CRUDO entre la mejor y la segunda del motor, en centipeones, o
       null si el motor no devolvió segunda. Antes se calculaba, se comparaba
       contra 150 y se tiraba; guardarlo deja probar otros cortes sin volver a
       correr el motor, que es lo único caro de todo esto.
       El 150 está elegido para disparar "Genial" y no significa nada más, así
       que para cualquier otra pregunta hay que mirar el número, no el sí/no. */
    let huecoSegunda = null;
    if (evs[i].segunda) {
      const a1 = aBlancas(evs[i], turno);
      const a2 = aBlancas({ cp: evs[i].segunda.cp, mate: evs[i].segunda.mate }, turno);
      huecoSegunda = Math.abs(a1 - a2);
    }
    const unicaBuena = huecoSegunda !== null && huecoSegunda >= 150;
    const legales = new Chess(fens[i]).moves().length;
    /* Recaptura: el rival COMIÓ en una casilla y vos comés de vuelta ahí.

       Las tres condiciones son necesarias. Pedir solo que las dos jugadas
       terminen en la misma casilla es demasiado ancho y tapa un caso legítimo:
       en 1.e4 d5 2.exd5, el peón negro se acaba de mover a d5 y comerlo NO es
       una recaptura, es cobrar una pieza que se colgó — y cobrar algo colgado
       sí puede ser un hallazgo. Lo que hace forzada a una recaptura es que ya
       perdiste el material y solo estás recuperándolo.

       `previa` es para el llamado de la segunda opinión, que pasa una jugada
       suelta y ahí no existe `jugadas[i - 1]`: sin eso, una recaptura revisada
       a más profundidad se colaría como Genial sin que nadie lo vea. */
    const anterior = i > 0 ? jugadas[i - 1] : previa;
    const esRecaptura = !!(j.captured && anterior && anterior.captured &&
                           anterior.to === j.to);

    /* Los tres mecanismos se calculan SIEMPRE, no solo cuando la jugada salió
       mal: para saber si un mecanismo es peligroso hace falta también cuántas
       veces apareció sin consecuencias. Es la tasa base de §D regla 16. */
    /* lo comido y lo ganado al coronar, como en `cambio` de observarJugada
       (revisor de ajedrez, v1.2.3): dxc8=Q Rxc8 y dxc8=N Rxc8 terminan igual */
    const colgada = quedaComible(fens[i + 1], j.to,
      (VALOR[j.captured] || 0) + (j.promotion ? VALOR[j.promotion] - VALOR.p : 0));
    const capB = capturaBuena(fens[i], evs[i].mejor);
    const tomoBuena = esMejor && !!capB;
    /* Tomar el MISMO material con otra pieza no es dejarlo pasar. Salía con una
       recaptura de dama: en esa posición había Kxd1 y Nxd1 —las dos comen la
       dama, y no hay otra jugada legal—, y jugar la que el motor no elegía se
       contaba como omisión, con un cartel que anunciaba los 9 puntos de una
       dama que en realidad cobraste. Lo que se perdió ahí fue 1,36, y eso ya lo
       dice "Error"; la omisión mentía.
       Se compara la casilla de destino, que es donde estaba el material. */
    const tomoConOtra = !!capB && !esMejor && !!j.captured &&
                        j.to === evs[i].mejor.slice(2, 4);

    let oportunidad = null;
    const eMate = evs[i].mate;
    if (eMate !== null && eMate !== undefined && eMate > 0 && eMate <= mateALaVista) {
      const sig = evs[i + 1].mate;
      /* `sig` es el mate visto por EL QUE MUEVE DESPUÉS, o sea el rival. Si el
         mate sigue siendo mío, él lo ve negativo, y entonces no lo solté.

         EL <= NO ES UN <, y por eso está escrito con este cartel al lado. En
         UCI `mate 0` significa "el que mueve ya está mateado", o sea que el
         mate NO se soltó: se ejecutó. Con `< 0` la jugada que da el mate caía
         del lado equivocado y salía "Omisión: había mate y se dejó pasar",
         encima de la jugada que mataba y con pérdida 0,00. Se vio en el celu,
         en un Qxg7# que la app llamó omisión.

         El resto de la app ya leía bien el mate 0 —`aBlancas` lo manda a
         -10000 para el que mueve, que es lo correcto—; esta comparación era la
         única excepción. */
      if (!(sig !== null && sig !== undefined && sig <= 0)) oportunidad = { tipo: "mate", n: eMate };
    }
    /* Dejar pasar material lo decide el motor, igual que en la tabla: había
       algo cuando su mejor jugada era una captura que ganaba material, y se
       dejó pasar si no se jugó esa. Antes alcanzaba con no capturar nada, así
       que capturar otra cosa tapaba la omisión; y la que decidía si había algo
       era la heurística de material a un ply, que llamaba ganadoras a capturas
       que el motor desaconseja. */
    if (!oportunidad && !tomoBuena && !tomoConOtra && capB)
      oportunidad = { tipo: "material", san: capB.san, gana: capB.gana,
                      comida: capB.comida };

    /* EL SACRIFICIO SE MIDE CON `enPeligro` (v0.134, H2). La función de antes
       (`entregaMaterial`, borrada en la v1.0.8) miraba un solo ply: si lo que comía se podía recapturar, daba la pieza
       por perdida aunque la recuperaras. 15… Bxd6 —un peón comido con el
       alfil, y si Rxd6, Qxd6— salía Brillante con "Entrega material".
       Ahora: la pieza que movió queda en peligro de verdad (sin defensa, o a
       tiro de algo que vale menos), y lo que comió vale menos que ella. Una
       RECAPTURA no es sacrificio, igual que no es Genial: el material ya
       estaba perdido. Un peón sí puede ser Brillante (Juan, 15-nov). */
    let entrega = false;
    if (esMejor && !esRecaptura) {
      const tras = new Chess(fens[i + 1]).board();
      const queda = j.promotion || j.piece;
      entrega = !!enPeligro(tras, j.to) &&
                (VALOR[j.captured] || 0) < (VALOR[queda] || 0);
    }
    /* la posición vista desde el que mueve, en peones */
    const antesMio = (turno === "w" ? antes : -antes) / 100;
    const despuesMio = (turno === "w" ? despues : -despues) / 100;
    /* El modo se usa acá y en ningún otro lado: la pérdida, la precisión y los
       mecanismos son idénticos en los dos. Por eso se calculan las dos
       etiquetas de una vez —categorizar() es aritmética, no toca chess.js— y
       así "todo lo analizado" puede cambiar de modo sin rehacer el barrido. */
    const d = { perdida, caida, esMejor, esLibro, entrega, unicaBuena,
                oportunidad, legales, antesMio, despuesMio, esRecaptura };
    const cats = { critico: categorizar(d, "critico"),
                   amigable: categorizar(d, "amigable") };
    const cat = cats[modo] || cats.critico;

    const senales = [];
    /* EL MATE EN CONTRA. Toda la lógica de mate miraba solo el mate A FAVOR del
       que mueve; el que te hacen a vos no existía en ningún lado, así que la
       tarjeta decía "Empeora la posición · la pieza movida queda comible"
       mientras la barra mostraba -M1 al lado. Reportado desde el celular.

       Es el espejo del mate soltado de la v0.53, y por el MISMO motivo: la
       evaluación está topeada en 1000, así que caer de -8,16 a mate da 1,84 y
       no llega al corte de 3 de "Error grave". El corte está saturado justo
       donde el aviso más importa.

       POR AHORA ES SOLO UNA SEÑAL Y NO TOCA LA CATEGORÍA, por decisión del
       usuario: cambiar la etiqueta movería los conteos de todas las tablas y de
       lo acumulado, y eso se decide con la app en la mano. La señal no mueve
       ningún número; solo deja de callarse (§5 regla 12).

       "No lo había antes" es necesario: si YA te estaban matando, permitirlo de
       nuevo no es un hallazgo. Es la misma decisión que la del mate estirado.
       Como la condición pide que aparezca, la señal se dispara UNA vez, en la
       jugada que lo crea, y no en todas las que siguen.

       No pasa por MATE_A_LA_VISTA a propósito: ese dial dice qué tan duro te
       juzga la app, y esto no juzga nada, describe. */
    const mateAntes = evs[i].mate, mateDespues = evs[i + 1].mate;
    const teMatan = mateDespues !== null && mateDespues !== undefined && mateDespues > 0;
    const yaTeMataban = mateAntes !== null && mateAntes !== undefined && mateAntes < 0;
    /* Se guarda además de decirse: la señal es una lista de mecanismos y la
       explicación es una frase, y las dos necesitan el mismo número. */
    const mateContra = (teMatan && !yaTeMataban) ? mateDespues : null;
    if (mateContra) senales.push(`permite mate forzado en ${mateContra}`);
    if (perdida >= 0.5) {
      if (colgada) senales.push("la pieza movida queda comible");
    }
    if (oportunidad) {
      senales.push(oportunidad.tipo === "mate"
        ? `había mate forzado en ${oportunidad.n}`
        : `había ${oportunidad.san}, que ganaba ${enPeones(oportunidad.gana)}`);
    }
    /* Tomaste el material, pero con la pieza equivocada. No es una omisión, así
       que el costo lo dice la pérdida y no el valor de lo capturado. */
    if (tomoConOtra && perdida >= 0.5)
      senales.push(`la tomaste con otra pieza: la mejor era ${capB.san}`);

    /* Solo en la última, y no en todas: una posición terminal corta la partida,
       así que ninguna otra puede serlo. Es además lo que evita duplicar el
       `new Chess()` por fila que ya paga `legales`, que en el barrido de un año
       se cuenta por cientos de miles. */
    const remate = i === jugadas.length - 1 ? remateEnTablero(fens[i + 1]) : null;

    /* Quién tiene el mate forzado DESPUÉS de la jugada, visto desde las blancas.
       `mateDespues` viene del que mueve después, así que positivo es que matea
       él y negativo que lo matean a él. Solo lo usa la barra: ninguna tabla lo
       mira, y por eso no entra a CAMPOS_FLACOS. */
    const mateDe = (mateDespues === null || mateDespues === undefined) ? null
                 : (mateDespues > 0 ? rival : (rival === "w" ? "b" : "w"));

    filas.push({
      n: numeroDeFila(fens[i], k), turno, san: j.san, uci, cat, cats, perdida, precision, caida,
      /* con la partida terminada en el tablero, la barra muestra el RESULTADO y
         no la evaluación: no hay evaluación que perder, y "M0" o "+0.00" no es
         lo que uno quiere leer cuando la partida ya se terminó */
      remate, mateDe, evalBlancas: despues,
      evalTexto: remate ? TEXTO_REMATE[remate] : textoEval(evs[i + 1], rival),
      fen: fens[i + 1], mejor: evs[i].mejor, senales, franja: antesMio,
      /* La mejor respuesta del rival a lo que jugaste. Ya estaba calculada
         —es la mejor de la posición SIGUIENTE, que el motor evaluó igual— y no
         se emitía. Es lo que deja que la tarjeta diga "y ahora el rival tiene
         X" sin una sola llamada más al motor, y es además la puerta a la
         variante: la jugada que te nombra es la que vas a querer probar. */
      mejorRival: evs[i + 1] ? evs[i + 1].mejor : null,
      pieza: j.piece, esCaptura: !!j.captured, colgada,
      capBuena: !!capB, tomoBuena, tomoConOtra,
      /* Para REDACTAR, no para medir: `explicarJugada` los necesita
         estructurados. Hasta la v0.63 lo único que salía de acá eran las
         señales, que son texto ya armado y no se pueden volver a redactar.
         Ninguno entra a CAMPOS_FLACOS: la explicación vive en la revisión,
         que trabaja sobre filas enteras. */
      oportunidad, cap: capB, mateContra,
      /* una sola jugada legal: no hubo decisión. Solo lo usa la revisión. */
      forzada: legales === 1, esRecaptura,
      /* Para medir: ninguna TABLA los usa todavía y por eso NO están en
         CAMPOS_FLACOS —un año de filas flacas tiene que pesar poco—.
         Van los TRES y no solo el hueco: `huecoSegunda` queda en null cuando el
         motor no devuelve segunda, y una razón de que no la devuelva es que
         haya UNA SOLA jugada legal. Sin `legales` al lado, la posición más
         forzada posible cae en el grupo de "no sé", que es el equivocado.
         `unicaBuena` es el hueco ya comparado contra 150, o sea la mitad de
         "Genial" que SÍ significa "no había otra": la explicación la necesita
         para no llamarle "la única" a un Genial que entró por cruce de banda.
         Emitirla es lo que §8 pedía para poder estratificar por dificultad. */
      huecoSegunda, unicaBuena, legales,
      /* segundos pensados en esta jugada, o null si la partida no traía reloj.
         null NO es cero: es "no se sabe", y las medianas lo saltean. */
      seg: (tiempos && tiempos[i] != null) ? tiempos[i] : null
    });
  }
  return { filas, apertura };
}

function mediana(xs) {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/* Reparte una lista de tareas entre varios obreros. `res[i]` siempre
   corresponde a `items[i]`, termine quien termine primero.
   Dos modos: salteado (cada obrero toma la siguiente libre) y por bloques
   (cada obrero se lleva un tramo seguido). El segundo existe porque el motor
   guarda lo que calculó de una posición y la siguiente de la partida se le
   parece; salteando, esa memoria no le sirve. */
async function repartir(items, obreros, tarea, onProg, opc) {
  const res = new Array(items.length);
  const n = Math.max(1, Math.min(obreros.length, items.length));
  const usados = obreros.slice(0, n);
  let hechas = 0;
  /* CUANDO UNO FALLA, LOS DEMÁS SE CALLAN (v0.178.2). `Promise.all` corta con
     el primer error —el "cancelado" de Parar—, pero los otros motores terminan
     la posición que tenían en la mano y seguían avisando el progreso DESPUÉS
     de `ocupado(false)`: la barra volvía a aparecer y el estado quedaba en
     "Analizando 1 de 40" con el botón ya a la vista (Juan, 20-nov-2026). */
  let roto = false;
  const hacer = async (o, i) => {
    try { res[i] = await tarea(o, items[i], i); }
    catch (e) { roto = true; throw e; }
    if (roto) return;
    hechas++; if (onProg) onProg(hechas, items.length);
  };

  if (opc && opc.bloques) {
    const tam = Math.ceil(items.length / n);
    await Promise.all(usados.map(async (o, k) => {
      const fin = Math.min(items.length, (k + 1) * tam);
      for (let i = k * tam; i < fin && !roto; i++) await hacer(o, i);
    }));
  } else {
    let sig = 0;
    await Promise.all(usados.map(async o => {
      while (!roto) {
        const i = sig++;
        if (i >= items.length) return;
        await hacer(o, i);
      }
    }));
  }
  return res;
}

/* identidad de una partida para la caché: la de chess.com si la hay, y si no
   un hash del PGN. Nunca la fecha ni el rival: §D regla 9. */
function hashTexto(t) {
  let h = 0x811c9dc5;
  for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(16);
}
function idPartida(g) {
  if (g && g.uuid) return g.uuid;
  if (g && g.url) return "url:" + hashTexto(g.url);
  return "pgn:" + hashTexto((g && g.pgn) || String(g));
}

/* chess.js EXIGE una línea en blanco entre las cabeceras y las jugadas, y si
   falta no lee nada: devuelve false y el error solo dice "no pude leer ese
   PGN". Pasa de verdad —un PGN copiado a mano suele venir con el "1. e4"
   pegado al último corchete— y las 77 jugadas eran todas legales.

   Se mira línea por línea y NO con lastIndexOf("]"): los PGN de chess.com
   traen los relojes como {[%clk 0:05:00]} dentro de las jugadas, así que el
   último "]" del texto no es el final de las cabeceras.

   Límite conocido: si alguien pega el "1. e4" en la MISMA línea que la última
   cabecera, esto no lo arregla. */
const LINEA_CABECERA = /^\s*\[[A-Za-z][A-Za-z0-9_]*\s+.*\]\s*$/;

function normalizarPgn(texto) {
  const lineas = String(texto).replace(/\r\n?/g, "\n").split("\n");
  let i = 0;
  while (i < lineas.length && LINEA_CABECERA.test(lineas[i])) i++;
  if (!i) return String(texto).trim();
  const cab = lineas.slice(0, i).join("\n");
  const cuerpo = lineas.slice(i).join("\n").trim();
  return cuerpo ? cab + "\n\n" + cuerpo : cab;
}

