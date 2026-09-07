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
const PGN = fs.readFileSync(new URL("./partida-de-prueba.pgn", import.meta.url), "utf8");

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

const tabla = {};
fens.forEach((fen, i) => {
  const legales = new Chess(fen).moves({ verbose: true });
  if (!legales.length) return;
  const jugada = jugadas[i] && (jugadas[i].from + jugadas[i].to + (jugadas[i].promotion || ""));
  const otra = legales.map(m => m.from + m.to + (m.promotion || "")).find(u => u !== jugada);
  /* una de cada tres la "acierta": así aparecen Mejor y Libro además de las malas */
  const mejor = (i % 3 === 0 && jugada) ? jugada : (otra || legales[0].from + legales[0].to);
  /* el motor habla desde EL QUE MUEVE; aBlancas lo da vuelta después */
  const cp = fen.split(" ")[1] === "w" ? forma(i) : -forma(i);
  tabla[fen] = { cp, mejor, segunda: cp - 60 - (i % 7) * 40 };
});

const FALSO = `
const T = ${JSON.stringify(tabla)};
let fen = null;
onmessage = function (e) {
  const s = String(e.data);
  if (s === "uci") return postMessage("uciok");
  if (s.startsWith("position fen ")) { fen = s.slice(13); return; }
  if (s.startsWith("go ")) {
    const v = T[fen] || { cp: 0, mejor: "e2e4", segunda: -60 };
    postMessage("info depth 16 multipv 1 score cp " + v.cp + " pv " + v.mejor);
    postMessage("info depth 16 multipv 2 score cp " + v.segunda + " pv " + v.mejor);
    postMessage("bestmove " + v.mejor);
  }
};
`;

const TIPOS = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript",
                ".json": "application/json", ".wasm": "application/wasm" };
const srv = http.createServer((req, res) => {
  const ruta = decodeURIComponent(req.url.split("?")[0]);
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
/* un celular: 412 x 915 es un Android corriente, y a 2x las capturas se leen */
const pg = await b.newPage({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2 });
pg.on("pageerror", e => console.log("PAGEERROR:", e.message));

fs.mkdirSync(SALIDA, { recursive: true });
await pg.goto("http://localhost:8099/index.html");
await pg.click("#verPegar");
await pg.fill("#pgn", PGN);
await pg.click("#usarPgn");
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

const foto = async n => { await pg.waitForTimeout(300); await pg.screenshot({ path: path.join(SALIDA, n + ".png") }); };
/* frena solo al llegar a la última: el botón se deshabilita ahí, y sin esto
   el arnés se muere de timeout clickeando algo que no responde */
const avanzar = async n => {
  for (let i = 0; i < n; i++) {
    if (await pg.locator("#sig").isDisabled()) return;
    await pg.click("#sig");
  }
};

await foto("revision-1");
await avanzar(20);
/* las tres formas de marca, sobre la misma jugada: es lo único que cambia */
for (const forma of ["punto", "puntoChico", "raya"]) {
  await pg.selectOption("#marcasCurva", forma);
  await pg.waitForTimeout(200);
  await pg.locator("#curva").screenshot({ path: path.join(SALIDA, "marcas-" + forma + ".png") });
}
/* el tablero, el veredicto y la curva en una sola pantalla: es la pregunta de
   si algo nuevo empuja la lista de jugadas fuera de la vista */
await pg.evaluate(() => document.getElementById("tablero").scrollIntoView({ block: "start" }));
await pg.evaluate(() => window.scrollBy(0, -60));
await foto("revision-tablero-y-curva");
await avanzar(13);
await foto("revision-final");
await pg.locator("#curva").screenshot({ path: path.join(SALIDA, "curva.png") });

/* Parado JUSTO en una jugada marcada: es donde se ve si la marca queda tapada
   por la raya del "estás acá", que es la única que nunca puede desaparecer.
   La jugada NO se elige a ojo: se lee la posición de una marca del HTML y se
   toca la curva ahí, que es lo mismo que haría el dedo. */
await pg.selectOption("#marcasCurva", "punto");
await pg.waitForTimeout(200);
const donde = await pg.evaluate(() => {
  const pt = document.querySelector("#curva .pt");
  return pt ? parseFloat(pt.style.left) / 100 : null;
});
if (donde === null) { console.log("OJO: la curva no tiene ni una marca"); }
else {
  const caja = await pg.locator("#curva").boundingBox();
  await pg.mouse.click(caja.x + caja.width * donde, caja.y + caja.height / 2);
  await pg.waitForTimeout(250);
  await pg.locator("#curva").screenshot({ path: path.join(SALIDA, "marcas-encima-punto.png") });
  await pg.selectOption("#marcasCurva", "raya");
  await pg.waitForTimeout(250);
  await pg.locator("#curva").screenshot({ path: path.join(SALIDA, "marcas-encima-raya.png") });
}
await pg.selectOption("#marcasCurva", "punto");

console.log("listo: capturas/");
await b.close();
srv.close();
