/* ============ POSICIONES (v1.1, etapa 4: el primer módulo nuevo) ============
   Jugar contra el motor desde una posición que llega en un link, que es como
   el profe manda los ejercicios: `…/#fen=<FEN>` (con espacios, `%20`, `+` o
   `_`, que es como los escribe lichess), y opcionales `&nivel=1..8` y
   `&color=w|b`. Sin `color`, Juan juega con el que mueve. Es una pantalla
   propia (`VISTA = "posicion"`), con el mismo tablero de la Partida
   (`dibujar`) pero sin nada del análisis: tocar la pieza, tocar adónde, y el
   motor contesta. TRASPASO.md, §7, v1.1. */

/* EL NIVEL. Stockfish con "Skill Level" (0–20) y una profundidad tope que
   crecen juntos: con la habilidad sola, a profundidad 16 el nivel 1 igual ve
   las tácticas cortas, y con la profundidad sola juega siempre la mejor que
   ve. Ocho escalones, como lichess. */
const NIVELES = [
  { skill: 0, prof: 1 }, { skill: 3, prof: 2 }, { skill: 6, prof: 3 }, { skill: 9, prof: 5 },
  { skill: 12, prof: 7 }, { skill: 15, prof: 9 }, { skill: 18, prof: 12 }, { skill: 20, prof: 16 },
];
let POS = null;          /* { inicial, fens, sans, ucis, yo, desde, error } */
let MOTOR_POS = null;    /* un motor propio: el "Skill Level" no se cruza con el análisis */
let PENSANDO = 0;        /* turno del motor en curso; cambiar la posición lo invalida */
let PEDIDO_POS = null;   /* la promesa del `go` que está corriendo */

/* el FEN del link, completo y normalizado, o null si no hay `fen=` */
function fenDelLink(h) {
  const m = /(?:^#|&)fen=([^&]*)/.exec(h || "");
  if (!m) return null;
  let f;
  try { f = decodeURIComponent(m[1].replace(/\+/g, " ")); } catch (e) { f = m[1]; }
  const p = f.replace(/_/g, " ").trim().split(/\s+/);
  const def = ["", "w", "-", "-", "0", "1"];
  while (p.length < 6) p.push(def[p.length]);
  return p.slice(0, 6).join(" ");
}
const paramDelLink = (h, k) => { const m = new RegExp(`[#&]${k}=([^&]*)`).exec(h || ""); return m ? m[1] : null; };

/* POR QUÉ UNA POSICIÓN NO SE PUEDE JUGAR, o null si se puede. chess.js
   valida la forma del FEN pero no que haya un rey de cada lado ni que el que
   no mueve esté en jaque, y con eso Stockfish se cuelga. */
function problemaDelFen(fen) {
  const v = new Chess().validate_fen(fen);
  if (!v.valid) return "no es una posición válida";
  const tab = fen.split(" ")[0];
  /* chess.js inventa una jugada "a" y Stockfish contesta que no hay (revisor de ajedrez) */
  const filas = tab.split("/");
  if (/p/i.test(filas[0]) || /p/i.test(filas[7])) return "hay un peón en la primera o la octava fila";
  if ((tab.match(/K/g) || []).length !== 1 || (tab.match(/k/g) || []).length !== 1)
    return "tiene que haber un rey de cada color";
  const p = fen.split(" ");
  const otro = new Chess([p[0], p[1] === "w" ? "b" : "w", "-", "-", "0", "1"].join(" "));
  if (otro.in_check()) return "el que no mueve está en jaque";
  return null;
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

let NIVEL_POS = 4;
try { NIVEL_POS = Math.min(8, Math.max(1, +localStorage.getItem("nivelPos") || 4)); } catch (e) { /* incógnito */ }

function abrirPosicion(fen, opc) {
  opc = opc || {};
  cancelarMotorPos();
  const error = problemaDelFen(fen);
  if (!error) fen = limpiarFen(fen);
  if (opc.nivel) NIVEL_POS = opc.nivel;
  const turno = fen.split(" ")[1];
  POS = { inicial: fen, fens: [fen], sans: [], ucis: [], desde: null, error,
          yo: opc.color === "w" || opc.color === "b" ? opc.color : turno };
  HAY.posicion = true;
  /* EL HISTORIAL: la entrada de la posición lleva el link (recargar la
     vuelve a abrir) y la de abajo queda limpia, así "‹" y el atrás del
     celu vuelven al inicio sin el `#fen` y no la reabren. Si el link llegó
     con la app abierta (`hashchange`), el navegador ya creó la entrada: solo
     se le pone el estado. */
  try {
    const sin = location.pathname + location.search, con = sin + location.hash;
    if (opc.alAbrir) {
      history.replaceState(null, "", sin);
      history.pushState({ vista: "posicion", de: "inicio" }, "", con);
    } else history.replaceState({ vista: "posicion", de: VISTA === "posicion" ? "inicio" : VISTA }, "", con);
  } catch (e) { /* nada */ }
  quieto();
  mostrarVista("posicion");
  window.scrollTo(0, 0);
  pintarPosicion();
  if (!error) turnoDelMotor();
}

const fenPos = () => POS.fens[POS.fens.length - 1];
/* LA PARTIDA CON SU HISTORIA: la triple repetición no se ve desde un FEN
   suelto (revisor de ajedrez, v1.1). Son pocas jugadas: se rejuegan. */
function juegoPos() {
  const c = new Chess(POS.inicial);
  for (const u of POS.ucis) c.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] });
  return c;
}
/* hubo alguna jugada de Juan: si no, Deshacer y Empezar de nuevo no tienen
   qué deshacer (con Juan del color que no mueve, deshacían la del motor y
   el motor la volvía a jugar) */
function hayJugadaMia() {
  return POS.fens.slice(0, -1).some(f => f.split(" ")[1] === POS.yo);
}

/* cómo está la partida, en una línea: es el subtítulo de la barra */
function estadoPos() {
  if (POS.error) return "";
  const c = juegoPos();
  const yo = POS.yo, toca = c.turn();
  if (c.in_checkmate()) return toca === yo ? "Jaque mate: ganó el motor" : "Jaque mate: ganaste";
  if (c.in_stalemate()) return "Tablas: ahogado";
  if (c.insufficient_material()) return "Tablas: no queda con qué dar mate";
  if (c.in_threefold_repetition()) return "Tablas: tres veces la misma posición";
  if (c.in_draw()) return "Tablas: 50 jugadas sin captura ni peón";
  if (toca !== yo) return "Piensa el motor…";
  return (c.in_check() ? "Jaque. " : "") + "Te toca con " + (yo === "w" ? "blancas" : "negras");
}

/* las jugadas, numeradas desde donde arranca la posición: el número en
   tenue y la jugada en texto, como la tira de la Partida (v1.2) */
function jugadasPos() {
  const p = POS.inicial.split(" ");
  let n = +p[5] || 1, blancas = p[1] === "w";
  const out = [];
  POS.sans.forEach((s, i) => {
    if (blancas) out.push(`<span class="n">${n}.</span><span class="j">${sinHtml(s)}</span>`);
    else { out.push((i === 0 ? `<span class="n">${n}…</span>` : "") + `<span class="j">${sinHtml(s)}</span>`); n++; }
    blancas = !blancas;
  });
  return out.join("");
}

/* CÓMO TERMINÓ, para la tarjeta del final (v1.2): el resultado grande y
   una línea de cómo, o null si sigue. El subtítulo de la barra ya no lo
   repite (revisor de UX). */
function finPos() {
  if (POS.error) return null;
  const c = juegoPos();
  if (!c.game_over()) return null;
  if (c.in_checkmate()) {
    const nro = +fenPos().split(" ")[5] - (c.turn() === "w" ? 1 : 0);
    return { gano: c.turn() !== POS.yo, titulo: c.turn() !== POS.yo ? "Ganaste" : "Perdiste",
             sub: "Jaque mate en la jugada " + nro };
  }
  const sub = c.in_stalemate() ? "Por ahogado" : c.insufficient_material() ? "No queda con qué dar mate"
    : c.in_threefold_repetition() ? "Tres veces la misma posición" : "50 jugadas sin captura ni peón";
  return { gano: false, titulo: "Tablas", sub };
}

function pintarPosicion() {
  if (!POS) return;
  const fin = finPos();
  /* el subtítulo: cómo va y el nivel; al terminar, solo cómo se juega
     (el resultado lo dice la tarjeta) */
  const como = "nivel " + NIVEL_POS + " · con " + (POS.yo === "w" ? "blancas" : "negras");
  $("posEstado").textContent = POS.error ? "" : fin ? como[0].toUpperCase() + como.slice(1)
    : estadoPos() + " · nivel " + NIVEL_POS;
  ver("posError", !!POS.error);
  ver("posJuego", !POS.error);
  ver("btnPosAjustes", !POS.error);
  if (POS.error) {
    $("posError").textContent = "El link trae una posición que no se puede jugar: " + POS.error + ".";
    return;
  }
  const fen = fenPos();
  const c = new Chess(fen);
  const destinos = POS.desde ? c.moves({ square: POS.desde, verbose: true }).map(m => m.to) : [];
  /* el tablero de la Partida, del lado de Juan: GIRADO es de la Partida, se
     presta y se devuelve */
  const g = GIRADO;
  GIRADO = POS.yo === "b";
  $("posTablero").innerHTML = dibujar(fen, POS.ucis[POS.ucis.length - 1] || null, null,
    { sinMarcas: true, sinAtras: true, sinAdelante: true, desde: POS.desde, destinos });
  GIRADO = g;
  const tira = $("posJugadas");
  const lista = jugadasPos();
  tira.innerHTML = lista || "Todavía no se jugó nada.";
  tira.classList.toggle("vacia", !lista);
  /* un solo renglón que no crece: se ven las últimas, y el fundido avisa
     que hay más a la izquierda */
  tira.scrollLeft = tira.scrollWidth;
  tira.classList.toggle("corta", tira.scrollWidth > tira.clientWidth + 1);
  ver("posFin", !!fin);
  if (fin) {
    $("posFin").classList.toggle("gano", fin.gano);
    $("posFinTit").textContent = fin.titulo;
    $("posFinSub").textContent = fin.sub;
  }
  $("posNivel").value = String(NIVEL_POS);
  $("posColor").value = POS.yo;
  $("posDeshacer").disabled = !hayJugadaMia();
  $("posReiniciar").disabled = !hayJugadaMia();
  /* si la posición llegó ya terminada, "Otra vez" volvería a lo mismo: un
     principal apagado se ve roto, así que no se muestra (revisor de UX) */
  ver("posOtraVez", hayJugadaMia());
}

/* LA HOJA (v1.2): la misma mecánica que la de Ajustes —Listo, tocar afuera
   y Escape (en `revision.js`, con el Tab que no se escapa)—, y el foco va y
   vuelve al botón redondo. */
function verHojaPos(abrir) {
  $("fondoAjustes").classList.toggle("oculto", !abrir);
  $("hojaPos").classList.toggle("oculto", !abrir);
  $("btnPosAjustes").setAttribute("aria-expanded", abrir ? "true" : "false");
  (abrir ? $("cerrarPos") : $("btnPosAjustes")).focus();
}
const hojaPosAbierta = () => !$("hojaPos").classList.contains("oculto");
$("btnPosAjustes").onclick = seguro("posición: la hoja", () => verHojaPos(true));
$("cerrarPos").onclick = seguro("posición: cerrar la hoja", () => verHojaPos(false));

/* TOCAR LA PIEZA Y DESPUÉS ADÓNDE. Solo las de Juan y solo en su turno. */
$("posTablero").addEventListener("click", seguro("posición: tocar", ev => {
  const r = ev.target.closest && ev.target.closest("[data-sq]");
  if (!r || !POS || POS.error) return;
  const sq = r.dataset.sq;
  const c = juegoPos();
  if (c.game_over() || c.turn() !== POS.yo) return;
  if (POS.desde) {
    const m = c.moves({ square: POS.desde, verbose: true }).find(x => x.to === sq);
    if (m) return moverPos(m.from + m.to + (m.promotion ? "q" : ""));
  }
  const p = c.get(sq);
  POS.desde = p && p.color === POS.yo && c.moves({ square: sq }).length && POS.desde !== sq ? sq : null;
  pintarPosicion();
}));

function moverPos(uci) {
  const c = new Chess(fenPos());
  /* la coronación va a dama: elegir otra pieza queda para después (Relleno) */
  const m = c.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] || "q" });
  if (!m) return;
  POS.fens.push(c.fen()); POS.sans.push(m.san); POS.ucis.push(m.from + m.to + (m.promotion || ""));
  POS.desde = null;
  pintarPosicion();
  turnoDelMotor();
}

/* EL TURNO DEL MOTOR. Si cambió la posición mientras pensaba (deshacer,
   empezar de nuevo, cambiar de color), lo que contesta se tira: `PENSANDO`
   es el número del turno, y cada cambio lo sube. */
async function turnoDelMotor() {
  if (POS.error) return;
  const fen = fenPos();
  const c = juegoPos();
  if (c.game_over() || c.turn() === POS.yo) return;
  const yo = ++PENSANDO;
  try {
    if (!MOTOR_POS) { MOTOR_POS = new Motor("posición"); }
    await MOTOR_POS.arrancar(16);
    if (PEDIDO_POS) { MOTOR_POS.w.postMessage("stop"); await PEDIDO_POS.catch(() => {}); }
    if (yo !== PENSANDO) return;
    const n = NIVELES[NIVEL_POS - 1];
    MOTOR_POS.w.postMessage("setoption name Skill Level value " + n.skill);
    /* con las jugadas, para que vea las repeticiones */
    PEDIDO_POS = MOTOR_POS.analizar(POS.inicial, n.prof, false, POS.ucis.slice());
    const r = await PEDIDO_POS;
    PEDIDO_POS = null;
    if (yo !== PENSANDO || fenPos() !== fen || !r.mejor) return;
    moverPos(r.mejor);
  } catch (e) {
    PEDIDO_POS = null;
    window.mostrarError("posición: el motor", e);
  }
}
function cancelarMotorPos() {
  PENSANDO++;
  if (PEDIDO_POS && MOTOR_POS && MOTOR_POS.w) MOTOR_POS.w.postMessage("stop");
}

/* DESHACER vuelve a la última vez que le tocaba a Juan: su jugada y la
   respuesta del motor juntas. Si el motor estaba pensando, solo la de Juan. */
$("posDeshacer").onclick = seguro("posición: deshacer", () => {
  if (!POS || !hayJugadaMia()) return;
  cancelarMotorPos();
  do { POS.fens.pop(); POS.sans.pop(); POS.ucis.pop(); }
  while (POS.sans.length && new Chess(fenPos()).turn() !== POS.yo);
  POS.desde = null;
  pintarPosicion();
  turnoDelMotor();
});
function deNuevoPos() {
  if (!POS) return;
  cancelarMotorPos();
  POS.fens = [POS.inicial]; POS.sans = []; POS.ucis = []; POS.desde = null;
  pintarPosicion();
  turnoDelMotor();
}
/* desde la hoja se cierra, así se ve la posición de vuelta */
$("posReiniciar").onclick = seguro("posición: de nuevo", () => { verHojaPos(false); deNuevoPos(); });
$("posOtraVez").onclick = seguro("posición: otra vez", deNuevoPos);
$("posNivel").onchange = seguro("posición: nivel", () => {
  NIVEL_POS = +$("posNivel").value;
  try { localStorage.setItem("nivelPos", String(NIVEL_POS)); } catch (e) { /* incógnito */ }
  pintarPosicion();
});
/* cambiar de color con la partida empezada sigue desde donde está: si ahora
   le toca al motor, juega */
$("posColor").onchange = seguro("posición: color", () => {
  if (!POS) return;
  cancelarMotorPos();
  POS.yo = $("posColor").value; POS.desde = null;
  pintarPosicion();
  turnoDelMotor();
});
$("volverDePosicion").onclick = seguro("volver", () => { if (hojaPosAbierta()) verHojaPos(false); cancelarMotorPos(); volver(); });

/* EL LINK. Al abrir la app y si cambia el `#` con la app abierta (el profe
   manda otro). */
function mirarElLink(alAbrir) {
  const fen = fenDelLink(location.hash);
  if (!fen) return false;
  const nv = +paramDelLink(location.hash, "nivel");
  abrirPosicion(fen, { nivel: nv >= 1 && nv <= 8 ? nv : null, color: paramDelLink(location.hash, "color"), alAbrir });
  return true;
}
window.addEventListener("hashchange", seguro("el link", () => mirarElLink(false)));

/* al abrir la app con un link */
mirarElLink(true);
