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
  if ((tab.match(/K/g) || []).length !== 1 || (tab.match(/k/g) || []).length !== 1)
    return "tiene que haber un rey de cada color";
  const p = fen.split(" ");
  const otro = new Chess([p[0], p[1] === "w" ? "b" : "w", "-", "-", "0", "1"].join(" "));
  if (otro.in_check()) return "el que no mueve está en jaque";
  return null;
}

let NIVEL_POS = 4;
try { NIVEL_POS = Math.min(8, Math.max(1, +localStorage.getItem("nivelPos") || 4)); } catch (e) { /* incógnito */ }

function abrirPosicion(fen, opc) {
  opc = opc || {};
  cancelarMotorPos();
  const error = problemaDelFen(fen);
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

/* cómo está la partida, en una línea: es el subtítulo de la barra */
function estadoPos() {
  if (POS.error) return "";
  const c = new Chess(fenPos());
  const yo = POS.yo, toca = c.turn();
  if (c.in_checkmate()) return toca === yo ? "Jaque mate: ganó el motor" : "Jaque mate: ganaste";
  if (c.in_stalemate()) return "Tablas: ahogado";
  if (c.insufficient_material()) return "Tablas: no queda con qué dar mate";
  if (c.in_threefold_repetition()) return "Tablas: tres veces la misma posición";
  if (c.in_draw()) return "Tablas: 50 jugadas sin captura ni peón";
  if (toca !== yo) return "Piensa el motor…";
  return (c.in_check() ? "Jaque. " : "") + "Te toca con " + (yo === "w" ? "blancas" : "negras");
}

/* las jugadas, numeradas desde donde arranca la posición */
function jugadasPos() {
  const p = POS.inicial.split(" ");
  let n = +p[5] || 1, blancas = p[1] === "w";
  const out = [];
  POS.sans.forEach((s, i) => {
    if (blancas) out.push(`${n}. ${s}`);
    else { out.push(i === 0 ? `${n}… ${s}` : s); n++; }
    blancas = !blancas;
  });
  return out.join(" ");
}

function pintarPosicion() {
  if (!POS) return;
  $("posEstado").textContent = estadoPos();
  ver("posError", !!POS.error);
  ver("posJuego", !POS.error);
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
  $("posJugadas").textContent = jugadasPos() || "Todavía no se jugó nada.";
  $("posNivel").value = String(NIVEL_POS);
  $("posColor").value = POS.yo;
  $("posDeshacer").disabled = !POS.sans.length;
  $("posReiniciar").disabled = !POS.sans.length;
}

/* TOCAR LA PIEZA Y DESPUÉS ADÓNDE. Solo las de Juan y solo en su turno. */
$("posTablero").addEventListener("click", seguro("posición: tocar", ev => {
  const r = ev.target.closest && ev.target.closest("[data-sq]");
  if (!r || !POS || POS.error) return;
  const sq = r.dataset.sq;
  const c = new Chess(fenPos());
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
  const fen = fenPos();
  const c = new Chess(fen);
  if (POS.error || c.game_over() || c.turn() === POS.yo) return;
  const yo = ++PENSANDO;
  try {
    if (!MOTOR_POS) { MOTOR_POS = new Motor("posición"); }
    await MOTOR_POS.arrancar(16);
    if (PEDIDO_POS) { MOTOR_POS.w.postMessage("stop"); await PEDIDO_POS.catch(() => {}); }
    if (yo !== PENSANDO) return;
    const n = NIVELES[NIVEL_POS - 1];
    MOTOR_POS.w.postMessage("setoption name Skill Level value " + n.skill);
    PEDIDO_POS = MOTOR_POS.analizar(fen, n.prof, false);
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
  if (!POS || !POS.sans.length) return;
  cancelarMotorPos();
  do { POS.fens.pop(); POS.sans.pop(); POS.ucis.pop(); }
  while (POS.sans.length && new Chess(fenPos()).turn() !== POS.yo);
  POS.desde = null;
  pintarPosicion();
  turnoDelMotor();
});
$("posReiniciar").onclick = seguro("posición: de nuevo", () => {
  if (!POS) return;
  cancelarMotorPos();
  POS.fens = [POS.inicial]; POS.sans = []; POS.ucis = []; POS.desde = null;
  pintarPosicion();
  turnoDelMotor();
});
$("posNivel").onchange = seguro("posición: nivel", () => {
  NIVEL_POS = +$("posNivel").value;
  try { localStorage.setItem("nivelPos", String(NIVEL_POS)); } catch (e) { /* incógnito */ }
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
$("volverDePosicion").onclick = seguro("volver", () => { cancelarMotorPos(); volver(); });

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
