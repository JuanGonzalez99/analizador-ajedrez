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
const conDoble = textos.findIndex(t => t.includes("ataque doble"));
if (conDoble >= 0) mejor = conDoble;
for (let i = textos.length - 1; i > mejor; i--) await pg.click("#ant");
console.log("explicación:", JSON.stringify(textos[mejor]),
            `(jugada ${mejor + 1} de ${textos.length}; ` +
            `${textos.filter(Boolean).length} tienen algo que decir)`);
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

/* La tarjeta como quedó: el título y UN renglón, que es la explicación o la
   frase fija de la categoría. Las tres ubicaciones que se comparaban acá se
   fueron con el interruptor en la v0.72. */
await pg.evaluate(() => document.getElementById("tablero").scrollIntoView({ block: "start" }));
await pg.evaluate(() => window.scrollBy(0, -60));
await foto("revision-tarjeta");
await pg.locator("#veredicto").screenshot({ path: path.join(SALIDA, "tarjeta" + SUFIJO + ".png") });

/* LOS TRES BOTONES GRANDES (v0.68). Cuál es el grande lo decide el veredicto,
   así que hacen falta las dos fotos: una jugada buena y una mala. La mala NO se
   elige a ojo: se recorre la partida leyendo el título de la tarjeta. */
const malas = ["Imprecisión", "Error", "Omisión"];
await pg.locator(".nav").screenshot({ path: path.join(SALIDA, "botones-buena" + SUFIJO + ".png") });
/* se cuentan los pasos que se dan, para poder DESHACERLOS exactamente. Antes se
   volvía comparando el número de jugada del título, y eso paraba en la mitad
   equivocada del par —"5… Bxd4" en vez de "5. d4"—, así que las capturas de la
   variante salían de otra posición que la que se había elegido. */
let pasos = 0;
for (let i = 0; i < 60; i++) {
  const t = (await pg.locator("#vTit").textContent()) || "";
  if (malas.some(m => t.includes(m))) break;
  if (await pg.locator("#sig").isDisabled()) break;
  await pg.click("#sig");
  pasos++;
}
console.log("botones:  ", JSON.stringify(await pg.locator("#vTit").textContent()),
            "→ el grande es",
            await pg.locator("#btnProbar").evaluate(e => e.classList.contains("primario"))
              ? "Probar otra" : "Siguiente");
await pg.locator(".nav").screenshot({ path: path.join(SALIDA, "botones-mala" + SUFIJO + ".png") });
/* la fila de botones EN LA PANTALLA, que es donde se juzga: sola no se ve qué
   tiene encima ni cuánto hay que scrollear para llegar */
await pg.evaluate(() => document.querySelector(".nav").scrollIntoView({ block: "end" }));
await foto("pantalla-botones");

await pg.evaluate(() => document.getElementById("tablero").scrollIntoView({ block: "start" }));
await pg.evaluate(() => window.scrollBy(0, -60));
await foto("tarjeta-y-botones");
/* y se vuelve a la jugada de las capturas de la explicación, deshaciendo
   exactamente los pasos que se dieron */
for (let i = 0; i < pasos; i++) await pg.click("#ant");

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
  /* la maqueta del borde violeta se fue en la v0.71: el usuario eligió el color
     de la categoría mirando las dos. */
    console.log("variante:", JSON.stringify(
      (await pg.locator("#pLinea").textContent()).replace(/\s+/g, " ").trim()));
    /* volver a la PRIMERA jugada de la variante tocando su tira. Iba al
       arranque con data-v="0" hasta la v0.71, que le sacó ese eslabón. */
    await pg.click('#pLinea span[data-v="1"]');
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

/* ============ LAS CUATRO DISTRIBUCIONES (maquetas, v0.73) ============

   Van AL FINAL a propósito: mueven el DOM de la página abierta y no lo dejan
   como estaba, así que nada de lo de arriba puede depender de esto. NO TOCAN
   index.html: son un dibujo para decidir mirando, y se van cuando el usuario
   elija.

   Lo que se está comparando es dónde va cada bloque de la vista Partida:
     A  estado arriba   → cabecera · barra · CURVA · tablero · tira · tarjeta · cuadritos
     B  tarjeta primero → igual que A pero la tarjeta antes de la tira
     C  compacta        → A con los cuadritos metidos adentro de la tarjeta
     D  la de hoy       → para tener contra qué comparar

   La TIRA HORIZONTAL no existe en la app: se arma acá con las jugadas que ya
   están dibujadas en la lista vertical, para poder verla sin construirla. */

/* LA TIRA LLEVA LA PARTIDA ENTERA y se centra sola en la jugada actual.

   No es una ventana de N jugadas: eso obligaba a elegir un N, y con cualquiera
   las puntas quedaban cortadas o no según dónde estuvieras. Con la partida
   entera adentro y el scroll centrado, **siempre se ve que hay más para los dos
   lados cuando lo hay**, y cuando no lo hay —el arranque y el final— tampoco se
   ve, que es la información correcta. Es lo que pidió el usuario.

   Además así el dedo llega a cualquier jugada de la partida, no solo a las
   vecinas, y los galones quedan para el paso fino. */
const armarTira = async (conNumero = false, estilo = "borde", fade = 0) =>
  await pg.evaluate(([conNum, est, desvanecer]) => {
  const vieja = document.getElementById("tiraH");
  if (vieja) vieja.remove();
  const jg = [...document.querySelectorAll("#jugadas .jg")].filter(e => e.textContent.trim());
  const cont = document.createElement("div");
  cont.id = "tiraH";
  cont.style.cssText = "display:flex;align-items:center;gap:6px;margin:10px 0;";
  const galon = t => {
    const b = document.createElement("button");
    b.textContent = t;
    /* el galón sin recuadro pesa mucho menos, y ya hay dos iguales en el
       tablero: los tres serían el mismo gesto dibujado igual */
    /* el galón va pelado en TODAS las variantes nuevas: así lo único que cambia
       entre ellas es cómo se marca la jugada actual, que es lo que se compara */
    b.style.cssText = est !== "borde"
      /* 44 px es el objetivo mínimo para un dedo, y `display:flex` + `line-height:1`
         es lo que los alinea de verdad con las jugadas: con el `line-height` de
         un botón, el chevron se apoya en su propia caja y queda corrido. */
      ? "flex:0 0 34px;height:44px;padding:0;font-size:24px;border:none;" +
        "background:none;color:var(--tenue);display:flex;align-items:center;" +
        "justify-content:center;line-height:1;"
      : "flex:0 0 38px;height:38px;padding:0;font-size:16px;";
    return b;
  };
  const medio = document.createElement("div");
  medio.style.cssText = "flex:1;min-width:0;display:flex;gap:5px;align-items:center;" +
    "overflow-x:auto;scrollbar-width:none;";
  /* EL DESVANECIDO. Los recuadros de antes tapaban las jugadas de las puntas y
     eso decía "hay más para allá"; sin recuadro, las jugadas se cortaban en
     seco. Una máscara de degradado devuelve ese aviso sin dibujar nada: la
     jugada se disuelve contra el papel a medida que se acerca al galón.
     No es opacidad sobre el elemento: es una máscara, así que no depende del
     color de fondo y funciona igual con cualquier tema. */
  if (desvanecer) {
    const m = "linear-gradient(to right, transparent 0, #000 " + desvanecer + "px, " +
      "#000 calc(100% - " + desvanecer + "px), transparent 100%)";
    medio.style.maskImage = m;
    medio.style.webkitMaskImage = m;
  }
  let elegida = null;
  for (const e of jg) {
    const esta = e.classList.contains("sel");
    if (conNum) {
      const fila = e.parentElement;
      const jgs = [...fila.querySelectorAll(".jg")].filter(x => x.textContent.trim());
      if (jgs.indexOf(e) === 0) {
        const num = document.createElement("span");
        num.textContent = fila.querySelector(".np").textContent + ".";
        /* el mismo relleno vertical que las jugadas: sin eso las cajas miden
           distinto y el número queda medio renglón corrido */
        num.style.cssText = "font-size:12px;color:var(--tenue);white-space:nowrap;" +
          "padding:4px 0;line-height:1.2;";
        medio.appendChild(num);
      }
    }
    const sp = document.createElement("span");
    sp.innerHTML = e.innerHTML;
    const base = "white-space:nowrap;font-size:13px;padding:4px 7px;border-radius:6px;" +
      "line-height:1.2;color:" + e.style.color + ";";
    /* cuatro formas de decir CUÁL es la actual, con la misma información:
       - borde:  todas con recuadro, la actual con el recuadro fuerte (la de hoy)
       - limpia: ninguna con recuadro, la actual con recuadro
       - pelado: ninguna con recuadro, la actual con fondo LLENO y letra clara
       - tenue:  igual que pelado pero con el fondo al 20%, que es EXACTAMENTE
                 como la lista vertical marca la jugada actual desde la v28 */
    sp.style.cssText = base + (
      est === "borde"
        ? "border:1px solid " + (esta ? "currentColor" : "var(--linea)") + (esta ? ";font-weight:700" : "")
      : est === "limpia"
        ? (esta ? "border:1px solid currentColor;font-weight:700" : "border:1px solid transparent")
      : est === "tenue"
        ? (esta ? "background:color-mix(in srgb, currentColor 20%, transparent);font-weight:700" : "")
        : (esta ? "font-weight:700" : ""));
    /* con fondo lleno la letra tiene que ir del color del papel, no del suyo */
    if (est === "pelado" && esta) {
      sp.style.background = e.style.color;
      sp.style.color = "var(--papel, #fdfcfa)";
    }
    medio.appendChild(sp);
    if (esta) elegida = sp;
  }
  cont.append(galon("\u2039"), medio, galon("\u203a"));
  document.getElementById("zonaRevision").appendChild(cont);
  /* centrar DESPUÉS de estar en el documento: antes no hay anchos que medir */
  if (elegida) medio.scrollLeft = elegida.offsetLeft -
    (medio.clientWidth - elegida.offsetWidth) / 2;
  return cont.id;
}, [conNumero, estilo, fade]);

/* deja la vista con los bloques en el orden pedido, y con los márgenes puestos
   a mano: mover un elemento le cambia los márgenes a sus DOS vecinos (§10) */
const armar = async (orden, opc = {}) => await pg.evaluate(([ids, o]) => {
  const z = document.getElementById("zonaRevision");
  /* SIEMPRE dentro de zonaRevision: `.fila` existe también arriba, en la zona de
     búsqueda, y un querySelector suelto se traía ese en vez de este. */
  const dentro = sel => z.querySelector("#" + sel) || z.querySelector("." + sel);
  /* la línea de métricas que mete la variante compacta se saca SIEMPRE al
     empezar: si no, la maqueta siguiente la hereda y muestra los números dos
     veces, adentro de la tarjeta y en los cuadritos */
  const vieja = z.querySelector("#metricasEnTarjeta");
  if (vieja) vieja.remove();
  const piezas = ids.map(dentro).filter(Boolean);
  /* todo lo que NO entra en la maqueta se esconde: si queda visible, aparece
     arriba de todo, porque lo demás se reordena appendeando al final */
  /* al esconder se GUARDA el display que tenía: la tira es un flex, y
     devolvérselo con "" la dejaba en block, con los galones uno abajo del otro.
     Es la misma clase de error que el de los márgenes: tocar un elemento le
     cambia cosas que no estabas mirando. */
  for (const el of [...z.children]) {
    if (piezas.includes(el)) continue;
    if (el.dataset.disp === undefined) el.dataset.disp = el.style.display;
    el.style.display = "none";
  }
  for (const el of piezas) {
    if (el.dataset.disp !== undefined) { el.style.display = el.dataset.disp; delete el.dataset.disp; }
    el.style.marginTop = "10px";
    el.style.marginBottom = "0";
    z.appendChild(el);
  }
  if (o.metricasAdentro) {
    /* SCOPEADO, como todo lo demás: la cabecera de la vista Mes también se
       llama `.metricas`, y viene antes en el documento. Es el mismo error que
       ya había pasado con `.fila`. */
    const m = dentro("metricas");
    const txt = z.querySelector("#veredicto .txt");
    const linea = document.createElement("div");
    linea.id = "metricasEnTarjeta";
    linea.style.cssText = "font-size:12px;color:var(--tenue);margin-top:4px;" +
      "font-variant-numeric:tabular-nums;";
    linea.textContent = [...m.children]
      .map(d => d.querySelector(".et").textContent + " " + d.querySelector(".va").textContent)
      .join("  ·  ");
    txt.appendChild(linea);
    m.style.display = "none";
  }
}, [orden, opc]);

const desdeArriba = async nombre => {
  /* CENTRAR LA TIRA ACÁ y no al armarla: `armar` la mueve de lugar, y mover un
     elemento le resetea el scroll. Es la tercera vez que aparece el mismo tipo
     de error en estas maquetas: tocar algo cambia cosas que no estabas mirando. */
  await pg.evaluate(() => {
    const t = document.querySelector("#tiraH > div");
    if (!t) return;
    const sel = [...t.children].find(e => e.style.fontWeight === "700");
    if (sel) t.scrollLeft = sel.offsetLeft - (t.clientWidth - sel.offsetWidth) / 2;
  });
  await pg.evaluate(() => window.scrollTo(0, 0));
  await pg.evaluate(() => {
    const z = document.getElementById("zonaRevision");
    z.scrollIntoView({ block: "start" });
    window.scrollBy(0, -8);
  });
  await foto(nombre);
};

/* Se vuelve a la jugada de las capturas de la explicación: la prueba de la
   curva de más arriba clickea una marca y deja la vista en otra jugada, y las
   maquetas tienen que compararse contra las capturas anteriores. Se toca la
   jugada en la lista, que es exacto, en vez de contar pasos. */
await pg.click(`#jugadas span[data-i="${mejor}"]`);
await pg.waitForTimeout(200);

/* D primero, que es la de hoy y todavía no se tocó nada */
await desdeArriba("dist-D-hoy");

const OCULTAR = {};
await armarTira(true);
/* A, B y C se quedan para comparar contra la elegida */
await armar(["revcab", "evalh", "curva", "revtab", "tiraH", "veredicto", "metricas", "fila"], OCULTAR);
await desdeArriba("dist-A");
await armar(["revcab", "evalh", "curva", "revtab", "veredicto", "tiraH", "metricas", "fila"], OCULTAR);
await desdeArriba("dist-B");
await armar(["revcab", "evalh", "curva", "revtab", "tiraH", "veredicto", "fila"],
            { ...OCULTAR, metricasAdentro: true });
await desdeArriba("dist-C");

/* E, la elegida: barra · tarjeta · tablero · navegación · curva */
const E = ["revcab", "evalh", "veredicto", "revtab", "tiraH", "curva", "metricas", "fila"];
await armar(E, OCULTAR);
await desdeArriba("dist-E");
/* y la E con los cuadritos adentro de la tarjeta, que es lo que falta decidir */
await armar(["revcab", "evalh", "veredicto", "revtab", "tiraH", "curva", "fila"],
            { ...OCULTAR, metricasAdentro: true });
await desdeArriba("dist-E-compacta");
/* la tira sola, grande, para mirarle las puntas. Va después de una pantalla,
   que es donde se centra. */
await pg.locator("#tiraH").screenshot({ path: path.join(SALIDA, "tira" + SUFIJO + ".png") });

/* LAS TRES FORMAS DE LA TIRA. El usuario pidió sacarle el borde a cada jugada;
   las otras dos son propuestas: la actual marcada con fondo en vez de recuadro,
   y los galones sin recuadro, que son lo más pesado de la fila. */
/* la elegida es "tenue"; lo que falta decidir es cuánto se desvanecen las
   jugadas contra los galones, así que se dibuja con tres anchos */
for (const [est, fade] of [["tenue", 0], ["tenue", 24], ["tenue", 48]]) {
  await armarTira(true, est, fade);
  await armar(E, OCULTAR);
  /* PRIMERO la pantalla, que es la que centra la tira, y DESPUÉS el recorte: al
     revés la tira salía sin centrar, mostrando el arranque de la partida. */
  const nom = "tenue-fade" + fade;
  await desdeArriba("dist-E-" + nom);
  await pg.locator("#tiraH").screenshot({ path: path.join(SALIDA, "tira-" + nom + SUFIJO + ".png") });
}
console.log("maquetas: dist-D-hoy, dist-A, dist-B, dist-C, dist-E, dist-E-compacta, tira");

console.log("listo: capturas/");
await b.close();
srv.close();
