/* Mira la app en un navegador de verdad y saca capturas. Correr: npm run mirar
   (las capturas quedan en capturas/, que está en .gitignore).

   Es el tercer chequeo, y contesta lo que los otros dos no pueden:

   | analisis.test.mjs | los números  |
   | estaticos.mjs     | la estructura del HTML |
   | este              | LA PANTALLA  |

   Existe por la regla de §10: "un cambio que toca lo que se dibuja se MIRA en
   la pantalla, no solo se mide". El comentario impreso en el medio de cinco
   tablas (v0.51) se escapó de los otros dos y lo vio el usuario.

   NO TOCA index.html y no entra al sitio: levanta un servidor de archivos sobre
   el repo y abre la app tal cual, en modo simple, que es como se usa.

   EL MOTOR VA FALSEADO, y es lo que lo hace usable: el wasm real tarda minutos
   por partida —hay una medición fallida de eso: profundidad 13 sobre 25 jugadas
   no terminó en 10 minutos en un contenedor— y acá se está mirando el DIBUJO.
   Se sirve un worker de mentira que habla el pedacito de UCI que usa la clase
   Motor y contesta de una tabla FEN → evaluación armada de antemano con
   chess.js. LAS EVALUACIONES SON INVENTADAS: los veredictos de la pantalla no
   significan nada, la disposición sí. Para juzgar un veredicto está el celu. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Chess } from "../chess.js";
import { partidaFalsa } from "./falso.mjs";
import { abrirApp, alinear, espacios } from "./tira.mjs";

/* EL ARRANQUE SALIÓ A DOS MÓDULOS (v0.92) y acá quedan tres líneas. Eran ~250:
   la partida de prueba y el motor de mentira viven en `falso.mjs`, y levantar
   el servidor, el navegador y el camino de entrada, en `tira.mjs::abrirApp`.
   No es prolijidad: sin eso, una maqueta que quiera mirar la pantalla ENTERA
   tiene que reescribirlas o quedarse sin datos, y una pantalla vacía no deja
   decidir nada. Se verificó byte a byte: las 45 capturas quedaron idénticas.

   Qué partida se mira: `npm run mirar <nombre>` lee `partida-<nombre>.pgn`.
   Hay más de una porque CÓMO TERMINA LA PARTIDA es una pantalla propia y la
   partida larga no llega nunca a ninguna de ellas —no termina ni en mate ni en
   tablas—, así que sin esto no había forma de mirarlas. Ahí vivió el bug del
   `mate 0`: la jugada que daba el mate salía "Omisión" y la barra decía "M0". */
const FALSA = partidaFalsa({ cual: process.argv[2] || "de-prueba", puerto: 8099 });
const { PGN, SUFIJO, jugadas, fens, forma, base, cabPgn } = FALSA;
const { pg, salida: SALIDA, cerrar } = await abrirApp({ puerto: 8099, alto: 760, partida: FALSA });

/* SE ESTACIONA EL PUNTERO ANTES DE CADA CAPTURA (v0.82). Sin esto la captura
   depende de dónde haya quedado el mouse: al agregar las reglas de hover, seis
   capturas del celular cambiaron porque el puntero seguía encima del último
   elemento clickeado y lo dejaba iluminado. En un celular eso no pasa nunca.
   NO se emula un aparato táctil —con `hasTouch` la página dice `hover: none`,
   que es lo honesto, pero se fija al crear el contexto y entonces la pasada
   ancha no podría probar nada de lo que solo existe con mouse—. Estacionar da
   el mismo dibujo y además hace la captura REPETIBLE, que antes no era. */
const foto = async n => {
  await pg.mouse.move(2, 2);
  await pg.waitForTimeout(300);
  await pg.screenshot({ path: path.join(SALIDA, n + SUFIJO + ".png") });
};
/* lo mismo para las capturas de UN elemento: dos de la curva salían distintas
   porque el puntero quedaba encima y le encendía el borde */
const fotoDe = async (sel, n) => {
  await pg.mouse.move(2, 2);
  await pg.waitForTimeout(120);
  await pg.locator(sel).screenshot({ path: path.join(SALIDA, n + ".png") });
};
/* EL TOQUE, MEDIDO (prevención de la v1.1: los botones de 36 de Posiciones
   no los midió nadie). DISENO.md §1.7: área de toque de 48 en el celu,
   contando el `::before` o `::after` invisible que agranda, y 12 entre vecinos. Devuelve
   los que no llegan, por nombre: [] es que está todo bien. */
/* LA ESCALA DE TÍTULOS (revisor, v1.2: el final de Posiciones salió a 22/600
   y §1.4 dice título = 22/700). Lo que está a la vista a 22 px con otro peso. */
const pesos = () => pg.evaluate(() => [...document.querySelectorAll("body *")].filter(e => {
  const cs = getComputedStyle(e);
  return e.getClientRects().length && cs.fontSize === "22px" && cs.fontWeight !== "700" &&
    [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 2);
}).map(e => (e.id || e.className || e.tagName) + " " + getComputedStyle(e).fontWeight));
const toques = () => pg.evaluate(() => {
  const px = v => (v && v.endsWith("px")) ? parseFloat(v) : 0;
  const els = [...document.querySelectorAll("button, select")].filter(el => {
    const r = el.getBoundingClientRect();
    if (!(r.width > 0 && r.height > 0 && el.offsetParent !== null &&
      getComputedStyle(el).visibility !== "hidden" && r.bottom > 0 && r.top < innerHeight)) return false;
    /* LO QUE TAPA EL VELO DE UNA HOJA NO SE TOCA (v1.4): la barra de los
       módulos queda debajo, y con dos botones lado a lado en la hoja de
       Posiciones salía "pegada" a ellos */
    const arriba = document.elementFromPoint((r.left + r.right) / 2, Math.min(innerHeight - 1, (r.top + r.bottom) / 2));
    return !(arriba && !el.contains(arriba) && (arriba.id === "fondoAjustes" ||
      (arriba.closest("#hojaPos, #hojaAjustes") && !el.closest("#hojaPos, #hojaAjustes"))));
  }).map(el => {
    const r = el.getBoundingClientRect();
    let l = r.left, t = r.top, d = r.right, b = r.bottom;
    for (const ps of ["::before", "::after"]) {
      const a = getComputedStyle(el, ps);
      if (!a.content || a.content === "none" || a.position !== "absolute") continue;
      l = Math.min(l, r.left + px(a.left)); t = Math.min(t, r.top + px(a.top));
      d = Math.max(d, r.right - px(a.right)); b = Math.max(b, r.bottom - px(a.bottom));
    }
    const nombre = el.id || (el.getAttribute("aria-label") || el.textContent || el.tagName).trim().slice(0, 18);
    return { nombre, l, t, d, b, r, nav: el.closest("nav, [role=group]") };
  });
  const chicos = els.filter(e => e.d - e.l < 47.5 || e.b - e.t < 47.5)
    .map(e => `${e.nombre} ${Math.round(e.d - e.l)}×${Math.round(e.b - e.t)}`);
  const pegados = [];
  for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) {
    /* los de una misma barra de navegación se reparten el ancho a propósito:
       cada uno es su área de toque entera (v1.3). Lo mismo un grupo
       (`role="group"`: la paleta de Armar, con paso de 52, y el conmutador
       blancas/negras, que va pegado; v1.4) */
    if (els[i].nav && els[i].nav === els[j].nav) continue;
    const A = els[i].r, B = els[j].r;
    const vert = Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top);
    const hor = Math.min(A.right, B.right) - Math.max(A.left, B.left);
    const gap = vert > 0 ? Math.max(A.left, B.left) - Math.min(A.right, B.right)
              : hor > 0 ? Math.max(A.top, B.top) - Math.min(A.bottom, B.bottom) : 99;
    if (gap >= 0 && gap < 11.5) pegados.push(`${els[i].nombre}|${els[j].nombre} ${Math.round(gap)}`);
  }
  return { chicos, pegados };
});
/* frena solo al llegar a la última: el botón se deshabilita ahí, y sin esto
   el arnés se muere de timeout clickeando algo que no responde */
const avanzar = async n => {
  for (let i = 0; i < n; i++) {
    if (await pg.locator("#sig").isDisabled()) return;
    await pg.click("#sig");
  }
};

/* LAS PERILLAS VIVEN ADENTRO DEL MENÚ DE AJUSTES desde la v0.91, así que para
   tocarlas hay que abrirlo, que es además lo que hace el usuario: esto no es un
   rodeo del arnés, es el camino de verdad. Se cierra siempre —si quedara
   abierto, la captura siguiente saldría con la hoja tapando media pantalla— y
   se devuelve el scroll a donde estaba, porque abrir el menú obliga a llevar la
   tuerca a la vista y eso mueve la página. */
const elegir = async (sel, valor) => {
  const y = await pg.evaluate(() => window.scrollY);
  await pg.click("#btnAjustes");
  await pg.waitForSelector("#hojaAjustes:not(.oculto)");
  await pg.selectOption(sel, valor);
  await pg.click("#cerrarAjustes");
  await pg.evaluate(y => window.scrollTo(0, y), y);
  await pg.waitForTimeout(120);
};

/* MEDIR EN VEZ DE MIRAR (v0.92). Las dos preguntas que uno va a buscar a la
   captura —¿quedó algo encimado o pegado?, ¿quedó algo corrido?— se contestan
   con números, y son ~100 tokens contra los 1.670 de la pantalla a 2x. Van acá
   arriba y en cada corrida a propósito: `tira.mjs` lo usan las maquetas, que
   son desechables, así que sin un uso fijo el ayudante se rompería sin que se
   entere nadie. La tuerca contra la "R" es justo la medición que en la v0.91
   salió mal y mandó corregir 8 px que ya estaban bien. */
console.log("cabecera de la vista:", JSON.stringify({
  ...await espacios(pg, ".cabvista"),
  tuercaContraLaR: (await alinear(pg, ".cabvista h2", "#btnAjustes")).desvio,
}));

/* LA POSICIÓN INICIAL (v0.124): la Partida abre antes de la primera jugada.
   Se fotografía y se pasa a la primera, así el resto de las capturas sigue
   siendo el mismo que antes y la comparación byte a byte sirve. */
console.log("inicial:", JSON.stringify(await pg.evaluate(() => ({
  titulo: document.getElementById("vTit").textContent,
  sub: document.getElementById("vSub").textContent,
  anterior: document.getElementById("ant").disabled,
  elegidaEnLaTira: !!document.querySelector("#tiraSc .sel"),
  perdida: document.getElementById("mPerdida").textContent,
}))));
await foto("revision-inicio");
console.log("toque, partida:".padEnd(16), JSON.stringify(await toques()));
console.log("títulos, partida:".padEnd(16), JSON.stringify(await pesos()), "(22 px va a 700: [])");
await pg.click("#sig");
await pg.waitForTimeout(200);
await foto("revision-1");
/* la vista desde su primer renglón: es donde se ve si la barra y la tarjeta
   quedaron pegadas, que es lo que pasó al reordenar en la v0.74 */
await pg.evaluate(() => {
  document.getElementById("zonaRevision").scrollIntoView({ block: "start" });
  window.scrollBy(0, -8);
});
await foto("revision-arriba");

/* LAS TRES UBICACIONES DE LA EXPLICACIÓN (v0.64), sobre la misma jugada: es lo
   único que cambia entre las tres capturas. La jugada NO se elige a ojo —se
   avanza hasta la primera que tenga algo que explicar, leyendo la pantalla— y
   por eso sirve igual en cualquiera de las partidas de prueba.
   Esto se va junto con el interruptor, cuando el usuario elija una. */
/* La jugada NO se elige a ojo: se recorre la partida leyendo la pantalla y se
   vuelve a la que MÁS tiene para explicar. Una que solo dice el rumbo no sirve
   para juzgar la disposición, porque es la frase más corta de todas. */
const textos = [];
for (let i = 0; ; i++) {
  textos.push(((await pg.locator("#vExp").textContent()) || "").trim());
  if (await pg.locator("#sig").isDisabled()) break;
  await pg.click("#sig");
}
/* Se prefiere la que MÁS tiene para explicar, salvo que haya un ataque doble:
   esa es la frase que la partida de prueba `doble` existe para mostrar, y
   dejarla al azar del largo la escondía detrás de otra más larga. */
let mejor = 0;
textos.forEach((t, i) => { if (t.length > textos[mejor].length) mejor = i; });
const conDoble = textos.findIndex(t => t.includes("ataque doble"));
if (conDoble >= 0) mejor = conDoble;
for (let i = textos.length - 1; i > mejor; i--) await pg.click("#ant");
console.log("explicación:", JSON.stringify(textos[mejor]),
            `(jugada ${mejor + 1} de ${textos.length}; ` +
            `${textos.filter(Boolean).length} tienen algo que decir)`);
/* TOCAR LA FRASE ENCIENDE EL TABLERO (v0.69): no te lo explica, te lo muestra.
   La frase que señala algo lleva la clase `senala`; si no hay ninguna en esta
   jugada, se dice y no se saca la foto, en vez de sacar una foto vacía. */
const senala = pg.locator("#vExp span.senala").first();
if (await senala.count()) {
  await senala.click();
  await pg.evaluate(() => document.getElementById("tablero").scrollIntoView({ block: "start" }));
  await pg.evaluate(() => window.scrollBy(0, -60));
  await foto("senala-encendida");
  console.log("señala: ", JSON.stringify((await senala.textContent()).trim()));
  await senala.click();
} else console.log("señala:  (esta jugada no señala nada)");

/* LAS TRES POSICIONES DEL DIAL DE LA v0.77, sobre la misma jugada: cuánto habla
   la tarjeta. Se va con el dial, cuando el usuario elija. Además se recorre la
   partida entera en cada una y se cuenta cuántas jugadas hablan y cuántas
   frases salen, que es el número que decide. */
for (const largo of ["corta", "media", "larga"]) {
  await elegir("#largoExp", largo);
  await pg.waitForTimeout(150);
  await pg.evaluate(() => document.getElementById("tablero").scrollIntoView({ block: "start" }));
  await pg.evaluate(() => window.scrollBy(0, -190));
  await foto("largo-" + largo);
  await fotoDe("#veredicto", "tarjeta-" + largo + SUFIJO);
  console.log("largo " + largo.padEnd(6), JSON.stringify(await pg.evaluate(() => {
    const t = document.getElementById("vExp");
    return { frases: t.querySelectorAll("span.fr").length,
             texto: (t.textContent || "").trim() };
  })));
}
await elegir("#largoExp", "media");

/* La tarjeta como quedó: el título y UN renglón, que es la explicación o la
   frase fija de la categoría. Las tres ubicaciones que se comparaban acá se
   fueron con el interruptor en la v0.72. */
await pg.evaluate(() => document.getElementById("tablero").scrollIntoView({ block: "start" }));
await pg.evaluate(() => window.scrollBy(0, -60));
await foto("revision-tarjeta");
await fotoDe("#veredicto", "tarjeta" + SUFIJO);

/* PROBAR JUGADAS: LA VARIANTE (v0.66), sobre esa misma jugada. Las jugadas NO
   se eligen a ojo: se le piden a chess.js, y la primera es una legal que no sea
   la que se jugó de verdad, para que la captura muestre una comparación y no la
   misma jugada dos veces. */
const posPrueba = new Chess(fens[mejor + 1]);
const alterna = posPrueba.moves({ verbose: true })[0];
if (!alterna) console.log("OJO: sin alternativa legal, no hay capturas de la variante");
else {
  /* La variante se abre TOCANDO una pieza (v0.74): la puerta del botón se fue
     con la fila de botones grandes. Arranca de la posición de DESPUÉS de la
     jugada, o sea la del rival, así que la alternativa sale de ahí. Desde la
     v0.152 el primer toque solo marca la pieza —la tarjeta sigue siendo la de
     la jugada— y la variante se abre con el segundo, al jugar. */
  await pg.click(`#tablero [data-sq="${alterna.from}"]`);
  await foto("prueba-1-eligiendo");
  await foto("prueba-2-elegida");
  await pg.click(`#tablero [data-sq="${alterna.to}"]`);
  await pg.waitForFunction(
    () => !/^Probando/.test(document.getElementById("pTit").textContent || ""),
    null, { timeout: 30000 });
  await foto("prueba-3-resultado");

  /* LA RESPUESTA DEL RIVAL, que es lo que la v0.65 no dejaba hacer. Sale de la
     posición que quedó, así que también se la pide chess.js. */
  /* Se encadenan CINCO más, de los dos lados: es la pregunta de si la variante
     deja seguir la partida inventada o solo mide una jugada suelta. */
  posPrueba.move(alterna.san);
  let respuesta = null;
  for (let k = 0; k < 5; k++) {
    const m = posPrueba.moves({ verbose: true })[0];
    if (!m) break;
    respuesta = m;
    await pg.click(`#tablero [data-sq="${m.from}"]`);
    await pg.click(`#tablero [data-sq="${m.to}"]`);
    await pg.waitForFunction(
      () => !/^Probando/.test(document.getElementById("pTit").textContent || ""),
      null, { timeout: 30000 });
    posPrueba.move(m.san);
  }
  if (respuesta) {
    await foto("prueba-5-encadenada");
    await fotoDe("#prueba", "tarjeta-prueba" + SUFIJO);
  /* la maqueta del borde violeta se fue en la v0.71: el usuario eligió el color
     de la categoría mirando las dos. */
    /* LAS CUATRO FORMAS DEL DIAL DE LA v0.76, sobre la misma variante
       encadenada: es lo único que cambia entre las cuatro capturas. La pantalla
       se ancla arriba de la tarjeta que quedó más arriba, que es lo que el
       usuario ve al mirar el celu. Esto se va junto con el dial, cuando el
       usuario elija una forma. */
    for (const forma of ["sinLista", "abajo"]) {   /* (dos desde la v0.160) */
      await elegir("#formaPrueba", forma);
      await pg.evaluate(() => {
        const p = document.getElementById("prueba");
        const arriba = p.classList.contains("oculto") ? document.getElementById("veredicto") : p;
        arriba.scrollIntoView({ block: "start" });
        window.scrollBy(0, -14);
      });
      await foto("prueba-forma-" + forma);
      console.log("forma " + forma.padEnd(9),
        JSON.stringify(await pg.evaluate(() => ({
          tarjetaReal: !document.getElementById("veredicto").classList.contains("oculto"),
          probadasAbajo: document.querySelectorAll("#tiraSc .jg.inv").length,
          elegidaAbajo: (document.querySelector("#tiraSc .jg.sel") || {}).textContent || null
        }))));
    }
    /* queda en "abajo", donde la variante vive en la tira de la partida: es lo
       que mira lo que sigue ("adentro" se fue en la v0.160). */
    await elegir("#formaPrueba", "abajo");
    console.log("variante:", JSON.stringify(
      (await pg.evaluate(() => [...document.querySelectorAll("#tiraSc .jg.inv")].map(x => x.textContent).join(" "))).replace(/\s+/g, " ").trim()));

    /* volver a la PRIMERA jugada de la variante tocando su tira. Iba al
       arranque con data-v="0" hasta la v0.71, que le sacó ese eslabón. */
    await pg.click('#tiraSc .jg.inv[data-v="1"]');
    await foto("prueba-6-volviendo");
    /* LOS BORDES DE LA TIRA CON VARIANTE (v0.182): ninguna jugada cortada
       contra "‹" y la elegida fuera del desvanecido de 24 de cada lado, en la
       primera de la variante y en la última */
    const bordes = () => pg.evaluate(() => {
      const sc = document.getElementById("tiraSc"), sel = sc.querySelector(".sel");
      const x = sc.scrollLeft;
      const cortada = [...sc.children].some(h => h.offsetWidth && h.offsetLeft < x - 1 && h.offsetLeft + h.offsetWidth > x + 1);
      return { cortadaALaIzq: cortada,
               aireDerecha: Math.round(x + sc.clientWidth - sel.offsetLeft - sel.offsetWidth),
               aireIzquierda: Math.round(sel.offsetLeft - x) };
    });
    const enLaPrimera = await bordes();
    while (!(await pg.locator("#sig").isDisabled())) await pg.click("#sig");
    console.log("tira con variante:", JSON.stringify({ primera: enLaPrimera, ultima: await bordes() }),
                "(sin cortada y con aire de 24 o más)");
    await pg.click('#tiraSc .jg.inv[data-v="1"]');
  }
  console.log("prueba:  ", JSON.stringify(await pg.locator("#pTit").textContent()),
              JSON.stringify(await pg.locator("#pSub").textContent()),
              JSON.stringify(await pg.locator("#pExp").textContent()));
  /* EL TABLERO NO ESPERA AL MOTOR, Y SE PUEDEN ENCADENAR (v0.79). Con el motor
     falso demorando a propósito, se miden dos tiempos desde el mismo click:
     cuánto tarda la pantalla en mostrar la jugada, y cuánto en mostrar el
     veredicto. Si el dibujo esperara al motor los dos números serían iguales.

     Y SE MIRA EL TABLERO DE VERDAD, no la tarjeta: la versión vieja también
     decía "Probando Xx" enseguida, pero el tablero se quedaba en la posición
     anterior hasta que volvía el motor. Medido contra la v0.78, ahí está la
     diferencia. Se lee la pieza dibujada en la casilla de destino, que se
     puede porque el `<rect>` que recibe el toque y el `<use>` de la pieza
     comparten las mismas coordenadas.

     Y en el medio se juega OTRA sin esperar a la primera, que es lo que antes
     no se podía: el toque volvía sin hacer nada mientras el motor pensaba. */
  await elegir("#formaPrueba", "abajo");
  /* AL FINAL DE LA LÍNEA PRIMERO: acá arriba el arnés volvió a la primera
     jugada de la variante para mirarla, así que la posición en pantalla no es
     la que `posPrueba` viene siguiendo. Sin esto, las jugadas de abajo son
     ilegales en lo que se ve y los toques no hacen nada. */
  while (!(await pg.locator("#sig").isDisabled())) await pg.click("#sig");
  const desdeAca = new Chess(posPrueba.fen());
  const uno = desdeAca.moves({ verbose: true })[0];
  if (uno) {
    const t0 = Date.now();
    await pg.click(`#tablero [data-sq="${uno.from}"]`);
    await pg.click(`#tablero [data-sq="${uno.to}"]`);
    await pg.waitForFunction(
      () => /^Probando/.test(document.getElementById("pTit").textContent || ""),
      null, { timeout: 5000 });
    const dibujo = Date.now() - t0;
    /* ¿La casilla de ORIGEN ya quedó vacía, con el veredicto todavía sin
       llegar? Se mira el origen y no el destino, y costó una medición: si la
       jugada es una captura, en el destino hay una pieza en las dos versiones
       —la que se come— y el número da true aunque el tablero no se haya movido.
       El origen no tiene esa ambigüedad: o la pieza se fue, o sigue ahí. */
    const origenVacio = await pg.evaluate(sq => {
      const rect = document.querySelector(`#tablero [data-sq="${sq}"]`);
      if (!rect) return null;
      const t = `translate(${rect.getAttribute("x")} ${rect.getAttribute("y")})`;
      return ![...document.querySelectorAll("#tablero use")]
        .some(u => (u.getAttribute("transform") || "").startsWith(t));
    }, uno.from);
    desdeAca.move(uno.san);
    /* la segunda, encadenada mientras la primera todavía piensa */
    const dos = desdeAca.moves({ verbose: true })[0];
    let encadenadas = 1;
    if (dos) {
      await pg.click(`#tablero [data-sq="${dos.from}"]`);
      await pg.click(`#tablero [data-sq="${dos.to}"]`);
      encadenadas = await pg.evaluate(() =>
        document.querySelectorAll("#tiraSc .jg.inv").length);
    }
    const pendientes = await pg.evaluate(() =>
      [...document.querySelectorAll("#tiraSc .jg.inv .sm")].filter(x => x.textContent === "\u2026").length);
    await foto("encadenadas");
    await pg.waitForFunction(
      () => !/^Probando/.test(document.getElementById("pTit").textContent || ""),
      null, { timeout: 30000 });
    console.log("encadenar:", JSON.stringify({
      dibujoMs: dibujo, veredictoMs: Date.now() - t0, origenVacio,
      eslabonesAlToque: encadenadas, sinVeredictoTodavia: pendientes }));
  }

  /* al volver a la partida, la pantalla tiene que quedar EXACTAMENTE como
     estaba: es lo que dice, mirándolo, que la variante no ensució nada */
  await pg.click("#btnProbar");
  await foto("prueba-4-vuelta");
}

/* la pantalla entera: con la disposición de la v0.74 entra todo —barra,
   tarjeta, tablero, tira y curva— y eso es justamente lo que hay que mirar */
await pg.evaluate(() => document.getElementById("tablero").scrollIntoView({ block: "start" }));
await pg.evaluate(() => window.scrollBy(0, -60));
await foto("revision-tablero-y-curva");
await avanzar(13);
await foto("revision-final");
await fotoDe("#curva", "curva");
/* la barra sola: cómo termina la partida se juega en 16 px de alto, y en la
   captura de la pantalla entera esa franja es demasiado chica para juzgarla */
await fotoDe("#evalh", "barra" + SUFIJO);
/* la jugada ANTERIOR a la última: en la partida que termina en mate es la que
   permite el mate, o sea la otra mitad del arreglo de la v0.60 */
await pg.click("#ant");
await foto("revision-anteultima");

/* Parado JUSTO en una jugada marcada: es donde se ve si la marca queda tapada
   por la raya del "estás acá", que es la única que nunca puede desaparecer.
   La jugada NO se elige a ojo: se lee la posición de una marca del HTML y se
   toca la curva ahí, que es lo mismo que haría el dedo. */
/* (desde la v0.160 la curva usa siempre el punto chico, sin ajuste) */
await pg.waitForTimeout(200);
const donde = await pg.evaluate(() => {
  const pt = document.querySelector("#curva .pt");
  return pt ? parseFloat(pt.style.left) / 100 : null;
});
if (donde === null) { console.log("OJO: la curva no tiene ni una marca"); }
else {
  const caja = await pg.locator("#curva").boundingBox();
  await pg.mouse.click(caja.x + caja.width * donde, caja.y + caja.height / 2);
  await pg.waitForTimeout(250);
  await fotoDe("#curva", "marcas-encima-punto");
}

/* lo que dice la cabecera y el cierre, en texto: una captura no deja copiar y
   pegar el resultado a una prueba, y esto sí */
/* la alineación de la tira, medida en la app de verdad: el vértice del chevron
   contra el centro de la mayúscula. Es lo que `medirTira()` deja acomodado, y
   si algún día se rompe, se rompe acá y no en el celular. */
console.log("tira:     ", await pg.evaluate(() => {
  const jg = document.querySelector("#tiraSc .jg");
  const cs = getComputedStyle(jg);
  const cv = document.createElement("canvas").getContext("2d");
  cv.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const cap = cv.measureText("N").actualBoundingBoxAscent;
  const sonda = document.createElement("span");
  sonda.style.cssText = "display:inline-block;width:0;height:0";
  jg.appendChild(sonda);
  const base = sonda.getBoundingClientRect().top;
  sonda.remove();
  const p = document.querySelector("#ant path").getBoundingClientRect();
  const sel = document.querySelector("#tiraSc .jg.sel").getBoundingClientRect();
  return JSON.stringify({
    verticeChevron: +((p.top + p.bottom) / 2).toFixed(1),
    centroDeLaN: +(base - cap / 2).toFixed(1),
    recuadroArriba: +((base - cap) - sel.top).toFixed(1),
    recuadroAbajo: +(sel.bottom - base).toFixed(1) });
}));

/* CUÁNTO HABLA LA TARJETA, recorriendo la partida entera en cada posición del
   dial: es el número que decide cuál queda. Las evaluaciones son inventadas
   (motor falseado), pero cuántas jugadas tienen algo que decir no depende de
   eso sino de la posición, que es de verdad. */
for (const largo of ["corta", "media", "larga"]) {
  await elegir("#largoExp", largo);
  while (!(await pg.locator("#ant").isDisabled())) await pg.click("#ant");
  let hablan = 0, frases = 0, largos = 0;
  for (let i = 0; ; i++) {
    const d = await pg.evaluate(() => {
      const t = document.getElementById("vExp");
      return { n: t.classList.contains("oculto") ? 0 : t.querySelectorAll("span.fr").length,
               c: (t.textContent || "").trim().length };
    });
    if (d.n) { hablan++; frases += d.n; largos = Math.max(largos, d.c); }
    if (await pg.locator("#sig").isDisabled()) break;
    await pg.click("#sig");
  }
  console.log(`habla ${largo.padEnd(6)}`, JSON.stringify(
    { jugadasQueHablan: hablan, frases, masLarga: largos }));
}
await elegir("#largoExp", "media");

console.log("cabecera:", JSON.stringify(await pg.locator("#revRival").textContent()),
            JSON.stringify(await pg.locator("#revFin").textContent()));
const cierreEl = pg.locator(".tira .cierre");
console.log("cierre:  ", await cierreEl.count() ? JSON.stringify((await cierreEl.textContent()).trim()) : "(no hay)");

/* LA PASADA ANCHA (v0.80). Todo lo de arriba se dibuja a 412 x 760, que es el
   celular del usuario y donde se toman las decisiones. Esto es lo otro: la app
   en una compu, que hasta la v0.80 no existía —el archivo entero tenía UNA
   media query y era la de claro contra oscuro— y por eso nadie había visto que
   los combos salían blancos sobre blanco ni que la tira no se podía arrastrar.
   Se dibuja a 1280 x 800, y además a 1050 y 1049, que son los dos lados del
   corte: es donde se rompe si alguien toca los anchos. */
/* LA HOJA DE AJUSTES ABIERTA (v0.103), en el celu: hasta acá ninguna captura
   la mostraba, y es una pantalla de la etapa 1. Se abre y se cierra con el
   mismo camino que `elegir` y se devuelve el scroll, así las capturas que
   siguen no cambian. */
{
  const y = await pg.evaluate(() => window.scrollY);
  await pg.click("#btnAjustes");
  await pg.waitForSelector("#hojaAjustes:not(.oculto)");
  console.log("hoja de ajustes:", JSON.stringify({
    ...await espacios(pg, "#hojaAjustes"),
    alto: await pg.evaluate(() => Math.round(document.getElementById("hojaAjustes").getBoundingClientRect().height)),
  }));
  await foto("ajustes");
  /* Y LA HOJA SCROLLEADA HASTA EL FINAL (v0.143.1). La de arriba la muestra sin
     scrollear, así que desde la v0.143 —que mudó la atribución de las piezas al
     pie de la hoja— había una parte de la app que ninguna captura registraba, y
     la comparación byte a byte de cada tanda no la cubría. Lo notó el revisor. */
  await pg.evaluate(() => { const h = document.getElementById("hojaAjustes"); h.scrollTop = h.scrollHeight; });
  await pg.waitForTimeout(150);
  console.log("hoja de ajustes, al fondo:", JSON.stringify(await pg.evaluate(() => {
    const h = document.getElementById("hojaAjustes"), c = document.querySelector(".ajCredito");
    const rc = c.getBoundingClientRect(), rh = h.getBoundingClientRect();
    const toque = [...c.querySelectorAll("a")].map(a => {
      const r = a.getBoundingClientRect(), cs = getComputedStyle(a, "::before");
      const dy = parseFloat(cs.top) || 0, dx = parseFloat(cs.left) || 0;
      return Math.round(r.height - 2 * dy) + "x" + Math.round(r.width - 2 * dx);
    });
    return { renglones: c.getClientRects().length, alBorde: +(rh.bottom - rc.bottom).toFixed(1), toque };
  })));
  await foto("ajustes-fondo");
  await pg.evaluate(() => { document.getElementById("hojaAjustes").scrollTop = 0; });
  await pg.click("#cerrarAjustes");
  await pg.evaluate(y => window.scrollTo(0, y), y);
  await pg.waitForTimeout(120);
}
console.log("");
/* DE ACÁ PARA ABAJO SE DIBUJA UNA COMPU, así que hay que deshacer el `hasTouch`
   de arriba: si no, las reglas de `@media (hover: hover)` no existirían y la
   pasada ancha estaría midiendo una pantalla que no es la que se quiere probar.
   Va por CDP porque `hasTouch` se fija al crear la página y no se puede cambiar,
   y crear otra costaría volver a analizar la partida entera. */
/* 1500 y 1499 son los dos lados del corte de TRES columnas (v0.90), igual que
   1110 y 1109 lo son del de dos. */
for (const [w, h, n] of [[1280, 800, "ancho"], [1110, 800, "ancho-justo"],
                         [1109, 800, "ancho-angosto"], [1500, 800, "tres"],
                         [1499, 800, "tres-angosto"]]) {
  await pg.setViewportSize({ width: w, height: h });
  await pg.waitForTimeout(300);
  await pg.evaluate(() => document.getElementById("zonaRevision").scrollIntoView({ block: "start" }));
  await pg.evaluate(() => window.scrollBy(0, -10));
  await foto(n);
  console.log(n.padEnd(15), JSON.stringify(await pg.evaluate(() => {
    const r = q => { const e = document.querySelector(q); if (!e) return null;
      const b = e.getBoundingClientRect();
      return { x: Math.round(b.x), ancho: Math.round(b.width) }; };
    /* el LADO del tablero es lo que compran los cambios de la v0.86 en
       adelante: en una compu el tablero está limitado por el alto, así que
       cada píxel que otra cosa deja de gastar arriba es un píxel de tablero. */
    /* el que importa es el SVG y no su caja: la caja se estira al ancho de la
       columna y el tablero lo limita el ALTO (el clamp de la media query). */
    const t = document.querySelector("svg.tab").getBoundingClientRect();
    /* LA CURVA CRUZA LAS DOS COLUMNAS desde la v0.88, y lo que se mide es que
       sea más ancha que la principal y que arranque donde arranca ella: si
       quedara corrida, la jugada 20 de la curva no caería debajo de la 20 de
       la tira. `orden` es el orden vertical de verdad, leído de la pantalla,
       porque el precio que este cambio parecía tener era que la curva
       terminara DEBAJO de los cuadritos. */
    const y = q => Math.round(document.querySelector(q).getBoundingClientRect().y);
    const orden = [["tira", "#tira"], ["curva", "#curva"], ["cuadritos", ".pabajo .metricas"]]
      .sort((a, b) => y(a[1]) - y(b[1])).map(p => p[0]).join(" > ");
    /* la tarjeta al costado no se ve en el orden vertical sino en la X: en tres
       columnas termina ANTES de donde empieza el tablero */
    const tj = document.getElementById("veredicto").getBoundingClientRect();
    const tb = document.querySelector("svg.tab").getBoundingClientRect();
    return { principal: r(".principal"), lista: r("#jugadas"), tablero: Math.round(t.width),
             curva: r("#curva"), orden, tarjetaAlaIzq: Math.round(tj.right) <= Math.round(tb.left),
             eval: document.getElementById("verEval").value,
             desborde: document.documentElement.scrollWidth > window.innerWidth };
  })));
}
/* Las dos formas de la lista, una captura cada una: son dos densidades y cuál
   sirve se decide mirándolas. */
await pg.setViewportSize({ width: 1280, height: 800 });
for (const f of ["planilla"]) {   /* "una por renglón" se fue en la v0.160 */
  await pg.waitForTimeout(250);
  await pg.evaluate(() => document.getElementById("zonaRevision").scrollIntoView({ block: "start" }));
  await pg.evaluate(() => window.scrollBy(0, -10));
  await foto("ancho-" + f);
}
/* DESDE LA v0.125 en la compu la tira no se ve (queda "‹ ›" al pie de la
   lista), así que el arrastre y la rueda se miden a 900 de ancho, donde la
   Partida es la columna del celu y el mouse se la encuentra. */
await pg.setViewportSize({ width: 900, height: 800 });
await pg.waitForTimeout(300);

/* EL ARRASTRE Y LA RUEDA de la tira, con el mouse de verdad: con el dedo se
   scrollea sola, pero con mouse arrastrar un overflow-x selecciona el texto y
   la rueda vertical no la mueve. Se mide que se mueva, que NO seleccione, que
   un clic siga navegando y que la rueda no se lleve la página puesta. */
await pg.evaluate(() => document.getElementById("tira").scrollIntoView({ block: "center" }));
await pg.waitForTimeout(200);
const cajaTira = await pg.locator("#tiraSc").boundingBox();
const yTira = cajaTira.y + cajaTira.height / 2;
const izq = () => pg.evaluate(() => document.getElementById("tiraSc").scrollLeft);
await pg.evaluate(() => { document.getElementById("tiraSc").scrollLeft = 200; });
const antesArr = await izq();
await pg.mouse.move(cajaTira.x + cajaTira.width - 40, yTira);
await pg.mouse.down();
for (let i = 1; i <= 6; i++) await pg.mouse.move(cajaTira.x + cajaTira.width - 40 - i * 20, yTira);
const durante = await izq();
const seleccion = await pg.evaluate(() => (window.getSelection().toString() || "").trim());
await pg.mouse.up();
console.log("arrastre:      ", JSON.stringify(
  { scrollLeft: antesArr + " -> " + durante, seleccionoTexto: seleccion }));
const selAntes = await pg.locator("#tiraSc .jg.sel .sa").textContent();
await pg.locator("#tiraSc .jg:not(.sel)").nth(3).click();
await pg.waitForTimeout(300);
console.log("clic:          ", JSON.stringify(
  { de: selAntes, a: await pg.locator("#tiraSc .jg.sel .sa").textContent() }));
await pg.evaluate(() => { document.getElementById("tiraSc").scrollLeft = 100; });
const pagAntes = await pg.evaluate(() => window.scrollY);
const tiraAntes = await izq();
await pg.mouse.move(cajaTira.x + cajaTira.width / 2, yTira);
await pg.mouse.wheel(0, 200);
await pg.waitForTimeout(250);
console.log("rueda:         ", JSON.stringify(
  { tira: tiraAntes + " -> " + await izq(),
    pagina: pagAntes + " -> " + await pg.evaluate(() => window.scrollY) }));

/* LO QUE SOLO EXISTE CON MOUSE (v0.82), medido y no leído del código. */
await pg.setViewportSize({ width: 1280, height: 860 });
await pg.waitForTimeout(350);
await pg.evaluate(() => document.getElementById("zonaRevision").scrollIntoView({ block: "start" }));
await pg.waitForTimeout(200);
const tiempos = await pg.evaluate(() =>
  [...document.querySelectorAll("#jugadas .se")].slice(0, 6).map(e => e.textContent));
console.log("tiempos:       ", JSON.stringify(tiempos),
  tiempos.every(t => t === "\u00b7")
    ? "(esta partida no trae reloj; con `npm run mirar reloj` salen números)" : "");

/* LA PREVIA: pasar el mouse por una jugada muestra esa posición y al salir
   devuelve EXACTAMENTE lo que había. Se mide el tablero entero, no un pedazo:
   lo que interesa es que no quede nada distinto. */
const tablero = () => pg.evaluate(() => document.getElementById("tablero").innerHTML);
const elegida = () => pg.evaluate(() =>
  ((document.querySelector("#jugadas .jg.sel") || {}).textContent || "").trim());
const t0 = await tablero(), e0 = await elegida();
await pg.locator("#jugadas .jg").nth(12).hover();
/* v0.139: la previa espera (500 ms desde la v0.141) antes de aparecer, así que recién entrado el
   mouse el tablero tiene que seguir igual. Es lo que evita que parpadee al
   cruzar la lista. */
await pg.waitForTimeout(300);
const tPronto = await tablero();
await pg.waitForTimeout(400);
const t1 = await tablero();
/* y con la previa ya abierta, el renglón de al lado no vuelve a esperar ni pasa
   por la posición real: a los 40 ms ya es OTRA previa */
await pg.locator("#jugadas .jg").nth(14).hover();
await pg.waitForTimeout(40);
const tVecino = await tablero();
await pg.locator("#jugadas .jg").nth(12).hover();
await pg.waitForTimeout(150);
/* v0.141: pararse en los segundos, entre las dos jugadas del renglón, no
   cierra la previa. Es lo que dejaba pasar a la de al lado sin que se fuera. */
await pg.locator("#jugadas .se").nth(12).hover();
await pg.waitForTimeout(250);
const tSegundos = await tablero();
/* v0.142: pero si el mouse se QUEDA ahí, a los 500 ms se cierra */
await pg.waitForTimeout(450);
const tQuieto = await tablero();
await pg.screenshot({ path: path.join(SALIDA, "previa" + SUFIJO + ".png") });
await pg.mouse.move(5, 5);
await pg.waitForTimeout(250);
console.log("previa:        ", JSON.stringify(
  { esperaAntesDeAparecer: tPronto === t0, cambioElTablero: t0 !== t1,
    elVecinoNoEspera: tVecino !== t0 && tVecino !== t1,
    sigueSobreLosSegundos: tSegundos === t1, ySeCierraSiSeQueda: tQuieto === t0,
    volvioIgual: t0 === (await tablero()),
    yNoNavego: e0 === (await elegida()) }));

/* LA RUEDA SOBRE EL TABLERO pasa de jugada. */
const cajaTab = await pg.locator("#tablero").boundingBox();
const antesRueda = await elegida();
/* UN CLIC DE RUEDA ES UNA JUGADA, mande lo que mande (v0.139). Se mide con los
   dos valores que manda un mouse de verdad —100 y 120— y contando jugadas.
   OJO: a escala 2 Chromium entrega LA MITAD de lo que se le pide (medido: en una
   página a escala 1 llegan enteros), y por eso la versión vieja acá pasaba una
   sola con 120 mientras que en la compu de Juan pasaba 2 o 3. Los tres de 30 del
   final son el trackpad: llegan como 15 y recién el tercero junta los 40. */
const cualElegida = () => pg.evaluate(() =>
  [...document.querySelectorAll("#jugadas .jg")].findIndex(e => e.classList.contains("sel")));
await pg.mouse.move(cajaTab.x + cajaTab.width / 2, cajaTab.y + cajaTab.height / 2);
const pasos = [];
for (const d of [100, 120, 100, -100, 30, 30, 30, 400]) {
  const a = await cualElegida();
  await pg.mouse.wheel(0, d);
  await pg.waitForTimeout(250);
  pasos.push(d + ":" + ((await cualElegida()) - a));
}
console.log("rueda tablero: ", JSON.stringify({ de: antesRueda, a: await elegida(), pasos }));

/* LA TECLA `n` SALTA AL PRÓXIMO ERROR, y el símbolo dice si acertó. */
await pg.keyboard.press("n");
await pg.waitForTimeout(400);
console.log("tecla n:       ", JSON.stringify(await pg.evaluate(() => {
  const s = document.querySelector("#jugadas .jg.sel");
  return s ? { jugada: s.querySelector(".sa").textContent,
               simbolo: s.querySelector(".sm").textContent } : null;
})));
/* ARRASTRAR UNA PIEZA (v0.84), con el mouse de verdad. Se vuelve a una jugada
   conocida para que la posición sea determinista y la jugada salga de chess.js,
   no de mirar el tablero. */
if (await pg.locator("#prueba").isVisible()) await pg.locator("#prueba button").first().click();
for (let i = 0; i < 60; i++) { if (await pg.locator("#ant").isDisabled()) break; await pg.click("#ant"); }
/* 7 y no 6 desde la v0.124: el primer paso sale de la posición inicial */
for (let i = 0; i < 7; i++) await pg.click("#sig");
await pg.waitForTimeout(300);
await pg.evaluate(() => document.getElementById("tablero").scrollIntoView({ block: "center" }));
await pg.waitForTimeout(250);
const mv = new Chess(fens[7]).moves({ verbose: true })[0];
const medio = async sq => {
  const c = await pg.locator(`#tablero [data-sq="${sq}"]`).boundingBox();
  return { x: c.x + c.width / 2, y: c.y + c.height / 2 };
};
const desdeXY = await medio(mv.from), hastaXY = await medio(mv.to);
await pg.mouse.move(desdeXY.x, desdeXY.y);
await pg.mouse.down();
await pg.mouse.move(desdeXY.x + 14, desdeXY.y + 14);
await pg.waitForTimeout(150);
const enElAire = await pg.evaluate(sq => {
  const p = document.querySelector(`[data-pz="${sq}"]`);
  /* el corrimiento va ADELANTE del transform que ya tenía, así que tiene que
     haber DOS translate. Cuánto se corre depende del tamaño del tablero —son
     unidades del SVG, no píxeles— así que se mira que no sea cero, no un número. */
  const t = p.getAttribute("transform") || "";
  const m = t.match(/^translate\(([-\d.]+) ([-\d.]+)\) translate\(/);
  return p && { transform: t,
                corrida: !!m && (Math.abs(+m[1]) > 1 || Math.abs(+m[2]) > 1),
                sordaAlMouse: p.style.pointerEvents === "none" };
}, mv.from);
await pg.mouse.move(hastaXY.x, hastaXY.y);
await pg.mouse.up();
await pg.waitForFunction(() => !/^Probando/.test(document.getElementById("pTit").textContent || ""),
  null, { timeout: 30000 });
await pg.waitForTimeout(300);
console.log("arrastre pieza:", JSON.stringify(
  { jugada: mv.from + "->" + mv.to, enElAire,
    quedo: (await pg.locator("#pTit").textContent()).trim() }));
if (await pg.locator("#prueba").isVisible()) await pg.locator("#prueba button").first().click();

/* LO QUE UN MOUSE DE VERDAD HACE Y EL ARNÉS NO HACÍA (v0.144): dejar el mouse
   QUIETO sobre la lista mientras se pasa con el teclado, soltar una pieza
   AFUERA del tablero, y usar las flechas con una variante abierta. Las cuatro
   fallas pasaban todas las medidas de arriba, que siempre mueven el mouse
   antes de mirar. */
{
  const sel = () => pg.evaluate(() => +(document.querySelector("#jugadas .jg.sel") || { dataset: {} }).dataset.i);
  const enElAireAhora = () => pg.evaluate(() =>
    [...document.querySelectorAll("#tablero [data-pz]")].some(p => p.style.pointerEvents === "none"));
  /* 1. el mouse apoyado en la lista y doce flechas: la lista scrollea debajo
     del puntero, y el tablero NO tiene que irse a la jugada que quedó ahí */
  const cj = await pg.locator("#jugadas .jg").nth(9).boundingBox();
  await pg.mouse.move(cj.x + cj.width / 2, cj.y + cj.height / 2);
  for (let i = 0; i < 12; i++) { await pg.keyboard.press("ArrowRight"); await pg.waitForTimeout(30); }
  const q0 = await tablero();
  await pg.waitForTimeout(800);
  const quietoNoPrevisualiza = q0 === (await tablero());
  /* y moverlo de verdad adentro del mismo renglón sí la pide */
  await pg.mouse.move(cj.x + cj.width / 2 + 3, cj.y + cj.height / 2 + 1);
  await pg.waitForTimeout(700);
  const sobre = await pg.evaluate(([x, y]) => {
    const e = document.elementFromPoint(x, y), j = e && e.closest(".jg");
    return j ? +j.dataset.i : null; }, [cj.x + cj.width / 2 + 3, cj.y + cj.height / 2 + 1]);
  const moverSiLaPide = sobre === null || sobre === (await sel()) || q0 !== (await tablero());
  await pg.mouse.move(5, 5); await pg.waitForTimeout(250);
  /* 2. Alt+← es del navegador: ni se lo come ni pasa jugada */
  const s0 = await sel();
  const altComido = await pg.evaluate(() => {
    const e = new KeyboardEvent("keydown", { key: "ArrowLeft", altKey: true, bubbles: true, cancelable: true });
    document.body.dispatchEvent(e); return e.defaultPrevented; });
  const altNoNavega = s0 === (await sel());
  /* 3. soltar la pieza afuera del tablero: vuelve a su casilla y no sigue al mouse */
  const mv2 = new Chess(fens[(await sel()) + 1]).moves({ verbose: true })[0];
  const o = await medio(mv2.from), ct = await pg.locator("#tablero").boundingBox();
  await pg.mouse.move(o.x, o.y); await pg.mouse.down();
  await pg.mouse.move(o.x + 12, o.y + 12);
  await pg.mouse.move(ct.x - 50, o.y, { steps: 4 });
  await pg.mouse.up();
  await pg.waitForTimeout(100);
  const sueltaAfuera = !(await enElAireAhora());
  await pg.mouse.move(o.x + 60, o.y - 30, { steps: 3 });
  const noSigueAlMouse = !(await enElAireAhora());
  const sinTextoPintado = (await pg.evaluate(() => getSelection().toString())) === "";
  /* 4. con una variante abierta, las flechas y la rueda la recorren (no la
     cierran) y Escape sale */
  const h = await medio(mv2.to);
  await pg.mouse.click(h.x, h.y);
  await pg.waitForFunction(() => !/^Probando/.test(document.getElementById("pTit").textContent || ""), null, { timeout: 30000 });
  const veo = () => pg.evaluate(() => ({ abierta: !document.getElementById("prueba").classList.contains("oculto"),
                                         ant: document.getElementById("ant").disabled, sig: document.getElementById("sig").disabled }));
  const v0 = await veo();
  await pg.keyboard.press("ArrowLeft"); await pg.waitForTimeout(80);
  const v1 = await veo();
  await pg.mouse.move(ct.x + ct.width / 2, ct.y + ct.height / 2);
  await pg.mouse.wheel(0, 120); await pg.waitForTimeout(150);
  const v2 = await veo();
  await pg.keyboard.press("Escape"); await pg.waitForTimeout(80);
  const v3 = await veo();
  const sigueEnLaJugada = s0 === (await sel());
  /* 5. un clic suelto en una pieza la MARCA y no abre la variante (v0.152;
     hasta la v0.151 abría una vacía, "Elegiste…"): el tablero no se mueve, la
     pieza queda marcada, y las flechas y la rueda siguen pasando jugadas */
  const arriba = () => pg.evaluate(() => document.getElementById("tablero").getBoundingClientRect().top);
  const t0 = await arriba();
  await pg.mouse.click(o.x, o.y); await pg.waitForTimeout(80);
  const elegidaSinJugar = !(await veo()).abierta && (await arriba()) === t0 &&
    (await pg.evaluate(() => document.querySelectorAll('#tablero rect[stroke="#6a1b9a"]').length)) === 1;
  await pg.keyboard.press("ArrowRight"); await pg.waitForTimeout(80);
  const s1 = await sel();
  await pg.mouse.click(o.x, o.y); await pg.waitForTimeout(80);
  await pg.mouse.move(ct.x + ct.width / 2, ct.y + ct.height / 2);
  await pg.mouse.wheel(0, -120); await pg.waitForTimeout(150);
  const unClicNoLasMata = elegidaSinJugar && s1 === s0 + 1 && (await sel()) === s0;
  await pg.mouse.move(5, 5);
  /* y se vuelve a la jugada de antes: lo que sigue mide y fotografía desde ahí */
  for (let i = 0; i < 12; i++) await pg.keyboard.press("ArrowLeft");
  await pg.waitForTimeout(200);
  console.log("mouse de verdad:", JSON.stringify({
    quietoNoPrevisualiza, moverSiLaPide, altComido, altNoNavega,
    sueltaAfuera, noSigueAlMouse, sinTextoPintado,
    flechaRecorreLaVariante: v0.abierta && v0.sig && v1.abierta && v1.ant && !v1.sig,
    ruedaTambien: v2.abierta && v2.sig && !v2.ant,
    escapeSale: !v3.abierta, sigueEnLaJugada, unClicNoLasMata }));
}

/* LA CURVA ANCHA NO SE PUEDE IR ABAJO DEL PLIEGUE (v0.88). Se prueba con la
   lista en su forma más alta —"una por renglón" gasta el doble— que es donde la
   lista le ganaba a la columna y empujaba la curva para abajo. */
await pg.setViewportSize({ width: 1280, height: 800 });
await pg.waitForTimeout(350);
await pg.evaluate(() => document.getElementById("zonaRevision").scrollIntoView({ block: "start" }));
await pg.evaluate(() => window.scrollBy(0, -10));
await pg.waitForTimeout(200);
await foto("ancho-curva");
/* SE MIDE EN LAS DOS FORMAS DE LA EVALUACIÓN: la vertical le da 26 px más al
   tablero, así que es la que empuja la curva más abajo, y es la de fábrica. */
const curvaEn = async forma => {
  await elegir("#verEval", forma);
  await pg.waitForTimeout(300);
  await pg.evaluate(() => document.getElementById("zonaRevision").scrollIntoView({ block: "start" }));
  await pg.evaluate(() => window.scrollBy(0, -10));
  await pg.waitForTimeout(150);
  return pg.evaluate(() => {
    const c = document.getElementById("curva").getBoundingClientRect();
    /* la columna del tablero TERMINA en `.pmedio` desde la v0.90: `.parriba` es
       solo el encabezado, así que comparar contra él daría siempre que desborda */
    const col = document.querySelector(".pmedio").getBoundingClientRect();
    const li = document.getElementById("lateral").getBoundingClientRect();
    return { ancho: Math.round(c.width),
             listaDesbordaLaColumna: Math.round(li.bottom - col.bottom) > 1,
             aireAbajo: Math.round(window.innerHeight - c.bottom) };
  });
};
console.log("curva ancha:   ", JSON.stringify(
  { horizontal: await curvaEn("horizontal"), barra: await curvaEn("barra") }));
/* Y LO MISMO EN TRES COLUMNAS (v0.90): ahí el presupuesto de alto es otro
   —la tarjeta se fue a la columna de al lado y deja de gastar— y el aire de
   abajo de la curva es lo que dice si el número está bien puesto. */
await pg.setViewportSize({ width: 1500, height: 800 });
await pg.waitForTimeout(300);
const tres = { horizontal: await curvaEn("horizontal"), barra: await curvaEn("barra") };
tres.lado = await pg.evaluate(() =>
  Math.round(document.querySelector("svg.tab").getBoundingClientRect().width));
/* con la barra vertical, que es la de fábrica en compu: es la pantalla que ve
   de verdad el que tiene el monitor ancho */
await foto("tres-barra");
console.log("tres columnas: ", JSON.stringify(tres));
await pg.setViewportSize({ width: 1280, height: 800 });
await pg.waitForTimeout(300);

/* EL ORDEN DE TAB DE LA PARTIDA EN LA COMPU (v0.182.1): el de lectura, de
   arriba a abajo del panel y Girar al final. Se recorre con Tab de verdad
   desde "volver" y se anotan los que se cruzan. */
{
  await pg.focus("#volverDeLaPartida");
  const pasos = ["volverDeLaPartida"];
  for (let i = 0; i < 7; i++) {
    await pg.keyboard.press("Tab");
    pasos.push(await pg.evaluate(() => document.activeElement.id || document.activeElement.tagName));
  }
  console.log("orden de tab:  ", pasos.join(" > "),
              "(volver, tuerca, Mejor, las tres mejores, lista, ‹ ›, Girar)");
  await pg.evaluate(() => document.activeElement.blur());
}

/* LAS TRES FORMAS DE LA EVALUACIÓN Y CUÁNTO TABLERO CUESTA CADA UNA (v0.86).
   En una compu el tablero está limitado por el alto, así que la barra que se
   suma arriba se le descuenta al lado. Se mide, no se estima. */
await pg.setViewportSize({ width: 1280, height: 800 });
await pg.waitForTimeout(250);
const lado = () => pg.evaluate(() =>
  Math.round(document.querySelector("svg.tab").getBoundingClientRect().width));
const porForma = {};
for (const f of ["horizontal", "barra", "tarjeta"]) {
  await elegir("#verEval", f);
  await pg.waitForTimeout(250);
  porForma[f] = await lado();
  /* la barra horizontal va al ancho del panel, arriba de él (v0.151; hasta la
     v0.150 arrancaba con la columna a), las casillas y el panel arrancan a la
     misma altura, y el título sigue alineado con la columna a: todo en 0 */
  if (f === "horizontal") console.log("barra horizontal:", JSON.stringify(await pg.evaluate(() => {
    const b = document.getElementById("evalh").getBoundingClientRect(), s = document.querySelector("svg.tab").getBoundingClientRect();
    const p = document.querySelector("#zonaRevision > .tarjetas").getBoundingClientRect();
    const m = s.width * 15 / 366;
    return { izq: Math.round(b.left - p.left),
             der: Math.round(b.right - p.right),
             arranque: Math.round(s.top + m - p.top),
             /* el renglón del título, con un Range: arranca con la columna a */
             titulo: (() => { const r = document.createRange(); r.selectNodeContents(document.getElementById("revRival"));
                              return Math.round(r.getBoundingClientRect().left - (s.left + m)); })() };
  })), "(1280×800; todo en 0)");
  /* el Resumen, en la pestaña del panel (v1.7; de la v0.137 a la v1.6 iba
     abajo, de la columna a al borde del panel), en las tres formas: la zona
     de abajo escondida, y la tabla al ras del panel: 0 y 0 */
  await pg.click("#tabResumen"); await pg.waitForTimeout(200);
  porForma[f + "Resumen"] = await pg.evaluate(() => {
    const t = document.getElementById("resumenAncho"), p = document.querySelector("#zonaRevision > .tarjetas").getBoundingClientRect();
    if (!t.offsetParent) return [null, null, "MAL: no se ve"];
    const r = t.getBoundingClientRect();
    return [Math.round(r.left - p.left), Math.round(r.right - p.right),
            document.getElementById("zonaResumen").offsetParent ? "MAL: la de abajo también" : "pestaña"];
  });
  await pg.click("#tabJugadas"); await pg.waitForTimeout(150);
}
console.log("resumen en la pestaña:", JSON.stringify(["horizontal", "barra", "tarjeta"].map(f => porForma[f + "Resumen"])), "(1280×800; todo en 0)");
for (const f of ["horizontal", "barra", "tarjeta"]) {
  const [a, b, e] = porForma[f + "Resumen"];
  if (e !== "pestaña" || Math.abs(a) > 1 || Math.abs(b) > 1) console.log(`OJO: con la forma ${f} el Resumen no queda al ras del panel en su pestaña (${a}, ${b}, ${e})`);
}
console.log("lado del tablero:", JSON.stringify(porForma), "(compu, 800 de alto)");
/* LA BARRA PEGADA AL TABLERO Y EL NÚMERO ENTERO ADENTRO. Las dos fallaron en la
   primera captura de la v0.86 y ninguna de las dos la agarraba una cuenta: la
   barra quedaba a 170 px del tablero y "+0.26" salía cortado. */
await elegir("#verEval", "barra");
await pg.waitForTimeout(250);
/* SE MIDE EN DOS JUGADAS: una con el número corto y otra con el largo. "+0.26"
   entra en la barra y "+10.00" no entraba, y el recorte no avisa. Desde la
   v0.105 el largo sale "+10.0", con la letra en 11 igual que el corto. */
const barra = () => pg.evaluate(() => {
  const b = document.getElementById("evalbar").getBoundingClientRect();
  const t = document.querySelector("svg.tab").getBoundingClientRect();
  const n = document.getElementById("evalnum");
  return { texto: n.textContent, hastaElTablero: Math.round(t.left - b.right),
           entero: n.scrollWidth <= Math.ceil(b.width), letra: getComputedStyle(n).fontSize };
});
const barraCorta = await barra();
await pg.evaluate(() => { for (let i = 0; i < 30; i++) document.getElementById("sig").click(); });
await pg.waitForTimeout(500);
const barraLarga = await barra();
/* Y EN UN ANCHO INTERMEDIO (v0.107): de 413 a 1109 el tablero no crece —son
   360— pero la columna sí, y la barra quedaba a 140 px. El arreglo de la v0.86
   vivía solo en el `@media` de 1110 y este ancho no lo medía nadie. */
await pg.setViewportSize({ width: 1000, height: 700 });
await pg.waitForTimeout(250);
const barraMedia = await barra();
await pg.setViewportSize({ width: 1280, height: 800 });
await pg.waitForTimeout(250);
console.log("barra vertical: ", JSON.stringify({ corto: barraCorta, largo: barraLarga,
  a1000x700: barraMedia.hastaElTablero }));
/* LOS ANCHOS DEL MEDIO (v0.118): de 700 a 949 el tablero crece en la columna
   de 700, y desde 950 arrancan las dos columnas. Lo que se cuida: el lado a
   cada lado de los cortes (que agrandar la ventana no lo achique de golpe más
   de ~150), la barra pegada, que la curva entre en la pantalla y que nada
   desborde. Con la barra vertical, que es la de fábrica en compu. */
const anchosMedio = {};
/* desde la v0.125 el corte de la Partida es 1000 */
for (const [w, h] of [[800, 1000], [949, 900], [999, 900], [1000, 900], [1050, 900], [1109, 900], [1110, 900], [1109, 800]]) {
  await pg.setViewportSize({ width: w, height: h });
  await pg.waitForTimeout(250);
  anchosMedio[`${w}x${h}`] = await pg.evaluate(() => {
    const z = document.getElementById("zonaRevision");
    window.scrollTo(0, z.getBoundingClientRect().top + window.scrollY - 8);
    const t = document.querySelector("svg.tab").getBoundingClientRect();
    const c = document.getElementById("curva").getBoundingClientRect();
    const b = document.querySelector(".evalbar").getBoundingClientRect();
    return { lado: Math.round(t.width), barra: Math.round(t.left - b.right),
             curva: `${Math.round(c.bottom)}/${innerHeight}`,
             lista: getComputedStyle(document.querySelector(".colLista")).display !== "none",
             /* y si desborda, QUÉ: el primero que se pasa del borde */
             desborde: document.documentElement.scrollWidth > innerWidth &&
               ([...document.querySelectorAll("body *")].map(e => [e, e.getBoundingClientRect()])
                 .filter(([, r]) => r.width && r.right > innerWidth + 0.5)
                 .map(([e, r]) => `${e.id || e.className || e.tagName}:${Math.round(r.right)}`)[0] ||
                `${document.documentElement.scrollWidth - innerWidth} px sin culpable a la vista`) };
  });
}
await pg.setViewportSize({ width: 1280, height: 800 });
await pg.waitForTimeout(250);
console.log("anchos del medio:", JSON.stringify(anchosMedio));
await pg.evaluate(() => { for (let i = 0; i < 30; i++) document.getElementById("ant").click(); });
await pg.waitForTimeout(500);
await elegir("#verEval", "barra");
await pg.waitForTimeout(250);
await pg.evaluate(() => document.getElementById("zonaRevision").scrollIntoView({ block: "start" }));
await pg.evaluate(() => window.scrollBy(0, -10));
await foto("ancho-eval-barra");

/* LAS TRES MEJORES DEL MOTOR (v0.89). Se pide con el botón —no se calculan
   solas— y se mide qué quedó dibujado, que la primera sea la mejor jugada que ya
   dice el cuadrito, y que tocar una abra la variante con ESA jugada. */
await pg.evaluate(() => document.getElementById("zonaRevision").scrollIntoView({ block: "start" }));
await pg.waitForTimeout(200);
const alt = {};
alt.antesDePedir = await pg.locator("#altLista").innerText();
await pg.click("#btnAlts");
await pg.waitForFunction(() => document.querySelectorAll("#altLista .alt").length > 0,
  null, { timeout: 30000 });
await pg.waitForTimeout(200);
alt.filas = await pg.evaluate(() => [...document.querySelectorAll("#altLista .alt")]
  .map(e => e.querySelector(".as").textContent + " " + e.querySelector(".ae").textContent));
/* Desde la v0.139 las tres son de la posición ANTERIOR —las que había en lugar
   de la jugada que se mira—, o sea la misma de la que habla el cuadrito
   "Mejor": la primera tiene que ser esa. */
alt.titulo = await pg.locator("#altTit").textContent();
alt.jugadaMirada = ((await pg.locator("#jugadas .jg.sel .sa").textContent()) || "").trim();
alt.mejorDelCuadrito = await pg.evaluate(() =>
  (document.getElementById("tileMejor").textContent || "").replace(/\s+/g, " ").trim());
alt.lasTres = await pg.evaluate(() =>
  [...document.querySelectorAll("#altLista .alt .as")].map(e => e.dataset.uci));
alt.marcada = await pg.evaluate(() =>
  [...document.querySelectorAll("#altLista .alt.jugada .as")].map(e => e.textContent));
alt.botonEscondido = await pg.locator("#btnAlts").isHidden();
await foto("ancho-alternativas");
/* tocar la segunda abre la variante CON ESA jugada */
const san2 = await pg.locator("#altLista .alt").nth(1).locator(".as").textContent();
await pg.locator("#altLista .alt").nth(1).locator(".as").click();
await pg.waitForFunction(() => !/^Probando/.test(document.getElementById("pTit").textContent || ""),
  null, { timeout: 30000 });
await pg.waitForTimeout(250);
alt.alTocarLaSegunda = { pedida: san2, quedo: (await pg.locator("#pTit").textContent()).trim(),
  /* la variante reemplaza a la jugada: la lista sigue siendo la misma y ahora
     la marcada es la que se acaba de probar */
  titulo: await pg.locator("#altTit").textContent(),
  marcada: await pg.evaluate(() =>
    [...document.querySelectorAll("#altLista .alt.jugada .as")].map(e => e.textContent)) };
await foto("ancho-alternativas-probada");
console.log("alternativas:  ", JSON.stringify(alt));
if (await pg.locator("#prueba").isVisible()) await pg.locator("#prueba button").first().click();
await pg.waitForTimeout(300);

/* LA TIRA DE PIEZAS COMIDAS (v0.87). Se va a una jugada donde ya se comieron
   cosas de los dos lados y se mide qué quedó dibujado, no que exista el div.
   La jugada sale de chess.js y no de mirar el tablero. */
await pg.evaluate(() => { for (let i = 0; i < 30; i++) document.getElementById("sig").click(); });
await pg.waitForTimeout(500);
await pg.evaluate(() => document.getElementById("zonaRevision").scrollIntoView({ block: "start" }));
await pg.evaluate(() => window.scrollBy(0, -10));
await pg.waitForTimeout(250);
await foto("ancho-comidas");
console.log("comidas:       ", JSON.stringify(await pg.evaluate(() => {
  const g = id => {
    const e = document.getElementById(id);
    const b = e.getBoundingClientRect();
    return { piezas: e.querySelectorAll("use").length,
             dif: (e.querySelector(".cDif") || {}).textContent || "",
             x: Math.round(b.x) };
  };
  const t = document.querySelector("svg.tab").getBoundingClientRect();
  return { arriba: g("cArriba"), abajo: g("cAbajo"),
           /* pegada al tablero y no flotando: el hueco es el gap y nada más */
           delTableroALaTira: Math.round(document.getElementById("cArriba").getBoundingClientRect().x - t.right),
           lado: Math.round(t.width), desborde: document.documentElement.scrollWidth > window.innerWidth };
})));

/* MARCAR CON EL BOTÓN DERECHO (v0.85), con el mouse de verdad. Se cuentan los
   hijos de las dos capas y no se mira el dibujo: lo que importa es que el gesto
   agregue y saque, y cuántos elementos tiene cada marca es cosa de `svgMarcas`
   —una casilla es un <rect> y una flecha son dos, la línea y la punta—. */
const derecho = async (a, z) => {
  const p = await medio(a), q = await medio(z);
  await pg.mouse.move(p.x, p.y);
  await pg.mouse.down({ button: "right" });
  if (a !== z) await pg.mouse.move(q.x, q.y);
  await pg.mouse.up({ button: "right" });
  await pg.waitForTimeout(120);
};
const marcas = () => pg.evaluate(() => {
  const n = id => (document.getElementById(id) || { children: [] }).children.length;
  return n("mBajo") + "+" + n("mAlto");
});
await pg.evaluate(() => document.getElementById("tablero").scrollIntoView({ block: "center" }));
await pg.waitForTimeout(250);
const marcado = {};
await derecho("g1", "f3"); await derecho("c1", "h6");
await derecho("e5", "e5"); await derecho("d4", "d4");
marcado.dosFlechasYDosCasillas = await marcas();
await pg.locator("#tablero").screenshot({ path: path.join(SALIDA, "marcas" + SUFIJO + ".png") });
/* repetir el mismo gesto borra */
await derecho("e5", "e5"); await derecho("g1", "f3");
marcado.repitiendoElGesto = await marcas();
/* soltar afuera del tablero cancela */
const esq = await medio("a1");
await pg.mouse.move(esq.x, esq.y);
await pg.mouse.down({ button: "right" });
await pg.mouse.move(5, 5);
await pg.mouse.up({ button: "right" });
await pg.waitForTimeout(120);
marcado.soltandoAfuera = await marcas();
/* y el clic izquierdo las borra todas, por `pintarRevision` */
const h3 = await medio("h3");
await pg.mouse.click(h3.x, h3.y);
await pg.waitForTimeout(400);
marcado.trasClicIzquierdo = await marcas();
marcado.menuCancelado = await pg.evaluate(() => {
  const e = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
  document.querySelector("#tablero svg").dispatchEvent(e);
  return e.defaultPrevented;
});
console.log("marcas:        ", JSON.stringify(marcado));
if (await pg.locator("#prueba").isVisible()) await pg.locator("#prueba button").first().click();

/* LOS ESTADOS QUE FALTABAN (APRENDIZAJES.md, 22-nov-2026). Nueve de catorce
   lavados de la etapa 1 se escaparon porque la zona se juzgaba en el único
   estado, ancho o pantalla que traía el arnés (causas A, B y F). Acá se suman
   esos estados, con capturas NUEVAS —ninguna de las de arriba cambia, así que
   la comparación byte a byte sigue valiendo— y medidas que se leen sin mirar:
   - todo texto cortado con "…" (salvo nombres y aperturas) a 386, 1000 y 1280;
   - [PC] la lista de jugadas bajada hasta el final (caso v0.179: el fundido se
     eligió mirando la lista solo arriba de todo);
   - [PC] la barra horizontal en una captura propia (caso 1);
   - los bordes de la Partida, que se comparan al final con los del Mes y el
     inicio (casos 2 y 10).
   El dial en "la lista abajo" (caso 7) ya tiene la suya: prueba-forma-abajo. */
const NO_SE_CORTA = ".rival, .cabTit .l2, #yaUsuarioNombre, #partidas, #mesLista";
const cortados = () => pg.evaluate(salvo => [...document.querySelectorAll("body *")].filter(e => {
  if (!e.getClientRects().length || e.closest(salvo)) return false;
  if (getComputedStyle(e).textOverflow !== "ellipsis") return false;
  return e.scrollWidth > e.clientWidth + 1;
}).map(e => (e.id ? "#" + e.id : e.classList[0] ? "." + e.classList[0] : e.tagName.toLowerCase()) +
            " «" + e.textContent.trim().replace(/\s+/g, " ").slice(0, 24) + "»"), NO_SE_CORTA);
const BORDES = {};
const bordesDe = (sels) => pg.evaluate(sels => {
  const rs = sels.map(s => [...document.querySelectorAll(s)]).flat()
    .filter(e => e.getClientRects().length).map(e => e.getBoundingClientRect());
  return rs.length ? [Math.round(Math.min(...rs.map(r => r.left))), Math.round(Math.max(...rs.map(r => r.right)))] : null;
}, sels);
{
  const cortes = {};
  for (const [w, h] of [[386, 760], [1000, 800], [1280, 800]]) {
    await pg.setViewportSize({ width: w, height: h });
    await pg.waitForTimeout(250);
    cortes[w] = await cortados();
    if (w > 900) BORDES["partida " + w] = await bordesDe(["#zonaRevision .principal", "#lateral"]);
  }
  console.log("texto cortado, partida:", JSON.stringify(cortes), "(tiene que ser todo [])");

  await elegir("#verEval", "horizontal");
  await pg.waitForTimeout(250);
  await pg.evaluate(() => { document.getElementById("zonaRevision").scrollIntoView({ block: "start" }); window.scrollBy(0, -10); });
  await foto("ancho-barra-horizontal");
  await elegir("#verEval", "barra");

  /* la lista no entra a 1600×900: se la baja hasta el final y se mira el
     borde de ARRIBA, que es el que no veía nadie */
  await pg.setViewportSize({ width: 1600, height: 900 });
  await pg.waitForTimeout(300);
  await pg.evaluate(() => { document.getElementById("zonaRevision").scrollIntoView({ block: "start" }); window.scrollBy(0, -10); });
  const listaEn = async donde => {
    await pg.evaluate(d => { const l = document.getElementById("jugadas"); l.scrollTop = d === "abajo" ? l.scrollHeight : 0;
                             l.dispatchEvent(new Event("scroll")); }, donde);
    await pg.waitForTimeout(200);
    return pg.evaluate(() => {
      const l = document.getElementById("jugadas"), f = l.firstElementChild ? l.firstElementChild.offsetHeight : 1;
      return { noEntra: l.scrollHeight > l.clientHeight + 1, hayMas: l.classList.contains("hayMas"),
               arribaAsoma: Math.round(l.scrollTop % f), abajoAsoma: Math.round((l.scrollTop + l.clientHeight) % f) };
    });
  };
  const arriba = await listaEn("arriba");
  const abajo = await listaEn("abajo");
  await foto("ancho-lista-abajo");
  await listaEn("arriba");
  console.log("lista, 1600×900:", JSON.stringify({ arriba, abajo }),
              "(arribaAsoma/abajoAsoma: px de una fila cortada contra ese borde; 0 es fila entera)");
  await pg.setViewportSize({ width: 1280, height: 800 });
  await pg.waitForTimeout(250);
}

/* LA VISTA DEL MES, en el celu (v0.105). Hasta acá ninguna captura la
   mostraba: la v0.98 la miró con una maqueta descartable, y en la v0.104 los
   campos pasaron a 44 sin que nadie viera cómo quedaban los dos selects de
   arriba. Se analiza el mes de la API falsa —una sola partida, que ya está en
   la caché, así que es instantáneo— y se fotografía la cabecera y la primera
   sección abierta. Va al final porque cambia de vista y deja el mes analizado:
   las capturas de antes quedan iguales al byte. */
{
  await pg.setViewportSize({ width: 412, height: 760 });
  await pg.evaluate(() => document.getElementById("analizarMes").click());
  await pg.waitForSelector("#zonaMes:not(.oculto)", { timeout: 30000 });
  await pg.waitForTimeout(400);
  await pg.evaluate(() => {
    const z = document.getElementById("zonaMes");
    window.scrollTo(0, z.getBoundingClientRect().top + window.scrollY - 8);
  });
  const sel = await pg.evaluate(() => ["fuente", "cadencia"].map(id => {
    const r = document.getElementById(id).getBoundingClientRect();
    return { id, alto: Math.round(r.height), ancho: Math.round(r.width), x: Math.round(r.left), y: Math.round(r.top) };
  }));
  console.log("mes:           ", JSON.stringify({ selects: sel, ...await espacios(pg, "#zonaMes") }));
  await foto("mes");
console.log("toque, mes:".padEnd(16), JSON.stringify(await toques()));
console.log("títulos, mes:".padEnd(16), JSON.stringify(await pesos()), "(22 px va a 700: [])");
  await pg.evaluate(() => { const d = document.querySelector("#zonaMes details.seccion"); d.open = true; });
  await pg.waitForTimeout(200);
  await pg.evaluate(() => document.querySelector("#zonaMes details.seccion").scrollIntoView());
  await foto("mes-seccion");

  /* EL MES EN LA COMPU (v0.119): resumen a la izquierda en 400 y secciones a
     la derecha con tope de 640. Lo que se mide es lo que pidió el lavado: que
     las columnas de números caigan en el mismo x en todas las tablas de la
     derecha, que ninguna desborde y que el resumen quede fijo al bajar. La
     captura empieza con "ancho", así que la comparación del celu la saltea. */
  await pg.setViewportSize({ width: 1280, height: 900 });
  await pg.evaluate(() => document.querySelectorAll("#zonaMes details.seccion").forEach(d => d.open = true));
  await pg.evaluate(() => window.scrollTo(0, 0));
  await pg.waitForTimeout(200);
  const mesPc = await pg.evaluate(() => {
    const R = e => e.getBoundingClientRect();
    const xs = [...document.querySelectorAll("#zonaMes .mesDer table")]
      .map(t => [...(t.rows[0]?.cells || [])].slice(1).map(c => Math.round(R(c).right)).join("/"));
    const iz = R(document.querySelector(".mesIzq")), de = R(document.querySelector(".mesDer"));
    return { izq: [Math.round(iz.left), Math.round(iz.width)], der: [Math.round(de.left), Math.round(de.width)],
             columnasDistintas: new Set(xs.map(x => x.split("/").slice(-2).join("/"))).size,
             desbordan: [...document.querySelectorAll("#zonaMes .tw")].filter(t => t.scrollWidth > t.clientWidth + 1).length };
  });
  await foto("ancho-mes");
  await pg.evaluate(() => window.scrollTo(0, 900));
  await pg.waitForTimeout(150);
  mesPc.fijoAlBajar = await pg.evaluate(() => Math.round(document.querySelector(".mesIzq").getBoundingClientRect().top));
  console.log("mes en la compu:", JSON.stringify(mesPc));
  /* [PC] EL HOVER SOBRE UN TÍTULO DE SECCIÓN (caso 3 de APRENDIZAJES.md: la
     banda del hover se vio recién en la v0.146 porque el arnés nunca pasaba
     el mouse por ahí). Recorte del título con el puntero encima, y la banda
     medida contra la columna. */
  {
    const sum = pg.locator("#zonaMes .mesDer details.seccion > summary").first();
    await sum.scrollIntoViewIfNeeded();
    await sum.hover();
    await pg.waitForTimeout(250);
    await sum.screenshot({ path: path.join(SALIDA, "ancho-mes-hover.png") });
    console.log("mes, hover:    ", JSON.stringify(await pg.evaluate(() => {
      const s = document.querySelector("#zonaMes .mesDer details.seccion > summary"), cs = getComputedStyle(s);
      const r = s.getBoundingClientRect(), col = document.querySelector(".mesDer").getBoundingClientRect();
      return { fondo: cs.backgroundColor, sobraIzq: Math.round(col.left - r.left), sobraDer: Math.round(r.right - col.right) };
    })), "(la banda no sale de la columna: los dos en ≤ 0)");
    await pg.mouse.move(2, 2);
  }
  const cortesMes = {};
  for (const [w, h] of [[1000, 800], [1280, 900], [386, 760]]) {
    await pg.setViewportSize({ width: w, height: h });
    await pg.waitForTimeout(250);
    cortesMes[w] = await cortados();
    if (w > 900) BORDES["mes " + w] = await bordesDe(["#zonaMes .mesIzq", "#zonaMes .mesDer"]);
  }
  console.log("texto cortado, mes:", JSON.stringify(cortesMes), "(tiene que ser todo [])");
  await pg.setViewportSize({ width: 412, height: 760 });
}

/* EL DEFAULT DE LA EVALUACIÓN SALE DEL ANCHO (v0.86), y se mide con dos cargas
   limpias porque el valor se decide UNA vez, al arrancar. Va al final de todo:
   recarga la página y se lleva puesto el análisis. */
const defaultEval = async w => {
  await pg.setViewportSize({ width: w, height: 800 });
  await pg.evaluate(() => { try { localStorage.removeItem("eval"); } catch (e) { /* incógnito */ } });
  await pg.reload();
  /* "attached" y no "visible": sin una partida abierta la fila de perillas está
     escondida, pero el valor ya está puesto —se decide al arrancar— */
  await pg.waitForSelector("#verEval", { state: "attached" });
  return pg.evaluate(() => document.getElementById("verEval").value);
};
console.log("eval de fábrica:", JSON.stringify(
  { compu: await defaultEval(1280), celu: await defaultEval(412) }));

/* EL INICIO PLEGADO Y CON "cambiar" ABIERTO (v0.138). La última recarga de
   arriba deja la app a 412 con el usuario guardado, o sea plegada: es como
   arranca para Juan. Abrir "cambiar" no tiene que mover la tuerca ni el
   renglón del usuario, el enlace pasa a "cancelar", y cancelar vuelve a
   plegar con el usuario guardado en el campo aunque se haya escrito otro. */
await pg.waitForSelector("#partidas div[data-i]", { timeout: 20000 });
await pg.waitForTimeout(300);
await foto("inicio");
console.log("toque, inicio:".padEnd(16), JSON.stringify(await toques()));
console.log("títulos, inicio:".padEnd(16), JSON.stringify(await pesos()), "(22 px va a 700: [])");
const cab = () => pg.evaluate(() => {
  const r = s => Math.round(document.querySelector(s).getBoundingClientRect().top);
  return { tuerca: r("#btnAjustesInicio"), usuario: r("#yaUsuario"), enlace: document.getElementById("cambiarUsuario").textContent,
           campo: document.querySelector(".cabInicio > .campo").offsetParent ? r(".cabInicio > .campo") : null, valor: document.getElementById("usuario").value };
});
const plegada = await cab();
await pg.click("#cambiarUsuario");
await pg.fill("#usuario", "otro");
await pg.evaluate(() => document.activeElement.blur());
await foto("inicio-cambiar");
const abierta = await cab();
await pg.click("#cambiarUsuario");
console.log("inicio, cambiar:", JSON.stringify({ plegada, abierta, cancelada: await cab() }),
            "(la tuerca y el usuario quietos; cancelar vuelve a plegar con el guardado)");

/* [PC] EL INICIO EN LA COMPU (v0.145): la cabecera vive en la columna del
   mes. La tuerca termina en el borde del select, la lista arranca al ras de
   su techo, y abrir "cambiar" no mueve ni la tuerca ni la lista. */
await pg.setViewportSize({ width: 1280, height: 800 });
await pg.waitForTimeout(200);
const iniPc = () => pg.evaluate(() => {
  const b = s => document.querySelector(s).getBoundingClientRect();
  return { tuercaAlBordeDelMes: Math.round(b("#btnAjustesInicio").right - b("#meses").right),
           listaAlTechoDeLaTuerca: Math.round(b("#partidas").top - b("#btnAjustesInicio").top),
           tuerca: [Math.round(b("#btnAjustesInicio").left), Math.round(b("#btnAjustesInicio").top)] };
});
const iniCerrado = await iniPc();
await pg.click("#cambiarUsuario");
const iniAbierto = await iniPc();
await pg.click("#cambiarUsuario");
console.log("inicio en la compu:", JSON.stringify({ cerrado: iniCerrado, conCambiar: iniAbierto }),
            "(los dos primeros en 0, y la tuerca quieta)");
/* LOS BORDES DEL MES (v0.154): 400 + 32 + 640, como el Mes. A 1280 tienen que
   dar 99–499 y 531–1171, los del Mes en "mes en la compu"; la tarjeta y el
   select cierran en el borde de la columna, y en 1000 no hay desborde. */
const bordes = {};
for (const [w, h] of [[1280, 800], [1500, 900], [1000, 700]]) {
  await pg.setViewportSize({ width: w, height: h });
  await pg.waitForTimeout(150);
  bordes[w] = await pg.evaluate(() => {
    const b = s => { const r = document.querySelector(s).getBoundingClientRect(); return [Math.round(r.left), Math.round(r.right)]; };
    return { mes: b("#meses"), tarjeta: b("#tarjetaMes")[1], lista: b("#partidas"),
             desborde: document.documentElement.scrollWidth > innerWidth };
  });
}
console.log("inicio, bordes:", JSON.stringify(bordes), "(a 1280: 104–504 y 536–1176, corrido por el riel desde la v1.3.3)");
await pg.setViewportSize({ width: 412, height: 760 });

/* LOS BORDES DE LAS TRES PANTALLAS EN LA COMPU, EN UNA LÍNEA (casos 2, 9, 10
   y 13 de APRENDIZAJES.md: lo que vive en dos pantallas se miraba en una, y
   el inicio quedó corrido dos meses sin que nadie comparara). Y con un Mes de
   VARIAS partidas, que es el de verdad: hasta acá la API falsa traía una sola,
   y una fila o una tabla que se rompe con dos no se veía nunca. Va al final y
   con capturas nuevas para no cambiar ni una de las de arriba. */
for (const [w, h] of [[1000, 700], [1280, 800]]) {
  await pg.setViewportSize({ width: w, height: h });
  await pg.waitForTimeout(150);
  BORDES["inicio " + w] = await bordesDe(["#meses", "#partidas"]);
}
{
  const otras = ["ahogado", "mate", "doble", "reloj"].map((cual, i) => {
    const pgn = fs.readFileSync(new URL(`./partida-${cual}.pgn`, import.meta.url), "utf8");
    const res = (pgn.match(/\[Result "([^"]*)"/) || [, "1-0"])[1];
    const g = JSON.parse(JSON.stringify(FALSA.API["/api/mes/2026/10"].games[0]));
    g.url = "https://www.chess.com/game/live/" + (i + 2); g.pgn = pgn; g.end_time += (i + 1) * 3600;
    g.white.result = res === "1-0" ? "win" : res === "0-1" ? "resigned" : "stalemate";
    g.black.result = res === "0-1" ? "win" : res === "1-0" ? "resigned" : "stalemate";
    return g;
  });
  FALSA.API["/api/mes/2026/10"].games.push(...otras);
  await pg.setViewportSize({ width: 1280, height: 800 });
  await pg.reload();
  await pg.waitForSelector("#partidas div[data-i]", { timeout: 20000 });
  await pg.waitForTimeout(300);
  const filas = await pg.locator("#partidas div[data-i]").count();
  await foto("ancho-inicio-varias");
  await pg.evaluate(() => document.getElementById("analizarMes").click());
  await pg.waitForSelector("#zonaMes:not(.oculto)", { timeout: 90000 });
  /* el mes analiza las que no están en la caché: se espera a que termine */
  await pg.waitForFunction(() => document.getElementById("barra").classList.contains("oculto"), null, { timeout: 120000 });
  await pg.waitForTimeout(500);
  await pg.evaluate(() => document.querySelectorAll("#zonaMes details.seccion").forEach(d => d.open = true));
  await foto("ancho-mes-varias");
  const varias = await pg.evaluate(() => ({
    desbordan: [...document.querySelectorAll("#zonaMes .tw")].filter(t => t.scrollWidth > t.clientWidth + 1).length,
    desborde: document.documentElement.scrollWidth > innerWidth }));
  const cortes = await cortados();
  await pg.setViewportSize({ width: 412, height: 760 });
  await pg.waitForTimeout(250);
  await foto("mes-varias");
  console.log("mes de varias: ", JSON.stringify({ filas, ...varias, cortados: cortes,
              cortados386: (await pg.setViewportSize({ width: 386, height: 760 }), await pg.waitForTimeout(200), await cortados()) }),
              "(filas = 5; nada desborda ni se corta)");
}
/* POSICIONES (prevención de la v1.1, causas A, C y F de APRENDIZAJES.md).
   Se armó mirada con cero a dos jugadas y `mirar` no pasaba por ahí: los
   botones de 36 y los que se corrían al crecer la lista los vio el revisor
   de casualidad. Se abre el link (`#fen=` con el arranque de la partida de
   prueba), se juegan las blancas tocando el tablero y el falso contesta las
   negras (`falso.mjs`, "la partida como rival"). Con `mirar mate` y
   `mirar ahogado` la partida entera llega al final: la pantalla del
   resultado. Va al final para no cambiar ninguna captura de arriba. */
{
  await pg.setViewportSize({ width: 412, height: 760 });
  await pg.evaluate(f => { location.hash = "fen=" + encodeURIComponent(f) + "&color=w"; }, fens[0]);
  await pg.waitForSelector("#zonaPosicion:not(.oculto)", { timeout: 10000 });
  await pg.waitForTimeout(300);
  const caja = sel => pg.evaluate(s => { const r = document.querySelector(s).getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y + scrollY) }; }, sel);
  /* la fila y el tablero no se mueven en toda la partida, ni al terminar
     (revisor de UX, v1.2: en una variante el final tapaba Deshacer) */
  const antes = await caja("#posDeshacer"), tab0 = await caja("#posTablero");
  await foto("posicion");
  const t0 = await toques();
  const { ucis } = FALSA;
  let jugadas = 0;
  for (let k = 0; k < ucis.length; k += 2) {
    const u = ucis[k];
    await pg.click(`#posTablero [data-sq="${u.slice(0, 2)}"]`);
    await pg.click(`#posTablero [data-sq="${u.slice(2, 4)}"]`);
    jugadas = k + 1;
    if (k + 1 < ucis.length) {
      /* espera la respuesta del falso (demora 400 ms): vuelve a tocarle a Juan */
      await pg.waitForFunction(() => !document.getElementById("posEstado").textContent.startsWith("Piensa"), null, { timeout: 5000 });
      jugadas = k + 2;
    }
  }
  await pg.waitForTimeout(300);
  const despues = await caja("#posDeshacer"), tab1 = await caja("#posTablero");
  await foto("posicion-jugadas");
  const est = await pg.evaluate(() => ({ estado: document.getElementById("posEstado").textContent,
    lista: document.getElementById("posJugadas").textContent.slice(-60) }));
  console.log("posiciones:    ", JSON.stringify({ jugadas, ...est,
    deshacerSeMovio: { x: despues.x - antes.x, y: despues.y - antes.y }, tableroSeMovio: tab1.y - tab0.y }),
    "(deshacerSeMovio 0 y 0, tableroSeMovio 0)");
  if (despues.x !== antes.x || despues.y !== antes.y || tab1.y !== tab0.y)
    console.log("OJO: Deshacer o el tablero se movieron al crecer o terminar la partida");
  const t1 = await toques();
  console.log("toque, posición:", JSON.stringify({ vacia: t0, jugada: t1 }));
  /* y lo dice con OJO (revisor de UX, v1.6: el "+" salió 34×34 en este
     renglón y nadie lo frenó; causa C) */
  if (t0.chicos.length || t1.chicos.length || t0.pegados.length || t1.pegados.length)
    console.log("OJO: Posiciones con botones de toque chico o pegados");
  /* EL FINAL, que la partida de prueba no alcanza (y `mirar mate` se cae
     antes de llegar acá, en la pasada de la compu): un mate en una y un
     ahogado en una, jugados por Juan. Deshacer y el tablero, en el mismo
     lugar que con la partida a medias. */
  for (const [nom, fen, u] of [["mate", "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4", "h5f7"],
                               ["tablas", "7k/8/6K1/8/8/8/8/5Q2 w - - 0 1", "f1f7"]]) {
    await pg.evaluate(f => { location.hash = "fen=" + encodeURIComponent(f) + "&color=w"; }, fen);
    await pg.waitForTimeout(300);
    await pg.click(`#posTablero [data-sq="${u.slice(0, 2)}"]`);
    await pg.click(`#posTablero [data-sq="${u.slice(2, 4)}"]`);
    await pg.waitForTimeout(300);
    const d = await caja("#posDeshacer"), t = await caja("#posTablero");
    await foto("posicion-" + nom);
    console.log(("final, " + nom + ":").padEnd(16), JSON.stringify({
      ...await pg.evaluate(() => ({ barra: document.getElementById("posEstado").textContent,
        tarjeta: document.getElementById("posFin").innerText.replace(/\n+/g, " | "),
        alto: document.documentElement.scrollHeight })),
      deshacerSeMovio: d.y - antes.y, tableroSeMovio: t.y - tab0.y }));
    if (d.y !== antes.y || t.y !== tab0.y) console.log("OJO: el final movió Deshacer o el tablero");
    console.log(("títulos, " + nom + ":").padEnd(16), JSON.stringify(await pesos()), "(22 px va a 700: [])");
  }
  /* LA POSICIÓN QUE LLEGA YA TERMINADA (revisor, v1.2): sin jugadas de
     Juan, "Otra vez" no tiene a qué volver y no tiene que verse */
  await pg.evaluate(f => { location.hash = "fen=" + encodeURIComponent(f) + "&color=w"; },
    "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3");
  await pg.waitForTimeout(300);
  const yaTerminada = await pg.evaluate(() => ({ tarjeta: !document.getElementById("posFin").classList.contains("oculto"),
    otraVez: !!document.getElementById("posOtraVez").getClientRects().length,
    deshacer: !document.getElementById("posDeshacer").disabled }));
  console.log("llega terminada:", JSON.stringify(yaTerminada), "(tarjeta sí, otraVez y deshacer no)");
  if (yaTerminada.otraVez && !yaTerminada.deshacer) console.log("OJO: Otra vez a la vista sin nada que deshacer");
  await pg.click("#btnPosAjustes");
  await pg.waitForTimeout(250);
  await foto("posicion-hoja");
  /* LA HOJA SOBRE EL TABLERO a los altos de verdad (revisor, v1.2): con la
     barra de Chrome visible el celu de Juan mide ~745, y a 760 no se veía
     que la hoja quedaba a 3 px del tablero */
  {
    const aire = {};
    for (const [w, h] of [[412, 745], [386, 745], [412, 760]]) {
      await pg.setViewportSize({ width: w, height: h });
      await pg.waitForTimeout(150);
      aire[w + "x" + h] = await pg.evaluate(() => Math.round(document.getElementById("hojaPos").getBoundingClientRect().top -
        document.querySelector("#posTablero svg").getBoundingClientRect().bottom));
    }
    await pg.setViewportSize({ width: 412, height: 760 });
    console.log("hoja sobre tablero:", JSON.stringify(aire), "(aire ≥ 8)");
    if (Object.values(aire).some(a => a < 8)) console.log("OJO: la hoja de Posiciones tapa o pega al tablero");
  }
  console.log("toque, hoja pos.:", JSON.stringify(await toques()));
  await pg.keyboard.press("Escape");
  await pg.waitForTimeout(150);
  /* NUEVA PARTIDA (v1.6): la otra hoja, la del "+", con sus tres botones;
     tampoco tapa ni pega al tablero a 745 */
  await pg.click("#btnPosNueva"); await pg.waitForTimeout(250);
  await foto("posicion-nueva");
  const nueva = { toque: await toques() };
  await pg.setViewportSize({ width: 386, height: 745 }); await pg.waitForTimeout(150);
  nueva.aire745 = await pg.evaluate(() => Math.round(document.getElementById("hojaNueva").getBoundingClientRect().top -
    document.querySelector("#posTablero svg").getBoundingClientRect().bottom));
  await pg.setViewportSize({ width: 412, height: 760 }); await pg.waitForTimeout(150);
  console.log("nueva partida:", JSON.stringify(nueva), "(toque sin chicos fuera de Listo; aire745 ≥ 8)");
  if (nueva.aire745 < 8) console.log("OJO: la hoja de Nueva partida tapa o pega al tablero");
  await pg.keyboard.press("Escape"); await pg.waitForTimeout(150);
  await pg.setViewportSize({ width: 386, height: 760 });
  await pg.waitForTimeout(200);
  console.log("posición a 386:", JSON.stringify({ desborde: await pg.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    cortados: await cortados() }), "(nada desborda ni se corta)");
  await pg.setViewportSize({ width: 1280, height: 800 });
  await pg.waitForTimeout(250);
  await foto("ancho-posicion");
  /* [PC] con la tarjeta del final, que es lo más alto que llega a medir */
  await pg.evaluate(f => { location.hash = "fen=" + encodeURIComponent(f) + "&color=w"; },
    "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4");
  await pg.waitForTimeout(300);
  await pg.click(`#posTablero [data-sq="h5"]`); await pg.click(`#posTablero [data-sq="f7"]`);
  await pg.waitForTimeout(300);
  await foto("ancho-posicion-final");
  const sobra = await pg.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  /* DESDE LA v1.6.1 el tablero toma el alto y las hojas son menús en la
     columna: se mide que ninguno pise el tablero, el tablero que crece
     (lado a 1280 × 800) y el margen derecho a 1000 (≥ 24) */
  const lado = await pg.evaluate(() => Math.round(document.querySelector("#posTablero svg").getBoundingClientRect().width));
  const pisa = {};
  for (const [b, hj] of [["btnPosAjustes", "hojaPos"], ["btnPosNueva", "hojaNueva"]]) {
    await pg.click("#" + b); await pg.waitForTimeout(200);
    if (b === "btnPosNueva") await foto("ancho-posicion-menu");
    pisa[hj] = await pg.evaluate(h => Math.round(document.querySelector("#posTablero svg").getBoundingClientRect().right -
      document.getElementById(h).getBoundingClientRect().left), hj);
    await pg.keyboard.press("Escape"); await pg.waitForTimeout(150);
  }
  await pg.setViewportSize({ width: 1000, height: 800 }); await pg.waitForTimeout(200);
  const margenDer1000 = await pg.evaluate(() => Math.round(innerWidth - document.getElementById("btnPosAjustes").getBoundingClientRect().right));
  /* la cabecera de la columna al ras de la casilla a8 (revisor, v1.6.1: el
     margen no se aplicaba y nadie lo medía; causa B) */
  const alineaCab = await pg.evaluate(() => Math.round(document.getElementById("btnPosAjustes").getBoundingClientRect().top -
    document.querySelector('#posTablero [data-sq="a8"]').getBoundingClientRect().top));
  /* y un menú abierto se cierra si cambia la ventana: no sigue a la columna */
  await pg.click("#btnPosNueva"); await pg.waitForTimeout(150);
  await pg.setViewportSize({ width: 1100, height: 800 }); await pg.waitForTimeout(250);
  const menuTrasResize = await pg.evaluate(() => !document.getElementById("hojaNueva").classList.contains("oculto"));
  const sobra1000 = await pg.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  await pg.setViewportSize({ width: 1280, height: 800 }); await pg.waitForTimeout(200);
  /* ← deshace (v1.2.1): la tarjeta del final se va */
  await pg.mouse.move(2, 2); await pg.keyboard.press("ArrowLeft"); await pg.waitForTimeout(200);
  const deshizo = await pg.evaluate(() => document.getElementById("posFin").classList.contains("oculto"));
  console.log("posición en la compu:", JSON.stringify({ sobra, sobra1000, lado, pisa, margenDer1000, alineaCab, menuTrasResize, flechaDeshace: deshizo }),
    "(sobra ≤ 0, lado ≥ 700, pisa < 0, margenDer1000 ≥ 24, |alineaCab| ≤ 2, menuTrasResize false, flechaDeshace true)");
  if (sobra > 0 || sobra1000 > 0 || lado < 700 || Object.values(pisa).some(x => x >= 0) || margenDer1000 < 24 ||
      Math.abs(alineaCab) > 2 || menuTrasResize || !deshizo)
    console.log("OJO: Posiciones en la compu");
}
/* ARMAR UNA POSICIÓN (v1.4): se entra por la hoja, se vacía y se arma un
   final con el rey negro en jaque y mueven blancas, que es lo que más
   escribe el subtítulo. Entra sin scroll a 386 × 745 y en la compu; la
   paleta, a la altura de la primera fila de casillas en la compu; "Jugar"
   apagado con el problema y prendido sin él. */
{
  await pg.setViewportSize({ width: 412, height: 760 }); await pg.waitForTimeout(150);
  await pg.click("#btnPosNueva"); await pg.click("#posArmar"); await pg.waitForTimeout(250);
  await pg.click("#armVaciar");
  const poner = async (pz, sq) => { await pg.click(`#armPaleta [data-pz="${pz}"]`); await pg.click(`#armTablero [data-sq="${sq}"]`); };
  await poner("wk", "e1"); await poner("bk", "d8"); await poner("wr", "d1"); await poner("bp", "c7");
  const armar = { apagado: await pg.evaluate(() => document.getElementById("armJugar").disabled),
                  dice: await pg.evaluate(() => document.getElementById("armEstado").textContent) };
  await foto("armar");
  armar.toque = await toques();
  /* y a 386, donde las piezas miden 44 (revisor de UX, v1.4; causa A) */
  await pg.setViewportSize({ width: 386, height: 745 }); await pg.waitForTimeout(150);
  armar.toque386 = await toques();
  await pg.setViewportSize({ width: 412, height: 760 }); await pg.waitForTimeout(150);
  /* LO ELEGIDO NO SE PARECE AL FOCO (revisor de UX, v1.4: la pieza elegida
     llevaba el mismo anillo que el foco de teclado; causa D). Una pieza
     elegida y otra con foco: el contorno y el fondo no pueden coincidir */
  await pg.click('#armPaleta [data-pz="bn"]');
  armar.elegidaNoEsFoco = await pg.evaluate(() => {
    const e = document.querySelector('#armPaleta [data-pz="bn"]'), f = document.querySelector('#armPaleta [data-pz="wq"]');
    f.focus({ focusVisible: true });
    const a = getComputedStyle(e), b = getComputedStyle(f);
    const r = [a.outlineStyle + a.outlineColor + a.backgroundColor, b.outlineStyle + b.outlineColor + b.backgroundColor];
    f.blur();
    return r[0] !== r[1];
  });
  await pg.click('#armPaleta [data-pz="bn"]');
  /* PIEZAS QUE NO SE LEEN SOBRE SU FONDO (revisor de UX, v1.4: la negra de
     Cburnett sobre --elevada da 1,6:1). El relleno de cada <use> negro
     contra el fondo del botón que la lleva, ≥ 3:1 */
  armar.contraste = await pg.evaluate(() => {
    const lum = c => { const m = c.match(/[\d.]+/g).slice(0, 3).map(x => +x / 255)
      .map(v => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return .2126 * m[0] + .7152 * m[1] + .0722 * m[2]; };
    let peor = 99;
    for (const b of document.querySelectorAll('#armPaleta [data-pz^="b"]')) {
      const fondo = lum(getComputedStyle(b).backgroundColor), negro = lum("rgb(0,0,0)");
      peor = Math.min(peor, (Math.max(fondo, negro) + .05) / (Math.min(fondo, negro) + .05));
    }
    return Math.round(peor * 10) / 10;
  });
  const entra = {};
  /* cada corte con sus dos lados y un punto en el medio del tramo
     (revisor de UX, v1.4: de 768 a 990 la columna se salía de la pantalla
     y se miraba 999; causas A y C) */
  for (const [w, h] of [[386, 745], [412, 760], [700, 800], [850, 800], [999, 800], [1000, 1000], [1140, 800],
                        [1000, 800], [1280, 800], [1280, 1000]]) {
    await pg.setViewportSize({ width: w, height: h }); await pg.waitForTimeout(150);
    entra[w + "x" + h] = await pg.evaluate(() => {
      const sobra = document.documentElement.scrollHeight - innerHeight, ancho = document.documentElement.scrollWidth > innerWidth;
      const tab = document.querySelector("#armTablero svg").getBoundingClientRect();
      const pal = document.getElementById("armPaleta").getBoundingClientRect();
      /* la primera fila de casillas arranca 15/366 adentro del SVG */
      const alLado = pal.left > tab.right ? Math.round(pal.top - (tab.top + tab.height * 15 / 366)) : null;
      /* el margen derecho del último control, no solo el scrollWidth */
      const der = Math.round(innerWidth - Math.max(...[...document.querySelectorAll("#zonaArmar button")].map(b => b.getBoundingClientRect().right)));
      return { sobra, ancho, alLado, der };
    });
    if (w === 1280) await foto("ancho-armar");
  }
  armar.entra = entra;
  await pg.setViewportSize({ width: 412, height: 760 }); await pg.waitForTimeout(150);
  await pg.click('#armPaleta [data-pz="goma"]'); await pg.click('#armTablero [data-sq="d1"]');
  armar.prende = await pg.evaluate(() => !document.getElementById("armJugar").disabled);
  await pg.keyboard.press("Escape"); await pg.waitForTimeout(200);
  armar.escVuelve = await pg.evaluate(() => document.body.classList.contains("enPosicion"));
  console.log("armar:", JSON.stringify(armar),
    "(apagado, prende, elegidaNoEsFoco y escVuelve true; contraste ≥ 3; toques sin chicos ni pegados; sobra ≤ 0, sin ancho, der ≥ 14 y alLado 0 en la compu)");
  /* un número del resumen que no está en el OJO no está aprobado (revisor,
     v1.4: "chicos" se imprimía y no frenaba; causa C) */
  if (!armar.apagado || !armar.prende || armar.contraste < 3 || !armar.escVuelve || !armar.elegidaNoEsFoco ||
      Object.values(entra).some(e => e.sobra > 0 || e.ancho || e.der < 14 || (e.alLado !== null && Math.abs(e.alLado) > 1)) ||
      armar.toque.pegados.length || armar.toque.chicos.length ||
      armar.toque386.pegados.length || armar.toque386.chicos.length) console.log("OJO: Armar posición");
}
/* LA BARRA DE LOS MÓDULOS CON UN MES LARGO (prevención de la v1.3, causas A
   y C: las variantes se dibujaron con un mes de una partida, que no
   scrollea). Se clona la fila hasta 40 y, al fondo, con la barra a la vista,
   entre la última fila (y la versión) y la barra tiene que haber 8 o más. */
{
  await pg.setViewportSize({ width: 412, height: 760 });
  await pg.click("#navAnalisis"); await pg.waitForTimeout(400);
  await pg.evaluate(() => { const l = document.getElementById("partidas"), f = l.querySelector("div[data-i]");
    for (let k = l.children.length; k < 40; k++) l.append(f.cloneNode(true)); });
  const barra = {};
  for (const [w, h] of [[412, 760], [386, 745]]) {
    await pg.setViewportSize({ width: w, height: h }); await pg.waitForTimeout(150);
    await pg.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await pg.waitForTimeout(150);
    barra[w] = await pg.evaluate(() => {
      const fs = document.querySelectorAll("#partidas div[data-i]"), n = document.getElementById("navMod");
      const tope = innerHeight - n.offsetHeight;
      return { fila: Math.round(tope - fs[fs.length - 1].getBoundingClientRect().bottom),
               version: Math.round(tope - document.getElementById("verPie").getBoundingClientRect().bottom),
               escondida: n.style.transform };
    });
  }
  /* el título de una pantalla sin "‹" al ras de lo de abajo (revisor, v1.3:
     el margen que era para el "‹" quedó; causa G). Por Range, a 412 y 1280 */
  /* al fondo la barra está escondida: el toque va por código */
  await pg.evaluate(() => document.getElementById("navPosiciones").click()); await pg.waitForTimeout(400);
  const ras = async () => pg.evaluate(() => { const t = document.querySelector("#zonaPosicion .cabTit .rival").firstChild;
    const rg = document.createRange(); rg.selectNodeContents(t);
    return Math.round(rg.getBoundingClientRect().left - document.getElementById("posDeshacer").getBoundingClientRect().left); });
  barra.tituloAlRas = await ras();
  await pg.setViewportSize({ width: 1280, height: 800 }); await pg.waitForTimeout(150);
  barra.tituloAlRas1280 = await ras();
  if (barra.tituloAlRas || barra.tituloAlRas1280) console.log("OJO: el título de Posiciones no está al ras de Deshacer");
  await pg.evaluate(() => document.getElementById("navAnalisis").click()); await pg.waitForTimeout(300);
  /* [PC] desde 1000, con mouse, es un riel vertical a la izquierda (v1.3.1) */
  await pg.setViewportSize({ width: 1000, height: 800 }); await pg.waitForTimeout(150);
  const riel = await pg.evaluate(() => { const r = document.getElementById("navMod").getBoundingClientRect();
    return { ancho: Math.round(r.width), alto: Math.round(r.height), izq: Math.round(r.left) }; });
  barra.riel1000 = riel;
  if (!(riel.alto > riel.ancho && riel.izq === 0)) console.log("OJO: a 1000 la barra de los módulos no es un riel a la izquierda");
  await pg.setViewportSize({ width: 412, height: 760 }); await pg.waitForTimeout(150);
  /* en la Partida no está */
  const enPartida = await pg.evaluate(() => { document.querySelector("#partidas div[data-i]").click();
    return new Promise(r => setTimeout(() => r(getComputedStyle(document.getElementById("navMod")).display), 600)); });
  /* [PC] la Partida no tiene riel ni se corre (v1.3.3; en la v1.3.1 se
     corría sin riel a la vista, causas F y C, y con el riel no entraba): a
     1000, 1110 y 1270 el riel no está y el "‹" sigue donde estaba */
  barra.rielPartida = {};
  for (const w of [1000, 1110, 1270]) {
    await pg.setViewportSize({ width: w, height: 800 }); await pg.waitForTimeout(150);
    barra.rielPartida[w] = await pg.evaluate(() => getComputedStyle(document.getElementById("navMod")).display === "none" ?
      Math.round(document.getElementById("volverDeLaPartida").getBoundingClientRect().left) : "riel");
  }
  if (Object.values(barra.rielPartida).some(a => a === "riel" || a < 0)) console.log("OJO: en la Partida de la compu aparece el riel o el ‹ se cortó");
  await pg.setViewportSize({ width: 412, height: 760 }); await pg.waitForTimeout(150);
  console.log("barra de módulos:", JSON.stringify({ ...barra, enPartida }),
    "(fila y version ≥ 8 con la barra a la vista; escondida al fondo; en la Partida none)");
  if (Object.values(barra).some(b => b.fila < 8 || b.version < 8) || enPartida !== "none")
    console.log("OJO: la barra de los módulos tapa o pega lo último del inicio, o aparece en la Partida");
}
/* LO JUGADO EN POSICIONES, ANALIZADO (v1.5; prevención del revisor de UX,
   causas A y C): las comidas de la compu se contaban contra el juego
   completo y K+P contra K "había comido" todo, y el arnés no llevaba esta
   Partida a la compu. Un final sin capturas: arriba y abajo, cero piezas.
   Va al final para no cambiar ninguna captura de arriba. */
{
  await pg.setViewportSize({ width: 412, height: 760 }); await pg.waitForTimeout(150);
  await pg.evaluate(() => { location.hash = "fen=4k3/8/8/8/8/8/4P3/4K3_w_-_-_0_23&color=w"; });
  await pg.waitForSelector("#zonaPosicion:not(.oculto)", { timeout: 10000 });
  await pg.waitForTimeout(300);
  await pg.click(`#posTablero [data-sq="e2"]`); await pg.click(`#posTablero [data-sq="e4"]`);
  await pg.waitForTimeout(300);
  await pg.click("#posAnalizar");
  await pg.waitForSelector("#zonaRevision:not(.oculto)", { timeout: 30000 });
  await pg.waitForFunction(() => !document.getElementById("revEstado").textContent, null, { timeout: 30000 });
  await pg.setViewportSize({ width: 1280, height: 800 }); await pg.waitForTimeout(300);
  const desdePos = await pg.evaluate(() => ({
    comidas: ["cArriba", "cAbajo"].map(id => document.querySelectorAll(`#${id} use`).length),
    volver: document.getElementById("volverDeLaPartida").title,
    tira: document.getElementById("tiraSc").textContent.replace(/\s+/g, " ").trim().slice(0, 40) }));
  console.log("partida desde una posición:", JSON.stringify(desdePos), "(comidas 0 y 0; volver a la posición; tira desde 23.)");
  if (desdePos.comidas.some(n => n > 0) || !/posición/.test(desdePos.volver)) console.log("OJO: la Partida desde una posición");
  await pg.setViewportSize({ width: 412, height: 760 }); await pg.waitForTimeout(150);
}
/* MONITORES DE VERDAD (27-nov-2026; Juan: "es una app de celu adaptada a
   PC"). Hasta acá la compu se miraba solo a 1280×800, y ahí no se veía que a
   1920×1080 la página quedaba topada en 1110 con 800 vacíos, ni que a
   1366×768 —la notebook más común— la Partida no entraba. Las cuatro
   pantallas a los dos tamaños, A ESCALA CSS (un monitor a 100 % es 1x: así
   las ve quien las usa, y la de 1920 a 2x serían ~11.000 tokens si se mira).
   Empiezan con `ancho-` para que la comparación byte a byte del celu las
   saltee. Va al final para no cambiar ninguna captura de arriba.
   `sobra` es lo que hay que bajar para ver la pantalla entera (0 = entra), y
   `tablero`, su lado.
   LO QUE HACE QUE SE SIENTA DE CELU, MEDIDO (prevención del mismo día: la
   causa fue C —el arnés no tenía el caso— y D —"PC aprovechada" no decía
   qué era aprovechar—; DISENO.md §1.12). Cuatro OJO que valen para toda
   pantalla de compu, presente o futura:
   - `usa`: el ancho que ocupa lo dibujado de la pantalla, sin las barras de
     ancho entero (que lo ensuciaban). A 1920, menos de 3/4 es una columna
     de celu centrada (salvo el Mes, que es texto, y donde el tablero ya
     toma el alto).
   - el tablero, donde es lo principal, toma el alto: menos que el alto de la
     ventana menos 130 (cabecera, coordenadas y comidas) es tablero chico.
   - lo que se abre no sube desde abajo como una hoja de celu (`hoja`).
   - los botones de pasar jugadas no son de dedo: con mouse, 44 de alto o
     más es un área de toque que en la compu no hace falta (`ant`).
   SEGUNDA VUELTA, EL MISMO DÍA (Juan: "Posiciones se sigue sintiendo como
   una adaptación del celu", y el arnés la daba por buena; causa D otra vez:
   las cuatro medidas eran los síntomas de la Partida, no el criterio). Cuatro
   más, en TODA pantalla de compu y no en un botón con nombre:
   - `dedo`: cualquier botón de 44 de alto o más, salvo el riel y los campos.
   - `icono`: botones con solo un ícono que no es universal (tuerca, girar,
     volver, cerrar, flechas): con lugar al costado, el botón dice qué hace.
   - `listo`: un botón "Listo" a la vista, que es el cierre de una hoja.
   - `columna`: qué parte del alto del tablero ocupa lo que está a su lado;
     menos de la mitad es una columna con cuatro cosas arriba y el resto
     vacío, en vez de un panel a la altura del tablero.
   Y el recorrido suma el menú de Nueva partida y Armar, que no estaban. */
{
  const MONITORES = [[1366, 768], [1920, 1080]];
  const fotoM = async n => {
    /* sin el foco que dejó el último clic (el anillo salía en la tuerca) */
    await pg.evaluate(() => document.activeElement && document.activeElement.blur());
    await pg.mouse.move(2, 2); await pg.waitForTimeout(300);
    await pg.screenshot({ path: path.join(SALIDA, n + SUFIJO + ".png"), scale: "css" });
  };
  const medidaM = (tab, zona) => pg.evaluate(([t, z]) => {
    const tab = t && document.querySelector(t);
    const rs = [...document.querySelectorAll(z)].flatMap(e => [...e.querySelectorAll("*")])
      .filter(e => e.offsetParent !== null && getComputedStyle(e).position !== "fixed")
      .map(e => e.getBoundingClientRect())
      .filter(r => r.width > 0 && r.height > 0 && r.width < innerWidth * .95 && r.right > 0);
    const usa = rs.length ? Math.max(...rs.map(r => r.right)) - Math.min(...rs.map(r => r.left)) : 0;
    const vis = e => { const r = e.getBoundingClientRect();
      return e.offsetParent !== null && r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight &&
        getComputedStyle(e).visibility !== "hidden"; };
    const nombre = e => e.id || (e.getAttribute("aria-label") || e.textContent).trim().slice(0, 18);
    const bots = [...document.querySelectorAll("button")].filter(vis)
      .filter(e => !e.closest("#navMod, svg, [data-sq], #armPaleta"));
    const dedo = bots.filter(e => e.getBoundingClientRect().height >= 43.5)
      .map(e => `${nombre(e)} ${Math.round(e.getBoundingClientRect().height)}`);
    const UNIVERSAL = /ajustes|girar|volver|cerrar|anterior|siguiente|borrar|goma/i;
    const icono = bots.filter(e => !e.textContent.trim() && e.querySelector("svg") &&
      !UNIVERSAL.test((e.getAttribute("aria-label") || "") + " " + (e.title || ""))).map(nombre);
    /* un menú de compu se cierra eligiendo, con Esc o tocando afuera: un
       "Listo" adentro es el cierre de una hoja de celu */
    const listo = bots.filter(e => /^listo$/i.test(e.textContent.trim())).map(nombre);
    let columna = null;
    if (tab) {
      const b = tab.getBoundingClientRect();
      const lado = [...document.querySelectorAll("body *")].filter(vis)
        .filter(e => getComputedStyle(e).position !== "fixed" && !e.closest("#navMod"))
        .map(e => e.getBoundingClientRect())
        .filter(r => r.left >= b.right && r.top < b.bottom && r.bottom > b.top && r.width < innerWidth * .95);
      columna = lado.length ? +((Math.min(b.bottom, Math.max(...lado.map(r => r.bottom))) -
        Math.max(b.top, Math.min(...lado.map(r => r.top)))) / b.height).toFixed(2) : 0;
    }
    /* lo que hay que bajar para ver LA ZONA entera, no el pie de la página
       con la versión (v1.7: §1.12 pide que entre lo principal; el pie está
       debajo en todas las pantallas) */
    /* sin lo que queda adentro de algo con scroll propio (las filas de la
       planilla que siguen abajo no son página) */
    const zs = [...document.querySelectorAll(z)];
    const recortado = e => { for (let p = e.parentElement; p && !zs.includes(p); p = p.parentElement)
      if (getComputedStyle(p).overflowY !== "visible") return true; return false; };
    const rf = [...zs].flatMap(e => [...e.querySelectorAll("*")])
      .filter(e => e.offsetParent !== null && getComputedStyle(e).position !== "fixed" && !recortado(e))
      .map(e => e.getBoundingClientRect()).filter(r => r.width > 0 && r.height > 0);
    const fondo = rf.length ? Math.max(...rf.map(r => r.bottom)) + scrollY : 0;
    return { sobra: Math.max(0, Math.round(fondo - innerHeight)),
             tablero: tab ? Math.round(tab.getBoundingClientRect().width) : null,
             usa: Math.round(usa), dedo, icono, columna, listo };
  }, [tab, zona]);
  const MON = {};
  /* `antes` corre después de cada cambio de tamaño: un menú abierto se
     cierra al cambiar la ventana (a propósito, v1.6.1), así que se abre de
     nuevo en cada monitor */
  /* CADA ESTADO DE LO QUE CONMUTA, en toda pantalla (v1.7, revisor de UX
     sobre las pestañas Jugadas | Resumen de la Partida: en la maqueta los
     "‹ ›" desaparecían en la otra pestaña y la tabla quedaba cortada sin
     aviso; causa A, un solo estado mirado). Contra la causa: cualquier
     `[role=tab]` a la vista en la zona —hoy la Partida, mañana Posiciones,
     Ajustes o lo que venga— se toca uno por uno, con su foto y su medida, y
     salta OJO si un botón de fuera del contenido conmutado deja de verse, o
     si algo con scroll propio queda cortado sin fundido. */
  const visibles = zona => pg.evaluate(z => {
    const paneles = [...document.querySelectorAll("[role=tab][aria-controls]")]
      .map(t => document.getElementById(t.getAttribute("aria-controls"))).filter(Boolean);
    return [...document.querySelectorAll(z)].flatMap(e => [...e.querySelectorAll("button[id]")])
      .filter(e => { const r = e.getBoundingClientRect();
        return e.offsetParent !== null && r.width > 0 && r.bottom > 0 && r.top < innerHeight &&
          !paneles.some(p => p.contains(e)); })
      .map(e => e.id);
  }, zona);
  /* algo con scroll propio que no entra tiene que decirlo: fundido (un
     degradé en ::after) o la barra a la vista */
  const cortados = zona => pg.evaluate(z => [...document.querySelectorAll(z)]
    .flatMap(e => [...e.querySelectorAll("*")])
    .filter(e => { const c = getComputedStyle(e);
      return e.offsetParent !== null && /auto|scroll/.test(c.overflowY) && e.clientHeight > 40 &&
        e.scrollHeight > e.clientHeight + 1 && e.scrollTop + e.clientHeight < e.scrollHeight - 1 &&
        !/gradient/.test(getComputedStyle(e, "::after").backgroundImage) &&
        e.offsetWidth - e.clientWidth < 2; })
    .map(e => e.id || e.className.toString().split(" ")[0]), zona);
  /* LO ELEGIDO, A LA VISTA EN TODA LISTA CON SCROLL (v1.7, revisor de UX:
     a 1366 la planilla mostraba de la 3 a la 8 parada en la 15, porque el
     scroll se calculó con otro alto). Contra la causa: en cualquier pantalla
     y estado, todo `.sel`, `[aria-selected=true]` o `[aria-current]` adentro
     de algo con scroll propio tiene que caer en su caja visible, descontado
     el fundido. */
  const fueraDeVista = zona => pg.evaluate(z => [...document.querySelectorAll(z)]
    .flatMap(e => [...e.querySelectorAll(".sel, [aria-selected=true], [aria-current]:not([aria-current=false])")])
    .filter(e => e.offsetParent !== null && !e.matches("[role=tab]"))
    .flatMap(e => { for (let p = e.parentElement; p; p = p.parentElement) {
        const c = getComputedStyle(p);
        if (/auto|scroll/.test(c.overflowY) && p.scrollHeight > p.clientHeight + 1) {
          const r = e.getBoundingClientRect(), q = p.getBoundingClientRect();
          const f = parseFloat(getComputedStyle(p, "::after").height) || 0;
          return r.top < q.top - 1 || r.bottom > q.bottom - f + 1 ? [p.id || p.className.toString().split(" ")[0]] : [];
        } }
      return []; }), zona);
  const cadaMonitor = async (nombre, tab, zona, extra, antes) => {
    for (const [w, h] of MONITORES) {
      await pg.setViewportSize({ width: w, height: h }); await pg.waitForTimeout(400);
      await pg.evaluate(() => scrollTo(0, 0));
      if (antes) await antes();
      await fotoM(`ancho-${w}-${nombre}`);
      MON[`${nombre} ${w}`] = await medidaM(tab, zona);
      MON[`${nombre} ${w}`].cortado = await cortados(zona);
      MON[`${nombre} ${w}`].fuera = await fueraDeVista(zona);
      const tabs = await pg.evaluate(z => [...document.querySelectorAll(z)]
        .flatMap(e => [...e.querySelectorAll("[role=tab]")])
        .filter(t => t.offsetParent !== null).map(t => [t.id, t.getAttribute("aria-selected") === "true"]), zona);
      if (tabs.length) {
        const base = await visibles(zona);
        for (const [id] of tabs.filter(([, sel]) => !sel)) {
          await pg.click("#" + id); await pg.waitForTimeout(300);
          await fotoM(`ancho-${w}-${nombre}-${id}`);
          const m = await medidaM(tab, zona);
          m.cortado = await cortados(zona);
          m.fuera = await fueraDeVista(zona);
          const ahora = await visibles(zona);
          m.pierde = base.filter(b => !ahora.includes(b));
          MON[`${nombre}-${id} ${w}`] = m;
        }
        /* y la vuelta: con la otra pestaña puesta se pasan jugadas (ida y
           vuelta, así la jugada queda la misma) y se vuelve; lo que se
           repintó escondido tiene que quedar bien al mostrarse */
        for (const k of ["ArrowRight", "ArrowRight", "ArrowLeft", "ArrowLeft"]) { await pg.keyboard.press(k); await pg.waitForTimeout(60); }
        const [elegida] = tabs.find(([, sel]) => sel) || [];
        if (elegida) { await pg.click("#" + elegida); await pg.waitForTimeout(300);
          MON[`${nombre} ${w}`].fueraVuelta = await fueraDeVista(zona); }
      }
      if (extra) await extra(w);
    }
  };
  /* a la Partida de la partida de prueba, que es la que tiene de todo */
  await pg.click("#volverDeLaPartida");
  await pg.waitForSelector("#zonaPosicion:not(.oculto)", { timeout: 10000 });
  await pg.click("#navAnalisis");
  await pg.waitForSelector("#partidas div[data-i]", { timeout: 20000 });
  await pg.waitForTimeout(300);
  await cadaMonitor("inicio", null, "#zonaMeses, #zonaAnalizar, #tarjetaMes, #zonaPartidas");
  await pg.click("#partidas div[data-i]");
  await pg.waitForSelector("#zonaRevision:not(.oculto)", { timeout: 45000 });
  await pg.waitForFunction(() => !document.getElementById("revEstado").textContent, null, { timeout: 45000 });
  await pg.waitForTimeout(400);
  /* a una jugada del medio, con flecha y categoría: la 15, el ?? */
  await pg.keyboard.press("Home");
  for (let i = 0; i < 29; i++) await pg.keyboard.press("ArrowRight");
  await cadaMonitor("partida", "#tablero", "#zonaRevision", async w => {
    MON[`partida ${w}`].ant = await pg.evaluate(() => Math.round(document.getElementById("ant").getBoundingClientRect().height));
    await pg.click("#btnAjustes"); await pg.waitForTimeout(400);
    MON[`partida ${w}`].hoja = await pg.evaluate(() => {
      const r = document.getElementById("hojaAjustes").getBoundingClientRect();
      return Math.abs(r.bottom - innerHeight) < 2 && r.width > innerWidth / 3 ? "sube desde abajo" : "menú";
    });
    await fotoM(`ancho-${w}-ajustes`);
    await pg.keyboard.press("Escape"); await pg.waitForTimeout(300);
  });
  await pg.click("#volverDeLaPartida");
  await pg.waitForSelector("#partidas div[data-i]", { timeout: 20000 });
  await pg.evaluate(() => document.getElementById("tarjetaMes").click());
  await pg.waitForSelector("#zonaMes:not(.oculto)", { timeout: 30000 });
  await pg.waitForTimeout(400);
  await cadaMonitor("mes", null, "#zonaMes");
  await pg.click("#volverDelMes");
  await pg.waitForTimeout(300);
  await pg.click("#navPosiciones");
  await pg.waitForSelector("#zonaPosicion:not(.oculto)", { timeout: 10000 });
  await pg.waitForTimeout(300);
  await cadaMonitor("posicion", "#posTablero svg", "#zonaPosicion");
  /* el menú de Nueva partida abierto, y Armar: lo que de Posiciones no se
     veía en ningún monitor */
  await cadaMonitor("posicion-menu", "#posTablero svg", "#zonaPosicion", null, async () => {
    await pg.click("#btnPosNueva"); await pg.waitForTimeout(300);
  });
  await pg.click("#posArmar");
  await pg.waitForSelector("#zonaArmar:not(.oculto)", { timeout: 10000 });
  await pg.waitForTimeout(300);
  await cadaMonitor("armar", "#armTablero svg", "#zonaArmar");
  await pg.click("#volverDeArmar"); await pg.waitForTimeout(300);
  await pg.setViewportSize({ width: 412, height: 760 }); await pg.waitForTimeout(150);
  console.log("monitores:", JSON.stringify(MON),
    "(sobra: px que hay que bajar, 0 = entra; tablero: lado; usa: ancho dibujado; hoja, ant, dedo, icono y columna, §1.12; capturas ancho-1366-* y ancho-1920-*)");
  for (const [k, v] of Object.entries(MON)) {
    const [w, h] = MONITORES.find(m => k.endsWith(" " + m[0]));
    if (/partida|posicion/.test(k) && v.sobra > 0) console.log(`OJO: a ${k} hay que bajar ${v.sobra} px para ver la pantalla entera`);
    if (v.tablero && v.tablero < h - 130) console.log(`OJO: a ${k} el tablero mide ${v.tablero} con ${h} de alto (tablero chico, §1.12)`);
    /* el Mes no: es texto y tablas, y eso tiene un ancho de lectura (se
       juzga a ojo). Ni donde el tablero ya toma el alto: ahí el ancho lo
       pone el alto de la ventana, no una columna (Posiciones, v1.6.1) */
    const llena = v.tablero && v.tablero >= h - 130;
    if (w === 1920 && !/^mes/.test(k) && !llena && v.usa < w * .75) console.log(`OJO: a ${k} lo dibujado ocupa ${v.usa} de ${w} (columna centrada, §1.12)`);
    if (v.hoja === "sube desde abajo") console.log(`OJO: a ${k} Ajustes sube desde abajo como hoja de celu (§1.12)`);
    if (v.ant >= 44) console.log(`OJO: a ${k} los botones de pasar jugadas miden ${v.ant} de alto: son de dedo (§1.12)`);
    if (v.dedo.length) console.log(`OJO: a ${k}, botones de dedo (44 o más de alto, §1.12): ${v.dedo.join(", ")}`);
    if (v.icono.length) console.log(`OJO: a ${k}, botones de solo ícono no universal (§1.12): ${v.icono.join(", ")}`);
    if (v.listo.length) console.log(`OJO: a ${k}, un "Listo" de hoja de celu adentro de lo que se abre (§1.12): ${v.listo.join(", ")}`);
    if (v.pierde && v.pierde.length) console.log(`OJO: a ${k} dejan de verse ${v.pierde.join(", ")} al cambiar de pestaña (la zona cambia de forma)`);
    if (v.fuera && v.fuera.length) console.log(`OJO: a ${k} lo elegido quedó fuera de vista en una lista con scroll: ${v.fuera.join(", ")}`);
    if (v.fueraVuelta && v.fueraVuelta.length) console.log(`OJO: a ${k}, al volver de otra pestaña, lo elegido quedó fuera de vista: ${v.fueraVuelta.join(", ")}`);
    if (v.cortado && v.cortado.length) console.log(`OJO: a ${k} ${v.cortado.join(", ")} no entra y no lo dice (sin fundido ni barra)`);
    if (v.columna !== null && v.columna < .5) console.log(`OJO: a ${k} lo del costado ocupa ${Math.round(v.columna * 100)} % del alto del tablero (columna vacía, §1.12)`);
  }
}
console.log("bordes en la compu:", JSON.stringify(BORDES),
            "(a un mismo ancho, las tres pantallas abren y cierran en el mismo x)");
/* y no queda en un número que hay que acordarse de leer: si a un mismo ancho
   las pantallas no coinciden (más de 2 px), lo dice con OJO, como el resto */
for (const w of [1000, 1280]) {
  /* el inicio no: desde la v1.3.3 se corre para dejarle lugar al riel, y
     el salto al ir a la Partida se acepta */
  /* la Partida tampoco desde la v1.7: usa el ancho de la ventana (§1.12) y
     el Mes y el inicio tienen ancho de lectura. Queda el recorrido para las
     pantallas que vengan con ancho de lectura */
  const b = ["mes"].map(n => BORDES[n + " " + w]).filter(Boolean);
  const dif = Math.max(...[0, 1].map(k => Math.max(...b.map(x => x[k])) - Math.min(...b.map(x => x[k]))));
  if (dif > 2) console.log(`OJO: a ${w} las pantallas no abren y cierran en el mismo borde (${dif} px)`);
}
console.log("listo: capturas/");
await cerrar();
