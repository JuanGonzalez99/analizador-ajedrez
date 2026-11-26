/* ============ la explicación de la jugada ============ */

/* Cada pieza con su artículo. El género cambia —"el caballo", "la torre"— y
   armarlo suelto en cada frase se olvida en alguna. */
const PIEZA_EL = { p: "el peón", n: "el caballo", b: "el alfil",
                   r: "la torre", q: "la dama", k: "el rey" };
const PIEZA_TU = { p: "tu peón", n: "tu caballo", b: "tu alfil",
                   r: "tu torre", q: "tu dama", k: "tu rey" };
/* "con un peón" y no "con el peón": la que importa es CUÁL PIEZA, no cuál de
   todas. La dama y el rey van con artículo definido porque hay una sola. */
const PIEZA_UN = { p: "un peón", n: "un caballo", b: "un alfil",
                   r: "una torre", q: "la dama", k: "el rey" };
/* "el alfil de c5": la pieza del rival se nombra con su casilla, o en una
   posición con dos alfiles la frase no dice cuál. */
const piezaEn = (t, sq) => `${PIEZA_EL[t] || "la pieza"} de ${sq}`;

/* El material se cuenta en PEONES y no en "puntos", y no es capricho: la
   tarjeta ya dice "12,3 puntos de victoria" un renglón más arriba, así que dos
   "puntos" con significados distintos en la misma tarjeta sería el mismo error
   de denominadores que sacó la columna "% resto" (§4quinquies).

   OJO: `gana` es el VALOR, no la pieza. Sale de VALOR, así que 3 puede ser un
   caballo o un alfil, y con recaptura de por medio es la diferencia. Por eso la
   frase dice cuánto vale y NUNCA qué pieza es. */
const enPeones = n => n === 1 ? "un peón" : `${n} peones`;

/* Qué se llevaba una captura, en palabras. Son DOS frases distintas y la
   diferencia no es de estilo:
   - sin recaptura, se sabe exactamente qué pieza cae, y decirlo es más claro
     que cualquier número: "se llevaba el caballo";
   - con recaptura, lo que queda es un saldo, y ahí nombrar la pieza mentiría
     —cobrás la dama pero entregás la torre—, así que se dice el saldo.
   `gana` es el neto y `VALOR[comida]` el bruto: que sean distintos ES la
   definición de que hubo recaptura, así que no hace falta calcularla de nuevo. */
const loQueSeLlevaba = cap => {
  const bruto = VALOR[cap.comida] || 0;
  return cap.comida && cap.gana === bruto
    ? `se llevaba ${PIEZA_EL[cap.comida] || "material"}`
    : `ganaba ${enPeones(cap.gana)} en el cambio`;
};

const mayus = s => s.charAt(0).toUpperCase() + s.slice(1);

/* La explicación redactada de una jugada: lo que la tarjeta dice ADEMÁS de la
   frase fija de la categoría. Hoy "Empeora la posición" es igual para las 400
   jugadas de un mes; esto la vuelve de esa jugada.

   ES PURA Y SE DERIVA AL PINTAR, no se guarda. Lo que está en la caché son las
   evaluaciones, no las filas, así que las partidas ya analizadas estrenan el
   texto sin migrar nada y sin volver a correr el motor.

   REGLA DURA: acá no se afirma nada que no esté medido (§5 regla 1). Cada frase
   sale de un campo que calculó chess.js o el motor. "Debilita el enroque" o
   "gana espacio" NO se pueden decir por más que suenen bien: no los medimos.
   Por el mismo motivo devuelve "" cuando no hay nada honesto que agregar, en
   vez de rellenar: una frase vacía en la tarjeta de todas las jugadas enseña a
   no leer la tarjeta.

   Como mucho DOS frases. Es una tarjeta de celular y compite con el tablero por
   la pantalla; el orden de abajo es el que decide cuáles dos sobreviven.

   `mejorSan` viene de afuera: pasar el UCI del motor a notación necesita la
   posición ANTERIOR, y la fila guarda la de después. Va null cuando la jugada
   ya era la mejor, que es cuando no hay alternativa que ofrecer.

   `mio` dice si la jugada es del usuario, y lo único que cambia es "el caballo"
   → "tu caballo". El resto queda impersonal a propósito: con un PGN pegado no
   se sabe de qué lado jugaba, y una frase que tutea a medias se lee peor que
   una que no tutea nunca.

   Desde la v0.69 la función que hace todo esto devuelve PARTES y no una cadena;
   `explicarJugada` es el join, y está al final. */

/* La explicación, EN PARTES. Cada parte es una frase con tres cosas:
   `txt` la frase entera, `marca` EL NOMBRE DEL CONCEPTO adentro de esa frase
   —el pedacito que se toca— y `sq` o `uci`, que es lo que se enciende en el
   tablero cuando lo tocás.

   LA MARCA ES EL CONCEPTO Y NO LA FRASE ENTERA, por decisión del usuario y
   porque es lo que hace chess.com: ellos resaltan "indefenso", "ataque doble",
   "columna abierta". La frase entera subrayada se probó en la v0.69 y se
   cambió: leer una frase que es toda un botón cuesta más, y el nombre del
   concepto es además lo que se aprende.

   ESO ES LO QUE CAMBIÓ EN LA v0.69, y sale de una captura del usuario: cuando
   chess.com resalta una palabra —"indefenso"— NO te la explica, te la MUESTRA
   en el tablero. La frase y el tablero son la misma cosa dicha dos veces, y
   tocar una la enciende en el otro.

   Por eso la explicación deja de ser una cadena y pasa a ser una lista: la
   cadena se sigue armando —`explicarJugada` es el join— y todo lo que la
   probaba sigue valiendo, pero ahora además se sabe QUÉ señala cada frase.

   El resto de las reglas no cambió: como mucho dos frases, nada que no esté
   medido, y "" cuando no hay nada honesto que decir. */
function partesDeLaExplicacion(f, mejorSan = null, mio = null, sanRival = null,
                               obs = null, ctx = null) {
  /* En una forzada no hubo decisión y la tarjeta ya lo dice entera: cualquier
     cosa que agreguemos acá juzga algo que no se eligió. */
  /* 0. LA PARTIDA SE TERMINA EN EL TABLERO (v0.168, Juan). El mate se dice y
     nada más: cualquier otra frase —"ataca la dama", "la posición pasa a
     ganada"— habla de una partida que ya no sigue. Las tablas dicen por qué
     —ahogado, material, 50 jugadas— y dejan lugar a lo que había, que es lo
     que importa si el que las hizo ganaba (una Omisión de mate que ahoga
     dice qué mate se omitió; revisor de ajedrez). Va ANTES de la forzada:
     decir que hubo mate o ahogado no juzga una elección, es el tablero (el
     ahogado forzado es el truco clásico del que va perdiendo).
     `remate` solo existe en la última jugada de lo que se juzgó: la de la
     partida, o la probada en la variante. La triple repetición no está en el
     FEN y no se dice (ver `remateEnTablero`). */
  let tablas = null;
  if (f && f.remate && f.fen) {
    const t = new Chess(f.fen), rey = casillaDelRey(t.board(), t.turn());
    if (t.in_checkmate()) return [{ txt: "Jaque mate.", marca: "Jaque mate", sq: rey }];
    if (t.in_stalemate())
      tablas = { txt: `${mio ? "Ahogás" : "Ahoga"} al rey: tablas.`, marca: mio ? "Ahogás" : "Ahoga", sq: rey };
    else if (t.insufficient_material())
      tablas = { txt: "Ya no queda material para dar mate: tablas.", marca: "material para dar mate" };
    else if (t.in_draw())
      tablas = { txt: "Se cumplen 50 jugadas sin capturas ni movimientos de peón: tablas.",
                 marca: "50 jugadas" };
  }
  if (!f || f.forzada) return tablas ? [tablas] : [];
  /* EL PEÓN QUE CORONA YA NO ES UN PEÓN (Juan, 20-nov, sobre la v0.178): con
     c8=Q Rxc8 la tarjeta decía "Tu peón queda comible en c8", y en c8 hay una
     dama. "Tu peón coronado" nombra las dos cosas: lo que era y que ya coronó. */
  const corono = f.pieza === "p" && (f.uci || "").length > 4;
  const pieza = corono ? `${mio ? "tu" : "el"} peón coronado`
                       : (mio ? PIEZA_TU : PIEZA_EL)[f.pieza] || "la pieza";
  const donde = (f.uci || "").slice(2, 4);
  const suya = t => (mio ? PIEZA_TU : PIEZA_EL)[t] || "la pieza";

  /* 1. EL MECANISMO: qué salió mal. Uno solo, el más grave, o la tarjeta se
     vuelve una lista. El corte de 0,5 es el mismo que ya usan las señales: un
     mecanismo que no costó nada no es un hallazgo, es una coincidencia. */
  let mecanismo = null;
  /* CON UN SOLO PEÓN, SOLO SI EL MOTOR COME AHÍ (revisor de ajedrez, v1.0.2):
     el corte bajó a uno y la cuenta estática a veces señala un peón cuando lo
     que se pierde es otra cosa (g4 con la dama ya colgada; d5 donde comer es
     un error). Desde dos peones, como antes. */
  const cambioDice = !!(obs && obs.cambio && f.perdida >= 0.5 &&
    (obs.cambio.pierde >= 2 || (f.mejorRival || "").slice(2, 4) === donde));
  if (f.mateContra)
    mecanismo = { txt: `Deja mate forzado en ${f.mateContra} en contra.`,
                  marca: "mate forzado" };
  /* la que comió una pieza y queda comible es un cambio que pierde (revisor
     de ajedrez, v1.2.3): Rxd5 exd5 es "tu torre por un alfil", no un regalo.
     Si comió un peón, no: Qxh7 Nxh7 es dejar la dama colgada por un peón, y
     eso se dice "queda comible" (un cambio es cuando se van piezas de los dos
     lados) */
  const comioPieza = !!(obs && obs.cambio && obs.cambio.suyas.length &&
                        PIEZA_UN[obs.cambio.suyas[0]] && obs.cambio.suyas[0] !== "p");
  if (mecanismo) { /* el mate forzado ya está */ }
  else if (f.colgada && f.perdida >= 0.5 && !comioPieza)
    mecanismo = { txt: `${mayus(pieza)} queda comible en ${donde}.`,
                  marca: "queda comible", sq: donde };
  else if (f.colgada && f.perdida >= 0.5) {
    const nom = (ts, tabla) => ts.map(t => tabla[t] || "una pieza").join(" y ");
    mecanismo = { txt: `Pierde material en el cambio: ${nom(obs.cambio.mias, mio ? PIEZA_TU : PIEZA_EL)}` +
                       ` por ${nom(obs.cambio.suyas, PIEZA_UN)}.`,
                  marca: "en el cambio", sq: donde };
  }
  /* Tiene recaptura, pero el cambio pierde (20-nov, revisor de ajedrez): con
     Qe1 Rxe1 Kxe1 la tarjeta de un grave decía "Toma la columna abierta e." y
     no que se cambiaba la dama por una torre. Se nombra lo que se va de cada
     lado. SI DEL RIVAL NO SE VA NADA, "queda comible": la v0.178.1 lo
     callaba porque la cuenta miraba solo esa casilla (en Bh6 Nxh6 el caballo
     dejaba la dama de f6), y desde la v1.0.2 mira también lo que deja la
     pieza que come (`loQueDeja`). */
  else if (cambioDice && !obs.cambio.suyas.length)
    mecanismo = { txt: `${mayus(pieza)} queda comible en ${donde}.`,
                  marca: "queda comible", sq: donde };
  else if (cambioDice) {
    const nom = (ts, tabla) => ts.map(t => tabla[t] || "una pieza").join(" y ");
    mecanismo = { txt: `Pierde material en el cambio: ${nom(obs.cambio.mias, mio ? PIEZA_TU : PIEZA_EL)}` +
                       ` por ${nom(obs.cambio.suyas, PIEZA_UN)}.`,
                  marca: "en el cambio", sq: donde };
  }
  else if (f.tomoConOtra && f.perdida >= 0.5 && f.cap)
    mecanismo = { txt: `La captura iba con otra pieza: ${f.cap.san}.`,
                  marca: f.cap.san };
  /* La pieza colgada que NO es la que moviste, y que ANTES no lo estaba. Es el
     error más común de todos y hasta la v0.67 la app solo miraba la que se
     había movido: te podías dejar la dama en otro lado y la tarjeta hablaba del
     peón que empujaste.
     Que antes no lo estuviera es lo que la vuelve una consecuencia DE ESTA
     JUGADA. Es la frase de la captura del usuario: "tu peón estaba defendido,
     pero ahora está indefenso". */
  else if (obs && obs.nuevas && obs.nuevas.length && f.perdida >= 0.5) {
    const c = obs.nuevas[0];
    /* "Sin defender" solo cuando es eso: una pieza defendida que ataca algo
       que vale menos está en peligro por otro motivo, y se dice cuál (v0.133). */
    mecanismo = c.motivo === "menor"
      ? { txt: `${mayus(suya(c.pieza))} de ${c.sq} queda a tiro de ${PIEZA_UN[c.por] || "una pieza"}.`,
          marca: "a tiro", sq: c.sq }
      : c.destapada
      ? { txt: `Destapa ${suya(c.pieza)} de ${c.sq}: queda a tiro de ${PIEZA_UN[c.por] || "una pieza"}.`,
          marca: "a tiro", sq: c.sq }
      : c.sinDefensaAntes
      ? { txt: `${mayus(suya(c.pieza))} de ${c.sq} queda a tiro de ${PIEZA_UN[c.por] || "una pieza"}.`,
          marca: "a tiro", sq: c.sq }
      : { txt: `${mayus(suya(c.pieza))} de ${c.sq} queda sin defender.`,
          marca: "sin defender", sq: c.sq };
  }

  /* LA QUE YA ESTABA COLGADA Y SIGUE (revisor de ajedrez, 22-nov). En
     `1nbqkbnr/1pQpppp1/7r/7p/8/4P3/PPPP1PPP/RNB1KBNR w`, h4 (pierde 10,4)
     decía solo "Había Qxb8…" y nada de la dama de c7, que sigue comible.
     Solo si el motor se la come (lo que el motor come dice qué se pierde) y
     LE GANA AL MECANISMO cuando ese nombra otra pieza que vale menos: g4 en
     la misma posición decía "Tu peón queda comible en g4" con la dama
     colgada (revisor, v1.2.2). El mate forzado y "la captura iba con otra
     pieza" no nombran una pieza y se quedan. Defendida pero a tiro de algo
     más barato, "sigue a tiro", en espejo de "queda a tiro". */
  if (obs && obs.siguen && obs.siguen.length && f.perdida >= 2) {
    const c = obs.siguen.find(x => (f.mejorRival || "").slice(2, 4) === x.sq && (VALOR[x.pieza] || 0) >= 3);
    const queda = (f.uci || "").length > 4 ? f.uci[4] : f.pieza;
    const valeMec = !mecanismo ? -1 : !mecanismo.sq ? Infinity
      : mecanismo.sq === donde ? (VALOR[queda] || 0)
      : (VALOR[((obs.nuevas || []).find(x => x.sq === mecanismo.sq) || {}).pieza] || 0);
    if (c && mecanismo && mecanismo.sq === c.sq) { /* ya la nombra */ }
    else if (c && (VALOR[c.pieza] || 0) > valeMec)
      mecanismo = c.motivo === "menor"
        ? { txt: `${mayus(suya(c.pieza))} de ${c.sq} sigue a tiro de ${PIEZA_UN[c.por] || "una pieza"}.`,
            marca: "sigue a tiro", sq: c.sq }
        : { txt: `${mayus(suya(c.pieza))} sigue comible en ${c.sq}.`,
            marca: "sigue comible", sq: c.sq };
  }

  /* 2. LO QUE LA JUGADA SALVA, que es el espejo del anterior y lo que faltaba
     para poder decir algo de las jugadas del rival: "tu rival defendió su peón
     amenazado" es media revisión de chess.com. */
  let salvada = null;
  if (obs && obs.salvadas && obs.salvadas.length) {
    const s = obs.salvadas[0];
    const aTiro = `que estaba a tiro de ${PIEZA_UN[s.por] || "una pieza"}.`;
    const pieza = `${suya(s.pieza)} de ${s.sq}`;
    /* Tres verbos según cómo (v1.0.4): "Salva" solo cuando la pieza ya no
       corre peligro por otra cosa; si apenas quedó defendida o tapada, el
       rival todavía puede cambiarla y "salvar" prometía de más. */
    if (s.como === "tapa")
      salvada = s.motivo === "menor"
        ? { txt: `Tapa el ataque a ${pieza}, ${aTiro}`, marca: "Tapa el ataque", sq: s.sq }
        : { txt: `Tapa el ataque a ${pieza}.`, marca: "Tapa el ataque", sq: s.sq };
    else if (s.como === "defiende") {
      const sola = s.pieza === "q" || s.pieza === "r" ? "sola" : "solo";
      salvada = { txt: `Defiende ${pieza}, que estaba ${sola}.`, marca: sola, sq: s.sq };
    }
    else
      salvada = { txt: `${s.seFue ? "Saca" : "Salva"} ${pieza}, ` +
                       (s.motivo === "menor" ? aTiro : `que estaba sin defender.`),
                  marca: s.motivo === "menor" ? "a tiro" : "sin defender",
                  sq: s.seFue ? (s.hacia || donde) : s.sq };
  }

  /* 3. QUÉ HABÍA en su lugar. */
  let habia = null;
  if (f.oportunidad && f.oportunidad.tipo === "mate")
    habia = { txt: `Había mate forzado en ${f.oportunidad.n}` +
                   `${mejorSan ? `, con ${mejorSan}` : ""}.`,
              marca: mejorSan || "mate forzado", uci: f.mejor };
  else if (f.oportunidad && f.oportunidad.tipo === "material")
    habia = { txt: `Había ${f.oportunidad.san}, que ${loQueSeLlevaba(f.oportunidad)}.`,
              marca: f.oportunidad.san, uci: f.mejor };

  /* 4. EL MÉRITO, para las buenas.

     "Brillante" y "Genial" ya tienen su frase fija, así que acá va SOLO lo que
     esa frase no dice: dónde está el material entregado, o cuánto le sacaba la
     mejor a la segunda.

     El Genial por CRUCE DE BANDA no dice "era la única", y esa distinción es la
     que evita mentir: la categoría se dispara por dos motivos distintos
     (`unicaBuena` o el cruce) y solo uno de los dos es "no había otra". Cuando
     entró por el cruce, el mérito lo cuenta el rumbo, más abajo. */
  let merito = null;
  if (f.cat === "brillante")
    merito = f.colgada
      ? { txt: `${mayus(pieza)} queda comible en ${donde}, y aun así es la mejor.`,
          marca: "queda comible", sq: donde }
      : { txt: "Entrega material y aun así es la mejor del motor.", marca: "Entrega material" };
  else if (f.cat === "genial" && f.unicaBuena)
    merito = { txt: `Era la única: la segunda del motor quedaba ` +
                    `${(f.huecoSegunda / 100).toFixed(2)} atrás.`,
               marca: "Era la única" };
  else if (f.tomoBuena)
    merito = { txt: "Es la captura que había para hacer.", marca: "la captura", sq: donde };
  /* Una recaptura no es un mérito y tampoco un descuido: el material ya estaba
     perdido y solo lo estás recuperando. Es la misma distinción que le sacó los
     falsos positivos a "Genial" (§8), dicha en la tarjeta. */
  else if (f.esRecaptura)
    merito = { txt: "Es una recaptura: el material ya estaba perdido.",
               marca: "recaptura", sq: donde };

  /* 5. LO QUE LA JUGADA ATACA. Es lo que chess.com dice en las jugadas que
     salieron bien —"echás al alfil rival con un peón"— y lo que a la tarjeta le
     faltaba para tener algo que decir cuando no hubo ni error ni hallazgo.
     Solo cuenta atacar algo que vale MÁS que la pieza que movés: eso es una
     amenaza de verdad, porque el rival tiene que hacer algo. Atacar algo que
     vale igual o menos es una oferta de cambio, no una amenaza. */
  let ataque = null;
  if (obs && obs.amenazadas.length >= 2) {
    const [a, b] = obs.amenazadas;
    /* Se nombra el concepto —"ataque doble"— en vez de describirlo: es lo que
       se puede aprender de una tarjeta, y es lo que chess.com resalta. */
    ataque = { txt: `Es un ataque doble: ${piezaEn(a.pieza, a.sq)} y ` +
                    `${piezaEn(b.pieza, b.sq)}.`,
               marca: "ataque doble", sq: [a.sq, b.sq] };
  } else if (obs && obs.amenazadas.length === 1) {
    const a = obs.amenazadas[0];
    const queda = (f.uci || "").length > 4 ? f.uci[4] : f.pieza;
    ataque = { txt: `Ataca ${piezaEn(a.pieza, a.sq)} con ${PIEZA_UN[queda] || "una pieza"}.`,
               marca: "Ataca", sq: a.sq };
  }

  /* 5bis. LO QUE SE VE EN LA POSICIÓN. Los tres van en UN solo lugar y no en tres
     —clava, deja un peón pasado, toma una columna abierta— porque como mucho
     entran dos frases en la tarjeta: si cada uno tuviera su turno, entre los
     tres taparían al mecanismo y a la alternativa, que importan más.
     El orden es el de cuánto cambia la partida: una clavada obliga al rival, un
     peón pasado decide finales, una columna abierta es una mejora. */
  /* LOS CANDIDATOS VAN EN DOS PESOS (v0.77), y el peso lo puso el usuario: los
     FUERTES son los que cambian la partida —una clavada obliga al rival ya
     mismo, un peón pasado decide el final— y los MENORES solo salen cuando
     arriba no hubo nada. Sin los dos pesos, "las torres quedan conectadas"
     taparía a "clava el caballo" el día que las dos pasen juntas.

     Cada frase lleva su `marca`, que es el nombre del concepto y tiene que
     aparecer TAL CUAL adentro del texto: es lo que se toca para encenderlo en
     el tablero (v0.70). Hay una prueba que las mantiene alineadas. */
  const o = obs || {};
  const fuertes = [], menores = [];
  /* ATRAPAR una pieza es lo más caro que puede decir la tarjeta, así que va
     primera: el rival tiene que resolverlo ya mismo o la pierde. */
  /* LO QUE VALE CADA FRASE FUERTE (v0.177, revisor de ajedrez): la pieza que
     atrapa o clava. Sirve para que "Salva tu peón de a4" no vaya antes que
     "Clava la dama de d7 contra el rey": la que gana más va primero (abajo, en
     el orden). Va aparte y no en la frase para no cambiar su forma. */
  const vale = new Map();
  const conValor = (frase, pieza) => (vale.set(frase, VALOR[pieza] || 0), frase);
  if (o.atrapada)
    fuertes.push(conValor({ txt: `Atrapa ${piezaEn(o.atrapada.pieza, o.atrapada.sq)}: no tiene salida.`,
                            marca: "Atrapa", sq: o.atrapada.sq }, o.atrapada.pieza));
  if (o.descubierto)
    fuertes.push({ txt: `Es un jaque descubierto: lo da ${piezaEn(o.descubierto.pieza, o.descubierto.sq)}.`,
                   marca: "jaque descubierto", sq: o.descubierto.sq });
  /* LA CLAVADA DICE CONTRA QUÉ (v0.162, Juan): contra el rey —la pieza no
     se puede mover de la línea— o contra la dama, que es la que queda detrás
     y se pierde si la pieza se corre. */
  const fraseClavada = c => conValor({ txt: `Clava ${piezaEn(c.pieza, c.sq)} contra ` +
                                            `${c.contra === "q" ? "la dama" : "el rey"}.`,
                                       marca: "Clava", sq: c.sq }, c.pieza);
  /* SI LA QUE CLAVA ES LA QUE QUEDA COMIBLE, LA CLAVADA NO SE DICE (v0.163,
     revisor de ajedrez): "Tu torre queda comible en e1. Clava el caballo
     contra la dama." elogia algo que se pierde en la jugada siguiente, el
     mismo síntoma que la omisión de 10… Bb4. La clavada existe; en esa
     tarjeta, callada. */
  /* Y MÁS EN GENERAL (v0.163, segunda vuelta del revisor): si la pieza que se
     movió queda comible, nada de lo que esa pieza "logra" se dice —ni el
     ataque, ni la clavada desde ahí, ni la columna, la séptima o el caballo
     plantado—: se pierde en la jugada siguiente. La tarjeta queda con lo que
     se pierde y la mejor. */
  const cuelga = !!(mecanismo && (mecanismo.marca === "queda comible" ||
                                  mecanismo.marca === "en el cambio"));
  if (cuelga) ataque = null;
  const clavadas = (o.clavadas || []).filter(c => !(cuelga && c.por === mecanismo.sq));
  if (clavadas.length) fuertes.push(fraseClavada(clavadas[0]));
  /* CLAVAR YA ES ATACAR (v0.162; Juan: "¿no queda mejor 'clava' en lugar de
     'ataca', ya que clavar implica atacar?"). Si la pieza atacada es la misma
     que queda clavada, la frase del ataque pasa a ser la de la clavada, en el
     lugar del ataque, y la clavada no se repite más abajo. */
  if (ataque && !Array.isArray(ataque.sq) && clavadas.length) {
    const c = clavadas.find(x => x.sq === ataque.sq);
    if (c) {
      ataque = fraseClavada(c);
      const k = fuertes.findIndex(x => x.marca === "Clava" && x.sq === c.sq);
      if (k >= 0) fuertes.splice(k, 1);
    }
  }
  if (o.descubierta)
    fuertes.push({ txt: `Descubre ${piezaEn(o.descubierta.pieza, o.descubierta.sq)} sobre ` +
                        `${piezaEn(o.descubierta.suya, o.descubierta.sobre)}.`,
                   marca: "Descubre", sq: [o.descubierta.sq, o.descubierta.sobre] });
  if (o.pasado)
    fuertes.push({ txt: `${mayus(pieza)} de ${donde} queda pasado.`,
                   marca: "pasado", sq: donde });
  /* "Coronás." a secas es demasiado seco —criterio del usuario—, así que la
     frase dice además qué pasa: el peón vuelve, y vuelve dama. */
  /* …y si la pieza coronada se pierde en la jugada siguiente, la coronación
     no se festeja (Juan, 20-nov): es lo mismo que la clavada de la que cuelga.
     `coronaPerdida` cubre la defendida cuya recaptura no conviene (revisor de
     ajedrez). Y vuelve como la pieza que eligió: c8=N no "vuelve como dama". */
  if (o.corona && !cuelga && !o.coronaPerdida)
    fuertes.push({ txt: `${mio ? "Coronás" : "Corona"}: el peón vuelve como ` +
                        `${({ n: "caballo", b: "alfil", r: "torre" })[(f.uci || "")[4]] || "dama"}.`,
                   marca: mio ? "Coronás" : "Corona", sq: donde });
  if (o.aislado)
    fuertes.push({ txt: `El peón de ${o.aislado} queda aislado.`,
                   marca: "aislado", sq: o.aislado });
  if (o.doblados)
    fuertes.push({ txt: `${mio ? "Te" : "Le"} quedan peones doblados en la ${o.doblados}.`,
                   marca: "doblados", sq: donde });

  if (o.plantado && !cuelga)
    menores.push({ txt: `El caballo de ${o.plantado} se planta: ningún peón lo puede echar.`,
                   marca: "se planta", sq: o.plantado });
  if (o.septima && !cuelga)
    menores.push({ txt: `La torre entra en la séptima.`,
                   marca: "la séptima", sq: o.septima });
  if (o.sinDamas)
    menores.push({ txt: `Se van las damas del tablero.`, marca: "las damas" });
  if (o.conectadas)
    menores.push({ txt: `Las torres quedan conectadas.`,
                   marca: "conectadas", sq: o.conectadas });
  if (o.columna && !cuelga)
    menores.push({ txt: `Toma la columna abierta ${o.columna}.`,
                   marca: "columna abierta", sq: donde });
  if (o.semiabierta && !cuelga)
    menores.push({ txt: `Toma la columna semiabierta ${o.semiabierta}.`,
                   marca: "columna semiabierta", sq: donde });
  if (o.pasadoContra)
    menores.push({ txt: `Queda un peón pasado en contra en ${o.pasadoContra}.`,
                   marca: "pasado en contra", sq: o.pasadoContra });
  if (o.pareja)
    menores.push({ txt: `${mio ? "Te quedás" : "Se queda"} con la pareja de alfiles.`,
                   marca: "pareja de alfiles" });
  if (o.enroque)
    menores.push({ txt: `${mio ? "Enrocás" : "Enroca"} y el rey se pone a salvo.`,
                   marca: mio ? "Enrocás" : "Enroca", sq: donde });
  if (o.pierdeEnroque)
    menores.push({ txt: o.pierdeEnroque === "los dos"
                     ? `Pierde el enroque de los dos lados.`
                     : `Pierde el enroque ${o.pierdeEnroque}.`,
                   marca: "el enroque" });
  /* EL AVISO DE AHOGADO solo cuando el que movió VA GANANDO: ahogar es un
     accidente del que gana, y al que pierde el ahogado lo salva. Decirle
     "cuidado" al que va perdiendo sería avisarle de algo bueno. */
  const voyGanando = typeof f.evalBlancas === "number" &&
    (f.turno === "w" ? f.evalBlancas : -f.evalBlancas) / 100 >= 2;
  if (o.legalesRival !== null && o.legalesRival !== undefined &&
      o.legalesRival <= 2 && voyGanando)
    menores.push({ txt: `Al rival le quedan ${o.legalesRival} jugadas: ojo con el ahogado.`,
                   marca: "el ahogado" });

  /* CÓMO LLEGASTE A LA JUGADA es otra familia y no habla de la posición: por
     eso puede tener ranura propia (el dial de abajo). Hoy tiene un solo
     miembro; la v0.78 le suma "el rival acababa de errar". */
  const c = ctx || {};
  /* EL ERROR DEL RIVAL solo si dice CÓMO SE COBRABA —condición del usuario—:
     avisar que erró sin decir con qué no le sirve a nadie. Cuando la jugada
     que se hizo YA era la mejor, `mejorSan` viene en null y no hay nada que
     ofrecer: ahí la frase cambia y dice que se cobró. */
  /* Y SOLO EN LAS JUGADAS DEL USUARIO. La frase habla del "rival" del que
     movió: mirando una jugada del rival, el que erró antes es el usuario, y
     "el rival acababa de errar" diría exactamente lo contrario de lo que pasó.
     Con el lado desconocido —un PGN pegado— tampoco se dice: no se puede. */
  /* SIN ECO CON "HABÍA" (v0.133.1): si la frase de lo que había ya nombra la
     jugada —"Había Rxd6, que se llevaba el peón"—, decir además "el rival
     acababa de errar: Rxd6 lo cobraba" es la misma jugada dos veces seguidas
     (23 de 1.075 tarjetas). Queda "Había", que dice además qué se ganaba. */
  const ecoHabia = !!(habia && mejorSan && habia.txt.includes(mejorSan));
  const llegada = c.rivalErro && mio && mejorSan && !ecoHabia
      ? { txt: `El rival acababa de errar: ${mejorSan} lo cobraba.`,
          marca: mejorSan, uci: f.mejor }
    : c.rivalErro && mio && !mejorSan
      ? { txt: `El rival erró y lo cobraste.`, marca: "lo cobraste" }
    : c.salioDelLibro
      ? { txt: `Acá se terminó la teoría.`, marca: "la teoría" } : null;

  /* CUÁNTAS RANURAS — dial temporal de la v0.77. Con una, todo compite por el
     mismo lugar y "cómo llegaste" entra a la misma cola. Con dos, la posición y
     la llegada tienen cada una la suya. Con tres, además entra una frase más
     en la tarjeta. */
  const ranuras = (ctx && ctx.ranuras) || 1;
  /* CON UNA SOLA RANURA, "cómo llegaste" entra a la misma cola que la posición;
     con dos, tiene la suya. Los MENORES nunca entran acá: van al final del
     orden, abajo. */
  const posicional = (ranuras >= 2 ? fuertes
                                   : [llegada, ...fuertes].filter(Boolean))[0] || null;
  /* EL MENOR VA TARDE EN EL ORDEN, y esto lo destapó una prueba: puesto arriba,
     "Pierde el enroque corto" le ganaba el lugar a "había Bxd7, que ganaba 9
     peones". Un concepto menor no puede tapar una oportunidad perdida, así que
     entra recién después de la alternativa y solo si sobró lugar. */
  const menor = menores[0] || null;

  /* 6. EL RUMBO, y usa las MISMAS bandas que decide "Genial" por cruce
     (`banda`, arriba). Inventar acá una segunda escala de "cómo va la partida"
     sería tener dos respuestas para la misma pregunta en la misma pantalla.

     Se calla en los tres casos donde la evaluación no significa lo que parece:
     la partida ya terminada (la barra muestra el resultado, no una evaluación),
     y cualquiera de los dos mates forzados, donde el tope de 1000 aplasta el
     número y "pasa de ganando a ganando" sería falso de puro saturado. */
  let rumbo = null;
  const hayNumeros = typeof f.franja === "number" && typeof f.evalBlancas === "number";
  if (hayNumeros && !f.remate && !f.mateContra && f.mateDe === null) {
    const a = banda(f.franja);
    const b = banda((f.turno === "w" ? f.evalBlancas : -f.evalBlancas) / 100);
    if (a !== b) rumbo = { txt: `La posición pasa de ${a} a ${b}.`, marca: b };
  }

  /* 7. LA ALTERNATIVA, y va última de las que hablan de esta jugada: el
     cuadrito "Mejor" ya la muestra, así que acá suma solo cuando no hay nada
     mejor que decir. `mejorSan` llega en null cuando la jugada ya era la mejor,
     y ahí no hay alternativa que ofrecer.

     Y no se repite: cuando había un mate, la frase de arriba YA nombró la
     jugada que lo daba, y "Había mate forzado en 8, con Rd5. La mejor era Rd5."
     es la clase de eco que la v0.44 le sacó a las leyendas. */
  /* QUÉ HACÍA LA MEJOR (v0.78). El dato ya viaja en la fila: `f.cap` lo llenó
     `capturaBuena`, que trae la pieza que se comía y la ganancia NETA, ya
     restada la recaptura. Por eso son dos frases y no una: "se llevaba el
     caballo" cuando nadie recapturaba, y "ganaba 2 peones en el cambio" cuando
     sí. Si la mejor no era una captura buena, no se agrega nada: no hay dato. */
  const queHacia = (f.cap && mejorSan && f.cap.san === mejorSan)
    ? (f.cap.gana >= (VALOR[f.cap.comida] || 0)
        ? `, que se llevaba ${PIEZA_UN[f.cap.comida] || "una pieza"}`
        : `, que ganaba ${f.cap.gana} ${f.cap.gana === 1 ? "peón" : "peones"} en el cambio`)
    : "";
  /* Y NO SE REPITE con la frase de arriba: si la llegada ya nombró la mejor
     —"el rival acababa de errar: Bb5 lo cobraba"—, decir después "la mejor era
     Bb5" es el eco que la v0.44 le sacó a las leyendas. Se mira la llegada que
     de verdad está en juego, que con una sola ranura puede no estar. */
  const llegadaEnJuego = ranuras >= 2 ? llegada : (posicional === llegada ? llegada : null);
  const alternativa = (mejorSan && !(habia && habia.txt.includes(mejorSan)) &&
                       !(llegadaEnJuego && llegadaEnJuego.txt.includes(mejorSan)))
    ? { txt: `La mejor era ${mejorSan}${queHacia}.`, marca: mejorSan, uci: f.mejor } : null;

  /* 8. LA RESPUESTA DEL RIVAL. Sale de una evaluación que ya estaba hecha —la
     de la posición siguiente— y es lo que convierte la tarjeta en el comienzo
     de una variante: te nombra la jugada que vas a querer probar en el tablero.
     Va al final porque casi siempre hay una, así que si fuera antes taparía a
     todo lo demás. Se calla con la partida terminada: no hay respuesta que dar. */
  const respuesta = (sanRival && !f.remate)
    ? { txt: `El rival tiene ${sanRival}.`, marca: sanRival, uci: f.mejorRival,
        deDespues: true } : null;

  /* EN UNA JUGADA DE LIBRO NO HABLA EL MOTOR (v0.148, lavado de cara que
     pidió el revisor en la v0.130). La categoría dice "esto es teoría", y
     abajo la tarjeta decía "La mejor era Nd4. El rival tiene Rb8.": con un
     motor de verdad la jugada de libro muchas veces no es su primera, y
     ninguna rama miraba la categoría. Así que en libro se callan todas las
     frases que salen de una evaluación —el mecanismo, "había", el mérito, el
     rumbo, la alternativa, la respuesta del rival, el error del rival y el
     aviso de ahogado— y queda SOLO lo que se ve en el tablero: qué ataca, qué
     salva, que enroca. Una sola frase, y si no hay ninguna, "" y la tarjeta
     pone la frase fija de la categoría.
     Dos de las que se ven también se callan: los peones doblados y el
     aislado, que en la apertura son ciertos POR UNA JUGADA, en el medio de un
     cambio (5… exd4 de la italiana, 3… cxd4 de la siciliana), hasta que
     recapturan. Y la recaptura ya quedó afuera con el mérito: "el material ya
     estaba perdido" suena a que algo salió mal, y en libro es un cambio de
     teoría.
     Va por la CATEGORÍA y no por si el motor coincide: es la misma pregunta
     que hace `salioDelLibro`, y vale en los dos modos. */
  if (tablas) return [tablas, habia || alternativa].filter(Boolean);

  if (f.cat === "libro") {
    const seVe = p => p && !["doblados", "aislado", "el ahogado"].includes(p.marca);
    return [salvada, ataque, ...fuertes, ...menores].filter(seVe).slice(0, 1);
  }

  /* Como mucho DOS. Es una tarjeta de celular y compite con el tablero por la
     pantalla; este orden es el que decide cuáles dos sobreviven. */
  /* EN UNA OMISIÓN, LO QUE HABÍA VA PRIMERO (v0.161; Juan, con 10… Bb4:
     "la marca como omisión, pero no dice por qué. Y leyendo sus comentarios
     hasta parece buena"). "Había" es lo que define la categoría —había mate
     o material y se dejó pasar—, y estaba séptima en el orden: con dos
     ranuras ganaban "Ataca la dama" y "Clava la dama", que suenan a elogio. */
  const primero = f.cat === "omision" && habia ? [habia] : [];
  /* LO QUE SE SALVA VA DESPUÉS DE LO QUE GANA MÁS (v0.177): si la clavada o
     la pieza atrapada valen más que lo salvado, van primero. */
  const valeSalvada = salvada && obs ? VALOR[obs.salvadas[0].pieza] || 0 : 0;
  const ganaMas = p => !!p && (vale.get(p) || 0) > valeSalvada;
  const salvaDespues = !!salvada && (ganaMas(ataque) || ganaMas(posicional));
  const partes = [...primero, merito, mecanismo, salvaDespues ? null : salvada, ataque, posicional,
          salvaDespues ? salvada : null,
          ranuras >= 2 ? llegada : null,
          primero.length ? null : habia, rumbo, alternativa, menor, respuesta]
    .filter(Boolean).slice(0, ranuras >= 3 ? 3 : 2);
  return primero.length ? enCambio(partes) : partes;
}

/* "EN CAMBIO, " DESPUÉS DE "HABÍA" (v0.161, revisor). "Había exd4, que se
   llevaba el caballo. Ataca la dama…" se lee como si atacara exd4, y sigue
   sonando a elogio: la segunda frase habla de la jugada que se hizo, y lo
   dice. La primera letra baja a minúscula salvo que arranque con una jugada
   ("Bb4…"); la marca, si era esa palabra, baja con ella. */
const ARRANCA_CON_JUGADA = /^(O-O|[KQRBN][a-h]?[1-8]?x?[a-h][1-8]|[a-h]x?[a-h]?[1-8])/;
function enCambio(partes) {
  if (partes.length < 2) return partes;
  const p = partes[1];
  const baja = !ARRANCA_CON_JUGADA.test(p.txt);
  const min = t => baja ? t[0].toLowerCase() + t.slice(1) : t;
  const marca = p.marca && p.txt.startsWith(p.marca) ? min(p.marca) : p.marca;
  return [partes[0], { ...p, txt: "En cambio, " + min(p.txt), marca }, ...partes.slice(2)];
}

/* La misma explicación, en una sola cadena. Es lo que usa todo lo que no
   necesita señalar el tablero, y lo que prueban las pruebas. */
const explicarJugada = (...a) =>
  partesDeLaExplicacion(...a).map(p => p.txt).join(" ");


