/* AYUDANTE PARA DECIDIR ENTRE VARIANTES DE UN PEDAZO DE PANTALLA.
   Se importa desde una maqueta (`pruebas/maqueta-*.mjs`, que no se commitea) y
   desde `mirar.mjs`. Correr esto solo no hace nada: son funciones.

   POR QUÉ EXISTE, que es lo que no se puede recuperar leyendo el código: la
   regla de §10 dice que toda decisión visual se dibuja y la elige el usuario
   mirando, y la de las maquetas dice que el script que las dibuja se tira. Las
   dos siguen en pie. Lo que se descubrió en la v0.92 es que **el andamio era
   siempre el mismo**: clonar un pedazo de la pantalla real una vez por
   variante, cambiarle una cosa a cada clon y fotografiar todo junto. Eso se
   escribió entero dos veces —las seis formas del botón en la v0.91 y las cinco
   tuercas de la v0.92— y son ~1.600 tokens de escritura cada vez, que es el
   grueso del costo de una tanda: el dibujo en sí eran ~100. Acá vive ese
   andamio; la maqueta queda siendo solo la lista de variantes.

   NO ES UN CAMBIO DE LA REGLA DE LAS MAQUETAS. Lo que se tira sigue siendo la
   decisión temporal —qué cinco tuercas se compararon—; lo que queda es la forma
   de compararlas, que se usó en las dos tandas y se va a usar en la próxima.

   SE CLONA LA PANTALLA DE VERDAD, no se maqueta un renglón parecido. Es la
   diferencia entre mirar el ícono y mirar el renglón: el clon trae el título al
   lado, el `gap` del contenedor, la tipografía y los márgenes reales, o sea las
   cosas contra las que el ojo compara. Un botón dibujado solo, en el aire, se
   ve bien siempre. */

/* --- ABRIR LA APP --------------------------------------------------------- */

/* La otra mitad del andamio repetido: levantar un servidor sobre el repo, abrir
   un Chromium al tamaño del celular del usuario y dejar la app cargada.

   NO ANALIZA NINGUNA PARTIDA, y es a propósito. `mirar.mjs` tiene que hacerlo
   —mide veredictos, tablas y capturas de la vista llena— y para eso arrastra un
   motor de mentira de 150 líneas. Una decisión de forma no necesita nada de
   eso: el renglón que se va a clonar existe en el HTML aunque esté escondido, y
   el clon se dibuja igual. Si alguna vez hace falta una tira con datos de
   verdad, se resuelve entonces; hoy sería complejidad para nadie.

   EL TAMAÑO SALE DE UNA MEDICIÓN, la misma de `mirar.mjs`: sobre una captura
   del celular del usuario, y sacando la escala del tablero (360 CSS de ancho),
   su viewport es de ~420 x 810. Se dibuja a 412 x 760, que es el caso apretado
   —con la barra de direcciones a la vista—, porque es el que decide si algo
   entra. */
export async function abrirApp({ puerto = 8098, alto = 900, partida = null } = {}) {
  const [{ chromium }, http, fs, path, { fileURLToPath }] = await Promise.all([
    import("playwright"), import("node:http"), import("node:fs"),
    import("node:path"), import("node:url"),
  ]);
  const RAIZ = path.dirname(fileURLToPath(new URL("../index.html", import.meta.url)));
  const SALIDA = path.join(RAIZ, "capturas");
  fs.mkdirSync(SALIDA, { recursive: true });
  const TIPOS = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript",
                  ".json": "application/json", ".wasm": "application/wasm" };
  const srv = http.createServer((req, res) => {
    const ruta = decodeURIComponent(req.url.split("?")[0]);
    /* con `partida`, el servidor contesta además la API de chess.com y sirve un
       motor de mentira en lugar del wasm. Sin ella no sirve ninguna de las dos
       cosas y la app queda en la pantalla de entrada, que para decidir la forma
       de un renglón alcanza y sobra. */
    if (partida) {
      if (partida.API[ruta]) {
        res.writeHead(200, { "content-type": "application/json" });
        return res.end(JSON.stringify(partida.API[ruta]));
      }
      if (ruta.endsWith("stockfish-18-lite-single.js")) {
        res.writeHead(200, { "content-type": "text/javascript" });
        return res.end(partida.FALSO);
      }
    }
    const f = path.join(RAIZ, ruta === "/" ? "/index.html" : ruta);
    if (!f.startsWith(RAIZ) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { "content-type": TIPOS[path.extname(f)] || "application/octet-stream" });
    fs.createReadStream(f).pipe(res);
  });
  await new Promise(r => srv.listen(puerto, r));
  /* el Chromium del entorno si lo hay: en los contenedores viene preinstalado y
     bajarlo de nuevo no sirve. Misma lista que `mirar.mjs`. */
  const CH = process.env.CHROMIUM_PATH ||
    ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", "/opt/pw-browsers/chromium/chrome-linux/chrome"]
      .find(p => fs.existsSync(p));
  const b = await chromium.launch(CH ? { executablePath: CH } : {});
  const pg = await b.newPage({ viewport: { width: 412, height: alto }, deviceScaleFactor: 2 });
  pg.on("pageerror", e => console.log("PAGEERROR:", e.message));
  const cerrar = async () => { await b.close(); srv.close(); };

  /* SE ENTRA POR LA LISTA, que es como lo usa el usuario, y no pegando el PGN:
     son dos caminos distintos y el del PGN no tiene el JSON del mes, o sea que
     por ahí no aparece el motivo del final. Eso ya escondió un error (v0.63.1). */
  if (partida) {
    await pg.route("https://api.chess.com/**", r =>
      r.fulfill({ status: 200, contentType: "application/json",
                  body: JSON.stringify(partida.API["/api/archives"]) }));
  }
  await pg.goto(`http://localhost:${puerto}/index.html`);
  if (partida) {
    await pg.fill("#usuario", partida.cabPgn("White", "Blancas"));
    await pg.click("#buscar");
    await pg.waitForSelector("#partidas div[data-i]", { timeout: 20000 });
    await pg.click("#partidas div[data-i]");
    await pg.waitForSelector("#analizar", { state: "visible", timeout: 20000 });
    await pg.click("#analizar");
    try {
      await pg.waitForSelector("#zonaRevision:not(.oculto)", { timeout: 45000 });
    } catch (e) {
      /* si no llega, la foto de lo que quedó y el registro dicen por qué. Sin
         esto lo único que se veía era "Timeout exceeded", que no dice nada. */
      await pg.screenshot({ path: path.join(SALIDA, "atascado.png"), fullPage: true });
      console.log("ATASCADO, mirá capturas/atascado.png. Registro:");
      console.log(await pg.evaluate(() => (window.LOG && window.LOG.texto && window.LOG.texto()) || "sin registro"));
      await cerrar(); process.exit(1);
    }
    await pg.waitForTimeout(800);
  }
  return { pg, salida: SALIDA, cerrar };
}

/* --- MEDIR, que sale más barato que mirar -------------------------------- */

/* Distancia vertical entre el centro de la MAYÚSCULA de un texto y el centro de
   la tinta de otro elemento. Es la medición que faltó en la v0.91 y mandó
   corregir 8 px que ya estaban bien: la caja del renglón reserva lugar para
   colas y tildes, así que centrar contra ella deja el vecino alto. El `Range`
   devuelve la caja del renglón YA UBICADA, y el canvas da el ascenso real de la
   fuente; nada se deduce del relleno del elemento, que es donde estuvo el error.
   Devuelve cuánto hay que MOVER el elemento: positivo, para abajo. */
export const alinear = (raiz, selTexto, selVecino) => raiz.evaluate(
  ([sT, sV], ) => {
    const cv = document.createElement("canvas").getContext("2d");
    const fuente = el => {
      const cs = getComputedStyle(el);
      return `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    };
    /* la línea de base de un elemento, sin suponer dónde arranca el texto */
    const base = (el, m) => {
      const r = document.createRange(); r.selectNodeContents(el);
      const caja = r.getBoundingClientRect();
      return caja.top + (caja.height - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2
             + m.fontBoundingBoxAscent;
    };
    const texto = document.querySelector(sT), vecino = document.querySelector(sV);
    if (!texto || !vecino) return { error: `no encontré ${!texto ? sT : sV}` };
    cv.font = fuente(texto);
    const mT = cv.measureText((texto.textContent.trim()[0] || "R").toUpperCase());
    const centroTexto = base(texto, mT) - mT.actualBoundingBoxAscent / 2;
    /* un SVG se mide por su caja; un glifo, por su tinta, que no es lo mismo */
    const svg = vecino.querySelector("svg") || (vecino.tagName === "svg" ? vecino : null);
    let centroVecino;
    if (svg) { const r = svg.getBoundingClientRect(); centroVecino = r.top + r.height / 2; }
    else {
      cv.font = fuente(vecino);
      const mV = cv.measureText(vecino.textContent);
      centroVecino = base(vecino, mV) - (mV.actualBoundingBoxAscent - mV.actualBoundingBoxDescent) / 2;
    }
    return { desvio: +(centroTexto - centroVecino).toFixed(2) };
  }, [selTexto, selVecino]);

/* Qué toca qué adentro de un contenedor. Contesta de un saque las dos preguntas
   que uno va a buscar a la captura —¿algo quedó pegado?, ¿algo quedó
   encimado?—, que es la regla de §10 de mirar los ESPACIOS y no solo lo que se
   cambió. Son ~100 tokens contra los 417 de una pantalla a escala CSS.
   Solo mira elementos que se dibujan y que no son ancestros uno del otro: un
   hijo adentro de su padre se superpone siempre y eso no es una falla. */
export const espacios = (raiz, selector, minimo = 8) => raiz.evaluate(
  ([sel, min]) => {
    const cont = document.querySelector(sel);
    if (!cont) return { error: `no encontré ${sel}` };
    /* `data-tira` marca lo que agrega el andamio —los rótulos de cada variante
       y las celdas de la ampliada—. Sin esto, el rótulo pegado a su clon (que
       es a propósito, tiene margen negativo) sale reportado como falla: la
       primera corrida devolvió dos "div ~ div: 0.0px" que no eran nada. Lo que
       se juzga es la pantalla, no la vitrina donde se la exhibe. */
    const nombrar = el => {
      if (el.id) return "#" + el.id;
      const cl = typeof el.className === "string" && el.className.trim();
      if (cl) return el.tagName.toLowerCase() + "." + cl.split(/\s+/)[0];
      const i = [...(el.parentElement?.children || [])].indexOf(el) + 1;
      return el.tagName.toLowerCase() + ":nth-child(" + i + ")";
    };
    const cajas = [...cont.querySelectorAll("*")]
      .filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== "hidden")
      .filter(el => !el.closest("[data-tira]"))
      .map(el => ({ el, r: el.getBoundingClientRect(), id: nombrar(el) }))
      .filter(c => c.r.width > 1 && c.r.height > 1);
    const encimados = [], pegados = [];
    for (let i = 0; i < cajas.length; i++)
      for (let j = i + 1; j < cajas.length; j++) {
        const a = cajas[i], b = cajas[j];
        if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
        const dx = Math.max(b.r.left - a.r.right, a.r.left - b.r.right);
        const dy = Math.max(b.r.top - a.r.bottom, a.r.top - b.r.bottom);
        if (dx < 0 && dy < 0) { encimados.push(`${a.id} × ${b.id}`); continue; }
        /* "pegado" solo entre vecinos de verdad: los que se cruzan en el otro
           eje. Dos cosas en esquinas opuestas están lejos aunque el número dé
           chico en un eje. */
        const luz = dx < 0 ? dy : dy < 0 ? dx : Math.max(dx, dy);
        if ((dx < 0 || dy < 0) && luz >= 0 && luz < min)
          pegados.push(`${a.id} ~ ${b.id}: ${luz.toFixed(1)}px`);
      }
    return { encimados, pegados, mirados: cajas.length };
  }, [selector, minimo]);

/* --- DIBUJAR LAS VARIANTES ----------------------------------------------- */

/* Clona `selector` una vez por variante, le corre `aplicar` a cada clon y
   fotografía todo junto.

   SACA LAS DOS ESCALAS A PROPÓSITO, y la diferencia está medida (v0.91): la de
   escala CSS es para quien programa —157 tokens las seis variantes juntas, o
   sea 26 cada una— y la de 2x es para mandarle al usuario, que es quien la
   tiene que leer en un teléfono. Mandarlas no cuesta nada; mirarlas, sí. Ojo
   con invertirlo: la MISMA tira a 2x sale 627 tokens, más cara que seis
   recortes sueltos. El ahorro es la escala, no la tira.

   `aplicar` corre ADENTRO DEL NAVEGADOR, así que no puede usar variables de
   node: todo lo que necesite viaja en la variante. */
export async function tira(pg, { selector, variantes, aplicar, nombre, salida,
                                 estilo = "", ampliar = null }) {
  const datos = variantes.map(v => ({ ...v }));
  await pg.evaluate(({ sel, vs, fn, css }) => {
    document.getElementById("tira")?.remove();
    const caja = document.createElement("div");
    caja.id = "tira";
    caja.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:99999;" +
                         "background:Canvas;padding:10px 14px 16px;" +
                         "font:14px system-ui,sans-serif";
    /* EL CLON PIERDE LOS ID, Y CON ELLOS SU CSS. Esta app estila mucho por id
       —`#btnAjustes` trae el redondeado, el borde y el tamaño—, así que un clon
       sin id se dibuja distinto del original: la primera corrida mostró el
       botón CUADRADO cuando en la app es un círculo. Eso no es un detalle del
       andamio, es una decisión tomada mirando algo que no era la pantalla, o
       sea exactamente lo que estas tiras existen para evitar.
       El arreglo es copiar las reglas de `#x` a `.v-x`, recorriendo las hojas
       de estilo de verdad en vez de repetirlas a mano en cada maqueta —que es
       lo que se hizo en la v0.91 y la v0.92, y por eso había que acordarse—.
       Se entra en los @media porque la app tiene reglas de PC y la tira se
       dibuja al ancho del celular: hay que conservar cuál gana. */
    const espejar = (reglas, ids) => {
      let css = "";
      for (const regla of reglas) {
        if (regla.cssRules && regla.conditionText !== undefined) {
          const dentro = espejar(regla.cssRules, ids);
          if (dentro) css += `@media ${regla.conditionText}{${dentro}}`;
          continue;
        }
        if (!regla.selectorText) continue;
        let sel = regla.selectorText, toco = false;
        for (const id of ids) {
          const re = new RegExp("#" + id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![\\w-])", "g");
          if (re.test(sel)) { sel = sel.replace(re, ".v-" + id); toco = true; }
        }
        if (toco) css += `${sel}{${regla.style.cssText}}`;
      }
      return css;
    };

    const modelo = document.querySelector(sel);
    if (!modelo) throw new Error("no encontré " + sel);
    const correr = new Function("clon", "v", fn);
    const ids = new Set();
    if (modelo.id) ids.add(modelo.id);
    for (const el of modelo.querySelectorAll("[id]")) ids.add(el.id);
    for (const v of vs) {
      const rot = document.createElement("div");
      rot.textContent = v.nombre || v.clave;
      rot.dataset.tira = "rotulo";
      rot.style.cssText = "font-size:12px;color:#777;margin:14px 0 -18px";
      const clon = modelo.cloneNode(true);
      /* los id se duplicarían, y un id repetido rompe todo lo que los busque */
      if (clon.id) { clon.classList.add("v-" + clon.id); clon.removeAttribute("id"); }
      for (const el of clon.querySelectorAll("[id]")) {
        el.dataset.era = el.id;
        el.classList.add("v-" + el.id);
        el.removeAttribute("id");
      }
      correr(clon, v);
      caja.append(rot, clon);
    }
    const est = document.createElement("style");
    est.id = "tira-css";
    est.textContent = espejar([...document.styleSheets].flatMap(h => {
      try { return [...h.cssRules]; } catch (e) { return []; }
    }), [...ids]) + (css || "");
    document.head.append(est);
    document.body.append(caja);
  }, { sel: selector, vs: datos, fn: `(${aplicar})(clon, v)`, css: estilo });
  await pg.waitForTimeout(200);

  const rutas = {};
  const sacar = async (n, escala) => {
    const p = `${salida}/${n}.png`;
    await pg.locator("#tira").screenshot({ path: p, ...(escala ? { scale: escala } : {}) });
    return p;
  };
  rutas.mirar = await sacar(nombre + "-css", "css");
  rutas.mandar = await sacar(nombre, null);

  /* SE MIDE ACÁ, sobre la tira a tamaño real, y no al final: la ampliada rearma
     todo adentro de celdas de una grilla, y esas cajas son vitrina, no
     pantalla. Midiéndola después salían dos "pegados" que eran las celdas entre
     sí. Lo que se juzga es cómo queda el renglón, que es esto. */
  const medidas = await espacios(pg, "#tira");

  /* la ampliada: cada variante sola y grande, que es donde se ve LA FORMA. A
     tamaño real se decide si entra en el renglón; acá, si el dibujo está bien */
  if (ampliar) {
    await pg.evaluate(({ vs, fn, sel, css }) => {
      const caja = document.getElementById("tira");
      caja.innerHTML = "";
      caja.style.display = "grid";
      caja.style.gridTemplateColumns = `repeat(${Math.min(vs.length, 3)}, 1fr)`;
      caja.style.alignContent = "start";
      const modelo = document.querySelector(sel);
      const correr = new Function("clon", "v", fn);
      for (const v of vs) {
        const cel = document.createElement("div");
        cel.style.cssText = "display:grid;place-items:center;gap:6px;padding:10px 0";
        const clon = modelo.cloneNode(true);
        if (clon.id) { clon.classList.add("v-" + clon.id); clon.removeAttribute("id"); }
        for (const el of clon.querySelectorAll("[id]")) {
          el.classList.add("v-" + el.id); el.removeAttribute("id");
        }
        correr(clon, v);
        clon.classList.add("grande");
        const pie = document.createElement("div");
        pie.dataset.tira = "rotulo";
        pie.style.cssText = "font-size:11px;color:#777";
        pie.textContent = v.clave || v.nombre;
        cel.append(clon, pie); caja.append(cel);
      }
      const est = document.createElement("style");
      est.textContent = css;
      document.head.append(est);
    }, { vs: datos, fn: `(${aplicar})(clon, v)`, sel: selector, css: ampliar });
    await pg.waitForTimeout(200);
    rutas.mirarAmpliada = await sacar(nombre + "-grande-css", "css");
    rutas.mandarAmpliada = await sacar(nombre + "-grande", null);
  }

  await pg.evaluate(() => {
    document.getElementById("tira")?.remove();
    document.getElementById("tira-css")?.remove();
  });
  return { ...rutas, ...medidas };
}
