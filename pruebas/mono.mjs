/* EL MONO (v0.178.3): usa la app al azar, en condiciones feas, y vigila
   reglas que tienen que cumplirse SIEMPRE.

   Por qué existe: el arnés de capturas recorre un solo camino feliz —todo
   contesta parejo, se toca, se espera a que termine, foto— y los errores de
   la v0.175 (la lista que saltaba al cargar) y de la v0.178.2 (Parar dejaba
   la barra andando) vivían ENTRE foto y foto: cuando algo tarda, o cuando se
   toca mientras otra cosa corre. Ninguna prueba puntual los hubiera visto
   antes; una regla general, sí, y después ataja toda la familia.

   Cómo se lee una falla: imprime la regla, la semilla y los últimos pasos.
   `npm run mono -- --semilla 1234` repite ese recorrido. Los tiempos del
   motor y de la red salen de la semilla, pero el reloj de verdad mete ruido:
   la repetición es casi siempre igual, no byte a byte.

   Uso:
     npm run mono                      12 recorridos, semillas al azar
     npm run mono -- --n 200           una tanda larga
     npm run mono -- --semilla 1234    repetir uno
     npm run mono -- --html viejo.html probar otra versión del archivo
                                       (así se validó contra los dos errores)
     npm run mono -- --regla "pantalla que salta"   mirar una sola regla

   Sale con código 1 si alguna regla se rompió. Imprime una línea por falla y
   una de resumen: es barato de leer.

   AGREGAR UNA REGLA: cuando aparezca un error que el mono no vio, la pregunta
   no es "qué prueba lo hubiera atajado" sino "qué regla rompió". Se suma a
   REGLAS (lo que se mira cada 50 ms) o a `alFinal`, con su porqué. */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { partidaFalsa } from "./falso.mjs";

const RAIZ = path.dirname(fileURLToPath(new URL("../index.html", import.meta.url)));
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i < 0 ? d : process.argv[i + 1]; };
const N = +arg("n", 12);
const SEMILLA = arg("semilla", null);
const HTML = path.resolve(arg("html", path.join(RAIZ, "index.html")));
const PASOS = +arg("pasos", 22);
/* --regla "nombre": mira solo esa (las otras no cortan el recorrido). Sirve
   para validar una regla contra una versión vieja que rompe varias. */
const SOLO = arg("regla", null);
const PUERTO = +arg("puerto", 8097);

/* ---------- azar con semilla (mulberry32) ---------- */
const azar = s => () => {
  s |= 0; s = s + 0x6D2B79F5 | 0;
  let t = Math.imul(s ^ s >>> 15, 1 | s);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
};

/* ---------- los datos: dos meses, doce y cinco partidas ----------
   La misma partida de prueba con distinta url: la caché va por partida, así
   que cada una se analiza de verdad. Doce, para que el mes tarde lo bastante
   como para tocar cosas en el medio y para que mirar la caché al cargar no
   sea instantáneo (ahí vivía el error de la v0.175). */
const P = partidaFalsa({ puerto: PUERTO });
const JUEGO = P.API["/api/mes/2026/10"].games[0];
const juegos = (mes, n) => Array.from({ length: n }, (_, k) => ({
  ...JUEGO, url: `https://www.chess.com/game/live/${mes}${k}`, end_time: JUEGO.end_time + k * 3600,
}));
const API = {
  "/api/archives": { archives: [`http://localhost:${PUERTO}/api/mes/2026/09`,
                                `http://localhost:${PUERTO}/api/mes/2026/10`] },
  "/api/mes/2026/09": { games: juegos(9, 5) },
  "/api/mes/2026/10": { games: juegos(10, 12) },
};

/* EL MOTOR TARDA DESPAREJO: cada respuesta entre 0 y 25 ms, y una de cada
   veinte, hasta 400. Con varios motores eso deja siempre alguno a mitad de una
   posición cuando otro termina o corta, que es justo lo que el falso de las
   capturas (parejo e instantáneo) no deja ver nunca. */
const motor = sem => P.FALSO
  .replace("let fen = null;", `let fen = null; var _s = ${sem} ^ (Math.random() * 1e9 | 0);
  var _az = function () { _s = (_s * 1103515245 + 12345) & 0x7fffffff; return _s / 0x7fffffff; };
  var demora = function () { var r = _az(); return r < 0.05 ? 50 + r * 7000 : r * 25; };`)
  .replace("if (deLaTabla || !LENTO) contestar(); else setTimeout(contestar, LENTO);",
           "setTimeout(contestar, demora());");
if (!motor(1).includes("demora());")) { console.error("mono: el motor falso cambió, no pude enchufar la demora"); process.exit(1); }

/* ---------- el servidor: la red también tarda, y desparejo ---------- */
let RED = Math.random;
const TIPOS = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".wasm": "application/wasm" };
let MOTOR = motor(1);
const srv = http.createServer((req, res) => {
  const ruta = decodeURIComponent(req.url.split("?")[0]);
  if (API[ruta]) {
    /* entre 0 y 1,5 s: los meses pueden llegar fuera de orden */
    return setTimeout(() => {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(API[ruta]));
    }, RED() * 1500);
  }
  if (ruta.endsWith("stockfish-18-lite-single.js")) {
    res.writeHead(200, { "content-type": "text/javascript" });
    return res.end(MOTOR);
  }
  const f = ruta === "/" || ruta === "/index.html" ? HTML : path.join(RAIZ, ruta);
  if (!f.startsWith(RAIZ) && f !== HTML || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": TIPOS[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => srv.listen(PUERTO, r));

/* ---------- las reglas que se miran todo el tiempo ----------
   SON PRINCIPIOS, NO CASOS (v0.180). La primera tanda (v0.178.3) nombraba
   cosas de la app —la barra, "Analizando", el botón del mes— y por eso cada
   regla atajaba un error y su primo. Ahora cada una es un principio que vale
   para cualquier pantalla, y lo específico de la app queda en dos listas
   chicas: qué palabras dicen "estoy trabajando" (EN_CURSO) y qué números se
   repiten en dos lugares (CUADRAN). Una pantalla nueva entra sola a casi
   todas; si dice "Bajando…" o repite un número, se suma a la lista.

   Los principios, y cuáles miran desde afuera (en el recorrido, más abajo):
   1. Sin trabajo, nada dice que trabaja.          (adentro)
   2. Lo que se repite, cuadra.                     (adentro, y el conteo vs el botón afuera)
   3. Nada se contradice: empezar y parar no se ofrecen juntos. (adentro)
   4. Sin trabajo, nada se mueve solo.              (adentro, todas las pantallas)
   5. Nada se sale del ancho.                       (adentro; el ancho va al azar entre 386 y 412)
   6. Todo lo que se toca responde.                 (afuera)
   7. Ir y volver no cambia nada.                   (afuera)
   8. Recargar no pierde nada.                      (afuera)
   9. Todo trabajo termina, y Parar para.           (afuera)
   10. Ningún error en la consola.                  (afuera)

   Corren ADENTRO de la página cada 50 ms. Una regla rota cuenta recién si
   sigue rota un rato (300 ms, o lo que diga): entre dos líneas de código la
   pantalla puede estar a medio pintar y eso no es un error. */
const VIGIA = () => {
  /* la app es un módulo: su estado no se ve desde afuera, así que todo se lee
     de la pantalla, que es además lo que importa */
  const $ = id => document.getElementById(id);
  const vis = id => { const e = $(id); return !!e && !e.classList.contains("oculto") && e.offsetParent !== null; };
  const texto = id => ($(id) || {}).textContent || "";
  /* hay algo corriendo ⇔ está Parar (lo prende y apaga `ocupado()`) */
  const ocupado = () => !$("detener").classList.contains("oculto");
  const vista = () => document.body.classList.contains("enPartida") ? "partida"
    : document.body.classList.contains("enVista") ? "mes" : "inicio";
  window.__vista = vista;
  /* el texto que se VE (innerText ignora lo oculto), de la pantalla entera */
  const visible = () => document.body.innerText;

  /* LAS DOS LISTAS DE LA APP. EN_CURSO: las palabras con las que la app dice
     que está haciendo algo. "Cargando…" no va con Parar (cargar un mes no es
     `ocupado`), así que tiene su propio plazo: la red falsa tarda hasta 1,5 s. */
  const EN_CURSO = [
    { re: /Analizando|Levantando el motor|Deteniendo|Juntando/, plazo: 300 },
    { re: /Cargando…|Pensando…/, plazo: 4000 },
  ];
  /* CUADRAN: dos lugares que dicen el mismo número. Cada uno devuelve
     [lo que dice uno, lo que dice el otro, de qué se trata] o null si hoy no
     se ve. */
  const filas = () => [...document.querySelectorAll("#partidas div[data-i]")];
  const CUADRAN = [
    /* el botón "faltan N" y las filas "sin analizar" (v0.178.3) */
    () => {
      const m = texto("analizarMes").match(/faltan (\d+)/);
      if (!m || !vis("analizarMes") || vista() !== "inicio") return null;
      return [+m[1], filas().filter(d => /sin analizar/.test(d.textContent)).length, "faltan del botón y filas sin analizar"];
    },
    /* el recuento "40 partidas · …" y las filas de la lista */
    () => {
      const m = texto("partidasMarcador").match(/(\d+) partidas?/);
      if (!m || vista() !== "inicio" || !filas().length) return null;
      return [+m[1], filas().length, "partidas del recuento y filas de la lista"];
    },
    /* ganadas + tablas + perdidas = partidas, en el mismo renglón */
    () => {
      const t = texto("partidasMarcador");
      const n = (t.match(/(\d+) partidas?/) || [])[1];
      const g = (t.match(/(\d+) ganadas?/) || [])[1], e = (t.match(/(\d+) tablas?/) || [])[1], p = (t.match(/(\d+) perdidas?/) || [])[1];
      if (n == null || g == null || p == null || vista() !== "inicio") return null;
      return [+n, +g + +(e || 0) + +p, "partidas del recuento y ganadas + tablas + perdidas"];
    },
  ];

  const REGLAS = {
    /* 1. SIN TRABAJO, NADA DICE QUE TRABAJA. Atajó el de Parar (v0.178.2): la
       barra y "Analizando 1 de 40" seguían con todo quieto. Con el plazo largo
       ataja además una carga que se cuelga en "Cargando…". */
    "dice que trabaja sin trabajo": () => {
      if (ocupado()) return false;
      if (!$("barra").classList.contains("oculto")) return "la barra de progreso se ve sin nada corriendo";
      const t = visible();
      for (const { re, plazo } of EN_CURSO) { const m = t.match(re); if (m) return { que: `dice "${m[0]}" sin nada corriendo`, plazo, clave: re.source }; }
      return false;
    },
    /* 2. LO QUE SE REPITE, CUADRA, y un "x de y" nunca se pasa */
    "no cuadra": () => {
      for (const f of CUADRAN) { const r = f(); if (r && r[0] !== r[1]) return { que: `${r[2]}: ${r[0]} contra ${r[1]}`, clave: r[2] }; }
      const m = visible().match(/(\d+) de (\d+)/g) || [];
      for (const x of m) { const [, a, b] = x.match(/(\d+) de (\d+)/); if (+a > +b) return { que: `dice "${x}"`, clave: "x de y" }; }
      return false;
    },
    /* 3. NADA SE CONTRADICE: se ofrece empezar o parar, no las dos */
    "se contradice": () => ocupado() && ["analizarMes", "seguirMes"].some(vis) && "ofrece empezar y Parar a la vez",
    /* 5. NADA SE SALE DEL ANCHO: sin scroll de costado */
    "se sale del ancho": () => {
      const d = document.scrollingElement;
      return d.scrollWidth > innerWidth + 1 && { que: `la página mide ${d.scrollWidth} de ancho en ${innerWidth}`, plazo: 500 };
    },
  };
  const desde = {};
  window.__rotas = [];
  window.__marca = 0;   /* la última vez que el mono tocó algo, o que empezó/terminó un trabajo */
  window.__mut = 0;     /* cuántos cambios hubo en la pantalla: para "todo lo que se toca responde" */
  window.__trabajo = 0; /* cuántas veces empezó un trabajo: "ir y volver" solo compara si no corrió nada */
  let ocupadoAntes = null, vistaAntes = null, listaAntes = null;
  /* también cuenta como un cambio que se espera que la lista APAREZCA (de
     "Cargando…" a las filas): lo de abajo se corre porque llegó, y eso está
     bien. Lo que no está bien es que algo la corra DESPUÉS. Se mira con un
     MutationObserver y no en la vuelta de 50 ms: el aviso del salto llega
     antes que la vuelta, y la lista recién llegada contaba como salto. */
  const mirarCambio = () => {
    const o = ocupado(), v = vista(), l = !!document.querySelector("#partidas div[data-i]");
    if (o !== ocupadoAntes || v !== vistaAntes || l !== listaAntes) {
      window.__marca = performance.now(); ocupadoAntes = o; vistaAntes = v; listaAntes = l;
    }
  };
  /* un trabajo empezó cada vez que Parar dejó de estar oculto. Se cuenta con
     el valor viejo de cada cambio y no mirando cómo quedó: una partida que
     sale de la caché prende y apaga Parar en el mismo instante, y mirando el
     estado no se veía (y "ir y volver" acusaba una precisión que sí llegó) */
  new MutationObserver(ms => {
    window.__mut += ms.length;
    for (const m of ms) if (m.target.id === "detener" && m.attributeName === "class" && /oculto/.test(m.oldValue || "")) window.__trabajo++;
    mirarCambio();
  }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeOldValue: true });
  setInterval(() => {
    const ahora = performance.now();
    mirarCambio();
    for (const [nombre, regla] of Object.entries(REGLAS)) {
      let r = false;
      try { r = regla(); } catch (e) { r = false; }
      if (!r) { delete desde[nombre]; continue; }
      if (typeof r === "string") r = { que: r };
      const k = nombre + "|" + (r.clave || "");
      if (desde[nombre] && desde[nombre].k !== k) delete desde[nombre];
      desde[nombre] = desde[nombre] || { t: ahora, k };
      if (ahora - desde[nombre].t >= (r.plazo || 300) && !window.__rotas.some(x => x.regla === nombre)) window.__rotas.push({ regla: nombre, que: r.que, t: ahora });
    }
  }, 50);
  /* 4. SIN TRABAJO, NADA SE MUEVE SOLO (v0.175): un salto de lo que se ve
     sin un toque en los últimos 600 ms, ni un trabajo que empiece o termine,
     ni un cambio de pantalla. Es el `layout-shift` del navegador, el mismo
     que mide el CLS. En todas las pantallas, pero solo sin trabajo: mientras
     se analiza, en el Mes y la Partida los números llegan y eso se espera.
     Desde 0,05 (la mitad de lo que el navegador llama "bueno" para toda una
     visita): el pie que baja 19 px mientras dice "Cargando…" da 0,007 y no es
     lo que se busca; la lista empujada de la v0.175 da 0,078. */
  try {
    new PerformanceObserver(l => {
      for (const e of l.getEntries()) {
        if (e.value < 0.05 || ocupado()) continue;
        if (performance.now() - window.__marca < 600) continue;
        const quien = (e.sources || []).map(s => s.node && (s.node.id || s.node.className || s.node.nodeName)).filter(Boolean).slice(0, 3).join(", ");
        if (!window.__rotas.some(x => x.regla === "se mueve solo"))
          window.__rotas.push({ regla: "se mueve solo", que: `en ${vista()} se movió (${quien || "?"}), ${e.value.toFixed(3)}`, t: performance.now() });
      }
    }).observe({ type: "layout-shift", buffered: false });
  } catch (e) { /* sin layout-shift */ }
};

/* ---------- las acciones ---------- */
const ACCIONES = [
  { nombre: "analizar el mes", peso: 4, sel: "#analizarMes" },
  { nombre: "parar", peso: 4, sel: "#detener" },
  { nombre: "seguir el mes", peso: 1, sel: "#seguirMes" },
  { nombre: "tocar una fila", peso: 3, sel: "#partidas div[data-i]", varios: true },
  { nombre: "volver del Mes", peso: 2, sel: "#volverDelMes" },
  { nombre: "volver de la Partida", peso: 2, sel: "#volverDeLaPartida" },
  { nombre: "estadísticas", peso: 1, sel: "#tarjetaMes" },
  { nombre: "cambiar de mes", peso: 1, sel: "#meses", mes: true },
  { nombre: "recargar", peso: 1, recargar: true },
  { nombre: "esperar", peso: 2, esperar: true },
];

/* la primera diferencia entre dos firmas, en una línea */
function resumir(a, b) {
  const A = JSON.parse(a), B = JSON.parse(b);
  for (const k of Object.keys(A)) {
    const x = JSON.stringify(A[k]), y = JSON.stringify(B[k]);
    if (x === y) continue;
    if (Array.isArray(A[k])) {
      const i = A[k].findIndex((v, j) => v !== B[k][j]);
      return `${k}[${i + 1}]: "${A[k][i]}" → "${B[k][i]}"`;
    }
    return `${k}: "${A[k]}" → "${B[k]}"`;
  }
  return "?";
}

async function recorrido(sem, nav) {
  const r = azar(sem);
  RED = azar(sem ^ 0x9e3779b9);
  MOTOR = motor(sem);
  /* el ancho, al azar entre el del celu de Juan (386) y el de las capturas (412) */
  const ancho = 386 + Math.floor(r() * 27);
  const ctx = await nav.newContext({ viewport: { width: ancho, height: 760 } });
  /* tres motores, como un celu de cuatro núcleos */
  /* el usuario es el que juega con blancas en la partida de prueba: con otro,
     las filas dicen "X vs Y · analizada" y la precisión no se ve nunca */
  await ctx.addInitScript(u => {
    Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 4 });
    try { localStorage.setItem("usuario", u); } catch (e) { /* nada */ }
  }, P.cabPgn("White", "Blancas"));
  await ctx.addInitScript(`window.addEventListener("load", ${VIGIA.toString()});`);
  /* chess.com: la lista de meses, también con demora */
  await ctx.route("https://api.chess.com/**", ro => setTimeout(() =>
    ro.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(API["/api/archives"]) }), RED() * 1500));
  const pg = await ctx.newPage();
  const pasos = [];
  const t0 = Date.now();
  const anotar = t => pasos.push(`${((Date.now() - t0) / 1000).toFixed(1)}s ${t}`);
  const rotas = [];
  const push0 = rotas.push.bind(rotas);
  rotas.push = x => (SOLO && x.regla !== SOLO) ? rotas.length : push0(x);
  /* 10. NINGÚN ERROR EN LA CONSOLA */
  pg.on("pageerror", e => rotas.push({ regla: "error de la página", que: e.message }));
  pg.on("console", m => { if (m.type() === "error" && !/favicon|404/.test(m.text())) rotas.push({ regla: "error en la consola", que: m.text().slice(0, 160) }); });

  /* las reglas de la página se juntan antes de recargar (se pierden con ella) */
  const juntar = async () => {
    try { for (const x of await pg.evaluate(() => window.__rotas || [])) if (!rotas.some(y => y.regla === x.regla)) rotas.push(x); } catch (e) { /* recargando */ }
  };
  const marcar = () => pg.evaluate(() => { window.__marca = performance.now(); }).catch(() => {});
  const leer = (f, x) => pg.evaluate(f, x).catch(() => null);
  /* LA FIRMA DEL INICIO: lo que dice la lista, el recuento, el botón y el mes.
     Es lo que "ir y volver" y "recargar" comparan. `sinPrec` borra las
     precisiones, para cuando en el medio corrió un análisis (que sí las cambia). */
  const firma = sinPrec => leer(sp => {
    const $ = id => document.getElementById(id);
    if (document.body.classList.contains("enVista")) return null;
    const filas = [...document.querySelectorAll("#partidas div[data-i]")].map(d => d.innerText.replace(/\s+/g, " ").trim());
    if (!filas.length) return null;
    const limpiar = t => sp ? t.replace(/sin analizar|analizada|prec\. \d+|solo libro/g, "·") : t;
    const boton = $("analizarMes").classList.contains("oculto") ? "" : $("analizarMes").textContent;
    return JSON.stringify({ filas: filas.map(limpiar), recuento: $("partidasMarcador").textContent,
                            boton: sp ? "" : boton, mes: $("meses").value });
  }, sinPrec);
  const quieto = () => leer(() => document.getElementById("detener").classList.contains("oculto"));
  const ultimoMes = API["/api/archives"].archives.at(-1);
  /* lo de "ir y volver": la firma al salir del inicio, y cuántos trabajos iban */
  let alSalir = null;

  await pg.goto(`http://localhost:${PUERTO}/index.html`);
  anotar("abrir (con usuario guardado)");
  /* LA MITAD ARRANCA CON LA CACHÉ LLENA: se analiza el mes entero y se
     recarga. Con la caché vacía no hay nada que mirar al cargar, y el error de
     la v0.175 (la lista empujada al terminar de mirarla) no podía pasar. */
  if (r() < 0.5) {
    try {
      await pg.click("#analizarMes", { timeout: 8000 });
      await pg.waitForFunction(() => document.getElementById("detener").classList.contains("oculto"), null, { timeout: 60000 });
      await juntar();
      anotar("analizar el mes entero"); await pg.reload(); anotar("recargar con la caché llena");
    } catch (e) { anotar("(no se pudo llenar la caché)"); }
  }
  /* lo que el botón prometía al tocar "analizar el mes": el conteo tiene que decir lo mismo */
  let prometio = null;

  for (let k = 0; k < PASOS && !rotas.length; k++) {
    await pg.waitForTimeout(r() * 1500);
    await juntar();
    if (rotas.length) break;
    /* elegir una acción posible */
    const posibles = [];
    for (const a of ACCIONES) {
      if (a.esperar || a.recargar) { posibles.push(a); continue; }
      const ok = await pg.locator(a.sel).first().isVisible().catch(() => false);
      if (ok && !(a.mes && !(await pg.locator("#meses").isEnabled()))) posibles.push(a);
    }
    let tot = posibles.reduce((s, a) => s + a.peso, 0), x = r() * tot, a = posibles[0];
    for (const p of posibles) { x -= p.peso; if (x <= 0) { a = p; break; } }
    try {
      if (a.esperar) { const ms = 300 + r() * 4000; anotar(`esperar ${Math.round(ms)} ms`); await pg.waitForTimeout(ms); continue; }
      if (a.recargar) {
        await juntar();
        /* 8. RECARGAR NO PIERDE NADA: con todo quieto, en el inicio y en el
           último mes (que es el que abre la app), lo que se ve después de
           recargar es lo mismo que antes. Con las precisiones incluidas. */
        const antes = (await quieto()) ? await firma(false) : null;
        anotar("recargar"); await pg.reload(); alSalir = null;
        if (antes && JSON.parse(antes).mes === ultimoMes) {
          const ok = await pg.waitForFunction(() => document.querySelector("#partidas div[data-i]") && !/Cargando/.test(document.body.innerText), null, { timeout: 8000 }).then(() => true).catch(() => false);
          await pg.waitForTimeout(1500);
          const despues = ok && (await quieto()) ? await firma(false) : null;
          if (despues && despues !== antes) rotas.push({ regla: "recargar pierde", que: `antes ${resumir(antes, despues)}` });
        }
        continue;
      }
      await marcar();
      const mut0 = await leer(() => window.__mut);
      const vista0 = await leer(() => window.__vista());
      /* 7. IR Y VOLVER: la firma al irse del inicio con todo quieto */
      if (vista0 === "inicio" && !a.mes && (await quieto()))
        alSalir = { firma: await firma(false), libre: await firma(true), trabajo: await leer(() => window.__trabajo) };
      if (a.mes) {
        const ops = await pg.locator("#meses option").evaluateAll(os => os.map(o => o.value));
        const v = ops[Math.floor(r() * ops.length)];
        anotar(`cambiar de mes a ${v.slice(-7)}`);
        await pg.selectOption("#meses", v);
      } else if (a.varios) {
        const n = await pg.locator(a.sel).count();
        const i = Math.floor(r() * n);
        anotar(`tocar la fila ${i + 1}`);
        await pg.locator(a.sel).nth(i).click({ timeout: 2000 });
      } else {
        if (a.sel === "#analizarMes") {
          const m = (await pg.textContent("#analizarMes")).match(/faltan (\d+)/);
          prometio = m ? +m[1] : null;
        }
        anotar(a.nombre);
        await pg.click(a.sel, { timeout: 2000 });
      }
      await marcar();
      /* 6. TODO LO QUE SE TOCA RESPONDE: algo cambia en la pantalla en 1,5 s */
      const respondio = await pg.waitForFunction(m => window.__mut !== m, mut0, { timeout: 1500 }).then(() => true).catch(() => false);
      if (!respondio && mut0 != null) rotas.push({ regla: "no responde", que: `tocar "${a.nombre}" no cambió nada en 1,5 s` });
      /* 7. IR Y VOLVER NO CAMBIA NADA: de vuelta en el inicio, la misma firma.
         Si en el medio corrió un trabajo, sin las precisiones (eso sí cambia). */
      if (alSalir && vista0 !== "inicio" && (await leer(() => window.__vista())) === "inicio") {
        await pg.waitForTimeout(600);
        const corrio = (await leer(() => window.__trabajo)) !== alSalir.trabajo;
        const ahora = await firma(corrio);
        const antes = corrio ? alSalir.libre : alSalir.firma;
        if (ahora && antes && ahora !== antes && (await quieto()))
          rotas.push({ regla: "ir y volver cambia", que: resumir(antes, ahora) + (process.env.DEPURAR ? ` [trabajos ${alSalir.trabajo}→${await leer(() => window.__trabajo)}]` : "") });
        alSalir = null;
      }
      /* el conteo cierra con el botón (v0.178.2): se mira al primer "Analizando" */
      if (prometio != null) {
        const m = await pg.waitForFunction(() => (document.getElementById("estado").textContent.match(/Analizando \d+ de (\d+)/) || [])[1], null, { timeout: 3000 })
          .then(h => h.jsonValue()).catch(() => null);
        if (m != null && +m !== prometio && prometio <= 50) rotas.push({ regla: "conteo vs botón", que: `el botón decía faltan ${prometio} y el conteo dice "de ${m}"` });
        prometio = null;
      }
    } catch (e) {
      /* se fue de la pantalla entre que se eligió y se tocó: no es un error */
      anotar(`(${a.nombre} no se pudo tocar)`);
    }
  }

  /* AL FINAL: Parar, y en 15 s no queda nada corriendo ni a medio decir */
  if (!rotas.length) {
    await juntar();
    if (await pg.locator("#detener").isVisible().catch(() => false)) { anotar("parar (cierre)"); await pg.click("#detener").catch(() => {}); }
    const quieto = await pg.waitForFunction(() => document.getElementById("detener").classList.contains("oculto"), null, { timeout: 15000 }).then(() => true).catch(() => false);
    /* 9. TODO TRABAJO TERMINA, Y PARAR PARA */
    if (!quieto) rotas.push({ regla: "no para", que: "15 s después de Parar sigue ocupado" });
    await pg.waitForTimeout(1200);   /* lo que llegue tarde, como en el error de Parar */
    await juntar();
  }
  await ctx.close();
  return { rotas, pasos };
}

const nav = await chromium.launch(fs.existsSync("/opt/pw-browsers/chromium") ? { executablePath: "/opt/pw-browsers/chromium" } : {});
const semillas = SEMILLA != null ? [+SEMILLA] : Array.from({ length: N }, () => Math.floor(Math.random() * 1e6));
let malas = 0;
const t0 = Date.now();
for (const s of semillas) {
  const { rotas, pasos } = await recorrido(s, nav);
  if (!rotas.length) continue;
  malas++;
  for (const x of rotas) console.log(`ROTA "${x.regla}" (semilla ${s}): ${x.que}`);
  console.log("  últimos pasos: " + pasos.slice(-8).join(" · "));
}
await nav.close(); srv.close();
console.log(`mono: ${semillas.length} recorridos en ${Math.round((Date.now() - t0) / 1000)} s, ` +
            (malas ? `${malas} con reglas rotas` : "ninguna regla rota"));
process.exit(malas ? 1 : 0);
