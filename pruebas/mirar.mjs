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
    var v = T[fen];
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
    postMessage("info depth 16 multipv 1 score " + tipo + (v.mejor ? " pv " + v.mejor : ""));
    if (v.segunda !== null && v.segunda !== undefined)
      postMessage("info depth 16 multipv 2 score cp " + v.segunda + " pv " + v.mejor);
    postMessage("bestmove " + (v.mejor || "(none)"));
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

const foto = async n => { await pg.waitForTimeout(300); await pg.screenshot({ path: path.join(SALIDA, n + SUFIJO + ".png") }); };
/* frena solo al llegar a la última: el botón se deshabilita ahí, y sin esto
   el arnés se muere de timeout clickeando algo que no responde */
const avanzar = async n => {
  for (let i = 0; i < n; i++) {
    if (await pg.locator("#sig").isDisabled()) return;
    await pg.click("#sig");
  }
};

await foto("revision-1");

/* LAS TRES UBICACIONES DE LA EXPLICACIÓN (v0.64), sobre la misma jugada: es lo
   único que cambia entre las tres capturas. La jugada NO se elige a ojo —se
   avanza hasta la primera que tenga algo que explicar, leyendo la pantalla— y
   por eso sirve igual en cualquiera de las partidas de prueba.
   Esto se va junto con el interruptor, cuando el usuario elija una. */
await pg.selectOption("#dondeExp", "tarjeta");
/* La jugada NO se elige a ojo: se recorre la partida leyendo la pantalla y se
   vuelve a la que MÁS tiene para explicar. Una que solo dice el rumbo no sirve
   para juzgar la disposición, porque es la frase más corta de todas. */
const textos = [];
for (let i = 0; ; i++) {
  textos.push(((await pg.locator("#vExp").textContent()) || "").trim());
  if (await pg.locator("#sig").isDisabled()) break;
  await pg.click("#sig");
}
/* Se prefiere la que MÁS tiene para explicar, salvo que haya un ataque doble:
   esa es la frase que la partida de prueba `doble` existe para mostrar, y
   dejarla al azar del largo la escondía detrás de otra más larga. */
let mejor = 0;
textos.forEach((t, i) => { if (t.length > textos[mejor].length) mejor = i; });
const conDoble = textos.findIndex(t => t.includes("a la vez"));
if (conDoble >= 0) mejor = conDoble;
for (let i = textos.length - 1; i > mejor; i--) await pg.click("#ant");
console.log("explicación:", JSON.stringify(textos[mejor]),
            `(jugada ${mejor + 1} de ${textos.length}; ` +
            `${textos.filter(Boolean).length} tienen algo que decir)`);
/* la vista arranca en el tablero, que es como se mira la jugada: la pregunta de
   las tres es si el renglón nuevo empuja algo fuera de la pantalla */
/* TOCAR LA FRASE ENCIENDE EL TABLERO (v0.69): no te lo explica, te lo muestra.
   La frase que señala algo lleva la clase `senala`; si no hay ninguna en esta
   jugada, se dice y no se saca la foto, en vez de sacar una foto vacía. */
const senala = pg.locator("#vExp span.senala").first();
if (await senala.count()) {
  await senala.click();
  await pg.evaluate(() => document.getElementById("tablero").scrollIntoView({ block: "start" }));
  await pg.evaluate(() => window.scrollBy(0, -60));
  await foto("senala-encendida");
  console.log("señala: ", JSON.stringify((await senala.textContent()).trim()));
  await senala.click();
} else console.log("señala:  (esta jugada no señala nada)");

for (const donde of ["tarjeta", "reemplaza", "senales"]) {
  await pg.selectOption("#dondeExp", donde);
  await pg.waitForTimeout(200);
  await pg.evaluate(() => document.getElementById("tablero").scrollIntoView({ block: "start" }));
  await pg.evaluate(() => window.scrollBy(0, -60));
  await foto("explicacion-" + donde);
  await pg.locator("#veredicto").screenshot({ path: path.join(SALIDA, "tarjeta-" + donde + SUFIJO + ".png") });
}
await pg.selectOption("#dondeExp", "tarjeta");

/* LOS TRES BOTONES GRANDES (v0.68). Cuál es el grande lo decide el veredicto,
   así que hacen falta las dos fotos: una jugada buena y una mala. La mala NO se
   elige a ojo: se recorre la partida leyendo el título de la tarjeta. */
const malas = ["Imprecisión", "Error", "Omisión"];
await pg.locator(".nav").screenshot({ path: path.join(SALIDA, "botones-buena" + SUFIJO + ".png") });
const antesDeBuscar = mejor;
for (let i = 0; i < 60; i++) {
  const t = (await pg.locator("#vTit").textContent()) || "";
  if (malas.some(m => t.includes(m))) break;
  if (await pg.locator("#sig").isDisabled()) break;
  await pg.click("#sig");
}
console.log("botones:  ", JSON.stringify(await pg.locator("#vTit").textContent()),
            "→ el grande es",
            await pg.locator("#btnProbar").evaluate(e => e.classList.contains("primario"))
              ? "Probar otra" : "Siguiente");
await pg.locator(".nav").screenshot({ path: path.join(SALIDA, "botones-mala" + SUFIJO + ".png") });
await pg.evaluate(() => document.getElementById("tablero").scrollIntoView({ block: "start" }));
await pg.evaluate(() => window.scrollBy(0, -60));
await foto("tarjeta-y-botones");
/* y se vuelve a la jugada de las capturas de la explicación */
while (true) {
  const t = (await pg.locator("#vTit").textContent()) || "";
  if (await pg.locator("#ant").isDisabled()) break;
  const n = parseInt(t, 10);
  if (!isNaN(n) && n <= Math.floor(antesDeBuscar / 2) + 1) break;
  await pg.click("#ant");
}

/* PROBAR JUGADAS: LA VARIANTE (v0.66), sobre esa misma jugada. Las jugadas NO
   se eligen a ojo: se le piden a chess.js, y la primera es una legal que no sea
   la que se jugó de verdad, para que la captura muestre una comparación y no la
   misma jugada dos veces. */
const posPrueba = new Chess(fens[mejor]);
const real = jugadas[mejor];
const alterna = posPrueba.moves({ verbose: true })
  .find(m => !(m.from === real.from && m.to === real.to));
if (!alterna) console.log("OJO: sin alternativa legal, no hay capturas de la variante");
else {
  /* PUERTA 1, el botón: la posición de ANTES de la jugada. */
  await pg.click("#btnProbar");
  await foto("prueba-1-eligiendo");
  await pg.click(`#tablero [data-sq="${alterna.from}"]`);
  await foto("prueba-2-elegida");
  await pg.click(`#tablero [data-sq="${alterna.to}"]`);
  await pg.waitForFunction(
    () => !/^Probando/.test(document.getElementById("pTit").textContent || ""),
    null, { timeout: 30000 });
  await foto("prueba-3-resultado");

  /* LA RESPUESTA DEL RIVAL, que es lo que la v0.65 no dejaba hacer. Sale de la
     posición que quedó, así que también se la pide chess.js. */
  posPrueba.move(alterna.san);
  const respuesta = posPrueba.moves({ verbose: true })[0];
  if (respuesta) {
    await pg.click(`#tablero [data-sq="${respuesta.from}"]`);
    await pg.click(`#tablero [data-sq="${respuesta.to}"]`);
    await pg.waitForFunction(
      () => !/^Probando/.test(document.getElementById("pTit").textContent || ""),
      null, { timeout: 30000 });
    await foto("prueba-5-encadenada");
    await pg.locator("#prueba").screenshot({ path: path.join(SALIDA, "tarjeta-prueba" + SUFIJO + ".png") });
    console.log("variante:", JSON.stringify(
      (await pg.locator("#pLinea").textContent()).replace(/\s+/g, " ").trim()));
    /* volver al arranque de la variante tocando su tira */
    await pg.click('#pLinea span[data-v="0"]');
    await foto("prueba-6-volviendo");
  }
  console.log("prueba:  ", JSON.stringify(await pg.locator("#pTit").textContent()),
              JSON.stringify(await pg.locator("#pSub").textContent()),
              JSON.stringify(await pg.locator("#pExp").textContent()));
  /* al volver a la partida, la pantalla tiene que quedar EXACTAMENTE como
     estaba: es lo que dice, mirándolo, que la variante no ensució nada */
  await pg.click("#btnProbar");
  await foto("prueba-4-vuelta");

  /* PUERTA 2, tocar una pieza sin abrir nada: arranca de la posición de DESPUÉS
     de la jugada, o sea la del rival. */
  const posDespues = new Chess(fens[mejor + 1]);
  const delRival = posDespues.moves({ verbose: true })[0];
  if (delRival) {
    await pg.click(`#tablero [data-sq="${delRival.from}"]`);
    await foto("prueba-7-tocando-sin-boton");
  }
  await pg.click("#btnProbar");
}

/* el tablero, el veredicto y la curva en una sola pantalla: es la pregunta de
   si algo nuevo empuja la lista de jugadas fuera de la vista */
await pg.evaluate(() => document.getElementById("tablero").scrollIntoView({ block: "start" }));
await pg.evaluate(() => window.scrollBy(0, -60));
await foto("revision-tablero-y-curva");
await avanzar(13);
await foto("revision-final");
await pg.locator("#curva").screenshot({ path: path.join(SALIDA, "curva.png") });
/* la barra sola: cómo termina la partida se juega en 16 px de alto, y en la
   captura de la pantalla entera esa franja es demasiado chica para juzgarla */
await pg.locator("#evalh").screenshot({ path: path.join(SALIDA, "barra" + SUFIJO + ".png") });
/* la jugada ANTERIOR a la última: en la partida que termina en mate es la que
   permite el mate, o sea la otra mitad del arreglo de la v0.60 */
await pg.click("#ant");
await foto("revision-anteultima");

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

/* lo que dice la cabecera y el cierre, en texto: una captura no deja copiar y
   pegar el resultado a una prueba, y esto sí */
console.log("cabecera:", JSON.stringify(await pg.locator("#revRival").textContent()),
            JSON.stringify(await pg.locator("#revFin").textContent()));
const cierreEl = pg.locator(".jugadas .cierre");
console.log("cierre:  ", await cierreEl.count() ? JSON.stringify((await cierreEl.textContent()).trim()) : "(no hay)");
console.log("listo: capturas/");
await b.close();
srv.close();
