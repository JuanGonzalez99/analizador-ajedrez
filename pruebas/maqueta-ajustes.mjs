/* Mira la app en un navegador de verdad y saca capturas. Correr: npm run mirar
   (las capturas quedan en capturas/, que está en .gitignore).

   Es el tercer chequeo, y contesta lo que los otros dos no pueden:

   | analisis.test.mjs | los números  |
   | estaticos.mjs     | la estructura del HTML |
   | este              | LA PANTALLA  |

   Existe por la regla de §10: "un cambio que toca lo que se dibuja se MIRA en
   la pantalla, no solo se mide". El comentario impreso en el medio de cinco
   tablas (v0.51) se escapó de los otros dos y lo vio el usuario.

   NO TOCA index.html y no entra al sitio: levanta un servidor de archivos sobre
   el repo y abre la app tal cual, en modo simple, que es como se usa.

   EL MOTOR VA FALSEADO, y es lo que lo hace usable: el wasm real tarda minutos
   por partida —hay una medición fallida de eso: profundidad 13 sobre 25 jugadas
   no terminó en 10 minutos en un contenedor— y acá se está mirando el DIBUJO.
   Se sirve un worker de mentira que habla el pedacito de UCI que usa la clase
   Motor y contesta de una tabla FEN → evaluación armada de antemano con
   chess.js. LAS EVALUACIONES SON INVENTADAS: los veredictos de la pantalla no
   significan nada, la disposición sí. Para juzgar un veredicto está el celu. */
import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Chess } from "../chess.js";

const RAIZ = path.dirname(fileURLToPath(new URL("../index.html", import.meta.url)));
const SALIDA = path.join(RAIZ, "capturas");
/* Qué partida se mira: `npm run mirar <nombre>` lee `partida-<nombre>.pgn`.
   Hay más de una porque CÓMO TERMINA LA PARTIDA es una pantalla propia y la
   partida larga no llega nunca a ninguna de ellas —no termina ni en mate ni en
   tablas—, así que sin esto no había forma de mirarlas. Ahí vivió el bug del
   `mate 0`: la jugada que daba el mate salía "Omisión" y la barra decía "M0". */
const CUAL = process.argv[2] || "de-prueba";
const PGN = fs.readFileSync(new URL(`./partida-${CUAL}.pgn`, import.meta.url), "utf8");
const SUFIJO = CUAL === "de-prueba" ? "" : "-" + CUAL;

/* Chromium: el de Playwright, salvo que el entorno traiga uno propio. En los
   contenedores de trabajo suele estar preinstalado y bajarlo de nuevo no sirve. */
const CHROMIUM = process.env.CHROMIUM_PATH ||
  ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "/opt/pw-browsers/chromium/chrome-linux/chrome"]
    .find(p => fs.existsSync(p));

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

/* EL MOTOR FALSO TARDA A PROPÓSITO EN LAS POSICIONES PROBADAS (v0.79), y solo
   en esas: una posición que no está en la tabla es, por definición, una jugada
   inventada. Sin esta demora no se puede mirar lo único que la v0.79 cambió
   —que el tablero dibuje ANTES de que vuelva el motor—, porque el motor falso
   contesta en el mismo tick y todo parece instantáneo. El análisis de la
   partida no la paga: esas posiciones sí están en la tabla. */
const LENTO = +(process.env.MOTOR_LENTO || 400);

const FALSO = `
const T = ${JSON.stringify(tabla)};
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
         que las capturas son repetibles— y SIN pv, porque derivarFilas usa la
         mejor de la posición anterior, que sí está en la tabla, y nunca la de
         esta. Antes contestaba cp 0 con "e2e4" de mejor, que además de mentir
         podía ser ilegal en la posición probada. */
      var x = 0;
      for (var k = 0; k < fen.length; k++) x = (x * 31 + fen.charCodeAt(k)) | 0;
      v = { cp: Math.abs(x % 601) - 300, mejor: null, segunda: null };
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
  "/api/archives": { archives: ["http://localhost:8099/api/mes"] },
  "/api/mes": { games: [JUEGO] },
};

const TIPOS = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript",
                ".json": "application/json", ".wasm": "application/wasm" };
const srv = http.createServer((req, res) => {
  const ruta = decodeURIComponent(req.url.split("?")[0]);
  if (API[ruta]) {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify(API[ruta]));
  }
  if (ruta.endsWith("stockfish-18-lite-single.js")) {
    res.writeHead(200, { "content-type": "text/javascript" });
    return res.end(FALSO);
  }
  const f = path.join(RAIZ, ruta === "/" ? "/index.html" : ruta);
  if (!f.startsWith(RAIZ) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": TIPOS[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => srv.listen(8099, r));

const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {});
/* EL TAMAÑO SALE DE UNA MEDICIÓN, no de un modelo de teléfono. Sobre una
   captura del celular del usuario, y sacando la escala del tablero (que mide
   360 CSS de ancho), su viewport es de ~420 x 810 con la barra de direcciones
   escondida y ~745 de alto cuando está visible. Se dibuja a 412 x 760, que es
   el caso apretado: una captura más alta no deja dimensionar cuánto se ve de
   verdad, y era 915 hasta la v0.64. A 2x las capturas se leen. */
const pg = await b.newPage({ viewport: { width: 412, height: 760 }, deviceScaleFactor: 2 });
pg.on("pageerror", e => console.log("PAGEERROR:", e.message));

fs.mkdirSync(SALIDA, { recursive: true });
/* Se entra POR LA LISTA, que es como lo usa el usuario, y no pegando el PGN:
   son dos caminos distintos y el del PGN no tiene el JSON del mes. */
await pg.route("https://api.chess.com/**", r =>
  r.fulfill({ status: 200, contentType: "application/json",
              body: JSON.stringify(API["/api/archives"]) }));
await pg.goto("http://localhost:8099/index.html");
await pg.fill("#usuario", cabPgn("White", "Blancas"));
await pg.click("#buscar");
await pg.waitForSelector("#partidas div[data-i]", { timeout: 20000 });
await pg.click("#partidas div[data-i]");
await pg.waitForSelector("#analizar", { state: "visible", timeout: 20000 });
await pg.click("#analizar");
try {
  await pg.waitForSelector("#zonaRevision:not(.oculto)", { timeout: 45000 });
} catch (e) {
  /* si no llega, la foto de lo que quedó y el registro dicen por qué. Sin esto
     lo único que se veía era "Timeout exceeded", que no dice nada. */
  await pg.screenshot({ path: path.join(SALIDA, "atascado.png"), fullPage: true });
  console.log("ATASCADO, mirá capturas/atascado.png. Registro:");
  console.log(await pg.evaluate(() => (window.LOG && window.LOG.texto && window.LOG.texto()) || "sin registro"));
  await b.close(); srv.close(); process.exit(1);
}
await pg.waitForTimeout(800);

/* SE ESTACIONA EL PUNTERO ANTES DE CADA CAPTURA (v0.82). Sin esto la captura
   depende de dónde haya quedado el mouse: al agregar las reglas de hover, seis
   capturas del celular cambiaron porque el puntero seguía encima del último
   elemento clickeado y lo dejaba iluminado. En un celular eso no pasa nunca.
   NO se emula un aparato táctil —con `hasTouch` la página dice `hover: none`,
   que es lo honesto, pero se fija al crear el contexto y entonces la pasada
   ancha no podría probar nada de lo que solo existe con mouse—. Estacionar da
   el mismo dibujo y además hace la captura REPETIBLE, que antes no era. */
const foto = async n => {
  await pg.mouse.move(2, 2);
  await pg.waitForTimeout(300);
  await pg.screenshot({ path: path.join(SALIDA, n + SUFIJO + ".png") });
};
/* lo mismo para las capturas de UN elemento: dos de la curva salían distintas
   porque el puntero quedaba encima y le encendía el borde */
const fotoDe = async (sel, n) => {
  await pg.mouse.move(2, 2);
  await pg.waitForTimeout(120);
  await pg.locator(sel).screenshot({ path: path.join(SALIDA, n + ".png") });
};
/* frena solo al llegar a la última: el botón se deshabilita ahí, y sin esto
   el arnés se muere de timeout clickeando algo que no responde */
const avanzar = async n => {
  for (let i = 0; i < n; i++) {
    if (await pg.locator("#sig").isDisabled()) return;
    await pg.click("#sig");
  }
};


/* ─────────────────────────────────────────────────────────────────────────
   MAQUETA DEL MENÚ DE AJUSTES (v0.91). Dibuja las formas al tamaño del
   celular para que el usuario elija mirando. No toca index.html: todo se
   inyecta acá. Se borra cuando esté elegida.
   ───────────────────────────────────────────────────────────────────────── */

const CSS = `
.maq-oculto { display: none !important; }
/* --- la hoja que sube desde abajo (A) --- */
.aj-fondo { position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 40; }
.aj-hoja { position: fixed; left: 0; right: 0; bottom: 0; z-index: 41;
  background: Canvas; color: CanvasText; border-top: 1px solid var(--linea);
  border-radius: 14px 14px 0 0; padding: 8px 14px 16px;
  box-shadow: 0 -6px 24px rgba(0,0,0,.3); max-height: 80vh; overflow-y: auto; }
.aj-tirador { width: 34px; height: 4px; border-radius: 2px; background: var(--linea);
  margin: 2px auto 8px; }
.aj-cab { display: flex; align-items: center; justify-content: space-between; }
.aj-cab h2 { font-size: 17px; margin: 0; }
/* --- común a las tres --- */
.aj-g { font-size: 12.5px; color: var(--tenue); margin: 14px 0 2px; }
.aj-g:first-of-type { margin-top: 6px; }
.aj-f { display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding: 8px 0; border-top: 1px solid var(--linea); }
.aj-f > span { font-size: 15px; }
.aj-f select { min-width: 52%; }
.aj-nota { font-size: 12.5px; color: var(--tenue); margin: 10px 0 0; }
/* --- el desplegable en línea (B) --- */
.aj-linea { border: 1px solid var(--linea); border-radius: 8px; padding: 2px 12px 12px;
  margin-top: 8px; }
.aj-linea > summary { font-size: 14px; padding: 8px 0; cursor: pointer; }
/* --- la pantalla propia (C) --- */
.aj-pant h1 { font-size: 20px; margin: 0 0 2px; }
`;

/* el tercer valor es el que está puesto hoy: la maqueta no puede sugerir que
   los defaults cambiaron */
const GRUPOS = [
  ["El tablero", [
    ["Tema", ["Madera", "Torneo", "Azul", "Nogal", "Gris"], "Madera"]
  ]],
  ["Cómo se ve la partida", [
    ["Evaluación", ["barra horizontal", "en la tarjeta", "barra vertical"], "barra horizontal"],
    ["Marcas de la curva", ["punto", "punto chico", "raya"], "punto"]
  ]],
  ["La explicación", [
    ["Cuánto habla", ["corta", "media", "larga"], "media"],
    ["Al probar una jugada", ["sin la lista", "la lista adentro", "la lista abajo", "las dos tarjetas"], "sin la lista"]
  ]]
];

await pg.addStyleTag({ content: CSS });
await pg.evaluate(g => { window.GRUPOS = g; window.filas = () => window.GRUPOS.map(([t, fs]) =>
  `<p class="aj-g">${t}</p>` + fs.map(([et, ops, puesto]) =>
    `<div class="aj-f"><span>${et}</span><select class="chico">` +
    ops.map(o => `<option${o === puesto ? " selected" : ""}>${o}</option>`).join("") +
    `</select></div>`).join("")).join("");
}, GRUPOS);

/* al pie de la vista Partida, que es donde vive hoy la fila de controles */
const alPie = async () => {
  await pg.evaluate(() => {
    document.querySelector(".pabajo .fila").scrollIntoView({ block: "end" });
    window.scrollBy(0, 40);
  });
  await pg.waitForTimeout(250);
};
const medir = async n => console.log(n.padEnd(16), JSON.stringify(await pg.evaluate(() => {
  const f = document.querySelector(".pabajo .fila").getBoundingClientRect();
  return { filaAlto: Math.round(f.height) };
})));

await alPie();
await medir("hoy");
await foto("aj-0-hoy");

/* la fila con el engranaje: los cinco selects se van y queda un renglón */
await pg.evaluate(() => {
  const fila = document.querySelector(".pabajo .fila");
  fila.querySelectorAll("select").forEach(s => s.classList.add("maq-oculto"));
  const b = document.createElement("button");
  b.className = "chico"; b.id = "btnAjustes"; b.textContent = "⚙ Ajustes";
  fila.appendChild(b);
});
await alPie();
await medir("con engranaje");
await foto("aj-1-fila");

/* A — LA HOJA QUE SUBE DESDE ABAJO */
const abrirHoja = () => pg.evaluate(() => {
  const d = document.createElement("div"); d.className = "aj-fondo"; d.id = "majFondo";
  const h = document.createElement("div"); h.className = "aj-hoja"; h.id = "majHoja";
  h.innerHTML = `<div class="aj-tirador"></div>
    <div class="aj-cab"><h2>Ajustes</h2><button class="chico">Listo</button></div>
    ${window.filas()}
    <p class="aj-nota">Se guardan solos y quedan puestos para la próxima vez.</p>`;
  document.body.append(d, h);
});
await abrirHoja();
await pg.waitForTimeout(300);
await foto("aj-2-hoja");
console.log("hoja alto       ", JSON.stringify(await pg.evaluate(() =>
  Math.round(document.getElementById("majHoja").getBoundingClientRect().height))));
await pg.evaluate(() => { majFondo.remove(); majHoja.remove(); });

/* B — EL DESPLEGABLE EN LÍNEA */
await pg.evaluate(() => {
  document.getElementById("btnAjustes").classList.add("maq-oculto");
  const d = document.createElement("details");
  d.className = "aj-linea"; d.id = "majDet"; d.open = true;
  d.innerHTML = `<summary>⚙ Ajustes</summary>${window.filas()}
    <p class="aj-nota">Se guardan solos y quedan puestos para la próxima vez.</p>`;
  document.querySelector(".pabajo .fila").after(d);
});
await pg.evaluate(() => { majDet.scrollIntoView({ block: "end" }); window.scrollBy(0, 40); });
await pg.waitForTimeout(300);
await foto("aj-3-linea");
await pg.evaluate(() => { majDet.remove(); document.getElementById("btnAjustes").classList.remove("maq-oculto"); });

/* D — LA PUERTA ARRIBA, en el conmutador: se llega desde Partida y desde Mes */
await pg.evaluate(() => {
  const c = document.getElementById("conmutador");
  const b = document.createElement("button");
  b.id = "majEng"; b.textContent = "⚙"; b.setAttribute("aria-label", "Ajustes");
  c.appendChild(b);
  c.scrollIntoView({ block: "center" });
});
await pg.waitForTimeout(300);
await foto("aj-5-puerta-arriba");
await abrirHoja();
await pg.waitForTimeout(300);
await foto("aj-6-puerta-arriba-abierta");
await pg.evaluate(() => { majFondo.remove(); majHoja.remove(); majEng.remove(); });

/* C — LA PANTALLA PROPIA. Todo lo demás se esconde: hoy el buscador, el mes,
   la lista y el bloque de análisis quedan SIEMPRE arriba, así que una pantalla
   de ajustes de verdad tiene que taparlos. */
await pg.evaluate(() => {
  const s = document.createElement("div"); s.className = "aj-pant"; s.id = "majPant";
  s.innerHTML = `<div class="aj-cab" style="margin:0 0 4px">
      <h1>Ajustes</h1><button class="chico">‹ Volver a la partida</button></div>
    ${window.filas()}
    <p class="aj-nota">Se guardan solos y quedan puestos para la próxima vez.</p>`;
  for (const e of [...document.body.children]) if (e.tagName !== "SCRIPT") e.classList.add("maq-oculto");
  document.body.append(s);
  window.scrollTo(0, 0);
});
await pg.waitForTimeout(300);
await foto("aj-4-pantalla");

await b.close(); srv.close();
console.log("\nlisto: capturas/aj-*.png");
