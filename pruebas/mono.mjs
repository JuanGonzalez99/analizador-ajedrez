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
const PUERTO = 8097;

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
   Corren ADENTRO de la página cada 50 ms. Una regla rota cuenta recién si
   sigue rota 300 ms: entre dos líneas de código la pantalla puede estar a
   medio pintar y eso no es un error. Cada una devuelve un texto si está rota. */
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
  const REGLAS = {
    /* Parar (v0.178.2): sin nada corriendo, la barra no está */
    "barra sin trabajo": () => !ocupado() && !$("barra").classList.contains("oculto") && "la barra se ve sin nada corriendo",
    /* ni el estado dice que está analizando */
    "analizando sin trabajo": () => !ocupado() && /Analizando/.test(texto("estado") + texto("revEstado")) && `el estado dice "${texto("estado") || texto("revEstado")}" sin nada corriendo`,
    /* o se analiza o se ofrece analizar, nunca las dos */
    "analizar y parar a la vez": () => vis("analizarMes") && vis("detener") && "se ven a la vez Analizar el mes y Parar",
    /* el conteo no se pasa del total */
    "conteo pasado": () => { const m = texto("estado").match(/Analizando (\d+) de (\d+)/); return m && +m[1] > +m[2] && `dice "${m[0]}"`; },
    /* el botón y la lista cuentan lo mismo */
    "botón vs lista": () => {
      const m = texto("analizarMes").match(/faltan (\d+)/);
      if (!m || $("analizarMes").classList.contains("oculto") || vista() !== "inicio") return false;
      const f = [...document.querySelectorAll("#partidas div[data-i]")].filter(d => /sin analizar/.test(d.textContent)).length;
      return +m[1] !== f && `el botón dice faltan ${m[1]} y la lista tiene ${f} sin analizar`;
    },
  };
  const desde = {};
  window.__rotas = [];
  window.__marca = 0;   /* la última vez que el mono tocó algo, o que empezó/terminó un trabajo */
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
  new MutationObserver(mirarCambio).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });
  setInterval(() => {
    const ahora = performance.now();
    mirarCambio();
    for (const [nombre, regla] of Object.entries(REGLAS)) {
      let r = false;
      try { r = regla(); } catch (e) { r = false; }
      if (!r) { delete desde[nombre]; continue; }
      desde[nombre] = desde[nombre] || ahora;
      if (ahora - desde[nombre] >= 300 && !window.__rotas.some(x => x.regla === nombre)) window.__rotas.push({ regla: nombre, que: r, t: ahora });
    }
  }, 50);
  /* LA PANTALLA NO SE MUEVE SOLA (v0.175): un salto de lo que se ve sin que
     el usuario haya tocado nada en los últimos 600 ms, ni haya empezado o
     terminado un trabajo, ni cambiado de pantalla. Es el `layout-shift` del
     navegador, el mismo que mide el CLS. Solo en el inicio: en el Mes y la
     Partida los números llegan mientras se analiza y eso es lo que se espera.
     Desde 0,05 (la mitad de lo que el navegador llama "bueno" para toda una
     visita): el pie que baja 19 px mientras dice "Cargando…" da 0,007 y no es
     lo que se busca; la lista empujada de la v0.175 da bastante más. */
  try {
    new PerformanceObserver(l => {
      for (const e of l.getEntries()) {
        if (e.value < 0.05 || vista() !== "inicio") continue;
        if (performance.now() - window.__marca < 600) continue;
        const quien = (e.sources || []).map(s => s.node && (s.node.id || s.node.className || s.node.nodeName)).filter(Boolean).slice(0, 3).join(", ");
        if (!window.__rotas.some(x => x.regla === "pantalla que salta"))
          window.__rotas.push({ regla: "pantalla que salta", que: `se movió solo (${quien || "?"}), ${e.value.toFixed(3)}`, t: performance.now() });
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

async function recorrido(sem, nav) {
  const r = azar(sem);
  RED = azar(sem ^ 0x9e3779b9);
  MOTOR = motor(sem);
  const ctx = await nav.newContext({ viewport: { width: 412, height: 760 } });
  /* tres motores, como un celu de cuatro núcleos */
  await ctx.addInitScript(() => {
    Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 4 });
    try { localStorage.setItem("usuario", "Blancas"); } catch (e) { /* nada */ }
  });
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
  pg.on("pageerror", e => rotas.push({ regla: "error de la página", que: e.message }));
  pg.on("console", m => { if (m.type() === "error" && !/favicon|404/.test(m.text())) rotas.push({ regla: "error en la consola", que: m.text().slice(0, 160) }); });

  /* las reglas de la página se juntan antes de recargar (se pierden con ella) */
  const juntar = async () => {
    try { for (const x of await pg.evaluate(() => window.__rotas || [])) if (!rotas.some(y => y.regla === x.regla)) rotas.push(x); } catch (e) { /* recargando */ }
  };
  const marcar = () => pg.evaluate(() => { window.__marca = performance.now(); }).catch(() => {});

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
      if (a.recargar) { await juntar(); anotar("recargar"); await pg.reload(); continue; }
      await marcar();
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
