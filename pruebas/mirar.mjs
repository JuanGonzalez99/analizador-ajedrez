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
     jugada, o sea la del rival, así que la alternativa sale de ahí. */
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
    for (const forma of ["sinLista", "adentro", "abajo", "dos"]) {
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
          listaAdentro: !document.getElementById("pLinea").classList.contains("oculto"),
          probadasAbajo: document.querySelectorAll("#tiraSc .jg.inv").length,
          elegidaAbajo: (document.querySelector("#tiraSc .jg.sel") || {}).textContent || null
        }))));
    }
    /* queda en "adentro", que es la única forma donde la tira de la variante
       vive en la tarjeta: es lo que mira lo que sigue. El volcado en texto va
       acá por lo mismo —con la forma de por defecto, esa tira no existe—. */
    await elegir("#formaPrueba", "adentro");
    console.log("variante:", JSON.stringify(
      (await pg.locator("#pLinea").textContent()).replace(/\s+/g, " ").trim()));

    /* volver a la PRIMERA jugada de la variante tocando su tira. Iba al
       arranque con data-v="0" hasta la v0.71, que le sacó ese eslabón. */
    await pg.click('#pLinea span[data-v="1"]');
    await foto("prueba-6-volviendo");
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
  await elegir("#formaPrueba", "adentro");
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
        document.querySelectorAll("#pLinea .vj").length);
    }
    const pendientes = await pg.evaluate(() =>
      [...document.querySelectorAll("#pLinea .vj .sm")].filter(x => x.textContent === "\u2026").length);
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
await elegir("#marcasCurva", "punto");
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
  await elegir("#marcasCurva", "raya");
  await pg.waitForTimeout(250);
  await fotoDe("#curva", "marcas-encima-raya");
}
await elegir("#marcasCurva", "punto");

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
for (const f of ["planilla", "renglon", "no"]) {
  await elegir("#formaJugadas", f);
  await pg.waitForTimeout(250);
  await pg.evaluate(() => document.getElementById("zonaRevision").scrollIntoView({ block: "start" }));
  await pg.evaluate(() => window.scrollBy(0, -10));
  await foto("ancho-" + f);
}
await elegir("#formaJugadas", "planilla");

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
await elegir("#formaJugadas", "renglon");
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
await pg.waitForTimeout(250);
const t1 = await tablero();
await pg.screenshot({ path: path.join(SALIDA, "previa" + SUFIJO + ".png") });
await pg.mouse.move(5, 5);
await pg.waitForTimeout(250);
console.log("previa:        ", JSON.stringify(
  { cambioElTablero: t0 !== t1, volvioIgual: t0 === (await tablero()),
    yNoNavego: e0 === (await elegida()) }));

/* LA RUEDA SOBRE EL TABLERO pasa de jugada. */
const cajaTab = await pg.locator("#tablero").boundingBox();
const antesRueda = await elegida();
await pg.mouse.move(cajaTab.x + cajaTab.width / 2, cajaTab.y + cajaTab.height / 2);
await pg.mouse.wheel(0, 120);
await pg.waitForTimeout(400);
console.log("rueda tablero: ", JSON.stringify({ de: antesRueda, a: await elegida() }));

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
for (let i = 0; i < 6; i++) await pg.click("#sig");
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
await elegir("#formaJugadas", "planilla");

/* LA CURVA ANCHA NO SE PUEDE IR ABAJO DEL PLIEGUE (v0.88). Se prueba con la
   lista en su forma más alta —"una por renglón" gasta el doble— que es donde la
   lista le ganaba a la columna y empujaba la curva para abajo. */
await pg.setViewportSize({ width: 1280, height: 800 });
await elegir("#formaJugadas", "renglon");
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
await elegir("#formaJugadas", "planilla");
await pg.waitForTimeout(300);
await elegir("#formaJugadas", "planilla");
await pg.waitForTimeout(300);

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
}
console.log("lado del tablero:", JSON.stringify(porForma), "(compu, 800 de alto)");
/* LA BARRA PEGADA AL TABLERO Y EL NÚMERO ENTERO ADENTRO. Las dos fallaron en la
   primera captura de la v0.86 y ninguna de las dos la agarraba una cuenta: la
   barra quedaba a 170 px del tablero y "+0.26" salía cortado. */
await elegir("#verEval", "barra");
await pg.waitForTimeout(250);
/* SE MIDE EN DOS JUGADAS: una con el número corto y otra con el largo. "+0.26"
   entra en la barra y "+10.00" no entraba, y el recorte no avisa. */
const barra = () => pg.evaluate(() => {
  const b = document.getElementById("evalbar").getBoundingClientRect();
  const t = document.querySelector("svg.tab").getBoundingClientRect();
  const n = document.getElementById("evalnum");
  return { texto: n.textContent, hastaElTablero: Math.round(t.left - b.right),
           entero: n.scrollWidth <= Math.ceil(b.width) };
});
const barraCorta = await barra();
await pg.evaluate(() => { for (let i = 0; i < 30; i++) document.getElementById("sig").click(); });
await pg.waitForTimeout(500);
const barraLarga = await barra();
console.log("barra vertical: ", JSON.stringify({ corto: barraCorta, largo: barraLarga }));
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
/* Las tres son de la posición QUE SE VE, así que las tres tienen que ser legales
   ahí. No se compara contra el cuadrito "Mejor": ese habla de la posición
   ANTERIOR, la de antes de la jugada, y son dos tableros distintos. */
alt.lasTresSonLegales = await pg.evaluate(() =>
  [...document.querySelectorAll("#altLista .alt .as")].map(e => e.dataset.uci));
alt.botonEscondido = await pg.locator("#btnAlts").isHidden();
await foto("ancho-alternativas");
/* tocar la segunda abre la variante CON ESA jugada */
const san2 = await pg.locator("#altLista .alt").nth(1).locator(".as").textContent();
await pg.locator("#altLista .alt").nth(1).locator(".as").click();
await pg.waitForFunction(() => !/^Probando/.test(document.getElementById("pTit").textContent || ""),
  null, { timeout: 30000 });
await pg.waitForTimeout(250);
alt.alTocarLaSegunda = { pedida: san2, quedo: (await pg.locator("#pTit").textContent()).trim() };
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

console.log("listo: capturas/");
await cerrar();
