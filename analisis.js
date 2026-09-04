import { Chess } from "./cj.js";

/* ============ evaluación ============ */
export const TOPE = 1000;

export function aBlancas(ev, turno) {
  let cp;
  if (ev.mate !== null && ev.mate !== undefined) cp = ev.mate > 0 ? 10000 : -10000;
  else cp = ev.cp === null || ev.cp === undefined ? 0 : ev.cp;
  if (turno === "b") cp = -cp;
  return Math.max(-TOPE, Math.min(TOPE, cp));
}

/* probabilidad de victoria — curva de lichess, documentada en §E del apéndice */
export function winPct(cp) {
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368 * cp)) - 1);
}

/* precisión de una jugada a partir de cuántos puntos de probabilidad perdió */
export function precisionJugada(caidaPuntos) {
  const v = 103.1668 * Math.exp(-0.04354 * caidaPuntos) - 3.1669;
  return Math.max(0, Math.min(100, v));
}

/* ============ geometría ============ */
const VALOR = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const casilla = (f, r) => "abcdefgh"[f] + (r + 1);

export function peonAtaca(juego, sq, colorRival) {
  const f = "abcdefgh".indexOf(sq[0]), r = +sq[1] - 1;
  const dr = colorRival === "w" ? -1 : 1;
  for (const df of [-1, 1]) {
    const ff = f + df, rr = r + dr;
    if (ff < 0 || ff > 7 || rr < 0 || rr > 7) continue;
    const p = juego.get(casilla(ff, rr));
    if (p && p.type === "p" && p.color === colorRival) return true;
  }
  return false;
}

/* ¿la pieza parada en `sq` se la llevan sin devolución? */
export function quedaComible(fenDespues, sq) {
  const j = new Chess(fenDespues);
  const capturas = j.moves({ verbose: true }).filter(m => m.to === sq);
  if (!capturas.length) return false;
  for (const c of capturas) {
    const j2 = new Chess(fenDespues);
    j2.move(c);
    if (!j2.moves({ verbose: true }).some(m => m.to === sq)) return true;
  }
  return false;
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

/* ¿había una captura que ganaba material? devuelve la mejor o null */
export function capturaGanadora(fen, minimo = 1) {
  const j = new Chess(fen);
  let mejor = null, mejorGana = 0;
  for (const m of j.moves({ verbose: true })) {
    if (!m.captured) continue;
    const g = gananciaDeCaptura(fen, m);
    if (g >= minimo && g > mejorGana) { mejor = m; mejorGana = g; }
  }
  return mejor ? { san: mejor.san, gana: mejorGana } : null;
}

/* ¿la jugada entrega material? (queda comible, o come algo que vale menos) */
export function entregaMaterial(fen, mov) {
  const j = new Chess(fen);
  const hecho = j.move(mov);
  if (!hecho) return false;
  if (hecho.captured) return gananciaDeCaptura(fen, mov) < 0;
  return quedaComible(j.fen(), hecho.to);
}

/* ============ categorías ============ */
export const CATEGORIAS = {
  brillante:  { nombre: "Brillante",   icono: "!!", desc: "Entrega material y aun así es la mejor." },
  genial:     { nombre: "Genial",      icono: "!",  desc: "La única jugada que sostiene la posición." },
  mejor:      { nombre: "Mejor",       icono: "★",  desc: "La primera elección del motor." },
  excelente:  { nombre: "Excelente",   icono: "👍", desc: "Casi tan buena como la mejor." },
  bien:       { nombre: "Bien",        icono: "✓",  desc: "Una buena jugada, pero no la mejor." },
  libro:      { nombre: "Libro",       icono: "📖", desc: "Jugada de apertura conocida." },
  imprecision:{ nombre: "Imprecisión", icono: "?!", desc: "Una jugada débil." },
  error:      { nombre: "Error",       icono: "?",  desc: "Empeora la posición." },
  omision:    { nombre: "Omisión",     icono: "✗",  desc: "Había mate o material y se dejó pasar." },
  grave:      { nombre: "Error grave", icono: "??", desc: "Pierde material o la partida." }
};

export const ORDEN = ["brillante", "genial", "mejor", "excelente", "bien", "libro",
                      "imprecision", "error", "omision", "grave"];

/*
  Prioridad: libro gana a todo (las primeras jugadas no se juzgan).
  Después, si hubo una oportunidad concreta desperdiciada, es omisión, aunque
  la pérdida sea grande: el mecanismo importa más que el tamaño.
*/
export function categorizar({ perdida, esMejor, esLibro, entrega, unicaBuena, oportunidad, legales }) {
  if (esLibro) return "libro";
  if (oportunidad && perdida >= 1) return "omision";
  if (perdida >= 3) return "grave";
  if (perdida >= 1) return "error";
  if (perdida >= 0.5) return "imprecision";
  if (esMejor && entrega) return "brillante";
  if (esMejor && unicaBuena && legales >= 2) return "genial";
  if (esMejor) return "mejor";
  if (perdida < 0.1) return "excelente";
  return "bien";
}
