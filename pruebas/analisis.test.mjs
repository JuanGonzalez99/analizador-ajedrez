/* Pruebas del bloque de análisis. Correr: npm test */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import A from "./extraer.mjs";

const html = fs.readFileSync(new URL("../analizador.html", import.meta.url), "utf8");

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
