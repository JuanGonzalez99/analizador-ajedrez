/* ============ el mes ============ */
$("analizarMes").onclick = seguro("analizar el mes", () => correrMes(true));
$("seguirMes").onclick = seguro("seguir el mes", () => correrMes(false));

/* `soloCache` arma las estadísticas con lo que ya está analizado, sin motor:
   es lo que hace la tarjeta "Estadísticas" cuando el mes está analizado de
   otra vez y todavía no se juntó (v0.120). */
async function correrMes(desdeCero, soloCache) {
  QUE_CORRE = "mes";
  if (!PARTIDAS.length) return;
  if (!USUARIO) { estado("Para el mes hace falta buscar por usuario."); return; }
  if (desdeCero || !MES) MES = { hechas: 0, resultados: [], prof: +$("prof").value };
  anotarConfig();
  const prof = MES.prof;
  /* Van a aparecer partidas nuevas, así que lo juntado queda corto. Se descarta
     y se vuelve a mirar el mes; si querés lo acumulado, el interruptor lo
     rehace con las nuevas adentro. */
  if (TODO) {
    TODO = null;
    FUENTE = "mes"; pintarFuente();
    window.LOG.add("·", "barrido descartado: se van a analizar partidas nuevas");
  }
  ocupado(true);
  HAY.partida = false; mostrarVista();
  ver("seguirMes", false);
  /* se pasa al Mes con el primer resultado, no antes: una pantalla sin
     números no dice nada. Una sola vez: si volviste al inicio a mitad de
     camino, no te vuelve a llevar. */
  let fui = VISTA === "mes";

  const desde = MES.hechas;
  const hasta = soloCache ? PARTIDAS.length : Math.min(PARTIDAS.length, desde + TOPE_MES);
  const t0 = performance.now();
  window.LOG.add("·", `mes: partidas ${desde + 1} a ${hasta} a profundidad ${prof}`);
  /* EL CONTEO ES DE LAS QUE FALTAN, no de las del mes (v0.178.2): con el botón
     diciendo "faltan 8", "Analizando 1 de 40" no cerraba (Juan). Las que ya
     están en la caché pasan al toque y no cuentan ni mueven la barra; si no
     falta ninguna (las estadísticas desde la caché), se cuenta todo. */
  const yaEsta = g => PREC.has(idPartida(g));
  const pend = PARTIDAS.slice(desde, hasta).filter(g => !yaEsta(g)).length;
  const deTodas = soloCache || !pend;
  const total = deTodas ? hasta - desde : pend;
  let n = 0;

  try {
    for (let i = desde; i < hasta; i++) {
      if (CANCELAR) break;
      const g = PARTIDAS[i];
      if (soloCache && !yaEsta(g)) { MES.hechas = i + 1; continue; }
      const cuenta = deTodas || !yaEsta(g);
      const base = n;
      if (cuenta) { n++; estado(`Analizando ${n} de ${total}`); }
      const tp = performance.now();
      let r = null;
      try {
        r = await analizarPartida(g.pgn, prof, idPartida(g), (hechas, t) => {
          if (cuenta) progreso((base + hechas / t) / total);
        }, opcionesDePantalla());
      } catch (e) {
        if (CANCELAR) break;
        window.LOG.add("!", `partida ${i + 1} salteada: ${e.message || e}`);
      }
      if (r) {
        r.meta = g;
        MES.resultados.push(r);
        anotarAnalizada(g, r);
        window.LOG.add("·", `partida ${i + 1}: ${r.filas.length} jugadas en ` +
          `${Math.round(performance.now() - tp)} ms${r.deCache ? " (de caché)" : ""}`);
      }
      MES.hechas = i + 1;
      progreso(n / total);
      pintarMes(prof);
      HAY.mes = true;
      if (!fui) { fui = true; irAPantalla("mes"); } else mostrarVista();
    }
    const seg = Math.round((performance.now() - t0) / 1000);
    window.LOG.add("·", `mes: ${MES.resultados.length} partidas en ${seg} s · ` +
      `caché ${cache.aciertos} aciertos, ${cache.fallos} fallos`);
    /* el estado del inicio es solo mientras corre: lo que falta lo dice el botón */
    estado("");
    pintarMes(prof);
    HAY.mes = true; mostrarVista();
    if (MES.hechas < PARTIDAS.length) {
      const quedan = PARTIDAS.length - MES.hechas;
      $("seguirMes").textContent = `Seguir con ${Math.min(TOPE_MES, quedan)} más (quedan ${quedan})`;
      ver("seguirMes", true);
    }
    refrescarCache();
  } catch (e) {
    estado("No se pudo: " + e.message);
    window.LOG.add("ERR", "mes: " + (e.message || e));
  }
  ocupado(false);
}

/* ============ banco de pruebas ============
   Corre la MISMA partida con cada configuración, reiniciando los motores entre
   una y otra. Sin ese reinicio la corrida hereda la memoria de la anterior y la
   comparación no vale: es el confundidor que ya nos costó una medición. */
/* Todas con memoria limpia: sin eso las corridas no son repetibles y las
   diferencias entre filas no se pueden leer. Medido el 04/09: dos corridas
   limpias de la misma configuración dieron cifras idénticas, y dos sucias
   dieron 87.2/0.39 contra 88.1/0.35. */
const CONFIGS = [
  { nombre: "MultiPV 2 (actual)", opc: { limpiar: true } },
  { nombre: "MultiPV 2, otra vez", opc: { limpiar: true } },
  { nombre: "MultiPV 1", opc: { limpiar: true, multipv: 1 } },
  { nombre: "MultiPV híbrido", opc: { limpiar: true, multipv: "hibrido" } },
  { nombre: "barrido 13 + revisión", opc: { limpiar: true, barrido: true } },
  { nombre: "MultiPV 2 sin limpiar", opc: {} }
];

/* Barrido de motores y memoria. Con la memoria limpia cada posición se analiza
   sola, así que cambiar la CANTIDAD de motores no debería mover ni un decimal:
   las filas con el mismo Hash tienen que dar idénticas, y si no, hay un
   problema. Cambiar el Hash sí puede mover algo, porque altera la búsqueda. */
const BARRIDO = [];
for (const hash of [1, 16])
  for (const motores of [2, 4, 6, 8])
    BARRIDO.push({ nombre: `Hash ${hash} · ${motores} motores`,
                   opc: { limpiar: true, hash, motores } });

$("banco").onclick = seguro("banco", () => correrBanco(CONFIGS, "configuraciones"));
$("barrido").onclick = seguro("barrido", () => correrBanco(BARRIDO, "motores y memoria"));

async function correrBanco(lista, queCompara) {
  if (!ELEGIDA) { estado("Elegí una partida primero."); return; }
  const prof = +$("prof").value;
  if (prof <= 13) { estado("Para comparar poné profundidad 16 o 18."); return; }
  ocupado(true);
  HAY.partida = false; HAY.mes = false; mostrarVista("inicio");
  const filas = [];
  try {
    for (const c of lista) {
      if (CANCELAR) break;
      pool.reiniciar();
      window.LOG.add("·", `banco: arranca "${c.nombre}"`);
      const t0 = performance.now();
      const r = await analizarPartida(ELEGIDA, prof, ELEGIDA_ID,
        (h, t, fase) => {
          estado(`${c.nombre} \u00b7 ${fase} ${h} de ${t}`);
          progreso(h / t);
        },
        Object.assign({ sinCache: true }, c.opc));
      const ms = performance.now() - t0;
      const mias = r.filas;
      filas.push({
        nombre: c.nombre, ms,
        prof: r.profBase,
        precision: precisionMedia(mias),
        mediana: medianaFuera(mias),
        graves: mias.filter(f => f.cat === "grave" || f.cat === "omision").length,
        geniales: mias.filter(f => f.cat === "genial").length,
        revisadas: r.revisadas || 0
      });
      window.LOG.add("·", `banco: "${c.nombre}" ${Math.round(ms)} ms`);
      pintarBanco(filas, prof, queCompara);
      ver("zonaBanco", true);
    }
    estado(CANCELAR ? "Comparación detenida." : "Comparación lista.");
  } catch (e) {
    estado("No se pudo: " + e.message);
    window.LOG.add("ERR", "banco: " + (e.message || e));
  }
  pool.reiniciar();
  ocupado(false);
}

function pintarBanco(filas, prof, queCompara) {
  const base = filas[0];
  const esMotores = queCompara === "motores y memoria";
  $("tituloBanco").textContent = esMotores
    ? "Barrido de motores y memoria" : "Comparación de configuraciones";
  $("capBanco").textContent = esMotores
    ? "Compara motores y memoria sobre la misma partida, no partidas entre sí. " +
      `Profundidad ${prof}, modo ${nombreModo()}, todas con memoria limpia. ` +
      "Las cuatro filas de un mismo Hash tienen que dar precisión, mediana y graves " +
      "IDÉNTICAS: la cantidad de motores no puede cambiar un veredicto. Entre Hash " +
      "distintos sí puede cambiar algo, porque el Hash altera cómo busca el motor."
    : "Compara configuraciones sobre la misma partida, no partidas entre sí. " +
      `Motores: ${$("motores").value}, modo ${nombreModo()}. ` +
      "Los motores se reinician entre corrida y corrida. " +
      "Todas corren con memoria limpia salvo la última. Las filas 1 y 2 son la " +
      "misma configuración dos veces: tienen que dar idénticas. El barrido mide a " +
      `profundidad 13 y no a ${prof}, así que sus cifras no se comparan con el resto.`;
  $("tablaBanco").innerHTML = `
    <thead><tr><th>Configuración</th><th>Seg</th><th>vs 1ª</th><th>Prof</th>
      <th>Precisión</th><th>Mediana</th><th>Graves</th><th>Genial</th></tr></thead>
    <tbody>${filas.map(f => `<tr>
      <td>${f.nombre}${f.revisadas ? ` (${f.revisadas})` : ""}</td>
      <td>${(f.ms / 1000).toFixed(1)}</td>
      <td>${f === base ? "\u2014" : (base.ms / f.ms).toFixed(2) + "\u00d7"}</td>
      <td>${f.prof}</td>
      <td>${f.precision == null ? "\u2014" : f.precision.toFixed(1)}</td>
      <td>${f.mediana == null ? "\u2014" : f.mediana.toFixed(2)}</td>
      <td>${f.graves}</td>
      <td>${f.geniales}</td></tr>`).join("")}</tbody>`;
}

/* Cambiar de modo NO vuelve a correr el motor: las categorías se derivan de las
   evaluaciones, y las evaluaciones ya están. Es la razón por la que la caché
   guarda evaluaciones y no veredictos. */
/* ============ todo lo analizado ============

   Recorre la caché y arma las filas de cada partida ya analizada, sin tocar el
   motor. Es exactamente para esto que la caché guarda evaluaciones y no
   veredictos (§4.4).

   El orden importa: primero se pregunta a la caché por el uuid, que viene en el
   JSON del mes, y recién las que dieron acierto se parsean. Así el costo escala
   con lo que analizaste, no con tu historial.

   De cada fila se guardan solo los campos que usan las tablas. Los fens, las
   evaluaciones, las jugadas y el PGN se tiran: son para la pantalla de
   revisión, que sigue trabajando sobre el mes elegido. Un año entero de filas
   flacas pesa menos que un mes con todo. */
const CAMPOS_FLACOS = ["n", "cats", "perdida", "precision", "franja", "pieza",
                       "esCaptura", "colgada", "capBuena", "tomoBuena",
                       "tomoConOtra", "seg"];

function adelgazar(f) {
  const o = {};
  for (const k of CAMPOS_FLACOS) o[k] = f[k];
  return o;
}

async function barrerCache(prof, opc, onProg) {
  const vte = variante(opc);
  const libro = await cargarLibro();
  /* los ids que están en la caché con cualquier profundidad; la clave es
     `id|dN|variante|motor`, así que el id es lo que va antes de la primera raya */
  const idsEnCache = new Set((await cache.claves())
    .map(k => String(k).split("|")[0]));
  /* El resultado va por PARTIDA y no en cada fila flaca: son diez o cien filas
     por partida y el dato es uno solo. Va en paralelo a porPartida. */
  /* La cadencia, igual que el resultado, es UN dato por partida y no por fila:
     va en un arreglo paralelo a porPartida y no dentro de cada fila flaca. */
  const porPartida = [], desenlaces = [], cadencias = [], hito = [];
  let partidas = 0, mesesConDatos = 0, otraProf = 0, asistidas = 0;

  for (let m = 0; m < MESES.length; m++) {
    if (onProg) onProg(m, MESES.length);
    let juegos = [];
    try {
      juegos = ((await (await fetch(MESES[m])).json()).games || []);
    } catch (e) {
      window.LOG.add("!", `barrido: no se pudo leer ${MESES[m].slice(-7)}: ${e.message || e}`);
      continue;
    }
    let enEste = 0;
    for (const g of juegos) {
      const id = idPartida(g);
      const guardado = await cache.leer(id, prof, vte);
      if (!guardado || !guardado.evs) {
        /* ¿estará analizada a otra profundidad? se avisa, no se mezcla (§5.3) */
        if (idsEnCache.has(id)) otraProf++;
        continue;
      }
      let d, prep;
      try {
        prep = prepararPartida(g.pgn);
        if (guardado.evs.length !== prep.fens.length) continue;
        d = derivarFilas(prep.jugadas, prep.fens, guardado.evs, libro, 0, $("modo").value,
                         prep.tiempos, MATE_VISTA());
        d.cab = prep.cab;
      } catch (e) { continue; }

      const falso = { cab: d.cab, filas: d.filas };
      if (esAsistida(falso)) { asistidas++; continue; }
      const mias = filasDelUsuario(falso);
      if (!mias.length) continue;
      porPartida.push(mias.map(adelgazar));
      desenlaces.push(desenlace(ladoDelUsuario(falso), g, d.cab));
      cadencias.push(prep.cadencia);
      partidas++; enEste++;
    }
    if (enEste) { mesesConDatos++; hito.push(MESES[m].slice(-7).replace("/", "-")); }
  }

  const filas = [];
  porPartida.forEach(fs => filas.push(...fs));
  return { filas, porPartida, cadencias, desenlaces, partidas,
           meses: mesesConDatos, otraProf, asistidas,
           marcador: contarResultados(desenlaces.map(d => d.res)),
           prof, vte, desde: hito[0] || null, hasta: hito[hito.length - 1] || null };
}

/* MEDICIÓN DE GENIAL. Vuelca al portapapeles los números crudos de las jugadas
   del mes analizado, para poder decidir los cortes con datos en vez de con tres
   jugadas elegidas a dedo (§8).

   NO va al registro y es a propósito: el registro es un buffer rotativo de 500
   líneas compartido con todo lo demás, y analizar un mes ya escribe una línea
   por partida. Un volcado por jugada se comería sus propios datos.

   Sale del mes ANALIZADO y no de "todo lo analizado", porque las filas flacas
   no llevan `huecoSegunda` ni `legales` —no los usa ninguna tabla— y un año de
   filas tiene que pesar poco.

   Lo que este volcado NO puede responder: cuáles habría marcado chess.com. Sin
   esas etiquetas mide qué tan seguido dispara nuestra regla y dónde cae el
   corte, no si acierta. */
function medicionGenial() {
  if (!MES || !MES.resultados.length) return "No hay un mes analizado.";
  const CUBOS = [0, 25, 50, 75, 100, 150, 200, 300, Infinity];
  /* se guarda el ÍNDICE del cubo y no su nombre: ordenado como texto quedaba
     "150-199" antes que "25-49" y el histograma no se podía leer */
  const cubo = v => {
    for (let i = CUBOS.length - 2; i >= 0; i--) if (v >= CUBOS[i]) return i;
    return 0;
  };
  const nombreCubo = i => CUBOS[i + 1] === Infinity ? `${CUBOS[i]}+`
                                                    : `${CUBOS[i]}-${CUBOS[i + 1] - 1}`;
  const hist = new Map(), geniales = [], cerca = [];
  /* LA CUARTA FALLA (v0.95): la mejor del motor marcada Imprecisión o peor.
     categorizar() pregunta por los cortes antes que por esMejor, y la pérdida
     sale de restar dos búsquedas independientes. Esto cuenta cuántas hay, en
     los DOS modos, para saber cuánto mueven las tablas antes de arreglarlo. */
  const MALAS = ["omision", "grave", "error", "imprecision"];
  const mejorMala = { critico: 0, amigable: 0 }, mejorMalaLista = [];
  const num = (v, d) => typeof v === "number" ? v.toFixed(d) : "-";
  let jugadas = 0, candidatas = 0, sinSegunda = 0, recapTapadas = 0;

  MES.resultados.forEach((r, p) => {
    filasDelUsuario(r).forEach(f => {
      jugadas++;
      /* candidata = jugaste la mejor del motor; es la puerta de Genial */
      const esMejor = f.mejor === f.uci;
      if (!esMejor) return;
      candidatas++;
      const cs = f.cats || { critico: f.cat, amigable: f.cat };
      const malaEn = ["critico", "amigable"].filter(m => MALAS.includes(cs[m]));
      malaEn.forEach(m => mejorMala[m]++);
      if (malaEn.length) mejorMalaLista.push(
        `p${p + 1} ${f.n}${f.turno === "w" ? "." : "..."} ${f.san}` +
        ` perdida=${num(f.perdida, 2)} caida=${num(f.caida, 1)}` +
        ` critico=${cs.critico} amigable=${cs.amigable}`);
      if (f.huecoSegunda === null) { sinSegunda++; return; }
      const k = cubo(f.huecoSegunda) * 2 + (f.esRecaptura ? 1 : 0);
      hist.set(k, (hist.get(k) || 0) + 1);
      const linea = `p${p + 1} ${f.n}${f.turno === "w" ? "." : "..."} ${f.san}` +
        ` hueco=${f.huecoSegunda} legales=${f.legales}` +
        ` recap=${f.esRecaptura ? "si" : "no"} antes=${f.franja.toFixed(2)} cat=${f.cat}`;
      if (f.cat === "genial") geniales.push(linea);
      /* las que un corte más bajo rescataría: son las que deciden si bajarlo
         es seguro, y sin verlas el histograma no alcanza */
      else if (!f.esRecaptura && f.huecoSegunda >= 40 && f.huecoSegunda < 150) cerca.push(linea);
      if (f.esRecaptura && f.huecoSegunda >= 150) recapTapadas++;
    });
  });

  const CORTE = 200;   /* el volcado tiene que entrar en un portapapeles */
  const lista = (t, xs) => `\n\n${t} (${xs.length})\n` +
    xs.slice(0, CORTE).map(x => "  " + x).join("\n") +
    (xs.length > CORTE ? `\n  … y ${xs.length - CORTE} más` : "");

  return `medición de Genial · ${window.VERSION}\n` +
    `${MES.resultados.length} partidas · ${jugadas} jugadas mías · profundidad ${MES.prof}\n` +
    `modo ${nombreModo()} · mate a la vista ${$("mateVista").value}\n` +
    `\njugadas donde jugué la mejor del motor: ${candidatas}` +
    ` (sin segunda del motor: ${sinSegunda})\n` +
    `recapturas que el filtro de la v0.56 sacó de Genial: ${recapTapadas}\n` +
    `\nhueco entre la mejor y la segunda, entre esas candidatas:\n` +
    [...hist.entries()].sort((a, b) => a[0] - b[0])
      .map(([k, v]) => `  ${(nombreCubo(k >> 1) + (k & 1 ? " (recaptura)" : "")).padEnd(22)} ${v}`)
      .join("\n") +
    lista("GENIALES", geniales) +
    lista("CERCA (no recaptura, hueco 40-149: las que rescataría un corte más bajo)", cerca) +
    `\n\nLA MEJOR DEL MOTOR, MARCADA MALA (cuarta falla)\n` +
    `  en modo crítico: ${mejorMala.critico} de ${candidatas}\n` +
    `  en modo amigable: ${mejorMala.amigable} de ${candidatas}` +
    lista("detalle", mejorMalaLista);
}

$("medir").onclick = seguro("medir", () => {
  const t = medicionGenial();
  if (navigator.clipboard) navigator.clipboard.writeText(t).then(
    () => estado("Medición copiada."), () => alert(t));
  else alert(t);
});

function reDerivar(r) {
  if (!r || !r.evs) return;
  const d = derivarFilas(r.jugadas, r.fens, r.evs, LIBRO, 0, $("modo").value, r.tiempos, MATE_VISTA());
  r.filas = d.filas;
  r.apertura = d.apertura;
  (r.revs || []).forEach(x => { if (r.filas[x.i]) r.filas[x.i].rev = x.rev; });
}

/* Un solo manejador para todos los ?, delegado: las leyendas se repintan
   enteras en cada `pintarMes`, así que un onclick por botón se perdería.
   El botón vive dentro del <summary>: sin preventDefault, tocarlo plegaría la
   sección justo cuando se quiere leer. Y si la sección está cerrada, se abre,
   porque si no el texto se muestra donde no se ve. */
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest("button.ayuda");
  if (!b) return;
  e.preventDefault();
  const cap = $(b.dataset.ayuda);
  if (!cap) return;
  const panel = cap.querySelector(".ayudaPanel");
  if (!panel) return;
  const abrir = panel.classList.contains("oculto");
  panel.classList.toggle("oculto", !abrir);
  b.setAttribute("aria-expanded", abrir ? "true" : "false");
  const sec = b.closest("details");
  if (abrir && sec) sec.open = true;
});

/* Al plegar la sección hay que cerrar también la ayuda. El panel vive ADENTRO,
   así que si no, el texto se esconde pero el ? sigue pintado diciendo que está
   abierto, y al reabrir aparece un texto que nadie pidió. Lo reportó el usuario
   desde el celular.
   `toggle` no burbujea, así que se engancha en cada sección y no delegado. */
document.querySelectorAll("details.seccion").forEach(sec => {
  sec.addEventListener("toggle", () => {
    if (sec.open) return;
    const b = sec.querySelector("button.ayuda");
    const panel = sec.querySelector(".ayudaPanel");
    if (b) b.setAttribute("aria-expanded", "false");
    if (panel) panel.classList.add("oculto");
  });
});

$("cadencia").onchange = seguro("cadencia", () => {
  CADENCIA = $("cadencia").value || null;
  window.LOG.add("\u00b7", "cadencia " + CADENCIA);
  /* no hay que rehacer nada: las filas ya están, lo único que cambia es cuáles
     entran. Por eso el cambio es instantáneo, igual que el de modo. */
  if (MES || TODO) pintarMes(MES ? MES.prof : TODO.prof);
});

/* Mismo camino que Modo, con una diferencia: lo juntado no se puede reetiquetar.
   Las filas flacas llevan las dos etiquetas de Modo precalculadas pero NO las
   evaluaciones, así que con otro corte de mate hay que rebarrer la caché.
   Se rebarre EN EL LUGAR: mover un dial no es pedir cambiar de vista, y antes
   te devolvía a "el mes seleccionado" sin que lo hubieras pedido. El barrido no
   toca el motor, así que se paga en milisegundos. */
$("mateVista").onchange = seguro("mate a la vista", async () => {
  window.LOG.add("·", "mate a la vista: " + $("mateVista").value);
  if (TODO) {
    TODO = null;
    window.LOG.add("·", "rebarriendo: cambió el corte de mate");
    if (FUENTE === "todo" && !await juntarTodo()) { FUENTE = "mes"; pintarFuente(); }
  }
  if (MES) MES.resultados.forEach(reDerivar);
  if (MES || (FUENTE === "todo" && TODO)) pintarMes(MES ? MES.prof : TODO.prof);
  if (R) {
    reDerivar(R);
    IDX = Math.min(IDX, R.filas.length - 1);
    pintarResumen(R.profBase || +$("prof").value);
    pintarRevision();
  }
});

$("modo").onchange = seguro("modo", () => {
  window.LOG.add("·", "modo " + $("modo").value);
  if (MES) { MES.resultados.forEach(reDerivar); pintarMes(MES.prof); }
  /* TODO no se rehace: cada fila flaca lleva las dos etiquetas. */
  if (R) {
    reDerivar(R);
    IDX = Math.min(IDX, R.filas.length - 1);
    pintarResumen(R.profBase || +$("prof").value);
    pintarRevision();
  }
});

/* de cada partida se toman solo las jugadas del usuario buscado */
/* Lista cerrada de cuentas de entrenador de chess.com. Coincidencia EXACTA, no
   por prefijo: los nombres de usuario admiten guiones, así que "Coach-loquesea"
   es un nombre que cualquier persona puede registrar y un prefijo daría falsos
   positivos. La API no expone ninguna marca de bot ni de entrenador, así que no
   hay forma automática mejor que esta.
   [PEND] completar con el resto de los entrenadores de chess.com. */
const ENTRENADORES = new Set(["coach-drwolf"]);

/* Las partidas con asistencia en vivo no miden juego propio: el entrenador
   muestra el termómetro, avisa cuando hay mate y deja rehacer jugadas. Se
   separan del promedio pero NO se borran: los episodios sirven igual, porque
   el aviso funciona como control. */
function esAsistida(r) {
  const lado = ladoDelUsuario(r);
  if (!lado) return false;
  const rival = (lado === "w" ? r.cab.Black : r.cab.White) || "";
  return ENTRENADORES.has(rival.toLowerCase());
}

function ladoDelUsuario(r) {
  if (r.yo) return r.yo;
  if (!USUARIO) return null;
  const b = (r.cab.White || "").toLowerCase(), n = (r.cab.Black || "").toLowerCase();
  return b === USUARIO ? "w" : n === USUARIO ? "b" : null;
}

function filasDelUsuario(r) {
  const lado = ladoDelUsuario(r);
  return lado ? r.filas.filter(f => f.turno === lado) : [];
}

function opcionesDePantalla() {
  const m = $("optMpv").value;
  return {
    bloques: $("optBloques").checked,
    multipv: m === "h" ? "hibrido" : +m,
    limpiar: $("optLimpiar").checked,
    barrido: $("optBarrido").checked
  };
}

/* nombre corto de la configuración, para la clave de caché y para el registro */
function variante(opc) {
  const p = [];
  if (opc.multipv === 1) p.push("mpv1");
  if (opc.multipv === "hibrido") p.push("hib");
  if (opc.limpiar) p.push("limpio");
  if (opc.barrido) p.push("barrido");
  if (opc.bloques) p.push("bloq");
  return p.join("-");
}

/* Por debajo de esta cantidad de jugadas no se muestra porcentaje. Con 389
   jugadas y 17 malas, cualquier corte deja celdas de dos casos, y un "7,3%"
   sobre 41 jugadas invita a comparaciones que el dato no aguanta. */
