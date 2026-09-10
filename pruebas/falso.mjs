/* LA PARTIDA DE PRUEBA Y EL MOTOR DE MENTIRA, aparte del arnés desde la v0.92.

   Vivía adentro de `mirar.mjs`: eran las ~160 líneas que corren antes de la
   primera captura, y por eso una maqueta que quisiera mirar la pantalla ENTERA
   —y no un renglón— tenía que reescribirlas o quedarse sin datos. Una pantalla
   con la tarjeta, la curva y el tablero vacíos no deja decidir nada. Acá está
   ese arranque, y `tira.mjs::abrirApp({ partida })` lo enchufa.

   EL REFACTOR SE VERIFICÓ BYTE A BYTE: las 45 capturas de `npm run mirar`
   quedaron idénticas a las de antes. Es la única prueba que sirve para un
   cambio que no debe cambiar nada, y es la misma guarda que §10 pide para lo
   que se toca de PC. El código se movió TEXTUALMENTE, sin retipearlo: lo único
   que cambió es que el puerto, que estaba escrito a mano adentro de la API,
   ahora es un parámetro.

   LAS EVALUACIONES SON INVENTADAS: los veredictos de la pantalla no significan
   nada, la disposición sí. Para juzgar un veredicto está el celu. */
import fs from "node:fs";
import { Chess } from "../chess.js";

export function partidaFalsa({ cual = "de-prueba", puerto = 8099 } = {}) {
  const CUAL = cual;
  /* Qué partida se mira: `npm run mirar <nombre>` lee `partida-<nombre>.pgn`.
     Hay más de una porque CÓMO TERMINA LA PARTIDA es una pantalla propia y la
     partida larga no llega nunca a ninguna de ellas —no termina ni en mate ni en
     tablas—, así que sin esto no había forma de mirarlas. Ahí vivió el bug del
     `mate 0`: la jugada que daba el mate salía "Omisión" y la barra decía "M0". */

  const PGN = fs.readFileSync(new URL(`./partida-${CUAL}.pgn`, import.meta.url), "utf8");
  const SUFIJO = CUAL === "de-prueba" ? "" : "-" + CUAL;
  /* --- las posiciones de la partida, y una evaluación inventada para cada una --- */
  const j = new Chess();
  /* load_pgn devuelve false y NO tira: sin este chequeo un PGN ilegal se cuela
     como una partida de cero jugadas y el arnés se cuelga esperando una pantalla
     que nunca llega. Ya pasó, con un PGN escrito a mano donde la jugada 19 era
     imposible. Nunca afirmar de memoria una posición: verificarla acá. */
  if (!j.load_pgn(PGN)) { console.error("el PGN de prueba no es legal"); process.exit(1); }
  const jugadas = j.history({ verbose: true });
  const c = new Chess();
  const fens = [c.fen()];
  for (const m of jugadas) { c.move(m.san); fens.push(c.fen()); }

  /* Desplomes de UNA jugada. Sin ellos la forma es tan suave que la pérdida por
     jugada nunca llega a un corte, no sale ninguna categoría mala y la curva no
     tiene ni una marca: justo lo que hay que mirar. */
  const GOLPES = { 15: -420, 22: 380, 29: -500, 33: 300 };
  const base = i => {
    const t = i / (fens.length - 1);
    if (t < 0.25) return Math.round(40 * Math.sin(i));               /* apertura pareja */
    if (t < 0.4)  return Math.round(-80 - 900 * (t - 0.25) / 0.15);  /* se desploma */
    if (t < 0.6)  return Math.round(-980 + 1500 * (t - 0.4) / 0.2);  /* lo devuelve */
    return Math.round(520 + 480 * (t - 0.6) / 0.4);                  /* y define */
  };
  const forma = i => base(i) + (GOLPES[i] || 0);

  /* EL MATE NO SE PUEDE INVENTAR CON UN NÚMERO. El motor de mentira devolvía
     siempre centipeones, así que la última jugada de una partida que termina en
     mate salía "Error grave, pierde 8.29" y la barra decía "+0.00": la pantalla
     donde vivía el bug del `mate 0` era justo la que el arnés no sabía dibujar.

     Se calcula de verdad con chess.js, que es barato:
     - posición mateada  → `mate 0`, que es lo que dice el motor cuando al que
       mueve ya lo matearon;
     - hay una jugada que matea → `mate 1`, y esa es la mejor.
     Con eso el arnés recorre el mismo camino que el motor real en las dos
     pantallas que importan: la que da el mate y la que lo permite. */
  const mateEnUna = fen => {
    const c = new Chess(fen);
    for (const m of c.moves({ verbose: true })) {
      c.move(m.san);
      const mata = c.in_checkmate();
      c.undo();
      if (mata) return m.from + m.to + (m.promotion || "");
    }
    return null;
  };

  const tabla = {};
  fens.forEach((fen, i) => {
    const pos = new Chess(fen);
    if (pos.in_checkmate()) { tabla[fen] = { mate: 0, mejor: null, segunda: null }; return; }
    const mata = mateEnUna(fen);
    if (mata) { tabla[fen] = { mate: 1, mejor: mata, segunda: null }; return; }
    const legales = pos.moves({ verbose: true });
    /* ahogado: no hay jugadas. El motor real contesta `cp 0` y `bestmove (none)`,
       que es lo que hace el falso al no encontrar el FEN en la tabla. */
    if (!legales.length) return;
    const jugada = jugadas[i] && (jugadas[i].from + jugadas[i].to + (jugadas[i].promotion || ""));
    const otra = legales.map(m => m.from + m.to + (m.promotion || "")).find(u => u !== jugada);
    /* una de cada tres la "acierta": así aparecen Mejor y Libro además de las malas */
    const mejor = (i % 3 === 0 && jugada) ? jugada : (otra || legales[0].from + legales[0].to);
    /* el motor habla desde EL QUE MUEVE; aBlancas lo da vuelta después */
    const cp = fen.split(" ")[1] === "w" ? forma(i) : -forma(i);
    /* DOS JUGADAS MÁS, distintas de la mejor: son las que el panel de
       alternativas (v0.89) muestra en los renglones 2 y 3. Sin esto el falso
       mandaba la MISMA jugada en las tres líneas y el panel no probaba nada. */
    const otras = legales.map(x => x.from + x.to + (x.promotion || ""))
      .filter(u => u !== mejor).slice(0, 2);
    tabla[fen] = { cp, mejor, otras, segunda: cp - 60 - (i % 7) * 40 };
  });

  /* UNA JUGADA LEGAL PARA CADA POSICIÓN A UN PLY DE LA PARTIDA (v0.94).

     Desde la v0.94 la flecha verde es la mejor de LA POSICIÓN QUE SE ESTÁ
     VIENDO, así que adentro de una variante el tablero pide una mejor que la
     partida no tiene. El falso contestaba `bestmove (none)` para toda posición
     inventada —a propósito: inventar un UCI podía dar una jugada ilegal— y con
     eso el arnés no podía dibujar nunca la flecha que la v0.94 vino a arreglar.

     La salida es no inventar nada: se expande UN PLY desde cada posición de la
     partida, que es exactamente donde cae la primera jugada de cualquier
     variante, y se guarda una jugada legal de verdad para cada una. Un ply y no
     dos: el segundo serían decenas de miles de posiciones y la flecha ya se ve
     con el primero.

     VA EN UNA TABLA APARTE de `T` y no adentro, porque `T` es también lo que
     decide si el motor DEMORA: una posición que está en `T` es de la partida y
     contesta al toque. Metiéndolas ahí se perdería la demora de la v0.79, que
     es lo único con lo que se puede mirar el tablero dibujado antes de que
     conteste el motor. */
  const sueltas = {};
  for (const fen of fens) {
    const c = new Chess(fen);
    for (const m of c.moves({ verbose: true })) {
      c.move(m.san);
      const f2 = c.fen();
      if (!tabla[f2] && sueltas[f2] === undefined) {
        const sal = c.moves({ verbose: true })[0];
        sueltas[f2] = sal ? sal.from + sal.to + (sal.promotion || "") : null;
      }
      c.undo();
    }
  }

  /* EL MOTOR FALSO TARDA A PROPÓSITO EN LAS POSICIONES PROBADAS (v0.79), y solo
     en esas: una posición que no está en la tabla es, por definición, una jugada
     inventada. Sin esta demora no se puede mirar lo único que la v0.79 cambió
     —que el tablero dibuje ANTES de que vuelva el motor—, porque el motor falso
     contesta en el mismo tick y todo parece instantáneo. El análisis de la
     partida no la paga: esas posiciones sí están en la tabla. */
  const LENTO = +(process.env.MOTOR_LENTO || 400);

  const FALSO = `
  const T = ${JSON.stringify(tabla)};
  const S = ${JSON.stringify(sueltas)};
  const LENTO = ${LENTO};
  let fen = null;
  /* CUÁNTAS LÍNEAS PIDIÓ, que hasta la v0.89 el falso ignoraba. Solo gatea la
     TERCERA: la segunda se sigue mandando exactamente como antes —esté o no
     pedida— para no cambiar ni un veredicto de las capturas viejas. */
  var mpv = 1;
  onmessage = function (e) {
    const s = String(e.data);
    if (s === "uci") return postMessage("uciok");
    if (s.indexOf("setoption name MultiPV value ") === 0) {
      mpv = +s.slice(29) || 1; return;
    }
    if (s.startsWith("position fen ")) { fen = s.slice(13); return; }
    if (s.startsWith("go ")) {
      var v = T[fen];
      var deLaTabla = !!v;
      if (!v) {
        /* Una posición que NO está en la tabla es, desde la v0.65, una jugada
           probada: por definición no estaba en la partida. Se contesta un número
           determinista sacado del FEN —la misma prueba da siempre lo mismo, así
           que las capturas son repetibles— y la mejor sale de S, que trae una
           jugada LEGAL para cada posición a un ply de la partida (v0.94). Hasta
           la v0.93 iba sin pv: derivarFilas usa la mejor de la posición
           anterior, que sí está en la tabla, y nunca la de esta, así que no
           hacía falta; la flecha verde de la v0.94 sí la necesita. Lo que no se
           hace, y por eso está la tabla, es INVENTAR un UCI: el que se inventaba
           antes ("e2e4" fijo) además de mentir podía ser ilegal. */
        var x = 0;
        for (var k = 0; k < fen.length; k++) x = (x * 31 + fen.charCodeAt(k)) | 0;
        v = { cp: Math.abs(x % 601) - 300, mejor: S[fen] || null, segunda: null };
      }
      var tipo = v.mate === undefined ? "cp " + v.cp : "mate " + v.mate;
      var contestar = function () {
        postMessage("info depth 16 multipv 1 score " + tipo + (v.mejor ? " pv " + v.mejor : ""));
        var otras = v.otras || [];
        if (v.segunda !== null && v.segunda !== undefined)
          postMessage("info depth 16 multipv 2 score cp " + v.segunda +
                      " pv " + (otras[0] || v.mejor));
        if (mpv >= 3 && otras[1] !== undefined)
          postMessage("info depth 16 multipv 3 score cp " + ((v.segunda || 0) - 55) +
                      " pv " + otras[1]);
        postMessage("bestmove " + (v.mejor || "(none)"));
      };
      /* deLaTabla es falso justo en las posiciones inventadas: ahí se demora.
         OJO: nada de comillas invertidas acá adentro, que esto ES una plantilla
         y una sola la corta al medio. Ya pasó, y el error no dice eso. */
      if (deLaTabla || !LENTO) contestar(); else setTimeout(contestar, LENTO);
    }
  };
  `;

  /* La API de chess.com, falseada. Hace falta porque EL MOTIVO DEL FINAL
     —abandono, tiempo, acuerdo— no está en el PGN: viene en el JSON del mes. Con
     el PGN pegado el arnés recorría el único camino donde ese motivo no existe, y
     por eso no vio que en el camino de verdad tampoco aparecía (v0.63.1).
     El resultado y el motivo salen del PGN de prueba para no repetirlos acá. */
  const cabPgn = (k, d) => (PGN.match(new RegExp(`\\[${k} "([^"]*)"`)) || [, d])[1];
  const RES = cabPgn("Result", "1-0");
  const MOTIVO = process.env.MOTIVO || "resigned";
  const JUEGO = {
    url: "https://www.chess.com/game/live/1", pgn: PGN, time_class: "rapid",
    end_time: 1757000000, rules: "chess",
    white: { username: cabPgn("White", "Blancas"), rating: +cabPgn("WhiteElo", "600"),
             result: RES === "1-0" ? "win" : MOTIVO },
    black: { username: cabPgn("Black", "Negras"), rating: +cabPgn("BlackElo", "600"),
             result: RES === "0-1" ? "win" : MOTIVO },
  };
  const API = {
    "/api/archives": { archives: [`http://localhost:${puerto}/api/mes`] },
    "/api/mes": { games: [JUEGO] },
  };
  return { PGN, CUAL, SUFIJO, jugadas, fens, forma, base, cabPgn, FALSO, API };
}
