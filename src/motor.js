
try {

window.MODULO_OK = true;
const $ = id => document.getElementById(id);
$("diag").textContent = window.VERSION + " · listo · tocá para ver el registro";

/* La profundidad y el MultiPV se sacaron del encabezado de la partida: solo
   importan cuando se comparan dos corridas, y ahí se mira el diagnóstico. */
function anotarConfig() {
  const o = opcionesDePantalla();
  $("diag").textContent = window.VERSION + ` · prof ${$("prof").value} · mpv ${o.multipv}` +
    ` · ${$("motores").value} motores · tocá para ver el registro`;
}

const ver = (id, si) => $(id).classList.toggle("oculto", !si);

/* La explicación, escrita como frases que se tocan. La que tiene algo para
   señalar en el tablero se marca; la que no, va como texto y no se toca, o
   sería un botón que no hace nada.

   `tocable` en false las deja como texto, y es lo mismo de siempre: una frase
   señala una casilla DE ESTA POSICIÓN, así que con una variante abierta el
   tablero está mostrando otra cosa y no hay dónde señalar. Solo pasa con la
   forma "las dos tarjetas" del dial, que es la única que deja la tarjeta real a
   la vista mientras se prueba. */
function pintarExplicacion(id, partes, tocable = true) {
  const el = $(id);
  el.innerHTML = partes.map((p, i) => {
    const ref = !tocable ? ""
              : p.sq ? ` data-sq="${[].concat(p.sq).join(",")}"`
              : p.uci ? ` data-uci="${p.uci}"` : "";
    /* Se marca EL CONCEPTO adentro de la frase, no la frase. Si la marca no
       aparece tal cual en el texto —un cambio de redacción que se olvidó de
       actualizarla— la frase sale entera y sin resaltar, que es feo pero no
       rompe nada; hay una prueba que las mantiene alineadas. */
    const k = p.marca ? p.txt.indexOf(p.marca) : -1;
    if (!ref || k < 0) return `<span class="fr">${p.txt}</span>`;
    const enc = RESALTA && RESALTA.i === i ? " on" : "";
    return `<span class="fr">${p.txt.slice(0, k)}<span class="senala${enc}"${ref} ` +
           `data-i="${i}">${p.marca}</span>${p.txt.slice(k + p.marca.length)}</span>`;
  }).join(" ");
  el.querySelectorAll("span.senala").forEach(sp => {
    sp.onclick = seguro("señalar", () => {
      const i = +sp.dataset.i;
      RESALTA = (RESALTA && RESALTA.i === i) ? null
              : { i, de: IDX,
                  sq: sp.dataset.sq ? sp.dataset.sq.split(",") : null,
                  uci: sp.dataset.uci || null };
      pintarRevision();
    });
  });
  return partes.length > 0;
}

/* TRES PANTALLAS (v0.110): el inicio, la Partida y el Mes. Se ve una por vez.
   TODO lo que muestra u oculta esas zonas pasa por acá: antes cada final de
   análisis las prendía y apagaba por su cuenta, y eso se desincroniza al
   primer descuido. `VISTA` es la pantalla pedida; si no tiene contenido (y no
   hay nada corriendo que la vaya a llenar) se ve el inicio. */
const HAY = { partida: false, mes: false };
let VISTA = "inicio", OCUPADO = false;
const SCROLL = { inicio: 0, mes: 0 };
/* LO ANALIZADO DEL MES QUE SE VE (v0.120): id de partida → tu precisión (o
   null si no se sabe de qué lado jugaste). Sale de la caché al cargar el mes,
   sin motor, y se completa con lo que se va analizando. `ESCANEADO` dice si ya
   se terminó de mirar la caché: antes, ni la fila dice "sin analizar" ni el
   botón dice cuántas faltan. */
const PREC = new Map();
let ESCANEADO = false;

function mostrarVista(v, opc) {
  opc = opc || {};
  if (v && v !== VISTA) {
    /* al salir se guarda dónde estabas. Volver y encontrar la lista arriba de
       todo, después de haber bajado veinte partidas, es no volver. */
    if (VISTA in SCROLL) SCROLL[VISTA] = window.scrollY;
    VISTA = v;
  }
  let actual = VISTA;
  if (actual !== "inicio" && !HAY[actual] && !OCUPADO) actual = "inicio";
  document.body.classList.toggle("enVista", actual !== "inicio");
  document.body.classList.toggle("enPartida", actual === "partida");
  /* la partida que tocaste y todavía se analiza: su pantalla, solo con la
     cabecera (el volver y el progreso) */
  const cargando = actual === "partida" && !HAY.partida;
  ver("zonaRevision", (HAY.partida || cargando) && actual === "partida");
  $("zonaRevision").classList.toggle("cargando", cargando);
  ver("zonaResumen", HAY.partida && actual === "partida");
  ver("zonaMes", actual === "mes");
  ver("zonaEstado", actual === "inicio" || OCUPADO);
  /* la tarjeta está apenas hay algo analizado del mes, aunque las
     estadísticas todavía no se hayan armado: tocarla las arma de la caché */
  ver("tarjetaMes", HAY.mes || PREC.size > 0);
  $("tarjetaMesTit").textContent = HAY.mes && FUENTE === "todo"
    ? "Estadísticas de todo lo analizado" : "Estadísticas";
  const nAnal = HAY.mes && MES && MES.resultados ? MES.resultados.length : PREC.size;
  $("tarjetaMesSub").textContent = nAnal ? cuantas(nAnal, "partida analizada", "partidas analizadas") : "";
  /* "‹ Partidas" o "‹ Estadísticas": dice a dónde te lleva, que es de donde viniste */
  const de = history.state && history.state.de;
  $("volverAQue").textContent = de === "mes" ? "Estadísticas" : "Partidas";
  /* desde la v0.123 el volver es la flecha sola: el destino lo dicen la
     etiqueta y el globito */
  $("volverDeLaPartida").ariaLabel = $("volverDeLaPartida").title = "Volver a " + $("volverAQue").textContent;
  if (opc.scroll) window.scrollTo(0, SCROLL[actual] || 0);
}

/* lo nuevo llega quieto: sin esto, la barra de la evaluación se animaba
   desde cero al aparecer la Partida */
function quieto() {
  document.body.classList.add("quieto");
  setTimeout(() => document.body.classList.remove("quieto"), 80);
}

/* Ir a otra pantalla empuja una entrada de historial, sobre la MISMA url para
   que una recarga no dé 404 en GitHub Pages. Así el gesto de volver de
   Android, la flecha del navegador y el "‹" de arriba hacen lo mismo, y un
   gesto de más desde el inicio sale de la app, que es lo correcto. */
function irAPantalla(v) {
  if (v === VISTA) return mostrarVista();
  const de = VISTA;
  try { history.pushState({ vista: v, de }, "", location.href); } catch (e) { /* nada */ }
  quieto();
  mostrarVista(v);
  /* en el acto y no en un setTimeout: con la demora se pintaba un cuadro de la
     pantalla nueva en el scroll de la vieja y después saltaba */
  window.scrollTo(0, 0);
}

function volver() {
  if (history.state && history.state.vista) history.back();
  else { quieto(); mostrarVista("inicio", { scroll: true }); enfocarLaFila(); }
}

/* AL VOLVER, EL FOCO A LA FILA QUE SE ABRIÓ (v0.153, [PC]; revisor). El "‹"
   que lo tenía ya no se ve, así que el foco caía en <body> y para abrir la
   partida siguiente había que tabear de nuevo desde arriba. Es lo mismo que
   hace la hoja de ajustes con la tuerca. Sin scroll: la pantalla queda donde
   la deja `mostrarVista`. Y no aparece ningún aro si se volvió tocando: el
   navegador lo muestra solo cuando se viene del teclado. */
function enfocarLaFila() {
  const f = document.querySelector(VISTA === "mes" ? "#mesLista > div.sel" : "#partidas > div.sel");
  if (f && f.offsetParent) f.focus({ preventScroll: true });
}

/* El navegador guarda su propia posición de scroll por entrada de historial y
   la restaura al volver, pisando la nuestra. Con "manual" el control es de la
   app. Medido: sin esto, volver devolvía a una posición vieja de otra
   navegación en vez de a donde estabas. */
try { history.scrollRestoration = "manual"; } catch (e) { /* navegador viejo */ }

window.addEventListener("popstate", ev => {
  if (IGNORAR_POP) { IGNORAR_POP = false; return; }
  /* volver de la entrada de la variante a la de su Partida: se cierra la
     variante y la pantalla no se mueve (v0.168, ver `abrirPrueba`) */
  const st = ev.state || {};
  if (PRUEBA && VISTA === "partida" && st.vista === "partida" && !st.prueba) {
    PRUEBA = null; return void pintarRevision();
  }
  quieto();
  mostrarVista((ev.state && ev.state.vista) || "inicio", { scroll: true });
  enfocarLaFila();
});
const log = (...a) => window.LOG.add("·", a.join(" "));

/* envuelve un manejador para que ningún error quede invisible */
const seguro = (donde, fn) => async (...a) => {
  try { return await fn(...a); }
  catch (e) { window.mostrarError(donde, e); estado("Falló: " + (e.message || e)); }
};
/* EL ESTADO Y EL AVISO (v0.120). `estado` es lo que está pasando; `avisar`
   pisa eso 2,5 s con algo que contesta un toque ("esperá que termine…") y
   después vuelve solo. Con `html` se puede marcar un pedazo que solo se ve en
   el inicio (`.deQuien`: qué partida corre, que en la Partida ya se sabe). */
const sinHtml = t => String(t || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
let ULTIMO_ESTADO = "", AVISO_HASTA = 0;
const estado = (t, html) => {
  ULTIMO_ESTADO = html ? t : sinHtml(t);
  if (Date.now() < AVISO_HASTA) return;
  pintarEstado(ULTIMO_ESTADO);
};
/* en la Partida el estado va en el subtítulo de la barra de título (v0.123),
   en el lugar de la apertura; en el inicio y el Mes, donde estaba */
/* y la apertura se vuelve a medir: si la cabecera se pintó con el estado a la
   vista, se midió el estado, y al vaciarse el renglón no cambia de ancho, así
   que el observador no salta y volvía el "…" (revisor, v0.130) */
const pintarEstado = h => { $("estado").innerHTML = h; $("revEstado").innerHTML = h; ajustarApertura(); };
const avisar = t => {
  AVISO_HASTA = Date.now() + 2500;
  pintarEstado(sinHtml(t));
  setTimeout(() => { if (Date.now() >= AVISO_HASTA) pintarEstado(ULTIMO_ESTADO); }, 2600);
};
let QUE_CORRE = null;
/* La barra se esconde cuando no hay nada corriendo. Antes se quedaba en cero y
   se veía como una franja gris ancha bajo los botones —pendiente abierto desde
   la v26—, que en modo simple es lo primero que se nota. Se muestra con el
   primer progreso() y se va al terminar, no al llegar a cero: un barrido pasa
   por progreso(0) al arrancar cada partida. */
/* LA BARRA ESPERA 300 ms ANTES DE APARECER (v0.111): una partida que ya estaba
   en la caché sale al toque, y mostrar la barra para eso era un parpadeo en el
   inicio justo antes de pasar a la Partida —Juan: "esa pantalla empieza a
   hacer algo y después te lleva a la otra"—. Si sigue corriendo a los 300 ms,
   se muestra. */
let BARRA_T = null;
const progreso = f => {
  $("progreso").style.width = Math.round(f * 100) + "%";
  if ($("barra").classList.contains("oculto") && !BARRA_T)
    BARRA_T = setTimeout(() => { BARRA_T = null; $("barra").classList.remove("oculto"); }, 300);
};
const esconderBarra = () => {
  clearTimeout(BARRA_T); BARRA_T = null;
  $("barra").classList.add("oculto");
  $("progreso").style.width = "0%";
};

/* ============ caché de evaluaciones (IndexedDB) ============
   Guarda las evaluaciones del motor, no los veredictos. La clave lleva la
   profundidad y la versión del motor: números de distinta profundidad no se
   comparan (§D regla 11), así que tampoco se reutilizan. */
const MOTOR_VER = "sf18lite";
const cache = {
  db: null, roto: false, aciertos: 0, fallos: 0,
  async abrir() {
    if (this.db || this.roto) return this.db;
    try {
      this.db = await new Promise((ok, no) => {
        const r = indexedDB.open("analizador", 1);
        r.onupgradeneeded = () => {
          if (!r.result.objectStoreNames.contains("evs"))
            r.result.createObjectStore("evs", { keyPath: "clave" });
        };
        r.onsuccess = () => ok(r.result);
        r.onerror = () => no(r.error || new Error("no se pudo abrir"));
        r.onblocked = () => no(new Error("base bloqueada por otra pestaña"));
      });
    } catch (e) {
      this.roto = true;
      window.LOG.add("!", "sin caché: " + (e.message || e));
    }
    return this.db;
  },
  clave: (id, prof, v) => `${id}|d${prof}|${v || "n"}|${MOTOR_VER}`,
  async _tx(modo, fn) {
    const db = await this.abrir();
    if (!db) return null;
    return new Promise((ok, no) => {
      const t = db.transaction("evs", modo);
      const p = fn(t.objectStore("evs"));
      p.onsuccess = () => ok(p.result);
      p.onerror = () => no(p.error);
    });
  },
  async leer(id, prof, variante) {
    try {
      const v = await this._tx("readonly", s => s.get(this.clave(id, prof, variante)));
      if (v && v.evs) { this.aciertos++; return v; }
    } catch (e) { window.LOG.add("!", "caché leer: " + (e.message || e)); }
    this.fallos++;
    return null;
  },
  async guardar(id, prof, variante, datos) {
    try {
      await this._tx("readwrite", s => s.put(
        Object.assign({ clave: this.clave(id, prof, variante), fecha: Date.now() }, datos)));
    } catch (e) { window.LOG.add("!", "caché guardar: " + (e.message || e)); }
  },
  /* Todas las claves de una, para no leerlas una vez por partida. Con ellas se
     puede saber si una partida está analizada a OTRA profundidad: no sirve para
     mezclar —números de distinta profundidad no se comparan (§5.3)— pero sí
     para avisar que existen y que por eso no aparecen. */
  async claves() {
    try { return await this._tx("readonly", s => s.getAllKeys()) || []; }
    catch (e) { return []; }
  },
  async contar() {
    try { return await this._tx("readonly", s => s.count()) || 0; } catch (e) { return 0; }
  },
  async borrarTodo() {
    try { await this._tx("readwrite", s => s.clear()); } catch (e) {}
  }
};

/* ============ motor ============
   Antes era un objeto único. Ahora es una clase y hay varios: las posiciones
   de una partida son independientes entre sí, así que se reparten. */
class Motor {
  constructor(i) { this.i = i; this.w = null; this.oyentes = []; }

  async arrancar(hash) {
    if (this.w) return;
    const t0 = performance.now();
    this.w = new Worker("./stockfish-18-lite-single.js");
    this.w.onerror = e => window.mostrarError("motor " + this.i, e.message || "falló el worker");
    this.w.onmessage = ev => {
      const d = ev.data;
      const s = typeof d === "string" ? d : String((d && d.data) || d);
      this.oyentes.slice().forEach(f => f(s));
    };
    await new Promise((ok, no) => {
      const t = Date.now();
      const fn = s => { if (s.startsWith("uciok")) { quitar(); clearInterval(p); ok(); } };
      const quitar = () => { const i = this.oyentes.indexOf(fn); if (i >= 0) this.oyentes.splice(i, 1); };
      this.oyentes.push(fn);
      this.w.postMessage("uci");
      const p = setInterval(() => {
        if (Date.now() - t > 120000) { quitar(); clearInterval(p); no(new Error("el motor " + this.i + " no arrancó")); }
        else this.w.postMessage("uci");
      }, 700);
    });
    /* la tabla del motor. Con la memoria limpiándose en cada posición puede no
       servir de nada: es justo lo que mide el barrido. */
    this.w.postMessage("setoption name Hash value " + (hash || 16));
    window.LOG.add("·", `motor ${this.i} arrancó en ${Math.round(performance.now() - t0)} ms`);
  }

  multiPV(n) { if (this.w) this.w.postMessage("setoption name MultiPV value " + n); }

  terminar() { if (this.w) { this.w.terminate(); this.w = null; this.oyentes = []; } }

  analizar(fen, prof, limpiar) {
    return new Promise((ok, no) => {
      const linea = {};
      const fn = s => {
        if (s.startsWith("info") && s.includes(" score ")) {
          const pv = /multipv (\d+)/.exec(s);
          const sc = /score (cp|mate) (-?\d+)/.exec(s);
          const mv = / pv ([a-h][1-8][a-h][1-8][qrbn]?)/.exec(s);
          if (sc) {
            const k = pv ? +pv[1] : 1;
            linea[k] = {
              cp: sc[1] === "cp" ? +sc[2] : null,
              mate: sc[1] === "mate" ? +sc[2] : null,
              mov: mv ? mv[1] : (linea[k] && linea[k].mov) || null
            };
          }
        } else if (s.startsWith("bestmove")) {
          quitar(); clearTimeout(corte);
          const uno = linea[1] || { cp: 0, mate: null, mov: null };
          /* `tercera` es simétrica de `segunda` y viene en null salvo con MultiPV 3,
             que hoy pide una sola cosa: el panel de alternativas (v0.89). El
             barrido de la partida sigue corriendo en 1 o 2 y no paga nada. */
          /* `bestmove (none)` es lo que contesta el motor cuando NO HAY jugada:
             mate o ahogado. Se guarda como null y no como el texto crudo, o
             "(none)" viaja como si fuera un UCI y termina dibujado como una
             flecha de la casilla "(n" a la "on". Fuera de la variante no se
             notaba —la posición de la que sale una jugada siempre tiene alguna—
             y se destapó al hacer que la flecha verde siga a la posición vista
             (v0.94), donde la partida sí puede terminar. */
          const bm = s.split(" ")[1];
          ok({ cp: uno.cp, mate: uno.mate,
               mejor: (bm && bm !== "(none)" ? bm : null) || uno.mov,
               segunda: linea[2] || null, tercera: linea[3] || null });
        }
      };
      const quitar = () => { const i = this.oyentes.indexOf(fn); if (i >= 0) this.oyentes.splice(i, 1); };
      this.oyentes.push(fn);
      const corte = setTimeout(() => { quitar(); no(new Error("el motor " + this.i + " no respondió")); }, 120000);
      if (limpiar) this.w.postMessage("ucinewgame");
      this.w.postMessage("position fen " + fen);
      this.w.postMessage("go depth " + prof);
    });
  }
}

const pool = {
  motores: [], mpv: null, hash: null,
  async asegurar(n, multipv, hash) {
    if (hash && this.hash !== null && hash !== this.hash) this.reiniciar();
    this.hash = hash || 16;
    const faltan = [];
    for (let i = this.motores.length; i < n; i++) {
      const m = new Motor(i + 1);
      this.motores.push(m);
      faltan.push(m);
    }
    if (faltan.length) await Promise.all(faltan.map(m => m.arrancar(this.hash)));
    if (multipv !== this.mpv) {
      this.motores.forEach(m => m.multiPV(multipv));
      this.mpv = multipv;
    }
    return this.motores.slice(0, n);
  },
  /* apaga todo y arranca de cero: sin esto, una corrida hereda la memoria de
     la anterior y las comparaciones de velocidad no valen nada */
  reiniciar() {
    this.motores.forEach(m => m.terminar());
    this.motores = []; this.mpv = null; this.hash = null;
  }
};

let CANCELAR = false;
/* Hay trabajo del motor en curso. Lo pone `ocupado()` y lo mira el tablero para
   no abrir una variante en el medio de un análisis. */
let TRABAJANDO = false;

/* Evalúa una lista de posiciones con el grupo de motores. */
async function evaluarPosiciones(fens, prof, onProg, opc = {}) {
  const pedidos = opc.motores || +$("motores").value || 1;
  const n = Math.max(1, Math.min(pedidos, fens.length));
  const hash = opc.hash || +$("hashMotor").value || 16;
  const motores = await pool.asegurar(n, typeof opc.multipv === "number" ? opc.multipv : 2, hash);
  const tiempos = [];
  const t0 = performance.now();
  const evs = await repartir(fens, motores, async (m, fen) => {
    if (CANCELAR) throw new Error("cancelado");
    const t = performance.now();
    const ev = await m.analizar(fen, prof, opc.limpiar);
    tiempos.push(performance.now() - t);
    return ev;
  }, onProg, opc);
  window.LOG.add("·", `${fens.length} posiciones a profundidad ${prof} en ` +
    `${Math.round(performance.now() - t0)} ms · ${n} motores · ` +
    `${opc.bloques ? "bloques" : "salteado"} · MultiPV ${opc.multipv || 2}` +
    `${opc.limpiar ? " · memoria limpia" : ""} · Hash ${hash} · ` +
    `mediana ${Math.round(mediana(tiempos))} ms por posición`);
  return evs;
}

/* El dial del usuario, leído del DOM igual que MODO(). El bloque de análisis no
   puede leerlo solo: es puro a propósito, así que lo recibe por parámetro. */
const MATE_VISTA = () => +$("mateVista").value || MATE_A_LA_VISTA;

/* ============ aperturas ============ */
let LIBRO = null;
/* SE PIDE UNA SOLA VEZ (v0.176): `buscar` lo arranca sin esperarlo, en
   paralelo con las partidas, porque desde la v0.175 la lista del inicio lo
   necesita para la precisión y bajarlo recién ahí (~1 MB) la demoraba con
   datos móviles. Quien llegue mientras baja espera la misma promesa, en vez
   de pedirlo de nuevo. */
let LIBRO_PEDIDO = null;
function cargarLibro() {
  if (LIBRO) return Promise.resolve(LIBRO);
  return LIBRO_PEDIDO = LIBRO_PEDIDO || (async () => {
    try {
      const d = await (await fetch("./aperturas.json")).json();
      LIBRO = { pos: new Set(d.posiciones), nombres: d.nombres };
    } catch (e) {
      window.LOG.add("!", "sin libro de aperturas: " + (e.message || e));
      LIBRO = { pos: new Set(), nombres: {} };
    }
    return LIBRO;
  })();
}

/* ============ análisis de una partida ============ */

/* Qué jugadas merecen una segunda mirada más profunda. Se calcula sobre el
   barrido, así que el umbral es generoso a propósito: es más barato mirar de
   más que perderse una. */
function esSospechosa(f) {
  return f.perdida >= 1 || f.cat === "omision" || f.cat === "grave";
}

/* Barrido a 13 y revisión a la profundidad elegida.
   Las cifras del resumen quedan TODAS a 13: mezclar profundidades en una misma
   mediana sería exactamente lo que prohíbe §D regla 11. Lo profundo se guarda
   aparte, por jugada, como segunda opinión sobre las sospechosas. */
async function analizarConBarrido(jugadas, fens, prof, libro, onProg, opc, tiempos) {
  const evs = await evaluarPosiciones(fens, 13, (h, t) => onProg(h, t, "barrido"), opc);
  const d = derivarFilas(jugadas, fens, evs, libro, 0, $("modo").value, tiempos, MATE_VISTA());

  const sospechosas = d.filas.map((f, i) => i).filter(i => esSospechosa(d.filas[i]));
  const necesarias = new Set();
  sospechosas.forEach(i => { necesarias.add(i); necesarias.add(i + 1); });
  const idx = [...necesarias].sort((a, b) => a - b);
  window.LOG.add("·", `barrido: ${sospechosas.length} jugadas sospechosas de ${d.filas.length}, ` +
    `${idx.length} posiciones a revisar de ${fens.length}`);

  let revisadas = 0;
  if (idx.length && prof > 13) {
    const hondas = await evaluarPosiciones(idx.map(i => fens[i]), prof,
      (h, t) => onProg(h, t, "revisión"), opc);
    const mapa = new Map(idx.map((i, k) => [i, hondas[k]]));
    for (const i of sospechosas) {
      if (!mapa.has(i) || !mapa.has(i + 1)) continue;
      const sub = derivarFilas([jugadas[i]], [fens[i], fens[i + 1]],
        [mapa.get(i), mapa.get(i + 1)], libro, i, "critico", null, MATE_VISTA(),
        jugadas[i - 1] || null).filas[0];
      d.filas[i].rev = { prof, perdida: sub.perdida, cat: sub.cat };
      revisadas++;
    }
  }
  return { filas: d.filas, apertura: d.apertura, evs, revisadas, profBase: 13 };
}

/* MultiPV híbrido: una pasada entera con MultiPV 1, y una segunda pasada con
   MultiPV 2 SOLO donde puede haber Genial, que es donde el usuario jugó la
   primera opción del motor. De la segunda pasada se toma únicamente la segunda
   mejor jugada: la evaluación y la mejor jugada quedan siempre las de la
   pasada de MultiPV 1, así que todas las posiciones se miden igual. */
async function analizarHibrido(jugadas, fens, prof, onProg, opc) {
  const evs = await evaluarPosiciones(fens, prof,
    (h, t) => onProg(h, t, "MultiPV 1"), Object.assign({}, opc, { multipv: 1 }));
  const idx = [];
  for (let i = 0; i < jugadas.length; i++) {
    const j = jugadas[i];
    if (evs[i] && evs[i].mejor === j.from + j.to + (j.promotion || "")) idx.push(i);
  }
  window.LOG.add("·", `híbrido: ${idx.length} posiciones de ${fens.length} necesitan la segunda`);
  if (idx.length) {
    const seg = await evaluarPosiciones(idx.map(i => fens[i]), prof,
      (h, t) => onProg(h, t, "segunda opinión"), Object.assign({}, opc, { multipv: 2 }));
    idx.forEach((i, k) => { evs[i].segunda = seg[k] ? seg[k].segunda : null; });
  }
  return { evs, extra: idx.length };
}

async function analizarPartida(pgn, prof, id, onProg, opc = {}) {
  const { cab, jugadas, fens, cadencia, tiempos } = prepararPartida(pgn);
  const libro = await cargarLibro();
  const vte = variante(opc);
  const prog = (h, t, fase) => { if (onProg) onProg(h, t, fase); };

  const MODO = () => $("modo").value;
  const guardado = opc.sinCache ? null : await cache.leer(id, prof, vte);
  if (guardado && guardado.evs && guardado.evs.length === fens.length) {
    window.LOG.add("·", `caché: ${id} a profundidad ${prof}${vte ? " (" + vte + ")" : ""}`);
    prog(fens.length, fens.length, "caché");
    const d = derivarFilas(jugadas, fens, guardado.evs, libro, 0, MODO(), tiempos, MATE_VISTA());
    (guardado.revs || []).forEach(r => { if (d.filas[r.i]) d.filas[r.i].rev = r.rev; });
    return { filas: d.filas, cab, apertura: d.apertura, id, deCache: true,
             jugadas, fens, cadencia, tiempos, evs: guardado.evs, revs: guardado.revs || [],
             profBase: guardado.profBase || prof, revisadas: (guardado.revs || []).length };
  }
  if (guardado) window.LOG.add("!", "caché descartada por largo distinto en " + id);

  let r;
  if (opc.barrido && prof > 13) {
    r = await analizarConBarrido(jugadas, fens, prof, libro, prog, opc, tiempos);
  } else if (opc.multipv === "hibrido") {
    const h = await analizarHibrido(jugadas, fens, prof, prog, opc);
    const d = derivarFilas(jugadas, fens, h.evs, libro, 0, $("modo").value, tiempos, MATE_VISTA());
    r = { filas: d.filas, apertura: d.apertura, evs: h.evs, revisadas: h.extra, profBase: prof };
  } else {
    const evs = await evaluarPosiciones(fens, prof, (h, t) => prog(h, t, "análisis"), opc);
    const d = derivarFilas(jugadas, fens, evs, libro, 0, $("modo").value, tiempos, MATE_VISTA());
    r = { filas: d.filas, apertura: d.apertura, evs, revisadas: 0, profBase: prof };
  }
  if (!opc.sinCache) {
    const revs = r.filas.map((f, i) => f.rev ? { i, rev: f.rev } : null).filter(Boolean);
    await cache.guardar(id, prof, vte,
      { evs: r.evs, n: r.evs.length, profBase: r.profBase, revs });
  }
  return { filas: r.filas, cab, apertura: r.apertura, id, deCache: false,
           jugadas, fens, cadencia, tiempos, evs: r.evs,
           revs: r.filas.map((f, i) => f.rev ? { i, rev: f.rev } : null).filter(Boolean),
           profBase: r.profBase, revisadas: r.revisadas };
}

/* La mejor jugada viene del motor en UCI ("b8a5"), que no se lee. Para pasarla
   a la notación de la partida hace falta la posición ANTERIOR: la fila i guarda
   el FEN de después, así que la de antes es la de la fila i-1, y para la primera
   es el arranque de la partida. Si algo no cuadra se muestra el UCI crudo antes
   que nada. */
/* Un UCI del motor pasado a notación, en la posición que se le diga. Desde la
   v0.67 hacen falta DOS posiciones —la de antes para la mejor, la de después
   para la respuesta del rival— así que la cuenta vive en un solo lado. */
function sanDeUci(fen, uci) {
  if (!fen || !uci || uci.length < 4) return null;
  try {
    const m = new Chess(fen).move({ from: uci.slice(0, 2), to: uci.slice(2, 4),
                                    promotion: uci[4] || undefined });
    return m ? m.san : null;
  } catch (e) { return null; }
}

function sanDeLaMejor(i) {
  const f = R.filas[i];
  if (!f || !f.mejor || f.mejor.length < 4) return "—";
  try {
    const j = new Chess(i > 0 ? R.filas[i - 1].fen : (R.cab.FEN || undefined));
    const m = j.move({ from: f.mejor.slice(0, 2), to: f.mejor.slice(2, 4),
                       promotion: f.mejor[4] || undefined });
    return m ? m.san : f.mejor;
  } catch (e) { return f.mejor; }
}

