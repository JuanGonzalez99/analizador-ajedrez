/* Pruebas del bloque de análisis. Correr: npm test */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import A from "./extraer.mjs";
import { Chess } from "../chess.js";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");

test("el bloque exporta lo que las pruebas necesitan", () => {
  for (const n of ["categorizar", "derivarFilas", "quedaComible", "winPct", "mediana", "piezasComidas"])
    assert.ok(n in A, `falta ${n}`);
});

/* --- geometría --- */

test("quedaComible: dama sola en casilla atacada por un peón", () => {
  /* dama blanca en d5, peón negro en e6: come y nadie recaptura */
  assert.equal(A.quedaComible("4k3/8/4p3/3Q4/8/8/8/4K3 b - - 0 1", "d5"), true);
});

/* v0.180.1: la clavada contra la dama (chess.js solo frena la clavada al rey) */
test("quedaComible: la captura que destapa la dama propia no cuenta", () => {
  /* exd5 deja la dama de e8 a tiro de la torre de e1 */
  assert.equal(A.quedaComible("4q1k1/8/4p3/3N4/8/8/8/4R1K1 b - - 0 1", "d5"), false);
  assert.equal(A.quedaComible("4q1k1/8/4p3/3N4/8/8/8/6K1 b - - 0 1", "d5"), true);
});
test("cambioEn: la recaptura clavada contra la dama no cuenta", () => {
  /* exf4 destapa la dama de e1 a la torre de e8: el caballo se pierde entero */
  const c = A.cambioEn("4r1k1/8/8/6p1/5N2/4P3/8/4Q1K1 b - - 0 1", "f4");
  assert.equal(c.neto, 3);
  assert.deepEqual(c.linea.map(m => m.san), ["gxf4"]);
  assert.equal(A.cambioEn("4r1k1/8/8/6p1/5N2/4P3/8/6K1 b - - 0 1", "f4").neto, 2);
  assert.equal(A.quedaComible("4r1k1/8/8/6p1/5N2/4P3/8/4Q1K1 b - - 0 1", "f4"), true);
});
test("destapaLaDama: la dama que ya estaba atacada no es culpa de la jugada", () => {
  /* la torre de e1 ya mira la dama de e4; mover el peón de a7 no destapa nada */
  assert.equal(A.destapaLaDama("6k1/p7/8/8/4q3/8/8/4R1K1 b - - 0 1", { from: "a7", to: "a6", piece: "p", color: "b" }), null);
  /* la dama que se mueve sola no entra: su riesgo lo cuenta el cambio */
  assert.equal(A.destapaLaDama("4q1k1/8/8/8/8/8/8/4R1K1 b - - 0 1", { from: "e8", to: "e5", piece: "q", color: "b" }), null);
});
test("la captura que gana más de lo que entrega sigue contando (revisor, v0.180.1)", () => {
  /* Qd5?? exd5 Rxe8+ Kxe8: el negro gana dama y torre por su dama */
  const f = "4qk2/8/4p3/3Q4/8/8/8/4R1K1 b - - 0 1";
  assert.equal(A.quedaComible(f, "d5"), true);
  /* 9 hasta la v1.0.1; desde la v1.0.2 la cuenta ve que exd5 destapa la e
     (Rxe8+ Kxe8) y da lo neto: dama y torre por la dama, 5 */
  assert.equal(A.cambioEn(f, "d5").neto, 5);
  /* con una torre: torre + torre por la dama, todavía +1 */
  assert.equal(A.quedaComible("4qk2/8/4p3/3R4/8/8/8/4R1K1 b - - 0 1", "d5"), true);
});
test("la cuenta del cambio ve lo que deja la pieza que come (v1.0.2)", () => {
  /* Bh6 Nxh6?? Qxf6: el caballo de g8 cuidaba la dama. Y Bxf7+ Qxf7 Qxh8: la
     dama de f6 cuidaba la torre (con el rey en jaque, la cuenta de antes
     daba la torre por colgada desde antes) */
  const f = "r1b1k1nr/pppp1pQp/2n2q2/8/2B1P3/8/PPP2PPP/RNB1K2R w KQkq - 0 1";
  for (const san of ["Bh6", "Bxf7+"]) {
    const j = new Chess(f); const m = j.move(san);
    assert.equal(A.cambioEn(j.fen(), m.to).neto, 0, san);
  }
  /* lo que ya estaba colgado no es culpa de la captura: Rxe7 sigue ganando
     la dama aunque el peón de a7 esté a tiro desde antes */
  assert.equal(A.cambioEn("4r1k1/p3Q3/8/8/8/8/8/R5K1 b - - 0 1", "e7").neto, 9);
  /* y "queda comible" vuelve cuando del rival no se va nada: Nd5 exd5 y
     recapturar con la torre pierde la torre (cxd5) */
  const d5 = mirar("4k3/8/2p1p3/8/8/2N5/8/3RK3 w - - 0 1", "c3d5");
  assert.deepEqual(d5.cambio && d5.cambio.suyas, []);
  const evs = [{ cp: 0, mate: null, mejor: "e1e2", segunda: { cp: -10, mate: null } },
               { cp: 300, mate: null, mejor: "e6d5", segunda: null }];
  const fd5 = "4k3/8/2p1p3/8/8/2N5/8/3RK3 w - - 0 1";
  assert.ok(A.explicarJugada(unaFila(fd5, "Nd5", evs), null, true, null, d5).startsWith("Tu caballo queda comible en d5."));
  /* lo que se cobra afuera se nombra: Ne5 Nxe5 deja el peón de d4 (cxd4) */
  const ne5 = mirar("r1bqk2r/pppp1ppp/2n2n2/2b5/2BpP3/2P2N2/PP3PPP/RNBQK2R w KQkq - 0 6", "f3e5");
  assert.deepEqual(ne5.cambio, { pierde: 2, mias: ["n"], suyas: ["p"] });
  /* revisor de ajedrez: lo que ya se podía comer no se nombra entero. Ng5
     Nxg5 con bxc3 posible desde antes decía "tu caballo por un alfil" */
  const c3 = "r1bqk2r/pppp1ppp/2n5/8/2BPn3/2b2N2/PP3PPP/R1BQ1RK1 w kq - 0 9";
  for (const uci of ["f3g5", "c1g5"]) assert.deepEqual(mirar(c3, uci).cambio.suyas, [], uci);
  /* y con un solo peón, la frase solo si el motor come ahí: g4 con la dama
     colgada en d7 (el motor juega Qxd7) no dice "queda comible en g4" */
  const g4 = "1nbq1bnr/1p1Qpkp1/5p1r/7p/7P/4P3/PPPP1PP1/RNB1KBNR w KQ - 1 7";
  const og4 = mirar(g4, "g2g4");
  assert.equal(og4.cambio && og4.cambio.pierde, 1);
  const evg = rival => [{ cp: 0, mate: null, mejor: "d7c8", segunda: { cp: -10, mate: null } },
                        { cp: 1500, mate: null, mejor: rival, segunda: null }];
  assert.ok(!A.explicarJugada(unaFila(g4, "g4", evg("d8d7")), null, true, null, og4).includes("g4"));
  assert.ok(A.explicarJugada(unaFila(g4, "g4", evg("h5g4")), null, true, null, og4).startsWith("Tu peón queda comible en g4."));
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

test("categorizar: una pérdida grande es Grave aunque hubiera material para tomar (v0.134)", () => {
  /* Hasta la v0.133 era al revés y salía "Omisión: había Qxg3, que ganaba un
     peón" sobre una jugada que perdía 5,92 (H1 de la revisión). El mate
     soltado sigue siendo Omisión: ahí la pérdida está saturada. */
  const d = { perdida: 5, caida: 40, oportunidad: { tipo: "material" } };
  assert.equal(A.categorizar(d, "critico"), "grave");
  assert.equal(A.categorizar({ ...d, perdida: 1.5 }, "critico"), "omision");
  assert.equal(A.categorizar({ ...d, oportunidad: { tipo: "mate", n: 2 } }, "critico"), "omision");
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
  /* Sin ventana de N caracteres: se mira desde el push HASTA EL RETURN, que es
     exactamente el bloque de campos. La ventana de 400 se rompió sola en la
     v0.61 al agregar un comentario adentro del push, sin que hubiera nada mal;
     es el mismo fallo que tuvo el chequeo 2 de estaticos.mjs con su ventana de
     200, y la lección ya estaba escrita. */
  const campos = html.slice(html.indexOf("filas.push({"),
                            html.indexOf("return { filas, apertura };"));
  assert.ok(!campos.includes("aPeon"));
  assert.ok(campos.includes("colgada"), "colgada sí tiene que seguir");
});

/* --- tabla de contrastes, v19 --- */

test("la tabla de mecanismos es de contrastes, no de filas sí/no", () => {
  assert.ok(html.includes('tablaContrastes("mesMecanismos"'));
  for (const fila of ['"No fui"', '"No la dejé"', '"Resto de las jugadas"'])
    assert.ok(!html.includes(fila), `quedó la fila ${fila}`);
});

test("toda tasa pasa por textoPct(), que le pone su margen", () => {
  /* Si alguna tabla vuelve a calcular la tasa por su cuenta, se le escapa el
     margen y queda un numero pelado que se lee como firme. */
  assert.ok(html.includes("function textoPct(f) {"));
  assert.ok(!/\bNMIN\b(?!_MEDIANA)/.test(html), "no quedan cortes por cantidad");
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

test("esMala es el único corte que queda por cantidad", () => {
  assert.equal(T.esMala(jugada(3, "grave")), true);
  assert.equal(T.esMala(jugada(2.99, "error")), false);
  assert.equal(T.pct({ malas: 3, total: 29 }), "10.3");
  assert.equal(T.pct({ malas: 3, total: 30 }), "10.0");
  assert.equal(T.pct({ malas: 0, total: 0 }), "\u2014", "sin casos no hay porcentaje");
});

/* --- el numero flojo se marca en vez de esconderse, v0.48 --- */

test("el margen va SIEMPRE, no solo con pocos casos", () => {
  /* Habia un corte en 30 y se cayo con el mismo argumento que el guion: "3 de
     29" mostraba margen de 22,8 puntos y "3 de 30" lo escondia con 22,2. La
     misma incertidumbre y tratamiento opuesto. */
  assert.match(T.textoPct({ malas: 3, total: 30 }), /\(3\u201326\)/);
  assert.match(T.textoPct({ malas: 32, total: 320 }), /\(7\u201314\)/);
  /* y el ancho del parentesis es el semaforo: firme se ve angosto */
  const ancho = t => { const m = t.match(/\((\d+)\u2013(\d+)\)/); return +m[2] - +m[1]; };
  assert.ok(ancho(T.textoPct({ malas: 32, total: 320 })) <
            ancho(T.textoPct({ malas: 3, total: 30 })));
});

test("con pocos casos aparece el margen, no un guion", () => {
  /* 3 de 21: el rango va de 5 a 35. El guion escondia el numero y ademas no
     distinguia una fila de 21 de una de 29. */
  const t = T.textoPct({ malas: 3, total: 21 }, "rango");
  assert.match(t, /^14\u00a0%/, "entero, con espacio duro (v0.158)");
  assert.match(t, /\(5\u201335\)/);
  assert.ok(t.includes('class="rango"'));
});

test("la columna de tasas se llama Tasa, y la de reparto sigue siendo %", () => {
  /* Son dos cosas distintas: una estima una propension y la otra reparte un
     conjunto cerrado. Y un "%" solo, en una columna ancha, flotaba sin decir de
     que era. */
  /* desde la v0.157 las tablas de tasas dicen QUÉ tasa: "La mejor" y
     "Malas"; la de contrastes (Mecanismos) sigue con "Tasa" */
  assert.equal((html.match(/<th>Tasa<\/th>/g) || []).length, 1);
  assert.ok(html.includes("<th>Jugadas</th><th>La mejor</th><th>Malas</th>"));
  const rep = html.slice(html.indexOf("function tablaReparto"));
  assert.ok(rep.slice(0, rep.indexOf("\n}")).includes("<th>%</th>"),
    "el reparto no es una tasa");
});

test("el margen va en su propio renglon, o se desalinea la columna", () => {
  /* Al lado del numero, lo que se pega a la derecha de la celda es el
     parentesis: el porcentaje de esa fila queda corrido respecto de los demas,
     y el encabezado "%" termina alineado con el parentesis. Medido en el
     navegador: al lado, tres numeros terminan en x=334 y el cuarto en 299;
     abajo, los cuatro y el encabezado en 334. Lo reporto el usuario. */
  assert.match(html, /\.rango \{[^}]*display: block;/);
  /* y sin espacio entre el numero y el span: con display:block ese espacio
     abriria el renglon del parentesis con un hueco */
  assert.ok(html.includes('${enteroPct(+pct(f), f.malas, f.total)}<span class="rango">'));
  assert.ok(!T.textoPct({ malas: 3, total: 21 }, "rango").includes('% <span'));
});

test("el modo gris se fue, y con el el interruptor", () => {
  /* Se dejo configurable para decidir con la app usada. Se decidio. */
  assert.ok(!html.includes("MARCA_FLOJO"));
  assert.ok(!html.includes("marcaFlojo"));
  assert.ok(!html.includes('class="flojo"'));
  assert.equal(T.textoPct.length, 1, "textoPct ya no recibe el modo");
});

test("el margen no se sale de 0 a 100", () => {
  /* Es la razon de usar Wilson y no el margen de manual: ese, sin ningun caso
     o con todos, da tasas negativas o de mas de 100. */
  for (const [k, n] of [[0, 5], [5, 5], [0, 100], [1, 2]]) {
    const r = T.rangoWilson(k, n);
    assert.ok(r.lo >= 0 && r.hi <= 100, `${k}/${n} -> ${r.lo}..${r.hi}`);
    assert.ok(r.lo <= r.hi);
  }
});

test("mas casos, margen mas angosto", () => {
  const ancho = (k, n) => { const r = T.rangoWilson(k, n); return r.hi - r.lo; };
  assert.ok(ancho(3, 21) > ancho(14, 100));
  assert.ok(ancho(14, 100) > ancho(140, 1000));
});

test("la explicacion del margen va en las dos tablas de tasas", () => {
  /* Ahora todas las filas lo llevan, asi que la explicacion es siempre
     pertinente y no hace falta decidir si corresponde. */
  const veces = (html.match(/AYUDA_RANGO\]\);/g) || []).length;
  assert.equal(veces, 2, "tablaTasas y tablaContrastes");
  assert.ok(!html.includes("ayudaFlojos"), "ya no hace falta decidir");
});

test("la explicacion es corta", () => {
  /* Pedido del usuario: ni "podria ser 5% o 35%" ni un parrafo entero. */
  assert.ok(T.AYUDA_RANGO.length < 320, T.AYUDA_RANGO.length);
  assert.ok(T.AYUDA_RANGO.includes("centro"), "tiene que decir que el numero es el centro");
});

test("toda leyenda de tabla dice qué cuenta como mala, y lo dice arriba", () => {
  /* Se agrega sola en las dos funciones que pintan tablas, así que ninguna
     tabla nueva puede quedarse sin decirlo. Y va en el texto CORTO, no detrás
     del ?: es lo que cambia cómo se lee el número. */
  assert.ok(T.DEF_MALA.includes("3+ peones"));
  /* el regex tolera la llamada en una linea o en varias: la forma del codigo
     no es lo que esta prueba tiene que vigilar */
  const pinta = html.match(/pintarLeyenda\(idCap,[\s\S]{0,200}?\[[^\]]*\],/g) || [];
  assert.equal(pinta.length, 3, "hay tres funciones que pintan leyenda");
  const cortos = pinta.map(l => l.slice(0, l.indexOf("],")));
  assert.equal(cortos.filter(l => l.includes("DEF_MALA")).length, 2,
    "las dos tablas de tasas la llevan en el texto corto");
  /* La de reparto no: sus porcentajes no son tasas de jugadas malas. Pero tiene
     que decir su denominador igual, que es la regla §5.1. */
  const reparto = cortos.find(l => !l.includes("DEF_MALA"));
  assert.ok(reparto.includes("Sobre ${cuantas(total"), `sin denominador: ${reparto}`);
});

test("la leyenda corta se queda con el universo y el ? con el porqué", () => {
  /* El corte no es de largo. Si "compara situaciones, no jugadas" volviera
     arriba, la leyenda vuelve a ser un párrafo y nadie la lee. */
  const cuerpo = html.slice(html.indexOf("function tablaTasas"),
                            html.indexOf("function tablaTasas") + 1200);
  const corto = cuerpo.slice(cuerpo.indexOf("pintarLeyenda(idCap,"));
  assert.ok(corto.includes("[duro(DEF_MEJOR), duro(DEF_MALA)],"),
    "arriba solo qué es la mejor y qué es mala (v0.157): el alcance lo dice la cabecera, una vez");
  assert.ok(corto.includes("[texto, conTiempo ? textoTiempo(tiempo)"),
    "detrás del ?: el texto explicativo y el detalle de las cadencias");
});

test("plegar la seccion cierra tambien la ayuda", () => {
  /* El panel vive adentro de la seccion: al plegarla el texto se escondia pero
     el ? seguia pintado. Reportado desde el celular. */
  const h = html.slice(html.indexOf('details.seccion").forEach'));
  assert.ok(h.slice(0, 400).includes('addEventListener("toggle"'));
  assert.ok(h.slice(0, 400).includes('setAttribute("aria-expanded", "false")'));
  assert.ok(h.slice(0, 400).includes('classList.add("oculto")'));
});

test("el ? de cada seccion cae en la misma columna", () => {
  /* Con space-between y el chip eran cuatro elementos repartiendose el ancho.
     El titulo se lleva el sobrante y el ? queda ultimo, con su columna fija. */
  assert.ok(html.includes(".seccion > summary > .tit { flex: 1; min-width: 0; }"));
  assert.ok(!/\.seccion > summary \{[^}]*space-between/.test(html));
  const sums = [...html.matchAll(/<summary><span class="tit">.*?<\/summary>/g)];
  assert.equal(sums.length, 7, "las siete secciones envuelven su titulo (Partida por partida, v0.128)");
  for (const m of sums)
    assert.ok(m[0].indexOf("cadChip") < 0 || m[0].indexOf("cadChip") < m[0].indexOf("class=\"ayuda"),
      "el chip va con el titulo, adentro; el ? queda ultimo");
});

test("la cabecera del mes no repite lo que la pantalla ya dice", () => {
  /* Decia "El mes seleccionado:", que es lo que dice el <select> de arriba, y
     "de USUARIO", que esta en el buscador. Eran 90 caracteres con la mitad de
     eco. El detalle se fue al plegable que ya existia. */
  assert.ok(html.includes('$("capMes").textContent = origenCorto(d, prof);'));
  assert.ok(html.includes('$("capMesDetalle").textContent = origenLargo(d) +'));
  const corto = html.slice(html.indexOf("function origenCorto"), html.indexOf("function origenLargo"));
  assert.ok(!corto.includes("El mes seleccionado"), "vuelve el eco del <select>");
  assert.ok(!corto.includes("USUARIO"), "vuelve el eco del buscador");
  assert.ok(corto.includes("afuera"), "lo que no se conto tiene que decirse igual (§5.12)");
  assert.ok(corto.includes("prof ") && corto.includes("nombreModo()"), "§5.3");
});

test("el modo se escribe con tilde y no con el value del select", () => {
  /* El value es ASCII a proposito ("critico"): escrito crudo quedaba
     "prof 13 · critico". Se vio en una captura desde el celular. */
  assert.ok(html.includes('$("modo").value === "amigable" ? "amigable" : "crítico"'));
  assert.ok(!html.includes('modo ${$("modo").value}'), "quedo un modo crudo en una leyenda");
});

test("la cadencia no se nombra en los titulos de seccion", () => {
  /* El chip decia "Por tramo · 5 min" mientras Malas y Jugadas eran de TODAS
     las partidas: dos denominadores en la misma tabla y el titulo nombraba uno.
     Lo detecto el usuario mirando la pantalla. Desde la v0.46 la cadencia es el
     alcance de la vista entera y se dice una sola vez, en la cabecera. */
  assert.ok(!html.includes("cadChip"), "volvio el chip por seccion");
  assert.ok(!html.includes("chipCadencia"));
  /* Desde la v0.108 la dice el selector de la cadencia, al lado del mes, y la
     línea corta no la repite (es el eco que se sacó en la v0.45). */
  const corto = html.slice(html.indexOf("function origenCorto"), html.indexOf("function origenLargo"));
  assert.ok(!corto.includes("d.tiempo.cadencia.nombre"), "la cadencia vuelve a estar dos veces");
  assert.ok(html.includes("o.textContent = `${censo[i].nombre} (${censo[i].partidas})`"),
    "la cabecera tiene que decir cual es");
});

test("la barra de progreso no queda suelta al terminar de juntar todo (v0.108.1)", () => {
  /* `ocupado(false)` la esconde; un `progreso()` después la vuelve a mostrar
     vacía, como franja gris bajo "Listo". */
  const j = html.slice(html.indexOf("async function juntarTodo"), html.indexOf('$("fuente").onchange'));
  const fin = j.slice(j.lastIndexOf("ocupado(false)"));
  assert.ok(!/progreso\(/.test(fin), "la barra vuelve a aparecer después de esconderla");
});

test("la cabecera del mes dice qué mes (v0.108)", () => {
  /* Decía "Estadísticas" y "El mes seleccionado", y el mes estaba en #meses,
     arriba, fuera de la pantalla. Ahora el selector de arriba ES el mes. */
  assert.ok(!html.includes("El mes seleccionado</option>"), "volvió el select que no dice cuál");
  /* v0.109: "Estadísticas" vuelve como rótulo chico arriba del mes (Juan, la 1 de tres) */
  assert.ok(html.includes('<h2 class="rotulo">Estadísticas</h2>'), "la sección sin nombre");
  assert.ok(/#zonaMes h2\.rotulo \{[^}]*text-transform: uppercase[^}]*color: var\(--tenue\)/.test(html),
    "el rótulo es chico y tenue: el título es el mes");
  assert.ok(html.includes('aria-label="Mes de las estadísticas"'));
  const f = html.slice(html.indexOf("function pintarFuente"), html.indexOf('$("fuente").onchange'));
  assert.ok(f.indexOf('"todo"') < f.indexOf("optgroup"), "Todo lo analizado va primero");
  assert.ok(f.includes('$("meses").value'), "el mes sale del de la entrada: es el mismo estado");
  const pm = html.slice(html.indexOf("function pintarMes"));
  assert.ok(pm.indexOf("pintarFuente()") < pm.indexOf("if (!todas.length)"),
    "también sin datos tiene que decir de qué mes");
  // el nombre sale de la url de chess.com
  const nombre = new Function(html.slice(html.indexOf("const NOMBRES_MES"),
    html.indexOf("/* EL SELECTOR DEL MES DE LAS")) + "return nombreMes;")();
  assert.equal(nombre("https://api.chess.com/pub/player/x/games/2026/10"), "Octubre 2026");
  assert.equal(nombre("https://api.chess.com/pub/player/x/games/2025/09"), "Septiembre 2025");
});

test("el ? no pliega la sección al tocarlo", () => {
  /* El botón vive dentro del <summary>: sin preventDefault, tocarlo cierra
     justo lo que se quiere leer. Pasó al probarlo. */
  const h = html.slice(html.indexOf('e.target.closest("button.ayuda")'));
  assert.ok(h.slice(0, 300).includes("e.preventDefault()"));
  assert.ok(h.slice(0, 600).includes("sec.open = true"),
    "si la sección está cerrada, el texto se mostraría donde no se ve");
});

test("cada tabla con leyenda tiene su ?", () => {
  /* Las cuatro de abajo todavia no: no cuelgan de un <summary> —capMes y
     capMesDetalle son la cabecera del mes, capResumen y capBanco son del banco
     de pruebas— asi que el ? no tiene de donde agarrarse y necesitan su propia
     decision de diseno. Esta lista es la deuda, escrita: si aparece una tabla
     nueva sin ?, esto falla. */
  const PENDIENTES = ["capMes", "capMesDetalle", "capResumen", "capBanco"];
  /* capMes y capMesDetalle ya no son deuda: son el par corto/largo del plegable
     "Cómo se leen estos números", que el usuario eligió dejar como esta (v0.45).
     Siguen en la lista porque no tienen ? y la comprobacion mira eso. */
  const caps = [...html.matchAll(/<p class="cap" id="(\w+)">/g)].map(m => m[1]);
  const botones = [...html.matchAll(/data-ayuda="(\w+)"/g)].map(m => m[1]);
  assert.deepEqual(caps.filter(c => !botones.includes(c) && !PENDIENTES.includes(c)), [],
    "hay una leyenda de tabla sin boton de ayuda");
  assert.deepEqual(PENDIENTES.filter(c => !caps.includes(c)), [],
    "un pendiente ya no existe: sacalo de la lista");
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
  /* desde la v0.47 viaja el desenlace entero —resultado y motivo— porque son
     el mismo dato y se calculan de la misma partida */
  assert.ok(html.includes("conMias.map(r => desenlace(ladoDelUsuario(r), r.meta, r.cab))"));
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
    "7 ganadas · 3 tablas · 5 perdidas");
  assert.equal(T.textoMarcador({ gane: 1, empate: 1, perdi: 1, sinDato: 0 }),
    "1 ganada · 1 tablas · 1 perdida");
});

test("las partidas sin resultado conocido se nombran, no se callan", () => {
  /* §5.12: callarlas deja creyendo que se contaron y dieron cero. */
  assert.equal(T.textoMarcador({ gane: 2, empate: 0, perdi: 1, sinDato: 1 }),
    "2 ganadas · 0 tablas · 1 perdida · 1 sin resultado conocido");
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
  /* desde la v0.120 el del inicio es un renglón: "40 partidas · " y el marcador */
  assert.ok(html.includes('const resto = textoMarcador(m);'));
  assert.ok(html.includes('return cuantas(n, "partida", "partidas") + (resto ?'));
});

test("el marcador del listado no necesita análisis", () => {
  /* Sale del JSON que ya se descargó. Si alguna vez pasara por MES o por la
     caché, dejaría de verse antes de analizar, que es todo el punto. */
  const bloque = html.slice(html.indexOf("async function cargarMes"),
                            html.indexOf("function textoRecuento"));
  assert.ok(bloque.includes("PARTIDAS.map(g => resultadoDeLado(ladoEnJuego(g, USUARIO), g, null))"));
  assert.ok(!/\bMES\.|cache\./.test(bloque));
});

/* --- el reloj, v0.43 --- */

test("la cadencia sale del TimeControl, y la correspondencia no cuenta", () => {
  assert.deepEqual(A.leerCadencia({ TimeControl: "300" }),
    { tc: "300", base: 300, inc: 0, clave: "300+0", nombre: "5 min" });
  assert.deepEqual(A.leerCadencia({ TimeControl: "180+2" }),
    { tc: "180+2", base: 180, inc: 2, clave: "180+2", nombre: "3 | 2" });
  /* "1/259200" es una partida por correspondencia: el reloj no mide lo mismo */
  assert.equal(A.leerCadencia({ TimeControl: "1/259200" }), null);
  assert.equal(A.leerCadencia({ TimeControl: "-" }), null);
  assert.equal(A.leerCadencia({}), null);
});

test("la clave distingue 3 min de 5 min, y no se parte por como esta escrita", () => {
  /* "blitz" mete a los dos en la misma bolsa y son casi el doble uno del otro:
     si esto se compara por time_class, los segundos dejan de significar. */
  assert.notEqual(A.leerCadencia({ TimeControl: "180" }).clave,
                  A.leerCadencia({ TimeControl: "300" }).clave);
  /* y al reves: "300" y "300+0" son la misma cadencia escrita de dos maneras */
  assert.equal(A.leerCadencia({ TimeControl: "300" }).clave,
               A.leerCadencia({ TimeControl: "300+0" }).clave);
});

test("el nombre que se muestra es el de chess.com, no la notacion exacta", () => {
  /* Decision del usuario: "5+0" no lo entiende un aficionado. */
  assert.equal(A.leerCadencia({ TimeControl: "300" }).nombre, "5 min");
  assert.equal(A.leerCadencia({ TimeControl: "600" }).nombre, "10 min");
  /* con incremento no se puede decir "3 min": perderia el incremento */
  assert.equal(A.leerCadencia({ TimeControl: "180+2" }).nombre, "3 | 2");
  assert.equal(A.leerCadencia({ TimeControl: "30" }).nombre, "30 seg");
});

test("los segundos salen de restar relojes, con el incremento", () => {
  const pgn = '[White "a"]\n[Black "b"]\n[TimeControl "300+2"]\n\n' +
    "1. e4 {[%clk 0:05:00]} e5 {[%clk 0:04:52]} 2. Nf3 {[%clk 0:04:55]} Nc6 {[%clk 0:04:50]}";
  const { tiempos } = A.prepararPartida(pgn);
  /* blancas: 300 -> 300, gasto 0 + 2 de incremento = 2 */
  assert.deepEqual(tiempos, [2, 10, 7, 4]);
});

test("sin reloj los segundos son null, que no es cero", () => {
  /* §5.12: cero diria que se penso al instante; null dice que no se midio. */
  const pgn = '[White "a"]\n[Black "b"]\n[TimeControl "300"]\n\n1. e4 e5 2. Nf3';
  assert.deepEqual(A.prepararPartida(pgn).tiempos, [null, null, null]);
});

test("un reloj que sube no da un gasto negativo", () => {
  /* Los relojes de chess.com vienen redondeados y a veces el resto da abajo de
     cero. Eso es ruido, no que se haya ganado tiempo. */
  const pgn = '[White "a"]\n[Black "b"]\n[TimeControl "300"]\n\n' +
    "1. e4 {[%clk 0:05:01]} e5 {[%clk 0:04:59]}";
  assert.deepEqual(A.prepararPartida(pgn).tiempos, [0, 1]);
});

test("las filas llevan el segundo de su jugada", () => {
  const pgn = '[White "a"]\n[Black "b"]\n[TimeControl "300"]\n\n' +
    "1. e4 {[%clk 0:04:58]} e5 {[%clk 0:04:55]}";
  const { jugadas, fens, tiempos } = A.prepararPartida(pgn);
  const evs = fens.map(() => ({ cp: 0, mate: null, mejor: "a2a3", segunda: null }));
  const { filas } = A.derivarFilas(jugadas, fens, evs, { pos: new Set(), nombres: {} },
                                   0, "critico", tiempos);
  assert.deepEqual(filas.map(f => f.seg), [2, 5]);
});

test("el segundo viaja en la fila flaca", () => {
  /* Si no, "todo lo analizado" perderia la columna sin decir por que. */
  assert.ok(html.includes('"tomoConOtra", "seg"'));
});

/* --- desglose de desenlaces, v0.47 --- */

const meta = (w, b) => ({ white: { result: w }, black: { result: b } });

test("el motivo lo escribe el que no gano", () => {
  /* chess.com le pone "win" al ganador y el detalle al otro: para una ganada
     hay que mirar el campo del RIVAL y para una perdida el propio. */
  assert.deepEqual(T.desenlace("w", meta("win", "checkmated")),
    { res: "gane", motivo: "mate" });
  assert.deepEqual(T.desenlace("b", meta("win", "checkmated")),
    { res: "perdi", motivo: "mate" });
  assert.deepEqual(T.desenlace("b", meta("timeout", "win")),
    { res: "gane", motivo: "tiempo" });
});

test("en las tablas los dos lados traen el mismo motivo", () => {
  assert.deepEqual(T.desenlace("w", meta("repetition", "repetition")),
    { res: "empate", motivo: "repetición" });
  assert.deepEqual(T.desenlace("b", meta("agreed", "agreed")),
    { res: "empate", motivo: "acuerdo" });
});

test("un motivo que la API sume manana no se descarta", () => {
  /* §5.12: descartarlo dejaria creyendo que se conto y dio cero. */
  const d = T.desenlace("w", meta("win", "loquesea"));
  assert.equal(d.res, "gane");
  assert.equal(d.motivo, "otro motivo");
});

test("sin saber el resultado no hay motivo", () => {
  assert.deepEqual(T.desenlace(null, meta("win", "resigned")), { res: null, motivo: null });
  /* un PGN pegado a mano no trae el JSON: hay resultado pero no motivo */
  assert.deepEqual(T.desenlace("w", null, { Result: "1-0" }), { res: "gane", motivo: null });
});

test("las filas se agrupan por resultado y dentro por cantidad", () => {
  /* Agrupadas y no todas por cantidad: se barre con el ojo "como gano" y
     "como pierdo" sin leer fila por fila. */
  const d = (res, motivo) => ({ res, motivo });
  const filas = T.filasDesenlace([
    d("perdi", "tiempo"), d("gane", "mate"), d("perdi", "mate"),
    d("gane", "abandono"), d("gane", "abandono"), d("perdi", "tiempo"),
    d("empate", "acuerdo"),
  ]);
  assert.deepEqual(filas.map(f => f.nombre), [
    "Gané por abandono", "Gané por mate", "Empaté por acuerdo",
    "Perdí por tiempo", "Perdí por mate",
  ]);
  assert.deepEqual(filas.map(f => f.total), [2, 1, 1, 2, 1]);
});

test("las partidas sin resultado conocido no inventan una fila", () => {
  assert.deepEqual(T.filasDesenlace([{ res: null, motivo: null }]), []);
  assert.deepEqual(T.filasDesenlace([]), []);
});

test("el desglose no lleva columna de malas", () => {
  /* Reparte PARTIDAS y no jugadas: una columna vacia ahi se leeria como
     "cero malas", que seria falso. */
  const f = html.slice(html.indexOf("function tablaReparto"));
  assert.ok(f.slice(0, 2000).includes("const conMalas = filas.some(f => f.malas != null)"));
  const filas = T.filasDesenlace([{ res: "gane", motivo: "mate" }]);
  assert.equal(filas[0].malas, null);
});

test("el desglose reparte partidas y no situaciones", () => {
  /* Decia "Sobre 5 situaciones" arriba de un desglose de partidas. Se vio al
     probarlo en el navegador. */
  assert.ok(html.includes('filasDesenlace(d.desenlaces), "Desenlace", ["partida", "partidas"]'));
  const f = html.slice(html.indexOf("function tablaReparto"));
  assert.ok(f.slice(0, 800).includes('unidad = ["situación", "situaciones"]'),
    "las otras tablas de reparto siguen hablando de situaciones");
});

test("el desglose y el marcador cuentan las mismas partidas", () => {
  /* Si no, la suma de las filas no daria el "8 ganadas · 1 empatada · 5
     perdidas" de arriba y no habria forma de saber cual esta mal. */
  const d = html.slice(html.indexOf("function datosDeTablas"), html.indexOf("function deTodoBruto"));
  assert.ok(d.includes("desenlaces: idx.map(i => bruto.desenlaces[i])"));
  assert.ok(d.includes("contarResultados(idx.map(i => bruto.desenlaces[i].res))"));
});

/* --- la cadencia como alcance de la vista, v0.43 y v0.46 --- */

const cad = (clave, nombre) => ({ clave, nombre });
const P = n => Array.from({ length: n }, () => ({ seg: 10 }));

test("el censo cuenta partidas por cadencia, de mayor a menor", () => {
  const c = T.censoCadencias(
    [cad("300+0", "5 min"), cad("600+0", "10 min"), cad("300+0", "5 min")],
    [P(2), P(3), P(2)]);
  assert.deepEqual(c, [
    { clave: "300+0", nombre: "5 min", partidas: 2, jugadas: 4 },
    { clave: "600+0", nombre: "10 min", partidas: 1, jugadas: 3 },
  ]);
});

test("empatadas en partidas gana la que tiene mas jugadas", () => {
  /* Si no, el orden depende de en que orden vinieron las partidas, y la vista
     cambiaria de alcance sola al reanalizar. */
  const c = T.censoCadencias([cad("300+0", "5 min"), cad("600+0", "10 min")], [P(1), P(9)]);
  assert.equal(c[0].nombre, "10 min");
});

test("las partidas sin cadencia no entran al censo", () => {
  /* Las de correspondencia: el reloj no mide lo mismo ni de lejos. */
  const c = T.censoCadencias([cad("300+0", "5 min"), null], [P(1), P(1)]);
  assert.equal(c.length, 1);
  assert.equal(c[0].partidas, 1);
});

test("manda la pedida, y si no esta la que mas partidas tiene", () => {
  const censo = T.censoCadencias(
    [cad("300+0", "5 min"), cad("300+0", "5 min"), cad("600+0", "10 min")],
    [P(1), P(1), P(1)]);
  assert.equal(T.elegirCadencia(censo, null).nombre, "5 min");
  assert.equal(T.elegirCadencia(censo, "600+0").nombre, "10 min");
  /* cambiar de mes puede dejar sin partidas a la elegida: se cae a la
     dominante en vez de mostrar una vista vacia */
  assert.equal(T.elegirCadencia(censo, "60+0").nombre, "5 min");
  assert.equal(T.elegirCadencia([], "300+0"), null);
});

test("la vista se filtra UNA vez y todo sale del mismo subconjunto", () => {
  /* El error de la v0.43: las filas se filtraban por cadencia y el historial
     no, asi que "Malas" y "Seg." hablaban de universos distintos. Ahora se
     eligen los indices y de ahi salen filas, historial y denominadores. */
  const d = html.slice(html.indexOf("function datosDeTablas"), html.indexOf("function deTodoBruto"));
  assert.ok(d.includes("const idx = bruto.porPartida.map((_, i) => i).filter(dentro)"));
  assert.ok(d.includes("idx.map(i => bruto.porPartida[i])"));
  assert.ok(d.includes("contarResultados(idx.map(i => bruto.desenlaces[i].res))"),
    "el historial tiene que salir de los MISMOS indices que las filas");
  assert.ok(d.includes("desenlaces: idx.map(i => bruto.desenlaces[i])"),
    "y el desglose de motivos tambien");
});

test("el selector se llena con lo que hay y se bloquea con una sola", () => {
  const f = html.slice(html.indexOf("function pintarSelectorCadencia"));
  assert.ok(f.slice(0, 900).includes("sel.disabled = censo.length < 2"));
  assert.ok(f.slice(0, 900).includes("censo.map(c =>"), "las opciones salen del censo");
});

test("cambiar de cadencia no rehace el analisis", () => {
  /* Las filas ya estan: lo unico que cambia es cuales entran. Si esto llamara
     al motor, cambiar de cadencia costaria una corrida entera. */
  const h = html.slice(html.indexOf('$("cadencia").onchange'));
  const cuerpo = h.slice(0, h.indexOf("});"));
  assert.ok(cuerpo.includes("pintarMes("));
  assert.ok(!/analizar|evaluarPosiciones|derivarFilas/.test(cuerpo));
});

test("la cabecera no dice 1 partidas", () => {
  /* Con una sola partida de una cadencia queda "10 min · 1 partidas". Se vio al
     probarlo. El helper de singular ya existia desde la v0.42. */
  const corto = html.slice(html.indexOf("function origenCorto"), html.indexOf("function origenLargo"));
  assert.ok(corto.includes('cuantas(d.porPartida.length, "partida", "partidas")'));
  assert.ok(corto.includes('cuantas(d.todas.length, "jugada", "jugadas")'));
  assert.ok(!/\$\{[^}]*\.length\} partidas/.test(corto), "volvio el plural fijo");
});

test("la cabecera dice cuantas partidas quedaron afuera, y por que", () => {
  /* §5.12: filtrar por cadencia esconde partidas; que se escondieron va arriba
     y el motivo puede plegarse. */
  const corto = html.slice(html.indexOf("function origenCorto"), html.indexOf("function origenLargo"));
  assert.ok(corto.includes("d.otraCadencia"), "las de otra cadencia cuentan como afuera");
  const largo = html.slice(html.indexOf("function origenLargo"), html.indexOf("function origenLargo") + 1600);
  assert.ok(largo.includes("Quedaron afuera"));
  assert.ok(largo.includes("correspondencia"), "las daily tambien hay que nombrarlas");
});

test("la mediana tiene su propio piso, y es el unico que queda", () => {
  /* Los porcentajes ya no tienen corte. El de la mediana sobrevive porque una
     mediana de dos valores es un valor suelto disfrazado de resumen. */
  const fs = n => Array.from({ length: n }, () => ({ seg: 4, perdida: 0 }));
  assert.equal(T.NMIN, undefined, "NMIN se fue con el corte de los porcentajes");
  assert.equal(T.tasa(fs(T.NMIN_MEDIANA - 1), "x").seg, null);
  assert.equal(T.tasa(fs(T.NMIN_MEDIANA), "x").seg, 4);
  assert.equal(T.tasa(fs(10), "x").seg, 4, "10 tiempos ya son una mediana");
});

test("las tablas de reparto no tienen minimo", () => {
  /* El porcentaje ahi es composicion de un conjunto cerrado: el denominador ES
     la poblacion, no una muestra. No hay nada que estimar. */
  const f = html.slice(html.indexOf("function tablaReparto"));
  const cuerpo = f.slice(0, f.indexOf("\n}"));
  assert.ok(!cuerpo.includes("NMIN"), "volvio el minimo a una tabla de reparto");
  assert.ok(cuerpo.includes("total ? enteroPct(100 * f.total / total"));
  assert.ok(cuerpo.includes("enteroPct("),
    "el signo va igual que en las tablas de tasas: la misma función (v0.158)");
});

test("el universo de tiempo llega a las tablas que lo muestran", () => {
  /* Se rompió de verdad: las tablas se arman en pintarDetalle, que no tenía el
     dato, y quedó un `d.tiempo` sobre una `d` que ahí no existe. Las pruebas de
     unidad no lo vieron porque solo se rompe al pintar. */
  assert.ok(html.includes("function pintarDetalle(todas, porPartida, tiempo)"));
  assert.ok(html.includes("pintarDetalle(todas, porPartida, d.tiempo)"));
  const cuerpo = html.slice(html.indexOf("function pintarDetalle"),
                            html.indexOf("function datosDeTablas"));
  assert.ok(!/\bd\.tiempo\b/.test(cuerpo), "pintarDetalle no tiene ninguna `d`");
});

test("los segundos tienen su propio denominador", () => {
  /* Las partidas de otra cadencia cuentan para las malas y no para el tiempo:
     si compartieran denominador, uno de los dos numeros mentiria. */
  const fs = [...Array(40)].map((_, i) => ({ seg: i < 30 ? 4 : null, perdida: 0 }));
  const t = T.tasa(fs, "x");
  assert.equal(t.total, 40);
  assert.equal(t.conSeg, 30);
  assert.equal(t.seg, 4);
});

/* --- las tres pantallas: inicio, Partida y Mes (v0.38, rehecho en la v0.110) --- */

test("solo mostrarVista prende y apaga las zonas de las pantallas", () => {
  /* Con varias pantallas, un ver() suelto en cualquier final de análisis
     las desincroniza: quedan dos visibles, o ninguna. Tiene que haber una
     sola puerta. */
  const cuerpo = html.slice(html.indexOf("function mostrarVista"),
                            html.indexOf("function fundido"));
  /* se cuenta por subcadena y no con expresión regular: el paréntesis obliga a
     escapar y es justo donde se rompe sin que nadie lo note */
  const contar = (texto, sub) => texto.split(sub).length - 1;
  for (const z of ["zonaRevision", "zonaResumen", "zonaMes", "zonaEstado", "tarjetaMes"]) {
    const marca = `ver("${z}"`;
    assert.equal(contar(html, marca), contar(cuerpo, marca),
      `${z} se prende o apaga fuera de mostrarVista`);
  }
});

test("solo irAPantalla empuja historial, y sobre la misma url", () => {
  /* Un solo lugar empuja: así el gesto de volver de Android, la flecha del
     navegador y el "‹" de arriba deshacen siempre lo mismo. */
  /* y la variante, desde la v0.168: el "atrás" de Android la cierra primero */
  /* y la posición del link, desde la v1.1: la misma ruta, con el `#fen` */
  assert.equal((html.match(/history\.pushState/g) || []).length, 3);
  assert.ok(html.includes('history.pushState({ vista: "posicion", de: "inicio" }, "", con);') &&
    html.includes("const sin = location.pathname + location.search, con = sin + location.hash;"),
    "la posición empuja la misma ruta, solo con el #");
  const prueba = html.slice(html.indexOf("function abrirPrueba"), html.indexOf("function soltarPrueba"));
  assert.ok(prueba.includes('history.pushState({ ...(history.state || {}), prueba: true }, "", location.href)'),
    "la variante empuja sobre la misma url");
  const cuerpo = html.slice(html.indexOf("function irAPantalla"), html.indexOf("function volver()"));
  assert.ok(cuerpo.includes('history.pushState({ vista: v, de }, "", location.href)'),
    "sobre la misma url, o una recarga da 404 en GitHub Pages");
});

test("lo de la entrada lleva soloInicio y se esconde en la Partida y el Mes", () => {
  for (const id of ["zonaMeses", "zonaPartidas", "zonaAnalizar", "zonaPegar"])
    assert.match(html, new RegExp(`id="${id}" class="[^"]*soloInicio`), id);
  assert.ok(!html.includes('id="conmutador"'), "el conmutador lo reemplazó la tarjeta del mes");
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
  assert.ok(html.includes("Referencia: ${base.malas} de ${base.total}"),
    "sin la referencia el porcentaje de un mecanismo no dice nada (§5.7)");
  /* y va arriba, no detras del ?: es con lo que se lee cada fila */
  const c = html.slice(html.indexOf("function tablaContrastes(idTabla"));
  const corto = c.slice(c.indexOf("pintarLeyenda(idCap,"));
  assert.ok(corto.slice(0, corto.indexOf("],")).includes("ref"));
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
  /* El cuerpo de la función y no una ventana de N caracteres: agregarle un
     comentario a tablaReparto rompía la prueba sin que nada estuviera mal. */
  const cuerpo = duenio => {
    const i = html.indexOf(duenio);
    if (i < 0) return "";
    const j = html.indexOf("\n}", i);
    return html.slice(i, j < 0 ? html.length : j);
  };
  for (const c of sueltos) {
    const duenio = permitido[c];
    assert.ok(duenio, `porcentaje nuevo sin dueño: ${c}`);
    assert.ok(cuerpo(duenio).includes(c), `${c} calculado fuera de ${duenio}`);
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
     pérdida es cero, así que "la vi y la tomé" no puede contar jugadas malas.
     Por eso tomoConOtra es una variable APARTE y no un tomoBuena más flojo:
     tomar con la pieza equivocada sí puede perder, y hundiría el canario. */
  assert.ok(html.includes("const tomoBuena = esMejor && !!capB;"));
  assert.ok(html.includes("const tomoConOtra = !!capB && !esMejor && !!j.captured &&"));
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

test("la tabla de capturas reparte las cuatro cosas que se pueden hacer", () => {
  assert.ok(html.includes('tablaReparto("mesCapturas"'));
  for (const fila of ['"La vi y la tomé"', '"La tomé con otra pieza"',
                      '"Tomé otra"', '"No capturé"'])
    assert.ok(html.includes(fila), `falta la fila ${fila}`);
  assert.ok(html.includes("{ canario: true }"), "la fila 1 tiene que ser canario");
  /* La fila de contraste se fue: en un reparto no tiene sentido, porque las
     tres filas parten un mismo total y los porcentajes ya suman 100. */
  assert.ok(!html.includes('"No había buena captura"'));
});

test("las cuatro filas del reparto son excluyentes y cubren todo el grupo", () => {
  const en = [f => f.tomoBuena,
              f => f.tomoConOtra,
              f => !f.tomoBuena && !f.tomoConOtra && f.esCaptura,
              f => !f.tomoBuena && !f.tomoConOtra && !f.esCaptura];
  /* tomoConOtra implica esCaptura y no-tomoBuena, así que los casos posibles
     son estos cinco y no las ocho combinaciones sueltas. */
  for (const f of [{ tomoBuena: true, tomoConOtra: false, esCaptura: true },
                   { tomoBuena: false, tomoConOtra: true, esCaptura: true },
                   { tomoBuena: false, tomoConOtra: false, esCaptura: true },
                   { tomoBuena: false, tomoConOtra: false, esCaptura: false },
                   { tomoBuena: true, tomoConOtra: false, esCaptura: false }])
    assert.equal(en.filter(t => t(f)).length, 1, `${JSON.stringify(f)} cae en una sola fila`);
});

/* --- Omisión con el mismo juez, v23 --- */

test("Omisión por material la decide el motor, no la heurística", () => {
  assert.ok(html.includes("if (!oportunidad && !tomoBuena && !tomoConOtra && capB)"));
  assert.ok(!html.includes("capDisp"), "quedó la variable de la definición vieja");
});

/* --- el volcado de medición, v0.57 --- */

test("la medición no pasa por el registro", () => {
  /* El registro es un buffer rotativo de 500 líneas compartido con todo, y
     analizar un mes ya escribe una por partida: un volcado por jugada se
     comería sus propios datos. Va al portapapeles y listo. */
  const med = html.slice(html.indexOf("function medicionGenial()"),
                         html.indexOf("function reDerivar"));
  assert.ok(!med.includes("LOG.add"), "la medición no puede escribir en el registro");
  assert.ok(med.includes("navigator.clipboard"), "tiene que ir al portapapeles");
});

test("la medición sale del mes analizado y avisa si no hay", () => {
  /* Las filas flacas no llevan huecoSegunda ni legales, así que "todo lo
     analizado" no sirve como fuente. Y sin mes tiene que avisar, no romper. */
  const med = html.slice(html.indexOf("function medicionGenial()"),
                         html.indexOf("function reDerivar"));
  assert.ok(med.includes("if (!MES || !MES.resultados.length)"), "sin mes tiene que avisar");
  assert.ok(!med.includes("TODO"), "no puede salir de las filas flacas");
  assert.ok(med.includes("filasDelUsuario"), "solo las jugadas del usuario");
});

test("el histograma se ordena por número y no por texto", () => {
  /* Ordenado como texto quedaba "150-199" antes que "25-49". Por eso el mapa
     guarda el índice del cubo y el nombre se arma al imprimir. */
  const med = html.slice(html.indexOf("function medicionGenial()"),
                         html.indexOf("function reDerivar"));
  assert.ok(med.includes("sort((a, b) => a[0] - b[0])"), "volvió el orden por texto");
  assert.ok(med.includes("const nombreCubo ="));
});

/* --- el hueco crudo, para poder medir, v0.56.1 --- */

test("la fila lleva el hueco crudo entre la mejor y la segunda", () => {
  /* Antes se calculaba, se comparaba contra 150 y se tiraba. El 150 está
     elegido para disparar "Genial" y no significa nada más, así que sin el
     número no se puede probar ningún otro corte sin volver a correr el motor. */
  const { jugadas, fens } = A.prepararPartida("1. e4 e5");
  const evs = [
    { cp: 200, mate: null, mejor: "e2e4", segunda: { cp: 60, mate: null, mov: "d2d4" } },
    { cp: -200, mate: null, mejor: "e7e5", segunda: null },
    { cp: 200, mate: null, mejor: "g1f3", segunda: null },
  ];
  const { filas } = A.derivarFilas(jugadas, fens, evs, { pos: new Set(), nombres: {} });
  assert.equal(filas[0].huecoSegunda, 140, "200 contra 60");
  assert.equal(filas[1].huecoSegunda, null, "sin segunda no hay hueco, y null no es cero");
  /* el sí/no sigue saliendo del mismo número */
  assert.ok(html.includes("const unicaBuena = huecoSegunda !== null && huecoSegunda >= 150;"));
});

test("va legales junto al hueco, no el hueco solo", () => {
  /* El hueco queda en null cuando el motor no devuelve segunda, y una razón de
     que no la devuelva es que haya UNA SOLA jugada legal: sin `legales` al
     lado, la posición más forzada posible cae en el grupo de "no sé". */
  const antes = "k7/8/8/8/8/8/6q1/7K w - - 0 1";
  const j = new Chess(antes);
  const hecho = j.move("Kxg2");
  const evs = [{ cp: -900, mate: null, mejor: "h1g2", segunda: null },
               { cp: 900, mate: null, mejor: "a8b8", segunda: null }];
  const f = A.derivarFilas([hecho], [antes, j.fen()], evs,
                           { pos: new Set(), nombres: {} }).filas[0];
  assert.equal(f.huecoSegunda, null);
  assert.equal(f.legales, 1, "acá el null es 'no había nada que elegir'");
});

test("los datos para medir no viajan en la fila flaca", () => {
  /* Ninguna tabla los usa todavía y un año de filas flacas tiene que pesar
     poco. Medir sobre las filas completas de un mes alcanza para decidir. */
  const campos = (html.match(/const CAMPOS_FLACOS = \[([^\]]+)\]/) || [])[1];
  for (const c of ["huecoSegunda", "legales", "esRecaptura", "forzada"])
    assert.ok(!campos.includes(`"${c}"`), `${c} no tiene por qué viajar a las tablas`);
});

/* --- la recaptura no es Genial, v0.56 --- */

test("una recaptura no es Genial, pero comer lo que se acaba de mover sí puede serlo", () => {
  /* El par que fija las dos mitades del arreglo, en la MISMA partida:
       2. exd5  come un peón que se acaba de mover a d5 → NO es recaptura
       2… Qxd5  come de vuelta donde el rival comió    → SÍ es recaptura
     Las dos son la mejor del motor y las dos tienen la segunda a 200
     centipeones, así que lo único que las separa es el filtro. Si la definición
     de recaptura fuera "terminar en la misma casilla" —como la tuve un rato—
     las dos quedarían afuera, y cobrar algo colgado sí puede ser un hallazgo. */
  const { jugadas, fens } = A.prepararPartida("1. e4 d5 2. exd5 Qxd5");
  const evs = [
    { cp: 0,    mate: null, mejor: "e2e4", segunda: null },
    { cp: 0,    mate: null, mejor: "d7d5", segunda: null },
    { cp: 200,  mate: null, mejor: "e4d5", segunda: { cp: 0, mate: null, mov: "g1f3" } },
    { cp: -200, mate: null, mejor: "d8d5", segunda: { cp: -400, mate: null, mov: "g8f6" } },
    { cp: 200,  mate: null, mejor: "b1c3", segunda: null },
  ];
  /* libro vacío a propósito: esto es una escandinava y "libro" le ganaría a todo */
  const { filas } = A.derivarFilas(jugadas, fens, evs, { pos: new Set(), nombres: {} },
                                   0, "critico", null, 3);
  assert.equal(filas[2].esRecaptura, false, "exd5 no es recaptura");
  assert.equal(filas[3].esRecaptura, true, "Qxd5 sí lo es");
  assert.equal(filas[2].cat, "genial", "la que no es recaptura pasa");
  assert.equal(filas[3].cat, "mejor", "la recaptura queda en Mejor");
});

test("el filtro tapa las dos mitades de la regla, no solo unicaBuena", () => {
  /* Una recaptura tampoco es un hallazgo cuando cambia de banda: la ibas a
     jugar igual. La condición va sobre el `if` entero. */
  assert.ok(html.includes(
    'return (d.unicaBuena || cruce) && d.legales >= 2 && !d.esRecaptura;'));
});

test("la segunda opinión recibe la jugada anterior", () => {
  /* Ese llamado pasa UNA jugada suelta, así que no tiene jugadas[i - 1]. Sin
     esto, una recaptura revisada a más profundidad se colaría como Genial. */
  assert.ok(html.includes("MATE_VISTA(),\n        jugadas[i - 1] || null).filas[0];"));
});

/* --- el dial no te mueve de lugar, v0.55 --- */

test("mover el dial de mate rebarre en el lugar, no te devuelve al mes", () => {
  /* Mover un dial no es pedir cambiar de vista. Antes te sacaba de "todo lo
     analizado" sin que lo hubieras pedido, y parecía que había que reanalizar. */
  const man = html.slice(html.indexOf('$("mateVista").onchange'),
                         html.indexOf('$("modo").onchange'));
  assert.ok(man.includes("await juntarTodo()"), "tiene que rebarrer solo");
  assert.ok(!man.includes('FUENTE = "mes"; $("fuente").value = "mes"'),
    "quedó el camino que te echaba de la vista");
});

test("el barrido vive en una función y no duplicado en dos manejadores", () => {
  /* Dos copias se desincronizan: una arregla un error de barrido y la otra no. */
  assert.equal(html.split("await barrerCache(").length - 1, 1, "hay más de un barrido");
  assert.ok(html.includes("async function juntarTodo()"));
  const fuente = html.slice(html.indexOf('$("fuente").onchange'),
                            html.indexOf("async function cargarMes"));
  assert.ok(fuente.includes("await juntarTodo()"), "la fuente también usa la función");
});

/* --- jugada forzada, v0.54 --- */

test("con una sola jugada legal la fila queda marcada como forzada", () => {
  /* Rey blanco en h1, en jaque de la dama en g2, y la única legal es comerla.
     La posición la verifica chess.js, no la memoria. */
  const antes = "k7/8/8/8/8/8/6q1/7K w - - 0 1";
  const j = new Chess(antes);
  assert.deepEqual(j.moves(), ["Kxg2"], "la posición tiene que tener UNA sola legal");
  const hecho = j.move("Kxg2");
  const evs = [{ cp: -900, mate: null, mejor: "h1g2", segunda: null },
               { cp: 900, mate: null, mejor: "a8b8", segunda: null }];
  const f = A.derivarFilas([hecho], [antes, j.fen()], evs,
                           { pos: new Set(), nombres: {} }, 0, "critico", null).filas[0];
  assert.equal(f.forzada, true);
  /* la categoría de siempre sigue estando: las tablas cuentan lo que contaban */
  assert.ok(f.cat && f.cat !== "forzada", `la categoría siguió siendo ${f.cat}`);
});

test("con dos o más jugadas legales no es forzada", () => {
  const { jugadas, fens } = A.prepararPartida("1. e4 e5");
  const evs = fens.map(() => ({ cp: 0, mate: null, mejor: "a2a3", segunda: null }));
  const { filas } = A.derivarFilas(jugadas, fens, evs, { pos: new Set(), nombres: {} });
  assert.deepEqual(filas.map(f => f.forzada), [false, false]);
});

test("forzada no es una categoría: no se cuenta en ninguna tabla", () => {
  /* Es la condición que puso el usuario. Si entrara en ORDEN o en CATEGORIAS
     sumaría "Mejor" que no son mérito, y el denominador de las tasas incluiría
     jugadas donde no había ninguna decisión que tomar. */
  assert.ok(!A.ORDEN.includes("forzada"), "se coló en el orden de las categorías");
  assert.ok(!("forzada" in A.CATEGORIAS), "se coló en CATEGORIAS");
  const campos = (html.match(/const CAMPOS_FLACOS = \[([^\]]+)\]/) || [])[1];
  assert.ok(!campos.includes('"forzada"'), "no tiene por qué viajar a las tablas");
});

test("los dos lugares que pintan una jugada usan el mismo presentador", () => {
  /* La tarjeta del veredicto y la tira de jugadas. Si uno se olvida, la misma
     jugada sale forzada en un lado y Mejor en el otro. */
  assert.ok(html.includes("const c = enInicio ? null : presentar(f);"), "la tarjeta del veredicto");
  assert.ok(html.includes("const p = presentar(x);"), "la tira de jugadas");
  assert.ok(!html.includes("CATEGORIAS[x.cat].icono"), "quedó el camino viejo en la tira");
  assert.ok(!html.includes("const c = CATEGORIAS[f.cat];"), "quedó el camino viejo en la tarjeta");
  /* y en una forzada no se muestran los números: no hubo elección que juzgar */
  /* Los números se fueron de la tarjeta en la v0.72 —eran los mismos que los
     cuadritos de abajo— y con ellos el caso especial de la forzada, que existía
     para que una jugada sin elección no los mostrara. */
  assert.ok(!html.includes("puntos de victoria`"), "los números ya no están en la tarjeta");
  assert.ok(/\$\("vSub"\)\.textContent = hayExp \? ""\s*: enInicio \? [^\n]+ : c\.desc;/.test(html),
    "un solo renglón: la explicación, o la frase fija cuando no hay");
});

/* --- el mate soltado y el dial "mate a la vista", v0.53 --- */

/* Los tres casos usan las evaluaciones REALES de la jugada 40 de la partida
   MewoneX-Santico26: mate en 8 antes, cp -980 después. Las jugadas son de
   relleno —derivarFilas solo necesita que existan— y el libro va vacío para que
   "libro" no gane antes que nada. */
const EVS_MATE_40 = () => [
  { cp: null, mate: 8, mejor: "d4d5", segunda: null },
  { cp: -980, mate: null, mejor: "a7a6", segunda: null },
  { cp: 980, mate: null, mejor: "a2a3", segunda: null },
];
const SIN_LIBRO = { pos: new Set(), nombres: {} };

test("soltar un mate a la vista es Omisión aunque la pérdida sea mínima", () => {
  /* La evaluación está topeada en 1000 cuando hay mate, así que soltarlo mueve
     la pérdida apenas 0,20 y nunca alcanzaba el corte de 1. La app veía el mate
     —lo escribía en la señal— y aun así etiquetaba "Bien". */
  const { jugadas, fens } = A.prepararPartida("1. e4 e5");
  const f = A.derivarFilas(jugadas, fens, EVS_MATE_40(), SIN_LIBRO, 0, "critico", null, 99).filas[0];
  assert.equal(f.perdida, 0.2, "la pérdida no cambia, cambia la etiqueta");
  assert.equal(f.cat, "omision");
  assert.ok(f.senales.some(s => s.includes("mate forzado en 8")), f.senales.join(" | "));
});

test("un mate más largo que el dial no es una oportunidad", () => {
  /* Es lo que impide que toda partida ganada se llene de omisiones, y lo que
     pidió el usuario: un mate en 8 a 570 de Elo no se iba a ver. */
  const { jugadas, fens } = A.prepararPartida("1. e4 e5");
  const f = A.derivarFilas(jugadas, fens, EVS_MATE_40(), SIN_LIBRO, 0, "critico", null, 3).filas[0];
  assert.equal(f.cat, "bien");
  assert.deepEqual(f.senales, [], "sin oportunidad tampoco hay cartel");
});

test("si el mate sigue en pie no hay omisión, solo se demoró", () => {
  /* Decisión tomada a propósito, y es donde nos separamos de chess.com: ellos
     marcan Miss cuando el mate pasa de 8 a 13; nosotros exigimos que se pierda.
     Alargarlo no cuesta la partida. */
  const { jugadas, fens } = A.prepararPartida("1. e4 e5");
  const evs = EVS_MATE_40();
  evs[1] = { cp: null, mate: -7, mejor: "a7a6", segunda: null };
  const f = A.derivarFilas(jugadas, fens, evs, SIN_LIBRO, 0, "critico", null, 99).filas[0];
  assert.notEqual(f.cat, "omision");
  assert.deepEqual(f.senales, []);
});

test("el dial arranca en 3 y el bloque de análisis no lo lee del DOM", () => {
  assert.ok(html.includes("const MATE_A_LA_VISTA = 3;"), "cambió el valor inicial");
  assert.ok(html.includes('const MATE_VISTA = () => +$("mateVista").value || MATE_A_LA_VISTA;'));
  assert.ok(html.includes(
    'if (omiteMate || (d.oportunidad && x >= c.error && x < c.grave)) return "omision";'));
  const ini = html.indexOf("/* ============ evaluación ============ */");
  const fin = html.indexOf("/* ===================== fin del bloque de análisis");
  assert.ok(!html.slice(ini, fin).includes("mateVista"),
    "el bloque es puro: el dial entra por parámetro, no leyendo el DOM");
});

test("todos los llamados a derivarFilas pasan el dial", () => {
  /* Uno que se olvide se queda con el valor por defecto en silencio, y esa
     pantalla mostraría otra etiqueta que el resto de la app. */
  const llamados = html.split("derivarFilas(").length - 1 - 1;  /* menos la definición */
  const conDial = html.split("MATE_VISTA()").length - 1;
  assert.equal(conDial, llamados, `${llamados} llamados pero ${conDial} pasan el dial`);
});

/* --- tomar el material con la pieza equivocada, v0.52 --- */

test("recapturar con otra pieza no es omisión: el material se cobró igual", () => {
  /* Partida real (MewoneX-Santico26, 7. Nxd1). Tras 6...Qxd1+ hay exactamente
     DOS jugadas legales y las dos comen la dama: Kxd1, que es la del motor, y
     Nxd1, que es la que se jugó. Elegir la otra cuesta 1,36 —el caballo de c3
     deja de defender e4 y entra Nxe4—, y eso es un Error. No es material
     dejado pasar: la dama se cobró. La posición la verifica chess.js, no la
     memoria. */
  const antes = "rnb1k2r/ppp1bppp/5n2/4N3/4P3/2N5/PPP2PPP/R1BqKB1R w KQkq - 0 7";
  const j = new Chess(antes);
  assert.deepEqual(j.moves().sort(), ["Kxd1", "Nxd1"]);
  const hecho = j.move("Nxd1");
  const evs = [{ cp: 137, mate: null, mejor: "e1d1", segunda: { cp: 7, mate: null, mov: "c3d1" } },
               { cp: -1, mate: null, mejor: "f6e4", segunda: null }];
  const { filas } = A.derivarFilas([hecho], [antes, j.fen()], evs,
                                   { pos: new Set(), nombres: {} }, 12, "critico", null);
  const f = filas[0];
  assert.equal(f.perdida, 1.36, "la pérdida es real y no cambia");
  assert.equal(f.tomoConOtra, true);
  assert.equal(f.cat, "error", "Error sí; Omisión no");
  assert.ok(!f.senales.some(s => s.includes("ganaba")),
    "no puede anunciar los 9 puntos de una dama que se cobró: " + f.senales.join(" | "));
  assert.ok(f.senales.some(s => s.includes("la mejor era Kxd1")), f.senales.join(" | "));
});

test("capturar en OTRA casilla sigue siendo omisión", () => {
  /* El arreglo mira la casilla de destino, así que tiene que dejar intacto el
     caso que la omisión existe para agarrar: había material en un lado y se
     capturó en otro. Torre blanca en d1 y dama negra colgada en d8; en vez de
     Rxd8 se toma un peón en a7 con la torre de a1. */
  const antes = "3qk3/p6p/8/8/8/8/7P/R2RK3 w - - 0 1";
  const j = new Chess(antes);
  const hecho = j.move("Rxa7");
  assert.ok(hecho, "Rxa7 tiene que ser legal");
  const evs = [{ cp: 300, mate: null, mejor: "d1d8", segunda: null },
               { cp: -100, mate: null, mejor: "d8d1", segunda: null }];
  const { filas } = A.derivarFilas([hecho], [antes, j.fen()], evs,
                                   { pos: new Set(), nombres: {} }, 0, "critico", null);
  const f = filas[0];
  assert.equal(f.tomoConOtra, false, "otra casilla no es la misma casilla");
  assert.equal(f.cat, "omision");
  assert.ok(f.senales.some(s => s.includes("ganaba")), f.senales.join(" | "));
});

test("capturaGanadora se fue, porque ya no la usa nadie", () => {
  assert.ok(!html.includes("capturaGanadora"));
  assert.ok("gananciaDeCaptura" in A, "esta sí se sigue usando");
});

test("capturar otra cosa ya no tapa la omisión", () => {
  /* Antes la condición era !j.captured: si capturabas cualquier otra cosa, la
     omisión no se registraba. Ahora la condición es no haber jugado la buena. */
  assert.ok(!html.includes("!j.captured && cap"));
});

test("una jugada que deja pasar material y pierde >= 3 cae en Grave (v0.134)", () => {
  const base = { perdida: 5, caida: 40, esMejor: false, esLibro: false, entrega: false,
                 unicaBuena: false, legales: 20, antesMio: 0, despuesMio: 0 };
  assert.equal(A.categorizar({ ...base, oportunidad: { tipo: "material" } }), "grave");
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
                   "colgada", "capBuena", "tomoBuena", "tomoConOtra", "n"])
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

/* --- la curva de quién va ganando, v0.58 --- */

/* Una partida de mentira: N filas con la evaluación que se le pida, en
   centipeones desde las blancas. `franja` es la posición ANTES de la jugada
   vista por el que mueve, que es de donde sale el punto 0 de la curva. */
const filasCurva = (evals, cats) => evals.map((cp, i) => ({
  n: Math.floor(i / 2) + 1,
  turno: i % 2 === 0 ? "w" : "b",
  evalBlancas: cp,
  franja: i === 0 ? 0.2 : 0,
  cat: (cats && cats[i]) || "bien",
  forzada: false
}));

test("la curva tiene un punto más que jugadas: el punto 0 es la posición inicial", () => {
  const c = A.curvaVentaja(filasCurva([50, -50, 300]), null, false);
  assert.equal(c.puntos.length, 4);
  assert.equal(c.puntos[0].x, 0);
  assert.equal(c.puntos[3].x, 100, "la última jugada cae en el borde derecho");
});

test("el punto 0 sale de `franja` y no de suponer que la partida arranca igualada", () => {
  /* `franja` es antesMio: con las blancas moviendo, +0,20 son +20 centipeones
     desde las blancas, o sea apenas arriba de la mitad. Un PGN que arranca
     desde una posición cualquiera no empieza en 50%. */
  const c = A.curvaVentaja(filasCurva([50, -50]), null, false);
  assert.ok(c.puntos[0].y < 50, "arriba de la mitad = ventaja blanca");
  assert.ok(Math.abs(c.puntos[0].y - (100 - A.winPct(20))) < 1e-9);
  /* y con las negras moviendo primero el mismo +0,20 es ventaja NEGRA */
  const negras = filasCurva([50, -50]);
  negras[0].turno = "b";
  assert.ok(A.curvaVentaja(negras, null, false).puntos[0].y > 50);
});

test("el eje vertical es winPct, así que un +9 no aplasta el resto", () => {
  /* Era la decisión pendiente. Con centipeones crudos, +900 contra +50 deja a
     la segunda pegada a la mitad y a la primera contra el borde; con winPct
     las dos se ven, y ninguna toca el borde porque TOPE es 1000. */
  const c = A.curvaVentaja(filasCurva([900, 50]), null, false);
  const [ , nueve, cincuenta ] = c.puntos;
  assert.ok(nueve.y > 1, "ni siquiera un +9 llega al borde de arriba");
  assert.ok(cincuenta.y - nueve.y > 25, "y quedan bien separadas");
  assert.ok(Math.abs(cincuenta.y - 50) < 10, "un +0,50 sigue cerca de la mitad");
});

test("solo se marcan las seis categorías que vale la pena buscar", () => {
  const cats = ["mejor", "grave", "bien", "genial", "libro", "excelente",
                "omision", "forzada"];
  const c = A.curvaVentaja(filasCurva(cats.map(() => 0), cats), null, false);
  assert.deepEqual(c.marcas.map(m => m.clave), ["grave", "genial", "omision"]);
  assert.deepEqual(c.marcas.map(m => m.i), [1, 3, 6]);
});

test("una forzada no se marca aunque su categoría sí esté en la lista", () => {
  /* `presentar` tapa la categoría con Forzada, y Forzada no se busca: no hubo
     nada que decidir. Sin pasar por `presentar` esta jugada saldría como grave. */
  const filas = filasCurva([0], ["grave"]);
  filas[0].forzada = true;
  assert.deepEqual(A.curvaVentaja(filas, null, false).marcas, []);
});

test("con un lado conocido se marcan solo las jugadas del usuario", () => {
  const cats = ["grave", "grave", "grave", "grave"];
  const filas = filasCurva([0, 0, 0, 0], cats);
  assert.deepEqual(A.curvaVentaja(filas, "w", false).marcas.map(m => m.i), [0, 2]);
  assert.deepEqual(A.curvaVentaja(filas, "b", false).marcas.map(m => m.i), [1, 3]);
  assert.deepEqual(A.curvaVentaja(filas, "b", true).marcas.map(m => m.i), [0, 1, 2, 3],
                   "con 'Pintar las dos' vuelven todas");
  assert.deepEqual(A.curvaVentaja(filas, null, false).marcas.map(m => m.i), [0, 1, 2, 3],
                   "sin saber de qué lado jugaba, tampoco se esconde nada");
});

test("una partida sin filas no rompe la curva", () => {
  assert.deepEqual(A.curvaVentaja([], null, false), { puntos: [], marcas: [] });
});

test("el toque sobre la curva cae en la jugada de abajo", () => {
  /* La inversa de ejeX, y es lo que hace que el dedo caiga siempre en algo:
     el borde izquierdo es la posición inicial (v0.124) y el derecho la última, sin
     agujeros ni índices fuera de rango. */
  assert.equal(A.jugadaEnLaCurva(0, 10), -1, "el punto 0 es la posición inicial (v0.124)");
  assert.equal(A.jugadaEnLaCurva(0.04, 10), -1);
  assert.equal(A.jugadaEnLaCurva(0.06, 10), 0, "y el punto 1, la primera jugada");
  assert.equal(A.jugadaEnLaCurva(1, 10), 9);
  assert.equal(A.jugadaEnLaCurva(0.54, 10), 4, "5,4 cae en el punto 5, que es la jugada 4");
  assert.equal(A.jugadaEnLaCurva(0.56, 10), 5, "y 5,6 en el punto 6, que es la jugada 5");
  assert.equal(A.jugadaEnLaCurva(-0.3, 10), -1, "un toque afuera no se sale del rango");
  assert.equal(A.jugadaEnLaCurva(1.3, 10), 9);
  assert.equal(A.jugadaEnLaCurva(0.5, 0), -1, "sin jugadas no hay a dónde ir");
});

test("los puntos de la curva NO van adentro del SVG", () => {
  /* Con preserveAspectRatio="none" la tira se estira al ancho que haya y todo
     se deforma en el eje x: un <circle> saldría óvalo, y de un ancho distinto en
     cada partida según cuántas jugadas tenga. Por eso los puntos son elementos
     HTML posicionados en porcentaje, que se miden contra el contenedor. */
  const conComentarios = html.slice(html.indexOf("function dibujarCurva"),
                                    html.indexOf("/* Temas de tablero"));
  /* sin los comentarios: el de acá al lado NOMBRA a <circle> para explicar por
     qué no se usa, y buscar el texto pelado se agarraba de esa explicación */
  const f = conComentarios.replace(/\/\*[\s\S]*?\*\//g, "");
  assert.ok(!f.includes("<circle"), "un círculo adentro del SVG sale deformado");
  assert.ok(f.includes('preserveAspectRatio="none"'));
  assert.ok(f.includes('border-radius: 50%') === false, "el redondeo va en el CSS");
  assert.ok(html.includes(".curva .pt { position: absolute; border-radius: 50%"),
            "el punto se redondea desde el CSS, sobre un elemento sin deformar");
  /* lo que sí queda adentro del SVG se defiende con non-scaling-stroke, que deja
     el grosor en píxeles de pantalla: la línea, la mitad y las dos del "estás
     acá" */
  assert.equal((f.match(/non-scaling-stroke/g) || []).length, 4);
});

test("el 'estás acá' no usa ninguno de los colores de las categorías", () => {
  /* Los diez colores ya significan algo. Un color nuevo al lado de ellos se lee
     como una categoría más, así que el marcador va sin color: línea clara con
     funda oscura, los dos tonos que ya usa la barra. */
  const f = html.slice(html.indexOf("function dibujarCurva"),
                       html.indexOf("/* Temas de tablero"));
  const aca = f.slice(f.indexOf("const aca ="), f.indexOf('class="pt"'));
  assert.ok(!aca.includes("var(--c-"), "el marcador no toma un color de categoría");
  assert.ok(aca.includes('stroke="var(--eval-negras)"') && aca.includes('stroke="var(--eval-blancas)"'),
            "la funda oscura y la línea clara son los dos tonos de la barra");
});

test("el tablero de fábrica es el de A, y la madera guardada sola no se hereda (v0.97)", () => {
  /* Hasta la v0.96 el tema se guardaba SIEMPRE al cargar: todos los teléfonos
     tienen "madera" escrito aunque nadie la haya elegido. */
  const t = html.slice(html.indexOf("const TEMAS = {"), html.indexOf("function aplicarTema"));
  assert.ok(/noche:\s*\{[^}]*claro: "#e6e1d3", oscuro: "#7f9466"/.test(t), "Noche con las casillas de A");
  const ini = html.slice(html.indexOf("(function iniciarTema"), html.indexOf("let GIRADO"));
  assert.ok(ini.includes('viejo !== "madera"'), "la madera vieja no se hereda");
  assert.ok(ini.includes('getItem("tablero")'), "la clave nueva manda");
  assert.ok(/--claro: #e6e1d3; --oscuro: #7f9466;/.test(html), "y el :root arranca igual, sin parpadeo");
});

test("el violeta de lo inventado, como texto, es el que se lee sobre el fondo (v0.97)", () => {
  const css = html.slice(html.indexOf("<style>"), html.indexOf("</style>"));
  assert.ok(!css.includes("#6a1b9a"), "el #6a1b9a da 1,8:1 sobre el fondo: solo para la flecha");
  assert.ok(css.includes(".tira .jg.inv { color: var(--inventada); }"));
});

test("las marcas se dibujan DESPUÉS del 'estás acá'", () => {
  /* Si no, la marca de la jugada que se está mirando queda tapada justo por la
     raya que dice que la estás mirando, que es la única que nunca puede
     desaparecer. Pasaba con la raya en la v0.58 y se vio en el celu. */
  const f = html.slice(html.indexOf("function dibujarCurva"),
                       html.indexOf("/* Temas de tablero"));
  const aca = f.indexOf("const aca =");
  assert.ok(aca > 0);
  assert.ok(f.indexOf('class="pt"') > aca, "el punto se dibuja después");
});

test("la curva se pinta con la misma regla de lado que la tira de jugadas", () => {
  /* Si se separaran, la curva marcaría jugadas del rival que la tira pinta en
     gris, o al revés. Comparten `lado` y VER_AMBOS, calculados una sola vez. */
  assert.ok(html.includes('$("curva").innerHTML = dibujarCurva(R.filas, IDX, lado, VER_AMBOS);'));
});

test("la curva marca con el punto chico, la única forma desde la v0.160", () => {
  /* Juan eligió "punto chico" al repasar la hoja; el punto con aro y la raya
     se sacaron en la v1.0.3. Sin selector y sin forma que elegir. */
  const f = html.slice(html.indexOf("function dibujarCurva"),
                       html.indexOf("/* Temas de tablero"));
  assert.ok(f.includes("width:6px;height:6px;"), "el punto mide 6 px");
  assert.ok(!f.includes("box-shadow"), "y no lleva aro");
  assert.ok(!html.includes("MARCAS_CURVA") && !html.includes("MARCA_CURVA"), "no quedan las formas");
  assert.ok(!html.includes('<select id="marcasCurva"'), "y el selector se fue");
});

test("una marca nunca se corta contra el borde de la tira", () => {
  /* Media marca cortada se lee como una marca más chica, y entonces el tamaño
     dejaría de significar lo mismo en todas. El punto de 6 px sobre una tira de
     46 tiene 3 de radio, o sea 6,5%: el margen tiene que cubrirlo. */
  const m = html.match(/const MARGEN_MARCA = (\d+);/);
  assert.ok(m, "se perdió MARGEN_MARCA");
  assert.ok(+m[1] >= 3 * 100 / 46 && +m[1] < 50, "cubre el radio y deja tira usable");
  const f = html.slice(html.indexOf("function dibujarCurva"), html.indexOf("/* Temas de tablero"));
  assert.ok(f.includes("Math.max(MARGEN_MARCA, Math.min(100 - MARGEN_MARCA, y))"), "y se aplica arriba y abajo");
});

/* --- el mate visto de los dos lados, v0.60 --- */

const UNA = () => A.prepararPartida("1. e4 e5");
const EVS = (a, b) => {
  const { jugadas } = UNA();
  return [a, b, { cp: 0, mate: null, mejor: "a2a3", segunda: null }];
};
const fila1 = (a, b, mateVista = 3) => {
  const { jugadas, fens } = UNA();
  return A.derivarFilas(jugadas, fens, EVS(a, b), { pos: new Set(), nombres: {} },
                        0, "critico", null, mateVista).filas[0];
};
const UCI_PRIMERA = UNA().jugadas[0].from + UNA().jugadas[0].to;

test("dar el mate no es soltarlo: `mate 0` es la partida terminada", () => {
  /* Reportado desde el celular: un `40. Qxg7#` salía "Omisión — había mate o
     material y se dejó pasar", con pérdida 0,00 y con "MEJOR: la jugada" al
     lado. Leído en voz alta no cerraba (§5 regla 9).

     La causa era una comparación: el mate que le queda al rival se mira con
     `sig < 0`, y cuando el mate se EJECUTA el motor dice `mate 0`, que en UCI
     significa "el que mueve ya está mateado". Cero no es menor que cero, así
     que la jugada que mataba caía del lado de "lo dejó pasar". */
  const f = fila1({ cp: null, mate: 1, mejor: UCI_PRIMERA, segunda: null },
                  { cp: null, mate: 0, mejor: null, segunda: null });
  assert.notEqual(f.cat, "omision", "jugó el mate: no dejó pasar nada");
  assert.equal(f.cat, "mejor");
  assert.deepEqual(f.senales, [], "y no hay nada que avisar");
});

test("el mate soltado de verdad sigue siendo Omisión", () => {
  /* La otra mitad del arreglo: el `<=` no puede haberse comido el caso que la
     v0.53 vino a resolver. Había mate en 1, se jugó otra cosa y el mate ya no
     está: eso sí es una omisión, valga lo que valga en centipeones. */
  const f = fila1({ cp: null, mate: 1, mejor: "d2d4", segunda: null },
                  { cp: 20, mate: null, mejor: "a7a6", segunda: null });
  assert.equal(f.cat, "omision");
  assert.ok(f.senales.some(s => s.includes("mate forzado en 1")));
});

test("permitir un mate se avisa, aunque la pérdida no lo note", () => {
  /* Es el espejo del mate soltado y falla por el MISMO motivo: la evaluación
     está topeada en 1000, así que caer de -8,16 a mate da 1,84 y no llega al
     corte de 3 de "Error grave". La tarjeta decía "Empeora la posición" y la
     barra, al lado, "-M1". */
  const f = fila1({ cp: -816, mate: null, mejor: "d2d4", segunda: null },
                  { cp: null, mate: 1, mejor: "a7a6", segunda: null });
  assert.ok(f.senales.includes("permite mate forzado en 1"), f.senales.join(" | "));
  /* Y la CATEGORÍA no se toca: cambiarla movería los conteos de todas las
     tablas, y esa decisión es del usuario. Por ahora la app avisa, no juzga. */
  assert.equal(f.cat, "error", "la etiqueta sigue saliendo de la pérdida");
  assert.equal(f.perdida, 1.84);
});

test("si ya te estaban matando, permitirlo otra vez no es un hallazgo", () => {
  /* Misma decisión que la del mate estirado: la señal se dispara UNA vez, en la
     jugada que crea el mate, y no en todas las que vienen después. Sin esto una
     partida perdida se llenaría del mismo cartel repetido. */
  const f = fila1({ cp: null, mate: -2, mejor: "d2d4", segunda: null },
                  { cp: null, mate: 1, mejor: "a7a6", segunda: null });
  assert.deepEqual(f.senales.filter(s => s.startsWith("permite")), []);
});

test("la barra dice 'mate' y no 'M0' cuando la partida terminó", () => {
  /* "M0" es como lo dice el motor, no como lo diría una persona. Quién ganó ya
     lo dice la barra, que en esa posición está llena de una sola punta. */
  assert.equal(A.textoEval({ cp: null, mate: 0 }, "b"), "mate");
  assert.equal(A.textoEval({ cp: null, mate: 0 }, "w"), "mate");
  /* y los mates de verdad no se tocaron */
  assert.equal(A.textoEval({ cp: null, mate: 3 }, "w"), "M3");
  assert.equal(A.textoEval({ cp: null, mate: 3 }, "b"), "-M3");
  assert.equal(A.textoEval({ cp: -50, mate: null }, "w"), "-0.50");
});

test("la barra vertical acorta el número largo en vez de achicar la letra (v0.105)", () => {
  /* a 11 px "+10.00" no entra en los 36 de la barra, y la barra recorta sin avisar */
  assert.equal(A.textoBarra("+0.26"), "+0.26");
  assert.equal(A.textoBarra("-9.99"), "-9.99");
  assert.equal(A.textoBarra("+10.00"), "+10.0");
  assert.equal(A.textoBarra("-35.47"), "-35.5");
  assert.equal(A.textoBarra("-100.00"), "-100");
  assert.equal(A.textoBarra("+153.60"), "+154");
  /* lo que no es un número se queda como está */
  for (const t of ["M3", "-M12", "mate", "1-0", "Tablas"]) assert.equal(A.textoBarra(t), t);
});

/* --- cómo termina la partida, v0.61 --- */

test("el remate se lee del tablero, no del encabezado del PGN", () => {
  /* `desenlace()`, en el bloque de tablas, sale de las cabeceras y contesta
     "cómo terminó" para el mes. Esta contesta otra cosa: si la posición está
     terminada EN EL TABLERO, que es lo que decide si se pisa la evaluación. */
  const fin = ms => {
    const { fens } = A.prepararPartida(ms);
    return A.remateEnTablero(fens[fens.length - 1]);
  };
  assert.equal(fin("1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6 4. Qxf7#"), "1-0");
  assert.equal(fin("1. f3 e5 2. g4 Qh4#"), "0-1", "el mate de las negras es 0-1");
  assert.equal(fin("1. e3 a5 2. Qh5 Ra6 3. Qxa5 h5 4. Qxc7 Rah6 5. h4 f6 6. Qxd7+ Kf7" +
                   " 7. Qxb7 Qd3 8. Qxb8 Qh7 9. Qxc8 Kg6 10. Qe6"), "tablas",
               "el ahogado son tablas");
  assert.equal(fin("1. e4 e5"), null, "una posición viva no tiene remate");
});

test("las tablas por material insuficiente también son un remate", () => {
  /* Sale del FEN igual que el ahogado: dos reyes solos no es una posición que
     el motor esté evaluando, es una partida terminada. */
  assert.equal(A.remateEnTablero("4k3/8/8/8/8/8/8/4K3 w - - 0 60"), "tablas");
  /* y la regla de las 50 jugadas, que viaja en el propio FEN */
  assert.equal(A.remateEnTablero("4k3/8/8/8/8/8/4Q3/4K3 w - - 100 80"), "tablas");
  assert.equal(A.remateEnTablero("4k3/8/8/8/8/8/4Q3/4K3 w - - 99 80"), null,
               "a 99 la partida sigue");
});

test("la triple repetición NO se caza, y está anotado", () => {
  /* No está en el FEN sino en la historia de la partida, y acá se arranca de
     una posición suelta. Una tablas por repetición o por acuerdo sigue
     mostrando la evaluación, igual que un abandono. La prueba existe para que
     la limitación sea una decisión escrita y no una sorpresa. */
  const { fens } = A.prepararPartida("1. Nf3 Nf6 2. Ng1 Ng8 3. Nf3 Nf6 4. Ng1 Ng8");
  assert.equal(A.remateEnTablero(fens[fens.length - 1]), null);
});

test("con la partida terminada la barra muestra el resultado y se llena entera", () => {
  const { jugadas, fens } = A.prepararPartida("1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6 4. Qxf7#");
  const evs = fens.map((f, i) => i === fens.length - 1
    ? { cp: null, mate: 0, mejor: null, segunda: null }
    : { cp: 30, mate: null, mejor: "e2e4", segunda: null });
  const filas = A.derivarFilas(jugadas, fens, evs, { pos: new Set(), nombres: {} }).filas;
  const ultima = filas[filas.length - 1];
  assert.equal(ultima.remate, "1-0");
  assert.equal(ultima.evalTexto, "1-0", "el resultado le gana a 'mate' y a 'M0'");
  /* y ninguna otra fila lo lleva: una posición terminal corta la partida */
  assert.deepEqual(filas.slice(0, -1).map(f => f.remate), filas.slice(0, -1).map(() => null));
  assert.equal(A.llenadoBarra(ultima), 100, "y la barra va entera");
});

test("el remate devuelve una CLAVE, y el texto vive en un solo lugar", () => {
  /* "½-½" duró una versión: el glifo es diminuto a los 9,5 px del número de la
     barra. Separar la clave del texto es lo que hizo que cambiarlo por "Tablas"
     fuera una línea y no una cacería. */
  assert.deepEqual(A.TEXTO_REMATE, { "1-0": "1-0", "0-1": "0-1", tablas: "Tablas" });
});

test("un mate forzado llena la barra entera, aunque la partida siga", () => {
  /* La evaluación se topea en 1000, así que un mate en 5 y un +9,90 pintan casi
     la misma barra: 97,5 contra 97,2. Es la MISMA saturación que obligó a
     inventar "Omisión" en la v0.53, pero en la barra. Llenarla entera desatura
     lo único que la escala no puede expresar. */
  assert.ok(Math.abs(A.winPct(1000) - A.winPct(990)) < 0.5,
            "las dos evaluaciones son indistinguibles: ese es el problema");
  assert.equal(A.llenadoBarra({ mateDe: "w", evalBlancas: 1000 }), 100);
  assert.equal(A.llenadoBarra({ mateDe: "b", evalBlancas: -1000 }), 0);
  /* y sin mate vuelve el tope, que es lo que deja ver que el mate se soltó */
  const soltado = A.llenadoBarra({ mateDe: null, evalBlancas: 980 });
  assert.ok(soltado > 90 && soltado < 98, `quedó en ${soltado}`);
});

test("los tres llenados de la barra, y su orden de precedencia", () => {
  /* El remate le gana al mate forzado: la última jugada de un mate tiene las dos
     cosas y lo que corresponde mostrar es el resultado. */
  assert.equal(A.llenadoBarra({ remate: "1-0", mateDe: "w" }), 100);
  assert.equal(A.llenadoBarra({ remate: "0-1", mateDe: "b" }), 0);
  assert.equal(A.llenadoBarra({ remate: "tablas" }), 50, "las tablas parten la barra al medio");
  assert.equal(A.llenadoBarra({ remate: null, mateDe: null, evalBlancas: 0 }), 50);
});

/* --- cómo terminó la partida, en la pantalla de revisión (v0.63) --- */

test("comoTermino cubre también las partidas que NO terminan en el tablero", () => {
  /* Era el agujero: un abandono o una perdida por tiempo terminan en una
     posición viva, así que `remateEnTablero` no las ve y la barra muestra la
     evaluación —con razón—, pero nada decía que la partida había terminado. */
  assert.deepEqual(T.comoTermino({ Result: "1-0" },
    { white: { result: "win" }, black: { result: "resigned" } }),
    { res: "1-0", motivo: "abandono" });
  assert.deepEqual(T.comoTermino({ Result: "0-1" },
    { white: { result: "timeout" }, black: { result: "win" } }),
    { res: "0-1", motivo: "tiempo" });
});

test("el motivo lo escribe el que NO ganó, y en tablas lo traen los dos", () => {
  /* chess.com le pone "win" al ganador y el detalle al otro. Es la misma regla
     que `motivoDesenlace`, pero sin necesitar de qué lado jugaba el usuario:
     un PGN pegado no lo sabe y aun así el resultado se puede mostrar. */
  assert.equal(T.comoTermino({ Result: "1/2-1/2" },
    { white: { result: "agreed" }, black: { result: "agreed" } }).motivo, "acuerdo");
  assert.equal(T.comoTermino({ Result: "1/2-1/2" },
    { white: { result: "50move" }, black: { result: "50move" } }).motivo,
    "regla de 50 jugadas");
});

test("sin resultado conocido no se inventa nada", () => {
  /* Callarse es mejor que inventar: ahí la cabecera queda como estaba. */
  assert.equal(T.comoTermino({ Result: "*" }, null), null);
  assert.equal(T.comoTermino({}, null), null);
  assert.equal(T.comoTermino(null, null), null);
  /* y con un PGN pegado hay resultado pero no motivo: degrada, no se rompe */
  assert.deepEqual(T.comoTermino({ Result: "1-0" }, null), { res: "1-0", motivo: null });
});

test("el cierre cuenta JUGADAS DE AJEDREZ, no filas", () => {
  /* `filas.length` son medias jugadas: en la partida de prueba da 36 cuando en
     ajedrez son 18. El número sale del `n` de la última fila, que es el mismo
     que muestra la tarjeta del veredicto. Es lo que deja UN SOLO sistema de
     numeración en toda la vista. */
  const filas = [{ n: 1 }, { n: 1 }, { n: 2 }, { n: 2 }, { n: 3 }];
  const html_ = T.cierreDeLaTira({ res: "1-0", motivo: "abandono" }, filas);
  assert.ok(html_.includes("3 jugadas"), html_);
  assert.ok(!html_.includes("5 jugadas"), "5 son las filas, no las jugadas");
});

test("el cierre calla el motivo cuando no lo hay, y no aparece sin resultado", () => {
  assert.equal(T.cierreDeLaTira(null, [{ n: 3 }]), "");
  assert.equal(T.cierreDeLaTira({ res: "1-0", motivo: null }, []), "");
  const sinMotivo = T.cierreDeLaTira({ res: "1-0", motivo: null }, [{ n: 3 }]);
  assert.ok(sinMotivo.includes("<b>1-0</b> \u00b7 3 jugadas"), sinMotivo);
  /* desde la v0.74 el cierre es un eslabón MÁS de la tira horizontal, no un
     renglón abajo de una lista: por eso es un <span> y no un <div> */
  assert.ok(sinMotivo.startsWith("<span class=\"cierre\">"), sinMotivo);
});

test("la cabecera perdió el contador de medias jugadas", () => {
  /* Contaba plies, así que la misma posición tenía dos números en la misma
     pantalla: la tarjeta "18… Kg8" y el contador "36 de 36". */
  assert.ok(!html.includes("jugada ${IDX + 1} de"), "volvió el contador");
  assert.ok(!html.includes('id="revJugada"'), "y su elemento");
  assert.ok(html.includes('$("revFin").textContent = fin || "";'));
});

test("el nombre del rival cede y el resultado no", () => {
  /* El nombre de chess.com puede tener 25 caracteres: sin el recorte parte el
     renglón en dos y empuja el tablero hacia abajo. Medido: con el recorte,
     0 de 30 combinaciones de nombre y resultado envuelven. */
  /* desde la v0.123 vive en la barra de título: el nombre se recorta, la
     fuerza y el resultado nunca */
  assert.ok(html.includes(".cabTit .rival { font-weight: 700; min-width: 0; overflow: hidden; text-overflow: ellipsis; }"));
  assert.ok(html.includes(".cabTit .elo { flex: none;"));
  assert.ok(html.includes(".cabTit .fin { flex: none;"));
});

test("la tira se centra sola en la jugada actual", () => {
  /* De acá sale, sin ninguna regla extra, que SIEMPRE se vea que hay más para
     los dos lados cuando lo hay: la tira lleva la partida entera y la actual va
     al medio. Reemplaza al scroll de la lista vertical, que hasta la v0.73
     tenía además un caso especial para que el cierre se viera en la última. */
  assert.ok(html.includes("function centrarTira()"));
  assert.ok(html.includes("let x = sel.offsetLeft - (sc.clientWidth - sel.offsetWidth) / 2;"));
  assert.ok(html.includes("sc.scrollLeft = x;"));
  /* y el scroll se mueve a mano, no con scrollIntoView, que arrastra la página */
  const cuerpo = html.slice(html.indexOf("function centrarTira()"),
                            html.indexOf("function irA(i)"));
  assert.ok(!cuerpo.includes("scrollIntoView"));
});

test("con una variante la tira no corta una jugada contra ‹ ni pega la elegida a › (v0.182)", () => {
  /* el corte del borde izquierdo se corre al borde de una jugada, y al final
     el hueco de la cola se estira lo que falta; `mirar` lo mide en el navegador */
  const cuerpo = html.slice(html.indexOf("function centrarTira()"), html.indexOf("function irA(i)"));
  assert.ok(cuerpo.includes('classList.contains("conVariante")'));
  assert.ok(cuerpo.includes('sc.style.setProperty("--colaVar", (F + sig - max) + "px");'));
  assert.ok(html.includes('#zonaRevision.conVariante #tiraSc::after { content: ""; flex: 0 0 var(--colaVar, 24px); }'));
});

test("en la compu el orden de Tab sigue al de lectura, sin tabindex positivos (v0.182.1)", () => {
  assert.ok(html.includes("function ordenDeTab(compu)"));
  assert.ok(html.includes("ordenDeTab(window.matchMedia(CORTE_ANCHO).matches);"));
  /* las tres mejores, debajo de la curva, van detrás de Mejor en el HTML */
  assert.ok(html.includes('if (abajo) document.querySelector("#zonaRevision > .pabajo").after(a);'));
  assert.ok(!/tabindex="[1-9]/.test(html));
});

test("el cuadrito Mejor no corta \"la jugada\": si no entra dice \"esta\" (v0.182.2)", () => {
  assert.ok(html.includes('if ($("mMejor").textContent === "la jugada" && $("mMejor").scrollWidth > $("mMejor").clientWidth)'));
  assert.ok(html.includes('$("mMejor").textContent = "esta";'));
});

test("la tipografía se mide en el navegador, no se escriben números fijos", () => {
  /* `system-ui` es Roboto en Android y otra cosa en cada aparato, así que un
     número fijo alinearía bien en uno y mal en el resto. Y la base del renglón
     se mide con una sonda, no se calcula: calcularla obliga a suponer cómo
     reparte el interlineado el navegador. */
  const cuerpo = html.slice(html.indexOf("function medirTira()"),
                            html.indexOf("function centrarTira()"));
  assert.ok(cuerpo.includes("actualBoundingBoxAscent"), "la altura de la mayúscula");
  assert.ok(cuerpo.includes('display:inline-block;width:0;height:0'), "la sonda de la base");
  assert.ok(cuerpo.includes("--galon") && cuerpo.includes("--jgArriba"),
    "deja las dos correcciones en variables CSS");
  /* PRIMERO el recuadro y DESPUÉS el galón: repartir el relleno corre la base */
  assert.ok(cuerpo.indexOf("--jgArriba") < cuerpo.indexOf("--galon"),
    "el orden importa y está al revés");
  assert.ok(cuerpo.includes("const b2 = base()"), "la base se vuelve a medir después");
  assert.ok(cuerpo.includes("if (!cap) { TIRA_MEDIDA = true; return; }"),
    "sin la métrica, se queda con el relleno parejo en vez de romperse");
});

test("el JSON del mes viaja hasta la revisión (v0.63.1)", () => {
  /* El PGN trae el resultado pero NO el motivo —abandono, tiempo, acuerdo—:
     eso solo está en el JSON del mes. Se elige en la lista y se necesita mucho
     después, en la revisión.

     Hay TRES caminos a la revisión y en la v0.63 el motivo solo salía en uno:
     el del mes, que pega `r.meta = g` por su cuenta. El camino común —elegir
     una partida y analizarla— perdía el JSON, así que el motivo no aparecía
     nunca. Lo reportó el usuario. */
  assert.ok(html.includes("let ELEGIDA_META = null;"), "falta la global");
  assert.ok(html.includes("ELEGIDA_META = g;"), "no se guarda al elegir de la lista");
  assert.ok(html.includes("R.meta = ELEGIDA_META;"), "no se engancha al analizar");
  /* y se limpia en los dos lugares donde deja de haber partida elegida, o una
     partida pegada heredaría el motivo de la anterior */
  assert.equal((html.match(/ELEGIDA_META = null;/g) || []).length, 3,
               "la global, el reset de la lista y el PGN pegado");
});


/* ================= la explicación de la jugada (v0.64) ================== */

/* Todas estas prueban FRASES, y las frases son lo que el usuario lee. Cada una
   arma una fila de verdad con derivarFilas —no un objeto a mano— para que si
   un campo cambia de nombre o de signo, la prueba se caiga acá y no en el celu.
   Las posiciones se verifican con chess.js, nunca de memoria (§10). */

const SIN_LIBRO_EXP = { pos: new Set(), nombres: {} };
const unaFila = (fenAntes, san, evs, desde = 0) => {
  const j = new Chess(fenAntes);
  const hecho = j.move(san);
  assert.ok(hecho, san + " tiene que ser legal en " + fenAntes);
  return A.derivarFilas([hecho], [fenAntes, j.fen()], evs, SIN_LIBRO_EXP,
                        desde, "critico", null).filas[0];
};

/* la dama blanca se para en d5, donde la come el peón de e6 y nadie recaptura */
const DAMA_COLGADA = "4k3/8/4p3/8/8/8/8/3QK3 w - - 0 1";
const EVS_DAMA = () => [
  { cp: 400, mate: null, mejor: "d1d4", segunda: { cp: 380, mate: null } },
  { cp: 900, mate: null, mejor: "e6d5", segunda: null }
];

test("la explicación nombra la pieza y la casilla, que es lo que la señal no dice", () => {
  const f = unaFila(DAMA_COLGADA, "Qd5", EVS_DAMA());
  assert.equal(f.colgada, true);
  assert.equal(A.explicarJugada(f, "Qd4", null),
    "La dama queda comible en d5. La posición pasa de ganando a perdiendo.");
});

test("con el lado del usuario sabido, la frase tutea la pieza", () => {
  const f = unaFila(DAMA_COLGADA, "Qd5", EVS_DAMA());
  assert.ok(A.explicarJugada(f, "Qd4", true).startsWith("Tu dama"));
  assert.ok(A.explicarJugada(f, "Qd4", false).startsWith("La dama"),
    "la del rival no es tuya");
  assert.ok(A.explicarJugada(f, "Qd4", null).startsWith("La dama"),
    "con un PGN pegado no se sabe, y ahí no se tutea");
});

test("nunca más de dos frases: es una tarjeta de celular", () => {
  const f = unaFila(DAMA_COLGADA, "Qd5", EVS_DAMA());
  for (const mio of [true, false, null])
    assert.ok(A.explicarJugada(f, "Qd4", mio).split(". ").length <= 2);
});

test("el material se cuenta en peones, y nunca dice qué pieza es", () => {
  /* Torre blanca en d1 y dama negra colgada en d8: en vez de Rxd8 se toma el
     peón de a7. El campo `gana` es un VALOR y con recaptura es una diferencia, así que
     traducirlo a "una dama" sería inventar. */
  const f = unaFila("3qk3/p6p/8/8/8/8/7P/R2RK3 w - - 0 1", "Rxa7",
    [{ cp: 300, mate: null, mejor: "d1d8", segunda: null },
     { cp: -100, mate: null, mejor: "d8d1", segunda: null }]);
  const dice = A.explicarJugada(f, "Rxd8", true);
  assert.ok(dice.includes("que ganaba 4 peones"), dice);
  assert.ok(!/dama|torre|caballo|alfil/.test(dice.replace(/^.*?queda comible.*?\. /, "")),
    "el valor no nombra la pieza: " + dice);
  assert.equal(A.enPeones(1), "un peón", "y en singular no dice 1 peones");
});

test("un mate soltado se explica con la jugada que lo daba", () => {
  const { jugadas, fens } = A.prepararPartida("1. e4 e5");
  const f = A.derivarFilas(jugadas, fens, [
    { cp: null, mate: 8, mejor: "d4d5", segunda: null },
    { cp: -980, mate: null, mejor: "a7a6", segunda: null },
    { cp: 980, mate: null, mejor: "a2a3", segunda: null }
  ], SIN_LIBRO_EXP, 0, "critico", null, 99).filas[0];
  assert.equal(A.explicarJugada(f, "Rd5", true), "Había mate forzado en 8, con Rd5.");
  assert.equal(A.explicarJugada(f, null, true), "Había mate forzado en 8.",
    "sin el SAN de la mejor la frase se corta sola, no inventa");
});

test("el mate en contra se dice, y calla el rumbo: la evaluación está saturada", () => {
  /* 1. f3 e5 2. g4?? Qh4#. La posición la verifica chess.js. */
  const { jugadas, fens } = A.prepararPartida("1. f3 e5 2. g4 Qh4#");
  const f = A.derivarFilas(jugadas, fens, [
    { cp: 20, mate: null, mejor: "e2e4", segunda: null },
    { cp: -30, mate: null, mejor: "e7e5", segunda: null },
    { cp: 10, mate: null, mejor: "d2d4", segunda: null },
    { cp: null, mate: 1, mejor: "d8h4", segunda: null },
    { cp: null, mate: 0, mejor: null, segunda: null }
  ], SIN_LIBRO_EXP, 0, "critico", null).filas;
  assert.equal(f[2].mateContra, 1, "la fila guarda el número, no solo la señal");
  assert.equal(A.explicarJugada(f[2], "d4", true),
    "Deja mate forzado en 1 en contra. La mejor era d4.");
  assert.ok(!A.explicarJugada(f[2], "d4", true).includes("pasa de"),
    "con mate forzado el número está topeado en 1000 y el rumbo mentiría");
});

test('"era la única" solo lo dice el Genial que entró por el hueco', () => {
  /* La misma jugada con dos evaluaciones: una donde le saca 220 a la segunda y
     otra donde entra por cruce de banda. La categoría es la misma y la frase
     NO puede serlo: solo una de las dos significa "no había otra". */
  const antes = "r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4";
  const porHueco = unaFila(antes, "d3",
    [{ cp: 60, mate: null, mejor: "d2d3", segunda: { cp: -160, mate: null } },
     { cp: -60, mate: null, mejor: "d7d6", segunda: null }]);
  const porCruce = unaFila(antes, "d3",
    [{ cp: -250, mate: null, mejor: "d2d3", segunda: { cp: -290, mate: null } },
     { cp: 10, mate: null, mejor: "d7d6", segunda: null }]);
  assert.equal(porHueco.cat, "genial");
  assert.equal(porCruce.cat, "genial");
  assert.equal(porHueco.unicaBuena, true);
  assert.equal(porCruce.unicaBuena, false);
  assert.equal(A.explicarJugada(porHueco, null, true),
    "Era la única: la segunda del motor quedaba 2.20 atrás.");
  assert.equal(A.explicarJugada(porCruce, null, true),
    "La posición pasa de perdiendo a parejo.");
});

test("una forzada no se explica: no hubo nada que elegir", () => {
  /* rey blanco en h1 en jaque de la torre de a1, con g2 propio y h2 libre:
     Kh2 es la única legal, y chess.js lo confirma en la prueba de abajo */
  const f = unaFila("7k/8/8/8/8/8/6P1/r6K w - - 0 1", "Kh2",
    [{ cp: -900, mate: null, mejor: "h1g1", segunda: null },
     { cp: 900, mate: null, mejor: "a1a2", segunda: null }]);
  assert.equal(f.forzada, true, "tiene que ser la única legal");
  assert.equal(A.explicarJugada(f, null, true), "");
});

test("cuando no hay nada medido que decir, no se dice nada", () => {
  /* 2. Nf3, la mejor del motor, sin mecanismos y sin cambio de rumbo. Una
     frase de relleno en todas las jugadas enseña a no leer la tarjeta. */
  const { jugadas, fens } = A.prepararPartida("1. e4 e5 2. Nf3");
  const f = A.derivarFilas(jugadas, fens, [
    { cp: 20, mate: null, mejor: "e2e4", segunda: { cp: 10, mate: null } },
    { cp: -20, mate: null, mejor: "e7e5", segunda: null },
    { cp: 25, mate: null, mejor: "g1f3", segunda: { cp: 15, mate: null } },
    { cp: -25, mate: null, mejor: "b8c6", segunda: null }
  ], SIN_LIBRO_EXP, 0, "critico", null).filas[2];
  assert.equal(f.cat, "mejor");
  assert.equal(A.explicarJugada(f, null, true), "");
});

test("la explicación se deriva al pintar y no viaja en la caché", () => {
  /* Es lo que deja que una partida ya analizada estrene el texto sin volver a
     correr el motor: lo que se guarda son las evaluaciones, no las filas. */
  assert.ok(!html.includes("explicacion:"), "no hay campo guardado en la fila");
  assert.ok(html.includes("const partes = enInicio ? [] : partesDeLaExplicacion("),
    "se arma en pintarRevision, en cada pintada");
  const campos = (html.match(/const CAMPOS_FLACOS = \[([^\]]+)\]/) || [])[1];
  for (const c of ["oportunidad", "cap", "mateContra", "unicaBuena"])
    assert.ok(!campos.includes('"' + c + '"'), c + " no tiene por qué viajar a las tablas");
});

test("la explicación y la frase fija nunca aparecen juntas", () => {
  /* El interruptor de las tres ubicaciones vivió de la v0.64 a la v0.72 y
     cumplió: el usuario eligió mirándolas. Quedó una sola forma, y la regla que
     la ordena es que donde va una no va la otra —el eco de la v0.44—. */
  assert.ok(!html.includes("DONDE_EXP"), "el interruptor se fue entero");
  assert.ok(!html.includes('id="dondeExp"'), "y su selector también");
  assert.ok(html.includes('$("vSub").classList.toggle("oculto", hayExp);'));
  assert.ok(html.includes('$("vExp").classList.toggle("oculto", !hayExp);'));
  assert.ok(html.includes('$("senales").classList.toggle("oculto", !abajo);'));
});

/* ================== probar una jugada (v0.65) ==================== */

/* Esto vive en el DOM y en el motor, así que lo que se puede probar acá es la
   ESTRUCTURA: que el camino sea el mismo que el de la partida y que no escriba
   donde no debe. Lo que hace falta mirar en la pantalla está en capturas/. */

test("la jugada probada se juzga por el MISMO camino que las de la partida", () => {
  /* Si se juzgara aparte, el día que cambie cómo se categoriza una jugada la
     variante diría otra cosa que la partida, sobre la misma posición. */
  const cuerpo = html.slice(html.indexOf("function probarJugada"),
                            html.indexOf("const jugadaReal"));
  assert.ok(cuerpo.includes("derivarFilas("), "arma la fila con derivarFilas");
  assert.ok(cuerpo.includes("[antes.ev, ev]"),
    "la evaluación de ANTES ya estaba: la de la partida, o la que dejó la jugada anterior");
  assert.ok(cuerpo.includes("MATE_VISTA()"), "y respeta el dial del usuario");
  assert.ok(cuerpo.includes("antes.previa"),
    "la jugada previa va, o una recaptura de la variante no se reconocería");
  assert.ok(cuerpo.includes("p.desde0 + k"),
    "el número de jugada y el turno siguen la cuenta de la partida");
});

test("encadenar N jugadas cuesta N evaluaciones, no 2N", () => {
  /* La posición de la que sale cada jugada ya está evaluada: la de arranque
     viene de la partida y el resto las dejó la jugada anterior. */
  const cuerpo = html.slice(html.indexOf("function probarJugada"),
                            html.indexOf("const jugadaReal"));
  assert.equal((cuerpo.match(/evaluarPosiciones\(/g) || []).length, 1);
  const vista = html.slice(html.indexOf("const posicionAntesDe"),
                           html.indexOf("function abrirPrueba"));
  assert.ok(vista.includes("R.evs[p.desde0]"), "la de arranque sale de la partida");
  assert.ok(vista.includes("p.linea[k - 1].ev"), "y el resto, de la jugada anterior");
});

test("jugar parado en el medio de la variante corta lo que venía después", () => {
  const cuerpo = html.slice(html.indexOf("function probarJugada"),
                            html.indexOf("const jugadaReal"));
  assert.ok(cuerpo.includes("p.linea = p.linea.slice(0, p.ver);"));
});

/* --- la cola de la v0.79 --- */

test("jugar una prueba NO espera al motor", () => {
  /* Es el pedido del usuario, y es lo único que hace que el tablero no demore:
     `probarJugada` mete la jugada, pinta y vuelve. Todo lo que espera está en
     la cola, que corre después. */
  const cuerpo = html.slice(html.indexOf("function probarJugada"),
                            html.indexOf("async function atenderCola"));
  assert.ok(!/\bawait\b/.test(cuerpo), "sin await: no espera nada");
  assert.ok(!/^async function probarJugada/m.test(html), "y no es async");
  assert.ok(cuerpo.indexOf("pintarRevision()") < cuerpo.indexOf("atenderCola()"),
    "primero dibuja, después encola");
  assert.ok(cuerpo.includes("fila: deLaPartida ? real : null, error: null"),
    "la jugada entra a la línea sin veredicto —salvo la de la partida, que ya lo tiene—, y por eso se puede dibujar ya");
});

test("la cola evalúa de a una y en orden", () => {
  /* De a una porque el grupo de motores es uno solo (§4.2), y EN ORDEN porque
     cada jugada se juzga con la evaluación de la anterior. */
  const cola = html.slice(html.indexOf("async function atenderCola"),
                          html.indexOf("const jugadaReal"));
  assert.ok(cola.includes("if (!p || p.corriendo) return;"), "una sola corriendo");
  assert.ok(cola.includes("p.linea.findIndex(x => !x.fila && !x.error)"),
    "siempre la primera sin veredicto");
  assert.ok(cola.includes("finally { p.corriendo = false; }"),
    "y la cola se libera aunque algo falle");
});

test("lo que vuelve tarde no pisa la pantalla: se mira por identidad", () => {
  /* Encadenando, el largo de la línea cambia todo el tiempo sin que la jugada
     que volvió deje de ser la misma, así que compararlo ya no sirve. Si se
     cortó la línea, la jugada que vuelve ya no está en su lugar. */
  const cola = html.slice(html.indexOf("async function atenderCola"),
                          html.indexOf("const jugadaReal"));
  assert.ok(cola.includes("if (PRUEBA !== p || p.linea[k] !== e) return;"));
  assert.ok(!cola.includes("p.linea.length !== k"), "y ya no por el largo");
});

test("ir y volver por la variante no vuelve a llamar al motor", () => {
  const cuerpo = html.slice(html.indexOf("function verDeLaVariante"),
                            html.indexOf("function tocarCasilla"));
  assert.ok(!cuerpo.includes("evaluarPosiciones"), "solo cambia qué se muestra");
  assert.ok(cuerpo.includes("PRUEBA.ver = k;"));
});

test("las dos puertas arrancan de posiciones distintas", () => {
  /* El botón pregunta "¿y si en vez de esto?" y arranca ANTES de la jugada;
     tocar una pieza pregunta "¿y ahora qué?" y arranca DESPUÉS, que es también
     lo que deja probar las del rival: ahí le toca a él. */
  /* Desde la v0.74 la ÚNICA puerta es tocar una pieza: el botón que abría una
     "en vez de esta jugada" se fue con la fila de botones grandes, que vivía
     donde no se ve el tablero. Para reemplazar una jugada propia se vuelve una
     con el galón y se toca ahí. */
  assert.ok(!html.includes("abrirPrueba(IDX);"), "la puerta del botón se fue");
  /* Desde la v0.152 tocar la pieza solo la marca; la variante se abre al
     JUGAR, y desde la posición de después. */
  assert.ok(html.includes("if (m) { abrirPrueba(IDX + 1); return void probarJugada(m); }"),
    "queda la de tocar una pieza, que arranca de la posición de después");
  assert.ok(html.includes('$("btnProbar").onclick = seguro("volver de la variante", salirDePrueba);'),
    "y el botón que queda solo sirve para salir");
});

test("la comparación contra la jugada real es solo para la primera", () => {
  /* De la segunda en adelante la posición ya no es la de la partida, así que no
     hay contra qué comparar. */
  assert.ok(html.includes('(p.ver === 1 ? (f === real ? " · es la de la partida" : contra) : "")'));
});

test("probar no escribe en el análisis ni en la caché", () => {
  const cuerpo = html.slice(html.indexOf("async function probarJugada"),
                            html.indexOf("function textoPrueba"));
  assert.ok(!cuerpo.includes("cache."), "la caché no se toca");
  assert.ok(!/R\.filas\[[^\]]*\]\s*=/.test(cuerpo), "R.filas tampoco");
  assert.ok(!cuerpo.includes("R.evs ="), "ni las evaluaciones de la partida");
});

test("la prueba se evalúa a la profundidad de la partida", () => {
  /* Números de distinta profundidad no se comparan (§5.3), y todo el sentido de
     esto es comparar contra lo que se jugó. */
  assert.ok(html.includes("const prof = R.profBase || +$(\"prof\").value || 16;"));
});

test("cambiar de jugada corta la prueba", () => {
  /* Una prueba pertenece a UNA posición. Va en irA, que es por donde pasan
     todos los caminos: los botones, la tira, la curva, las flechas y el
     deslizamiento. */
  const cuerpo = html.slice(html.indexOf("function irA(i) {"),
                            html.indexOf("let VER_AMBOS"));
  assert.ok(cuerpo.includes("PRUEBA = null;"), "irA la corta");
});

test("el cuadrito Mejor es el interruptor de la preferencia (v0.117)", () => {
  /* Había dos controles para la misma pregunta; quedó uno. Si vuelve el botón
     o el vistazo de una jugada, son dos otra vez. */
  assert.ok(!html.includes('id="btnMejor"'), "el botón Siempre la mejor se fue");
  assert.ok(!/let MEJOR_EN|MEJOR_EN =/.test(html), "y el vistazo de una sola jugada");
  assert.ok(html.includes('$("tileMejor").onclick = alternarMejor;'), "el cuadrito alterna");
  const f = html.slice(html.indexOf("const alternarMejor"), html.indexOf('$("tileMejor").onclick'));
  assert.ok(f.includes('localStorage.setItem("siempreMejor"'), "y la preferencia se guarda");
});

test("las zonas de toque de los galones se fueron, y los galones se quedaron", () => {
  /* El comentario de la v32 lo venía anunciando: las zonas se comen 10 px de
     las columnas a y h, "si alguna vez se puede tocar una casilla, hay que
     reducirlas". Se sacaron enteras: tocar una pieza gana sobre tocar para
     navegar, porque navegar tiene otros cuatro caminos y el toque sobre la
     pieza no tiene ninguno. El DIBUJO del galón se queda: es lo que avisa que
     el tablero se desliza. */
  assert.ok(!html.includes("data-nav"), "no queda ninguna zona de navegación");
  assert.ok(html.includes("s += galon(M / 2 - 1, 1)"), "el dibujo se queda");
  assert.ok(html.includes('data-sq="${sq}"'),
    "y las 64 casillas del tablero reciben el toque (no las marcas de la explicación, que también llevan data-sq)");
});

test("el tablero se toca siempre, no solo con una variante abierta", () => {
  /* Es lo que hace que tocar una pieza sea la puerta de entrada: si las
     casillas solo existieran adentro del modo, habría que entrar al modo antes
     de poder tocar, que es justo lo que se sacó. */
  const cuerpo = html.slice(html.indexOf("el tablero se toca SIEMPRE"),
                            html.indexOf('return s + "</svg>"'));
  assert.ok(!/if \(prueba\) \{[\s\S]*data-sq/.test(cuerpo),
    "las casillas no cuelgan de que haya prueba");
  assert.ok(cuerpo.includes("if (prueba && prueba.desde)"),
    "lo que sí depende de la prueba son las marcas");
});

test("deslizar recorre la variante cuando hay una abierta", () => {
  const cuerpo = html.slice(html.indexOf('$("tablero").addEventListener("touchend"'),
                            html.indexOf('$("tablero").addEventListener("click"'));
  assert.ok(cuerpo.includes("if (dx < 0) adelante(); else atras();"),
    "el mismo gesto para la misma promesa");
  assert.ok(html.includes("const atras = () => PRUEBA ? verDeLaVariante(PRUEBA.ver - 1) : irA(IDX - 1);"),
    "y adentro de la variante, anterior es la posición anterior DE LA VARIANTE");
});

test("no se puede probar mientras corre un análisis", () => {
  /* Los dos usan el mismo grupo de motores, y `pool.asegurar` puede cambiarle
     el MultiPV o el Hash a motores que están trabajando. */
  const cuerpo = html.slice(html.indexOf("function ocupado(si) {"),
                            html.indexOf("async function correrMes"));
  /* desde la v0.74 la variante se abre TOCANDO EL TABLERO y no con un botón,
     así que lo que se apaga es el toque y no un `disabled` */
  assert.ok(cuerpo.includes("TRABAJANDO = si;"));
  assert.ok(html.includes("if (TRABAJANDO) return;"), "y el tablero lo mira");
});

test("la coronación va a dama sin preguntar, y está dicho", () => {
  assert.ok(html.includes('(!x.promotion || x.promotion === "q")'));
});


/* --------- lo que la explicación aprendió a decir en la v0.67 --------- */

test("una captura sin recaptura nombra la pieza; con recaptura, el saldo", () => {
  /* Las dos frases dicen cosas distintas y las dos son ciertas. Nombrar la
     pieza cuando hay recaptura mentiría: cobrás una y entregás otra. */
  /* Dama negra colgada en a8 y el rey negro lejos: Qxa8 no se recaptura. En vez
     de eso las blancas mueven el rey. Las dos posiciones las verifica chess.js. */
  const sinRecaptura = unaFila("q6k/8/8/8/8/8/8/Q3K3 w - - 0 1", "Kf2",
    [{ cp: 300, mate: null, mejor: "a1a8", segunda: null },
     { cp: -100, mate: null, mejor: "h8g8", segunda: null }]);
  assert.equal(sinRecaptura.oportunidad.comida, "q", "se comía la dama");
  assert.equal(sinRecaptura.oportunidad.gana, 9, "y nadie recapturaba");
  assert.ok(A.explicarJugada(sinRecaptura, null, true).includes("se llevaba la dama"),
    A.explicarJugada(sinRecaptura, null, true));

  /* Torre d1 contra dama d8, pero el rey de e8 recaptura: ahí el saldo es 4 y
     nombrar la dama mentiría, porque entregás la torre. */
  const conRecaptura = unaFila("3qk3/p6p/8/8/8/8/7P/R2RK3 w - - 0 1", "Rxa7",
    [{ cp: 300, mate: null, mejor: "d1d8", segunda: null },
     { cp: -100, mate: null, mejor: "d8d1", segunda: null }]);
  assert.equal(conRecaptura.oportunidad.gana, 4, "9 de la dama menos 5 de la torre");
  const dice = A.explicarJugada(conRecaptura, null, true);
  assert.ok(dice.includes("ganaba 4 peones en el cambio"), dice);
  assert.ok(!dice.includes("la dama"), "no puede nombrar una pieza que se paga: " + dice);
});

test("la respuesta del rival sale de una evaluación que ya estaba hecha", () => {
  /* Es la mejor de la posición SIGUIENTE, que el motor ya evaluó: la tarjeta la
     dice sin una sola llamada más. */
  const { jugadas, fens } = A.prepararPartida("1. e4 e5 2. Nf3");
  const filas = A.derivarFilas(jugadas, fens, [
    { cp: 20, mate: null, mejor: "e2e4", segunda: { cp: 10, mate: null } },
    { cp: -20, mate: null, mejor: "e7e5", segunda: null },
    { cp: 25, mate: null, mejor: "g1f3", segunda: { cp: 15, mate: null } },
    { cp: -25, mate: null, mejor: "b8c6", segunda: null }
  ], SIN_LIBRO_EXP, 0, "critico", null).filas;
  assert.equal(filas[2].mejorRival, "b8c6", "la mejor de la posición siguiente");
  assert.equal(A.explicarJugada(filas[2], null, true, "Nc6"), "El rival tiene Nc6.");
});

test("la respuesta del rival va última, y no tapa a lo que importa", () => {
  /* Casi siempre hay una, así que si fuera antes taparía a todo lo demás. */
  const f = unaFila(DAMA_COLGADA, "Qd5", EVS_DAMA());
  const dice = A.explicarJugada(f, "Qd4", true, "exd5");
  assert.ok(dice.startsWith("Tu dama queda comible"), dice);
  assert.ok(!dice.includes("El rival tiene"), "no entra: ya hay dos frases");
});

test("la alternativa no repite la jugada que la frase anterior ya nombró", () => {
  /* "Había mate forzado en 8, con Rd5. La mejor era Rd5." es el mismo eco que
     la v0.44 le sacó a las leyendas. */
  const { jugadas, fens } = A.prepararPartida("1. e4 e5");
  const f = A.derivarFilas(jugadas, fens, [
    { cp: null, mate: 8, mejor: "d4d5", segunda: null },
    { cp: -980, mate: null, mejor: "a7a6", segunda: null },
    { cp: 980, mate: null, mejor: "a2a3", segunda: null }
  ], SIN_LIBRO_EXP, 0, "critico", null, 99).filas[0];
  assert.equal(A.explicarJugada(f, "Rd5", true), "Había mate forzado en 8, con Rd5.");
});

test("una recaptura se dice, porque no es ni mérito ni descuido", () => {
  /* Es la misma distinción que le sacó los falsos positivos a "Genial": el
     material ya estaba perdido y solo lo estás recuperando. */
  const antes = "rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2";
  const j = new Chess(antes);
  const previa = { from: "d7", to: "d5", captured: undefined };
  const hecho = j.move("exd5");
  assert.ok(hecho, "exd5 tiene que ser legal");
  const f = A.derivarFilas([hecho], [antes, j.fen()], [
    { cp: 30, mate: null, mejor: "b1c3", segunda: { cp: 20, mate: null } },
    { cp: -30, mate: null, mejor: "d8d5", segunda: null }
  ], SIN_LIBRO_EXP, 2, "critico", null, 3,
     { from: "e4", to: "d5", captured: "p" }).filas[0];
  assert.equal(f.esRecaptura, true, "el rival comió en d5 y se recuperó ahí");
  assert.ok(A.explicarJugada(f, null, true).startsWith("Es una recaptura"),
    A.explicarJugada(f, null, true));
});

/* ---------- mirar la posición, no solo la fila (v0.68) ---------- */

test("observarJugada ve qué ataca la jugada, y solo lo que vale más", () => {
  /* d4 le pega al alfil de c5 con un peón. Un peón vale menos que un alfil, así
     que es una amenaza; atacar algo que vale igual o menos es una oferta de
     cambio y no cuenta. La posición la verifica chess.js. */
  const antes = "rnbqk1nr/pppp1ppp/8/2b1p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 4 3";
  const f = unaFila(antes, "d4",
    [{ cp: 30, mate: null, mejor: "d2d4", segunda: { cp: 10, mate: null } },
     { cp: -30, mate: null, mejor: "c5d4", segunda: null }], 4);
  const obs = A.observarJugada(f);
  assert.deepEqual(obs.amenazadas, [{ sq: "c5", pieza: "b" }]);
  assert.equal(A.explicarJugada(f, null, true, null, obs),
    "Ataca el alfil de c5 con un peón.");
});

test("una jugada que da jaque no dice que ataca al rey", () => {
  /* Con el turno dado vuelta, chess.js ofrece capturar al rey. Atacar al rey es
     dar jaque, y eso ya lo dice el propio SAN con su "+". */
  const antes = "rnbqkbnr/pppp1ppp/8/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 2 3";
  const f = unaFila(antes, "Bxf7+",
    [{ cp: 30, mate: null, mejor: "c4f7", segunda: { cp: 10, mate: null } },
     { cp: -30, mate: null, mejor: "e8f7", segunda: null }], 4);
  const obs = A.observarJugada(f);
  assert.ok(!obs.amenazadas.some(a => a.pieza === "k"),
    "el rey no está en la lista: " + JSON.stringify(obs.amenazadas));
});

test("observarJugada ve la pieza que ESTA jugada dejó sin defender", () => {
  /* Es el caso de la captura del usuario: "tu peón estaba defendido, pero ahora
     está indefenso". El peón de e4 lo defendía el de d3; al avanzar a d4, el
     defensor se fue y el caballo de f6 se lo lleva gratis. La jugada no toca la
     pieza que queda colgada, que es lo que hasta la v0.67 no se veía.
     Las dos posiciones las verifica chess.js. */
  const antes = "4k3/8/5n2/8/4P3/3P4/8/4K3 w - - 0 1";
  const f = unaFila(antes, "d4",
    [{ cp: 100, mate: null, mejor: "e1e2", segunda: { cp: 80, mate: null } },
     { cp: 100, mate: null, mejor: "f6e4", segunda: null }]);
  const obs = A.observarJugada(f, antes);
  assert.deepEqual(obs.nuevas, [{ sq: "e4", pieza: "p", motivo: "sinDefensa", por: "n" }]);
  assert.ok(A.explicarJugada(f, null, true, null, obs)
    .startsWith("Tu peón de e4 queda sin defender."),
    A.explicarJugada(f, null, true, null, obs));
  assert.deepEqual(A.observarJugada(f).nuevas, [],
    "sin la posición de antes no se puede saber, y no se inventa");
});

test("una pieza que YA venía colgada no se le echa a esta jugada", () => {
  /* Torre blanca en h5 que la torre de h8 ya miraba antes de mover el peón de
     a2: comparar antes contra después es lo que separa "esto pasa" de "esto lo
     causó la jugada". */
  const antes = "4k2r/8/8/7R/8/8/P7/4K3 w k - 0 1";
  const f = unaFila(antes, "a4",
    [{ cp: 100, mate: null, mejor: "h5h8", segunda: { cp: 80, mate: null } },
     { cp: 400, mate: null, mejor: "h8h5", segunda: null }]);
  const obs = A.observarJugada(f, antes);
  assert.deepEqual(obs.colgadas, [{ sq: "h5", pieza: "r", motivo: "sinDefensa", por: "r" }], "colgada sí está");
  assert.deepEqual(obs.nuevas, [], "pero no es nueva, y por eso no se dice");
});

test("lo que la jugada SALVA es el espejo, y es lo que faltaba para el rival", () => {
  /* La misma posición al revés: el peón de e4 está colgado —el caballo de f6 lo
     mira y nadie lo defiende— y las blancas lo defienden con d3. Es "tu rival
     defendió su peón amenazado", que es media revisión de chess.com. */
  const antes = "4k3/8/5n2/8/4P3/8/3P4/4K3 w - - 0 1";
  const f = unaFila(antes, "d3",
    [{ cp: 100, mate: null, mejor: "d2d3", segunda: { cp: 80, mate: null } },
     { cp: -100, mate: null, mejor: "f6d5", segunda: null }]);
  const obs = A.observarJugada(f, antes);
  assert.deepEqual(obs.salvadas, [{ sq: "e4", pieza: "p", motivo: "sinDefensa", por: "n", seFue: false,
                                     como: "defiende" }]);
  /* desde la v1.0.4 dice cómo: el peón de d3 lo cuida (Juan, "Salva" exageraba) */
  assert.equal(A.explicarJugada(f, null, true, null, obs),
    "Defiende tu peón de e4, que estaba solo.");
});

test("'Salva' no exagera: dice si la jugada defiende, tapa o saca (v1.0.4)", () => {
  /* Juan, 20-nov: Bh6 cuida la dama de g7, pero Qxg7 Bxg7 cambia damas;
     "Salva tu dama" prometía de más. Tres verbos según cómo. */
  const frase = (antes, uci) => {
    const j = new Chess(antes);
    const m = j.move({ from: uci.slice(0, 2), to: uci.slice(2, 4) });
    const f = { fen: j.fen(), uci, turno: m.color, pieza: m.piece, san: m.san, cat: "buena", mejor: uci };
    const obs = mirar(antes, uci);
    return { obs, txt: A.explicarJugada(f, null, true, null, obs) };
  };
  const bh6 = frase("r1b1k1nr/pppp1pQp/2n2q2/8/2B1P3/8/PPP2PPP/RNB1K2R w KQkq - 0 1", "c1h6");
  assert.equal(bh6.obs.salvadas[0].sq, "g7");
  assert.equal(bh6.obs.salvadas[0].como, "defiende");
  assert.ok(bh6.txt.includes("Defiende tu dama de g7, que estaba sola."), bh6.txt);
  assert.ok(!bh6.txt.includes("Salva"), bh6.txt);
  /* interponerse: el alfil de b5 corta la dama de d7 contra el peón de a4 */
  const tapa = frase("4k3/3q4/8/8/P7/8/8/4KB2 w - - 0 1", "f1b5");
  assert.equal(tapa.obs.salvadas[0].como, "tapa");
  assert.ok(tapa.txt.includes("Tapa el ataque a tu peón de a4."), tapa.txt);
  /* el peón va en masculino: "solo" */
  const solo = frase("4k3/8/5n2/8/4P3/8/3P4/4K3 w - - 0 1", "d2d3");
  assert.ok(solo.txt.includes("Defiende tu peón de e4, que estaba solo."), solo.txt);
  /* revisor de ajedrez, v1.0.4: comer al atacante es "Salva", aunque la
     pieza que come quede cuidándola (Bxd4 en la partida de prueba) */
  const bxd4 = frase("r1bqk1nr/pppp1ppp/8/2b1n3/2BPP3/8/PPP2PPP/RNBQK2R b KQkq d3 0 5", "c5d4");
  assert.ok(bxd4.txt.includes("Salva tu caballo de e5"), bxd4.txt);
  /* con "a tiro de" nunca "Defiende": cxd4 come al peón y la dama sigue
     mirando e5 (revisor, segunda vuelta) */
  const cxd4 = frase("4k3/8/3p4/2p1n3/3P4/8/7Q/4K3 b - - 0 1", "c5d4");
  assert.ok(cxd4.txt.includes("Salva el caballo de e5, que estaba a tiro de un peón.") ||
            cxd4.txt.includes("Salva tu caballo de e5, que estaba a tiro de un peón."), cxd4.txt);
  /* clavar al atacante, también */
  const rd5 = frase("3R4/8/8/k1p5/3N4/8/8/4K3 w - - 0 1", "d8d5");
  assert.ok(!rd5.txt.includes("Defiende"), rd5.txt);
  /* la defensa destapada con cambio parejo es "Defiende", como Bh6 */
  const nd3 = frase("3qk3/8/8/8/RN1Q4/8/8/4K3 w - - 0 1", "b4d3");
  assert.ok(nd3.txt.includes("Defiende tu dama de d4, que estaba sola."), nd3.txt);
  /* el enroque saca la torre: "Saca", y la marca va adonde fue */
  const ant = "b3k3/8/8/8/8/8/8/4K2R w K - 0 1";
  const oo = mirar(ant, "e1g1");
  assert.equal(oo.salvadas[0].como, "saca");
  assert.equal(oo.salvadas[0].hacia, "f1");
  const j = new Chess(ant); j.move("O-O");
  const txtOO = A.explicarJugada({ fen: j.fen(), uci: "e1g1", turno: "w", pieza: "k", san: "O-O",
                                   cat: "buena", mejor: "e1g1" }, null, true, null, oo);
  assert.ok(txtOO.includes("Saca tu torre de h1, que estaba a tiro de un alfil."), txtOO);
  /* y la que se va sigue siendo "Saca" */
  const saca = frase("4k3/8/5n2/8/4P3/8/8/4K3 w - - 0 1", "e4e5");
  assert.ok(saca.txt.startsWith("Saca tu peón de e4"), saca.txt);
});

test("sacar la pieza colgada no es lo mismo que defenderla", () => {
  /* Si la pieza que estaba colgada es la que se movió, no la defendiste: la
     sacaste. Son dos frases porque son dos cosas. */
  const antes = "4k3/8/5n2/8/4P3/8/8/4K3 w - - 0 1";
  const f = unaFila(antes, "e5",
    [{ cp: 100, mate: null, mejor: "e4e5", segunda: { cp: 80, mate: null } },
     { cp: -100, mate: null, mejor: "f6d5", segunda: null }]);
  const obs = A.observarJugada(f, antes);
  assert.equal(obs.salvadas.length, 1);
  assert.equal(obs.salvadas[0].seFue, true, "la casilla de la que salió la jugada");
  assert.ok(A.explicarJugada(f, null, true, null, obs).startsWith("Saca tu peón de e4"),
    A.explicarJugada(f, null, true, null, obs));
});

test("la explicación en partes dice qué señala cada frase", () => {
  /* Es lo que deja que tocar la frase encienda el tablero: no te lo explica, te
     lo muestra. La cadena se sigue armando igual, que es el join de las partes. */
  const antes = "4k3/8/5n2/8/4P3/3P4/8/4K3 w - - 0 1";
  const f = unaFila(antes, "d4",
    [{ cp: 100, mate: null, mejor: "e1e2", segunda: { cp: 80, mate: null } },
     { cp: 100, mate: null, mejor: "f6e4", segunda: null }]);
  const partes = A.partesDeLaExplicacion(f, "Ke2", true, null, A.observarJugada(f, antes));
  assert.equal(partes[0].sq, "e4", "la frase del peón señala e4");
  assert.equal(partes[1].uci, "e1e2", "la de la alternativa señala la jugada");
  assert.equal(A.explicarJugada(f, "Ke2", true, null, A.observarJugada(f, antes)),
    partes.map(p => p.txt).join(" "), "la cadena es el join de las partes");
});

test("el turno dado vuelta limpia el paso al vuelo", () => {
  /* Un FEN con un al paso que ya no significa nada es un FEN inválido, y
     chess.js lo rechaza sin decir por qué. */
  assert.ok(html.includes('p[3] = "-";'));
  assert.ok(html.includes("const conElTurnoDadoVuelta"));
});

test("lo que mira la posición NO vive en derivarFilas", () => {
  /* Es lo que lo hace posible: derivarFilas corre en el bucle de un año de
     partidas y esto se calcula al pintar UNA tarjeta. */
  const cuerpo = html.slice(html.indexOf("function derivarFilas"),
                            html.indexOf("function mediana"));
  assert.ok(!cuerpo.includes("observarJugada"), "el barrido no lo paga");
  assert.ok(html.includes("observarJugada(f, fenDeLaJugada(IDX))"),
    "la pantalla sí lo pide, y con la posición de antes para poder comparar");
});

test("la fila de botones grandes se fue entera", () => {
  /* Vivía abajo de todo, o sea donde no se ve el tablero, y el usuario lo
     resumió así: "cualquier navegación que se haga sin ver lo que se navega no
     sirve de nada". Con ella se fue el botón que cambiaba de color según el
     veredicto, que era lo único que usaba CATS_PARA_REINTENTAR. */
  assert.ok(!html.includes("CATS_PARA_REINTENTAR"), "y su criterio, que no usa nadie más");
  assert.ok(!html.includes("button.primario"), "ni el estilo del botón grande");
  assert.ok(!html.includes('class="nav"'), "ni la fila");
  assert.ok(html.includes("const esMala = f => f.perdida >= 3;"),
    "el criterio de las TABLAS no se toca: ese mueve números");
});

test("hay una partida de prueba donde el ataque doble se dispara", () => {
  /* "Se puede forzar?" — sí, y de la única forma honesta: con una partida donde
     pasa de verdad. En la jugada 5 el peón de d4 ataca al alfil de c5 y al
     caballo de e5, los dos valen más que un peón, y la posición la verifica
     chess.js acá mismo. */
  const pgn = fs.readFileSync(new URL("./partida-doble.pgn", import.meta.url), "utf8");
  const j = new Chess();
  assert.ok(j.load_pgn(pgn), "el PGN de prueba tiene que ser legal");
  const { jugadas, fens } = A.prepararPartida(pgn);
  const i = 8;  /* 5. d4, la novena media jugada */
  assert.equal(jugadas[i].san, "d4");
  const f = A.derivarFilas([jugadas[i]], [fens[i], fens[i + 1]],
    [{ cp: 40, mate: null, mejor: "c4b5", segunda: { cp: 20, mate: null } },
     { cp: -40, mate: null, mejor: "c5d4", segunda: null }],
    SIN_LIBRO_EXP, i, "critico", null).filas[0];
  const obs = A.observarJugada(f, fens[i]);
  assert.deepEqual(obs.amenazadas.map(a => a.sq).sort(), ["c5", "e5"]);
  const partes = A.partesDeLaExplicacion(f, "Bb5", true, null, obs);
  assert.equal(partes[0].txt, "Es un ataque doble: el alfil de c5 y el caballo de e5.");
  assert.equal(partes[0].marca, "ataque doble", "el concepto es lo que se toca");
  assert.deepEqual(partes[0].sq, ["c5", "e5"], "y enciende las dos casillas");
});


test("cada frase que señala algo trae el nombre de su concepto, y está en la frase", () => {
  /* La marca es el pedacito que se toca. Si dejara de aparecer en el texto —un
     cambio de redacción que se olvida de actualizarla— la frase saldría entera
     y sin resaltar, que es feo y silencioso. Esta prueba lo agarra.
     Se barren todas las jugadas de las cuatro partidas de prueba. */
  const partidas = ["de-prueba", "mate", "ahogado", "doble"];
  let miradas = 0, conMarca = 0;
  for (const nombre of partidas) {
    const pgn = fs.readFileSync(new URL(`./partida-${nombre}.pgn`, import.meta.url), "utf8");
    const { jugadas, fens } = A.prepararPartida(pgn);
    for (let i = 0; i < jugadas.length; i++) {
      /* evaluaciones inventadas pero VARIADAS, para que caigan categorías
         distintas y se recorran todas las ramas de la redacción */
      const evs = [
        { cp: (i * 137) % 700 - 350, mate: null, mejor: fens[i + 1] ? null : null,
          segunda: { cp: (i * 91) % 500 - 250, mate: null } },
        { cp: (i * 211) % 700 - 350, mate: null, mejor: null, segunda: null }
      ];
      const j = new Chess(fens[i]);
      const legales = j.moves({ verbose: true });
      evs[0].mejor = legales.length
        ? legales[i % legales.length].from + legales[i % legales.length].to : null;
      const f = A.derivarFilas([jugadas[i]], [fens[i], fens[i + 1]], evs,
        { pos: new Set(), nombres: {} }, i, "critico", null, 3,
        jugadas[i - 1] || null).filas[0];
      const obs = A.observarJugada(f, fens[i]);
      for (const p of A.partesDeLaExplicacion(f, "Nf3", true, "Nc6", obs)) {
        miradas++;
        if (!p.sq && !p.uci) continue;   /* sin referencia no hace falta marca */
        conMarca++;
        assert.ok(p.marca, "frase sin concepto: " + p.txt);
        assert.ok(p.txt.includes(p.marca),
          `el concepto "${p.marca}" no está en la frase "${p.txt}"`);
      }
    }
  }
  assert.ok(miradas > 100, "se miraron pocas frases: " + miradas);
  assert.ok(conMarca > 20, "se miraron pocas frases con referencia: " + conMarca);
});

test("sacar la línea de señales no pierde nada: la tarjeta ya lo dice todo", () => {
  /* La línea de señales se fue en la v0.73 porque aparecía y desaparecía entre
     los cuadritos y la curva, y la pantalla saltaba al pasar de jugada. Antes
     de sacarla se midió, y esta prueba es esa medición: para cada señal que
     sale, la explicación de la tarjeta tiene que decir lo mismo.
     Se barren las cuatro partidas de prueba con CINCO juegos de evaluaciones
     inventadas cada una, para caer en muchas categorías y no en las que da una
     sola tabla. */
  const EQUIVALE = [
    [/^permite mate forzado/,          /Deja mate forzado/],
    [/^la pieza movida queda comible/, /queda comible en/],
    [/^había mate forzado/,            /Había mate forzado/],
    [/^había .*, que /,                /Había /],
    [/^la tomaste con otra pieza/,     /La captura iba con otra pieza/],
  ];
  let conSenal = 0, sinDecir = 0, ejemplo = "";
  for (const nombre of ["de-prueba", "mate", "ahogado", "doble"]) {
    const pgn = fs.readFileSync(new URL(`./partida-${nombre}.pgn`, import.meta.url), "utf8");
    const { jugadas, fens } = A.prepararPartida(pgn);
    for (let semilla = 0; semilla < 5; semilla++) {
      for (let i = 0; i < jugadas.length; i++) {
        const leg = new Chess(fens[i]).moves({ verbose: true });
        if (!leg.length) continue;
        const m = leg[(i * 7 + semilla * 3) % leg.length];
        const f = A.derivarFilas([jugadas[i]], [fens[i], fens[i + 1]], [
          { cp: ((i * 137 + semilla * 311) % 1400) - 700, mate: null,
            mejor: m.from + m.to,
            segunda: { cp: ((i * 91 + semilla * 53) % 900) - 450, mate: null } },
          { cp: ((i * 211 + semilla * 97) % 1400) - 700, mate: null,
            mejor: null, segunda: null }
        ], { pos: new Set(), nombres: {} }, i, "critico", null, 3,
           jugadas[i - 1] || null).filas[0];
        if (!f.senales.length) continue;
        conSenal++;
        const txt = A.explicarJugada(f, "Nf3", true, "Nc6", A.observarJugada(f, fens[i]));
        for (const s of f.senales) {
          const par = EQUIVALE.find(([re]) => re.test(s));
          if (!par || !par[1].test(txt)) {
            sinDecir++;
            if (!ejemplo) ejemplo = `señal "${s}" contra texto "${txt}"`;
          }
        }
      }
    }
  }
  assert.ok(conSenal > 20, "se miraron pocas jugadas con señales: " + conSenal);
  assert.equal(sinDecir, 0, "la tarjeta se come una señal: " + ejemplo);
  /* y el renglón queda SOLO para la segunda opinión, que no es una señal */
  assert.ok(html.includes("const abajo = f.rev"), "el renglón vive solo para el rev");
  assert.ok(!html.includes("const notas = f.senales.slice();"), "la lista se fue");
});

/* ============== la vista Partida, rehecha (v0.74) ============== */

test("el orden de la vista es el que se eligió mirando las seis maquetas", () => {
  /* cabecera · barra · TARJETA · tablero · tira · curva · cuadritos · controles.
     La tarjeta va ARRIBA del tablero: se lee primero. */
  const z = html.slice(html.indexOf('<div id="zonaRevision"'),
                       html.indexOf('<div id="zonaResumen"'));
  const orden = ['class="cabTit"', 'id="evalh"', 'id="veredicto"', '"revtab"', 'id="tira"',
                 'id="curva"', '"metricas"'];
  let antes = -1;
  for (const q of orden) {
    const i = z.indexOf(q);
    assert.ok(i > antes, "fuera de orden: " + q);
    antes = i;
  }
  /* y la tarjeta de la variante va pegada arriba de la del veredicto */
  assert.ok(z.indexOf('id="prueba"') < z.indexOf('id="veredicto"'));
});

test("la barra y la tarjeta no quedan pegadas", () => {
  /* Pasó al reordenar: la barra no tiene margen abajo y la tarjeta no tenía
     arriba, y hasta la v0.73 no hacía falta porque entre las dos estaba el
     tablero. Mover un elemento le cambia los márgenes a sus DOS vecinos. */
  assert.ok(/\.veredicto \{[^}]*margin-top: (10px|var\(--e-2\))/.test(html));
});

test("la tira lleva la partida entera, no una ventana", () => {
  /* De ahí sale que siempre se vea que hay más para los dos lados cuando lo
     hay: no hay ningún N que elegir.

     Desde la v0.76 la tira se corta en UN solo caso —con las jugadas probadas
     dibujadas abajo, y corta justo donde se abrió la prueba—, y eso NO es una
     ventana: el corte sale de la variante y no de un largo elegido. Lo que esta
     prueba fija es eso: o la partida entera, o hasta donde arrancó la prueba. */
  /* (desde la v0.171 corta solo si la variante va en la tira: en la compu
     va en la planilla y la tira lleva la partida entera) */
  assert.ok(html.includes("const hasta = varEnTira ? PRUEBA.desde0 : R.filas.length;"),
    "o entera, o hasta donde se abrió la prueba");
  assert.ok(html.includes("$(\"tiraSc\").innerHTML = R.filas.slice(0, hasta).map((x, i) =>"),
    "se dibujan TODAS las filas hasta ahí");
  /* LA LISTA VERTICAL VOLVIÓ EN LA v0.80, pero no acá: vive en la columna de al
     lado, que SOLO existe de 1000 px para arriba. Lo que la v0.74 decidió —en
     el celular, la tira y nada más— sigue en pie, y es lo que esta prueba fija
     ahora: que la lista esté en la lateral y que la lateral no se vea sin
     pantalla ancha. Antes decía `!html.includes('id="jugadas"')`, que era la
     misma idea escrita cuando la lista no existía en ningún lado. */
  assert.ok(html.includes('<aside class="lateral" id="lateral">'),
    "la lista vertical vive en la columna de al lado");
  /* Desde la v0.95 lo que se esconde de la lista es su ENVASE y no la lista:
     el envase es el hijo de la grilla y es lo que sujeta al `sticky`
     (§4octovicies). El dial de `.soloAncho` se fue en la v0.160. */
  assert.ok(html.includes(".colLista { display: none; }"),
    "y sin pantalla ancha no se ve: en el celular sigue estando solo la tira");
  assert.ok(html.includes('<div class="colLista">'),
    "la lista va adentro de su envase, o el sticky se mete abajo de la curva");
  assert.ok(html.includes("mask-image: linear-gradient(to right, transparent 0, #000 24px"),
    "y las puntas se desvanecen en vez de cortarse");
});

/* LO REPORTADO DESDE UNA COMPU (v0.80). Tres cosas distintas que salieron de la
   misma causa: el archivo entero tenía UNA media query y era la de claro contra
   oscuro, así que nadie había mirado la app en una pantalla ancha. */

test("el menú de un select no queda blanco sobre blanco", () => {
  /* Chrome en Windows dibuja el desplegable con el fondo del propio select, y
     el nuestro es transparente: el menú salía blanco y el texto de las opciones
     —heredado del papel oscuro— también. Se veía UNA sola opción, la resaltada.
     Desde la v0.96 la app es siempre oscura: los colores son los de la paleta
     (--elevada y --texto), no los de sistema, que ya no hace falta que sigan
     ningún esquema. */
  assert.ok(/option\s*{[^}]*background-color:\s*var\(--elevada\)/.test(html),
    "el option lleva fondo propio");
  assert.ok(/option\s*{[^}]*color:\s*var\(--texto\)/.test(html),
    "y color propio, los dos de la paleta");
});

test("la tira se puede arrastrar y ruedear con el mouse", () => {
  /* Con el dedo la tira se scrollea sola; con mouse, arrastrar un overflow-x
     selecciona el texto y la rueda vertical no la mueve. */
  assert.ok(html.includes('sc.addEventListener("pointerdown"'), "se arrastra");
  assert.ok(html.includes('if (e.pointerType !== "mouse") return;'),
    "y el dedo sigue por el camino de siempre, sin tocar");
  assert.ok(html.includes("if (sc.scrollWidth <= sc.clientWidth) return;"),
    "la rueda solo se roba el gesto cuando hay para dónde ir");
  assert.ok(html.includes("if (!arrastro && Math.abs(d) < 4) return;"),
    "y un clic sigue siendo un clic: el temblor de la mano no cuenta");
});

test("el menú de ajustes se lleva los select y tiene por dónde salir", () => {
  /* v0.91. Lo que fija esta prueba es lo que se decidió mirando, y sobre todo
     lo que NO se puede romper sin que se note: que los <select> de preferencias
     estén ADENTRO de la hoja y no sueltos en la fila del pie —si vuelven, la
     fila crece de 37 px a 156 y el tablero deja de entrar—, y que la hoja tenga
     las tres salidas. Una hoja que tapa media pantalla sin forma de cerrarse es
     el peor modo de falla de este cambio. */
  const hoja = html.slice(html.indexOf('<div id="hojaAjustes"'),
                          html.indexOf('<p class="pie"'));
  for (const id of ["tema", "verEval", "largoExp", "nombreAp", "formaPrueba"])
    assert.ok(hoja.includes(`<select id="${id}"`), `${id} vive adentro de la hoja`);
  const pie = html.slice(html.indexOf('<div class="principal pabajo">'),
                         html.indexOf('<div id="zonaResumen"'));
  assert.ok(!pie.includes("<select"),
    "y ninguno quedó suelto en la fila del pie, que es de lo que se trataba");
  assert.ok(html.includes('<button id="btnAjustes"'), "la puerta es la tuerca del encabezado");
  assert.ok(html.includes('$("cerrarAjustes").onclick') &&
            html.includes('$("fondoAjustes").onclick') &&
            html.includes('if (tecla === "Escape") { ev.preventDefault(); verAjustes(false); }'),
    "tres salidas: el botón Listo, tocar afuera y Escape");
  /* Los <select> son los MISMOS de antes: si alguien los duplicara, habría dos
     fuentes de verdad y una de las dos quedaría muda. */
  for (const id of ["tema", "verEval", "largoExp", "nombreAp", "formaPrueba"])
    assert.equal((html.match(new RegExp(`<select id="${id}"`, "g")) || []).length, 1,
      `${id} está una sola vez en todo el archivo`);
});

test("el pie es solo la versión y la atribución vive en la hoja de ajustes", () => {
  /* v0.143. Juan: la versión "se pierde con todo el texto de los créditos". Lo
     que esta prueba fija son las dos mitades del cambio, y la segunda es la que
     no se puede romper en silencio: la atribución de Cburnett es OBLIGATORIA
     (§4bis), así que si alguien limpia el pie y se la lleva puesta, el archivo
     queda sin licencia y nada lo grita. Tiene que estar, y adentro de la hoja,
     que es lo que la deja a un toque. */
  const licencia = 'href="https://creativecommons.org/licenses/by-sa/3.0/"';
  assert.equal(html.split(licencia).length - 1, 1, "la licencia se enlaza una sola vez");
  const hoja = html.slice(html.indexOf('<div id="hojaAjustes"'),
                          html.indexOf('<p class="pie"'));
  assert.ok(hoja.includes('<p class="ajCredito">') &&
            hoja.includes("Cburnett</a> de Colin M.L. Burnett"),
    "la atribución de las piezas está adentro de la hoja");
  assert.ok(hoja.includes(licencia), "y el enlace a la licencia con ella");
  assert.ok(hoja.includes('id="verAjustes"'), "pegada a la versión completa, que ya vivía ahí");
  assert.ok(hoja.includes('style="white-space:nowrap"'),
    'y "CC BY-SA 3.0" sigue sin cortarse en dos renglones (v0.126)');

  /* El pie: la versión sola, sin el separador que la pegaba a los créditos. */
  assert.ok(html.includes('<p class="pie" id="verPie"></p>'),
    "el pie es un párrafo vacío que llena el script temprano");
  assert.ok(html.includes('pie.textContent = window.VERSION.split(" ")[0];'),
    'sin el " · " del final, que era contra los créditos');
  assert.ok(!html.includes('class="credito"'),
    "y .credito no quedó dando vueltas: el pie ya no son créditos");
});

test("la lista lateral no le saca lugar al celular", () => {
  /* La regla base tiene que ir ANTES de la media query: a igual especificidad
     gana la última, y puesta después le ganaba al display de adentro y la lista
     no se veía NUNCA. Se rompió así al escribirla. */
  const base = html.indexOf(".colLista { display: none; }");
  /* el bloque grande de la compu, el que abre renglón: desde la v0.126.1 hay
     una regla de una línea (`.cabInicio > .campo`) más arriba con el mismo
     media, y la búsqueda a secas caía en esa y la prueba se ponía roja */
  const ancha = html.indexOf("@media (min-width: 1000px) {\n");
  assert.ok(base > 0 && ancha > 0, "están las dos reglas");
  assert.ok(base < ancha,
    "la regla base va antes de la media query, o la lista no se ve nunca");
  /* DESDE LA v0.125 la Partida de la compu es el tablero abrazado a su barra
     y sus comidas (`max-content`) y un panel a la derecha, y la página mide lo
     que mide ese conjunto, centrada. */
  assert.ok(html.includes("grid-template-columns: max-content var(--panel)"),
    "el tablero y su panel, sin una columna estirada");
  assert.ok(html.includes("body.enVista:has(#zonaRevision:not(.oculto)) { max-width: none; }"),
    "en la Partida el cuerpo no tiene tope fijo");
  assert.ok(html.includes("--panel: clamp(340px, calc(340px + (100vw - 1000px) * .364), 380px)"),
    "de 1000 a 1110 el panel crece de a poco: el tablero no se achica cuando la ventana crece");
  assert.ok(!html.includes("@media (min-width: 1500px)"), "las tres columnas de 1500 se fueron");
});

test("el tiempo pensado sale en la lista, y null no es cero", () => {
  /* Pedido con la palabra "fundamental": ver que un error grave salió en dos
     segundos explica el error mejor que su evaluación. El dato ya existía
     (`fila.seg`), solo que no se mostraba en ningún lado. */
  assert.ok(html.includes('` title="segundos pensados">${tiempoCorto(x.seg)}</span>`'),
    "la lista muestra los segundos");
  /* EN LAS DOS FORMAS. En la v0.82 quedaron solo en "una por renglón" y el
     usuario lo reportó: la planilla es la que viene puesta de fábrica. */
  assert.ok(html.includes("celda(par.w && par.w.x, par.w && par.w.i, selTira) + segundos(par.w && par.w.x)"),
    "también en la planilla, y pegados a su jugada");
  assert.ok(html.includes("const segundos = x => !x ? `<span class=\"se\"></span>`"),
    "la celda va aunque no haya jugada, o la grilla se corre de columna");
  assert.ok(html.includes('if (seg == null) return "\\u00b7";'),
    "y sin reloj dice una raya, no un cero, que sería mentira");
  /* (la forma "una por renglón" se fue en la v0.160; en la planilla cada
     jugada lleva su columna de reloj) */
  assert.ok(html.includes(".jugadas.planilla > div { grid-template-columns: 28px 1fr auto 1fr auto; }"),
    "con su propia columna, no pegado a la pérdida");
});

test("con mouse: previa, rueda y salto al error", () => {
  /* Las tres se miden de verdad en el arnés; acá se fija lo que no puede
     cambiar sin querer. */
  assert.ok(html.includes("function previsualizar(i)") && html.includes("function volverDeLaPrevia()"),
    "la previa guarda y devuelve el tablero");
  assert.ok(html.includes("if (!R || PRUEBA || !R.filas[i]) return;"),
    "y no pisa el tablero mientras hay una variante abierta");
  assert.ok(html.includes('const MQ_MOUSE = window.matchMedia("(hover: hover)");'),
    "en una pantalla táctil no se arma: el toque dispara mouseenter");
  assert.ok(html.includes("if (!MQ_MOUSE.matches) return;"),
    "y se lee viva, no una vez al cargar: con teclado enchufado la respuesta cambia");
  assert.ok(html.includes("if (Math.abs(junta) >= 40) {") && !html.includes("while (Math.abs(junta)"),
    "la rueda acumula, y un evento pasa UNA jugada: un clic de mouse manda 100 o 120, no 40");
  assert.ok(html.includes("PREVIA_T = setTimeout(() => previsualizar(i), DEMORA_PREVIA);"),
    "la previa espera antes de aparecer: cruzar la lista no la dispara");
  assert.ok(html.includes("if (TABLERO_PREVIO !== null) previsualizar(i);"),
    "pero con una ya abierta el renglón de al lado no vuelve a esperar");
  assert.ok(html.includes('const cont = sp.closest(".jugadas, .tira");') &&
    html.includes("if (TABLERO_PREVIO !== null) PREVIA_T = setTimeout(volverDeLaPrevia, DEMORA_PREVIA);"),
    "y salir de la jugada no la cierra al toque: entre dos jugadas del renglón están los segundos");
  assert.ok(html.includes('const MALAS = new Set(["imprecision", "error", "omision", "grave"]);'),
    "y `n` salta entre las categorías malas");
});

test("las tres mejores son las que había EN LUGAR de la jugada", () => {
  /* v0.139, reportado por Juan: salían de la posición que se ve, o sea las
     respuestas del otro. Tienen que salir de la de antes de la jugada. */
  const f = html.slice(html.indexOf("function baseDeAlternativas()"), html.indexOf("async function pedirAlternativas()"));
  assert.ok(f.includes("fenDeLaJugada(i)"), "en la partida, de la posición de antes de la jugada");
  assert.ok(f.includes("posicionAntesDe(p.ver - 1)"), "y en la variante, de antes de la última probada");
  const g = html.slice(html.indexOf("function jugarAlternativa(uci)"), html.indexOf("/* LA TIRA DE PIEZAS COMIDAS"));
  assert.ok(g.includes("abrirPrueba(Math.max(IDX, 0))"), "tocar una la prueba desde esa misma posición");
  assert.ok(!html.slice(html.indexOf("async function pedirAlternativas()"), html.indexOf("function jugarAlternativa(uci)"))
    .includes("FEN_VISTO"), "y nada del panel lee la posición dibujada");
});

test("tocar una pieza la marca y no abre la variante (v0.152)", () => {
  /* Hasta la v0.151 un toque suelto ya era un modo: tarjeta "Elegiste f6",
     "‹ ›" grisados y el tablero saltando 21 px. Ahora la marca vive afuera de
     PRUEBA y la variante arranca recién con la primera jugada. */
  const f = html.slice(html.indexOf("function tocarCasilla(sq"), html.indexOf("JUGAR NO ESPERA AL MOTOR"));
  const sin = f.slice(f.indexOf("if (!PRUEBA) {"), f.indexOf("return void pintarRevision();"));
  assert.ok(sin.includes("MARCADA ="), "sin variante, tocar marca");
  assert.equal((sin.match(/abrirPrueba\(/g) || []).length, 1, "y abre la variante una sola vez: al jugar");
  assert.ok(sin.indexOf("abrirPrueba(") < sin.indexOf("probarJugada(m)"), "justo antes de la jugada");
  assert.ok(html.includes("MARCADA.fen === fenDeLaJugada(IDX + 1)"),
    "la marca vale solo en la posición donde se eligió");
  assert.ok(html.includes("desde: PRUEBA ? PRUEBA.desde : marcada() ? marcada().desde : null,"),
    "y el tablero la dibuja igual que la de la variante");
  const irA = html.slice(html.indexOf("function irA(i)"), html.indexOf("probar jugadas: la variante (v0.65"));
  assert.ok(irA.includes("MARCADA = null;"), "pasar de jugada la borra");
});

test("arrastrar la pieza no es un camino nuevo para mover", () => {
  /* Apretar hace lo que hacía tocar y soltar lo que hacía el segundo toque, así
     que todo lo decidido sobre qué se puede probar y desde dónde vale igual. */
  assert.ok(html.includes("(function arrastrarPiezas()"), "existe el arrastre");
  assert.ok(html.includes("tocarCasilla(desde, true);") && html.includes("else tocarCasilla(hasta);"),
    "y pasa por tocarCasilla, no por un camino paralelo");
  assert.ok(html.includes('if (ev.button !== 0 || TRABAJANDO) return;'),
    "con el motor ocupado no existe");
  /* desde la v0.169 también con el dedo, pero solo desde una pieza que puede
     mover: desde otra casilla el dedo desliza y scrollea */
  assert.ok(html.includes('if (ev.pointerType !== "mouse" &&\n        !(ev.target.closest && ev.target.closest("[data-mueve]"))) return;'),
    "con el dedo, solo desde una casilla con data-mueve");
  assert.ok(html.includes('if (!TRABAJANDO && ev.cancelable && ev.target.closest && ev.target.closest("[data-mueve]"))'),
    "y desde esa casilla el touchstart le saca el gesto al navegador");
  assert.ok(html.includes('if (ev.pointerType !== "mouse") { tocadoConElDedo = { t: Date.now(), sq: origen }; tocarCasilla(origen); }'),
    "sin click, el toque quieto lo atiende el arrastre");
  assert.ok(html.includes("if (casilla === tocadoConElDedo.sq && Date.now() - tocadoConElDedo.t < 500) return;"),
    "y no se cuenta dos veces si el click llega igual, pero el destino tocado enseguida sí llega");
  assert.ok(html.includes("if (Date.now() - recienArrastrado < 400) return;"),
    "y arrastrar no cuenta como deslizar");
  /* el halo debajo del dedo (revisor, v0.169): se suelta sabiendo dónde cae */
  const arr = html.slice(html.indexOf("(function arrastrarPiezas()"));
  assert.ok(arr.includes('if (ev.pointerType !== "mouse") {\n        halo = document.createElementNS('),
    "con el dedo hay halo, con mouse no");
  assert.ok(arr.includes('svg.insertBefore(halo, svg.querySelector("[data-pz]"));'),
    "debajo de las piezas");
  /* LA TRAMPA: tocarCasilla repinta el SVG entero, así que la pieza que se
     agarró deja de existir y hay que volver a buscarla. */
  assert.ok(html.includes("pieza = cont.querySelector(`[data-pz=\"${desde}\"]`);"),
    "la pieza se vuelve a buscar después de encender los destinos");
  assert.ok(html.includes('data-pz="${"abcdefgh"[f]}${8 - r}"'),
    "y cada pieza sabe en qué casilla está, que es lo que deja agarrarla");
  assert.ok(html.includes('if (Math.abs(dx) + Math.abs(dy) < (ev.pointerType === "mouse" ? 4 : 8)) return;'),
    "el umbral de 4 px evita repintar el tablero en cada clic");
});

test("las reglas de hover no existen para el dedo", () => {
  /* En una pantalla táctil el estado de hover queda PEGADO después de tocar:
     la última jugada tocada se vería iluminada como si estuviera elegida. */
  const i = html.indexOf("@media (hover: hover)");
  assert.ok(i > 0, "las reglas viven adentro de @media (hover: hover)");
  const bloque = html.slice(i, html.indexOf("\n  }", i));
  assert.ok(bloque.includes(":hover"), "y ahí adentro está el hover");
  /* EL MOUSE SUBRAYA, NO RELLENA: rellenando más suave que la elegida, las dos
     se veían iguales en la captura y quedaban dos "estás acá". */
  assert.ok(bloque.includes("box-shadow: inset 0 -2px 0"),
    "la jugada bajo el mouse se subraya, no se rellena");
  assert.ok(!/\.jugadas > div:hover \{ background/.test(html),
    "y el renglón no se tiñe: ese tono ya significa 'acá'");
});

test("las piezas comidas salen del FEN", () => {
  /* la posición inicial: no falta nada y están parejos */
  const a = A.piezasComidas(new Chess().fen());
  assert.deepEqual(a, { w: {}, b: {}, dif: 0 });
  /* una dama negra de menos: la comió el blanco, y son 9 de diferencia */
  const b = A.piezasComidas("rnb1kbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  assert.deepEqual(b.b, { q: 1 }, "falta la dama negra");
  assert.deepEqual(b.w, {}, "y al blanco no le falta nada");
  assert.equal(b.dif, 9, "nueve de ventaja para el blanco");
  /* de los dos lados a la vez, y el signo del que va perdiendo */
  const c = A.piezasComidas("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPP1/RNBQKBN1 w Qkq - 0 1");
  assert.deepEqual(c.w, { r: 1, p: 1 }, "al blanco le falta torre y peón");
  assert.equal(c.dif, -6, "y va perdiendo por seis");
});

test("las comidas mienten con una coronación, y se sabe", () => {
  /* Un peón blanco coronado en dama: el blanco queda con 7 peones y 2 damas.
     La RESTA dice "el negro le comió un peón" y no ve la dama de más, porque
     mirando una sola posición no hay forma de distinguirlo. Es la misma
     aproximación de lichess. La DIFERENCIA, en cambio, sale del tablero y da
     bien: por eso los dos números salen de lugares distintos. */
  const fen = "Qnbqkbnr/pppppppp/8/8/8/8/1PPPPPPP/RNBQKBNR b KQk - 0 1";
  const c = A.piezasComidas(fen);
  assert.deepEqual(c.w, { p: 1 }, "la resta dice que le falta un peón");
  assert.ok(!c.w.q, "y no ve la dama de más");
  /* dos damas y siete peones contra una dama, ocho peones y una torre de menos */
  /* el blanco tiene una dama de más (+9) y un peón de menos (-1), y al negro le
     falta la torre de a8 (+5) */
  assert.deepEqual(c.b, { r: 1 }, "al negro le falta la torre");
  assert.equal(c.dif, 9 - 1 + 5, "la diferencia sí sale del tablero");
});

test("la columna está centrada y no clavada a la izquierda", () => {
  /* Con `margin: 0` la columna queda pegada al borde izquierdo en cuanto la
     pantalla es más ancha que ella: en un monitor de 1900 son 850 px de vacío a
     la derecha. En un celular no se nota —sin ancho de sobra, `auto` es cero—
     y por eso vivió desde antes de que la app tuviera una segunda columna. */
  assert.ok(html.includes("margin: 0 auto; padding: 16px 14px 60px;"),
    "el cuerpo se centra solo");
  assert.ok(!/body \{ font:[^}]*margin: 0;/.test(html),
    "y no quedó el margin: 0 de antes");
});

test("en la compu el tablero crece, pero lo limita el alto", () => {
  /* Si el tablero se lleva todo el ancho disponible, la tira y la curva —que
     son la navegación— se van abajo del pliegue. Lo que manda es el alto. */
  /* desde la v0.123.1 lo de arriba del tablero sale de --altoCab */
  assert.ok(html.includes("#zonaRevision { --altoCab: 48px; }"), "el alto de la cabecera, en una variable");
  assert.ok(html.includes("--ladoTab: clamp(360px, min(calc(100vh - var(--altoCab) - 70px), calc(100vw - var(--panel) - 120px)), 680px)"),
    "el tablero se queda con lo que sobra de alto, o de ancho si la ventana es angosta (v0.125; v0.132 sin la columna de las comidas y con su renglón abajo; v0.151, la barra en el renglón de las comidas: 10 menos)");
  /* Y CON LA BARRA VERTICAL SOBRAN 26 px MÁS (v0.86): la horizontal se suma al
     alto —16 de barra y 10 de margen— y la vertical lo comparte. Medido en el
     arnés a 1280x800: el lado pasa de 470 a 496. */
  assert.ok(html.includes("#zonaRevision.sinEvalH { --ladoTab: clamp(360px, min(calc(100vh - var(--altoCab) - 64px),"),
    "sin la barra horizontal el presupuesto baja (16 desde la v0.132: con la horizontal la fila 8 se aparta 36 de la barra para las comidas del de arriba)");
  assert.ok(html.includes('classList.toggle("sinEvalH"'),
    "y alguien prende la clase según la forma que esté puesta");
  /* LA BARRA TIENE QUE QUEDAR PEGADA AL TABLERO. Con `flex: 1` la caja se
     estiraba a los 700 de la columna, el SVG se centraba adentro y la barra
     quedaba contra el borde, a 170 px de lo que mide. Y TIENE QUE SER AFUERA
     DEL `@media` (v0.107): de 413 a 1109 el tablero mide 360 y la columna más,
     y ahí la barra quedaba a 140 px. */
  assert.ok(html.includes(".revtab > #tablero { flex: 0 1 var(--ladoTab, 360px); min-width: 0; }"),
    "la caja del tablero mide lo que mide el tablero");
  const antesDelMedia = html.slice(0, html.indexOf("@media (min-width: 1000px) {\n"));
  assert.ok(antesDelMedia.includes("var(--ladoTab, 360px)") &&
            /\.revtab \{[^}]*justify-content: center/.test(antesDelMedia),
    "en cualquier ancho, no solo en la compu");
  /* Y EL NÚMERO TIENE QUE ENTRAR: con 30 px, "+0.26" salía cortado por el
     `overflow: hidden` de las esquinas redondeadas. Y con 36, a 11, "Tablas"
     (35,4) no entraba en los 34 que quedan adentro del borde (v0.105). */
  assert.ok(html.includes(".evalbar.ancha { width: 40px; }"),
    "la barra ancha da para el número entero");
  /* en la compu la barra va a 32 y de borde a borde de las casillas (v0.125) */
  assert.ok(html.includes(".evalbar.ancha { width: 32px; margin-block: var(--mTab); }"),
    "la barra de la compu, angosta y alineada a las casillas");
  /* EL PISO NO ES OPCIONAL: en una ventana baja y ancha la cuenta da menos de
     360 y el tablero quedaría más chico que en el celular. */
  const regla = html.indexOf("--ladoTab: clamp(360px");
  const media = html.indexOf("@media (min-width: 1000px)");
  assert.ok(media > 0 && regla > media,
    "y la regla vive adentro de la media query: en el celular el tablero no cambia");
  assert.ok(html.includes("svg.tab { width: 100%; max-width: 360px;"),
    "la regla del celular sigue intacta");
});

test("el dial de las jugadas tiene las dos formas y el apagado", () => {
  /* Es un dial temporal, como el de la v0.76: se va cuando el usuario elija. */
  /* desde la v0.160 queda solo la planilla, sin ajuste */
  assert.ok(html.includes("planilla:") && !html.includes("renglon:"), "queda la planilla sola");
  assert.ok(!html.includes('<select id="formaJugadas"'), "y el selector se fue");
  assert.ok(html.includes("grid-template-columns: 28px 1fr auto 1fr auto"),
    "la planilla es nº | blancas | reloj | negras | reloj, como la de papel");
  assert.ok(html.includes('#zonaRevision.solaTira .colLista { display: none; }') &&
            html.includes("window.matchMedia(CORTE_ANCHO).matches && !!formaJugadas().clase"),
    "sin lista, el panel no deja un hueco y la tira vuelve abajo del tablero");
});

/* EL DIAL DE LA v0.76 ES TEMPORAL y estas dos pruebas también: cuando el
   usuario elija una forma, se queda esa y se van el dial, las otras tres y
   estas pruebas con ellas. Mientras exista, lo que no puede pasar en silencio
   es que se pierda una forma o que cambie sola la de por defecto. */
test("el dial de la prueba: dos formas desde la v0.160", () => {
  const cuerpo = html.match(/const FORMAS_PRUEBA = (\{[\s\S]*?\n\});/);
  assert.ok(cuerpo, "está FORMAS_PRUEBA");
  const F = new Function("return " + cuerpo[1])();
  assert.deepEqual(Object.keys(F), ["sinLista", "abajo"], "Juan descartó adentro y dos");
  assert.deepEqual(Object.values(F).map(f => f.lista), ["no", "abajo"], "sin lista, o la lista abajo");
  assert.ok(/let FORMA_PRUEBA = "sinLista";/.test(html), "por defecto, sin la lista");
  assert.ok(html.includes('<select id="formaPrueba"'), "y el dial existe en la pantalla");
});

test("con una prueba abierta la tarjeta real se esconde", () => {
  /* El pedido del usuario: una tarjeta, no dos. Desde la v0.160 vale en las
     dos formas del dial, así que no depende de la forma (v1.0.1). Y la tira
     adentro de la tarjeta, que fue una forma, no vuelve en silencio. */
  assert.ok(html.includes('$("veredicto").classList.toggle("oculto", !!PRUEBA);'),
    "se esconde la real, y solo con una prueba abierta");
  assert.ok(!html.includes('id="pLinea"') && !html.includes("function tiraDeLaVariante"),
    "y la tarjeta de la variante no tiene lista adentro");
});

test("el chevron de la tira se dibuja, no se escribe", () => {
  /* `‹` y `›` son comillas angulares y se apoyan a la altura de la minúscula:
     la caja mide centrada y el dibujo se ve arriba. */
  const t = html.slice(html.indexOf('<div class="tira" id="tira">'),
                       html.indexOf('<div class="curva"'))
    /* sin los comentarios: el de ahí adentro NOMBRA las comillas para explicar
       por qué no se usan, y sin sacarlo la prueba se agarra de su propia
       explicación */
    .replace(/<!--[\s\S]*?-->/g, "");
  assert.ok(t.includes("<svg"), "el galón es un dibujo");
  assert.ok(!t.includes("&lsaquo;") && !t.includes("&rsaquo;"), "y no una comilla");
  assert.ok(t.includes('id="ant"') && t.includes('id="sig"'), "los dos siguen ahí");
});

/* ---------- los conceptos de la posición (v0.75) ---------- */

test("la clavada se contesta sacando la pieza del tablero", () => {
  /* Alfil en b5, caballo en d7, rey en e8 y c6 VACÍA: si al sacar el caballo el
     rey queda en jaque, el caballo estaba tapando. chess.js confirma además que
     el caballo no tiene ni una jugada legal. */
  const conClavada = "r1bqkbnr/pppn1ppp/8/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 1";
  assert.deepEqual(new Chess(conClavada).moves({ square: "d7" }), [],
    "el caballo no se puede mover, que es lo que significa clavado");
  assert.equal(A.estaClavada(conClavada, "d7", "e8"), true);
  assert.equal(A.estaClavada(conClavada, "c7", "e8"), false, "esa no está en la línea");
  /* la misma sin el alfil: no hay quien clave */
  const sin = "r1bqkbnr/pppn1ppp/8/4p3/1B2P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 1";
  assert.equal(A.estaClavada(sin, "d7", "e8"), false);
  /* y el filtro geométrico no se come una clavada de verdad */
  assert.equal(A.estaClavada(conClavada, "d7", "h8"), false, "sin el rey en la línea, no");
});

test("el bloqueo de la clavada NO se afirma cuando ya estaba", () => {
  /* Es la misma regla que las colgadas: lo que ya estaba no lo causó esta
     jugada. Acá se comprueba en el detector, comparando dos posiciones. */
  const conClavada = "r1bqkbnr/pppn1ppp/8/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 1";
  const cuerpo = html.slice(html.indexOf("function observarJugada"),
                            html.indexOf("fin del bloque de análisis"));
  assert.ok(cuerpo.includes("if (fenAntes && estaClavada(fenAntes, sq, reyRival)) continue;"));
  assert.equal(A.estaClavada(conClavada, "d7", "e8"), true, "y el detector anda");
});

test("el peón pasado mira su columna y las dos de al lado, para adelante", () => {
  assert.equal(A.esPasado(new Chess("4k3/8/8/3P4/8/8/8/4K3 w - - 0 1").board(), "d5", "w"), true);
  assert.equal(A.esPasado(new Chess("4k3/8/4p3/3P4/8/8/8/4K3 w - - 0 1").board(), "d5", "w"), false,
    "un peón en la columna de al lado lo frena");
  assert.equal(A.esPasado(new Chess("4k3/8/3p4/3P4/8/8/8/4K3 w - - 0 1").board(), "d5", "w"), false,
    "y uno en la suya, también");
  assert.equal(A.esPasado(new Chess("4k3/8/8/3P4/4p3/8/8/4K3 w - - 0 1").board(), "d5", "w"), true,
    "el que quedó ATRÁS no lo frena: solo cuenta lo que tiene por delante");
});

test("la columna abierta no tiene peones de NADIE", () => {
  /* Con un peón del rival está semiabierta, que es otra cosa y no la decimos. */
  const t = new Chess("3rk3/pp1p2pp/8/8/8/8/PP3PPP/3RK3 w - - 0 1").board();
  assert.equal(A.columnaAbierta(t, "a1"), false, "peones de los dos");
  assert.equal(A.columnaAbierta(t, "d1"), false, "un peón negro en d7: semiabierta");
  assert.equal(A.columnaAbierta(t, "c1"), true, "sin peones de nadie");
});

test("los conceptos compiten por una ranura, no tienen una cada uno", () => {
  /* Como mucho entran dos frases en la tarjeta: si cada concepto tuviera su
     turno, entre todos taparían al mecanismo y a la alternativa, que importan
     más. Desde la v0.77 son muchos más que tres y van en DOS pesos, pero la
     regla de fondo no cambió: de la posición sale UNA sola frase. */
  const cuerpo = html.slice(html.indexOf("const fuertes = [], menores = [];"),
                            html.indexOf("/* 6. EL RUMBO"));
  assert.ok(cuerpo.includes("o.clavadas") && cuerpo.includes("o.pasado") &&
            cuerpo.includes("o.columna"), "los tres de la v0.75 siguen ahí");
  assert.equal((cuerpo.match(/const posicional = /g) || []).length, 1,
    "una sola frase sale de la posición");
  assert.equal((cuerpo.match(/const menor = /g) || []).length, 1,
    "y una sola de las menores");
});

test("una frase menor no le puede ganar el lugar a una oportunidad perdida", () => {
  /* Lo destapó una prueba de verdad: puesto arriba, "Pierde el enroque corto"
     tapaba a "había Bxd7, que ganaba 9 peones". El peso menor no es solo entre
     los conceptos: es en TODO el orden de la tarjeta. */
  const orden = html.slice(html.indexOf("  const partes = [...primero, merito, mecanismo,"),
                           html.indexOf("].filter(Boolean).slice(0, ranuras >= 3 ? 3 : 2);"));
  assert.ok(orden.indexOf("menor") > orden.indexOf("habia"), "después de la oportunidad");
  assert.ok(orden.indexOf("menor") > orden.indexOf("alternativa"), "y de la alternativa");
  assert.ok(orden.indexOf("posicional") < orden.indexOf("habia"),
    "pero la fuerte sigue yendo antes");
});

/* --- los conceptos de la v0.77, uno por uno y con la posición verificada --- */

const tabl = f => new Chess(f).board();

test("aislado: ningún peón propio en las columnas de al lado", () => {
  /* mira las dos columnas ENTERAS y no solo adelante, al revés que el pasado:
     un peón de atrás también podría venir a defenderlo */
  assert.equal(A.esAislado(tabl("4k3/8/8/8/3P4/8/8/4K3 w - - 0 1"), "d4", "w"), true);
  assert.equal(A.esAislado(tabl("4k3/8/8/8/3P4/2P5/8/4K3 w - - 0 1"), "d4", "w"), false);
});

test("semiabierta y abierta no se pisan", () => {
  /* la d tiene un peón NEGRO: para las blancas es semiabierta, para las negras
     no es ninguna de las dos, y abierta no es para nadie */
  const t = tabl("3rk3/3p4/8/8/8/8/8/3RK3 w - - 0 1");
  assert.equal(A.columnaSemiabierta(t, "d1", "w"), true);
  assert.equal(A.columnaSemiabierta(t, "d8", "b"), false);
  assert.equal(A.columnaAbierta(t, "d1"), false);
});

test("plantado: ningún peón rival puede llegar a echarlo", () => {
  /* el peón negro de c4 ya pasó al caballo de d5 y no vuelve; el de c7 sí puede
     bajar a c6 y echarlo */
  assert.equal(A.estaPlantado(tabl("4k3/8/8/3N4/2p5/8/8/4K3 w - - 0 1"), "d5", "w"), true);
  assert.equal(A.estaPlantado(tabl("4k3/2p5/8/3N4/8/8/8/4K3 w - - 0 1"), "d5", "w"), false);
  /* y en la propia fila 3 no es un puesto avanzado, es un caballo en su casa */
  assert.equal(A.estaPlantado(tabl("4k3/8/8/8/8/3N4/8/4K3 w - - 0 1"), "d3", "w"), false);
});

test("la pareja de alfiles es tener dos cuando el rival ya no", () => {
  assert.equal(A.hayPareja(tabl("4k3/8/8/8/8/8/8/2B1KB2 w - - 0 1"), "w"), true);
  assert.equal(A.hayPareja(tabl("2b1kb2/8/8/8/8/8/8/2B1KB2 w - - 0 1"), "w"), false);
});

test("la pareja de alfiles no se dice a mitad de un cambio", () => {
  /* v1.0.6 (revisor de ajedrez, pasada del 22-nov): Bxg5 dejaba dos contra
     uno, pero sigue Nxg5 y quedan uno y uno. `mirar` está más abajo: se usa
     cuando el test corre, no cuando se define. */
  const antes = "r1bqk2r/ppp1nppp/3p1b2/3P2B1/2B1R3/5N2/PP3PPP/R2Q2K1 b kq - 1 12";
  assert.equal(mirar(antes, "f6g5").pareja, false);
  /* sin el caballo de f3 nadie recaptura y la pareja sí queda */
  assert.equal(mirar("r1bqk2r/ppp1nppp/3p1b2/3P2B1/2B1R3/8/PP3PPP/R2Q2K1 b kq - 1 12",
                     "f6g5").pareja, true);
  /* y si el alfil que come está defendido por un peón y solo lo puede tomar
     la dama, el rival pierde tomándolo (Qxc5 bxc5): la pareja queda */
  assert.equal(mirar("2b1k3/2q5/8/2b5/1P6/8/5B2/4KB2 w - - 0 1", "f2c5").pareja, true);
  /* y tampoco si el que se pierde es el OTRO alfil (revisor, segunda vuelta,
     partida-doble): Nxc4 y dxc5 se lleva el de c5 sin recaptura */
  assert.equal(mirar("r1bqk1nr/pppp1ppp/8/2b1n3/2BPP3/8/PPP2PPP/RNBQK2R b KQkq d3 0 5",
                     "e5c4").pareja, false);
  /* pero un cambio parejo del otro que ya se podía no la corta: tras Qxd4,
     Nxc4 Qxc4 era posible desde antes */
  assert.equal(mirar("r1bqk1nr/pppp1ppp/8/4n3/2BbP3/8/PPP2PPP/RNBQK2R w KQkq - 0 6",
                     "d1d4").pareja, true);
});

test("torres conectadas: devuelve las casillas, y nada en el medio", () => {
  /* devuelve las dos casillas y no un sí, porque la frase las señala */
  assert.deepEqual(A.torresConectadas(tabl("4k3/8/8/8/8/8/8/K2R3R w - - 0 1"), "w"),
                   ["d1", "h1"]);
  assert.equal(A.torresConectadas(tabl("4k3/8/8/8/8/8/8/K2R1N1R w - - 0 1"), "w"), null);
});

/* --- los tres caros de la v0.78, con la posición verificada con chess.js --- */

/* Juega `uci` sobre `antes` y devuelve lo que vio `observarJugada`. Es el mismo
   camino que la tarjeta: la fila se arma con lo que devuelve chess.js, así que
   ninguna posición se afirma de memoria (§10). */
const mirar = (antes, uci) => {
  const j = new Chess(antes);
  const m = j.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
  assert.ok(m, `la jugada ${uci} tiene que ser legal en ${antes}`);
  return A.observarJugada({ fen: j.fen(), uci, turno: m.color, pieza: m.piece,
                            san: m.san }, antes);
};

test("el filtro geométrico no se come la captura que corona", () => {
  /* Desde la v0.78, `colgadasDe` pregunta primero con geometría si la casilla
     está atacada, y recién ahí carga FENs: era lo más caro de la tarjeta. El
     caso que hay que cuidar es la captura de peón que ADEMÁS corona, porque es
     una captura que no se parece a las otras. La torre de b8 se la lleva axb8,
     y nadie recaptura. */
  assert.deepEqual(A.colgadasDe("1r2k3/P7/8/8/8/8/8/4K3 w - - 0 1", "b"),
                   [{ sq: "b8", pieza: "r", motivo: "menor", por: "p" }]);
});

test("atrapada: está comible y no tiene adónde ir", () => {
  /* caballo negro en a8; el peón b7 se lo lleva y las dos salidas —b6 y c7—
     las cubren las torres. Con una sola torre, c7 es segura y no está atrapado. */
  assert.equal(A.estaAtrapada("n3k3/1P6/8/8/8/8/8/1RR1K3 b - - 0 1", "a8"), true);
  assert.equal(A.estaAtrapada("n3k3/1P6/8/8/8/8/8/1R2K3 b - - 0 1", "a8"), false);
});

test("atrapada: solo si la atrapó ESTA jugada", () => {
  /* Rhc1 le tapa la última salida: antes tenía c7 */
  assert.deepEqual(mirar("n3k3/1P6/8/8/8/6K1/8/1R5R w - - 0 1", "h1c1").atrapada,
                   { sq: "a8", pieza: "n", motivo: "menor", por: "p" });
  /* y una jugada cualquiera con el caballo ya atrapado no se lo atribuye */
  assert.equal(mirar("n3k3/1P6/8/8/8/8/8/1RR1K3 w - - 0 1", "e1f1").atrapada, null);
});

test("una pieza CLAVADA no está atrapada, está clavada", () => {
  /* Lo vio la pantalla: "Atrapa el caballo de e4" cuando estaba clavado. Una
     clavada no tiene salidas legales, así que cumplía la definición por el
     motivo equivocado, y ya hay una frase que lo dice mejor. */
  const o = mirar("4k3/8/8/8/4n3/8/8/R6K w - - 0 1", "a1e1");
  assert.equal(o.atrapada, null);
  assert.deepEqual(o.clavadas, [{ sq: "e4", pieza: "n", contra: "k", por: "e1" }]);
});

test("jaque descubierto: el jaque no lo da la pieza que se movió", () => {
  /* el alfil se va de e4 a a8 y el jaque lo pasa a dar la torre de e1 */
  assert.deepEqual(mirar("4k3/8/8/8/4B3/8/8/4R2K w - - 0 1", "e4a8").descubierto,
                   { sq: "e1", pieza: "r" });
  /* y un jaque de la propia pieza que se movió NO es descubierto */
  assert.equal(mirar("4k3/8/8/8/8/8/8/R6K w - - 0 1", "a1a8").descubierto, null);
});

test("ataque a la descubierta: la casilla que se dejó estaba en el medio", () => {
  /* el caballo se va de d4 y deja a la torre de d1 mirando la dama de d8 */
  assert.deepEqual(mirar("3qk3/8/8/8/3N4/8/8/3RK3 w - - 0 1", "d4f5").descubierta,
                   { sq: "d1", pieza: "r", sobre: "d8", suya: "q" });
  /* la misma torre y la misma dama, pero el caballo NO estaba tapando esa
     línea: se movió de a4, así que no descubrió nada */
  assert.equal(mirar("3qk3/8/8/8/N7/8/8/3RK3 w - - 0 1", "a4b6").descubierta, null);
});

test("la mejor dice QUÉ HACÍA, y no se repite con el error del rival", () => {
  const base = { fen: "4k3/8/8/1n6/8/8/8/4KB2 b - - 0 1", uci: "e2e4", turno: "w",
                 pieza: "p", san: "e4", perdida: 0, evalBlancas: 0, franja: 0,
                 mejor: "f1b5" };
  const txt = (cap, ctx) => A.partesDeLaExplicacion({ ...base, cap }, "Bxb5", true,
                                                    null, null, ctx).map(p => p.txt).join(" ");
  /* sin recaptura se dice la pieza; con recaptura, la ganancia NETA */
  assert.equal(txt({ san: "Bxb5", gana: 3, comida: "n" }, { ranuras: 2 }),
               "La mejor era Bxb5, que se llevaba un caballo.");
  assert.equal(txt({ san: "Bxb5", gana: 2, comida: "r" }, { ranuras: 2 }),
               "La mejor era Bxb5, que ganaba 2 peones en el cambio.");
  /* si la mejor no era una captura buena no se inventa nada */
  assert.equal(txt(null, { ranuras: 2 }), "La mejor era Bxb5.");
  /* y con el error del rival, la mejor se nombra UNA sola vez */
  const eco = txt({ san: "Bxb5", gana: 3, comida: "n" }, { ranuras: 2, rivalErro: true });
  assert.equal(eco, "El rival acababa de errar: Bxb5 lo cobraba.");
  assert.ok(!eco.includes("La mejor era"), "sin eco");
});

test("el error del rival solo se dice en las jugadas del usuario", () => {
  /* mirando una jugada del rival, el que erró antes es el usuario: "el rival
     acababa de errar" diría exactamente lo contrario de lo que pasó */
  const base = { fen: "4k3/8/8/1n6/8/8/8/4KB2 b - - 0 1", uci: "e2e4", turno: "w",
                 pieza: "p", san: "e4", perdida: 0, evalBlancas: 0, franja: 0,
                 mejor: "f1b5" };
  const conLado = mio => A.partesDeLaExplicacion(base, "Bxb5", mio, null, null,
                           { ranuras: 2, rivalErro: true }).map(p => p.txt).join(" ");
  assert.ok(conLado(true).includes("El rival acababa de errar"));
  assert.ok(!conLado(false).includes("acababa de errar"), "no en las del rival");
  assert.ok(!conLado(null).includes("acababa de errar"), "ni con el lado desconocido");
});

test("los enroques se leen del propio FEN", () => {
  assert.deepEqual(A.enroquesDe("4k3/8/8/8/8/8/8/4K3 w KQkq - 0 1", "w"),
                   { corto: true, largo: true });
  assert.deepEqual(A.enroquesDe("4k3/8/8/8/8/8/8/4K3 w Kq - 0 1", "w"),
                   { corto: true, largo: false });
});

test("tiempoCorto muestra la décima solo cuando el dato la trae", () => {
  /* La app no MIDE el tiempo pensado, lo RESTA de dos relojes del PGN, así que
     la décima existe solo si chess.com la escribió. Escribir un ".0" sería
     inventar una precisión que el dato no tiene, y ese fue el criterio que
     eligió el usuario mirando las cuatro formas dibujadas (v0.93). */
  assert.equal(T.tiempoCorto(12), "12s", "entero, sin decimal de relleno");
  assert.equal(T.tiempoCorto(12.4), "12.4s", "con décima si la trae");
  assert.equal(T.tiempoCorto(0), "0s");
  assert.equal(T.tiempoCorto(0.4), "0.4s");
  /* sin relojes —correspondencia, o un PGN pegado a mano— el cuadrito no
     desaparece: pone el punto, así la fila no cambia de forma entre partidas */
  assert.equal(T.tiempoCorto(null), "·");
  /* de un minuto para arriba, m:ss: los segundos sueltos dejan de leerse */
  assert.equal(T.tiempoCorto(60), "1:00");
  assert.equal(T.tiempoCorto(80), "1:20");
  assert.equal(T.tiempoCorto(605), "10:05", "los segundos van con cero adelante");
});

/* --- la cuarta falla, medida antes de arreglarla, v0.95.1 --- */

test("la medición cuenta la mejor del motor marcada mala, en los dos modos", () => {
  /* categorizar() pregunta por los cortes antes que por esMejor. Antes de
     moverlo hay que saber cuántas jugadas cambian de etiqueta, y eso sale de
     las filas del mes sin volver a correr el motor. */
  const med = html.slice(html.indexOf("function medicionGenial()"),
                         html.indexOf("function reDerivar"));
  assert.ok(med.includes("LA MEJOR DEL MOTOR, MARCADA MALA"), "falta la sección de la cuarta falla");
  assert.ok(med.includes("mejorMala.critico") && med.includes("mejorMala.amigable"),
            "tiene que contar los dos modos");
});

test("el Mes en dos columnas solo en la compu (v0.119)", () => {
  /* Las tablas se estiraban a todo el body (1082 a 1280). Desde 950 el resumen
     va a la izquierda en 400 y las secciones a la derecha, con tope de 640;
     abajo de 950 los envoltorios no tienen caja y el celu se apila como antes. */
  assert.ok(html.includes(".mesGrid, .mesIzq, .mesDer { display: contents; }"), "en el celu los envoltorios no tienen caja");
  const b = html.slice(html.indexOf("EL MES CON EL ANCHO DE LA COMPU"));
  assert.ok(/@media \(min-width: 1000px\) \{\s*\.mesGrid \{ display: grid; grid-template-columns: 400px minmax\(0, 640px\)/.test(b),
    "la grilla del Mes arranca en 1000 (v0.128.2; era 950), con el tope de 640");
  assert.ok(/\(min-width: 1000px\) and \(min-height: 720px\) \{\s*\.mesIzq \{ position: sticky/.test(b),
    "el resumen solo queda fijo si entra en la ventana");
  const z = html.slice(html.indexOf('<div id="zonaMes"'), html.indexOf('<div id="zonaRevision"'));
  assert.ok(z.indexOf('class="mesIzq"') < z.indexOf('id="mesResumen"') &&
            z.indexOf('id="mesResumen"') < z.indexOf('class="mesDer"') &&
            z.indexOf('class="mesDer"') < z.indexOf('class="seccion"'), "resumen a la izquierda, secciones a la derecha");
});

/* --- el nombre de la apertura en castellano (v0.130) --- */

test("aperturaEs: familia y variante, y el respaldo de solo la familia", () => {
  assert.deepEqual(A.aperturaEs("C54 Italian Game: Giuoco Piano, Therkatz-Herzog Variation"),
    { largo: "Apertura italiana: Giuoco Piano", corto: "Apertura italiana" });
  assert.equal(A.aperturaEs("B90 Sicilian Defense: Najdorf Variation").largo, "Defensa siciliana: Najdorf");
  assert.equal(A.aperturaEs("C02 French Defense: Advance Variation").largo,
    "Defensa francesa: variante del avance");
  assert.equal(A.aperturaEs("C30 King's Gambit Declined").largo, "Gambito de rey rehusado");
  /* la familia comodín no dice nada: va la variante sola */
  assert.equal(A.aperturaEs("D00 Queen's Pawn Game: Accelerated London System").largo,
    "Sistema Londres acelerado");
  /* una variante con inglés que no sabemos decir no se muestra */
  assert.equal(A.aperturaEs("C57 Italian Game: Two Knights Defense, Fried Liver Attack").largo,
    "Apertura italiana: defensa de los dos caballos");
  /* solo adjetivos: una variante sin decirlo */
  assert.equal(A.aperturaEs("B27 Sicilian Defense: Accelerated Dragon").largo,
    "Defensa siciliana: variante del dragón acelerado");
  assert.equal(A.aperturaEs("C84 Ruy Lopez: Closed").largo, "Apertura española: variante cerrada");
  /* lo que pasaba por apellido (revisor, v0.130) */
  assert.equal(A.aperturaEs("A50 Indian Defense: Czech-Indian").largo, "Defensa india");
  assert.equal(A.aperturaEs("C00 French Defense: Mediterranean Defense").largo, "Defensa francesa");
  assert.equal(A.aperturaEs("E30 Nimzo-Indian Defense: St. Petersburg Variation").largo,
    "Defensa nimzoindia: San Petersburgo");
  assert.deepEqual(A.aperturaEs(""), { largo: "", corto: "" });
});

test("aperturaEs: ninguno de los nombres del libro sale con una palabra en inglés", () => {
  const libro = JSON.parse(fs.readFileSync(new URL("../aperturas.json", import.meta.url), "utf8"));
  const malas = [];
  for (const n of new Set(Object.values(libro.nombres))) {
    const r = A.aperturaEs(n);
    const palabras = (r.largo + " " + r.corto).split(/[\s:,]+/);
    if (!r.largo || palabras.some(w => A.AP_INGLES.has(w) || /^(Anti|Pseudo|Ultra)-|-(Indian|Polish|American|Dutch)$/.test(w) ||
                                      (/\d/.test(w) && !/^[KQRBN]?[a-h][1-8]\+?$/.test(w))))
      malas.push(n + " → " + r.largo);
  }
  assert.deepEqual(malas.slice(0, 5), []);
});

/* --- v0.133: el jaque no decide qué está clavado, salvado o atrapado ---
   Las seis posiciones son de una partida real de Juan (capturas del 14 y 15-nov),
   armadas desde la pantalla. `mirar` las pasa por chess.js, así que si un FEN
   estuviera mal la jugada no sería legal y la prueba lo diría. */
const ANTES_QXE5 = "rnbqkbnr/pppp1p1p/6p1/4p2Q/4P3/8/PPPP1PPP/RNB1KBNR w KQkq - 0 3";

test("dar jaque no clava todo lo que está en línea con el rey (3. Qxe5+)", () => {
  /* Decía "Clava la torre de a8": con el rey ya en jaque, sacar cualquier pieza
     de la fila 8 dejaba "al rey en jaque" y salían diez clavadas. */
  const o = mirar(ANTES_QXE5, "h5e5");
  assert.deepEqual(o.clavadas, []);
  /* Lo que SÍ pasa, y antes lo tapaba la clavada falsa: la torre de h8 está a
     tiro de la dama por f6-g7, nadie la defiende y no tiene adónde ir —la
     encierran su caballo y su peón—. La jugada siguiente fue 4. Qxh8. */
  assert.deepEqual(o.atrapada, { sq: "h8", pieza: "r", motivo: "sinDefensa", por: "q" });
});

test("una clavada de verdad se sigue viendo aunque el rey esté en jaque", () => {
  /* el caballo de d7 tapa al rey del alfil de b5, y la torre de e1 da jaque */
  const f = "4k3/3n4/8/1B6/8/8/8/4R2K b - - 0 1";
  assert.equal(A.estaClavada(f, "d7", "e8"), true);
  assert.equal(A.estaClavada(ANTES_QXE5.replace("4p2Q", "4Q3").replace(" w ", " b "), "a8", "e8"), false);
});

test("4… Qxe4+: ni salva el caballo de g8 ni clava el peón de d2", () => {
  const c = new Chess();
  for (const m of ["e4", "e5", "Qh5", "g6", "Qxe5+", "Qe7", "Qxh8"]) c.move(m);
  const o = mirar(c.fen(), "e7e4");
  assert.deepEqual(o.salvadas, [], JSON.stringify(o.salvadas));
  assert.deepEqual(o.clavadas, [], JSON.stringify(o.clavadas));
});

test("9… f5: defender con un peón un alfil atacado por un peón no lo salva", () => {
  const o = mirar("rn2kbQ1/ppp2p1p/3p2p1/q7/6b1/2NP1P2/PPP1N1PP/R1B1KB1R b KQq - 0 9", "f7f5");
  assert.deepEqual(o.salvadas, [], JSON.stringify(o.salvadas));
});

test("salir del jaque no 'salva' lo que el jaque hacía parecer colgado (10… Be7, 11… Kd7)", () => {
  /* Con el rey en jaque la recaptura en g4 era ilegal, así que el alfil le
     aparecía colgado; al salir del jaque, "salvado". Y encima sigue a tiro del
     peón de f3: la propia tarjeta decía "El rival tiene fxg4". */
  const be7 = mirar("rn2kb2/ppp4p/3pQ1p1/q4p2/6b1/2NP1P2/PPP1N1PP/R1B1KB1R b KQq - 1 10", "f8e7");
  assert.deepEqual(be7.salvadas, [], JSON.stringify(be7.salvadas));
  const kd7 = mirar("rn2k1Q1/ppp1b2p/3p2p1/q4p2/6b1/2NP1P2/PPP1N1PP/R1B1KB1R b KQq - 3 11", "e8d7");
  assert.deepEqual(kd7.salvadas, [], JSON.stringify(kd7.salvadas));
});

test("17. Bxe2: comerse la dama no se cuenta como 'salvar el peón de c2'", () => {
  const o = mirar("rn6/pppkbQ1p/3p2p1/5p2/5B2/2NP1bP1/PPP1q2P/R3KB1R w - - 0 17", "f1e2");
  assert.deepEqual(o.salvadas, [], JSON.stringify(o.salvadas));
});

test("si nunca tuvo defensa no 'queda sin defender': la jugada la destapó", () => {
  /* Revisor de ajedrez, 22-nov. Nc6 saca el caballo de e5 de la diagonal
     d4–g7: el peón de g7 no tenía defensores antes ni después, y lo nuevo es
     que la dama le llega. Decir "queda sin defender" era falso. */
  const antes = "r1bqk1nr/pppp1ppp/8/4n3/2BQP3/8/PPP2PPP/RNB1K2R b KQkq - 0 6";
  const f = unaFila(antes, "Nc6",
    [{ cp: -100, mate: null, mejor: "e5g6", segunda: { cp: -150, mate: null } },
     { cp: 300, mate: null, mejor: "d4g7", segunda: null }], 1);
  const obs = A.observarJugada(f, antes);
  const g7 = obs.nuevas.find(c => c.sq === "g7");
  assert.ok(g7 && g7.destapada, JSON.stringify(obs.nuevas));
  const txt = A.explicarJugada(f, null, true, null, obs);
  assert.ok(txt.includes("Destapa tu peón de g7: queda a tiro de la dama."), txt);
  assert.ok(!txt.includes("queda sin defender"), txt);
  /* y el caso de siempre, con defensa antes, sigue diciendo "sin defender" */
  const a2 = "4k3/8/5n2/8/4P3/3P4/8/4K3 w - - 0 1";
  const f2 = unaFila(a2, "d4",
    [{ cp: 100, mate: null, mejor: "e1e2", segunda: { cp: 80, mate: null } },
     { cp: 100, mate: null, mejor: "f6e4", segunda: null }]);
  assert.ok(!A.observarJugada(f2, a2).nuevas[0].destapada);
  /* Revisor, v1.0.7: soltar una clavada no es destapar. Be2 deja de clavar
     el caballo de c6 contra el rey, y Nxd4 pasa a ser legal; ninguna línea
     se abrió. Se dice lo cierto sin nombrar el mecanismo. */
  const a3 = "4k3/8/2n5/1B6/3P4/8/8/6K1 w - - 0 1";
  const f3 = unaFila(a3, "Be2",
    [{ cp: 100, mate: null, mejor: "g1f2", segunda: { cp: 80, mate: null } },
     { cp: 200, mate: null, mejor: "c6d4", segunda: null }]);
  const o3 = A.observarJugada(f3, a3);
  const t3 = A.explicarJugada(f3, null, true, null, o3);
  assert.ok(!t3.includes("Destapa") && !t3.includes("queda sin defender"), t3);
  assert.ok(t3.includes("Tu peón de d4 queda a tiro de un caballo."), t3);
  /* y al paso sí destapa: exd6 saca el peón de d5 de la diagonal b7–g2 */
  const a4 = "k7/1b6/8/3pP3/8/8/6P1/K7 w - d6 0 1";
  const f4 = unaFila(a4, "exd6",
    [{ cp: 100, mate: null, mejor: "a1b1", segunda: { cp: 80, mate: null } },
     { cp: 200, mate: null, mejor: "b7g2", segunda: null }]);
  const o4 = A.observarJugada(f4, a4);
  assert.ok((o4.nuevas.find(c => c.sq === "g2") || {}).destapada, JSON.stringify(o4.nuevas));
  /* destapa la torre y suelta el caballo a la vez: se nombra la de la línea */
  const a5 = "4k3/8/2n5/rB2P3/8/8/8/7K w - - 0 1";
  const f5 = unaFila(a5, "Bd3",
    [{ cp: 100, mate: null, mejor: "h1g2", segunda: { cp: 80, mate: null } },
     { cp: 200, mate: null, mejor: "a5e5", segunda: null }]);
  const t5 = A.explicarJugada(f5, null, true, null, A.observarJugada(f5, a5));
  assert.ok(t5.includes("Destapa tu peón de e5: queda a tiro de una torre."), t5);
});

test("una pieza defendida pero a tiro de una menor se dice 'a tiro', no 'sin defender'", () => {
  /* el alfil de d4 lo defiende el peón de e3, pero lo ataca el peón de c5:
     al sacarlo de ahí, la tarjeta dice por qué estaba en peligro */
  const antes = "4k3/8/8/2p5/3B4/4P3/8/4K3 w - - 0 1";
  const o = mirar(antes, "d4f6");
  assert.deepEqual(o.salvadas, [{ sq: "d4", pieza: "b", motivo: "menor", por: "p", seFue: true, como: "saca" }]);
});

test("sacar una pieza en peligro a otra casilla en peligro no es sacarla", () => {
  /* el alfil de d4, atacado por el peón de c5, se va a e5, donde lo come el peón de f6 */
  const o = mirar("4k3/8/5p2/2p5/3B4/8/8/4K3 w - - 0 1", "d4e5");
  assert.deepEqual(o.salvadas, []);
});

test("una pieza clavada no defiende: 7. Nc3 no salva el peón de e4", () => {
  /* el caballo de c3 queda clavado por el alfil de b4 contra el rey de e1 */
  const o = mirar("r1bqk2r/pppp1ppp/2n2n2/8/1bBPP3/5N2/PP3PPP/RNBQK2R w KQkq - 1 7", "b1c3");
  assert.deepEqual(o.salvadas, [], JSON.stringify(o.salvadas));
});

test("el rey no defiende una casilla que otra pieza rival también ataca", () => {
  /* el peón de d5 lo "defiende" el rey de d6, pero la torre de d1 también mira
     d5: Bxd5 y el rey no puede recapturar. O sea que ya estaba colgado, y al
     irse el rey no es "nuevo". */
  const o = mirar("4rr2/3n1p2/1p1kn1p1/p2p3p/7P/P4P2/BPK1N1P1/3R3R b - - 1 31", "d6e7");
  assert.deepEqual(o.nuevas, [], JSON.stringify(o.nuevas));
});

/* --- v0.133.1: tres frases chicas que mentían --- */
test("una captura que corona no es un ataque doble a la misma pieza", () => {
  /* axb2 ataca la dama de c1 y la torre de a1; cada captura que corona son
     cuatro jugadas, y salía "la dama de c1 y la dama de c1" */
  const o = mirar("rn1qk2r/1p3ppb/2p1p2p/3pN1PP/1b1PnB2/p1N1P3/PPP2P2/R1Q1KB1R b KQkq - 0 13", "a3b2");
  assert.deepEqual(o.amenazadas.map(a => a.sq).sort(), ["a1", "c1"]);
});

test("después de coronar, ataca la dama y no el peón", () => {
  const antes = "6r1/2pk4/7K/1p1n4/3P1RR1/8/2p5/8 b - - 0 48";
  const j = new Chess(antes);
  const m = j.move("c1=Q");
  const f = { fen: j.fen(), uci: "c2c1q", turno: "b", pieza: "p", san: m.san };
  const obs = A.observarJugada(f, antes);
  const txt = A.partesDeLaExplicacion(f, null, true, null, obs, { ranuras: 3 })
    .map(p => p.txt).join(" ");
  assert.ok(!/con un peón/.test(txt), txt);
});

test("sin eco: 'Había Rxd6' no se repite como 'Rxd6 lo cobraba'", () => {
  const antes = "q4rk1/1p3pp1/r2P3p/2N1p3/8/1P1P1N2/3BBP1P/5RQK b - - 0 29";
  const f = unaFila(antes, "Qc8",
    [{ cp: 0, mate: null, mejor: "a6d6", segunda: null },
     { cp: 250, mate: null, mejor: "d6d7", segunda: null }]);
  const partes = A.partesDeLaExplicacion(f, "Rxd6", true, null, A.observarJugada(f, antes),
                                         { ranuras: 3, rivalErro: true });
  const txt = partes.map(p => p.txt).join(" ");
  assert.ok(txt.includes("Había Rxd6"), txt);
  assert.ok(!txt.includes("lo cobraba") && !txt.includes("lo cobraste"), txt);
});

/* --- v0.134: tres categorías que decían algo falso --- */
test("la mejor del motor nunca es mala, aunque la pérdida medida no dé cero (17. Bxe2)", () => {
  /* el 17. Bxe2 de Juan salía Imprecisión con pérdida 0,67 */
  const d = { perdida: 0.67, caida: 1.3, esMejor: true, esLibro: false, entrega: false,
              unicaBuena: false, legales: 3, antesMio: 7.4, despuesMio: 6.7, esRecaptura: true };
  assert.equal(A.categorizar(d, "critico"), "mejor");
  assert.equal(A.categorizar({ ...d, perdida: 2.5, caida: 25 }, "amigable"), "mejor");
});

test("15… Bxd6 no es Brillante: si Rxd6, Qxd6", () => {
  /* el alfil come un peón; la torre lo puede comer, pero la dama recaptura */
  const antes = "r1b1r1k1/1pq1bppp/2pP4/p7/1nP4P/P1N1PNPB/1P2P3/2QRK2R b K - 0 15";
  const f = unaFila(antes, "Bxd6",
    [{ cp: 0, mate: null, mejor: "e7d6", segunda: { cp: -150, mate: null } },
     { cp: 0, mate: null, mejor: "a1a1", segunda: null }]);
  assert.notEqual(f.cat, "brillante");
});

test("un sacrificio de verdad sigue siendo Brillante", () => {
  /* el alfil va a h7 con jaque y el rey lo come: entregado de verdad */
  const antes = "r1bq1rk1/pppn1ppp/4p3/3pP3/1b1P4/2NB1N2/PPP2PPP/R2QK2R w KQ - 0 8";
  const f = unaFila(antes, "Bxh7+",
    [{ cp: 50, mate: null, mejor: "d3h7", segunda: { cp: 0, mate: null } },
     { cp: -80, mate: null, mejor: "g8h7", segunda: null }]);
  assert.equal(f.cat, "brillante");
});

/* --- v0.148: en una jugada de libro no habla el motor --- */
{
  const d = JSON.parse(fs.readFileSync(new URL("../aperturas.json", import.meta.url), "utf8"));
  const LIBRO = { pos: new Set(d.posiciones), nombres: d.nombres };
  /* un motor que NUNCA coincide con el libro y que se queja de cada jugada: la
     evaluación se cae 2 peones para el que mueve, así que sin la regla la
     tarjeta diría "la mejor era", el rumbo y lo que haya */
  const tarjetas = pgn => {
    const { jugadas, fens } = A.prepararPartida(pgn);
    const evs = fens.map((_, i) => ({ cp: i % 2 ? -200 : 0, mate: null, mejor: "a2a3", segunda: null }));
    const { filas } = A.derivarFilas(jugadas, fens, evs, LIBRO, 0, "critico");
    return filas.map((f, i) => ({
      san: f.san, cat: f.cat,
      partes: A.partesDeLaExplicacion(f, "a3", i % 2 === 0, "a6",
                                      A.observarJugada(f, fens[i]), { ranuras: 3, rivalErro: true }) }));
  };

  test("libro: la tarjeta no dice la mejor, ni la respuesta, ni el rumbo, y como mucho una frase", () => {
    for (const pgn of ["1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7",
                       "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6",
                       "1. e4 e5 2. f4 exf4 3. Nf3 g5",
                       "1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d4 exd4 6. cxd4 Bb4+"]) {
      const ts = tarjetas(pgn);
      assert.ok(ts.every(t => t.cat === "libro"), pgn);
      for (const t of ts) {
        const txt = t.partes.map(p => p.txt).join(" ");
        assert.ok(t.partes.length <= 1, `${t.san}: ${txt}`);
        for (const no of ["mejor era", "El rival", "La posición pasa", "Había", "comible",
                          "doblados", "aislado", "recaptura", "captura que había"])
          assert.ok(!txt.includes(no), `${t.san}: ${txt}`);
      }
    }
  });

  test("libro: lo que se ve en el tablero se sigue diciendo, y señala", () => {
    const ts = tarjetas("1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7");
    const de = san => ts.find(t => t.san === san).partes;
    assert.equal(de("a6")[0].txt, "Ataca el alfil de b5 con un peón.");
    assert.equal(de("a6")[0].sq, "b5");
    assert.equal(de("Ba4")[0].txt, "Saca tu alfil de b5, que estaba a tiro de un peón.");
    assert.equal(de("O-O")[0].txt, "Enrocás y el rey se pone a salvo.");
    assert.deepEqual(de("Bb5"), []);
  });

  test("fuera del libro la tarjeta sigue diciendo la mejor", () => {
    const { jugadas, fens } = A.prepararPartida("1. e4 e5 2. Nf3 Nc6 3. Bb5 a6");
    const evs = fens.map((_, i) => ({ cp: i % 2 ? -200 : 0, mate: null, mejor: "a2a3", segunda: null }));
    const { filas } = A.derivarFilas(jugadas, fens, evs, { pos: new Set(), nombres: {} }, 0, "critico");
    const txt = A.explicarJugada(filas[4], "a3", true, "a6", A.observarJugada(filas[4], fens[4]), { ranuras: 3 });
    assert.ok(txt.includes("La mejor era a3"), txt);
  });
}

test("el teclado fuera de la Partida (v0.153)", () => {
  /* Las filas de partidas son botones, Tab no se escapa de la hoja de ajustes
     y la lista de jugadas se recorre con ↑ ↓, Inicio y Fin cuando tiene foco. */
  assert.ok(html.includes('`<div data-i="${i}" tabindex="0" role="button"'), "la fila llega con Tab");
  assert.ok(html.includes('ev.target.matches(".lista > div[data-i]")'), "y Enter o Espacio la abren");
  assert.ok(html.includes('id="jugadas" tabindex="0"'), "la lista de jugadas es enfocable");
  assert.ok(html.includes('["ArrowUp", "ArrowDown", "Home", "End"].includes(tecla)'), "con ↑ ↓ Inicio Fin");
  const hoja = html.slice(html.indexOf('if (!$("hojaAjustes").classList.contains("oculto")) {'));
  assert.ok(hoja.slice(0, 1200).includes('if (tecla === "Tab")'), "Tab da la vuelta adentro de la hoja");
  const v = html.slice(html.indexOf("function volver()"), html.indexOf("function enfocarLaFila()"));
  assert.ok(v.includes("enfocarLaFila();"), "al volver, el foco va a la fila que se abrió");
});

test("el titular de una sección cerrada solo nombra lo que se aparta (v0.156, v0.157)", () => {
  /* f(nombre, malas, total, mejores, fueraDeLibro) con la forma de `tasa` */
  const f = (nombre, malas, total, mejores = 0, fuera = total) =>
    ({ nombre, malas, total, mejores, fueraDeLibro: fuera });
  const r = n => `Con la ${n.toLowerCase()}`;
  const tt = (...a) => T.titularTasas(...a).replace(/\u00a0/g, " ");
  /* pocas jugadas: no se compara nada (lo dice una vez el rótulo) */
  assert.equal(tt([f("Dama", 3, 10, 2)], f("", 5, 100, 30), r), "");
  /* lo bueno primero: 35 % de la mejor en general, la dama 60 de 100 */
  assert.equal(tt([f("Dama", 2, 100, 60), f("Torre", 4, 500, 150)], f("", 30, 600, 210), r),
    "Con la dama: 60 % la mejor, contra tu 35 %");
  /* sin nada bueno que se aparte, las malas: 20 de 60 contra 5 % */
  assert.equal(tt([f("Dama", 20, 60, 21), f("Torre", 10, 540, 189)], f("", 30, 600, 210), r),
    "Con la dama: 33 % de malas, contra tu 5 %");
  /* con pocas malas, las malas no se nombran */
  assert.equal(tt([f("Dama", 10, 30, 10), f("Torre", 0, 570, 200)], f("", 10, 600, 210), r),
    "Nada se aparta de tu promedio");
  /* las dos cosas: la buena y "y 1 más" */
  assert.equal(tt([f("Dama", 20, 60, 6), f("Caballo", 1, 100, 70), f("Torre", 9, 440, 134)], f("", 30, 600, 210), r),
    "Con la caballo: 70 % la mejor, contra tu 35 % (y 1 más)");
  /* Mecanismos: solo malas, y sus filas traen `con` */
  assert.equal(tt([{ nombre: "A", con: f("", 15, 50) }, { nombre: "B", con: f("", 20, 40) }],
    f("", 40, 800), n => n, true), "B: 50 % de malas, contra tu 5 % (y 1 más)");
  assert.equal(T.rotuloPieza("Torre"), "Con la torre");
  assert.equal(T.rotuloPieza("Caballo"), "Con el caballo");
});

test("un porcentaje se escribe de una sola forma (v0.158)", () => {
  const e = (...a) => T.enteroPct(...a).replace(/\u00a0/g, " ");
  assert.equal(e(25, 1, 4), "25 %");
  assert.equal(e(0, 0, 30), "0 %", "el 0 de verdad");
  assert.equal(e(100, 3, 3), "100 %", "el 100 de verdad");
  assert.equal(e(100 / 300, 1, 300), "<1 %", "pasó y redondea a 0");
  assert.equal(e(299 / 3, 299, 300), ">99 %", "no siempre y redondea a 100");
  assert.ok(!/toFixed\(1\)\s*\+\s*"%"/.test(html), "ningún porcentaje con decimal");
});

test("el nombre de la apertura hasta acá, en las dos formas (v0.159)", () => {
  const N = { a: "C50 Italian Game", c: "C50 Italian Game: Giuoco Piano" };
  /* claves de posiciones: a = 3. Bc4 (Italiana), b = sin nombre, c = 3… Bc5 (Giuoco Piano) */
  const ap1 = A.aperturaHastaAca(["x", "a"], N);
  assert.equal(ap1.cambia, true, "3. Bc4 le da nombre");
  const ap2 = A.aperturaHastaAca(["x", "a", "b"], N);
  assert.equal(ap2.cambia, false, "una sin nombre no cambia nada");
  assert.equal(ap2.nombre, ap1.nombre, "y sigue valiendo el de antes");
  const ap3 = A.aperturaHastaAca(["x", "a", "b", "c"], N);
  assert.equal(ap3.cambia, true, "3… Bc5 lo afina");
  assert.equal(A.aperturaHastaAca(["x", "y"], N), null, "sin nombre todavía, nada");
  assert.equal(A.fraseDeApertura(ap2, "cambia"), null, "cuando cambia: en las otras, nada");
  assert.match(A.fraseDeApertura(ap1, "cambia"), /^Es la apertura italiana\.$/, "la primera: sin 'Ahora', y en minúscula");
  assert.match(A.fraseDeApertura(ap2, "siempre"), /^Apertura italiana\.$/);
  assert.equal(A.conArticulo("Gambito de dama"), "el gambito de dama");
  assert.equal(A.conArticulo("Defensa siciliana"), "la defensa siciliana");
  assert.equal(A.conArticulo("Giuoco Piano"), "el Giuoco Piano", "lo propio queda");
  /* lo nuevo, si la familia es la misma: solo la variante */
  assert.match(A.fraseDeApertura(ap3, "cambia"), /^Ahora es el Giuoco Piano\.$/);
  /* "Variante normal" sola no es un nombre */
  const ap4 = A.aperturaHastaAca(["x", "a", "n"], { ...N, n: "C44 King's Knight Opening: Normal Variation" });
  assert.equal(ap4.cambia, false);
});

test("en una omisión, lo que había va primero (v0.161)", () => {
  /* 10… Bb4 de Juan: "Omisión" con "Ataca la dama. Clava la dama." y nada de
     lo que se dejó pasar, porque "Había" era la séptima del orden. */
  const { jugadas, fens } = A.prepararPartida("1. e4 e5");
  const f = A.derivarFilas(jugadas, fens, [
    { cp: null, mate: 8, mejor: "d4d5", segunda: null },
    { cp: -980, mate: null, mejor: "a7a6", segunda: null },
    { cp: 980, mate: null, mejor: "a2a3", segunda: null }
  ], SIN_LIBRO_EXP, 0, "critico", null, 99).filas[0];
  /* en una ranura sola; el orden con las que compiten lo fija el chequeo de abajo */
  const obs = A.observarJugada(f, fens[0]);
  const comoOmision = A.partesDeLaExplicacion({ ...f, cat: "omision" }, "Rd5", true, null, obs, { ranuras: 1 });
  assert.match(comoOmision[0].txt, /^Había mate forzado en 8/, "la primera frase dice qué se dejó pasar");
  assert.ok(html.includes('const primero = f.cat === "omision" && habia ? [habia] : [];'));
  /* la tarjeta de Juan, con dos ranuras: la segunda dice de quién habla */
  const h = { txt: "Había exd4, que se llevaba el caballo de d4.", marca: "exd4" };
  const at = { txt: "Ataca la dama de d2 con un alfil.", marca: "Ataca" };
  const dos = A.enCambio([h, at]);
  assert.equal(dos.map(p => p.txt).join(" "),
    "Había exd4, que se llevaba el caballo de d4. En cambio, ataca la dama de d2 con un alfil.");
  assert.equal(dos[1].marca, "ataca", "la marca baja con la palabra");
  assert.equal(A.enCambio([h, { txt: "Bb4 clava la dama." }])[1].txt, "En cambio, Bb4 clava la dama.",
    "si arranca con una jugada, no baja");
  assert.equal(A.enCambio([h]).length, 1, "sola, queda sola");
});

test("la clavada dice contra qué, y también contra la dama (v0.162)", () => {
  /* contra la dama: la torre clava el caballo de e4, que tiene la dama detrás
     (no contra el rey: la dama está en el medio) */
  const rel = mirar("4k3/8/4q3/8/4n3/8/8/R6K w - - 0 1", "a1e1");
  assert.deepEqual(rel.clavadas, [{ sq: "e4", pieza: "n", contra: "q", por: "e1" }]);
  /* dama contra dama (v0.163): la de atrás SIN defensa, clavada; defendida
     (acá por el rey en e7), es solo una oferta de cambio */
  assert.deepEqual(mirar("7k/8/4q3/8/4n3/8/8/Q6K w - - 0 1", "a1e1").clavadas,
                   [{ sq: "e4", pieza: "n", contra: "q", por: "e1" }], "la dama de e6 no la defiende nadie");
  assert.deepEqual(mirar("8/4k3/4q3/8/4n3/8/8/Q6K w - - 0 1", "a1e1").clavadas, [],
                   "el rey de e7 defiende la dama: es un cambio");
  /* si ya estaba clavada, la jugada no se la atribuye */
  assert.deepEqual(mirar("4k3/8/4q3/8/4n3/8/8/4R2K w - - 0 1", "h1g1").clavadas, []);
});

test("clavar ya es atacar: una sola frase (v0.162)", () => {
  /* el 10… Bb4 de Juan, en chico: el alfil ataca la dama Y la clava contra el
     rey; la tarjeta dice la clavada, no las dos */
  /* con el peón de a4 defendiendo b5, como el de a5 en la de Juan: si el alfil
     quedara suelto, Qxb5 lo come gratis y no es clavada que valga decir */
  const ant = "4k3/3q4/8/8/P7/8/8/4KB2 w - - 0 1";
  const j = new Chess(ant); const m = j.move({ from: "f1", to: "b5" });
  const f = { fen: j.fen(), uci: "f1b5", turno: "w", pieza: "b", san: m.san, n: 1, cat: "bien", perdida: 0 };
  const obs = A.observarJugada(f, ant);
  assert.deepEqual(obs.clavadas, [{ sq: "d7", pieza: "q", contra: "k", por: "b5" }]);
  const txt = A.partesDeLaExplicacion(f, null, true, null, obs, { ranuras: 2 }).map(p => p.txt);
  assert.ok(txt.includes("Clava la dama de d7 contra el rey."), txt.join(" | "));
  assert.ok(!txt.some(t => t.startsWith("Ataca la dama")), "y no repite el ataque");
});

test("no hay clavada si la clavada puede comer al que clava, ni se elogia la que queda comible (v0.163)", () => {
  /* casos del revisor de ajedrez, verificados con chess.js */
  assert.deepEqual(mirar("7k/8/4q3/8/4r3/8/8/Q6K w - - 0 1", "a1e1").clavadas, [], "Rxe1 come a la dama que clava");
  assert.deepEqual(mirar("7k/8/4q3/8/4r3/8/8/R6K w - - 0 1", "a1e1").clavadas, [], "Rxe1 come a la torre que clava");
  assert.deepEqual(mirar("7k/8/5q2/4p3/8/8/8/6BK w - - 0 1", "g1d4").clavadas, [], "exd4 come al alfil que clava");
  /* la que clava queda comible: la clavada existe, pero la tarjeta no la dice */
  const ant = "7k/8/4q3/8/4n3/8/5p2/R6K w - - 0 1";
  const j = new Chess(ant); const m = j.move({ from: "a1", to: "e1" });
  const f = { fen: j.fen(), uci: "a1e1", turno: "w", pieza: "r", san: m.san, n: 1,
              cat: "error", perdida: 4, colgada: true };
  const obs = A.observarJugada(f, ant);
  assert.equal(obs.clavadas.length, 1, "la clavada existe");
  const txt = A.partesDeLaExplicacion(f, null, true, null, obs, { ranuras: 3 }).map(p => p.txt).join(" ");
  assert.ok(!/Clava/.test(txt), txt);
});

test("contra el rey, la clavada que se come gratis no se dice; y lo que cuelga no se elogia (v0.163)", () => {
  /* Qe1 Rxe1 Kxe1: se cambia dama por torre; no es "clava la torre" */
  assert.deepEqual(mirar("4k3/8/8/8/4r3/8/5K2/Q7 w - - 0 1", "a1e1").clavadas, []);
  /* la de Juan, en chico, con la dama que come un alfil defendido: sí */
  assert.equal(mirar("4k3/8/8/8/4q3/8/5K2/R7 w - - 0 1", "a1e1").clavadas.length, 1);
  sinElogio("4k3/8/8/8/4q3/8/7K/R7 w - - 0 1", "a1e1", "r");
});
function sinElogio(ant, uci, pieza) {
  const j = new Chess(ant); const m = j.move({ from: uci.slice(0, 2), to: uci.slice(2, 4) });
  const f = { fen: j.fen(), uci, turno: "w", pieza, san: m.san, n: 1, cat: "grave", perdida: 5, colgada: true };
  const txt = A.partesDeLaExplicacion(f, null, true, null, A.observarJugada(f, ant), { ranuras: 3 })
    .map(p => p.txt).join(" ");
  assert.match(txt, /queda comible/, txt);
  assert.ok(!/Ataca|Clava|columna/.test(txt), "nada de lo que logra la pieza que se pierde: " + txt);
}

/* --- los cinco arreglos chicos de la variante, v0.168 --- */

test("jugar la jugada que ya está avanza, sin abrir ni cortar (v0.168)", () => {
  const tocar = html.slice(html.indexOf("function tocarCasilla"), html.indexOf("function probarJugada"));
  assert.ok(tocar.indexOf("return void irA(IDX + 1)") < tocar.indexOf("abrirPrueba(IDX + 1)"),
    "sin variante, la de la partida pasa a la jugada siguiente antes de abrir nada");
  const probar = html.slice(html.indexOf("function probarJugada"), html.indexOf("async function atenderCola"));
  assert.ok(probar.indexOf("return void verDeLaVariante(p.ver + 1)") < probar.indexOf("p.linea = p.linea.slice(0, p.ver)"),
    "adentro de la variante, la siguiente de la línea avanza antes de cortar");
});

test("con una variante abierta, n y p no hacen nada (v0.168)", () => {
  assert.ok(html.includes('if (salto) { if (!(PRUEBA && PRUEBA.linea.length)) saltarAMala(tecla === "n" ? 1 : -1); }'));
});

test("el atrás cierra la variante y cerrarla saca su entrada (v0.168)", () => {
  const pop = html.slice(html.indexOf('window.addEventListener("popstate"'));
  assert.ok(pop.indexOf("PRUEBA = null; return void pintarRevision();") < pop.indexOf("quieto();"),
    "con variante abierta, el popstate la cierra antes de cambiar de pantalla");
  assert.ok(html.includes("if (PRUEBA) soltarPrueba();"), "irA la suelta con su entrada");
  assert.ok(html.includes("function salirDePrueba() { if (PRUEBA) { soltarPrueba(); pintarRevision(); } }"));
});

test("con la lista abajo, el símbolo va en el color de su categoría (v0.168)", () => {
  const f = html.slice(html.indexOf("function laVarianteEnLaTira"));
  assert.ok(f.slice(0, 900).includes('` style="color:var(--c-${c.clave})"`'));
});

test("la jugada que da mate dice Jaque mate y el ahogado lo dice (v0.168)", () => {
  /* verificado con chess.js, no a ojo */
  const pegar = (pgn) => { const c = new Chess(); c.load_pgn(pgn); return c; };
  const mate = pegar("1. f3 e5 2. g4 Qh4#");
  assert.ok(mate.in_checkmate());
  const fm = { remate: "0-1", fen: mate.fen(), pieza: "q", uci: "d8h4", turno: "b", cat: "mejor",
               perdida: 0, mejor: "d8h4", senales: [] };
  const pm = A.partesDeLaExplicacion(fm, null, true, null, null, null);
  assert.deepEqual(pm.map(x => x.txt), ["Jaque mate."]);
  assert.equal(pm[0].sq, "e1", "señala al rey mateado");
  const ahog = "7k/5Q2/6K1/8/8/8/8/8 b - - 0 60";   /* después de Qf7 */
  const t = new Chess(ahog);
  assert.ok(t.in_stalemate());
  const fa = { remate: "tablas", fen: ahog, pieza: "q", uci: "e7f7", turno: "w", cat: "error",
               perdida: 9, mejor: "e7e8", senales: [] };
  const pa = A.partesDeLaExplicacion(fa, "Qe8#", true, null, null, null);
  assert.equal(pa[0].txt, "Ahogás al rey: tablas.", "con la jugada propia, Ahogás, como Coronás");
  assert.equal(pa[0].sq, "h8");
  assert.ok(pa[1].txt.startsWith("La mejor era Qe8#"), "y deja lugar a la mejor");
  /* revisor de ajedrez: una Omisión de mate que ahoga dice qué se omitió */
  const fo = { ...fa, cat: "omision", oportunidad: { tipo: "mate", n: 1 } };
  const po = A.partesDeLaExplicacion(fo, "Qe8#", false, null, null, null);
  assert.deepEqual(po.map(x => x.txt), ["Ahoga al rey: tablas.", "Había mate forzado en 1, con Qe8#."]);
  /* la forzada que ahoga lo dice igual: es el tablero, no una elección */
  const fz = "k7/p7/P7/4B3/8/8/8/1NKN4 b - - 0 1";   /* después de Kxc2 */
  assert.ok(new Chess(fz).in_stalemate());
  const pf = A.partesDeLaExplicacion({ remate: "tablas", fen: fz, forzada: true, pieza: "k",
    uci: "c1c2", turno: "w", cat: "forzada", perdida: 0, senales: [] }, null, true, null, null, null);
  assert.deepEqual(pf.map(x => x.txt), ["Ahogás al rey: tablas."]);
  /* material insuficiente y 50 jugadas */
  const ins = "8/8/8/8/4k3/8/8/K7 w - - 0 70";
  assert.ok(new Chess(ins).insufficient_material());
  assert.equal(A.partesDeLaExplicacion({ remate: "tablas", fen: ins, pieza: "k", uci: "e5e4",
    turno: "b", cat: "mejor", perdida: 0, senales: [] }, null, null, null, null, null)[0].txt,
    "Ya no queda material para dar mate: tablas.");
  const cin = "8/8/8/4k3/8/4R3/8/K7 b - - 100 120";
  const c50 = new Chess(cin);
  assert.ok(c50.in_draw() && !c50.insufficient_material() && !c50.in_stalemate());
  assert.ok(A.partesDeLaExplicacion({ remate: "tablas", fen: cin, pieza: "r", uci: "e2e3",
    turno: "w", cat: "error", perdida: 6, senales: [] }, null, null, null, null, null)[0].txt
    .startsWith("Se cumplen 50 jugadas"));
  for (const x of [...pm, ...pa, ...po, ...pf]) assert.ok(x.txt.includes(x.marca), x.marca);
});

test("el halo del dedo se desliza entre casillas (v0.170)", () => {
  /* Juan: en seco "se siente raro, medio rígido". Por style, no por atributo:
     el cambio de atributo no dispara la transición de forma confiable. */
  assert.ok(html.includes(".haloDedo { transition: cx 120ms cubic-bezier(.2, 0, 0, 1), cy 120ms cubic-bezier(.2, 0, 0, 1); }"));
  assert.ok(html.includes('halo.style.cx = sqCx(sq) + "px"; halo.style.cy = sqCy(sq) + "px";'));
  assert.ok(html.includes('if (volvia) halo.style.transition = "none";'),
    "volviendo al tablero aparece donde entra el dedo, sin deslizarse");
  assert.ok(html.includes('halo.style.cx = sqCx(desde) + "px"; halo.style.cy = sqCy(desde) + "px";'),
    "arranca en la casilla de origen: el primer tramo también se desliza");
});

test("en la compu la variante va en la planilla y sale de la tira (v0.171)", () => {
  /* una sola marca de "estás acá": con la variante en la planilla, la tira no
     la repite; y la planilla la pone debajo del renglón de donde sale */
  assert.ok(html.includes("const varEnLista = varAbajo && alPanel && formaJugadas().clase === \"planilla\";"));
  assert.ok(html.includes("(varEnTira ? laVarianteEnLaTira() : varAbajo ? \"\" : cierreDeLaTira(fin, R.filas))"));
  assert.ok(html.includes("lista.querySelector(`span[data-i=\"${PRUEBA.desde0}\"]`)"));
  assert.ok(/function laVarianteEnLaPlanilla\(\)[\s\S]{0,400}fenDeLaJugada\(p\.desde0\)/.test(html),
    "el número sale del FEN de arranque");
});

test("en una jugada de libro la fila de cuadritos no cambia de forma (v0.173)", () => {
  /* Juan hizo volver la v0.172: la fila es la misma en libro y fuera de él */
  assert.ok(!html.includes("enLibro"));
});

test("la precisión no cuenta las jugadas de libro, en ningún lado (v0.174)", () => {
  const f = (cat, precision) => ({ cat, precision });
  /* dos de libro a 100 y dos propias a 80 y 60: 70, no 85 */
  assert.equal(A.precisionMedia([f("libro", 100), f("libro", 100), f("mejor", 80), f("error", 60)]), 70);
  /* sin salir del libro no hay número: ni 0 ni NaN */
  assert.equal(A.precisionMedia([f("libro", 100)]), null);
  assert.equal(A.precisionMedia([]), null);
  /* la mediana, sobre las mismas: sin las dos de libro (0) es la de 0.4 y 2, no 0 */
  const g = (cat, perdida) => ({ cat, perdida });
  assert.equal(A.medianaFuera([g("libro", 0), g("libro", 0), g("mejor", 0.4), g("error", 2)]), 1.2);
  assert.equal(A.medianaFuera([g("libro", 0)]), null);
  assert.equal((html.match(/mediana\((?:todas|fs|mias)\.map\(f => f\.perdida\)\)/g) || []).length, 0,
    "ninguna mediana de pérdida cuenta el libro");
  /* los cuatro lugares que promedian pasan por ella, y no queda otra cuenta suelta */
  assert.equal((html.match(/\.reduce\(\(a, x\) => a \+ x\.precision, 0\)/g) || []).length, 1,
    "la única suma de precisiones es la de precisionMedia");
  for (const uso of ["const p = precisionMedia(mias);", "precision: precisionMedia(mias),",
                     "const prec = precisionMedia(todas);", "const p = precisionMedia(fs);"])
    assert.ok(html.includes(uso), uso);
  assert.ok(html.includes('cuadro("Precisión", prec == null ? SOLO_LIBRO : prec.toFixed(1), prec == null ? " sinDato" : "")'),
    "el Mes dice 'solo libro' y no NaN");
});

test("la precision rapida del inicio da lo mismo que derivarFilas", () => {
  /* v0.175: la fila del inicio dejó de rehacer la partida entera para sacar
     el número. Si las dos cuentas se separan, la lista dice una precisión y
     la partida abierta otra. Va con libro (las primeras cuatro posiciones) y
     con un mate en el medio, que es donde `aBlancas` hace algo distinto. */
  const pgn = fs.readFileSync(new URL("./partida-de-prueba.pgn", import.meta.url), "utf8");
  const { jugadas, fens } = A.prepararPartida(pgn);
  const evs = fens.map((f, i) => ({ cp: i === 20 ? null : Math.round(300 * Math.sin(i * 1.7)),
                                    mate: i === 20 ? 3 : null, mejor: "a1a2", segunda: null }));
  const libro = { pos: new Set(fens.slice(1, 5).map(A.claveLibro)), nombres: {} };
  const { filas } = A.derivarFilas(jugadas, fens, evs, libro);
  const rapidas = A.precisionesRapidas(fens, evs, libro);
  assert.equal(rapidas.length, filas.length);
  for (const lado of ["w", "b"]) {
    const de = fs2 => A.precisionMedia(fs2.filter(f => f.turno === lado));
    assert.equal(de(rapidas), de(filas), "lado " + lado);
  }
  assert.equal(rapidas.filter(f => f.cat === "libro").length, 4);
});

/* --- v0.177: dos frases y un veredicto (revisor de ajedrez) --- */

test("con dos mates en 1, el que no elegía el motor también es Mejor (v0.177)", () => {
  const antes = "6k1/5ppp/8/8/8/8/5PPP/R2R2K1 w - - 0 1";
  const j = new Chess(antes);
  const m = j.move("Ra8");
  assert.ok(j.in_checkmate(), "Ra8 tiene que ser mate");
  const evs = [{ cp: null, mate: 1, mejor: "d1d8" }, { cp: null, mate: 0, mejor: null }];
  const f = A.derivarFilas([m], [antes, j.fen()], evs, { pos: new Set(), nombres: {} }).filas[0];
  assert.deepEqual(f.cats, { critico: "mejor", amigable: "mejor" });
  /* y una jugada que no da mate, con el mate en 1 a la vista, no se cuela */
  const j2 = new Chess(antes);
  const m2 = j2.move("Rd7");
  const f2 = A.derivarFilas([m2], [antes, j2.fen()], [evs[0], { cp: -500, mate: null, mejor: "g8f8" }],
                            { pos: new Set(), nombres: {} }).filas[0];
  assert.notEqual(f2.cat, "mejor");
});

test("la clavada de la dama va antes que salvar un peón (v0.177)", () => {
  const antes = "4k3/3q4/8/8/P7/8/8/4KB2 w - - 0 1";
  const obs = mirar(antes, "f1b5");
  assert.equal(obs.clavadas[0].pieza, "q");
  assert.equal(obs.salvadas[0].pieza, "p");
  const j = new Chess(antes); j.move({ from: "f1", to: "b5" });
  const f = { fen: j.fen(), uci: "f1b5", turno: "w", pieza: "b", cat: "mejor", mejor: "f1b5" };
  assert.equal(A.explicarJugada(f, null, true, null, obs),
               "Clava la dama de d7 contra el rey. Tapa el ataque a tu peón de a4.");
});

test("juntar lo analizado no suelta un análisis que ya corría (v0.177.1)", () => {
  const j = html.slice(html.indexOf("async function juntarTodo"), html.indexOf("const NOMBRES_MES"));
  assert.ok(j.includes("if (!ajeno) ocupado(true);"));
  assert.ok(j.includes("if (!ajeno) { ocupado(false); estado(\"\"); }"));
  assert.ok(!/\n  ocupado\((true|false)\);/.test(j), "ningún ocupado() sin la guarda");
  const ocu = html.slice(html.indexOf("function ocupado(si)"), html.indexOf("$(\"detener\").onclick"));
  assert.ok(ocu.includes("meses.disabled = si"), "los meses se apagan mientras se trabaja");
  const fuente = html.slice(html.indexOf("$(\"fuente\").onchange"), html.indexOf("let CARGA = 0;"));
  assert.ok(fuente.includes("if (v !== \"todo\" && OCUPADO) { pintarFuente(); return; }"));
});

test("dar jaque no ciega la tarjeta: Bxf6+ calla la clavada porque ya estaba (20-nov)", () => {
  /* Con el rey en h8, ANTES de Bxf6+ la torre de f6 ya estaba clavada por el
     alfil de d4, así que no defendía a la dama: Nf2 Qxe6 y no hay recaptura.
     El caballo de e4 ya estaba clavado contra la dama. Con el rey en g8 la
     torre sí defendía (Nf2 Qxe6+ Rxe6) y la clavada es nueva. */
  assert.deepEqual(mirar("7k/8/4qr2/8/3Bn3/8/8/4Q1K1 w - - 0 1", "d4f6").clavadas, []);
  assert.deepEqual(mirar("6k1/8/4qr2/8/3Bn3/8/8/4Q1K1 w - - 0 1", "d4f6").clavadas,
                   [{ sq: "e4", pieza: "n", contra: "q", por: "e1" }]);
  /* y un jaque que SÍ crea la clavada la ve igual que sin jaque */
  for (const rey of ["7k", "6k1"])
    assert.deepEqual(mirar(rey + "/5p2/4q3/6N1/4n3/8/8/4Q1K1 w - - 0 1", "g5f7").clavadas,
                     [{ sq: "e4", pieza: "n", contra: "q", por: "e1" }], rey);
});

test("lo que se pierde en el cambio es el mecanismo, aunque haya recaptura (20-nov)", () => {
  /* Qe1 Rxe1 Kxe1: la dama no "queda comible" porque el rey recaptura, pero se
     cambia por una torre. La tarjeta decía "Toma la columna abierta e." */
  const evs = cp => [{ cp: 0, mate: null, mejor: "f2g2", segunda: { cp: -10, mate: null } },
                     { cp, mate: null, mejor: "e4e1", segunda: null }];
  const qe1 = "4k3/8/8/8/4r3/8/5K2/Q7 w - - 0 1";
  const f = unaFila(qe1, "Qe1", evs(400));
  assert.equal(f.colgada, false);
  const obs = mirar(qe1, "a1e1");
  assert.deepEqual(obs.cambio, { pierde: 4, mias: ["q"], suyas: ["r"] });
  assert.equal(A.explicarJugada(f, null, true, null, obs),
    "Pierde material en el cambio: tu dama por una torre. La posición pasa de parejo a perdiendo.");
  /* la calidad: Rd3 Bxd3 cxd3, torre por alfil */
  const rd3 = "4k3/8/8/1b6/8/8/2P5/3RK3 w - - 0 1";
  assert.deepEqual(mirar(rd3, "d1d3").cambio, { pierde: 2, mias: ["r"], suyas: ["b"] });
  assert.ok(A.explicarJugada(unaFila(rd3, "Rd3", evs(200)), null, false, null, mirar(rd3, "d1d3"))
    .startsWith("Pierde material en el cambio: la torre por un alfil."));
  /* un caballo que el peón come y nadie recaptura no cambia: sigue "queda comible" */
  assert.equal(mirar("4k3/8/2p5/8/8/2N5/8/4K3 w - - 0 1", "c3d5").cambio.suyas.length, 0);
  /* un cambio parejo no es un hallazgo, y comer lo que había tampoco */
  assert.equal(mirar("4k3/8/2p5/3p4/8/5N2/8/4K3 w - - 0 1", "f3e5").cambio, null);
  assert.equal(mirar("r3k3/8/8/8/8/8/8/R3K3 w - - 0 1", "a1a8").cambio, null);
});

test("con el rival en jaque, la clavada que se come al que clava tampoco se dice (20-nov)", () => {
  /* En jaque, comerse al que clava no es legal AHORA, y el filtro de la v0.163
     miraba las legales: salía "Clava el alfil de e6" con Ne7+, y el alfil come
     al de b3, que vale lo mismo. Contra la dama, la torre de e5 come la de e1. */
  for (const [fen, uci] of [["6k1/8/4b3/3N4/8/1B6/8/6K1 w - - 0 1", "d5e7"],
                            ["6k1/8/4b3/3N4/8/1B6/8/6K1 w - - 0 1", "d5f6"],
                            ["4q1k1/7p/8/4r3/4N3/8/8/4R1K1 w - - 0 1", "e4f6"],
                            ["4q1k1/8/8/4r3/4B3/8/8/4R1K1 w - - 0 1", "e4d5"]])
    assert.deepEqual(mirar(fen, uci).clavadas, [], uci);
});

test("coronar y perder la dama en el cambio no es perder material (20-nov)", () => {
  /* d8=Q+ Rxd8 Rxd8+: se dio un peón y se ganó una torre */
  const antes = "2r4k/3P4/8/8/8/8/8/3R2K1 w - - 0 1";
  const j = new Chess(antes); const m = j.move({ from: "d7", to: "d8", promotion: "q" });
  const obs = A.observarJugada({ fen: j.fen(), uci: "d7d8q", turno: "w", pieza: "p", san: m.san }, antes);
  assert.equal(obs.cambio, null);
});

test("la dama recién coronada que se pierde es 'tu peón coronado', sin festejo (Juan, 20-nov)", () => {
  /* c8=Q Rxc8 y no hay recaptura: en c8 hay una dama, no un peón, y la
     coronación se pierde en la jugada siguiente. */
  const antes = "3r3k/2P5/8/8/8/8/8/6K1 w - - 0 1";
  const evs = [{ cp: 0, mate: null, mejor: "g1f2", segunda: { cp: -20, mate: null } },
               { cp: 500, mate: null, mejor: "d8c8", segunda: null }];
  const f = unaFila(antes, "c8=Q+", evs);
  assert.equal(f.colgada, true);
  const t = A.explicarJugada(f, "Kf2", true, "Rxc8", mirar(antes, "c7c8q"));
  assert.ok(t.startsWith("Tu peón coronado queda comible en c8."), t);
  assert.ok(!t.includes("Coronás"), t);
  /* del rival: "el peón coronado" */
  const t2 = A.explicarJugada(f, "Kf2", false, "Rxc8", mirar(antes, "c7c8q"));
  assert.ok(t2.startsWith("El peón coronado queda comible en c8."), t2);
  /* y la coronación que se queda sí se festeja */
  const libre = "7k/2P5/8/8/8/8/8/6K1 w - - 0 1";
  const fl = unaFila(libre, "c8=Q+", [{ cp: 800, mate: null, mejor: "c7c8q", segunda: { cp: 700, mate: null } },
                                       { cp: -800, mate: null, mejor: "h8h7", segunda: null }]);
  assert.ok(A.explicarJugada(fl, null, true, null, mirar(libre, "c7c8q")).includes("Coronás"));
  /* la subcoronación vuelve como lo que se eligió (revisor de ajedrez) */
  const libreN = "7k/2P5/8/8/8/8/P7/6K1 w - - 0 1";
  const fn = unaFila(libreN, "c8=N", [{ cp: 800, mate: null, mejor: "c7c8q", segunda: { cp: 700, mate: null } },
                                      { cp: -300, mate: null, mejor: "h8h7", segunda: null }]);
  const tn = A.explicarJugada(fn, null, true, null, mirar(libreN, "c7c8n"));
  assert.ok(tn.includes("el peón vuelve como caballo"), tn);
  /* la defendida que igual se pierde: Rbxc8 Qxc8 Rxc8 */
  const def = "1r1r3k/2P5/8/8/8/8/2Q5/6K1 w - - 0 1";
  const od = mirar(def, "c7c8q");
  assert.equal(od.coronaPerdida, true);
  const fd = unaFila(def, "c8=Q", [{ cp: 0, mate: null, mejor: "g1f2", segunda: { cp: -20, mate: null } },
                                    { cp: 100, mate: null, mejor: "b8c8", segunda: null }]);
  assert.ok(!A.explicarJugada(fd, "Kf2", true, "Rbxc8", od).includes("Coronás"));
  /* y la que gana en el cambio (d8=Q+ Rxd8 Rxd8+) sigue festejándose */
  assert.equal(mirar("2r4k/3P4/8/8/8/8/8/3R2K1 w - - 0 1", "d7d8q").coronaPerdida, false);
});

test("si en el cambio el rival no entrega nada, la tarjeta no lo dice (v0.178.1)", () => {
  /* Bh6 Nxh6 Qxh8+: la cuenta ve el alfil perdido, pero el caballo cuidaba
     la torre. "Tu alfil queda comible en h6" era engañoso. */
  const antes = "r1b1k1nr/pppp1pQp/2n2q2/8/2B1P3/8/PPP2PPP/RNB1K2R w KQkq - 1 8";
  const f = unaFila(antes, "Bh6", [{ cp: 600, mate: null, mejor: "c4f7", segunda: { cp: 500, mate: null } },
                                    { cp: -505, mate: null, mejor: "g8h6", segunda: null }]);
  const t = A.explicarJugada(f, "Bxf7+", true, "Nxh6", mirar(antes, "c1h6"));
  assert.ok(!t.includes("comible") && !t.includes("en el cambio"), t);
});

test("el toque de antes de que arranque el módulo se guarda y se corre al arrancar (v1.0.10)", () => {
  /* Con mala señal el inicio se ve listo ~10 s antes que el módulo, que es
     quien engancha los botones: Buscar no hacía nada. La regla 6bis del mono
     lo mira andando; esto, que las dos puntas sigan conectadas. */
  const c = html.slice(html.indexOf("/* EL TOQUE DE ANTES DE QUE ARRANQUE EL MÓDULO"), html.indexOf("/* A LOS 6 S SIN MÓDULO"));
  assert.ok(c.includes('document.addEventListener("click"') && c.includes("if (window.MODULO_OK) return;"), "escucha solo antes del módulo");
  assert.ok(c.includes('window.TOQUE_PENDIENTE = busca && !fallo ? "buscar" : null;'), "guarda solo Buscar con nombre");
  assert.ok(c.includes('b.closest("#panelLog")'), "los botones del registro ya andan: no se tocan");
  assert.ok(!/Cargando…/.test(c.replace(/\/\*[\s\S]*?\*\//g, "")), "sin \"Cargando…\", que el mono vigila");
  const roto = html.slice(html.indexOf("var roto = function"), html.indexOf("var roto = function") + 500);
  assert.ok(roto.includes("window.TOQUE_PENDIENTE = null;") && roto.includes("NO_ARRANCO"), "con un error de verdad no promete buscar");
  const m = html.slice(html.indexOf("con usuario guardado se arranca plegado"));
  const i = m.indexOf("const pend = window.TOQUE_PENDIENTE;");
  assert.ok(i > 0 && i < m.indexOf("const atras ="), "el módulo lo corre después del usuario guardado");
  assert.ok(m.slice(0, i).includes("if (u && !escrito)"), "el nombre escrito antes de arrancar le gana al guardado");
  assert.ok(m.slice(i, i + 400).includes('pend === "buscar" && !$("buscar").disabled'), "solo Buscar, y si la búsqueda ya arrancó no se repite");
});

test("a los 6 s sin módulo no hay cartel rojo si los archivos responden bien (v1.0.9)", () => {
  /* Con mala señal el módulo arranca después de los 6 s del temporizador, y
     el cartel salía con los tres archivos respondiendo 200 y no se iba. La
     regla 11 del mono lo mira andando; esto, que el código siga así. */
  const t = html.slice(html.indexOf("A LOS 6 S SIN MÓDULO"), html.indexOf("}, 6000);"));
  assert.ok(t.includes('fetch(f, { method: "HEAD" })'), "pide con HEAD, sin bajar aperturas.json entero");
  assert.ok(t.includes('" · el módulo tarda…"'), "la línea dice que tarda");
  assert.ok(/else LOG\.add\("!", f \+ " responde "/.test(t), "lo que responde bien va al registro, no al cartel");
  assert.ok(!/window\.mostrarError\(f, r\.ok/.test(t), "no hay cartel con r.ok");
  assert.ok(t.includes("if (window.MODULO_OK) return;"), "con el módulo ya andando, un HEAD que falla no saca el cartel");
});

/* POSICIONES (v1.1). Las funciones puras de src/posicion.js, sacadas del
   pedazo con un POS de mentira. Las pidió el revisor de ajedrez: los FEN
   imposibles de contenido (que cuelgan a Stockfish), la triple repetición
   (que necesita la historia) y Deshacer con Juan del color que no mueve. */
const posicion = (() => {
  const src = fs.readFileSync(new URL("../src/posicion.js", import.meta.url), "utf8");
  const tomar = n => { const i = src.indexOf(`function ${n}(`); return src.slice(i, src.indexOf("\n}\n", i) + 2); };
  return new Function("Chess", "let POS = null;\nconst fenPos = () => POS.fens[POS.fens.length - 1];\n" +
    ["fenDelLink", "problemaDelFen", "limpiarFen", "juegoPos", "hayJugadaMia", "estadoPos"].map(tomar).join("\n") +
    "\nreturn { fenDelLink, problemaDelFen, limpiarFen, juegoPos, hayJugadaMia, estadoPos, poner: p => { POS = p; } };")(Chess);
})();

test("Posiciones: el link de lichess y el FEN sin campos (v1.1)", () => {
  assert.equal(posicion.fenDelLink("#fen=8/8/8/4k3/8/8/3K4/7R_w_-_-_0_1&nivel=2"), "8/8/8/4k3/8/8/3K4/7R w - - 0 1");
  assert.equal(posicion.fenDelLink("#fen=6k1/5ppp/8/8/8/8/8/R5K1%20b"), "6k1/5ppp/8/8/8/8/8/R5K1 b - - 0 1");
  assert.equal(posicion.fenDelLink("#otra=1"), null);
});

test("Posiciones: los FEN que no se pueden jugar se rechazan, y los enroques y el al paso imposibles se limpian (v1.1)", () => {
  assert.match(posicion.problemaDelFen("8/8/8/8/8/8/8/4K3 w - - 0 1"), /un rey de cada color/);
  assert.match(posicion.problemaDelFen("P3k3/8/8/8/8/8/8/4K3 w - - 0 1"), /primera o la octava/);
  assert.match(posicion.problemaDelFen("4k3/8/8/8/8/8/8/p3K3 b - - 0 1"), /primera o la octava/);
  assert.match(posicion.problemaDelFen("4k3/8/8/8/8/8/8/4R1K1 w - - 0 1"), /no mueve está en jaque/);
  assert.equal(posicion.problemaDelFen("4k3/8/8/8/8/8/4P3/4K3 w KQkq - 0 1"), null);
  /* el final de peones con los enroques por defecto de un editor: colgaba a Stockfish */
  assert.equal(posicion.limpiarFen("4k3/8/8/8/8/8/4P3/4K3 w KQkq - 0 1"), "4k3/8/8/8/8/8/4P3/4K3 w - - 0 1");
  assert.equal(posicion.limpiarFen("r3k2r/8/8/8/8/8/8/R3K1R1 w KQkq - 0 1"), "r3k2r/8/8/8/8/8/8/R3K1R1 w Qkq - 0 1");
  assert.equal(posicion.limpiarFen("4k3/8/8/3P4/8/8/8/4K3 w - e6 0 1"), "4k3/8/8/3P4/8/8/8/4K3 w - - 0 1");
  assert.equal(posicion.limpiarFen("4k3/8/8/3Pp3/8/8/8/4K3 w - e6 0 1"), "4k3/8/8/3Pp3/8/8/8/4K3 w - e6 0 1");
});

test("Posiciones: la triple repetición se ve con la historia, y Deshacer pide una jugada de Juan (v1.1)", () => {
  const inicial = "4k3/8/8/8/8/8/8/R3K3 w - - 0 1";
  const ucis = ["a1a2", "e8f8", "a2a1", "f8e8", "a1a2", "e8f8", "a2a1", "f8e8"];
  const c = new Chess(inicial), fens = [inicial];
  for (const u of ucis) { c.move({ from: u.slice(0, 2), to: u.slice(2, 4) }); fens.push(c.fen()); }
  posicion.poner({ inicial, fens, ucis, sans: [], yo: "w" });
  assert.equal(posicion.estadoPos(), "Tablas: tres veces la misma posición");
  posicion.poner({ inicial, fens: [inicial, fens[1]], ucis: ["a1a2"], sans: [], yo: "b" });
  assert.equal(posicion.hayJugadaMia(), false, "con Juan de negras, la primera del motor no se deshace");
  posicion.poner({ inicial, fens: fens.slice(0, 3), ucis: ucis.slice(0, 2), sans: [], yo: "b" });
  assert.equal(posicion.hayJugadaMia(), true);
});
