/* ============ lo que se ve mirando la posición (v0.68) ============

   Estas observaciones NO viven en `derivarFilas` y es a propósito: se calculan
   AL PINTAR UNA TARJETA, o sea una vez, y no en el bucle que recorre un año de
   partidas. Eso es lo que permite que sean caras —dan vuelta el turno del FEN y
   le piden jugadas a chess.js varias veces— sin que el barrido pague nada.

   Es la misma división que ya tiene la app: `derivarFilas` calcula lo que las
   TABLAS miden, y la explicación describe lo que el usuario está mirando.

   Todo lo de acá lo verifica chess.js: no se afirma un ataque de memoria (§10). */

/* El mismo FEN con el turno del otro. Hace falta porque para saber QUÉ ataca la
   pieza que acabo de mover tengo que pedir MIS jugadas, y después de mover es
   el turno del rival.
   El paso al vuelo se limpia porque con el turno dado vuelta ya no significa
   nada, y un FEN con un al paso imposible es un FEN inválido. */
const conElTurnoDadoVuelta = fen => {
  const p = fen.split(" ");
  p[1] = p[1] === "w" ? "b" : "w";
  p[3] = "-";
  return p.join(" ");
};

/* EN PELIGRO, SIN TURNO Y SIN JAQUE (v0.133). Una pieza está en peligro cuando
   el rival la ataca y, o nadie la defiende, o la ataca algo que vale MENOS que
   ella. Devuelve por qué —`sinDefensa` o `menor`— y con qué pieza, o null.

   ANTES ESTO SE PREGUNTABA CON LAS JUGADAS LEGALES, y el jaque lo rompía en
   las dos puntas. Si la jugada da jaque, el rival no puede comer NADA en esta
   jugada, así que toda pieza colgada aparecía "salvada" (3. Qxe5+, 4… Qxe4+ de
   Juan). Y si el que mueve ESTABA en jaque, su recaptura era ilegal, así que
   sus piezas defendidas aparecían colgadas y al salir del jaque "las salvaba"
   (10… Be7 y 11… Kd7). El jaque se contesta en una jugada y la amenaza sigue
   ahí: por eso esto es geometría y no mira de quién es el turno.

   Y "TIENE UN DEFENSOR" NO ALCANZA: un alfil atacado por un peón no se salva
   porque lo defienda otro peón —fxg4 fxg4 y se perdió un alfil por un peón—.
   Era el 9… f5 de Juan: "Salva el alfil de g4". Es un cambio estático de una
   sola vuelta, a propósito: alcanza para no mentir y no promete más.

   El rey del rival solo come lo que nadie defiende, y por eso no cuenta como
   atacante "menor". */
function enPeligro(tablero, sq) {
  const c = "abcdefgh".indexOf(sq[0]), r = 8 - +sq[1];
  const p = tablero[r] && tablero[r][c];
  if (!p || p.type === "k") return null;
  const contra = p.color === "w" ? "b" : "w";
  const atk = atacantesDe(tablero, sq, contra);
  if (!atk.length) return null;
  const menor = atk.filter(a => a.pieza !== "k")
    .sort((a, b) => (VALOR[a.pieza] || 0) - (VALOR[b.pieza] || 0))[0];
  if (menor && (VALOR[menor.pieza] || 0) < (VALOR[p.type] || 0))
    return { motivo: "menor", por: menor.pieza };
  /* El rey defiende solo si nadie más ataca la casilla: si la ataca otra
     pieza del rival, recapturar con el rey es meterse en jaque. */
  const def = atacantesDe(tablero, sq, p.color)
    .filter(d => d.pieza !== "k" || atk.length < 2);
  if (!def.length)
    return { motivo: "sinDefensa", por: (menor || atk[0]).pieza };
  return null;
}

/* Las piezas de `color` que atacan una casilla, con el tablero como está.
   UNA PIEZA CLAVADA CONTRA SU REY NO CUENTA, salvo que la casilla quede en la
   misma línea de la clavada (comer al que la clava, o moverse entre los dos).
   Lo destapó el verificador independiente: 7. Nc3 "salvaba" el peón de e4 con
   un caballo clavado por el alfil de b4, y una dama clavada "atacaba" un peón. */
function atacantesDe(tablero, casilla, color) {
  const out = [];
  const rey = casillaDelRey(tablero, color);
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const q = tablero[r][c];
    const sq = "abcdefgh"[c] + (8 - r);
    if (!q || q.color !== color || !ataca(tablero, sq, casilla)) continue;
    const clavador = rey && q.type !== "k" ? quienLaClava(tablero, sq, rey) : null;
    if (clavador && casilla !== clavador && !enElMedio(rey, casilla, clavador)) continue;
    out.push({ sq, pieza: q.type });
  }
  return out;
}

/* Qué piezas de `color` están en peligro en esa posición (ver `enPeligro`).
   No importa de quién sea el turno. */
function colgadasDe(fen, color) {
  const tablero = new Chess(fen).board();
  const out = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = tablero[r][c];
    /* el rey no: no se puede capturar, y "el rey queda comible" es jaque mate */
    if (!p || p.color !== color || p.type === "k") continue;
    const sq = "abcdefgh"[c] + (8 - r);
    const e = enPeligro(tablero, sq);
    if (e) out.push({ sq, pieza: p.type, motivo: e.motivo, por: e.por });
  }
  /* la más cara primero: si hay dos, la que duele es esa */
  return out.sort((a, b) => (VALOR[b.pieza] || 0) - (VALOR[a.pieza] || 0));
}

/* ¿La pieza de `sq` está tapando a su propio rey de una pieza que lo ataca por
   una línea? Es la clavada absoluta.

   SE BUSCA CON GEOMETRÍA DESDE LA v0.133, y no sacando la pieza para ver si el
   rey queda en jaque. Eso fallaba con el rey YA en jaque: cualquier pieza en
   línea con él daba positivo. En el 3. Qxe5+ de Juan salían diez piezas
   "clavadas" y la tarjeta decía "Clava la torre de a8". Ahora: del rey a la
   pieza no hay nada en el medio, y pasando la pieza, lo primero que aparece es
   una dama, o una torre si la línea es recta, o un alfil si es diagonal, del
   otro color. */
function estaClavada(fen, sq, rey) {
  return !!(rey && quienLaClava(new Chess(fen).board(), sq, rey));
}

/* La casilla de la pieza que clava a la de `sq` contra su rey, o null. Es la
   geometría de `estaClavada`, sobre el tablero y no sobre un FEN, porque la usa
   también `atacantesDe`, que se llama muchas veces por tarjeta. */
function quienLaClava(tablero, sq, rey) {
  const col = t => "abcdefgh".indexOf(t[0]), fil = t => 8 - +t[1];
  const dc = col(sq) - col(rey), df = fil(sq) - fil(rey);
  if ((dc === 0 && df === 0) || (dc !== 0 && df !== 0 && Math.abs(dc) !== Math.abs(df)))
    return null;
  const p = tablero[fil(sq)][col(sq)];
  if (!p || p.type === "k") return null;
  const pc = Math.sign(dc), pf = Math.sign(df);
  let c = col(rey) + pc, f = fil(rey) + pf;
  for (; c !== col(sq) || f !== fil(sq); c += pc, f += pf) if (tablero[f][c]) return null;
  const recta = dc === 0 || df === 0;
  for (c += pc, f += pf; c >= 0 && c < 8 && f >= 0 && f < 8; c += pc, f += pf) {
    const q = tablero[f][c];
    if (!q) continue;
    return q.color !== p.color && (q.type === "q" || q.type === (recta ? "r" : "b"))
      ? "abcdefgh"[c] + (8 - f) : null;
  }
  return null;
}

/* ¿Un peón sin ningún peón rival que lo pueda frenar? Ni en su columna ni en
   las de al lado, y solo mirando hacia adelante. Es la definición de siempre. */
function esPasado(tablero, sq, color) {
  const col = "abcdefgh".indexOf(sq[0]), fila = 8 - +sq[1];
  const paso = color === "w" ? -1 : 1;
  for (let c = Math.max(0, col - 1); c <= Math.min(7, col + 1); c++)
    for (let r = fila + paso; r >= 0 && r <= 7; r += paso) {
      const q = tablero[r][c];
      if (q && q.type === "p" && q.color !== color) return false;
    }
  return true;
}

/* ¿Columna sin peones de nadie? La definición de siempre: si hay un peón, aunque
   sea del rival, no está abierta —a lo sumo semiabierta, que es otra cosa y no
   la decimos—. */
const columnaAbierta = (tablero, sq) => {
  const col = "abcdefgh".indexOf(sq[0]);
  return !tablero.some(fila => fila[col] && fila[col].type === "p");
};

/* ¿La pieza parada en `desde` ataca la casilla `hasta`, con el tablero como
   está? Es geometría pura, y mira los bloqueos caminando la línea.

   EXISTE PORQUE chess.js NO LO PUEDE CONTESTAR: `moves()` nunca genera la
   captura del rey, que es justo el caso que hace falta para saber si el jaque
   lo da la pieza que se movió o una que estaba tapada detrás. El truco de sacar
   la pieza del tablero —el de `estaClavada`— acá no sirve: sacarla también
   podría abrir la línea de OTRA pieza mía, y eso daría un descubierto que no
   existe. */
function ataca(tablero, desde, hasta) {
  const cd = "abcdefgh".indexOf(desde[0]), fd = 8 - +desde[1];
  const ch = "abcdefgh".indexOf(hasta[0]), fh = 8 - +hasta[1];
  if (cd < 0 || ch < 0 || (cd === ch && fd === fh)) return false;
  const p = tablero[fd] && tablero[fd][cd];
  if (!p) return false;
  const dc = ch - cd, df = fh - fd, ac = Math.abs(dc), af = Math.abs(df);
  if (p.type === "n") return (ac === 1 && af === 2) || (ac === 2 && af === 1);
  if (p.type === "k") return ac <= 1 && af <= 1;
  /* el peón ataca en diagonal y SOLO hacia adelante: para las blancas, hacia
     la fila 8, que en `board()` es el índice que baja */
  if (p.type === "p") return ac === 1 && df === (p.color === "w" ? -1 : 1);
  const recta = dc === 0 || df === 0, diagonal = ac === af;
  if (!(p.type === "q" ? (recta || diagonal)
                       : p.type === "r" ? recta
                       : p.type === "b" ? diagonal : false)) return false;
  const pc = Math.sign(dc), pf = Math.sign(df);
  for (let c = cd + pc, f = fd + pf; c !== ch || f !== fh; c += pc, f += pf)
    if (tablero[f][c]) return false;
  return true;
}

/* ¿La casilla `medio` está en la línea que va de `desde` a `hasta`? Es lo que
   convierte un ataque nuevo en un ataque DESCUBIERTO: la pieza que se fue
   estaba justo tapando esa línea. Sin esto, cualquier ataque que apareció por
   otro motivo se llamaría descubierta. */
function enElMedio(desde, medio, hasta) {
  const c = t => "abcdefgh".indexOf(t[0]), f = t => 8 - +t[1];
  const dc = c(hasta) - c(desde), df = f(hasta) - f(desde);
  if (dc !== 0 && df !== 0 && Math.abs(dc) !== Math.abs(df)) return false;
  const pc = Math.sign(dc), pf = Math.sign(df);
  for (let x = c(desde) + pc, y = f(desde) + pf; x !== c(hasta) || y !== f(hasta);
       x += pc, y += pf)
    if (x === c(medio) && y === f(medio)) return true;
  return false;
}

/* ¿La pieza de `sq` está atrapada? Dos condiciones, y las dos hacen falta:
   está en peligro DONDE ESTÁ, y no tiene ninguna casilla adonde ir donde deje
   de estarlo. Eso es exactamente lo que dice la frase —"no tiene salida"— y no
   más: no promete que no haya OTRA forma de salvarla (defenderla, contraatacar,
   tapar), solo que la pieza sola no se salva moviéndose.

   LAS SALIDAS SE CUENTAN SIN MIRAR EL JAQUE (v0.133). Con las jugadas legales,
   una jugada que daba jaque dejaba sin salidas a TODAS las piezas del rival —
   tenía que atender el jaque— y salía "Atrapa el alfil de b8" en 26 de 27
   casos medidos. El jaque se contesta y la pieza se va igual.

   Comer algo que vale lo mismo o más TAMBIÉN es una salida: cambiarse no es
   quedar atrapada (Rg7+ con la torre de g8 que come en g7).

   Se pregunta por UNA sola pieza —la más cara de las que ya están en peligro—
   y nunca por peones ni por el rey. */
function estaAtrapada(fen, sq) {
  const j = new Chess(fen);
  const p = j.get(sq);
  if (!p || p.type === "p" || p.type === "k") return false;
  if (j.turn() !== p.color) return false;
  const tablero = j.board();
  if (!enPeligro(tablero, sq)) return false;
  const c0 = "abcdefgh".indexOf(sq[0]), f0 = 8 - +sq[1];
  const salidas = j.moves({ verbose: true, legal: false }).filter(m => m.from === sq);
  for (const m of salidas) {
    if (m.captured && (VALOR[m.captured] || 0) >= (VALOR[p.type] || 0)) return false;
    const t2 = tablero.map(fila => fila.slice());
    t2[f0][c0] = null;
    t2[8 - +m.to[1]]["abcdefgh".indexOf(m.to[0])] = p;
    if (!enPeligro(t2, m.to)) return false;
  }
  return true;
}

/* Cuántos peones de un color hay en una columna. Lo usan las tres frases de
   estructura —aislado, doblados y semiabierta—, que preguntan lo mismo con
   distintos argumentos. */
function peonesEnColumna(tablero, col, color) {
  let n = 0;
  for (let r = 0; r < 8; r++) {
    const q = tablero[r][col];
    if (q && q.type === "p" && q.color === color) n++;
  }
  return n;
}

/* ¿Peón sin ningún peón PROPIO en las columnas de al lado? Aislado quiere decir
   que ninguno lo puede defender nunca, y por eso mira las dos columnas
   ENTERAS y no solo hacia adelante: un peón de atrás también podría venir a
   defenderlo. Es justo al revés que `esPasado`, que solo mira adelante porque
   un peón rival que quedó atrás ya no lo puede frenar. */
function esAislado(tablero, sq, color) {
  const col = "abcdefgh".indexOf(sq[0]);
  for (const c of [col - 1, col + 1]) {
    if (c < 0 || c > 7) continue;
    if (peonesEnColumna(tablero, c, color)) return false;
  }
  return true;
}

/* Semiabierta: sin peones MÍOS y con al menos uno del rival. Si no hay de nadie
   está abierta, que es otra cosa y la contesta `columnaAbierta`: las dos
   frases no se pueden pisar. */
function columnaSemiabierta(tablero, sq, color) {
  const col = "abcdefgh".indexOf(sq[0]);
  return peonesEnColumna(tablero, col, color) === 0 &&
         peonesEnColumna(tablero, col, color === "w" ? "b" : "w") > 0;
}

/* ¿Casilla que NINGÚN peón rival puede atacar nunca? Es el puesto avanzado, y
   se contesta con la misma barrida que `esPasado` pero en las dos columnas de
   al lado y nada más: para atacarla, un peón rival tiene que estar por delante
   de ella —del lado del que avanza hacia mí—; uno que ya la pasó no vuelve.

   Se pide además que esté del medio para adelante (fila 5 o más para las
   blancas). Un caballo inechable en la propia fila 2 no es un puesto avanzado,
   es un caballo en su casa. */
function estaPlantado(tablero, sq, color) {
  const fila = +sq[1];
  if (color === "w" ? fila < 5 : fila > 4) return false;
  const col = "abcdefgh".indexOf(sq[0]), r0 = 8 - fila;
  const paso = color === "w" ? -1 : 1;
  const rival = color === "w" ? "b" : "w";
  for (const c of [col - 1, col + 1]) {
    if (c < 0 || c > 7) continue;
    for (let r = r0 + paso; r >= 0 && r <= 7; r += paso) {
      const q = tablero[r][c];
      if (q && q.type === "p" && q.color === rival) return false;
    }
  }
  return true;
}

/* La pareja de alfiles: dos míos y el rival ya sin los dos. Tener dos alfiles
   cuando el rival también los tiene no es la pareja, es el reparto de siempre. */
function hayPareja(tablero, color) {
  let mios = 0, suyos = 0;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const q = tablero[r][c];
    if (q && q.type === "b") (q.color === color ? mios++ : suyos++);
  }
  return mios >= 2 && suyos < 2;
}

/* ¿el que mueve en `fen` se puede llevar la pieza de `sq` sin perder en el
   cambio? (v1.0.6, revisor de ajedrez) Es lo que corta "Se queda con la
   pareja de alfiles" a mitad de un cambio: Bxg5 Nxg5 deja uno y uno. Una
   captura que entrega la dama no cuenta, como en `cambioEn`. Con `estricto`
   tiene que GANAR (> 0): para los alfiles que no se movieron un cambio
   parejo ya se podía antes y es elección del rival, no la pareja que se
   deshace (revisor de ajedrez, v1.0.6). */
function seLaLlevan(fen, sq, estricto = false) {
  const j = new Chess(fen);
  return j.moves({ verbose: true }).some(m => {
    if (m.to !== sq || !m.captured || entregaLaDama(fen, m)) return false;
    const j2 = new Chess(fen);
    j2.move(m);
    const gana = (VALOR[m.captured] || 0) - cambioEn(j2.fen(), sq, 1, false).neto;
    return estricto ? gana > 0 : gana >= 0;
  });
}

/* Torres conectadas: las dos se ven, sin nada en el medio. Se contesta
   caminando la fila o la columna que comparten. */
function torresConectadas(tablero, color) {
  const t = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const q = tablero[r][c];
    if (q && q.type === "r" && q.color === color) t.push([r, c]);
  }
  if (t.length !== 2) return null;
  const [[r1, c1], [r2, c2]] = t;
  if (r1 !== r2 && c1 !== c2) return null;
  const dr = Math.sign(r2 - r1), dc = Math.sign(c2 - c1);
  for (let r = r1 + dr, c = c1 + dc; r !== r2 || c !== c2; r += dr, c += dc)
    if (tablero[r][c]) return null;
  /* devuelve LAS DOS CASILLAS y no un sí: la frase las señala en el tablero, y
     un booleano obligaría a volver a buscarlas afuera */
  return [`${"abcdefgh"[c1]}${8 - r1}`, `${"abcdefgh"[c2]}${8 - r2}`];
}

const hayDamas = tablero => tablero.some(f => f.some(q => q && q.type === "q"));

/* La séptima es la fila donde el rival ARRANCA con los peones: la 7 para las
   blancas y la 2 para las negras. */
const esLaSeptima = (sq, color) => +sq[1] === (color === "w" ? 7 : 2);

/* Los enroques que le quedan a un color, leídos del propio FEN. Es exacto y no
   cuesta nada: el campo 3 del FEN es justamente eso. */
function enroquesDe(fen, color) {
  const campo = (fen.split(" ")[2] || "");
  const k = color === "w" ? "K" : "k", q = color === "w" ? "Q" : "q";
  return { corto: campo.includes(k), largo: campo.includes(q) };
}

const casillaDelRey = (tablero, color) => {
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = tablero[r][c];
    if (p && p.type === "k" && p.color === color) return "abcdefgh"[c] + (8 - r);
  }
  return null;
};

function observarJugada(f, fenAntes = null) {
  const vacio = { amenazadas: [], colgadas: [], nuevas: [], siguen: [], salvadas: [],
                  clavadas: [], pasado: false, columna: null,
                  /* los de la v0.77: todos se comparan contra ANTES, así que
                     sin `fenAntes` la mayoría se queda en falso en vez de
                     atribuirle a esta jugada algo que ya estaba */
                  semiabierta: null, aislado: null, doblados: null,
                  pasadoContra: null, pareja: false, septima: null,
                  sinDamas: false, conectadas: null, plantado: null,
                  corona: false, enroque: null, pierdeEnroque: null,
                  legalesRival: null,
                  /* los caros, de la v0.78 */
                  atrapada: null, descubierto: null, descubierta: null,
                  cambio: null };
  if (!f || !f.fen || !f.uci) return vacio;
  const donde = f.uci.slice(2, 4), deDonde = f.uci.slice(0, 2);
  try {
    const mio = f.turno;
    /* 1. QUÉ ATACA la pieza que moví. Se le pregunta a chess.js dando vuelta el
       turno; el rey se saca de la lista porque atacarlo es dar jaque, que ya lo
       dice el propio SAN con un "+". */
    const j = new Chess(conElTurnoDadoVuelta(f.fen));
    /* DOS ARREGLOS DE LA CORONACIÓN (v0.133.1). La pieza que ataca es la que
       QUEDÓ, no la que salió: después de c1=Q ataca una dama, no un peón. Y
       una captura que corona son cuatro jugadas (=Q, =R, =B, =N) a la misma
       casilla, así que sin juntar por casilla salía "Es un ataque doble: la
       dama de c1 y la dama de c1". */
    const queda = f.uci.length > 4 ? f.uci[4] : f.pieza;
    const vistas = new Set();
    const amenazadas = j.moves({ verbose: true })
      .filter(m => m.from === donde && m.captured && m.captured !== "k" &&
                   (VALOR[m.captured] || 0) > (VALOR[queda] || 0))
      .filter(m => !vistas.has(m.to) && vistas.add(m.to))
      .map(m => ({ sq: m.to, pieza: m.captured }));

    /* 2. QUÉ PIEZAS MÍAS QUEDAN COLGADAS, y sobre todo CUÁLES CAMBIARON.

       Comparar antes contra después es lo que separa "esto pasa" de "esto lo
       causó la jugada", y es la frase de la captura del usuario: "tu peón
       estaba defendido, pero ahora está indefenso". Sin la comparación, una
       pieza que ya venía colgada de tres jugadas atrás se le echaría a esta.

       Sin `fenAntes` no hay comparación posible, y ahí `nuevas` y `salvadas`
       quedan vacías en vez de adivinar. */
    const todasMias = colgadasDe(f.fen, mio);
    const colgadas = todasMias.filter(c => c.sq !== donde);
    const antes = fenAntes ? colgadasDe(fenAntes, mio) : null;
    let nuevas = [], salvadas = [], siguen = [];
    if (antes) {
      const eran = new Set(antes.map(c => c.sq));
      const son = new Set(colgadas.map(c => c.sq));
      nuevas = colgadas.filter(c => !eran.has(c.sq));
      /* LA QUE YA ESTABA COLGADA Y SIGUE (revisor de ajedrez, 22-nov): h4
         con la dama de c7 comible decía solo "Había Qxb8…" y nada de la
         dama. No es culpa de esta jugada, pero es lo que se pierde. La misma
         pieza en la misma casilla, colgada antes y después. */
      siguen = colgadas.filter(c => antes.some(a => a.sq === c.sq && a.pieza === c.pieza));
      /* "QUEDA SIN DEFENDER" SOLO SI ANTES TENÍA DEFENSA (revisor de ajedrez,
         22-nov). En `r1bqk1nr/pppp1ppp/8/4n3/2BQP3/8/PPP2PPP/RNB1K2R b`, Nc6
         decía "El peón de g7 queda sin defender": no tenía defensores ni
         antes ni después; lo nuevo es que el caballo destapó la dama. Si antes
         nadie la defendía, la jugada no le sacó la defensa: le abrió una
         línea al rival, y eso es `destapada`. Pero solo si la línea del
         atacante pasa por donde estaba la pieza que se movió (o por el peón
         comido al paso): Be2 en `4k3/8/2n5/1B6/3P4/8/8/6K1 w` suelta la
         clavada del caballo de c6 y ahí no se destapó nada (revisor, v1.0.7).
         Sin línea, `sinDefensaAntes`, y la frase neutra: "queda a tiro". */
      const tabEran = new Chess(fenAntes).board(), tabSon = new Chess(f.fen).board();
      const rival = mio === "w" ? "b" : "w";
      const pasos = [deDonde];
      if (f.pieza === "p" && deDonde[0] !== donde[0] && !new Chess(fenAntes).get(donde))
        pasos.push(donde[0] + deDonde[1]);
      for (const c of nuevas) if (c.motivo === "sinDefensa") {
        const atkAntes = atacantesDe(tabEran, c.sq, rival);
        const defAntes = atacantesDe(tabEran, c.sq, mio)
          .filter(d => d.pieza !== "k" || atkAntes.length < 2);
        if (defAntes.length) continue;
        /* el atacante que se nombra es el de la línea, no el más barato: Bd3
           en `4k3/8/2n5/rB2P3/8/8/8/7K w` destapa la torre de a5 y suelta el
           caballo de c6, y "a tiro de un caballo" contaba otro destape */
        const linea = atacantesDe(tabSon, c.sq, rival)
          .filter(a => pasos.some(x => enElMedio(a.sq, x, c.sq)))
          .sort((a, b) => (VALOR[a.pieza] || 0) - (VALOR[b.pieza] || 0))[0];
        if (linea) { c.destapada = true; c.por = linea.pieza; }
        else c.sinDefensaAntes = true;
      }
      /* Salvada: estaba colgada y ya no. Son dos cosas distintas y la frase
         cambia: si la casilla es la de donde salió la jugada, la pieza SE FUE;
         si no, se quedó y ahora está defendida. */
      /* TRES CASOS DONDE "SALVA" MIENTE O NO VIENE AL CASO (v0.133):
         - SE FUE, PERO A OTRA CASILLA EN PELIGRO: no la salvaste, la mudaste
           (23 casos medidos, 9 de ellos cambios).
         - LA JUGADA COMIÓ ALGO QUE VALE LO MISMO O MÁS: lo que pasó es la
           captura, y salvar el peón es un efecto de costado. Es el 17. Bxe2 de
           Juan: se comió una dama y la tarjeta decía "Salva tu peón de c2".
         - LA JUGADA DA MATE: no hay nada más que salvar. */
      const llegaEnPeligro = todasMias.some(c => c.sq === donde);
      const comida = new Chess(fenAntes).get(donde);
      const valeComida = comida && comida.color !== mio ? (VALOR[comida.type] || 0) : 0;
      /* CÓMO SE SALVÓ (v1.0.4, Juan): "Salva" exageraba cuando la jugada solo
         la defiende —Bh6 cuida la dama de g7, pero Qxg7 Bxg7 cambia damas—.
         `como`: "saca" si la pieza se fue (también la torre del enroque, que
         no sale de `deDonde`: `hacia` dice adónde fue); "tapa" si la que se
         movió quedó en medio de una pieza de línea que la atacaba; "defiende"
         si sigue atacada y ya no corre peligro, o sea que la jugada le dio una
         defensa (directa o destapada); null si ya nadie la ataca (se comió o
         se clavó al atacante), y ahí "Salva" es cierto. Con motivo "menor"
         nunca "defiende": defenderla no la saca del peligro, así que si se
         salvó fue porque el atacante barato se fue (cxd4 con la dama de h2
         mirando e5, revisor). Tapar va antes que
         defender: la que se interpone suele cuidarla también, pero lo que
         cambió es que el ataque ya no llega. (Revisor de ajedrez, v1.0.4: con
         "defiende" por la pieza movida, Bxd4 que come al peón atacante decía
         "Defiende tu caballo", y el enroque, "Defiende tu torre de h1".) */
      const tabAntes = new Chess(fenAntes).board(), tabDespues = new Chess(f.fen).board();
      const rivalDe = mio === "w" ? "b" : "w";
      const fila = mio === "w" ? "1" : "8";
      const torreEnroque = /^O-O-O/.test(f.san || "") ? ["a" + fila, "d" + fila]
                         : /^O-O/.test(f.san || "") ? ["h" + fila, "f" + fila] : null;
      const comoSeSalva = c =>
        c.sq === deDonde || (torreEnroque && c.sq === torreEnroque[0]) ? "saca" :
        atacantesDe(tabAntes, c.sq, rivalDe).some(a => "brq".includes(a.pieza) &&
          enElMedio(a.sq, donde, c.sq)) ? "tapa" :
        c.motivo === "sinDefensa" && atacantesDe(tabDespues, c.sq, rivalDe).length ? "defiende" : null;
      const deEnroque = c => torreEnroque && c.sq === torreEnroque[0];
      salvadas = /#$/.test(f.san || "") ? [] :
        antes.filter(c => !son.has(c.sq) && c.sq !== donde)
             .map(c => ({ ...c, seFue: c.sq === deDonde || !!deEnroque(c), como: comoSeSalva(c),
                          ...(deEnroque(c) ? { hacia: torreEnroque[1] } : {}) }))
             .filter(c => !(deEnroque(c) && todasMias.some(x => x.sq === torreEnroque[1])))
             .filter(c => !(c.seFue && !deEnroque(c) && llegaEnPeligro))
             .filter(c => valeComida < (VALOR[c.pieza] || 0));
    }
    /* 3. LO QUE SE VE EN LA POSICIÓN, y que no es ni material ni amenaza.
       Los tres se comparan contra ANTES por el mismo motivo que las colgadas:
       lo que ya estaba no lo causó esta jugada. */
    const tablero = new Chess(f.fen).board();
    const rival = mio === "w" ? "b" : "w";
    const reyRival = casillaDelRey(tablero, rival);
    const clavadas = [];
    /* ¿la pieza "clavada" se puede comer al que clava? (v0.163). Hasta el
       20-nov se preguntaba con las jugadas legales del rival, y el jaque lo
       rompía: en jaque esa captura no es legal AHORA, así que el filtro no
       actuaba y se anunciaban clavadas falsas (Ne7+ en
       6k1/8/4b3/3N4/8/1B6/8/6K1 decía "Clava el alfil de e6", que come al de
       b3; revisor de ajedrez). Es el mismo error de la v0.133 con las
       colgadas: el jaque se contesta en una jugada y la amenaza sigue. Ahora
       es geometría, con `atacantesDe`, que ya sabe que una pieza clavada
       contra su rey solo come sobre la línea de su clavada. */
    const puedeComer = (tab, sq, aQuien) =>
      atacantesDe(tab, aQuien, rival).some(a => a.sq === sq);
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const p = tablero[r][c];
      if (!p || p.color !== rival || p.type === "k") continue;
      const sq = "abcdefgh"[c] + (8 - r);
      const por = reyRival && quienLaClava(tablero, sq, reyRival);
      if (!por) continue;
      if (fenAntes && estaClavada(fenAntes, sq, reyRival)) continue;
      /* CONTRA EL REY SIGUE CLAVADA aunque pueda comer al que clava (en la de
         Juan, Qxb4 es legal y pierde la dama), PERO NO SE DICE si comerlo no
         le cuesta nada: el que clava vale lo mismo o más, o no está defendido.
         "Clava la torre contra el rey" con Qe1 Rxe1 era elogiar perder la dama
         (v0.163, revisor de ajedrez). */
      const quien = tablero[8 - +por[1]]["abcdefgh".indexOf(por[0])];
      if (puedeComer(tablero, sq, por) &&
          (VALOR[quien.type] >= VALOR[p.type] || !atacantesDe(tablero, por, mio).length)) continue;
      clavadas.push({ sq, pieza: p.type, contra: "k", por });
    }
    /* Y CONTRA LA DAMA (v0.162, Juan): la clavada relativa. Detrás de la pieza
       está la dama rival, y lo que clava es una torre o un alfil, o una dama
       si la de atrás no está defendida (abajo). La dama no puede
       estar clavada contra sí misma, y las clavadas contra el rey van primero. */
    const damas = [];
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const p = tablero[r][c];
      if (p && p.type === "q" && p.color === rival) damas.push("abcdefgh"[c] + (8 - r));
    }
    /* DAMA CONTRA DAMA (v0.163; Juan: "es una verdad a medias"): si la que
       clava es una dama, correr la pieza solo ofrece cambiar damas cuando la
       de atrás está defendida; si no lo está, la regala, y ahí sí está
       clavada. Los defensores se cuentan SIN la pieza clavada, que al correrse
       deja de defender. */
    /* Y SI LA CLAVADA PUEDE COMERSE AL QUE CLAVA, NO HAY CLAVADA (v0.163,
       revisor de ajedrez): la torre de e4 "clavada" por la torre de e1 la
       come con Rxe1; el peón de e5 "clavado" por el alfil de d4 juega exd4.
       Como mucho es un cambio, o el que clava queda regalado. Se mira con
       la geometría de `puedeComer`, de arriba. */
    const contraDama = (fen, tab, sq) => {
      for (const dq of damas) {
        const cl = quienLaClava(tab, sq, dq);
        if (!cl) continue;
        const t = tab[8 - +cl[1]]["abcdefgh".indexOf(cl[0])];
        if (!t) continue;
        if (t.type === "q" && atacantesDe(tab, dq, rival).some(d => d.sq !== sq)) continue;
        if (fen === f.fen && puedeComer(tab, sq, cl)) continue;
        return cl;
      }
      return null;
    };
    const tabAntes = fenAntes ? new Chess(fenAntes).board() : null;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const p = tablero[r][c];
      if (!p || p.color !== rival || p.type === "k" || p.type === "q") continue;
      const sq = "abcdefgh"[c] + (8 - r);
      if (clavadas.some(x => x.sq === sq)) continue;
      const por = contraDama(f.fen, tablero, sq);
      if (!por) continue;
      /* antes: la misma pieza en la misma casilla, y la dama donde estaba */
      if (tabAntes) {
        const q = tabAntes[r][c];
        if (q && q.type === p.type && q.color === p.color && contraDama(fenAntes, tabAntes, sq)) continue;
      }
      clavadas.push({ sq, pieza: p.type, contra: "q", por });
    }
    /* el peón que ACABA de quedar pasado: si ya lo era antes de moverse, la
       jugada no hizo nada nuevo */
    const pasado = f.pieza === "p" && esPasado(tablero, donde, mio) &&
      !(fenAntes && esPasado(new Chess(fenAntes).board(), deDonde, mio));
    /* la columna abierta la toman la torre y la dama; un caballo en una columna
       sin peones no significa nada */
    const columna = (f.pieza === "r" || f.pieza === "q") &&
                    columnaAbierta(tablero, donde) ? donde[0] : null;

    /* 4. LO DE LA v0.77. Todo lo de acá es barrer el tablero: ni un FEN cargado
       ni una llamada al motor, así que se paga sin pensarlo. Y TODO se compara
       contra ANTES por el mismo motivo de siempre: lo que ya estaba no lo causó
       esta jugada. */
    const tAntes = fenAntes ? new Chess(fenAntes).board() : null;
    const torreODama = f.pieza === "r" || f.pieza === "q";

    /* la semiabierta la toman la torre y la dama, igual que la abierta */
    const semiabierta = torreODama && columnaSemiabierta(tablero, donde, mio)
                        ? donde[0] : null;

    /* el peón que ACABA de quedar aislado es el que se movió: los demás ya lo
       estaban o no, y esta jugada no los tocó */
    const aislado = f.pieza === "p" && esAislado(tablero, donde, mio) &&
      !(tAntes && esAislado(tAntes, deDonde, mio)) ? donde : null;

    /* doblados en la columna adonde fue la jugada, y solo si ANTES no lo
       estaban: es la marca de haber comido con un peón hacia el costado */
    const col = "abcdefgh".indexOf(donde[0]);
    const doblados = peonesEnColumna(tablero, col, mio) >= 2 &&
      !(tAntes && peonesEnColumna(tAntes, col, mio) >= 2) ? donde[0] : null;

    /* un peón DEL RIVAL que quedó pasado por esta jugada. Es la otra cara de
       `pasado`, y la que más suele doler: se paga en el final. */
    let pasadoContra = null;
    for (let r = 0; r < 8 && !pasadoContra; r++) for (let c = 0; c < 8; c++) {
      const q = tablero[r][c];
      if (!q || q.type !== "p" || q.color !== rival) continue;
      const sq = "abcdefgh"[c] + (8 - r);
      if (!esPasado(tablero, sq, rival)) continue;
      if (tAntes && esPasado(tAntes, sq, rival)) continue;
      pasadoContra = sq; break;
    }

    /* y no si en la jugada siguiente se pierde uno de los dos: el que comió,
       aunque sea en un cambio parejo (Bxg5 Nxg5), u otro que quedó colgado
       (Nxc4 dxc5) (`seLaLlevan`, v1.0.6) */
    let pareja = hayPareja(tablero, mio) && !(tAntes && hayPareja(tAntes, mio));
    for (let r = 0; r < 8 && pareja; r++) for (let c = 0; c < 8 && pareja; c++) {
      const q = tablero[r][c];
      if (!q || q.type !== "b" || q.color !== mio) continue;
      const sq = "abcdefgh"[c] + (8 - r);
      if (seLaLlevan(f.fen, sq, sq !== donde)) pareja = false;
    }
    const septima = f.pieza === "r" && esLaSeptima(donde, mio) ? donde : null;
    const sinDamas = !hayDamas(tablero) && !!(tAntes && hayDamas(tAntes));
    const conectadas = tAntes && torresConectadas(tAntes, mio)
                     ? null : torresConectadas(tablero, mio);
    const plantado = f.pieza === "n" && estaPlantado(tablero, donde, mio) &&
      !(tAntes && estaPlantado(tAntes, deDonde, mio)) ? donde : null;

    /* estas tres las contesta el SAN y el propio FEN, sin mirar el tablero */
    const corona = /=/.test(f.san || "");
    const enroque = /^O-O-O/.test(f.san || "") ? "largo"
                  : /^O-O/.test(f.san || "") ? "corto" : null;
    let pierdeEnroque = null;
    if (fenAntes && !enroque) {
      const a = enroquesDe(fenAntes, mio), b = enroquesDe(f.fen, mio);
      const perdidos = [a.corto && !b.corto ? "corto" : null,
                        a.largo && !b.largo ? "largo" : null].filter(Boolean);
      if (perdidos.length === 2) pierdeEnroque = "los dos";
      else if (perdidos.length === 1) pierdeEnroque = perdidos[0];
    }

    /* cuántas jugadas legales le quedan al rival: es el aviso de ahogado, y
       solo significa algo si NO está en jaque —en jaque, pocas jugadas es mate
       a la vista, que es otra cosa y ya la dice la barra—. */
    const jr = new Chess(f.fen);
    const legalesRival = jr.turn() === rival && !jr.in_check()
                       ? jr.moves().length : null;

    /* 5. LOS TRES CAROS (v0.78). Estos sí cargan FENs, y por eso están acá
       abajo y acotados: la tarjeta se pinta UNA vez, el barrido de un año no
       los paga nunca. */

    /* ATRAPADA: se pregunta por UNA sola pieza, la más cara de las del rival
       que ya están comibles, y nunca por un peón. Cada salida cuesta un FEN.
       La comparación contra ANTES necesita el turno dado vuelta: en `fenAntes`
       mueve el otro, y `estaAtrapada` pide que la pieza sea del que mueve. */
    /* UNA PIEZA CLAVADA NO ESTÁ ATRAPADA, y esto se vio en la pantalla: la
       jugada 10 de la partida de prueba decía "Atrapa el caballo de e4" cuando
       lo que pasaba era que estaba CLAVADO. Una clavada no tiene salidas
       legales, así que cumple la definición por el motivo equivocado, y encima
       ya tenemos una frase que lo dice mejor. Se pregunta con `estaClavada` y
       no con la lista `clavadas`, que solo trae las NUEVAS: una pieza clavada
       desde hace tres jugadas sigue sin estar atrapada. */
    const candidata = colgadasDe(f.fen, rival)
      .find(c => c.pieza !== "p" && !estaClavada(f.fen, c.sq, reyRival));
    let atrapada = null;
    if (candidata && estaAtrapada(f.fen, candidata.sq)) {
      let yaEstaba = false;
      if (fenAntes) {
        try { yaEstaba = estaAtrapada(conElTurnoDadoVuelta(fenAntes), candidata.sq); }
        catch (e) { yaEstaba = false; }
      }
      if (!yaEstaba) atrapada = candidata;
    }

    /* JAQUE DESCUBIERTO: hay jaque y NO lo da la pieza que se movió. En `f.fen`
       mueve el rival, así que `in_check` es el jaque en su contra. */
    let descubierto = null;
    if (reyRival && new Chess(f.fen).in_check() && !ataca(tablero, donde, reyRival)) {
      for (let r = 0; r < 8 && !descubierto; r++) for (let c = 0; c < 8; c++) {
        const q = tablero[r][c];
        if (!q || q.color !== mio) continue;
        const sq = "abcdefgh"[c] + (8 - r);
        if (sq !== donde && ataca(tablero, sq, reyRival)) {
          descubierto = { sq, pieza: q.type }; break;
        }
      }
    }

    /* ATAQUE A LA DESCUBIERTA: una pieza mía que ANTES no atacaba y ahora sí,
       con la casilla que se dejó JUSTO EN EL MEDIO de la línea. Sin lo del
       medio, cualquier ataque nuevo se llamaría descubierta. Y solo cuenta
       contra algo que vale más que la que ataca, que es el mismo criterio de
       las amenazadas: atacar algo que vale igual o menos es una oferta de
       cambio, no una amenaza. */
    let descubierta = null;
    if (tAntes) {
      for (let r = 0; r < 8 && !descubierta; r++) for (let c = 0; c < 8 && !descubierta; c++) {
        const q = tablero[r][c];
        if (!q || q.color !== mio || q.type === "k" || q.type === "n" || q.type === "p") continue;
        const sq = "abcdefgh"[c] + (8 - r);
        if (sq === donde) continue;
        for (let r2 = 0; r2 < 8 && !descubierta; r2++) for (let c2 = 0; c2 < 8; c2++) {
          const v = tablero[r2][c2];
          if (!v || v.color !== rival || v.type === "k") continue;
          if ((VALOR[v.type] || 0) <= (VALOR[q.type] || 0)) continue;
          const sv = "abcdefgh"[c2] + (8 - r2);
          if (!ataca(tablero, sq, sv) || ataca(tAntes, sq, sv)) continue;
          if (!enElMedio(sq, deDonde, sv)) continue;
          descubierta = { sq, pieza: q.type, sobre: sv, suya: v.type }; break;
        }
      }
    }

    /* LO QUE SE PIERDE EN EL CAMBIO (20-nov, revisor de ajedrez): la pieza
       que moví tiene recaptura —así que no "queda comible"— pero cambiar ahí
       igual me cuesta. Se resta lo que la jugada comió, y solo cuenta desde
       dos peones netos: menos que eso es ruido de la cuenta (un alfil por un
       caballo, un peón de más o de menos). Desde la v1.0.2, desde UNO: el
       corte de dos casi no cambiaba nada (medido en la v0.178.1) y lo que
       fallaba era lo que dejaba la pieza que recaptura, que ya se cuenta. */
    let cambio = null, coronaPerdida = false;
    const ca = cambioEn(f.fen, donde);
    if (ca.linea.length) {
      const comio = fenAntes ? new Chess(fenAntes).get(donde) : null;
      /* lo que ganó la coronación también se resta (revisor de ajedrez): d8=Q+
         Rxd8 Rxd8+ da un peón y gana una torre, no "tu dama por una torre". Y
         lo que se perdió en d8 es el peón. */
      const corono = f.uci.length > 4 ? (VALOR[f.uci[4]] || 0) - VALOR.p : 0;
      const pierde = ca.neto - corono -
                     (comio && comio.color !== mio ? (VALOR[comio.type] || 0) : 0);
      /* LA CORONACIÓN QUE SE PIERDE AUNQUE TENGA DEFENSA (revisor de ajedrez,
         v0.178.4): c8=Q Rbxc8 Qxc8 Rxc8 en `1r1r3k/2P5/8/8/8/8/2Q5/6K1 w`.
         No queda comible y el cambio nunca llega a 2 (la cuenta descuenta lo
         que ganó la coronación), pero se va el peón: no se festeja. */
      coronaPerdida = corono > 0 && pierde >= 1;
      if (pierde >= 1)
        cambio = { pierde,
                   mias: ca.linea.filter((_, k) => k % 2 === 0)
                           .map((m, k) => k === 0 && corono ? "p" : m.captured),
                   suyas: [...(comio && comio.color !== mio ? [comio.type] : []),
                           ...ca.linea.filter((_, k) => k % 2 === 1).map(m => m.captured),
                           ...(ca.cobra ? [ca.cobra] : [])] };
    }

    return { amenazadas, colgadas, nuevas, siguen, salvadas, clavadas, pasado, columna,
             semiabierta, aislado, doblados, pasadoContra, pareja, septima,
             sinDamas, conectadas, plantado, corona, enroque, pierdeEnroque,
             legalesRival, atrapada, descubierto, descubierta, cambio, coronaPerdida };
  } catch (e) { return vacio; }
}

/* ============ el nombre de la apertura, en castellano (v0.130) ============
   `aperturas.json` trae los nombres en inglés ("C54 Italian Game: Giuoco Piano,
   Therkatz-Herzog Variation") y la app habla en castellano. Lavado de cara del
   revisor (v0.123), resuelto con la B de cuatro variantes: el subtítulo de la
   Partida dice FAMILIA Y PRIMERA VARIANTE, separadas por dos puntos
   ("Apertura italiana: Giuoco Piano"), y si no entra en el renglón, solo la
   familia —nunca "…", que era la queja de Juan (10-nov)—. Eso último lo
   decide el DOM, midiendo, en `ajustarApertura`.

   NO SE TRADUCE TODO, y es a propósito. Las 149 familias salen limpias con una
   regla y tres diccionarios chicos. Las ~1.060 primeras variantes son casi todas
   nombres propios ("Najdorf", "Giuoco Piano") y se traducen solo cuando cada
   palabra es un nombre propio o una que sabemos decir ("Classical" → clásica);
   si queda UNA palabra en inglés que no conocemos, la variante no se muestra y
   va la familia sola. Un castellano a medias ("variante Fried Liver Attack") es
   peor que no decirla (revisor). La prueba de unidad recorre los 3.329 nombres y
   falla si a la salida queda una palabra de `AP_INGLES`. */
const AP_TIPO = {
  Defense: ["Defensa", "f"], Opening: ["Apertura", "f"], Game: ["Apertura", "f"],
  Gambit: ["Gambito", "m"], Countergambit: ["Contragambito", "m"], Attack: ["Ataque", "m"],
  System: ["Sistema", "m"], Formation: ["Formación", "f"], Variation: ["Variante", "f"],
  Line: ["Línea", "f"], Counterattack: ["Contraataque", "m"], Trap: ["Trampa", "f"],
};
/* adjetivos: [femenino, masculino] */
const AP_ADJ = {
  Australian: ["australiana", "australiano"], Basque: ["vasca", "vasco"],
  Czech: ["checa", "checo"], Dutch: ["holandesa", "holandés"], English: ["inglesa", "inglés"],
  French: ["francesa", "francés"], Hungarian: ["húngara", "húngaro"], Indian: ["india", "indio"],
  Italian: ["italiana", "italiano"], Mexican: ["mexicana", "mexicano"],
  Modern: ["moderna", "moderno"], Polish: ["polaca", "polaco"],
  Portuguese: ["portuguesa", "portugués"], Scandinavian: ["escandinava", "escandinavo"],
  Scotch: ["escocesa", "escocés"], Sicilian: ["siciliana", "siciliano"], Slav: ["eslava", "eslavo"],
  "Semi-Slav": ["semieslava", "semieslavo"], Catalan: ["catalana", "catalán"],
  Vienna: ["vienesa", "vienés"], Danish: ["danesa", "danés"], Irish: ["irlandesa", "irlandés"],
  Latvian: ["letona", "letón"], "Bogo-Indian": ["bogoindia", "bogoindio"],
  "Nimzo-Indian": ["nimzoindia", "nimzoindio"], "Old Indian": ["india antigua", "indio antiguo"],
  "East Indian": ["india del este", "indio del este"],
  "King's Indian": ["india de rey", "indio de rey"], "Queen's Indian": ["india de dama", "indio de dama"],
  "Pseudo Queen's Indian": ["seudo india de dama", "seudo indio de dama"],
  Classical: ["clásica", "clásico"], Closed: ["cerrada", "cerrado"], Open: ["abierta", "abierto"],
  Normal: ["normal", "normal"], Symmetrical: ["simétrica", "simétrico"],
  Accelerated: ["acelerada", "acelerado"], Hyperaccelerated: ["hiperacelerada", "hiperacelerado"],
  Delayed: ["retrasada", "retrasado"], Deferred: ["diferida", "diferido"],
  Reversed: ["invertida", "invertido"], Double: ["doble", "doble"], Quiet: ["tranquila", "tranquilo"],
  Central: ["central", "central"], Orthodox: ["ortodoxa", "ortodoxo"], Old: ["antigua", "antiguo"],
  Spanish: ["española", "español"], Russian: ["rusa", "ruso"], Austrian: ["austríaca", "austríaco"],
  Swedish: ["sueca", "sueco"], Bulgarian: ["búlgara", "búlgaro"], Chinese: ["china", "chino"],
  Swiss: ["suiza", "suizo"], German: ["alemana", "alemán"], Norwegian: ["noruega", "noruego"],
  Yugoslav: ["yugoslava", "yugoslavo"], Traditional: ["tradicional", "tradicional"],
  Standard: ["estándar", "estándar"], Main: ["principal", "principal"],
  "Neo-Grünfeld": ["neo-Grünfeld", "neo-Grünfeld"],
};
/* complementos que van con "de": no cambian con el género */
const AP_DE = {
  "King's": "de rey", "Queen's": "de dama", "Bishop's": "de alfil", "King's Pawn": "de peón de rey",
  "Queen's Pawn": "de peón de dama", "King's Knight": "de caballo de rey",
  "Two Knights": "de los dos caballos", "Four Knights": "de los cuatro caballos",
  "Three Knights": "de los tres caballos", Center: "del centro", Elephant: "del elefante",
  Hippopotamus: "del hipopótamo", Lion: "del león", Rat: "de la rata", Vulture: "del buitre",
  Exchange: "del cambio", Advance: "del avance", Fianchetto: "del fianchetto",
  Dragon: "del dragón", "Accelerated Dragon": "del dragón acelerado",
};
/* nombres propios con nombre castellano */
const AP_PROPIO = {
  Kangaroo: "canguro", Pterodactyl: "pterodáctilo", Amazon: "Amazonas", Saragossa: "Zaragoza",
  Dresden: "Dresde", "St.": "San", George: "Jorge", Amsterdam: "Ámsterdam", London: "Londres",
  Leningrad: "Leningrado", Moscow: "Moscú", Paris: "París", Prague: "Praga",
  Copenhagen: "Copenhague", Warsaw: "Varsovia", Brussels: "Bruselas", Cologne: "Colonia",
  Venice: "Venecia", Zurich: "Zúrich", Lopez: "López", Petersburg: "Petersburgo",
};
const AP_FIJO = {
  "Ruy Lopez": "Apertura española", "English Orangutan": "Apertura inglesa, orangután",
  "Slav Indian": "India eslava", "Queen's Indian Accelerated": "India de dama acelerada",
  "Lasker Simul Special": "Especial de Lasker", Formation: "Formación",
  "Queen's Pawn, Mengarini Attack": "Peón de dama, ataque Mengarini",
  "Vienna Gambit, with Max Lange Defense": "Gambito vienés, con defensa Max Lange",
};
/* familias que no dicen nada: el nombre está en la variante, que va sola */
const AP_COMODIN = new Set(["Queen's Pawn Game", "King's Pawn Game", "King's Pawn Opening",
  "Indian Defense", "King's Knight Opening", "Zukertort Opening"]);
/* PALABRAS EN INGLÉS que no son nombres propios. No hace falta que esté todo el
   idioma: es la lista de las que aparecen en las variantes, para que una que no
   sabemos decir no pase por apellido. La prueba de unidad la usa al revés. */
const AP_INGLES = new Set(("Variation Variations Gambit Defense Attack Countergambit System " +
  "Reversed Accepted Declined Knights Knight Knight's Indian Fianchetto King King's Queen " +
  "Queen's Opening Accelerated Double Modern Invitation Line Two Three Four Six Deferred " +
  "Counterattack Spike Formation Trap The Pawn Pawns Classical Old Central Exchange " +
  "Symmetrical Symmetric Advance Wing Quiet Closed Open Mate Queenside Kingside Bishop " +
  "Bishop's Folly Hybrid Normal Connection Standard Endgame Delayed Hyperaccelerated Clam " +
  "Corkscrew Halloween with Fool's Shy Beginner's Outflank Rooks Swap Bouncing Crab Meadow " +
  "Hay Duck Arctic Black Mustang Drunken Cavalry Walrus Potato Penguin Great Snake " +
  "Porcupine Defensive Drill Main Mosquito Lizard Cormorant Hawk Snail Push Edge Poisoned " +
  "Raptor Aged Return Storming Fully Walk Tour Storm Kingfisher Second Lion Lion's Jaw Wind " +
  "Unicorn Squirrel Transfer Hunt Eastern Western Bayonet Apocalypse Offer Alien Martian " +
  "Big Clamp Brick Extension Mongoose Pin Head Tortoise Wayward Whale Small Center Giraffe " +
  "Mafia Dodo Tumbleweed Traditional Wasp Lobster Game Goblin Millennium Retreat Noah's Ark " +
  "Move Order New Counterthrust West Woodchuck Snagglepuss Picklepuss Hillbilly Beefeater " +
  "Woozle Mediterranean Horsefly Harmonist Dragon Elephant Rat Vulture Hippopotamus Kangaroo Amazon Spanish Italian English " +
  "French Dutch Russian Austrian Hungarian Swedish Polish Czech Bulgarian Chinese Swiss " +
  "German Norwegian Mexican Australian Icelandic Lithuanian Finnish Siberian Ukrainian " +
  "Bavarian Westphalian Valencian Portuguese Scandinavian Baltic Netherlands Sicilian Scotch " +
  "Vienna Slav Catalan Orthodox Yugoslav Danish Irish Latvian Basque Liver Special Simul " +
  "Orangutan").split(" "));
/* y las compuestas con un gentilicio inglés ("Czech-Indian", "Nimzo-Dutch",
   "Icelandic-Palme") o con números ("System3"), que pasaban por apellido
   (revisor, v0.130) */
const AP_PREFIJO_INGLES = /^(Anti|Pseudo|Ultra|Semi|Neo|Franco|Anglo|Double|Icelandic)-|-(Indian|Polish|American|Dutch)$|\d/;

/* una frase de palabras sueltas → castellano, o null si queda inglés adentro */
function apTraducir(palabras, tipo) {
  const [cab, g] = AP_TIPO[tipo];
  const propios = [], adjs = [], des = [];
  for (let i = 0; i < palabras.length; i++) {
    const dos = palabras[i] + " " + palabras[i + 1], tres = dos + " " + palabras[i + 2];
    if (AP_ADJ[tres] || AP_DE[tres]) { (AP_ADJ[tres] ? adjs : des).push(AP_ADJ[tres] ? AP_ADJ[tres][g === "f" ? 0 : 1] : AP_DE[tres]); i += 2; continue; }
    if (AP_ADJ[dos] || AP_DE[dos]) { (AP_ADJ[dos] ? adjs : des).push(AP_ADJ[dos] ? AP_ADJ[dos][g === "f" ? 0 : 1] : AP_DE[dos]); i++; continue; }
    const p = palabras[i];
    if (AP_ADJ[p]) adjs.push(AP_ADJ[p][g === "f" ? 0 : 1]);
    else if (AP_DE[p]) des.push(AP_DE[p]);
    else if (AP_PROPIO[p]) propios.push(AP_PROPIO[p]);
    else if (AP_INGLES.has(p) || AP_PREFIJO_INGLES.test(p) || /^[a-z]/.test(p)) return null;
    else propios.push(p.replace(/'s?$/, ""));
  }
  return [cab, ...propios, ...adjs, ...des].join(" ");
}
const AP_PARTE = /^(.*?)\s*\b(Defense|Opening|Game|Gambit|Countergambit|Attack|System|Formation|Variation|Line|Counterattack|Trap)(?: (Accepted|Declined))?$/;
function apParte(s) {
  if (s === "Main Line") return "Línea principal";
  const m = s.match(AP_PARTE);
  if (!m) return null;
  const es = apTraducir(m[1] ? m[1].split(/\s+/) : [], m[2]);
  if (!es) return null;
  const g = AP_TIPO[m[2]][1];
  if (!m[3]) return es;
  return es + (m[3] === "Accepted" ? (g === "f" ? " aceptada" : " aceptado")
                                   : (g === "f" ? " rehusada" : " rehusado"));
}
function apertFamilia(f) {
  if (AP_FIJO[f]) return AP_FIJO[f];
  let resto = "";
  const coma = f.indexOf(", ");
  if (coma > 0) { resto = f.slice(coma + 2); f = f.slice(0, coma); }
  const es = AP_FIJO[f] || apParte(f);
  if (!es) return null;
  const con = /^with [\w+]+$/.test(resto) ? resto.replace(/^with /, "con ") : "";
  return con ? es + ", " + con : es;
}
/* La variante: si son solo nombres propios, el nombre pelado ("Najdorf",
   "Giuoco Piano"), que "variante" no agrega nada; si lleva un adjetivo, con su
   palabra en minúscula ("variante del cambio", "sistema Londres acelerado"). */
function apertVariante(s) {
  if (!s) return null;
  if (!AP_PARTE.test(s) && s !== "Main Line") {
    /* nombre propio suelto: "Giuoco Piano", "Max Lange"; o solo adjetivos,
       que son una variante sin decirlo ("Closed" → variante cerrada,
       "Accelerated Dragon" → variante del dragón acelerado) */
    const ps = s.split(/\s+/);
    const comoVar = apTraducir(ps, "Variation");
    if (comoVar && ps.every(p => AP_ADJ[p] || AP_DE[p] || AP_DE[s] || AP_ADJ[s]))
      return comoVar[0].toLowerCase() + comoVar.slice(1);
    if (ps.some(p => AP_INGLES.has(p) || AP_PREFIJO_INGLES.test(p) || /^[a-z]/.test(p))) return null;
    return ps.map(p => AP_PROPIO[p] || p).join(" ");
  }
  const es = apParte(s);
  if (!es) return null;
  const m = s.match(AP_PARTE);
  if (m && m[2] === "Variation" && !m[3]) {
    const pel = es.replace(/^Variante /, "");
    if (/^[A-ZÁÉÍÓÚÜ]/.test(pel) && !pel.split(" ").some(w => /^[a-záéíóúü]/.test(w))) return pel;
  }
  return es[0].toLowerCase() + es.slice(1);
}
/* Devuelve { largo, corto }: lo que se intenta y el respaldo si no entra. */
function aperturaEs(nombre) {
  const sinEco = (nombre || "").replace(/^[A-E]\d\d\s+/, "");
  if (!sinEco) return { largo: "", corto: "" };
  const [famEn, varEn] = sinEco.split(": ");
  const fam = apertFamilia(famEn) || famEn;
  const vari = apertVariante(varEn && varEn.split(", ")[0]);
  if (!vari) return { largo: fam, corto: fam };
  if (AP_COMODIN.has(famEn)) {
    const sola = vari[0].toUpperCase() + vari.slice(1);
    return { largo: sola, corto: sola.length < fam.length + 12 ? sola : fam };
  }
  return { largo: fam + ": " + vari, corto: fam };
}

/* EL NOMBRE DE LA APERTURA HASTA ACÁ (v0.159; lavado del revisor, v0.148).
   Con 3. Bc4 ya es la Italiana y con 3… Bc5 el Giuoco Piano: ver cómo se
   afina enseña, y arriba solo está el nombre final. Va en la TARJETA de las
   jugadas de libro, que habla de la jugada en la que estás parado; la
   cabecera sigue con el de la partida entera. Dos formas, porque Juan no se
   decidió y lo elige usando la app (ajuste "Nombre de la apertura"):
   - "cambia" (la de fábrica): el nombre SOLO en la jugada que le da nombre o
     lo afina, "Ahora es el Giuoco Piano.", en lugar de la frase. En las
     otras no se repite y va la frase de la jugada.
   - "siempre": el nombre en cada jugada de libro, y después la frase.
   `nombres` es el mapa del libro (posición → nombre en inglés, con ECO) y
   `claves` las posiciones de la partida hasta la jugada, en orden. */
function aperturaHastaAca(claves, nombres) {
  /* "Variante normal" y "Línea principal" solas no son un nombre: dicen que
     no pasó nada (2… Nc6 de la del caballo de rey), así que no cuentan */
  const nombreEn = k => {
    const n = nombres[k] && aperturaEs(nombres[k]).largo;
    return n && !/^(variante normal|línea principal)$/i.test(n) ? n : "";
  };
  let i = claves.length - 1;
  while (i >= 0 && !nombreEn(claves[i])) i--;
  if (i < 0) return null;
  const nombre = nombreEn(claves[i]);
  /* cambia si ESTA posición tiene nombre y el de antes era otro (o no había) */
  let j = i - 1;
  while (j >= 0 && !nombreEn(claves[j])) j--;
  const antes = j >= 0 ? nombreEn(claves[j]) : "";
  /* lo NUEVO: si la familia es la misma de antes, solo la variante
     ("el Giuoco Piano", no "la Apertura italiana: Giuoco Piano" otra vez) */
  const [fam, vari] = nombre.split(": ");
  const nuevo = vari && antes.split(": ")[0] === fam ? vari : nombre;
  return { nombre, nuevo, primera: !antes, cambia: i === claves.length - 1 && antes !== nombre };
}
/* el artículo sale de la primera palabra: las cabezas de AP_TIPO más
   "Partida"; lo demás (Gambito, Ataque, Giuoco Piano…) es masculino */
const AP_FEMENINAS = new Set(["apertura", "defensa", "formación", "variante", "línea", "trampa", "partida"]);
/* y en mitad de la oración, el sustantivo común va en minúscula ("la
   apertura italiana", "el gambito Evans"); lo propio queda ("el Giuoco
   Piano") (revisor) */
const AP_COMUNES = new Set([...AP_FEMENINAS, "gambito", "contragambito", "ataque", "sistema", "contraataque"]);
const conArticulo = n => {
  const [p0, ...resto] = n.split(" ");
  const p = AP_COMUNES.has(p0.toLowerCase()) ? p0.toLowerCase() : p0;
  return (AP_FEMENINAS.has(p0.toLowerCase()) ? "la " : "el ") + [p, ...resto].join(" ");
};
/* la frase que suma la tarjeta, o null si en esta jugada no va */
function fraseDeApertura(ap, modo) {
  if (!ap) return null;
  if (modo === "siempre") return ap.nombre + ".";
  /* "Ahora" solo si antes había otro: en 1. e4 no hay un antes (revisor) */
  return ap.cambia ? `${ap.primera ? "Es" : "Ahora es"} ${conArticulo(ap.nuevo)}.` : null;
}

/* ===================== fin del bloque de análisis ====================== */
