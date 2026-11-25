/* Rival y Siempre la mejor SE GUARDAN desde la v0.114, como el resto de las
   preferencias: hasta ahí volvían a apagarse en cada carga. */
let VER_AMBOS = false;
try { VER_AMBOS = localStorage.getItem("verRival") === "si"; } catch (e) { /* incógnito */ }
$("verRival").value = VER_AMBOS ? "si" : "no";
$("verRival").onchange = seguro("rival", () => {
  VER_AMBOS = $("verRival").value === "si";
  try { localStorage.setItem("verRival", VER_AMBOS ? "si" : "no"); } catch (e) { /* incógnito */ }
  if (R) pintarRevision();
});
let MES = null;
let MESES = [];        /* urls de todos los archivos mensuales del usuario */
let TODO = null;       /* filas flacas de todo lo analizado, o null */
let FUENTE = "mes";    /* de dónde salen las tablas: "mes" o "todo" */

/* cuántos motores ofrecer: el techo real es la memoria del teléfono, así que
   se puede subir o bajar a mano y medir con el registro */
(function () {
  const nucleos = navigator.hardwareConcurrency || 2;
  const sug = Math.max(1, Math.min(4, nucleos - 1));
  $("motores").innerHTML = [1, 2, 3, 4, 6, 8]
    .map(n => `<option value="${n}" ${n === sug ? "selected" : ""}>${n}</option>`).join("");
  window.LOG.add("·", `núcleos ${nucleos}, motores sugeridos ${sug}`);
})();

async function refrescarCache() {
  if (cache.roto) return;
  const n = await cache.contar();
  $("cacheBorrar").disabled = false;
  $("cacheBorrar").textContent = `Borrar caché (${n})`;
  return n;
}
refrescarCache().then(n => { if (n !== undefined) window.LOG.add("·", `caché con ${n} partidas`); });
$("cacheBorrar").onclick = seguro("borrar caché", async () => {
  await cache.borrarTodo();
  await refrescarCache();
  window.LOG.add("·", "caché borrada");
});

/* el enlace abre y cierra lo mismo, y lo dice (v0.126, revisor) */
function verPgn(abierto) {
  ver("zonaPegar", abierto);
  $("verPegar").textContent = abierto ? "cerrar el PGN" : "o pegar un PGN";
  $("verPegar").setAttribute("aria-expanded", abierto ? "true" : "false");
}
$("verPegar").onclick = () => verPgn($("zonaPegar").classList.contains("oculto"));

$("buscar").onclick = seguro("buscar", async () => {
  const u = $("usuario").value.trim();
  if (!u) return;
  USUARIO = u.toLowerCase();
  $("buscar").disabled = true;
  cargarLibro();   /* sin esperarlo: baja mientras llegan las partidas */
  ["zonaAnalizar", "zonaRevision", "zonaResumen", "zonaPartidas", "zonaMes"].forEach(z => ver(z, false));
  try {
    const r = await fetch(`https://api.chess.com/pub/player/${u}/games/archives`);
    if (!r.ok) throw new Error("no encontré ese usuario");
    const meses = (await r.json()).archives || [];
    if (!meses.length) throw new Error("ese usuario no tiene partidas públicas");
    MESES = meses;
    TODO = null;
    $("meses").innerHTML = meses.slice().reverse()
      .map(m => `<option value="${m}">${nombreMes(m)}</option>`).join("");
    ver("zonaMeses", true);
    try { localStorage.setItem("usuario", u); } catch (e) { /* incógnito */ }
    $("yaUsuarioNombre").textContent = u;
    entrada(false);
    await cargarMes(meses[meses.length - 1]);
  } catch (e) {
    /* con la lista de antes a la vista, el error no tira la entrada entera:
       queda el campo abierto para corregir */
    if (document.body.classList.contains("cambiando") && PARTIDAS.length)
      ["zonaMeses", "zonaPartidas", "zonaAnalizar"].forEach(z => ver(z, true));
    else { ver("zonaMeses", false); entrada(true); }
    window.mostrarError("buscar", e); estado(e.message);
  }
  $("buscar").disabled = false;
});

/* LA ENTRADA SE PLIEGA (v0.120): después de la primera búsqueda el título, el
   texto de Stockfish y el campo se van, y arriba queda "santico26 · cambiar".
   "cambiar" la despliega en el lugar. El usuario se guarda: al volver a abrir
   la app arranca plegada y con el mes cargado; sin usuario guardado, abierta
   como siempre. */
function entrada(abierta) {
  document.body.classList.toggle("entradaCerrada", !abierta);
  cambiando(false);
  ver("yaUsuario", !abierta);
}
/* "cambiar" despliega solo el campo, no el título de la primera vez (revisor,
   v0.120: el h1 reaparecía en el medio del uso y empujaba todo 98 px), y
   debajo del renglón, que se queda (v0.138). El mismo enlace pasa a decir
   "cancelar" y vuelve a plegar: el campo recupera el usuario guardado, para
   que un nombre a medio escribir no aparezca la próxima vez. */
function cambiando(si) {
  const antes = document.body.classList.contains("cambiando");
  document.body.classList.toggle("cambiando", si);
  $("cambiarUsuario").textContent = si ? "cancelar" : "cambiar";
  $("cambiarUsuario").setAttribute("aria-expanded", si ? "true" : "false");
  if (antes && !si) {
    let u = null; try { u = localStorage.getItem("usuario"); } catch (e) { /* incógnito */ }
    if (u) $("usuario").value = u;
  }
}
$("cambiarUsuario").onclick = () => {
  const abrir = !document.body.classList.contains("cambiando");
  cambiando(abrir);
  verPgn(false);
  if (abrir) { $("usuario").focus(); $("usuario").select(); }
};
/* en la compu, Escape en el campo es "cancelar" */
$("usuario").addEventListener("keydown", e => {
  if (e.key === "Escape" && document.body.classList.contains("cambiando")) { e.preventDefault(); $("cambiarUsuario").click(); }
});

$("meses").onchange = seguro("mes", () => cargarMes($("meses").value));

/* El interruptor cambia de dónde salen las tablas. La primera vez que se pide
   "todo lo analizado" hay que barrer la caché; después queda en memoria y
   volver a moverlo es instantáneo. Cambiar de modo tampoco lo rehace, porque
   cada fila se guardó con sus dos etiquetas. */
/* El barrido se hizo con una profundidad y una configuración concretas, que son
   parte de la clave de la caché. Si cambian, lo juntado ya no corresponde. */
["prof", "optMpv", "optLimpiar", "optBarrido", "optBloques"].forEach(id => {
  const el = $(id);
  const antes = el.onchange;
  el.onchange = e => {
    if (TODO) { TODO = null; window.LOG.add("·", "barrido descartado: cambió la configuración"); }
    if (FUENTE === "todo") { FUENTE = "mes"; pintarFuente(); }
    if (antes) antes.call(el, e);
  };
});

/* Arma "todo lo analizado" barriendo la caché. Vive acá afuera porque lo
   necesitan DOS caminos: elegir la fuente, y mover el dial de mate —que
   invalida lo juntado sin que el usuario haya pedido cambiar de lugar—.
   No toca el motor (§"el barrido no toca el motor"): son milisegundos.
   Devuelve false si no se pudo, y el que llama decide qué hacer con eso. */
async function juntarTodo() {
  if (!MESES.length) { estado("Primero buscá un usuario."); return false; }
  /* SI YA HABÍA ALGO CORRIENDO NO SE TOCA `ocupado` (v0.177.1, revisor): elegir
     "Todo" o mover el dial de mate a mitad del análisis del mes escondía
     "Detener", prendía los botones y hacía parpadear la barra. El barrido son
     milisegundos y no toca el motor, así que convive con el análisis. */
  const ajeno = OCUPADO;
  if (!ajeno) ocupado(true);
  const t0 = performance.now();
  let bien = true;
  try {
    const prof = MES ? MES.prof : +$("prof").value;
    TODO = await barrerCache(prof, opcionesDePantalla(),
      (m, n) => { estado(`Juntando lo analizado… mes ${m + 1} de ${n}`); progreso(m / n); });
    window.LOG.add("·", `barrido: ${TODO.partidas} partidas de ${TODO.meses} mes(es) ` +
      `en ${Math.round(performance.now() - t0)} ms` +
      (TODO.otraProf ? ` · ${TODO.otraProf} a otra profundidad` : ""));
  } catch (e) {
    window.LOG.add("!", "barrido: " + (e.message || e));
    estado("No se pudo juntar lo analizado.");
    bien = false;
  }
  /* SIN `progreso(0)` ACÁ (v0.108.1): `ocupado(false)` ya la esconde y la
     vacía, y el `progreso(0)` de después la volvía a mostrar, vacía, como una
     franja gris suelta bajo "Listo" —el mismo error que se arregló en la v26,
     vuelto por este camino—. Lo vio Juan al terminar de juntar "todo". */
  if (!ajeno) { ocupado(false); estado(""); }
  return bien;
}

/* EL NOMBRE DEL MES SALE DE LA URL del archivo de chess.com, que termina en
   ".../games/2026/10". Con mayúscula y sin "de", como en el selector. */
const NOMBRES_MES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio",
  "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
function nombreMes(url) {
  const m = /(\d{4})\/(\d{2})\/?$/.exec(url || "");
  return m ? `${NOMBRES_MES[+m[2] - 1]} ${m[1]}` : (url || "").slice(-7);
}

/* EL SELECTOR DEL MES DE LAS ESTADÍSTICAS (v0.108) y el de la entrada, #meses,
   son EL MISMO ESTADO: el valor sale siempre del de la entrada y elegir acá lo
   escribe allá. Se rearma entero cada vez porque es barato y así no hay dos
   listas que se desincronicen. "Todo lo analizado" va PRIMERO: con un usuario
   de varios años, al fondo de la lista nativa de Android se pierde. */
function pintarFuente() {
  const sel = $("fuente");
  sel.innerHTML = '<option value="todo">Todo lo analizado</option>' +
    (MESES.length ? '<optgroup label="Un mes"></optgroup>' : "");
  const grupo = sel.querySelector("optgroup");
  MESES.slice().reverse().forEach(u => {
    const o = document.createElement("option");
    o.value = u; o.textContent = nombreMes(u);
    grupo.appendChild(o);
  });
  /* Otro mes mientras se analiza lanzaría un segundo análisis encima del
     primero (v0.177.1): los meses quedan apagados; "Todo" sigue. */
  if (grupo) grupo.disabled = OCUPADO;
  sel.value = FUENTE === "todo" ? "todo" : $("meses").value;
}

$("fuente").onchange = seguro("fuente", async () => {
  const v = $("fuente").value;
  window.LOG.add("·", "fuente " + (v === "todo" ? "todo" : nombreMes(v)));
  /* OTRO MES desde acá es "mostrame las estadísticas de ese mes", o sea lo
     mismo que elegirlo arriba y tocar "Analizar el mes": lo que ya está en la
     caché sale al instante y lo que no, se analiza con la barra de siempre. */
  /* Y el mes que ya está cargado pero sin analizar (se miraba "todo" sin haber
     analizado nada) va por el mismo camino, sin volver a bajarlo. */
  if (v !== "todo" && OCUPADO) { pintarFuente(); return; }
  if (v !== "todo" && (v !== $("meses").value || !MES)) {
    FUENTE = "mes";
    $("capMes").textContent = `Cargando ${nombreMes(v).toLowerCase()}…`;
    if (v !== $("meses").value) { $("meses").value = v; await cargarMes(v); }
    if (PARTIDAS.length) await correrMes(true);
    pintarFuente();
    return;
  }
  FUENTE = v === "todo" ? "todo" : "mes";
  if (FUENTE === "todo" && !TODO && !await juntarTodo()) {
    FUENTE = "mes"; pintarFuente();
  }
  /* Se puede mirar lo acumulado sin haber analizado el mes que está cargado:
     es justamente para lo que sirve. */
  if (MES || (FUENTE === "todo" && TODO)) {
    pintarMes(MES ? MES.prof : TODO.prof);
    HAY.mes = true; irAPantalla("mes");
  }
});

let CARGA = 0;
async function cargarMes(url) {
  const yo = ++CARGA;
  PREC.clear(); ESCANEADO = false;
  /* el botón del mes se va mientras carga (v0.178.3, lo encontró el mono):
     quedaba el del mes anterior, "faltan 12" sobre una lista que decía
     "Cargando…", y tocarlo analizaba las partidas del mes que ya no se ve */
  pintarBotonMes();
  $("partidas").innerHTML = "<div>Cargando…</div>";
  $("partidasMarcador").textContent = ""; ver("partidasMarcador", false);
  ver("zonaPartidas", true);
  HAY.mes = false; mostrarVista();
  MES = null;
  const j = await (await fetch(url)).json();
  if (yo !== CARGA) return;
  PARTIDAS = (j.games || []).reverse();
  window.LOG.add("·", `mes ${url.slice(-7)}: ${PARTIDAS.length} partidas`);
  ELEGIDA = null; ELEGIDA_ID = null; ELEGIDA_META = null;
  ver("zonaAnalizar", true);
  ocupado(false);
  estado("");
  if (!PARTIDAS.length) { $("partidas").innerHTML = "<div>Ese mes no tiene partidas.</div>"; return; }
  /* Ganadas, empatadas y perdidas del mes SIN analizar nada: el resultado ya
     viene en el JSON de chess.com. Dice cuántas son en total porque cuenta
     TODAS —analizadas o no— y el marcador de la vista Mes cuenta menos (§5.1).
     Un solo renglón chico desde la v0.120 (antes eran dos). */
  $("partidasMarcador").textContent = textoRecuento(PARTIDAS.length, contarResultados(
    PARTIDAS.map(g => resultadoDeLado(ladoEnJuego(g, USUARIO), g, null))));
  ver("partidasMarcador", true);
  /* LA LISTA SALE UNA SOLA VEZ, ya con lo analizado (v0.175). Antes se pintaba
     pelada y, al terminar de mirar la caché, aparecían arriba el botón y la
     tarjeta y la empujaban, sin aviso. Mirar la caché ahora es corto
     (`precisionesRapidas`), así que el "Cargando…" dura un instante más. */
  await marcarAnalizadas(yo);
}

/* "40 partidas · 18 ganadas · 0 tablas · 22 perdidas": las palabras son las
   del marcador del Mes, que es la misma función. */
function textoRecuento(n, m) {
  const resto = textoMarcador(m);
  return cuantas(n, "partida", "partidas") + (resto ? " \u00b7 " + resto : "");
}

/* lo que se lee en lugar del número cuando nunca saliste del libro */
const SOLO_LIBRO = "solo libro";

/* tu precisión en una partida analizada: null si no jugaste vos, SOLO_LIBRO si
   no saliste del libro, si no el número */
function precisionDe(r) {
  const mias = filasDelUsuario(r);
  if (!mias.length) return null;
  const p = precisionMedia(mias);
  return p == null ? SOLO_LIBRO : p;
}

/* QUÉ ESTÁ ANALIZADO, mirando la caché y sin motor: cada partida que está con
   la configuración de ahora se rehace de sus evaluaciones guardadas, que es
   lo mismo que hace abrirla (solo la precisión, `precisionesRapidas`). La clave se lee directo y no con `cache.leer`
   para no ensuciar la cuenta de aciertos del registro. */
async function marcarAnalizadas(yo) {
  const prof = +$("prof").value, vte = variante(opcionesDePantalla());
  let libro = null;
  for (const g of PARTIDAS) {
    if (yo !== CARGA) return;
    const id = idPartida(g);
    let v = null;
    try { v = await cache._tx("readonly", st => st.get(cache.clave(id, prof, vte))); } catch (e) { /* sin caché */ }
    if (!v || !v.evs) continue;
    try {
      const prep = prepararPartida(g.pgn);
      if (v.evs.length !== prep.fens.length) continue;
      libro = libro || await cargarLibro();
      PREC.set(id, precisionDe({ cab: prep.cab, filas: precisionesRapidas(prep.fens, v.evs, libro) }));
    } catch (e) { /* una partida que no se lee queda "sin analizar" */ }
  }
  if (yo !== CARGA) return;
  ESCANEADO = true;
  pintarFilas(); pintarBotonMes(); mostrarVista();
}

/* lo que se acaba de analizar entra a la lista y al botón sin volver a mirar
   la caché */
function anotarAnalizada(g, r) {
  if (!g || !PARTIDAS.includes(g)) return;
  PREC.set(idPartida(g), precisionDe(r));
  pintarFilas(); pintarBotonMes();
}

function pintarBotonMes() {
  const faltan = PARTIDAS.filter(g => !PREC.has(idPartida(g))).length;
  $("analizarMes").textContent = `Analizar el mes \u00b7 faltan ${faltan}`;
  ver("analizarMes", ESCANEADO && faltan > 0 && !OCUPADO);
}

const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
/* "4 oct", y no lo que diga el teléfono: `toLocaleDateString` daba 9/4/2025 */
const fechaCorta = t => { const d = new Date((t || 0) * 1000); return `${d.getDate()} ${MESES_CORTOS[d.getMonth()]}`; };
const PALABRA_FIN = { gane: "Ganada", perdi: "Perdida", empate: "Tablas" };

/* La fila, escrita una vez: la usan la lista del inicio y la del Mes
   (v0.128), que antes tenía su formato propio con la fecha de EE.UU. `cab`
   es el respaldo cuando no hay JSON del mes (un PGN pegado).
   LA PRECISIÓN DICE QUÉ ES (v0.129, lavado pedido por Juan): "Ganada 89" no
   se entendía. Se dibujaron seis (89, 89%, pastilla, "prec. 89", diana,
   columna con encabezado) y el revisor eligió la palabra: el % se lee como
   probabilidad de ganar, la diana es un glifo que hay que descifrar y el
   encabezado se va con el scroll. Solo el número lleva "prec."; "sin
   analizar", "analizada" y "asistida" ya dicen qué son, y el "—" del Mes se
   fue (otro glifo mudo). */
function filaDePartida(g, i, prec, sel, cab) {
  const lado = ladoEnJuego(g, USUARIO);
  const b = g.white.username, n = g.black.username;
  const rival = lado === "w" ? n : lado === "b" ? b : `${b} vs ${n}`;
  const fin = lado ? (PALABRA_FIN[resultadoDeLado(lado, g.white.result ? g : null, cab)] || "")
    : g.white.result === "win" ? "1-0" : g.black.result === "win" ? "0-1" : "Tablas";
  return `<div data-i="${i}" tabindex="0" role="button"${sel ? ' class="sel"' : ""}>` +
    `<span class="rival">${sinHtml(rival || "?")}</span><span class="res">${fin}</span>` +
    `<span class="prec" title="tu precisión">${typeof prec === "number" ? "prec.\u00a0" + prec : prec}</span>` +
    `<span class="fecha">${g.end_time ? fechaCorta(g.end_time) : ""}</span></div>`;
}

/* LA FILA (v0.120): rival · cómo terminó · tu precisión o "sin analizar" ·
   fecha. Sin color en el resultado: el color de la app es de las jugadas. La
   marca de la izquierda es la última partida que viste. */
function pintarFilas() {
  if (!PARTIDAS.length) return;
  const vista = HAY.partida && R && R.meta ? idPartida(R.meta) : null;
  $("partidas").innerHTML = PARTIDAS.map((g, i) => {
    const id = idPartida(g);
    const p = PREC.get(id);
    const prec = !ESCANEADO && !PREC.has(id) ? ""
      : !PREC.has(id) ? "sin analizar" : p == null ? "analizada"
      : typeof p === "number" ? Math.round(p) : p;
    return filaDePartida(g, i, prec, id === vista);
  }).join("");
  $("partidas").querySelectorAll("div[data-i]").forEach(d => {
    d.onclick = seguro("abrir la partida", () => abrirPartida(PARTIDAS[+d.dataset.i]));
  });
}

/* TOCAR LA FILA ENTRA (v0.120), como en chess.com: si es la que acabás de
   ver, la abre; si no, la analiza (la caché la devuelve al toque si ya
   estaba). Mientras se analiza el mes no hace nada: el motor está ocupado, y
   el estado lo dice un momento ("esperá que termine…", corrección del
   revisor: muda era peor). */
async function abrirPartida(g) {
  if (!g) return;
  if (HAY.partida && R && R.meta && idPartida(R.meta) === idPartida(g)) { irAPantalla("partida"); return; }
  if (TRABAJANDO) {
    avisar(QUE_CORRE === "mes" ? "Esperá que termine el mes, o tocá Parar"
                               : "Esperá que termine esta, o tocá Parar");
    return;
  }
  ELEGIDA = g.pgn; ELEGIDA_ID = idPartida(g); ELEGIDA_META = g;
  await analizarElegida();
}

$("usarPgn").onclick = seguro("pgn", () => {
  const t = $("pgn").value.trim();
  if (!t) return;
  /* un PGN pegado no trae el JSON del mes, así que no hay motivo que mostrar */
  ELEGIDA = t; ELEGIDA_ID = idPartida({ pgn: t }); ELEGIDA_META = null;
  return analizarElegida();
});

function ocupado(si) {
  /* al soltar el trabajo se esconde la barra: es el único lugar por donde pasan
     todos los finales, el bueno y los de error */
  if (!si) esconderBarra();
  $("banco").disabled = si || !ELEGIDA;
  $("barrido").disabled = si || !ELEGIDA;
  $("buscar").disabled = si;
  /* Probar una jugada usa el MISMO grupo de motores que el análisis, y
     `pool.asegurar` puede cambiarle el MultiPV o el Hash a motores que están
     trabajando. Desde la v0.74 la variante se abre TOCANDO EL TABLERO y no con
     un botón, así que lo que se apaga es el toque, no un `disabled`. */
  TRABAJANDO = si;
  OCUPADO = si;
  ver("detener", si);
  const meses = $("fuente").querySelector("optgroup");
  if (meses) meses.disabled = si;
  pintarBotonMes();
  mostrarVista();
  if (si) CANCELAR = false;
}
$("detener").onclick = () => { CANCELAR = true; estado("Deteniendo\u2026"); };

async function analizarElegida() {
  if (!ELEGIDA) return;
  ocupado(true);
  anotarConfig();
  /* el mes NO se borra: sus datos siguen siendo válidos y con dos vistas
     perderlo por analizar una partida sería perder una pestaña entera */
  HAY.partida = false; mostrarVista();
  progreso(0);
  /* SE ENTRA EN SECO A LA PARTIDA (v0.120) si no sale de la caché enseguida:
     el progreso va en su cabecera. Los 300 ms son los de la barra (v0.111):
     una partida ya analizada sale antes y se pasa directo, sin una pantalla
     vacía en el medio. Si volviste al inicio mientras tanto, al terminar no
     te lleva: la fila queda marcada y se abre de un toque. */
  let fui = false;
  QUE_CORRE = "partida";
  /* mientras carga, la cabecera ya dice qué partida es (lo sabe el JSON del
     mes; con un PGN pegado no hay y el renglón va vacío) */
  const m = ELEGIDA_META, ladoM = m ? ladoEnJuego(m, USUARIO) : null;
  const rivalM = !m ? "" : ladoM === "w" ? m.black.username : ladoM === "b" ? m.white.username : "";
  if (m) {
    const eloM = ladoM === "w" ? m.black.rating : ladoM === "b" ? m.white.rating : "";
    const finM = ladoM ? PALABRA_FIN[resultadoDeLado(ladoM, m, null)]
      : m.white.result === "win" ? "1-0" : m.black.result === "win" ? "0-1" : "Tablas";
    pintarCabPartida(rivalM || `${m.white.username} vs ${m.black.username}`, eloM, finM, "");
  } else pintarCabPartida("", "", "", "");
  const quien = rivalM ? `<span class="deQuien"> vs ${sinHtml(rivalM)} \u00b7</span>` : "";
  const tEntrar = setTimeout(() => {
    if (VISTA === "inicio" && OCUPADO) { fui = true; irAPantalla("partida"); }
  }, 300);
  try {
    const prof = +$("prof").value;
    estado("Levantando el motor\u2026");
    R = await analizarPartida(ELEGIDA, prof, ELEGIDA_ID, (hechas, total, fase) => {
      estado(fase === "análisis" ? `Analizando${quien} ${hechas} de ${total}`
                                 : sinHtml(`${fase}: ${hechas} de ${total}`), true);
      progreso(hechas / total);
    }, opcionesDePantalla());
    /* `analizarPartida` no lo sabe ni tiene por qué: recibe un PGN suelto. El
       camino del mes lo pega igual pero por su cuenta (`r.meta = g`), y por eso
       el motivo salía ahí y no acá. */
    R.meta = ELEGIDA_META;
    progreso(1);
    IDX = -1;
    GIRADO = !!USUARIO && (R.cab.Black || "").toLowerCase() === USUARIO;
    pintarResumen(prof);
    pintarRevision();
    clearTimeout(tEntrar);
    HAY.partida = true;
    if (VISTA === "partida") { quieto(); mostrarVista(); }
    else if (!fui) irAPantalla("partida");
    else mostrarVista();
    estado("");
    anotarAnalizada(ELEGIDA_META, R);
    pintarFilas();
    refrescarCache();
  } catch (e) {
    estado("No se pudo: " + e.message);
    window.LOG.add("ERR", "analizar: " + (e.message || e));
  }
  clearTimeout(tEntrar);
  ocupado(false);
}

