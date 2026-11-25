/* ============ interfaz ============ */
const TOPE_MES = 50;
let PARTIDAS = [], ELEGIDA = null, ELEGIDA_ID = null, R = null, IDX = 0, VER_MEJOR = false, USUARIO = "";
/* El JSON de chess.com de la partida elegida. El PGN trae el resultado pero NO
   el motivo —abandono, tiempo, acuerdo—: eso solo está en el JSON del mes. Se
   elige en la lista y se necesita mucho después, en la revisión, así que tiene
   que viajar. Es null con un PGN pegado, y ahí el motivo no se muestra. */
let ELEGIDA_META = null;
/* Cadencia elegida, por clave exacta ("300+0"). null = todavía no se eligió y
   manda la que más partidas tiene. Es una PREFERENCIA y no una orden: si el mes
   que se abre no tiene esa cadencia, se cae a la dominante (elegirCadencia). */
let CADENCIA = null;


/* Hasta la v0.116 había dos formas de ver la mejor: VER_MEJOR, la preferencia
   del botón "Siempre la mejor", y MEJOR_EN, un vistazo de una sola jugada desde
   el cuadrito. Desde la v0.117 queda una: el cuadrito prende y apaga VER_MEJOR
   (declarada arriba), y el vistazo se fue con el botón. */
/* LA TIPOGRAFÍA SE MIDE, NO SE ESTIMA (v0.74).

   Tres veces seguidas la tira se vio corrida mientras las cuentas decían que
   estaba centrada, y las tres el problema era el MISMO: se estaba midiendo la
   caja del renglón, que incluye el espacio de las colas y las tildes, cuando lo
   que el ojo alinea es la MAYÚSCULA.

   Acá se miden las dos cosas que hacen falta y se dejan en variables CSS:

   - `--galon`: cuánto hay que correr el chevron para que su vértice caiga en el
     centro de la mayúscula.
   - `--jgArriba` / `--jgAbajo`: cómo repartir el relleno del recuadro de la
     jugada actual para que no sobresalga por abajo.

   Se mide en el navegador y no se escriben números fijos porque LA TIPOGRAFÍA
   CAMBIA CON EL APARATO: `system-ui` es Roboto en Android y otra cosa en cada
   lado, y un número fijo alinearía bien en uno y mal en el resto.

   La base del renglón se mide con una sonda —un inline-block de alto cero apoya
   su borde inferior exactamente en la base— y no se calcula: calcularla obliga
   a suponer cómo reparte el interlineado el navegador. */
let TIRA_MEDIDA = false;
function medirTira() {
  if (TIRA_MEDIDA) return;
  const jg = $("tiraSc").querySelector(".jg");
  if (!jg) return;
  const cs = getComputedStyle(jg);
  const cv = document.createElement("canvas").getContext("2d");
  cv.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const cap = cv.measureText("N").actualBoundingBoxAscent;
  /* un navegador sin `actualBoundingBoxAscent` se queda con el relleno parejo
     de la hoja de estilos: se ve peor, no se rompe */
  if (!cap) { TIRA_MEDIDA = true; return; }
  const base = () => {
    const sonda = document.createElement("span");
    sonda.style.cssText = "display:inline-block;width:0;height:0";
    jg.appendChild(sonda);
    const y = sonda.getBoundingClientRect().top;
    sonda.remove();
    return y;
  };
  const t = $("tira");
  const b1 = base(), r = jg.getBoundingClientRect();
  /* SIN LAYOUT NO HAY MEDICIÓN. La primera pintada pasa con `zonaRevision`
     todavía oculta, así que todos los rectángulos dan cero y la corrección
     sale disparatada. Se sale SIN marcar la medición como hecha, para que la
     próxima pintada —ya visible— la haga de verdad. */
  if (!r.height) return;
  const d = (r.bottom - b1) - ((b1 - cap) - r.top);
  const pt = parseFloat(cs.paddingTop), pb = parseFloat(cs.paddingBottom);
  t.style.setProperty("--jgArriba", (pt + d / 2).toFixed(2) + "px");
  t.style.setProperty("--jgAbajo", Math.max(0, pb - d / 2).toFixed(2) + "px");
  /* PRIMERO el recuadro y DESPUÉS el galón, y el orden no es opcional: repartir
     el relleno corre la base de todo el renglón —con la alineación por base, la
     fija el elemento que más sube por encima de ella—, así que el galón hay que
     calcularlo contra la base NUEVA. Se vuelve a medir por eso. */
  const b2 = base(), rg = $("ant").getBoundingClientRect();
  t.style.setProperty("--galon", ((b2 - cap / 2) - (rg.top + rg.bottom) / 2).toFixed(2) + "px");
  TIRA_MEDIDA = true;
}

/* La jugada actual, al medio. Se mueve SOLO el scroll de la tira, a mano:
   `scrollIntoView` scrollea también a los ancestros, así que cada jugada
   arrastraría la página entera. Es la misma trampa que ya tenía la lista
   vertical, anotada desde la v28. */
function centrarTira() {
  const sc = $("tiraSc"), sel = sc.querySelector(".sel");
  if (!sel) return;
  let x = sel.offsetLeft - (sc.clientWidth - sel.offsetWidth) / 2;
  /* CON UNA VARIANTE, EL BORDE IZQUIERDO CAE ENTRE DOS JUGADAS (v0.182,
     revisor): centrando a secas, junto a "‹" asomaba un pedazo de la anterior
     —un "5" suelto del "15."—. Se corre el scroll al borde de la que quedaba
     cortada, para un lado o para el otro, siempre que la elegida siga entera
     fuera de los desvanecidos de 24. */
  if ($("zonaRevision").classList.contains("conVariante")) {
    const F = 24;
    sc.style.setProperty("--colaVar", F + "px");
    const max = sc.scrollWidth - sc.clientWidth;
    x = Math.max(0, Math.min(x, max));
    const hijos = [...sc.children].filter(h => h.offsetWidth);
    const k = hijos.findIndex(h => h.offsetLeft < x && h.offsetLeft + h.offsetWidth > x);
    if (k >= 0) {
      const entra = (y, tope) => y >= 0 && y <= tope && sel.offsetLeft >= y + F &&
                                 sel.offsetLeft + sel.offsetWidth <= y + sc.clientWidth - F;
      const sig = hijos[k + 1] ? hijos[k + 1].offsetLeft : -1;
      const cand = [hijos[k].offsetLeft, sig]
        .filter(y => entra(y, max)).sort((a, b) => Math.abs(a - x) - Math.abs(b - x));
      if (cand.length) x = cand[0];
      /* al final de la tira el scroll no da para correrse a la siguiente:
         se estira el hueco del final lo que falta (menos de una jugada), y la
         elegida queda con más aire a la derecha, que ahí dice "acá termina" */
      else if (sig > max && entra(sig, Infinity)) {
        sc.style.setProperty("--colaVar", (F + sig - max) + "px");
        x = sig;
      }
    }
  }
  sc.scrollLeft = x;
}

/* `i` va de -1 —la posición inicial, antes de la primera jugada (v0.124)— a la
   última fila. */
function irA(i) {
  if (!R || i < -1 || i >= R.filas.length || i === IDX) return;
  IDX = i;
  /* el señalado NO se apaga acá: lo tira `pintarRevision`, que es por donde
     pasan también los caminos que no llaman a `irA` —abrir la variante tocando
     una pieza, sobre todo—. Dos mecanismos para lo mismo era justo lo que
     dejaba la flecha naranja pegada. */
  /* Cambiar de jugada corta la prueba, por el mismo motivo que apaga el vistazo
     a la mejor: una prueba pertenece a UNA posición, y arrastrarla a la
     siguiente mostraría una jugada evaluada contra una posición que no es la
     suya. Va acá y no en cada botón porque acá pasan todos los caminos. */
  if (PRUEBA) soltarPrueba();
  MARCADA = null;
  pintarRevision();
}
