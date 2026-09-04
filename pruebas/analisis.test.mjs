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
  assert.ok(/const pct = f => f\.total >= NMIN/.test(html));
  const propios = [...html.matchAll(/100 \* f\.malas \/ f\.total/g)];
  assert.equal(propios.length, 1, "hay un porcentaje calculado fuera de pct()");
});
