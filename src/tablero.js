/* ============ tablero ============ */

/* Piezas Cburnett, de Colin M.L. Burnett, CC BY-SA 3.0, vía Wikimedia Commons.
   Son las mismas que usa lichess. Reemplazaron a los glifos Unicode de la v26,
   que dependían de la fuente del dispositivo: en algunos Android salían
   cuadraditos, y donde salían eran el set hueco pensado para texto corrido, con
   el trazo demasiado fino para leerse a 42 px.
   Vienen en una caja de 45x45, así que se escalan a la casilla. */
const LADO_PIEZA = 45;
const PIEZAS = `<g id="cb-wk"><g fill="none" fill-rule="evenodd" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"> <path stroke-linejoin="miter" d="M22.5 11.63V6M20 8h5"/> <path fill="#fff" stroke-linecap="butt" stroke-linejoin="miter" d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"/> <path fill="#fff" d="M12.5 37c5.5 3.5 14.5 3.5 20 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5v7"/> <path d="M12.5 30c5.5-3 14.5-3 20 0m-20 3.5c5.5-3 14.5-3 20 0m-20 3.5c5.5-3 14.5-3 20 0"/> </g></g><g id="cb-wq"><g style="fill:#ffffff;stroke:#000000;stroke-width:1.5;stroke-linejoin:round"> <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.9 L 25.5,24.5 L 22.5,10 L 19.5,24.5 L 14.3,10.9 L 14,25 L 6.5,13.5 L 9,26 z"/> <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 11,36 11,36 C 9.5,37.5 11,38.5 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z"/> <path d="M 11.5,30 C 15,29 30,29 33.5,30" style="fill:none"/> <path d="M 12,33.5 C 18,32.5 27,32.5 33,33.5" style="fill:none"/> <circle cx="6" cy="12" r="2" /> <circle cx="14" cy="9" r="2" /> <circle cx="22.5" cy="8" r="2" /> <circle cx="31" cy="9" r="2" /> <circle cx="39" cy="12" r="2" /> </g></g><g id="cb-wr"><g style="opacity:1; fill:#ffffff; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;" transform="translate(0,0.3)"> <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z " style="stroke-linecap:butt;" /> <path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z " style="stroke-linecap:butt;" /> <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14" style="stroke-linecap:butt;" /> <path d="M 34,14 L 31,17 L 14,17 L 11,14" /> <path d="M 31,17 L 31,29.5 L 14,29.5 L 14,17" style="stroke-linecap:butt; stroke-linejoin:miter;" /> <path d="M 31,29.5 L 32.5,32 L 12.5,32 L 14,29.5" /> <path d="M 11,14 L 34,14" style="fill:none; stroke:#000000; stroke-linejoin:miter;" /> </g></g><g id="cb-wb"><g style="opacity:1; fill:none; fill-rule:evenodd; fill-opacity:1; stroke:#000000; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:round; stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;" transform="translate(0,0.6)"> <g style="fill:#ffffff; stroke:#000000; stroke-linecap:butt;"> <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.65,38.99 6.68,38.97 6,38 C 7.35,36.54 9,36 9,36 z"/> <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z"/> <path d="M 25 8 A 2.5 2.5 0 1 1 20,8 A 2.5 2.5 0 1 1 25 8 z"/> </g> <path d="M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18" style="fill:none; stroke:#000000; stroke-linejoin:miter;"/> </g></g><g id="cb-wn"><g style="opacity:1; fill:none; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;" transform="translate(0,0.3)"> <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" style="fill:#ffffff; stroke:#000000;" /> <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10" style="fill:#ffffff; stroke:#000000;" /> <path d="M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z" style="fill:#000000; stroke:#000000;" /> <path d="M 15 15.5 A 0.5 1.5 0 1 1 14,15.5 A 0.5 1.5 0 1 1 15 15.5 z" transform="matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)" style="fill:#000000; stroke:#000000;" /> </g></g><g id="cb-wp"><path d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 H 34 C 34,31.58 29.59,27.09 26.59,26.03 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z" style="opacity:1; fill:#ffffff; fill-opacity:1; fill-rule:nonzero; stroke:#000000; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:miter; stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;"/></g><g id="cb-bk"><g style="fill:none; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;"> <path d="M 22.5,11.63 L 22.5,6" style="fill:none; stroke:#000000; stroke-linejoin:miter;" id="path6570"/> <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25" style="fill:#000000;fill-opacity:1; stroke-linecap:butt; stroke-linejoin:miter;"/> <path d="M 12.5,37 C 18,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 20,16 10.5,13 6.5,19.5 C 3.5,25.5 12.5,30 12.5,30 L 12.5,37" style="fill:#000000; stroke:#000000;"/> <path d="M 20,8 L 25,8" style="fill:none; stroke:#000000; stroke-linejoin:miter;"/> <path d="M 32,29.5 C 32,29.5 40.5,25.5 38.03,19.85 C 34.15,14 25,18 22.5,24.5 L 22.5,26.6 L 22.5,24.5 C 20,18 10.85,14 6.97,19.85 C 4.5,25.5 13,29.5 13,29.5" style="fill:none; stroke:#ffffff;"/> <path d="M 12.5,30 C 18,27 27,27 32.5,30 M 12.5,33.5 C 18,30.5 27,30.5 32.5,33.5 M 12.5,37 C 18,34 27,34 32.5,37" style="fill:none; stroke:#ffffff;"/> </g></g><g id="cb-bq"><g style="fill:#000000;stroke:#000000;stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round"> <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.9 L 25.5,24.5 L 22.5,10 L 19.5,24.5 L 14.3,10.9 L 14,25 L 6.5,13.5 L 9,26 z" style="stroke-linecap:butt;fill:#000000" /> <path d="m 9,26 c 0,2 1.5,2 2.5,4 1,1.5 1,1 0.5,3.5 -1.5,1 -1,2.5 -1,2.5 -1.5,1.5 0,2.5 0,2.5 6.5,1 16.5,1 23,0 0,0 1.5,-1 0,-2.5 0,0 0.5,-1.5 -1,-2.5 -0.5,-2.5 -0.5,-2 0.5,-3.5 1,-2 2.5,-2 2.5,-4 -8.5,-1.5 -18.5,-1.5 -27,0 z" /> <path d="M 11.5,30 C 15,29 30,29 33.5,30" /> <path d="m 12,33.5 c 6,-1 15,-1 21,0" /> <circle cx="6" cy="12" r="2" /> <circle cx="14" cy="9" r="2" /> <circle cx="22.5" cy="8" r="2" /> <circle cx="31" cy="9" r="2" /> <circle cx="39" cy="12" r="2" /> <path d="M 11,38.5 A 35,35 1 0 0 34,38.5" style="fill:none; stroke:#000000;stroke-linecap:butt;" /> <g style="fill:none; stroke:#ffffff;"> <path d="M 11,29 A 35,35 1 0 1 34,29" /> <path d="M 12.5,31.5 L 32.5,31.5" /> <path d="M 11.5,34.5 A 35,35 1 0 0 33.5,34.5" /> <path d="M 10.5,37.5 A 35,35 1 0 0 34.5,37.5" /> </g> </g></g><g id="cb-br"><g style="opacity:1; fill:#000000; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;" transform="translate(0,0.3)"> <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z " style="stroke-linecap:butt;" /> <path d="M 12.5,32 L 14,29.5 L 31,29.5 L 32.5,32 L 12.5,32 z " style="stroke-linecap:butt;" /> <path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z " style="stroke-linecap:butt;" /> <path d="M 14,29.5 L 14,16.5 L 31,16.5 L 31,29.5 L 14,29.5 z " style="stroke-linecap:butt;stroke-linejoin:miter;" /> <path d="M 14,16.5 L 11,14 L 34,14 L 31,16.5 L 14,16.5 z " style="stroke-linecap:butt;" /> <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 L 11,14 z " style="stroke-linecap:butt;" /> <path d="M 12,35.5 L 33,35.5 L 33,35.5" style="fill:none; stroke:#ffffff; stroke-width:1; stroke-linejoin:miter;" /> <path d="M 13,31.5 L 32,31.5" style="fill:none; stroke:#ffffff; stroke-width:1; stroke-linejoin:miter;" /> <path d="M 14,29.5 L 31,29.5" style="fill:none; stroke:#ffffff; stroke-width:1; stroke-linejoin:miter;" /> <path d="M 14,16.5 L 31,16.5" style="fill:none; stroke:#ffffff; stroke-width:1; stroke-linejoin:miter;" /> <path d="M 11,14 L 34,14" style="fill:none; stroke:#ffffff; stroke-width:1; stroke-linejoin:miter;" /> </g></g><g id="cb-bb"><g style="opacity:1; fill:none; fill-rule:evenodd; fill-opacity:1; stroke:#000000; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:round; stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;" transform="translate(0,0.6)"> <g style="fill:#000000; stroke:#000000; stroke-linecap:butt;"> <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.65,38.99 6.68,38.97 6,38 C 7.35,36.54 9,36 9,36 z"/> <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z"/> <path d="M 25 8 A 2.5 2.5 0 1 1 20,8 A 2.5 2.5 0 1 1 25 8 z"/> </g> <path d="M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18" style="fill:none; stroke:#ffffff; stroke-linejoin:miter;"/> </g></g><g id="cb-bn"><g style="opacity:1; fill:none; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;" transform="translate(0,0.3)"> <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" style="fill:#000000; stroke:#000000;" /> <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10" style="fill:#000000; stroke:#000000;" /> <path d="M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z" style="fill:#ffffff; stroke:#ffffff;" /> <path d="M 15 15.5 A 0.5 1.5 0 1 1 14,15.5 A 0.5 1.5 0 1 1 15 15.5 z" transform="matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)" style="fill:#ffffff; stroke:#ffffff;" /> <path d="M 24.55,10.4 L 24.1,11.85 L 24.6,12 C 27.75,13 30.25,14.49 32.5,18.75 C 34.75,23.01 35.75,29.06 35.25,39 L 35.2,39.5 L 37.45,39.5 L 37.5,39 C 38,28.94 36.62,22.15 34.25,17.66 C 31.88,13.17 28.46,11.02 25.06,10.5 L 24.55,10.4 z " style="fill:#ffffff; stroke:none;" /> </g></g><g id="cb-bp"><path d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 H 34 C 34,31.58 29.59,27.09 26.59,26.03 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z" style="opacity:1; fill:#000000; fill-opacity:1; fill-rule:nonzero; stroke:#000000; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:miter; stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;"/></g>`;

/* La barra de evaluación desenrollada a lo largo de la partida: mismos dos
   colores, misma escala y el mismo "las blancas llenan desde abajo". Quien ya
   entiende la barra no tiene nada nuevo que aprender, solo que ahora el eje
   horizontal es el tiempo.

   LAS BLANCAS VAN SIEMPRE ABAJO, aunque el tablero esté girado. La barra se da
   vuelta con el tablero porque está pegada a él y tiene que acompañarlo; la
   curva no está pegada a nada, y dar vuelta un eje de tiempo a mitad de camino
   deja al usuario sin saber qué mitad está mirando. Cuál de las dos jugadas es
   la tuya lo dicen las marcas, que es para lo que están.

   `preserveAspectRatio="none"` porque la tira se estira al ancho que haya y no
   es un dibujo con forma propia. El precio es que todo se deforma en el eje x,
   y por eso NO hay ni un círculo acá: las líneas llevan
   `vector-effect="non-scaling-stroke"`, que deja el grosor en píxeles de
   pantalla, así que el "estás acá" se ve igual de fino con 20 jugadas que con
   200. */
/* Las categorías se marcan encima de la curva con un punto de 6 px sin aro
   (Juan, v0.160: "dejá punto chico"). Hasta ahí se elegía entre ese, uno de
   7 con aro y una raya vertical (§4quaterdecies); las otras dos formas se
   sacaron en la v1.0.3. Un punto dice "acá, en esta jugada", que es lo que la
   marca significa, y deja la raya vertical para una sola cosa, el "estás acá". */

/* Cuánto hay que correr una marca para adentro cuando la curva está pegada al
   borde: media marca cortada se lee como una marca más chica. El punto se mide
   en píxeles sobre una tira de 46 de alto, así que el margen es su radio más un
   poco, en porcentaje: 7. */
const MARGEN_MARCA = 7;

function dibujarCurva(filas, idx, lado, verAmbos) {
  const { puntos, marcas } = curvaVentaja(filas, lado, verAmbos);
  if (!puntos.length) return "";
  const dentro = y => Math.max(MARGEN_MARCA, Math.min(100 - MARGEN_MARCA, y));
  const xy = p => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  const linea = puntos.map((p, i) => (i ? "L " : "M ") + xy(p)).join(" ");
  let s = `<svg viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">`;
  s += `<path d="${linea} L 100 100 L 0 100 Z" fill="var(--eval-blancas)"/>`;
  s += `<line x1="0" y1="50" x2="100" y2="50" stroke="var(--tenue)" stroke-width="1"
         vector-effect="non-scaling-stroke" opacity=".55"/>`;
  s += `<path d="${linea}" fill="none" stroke="var(--tenue)" stroke-width="1.2"
         vector-effect="non-scaling-stroke" stroke-linejoin="round"/>`;
  /* El "estás acá" NO lleva color: los diez colores ya significan categorías, y
     uno nuevo al lado de ellos se lee como una categoría más. Va una línea clara
     con una funda oscura debajo, así se ve tanto sobre el relleno blanco como
     sobre el fondo. Dos líneas y no una con borde porque un `stroke` no tiene
     borde.
     Los anchos no son cualquiera: 4 y 2,2 dejan 0,9 de funda de cada lado, o
     sea un contorno. Con 3,6 y 1,4 quedaban tres franjas casi iguales y sobre
     el relleno claro se leía como DOS líneas finas, no como una. */
  /* En la posición inicial (idx -1, v0.124) la raya NO va: caería pegada al
     borde redondeado y se leía como un error de dibujo (revisor). Ahí no hay
     nada marcado, igual que en la tira y la lista. */
  const aca = ((idx + 1) * 100 / filas.length).toFixed(2);
  if (idx >= 0) s += `<line x1="${aca}" y1="0" x2="${aca}" y2="100" stroke="var(--eval-negras)"
         stroke-width="4" vector-effect="non-scaling-stroke"/>`;
  if (idx >= 0) s += `<line x1="${aca}" y1="0" x2="${aca}" y2="100" stroke="var(--eval-blancas)"
         stroke-width="2.2" vector-effect="non-scaling-stroke"/>`;
  /* LAS MARCAS VAN DESPUÉS DEL "ESTÁS ACÁ", siempre. Si no, la marca de la
     jugada que se está mirando queda tapada justo por la raya que dice que la
     estás mirando, que es la única que nunca puede desaparecer. */
  /* LOS PUNTOS NO PUEDEN IR ADENTRO DEL SVG. Con preserveAspectRatio="none" el
     dibujo se estira al ancho que haya, así que un <circle> sale óvalo y de un
     ancho distinto en cada partida según cuántas jugadas tenga. Van como
     elementos HTML encima, posicionados en porcentaje: el porcentaje se mide
     contra el contenedor, que no está deformado, y un border-radius de CSS es
     un círculo de verdad.
     Van después del SVG en el HTML, así que quedan encima sin z-index. */
  return s + `</svg>` + marcas.map(m =>
    `<i class="pt" style="left:${m.x.toFixed(2)}%;top:${dentro(m.y).toFixed(2)}%;` +
    `width:6px;height:6px;background:var(--c-${m.clave})"></i>`).join("");
}

/* Temas de tablero. Las casillas ya se pintaban con var(--claro)/var(--oscuro),
   así que cambiar de tema es reescribir dos variables: no toca el dibujo. */
const TEMAS = {
  noche:   { nombre: "Noche",   claro: "#e6e1d3", oscuro: "#7f9466" },
  madera:  { nombre: "Madera",  claro: "#ded3bd", oscuro: "#9a7f5c" },
  torneo:  { nombre: "Torneo",  claro: "#eeeed2", oscuro: "#769656" },
  azul:    { nombre: "Azul",    claro: "#dee3e6", oscuro: "#8ca2ad" },
  nogal:   { nombre: "Nogal",   claro: "#d9c7a7", oscuro: "#7a5c3e" },
  gris:    { nombre: "Gris",    claro: "#dcdcdc", oscuro: "#9e9e9e" }
};
function aplicarTema(id) {
  const t = TEMAS[id] || TEMAS.noche;
  document.documentElement.style.setProperty("--claro", t.claro);
  document.documentElement.style.setProperty("--oscuro", t.oscuro);
  try { localStorage.setItem("tablero", id); } catch (e) { /* modo incógnito */ }
}

/* Se aplica al cargar, y tiene que quedar DESPUÉS de TEMAS y de seguro: son
   const, así que llamarlo antes es zona muerta temporal y la página no arranca
   —pantalla en blanco, sin consola donde verlo. */
/* Tres formas de mostrar la evaluación, y ninguna gana sola:
   - "barra": vertical ancha con el número adentro. El tablero pierde 20 px de
     ancho, y como es cuadrado, los pierde también de alto.
   - "horizontal": el tablero queda grande, pero la barra se suma al alto en
     vez de compartirlo, y el bloque entero pasa de 329 a 353 px.
   - "tarjeta": la barra fina de siempre, con el número al lado de ella en la
     tarjeta del veredicto en vez de en la otra punta.
   Se elige y se guarda; el default es "horizontal", que deja el tablero mas
   grande de los tres y fue el elegido al probarlo en el celular. */
const MODOS_EVAL = {
  horizontal: "barra horizontal",
  tarjeta: "en la tarjeta",
  barra: "barra vertical"
};
let MODO_EVAL = "horizontal";
/* EL DEFAULT DEPENDE DEL ANCHO desde la v0.86, y es la única perilla donde pasa.
   No es una opinión distinta según la pantalla: es que la barra horizontal se
   SUMA al alto —el bloque pasa de 329 a 353— y la vertical lo COMPARTE. En el
   celular el tablero está limitado por el ANCHO, así que sumar alto sale gratis
   y horizontal gana. En una compu el tablero está limitado por el ALTO (v0.80),
   así que esos 24 px salen del tablero: la vertical le devuelve 26 px de lado.
   Misma medida, dos respuestas, porque la pregunta no es la misma. */
const CORTE_ANCHO = "(min-width: 1000px)";
function evalPorDefecto() {
  return window.matchMedia(CORTE_ANCHO).matches ? "barra" : "horizontal";
}
/* `guardar` va en falso al arrancar: si el default se escribiera solo, quedaría
   congelado el del ancho de la PRIMERA carga y la pantalla dejaría de mandar.
   Se guarda cuando el usuario elige, que es cuando hay algo que recordar. */
function aplicarModoEval(id, guardar = true) {
  MODO_EVAL = MODOS_EVAL[id] ? id : evalPorDefecto();
  if (guardar) try { localStorage.setItem("eval", MODO_EVAL); } catch (e) { /* incógnito */ }
}

/* CUÁNTO HABLA LA TARJETA — DIAL TEMPORAL (v0.77).

   La v0.77 sumó catorce conceptos nuevos a una explicación que tenía UNA sola
   ranura para todos, así que la pregunta dejó de ser cuáles medimos y pasó a
   ser cuáles CABEN. Las tres salidas:

   | posición | qué cambia |
   |---|---|
   | **corta** | una ranura: la posición y "cómo llegaste" compiten por el mismo lugar. Dos frases |
   | **media** | dos ranuras: una para lo que se ve en la posición y otra para cómo llegaste. Dos frases |
   | **larga** | lo mismo que media, y entra una frase más: tres |

   "Cómo llegaste" es otra familia —salir del libro hoy, y el rival acababa de
   errar en la v0.78—: no habla de la posición sino de cómo se llegó a jugar
   eso, y por eso puede tener ranura propia sin repetir nada.

   POR DEFECTO VA "media". Se elige usando la app y después se queda una. */
const LARGOS_EXP = {
  corta: { nombre: "corta", ranuras: 1 },
  media: { nombre: "media", ranuras: 2 },
  larga: { nombre: "larga", ranuras: 3 }
};
let LARGO_EXP = "media";
const ranurasDeLaExplicacion = () =>
  (LARGOS_EXP[LARGO_EXP] || LARGOS_EXP.media).ranuras;
function aplicarLargoExp(id) {
  LARGO_EXP = LARGOS_EXP[id] ? id : "media";
  /* lo que reserva la tarjeta (v0.149, ver el CSS de #veredicto): dos frases
     como mucho en corta y media, tres en larga */
  $("veredicto").style.setProperty("--rExp", LARGO_EXP === "larga" ? 3 : 2);
  $("prueba").style.setProperty("--rExp", LARGO_EXP === "larga" ? 3 : 2);   /* (v0.164) */
  try { localStorage.setItem("largoExp", LARGO_EXP); } catch (e) { /* incógnito */ }
}
(function iniciarLargoExp() {
  let guardado = "media";
  try { guardado = localStorage.getItem("largoExp") || "media"; } catch (e) { /* incógnito */ }
  $("largoExp").innerHTML = Object.entries(LARGOS_EXP)
    .map(([k, l]) => `<option value="${k}">${l.nombre}</option>`).join("");
  aplicarLargoExp(guardado);
  $("largoExp").value = LARGO_EXP;
  $("largoExp").onchange = seguro("largo de la explicación", () => {
    aplicarLargoExp($("largoExp").value);
    if (R) pintarRevision();
  });
})();

/* El nombre de la apertura en la tarjeta (v0.159): "cambia" o "siempre", ver
   `aperturaHastaAca`. Se guarda, como el resto de los ajustes de la tarjeta. */
let NOMBRE_AP = "cambia";
(function iniciarNombreAp() {
  try { NOMBRE_AP = localStorage.getItem("nombreAp") === "siempre" ? "siempre" : "cambia"; } catch (e) { /* incógnito */ }
  $("nombreAp").value = NOMBRE_AP;
  $("nombreAp").onchange = seguro("nombre de la apertura", () => {
    NOMBRE_AP = $("nombreAp").value === "siempre" ? "siempre" : "cambia";
    try { localStorage.setItem("nombreAp", NOMBRE_AP); } catch (e) { /* incógnito */ }
    if (R) pintarRevision();
  });
})();

/* CÓMO SE VE LA PANTALLA MIENTRAS SE PRUEBA UNA JUGADA — DIAL TEMPORAL (v0.76).

   El pedido que lo abrió es del usuario y es una sola cosa: CON UNA PRUEBA
   ABIERTA NO TIENE QUE HABER DOS TARJETAS. La punteada —la de la prueba—
   reemplaza a la de la jugada real en vez de apilarse arriba. Eso sacó 92 px de
   una pantalla de 760, medidos con el arnés.

   Lo que quedó sin decidir es DÓNDE VAN LAS JUGADAS PROBADAS, que hoy son una
   tira que envuelve en dos renglones adentro de la tarjeta y se lleva otros 58.
   Se dibujaron las cuatro formas y ninguna ganó mirando capturas, así que van
   las cuatro y se decide usando la app: es la regla de §10 —"cuando dos formas
   se defienden solas, ponerlas las dos y decidir usando la app"— la misma que
   resolvió margen contra gris en la v0.48 con un interruptor que duró dos
   versiones.

   Eran dos ejes —¿la punteada reemplaza a la real o conviven? ¿las probadas
   van adentro de la tarjeta, abajo en la tira, o no van?— y quedó uno: desde
   la v0.160 la punteada siempre reemplaza a la real y lo único que cambia es
   si las probadas van abajo, en la tira de la partida.

   POR DEFECTO VA "sin la lista", que es la más limpia: pedido del usuario.
   Cuando esté elegida, se queda una y el dial se va. */
const FORMAS_PRUEBA = {
  sinLista: { nombre: "sin la lista",   lista: "no" },
  abajo:    { nombre: "la lista abajo", lista: "abajo" }
  /* "la lista adentro" y "las dos tarjetas" se fueron en la v0.160 (Juan:
     "las otras dos sí son malas"), y sus ramas en la v1.0.1. Quien las tenía
     guardadas cae en "abajo" (`aplicarFormaPrueba`). */
};
let FORMA_PRUEBA = "sinLista";
function formaPrueba() { return FORMAS_PRUEBA[FORMA_PRUEBA] || FORMAS_PRUEBA.sinLista; }
function aplicarFormaPrueba(id) {
  /* las dos que se fueron en la v0.160 caen en "abajo": "las dos tarjetas"
     ya tenía la lista abajo, y es la que Juan está probando (revisor) */
  FORMA_PRUEBA = FORMAS_PRUEBA[id] ? id : (id === "adentro" || id === "dos") ? "abajo" : "sinLista";
  try { localStorage.setItem("formaPrueba", FORMA_PRUEBA); } catch (e) { /* incógnito */ }
}
(function iniciarFormaPrueba() {
  let guardado = "sinLista";
  try { guardado = localStorage.getItem("formaPrueba") || "sinLista"; } catch (e) { /* incógnito */ }
  $("formaPrueba").innerHTML = Object.entries(FORMAS_PRUEBA)
    .map(([k, f]) => `<option value="${k}">${f.nombre}</option>`).join("");
  aplicarFormaPrueba(guardado);
  $("formaPrueba").value = FORMA_PRUEBA;
  $("formaPrueba").onchange = seguro("forma de la prueba", () => {
    aplicarFormaPrueba($("formaPrueba").value);
    if (R) pintarRevision();
  });
})();

/* LAS FORMAS DE LA LISTA LATERAL (v0.80). Solo se ven en pantalla ancha; en el
   celular la tira sigue siendo lo único y este dial ni se dibuja.
   Las dos formas y el apagado:
   - PLANILLA: `nº | blancas | negras`, la lista que vivió de la v28 a la v0.73
     tal cual. Densa, la partida entera de un vistazo.
   - UNA POR RENGLÓN: gasta el doble de alto y a cambio muestra cuánto perdió
     cada jugada, que en la planilla no entra —las dos columnas ya están
     ocupadas por los dos colores—.
   - SIN LA LISTA: la vista de siempre, en una sola columna.
   Va con dos puestas y no con una elegida de antemano por la misma razón que el
   margen contra gris de la v0.48: son dos densidades distintas y cuál sirve se
   sabe usándolas, no mirándolas. */
/* "una por renglón" Y EL AJUSTE SE FUERON EN LA v0.160 (Juan no lo usa en
   la compu): queda la planilla. */
const FORMAS_JUGADAS = {
  planilla: { nombre: "planilla",        clase: "planilla" }
  /* "sin la lista" se fue en la v0.125 (revisor): la lista existe solo en la
     compu, y ahí es lo que llena el panel y lo que se recorre con el mouse;
     sin ella el panel terminaba en la curva con 430 px vacíos al lado del
     tablero, lo que Juan rechazó en la v0.118. Quien la tenía guardada cae en
     la planilla (`iniciarFormaJugadas`). */
};
let FORMA_JUGADAS = "planilla";
function formaJugadas() { return FORMAS_JUGADAS[FORMA_JUGADAS] || FORMAS_JUGADAS.planilla; }

/* EL INTERRUPTOR DE "DÓNDE VA LA EXPLICACIÓN" VIVIÓ DE LA v0.64 A LA v0.72 y
   cumplió su función, igual que el de margen contra gris de la v0.48: tenía las
   tres formas puestas, el usuario las miró en el celu y eligió. Lo elegido está
   abajo, en pintarRevision, y las otras dos se fueron con el selector. */

(function iniciarModoEval() {
  let guardado = null;
  try { guardado = localStorage.getItem("eval"); } catch (e) { /* incógnito */ }
  $("verEval").innerHTML = Object.entries(MODOS_EVAL)
    .map(([k, t]) => `<option value="${k}">${t}</option>`).join("");
  /* sin nada guardado manda el ancho, y sin escribirlo */
  aplicarModoEval(guardado, !!guardado);
  $("verEval").value = MODO_EVAL;
  $("verEval").onchange = seguro("modo de eval", () => {
    aplicarModoEval($("verEval").value);
    if (R) pintarRevision();
  });
})();

/* En modo simple las perillas no se esconden: se CONGELAN. Los valores son los
   que ya salieron de las mediciones y están explicados en el traspaso —4 motores
   y Hash 16 MB porque Hash 1 cambia veredictos, MultiPV 2 porque sin eso
   "Genial" no se puede detectar, memoria limpia porque sin eso los resultados
   dejan de ser repetibles—. Se fijan en el DOM y no en el código que analiza,
   así hay una sola fuente de verdad y el resto de la app no se entera del modo.
   "Modo" (crítico/amigable) NO está acá: decide qué tan duro te juzga la app,
   así que es del usuario, no una perilla de medición. */
const CONGELADO = { prof: "16", motores: "4", hashMotor: "16", optMpv: "2" };
if (!window.DEV) {
  for (const [id, v] of Object.entries(CONGELADO)) if ($(id)) $(id).value = v;
  $("optLimpiar").checked = true;
  $("optBarrido").checked = false;
  $("optBloques").checked = false;
}
/* ABRIR Y CERRAR LA HOJA (v0.91). Tres puertas de salida —el botón "Listo",
   tocar afuera y la tecla Escape— porque una hoja que tapa media pantalla sin
   forma evidente de cerrarse es una trampa. El foco va y vuelve: al abrir queda
   en "Listo" y al cerrar vuelve a la tuerca, así no se pierde quien navega con
   teclado. */
/* Dos tuercas, la del inicio y la de la Partida (v0.120), y una sola hoja: el
   foco vuelve a la que la abrió. */
let TUERCA = "btnAjustes";
const verAjustes = (abrir, desde) => {
  if (abrir && desde) TUERCA = desde;
  $("fondoAjustes").classList.toggle("oculto", !abrir);
  $("hojaAjustes").classList.toggle("oculto", !abrir);
  $(TUERCA).setAttribute("aria-expanded", abrir ? "true" : "false");
  (abrir ? $("cerrarAjustes") : $(TUERCA)).focus();
};
$("btnAjustes").onclick = seguro("abrir los ajustes", () => verAjustes(true, "btnAjustes"));
$("btnAjustesInicio").onclick = seguro("abrir los ajustes", () => verAjustes(true, "btnAjustesInicio"));
$("cerrarAjustes").onclick = seguro("cerrar los ajustes", () => verAjustes(false));
/* el velo es de las dos hojas: cierra la que esté abierta (la de Posiciones, v1.2) */
$("fondoAjustes").onclick = seguro("cerrar los ajustes", () => hojaPosAbierta() ? verHojaPos(false) : verAjustes(false));

$("salirDev").onclick = seguro("salir de dev", () => {
  try { localStorage.setItem("dev", "0"); } catch (e) { /* incógnito */ }
  location.search = "";
});

(function iniciarTema() {
  /* EL DE FÁBRICA PASÓ DE MADERA A NOCHE (v0.97, DISENO §1.1), y por eso la
     clave cambió de "tema" a "tablero". Hasta acá el tema se guardaba SIEMPRE
     al cargar, elegido o no, así que todos los teléfonos tienen "madera"
     escrito y no hay forma de saber quién la eligió. Se hereda solo lo que no
     era madera, que eso sí fue una elección; madera se puede volver a elegir
     en ajustes. */
  let guardado = "noche";
  try {
    const viejo = localStorage.getItem("tema");
    guardado = localStorage.getItem("tablero") || (viejo && viejo !== "madera" ? viejo : "noche");
  } catch (e) { /* incógnito */ }
  if (!TEMAS[guardado]) guardado = "noche";
  $("tema").innerHTML = Object.entries(TEMAS)
    .map(([k, t]) => `<option value="${k}">${t.nombre}</option>`).join("");
  $("tema").value = guardado;
  aplicarTema(guardado);
  $("tema").onchange = seguro("tema", () => aplicarTema($("tema").value));
})();
let GIRADO = false;
/* LA GEOMETRÍA DEL TABLERO sale de adentro de `dibujar` en la v0.85, porque
   ahora la usan dos: `dibujar`, que arma el SVG entero, y `svgMarcas`, que
   reescribe SOLO las marcas del usuario adentro del SVG que ya está dibujado. */
const TAB_S = 42, TAB_M = 15;
const sqX = f => (GIRADO ? 7 - f : f) * TAB_S + TAB_M;
const sqY = r => (GIRADO ? 7 - r : r) * TAB_S + TAB_M;
const sqCx = sq => sqX("abcdefgh".indexOf(sq[0])) + TAB_S / 2;
const sqCy = sq => sqY(8 - +sq[1]) + TAB_S / 2;

/* VER UNA JUGADA SIN IR A ELLA (v0.82). Pasar el mouse por una jugada —en la
   lista de al lado o en la tira— muestra esa posición en el tablero, y al salir
   vuelve todo como estaba. Es el gesto de cualquier visor de ajedrez en compu, y
   acá sirve doble: deja recorrer la partida con el ojo sin perder dónde estabas
   parado, que es lo que pasa cuando navegar es la única forma de mirar.

   SE GUARDA EL HTML DEL TABLERO Y SE LO DEVUELVE, en vez de repintar la vista
   entera al salir. Repintar era lo obvio y es peor: `pintarRevision` recentra la
   tira y vuelve a scrollear la lista, así que el renglón se movía abajo del
   mouse y disparaba el hover del renglón de al lado. Guardar y devolver no puede
   desincronizarse, porque lo que vuelve es exactamente lo que había.

   No corre mientras hay una variante abierta: ahí el tablero ya está mostrando
   otra cosa y pisarla sería mentir sobre qué se está probando. */
let TABLERO_PREVIO = null;
/* La posición que está dibujada de verdad, para poder VOLVER a ella: la previa
   pisa el tablero y la tira de comidas, y el HTML guardado alcanza para el
   tablero pero no para la tira, que se recalcula. */
let FEN_VISTO = null;
function previsualizar(i) {
  if (!R || PRUEBA || !R.filas[i]) return;
  if (TABLERO_PREVIO === null) TABLERO_PREVIO = $("tablero").innerHTML;
  const f = R.filas[i];
  /* sin flecha verde y sin resaltado: la previa contesta "¿qué pasó acá?", no
     "¿qué convenía?". La capa va vacía y no ausente porque `dibujar` la lee. */
  $("tablero").innerHTML = dibujar(f.fen, f.uci, null,
    { desde: null, destinos: [], uci: null, resalta: null, sinMarcas: true });
  /* la tira sigue a la posición previsualizada: si se quedara en la de antes
     estaría contando las comidas de un tablero que no es el que se ve */
  pintarComidas(f.fen);
}
function volverDeLaPrevia() {
  if (TABLERO_PREVIO === null) return;
  $("tablero").innerHTML = TABLERO_PREVIO;
  TABLERO_PREVIO = null;
  /* el HTML guardado es de ANTES de la previa: si mientras tanto se dibujó una
     marca, volvería sin ella */
  pintarMarcas();
  if (FEN_VISTO) pintarComidas(FEN_VISTO);
}
/* Con mouse de verdad y no en una pantalla táctil, donde `mouseenter` lo dispara
   el propio toque y la previa pelearía contra el clic que navega.
   SE GUARDA LA CONSULTA Y SE LEE `.matches` CADA VEZ, no el booleano de una sola
   lectura al cargar. Se descubrió en el arnés, y no es un detalle del arnés: una
   tablet a la que le enchufan un teclado con trackpad cambia de respuesta sin
   recargar la página, y con el booleano congelado la previa no aparecía nunca. */
const MQ_MOUSE = window.matchMedia("(hover: hover)");
/* LA PREVIA ESPERA UN MOMENTO ANTES DE APARECER (v0.139). Sin espera se
   disparaba con solo CRUZAR la lista yendo a otro lado, y el tablero parpadeaba
   posiciones que nadie pidió —reportado por Juan—. Con 500 ms (v0.141; los 120 de la
   v0.139 y los 300 de la v0.140 le parecieron cortos a Juan), pasar de largo no
   hace nada y frenarse la muestra casi al toque.
   La salida también espera, pero menos (60 ms), y por otro motivo: entre un
   renglón y el de al lado el mouse sale de uno antes de entrar al otro, y sin
   ese margen el tablero volvía a la posición real y había que esperar de nuevo.
   Así, con una previa ya abierta, recorrer la lista cambia de posición sin
   demora y sin parpadeo.
   Un solo temporizador para las dos cosas: lo último que hizo el mouse manda.
   `pintarRevision` lo corta, porque una previa que llega después de navegar
   pisaría el tablero nuevo. */
const DEMORA_PREVIA = 500, DEMORA_VUELTA = 60;
let PREVIA_T = null;
/* LA PREVIA LA PIDE EL MOUSE AL MOVERSE, NO LA LISTA AL MOVERSE DEBAJO DE ÉL
   (v0.144). Cuando la lista se repinta o scrollea, el navegador le avisa
   `mouseenter` al renglón que quedó debajo del puntero aunque el mouse no se
   haya movido. Con eso, pasar jugadas con las flechas del teclado dejando el
   mouse apoyado en la lista hacía que a los 500 ms el tablero saltara SOLO a
   la jugada de debajo del puntero; y hacerle clic a una jugada le borraba la
   flecha verde medio segundo después, porque la previa de la jugada en la que
   ya se está es el mismo tablero sin flechas. El arnés no lo veía: siempre
   mueve el mouse antes de medir.
   Se guarda dónde estuvo el mouse la última vez que se movió de verdad, y un
   aviso que llega con esas mismas coordenadas no cuenta. `PREVIA_I` es la
   jugada a la que apunta la previa —esperando o ya abierta—, para que moverse
   ADENTRO del mismo renglón no reinicie la espera. */
let MOUSE_X = -1, MOUSE_Y = -1, MOUSE_MOVIO = false, PREVIA_I = null;
document.addEventListener("mousemove", ev => {
  MOUSE_MOVIO = ev.clientX !== MOUSE_X || ev.clientY !== MOUSE_Y;
  MOUSE_X = ev.clientX; MOUSE_Y = ev.clientY;
}, true);
function previaEn(sp, i) {
  if (!MQ_MOUSE.matches) return;
  sp.onmouseenter = sp.onmousemove = ev => {
    /* `mouseenter` llega ANTES que el `mousemove` que lo causó, así que se
       compara contra lo guardado; el `mousemove` llega después de guardarlo,
       y por eso pregunta si ese se movió */
    if (ev.type === "mousemove" ? !MOUSE_MOVIO
                                : ev.clientX === MOUSE_X && ev.clientY === MOUSE_Y) return;
    if (PREVIA_I === i) return;
    PREVIA_I = i;
    clearTimeout(PREVIA_T);
    /* la jugada en la que ya se está no tiene previa: es el tablero de verdad,
       con sus flechas. Si había otra abierta, se vuelve a él. */
    if (i === IDX && !PRUEBA) return volverDeLaPrevia();
    if (TABLERO_PREVIO !== null) previsualizar(i);
    else PREVIA_T = setTimeout(() => previsualizar(i), DEMORA_PREVIA);
  };
  /* SALIR DE UNA JUGADA NO CIERRA LA PREVIA: LA CIERRA SALIR DE LA LISTA
     (v0.141). Entre la jugada de las blancas y la de las negras del mismo
     renglón está el texto de los segundos, y cruzarlo tarda más que el margen
     de la vuelta: la previa se iba y había que esperar de nuevo —reportado por
     Juan: para arriba y abajo andaba, para el costado no—. Ahora, con una
     abierta, salir de la jugada le da el MISMO rato que tarda en aparecer:
     alcanza de sobra para cruzar a la de al lado, y si el mouse se queda sobre
     los segundos o el número, se cierra (v0.142: en la v0.141 quedaba abierta
     mientras no se saliera de la lista, y a Juan no le copó). Si todavía no
     había aparecido, salir la corta. */
  sp.onmouseleave = () => {
    PREVIA_I = null;
    clearTimeout(PREVIA_T);
    if (TABLERO_PREVIO !== null) PREVIA_T = setTimeout(volverDeLaPrevia, DEMORA_PREVIA);
  };
  const cont = sp.closest(".jugadas, .tira");
  if (cont) cont.onmouseleave = () => {
    PREVIA_I = null;
    clearTimeout(PREVIA_T);
    PREVIA_T = setTimeout(volverDeLaPrevia, DEMORA_VUELTA);
  };
}
/* `prueba` es lo que agrega la v0.65 y va en null en el camino normal:
   { desde, destinos, uci }. Cuando viene, el tablero deja de ser un dibujo y
   pasa a recibir toques por casilla. */
/* LAS TRES MEJORES DEL MOTOR (v0.89). Es lo que más acerca esto a una app de
   análisis: hasta acá el motor decía UNA jugada y por qué la tuya era peor, y
   ahora dice qué otras cosas había.

   NO SE CALCULAN SOLAS, y es la decisión de fondo. Cada posición es una corrida
   de motor a la profundidad de la partida, así que pedirlas al pasar de jugada
   sería una corrida por flecha del teclado, peleando con la variante por el
   mismo grupo de motores. Se piden con un botón y se guardan por posición: ir y
   volver por la partida no vuelve a pagar.

   EL DATO NO VIAJABA, aunque el traspaso decía que sí. `evs[i].segunda` existe
   solo donde el usuario jugó la primera del motor —es lo que la pasada híbrida
   necesita para decidir "era la única"—, o sea en una minoría de las posiciones,
   y de la tercera no había nada porque el MultiPV del barrido es 2. Lo que sí
   estaba era toda la plomería: `Motor.analizar` ya parseaba las líneas de
   MultiPV y tiraba de la tercera para arriba. Ahora la devuelve.

   LA PRIMERA DE LAS TRES ES LA MEJOR JUGADA, la misma que ya muestra el cuadrito
   "Mejor". Se deja igual y se marca con el verde de siempre: sacarla dejaría al
   panel diciendo "las otras dos", que no es una lista de las mejores. */
const ALTERNATIVAS = new Map();
let ALT_PIDIENDO = null;
const claveAlt = fen => fen + "|" + ((R && R.profBase) || +$("prof").value || 16);
/* DE QUÉ POSICIÓN SALEN (v0.139): de la de ANTES de la última jugada que se ve,
   no de la que está dibujada. Parado en una jugada lo que uno pregunta es "¿qué
   había en lugar de esta?", y el panel contestaba "¿qué le conviene ahora al
   otro?" —reportado por Juan como un error—. Así la primera coincide con el
   cuadrito "Mejor", que siempre habló de esa misma posición.

   La regla es una sola para la partida y para la variante: la última jugada
   que muestra el tablero. En la variante es la última probada, y si todavía no
   se probó ninguna, la de la partida de la que arranca. Solo cuando no hay
   jugada anterior —la posición inicial— quedan las de la posición que se ve.
   Devuelve también esa jugada, para marcarla en la lista y nombrarla arriba. */
function baseDeAlternativas() {
  if (!R) return null;
  const deLaPartida = i => i >= 0 && R.filas[i]
    ? { fen: fenDeLaJugada(i) || new Chess().fen(), uci: R.filas[i].uci, san: R.filas[i].san }
    : (FEN_VISTO ? { fen: FEN_VISTO, uci: null, san: null } : null);
  if (!PRUEBA) return deLaPartida(IDX);
  const p = PRUEBA;
  if (p.ver > 0) {
    const j = p.linea[p.ver - 1];
    /* La primera de la variante sale de una posición de la PARTIDA, y ahí el
       título sigue nombrando la jugada de la partida: la lista es la misma que
       antes de probar, así que el título no puede cambiar (revisor, v0.139:
       decía "En lugar de Qe7" con Qe7 en la lista). La probada se marca aparte. */
    const real = p.ver === 1 && R.filas[p.desde0];
    return { fen: posicionAntesDe(p.ver - 1).fen || new Chess().fen(), uci: j.uci,
             san: real ? real.san : j.san, probada: true, real: real ? real.uci : null };
  }
  return deLaPartida(p.desde0 - 1);
}
async function pedirAlternativas() {
  /* con el barrido en curso no: ese usa el mismo grupo y ni el tablero responde */
  const base = baseDeAlternativas();
  if (!base || TRABAJANDO) return;
  const fen = base.fen, clave = claveAlt(fen);
  if (ALTERNATIVAS.has(clave) || ALT_PIDIENDO) return;
  ALT_PIDIENDO = clave;
  pintarAlternativas();
  const prof = (R && R.profBase) || +$("prof").value || 16;
  try {
    const [ev] = await enFila(() => evaluarPosiciones([fen], prof, null,
      Object.assign(opcionesDePantalla(), { multipv: 3 })));
    ALTERNATIVAS.set(clave, ev);
    window.LOG.add("·", `alternativas de ${fen.split(" ")[0].slice(0, 12)}… a profundidad ${prof}`);
  } catch (e) {
    ALTERNATIVAS.set(clave, { error: e.message || String(e) });
  } finally {
    ALT_PIDIENDO = null;
    pintarAlternativas();
  }
}
function pintarAlternativas() {
  const lista = $("altLista"), bot = $("btnAlts");
  const base = baseDeAlternativas();
  $("altTit").textContent = base && base.san ? "En lugar de " + base.san : "Las mejores de acá";
  if (!base) { lista.innerHTML = ""; return; }
  const fen = base.fen, clave = claveAlt(fen);
  const ev = ALTERNATIVAS.get(clave);
  const pensando = ALT_PIDIENDO === clave;
  /* PENSANDO, TRES FILAS FANTASMA donde van a caer las jugadas (v0.181, Juan
     sobre la variante A de la v0.180). Para la caja vacía se descartó (un
     esqueleto dice "ya viene algo" cuando no viene nada); mientras el motor
     piensa sí viene, y las filas entran en el mismo lugar, sin salto. */
  ver("btnAlts", !ev && !pensando);
  bot.disabled = TRABAJANDO;
  if (pensando) {
    lista.innerHTML = `<div role="status" aria-label="Pensando…">` + [46, 38, 42].map((a, i) =>
      `<div class="alt fant" aria-hidden="true"><span class="an">${i + 1}</span>` +
      `<span><i style="width:${a}px"></i></span><span class="ae"><i style="width:34px"></i></span></div>`).join("") + `</div>`;
    return;
  }
  if (!ev) { lista.innerHTML = ""; return; }
  if (ev.error) { lista.innerHTML = `<div class="altNota">No se pudo: ${ev.error}</div>`; return; }
  const turno = fen.split(" ")[1];
  /* la primera sale de `mejor`, que es la del `bestmove`; las otras dos de las
     líneas de MultiPV. Una posición con una o dos jugadas legales devuelve menos
     de tres, y entonces se muestran las que hay. */
  const filas = [{ uci: ev.mejor, cp: ev.cp, mate: ev.mate }]
    .concat([ev.segunda, ev.tercera].filter(Boolean).map(l => ({ uci: l.mov, cp: l.cp, mate: l.mate })))
    .filter(x => x.uci && sanDeUci(fen, x.uci))
    /* sin repetidas: un motor que manda la misma jugada en dos líneas dejaría el
       panel diciendo dos veces lo mismo, y eso se lee como un error de la app */
    .filter((x, i, a) => a.findIndex(y => y.uci === x.uci) === i);
  if (!filas.length) { lista.innerHTML = `<div class="altNota">No hay jugadas.</div>`; return; }
  /* "probada" y no "la jugada" en la variante: la tarjeta ya llama "en la
     partida" a la otra, y dos cosas distintas con el mismo nombre confunden */
  const marca = u => u === base.uci ? (base.probada ? "probada" : "la jugada")
    : (u === base.real ? "la jugada" : "");
  lista.innerHTML = filas.map((x, i) =>
    `<div class="alt${i === 0 ? " primera" : ""}${marca(x.uci) ? " jugada" : ""}">` +
    `<span class="an">${i + 1}</span>` +
    `<span><span class="as" data-uci="${x.uci}" role="button" tabindex="0">${sanDeUci(fen, x.uci)}</span>` +
    (marca(x.uci) ? `<span class="aj">${marca(x.uci)}</span>` : "") + `</span>` +
    `<span class="ae">${textoEval({ cp: x.cp, mate: x.mate }, turno)}</span></div>`).join("");
  lista.querySelectorAll("[data-uci]").forEach(sp => {
    sp.onclick = seguro("probar alternativa", () => jugarAlternativa(sp.dataset.uci));
  });
}
/* Tocar una alternativa la PRUEBA EN LUGAR de la jugada: abre la variante desde
   la posición de ANTES —la misma de la que salen las tres— y juega ahí. En la
   variante reemplaza a la última probada, así que se pueden tocar las tres una
   atrás de la otra y la lista no cambia: siguen siendo alternativas entre sí.
   Tocar la que ya se jugó no hace nada: es lo que el tablero ya muestra. */
$("btnAlts").onclick = seguro("alternativas", pedirAlternativas);
function jugarAlternativa(uci) {
  const base = baseDeAlternativas();
  if (TRABAJANDO || !base || uci === base.uci) return;
  if (!PRUEBA) abrirPrueba(Math.max(IDX, 0));
  else if (PRUEBA.ver > 0) PRUEBA.ver--;
  else if (PRUEBA.desde0 > 0) abrirPrueba(PRUEBA.desde0 - 1);
  const m = new Chess(posicionVista().fen).moves({ verbose: true })
    .find(x => x.from + x.to + (x.promotion || "") === uci);
  if (m) probarJugada(m);
}

/* LA TIRA DE PIEZAS COMIDAS (v0.87). Al costado del tablero y SOLO en una compu:
   en el celular no hay ancho de sobra y la vista ya está apretada. Lo que se
   muestra al lado de cada jugador es lo que comió ÉL, que es la convención de
   todos lados; por eso el cruce, las piezas que comió el blanco son negras.

   VA EN LA FILA DEL TABLERO y no arriba ni abajo, porque lo que escasea en una
   compu es el ALTO —es lo que limita el tablero (§4duovicies)— y lo que sobra es
   el ancho. Sumarlo arriba le habría sacado tablero, que es lo contrario de lo
   que viene haciendo esta tanda. En una ventana muy alta, de 1010 para arriba,
   el tablero llega a los 680 y ahí sí le cede los 108 px a la tira: es el único
   caso donde cuesta, y ahí el tablero ya es enorme.

   El número es la DIFERENCIA de material y va solo del lado del que va ganando:
   "+3" en las dos puntas sería el mismo dato dos veces con el signo cambiado. */
const LADO_COMIDA = 20, POR_FILA_COMIDAS = 5;
function svgComidas(color, faltan) {
  const lista = [];
  for (const t of ORDEN_COMIDAS)
    for (let i = 0; i < (faltan[t] || 0); i++) lista.push(t);
  if (!lista.length) return "";
  const filas = Math.ceil(lista.length / POR_FILA_COMIDAS);
  const esc = (LADO_COMIDA / LADO_PIEZA).toFixed(4);
  /* el ancho es el de las piezas que hay, no el del renglón entero: con la
     pastilla de fondo (v0.97.1), un peón solo dejaba una franja vacía */
  const an = Math.min(lista.length, POR_FILA_COMIDAS) * LADO_COMIDA, al = filas * LADO_COMIDA;
  /* el `use` apunta a los símbolos que viven en el `<defs>` del tablero: son el
     mismo documento, así que la referencia vale aunque sean dos SVG distintos */
  return `<svg width="${an}" height="${al}" viewBox="0 0 ${an} ${al}">` +
    lista.map((t, i) =>
      `<use href="#cb-${color}${t}" transform="translate(${(i % POR_FILA_COMIDAS) * LADO_COMIDA}` +
      ` ${Math.floor(i / POR_FILA_COMIDAS) * LADO_COMIDA}) scale(${esc})"/>`).join("") +
    "</svg>";
}
function pintarComidas(fen) {
  /* contra el arranque de la partida, que es la inicial salvo desde una posición */
  const c = piezasComidas(fen, (R && R.fens && R.fens[0]) || null);
  /* arriba del tablero juega el negro, salvo que esté girado */
  const pintar = (id, come) => {
    /* lo que comió el blanco son piezas NEGRAS: por eso se cruza */
    const perdio = come === "w" ? "b" : "w";
    const dif = come === "w" ? c.dif : -c.dif;
    $(id).innerHTML = svgComidas(perdio, c[perdio]) +
      (dif > 0 ? `<span class="cDif">+${dif}</span>` : "");
  };
  pintar("cArriba", GIRADO ? "w" : "b");
  pintar("cAbajo", GIRADO ? "b" : "w");
}

/* LAS MARCAS DEL USUARIO (v0.85). Con el botón derecho: apretar y soltar en la
   misma casilla la pinta, apretar en una y soltar en otra dibuja una flecha, y
   repetir el mismo gesto la borra. Es la convención de lichess y de chess.com,
   o sea que no hay nada que aprender y no hay dónde explicarlo.

   NO SON UNA JUGADA, y esa es la decisión: no pasan por `tocarCasilla`, no abren
   la variante y no tocan nada guardado. Son un lápiz sobre el tablero para pensar
   —"esta pieza mira acá", "el problema son estas dos casillas"— y por eso se
   borran solas en cuanto la posición cambia: las limpia `pintarRevision`, que es
   por donde pasan todos los caminos que mueven el tablero.

   VAN EN DOS CAPAS y no en una. Las casillas van DEBAJO de las piezas, igual que
   el resaltado de la explicación, porque son un fondo y no pueden tapar la pieza
   de la que hablan. Las flechas van ARRIBA, porque una flecha que pasa por debajo
   de una pieza se corta a la mitad.

   LA PUNTA es lo que las distingue de las cuatro flechas de la app, que son una
   línea con una bolita en la punta. Un color se puede confundir con otro; una
   forma distinta, no. El color vive en `--marca` para poder cambiarlo en un solo
   lugar. */
let MARCAS_TAB = [];
/* El polígono de una flecha: cola de `ancho`, punta de `ancho * 2,2` de ancho
   y 15 de largo, todo en unidades del tablero (la casilla mide 42). */
const FLECHA_OPACIDAD = .7;
function poligonoFlecha(x1, y1, x2, y2, ancho, color, opacidad) {
  const largo = Math.hypot(x2 - x1, y2 - y1) || 1;
  const ux = (x2 - x1) / largo, uy = (y2 - y1) / largo;
  const px = -uy, py = ux;
  const ax = x1 + ux * TAB_S / 4, ay = y1 + uy * TAB_S / 4;
  const lp = Math.min(15, largo * .45);
  const bx = x2 - ux * lp, by = y2 - uy * lp;
  const c = ancho / 2, p = ancho * 1.1;
  const n = v => v.toFixed(1);
  const pt = (x, y) => `${n(x)} ${n(y)}`;
  return `<path d="M ${pt(ax + px * c, ay + py * c)} L ${pt(bx + px * c, by + py * c)}
    L ${pt(bx + px * p, by + py * p)} L ${pt(x2, y2)} L ${pt(bx - px * p, by - py * p)}
    L ${pt(bx - px * c, by - py * c)} L ${pt(ax - px * c, ay - py * c)} Z"
    fill="${color}" opacity="${opacidad}" stroke-linejoin="round"/>`;
}
function svgMarcas(capa) {
  let s = "";
  for (const m of MARCAS_TAB) {
    const casilla = m.a === m.z;
    if (capa === "bajo" && casilla) {
      const c = "abcdefgh".indexOf(m.a[0]), r = 8 - +m.a[1];
      s += `<rect x="${sqX(c)}" y="${sqY(r)}" width="${TAB_S}" height="${TAB_S}"
        fill="var(--marca)" opacity=".42"/>`;
    }
    if (capa === "alto" && !casilla) {
      /* LA MISMA FORMA QUE LAS DE LA APP desde la v0.101 (lo eligió Juan, como
         en chess.com): las distingue el color, `--marca`. Hasta la v0.100 eran
         una línea con cabo redondo más un triángulo. */
      s += poligonoFlecha(sqCx(m.a), sqCy(m.a), sqCx(m.z), sqCy(m.z), 9,
                          "var(--marca)", FLECHA_OPACIDAD);
    }
  }
  return s;
}
/* Reescribe SOLO las dos capas de marcas del tablero que ya está en pantalla.
   No repinta la vista: `pintarRevision` recentra la tira y vuelve a scrollear la
   lista, y dibujar una flecha no tiene por qué mover nada de lugar. */
function pintarMarcas() {
  const bajo = $("mBajo"), alto = $("mAlto");
  if (bajo) bajo.innerHTML = svgMarcas("bajo");
  if (alto) alto.innerHTML = svgMarcas("alto");
}
function dibujar(fen, jugada, mejor, prueba) {
  const b = new Chess(fen).board();
  const S = TAB_S, M = TAB_M, T = S * 8;
  const fx = sqX, ry = sqY, cx = sqCx, cy = sqCy;
  let s = `<svg class="tab" viewBox="0 0 ${T + M * 2} ${T + M * 2}" xmlns="http://www.w3.org/2000/svg">` +
    `<defs>${PIEZAS}</defs>`;
  for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++)
    s += `<rect x="${fx(f)}" y="${ry(r)}" width="${S}" height="${S}" fill="${(r + f) % 2 === 0 ? "var(--claro)" : "var(--oscuro)"}"/>`;
  /* LO QUE LA FRASE ESTÁ SEÑALANDO (v0.69). Va acá, DEBAJO de las piezas: es un
     fondo, no una marca, así que no puede tapar la pieza de la que habla.
     El ámbar es el cuarto color y no pisa a ninguno: azul es lo que se jugó,
     verde lo que decía el motor, violeta lo inventado. */
  const resalta = (prueba && prueba.resalta) || null;
  if (resalta && resalta.sq) for (const sq of [].concat(resalta.sq)) {
    const c = "abcdefgh".indexOf(sq[0]), r = 8 - +sq[1];
    if (c < 0 || r < 0 || r > 7) continue;
    s += `<rect x="${fx(c)}" y="${ry(r)}" width="${S}" height="${S}" fill="var(--senal)" opacity=".55"/>`;
  }
  /* las casillas marcadas por el usuario, también debajo de las piezas. El grupo
     va SIEMPRE, vacío o no: `pintarMarcas` lo busca por id para no repintar. */
  const conMarcas = !(prueba && prueba.sinMarcas);
  s += `<g id="mBajo">${conMarcas ? svgMarcas("bajo") : ""}</g>`;
  /* Cburnett trae la convención de siempre: siluetas distintas por pieza, las
     blancas huecas y las negras rellenas. Reemplaza la regla de la v26 —misma
     silueta para los dos bandos, el bando distinguido por el relleno—, que
     existía solo porque los glifos Unicode no daban para más. */
  const esc = S / LADO_PIEZA;
  for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) {
    const p = b[r][f];
    if (!p) continue;
    /* `data-pz` es la casilla de la pieza, y existe para poder AGARRARLA: sin
       eso, arrastrar tendría que adivinar cuál de los `<use>` corresponde a la
       casilla que se apretó. No lo usa el dibujo, lo usa el arrastre. */
    s += `<use href="#cb-${p.color}${p.type}" data-pz="${"abcdefgh"[f]}${8 - r}" ` +
      `transform="translate(${fx(f)} ${ry(r)}) scale(${esc.toFixed(4)})"/>`;
  }
  /* LAS FLECHAS DE LA APP, COMO LAS DE CHESS.COM (v0.100). Pedido de Juan con
     capturas de chess.com al lado: anchas, con punta triangular y
     SEMITRANSPARENTES, así la pieza se ve a través. La v0.99 les había puesto
     un aro oscuro y una bolita de radio 8,5 en la punta, y la bolita tapaba la
     cabeza de la pieza de destino ("no me copa").
     Es UN SOLO polígono —cola y punta juntas— y no una línea más un triángulo:
     con transparencia, donde dos figuras se pisan el color se suma y queda una
     franja más oscura. La cola arranca a un cuarto de casilla del centro de
     origen y la punta termina en el centro de la de destino. `ancho` es el de
     la cola; la punta mide algo más del doble. */
  const flecha = (uci, color, ancho) => {
    if (!uci || uci.length < 4) return "";
    const a = uci.slice(0, 2), z = uci.slice(2, 4);
    return poligonoFlecha(cx(a), cy(a), cx(z), cy(z), ancho, color, FLECHA_OPACIDAD);
  };

  s += flecha(jugada, "var(--f-jugada)", 9);
  if (mejor) s += flecha(mejor, "var(--f-mejor)", 9);
  /* La jugada probada va en VIOLETA, que es el único color que no está usado:
     azul es lo que se jugó y verde lo que decía el motor. Con tres flechas a la
     vez el color es lo único que las distingue. */
  if (prueba && prueba.uci) s += flecha(prueba.uci, "#6a1b9a", 9);
  if (resalta && resalta.uci) s += flecha(resalta.uci, "var(--senal)", 9);
  /* y las flechas del usuario arriba de todo lo demás */
  s += `<g id="mAlto">${conMarcas ? svgMarcas("alto") : ""}</g>`;
  for (let f = 0; f < 8; f++)
    s += `<text x="${fx(f) + S / 2}" y="${T + M + 10}" font-size="11.2" text-anchor="middle" fill="var(--tenue)">${"abcdefgh"[f]}</text>`;
  for (let r = 0; r < 8; r++)
    s += `<text x="${M - 4}" y="${ry(r) + S / 2}" font-size="11.2" text-anchor="end" dominant-baseline="central" fill="var(--tenue)">${8 - r}</text>`;
  /* Galones que avisan que el tablero se puede deslizar. Van en el margen de
     coordenadas del SVG —el borde de 15 px donde viven las letras y los
     números—, así que no le sacan un píxel al tablero. Quedan a media altura,
     donde no hay ninguna etiqueta: las de las filas 4 y 5 pasan a 21 px de ahí.
     Además de avisar, se tocan: el usuario los leyó como botones antes de que
     lo fueran, así que lo son. */
  const mitad = M + T / 2;
  const galon = (x, hacia) =>
    `<path class="galon" d="M ${x + hacia * 2.5} ${mitad - 7} L ${x - hacia * 2.5} ${mitad} L ${x + hacia * 2.5} ${mitad + 7}"
      fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"
      stroke-linejoin="round" opacity=".38"/>`;
  /* Los galones SE QUEDAN, y son solo dibujo: avisan que el tablero se
     desliza, que es lo que la v32 les pidió. Lo que se fue en la v0.66 son sus
     ZONAS DE TOQUE, abajo. */
  /* Y SOLO DEL LADO EN QUE SE PUEDE IR (v0.124, revisor): en la posición
     inicial no hay jugada anterior y en la última no hay siguiente, así que el
     galón de ese lado prometía un deslizamiento que no hace nada. Es lo mismo
     que dice "‹" o "›" apagado abajo. */
  if (!(prueba && prueba.sinAtras)) s += galon(M / 2 - 1, 1);
  if (!(prueba && prueba.sinAdelante)) s += galon(T + M + M / 2 + 1, -1);
  /* LAS ZONAS DE TOQUE DE LOS GALONES SE FUERON EN LA v0.66, y el comentario
     que estaba acá lo venía anunciando desde la v32: se comían los 10 px
     exteriores de las columnas a y h, "si alguna vez se puede tocar una
     casilla, hay que reducirlas". Llegó ese día y no se redujeron: se sacaron.
     Tocar una pieza gana sobre tocar para navegar, porque para navegar están el
     deslizamiento —que es lo que los galones siguen anunciando—, los botones,
     la tira de jugadas y la curva, o sea cuatro caminos contra uno.
     Decisión del usuario, y el criterio que la ordena: el toque sobre una pieza
     es lo único que no tiene otra forma de hacerse. */

  /* --- el tablero se toca SIEMPRE, no solo probando --- */
  {
    const px = sq => fx("abcdefgh".indexOf(sq[0]));
    const py = sq => ry(8 - +sq[1]);
    /* la casilla elegida: un marco y no un relleno, o tapa la pieza que estás
       por mover, que es justo la que hay que ver */
    if (prueba && prueba.desde)
      s += `<rect x="${px(prueba.desde) + 2}" y="${py(prueba.desde) + 2}" width="${S - 4}"
        height="${S - 4}" fill="none" stroke="#6a1b9a" stroke-width="3" rx="3"/>`;
    /* adónde puede ir: punto en la casilla vacía, aro en la que tiene algo.
       Es la convención de todos los tableros digitales y no hay nada que
       aprender. El aro va del tamaño de la casilla para que se lea como
       "acá comés" y no como un punto grande. */
    for (const d of (prueba && prueba.destinos) || []) {
      /* si hay algo en el destino sale del tablero que ya se armó arriba: un
         `new Chess(fen)` por casilla serían treinta por pintada */
      const hay = b[8 - +d[1]]["abcdefgh".indexOf(d[0])];
      s += hay
        ? `<circle cx="${px(d) + S / 2}" cy="${py(d) + S / 2}" r="${S / 2 - 3}" fill="none"
            stroke="#6a1b9a" stroke-width="3" opacity=".55"/>`
        : `<circle cx="${px(d) + S / 2}" cy="${py(d) + S / 2}" r="6" fill="#6a1b9a" opacity=".45"/>`;
    }
    /* las 64 casillas que reciben el toque, al final para quedar por encima de
       las piezas: un <use> se come el click y el <rect> del fondo no se entera */
    /* la manito abierta SOLO donde hay una pieza: es lo que avisa que eso se
       agarra y se arrastra, y sobre una casilla vacía prometería algo falso */
    /* LA PIEZA QUE PUEDE MOVER SE ARRASTRA TAMBIÉN CON EL DEDO (v0.169,
       Juan). Su casilla lleva `data-mueve`, que es lo que miran el arrastre y
       el `touchmove` que le corta el scroll al navegador (abajo, con el
       deslizamiento). Desde cualquier otra casilla el dedo sigue deslizando
       jugadas y scrolleando la página, como siempre. */
    const mueven = new Set(new Chess(fen).moves({ verbose: true }).map(m => m.from));
    for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) {
      const sq = "abcdefgh"[f] + (8 - r);
      s += `<rect x="${fx(f)}" y="${ry(r)}" width="${S}" height="${S}" fill="transparent"
        data-sq="${sq}"${mueven.has(sq) ? " data-mueve" : ""} style="cursor:${b[r][f] ? "grab" : "pointer"}"/>`;
    }
  }
  return s + "</svg>";
}

