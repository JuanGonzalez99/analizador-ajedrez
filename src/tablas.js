/* ============ tablas ============ */
/* Ya no hay mínimo para los porcentajes: se muestran siempre, con su margen
   (v0.50). El único piso que queda es el de las medianas, y es propio: no son
   la misma clase de número. Con menos de esto una "mediana" es un valor suelto
   disfrazado de resumen. */
const NMIN_MEDIANA = 5;

/* Una fila por mecanismo, con la tasa del resto de las jugadas al lado. Antes
   eran dos filas —"sí" y "no"— y había que restarlas de a ojo para leer el
   contraste, que es lo único que un mecanismo dice por sí solo (§5 regla 7). */
/* Reparto: las filas parten un mismo total y los porcentajes suman 100. Es
   otra pregunta que la de tablaTasas —no "qué parte de esto salió mal" sino
   "qué parte de las veces hice cada cosa"— y por eso no lleva DEF_MALA.

   La columna "Malas" queda como control, no como estadística: una fila marcada
   canario tiene que dar 0 y muestra un guion. Su tasa no se muestra porque
   sería circular: los grupos están definidos por no haber jugado la mejor
   jugada del motor, así que por construcción pierden evaluación. */
/* `unidad` porque esta tabla reparte cosas distintas según quién la use: las
   capturas reparten SITUACIONES y el desglose de desenlaces reparte PARTIDAS.
   Decía "Sobre 5 situaciones" arriba de un desglose de partidas. */
function tablaReparto(idTabla, idCap, texto, filas, encabezado,
                      unidad = ["situación", "situaciones"]) {
  const total = filas.reduce((a, f) => a + f.total, 0);
  /* Esta tabla NO lleva DEF_MALA: sus porcentajes son un reparto —"qué parte de
     las veces hice cada cosa"— y no una tasa de jugadas malas. Lo que sí tiene
     que decir arriba es sobre cuántas situaciones reparte (§5.1). */
  /* SIN mínimo, y es a propósito. Acá el porcentaje es una COMPOSICIÓN de un
     conjunto cerrado —"de mis 10 partidas, 3 fueron por tiempo"— y no la
     estimación de una propensión: el denominador ES la población de la que se
     habla, no una muestra de ella. 30% es exactamente cierto de esas 10
     partidas y no hay nada que estimar. El mínimo se escribió para las tasas y
     se estaba aplicando acá por inercia; lo detectó el usuario. */
  pintarLeyenda(idCap, [`Sobre ${cuantas(total, unidad[0], unidad[1])}`],
    [texto, `El porcentaje reparte estas mismas ${unidad[1]}, así que no lleva ` +
            "margen: no estima nada, las cuenta."]);
  /* "Malas" solo cuando la fila es de jugadas. El desglose de desenlaces
     reparte PARTIDAS, y ahí la columna no significa nada: una columna vacía se
     lee como "cero malas", que sería falso. */
  const conMalas = filas.some(f => f.malas != null);
  /* El porcentaje va con el signo, igual que las tablas de tasas: el mismo
     encabezado no puede tener números con signo en una tabla y sin él en otra. */
  $(idTabla).innerHTML = `
    <thead><tr><th>${encabezado}</th><th>Veces</th><th>%</th>` +
      (conMalas ? "<th>Malas</th>" : "") + `</tr></thead>
    <tbody>${filas.map(f => `<tr><td>${f.nombre}</td><td>${f.total}</td>` +
      `<td>${total ? enteroPct(100 * f.total / total, f.total, total) : "\u2014"}</td>` +
      (conMalas ? `<td>${f.canario && !f.malas ? "\u2014" : f.malas}</td>` : "") +
      `</tr>`).join("")}
    </tbody>`;
}

/* La referencia contra la que se lee cada fila va UNA vez en la leyenda, no en
   una columna. Como columna era "% resto" y mezclaba dos bases distintas: para
   "Dejé comible la pieza que moví" el resto eran todas las demás jugadas —o sea
   casi todas, prácticamente la tasa general—, y para "Jugada siguiente a una
   mala" era el resto de paresDeErrores(), que además excluye la primera jugada
   de cada partida. Dos denominadores en la misma columna, sin decirlo.
   El contraste NO se perdió, que es lo que exige §5.7: sigue estando, pero
   contra una sola base bien definida y declarada con su denominador. */
function tablaContrastes(idTabla, idCap, texto, filas, encabezado, base) {
  /* La referencia queda arriba: sin ella cada fila es un porcentaje suelto y no
     un contraste, que es exactamente lo que exige §5.7. */
  const ref = base && base.total
    ? `Referencia: ${base.malas} de ${base.total} (${porCiento(base)})`
    : "";
  const solape = textoSolape(filas);
  pintarLeyenda(idCap,
    [DEF_MALA, ref, solape ? "hay filas que se solapan" : ""],
    [texto, ref ? "Cada fila se lee contra esa referencia." : "", solape,
     AYUDA_RANGO]);
  $(idTabla).innerHTML = `
    <thead><tr><th>${encabezado}</th><th>Malas</th><th>Jugadas</th><th>Tasa</th></tr></thead>
    <tbody>${filas.map(f => `<tr><td>${f.nombre}</td><td>${f.con.malas}</td>` +
      `<td>${f.con.total}</td><td>${textoPct(f.con)}</td></tr>`).join("")}
    </tbody>`;
}

function tablaTasas(idTabla, idCap, texto, filas, encabezado, tiempo) {
  /* La columna de segundos aparece SOLO si hay de dónde sacarla. Una columna de
     guiones no dice "no se midió", dice "no hay", que no es lo mismo (§5.12);
     mejor que no esté y que la leyenda lo explique. */
  const conTiempo = filas.some(f => f.seg != null);
  pintarLeyenda(idCap,
    /* cada definición entera en su renglón: a 386 cortaba "3+ / peones" */
    [duro(DEF_MEJOR), duro(DEF_MALA)],
    [texto, conTiempo ? textoTiempo(tiempo) : "", AYUDA_RANGO]);
  /* "mediana" va en el encabezado y no en la leyenda: ahí no cuesta un renglón
     y queda al lado del número que califica. */
  /* "Tasa" y no "%": un "%" solo, en una columna ancha, flota sin decir de qué
     es. Nombrar la cantidad además le da cuerpo al encabezado, así que deja de
     verse suelto. La tabla de REPARTO se queda con "%" a propósito: ahí el
     número no es una tasa sino qué parte del total es cada fila. */
  /* LO QUE SALE BIEN Y LO QUE SALE MAL, LADO A LADO (v0.157; Juan: "muy
     centrado en jugadas malas"). Hasta la v0.156 eran Malas · Jugadas · Tasa,
     o sea una sola pregunta. La cantidad de malas no se pierde: es la tasa
     por las jugadas, y el ? lo explica. */
  $(idTabla).innerHTML = `
    <thead><tr><th>${encabezado}</th><th>Jugadas</th><th>La mejor</th><th>Malas</th>` +
      (conTiempo ? '<th>Seg.<span class="sub">mediana</span></th>' : "") + `</tr></thead>
    <tbody>${filas.map(f => `<tr><td>${f.nombre}</td><td>${f.total}</td>` +
      `<td>${textoPct(comoMejor(f))}</td><td>${textoPct(f)}</td>` +
      (conTiempo ? `<td>${f.seg == null ? "\u2014" : f.seg.toFixed(1)}</td>` : "") +
      `</tr>`).join("")}
    </tbody>`;
}

/* Qué cuenta como jugada mala en la columna "Malas". Es UNA definición y no la
   misma que la categoría "Error grave": las categorías dependen del modo de
   clasificación y esta no. La agregan solas tablaTasas y tablaContrastes, para
   que ninguna tabla pueda quedarse sin decirlo. */
const DEF_MALA = "Mala = pierde 3+ peones";
const DEF_MEJOR = "La mejor = la del motor, sin contar el libro";
/* una definición no se parte: corta en el " · " de la leyenda y no adentro */
const duro = t => t.replace(/ /g, "\u00a0");

/* Toda leyenda se parte en dos, y el corte NO es por largo:

   - arriba queda lo que cambia CÓMO se lee el número —qué cuenta como mala, de
     qué partidas sale, contra qué se compara—. Eso no se puede plegar sin que
     el número quede sin universo (§5.1, §5.12);
   - detrás del ? va el porqué —qué compara la tabla, para qué está cada
     control, cuál es el confundidor—. Eso se lee una vez y no hace falta
     tenerlo delante en cada mirada.

   Antes iba todo junto: la de "por tramo" eran 245 caracteres, cinco renglones
   en un celular, y nadie los leía. Decisión del usuario.

   Los dos textos van en el MISMO elemento para no inventar un id por tabla, y
   los dos se escriben con textContent: nada de lo que se interpola puede entrar
   como HTML. */
function pintarLeyenda(idCap, corto, ayuda) {
  const c = $(idCap);
  c.innerHTML = '<span class="corto"></span><span class="ayudaPanel oculto"></span>';
  const limpiar = xs => xs.map(x => (x || "").trim()).filter(Boolean);
  c.querySelector(".corto").textContent = limpiar(corto).join(" \u00b7 ");
  c.querySelector(".ayudaPanel").textContent = limpiar(ayuda).join(" ");
}

/* El rango de tasas reales compatibles con lo observado (Wilson).

   Se usa Wilson y no el margen de manual `p ± z·√(p(1-p)/n)` porque ese, con
   pocos casos, se va abajo de cero o arriba de cien —"una tasa de -3%" no se
   puede mostrar— y encima se rompe del todo cuando no hubo ningún caso.

   z = 1,96 es el 95%: repetido muchas veces, el rango contiene la tasa real
   unas 95 de cada 100 veces. Con pocas jugadas la etiqueta es aproximada,
   porque no existe media jugada mala y los rangos saltan de a escalones. */
function rangoWilson(k, n, z = 1.96) {
  if (!n) return { lo: 0, hi: 100 };
  const p = k / n, d = 1 + z * z / n;
  const c = (p + z * z / (2 * n)) / d;
  const h = z / d * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n));
  return { lo: Math.max(0, c - h) * 100, hi: Math.min(1, c + h) * 100 };
}

/* La tasa con su margen. SIEMPRE, sin corte.

   Hubo dos cortes y los dos se cayeron, por el mismo argumento del usuario.
   Primero el guion debajo de 30 (v0.48). Después el margen solo debajo de 30
   (v0.50): "3 de 29" mostraba margen de 22,8 puntos de ancho y "3 de 30" lo
   escondía con 22,2 — la misma incertidumbre y tratamiento opuesto. 30 no marca
   ninguna frontera: es un número redondo. Y una tasa no se pone firme hasta los
   cientos de jugadas (20 de 200 todavía va de 6,6 a 14,9).

   Sin corte no hay arbitrariedad, y el ANCHO del paréntesis pasa a ser el
   semáforo: "(7–14)" se lee firme y "(3–31)" se lee "no sé nada". Es más
   información que el binario que había, y no hay número mágico que explicar.

   Se interpolan solo números, así que el HTML es seguro. */
function textoPct(f) {
  if (!f.total) return "\u2014";
  const r = rangoWilson(f.malas, f.total);
  return `${enteroPct(+pct(f), f.malas, f.total)}<span class="rango">(${Math.round(r.lo)}\u2013${Math.round(r.hi)})</span>`;
}

/* UNA SOLA FORMA DE ESCRIBIR UN PORCENTAJE (v0.158; lavado del revisor,
   v0.157): entero, con espacio duro, "25 %". El decimal prometía una
   precisión que el rango desmiente —"100.0%" sobre 3 jugadas, de 21 a 100—
   y en el reparto, con el número de veces al lado, no sumaba nada; de paso
   se fue el punto decimal, que en castellano es coma. Es la forma que ya
   tenían el progreso y el renglón de las secciones (v0.156). El único caso
   donde el entero mentiría es algo que pasó y redondea a 0 (1 de 300), o
   que no pasó siempre y redondea a 100: ahí "<1 %" y ">99 %". El 0 y el
   100 de verdad quedan como son. */
function enteroPct(p, k, n) {
  const r = Math.round(p);
  if (k > 0 && r === 0) return "<1\u00a0%";
  if (k < n && r === 100) return ">99\u00a0%";
  return `${r}\u00a0%`;
}

/* El texto crudo, sin marcas, para las pruebas y para cualquier lugar que
   necesite el número y no la celda. */
const pct = f => f.total ? (100 * f.malas / f.total).toFixed(1) : "\u2014";

/* La explicación del paréntesis, en el ? y solo cuando hay algún paréntesis
   que explicar. Corta a propósito: decisión del usuario. */
const AYUDA_RANGO =
  "El paréntesis es cuánto puede moverse el número: con pocas jugadas el " +
  "porcentaje es inestable. \"14.3% (5\u201335)\" quiere decir que tu tasa real " +
  "puede ser cualquier cosa entre 5% y 35%, y que el 14.3% es apenas el centro. " +
  "Cuanto más angosto el paréntesis, más firme el número.";



/* Ganó, perdió o empató, desde el lado del usuario. Prefiere el JSON de
   chess.com y cae al encabezado Result del PGN, que es lo único que hay en una
   partida pegada a mano.
   Devuelve null cuando NO SE SABE —no se sabe de qué lado jugaba, o la partida
   quedó sin terminar—, y eso no es lo mismo que un empate: contarlo como tablas
   sería inventar un resultado. */
function resultadoDeLado(lado, meta, cab) {
  if (lado !== "w" && lado !== "b") return null;
  if (meta && meta.white && meta.black) {
    if (meta.white.result === "win") return lado === "w" ? "gane" : "perdi";
    if (meta.black.result === "win") return lado === "b" ? "gane" : "perdi";
    return "empate";
  }
  const r = cab && cab.Result;
  if (r === "1-0") return lado === "w" ? "gane" : "perdi";
  if (r === "0-1") return lado === "b" ? "gane" : "perdi";
  if (r === "1/2-1/2") return "empate";
  return null;
}

/* Cómo terminó la partida, en palabras del usuario.

   **El motivo lo escribe siempre el que NO ganó**: chess.com le pone "win" al
   ganador y el detalle —"checkmated", "resigned", "timeout"— al otro. Así que
   para una ganada hay que mirar el campo del rival y para una perdida el
   propio. En las tablas los dos lados traen el mismo motivo.

   Las palabras están elegidas para que entren en la frase "Gané por ___", y
   son las de un aficionado y no las de la API. */
const MOTIVOS = {
  checkmated: "mate",
  resigned: "abandono",
  timeout: "tiempo",
  abandoned: "desconexión",
  agreed: "acuerdo",
  repetition: "repetición",
  stalemate: "ahogado",
  insufficient: "material insuficiente",
  "50move": "regla de 50 jugadas",
  timevsinsufficient: "tiempo sin material",
};

/* Un motivo que no está en la tabla NO se descarta: se cuenta como "otro
   motivo" y se anota en el registro, porque callarlo dejaría creyendo que se
   midió y dio cero (§5.12). La API puede sumar variantes cuando quiera. */
function motivoDesenlace(res, lado, meta) {
  if (!res || !meta || !meta.white || !meta.black) return null;
  const mio = lado === "w" ? meta.white.result : meta.black.result;
  const suyo = lado === "w" ? meta.black.result : meta.white.result;
  const crudo = res === "gane" ? suyo : mio;
  if (MOTIVOS[crudo]) return MOTIVOS[crudo];
  /* `typeof window` y no `window.LOG` a secas: el bloque de tablas se extrae y
     corre en node para las pruebas, donde no existe ni `window`. */
  if (typeof window !== "undefined" && window.LOG)
    window.LOG.add("!", "motivo desconocido: " + crudo);
  return "otro motivo";
}

/* resultado + motivo, que es lo que hace falta para el desglose. Se calcula
   una vez por partida y viaja junto, porque son el mismo dato. */
function desenlace(lado, meta, cab) {
  const res = resultadoDeLado(lado, meta, cab);
  return { res, motivo: motivoDesenlace(res, lado, meta) };
}

/* CÓMO TERMINÓ LA PARTIDA, para la pantalla de revisión.

   No es `remateEnTablero`, que mira el FEN y solo sabe de mate, ahogado,
   material insuficiente y 50 jugadas. Esta sale del ENCABEZADO y del JSON de
   chess.com, así que también cubre las que terminan con la posición viva —
   abandono, tiempo, acuerdo, repetición—, que era el agujero: ahí la barra
   muestra la evaluación, y con razón, pero nada decía que la partida terminó.

   Tampoco es `desenlace`, del bloque de tablas, que contesta "cómo terminó"
   desde el lado del usuario para contar el mes ("Perdí por abandono"). Acá el
   resultado va en notación y sin lado, porque se muestra al lado del nombre del
   rival y no adentro de una frase.

   EL MOTIVO LO ESCRIBE SIEMPRE EL QUE NO GANÓ: chess.com le pone "win" al
   ganador y el detalle al otro. En tablas ninguno ganó y los dos traen el
   motivo, así que mirar al blanco alcanza. Es la misma regla que usa
   `motivoDesenlace`, pero sin necesitar de qué lado jugaba el usuario: un PGN
   pegado no lo sabe, y aun así el resultado se puede mostrar.

   Devuelve null cuando no se sabe el resultado (`*` o sin encabezado): callarse
   es mejor que inventar, y ahí la cabecera queda como estaba. */
/* La barra de título de la Partida (v0.123): rival, fuerza, cómo terminó y,
   de subtítulo, la apertura. */
function pintarCabPartida(rival, elo, fin, ap) {
  $("revRival").textContent = rival || "";
  $("revElo").textContent = elo ? String(elo) : "";
  $("revFin").textContent = fin || "";
  /* sin el código ECO del principio ("C54 Italian Game…"): para quien lee es
     un glifo que hay que descifrar */
  const es = aperturaEs(ap);
  $("revAp").dataset.largo = es.largo;
  $("revAp").dataset.corto = es.corto;
  ajustarApertura();
}
/* NUNCA "…" EN LA APERTURA (v0.130): se prueba familia y variante, y si el
   renglón desborda, va la familia sola. Se mide en píxeles sobre el renglón ya
   dibujado y no contando letras, así vale a 386, a 412 y en la compu sin
   calibrar nada. El observador vuelve a medir cuando el renglón cambia de
   ancho —girar el celu, otra ventana— y cuando aparece, porque la cabecera se
   pinta con la Partida todavía escondida y ahí todo mide cero. */
function ajustarApertura() {
  const ap = $("revAp"), l2 = ap.parentNode;
  ap.textContent = ap.dataset.largo || "";
  /* con el estado tapándola no se ve, y no se decide: se mide al volver */
  if (!ap.getClientRects().length) return;
  if (l2.clientWidth && l2.scrollWidth > l2.clientWidth) ap.textContent = ap.dataset.corto || "";
}
if (typeof ResizeObserver !== "undefined") new ResizeObserver(() => ajustarApertura()).observe($("revAp").parentNode);
const RESULTADOS = { "1-0": "1-0", "0-1": "0-1", "1/2-1/2": "Tablas" };
function comoTermino(cab, meta) {
  const res = RESULTADOS[(cab && cab.Result) || ""] || null;
  if (!res) return null;
  let motivo = null;
  if (meta && meta.white && meta.black) {
    const crudo = meta.white.result === "win" ? meta.black.result : meta.white.result;
    motivo = MOTIVOS[crudo] || null;
  }
  return { res, motivo };
}

/* La fila que cierra la tira de jugadas: cómo terminó la partida, donde lo
   escribe una planilla. No suma alto a la pantalla porque vive adentro de la
   lista, que ya scrollea.

   El largo va en chico y al final: el orden es el de importancia —qué pasó, por
   qué, y de paso cuánto duró— y el tamaño lo repite.

   SE CUENTA EN JUGADAS DE AJEDREZ Y NO EN FILAS. `filas.length` son medias
   jugadas: en la partida de prueba da 36 cuando en ajedrez son 18. El número
   sale del `n` de la última fila, que es el mismo que muestra la tarjeta. */
/* CUÁNTO SE PENSÓ UNA JUGADA, corto (v0.82). `null` NO es cero: es "no se
   sabe" —la partida no traía reloj— y se dice con una raya, no con un 0, que
   sería mentira. Abajo del minuto va en segundos secos porque es el rango donde
   está casi todo; arriba, en m:ss, que es como lo lee un ajedrecista. */
/* LA DÉCIMA SOLO CUANDO EL DATO LA TRAE (v0.93). No es una precisión que la app
   elija: `segundosPensados` RESTA dos relojes del PGN, así que la décima existe
   si chess.com la escribió. Medido sobre `partida-reloj.pgn` (10+0): los 36
   relojes vienen al segundo entero y los 36 gastos salen enteros. El código de
   `normalizarPgn` documenta que también escribe `{[%clk 0:04:58.4]}` —blitz,
   presumiblemente—, y eso NO está verificado contra un PGN del usuario. De ahí
   la regla: mostrarla si está, y no escribir un ".0" que no informa nada.
   El usuario lo eligió mirando las cuatro formas dibujadas.
   De un minuto para arriba se redondea a entero y se pasa a m:ss, porque los
   segundos sueltos ahí dejan de leerse rápido. */
function tiempoCorto(seg) {
  if (seg == null) return "\u00b7";
  if (seg < 60) return (Number.isInteger(seg) ? seg : seg.toFixed(1)) + "s";
  const s = Math.round(seg);
  return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
}

function cierreDeLaTira(fin, filas) {
  if (!fin || !filas.length) return "";
  const jugadas = filas[filas.length - 1].n;
  return `<span class="cierre"><b>${fin.res}</b>` +
    (fin.motivo ? ` \u00b7 ${fin.motivo}` : "") +
    ` \u00b7 ${jugadas} jugadas</span>`;
}

const VERBO = { gane: "Gané", empate: "Empaté", perdi: "Perdí" };

/* Las filas del desglose: una por combinación de resultado y motivo, agrupadas
   por resultado —ganadas, empatadas, perdidas— y dentro de cada grupo de mayor
   a menor. Agrupar y no ordenar todo por cantidad es para poder barrer con el
   ojo "cómo gano" y "cómo pierdo" sin leer fila por fila.
   Las que no tienen resultado conocido no inventan una fila: van aparte. */
function filasDesenlace(ds) {
  const cuenta = new Map();
  for (const d of ds) {
    if (!d || !d.res) continue;
    const k = d.res + "|" + (d.motivo || "otro motivo");
    cuenta.set(k, (cuenta.get(k) || 0) + 1);
  }
  const orden = { gane: 0, empate: 1, perdi: 2 };
  return [...cuenta].map(([k, total]) => {
    const [res, motivo] = k.split("|");
    return { nombre: `${VERBO[res]} por ${motivo}`, total, res, motivo, malas: null };
  }).sort((a, b) => orden[a.res] - orden[b.res] || b.total - a.total ||
                    a.motivo.localeCompare(b.motivo));
}

const contarResultados = rs => ({
  gane: rs.filter(x => x === "gane").length,
  empate: rs.filter(x => x === "empate").length,
  perdi: rs.filter(x => x === "perdi").length,
  sinDato: rs.filter(x => !x).length,
});

/* De qué lado jugaba el usuario, leído del JSON del mes de chess.com.
   `ladoDelUsuario` contesta lo mismo mirando las cabeceras del PGN ya parseado,
   pero el listado del mes todavía no parseó nada: tiene el JSON y nada más.
   El usuario entra por parámetro y no por la global, para que la función sea
   pura y se pueda probar. */
function ladoEnJuego(g, usuario) {
  if (!usuario) return null;
  const u = usuario.toLowerCase();
  const b = ((g && g.white && g.white.username) || "").toLowerCase();
  const n = ((g && g.black && g.black.username) || "").toLowerCase();
  return b === u ? "w" : n === u ? "b" : null;
}

/* singular y plural: con una sola partida "1 empatadas" canta */
const cuantas = (k, una, muchas) => `${k} ${k === 1 ? una : muchas}`;

/* El historial en palabras y no como "8-4-3": esa abreviatura hay que
   decodificarla, y encima el orden cambia según el país.
   Lo escriben dos lugares —el listado del mes y la vista Mes—, y comparten esta
   función para que digan lo mismo con las mismas palabras. El denominador NO va
   acá: cada uno cuenta partidas distintas y lo dice por su cuenta (§5.1).
   Las que no tienen resultado conocido se nombran igual: callarlas dejaría
   creyendo que se contaron (§5.12). */
function textoMarcador(m) {
  const partes = [];
  if (m.gane + m.empate + m.perdi)
    partes.push(cuantas(m.gane, "ganada", "ganadas"),
                `${m.empate} tablas`,
                cuantas(m.perdi, "perdida", "perdidas"));
  if (m.sinDato)
    partes.push(cuantas(m.sinDato, "sin resultado conocido", "sin resultado conocido"));
  return partes.join(" \u00b7 ");
}

const esMala = f => f.perdida >= 3;
/* la del motor o la que la iguala: las tres categorías de "la mejor" */
const LA_MEJOR = new Set(["brillante", "genial", "mejor"]);
const esLaMejor = f => LA_MEJOR.has(f.cat);
/* la tasa de la mejor con la forma de una tasa de malas, para reusar
   `pct`, `textoPct` y `rangoWilson` sin una línea paralela */
const comoMejor = f => ({ nombre: f.nombre, malas: f.mejores, total: f.fueraDeLibro });
/* Además de la tasa de malas, la mediana de segundos pensados. Van juntas
   porque son la misma agrupación —las jugadas de dama, las del final— vista de
   dos maneras, y separarlas obligaría a filtrar dos veces lo mismo.
   Los segundos tienen su PROPIO denominador (`conSeg`) y no `total`: las
   partidas de otra cadencia cuentan para las malas y no para el tiempo. */
const tasa = (fs, nombre) => {
  const segs = [];
  for (const f of fs) if (f.seg != null) segs.push(f.seg);
  /* LA MEJOR (v0.157, Juan: las tablas no pueden contar solo errores).
     Sobre las jugadas fuera del libro: en el libro no se elige, así que
     contarlas achataría el tramo de la apertura. */
  const fuera = fs.filter(f => f.cat !== "libro");
  return { nombre, malas: fs.filter(esMala).length, total: fs.length,
           mejores: fuera.filter(esLaMejor).length, fueraDeLibro: fuera.length,
           conSeg: segs.length,
           /* NO el mínimo de 30: ese es para porcentajes. Una mediana es mucho
              más robusta que una tasa de casos raros —2 malas de 21 es ruido,
              12 tiempos ordenados no—, y el corte de 30 se lo puse por
              consistencia mal aplicada en la v0.43. Queda un piso bajo para que
              una "mediana" de dos valores no pase por resumen. */
           seg: segs.length >= NMIN_MEDIANA ? mediana(segs) : null };
};

/* La cadencia NO es un detalle de la columna de segundos: es el alcance de toda
   la vista. Diez segundos en un 5 min es muchísimo y en un 10 min no tanto
   (§7.8), pero el argumento no se queda ahí: la tasa de errores tampoco es la
   misma variable en bullet que en rapid, y "por tramo" menos todavía —el apuro
   final de un 3+0 no se parece al de un 15+10—. Así que TODOS los números de la
   vista Mes hablan de una sola cadencia, elegida en un selector, y la cabecera
   dice cuál y cuántas partidas quedaron afuera.

   Antes de la v0.46 esto era más chico: se elegía la dominante y las demás
   perdían solo el `seg`. Quedaban dos denominadores en la misma tabla —"Malas"
   de todas las partidas y "Seg." de una cadencia— y el título nombraba uno
   solo. Lo detectó el usuario mirando la pantalla. */

/* Cuántas partidas hay de cada cadencia, de mayor a menor. La clave es exacta
   —"300+0"— y el nombre es el que se muestra. Empatadas en partidas gana la que
   tiene más jugadas, y recién ahí el nombre, para que el orden no dependa de en
   qué orden vinieron las partidas. */
function censoCadencias(cadencias, porPartida) {
  const cuenta = new Map();
  cadencias.forEach((c, i) => {
    if (!c) return;
    const a = cuenta.get(c.clave) ||
      { clave: c.clave, nombre: c.nombre, partidas: 0, jugadas: 0 };
    a.partidas++; a.jugadas += (porPartida[i] || []).length;
    cuenta.set(c.clave, a);
  });
  return [...cuenta.values()].sort((a, b) =>
    b.partidas - a.partidas || b.jugadas - a.jugadas || a.nombre.localeCompare(b.nombre));
}

/* La pedida si sigue estando, y si no la que más partidas tiene. Cambiar de mes
   puede dejar sin partidas a la cadencia elegida: ahí se cae a la dominante en
   vez de mostrar una vista vacía. */
const elegirCadencia = (censo, pedida) =>
  censo.find(c => c.clave === pedida) || censo[0] || null;

/* El selector de cadencia. Se llena con lo que hay: no tiene sentido ofrecer
   cadencias que el usuario no jugó. Con una sola queda DESHABILITADO —decisión
   del usuario—: sigue viéndose, así que se lee como el alcance de la vista y no
   como un control que falta, pero no invita a tocar algo sin alternativas. */
function pintarSelectorCadencia(t) {
  const sel = $("cadencia");
  const censo = (t && t.censo) || [];
  const actual = t && t.cadencia ? t.cadencia.clave : "";
  sel.innerHTML = censo.map(c =>
    `<option value="${c.clave}"${c.clave === actual ? " selected" : ""}></option>`).join("");
  /* el texto por textContent y no interpolado: el nombre sale de números, pero
     la regla de la casa es que nada del PGN llegue al HTML sin pasar por acá */
  [...sel.options].forEach((o, i) => {
    o.textContent = `${censo[i].nombre} (${censo[i].partidas})`;
  });
  sel.disabled = censo.length < 2;
  ver("cadencia", censo.length > 0);
}

/* La frase que acompaña a cualquier tabla con segundos. El ALCANCE ya no va
   acá: lo dice la cabecera, una vez, para toda la vista. Acá queda lo que es
   propio de la columna. */
function textoTiempo(t) {
  return "Los segundos son la mediana de lo que se pensó esa jugada, no el " +
    "promedio: una sola jugada de tres minutos corre el promedio y no la " +
    "mediana." + (t && t.sinReloj
      ? ` ${t.sinReloj} partida(s) de esta cadencia no traen reloj y no cuentan.` : "");
}

/* un mecanismo contra su propia tasa base: las jugadas que lo tienen y el resto */
/* Por qué la columna "Malas" no coincide con la fila "Error grave" del resumen.
   Son dos cortes distintos y hasta ahora nada lo decía (§5 regla 4):
   - las tablas cuentan pérdida >= 3, siempre, en los dos modos;
   - la categoría reparte esas mismas jugadas: las de apertura van a "Libro" y
     las que además dejaron pasar mate o material van a "Omisión", así que no
     llegan a "Error grave";
   - "Omisión" además se lleva jugadas de pérdida menor a 3, que no son malas;
   - en modo amigable la categoría se decide por puntos de victoria, no por
     pérdida, así que un desplome de +10 a +6 es mala y sin embargo cae en
     "Bien". Ese es justamente el desplome desde posición ganada.
   El texto sale con los números del mes, para que se pueda comprobar. */
/* `deTodo` dice de dónde salen los números, igual que textoOrigen. Antes la
   frase decía "de este mes" fija, de cuando el mes era la única fuente posible:
   con el interruptor en "todo lo analizado" afirmaba algo falso sobre números
   que estaban bien. */
function textoDesglose(todas, deTodo) {
  const malas = todas.filter(esMala);
  if (!malas.length) return "";
  const en = k => malas.filter(f => f.cat === k).length;
  const grave = en("grave"), omision = en("omision"), libro = en("libro");
  const otras = malas.length - grave - omision - libro;
  const partes = [`${grave} como "Error grave"`];
  if (omision) partes.push(`${omision} como "Omisión", por dejar pasar mate o material`);
  if (libro) partes.push(`${libro} como "Libro"`);
  if (otras) partes.push(`${otras} con otra etiqueta, porque el modo elegido ` +
    "las mide por puntos de victoria y no por pérdida");
  const sueltas = todas.filter(f => f.cat === "omision" && !esMala(f)).length;
  return ` De las ${malas.length} jugadas malas de ${deTodo ? "todo lo analizado" : "este mes"}, el resumen etiqueta ` +
    partes.join(", ") + "." +
    (sueltas ? (sueltas === 1
      ? ' Otra jugada figura en "Omisión" sin ser mala: dejó pasar algo con una pérdida menor a 3.'
      : ` Otras ${sueltas} jugadas figuran en "Omisión" sin ser malas: dejaron ` +
        "pasar algo con una pérdida menor a 3.") : "");
}

/* ya no devuelve la tasa del complemento: la referencia es una sola y la pone
   tablaContrastes en la leyenda. Para volver atrás alcanza con agregar
   `sin: tasa(todas.filter(f => !test(f)))` acá y la columna allá. */
const contraste = (todas, test, nombre) => {
  const dentro = todas.filter(test);
  return { nombre, dentro, con: tasa(dentro) };
};

/* Dos mecanismos pueden darse en la misma jugada —dejar la pieza comible y
   además venir después de una mala, por ejemplo— y entonces las dos filas
   muestran en parte el mismo efecto. Se cuenta por identidad de objeto, porque
   todas las filas salen del mismo arreglo, así que el número es exacto.
   Cuando no hay solapamiento también se dice: callarse sería ambiguo, no se
   sabría si es que no lo hay o si no se calculó. */
function textoSolape(filas) {
  /* Si alguna fila no trae su conjunto no se puede saber, y decir que no se
     solapan sería afirmar algo que no medimos: mejor no decir nada. */
  if (filas.some(f => !f.dentro)) return "";
  const pares = [];
  for (let i = 0; i < filas.length; i++)
    for (let k = i + 1; k < filas.length; k++) {
      const a = new Set(filas[i].dentro);
      const n = filas[k].dentro.filter(f => a.has(f)).length;
      if (n) pares.push({ n, texto: `${n} entre "${filas[i].nombre}" y "${filas[k].nombre}"` });
    }
  if (!pares.length) return " Las filas no se solapan: ninguna jugada cae en dos.";
  const cola = ", así que parte de lo que muestran puede ser el mismo efecto " +
    "contado dos veces.";
  if (pares.length === 1)
    return pares[0].n === 1
      ? " Ojo: 1 jugada cae en las dos filas" + cola
      : ` Ojo: ${pares[0].n} jugadas caen en las dos filas` + cola;
  return ` Ojo, hay filas que se solapan (${pares.map(p => p.texto).join("; ")})` + cola;
}

/* LOS TITULARES DE LAS SECCIONES (v0.156). Se escriben en un <span class="tl">
   adentro del título; vacío, no se ve. La regla de fondo es la de §5: no se
   afirma lo que no está medido.
   - En las tablas de tasas y en Mecanismos se nombra una fila SOLO si se
     aparta de verdad: el piso de su rango de Wilson queda por encima de la
     tasa general de malas. Es conservador —la general incluye a la propia
     fila— y está bien que lo sea. Si se apartan varias, la de piso más alto
     y "y N más"; nunca una lista.
   - Con pocas malas en total, que los rangos se pisen es falta de datos y
     no parejura: por debajo de MIN_MALAS_TITULAR las cuatro quedan mudas y
     lo dice UNA vez `#capJugadas`, bajo el rótulo (`pocasMalas`).
   - La comparación va en el renglón ("contra tu 4 %"), para no tener que
     acordarse de la tasa general. */
const MIN_MALAS_TITULAR = 20;
const pocasMalas = general => general.malas < MIN_MALAS_TITULAR;
/* unas cuatro partidas: por debajo, ningún rango deja nombrar nada */
const MIN_JUGADAS_TITULAR = 150;
const pocasJugadas = general => general.total < MIN_JUGADAS_TITULAR;
function titular(idTabla, texto) {
  const tit = $(idTabla).closest("details").querySelector("summary .tit");
  let tl = tit.querySelector(".tl");
  if (!tl) { tl = document.createElement("span"); tl.className = "tl"; tit.appendChild(tl); }
  tl.textContent = texto || "";
}
/* por `pct`, que es el único lugar donde se calcula una tasa (prueba de §5) */
const porCiento = f => enteroPct(+pct(f), f.malas, f.total);
function titularTasas(filas, general, rotulo, soloMalas = false) {
  /* PRIMERO LO QUE SALE BIEN (v0.157; Juan: "muy centrado en jugadas
     malas"). Una fila se nombra si el piso de su rango de Wilson queda por
     encima de tu promedio: en "la mejor" (sale bien) o en malas (sale mal).
     Con pocas jugadas no se compara nada (lo dice una vez `#capJugadas`), y
     con pocas malas, las malas no. Mecanismos va `soloMalas`: es la única
     tabla que mira errores a propósito. */
  if (!general.total || pocasJugadas(general)) return "";
  const norm = filas.map(f => f.con ? Object.assign({}, f.con, { nombre: f.nombre }) : f)
                    .filter(f => f.total);
  const piso = f => rangoWilson(f.malas, f.total).lo;
  const porPiso = (a, b) => piso(b) - piso(a);
  const gm = comoMejor(general);
  const buenas = soloMalas || !gm.total ? []
    : norm.map(comoMejor).filter(f => f.total && piso(f) > +pct(gm)).sort(porPiso);
  const malas = pocasMalas(general) ? [] : norm.filter(f => piso(f) > +pct(general)).sort(porPiso);
  const n = buenas.length + malas.length;
  if (!n) return soloMalas ? (pocasMalas(general) ? "" : `Nada se aparta de tu ${porCiento(general)} de malas`)
                           : "Nada se aparta de tu promedio";
  const mas = n > 1 ? `\u00a0(y\u00a0${n - 1}\u00a0más)` : "";
  if (buenas.length)
    return `${rotulo(buenas[0].nombre)}: ${porCiento(buenas[0])} la mejor, contra tu ${porCiento(gm)}${mas}`;
  return `${rotulo(malas[0].nombre)}: ${porCiento(malas[0])} de malas, contra tu ${porCiento(general)}${mas}`;
}
const ARTICULO = { Torre: "la", Dama: "la" };
const rotuloPieza = n => `Con ${ARTICULO[n] || "el"} ${n.toLowerCase()}`;
const rotuloTramo = n => `Jugadas ${n}`;
const rotuloFranja = n => `Con ${n}`;

/* ================== fin del bloque de tablas =================== */
