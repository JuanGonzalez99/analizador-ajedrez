/* ============ revisión de una partida ============ */
/* Girar al costado del tablero (v0.114): a la vista mientras dura la apertura
   —las jugadas de libro, y como mínimo las dos primeras de cada lado, por si la
   partida sale del libro enseguida— y después solo en la hoja de la compu o
   en la fila. Se ubica pegado a la fila 1, del lado de afuera de las
   casillas; el SVG mide 8 casillas más dos márgenes, y la escala sale de su
   ancho en pantalla. */
const JUGADAS_GIRAR = 4;
/* ¿Sobra alto para bajar la curva debajo del tablero? (v0.135, ver el CSS de
   `.curvaAbajo`). Las mismas cuentas que `--ladoTab`: el lado que pide el alto
   menos los 62 de la curva (16 de aire y 46 de curva) contra el que deja el
   ancho. `innerWidth` y no `clientWidth`, porque el CSS usa 100vw. */
function ubicarCurva() {
  const z = $("zonaRevision");
  const vw = window.innerWidth, vh = window.innerHeight;
  const panel = Math.min(480, Math.max(340, 340 + (vw - 1000) * .364));
  const porAlto = vh - 48 - (z.classList.contains("sinEvalH") ? 64 : 70) - 62;
  z.classList.toggle("curvaAbajo", window.matchMedia(CORTE_ANCHO).matches &&
    porAlto >= Math.min(vw - panel - 120, 1000));
  ubicarAlts();
}
/* LAS TRES MEJORES BAJAN DEBAJO DE LA CURVA SI ENTRAN ENTERAS (v0.150, lavado
   de cara del revisor, v0.135: con la curva abajo sobraban ~175 px al pie del
   tablero a 1000×900). Solo si lo que queda entre el pie de la curva y el de la
   ventana alcanza para la caja entera —135 de alto, fijo, más 16 arriba y 16
   abajo—; si no, se quedan en el panel como siempre. Por DOM y no por CSS: en
   el panel viven adentro de la lista. La curva no se mueve por esto (está
   arriba de la caja), así que la condición no oscila. Con la vista escondida
   no se mide nada y se deja como estaba. */
const ALTS_ALTO = 135;
function ubicarAlts() {
  const z = $("zonaRevision"), a = $("alts"), c = $("curva");
  let abajo = false;
  if (z.classList.contains("curvaAbajo")) {
    const rc = c.getBoundingClientRect(), rz = z.getBoundingClientRect();
    if (!rc.height) return;
    abajo = window.innerHeight - 8 - (rc.bottom - rz.top) >= ALTS_ALTO + 32;
  }
  if (abajo === z.classList.contains("altsAbajo")) return;
  z.classList.toggle("altsAbajo", abajo);
  /* abajo va detrás de Mejor y no de la curva: en la grilla tiene su lugar
     fijo, y así el Tab la toma antes que la lista (v0.182) */
  if (abajo) document.querySelector("#zonaRevision > .pabajo").after(a); else $("lateral").prepend(a);
}
window.addEventListener("resize", ubicarCurva);
/* EL RESUMEN, DE LA COLUMNA a AL BORDE DEL PANEL (v0.137). En píxeles de la
   página y no relativos al grupo, así que se recalcula también al cambiar el
   ancho de la ventana: con el tablero en su tope (680) el ResizeObserver del
   tablero no se entera y el grupo se corre igual, porque va centrado. */
function ubicarResumen() {
  const svg = $("tablero").querySelector("svg.tab");
  if (!svg || !window.matchMedia(CORTE_ANCHO).matches) return;
  const s = svg.getBoundingClientRect();
  if (!s.width) return;
  const m = TAB_M * s.width / (TAB_S * 8 + TAB_M * 2);
  const zr = $("zonaResumen"), cb = zr.parentElement, cs = getComputedStyle(cb);
  const base = cb.getBoundingClientRect().left + parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth);
  const der = document.querySelector("#zonaRevision > .parriba").getBoundingClientRect().right;
  /* en el body y no en el Resumen: el pie también los usa */
  document.body.style.setProperty("--resIzq", (s.left + m - base) + "px");
  document.body.style.setProperty("--resAncho", (der - s.left - m) + "px");
}
window.addEventListener("resize", ubicarResumen);
/* EL ORDEN DE TAB DE LA COMPU SIGUE AL DE LECTURA (v0.182, revisor): con el
   HTML del celu saltaba volver → tuerca → Girar (abajo de todo) → las tres
   mejores → lista → "‹ ›" → Mejor (arriba). En la compu cada bloque tiene su
   lugar fijo en la grilla, así que cambiarlos de orden en el HTML no mueve
   nada en la pantalla: Mejor (`.pabajo`) sube detrás de las tarjetas y el
   tablero con Girar (`.pmedio`) va al final. En el celu se vuelve al orden de
   siempre, que es también el de lectura. Sin `tabindex` positivos. */
function ordenDeTab(compu) {
  const z = $("zonaRevision"), hijo = c => z.querySelector(":scope > ." + c);
  const ta = hijo("tarjetas"), pm = hijo("pmedio"), pb = hijo("pabajo");
  const [segundo, ultimo] = compu ? [pb, pm] : [pm, pb];
  if (ta.nextElementSibling !== segundo) ta.after(segundo);
  if (z.lastElementChild !== ultimo) z.append(ultimo);
}

function ubicarGirar(f) {
  ubicarCurva();
  ordenDeTab(window.matchMedia(CORTE_ANCHO).matches);
  const b = $("btnGirarTab"), svg = $("tablero").querySelector("svg.tab");
  if (!svg) return b.classList.add("oculto");
  const s = svg.getBoundingClientRect(), r = b.parentElement.getBoundingClientRect();
  if (!s.width) return;
  /* EN LA COMPU (v0.125) va en la columna de las comidas, a media altura —las
     del rival crecen desde arriba y las propias desde abajo, así que el medio
     queda libre— y siempre a la vista: ahí no hay otro Girar. */
  /* Desde la v0.132 va abajo a la derecha, en el renglón de las comidas del
     que juega abajo —que es lo que cambia Girar—, y las comidas se ubican acá
     también, sobre las casillas: las dos cosas dependen de la escala. */
  if (window.matchMedia(CORTE_ANCHO).matches) {
    const c = document.querySelector(".revtab .comidas");
    const km = s.width / (TAB_S * 8 + TAB_M * 2), m = TAB_M * km, lado = TAB_S * 8 * km;
    /* la curva de abajo arranca con la columna a (v0.135) */
    const pm = document.querySelector("#zonaRevision > .pmedio").getBoundingClientRect();
    $("zonaRevision").style.setProperty("--izqCurva", (s.left - pm.left + m) + "px");
    ubicarResumen();
    c.style.left = (s.left - r.left + m) + "px";
    c.style.top = (s.top - r.top + m) + "px";
    c.style.width = c.style.height = lado + "px";
    document.body.classList.remove("girarEnFila");
    b.classList.remove("oculto", "pestana");
    b.style.width = "";
    b.style.left = (s.left - r.left + m + lado - 32) + "px";
    b.style.top = (s.bottom - r.top + 4) + "px";
    return;
  }
  const k = s.width / (TAB_S * 8 + TAB_M * 2), borde = (TAB_M + TAB_S * 8) * k;
  /* 2 de las casillas. Si sobra, 30 de ancho y 3 hasta el borde de la
     pantalla; si no, una PESTAÑA pegada al borde, redondeada solo del lado del
     tablero, de lo que haya (mínimo 24); si ni eso, a la fila. El celu de Juan
     mide ~386 CSS (v0.116, medido sobre su captura con los 14 de margen de la
     tarjeta): de las casillas al borde quedan ~28, y con la v0.114 (pedía 412)
     y la v0.115 (pedía 400) Girar le seguía cayendo en la fila. Se decide siempre, esté o no a la vista, para que
     la fila ya esté bien cuando el botón se esconde. */
  const lugar = document.documentElement.clientWidth - Math.round(s.left + borde) - 2;
  const pestana = lugar < 30 + 3, ancho = pestana ? lugar : 30;
  const entra = ancho >= 24;
  document.body.classList.toggle("girarEnFila", !entra);
  const ver = entra && !PRUEBA && (IDX < JUGADAS_GIRAR || (f && f.cat === "libro"));
  b.classList.toggle("oculto", !ver);
  if (!ver) return;
  b.style.left = (s.left - r.left + borde + 2) + "px";
  b.style.width = ancho + "px";
  b.classList.toggle("pestana", pestana);
  b.style.top = (s.top - r.top + borde - 44) + "px";
}
/* LA POSICIÓN INICIAL (v0.124, pedido de Juan): la Partida abre ANTES de la
   primera jugada, con IDX = -1. No es una fila —no hay jugada que juzgar—, así
   que se arma un objeto con lo poco que la pantalla le pide a una fila: la
   posición, la evaluación para la barra y la mejor jugada para el cuadrito y la
   flecha verde. Todo sale de `R.evs[0]`, que el análisis ya tenía: la posición
   de arranque se evalúa igual, porque de ahí sale la pérdida de la primera
   jugada. La evaluación viene del lado del que mueve, como todas (`textoEval`).
   `uci` en null: no hay jugada que trajo hasta acá, así que no hay flecha azul
   ni casillas marcadas. */
/* Lo que la barra necesita de una posición CUALQUIERA de la partida (v0.165):
   la evaluación vista desde las blancas, con el turno sacado del FEN. Sirve
   para el arranque de una variante, que puede ser antes o después de la
   jugada que se mira. Sin evaluación, null. */
function filaDePosicion(k) {
  const ev = (R.evs && R.evs[k]) || null, fen = fenDeLaJugada(k);
  if (!ev || !fen) return null;
  const turno = fen.split(" ")[1], otro = turno === "w" ? "b" : "w";
  return { remate: null, mateDe: ev.mate ? (ev.mate > 0 ? turno : otro) : null,
           evalBlancas: aBlancas(ev, turno), evalTexto: textoEval(ev, turno) };
}
function filaDeArranque() {
  const ev = (R.evs && R.evs[0]) || null;
  const turno = R.filas.length ? R.filas[0].turno : "w";
  const otro = turno === "w" ? "b" : "w";
  return {
    inicio: true, turno, uci: null, rev: null, remate: null,
    fen: fenDeLaJugada(0) || new Chess().fen(),
    mejor: ev ? ev.mejor || null : null,
    mateDe: ev && ev.mate ? (ev.mate > 0 ? turno : otro) : null,
    evalBlancas: ev ? aBlancas(ev, turno) : 0,
    evalTexto: ev ? textoEval(ev, turno) : ""
  };
}
/* ¿queda lista abajo del borde? Prende el fundido de la compu (v0.179). Sin
   lista abajo —al final, o con la partida entera a la vista— no va. */
function marcarMas(lista) {
  lista.classList.toggle("hayMas", lista.scrollTop + lista.clientHeight < lista.scrollHeight - 1);
  lista.style.setProperty("--fundido", fundidoDe(lista) + "px");
}
/* EL ALTO DEL FUNDIDO DEPENDE DE CUÁNTO ASOMA (revisor, v0.179): el
   auto-scroll alinea arriba a renglón entero, así que abajo asoma siempre el
   resto de dividir la caja por la fila. A 1600×900 eran 14 px, que caían en lo
   más tapado de un fundido de 32 y la lista se leía terminada. Si asoman menos
   de 20, el fundido toma además la última fila entera, que queda fantasma
   (legible pero apagada, como a 1366): eso es lo que dice "sigue". Con +20 no
   alcanzaba: el texto de esa fila cae donde el degradé casi no tapa. */
function fundidoDe(lista) {
  /* la tabla del Resumen (v1.7) no arranca a renglón entero: se mira la fila
     que corta el borde de abajo, con la misma regla */
  if (lista.id === "resAncho") {
    const abajo = lista.getBoundingClientRect().bottom, filas = [...lista.querySelectorAll("tr")];
    const i = filas.findIndex(tr => tr.getBoundingClientRect().bottom > abajo + 1);
    if (i < 1) return 32;
    const asoma = abajo - filas[i].getBoundingClientRect().top;
    return asoma < 20 ? Math.round(asoma + filas[i - 1].offsetHeight) : 32;
  }
  const fila = lista.firstElementChild ? lista.firstElementChild.offsetHeight : 0;
  if (!fila) return 32;
  const asoma = lista.clientHeight % fila;
  return asoma < 20 ? asoma + fila : 32;
}

/* LA ELEGIDA, A LA VISTA EN LA PLANILLA (sacado de `pintarRevision` en la
   v1.7 para llamarlo también cuando la lista cambia de alto). Escondida (la
   pestaña Resumen) no se toca: todos los `offsetTop` dan 0. */
function acomodarLista(lista) {
  if (!lista.clientHeight) return;
  /* que la elegida quede a la vista sin arrastrar la lista a mano. Y en la
     ÚLTIMA la lista baja del todo, o el cierre no se ve nunca: el scroll de
     arriba deja la jugada pegada al fondo del recuadro y el cierre queda
     justo abajo, fuera de vista. Se descubrió mirándolo, en la v0.73. */
  const sel = lista.querySelector(".sel");
  if (sel) {
    const fila = sel.parentElement;
    if (fila.offsetTop < lista.scrollTop) lista.scrollTop = fila.offsetTop;
    else if (fila.offsetTop + fila.offsetHeight + fundidoDe(lista) >
             lista.scrollTop + lista.clientHeight) {
      /* y que arriba no quede medio renglón (revisor, v0.135): se baja hasta
         el borde del renglón siguiente. Medio renglón abajo se acepta, avisa
         que hay más. */
      /* la elegida queda arriba del fundido (v0.179). La última jugada no
         pasa por acá: la línea de abajo lleva la lista hasta el fondo. */
      const tope = fila.offsetTop + fila.offsetHeight + fundidoDe(lista) - lista.clientHeight;
      const borde = [...lista.children].find(d => d.offsetTop >= tope);
      lista.scrollTop = borde ? Math.min(borde.offsetTop, fila.offsetTop) : tope;
    }
  }
  if (lista._ultima) lista.scrollTop = lista.scrollHeight;
  if (lista._inicio) lista.scrollTop = 0;
}
function pintarRevision() {
  const enInicio = IDX < 0;
  const f = enInicio ? filaDeArranque() : R.filas[IDX];
  const c = enInicio ? null : presentar(f);
  /* EL SEÑALADO SE VA ACÁ, y por el mismo motivo que las marcas del usuario:
     una frase señala una casilla DE ESTA POSICIÓN, así que en cuanto el tablero
     muestra otra —otra jugada, o una variante— la flecha naranja estaría
     señalando un tablero que ya no existe. `irA` lo apagaba desde la v0.69,
     pero era UNO de los caminos: tocar una pieza abre la variante sin pasar por
     ahí, y la flecha se quedaba pegada. Lo reportó el usuario. Como con las
     marcas, en vez de acordarse de apagarlo en cada camino se guarda de qué
     jugada es y se tira acá, que es por donde pasan todos. */
  if (RESALTA && (PRUEBA || RESALTA.de !== IDX)) RESALTA = null;
  /* La explicación se ARMA acá y se deriva de la fila, no viene guardada: una
     partida que ya estaba en la caché la estrena sin volver a correr el motor.
     El SAN de la mejor va en null cuando la jugada ya era la mejor, porque ahí
     no hay alternativa que ofrecer. */
  const ladoUsr = ladoDelUsuario(R);
  /* SALIR DEL LIBRO se sabe mirando la fila ANTERIOR: la teoría se terminó en
     la primera jugada que ya no está en el libro, viniendo de una que sí. La
     categoría alcanza para preguntarlo —`categorizar` devuelve "libro" antes
     que ninguna otra cosa, así que vale en los dos modos— y así el dato no
     necesita un campo nuevo en la fila. */
  const salioDelLibro = IDX > 0 && R.filas[IDX - 1].cat === "libro" && f.cat !== "libro";
  /* EL RIVAL ACABABA DE ERRAR: la fila anterior, que es del otro color por
     definición —las filas alternan—, cayó en una de las tres categorías malas.
     La imprecisión NO cuenta: "el rival acababa de errar" por una imprecisión
     de 0,3 es prometer más de lo que pasó. */
  const antesF = IDX > 0 ? R.filas[IDX - 1] : null;
  const rivalErro = !!antesF && antesF.turno !== f.turno &&
                    ["error", "grave", "omision"].includes(antesF.cat);
  const partes = enInicio ? [] : partesDeLaExplicacion(f, f.mejor === f.uci ? null : sanDeLaMejor(IDX),
                                       ladoUsr ? f.turno === ladoUsr : null,
                                       sanDeUci(f.fen, f.mejorRival),
                                       observarJugada(f, fenDeLaJugada(IDX)),
                                       { ranuras: ranurasDeLaExplicacion(),
                                         salioDelLibro, rivalErro });
  /* el nombre de la apertura hasta acá, en las de libro (v0.159, arriba de
     `aperturaHastaAca`): "cambia" lo pone EN LUGAR de la frase; "siempre",
     antes. La tarjeta reserva dos renglones (v0.149), y medido a 386 con el
     nombre más largo y una frase entran. */
  if (!enInicio && f.cat === "libro" && LIBRO) {
    const claves = R.filas.slice(0, IDX + 1).map(x => claveLibro(x.fen));
    const fr = fraseDeApertura(aperturaHastaAca(claves, LIBRO.nombres), NOMBRE_AP);
    if (fr) partes.splice(0, NOMBRE_AP === "siempre" ? 0 : partes.length, { txt: fr });
  }
  const explicado = partes.map(p => p.txt).join(" ");
  /* En la posición inicial la tarjeta no juzga nada: sin símbolo, con el borde
     de la línea y no de una categoría, y dice qué es y a quién le toca. */
  const color = enInicio ? "var(--linea)" : `var(--c-${c.clave})`;
  $("veredicto").style.borderLeftColor = color;
  $("vIco").textContent = enInicio ? "" : c.icono;
  $("vIco").style.color = color;
  $("vIco").classList.toggle("oculto", enInicio);
  $("vTit").textContent = enInicio ? "Posición inicial"
    : `${f.n}${f.turno === "w" ? "." : "..."} ${f.san} \u2014 ${c.nombre}`;
  /* UN SOLO RENGLÓN ABAJO DEL TÍTULO, y qué dice depende de si hay algo que
     decir: la explicación de esta jugada, o la frase fija de la categoría
     cuando no la hay. Nunca las dos, que era el eco de la v0.44.
     La explicación va con la tinta del texto normal y con su concepto tocable;
     la frase fija va en gris, porque es la misma para 400 jugadas.

     LOS NÚMEROS SE FUERON EN LA v0.72. "pierde 0.00" es exactamente el cuadrito
     PÉRDIDA y "0.0 puntos de victoria" es exactamente CAÍDA, los tres a un dedo
     de distancia en la misma pantalla. Lo vio el usuario.
     Con ellos se fue también el caso especial de la forzada (v0.54): existía
     para que una jugada sin elección no mostrara números, y ahora no los
     muestra ninguna. */
  const hayExp = !!explicado;
  $("vSub").textContent = hayExp ? ""
    : enInicio ? (f.turno === "w" ? "Juegan las blancas." : "Juegan las negras.") : c.desc;
  $("vSub").classList.toggle("oculto", hayExp);
  if (hayExp) pintarExplicacion("vExp", partes, !PRUEBA); else $("vExp").innerHTML = "";
  $("vExp").classList.toggle("oculto", !hayExp);
  /* si el número ya viaja en la barra, la tarjeta no lo repite */
  $("vEv").textContent = MODO_EVAL === "tarjeta" ? f.evalTexto : "";

  /* el rival y su elo salen de las cabeceras del PGN; si la partida no las
     trae (un PGN pegado a mano puede no traerlas) se muestra lo que haya */
  const yo = ladoDelUsuario(R);
  const fin = comoTermino(R.cab, R.meta);
  if (yo) {
    const rival = (yo === "w" ? R.cab.Black : R.cab.White) || "";
    const elo = (yo === "w" ? R.cab.BlackElo : R.cab.WhiteElo) || "";
    pintarCabPartida(rival, elo, PALABRA_FIN[resultadoDeLado(yo, R.meta, R.cab)], R.apertura);
  } else {
    /* con un PGN pegado no se sabe de qué lado jugaba el usuario, así que no hay
       "rival": se nombran los dos, que es más útil que dejar el renglón vacío */
    pintarCabPartida([R.cab.White, R.cab.Black].filter(Boolean).join(" vs "), "",
                     fin ? fin.res : "", R.apertura);
  }
  /* El contador "jugada N de M" se fue en la v0.62bis. Contaba MEDIAS jugadas,
     así que la misma posición tenía dos números en la misma pantalla: la
     tarjeta decía "18… Kg8" y el contador "36 de 36". Y lo que hacía —ubicarte
     en la partida— lo hacen mejor la tarjeta, que da la jugada en el idioma del
     ajedrez, y la raya del "estás acá" de la curva, que la da en proporción.
     Al sacarlo queda UN SOLO sistema de numeración en toda la vista. */

  /* La barra se llena con lo que le toca a las blancas, y acompaña al tablero
     cuando se gira. El número va en la punta del que va ganando, que es donde
     lo busca el ojo. */
  /* Los tres casos y sus porqués están en `llenadoBarra`, que es puro y por eso
     se puede probar en node sin un DOM. */
  /* CON UNA VARIANTE, LA BARRA ES DE LA VARIANTE (v0.165; Juan, 18-nov: "cuando
     se prueban jugadas no se mueve la barra de evaluación"). Leía siempre la
     jugada de la partida. Ahora lee la última jugada probada que ya tiene
     evaluación, hasta la que se está mirando: mientras el motor piensa, queda
     donde estaba, y en el arranque de la variante es la de la partida, que es
     la misma posición. */
  /* SIN NINGUNA EVALUADA, la posición donde arranca la variante (`desde0`), y
     NO `f`: entrando por "probar otra en su lugar" la variante arranca ANTES de
     la jugada, y `f` es la evaluación de después (revisor de ajedrez: -4.13
     sobre un tablero que vale -2.47). */
  let fb = f;
  if (PRUEBA) {
    fb = filaDePosicion(PRUEBA.desde0) || f;
    for (let k = PRUEBA.ver - 1; k >= 0; k--)
      if (PRUEBA.linea[k].fila) { fb = PRUEBA.linea[k].fila; break; }
  }
  /* PENSANDO, EL NÚMERO DICE "…" (v0.167, revisor): el relleno queda quieto
     donde estaba, pero el número no puede afirmar la evaluación de la jugada
     anterior sobre el tablero de la nueva. La misma marca que el cuadrito Mejor. */
  const eB = PRUEBA && PRUEBA.ver > 0 ? PRUEBA.linea[PRUEBA.ver - 1] : null;
  const numB = eB && !eB.fila && !eB.error ? "\u2026" : fb.evalTexto;
  const pct = llenadoBarra(fb);
  const gananBlancas = pct >= 50;
  const modo = MODO_EVAL;

  $("evalbar").classList.toggle("oculto", modo === "horizontal");
  $("evalbar").classList.toggle("ancha", modo === "barra");
  $("evalbar").classList.toggle("girada", GIRADO);
  $("evalfill").style.height = pct + "%";

  $("evalh").classList.toggle("oculto", modo !== "horizontal");
  /* y el tablero se cobra el alto que la barra horizontal deja de gastar */
  $("zonaRevision").classList.toggle("sinEvalH", modo !== "horizontal");
  $("evalfillh").style.width = pct + "%";

  /* claro sobre el relleno, oscuro sobre el fondo: el número siempre contrasta */
  const tinta = gananBlancas ? "var(--fondo)" : "var(--texto)";
  const nv = $("evalnum"), nh = $("evalnumh");
  nv.textContent = modo === "barra" ? (numB === "\u2026" ? numB : textoBarra(numB)) : "";
  /* EL NÚMERO LARGO SE ACORTA, NO SE ACHICA (v0.105). La barra recorta lo que
     sobra SIN AVISAR, porque tiene `overflow: hidden` por las esquinas del
     relleno: "+10.00" a 11 no entra. Hasta la v0.104 se achicaba la letra a 8;
     ahora `textoBarra()` le saca un decimal y la letra queda en el mínimo. */
  nv.style.color = tinta;
  /* con el tablero girado las blancas quedan arriba, así que su punta también */
  const blancasArriba = GIRADO;
  const arriba = gananBlancas === blancasArriba;
  nv.style.top = arriba ? "3px" : "auto";
  nv.style.bottom = arriba ? "auto" : "3px";

  nh.textContent = modo === "horizontal" ? numB : "";
  nh.style.color = tinta;
  nh.style.top = "50%";
  nh.style.transform = "translateY(-50%)";
  nh.style.left = gananBlancas ? "6px" : "auto";
  nh.style.right = gananBlancas ? "auto" : "6px";

  $("veredicto").classList.toggle("invertida", modo === "tarjeta");

  /* en la inicial no hay jugada: pérdida, caída y tiempo no existen */
  /* CON UNA VARIANTE, PÉRDIDA Y CAÍDA SON DE LA JUGADA PROBADA (v0.166,
     revisor de ajedrez): la tarjeta decía "4. Qg6 — Omisión · pierde 7.67" y
     el cuadrito de abajo "3.43", la de la partida. Pensando, "…"; en el
     arranque de la variante o si falló, "—". Pensó, siempre "—": una jugada
     inventada no gastó reloj. */
  const eP = PRUEBA && PRUEBA.ver > 0 ? PRUEBA.linea[PRUEBA.ver - 1] : null;
  const fP = eP && eP.fila;
  /* con variante manda la probada, aunque arranque en la inicial (revisor) */
  const sinJugada = PRUEBA ? !fP : enInicio;
  const raya = PRUEBA && eP && !eP.fila && !eP.error ? "\u2026" : "\u2014";
  $("mPerdida").textContent = sinJugada ? raya : (fP || f).perdida.toFixed(2);
  /* UN DECIMAL, no cero. El cuadrito redondeaba —"21 pt"— mientras la tarjeta
     decía "20.9 puntos de victoria"; cuando los números se fueron de la tarjeta
     en la v0.72, ese decimal se perdía. Y no es adorno: la caída es la medida en
     la que se apoyan el modo amigable y la precisión, así que redondearla a
     entero borra la diferencia entre una imprecisión y una jugada buena en el
     rango donde más se parecen. La pérdida, al lado, siempre tuvo dos. */
  $("mCaida").textContent = sinJugada ? raya : (fP || f).caida.toFixed(1) + " pt";
  /* `f.seg` ya viajaba en la fila desde la v0.43 y no lo usaba nadie más que
     las tablas. `tiempoCorto` pone el "·" cuando la partida no trae relojes
     —correspondencia, o un PGN pegado a mano—, así que el cuadrito no cambia de
     forma entre partidas. */
  /* SIN RELOJ SE DICE (v0.131): el "·" de `tiempoCorto` era un glifo para
     descifrar, y "—" dice "todavía no", que es otra cosa. Las tablas siguen
     con el "·", que ahí tiene su leyenda. */
  const sinReloj = !enInicio && !PRUEBA && f.seg == null;
  $("mPenso").textContent = enInicio || PRUEBA ? "\u2014" : sinReloj ? "sin reloj" : tiempoCorto(f.seg);
  $("mPenso").classList.toggle("sinDato", sinReloj);
  /* En la inicial la fila es Mejor y una leyenda: no promete el tiempo si la
     partida no trae relojes, porque ese dato no va a llegar nunca. */
  const leyenda = enInicio && !fP;   /* con una probada en la inicial, los cuadritos */
  $("mLeyenda").closest(".metricas").classList.toggle("enInicio", leyenda);
  /* EN UNA JUGADA DE LIBRO LA FILA ES LA DE SIEMPRE (v0.173). La v0.172 cambiaba
     Pérdida y Caída por una leyenda y Juan la hizo volver: *"me parece una
     banda cambiar toda esa parte de la UI cuando es apertura"*. DISENO.md §3. */
  if (leyenda)
    $("mLeyenda").textContent = R.filas.some(x => x.seg != null)
      ? "Pérdida, caída y lo que pensó, desde la primera jugada."
      : "Pérdida y caída, desde la primera jugada.";
  /* Cuando la jugada jugada YA era la mejor no hay nada distinto que mostrar.
     El cuadrito se grisa y deja de responder: sin eso parecia que tocarlo no
     hacia nada, o sea un bug. */
  /* EN LA VARIANTE el tablero sigue a la variante, y fuera de ella es el de
     siempre. La flecha AZUL es la jugada de la partida que sale de la posición
     que se está viendo: existe parado en el arranque de la variante —ahí se
     compara contra lo que pasó de verdad— y no existe más adentro, donde la
     partida ya no pasa por ahí. */
  const vista = PRUEBA && posicionVista();
  const real = jugadaReal();
  /* LA FLECHA VERDE ES LA MEJOR DE LA POSICIÓN QUE SE ESTÁ VIENDO, no la de la
     jugada de la partida (v0.94). Antes era `f.mejor` y se apagaba adentro de la
     variante, y eso tapaba dos cosas que el usuario reportó:

     - probando una jugada no aparecía nunca la mejor, que es justo lo que uno
       quiere ver ahí. Se apagaba a propósito y con un motivo bueno —dibujar la
       mejor de la posición ORIGINAL sobre una posición inventada es mentira—,
       pero el dato bueno ya lo teníamos: cada jugada de la variante guarda su
       evaluación, y ahí viene la mejor de esa posición nueva;
     - abriendo la prueba TOCANDO UNA PIEZA la flecha verde se quedaba pegada a
       la posición de antes: la variante arranca de la de después (`desde0` es
       IDX + 1) y la verde seguía siendo la de IDX. Medido en la v0.84: mismas
       coordenadas con el tablero ya mostrando otra posición.

     `vista.ev` queda en null mientras el motor piensa la jugada recién probada,
     y entonces no hay verde hasta que conteste, que es lo correcto: no la
     sabemos todavía. */
  const mejorVista = PRUEBA ? (vista.ev && vista.ev.mejor) || null : f.mejor;
  /* DESDE QUÉ POSICIÓN SALE ESA MEJOR, que fuera de la variante NO es la que se
     está dibujando: el tablero muestra la posición de DESPUÉS de la jugada y la
     mejor es de la de ANTES. Traducirla a notación con el FEN del tablero da
     `a2a3` crudo en vez de `a3`, porque la jugada no es legal ahí. Adentro de la
     variante las dos son la misma, y por eso la distinción se ve una sola vez. */
  const fenDeLaMejor = PRUEBA ? vista.fen : enInicio ? f.fen : fenDeLaJugada(IDX);
  /* La jugada de la partida que se dibuja en azul, si hay alguna. */
  const uciAzul = PRUEBA ? (PRUEBA.ver === 0 && real ? real.uci : null) : f.uci;
  /* Cuando la mejor ES la que se dibuja en azul no hay nada distinto que
     mostrar, y ahí el cuadrito se grisa y deja de responder: sin eso parecía
     que tocarlo no hacía nada, o sea un bug. */
  const verMejor = VER_MEJOR && !!mejorVista && mejorVista !== uciAzul;
  /* Los colores no se mezclan nunca: AZUL es una jugada de la partida y VIOLETA
     una inventada. Parado en el arranque de la variante hay azul —lo que se
     jugó de verdad desde ahí— y no hay violeta; una jugada adentro, al revés,
     porque la partida ya no pasa por esa posición. */
  /* La capa va SIEMPRE, porque el resaltado de la explicación existe se esté
     probando o no. Los campos de la variante quedan en null fuera de ella. */
  const capa = {
    desde: PRUEBA ? PRUEBA.desde : marcada() ? marcada().desde : null,
    destinos: PRUEBA ? PRUEBA.destinos : marcada() ? marcada().destinos : [],
    uci: PRUEBA && PRUEBA.ver ? PRUEBA.linea[PRUEBA.ver - 1].uci : null,
    resalta: RESALTA,
    /* los galones, con la misma regla que "‹" y "›" (abajo de todo) */
    sinAtras: PRUEBA ? PRUEBA.ver === 0 : IDX < 0,
    sinAdelante: PRUEBA ? PRUEBA.ver === PRUEBA.linea.length : IDX === R.filas.length - 1
  };
  /* LAS MARCAS DEL USUARIO SE VAN ACÁ, y por eso no hay que acordarse de
     borrarlas en ningún otro lado: cada camino que cambia lo que muestra el
     tablero —navegar, probar, girar, entrar y salir de la variante— termina en
     esta función. Una flecha pertenece a UNA posición; arrastrarla a la
     siguiente sería señalar en un tablero que ya no es el que se dibujó. */
  MARCAS_TAB = [];
  /* UNA SOLA VARIABLE para la posición que se dibuja, así la tira de comidas no
     puede desincronizarse del tablero: las dos leen exactamente el mismo FEN. */
  const fenVisto = FEN_VISTO = PRUEBA ? vista.fen : f.fen;
  $("tablero").innerHTML =
    dibujar(fenVisto, uciAzul, verMejor ? mejorVista : null, capa);
  pintarComidas(fenVisto);
  pintarAlternativas();
  /* lo que había guardado la previa ya no existe: este es el tablero nuevo. Y
     la que estuviera esperando para aparecer se corta: llegaría tarde y lo
     pisaría */
  TABLERO_PREVIO = null;
  PREVIA_I = null;
  clearTimeout(PREVIA_T);
  /* EL CUADRITO NOMBRA LO QUE DIBUJA LA FLECHA, así que sigue a la misma
     posición que ella: si dijera la mejor de la partida mientras la verde
     muestra la de la variante, serían dos jugadas distintas a un dedo de
     distancia en la misma pantalla. `sanDeUci` traduce en CUALQUIER posición,
     que es lo que `sanDeLaMejor` —atada a una fila de la partida— no puede.
     Sin alternativa que ofrecer el cuadrito se grisa y deja de responder: sin
     eso parecía que tocarlo no hacía nada, o sea un bug. */
  const sinAlternativa = !mejorVista || mejorVista === uciAzul;
  /* "Todavía no" y "no hay" no son lo mismo: el motor está pensando la jugada
     que se acaba de probar, o la variante llegó a un mate y no hay jugada. */
  const pensando = !!PRUEBA && !vista.ev && !(eP && eP.error);   /* falló: "—" */
  $("mMejor").title = mejorVista || "";
  /* prendido según la PREFERENCIA y no según si hay flecha: en una jugada que
     ya era la mejor no hay flecha que dibujar, pero el interruptor sigue
     puesto y tiene que verse. */
  $("tileMejor").classList.toggle("activo", VER_MEJOR);
  $("tileMejor").setAttribute("aria-pressed", VER_MEJOR ? "true" : "false");
  $("tileMejor").classList.toggle("inerte", sinAlternativa);
  $("mMejor").textContent = pensando ? "\u2026"
    : !mejorVista ? "\u2014"
    : mejorVista === uciAzul ? "la jugada"
    : (sanDeUci(fenDeLaMejor, mejorVista) || mejorVista);
  /* "la juga…" no se lee (revisor, v0.150): a 1000 de ancho el cuadrito queda
     1 px corto. Si no entra, "esta", que entra siempre; donde entra (el celu,
     y la compu desde ~1010) sigue diciendo "la jugada", como las tres
     mejores (v0.182.2) */
  if ($("mMejor").textContent === "la jugada" && $("mMejor").scrollWidth > $("mMejor").clientWidth)
    $("mMejor").textContent = "esta";

  /* por defecto solo se pintan las jugadas propias: las del rival distraen de
     lo que el usuario vino a mirar. Con "Rival" prendido se ven todas. */
  const lado = ladoDelUsuario(R);
  const celda = (x, i, sel) => {
    if (!x) return "";
    const mia = !lado || VER_AMBOS || x.turno === lado;
    const p = presentar(x);
    const col = mia ? `var(--c-${p.clave})` : "var(--tenue)";
    /* El símbolo de la categoría en vez de un punto de color. El punto obligaba
       a distinguir tonos a 7 px, y tres de las diez categorías comparten un
       verde que solo cambia de luminosidad: eran indistinguibles. El símbolo se
       lee a cualquier tamaño y no depende del color, así que también sirve para
       quien no distingue verde de rojo. El color se queda como refuerzo. */
    return `<span class="jg ${i === sel ? "sel" : ""}" data-i="${i}" style="color:${col}` +
      `${mia ? "" : ";opacity:.55"}"><span class="sm">${p.icono}</span>` +
      `<span class="sa">${x.san}</span></span>`;
  };
  /* El número de jugada acompaña a la de las BLANCAS, como se escribe una
     partida. La primera de la tira lo lleva igual aunque sea de las negras, o
     no se sabría en qué jugada arranca lo que se está viendo. */
  $("curva").innerHTML = dibujarCurva(R.filas, IDX, lado, VER_AMBOS);
  /* CON LA FORMA "abajo" LA TIRA CORTA donde se abrió la prueba y sigue con lo
     inventado, en violeta: una sola tira y un solo sistema de navegación. Lo
     jugado de verdad queda a la izquierda del corte y se llega scrolleando,
     igual que a todo el resto de la tira. Y la elegida pasa a ser una de la
     variante, así que ninguna de la partida queda marcada: si no, habría dos
     "estás acá" en el mismo renglón. El cierre —cómo terminó la partida— no va
     mientras se prueba: esa partida no termina así. */
  const fp = formaPrueba();
  const varAbajo = !!(PRUEBA && PRUEBA.linea.length && fp.lista === "abajo");
  /* EN LA COMPU LA VARIANTE VA EN LA PLANILLA (v0.171), debajo de la jugada
     de donde sale, y entonces SALE DE LA TIRA: con las dos, la misma jugada
     quedaba marcada "estás acá" en dos lugares a un palmo (revisor). La tira
     muestra la partida sin marca y sin cierre, y sus ‹ › siguen recorriendo
     la variante. En el celu no cambia nada: ahí la tira es lo único que hay. */
  const alPanel = window.matchMedia(CORTE_ANCHO).matches && !!formaJugadas().clase;
  const varEnLista = varAbajo && alPanel && formaJugadas().clase === "planilla";
  const varEnTira = varAbajo && !varEnLista;
  const hasta = varEnTira ? PRUEBA.desde0 : R.filas.length;
  const selTira = varAbajo && PRUEBA.ver > 0 ? -1 : IDX;
  $("tiraSc").innerHTML = R.filas.slice(0, hasta).map((x, i) =>
    /* una partida desde una posición puede arrancar con negras: "23…" (v1.5) */
    (x.turno === "w" || i === 0 ? `<span class="np">${x.n}${x.turno === "w" ? "." : "\u2026"}</span>` : "") +
    celda(x, i, selTira)).join("") +
    (varEnTira ? laVarianteEnLaTira() : varAbajo ? "" : cierreDeLaTira(fin, R.filas));
  $("tiraSc").querySelectorAll("span[data-i]").forEach(sp => {
    sp.onclick = () => irA(+sp.dataset.i);
    previaEn(sp, +sp.dataset.i);
  });
  $("tiraSc").querySelectorAll("span[data-v]").forEach(sp => {
    sp.onclick = () => verDeLaVariante(+sp.dataset.v);
  });
  /* EN LA COMPU LA TIRA VIVE AL PIE DE LA LISTA (v0.125), y se muda por DOM
     porque está adentro de `.pmedio`, que la grilla no puede partir. Sin lista
     (el dial en "no") vuelve abajo del tablero, que es su lugar en el celu. Con
     una variante en la forma "abajo" se muestra entera: es donde se ve. */
  const tiraEl = $("tira");
  if (alPanel && tiraEl.parentElement !== $("lateral")) $("lateral").append(tiraEl);
  else if (!alPanel && tiraEl.parentElement === $("lateral")) document.querySelector(".pmedio").append(tiraEl);
  /* (desde la v0.171, solo si la variante va en la tira: en la compu va en la
     planilla y la tira del pie se queda con "‹ ›", igual que sin variante) */
  $("zonaRevision").classList.toggle("conVariante", varEnTira);
  medirTira();
  centrarTira();
  /* en la inicial no hay jugada elegida: la tira arranca del principio */
  if (enInicio && !PRUEBA) $("tiraSc").scrollLeft = 0;

  /* LA LISTA LATERAL (v0.80), en la columna que solo existe en pantalla ancha.
     `celda` es LA MISMA que pinta la tira: una jugada se ve igual en los dos
     lados, y el símbolo y el color no viven en dos lugares que después se
     despegan. `selTira` también es el mismo, así que probando una variante con
     la forma "abajo" no queda una jugada marcada en la lista y otra en la tira.
     La lista muestra SIEMPRE la partida de verdad, nunca la variante: al lado
     del tablero es la referencia de lo que pasó, y la inventada ya se ve en la
     tira y en el tablero. */
  /* Los segundos de una jugada, con la misma atenuación que su jugada: si el
     rival se ve apagado, su reloj también. La celda va SIEMPRE, aunque no haya
     jugada, o la grilla se corre de columna en la última fila de una partida
     que termina con blancas. */
  const segundos = x => !x ? `<span class="se"></span>`
    : `<span class="se"${(!lado || VER_AMBOS || x.turno === lado) ? "" : ` style="opacity:.55"`}` +
      ` title="segundos pensados">${tiempoCorto(x.seg)}</span>`;
  const fj = formaJugadas();
  $("zonaRevision").classList.toggle("solaTira", !fj.clase);
  if (fj.clase) {
    const lista = $("jugadas");
    lista.className = "jugadas " + fj.clase;
    if (fj.clase === "planilla") {
      /* se agrupa por número de jugada y NO de a dos por posición: si la
         partida arranca con negras —un PGN desde una posición— el par queda
         igual. Es la misma regla que tenía la lista de la v0.73. */
      const pares = new Map();
      R.filas.forEach((x, i) => {
        if (!pares.has(x.n)) pares.set(x.n, {});
        pares.get(x.n)[x.turno] = { x, i };
      });
      lista.innerHTML = [...pares.entries()].map(([num, par]) => {
        const aca = (par.w && par.w.i === selTira) || (par.b && par.b.i === selTira);
        return `<div class="${aca ? "aca" : ""}"><span class="np">${num}</span>` +
          celda(par.w && par.w.x, par.w && par.w.i, selTira) + segundos(par.w && par.w.x) +
          celda(par.b && par.b.x, par.b && par.b.i, selTira) + segundos(par.b && par.b.x) +
          `</div>`;
      }).join("") + (varEnLista ? "" : cierreDeLaTira(fin, R.filas));
      if (varEnLista) {
        const desde = lista.querySelector(`span[data-i="${PRUEBA.desde0}"]`);
        const html = laVarianteEnLaPlanilla();
        if (desde) desde.parentElement.insertAdjacentHTML("afterend", html);
        else lista.insertAdjacentHTML("beforeend", html);
        lista.querySelectorAll("span[data-v]").forEach(sp => {
          sp.onclick = () => verDeLaVariante(+sp.dataset.v);
        });
      }
    } else {
      /* el número acompaña a la de las BLANCAS, igual que en la tira y que como
         se escribe una partida: repetirlo en las dos filas del par sería decir
         dos veces lo mismo. */
      lista.innerHTML = R.filas.map((x, i) =>
        `<div class="${i === selTira ? "aca" : ""}">` +
        `<span class="np">${x.turno === "w" ? x.n + "." : i === 0 ? x.n + "\u2026" : ""}</span>` +
        celda(x, i, selTira) +
        `<span class="pe"${(!lado || VER_AMBOS || x.turno === lado) ? "" : ` style="opacity:.55"`}>` +
        `${typeof x.perdida === "number" ? x.perdida.toFixed(2) : ""}</span>` +
        segundos(x) +
        `</div>`).join("") + cierreDeLaTira(fin, R.filas);
    }
    lista.querySelectorAll("span[data-i]").forEach(sp => {
      sp.onclick = () => irA(+sp.dataset.i);
      previaEn(sp, +sp.dataset.i);
    });
    lista._ultima = selTira === R.filas.length - 1;
    lista._inicio = enInicio && !PRUEBA;
    acomodarLista(lista);
    if (!lista.dataset.mas) {
      lista.dataset.mas = "1";
      lista.addEventListener("scroll", () => marcarMas(lista), { passive: true });
      /* y se vuelve a acomodar cuando la caja cambia de alto: otra ventana, o
         la pestaña Jugadas que vuelve después de pasar jugadas en Resumen
         (revisor de UX, v1.7: a 1366 la 15 quedaba fuera de vista) */
      if (window.ResizeObserver) new ResizeObserver(() => {
        if (lista.clientHeight !== lista._alto) { lista._alto = lista.clientHeight; acomodarLista(lista); }
        marcarMas(lista);
      }).observe(lista);
    }
    marcarMas(lista);
    /* LA LISTA NO PUEDE SER MÁS ALTA QUE LA COLUMNA DE AL LADO (v0.88), y esto
       es lo que paga que la curva cruce las dos columnas. La curva pasó a ser
       una fila propia de la grilla, así que ARRANCA DEBAJO DE LA MÁS ALTA de las
       dos: con la lista libre —una partida de 40 jugadas son 2000 px de
       renglones contra un tope de `100vh - 28`— la más alta era la lista, y la
       curva se iba abajo del pliegue. Eso es exactamente lo que la v0.80 no
       quería: la tira y la curva son la navegación.
       El tope sale de MEDIR la columna y no de una cuenta, porque su alto
       depende del tablero, que depende del alto de la ventana y de qué barra de
       evaluación esté puesta. La lista ya scrolleaba sola, así que lo único que
       cambia es que empieza a scrollear un poco antes. */
    /* DEL TECHO DE `.parriba` AL PISO DE `.pmedio`, y no el alto de un bloque:
       desde la v0.90 la columna del tablero son dos o tres bloques y cuáles
       depende del ancho de la pantalla —en tres columnas la tarjeta se va al
       costado y deja de contar—. Medir de punta a punta sirve para las dos
       formas sin preguntar cuál está puesta. */
    const cA = document.querySelector(".parriba"), cB = document.querySelector(".pmedio");
    if (cA && cB) {
      /* SE MIDE CON LA LISTA AFUERA, y esto no es prolijidad: la lista cruza las
         filas de la grilla, así que si es más alta las estira, y medir de punta
         a punta estaría midiendo la lista misma. El tope de la lista sale de
         esta medida, o sea que se estaría midiendo contra sí misma: la primera
         pintada, cuando todavía no hay medida y vale el `100vh` de reserva, la
         deja inflada y ya no baja nunca. Sacarla un instante corta el nudo. El
         navegador pinta al terminar esta función, así que no se ve nada.
         DEL TECHO DE `.parriba` AL PISO DE `.pmedio` y no el alto de un bloque:
         desde la v0.90 la columna del tablero son dos o tres bloques, y cuáles
         depende del ancho —en tres columnas la tarjeta se va al costado y deja
         de contar—. Punta a punta sirve para las dos formas sin preguntar. */
      const lat = $("lateral"), antes = lat.style.display;
      lat.style.display = "none";
      const alto = Math.round(cB.getBoundingClientRect().bottom - cA.getBoundingClientRect().top);
      lat.style.display = antes;
      $("zonaRevision").style.setProperty("--altoCol", alto + "px");
    }
    /* El panel de las mejores también le come alto a la lista, y cuánto depende
       de si está abierto: se mide igual que la columna. EL MARGEN VA INCLUIDO y
       se lee del CSS en vez de repetirlo acá: `offsetHeight` no lo cuenta, y sin
       eso la lista quedaba 10 px más alta que la columna, empujaba la curva y le
       comía el aire de abajo. Medido: 25 px de aire pasaban a ser 15. */
    const pa = $("alts");
    const mb = parseFloat(getComputedStyle(pa).marginBottom) || 0;
    $("zonaRevision").style.setProperty("--altoAlts", (pa.offsetHeight + mb) + "px");
  }

  /* LA LISTA DE SEÑALES SE FUE EN LA v0.73, y el motivo es de disposición: era
     un renglón que aparecía y desaparecía entre los cuadritos y la curva, así
     que la curva y la lista de jugadas SALTABAN unos píxeles al pasar de una
     jugada a la otra. Una pantalla que se mueve sola se lee peor que una que
     dice menos.

     Y no dice menos: se midieron 405 jugadas de las cuatro partidas de prueba,
     con evaluaciones variadas para caer en muchas categorías, y de las 29 que
     traían señales NO HUBO NINGUNA que la explicación de la tarjeta no dijera
     —y mejor, porque la explicación nombra la pieza y la casilla—. La prueba
     que lo fija corre ese mismo barrido.

     Lo único que la explicación no dice es la SEGUNDA OPINIÓN a más
     profundidad, que no es una señal sino un dato del análisis. Por eso el
     renglón sigue existiendo solo para eso, y como el barrido está apagado en
     modo simple, en la app del usuario no aparece nunca: la disposición no se
     mueve. */
  const abajo = f.rev
    ? `\u00b7 a profundidad ${f.rev.prof}: pierde ${f.rev.perdida.toFixed(2)} ` +
      `y es ${CATEGORIAS[f.rev.cat].nombre.toLowerCase()}`
    : "";
  $("senales").textContent = abajo;
  $("senales").classList.toggle("oculto", !abajo);
  /* La tarjeta de la variante. Sin variante abierta no existe, y la pantalla
     queda exactamente como antes de la v0.65. */
  $("prueba").classList.toggle("oculto", !PRUEBA);
  /* LA PUNTEADA REEMPLAZA A LA REAL (v0.76): con una prueba abierta había dos
     tarjetas apiladas, y el usuario las quiso una. Cuesta poco: la comparación
     contra lo que se jugó de verdad ya viaja en la punteada —"pierde 0.00 · en
     la partida exd4 pierde 0.12"— y de la segunda jugada de la variante en
     adelante no hay contra qué comparar, así que ahí la real no decía nada.
     Desde la v0.160 es así en las dos formas del dial. */
  $("veredicto").classList.toggle("oculto", !!PRUEBA);
  if (PRUEBA) {
    const t = textoPrueba(R.profBase || +$("prof").value || 16);
    $("prueba").style.borderLeftColor = t.color;
    $("pIco").textContent = t.ico;
    $("pIco").style.color = t.color;
    $("pTit").textContent = t.tit;
    $("pSub").textContent = t.sub;
    $("pExp").textContent = t.exp;   /* vacía y a la vista: guarda su lugar (v0.164) */
  }
  /* EL BOTÓN NOMBRA LA JUGADA que reemplaza —"En vez de Re1"—: sin eso no dice
     desde qué posición arranca, y el tablero saltando una jugada atrás al
     tocarlo se lee como un error. Con la variante abierta, es la única salida.

     Y CUÁL DE LOS DOS ES EL GRANDE LO DECIDE EL VEREDICTO, que es lo primero
     que se ve en la revisión de chess.com: con la jugada buena, seguir; con la
     jugada mala, probar otra. El botón deja de ser una opción escondida y pasa
     a ser lo que la app te propone hacer, que es justo lo que le faltaba: la
     jugada mala es la que da ganas de probar otra cosa. */
  ubicarGirar(f);
  /* Adentro de la variante, "anterior" y "siguiente" se mueven POR LA
     VARIANTE. Es la misma promesa de siempre —la posición anterior y la
     siguiente— y no dos botones que significan una cosa u otra según dónde
     estés: lo que cambia es qué línea se está recorriendo. De la partida se
     sale por el botón, que es lo único que dice "volver". */
  $("ant").disabled = PRUEBA ? PRUEBA.ver === 0 : IDX < 0;
  $("sig").disabled = PRUEBA ? PRUEBA.ver === PRUEBA.linea.length
                             : IDX === R.filas.length - 1;
}


/* Pasar jugadas es lo que más se repite en esta pantalla, así que además de
   los botones se puede deslizar sobre el tablero, como en cualquier tablero
   digital. Es un atajo, no el camino: los botones siguen ahí para el que no
   descubre el gesto.
   No se llama preventDefault en touchmove a propósito: bloquearía el scroll
   vertical de la página, que es cómo se llega al resto de la vista. */
let tocado = null, recienDeslizado = 0, recienArrastrado = 0, tocadoConElDedo = { t: 0, sq: null };
$("tablero").addEventListener("touchstart", ev => {
  const t = ev.changedTouches[0];
  tocado = { x: t.clientX, y: t.clientY };
}, { passive: true });
/* ARRASTRAR CON EL DEDO (v0.169): si el dedo se apoya en una pieza que puede
   mover, el `touchstart` le saca el gesto al navegador —ni scroll ni
   deslizamiento— y lo sigue el arrastre de piezas, que es también el que
   atiende el toque quieto (el navegador ya no manda el click). Es lo que hacen
   los tableros de internet. `touch-action: none` no sirve acá: Chrome no lo
   lee en las casillas, que son `<rect>` de un SVG (medido: la página
   scrolleaba). Con el motor ocupado no se corta nada: no se puede jugar. */
$("tablero").addEventListener("touchstart", ev => {
  if (!TRABAJANDO && ev.cancelable && ev.target.closest && ev.target.closest("[data-mueve]"))
    ev.preventDefault();
}, { passive: false });
$("tablero").addEventListener("touchend", seguro("deslizar", ev => {
  if (!tocado || !R) return;
  const t = ev.changedTouches[0];
  const dx = t.clientX - tocado.x, dy = t.clientY - tocado.y;
  tocado = null;
  /* arrastrar una pieza con el dedo no es deslizar (v0.169) */
  if (Date.now() - recienArrastrado < 400) return;
  /* pide un gesto claramente horizontal: si no, un scroll con el dedo apoyado
     en el tablero pasaría jugadas sin querer */
  if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
  /* el navegador dispara un click al terminar el toque; sin esta marca, un
     deslizamiento que termina sobre un galón pasaría dos jugadas */
  recienDeslizado = Date.now();
  /* Adentro de la variante el deslizamiento la recorre a ella, igual que los
     botones: es el mismo gesto para la misma promesa. */
  if (dx < 0) adelante(); else atras();
}), { passive: true });

/* Los galones. El SVG se redibuja entero en cada jugada, así que el que escucha
   es el contenedor y no cada galón: si no, habría que volver a atar el evento
   cada vez. */
$("tablero").addEventListener("click", seguro("tablero", ev => {
  const sq = ev.target.closest && ev.target.closest("[data-sq]");
  if (!sq) return;
  /* el navegador dispara un click al terminar el toque; sin esta marca, un
     deslizamiento que termina sobre el tablero elegiría una casilla sin querer */
  if (Date.now() - recienDeslizado < 400) return;
  /* y si ESE toque ya lo atendió el arrastre (v0.169), no se cuenta dos veces.
     Por casilla y no solo por tiempo: tocar la pieza y enseguida el destino
     son dos toques, y el segundo tiene que llegar. */
  const casilla = sq.getAttribute("data-sq");
  if (casilla === tocadoConElDedo.sq && Date.now() - tocadoConElDedo.t < 500) return;
  tocarCasilla(casilla);
}));

/* Tocar la curva lleva a esa jugada. Un manejador solo en el contenedor y la
   cuenta a partir del ancho, en vez de N zonas invisibles: con 100 jugadas
   serían 100 rectángulos redibujados en cada paso, y cada uno mediría 3 px, o
   sea menos que un dedo. Así el dedo cae siempre en algo y la jugada la decide
   el redondeo.
   Sirve de índice: se ve dónde se dio vuelta la partida y se va ahí de un toque,
   sin recorrer la tira de jugadas. */
$("curva").addEventListener("click", seguro("curva", ev => {
  if (!R || !R.filas.length) return;
  const r = $("curva").getBoundingClientRect();
  if (!r.width) return;
  irA(jugadaEnLaCurva((ev.clientX - r.left) / r.width, R.filas.length));
}));

/* LA RUEDA SOBRE EL TABLERO PASA JUGADAS (v0.82). Es el gesto estándar de
   cualquier visor de ajedrez en compu. Con el dedo no existe —una pantalla
   táctil no manda `wheel`— así que el celular no se entera.

   SE ACUMULA EL DESPLAZAMIENTO Y RECIÉN AHÍ SE PASA DE JUGADA: un trackpad manda
   docenas de eventos chiquitos por gesto, y una jugada por evento hacía volar la
   partida entera de un manotazo. El umbral de 40 es un empujón corto de trackpad.

   Y UN EVENTO PASA UNA SOLA JUGADA, POR GRANDE QUE SEA (v0.139). Hasta la v0.138
   pasaba una cada 40 y guardaba el resto, pensando que un clic de rueda eran 40.
   No lo son: Chrome manda 100 por clic y otros 120, así que salían 2 y medio
   —"a veces mueve 2, a veces 3", reportado por Juan con un mouse de verdad—. El
   arnés no lo agarraba porque corre a escala 2 y ahí Chromium manda la mitad:
   su clic de 120 llegaba como 60 y pasaba una sola. O sea que el número
   tampoco es fijo entre pantallas, y por eso no se puede contar con él.
   Ahora lo que sobra del umbral se tira: un clic de rueda es un evento y es una
   jugada, mande lo que mande, y el trackpad sigue juntando de a poquito. Firefox
   manda la rueda en renglones y no en píxeles (`deltaMode` 1): se pasa a píxeles
   para que un clic de tres renglones también llegue al umbral.

   Con una variante abierta la rueda RECORRE LA VARIANTE (v0.144), igual que
   los botones, el deslizamiento y las flechas del teclado. Hasta la v0.143 no
   hacía nada, y "nada" con un mouse de verdad era que la página se iba para
   abajo: el mismo gesto pasaba jugadas o scrolleaba según hubiera una prueba
   abierta. */
(function ruedaEnElTablero() {
  let junta = 0;
  $("tablero").addEventListener("wheel", ev => {
    if (!R || $("zonaRevision").classList.contains("oculto")) return;
    if (!ev.deltaY || ev.ctrlKey) return;
    ev.preventDefault();
    const d = ev.deltaY * (ev.deltaMode === 1 ? 40 : ev.deltaMode === 2 ? 400 : 1);
    /* cambiar de sentido arranca de cero: lo juntado para un lado no se le
       descuenta al otro */
    if (Math.sign(d) !== Math.sign(junta)) junta = 0;
    junta += d;
    if (Math.abs(junta) >= 40) {
      pasarConVariante(junta > 0 ? 1 : -1);
      junta = 0;
    }
  }, { passive: false });
})();

/* ARRASTRAR LA PIEZA (v0.84). Con mouse, arrastrar es lo que la mano espera; el
   clic-clic de siempre sigue funcionando igual y es el único camino con el dedo.

   NO ES UN CAMINO NUEVO PARA MOVER: apretar hace exactamente lo que hacía tocar
   —`tocarCasilla` con la casilla de origen, que abre la variante y enciende los
   destinos— y soltar hace lo que hacía el segundo toque. Todo lo que ya estaba
   decidido sobre qué se puede probar y desde dónde vale igual, sin repetirlo.

   LA TRAMPA: `tocarCasilla` llama a `pintarRevision`, que redibuja el SVG entero.
   O sea que la pieza que se agarró DEJA DE EXISTIR en ese mismo instante. Hay que
   volver a buscarla después de encender los destinos, y por eso el arrastre
   arranca recién al cuarto píxel: si arrancara en el `pointerdown`, redibujaría
   el tablero en cada apretón, incluido el que era solo un clic. */
(function arrastrarPiezas() {
  const cont = $("tablero");
  let desde = null, pieza = null, orig = "", x0 = 0, y0 = 0, k = 1, arrastro = false, halo = null;
  const soltarTodo = () => { desde = null; pieza = null; arrastro = false; halo = null; };
  const casillaDe = ev => {
    const t = ev.target.closest && ev.target.closest("[data-sq]");
    return t && t.getAttribute("data-sq");
  };
  cont.addEventListener("pointerdown", seguro("agarrar", ev => {
    if (ev.button !== 0 || TRABAJANDO) return;
    const sq = casillaDe(ev);
    /* con el dedo, solo una pieza que puede mover (v0.169, ver `dibujar`):
       desde cualquier otra casilla el gesto es deslizar o scrollear */
    if (ev.pointerType !== "mouse" &&
        !(ev.target.closest && ev.target.closest("[data-mueve]"))) return;
    /* solo se agarra donde HAY una pieza: sobre una casilla vacía el gesto es
       arrastrar la página, no una jugada que no existe */
    if (!sq || !cont.querySelector(`[data-pz="${sq}"]`)) return;
    desde = sq; x0 = ev.clientX; y0 = ev.clientY; arrastro = false;
  }));
  /* SOLTAR AFUERA DEL TABLERO TAMBIÉN ES SOLTAR (v0.144). Hasta la v0.143 el
     `pointerup` se escuchaba en el tablero, así que soltando afuera no llegaba
     nunca: la pieza quedaba en el aire y, al volver, seguía al mouse sin
     ningún botón apretado. Con el puntero capturado mientras dura el arrastre,
     el tablero recibe el final pase donde pase —también afuera de la ventana—.
     La captura le cambia el `target` al evento, así que la casilla de llegada
     se busca por coordenadas. */
  const casillaEn = ev => {
    const t = document.elementFromPoint(ev.clientX, ev.clientY);
    const c = t && cont.contains(t) && t.closest("[data-sq]");
    return c ? c.getAttribute("data-sq") : null;
  };
  cont.addEventListener("pointermove", seguro("arrastrar", ev => {
    if (!desde) return;
    const dx = ev.clientX - x0, dy = ev.clientY - y0;
    if (!arrastro) {
      /* con el dedo, un poco más: un toque nunca cae quieto */
      if (Math.abs(dx) + Math.abs(dy) < (ev.pointerType === "mouse" ? 4 : 8)) return;
      arrastro = true;
      tocarCasilla(desde, true);
      const svg = cont.querySelector("svg.tab");
      if (!svg) return soltarTodo();
      /* de píxeles de pantalla a unidades del SVG: el tablero se dibuja en su
         propio sistema y se escala al ancho que haya */
      k = svg.viewBox.baseVal.width / svg.getBoundingClientRect().width;
      pieza = cont.querySelector(`[data-pz="${desde}"]`);
      if (!pieza) return soltarTodo();
      orig = pieza.getAttribute("transform");
      /* al final del SVG para que quede ARRIBA de las otras piezas, y sorda al
         mouse para no taparle el `pointerup` a las casillas, que están encima */
      pieza.style.pointerEvents = "none";
      pieza.parentNode.appendChild(pieza);
      /* EL HALO DEBAJO DEL DEDO (v0.169, revisor): el dedo tapa la pieza y la
         casilla de abajo, y se soltaba a ciegas. Un círculo violeta de dos
         casillas de diámetro, centrado en la casilla donde caería, asoma
         alrededor de la yema. En cualquier casilla, no solo en los destinos:
         contesta "¿dónde cae?". Debajo de las piezas, sordo al dedo, sin
         repintar. Con mouse no: el puntero se ve.
         SE DESLIZA de una casilla a la otra (v0.170, Juan: en seco "se siente
         raro, medio rígido, poco fluido"): `cx`/`cy` van por `style` para que
         los anime la transición corta de §1.8 (`.haloDedo`), y arranca en la
         casilla de origen, así el primer tramo también se desliza. */
      if (ev.pointerType !== "mouse") {
        halo = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        halo.setAttribute("r", TAB_S);
        halo.setAttribute("fill", "#6a1b9a");
        halo.setAttribute("opacity", ".2");
        halo.setAttribute("data-halo", "");
        halo.setAttribute("class", "haloDedo");
        halo.style.cx = sqCx(desde) + "px"; halo.style.cy = sqCy(desde) + "px";
        halo.style.pointerEvents = "none";
        halo.setAttribute("visibility", "visible");
        svg.insertBefore(halo, svg.querySelector("[data-pz]"));
      }
      try { cont.setPointerCapture(ev.pointerId); } catch (e) { /* sin captura, como antes */ }
    }
    if (!pieza) return;
    /* las transformaciones se aplican de izquierda a derecha, así que el
       corrimiento va ADELANTE del que ya tenía y no lo pisa */
    pieza.setAttribute("transform",
      `translate(${(dx * k).toFixed(2)} ${(dy * k).toFixed(2)}) ${orig}`);
    if (halo) {
      const sq = casillaEn(ev);
      /* si el dedo salió del tablero y vuelve, el halo aparece donde entra, sin
         deslizarse desde la última casilla (revisor, v0.170) */
      const volvia = halo.getAttribute("visibility") === "hidden";
      halo.setAttribute("visibility", sq ? "visible" : "hidden");
      if (sq) {
        if (volvia) halo.style.transition = "none";
        halo.style.cx = sqCx(sq) + "px"; halo.style.cy = sqCy(sq) + "px";
        if (volvia) { halo.getBoundingClientRect(); halo.style.transition = ""; }
      }
    }
  }));
  cont.addEventListener("pointerup", seguro("soltar", ev => {
    if (!desde) return;
    const hubo = arrastro, origen = desde;
    const hasta = hubo ? casillaEn(ev) : null;
    soltarTodo();
    /* fue un clic: lo atiende el click. Con el dedo no hay click —lo cortó el
       `touchstart`, ver el deslizamiento—, así que se atiende acá (v0.169) */
    if (!hubo) {
      if (ev.pointerType !== "mouse") { tocadoConElDedo = { t: Date.now(), sq: origen }; tocarCasilla(origen); }
      return;
    }
    /* el `touchend` llega después y no tiene que leer el arrastre como un
       deslizamiento (v0.169) */
    recienArrastrado = Date.now();
    /* Soltar en la misma casilla, o fuera del tablero, devuelve la pieza a su
       lugar —por eso el repintado— pero la deja ELEGIDA, con sus destinos
       encendidos. No es un descuido: agarrar ya fue un `tocarCasilla`, así que
       levantar la pieza y volver a apoyarla termina igual que hacerle un clic,
       que es lo que pasa en cualquier tablero de internet. Medido: la pieza
       queda marcada, sin abrir la variante (v0.152). */
    if (!hasta || hasta === origen) pintarRevision();
    else tocarCasilla(hasta);
  }));
  cont.addEventListener("pointercancel", seguro("cancelar", () => {
    if (arrastro) { soltarTodo(); pintarRevision(); } else soltarTodo();
  }));
  /* el click que el navegador dispara al final de un arrastre no tiene que
     contar como toque: si no, soltar sobre una casilla la elegiría dos veces */
  cont.addEventListener("click", ev => {
    if (arrastro) { ev.stopPropagation(); ev.preventDefault(); }
  }, true);
})();

/* EL BOTÓN DERECHO DIBUJA (v0.85). Acá está solo el gesto; el porqué y el dibujo
   están arriba, en el comentario de `svgMarcas`. Va aparte del arrastre porque no
   comparte nada con él —el arrastre solo escucha el botón izquierdo— y meterlos
   en la misma función la obligaría a acordarse de qué botón la llamó.

   BORRAR ES REPETIR EL MISMO GESTO, que es como funciona afuera. Y para borrar
   todo de una está el clic izquierdo, sin escribir una línea: cualquier clic en
   el tablero termina en `tocarCasilla`, o sea en `pintarRevision`, que las limpia. */
(function marcarConElDerecho() {
  const cont = $("tablero");
  let desde = null;
  const casillaDe = ev => {
    const t = ev.target.closest && ev.target.closest("[data-sq]");
    return t && t.getAttribute("data-sq");
  };
  /* sin esto el menú del navegador se come el gesto a mitad de camino */
  cont.addEventListener("contextmenu", ev => ev.preventDefault());
  cont.addEventListener("pointerdown", seguro("marcar", ev => {
    if (ev.button !== 2) return;
    desde = casillaDe(ev);
  }));
  cont.addEventListener("pointerup", seguro("marcar-soltar", ev => {
    if (ev.button !== 2) return;
    const a = desde, z = casillaDe(ev);
    desde = null;
    /* soltar afuera del tablero cancela: es la forma de arrepentirse a mitad de
       una flecha sin dejar nada dibujado */
    if (!a || !z) return;
    const i = MARCAS_TAB.findIndex(m => m.a === a && m.z === z);
    if (i >= 0) MARCAS_TAB.splice(i, 1); else MARCAS_TAB.push({ a, z });
    pintarMarcas();
  }));
})();

/* SALTAR AL PRÓXIMO ERROR (v0.82). Una partida se revisa por los errores, no
   jugada por jugada, y las categorías ya están calculadas: la tecla las usa.
   Salta solo entre las JUGADAS PROPIAS, que es lo mismo que decide qué se pinta
   en la tira, salvo que estén pintadas las dos. */
const MALAS = new Set(["imprecision", "error", "omision", "grave"]);
function saltarAMala(dir) {
  if (!R) return;
  const lado = ladoDelUsuario(R);
  for (let i = IDX + dir; i >= 0 && i < R.filas.length; i += dir) {
    const x = R.filas[i];
    if (lado && !VER_AMBOS && x.turno !== lado) continue;
    if (MALAS.has(presentar(x).clave)) { irA(i); return; }
  }
}

/* el Tab que da la vuelta adentro de una hoja `aria-modal` */
function tabAdentro(hoja, ev) {
  const fs = [...hoja.querySelectorAll("button, input, select, textarea, a[href], [tabindex]")]
    .filter(x => !x.disabled && x.tabIndex >= 0 && x.getClientRects().length);
  const i = fs.indexOf(document.activeElement);
  if (fs.length && (i < 0 || (ev.shiftKey ? i === 0 : i === fs.length - 1))) {
    ev.preventDefault();
    fs[ev.shiftKey ? fs.length - 1 : 0].focus();
  }
}

/* en la compu, las flechas. Se ignoran mientras se escribe en un campo. */
document.addEventListener("keydown", seguro("teclas", ev => {
  const tecla = ev.key;
  /* Escape cierra la hoja, y sale antes que todo lo demás: con los ajustes
     abiertos, las flechas no tienen que estar navegando la partida de atrás. */
  /* la hoja de Posiciones (v1.2), con las mismas dos reglas */
  if (hojaPosAbierta()) {
    if (tecla === "Escape") { ev.preventDefault(); verHojaPos(false); }
    if (tecla === "Tab") tabAdentro($(HOJA_POS), ev);
    return;
  }
  if (!$("hojaAjustes").classList.contains("oculto")) {
    if (tecla === "Escape") { ev.preventDefault(); verAjustes(false); }
    /* TAB NO SE ESCAPA DE LA HOJA (v0.153, [PC]): es `aria-modal`, así que
       el foco da la vuelta adentro en vez de irse a los botones de atrás,
       que con la hoja abierta no se ven. */
    if (tecla === "Tab") tabAdentro($("hojaAjustes"), ev);
    return;
  }
  /* LAS FILAS DE PARTIDAS SON BOTONES (v0.153, [PC]): Tab llega a cada una y
     Enter o Espacio la abren, igual que el clic. */
  if ((tecla === "Enter" || tecla === " ") && ev.target.matches && ev.target.matches(".lista > div[data-i]")) {
    ev.preventDefault(); ev.target.click(); return;
  }
  /* LA LISTA DE JUGADAS SE RECORRE CON ↑ ↓, INICIO Y FIN (v0.153, [PC]) cuando
     tiene el foco: es una lista vertical y ←/→ ya pasan desde cualquier lado.
     Solo con el foco ahí, porque sin él ↑ ↓ e Inicio/Fin mueven la página. */
  if (ev.target === $("jugadas") && R && !ev.ctrlKey && !ev.altKey && !ev.metaKey &&
      ["ArrowUp", "ArrowDown", "Home", "End"].includes(tecla)) {
    ev.preventDefault();
    if (tecla === "ArrowUp" || tecla === "ArrowDown") pasarConVariante(tecla === "ArrowDown" ? 1 : -1);
    else irA(tecla === "Home" ? -1 : R.filas.length - 1);
    return;
  }
  /* SIN Ctrl, Alt NI Meta TAMPOCO LAS FLECHAS (v0.144): Alt+← es "atrás" del
     navegador y Cmd+← en una Mac también, y hasta la v0.143 la app se los
     comía y encima pasaba una jugada. */
  const sola = !ev.ctrlKey && !ev.altKey && !ev.metaKey;
  const nave = sola && (tecla === "ArrowLeft" || tecla === "ArrowRight");
  /* [PC] EN POSICIONES, ← o Ctrl/Cmd+Z deshacen (v1.2.1, revisor): es lo
     que hace "‹" en la Partida. No mientras se escribe ni se elige en un
     select, y nunca con la Partida a la vista. */
  if (VISTA === "posicion" && !ev.target.matches("input, select, textarea") &&
      ((sola && tecla === "ArrowLeft") ||
       ((ev.ctrlKey || ev.metaKey) && !ev.altKey && !ev.shiftKey && tecla.toLowerCase() === "z"))) {
    ev.preventDefault();
    if (!$("posDeshacer").disabled) $("posDeshacer").click();
    return;
  }
  /* Escape sale de Armar posición sin cambiar nada, como "‹" (v1.4) */
  if (tecla === "Escape" && VISTA === "armar") { ev.preventDefault(); volver(); return; }
  /* Escape sale de la variante: es el botón "volver", en el teclado */
  if (tecla === "Escape" && PRUEBA && !$("zonaRevision").classList.contains("oculto")) {
    ev.preventDefault(); salirDePrueba(); return;
  }
  /* y sin variante, desmarca la pieza elegida (v0.152) */
  if (tecla === "Escape" && marcada() && !$("zonaRevision").classList.contains("oculto")) {
    ev.preventDefault(); MARCADA = null; pintarRevision(); return;
  }
  /* `n` y `p` de próximo y previo error. Sin Ctrl ni Alt: si no, se comen los
     atajos del navegador. */
  const salto = (tecla === "n" || tecla === "p") && sola;
  if (!nave && !salto) return;
  if (!R || $("zonaRevision").classList.contains("oculto")) return;
  const t = ev.target.tagName;
  if (t === "INPUT" || t === "TEXTAREA" || t === "SELECT") return;
  ev.preventDefault();
  /* con una variante abierta, `n` y `p` no hacen nada (v0.168): saltaban de
     jugada en la partida y se llevaban puesta la línea probada sin aviso */
  if (salto) { if (!(PRUEBA && PRUEBA.linea.length)) saltarAMala(tecla === "n" ? 1 : -1); }
  /* por `atras` y `adelante`, los de los botones: con una variante abierta la
     recorren a ella. Hasta la v0.143 las flechas llamaban a `irA`, que la
     cerraba sin avisar y se llevaba la línea probada. */
  else pasarConVariante(tecla === "ArrowRight" ? 1 : -1);
}));
/* Flechas y rueda. UNA VARIANTE SIN JUGADAS NO CUENTA COMO VARIANTE. Hasta la
   v0.151 cualquier clic en el tablero abría una —"Elegiste a8"— aunque no se
   jugara nada; desde la v0.152 el clic solo marca la pieza (`MARCADA`), y la
   única vacía que queda es la de las alternativas ("Probá otra jugada"), que
   arranca una jugada atrás. Ahí tampoco hay línea que recorrer. Si se la tratara como
   abierta, un clic suelto (el que borra las marcas, o soltar una pieza afuera)
   dejaba muertas las flechas y la rueda. Se pasa de jugada por la partida, que
   la cierra, y no se pierde nada. Va acá y no en `atras`/`adelante`, que son
   los de los botones y el deslizamiento del celu: esos no cambian. */
function pasarConVariante(dir) {
  if (PRUEBA && !PRUEBA.linea.length) return irA(IDX + dir);
  if (dir > 0) adelante(); else atras();
}

$("volverDeLaPartida").onclick = seguro("volver", volver);
$("volverDelMes").onclick = seguro("volver", volver);
$("tarjetaMes").onclick = seguro("ver el mes", () =>
  HAY.mes ? irAPantalla("mes") : correrMes(true, true));

/* con usuario guardado se arranca plegado y buscando (v0.120) */
try {
  const u = localStorage.getItem("usuario");
  /* salvo que antes de arrancar se haya escrito otro nombre y tocado Buscar:
     ese gana, lo corre el toque guardado de abajo (revisor de UX, v1.0.10) */
  const escrito = window.TOQUE_PENDIENTE === "buscar" && $("usuario").value.trim();
  if (u && !escrito) { $("usuario").value = u; $("yaUsuarioNombre").textContent = u; entrada(false); $("buscar").click(); }
} catch (e) { /* incógnito */ }
/* Buscar tocado antes de que arrancara el módulo (v1.0.10, script
   clásico): se corre ahora. Si el usuario guardado ya largó la búsqueda,
   Buscar está apagado y no se repite. El aviso de "arrancando" se borra
   siempre, también el de los otros botones, que no se repiten. */
{
  const pend = window.TOQUE_PENDIENTE;
  window.TOQUE_PENDIENTE = null;
  if (/arrancando/.test($("estado").textContent)) estado("");
  if (pend === "buscar" && !$("buscar").disabled && $("buscar").offsetParent !== null) $("buscar").click();
}

const atras = () => PRUEBA ? verDeLaVariante(PRUEBA.ver - 1) : irA(IDX - 1);
const adelante = () => PRUEBA ? verDeLaVariante(PRUEBA.ver + 1) : irA(IDX + 1);
$("ant").onclick = seguro("anterior", atras);
$("sig").onclick = seguro("siguiente", adelante);
try { VER_MEJOR = localStorage.getItem("siempreMejor") === "si"; } catch (e) { /* incógnito */ }

/* ARRASTRAR LA TIRA CON EL MOUSE (v0.80). Reportado desde una compu: en un
   celular el dedo scrollea la tira sola, pero con mouse arrastrar un
   `overflow-x` no la mueve, SELECCIONA EL TEXTO. Y la rueda vertical tampoco:
   sobre un contenedor horizontal el navegador no hace nada y se va la página
   para abajo. Se agregan las dos cosas, y ninguna toca lo que pasa con el dedo:
   `pointerType` filtra el mouse, y el dedo sigue por el camino de siempre. */
(function arrastrarLaTira() {
  const sc = $("tiraSc");
  let x0 = 0, s0 = 0, agarrada = false, arrastro = false;
  sc.addEventListener("pointerdown", e => {
    if (e.pointerType !== "mouse") return;
    agarrada = true; arrastro = false; x0 = e.clientX; s0 = sc.scrollLeft;
  });
  sc.addEventListener("pointermove", e => {
    if (!agarrada) return;
    const d = e.clientX - x0;
    /* UMBRAL DE 4 px para que un CLIC siga siendo un clic: sin esto, el temblor
       de la mano al apretar contaba como arrastre y tocar una jugada dejaba de
       llevarte a esa jugada. */
    if (!arrastro && Math.abs(d) < 4) return;
    /* capturado mientras dura (v0.144): la tira mide 30 px de alto y la mano se
       sale para arriba o para abajo; sin esto el arrastre se cortaba ahí */
    if (!arrastro) { try { sc.setPointerCapture(e.pointerId); } catch (x) { /* sin captura, como antes */ } }
    arrastro = true;
    sc.classList.add("arrastrando");
    sc.scrollLeft = s0 - d;
  });
  /* el clic se cancela EN CAPTURA y solo si hubo arrastre: así soltar arriba de
     una jugada después de arrastrar no navega, y soltar sin arrastrar sí. */
  sc.addEventListener("click", e => {
    if (arrastro) { e.stopPropagation(); e.preventDefault(); }
  }, true);
  const soltar = () => { agarrada = false; sc.classList.remove("arrastrando"); };
  sc.addEventListener("pointerup", soltar);
  sc.addEventListener("pointercancel", soltar);
  sc.addEventListener("pointerleave", soltar);
  /* la rueda solo se roba el gesto CUANDO HAY PARA DÓNDE IR: en una tira corta
     —una partida de seis jugadas— la rueda tiene que seguir scrolleando la
     página, que es lo que el usuario espera. */
  sc.addEventListener("wheel", e => {
    if (e.deltaX || !e.deltaY) return;
    if (sc.scrollWidth <= sc.clientWidth) return;
    e.preventDefault();
    sc.scrollLeft += e.deltaY;
  }, { passive: false });
})();

/* EL CUADRITO ES EL INTERRUPTOR (v0.117): prende y apaga la preferencia, la
   misma que se guarda. Responde aunque esté grisado (una jugada que ya era la
   mejor): si no, con la preferencia puesta no se la podía apagar ahí. */
const alternarMejor = seguro("mejor", () => {
  VER_MEJOR = !VER_MEJOR;
  try { localStorage.setItem("siempreMejor", VER_MEJOR ? "si" : "no"); } catch (e) { /* incógnito */ }
  pintarRevision();
});
$("tileMejor").onclick = alternarMejor;
$("tileMejor").onkeydown = ev => {
  if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); alternarMejor(ev); }
};
/* La ÚNICA puerta de entrada a la variante es tocar una pieza (v0.74). El botón
   que abría una "en vez de esta jugada" se fue con la fila de botones grandes:
   vivía donde no se ve el tablero, así que no se usaba. Para reemplazar una
   jugada propia se vuelve una con el galón y se toca una pieza, que es lo mismo
   que hace el "Reintentar" de chess.com.
   Este botón solo sale de la variante, y por eso vive adentro de su tarjeta. */
$("btnProbar").onclick = seguro("volver de la variante", salirDePrueba);
$("btnGirar").onclick = seguro("girar", () => { GIRADO = !GIRADO; pintarRevision(); });
$("btnGirarTab").onclick = $("btnGirar").onclick;
/* Un observador y no `resize`: la Partida se pinta todavía escondida (antes
   de pasar de pantalla), y ahí el SVG mide 0 y el botón caía en cualquier
   lado. El observador avisa cuando el tablero aparece y cuando cambia de
   tamaño, que son las dos veces que hay que volver a ubicarlo. */
/* sobre `.revtab` y no sobre `#tablero`: el tablero mide 360 en casi cualquier
   ancho, así que al girar el celu se movía sin cambiar de tamaño y el
   observador no saltaba (lo midió el revisor: de 412 a 400 el botón quedaba
   afuera de la pantalla hasta pasar de jugada). La fila sí cambia de ancho. */
/* cruzar el corte de la compu muda la tira y Girar: se repinta entero */
window.matchMedia(CORTE_ANCHO).addEventListener("change", () => {
  if (R && !$("zonaRevision").classList.contains("oculto")) pintarRevision();
});
/* y la tira vuelve a centrar la elegida: con una variante abierta, achicar la
   ventana la dejaba tapada por el desvanecido (revisor, v0.125) */
new ResizeObserver(() => { if (R && (IDX < 0 || R.filas[IDX])) { ubicarGirar(IDX < 0 ? null : R.filas[IDX]); centrarTira(); } }).observe(document.querySelector(".revtab"));

/* LAS PESTAÑAS DEL PANEL DE LA COMPU (v1.7): Jugadas o Resumen. La elegida
   se recuerda mientras dure la sesión (es una clase de la lateral, que no se
   rehace); arranca en Jugadas, que es lo que se usa jugada a jugada. */
function verPestana(res) {
  $("lateral").classList.toggle("verRes", res);
  $("tabJugadas").setAttribute("aria-selected", String(!res));
  $("tabResumen").setAttribute("aria-selected", String(res));
  if (res) marcarMas($("resAncho"));
}
$("tabJugadas").onclick = () => verPestana(false);
$("tabResumen").onclick = () => verPestana(true);
$("resAncho").addEventListener("scroll", () => marcarMas($("resAncho")), { passive: true });
if (window.ResizeObserver) new ResizeObserver(() => marcarMas($("resAncho"))).observe($("resAncho"));

function pintarResumen(prof) {
  const { filas, cab } = R;
  const B = filas.filter(f => f.turno === "w"), N = filas.filter(f => f.turno === "b");
  /* sin jugadas fuera del libro, una raya grande y el porqué en el renglón de
     abajo, donde va la mediana (v0.174) */
  const prec = fs => { const p = precisionMedia(fs); return p == null ? "\u2014" : p.toFixed(1); };
  const pie = fs => !fs.length ? "sin jugadas" : precisionMedia(fs) == null ? "no salió del libro"
    : `mediana ${medianaFuera(fs).toFixed(2)}`;

  $("capResumen").textContent =
    `Compara a los dos jugadores. Profundidad ${prof}, modo ${nombreModo()}; ` +
    "los n\u00fameros de distinta profundidad o de distinto modo no se comparan. " +
    "La precisi\u00f3n y la mediana no cuentan las jugadas de libro.";

  const filaCat = k => `<tr><td><span style="color:var(--c-${k})">${CATEGORIAS[k].icono}</span> ${CATEGORIAS[k].nombre}</td>` +
    `<td>${B.filter(f => f.cat === k).length}</td><td>${N.filter(f => f.cat === k).length}</td></tr>`;

  /* Precisión y mediana salen de la tabla y van arriba, grandes: son las dos
     cifras que de verdad comparan a los jugadores, y entre diez filas de
     recuentos —casi todas en cero en una partida sola— no se veían. */
  const lado = (nom, fs) => `<div><div class="et">${nom}</div>` +
    `<div class="gr">${prec(fs)}</div>` +
    `<div class="pe">${pie(fs)}</div></div>`;
  $("marcador").innerHTML = lado(cab.White || "Blancas", B) + lado(cab.Black || "Negras", N);

  $("resumen").innerHTML = `
    <thead><tr><th></th><th>${cab.White || "Blancas"}</th><th>${cab.Black || "Negras"}</th></tr></thead>
    <tbody>${ORDEN.map(filaCat).join("")}</tbody>`;

  /* la de la compu, en la pestaña Resumen del panel (v1.7): la misma tabla
     con la precisión como primera fila, bajo los mismos nombres, en vez de
     las dos tarjetas; los ceros, tenues */
  const cuenta = (fs, k) => { const n = fs.filter(f => f.cat === k).length; return `<td${n ? "" : ' class="cero"'}>${n}</td>`; };
  const celdaPrec = fs => `<td><span class="gr">${prec(fs)}</span><span class="pe">${pie(fs)}</span></td>`;
  /* sin las categorías que dan 0 para los dos (revisor de UX, v1.7: a
     1366 entraban 4 de 10 y se cortaban justo los errores). El Resumen es
     de la partida entera: la tabla no cambia de forma al pasar jugadas */
  $("resumenAncho").innerHTML = `
    <thead><tr><th></th><th>${cab.White || "Blancas"}</th><th>${cab.Black || "Negras"}</th></tr></thead>
    <tbody><tr class="prec"><td>Precisi\u00f3n</td>${celdaPrec(B)}${celdaPrec(N)}</tr>` +
    ORDEN.filter(k => filas.some(f => f.cat === k)).map(k => `<tr><td><span style="color:var(--c-${k})">${CATEGORIAS[k].icono}</span> ${CATEGORIAS[k].nombre}</td>` +
      cuenta(B, k) + cuenta(N, k) + "</tr>").join("") + `</tbody>`;
  $("resumenAncho").title = $("capResumen").textContent;
  marcarMas($("resAncho"));

}

} catch (e) {
  window.mostrarError("al armar la p\u00e1gina", (e && e.message) || e);
  if (e && e.stack) document.getElementById("errores").textContent +=
    "\n" + e.stack.split("\n").slice(0, 3).join("\n");
  document.getElementById("diag").textContent = window.VERSION + " \u00b7 fall\u00f3 al iniciar";
}
