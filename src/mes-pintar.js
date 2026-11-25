const NOMBRE_PIEZA = { p: "Peón", n: "Caballo", b: "Alfil", r: "Torre", q: "Dama", k: "Rey" };
const TRAMOS = [["1 a 10", n => n <= 10], ["11 a 25", n => n > 10 && n <= 25],
                ["26 a 40", n => n > 25 && n <= 40], ["41 en adelante", n => n > 40]];

const FRANJAS = [["menos de +2", x => x < 2], ["+2 a +5", x => x >= 2 && x < 5],
                 ["+5 a +8", x => x >= 5 && x < 8], ["+8 o m\u00e1s", x => x >= 8]];

/* jugada siguiente a una mala, dentro de la misma partida y solo entre jugadas
   propias: la de al lado en la lista del usuario, no la del rival */
function paresDeErrores(porPartida) {
  const trasMala = [], resto = [];
  porPartida.forEach(fs => {
    for (let i = 1; i < fs.length; i++) (esMala(fs[i - 1]) ? trasMala : resto).push(fs[i]);
  });
  return { trasMala, resto };
}

function pintarDetalle(todas, porPartida, tiempo) {
  const conCap = todas.filter(f => f.capBuena);
  tablaReparto("mesCapturas", "capCapturas",
    "De las veces que la mejor jugada del motor era una captura que ganaba " +
    "material, qué se hizo. Es la pregunta de cuántas veces había material a " +
    "la vista y no se vio. La columna Malas es un control: la primera fila " +
    "tiene que dar cero, porque jugar la mejor jugada no puede perder nada. " +
    "La segunda fila NO es material perdido: cobraste lo mismo, con otra " +
    "pieza; lo que cueste eso lo dice la columna Malas.",
    /* (este texto ahora vive detrás del ?, no encima de la tabla) */
    [Object.assign(tasa(conCap.filter(f => f.tomoBuena), "La vi y la tomé"),
                   { canario: true }),
     tasa(conCap.filter(f => f.tomoConOtra), "La tomé con otra pieza"),
     tasa(conCap.filter(f => !f.tomoBuena && !f.tomoConOtra && f.esCaptura), "Tomé otra"),
     tasa(conCap.filter(f => !f.tomoBuena && !f.tomoConOtra && !f.esCaptura), "No capturé")],
    "Situación");
  const vi = conCap.filter(f => f.tomoBuena).length;
  titular("mesCapturas", !conCap.length ? ""
    : conCap.length === 1 ? `${vi ? "Tomaste" : "No tomaste"} la única que ganaba material`
    : `Tomaste ${vi} de las ${conCap.length} que ganaban material`);

  const { trasMala } = paresDeErrores(porPartida);
  tablaContrastes("mesMecanismos", "capMecanismos",
    "Compara situaciones, no jugadas: qué porcentaje de las jugadas con ese " +
    "mecanismo salió mal.",
    [contraste(todas, f => f.colgada, "Dejé comible la pieza que moví"),
     { nombre: "Jugada siguiente a una mala", dentro: trasMala, con: tasa(trasMala) }],
    "Mecanismo", tasa(todas));
  const general = tasa(todas);
  $("capJugadas").textContent = general.total && pocasJugadas(general)
    ? "Pocas jugadas para comparar todavía" : "";
  titular("mesMecanismos", titularTasas(
    [contraste(todas, f => f.colgada, "Dejé comible la pieza que moví"),
     { nombre: "Jugada siguiente a una mala", con: tasa(trasMala) }], general, n => n, true));

  const piezas = Object.keys(NOMBRE_PIEZA).map(k =>
    tasa(todas.filter(f => f.pieza === k), NOMBRE_PIEZA[k])).filter(x => x.total);
  tablaTasas("mesPieza", "capPieza",
    "Compara situaciones, no jugadas: con qué pieza se movió, y de esas " +
    "jugadas qué parte fue la mejor y qué parte salió mal.",
    piezas, "Pieza", tiempo);
  titular("mesPieza", titularTasas(piezas, general, rotuloPieza));

  const tramos = TRAMOS.map(([nom, test]) => tasa(todas.filter(f => test(f.n)), nom));
  tablaTasas("mesTramo", "capTramo",
    "Compara situaciones, no jugadas: en qué momento de la partida se jugó, " +
    "y qué parte fue la mejor y qué parte salió mal. Las de libro no " +
    "cuentan para la mejor: ahí no se elige.",
    tramos, "Tramo", tiempo);
  titular("mesTramo", titularTasas(tramos, general, rotuloTramo));
}

/* De dónde salen los números de las tablas. La lista de partidas NO pasa por
   acá: esa es del mes elegido siempre, porque es para abrir una partida.
   Las filas del mes traen `cat` ya resuelto; las flacas del barrido traen las
   dos etiquetas en `cats` y se elige acá, que es lo que hace instantáneo el
   cambio de modo sin haber guardado las evaluaciones. */
function datosDeTablas() {
  const modo = $("modo").value;
  /* Se arma el conjunto entero y RECIÉN AHÍ se filtra por cadencia, una sola
     vez, para que las filas, el historial y los denominadores salgan todos del
     mismo subconjunto. Filtrar cada cosa por su lado fue el error de la v0.43:
     quedaban dos universos en la misma tabla. */
  const bruto = FUENTE === "todo" && TODO ? deTodoBruto(modo) : delMesBruto();
  const censo = censoCadencias(bruto.cadencias, bruto.porPartida);
  const cad = elegirCadencia(censo, CADENCIA);
  const dentro = i => !!cad && !!bruto.cadencias[i] && bruto.cadencias[i].clave === cad.clave;
  const idx = bruto.porPartida.map((_, i) => i).filter(dentro);

  const porPartida = idx.map(i => bruto.porPartida[i]);
  const todas = [];
  porPartida.forEach(fs => todas.push(...fs));
  const tiempo = { cadencia: cad, censo, total: bruto.porPartida.length,
                   /* de ESTA cadencia, cuántas no traen reloj */
                   sinReloj: idx.filter(i => !bruto.porPartida[i].some(f => f.seg != null)).length };
  return { todas, porPartida, tiempo, deTodo: bruto.deTodo,
           asistidas: bruto.asistidas,
           /* lo que queda afuera por cadencia: partidas del conjunto que no son
              de la elegida, incluidas las que no tienen cadencia (daily) */
           otraCadencia: bruto.porPartida.length - idx.length,
           desenlaces: idx.map(i => bruto.desenlaces[i]),
           marcador: contarResultados(idx.map(i => bruto.desenlaces[i].res)) };
}

/* Los dos conjuntos crudos, antes de filtrar por cadencia. Los tres arreglos
   —filas, cadencia y resultado— van en paralelo y por índice de partida: es la
   misma convención que usa barrerCache desde la v0.39. */
function deTodoBruto(modo) {
  const cat = f => (f.cats && f.cats[modo]) || f.cat;
  return {
    porPartida: TODO.porPartida.map(fs => fs.map(f => Object.assign({}, f, { cat: cat(f) }))),
    cadencias: TODO.cadencias || TODO.porPartida.map(() => null),
    desenlaces: TODO.desenlaces || TODO.porPartida.map(() => ({ res: null, motivo: null })),
    asistidas: TODO.asistidas, deTodo: true,
  };
}

function delMesBruto() {
  if (!MES) return { porPartida: [], cadencias: [], desenlaces: [], asistidas: 0, deTodo: false };
  const limpias = MES.resultados.filter(r => !esAsistida(r));
  /* el historial se cuenta sobre EXACTAMENTE las mismas partidas que los
     promedios, o los dos números hablarían de universos distintos */
  const conMias = limpias.filter(r => filasDelUsuario(r).length);
  return {
    porPartida: conMias.map(filasDelUsuario),
    cadencias: conMias.map(r => r.cadencia || null),
    desenlaces: conMias.map(r => desenlace(ladoDelUsuario(r), r.meta, r.cab)),
    asistidas: MES.resultados.filter(esAsistida).length, deTodo: false,
  };
}

/* De dónde salen los números, dicho arriba de todo. Sin esto dos tablas de
   distinto alcance se leen como si hablaran de lo mismo (§5.1 y §5.3). */
/* De dónde salen los números, en dos piezas.

   `origenCorto` es lo que queda a la vista: los denominadores y la
   configuración, secos. NO repite lo que la pantalla ya dice —el `<select>` de
   arriba dice "El mes seleccionado" o "Todo lo analizado", y el buscador dice
   de qué usuario— porque eso era eco: 90 caracteres de los que la mitad ya
   estaban en pantalla.

   Sí lleva cuántas partidas quedaron AFUERA, en un solo número. Que algo no se
   haya contado no se puede plegar (§5.12); el desglose de por qué, sí. */
/* El value del <select> es ASCII a propósito ("critico"), así que no se puede
   escribir crudo en pantalla: quedaba "prof 13 · critico", sin tilde. El texto
   completo de la opción —"crítico (centipeones)"— tampoco sirve: es demasiado
   largo para una leyenda de un renglón. */
const nombreModo = () => $("modo").value === "amigable" ? "amigable" : "crítico";

function origenCorto(d, prof) {
  const partes = [];
  /* La cadencia NO va acá desde la v0.108: la dice el selector de al lado
     ("10 min (12)"), y repetirla era el mismo eco que se sacó en la v0.45. */
  partes.push(cuantas(d.porPartida.length, "partida", "partidas"),
              cuantas(d.todas.length, "jugada", "jugadas"));
  if (d.deTodo) partes.push(cuantas(TODO.meses, "mes", "meses"));
  partes.push(`prof ${prof}`, nombreModo());
  const afuera = (d.asistidas || 0) + (d.otraCadencia || 0) +
                 (d.deTodo && TODO.otraProf ? TODO.otraProf : 0);
  if (afuera) partes.push(`${afuera} afuera`);
  return partes.join(" \u00b7 ");
}

/* Y esto va adentro del plegable "Cómo se leen estos números", que es donde el
   usuario los busca cuando no entiende una cifra. */
function origenLargo(d) {
  /* El desglose de lo que quedó afuera: la línea de arriba dice cuántas son y
     acá se dice por qué. Que algo no se contó no se puede callar (§5.12); el
     motivo, sí se puede plegar. */
  const c = d.tiempo && d.tiempo.cadencia;
  const otras = c ? d.tiempo.censo.filter(x => x.clave !== c.clave) : [];
  const trozos = otras.map(x => `${x.partidas} de ${x.nombre}`);
  /* las que no tienen cadencia comparable —las de correspondencia— también
     quedaron afuera y también hay que nombrarlas */
  const sinCad = (d.otraCadencia || 0) - otras.reduce((a, x) => a + x.partidas, 0);
  if (sinCad > 0) trozos.push(`${sinCad} por correspondencia, que no tienen reloj comparable`);
  const porCadencia = c
    ? `Los números son solo de tus partidas de ${c.nombre}: mezclar cadencias no ` +
      "sirve, porque no se juega igual con 3 minutos que con 15, ni la tasa de " +
      "errores ni el tiempo por jugada. " +
      (trozos.length ? `Quedaron afuera ${trozos.join(", ")}. ` : "")
    : "";
  if (d.deTodo) {
    const rango = TODO.desde === TODO.hasta ? TODO.desde : `${TODO.desde} a ${TODO.hasta}`;
    return porCadencia +
      `Son partidas de ${USUARIO} que analizaste, de ${TODO.meses} mes(es) (${rango}). ` +
      (TODO.otraProf
        ? `${TODO.otraProf} partida(s) están analizadas a otra profundidad o con otra ` +
          "configuración y no entran, porque esos números no se comparan. "
        : "");
  }
  return porCadencia +
    `Son partidas de ${USUARIO} del mes seleccionado que ya analizaste. `;
}

function pintarMes(prof) {
  const d = datosDeTablas();
  const { todas, porPartida } = d;
  pintarFuente();
  if (!todas.length) {
    $("capMes").textContent = d.deTodo
      ? "Todavía no hay nada analizado a esta profundidad."
      : "Ninguna de estas partidas es de ese usuario.";
    $("mesResumen").innerHTML = ""; $("mesFranja").innerHTML = "";
    $("mesCabecera").innerHTML = ""; $("capMesDetalle").textContent = "";
    ver("mesMarcador", false);
    /* "mesDesenlaces" también (v0.146): la sección va abierta de fábrica, y sin
       esto mostraba la tabla del mes anterior */
    ["mesDesenlaces", "mesCapturas", "mesMecanismos", "mesPieza", "mesTramo"].forEach(t => $(t).innerHTML = "");
    ["mesDesenlaces", "mesFranja", "mesCapturas", "mesMecanismos", "mesPieza", "mesTramo"].forEach(t => titular(t, ""));
    $("capJugadas").textContent = "";
    pintarLista(d.tiempo && d.tiempo.cadencia);
    return;
  }
  const prec = precisionMedia(todas);
  /* La leyenda se parte en dos: arriba queda lo que hace falta para leer los
     números —de dónde salen y con qué configuración—, y el resto se pliega.
     Todo junto era un párrafo de seis renglones antes del primer número. */
  pintarSelectorCadencia(d.tiempo);
  $("capMes").textContent = origenCorto(d, prof);
  $("capMesDetalle").textContent = origenLargo(d) +
    (d.asistidas
      ? `Quedan afuera ${d.asistidas} partida(s) con asistencia en vivo, que no miden juego propio. `
      : "") +
    "Los números de distinta profundidad o de distinto modo no se comparan." +
    " La precisión y la mediana no cuentan las jugadas de libro." +
    " Mala = pérdida de 3 peones o más, medida siempre igual, sin importar el " +
    "modo de clasificación." + textoDesglose(todas, d.deTodo);

  /* Las tres cifras que resumen el mes van arriba y grandes; en la tabla se
     quedan solo los recuentos por categoría, que es lo que la tabla hace bien.
     Las tres tenían un "—" en la columna "Por partida" que no decía nada. */
  /* El marcador lo escribe textoMarcador, la misma que usa el listado del mes:
     si las palabras se eligieran en dos lugares, se irían separando.
     Este cuenta las analizadas y sin asistencia —las mismas partidas que los
     promedios, y lo dice la leyenda de arriba—; el del listado cuenta todas
     las del mes. Son dos denominadores distintos a propósito. */
  const marcadorMes = textoMarcador(d.marcador);
  $("mesMarcador").textContent = marcadorMes;
  ver("mesMarcador", !!marcadorMes);

  const cuadro = (et, va, cl = "") => `<div><div class="et">${et}</div><div class="va${cl}">${va}</div></div>`;
  $("mesCabecera").innerHTML =
    /* "solo libro" en tenue y sin negrita, como Pensó sin reloj: no es el dato (revisor, v0.174) */
    cuadro("Precisión", prec == null ? SOLO_LIBRO : prec.toFixed(1), prec == null ? " sinDato" : "") +
    cuadro("Mediana", prec == null ? "\u2014" : medianaFuera(todas).toFixed(2), prec == null ? " sinDato" : "") +
    cuadro("Jugadas", todas.length);

  const cuentaCat = k => todas.filter(f => f.cat === k).length;
  $("mesResumen").innerHTML = `
    <thead><tr><th></th><th>Total</th><th>Por partida</th></tr></thead>
    <tbody>
      ${ORDEN.map(k => `<tr><td><span style="color:var(--c-${k})">${CATEGORIAS[k].icono}</span> ${CATEGORIAS[k].nombre}</td>` +
        `<td>${cuentaCat(k)}</td><td>${(cuentaCat(k) / porPartida.length).toFixed(1)}</td></tr>`).join("")}
    </tbody>`;

  tablaReparto("mesDesenlaces", "capDesenlaces",
    "Cómo terminó cada partida, no cómo se jugó: es el desenlace y no la " +
    "calidad. Sirve para ver por dónde se te van las partidas —si perdés más " +
    "por reloj que por mate, el problema es el manejo del tiempo y no la " +
    "táctica—. El motivo lo escribe siempre el que no ganó: chess.com le pone " +
    "\"win\" al ganador y el detalle al otro.",
    filasDesenlace(d.desenlaces), "Desenlace", ["partida", "partidas"]);
  /* con las mismas palabras que la fila de la tabla: dos voces para lo
     mismo se leen como dos cosas */
  {
    const fd = filasDesenlace(d.desenlaces), n = fd.reduce((a, f) => a + f.total, 0);
    const top = fd.slice().sort((a, b) => b.total - a.total)[0];
    titular("mesDesenlaces", top ? `${top.nombre}: ${top.total} de ${n}` : "");
  }

  const franjas = FRANJAS.map(([nom, t]) => tasa(todas.filter(f => t(f.franja)), nom));
  titular("mesFranja", titularTasas(franjas, tasa(todas), rotuloFranja));
  tablaTasas("mesFranja", "capMesFranja",
    "Compara situaciones, no jugadas: de cada nivel de ventaja, qué parte " +
    "de las jugadas fue la mejor y qué parte salió mal, sobre cuántas se " +
    "jugaron desde ahí. Sirve para ver si con mucha ventaja te relajás.",
    franjas,
    /* la columna de segundos sale sola —tablaTasas la dibuja si las filas la
       tienen— y acá significa algo: cuánto se piensa según la ventaja. Se le
       pasa `d.tiempo` para que la leyenda pueda avisar si falta algún reloj. */
    "Ventaja", d.tiempo);

  pintarDetalle(todas, porPartida, d.tiempo);
  pintarLista(d.tiempo && d.tiempo.cadencia);
}

/* Siempre del mes elegido, pase lo que pase con el interruptor: es para abrir
   una partida y revisarla, y eso solo tiene sentido sobre el mes cargado.
   Del RITMO elegido sí (v0.146, revisor): un selector gobierna toda la
   pantalla, y el recuento de arriba decía "12 partidas" con 40 en la lista. */
function pintarLista(cad) {
  if (!MES) { $("mesLista").innerHTML = ""; return; }
  /* "asistida" en el lugar de la precisión, como "sin analizar" en el inicio:
     esa precisión no mide juego propio, y lo de que no entra en los números
     lo dice el "?" (v0.128) */
  const delRitmo = r => !cad || ((r.cadencia || leerCadencia(r.cab)) || {}).clave === cad.clave;
  $("mesLista").innerHTML = MES.resultados.map((r, i) => {
    if (!delRitmo(r)) return "";
    const g = r.meta && r.meta.white ? r.meta
      : { white: { username: r.cab.White || "" }, black: { username: r.cab.Black || "" } };
    const p = precisionDe(r);
    return filaDePartida(g, i, esAsistida(r) ? "asistida" : p == null ? ""
                         : typeof p === "number" ? Math.round(p) : p,
                         false, r.cab);
  }).join("");
  {
    const rs = MES.resultados.filter(delRitmo);
    const ps = rs.filter(r => !esAsistida(r)).map(precisionDe).filter(p => typeof p === "number").map(Math.round);
    const lo = Math.min(...ps), hi = Math.max(...ps);
    titular("mesLista", !rs.length ? "" : cuantas(rs.length, "partida", "partidas") +
      (!ps.length ? "" : lo === hi ? `, ${lo} de precisión` : `, de ${lo} a ${hi} de precisión`));
  }
  pintarLeyenda("capLista", [], [cad ? `Las partidas analizadas de ${nombreMes($("meses").value)} a ${cad.nombre}.`
                                        : `Todas las partidas analizadas de ${nombreMes($("meses").value)}.`,
    "Tocá una para abrirla.", "Las asistidas van marcadas y no entran en los números."]);
  $("mesLista").querySelectorAll("div[data-i]").forEach(d => {
    d.onclick = () => {
      R = MES.resultados[+d.dataset.i];
      IDX = -1;
      GIRADO = (R.cab.Black || "").toLowerCase() === USUARIO;
      pintarResumen(MES.prof);
      pintarRevision();
      HAY.partida = true;
      /* el salto va sin animación de scroll: el desplazamiento suave lo
         cancelaba el reajuste del navegador (medido en la v0.38: el tablero
         terminaba 643 px arriba del borde); por eso el body lleva
         overflow-anchor: none */
      irAPantalla("partida");
    };
  });
}

