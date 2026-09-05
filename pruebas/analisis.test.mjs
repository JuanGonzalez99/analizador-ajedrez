/* Pruebas del bloque de análisis. Correr: npm test */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import A from "./extraer.mjs";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");

test("el bloque exporta lo que las pruebas necesitan", () => {
  for (const n of ["categorizar", "derivarFilas", "quedaComible", "winPct", "mediana"])
    assert.ok(n in A, `falta ${n}`);
});

/* --- geometría --- */

test("quedaComible: dama sola en casilla atacada por un peón", () => {
  /* dama blanca en d5, peón negro en e6: come y nadie recaptura */
  assert.equal(A.quedaComible("4k3/8/4p3/3Q4/8/8/8/4K3 b - - 0 1", "d5"), true);
});

test("quedaComible: no lo es si toda captura queda recapturada", () => {
  /* peón blanco en d5 defendido por peón en c4; el peón negro en e6 que lo coma
     queda recapturado, así que no cuenta como comible */
  assert.equal(A.quedaComible("4k3/8/4p3/3P4/2P5/8/8/4K3 b - - 0 1", "d5"), false);
});

/* --- evaluación --- */

test("winPct es monótona y simétrica en cero", () => {
  assert.equal(Math.round(A.winPct(0)), 50);
  assert.ok(A.winPct(100) > A.winPct(0));
  assert.ok(A.winPct(-100) < A.winPct(0));
  assert.ok(Math.abs(A.winPct(300) + A.winPct(-300) - 100) < 1e-9);
});

test("aBlancas invierte el signo cuando juegan las negras", () => {
  assert.equal(A.aBlancas({ cp: 120 }, "w"), 120);
  assert.equal(A.aBlancas({ cp: 120 }, "b"), -120);
});

test("mediana con cantidad par promedia los dos del medio", () => {
  assert.equal(A.mediana([1, 2, 3, 4]), 2.5);
  assert.equal(A.mediana([3, 1, 2]), 2);
});

/* --- categorías --- */

test("categorizar: libro gana a todo lo demás", () => {
  assert.equal(A.categorizar({ esLibro: true, perdida: 9, oportunidad: true }), "libro");
});

test("categorizar: una pérdida grande con oportunidad va a omisión, no a grave", () => {
  const d = { perdida: 5, caida: 40, oportunidad: true };
  assert.equal(A.categorizar(d, "critico"), "omision");
  assert.equal(A.categorizar({ ...d, oportunidad: false }, "critico"), "grave");
});

test("los dos modos usan los mismos datos y solo cambian la etiqueta", () => {
  assert.ok("critico" in A.CORTES && "amigable" in A.CORTES);
  assert.notEqual(A.CORTES.critico.medida, A.CORTES.amigable.medida);
});

/* --- tabla "Por color", sacada en v18 --- */

test('no queda rastro de la tabla "Por color"', () => {
  /* Medida sobre dos jugadores (8,1 vs 5,5 y 7,1 vs 6,5 con 1.239 jugadas): es
     ruido. Si vuelve a aparecer, es que alguien la reintrodujo sin datos nuevos. */
  for (const rastro of ["mesColor", "capColor", "Por color", "Con blancas"])
    assert.ok(!html.includes(rastro), `volvió "${rastro}"`);
});

/* --- mecanismo del peón, sacado en v19 --- */

test('no queda rastro del mecanismo "casilla atacada por un peón"', () => {
  /* Era un caso particular de "dejé comible la pieza que moví" y no se sostiene
     solo. Se fue el campo, la señal, la tabla y el helper peonAtaca. */
  for (const rastro of ["aPeon", "peonAtaca", "atacada por un peón"])
    assert.ok(!html.includes(rastro), `volvió "${rastro}"`);
});

test("derivarFilas ya no emite el campo aPeon", () => {
  const campos = html.slice(html.indexOf("filas.push({"), html.indexOf("filas.push({") + 400);
  assert.ok(!campos.includes("aPeon"));
  assert.ok(campos.includes("colgada"), "colgada sí tiene que seguir");
});

/* --- tabla de contrastes, v19 --- */

test("la tabla de mecanismos es de contrastes, no de filas sí/no", () => {
  assert.ok(html.includes('tablaContrastes("mesMecanismos"'));
  for (const fila of ['"No fui"', '"No la dejé"', '"Resto de las jugadas"'])
    assert.ok(!html.includes(fila), `quedó la fila ${fila}`);
});

test("todo porcentaje pasa por pct(), que aplica el mínimo de 30", () => {
  /* Regla §5.2: debajo de NMIN va un guion. Si alguna tabla vuelve a calcular
     el porcentaje por su cuenta, el corte se le escapa. */
  assert.ok(/f\.total >= NMIN/.test(html));
});

/* --- PGN sin línea en blanco entre cabeceras y jugadas, v0.40 --- */

test("normalizarPgn separa las cabeceras de las jugadas", () => {
  /* chess.js EXIGE esa línea en blanco y si falta no lee NADA: el error decía
     "no pude leer ese PGN" con las 77 jugadas legales. Caso real, reportado
     desde el celular. */
  const pegado = '[White "A"]\n[Black "B"]\n1. e4 e5 2. Nf3 *';
  assert.ok(A.normalizarPgn(pegado).includes(']\n\n1. e4'));
});

test("normalizarPgn no toca un PGN que ya está bien", () => {
  const bien = '[White "A"]\n[Black "B"]\n\n1. e4 e5 *';
  assert.equal(A.normalizarPgn(bien), bien);
});

test("normalizarPgn no se confunde con los relojes de chess.com", () => {
  /* Los PGN de chess.com traen {[%clk 0:05:00]} DENTRO de las jugadas, así que
     buscar el último "]" del texto daría un corte en el medio de la partida. */
  const conReloj = '[White "A"]\n1. e4 {[%clk 0:05:00]} 1... e5 {[%clk 0:04:58]} *';
  const salida = A.normalizarPgn(conReloj);
  assert.ok(salida.includes('[White "A"]\n\n1. e4'), salida);
  assert.ok(salida.includes('{[%clk 0:04:58]}'), "no se comió el cuerpo");
});

test("normalizarPgn aguanta un PGN sin cabeceras y saltos de Windows", () => {
  assert.equal(A.normalizarPgn("1. e4 e5 *"), "1. e4 e5 *");
  assert.ok(A.normalizarPgn('[White "A"]\r\n1. e4 *').includes(']\n\n1. e4'));
});

/* --- qué cuenta como jugada mala, v20 --- */

import T from "./extraer-tablas.mjs";

const jugada = (perdida, cat) => ({ perdida, cat });

test("esMala y pct son el único corte, y NMIN sigue en 30", () => {
  assert.equal(T.NMIN, 30);
  assert.equal(T.esMala(jugada(3, "grave")), true);
  assert.equal(T.esMala(jugada(2.99, "error")), false);
  assert.equal(T.pct({ malas: 3, total: 29 }), "\u2014", "debajo de 30 va guion");
  assert.equal(T.pct({ malas: 3, total: 30 }), "10.0");
});

test("toda leyenda de tabla dice qué cuenta como mala", () => {
  /* Se agrega sola en las dos funciones que pintan tablas, así que ninguna
     tabla nueva puede quedarse sin decirlo. */
  assert.ok(T.DEF_MALA.includes("3 peones"));
  const pinta = html.match(/\$\(idCap\)\.textContent = [^;]+;/g) || [];
  assert.equal(pinta.length, 3, "hay tres funciones que pintan leyenda");
  assert.equal(pinta.filter(l => l.includes("DEF_MALA")).length, 2,
    "las dos tablas de tasas la llevan");
  /* La de reparto no: sus porcentajes no son tasas de jugadas malas. Pero tiene
     que decir su denominador igual, que es la regla §5.1. */
  const reparto = pinta.find(l => !l.includes("DEF_MALA"));
  assert.ok(reparto.includes("situaciones"), `sin denominador: ${reparto}`);
});

test("el desglose concilia la columna Malas con las categorías del resumen", () => {
  const todas = [
    ...Array(4).fill(0).map(() => jugada(5, "grave")),
    ...Array(2).fill(0).map(() => jugada(5, "omision")),
    jugada(5, "libro"),
    jugada(5, "bien"),          // modo amigable: mala pero etiquetada bien
    jugada(1.5, "omision"),     // omisión que no es mala
    jugada(0.2, "mejor"),
  ];
  const t = T.textoDesglose(todas);
  assert.ok(t.includes("De las 8 jugadas malas"), t);
  assert.ok(t.includes('4 como "Error grave"'), t);
  assert.ok(t.includes('2 como "Omisión"'), t);
  assert.ok(t.includes('1 como "Libro"'), t);
  assert.ok(t.includes("1 con otra etiqueta"), t);
  assert.ok(t.includes('Otra jugada figura en "Omisión" sin ser mala'), t);
});

test("sin jugadas malas el desglose no dice nada", () => {
  assert.equal(T.textoDesglose([jugada(0.2, "mejor")]), "");
});

/* --- ganadas, empatadas y perdidas, v0.39 --- */

test("el resultado se lee desde el lado del usuario", () => {
  const gana = (quien) => ({ white: { result: quien === "w" ? "win" : "resigned" },
                             black: { result: quien === "b" ? "win" : "resigned" } });
  assert.equal(T.resultadoDeLado("w", gana("w")), "gane");
  assert.equal(T.resultadoDeLado("b", gana("w")), "perdi");
  assert.equal(T.resultadoDeLado("b", gana("b")), "gane");
  assert.equal(T.resultadoDeLado("w", gana("b")), "perdi");
});

test("sin ganador es empate, cualquiera sea el motivo", () => {
  for (const motivo of ["agreed", "repetition", "stalemate", "insufficient", "50move"])
    assert.equal(T.resultadoDeLado("w", { white: { result: motivo }, black: { result: motivo } }),
      "empate", motivo);
});

test("sin meta cae al encabezado Result del PGN", () => {
  /* una partida pegada a mano no tiene el JSON de chess.com */
  assert.equal(T.resultadoDeLado("b", null, { Result: "0-1" }), "gane");
  assert.equal(T.resultadoDeLado("b", null, { Result: "1-0" }), "perdi");
  assert.equal(T.resultadoDeLado("w", null, { Result: "1/2-1/2" }), "empate");
});

test("no saber el resultado no es empatar", () => {
  /* Contar un desconocido como tablas sería inventar un resultado. Pasa con una
     partida sin terminar, y con una en la que no se sabe de qué lado jugaba. */
  assert.equal(T.resultadoDeLado("w", null, { Result: "*" }), null);
  assert.equal(T.resultadoDeLado("w", null, {}), null);
  assert.equal(T.resultadoDeLado(null, { white: { result: "win" }, black: { result: "resigned" } }), null);
  const c = T.contarResultados(["gane", "empate", null, "perdi", null]);
  assert.deepEqual(c, { gane: 1, empate: 1, perdi: 1, sinDato: 2 });
});

test("el historial se cuenta sobre las mismas partidas que los promedios", () => {
  /* Si el historial contara las asistidas y los promedios no, habría dos
     totales distintos para lo mismo. En "todo lo analizado" las asistidas ni
     se guardan, así que la única opción coherente es excluirlas en los dos. */
  assert.ok(html.includes("const conMias = limpias.filter(r => filasDelUsuario(r).length)"));
  assert.ok(html.includes("conMias.map(r => resultadoDeLado(ladoDelUsuario(r), r.meta, r.cab))"));
});

/* --- el marcador del listado del mes, v0.42 --- */

test("el lado se saca del JSON del mes, sin importar mayúsculas", () => {
  const g = { white: { username: "JuanGonzalez99" }, black: { username: "Rival" } };
  assert.equal(T.ladoEnJuego(g, "juangonzalez99"), "w");
  assert.equal(T.ladoEnJuego(g, "RIVAL"), "b");
});

test("si el usuario no juega la partida, no hay lado", () => {
  /* y sin lado resultadoDeLado devuelve null, que es "no se sabe" y no "empate" */
  const g = { white: { username: "uno" }, black: { username: "otro" } };
  assert.equal(T.ladoEnJuego(g, "tercero"), null);
  assert.equal(T.ladoEnJuego(g, ""), null);
  assert.equal(T.ladoEnJuego({}, "uno"), null);
  assert.equal(T.resultadoDeLado(T.ladoEnJuego(g, "tercero"), g, null), null);
});

test("el marcador se escribe en palabras, en singular y en plural", () => {
  assert.equal(T.textoMarcador({ gane: 7, empate: 3, perdi: 5, sinDato: 0 }),
    "7 ganadas · 3 empatadas · 5 perdidas");
  assert.equal(T.textoMarcador({ gane: 1, empate: 1, perdi: 1, sinDato: 0 }),
    "1 ganada · 1 empatada · 1 perdida");
});

test("las partidas sin resultado conocido se nombran, no se callan", () => {
  /* §5.12: callarlas deja creyendo que se contaron y dieron cero. */
  assert.equal(T.textoMarcador({ gane: 2, empate: 0, perdi: 1, sinDato: 1 }),
    "2 ganadas · 0 empatadas · 1 perdida · 1 sin resultado conocido");
  assert.equal(T.textoMarcador({ gane: 0, empate: 0, perdi: 0, sinDato: 2 }),
    "2 sin resultado conocido");
});

test("sin ninguna partida el marcador no dice nada", () => {
  assert.equal(T.textoMarcador(T.contarResultados([])), "");
});

test("los dos marcadores usan las mismas palabras y dicen de qué partidas hablan", () => {
  /* Si cada uno escribiera su texto, se irían separando. Y como cuentan
     partidas distintas —el listado todas las del mes, la vista Mes solo las
     analizadas y sin asistencia— el del listado lleva su denominador (§5.1). */
  assert.ok(html.includes('const marcadorMes = textoMarcador(d.marcador);'));
  assert.ok(html.includes('`${cuantas(PARTIDAS.length, "partida", "partidas")} del mes`'));
});

test("el marcador del listado no necesita análisis", () => {
  /* Sale del JSON que ya se descargó. Si alguna vez pasara por MES o por la
     caché, dejaría de verse antes de analizar, que es todo el punto. */
  const bloque = html.slice(html.indexOf("async function cargarMes"),
                            html.indexOf('$("partidas").innerHTML = PARTIDAS.map'));
  assert.ok(bloque.includes("PARTIDAS.map(g => resultadoDeLado(ladoEnJuego(g, USUARIO), g, null))"));
  assert.ok(!/\bMES\.|cache\./.test(bloque));
});

/* --- el conmutador Partida / Mes, v0.38 --- */

test("solo mostrarVista prende y apaga las zonas de las dos vistas", () => {
  /* Con dos vistas equivalentes, un ver() suelto en cualquier final de análisis
     las desincroniza: quedan las dos visibles, o ninguna, o una pestaña que no
     corresponde. Tiene que haber una sola puerta. */
  const cuerpo = html.slice(html.indexOf("function mostrarVista"),
                            html.indexOf("function volverAlMes"));
  /* se cuenta por subcadena y no con expresión regular: el paréntesis obliga a
     escapar y es justo donde se rompe sin que nadie lo note */
  const contar = (texto, sub) => texto.split(sub).length - 1;
  for (const z of ["zonaRevision", "zonaResumen", "zonaMes"]) {
    const marca = `ver("${z}"`;
    assert.equal(contar(html, marca), contar(cuerpo, marca),
      `${z} se prende o apaga fuera de mostrarVista`);
  }
});

test("solo el salto desde la lista del mes empuja historial", () => {
  /* Conmutar con la pestaña es navegación deliberada y no tiene un "de dónde
     venías"; empujarla también dejaría el historial lleno de entradas que no
     significan nada. */
  assert.equal((html.match(/history\.pushState/g) || []).length, 1);
  assert.ok(html.includes('history.pushState({ vista: "partida" }, "", location.href)'),
    "sobre la misma url, o una recarga da 404 en GitHub Pages");
});

/* --- de dónde salen los números, v0.36 --- */

test("el desglose dice si los números son del mes o de todo lo analizado", () => {
  const todas = [jugada(5, "grave")];
  assert.ok(T.textoDesglose(todas, false).includes("de este mes"));
  assert.ok(T.textoDesglose(todas, true).includes("de todo lo analizado"));
  /* sin el argumento se comporta como antes: es del mes */
  assert.ok(T.textoDesglose(todas).includes("de este mes"));
});

/* --- la columna "% resto" se fue, v0.36 --- */

test("la tabla de mecanismos no trae la columna % resto", () => {
  /* se mira la celda de encabezado y no el archivo entero: el comentario que
     explica por qué se sacó también nombra la columna */
  assert.ok(!html.includes(">% resto<"),
    "la columna mezclaba dos denominadores distintos sin decirlo");
});

test("la referencia de los mecanismos va en la leyenda, con su denominador", () => {
  assert.ok(html.includes("Referencia: ${base.malas} de tus ${base.total} jugadas"),
    "sin la referencia el porcentaje de un mecanismo no dice nada (§5.7)");
  assert.ok(html.includes('"Mecanismo", tasa(todas))'),
    "la base tiene que ser todas las jugadas del usuario, una sola y bien definida");
});

/* --- franjas de ventaja por el camino común, v20 (arreglo 5) --- */

test("la tabla de franjas ya no se pinta sola", () => {
  assert.ok(html.includes('tablaTasas("mesFranja", "capMesFranja"'));
  assert.ok(!html.includes('$("mesFranja").innerHTML = `'),
    "volvió a armarse su propio HTML y se saltea el mínimo de 30");
});

test("ninguna tabla calcula el porcentaje por su cuenta", () => {
  /* Más ancho que la prueba anterior: cualquier "100 * algo / algo" suelto. */
  const permitido = {
    "100 * f.malas / f.total": "const pct = f =>",    // la tasa, una sola vez
    "100 * f.total / total": "function tablaReparto",  // el reparto, adentro suyo
  };
  const sueltos = [...html.matchAll(/100 \* \w[\w.]* \/ \w[\w.]*/g)].map(m => m[0]);
  assert.ok(sueltos.length, "no quedó ningún cálculo de porcentaje");
  for (const c of sueltos) {
    const duenio = permitido[c];
    assert.ok(duenio, `porcentaje nuevo sin dueño: ${c}`);
    const i = html.indexOf(duenio);
    assert.ok(i >= 0 && html.indexOf(c) > i && html.indexOf(c) - i < 900,
      `${c} calculado fuera de ${duenio}`);
  }
});

/* --- buena captura decidida por el motor, v22 --- */

test("capturaBuena pide las dos cosas: mejor del motor Y ganar material", () => {
  /* torre negra en d5 sin defensa, dama blanca en d1: Dxd5 gana torre */
  const fen = "4k3/8/8/3r4/8/8/8/3QK3 w - - 0 1";
  assert.ok(A.capturaBuena(fen, "d1d5"), "gana torre y es la mejor: es buena");
  assert.equal(A.capturaBuena(fen, "d1d3"), null, "no es captura: no es buena");
});

test("capturaBuena descarta el intercambio que no gana material", () => {
  /* torre por torre, con la torre negra defendida por su rey en d6: come 5 y
     le recomen 5, ganancia 0. Verificado con chess.js, no de memoria (§5.6). */
  const fen = "8/8/3k4/3r4/8/8/8/3RK3 w - - 0 1";
  assert.equal(A.capturaBuena(fen, "d1d5"), null);
});

test("capturaBuena aguanta una jugada mejor que no existe o viene rota", () => {
  const fen = "4k3/8/8/3r4/8/8/8/3QK3 w - - 0 1";
  for (const m of [null, undefined, "", "d1"]) assert.equal(A.capturaBuena(fen, m), null);
});

test("no queda rastro de la definición vieja, de material", () => {
  for (const rastro of ["capDisponible", "tomoGanadora", "captura ganadora y la tomé"])
    assert.ok(!html.includes(rastro), `volvió "${rastro}"`);
});

test("tomoBuena exige haber jugado la mejor del motor", () => {
  /* Es lo que hace imposible la fila contradictoria: si jugaste la mejor, la
     pérdida es cero, así que "la vi y la tomé" no puede contar jugadas malas. */
  assert.ok(html.includes("const tomoBuena = esMejor && !!capB;"));
});

test("el canario vive en la columna Malas, no en el porcentaje", () => {
  /* Guion cuando da cero, que es lo que tiene que pasar siempre; el número
     crudo si alguna vez no da cero, porque entonces hay algo para revisar. */
  const i = html.indexOf("f.canario && !f.malas");
  assert.ok(i > 0, "se perdió el canario");
  const guion = String.fromCharCode(34, 92) + "u2014" + String.fromCharCode(34);
  assert.ok(html.slice(i).startsWith(`f.canario && !f.malas ? ${guion} : f.malas`),
    html.slice(i, i + 70));
  const cuerpoPct = html.slice(html.indexOf("const pct = f =>"), html.indexOf("const esMala"));
  assert.ok(!cuerpoPct.includes("canario"), "pct() ya no tiene que saber del canario");
});

test("la tabla de capturas reparte las tres cosas que se pueden hacer", () => {
  assert.ok(html.includes('tablaReparto("mesCapturas"'));
  for (const fila of ['"La vi y la tomé"', '"Tomé otra"', '"No capturé"'])
    assert.ok(html.includes(fila), `falta la fila ${fila}`);
  assert.ok(html.includes("{ canario: true }"), "la fila 1 tiene que ser canario");
  /* La fila de contraste se fue: en un reparto no tiene sentido, porque las
     tres filas parten un mismo total y los porcentajes ya suman 100. */
  assert.ok(!html.includes('"No había buena captura"'));
});

test("las tres filas del reparto son excluyentes y cubren todo el grupo", () => {
  const en = [f => f.tomoBuena, f => !f.tomoBuena && f.esCaptura,
              f => !f.tomoBuena && !f.esCaptura];
  for (const f of [{ tomoBuena: true, esCaptura: true },
                   { tomoBuena: false, esCaptura: true },
                   { tomoBuena: false, esCaptura: false }])
    assert.equal(en.filter(t => t(f)).length, 1, `${JSON.stringify(f)} cae en una sola fila`);
});

/* --- Omisión con el mismo juez, v23 --- */

test("Omisión por material la decide el motor, no la heurística", () => {
  assert.ok(html.includes("if (!oportunidad && !tomoBuena && capB)"));
  assert.ok(!html.includes("capDisp"), "quedó la variable de la definición vieja");
});

test("capturaGanadora se fue, porque ya no la usa nadie", () => {
  assert.ok(!html.includes("capturaGanadora"));
  assert.ok("gananciaDeCaptura" in A, "esta sí se sigue usando");
  assert.ok("entregaMaterial" in A);
});

test("capturar otra cosa ya no tapa la omisión", () => {
  /* Antes la condición era !j.captured: si capturabas cualquier otra cosa, la
     omisión no se registraba. Ahora la condición es no haber jugado la buena. */
  assert.ok(!html.includes("!j.captured && cap"));
});

test("una jugada que deja pasar material y pierde >= 3 cae en Omisión", () => {
  const base = { perdida: 5, caida: 40, esMejor: false, esLibro: false, entrega: false,
                 unicaBuena: false, legales: 20, antesMio: 0, despuesMio: 0 };
  assert.equal(A.categorizar({ ...base, oportunidad: { tipo: "material" } }), "omision");
  assert.equal(A.categorizar({ ...base, oportunidad: null }), "grave");
});

/* --- solapamiento entre mecanismos, v25 --- */

const jug = i => ({ i, perdida: 0.2 });

test("el solapamiento se cuenta por identidad y es exacto", () => {
  const a = [jug(1), jug(2), jug(3)];
  const dos = T.textoSolape([{ nombre: "A", dentro: a },
                             { nombre: "B", dentro: [a[0], a[1], jug(9)] }]);
  assert.ok(dos.includes("2 jugadas caen en las dos filas"), dos);
});

test("una sola jugada solapada se dice en singular", () => {
  const a = [jug(1), jug(2)];
  assert.ok(T.textoSolape([{ nombre: "A", dentro: a },
                           { nombre: "B", dentro: [a[0]] }])
    .includes("1 jugada cae en las dos filas"));
});

test("cuando no se solapan lo dice igual, en vez de callarse", () => {
  /* Callarse sería ambiguo: no se sabría si no hay solapamiento o si no se
     calculó. Son dos cosas distintas y el lector no puede distinguirlas. */
  assert.ok(T.textoSolape([{ nombre: "A", dentro: [jug(1)] },
                           { nombre: "B", dentro: [jug(2)] }])
    .includes("no se solapan"));
});

test("si una fila no trae su conjunto, no se afirma nada", () => {
  assert.equal(T.textoSolape([{ nombre: "A" }, { nombre: "B", dentro: [jug(1)] }]), "");
});

test("con más de dos filas nombra cada par que se solapa", () => {
  const a = [jug(1), jug(2)];
  const t = T.textoSolape([{ nombre: "A", dentro: a }, { nombre: "B", dentro: [a[0]] },
                           { nombre: "C", dentro: [a[1]] }]);
  assert.ok(t.includes('1 entre "A" y "B"') && t.includes('1 entre "A" y "C"'), t);
});

test("la fila de mecanismos armada a mano también lleva su conjunto", () => {
  /* Si se olvida, textoSolape se calla y el aviso desaparece sin ruido. */
  assert.ok(html.includes("dentro: trasMala"));
  assert.ok(html.includes("const dentro = todas.filter(test);"));
});

/* --- todo lo analizado, v26 --- */

test("cada fila trae las dos etiquetas, y cat es la del modo pedido", () => {
  /* Es lo que permite cambiar de modo sin haber guardado las evaluaciones. */
  const pgn = "[White \"a\"]\n[Black \"b\"]\n\n1. e4 e5 2. Qh5 Nc6 3. Bc4 Nf6 4. Qxf7# 1-0";
  const { jugadas, fens } = A.prepararPartida(pgn);
  const evs = fens.map(() => ({ cp: 0, mate: null, mejor: "a2a3", segunda: null }));
  for (const modo of ["critico", "amigable"]) {
    const libro = { pos: new Set(), nombres: {} };
    const { filas } = A.derivarFilas(jugadas, fens, evs, libro, 0, modo);
    assert.ok(filas.length);
    for (const f of filas) {
      assert.ok(f.cats && "critico" in f.cats && "amigable" in f.cats, "faltan las dos");
      assert.equal(f.cat, f.cats[modo], "cat tiene que ser la del modo pedido");
    }
  }
});

test("las dos etiquetas se calculan sobre los mismos datos", () => {
  /* Un desplome de +10 a +6: grave en crítico, bien en amigable. Si alguna vez
     dieran lo mismo siempre, el modo dejó de tener efecto. */
  const d = { perdida: 4, caida: 3, esMejor: false, esLibro: false, entrega: false,
              unicaBuena: false, oportunidad: null, legales: 20,
              antesMio: 10, despuesMio: 6 };
  assert.equal(A.categorizar(d, "critico"), "grave");
  assert.equal(A.categorizar(d, "amigable"), "bien");
});

test("la fila flaca lleva lo que las tablas usan y nada más", () => {
  const campos = (html.match(/const CAMPOS_FLACOS = \[([^\]]+)\]/) || [])[1];
  assert.ok(campos, "se perdió CAMPOS_FLACOS");
  for (const c of ["cats", "perdida", "precision", "franja", "pieza", "esCaptura",
                   "colgada", "capBuena", "tomoBuena", "n"])
    assert.ok(campos.includes(`"${c}"`), `falta ${c}, alguna tabla se va a romper`);
  for (const pesado of ["fens", "evs", "jugadas", "senales", "fen", "meta"])
    assert.ok(!campos.includes(`"${pesado}"`), `${pesado} no tiene por qué viajar`);
});

test("la lista de partidas no pasa por el interruptor", () => {
  const lista = html.slice(html.indexOf("function pintarLista"),
                           html.indexOf("function pintarLista") + 600);
  assert.ok(lista.includes("MES.resultados"), "la lista sale del mes elegido");
  assert.ok(!lista.includes("TODO"), "y nunca de lo acumulado");
});

test("el barrido no toca el motor", () => {
  const barrido = html.slice(html.indexOf("async function barrerCache"),
                             html.indexOf("function reDerivar"));
  for (const motor of ["evaluarPosiciones", "new Motor", "analizarPartida", "grupo"])
    assert.ok(!barrido.includes(motor), `el barrido llama a ${motor}`);
  assert.ok(barrido.includes("cache.leer"), "tiene que salir de la caché");
});

test("lo juntado se descarta cuando deja de corresponder", () => {
  /* La clave de la caché lleva profundidad y variante: si cambian, lo barrido
     es de otra cosa. Y al analizar partidas nuevas queda corto. */
  assert.ok(html.includes('["prof", "optMpv", "optLimpiar", "optBarrido", "optBloques"]'));
  assert.ok(html.includes("barrido descartado: cambió la configuración"));
  assert.ok(html.includes("barrido descartado: se van a analizar partidas nuevas"));
});
