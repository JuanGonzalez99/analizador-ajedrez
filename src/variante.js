/* ============ probar jugadas: la variante (v0.65, rehecha en la v0.66) ============

   El "Reintentar" de chess.com, pero navegable. En la v0.65 se probaba UNA
   jugada y ahí terminaba; el usuario pidió tres cosas que son la misma:
   encadenar, poder jugar también las del rival, e ir y volver por lo inventado.

   TRES REGLAS DE FONDO, que no cambiaron:

   1. NO TOCA NADA GUARDADO. No escribe en R.filas ni en la caché. Cada jugada
      inventada se juzga con `derivarFilas`, o sea el MISMO camino que las de la
      partida, y la variante entera se tira al salir. Por eso cada jugada de la
      variante trae categoría, señales y explicación sin una línea de código
      paralela: si mañana cambia cómo se juzga una jugada, cambia también acá.

   2. SE EVALÚA A LA MISMA PROFUNDIDAD que la partida (`R.profBase`), o el
      número no se compara con nada (§5.3).

   3. UNA EVALUACIÓN POR JUGADA, no dos. La posición de la que sale cada jugada
      ya está evaluada: es la de arranque para la primera, y la que dejó la
      anterior para el resto. Encadenar diez jugadas cuesta diez llamadas al
      motor, no veinte.

   DOS PUERTAS, y son dos preguntas distintas:
   - "¿y si en vez de esto jugaba otra cosa?" → el botón, que arranca de la
     posición ANTES de la jugada que estás mirando.
   - "¿y ahora qué?" → tocar una pieza del tablero, que arranca de la posición
     que ya estás viendo, o sea la de después.
   La segunda es también la que deja probar las del rival: en la posición de
   después le toca a él.

   La forma: { desde0, linea: [...], ver, desde, destinos, estado, msg }.
   `desde0` es el índice de POSICIÓN de arranque en R.fens, y con eso solo salen
   las dos puertas: IDX es la de antes de la jugada, IDX + 1 la de después.
   `ver` es cuántas jugadas de la variante se están mostrando: 0 es la posición
   de arranque, y por eso ir y volver no vuelve a llamar al motor. */
let PRUEBA = null;

/* LA PIEZA ELEGIDA SIN VARIANTE (v0.152). Hasta la v0.151 tocar una pieza ya
   abría la variante: la tarjeta se volvía "Elegiste f6 · Volver", "‹ ›" se
   grisaban y el tablero saltaba 21 px (la tarjeta de la variante es más baja).
   Un toque suelto ya era un modo del que había que salir. Ahora elegir una
   pieza solo la marca en el tablero, con sus destinos, y la variante empieza
   recién al JUGAR: tocar una pieza no inventa nada todavía, así que no tiene
   por qué cambiar la pantalla. Ganó la B de cuatro (§7, v0.152).
   { desde, destinos, fen }: el `fen` es la posición donde se eligió, y la
   marca vale solo mientras sea la que se está viendo. Así no hace falta
   borrarla en cada camino que cambia de partida o de jugada: si la posición
   ya no es esa, no existe. */
let MARCADA = null;
const marcada = () =>
  !PRUEBA && MARCADA && R && MARCADA.fen === fenDeLaJugada(IDX + 1) ? MARCADA : null;

/* QUÉ FRASE DE LA EXPLICACIÓN ESTÁ SEÑALANDO EL TABLERO (v0.69), o null.
   Sale de una captura del usuario: cuando chess.com resalta una palabra no te
   la explica, te la MUESTRA en el tablero. Acá la frase entera es el botón —no
   una palabra suelta— porque en un celular una palabra de seis letras es un
   objetivo de 40 px y la frase entera es de 300.
   Guarda el índice de la parte para poder apagarla tocándola de nuevo. */
let RESALTA = null;

/* La posición de arranque de la variante y su evaluación. Las dos salen de la
   partida ya analizada: la evaluación de la posición de la que sale la primera
   jugada inventada NO se vuelve a pedir. */
const fenDeLaJugada = i => (R.fens && R.fens[i]) ||
  (i > 0 ? R.filas[i - 1].fen : (R.cab.FEN || undefined));

/* De qué posición sale la jugada `k` de la variante: la de arranque para la
   primera, y la que dejó la anterior para el resto. La usan las dos: la
   pantalla —para dibujar lo que se está viendo— y la cola de evaluación, que
   necesita la de ANTES para juzgar cada jugada. */
const posicionAntesDe = k => {
  const p = PRUEBA;
  if (!p) return null;
  return k === 0
    ? { fen: fenDeLaJugada(p.desde0), ev: R.evs[p.desde0],
        previa: (R.jugadas && R.jugadas[p.desde0 - 1]) || null }
    : { fen: p.linea[k - 1].fen, ev: p.linea[k - 1].ev, previa: p.linea[k - 1].hecho };
};
/* Lo que se está viendo: la posición de arranque, o la que dejó la jugada `ver`
   de la variante. */
const posicionVista = () => posicionAntesDe(PRUEBA ? PRUEBA.ver : 0);

function abrirPrueba(desde0) {
  /* `corriendo` es la cola: una sola evaluación por vez, porque el grupo de
     motores es uno solo (§4.2). No hay `estado`: desde la v0.79 el estado vive
     en CADA jugada de la línea —tiene fila, tiene error, o está pensando—, que
     es lo que deja encadenar varias con unas listas y otras no. */
  PRUEBA = { desde0, linea: [], ver: 0, desde: null, destinos: [], corriendo: false };
  MARCADA = null;
  /* EL "ATRÁS" DE ANDROID CIERRA PRIMERO LA VARIANTE (v0.168, Juan): abrirla
     empuja una entrada de historial sobre la de la Partida, y el gesto la
     saca a ella en vez de a la pantalla (ver el `popstate`). Una sola entrada
     por variante: abrir otra encima —las alternativas— no apila. */
  if (!(history.state && history.state.prueba))
    try { history.pushState({ ...(history.state || {}), prueba: true }, "", location.href); } catch (e) { /* nada */ }
}

/* Cerrar la variante por cualquier otro camino —Volver, Esc, pasar de
   jugada— saca también su entrada de historial, o el próximo "atrás" no
   haría nada visible. El `popstate` que eso dispara se ignora. */
let IGNORAR_POP = false;
function soltarPrueba() {
  PRUEBA = null;
  if (history.state && history.state.prueba) { IGNORAR_POP = true; history.back(); }
}
function salirDePrueba() { if (PRUEBA) { soltarPrueba(); pintarRevision(); } }


/* Moverse por la variante. No llama al motor: las evaluaciones ya están. */
function verDeLaVariante(k) {
  if (!PRUEBA || k < 0 || k > PRUEBA.linea.length) return;
  PRUEBA.ver = k;
  PRUEBA.desde = null; PRUEBA.destinos = [];
  pintarRevision();
}

function tocarCasilla(sq, agarrar = false) {
  /* con un análisis en curso el tablero no abre variantes: los dos usan el
     mismo grupo de motores (ver `ocupado`) */
  if (TRABAJANDO) return;
  /* SIN prueba abierta, tocar una pieza la MARCA y nada más (v0.152, arriba
     de `MARCADA`). La variante se abre al jugar, desde la posición que se está
     viendo, que es la de DESPUÉS de la jugada: la puerta del "¿y ahora qué?",
     y la que deja probar las del rival, porque ahí le toca a él. */
  if (!PRUEBA) {
    const fen = fenDeLaJugada(IDX + 1);
    const salidas = new Chess(fen).moves({ verbose: true });
    const m0 = marcada();
    const m = m0 && salidas.find(x => x.from === m0.desde && x.to === sq &&
                                      (!x.promotion || x.promotion === "q"));
    /* LA JUGADA QUE YA ESTÁ AVANZA (v0.168, Juan): jugar en el tablero la
       misma que se jugó en la partida no inventa nada, así que no abre una
       variante: pasa a la jugada siguiente. */
    const sigue = m && R.filas[IDX + 1];
    if (sigue && sigue.uci === m.from + m.to + (m.promotion || "")) return void irA(IDX + 1);
    if (m) { abrirPrueba(IDX + 1); return void probarJugada(m); }
    const puede = salidas.filter(x => x.from === sq);
    /* volver a tocar la marcada la desmarca, como tocar cualquier otra cosa;
       agarrarla para arrastrar, no (`agarrar`, desde el arrastre) */
    MARCADA = puede.length && (agarrar || !m0 || m0.desde !== sq)
      ? { desde: sq, destinos: puede.map(x => x.to), fen } : null;
    return void pintarRevision();
  }
  /* YA NO SE BLOQUEA MIENTRAS PIENSA (v0.79). Antes, tocar el tablero con una
     evaluación en curso no hacía nada: había que esperar a que volviera el
     motor para poder seguir. Ahora la jugada entra a la línea al toque y la
     evaluación va atrás, en la cola. */
  const vista = posicionVista();
  const salidas = new Chess(vista.fen).moves({ verbose: true });
  /* con una pieza ya elegida, tocar un destino legal juega */
  if (PRUEBA.desde) {
    /* La coronación va a DAMA y no pregunta. Preguntar es una pantalla más para
       el caso más raro de todos; si alguna vez hace falta subascender, se
       agrega ahí. */
    const m = salidas.find(x => x.from === PRUEBA.desde && x.to === sq &&
                                (!x.promotion || x.promotion === "q"));
    if (m) return void probarJugada(m);
  }
  /* si no, tocar una pieza que se pueda mover la elige, y tocar cualquier otra
     cosa desmarca: no hay forma de quedarse trabado */
  const puede = salidas.filter(x => x.from === sq);
  PRUEBA.desde = puede.length && (agarrar || PRUEBA.desde !== sq) ? sq : null;
  PRUEBA.destinos = puede.map(x => x.to);
  pintarRevision();
}

/* JUGAR NO ESPERA AL MOTOR (v0.79). La jugada entra a la línea ya —el tablero
   la dibuja en el acto— y la evaluación se encola. De ahí salen las dos cosas
   que pidió el usuario, y son la misma: el dibujo no espera, y se pueden
   encadenar varias seguidas sin que la anterior haya vuelto.

   Lo que NO cambia es cuánto se le pide al motor: sigue siendo UNA evaluación
   por jugada (§4sexdecies, regla 3). La posición de la que sale cada jugada ya
   está evaluada —la trae la anterior— y por eso la cola tiene que correr EN
   ORDEN: la jugada k se juzga con la evaluación de la k-1. */
function probarJugada(m) {
  const p = PRUEBA;
  const vista = posicionVista();
  const j = new Chess(vista.fen);
  const hecho = j.move({ from: m.from, to: m.to, promotion: m.promotion });
  if (!hecho) return;
  const uci = hecho.from + hecho.to + (hecho.promotion || "");
  /* LA SIGUIENTE DE LA LÍNEA AVANZA (v0.168, Juan): parado en el medio de la
     variante, jugar la que ya viene después no corta nada ni llama al motor;
     es lo mismo que ›. Antes la cortaba y la volvía a evaluar, y la tarjeta
     comparaba la jugada contra sí misma. */
  if (p.ver < p.linea.length && p.linea[p.ver].uci === uci) return void verDeLaVariante(p.ver + 1);
  /* Jugar estando parado en el medio de la variante CORTA lo que venía después,
     que es lo que hace cualquier tablero: la continuación que había ya no sale
     de esta posición. Si alguna de las cortadas estaba en la cola, la cola la
     descarta sola: se mira por identidad. */
  p.linea = p.linea.slice(0, p.ver);
  /* LA DE LA PARTIDA, PROBADA EN SU LUGAR (v0.168): desde el arranque, la
     misma jugada que se hizo ya está juzgada, y se usa ESA fila y esa
     evaluación en vez de volver a pedírsela al motor. Con Stockfish de verdad
     dos corridas no dan el mismo número, y la tarjeta decía "pierde 0.31 · en
     la partida Nf3 pierde 0.27" de la misma jugada. */
  const real = p.ver === 0 ? jugadaReal() : null;
  const deLaPartida = real && real.uci === uci && R.evs && R.evs[p.desde0 + 1];
  p.linea.push({ uci, san: hecho.san, hecho, fen: j.fen(),
                 /* sin evaluar todavía: eso es lo que la cola viene a llenar */
                 ev: deLaPartida ? R.evs[p.desde0 + 1] : null,
                 fila: deLaPartida ? real : null, error: null });
  p.ver = p.linea.length;
  p.desde = null; p.destinos = [];
  pintarRevision();
  atenderCola();
}

/* UNA SOLA FILA PARA TODO LO QUE LE PIDE AL MOTOR A DEMANDA (v0.89). Eran dos
   cosas la variante y ahora son tres con las alternativas, y `pool.asegurar` le
   puede cambiar el MultiPV o el Hash a un motor que está trabajando —§4.2 lo
   midió—. Encadenar es la forma más barata de que no se pisen: cada pedido
   espera al anterior, y el `then(fn, fn)` es para que un error no deje la fila
   trabada para siempre. Lo que NO pasa por acá es el barrido de la partida, que
   se cubre con `TRABAJANDO`: ahí no se puede ni tocar el tablero. */
let COLA_MOTOR = Promise.resolve();
const enFila = fn => (COLA_MOTOR = COLA_MOTOR.then(fn, fn));

/* La cola: evalúa las jugadas que todavía no tienen veredicto, de a una y en
   orden. Una sola corriendo por vez, porque el grupo de motores es uno solo y
   `pool.asegurar` le puede cambiar el MultiPV o el Hash a un motor que está
   trabajando, que es justo lo que §4.2 midió. */
async function atenderCola() {
  const p = PRUEBA;
  if (!p || p.corriendo) return;
  p.corriendo = true;
  const prof = R.profBase || +$("prof").value || 16;
  try {
    for (;;) {
      if (PRUEBA !== p) return;
      const k = p.linea.findIndex(x => !x.fila && !x.error);
      if (k < 0) return;
      const e = p.linea[k];
      const antes = posicionAntesDe(k);
      /* Sin la evaluación de la anterior no se puede juzgar esta, y la única
         forma de que falte es que la anterior haya fallado. Se dice, en vez de
         dejarla pensando para siempre. */
      if (!antes || !antes.ev) {
        e.error = "no se pudo evaluar la jugada anterior";
        pintarRevision();
        continue;
      }
      try {
        const [ev] = await enFila(() => evaluarPosiciones([e.fen], prof, null, opcionesDePantalla()));
        /* Si mientras el motor pensaba se salió de la variante o se cortó la
           línea, lo que vuelve no puede pisar la pantalla nueva. Se mira por
           IDENTIDAD y no por el largo: encadenando, el largo cambia todo el
           tiempo sin que esta jugada deje de ser la misma. */
        if (PRUEBA !== p || p.linea[k] !== e) return;
        e.ev = ev;
        /* MISMO camino que la partida: derivarFilas con una jugada suelta, igual
           que la segunda opinión del barrido. `desde0 + k` es lo que hace que el
           número de jugada y el turno sigan la cuenta de la partida, y `previa`
           es lo que deja reconocer una recaptura adentro de la variante. */
        e.fila = derivarFilas([e.hecho], [antes.fen, e.fen], [antes.ev, ev],
          LIBRO || { pos: new Set(), nombres: {} }, p.desde0 + k, $("modo").value,
          null, MATE_VISTA(), antes.previa).filas[0];
        window.LOG.add("·", `variante: ${e.san} (jugada ${p.desde0 + k + 1} de la ` +
          `posición) a profundidad ${prof} · pierde ${e.fila.perdida.toFixed(2)}`);
      } catch (err) {
        if (PRUEBA !== p || p.linea[k] !== e) return;
        e.error = err.message || String(err);
      }
      pintarRevision();
    }
  } finally { p.corriendo = false; }
}

/* La jugada de la PARTIDA que sale de la posición de arranque, si la hay. Es
   contra lo que se compara la variante, y en la última jugada no existe. */
const jugadaReal = () => PRUEBA && R.filas[PRUEBA.desde0];

/* Lo que la tarjeta de la variante dice en cada estado, ya armado, para que
   pintarRevision no tenga que decidir nada. */
function textoPrueba(prof) {
  const p = PRUEBA, real = jugadaReal();
  const contra = real
    ? ` · en la partida ${real.san} pierde ${real.perdida.toFixed(2)}`
    : "";
  /* EL ESTADO ES DE CADA JUGADA, no de la variante (v0.79): encadenando, la
     que se está mirando puede tener veredicto mientras la siguiente todavía
     piensa, o al revés. */
  if (p.ver > 0 && !p.linea[p.ver - 1].fila) {
    const e = p.linea[p.ver - 1];
    return e.error
      ? { ico: "!", tit: "No se pudo evaluar", sub: e.error, exp: "", color: "var(--inventada)" }
      : { ico: "…", tit: `Probando ${e.san}`,
          sub: `Pensando a profundidad ${prof}.`, exp: "", color: "var(--inventada)" };
  }
  if (p.ver > 0) {
    const f = p.linea[p.ver - 1].fila, c = presentar(f);
    const fenAntes = p.ver > 1 ? p.linea[p.ver - 2].fen : fenDeLaJugada(p.desde0);
    const lado = ladoDelUsuario(R);
    /* La comparación contra la jugada real vale para la PRIMERA de la variante y
       para ninguna más: de la segunda en adelante la posición ya no es la de la
       partida, así que no hay contra qué comparar. */
    return {
      ico: c.icono,
      tit: `${f.n}${f.turno === "w" ? "." : "..."} ${f.san} — ${c.nombre}`,
      sub: `pierde ${f.perdida.toFixed(2)}` +
           (p.ver === 1 ? (f === real ? " · es la de la partida" : contra) : ""),
      /* SIN "salió del libro" en la variante, y es correcto: una jugada
         inventada no está en ningún libro, así que la pregunta no aplica. */
      /* LA MEJOR SE NOMBRA, como en la partida (v0.166, revisor de ajedrez):
         con `null` una Omisión decía "Había mate forzado en 1" sin decir con
         qué, y un Error no decía "La mejor era X". Sale de la posición de
         ANTES de la probada, que es de donde sale `f.mejor`. */
      exp: explicarJugada(f, f.mejor && f.mejor !== f.uci ? sanDeUci(fenAntes, f.mejor) : null,
                          lado ? f.turno === lado : null,
                          sanDeUci(f.fen, f.mejorRival),
                          observarJugada(f, fenAntes),
                          { ranuras: ranurasDeLaExplicacion() }),
      color: `var(--c-${c.clave})`
    };
  }
  /* EL ARRANQUE, EN UN RENGLÓN (v0.167, revisor): "Tocá una pieza y después
     adónde va. · en la partida Nc3 pierde 1.67" ocupaba tres y el tablero
     saltaba 18 px al volver con ‹, rompiendo el alto fijo de la v0.164. Con
     jugada real, solo la comparación; sin ella, la instrucción. Tampoco
     "Elegiste e2": la pieza marcada y sus puntos ya lo dicen (v0.152). */
  return { ico: "→", tit: "Probá otra jugada",
           sub: real ? contra.replace(/^ · /, "") : "Tocá una pieza y después adónde va.",
           exp: "", color: "var(--inventada)" };
}

/* La variante EN LA TIRA DE LA PARTIDA (dial de la v0.76, forma "abajo"). Son
   eslabones de la variante con la clase de la tira de la partida, así
   heredan el tamaño, el relleno medido y el fondo de la elegida.
   El corte dice dónde deja de ser la partida y empieza lo inventado. */
function laVarianteEnLaTira() {
  const p = PRUEBA;
  if (!p || !p.linea.length) return "";
  return `<span class="corte" aria-hidden="true"></span>` + p.linea.map((x, i) => {
    const c = x.fila ? presentar(x.fila) : null;
    /* el símbolo en el color de su categoría y la jugada en violeta (v0.168):
       todo violeta no dejaba ver cuál de las probadas era un error */
    const sm = c ? ` style="color:var(--c-${c.clave})"` : "";
    return `<span class="jg inv ${c ? "" : "pend"} ${i + 1 === p.ver ? "sel" : ""}" ` +
           `data-v="${i + 1}"><span class="sm"${sm}>${c ? c.icono : "\u2026"}</span>${x.san}</span>`;
  }).join("");
}

/* La variante EN LA PLANILLA DE LA COMPU (v0.171, como lichess): un párrafo
   con sangría y borde punteado violeta debajo del renglón de la jugada que
   reemplaza, con las jugadas corridas como texto ("5… Rb8 6. Bb5"), que
   envuelve si es larga. El revisor eligió esta entre cuatro: en renglones de
   planilla repetía el número de la partida ("5" y "5") y con diez jugadas
   tapaba la partida; plegar la partida o apagarla decía que no había pasado.
   La planilla sigue siendo la referencia de lo que pasó, entera. Los eslabones
   son los de la tira ("abajo"): símbolo en el color de su categoría, jugada
   en violeta, "…" la que está en la cola. El número sale del FEN de arranque y
   no de `R.filas`, porque se puede probar desde la posición final. */
function laVarianteEnLaPlanilla() {
  const p = PRUEBA;
  if (!p || !p.linea.length) return "";
  const f = fenDeLaJugada(p.desde0).split(" ");
  let negras = f[1] === "b", n = +f[5] || 1;
  return `<div class="var">` + p.linea.map((x, i) => {
    const c = x.fila ? presentar(x.fila) : null;
    const sm = c ? ` style="color:var(--c-${c.clave})"` : "";
    const num = !negras ? `<span class="np">${n}.</span>` : i === 0 ? `<span class="np">${n}\u2026</span>` : "";
    if (negras) n++;
    negras = !negras;
    /* el número va atado a su jugada: al envolver, "8." quedaba al final de un
       renglón y "Bd3" al principio del otro */
    return `<span class="ata">` + num +
      `<span class="jg inv ${c ? "" : "pend"} ${i + 1 === p.ver ? "sel" : ""}" data-v="${i + 1}">` +
      `<span class="sm"${sm}>${c ? c.icono : "\u2026"}</span><span class="sa">${x.san}</span></span></span>`;
  }).join("") + `</div>`;
}

