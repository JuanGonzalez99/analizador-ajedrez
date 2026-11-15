/* Chequeos estáticos sobre index.html. Correr: node pruebas/estaticos.mjs
   Agarran los errores que las pruebas de node no ven, porque viven en el DOM. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const fallas = [];
const chequear = (nombre, malas) => {
  if (malas.length) fallas.push(`${nombre}: ${malas.join(", ")}`);
  else console.log(`  ok  ${nombre}`);
};

/* 1. Todo id referenciado en JS existe en el HTML. */
const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
const usados = new Set([
  ...[...html.matchAll(/\$\("([^"]+)"\)/g)].map(m => m[1]),
  ...[...html.matchAll(/getElementById\("([^"]+)"\)/g)].map(m => m[1]),
]);
chequear("ids referenciados existen", [...usados].filter(i => !ids.has(i)));

/* 2. Toda tabla tiene una leyenda justo antes.
      Antes esto miraba los nombres: <table id="mesX"> tenía que ir con un id
      "capX". Esa convención no describía la realidad —la leyenda de mesFranja
      se llama capMesFranja, y la de mesResumen se llama capMes— y el chequeo
      pasaba de casualidad, porque existían capFranja y capResumen, que eran las
      leyendas de OTRAS tablas. Al borrar la tabla de franjas por partida, en la
      v34, quedó al descubierto.
      Ahora se mira la estructura y no el nombre: antes de cada tabla, cerca,
      tiene que haber un elemento con class="cap". Cubre todas las tablas y no
      solo las del mes. */
/* 2bis. Ningún comentario adentro de un template literal de HTML.

   Pasó de verdad y se vio desde el celular: un `/* ... *\/` puesto adentro de
   los backticks no es un comentario, es TEXTO, y se imprime en la pantalla en
   el medio de la tabla. Rompió cinco tablas a la vez, y ni las pruebas de
   unidad ni la medición de alineación lo agarraron, porque las dos miraban
   filas y celdas y el texto caía fuera de ellas. Lo vio el usuario. */
const enTemplate = [...html.matchAll(/innerHTML = `([\s\S]*?)`;/g)]
  .flatMap(m => [...m[1].matchAll(/\/\*[\s\S]*?\*\//g)]
    .map(c => c[0].replace(/\s+/g, " ").slice(0, 50) + "…"));
chequear("sin comentarios adentro del HTML", enTemplate);

/* Sin ventana de N caracteres: se mira el tramo que va desde la tabla ANTERIOR
   hasta esta. Ahí adentro tiene que haber un class="cap", o sea una leyenda
   propia y no la de la tabla de arriba. La ventana de 200 caracteres se rompía
   sola cuando algo se metía en el medio —pasó al agregar el interruptor de la
   v0.48— sin que hubiera nada mal. */
const tablas = [...html.matchAll(/<table id="([^"]+)"/g)];
/* La traspuesta (`data-traspuesta`, v0.137) es la MISMA tabla dada vuelta
   para la compu, y se muestra en lugar de la otra, nunca junto: comparte su
   leyenda. */
const sinLeyenda = tablas.filter((m, i) => {
  if (/^<table id="[^"]+" data-traspuesta=/.test(html.slice(m.index, m.index + 80))) return false;
  const desde = i ? tablas[i - 1].index : 0;
  return !html.slice(desde, m.index).includes('class="cap"');
}).map(m => m[1]);
chequear("cada tabla tiene su propia leyenda", sinLeyenda);

/* 3. Todo lugar que asigna la partida elegida rehabilita los botones. */
const asigna = [...html.matchAll(/^.*\bPARTIDA\s*=\s*(?!null).*$/gm)].map(m => m[0].trim());
chequear("asignar PARTIDA rehabilita botones",
  asigna.filter(l => !/habilitar|disabled\s*=\s*false/.test(l)
                  && !/habilitar\(/.test(html.slice(html.indexOf(l), html.indexOf(l) + 400))));

/* 4. Toda tabla y leyenda declarada en el HTML se usa desde el JS.
      Agarra los restos de una tabla borrada a medias. */
const citado = i => new RegExp(`"${i}"`, "g");
const huerfanos = [...ids].filter(i =>
  /^(mes|cap)[A-Z]/.test(i) && (html.match(citado(i)) || []).length < 2);
chequear("sin tablas ni leyendas huérfanas", huerfanos);

/* 5. Toda tabla vive dentro de un contenedor que scrollea. Sin eso, una fila
      con etiqueta larga estira la tabla y el celu recorta la última columna:
      el número queda invisible y nada avisa. */
const sueltas = [...html.matchAll(/(.{0,24})<table id="([^"]+)"/g)]
  .filter(m => !m[1].includes('class="tw"')).map(m => m[2]);
chequear("cada tabla scrollea sola", sueltas);

/* 6. El módulo entero parsea. Los extractores solo miran dos pedazos, así que
      un error de sintaxis en el resto —la interfaz, el motor, la caché— no lo
      agarraba nada y aparecía como pantalla en blanco en el celu. */
const mod = (html.match(/<script type="module">([\s\S]*?)<\/script>/) || [])[1];
const tmp = path.join(os.tmpdir(), "analizador-modulo.mjs");
let malSintaxis = [];
if (!mod) malSintaxis = ["no se encontró el <script type=module>"];
else {
  fs.writeFileSync(tmp, mod, "utf8");
  const r = spawnSync(process.execPath, ["--check", tmp], { encoding: "utf8" });
  if (r.status !== 0) malSintaxis = [(r.stderr || "").split(String.fromCharCode(10)).slice(0, 4).join(" ").trim()];
  fs.unlinkSync(tmp);
}
chequear("el módulo parsea", malSintaxis);

/* 7. El traspaso dice en qué versión está al día. Si el HTML subió de versión
      y el documento no, alguien cambió algo y no lo anotó (§10). */
const doc = fs.readFileSync(new URL("../TRASPASO.md", import.meta.url), "utf8");
/* Desde la v0.35 la versión se muestra como "v0.35" y no como "v35". Es el
   mismo contador de siempre —no se reinició nada, v35 es v0.35—, solo que
   escrito como un número de versión de verdad. Las dos formas se aceptan
   porque las secciones viejas del traspaso nombran commits reales. */
/* "v35" y "v0.35" son la misma versión —el contador nunca se reinició—, así que
   se normalizan antes de comparar. Desde la v0.56.1 hay un TERCER número para
   los parches, y por eso ya no alcanza con mirar el primero: v0.56 y v0.56.1
   son dos deploys distintos y el traspaso tiene que decir cuál. */
const norm = t => {
  const s = String(t || "").replace(/^v/, "");
  return /^\d+$/.test(s) ? "0." + s : s;
};
const vHtml = norm((html.match(/window\.VERSION = "(v[\d.]+)/) || [])[1]);
const vDoc = norm((doc.match(/al día en la \*\*(v[\d.]+)\*\*/) || [])[1]);
chequear("el traspaso está al día",
  vHtml && vHtml === vDoc ? [] : [`index.html es ${vHtml} y TRASPASO.md dice ${vDoc}`]);

/* 7bis. La precisión de la fila dice qué es (v0.129). Juan no entendió el
   número suelto ("Ganada 89"): el número va con "prec." y el Mes no pone un
   "—" mudo donde no hay precisión. */
{
  const fila = (html.match(/function filaDePartida[\s\S]*?\n\}/) || [""])[0];
  const lista = (html.match(/function pintarLista[\s\S]*?\n\}/) || [""])[0];
  chequear("la precisión de la fila dice qué es", [
    ...(/prec\.\\u00a0/.test(fila) ? [] : ["filaDePartida no antepone \"prec.\" al número"]),
    ...(/"\\u2014" : Math\.round/.test(lista) ? ["pintarLista vuelve a poner un guion mudo"] : []),
  ]);
}

/* 7ter. La fila sin jugada no pone glifos mudos (v0.131): en la inicial va la
   leyenda en vez de tres "—", y sin reloj Pensó dice "sin reloj" y no "·". */
chequear("la fila sin jugada dice qué pasa", [
  ...(/id="mLeyenda"/.test(html) ? [] : ["falta la leyenda del arranque (#mLeyenda)"]),
  ...(/toggle\("enInicio", enInicio\)/.test(html) ? [] : ["la fila no se entera de la posición inicial"]),
  ...(/sinReloj \? "sin reloj"/.test(html) ? [] : ["Pensó vuelve al \"·\" sin reloj"]),
]);

/* 7quater. [PC] Las comidas van arriba y abajo del tablero (v0.132), no en
   una columna al costado que en la apertura quedaba vacía. */
chequear("las comidas no vuelven a la columna", [
  ...(/flex: 0 0 64px; padding: var\(--mTab\) 0/.test(html) ? ["volvió la columna de 64"] : []),
  ...(/\.comidas \{ position: absolute;/.test(html) ? [] : [".comidas no se superpone al tablero"]),
  ...(/b\.style\.top = \(s\.bottom - r\.top \+ 4\)/.test(html) ? [] : ["Girar no va en el renglón de abajo"]),
]);

/* 7quinquies. [PC] En ventanas angostas y altas la curva baja debajo del
   tablero (v0.135), y lo decide una cuenta en JS, no un ancho: una media
   query no puede restar vh de vw. Sin el listener de `resize` no cambiaría al
   achicar el alto, porque el observador de `.revtab` no se entera (el tablero
   no cambia de tamaño). */
chequear("la curva baja cuando sobra alto", [
  ...(/#zonaRevision\.curvaAbajo > \.curva \{ grid-column: 1; grid-row: 5;/.test(html) ? [] : ["falta el CSS de .curvaAbajo"]),
  ...(/function ubicarCurva\(\)/.test(html) ? [] : ["falta ubicarCurva()"]),
  ...(/window\.addEventListener\("resize", ubicarCurva\)/.test(html) ? [] : ["ubicarCurva no escucha el resize"]),
  ...(/function ubicarGirar\(f\) \{\n  ubicarCurva\(\);/.test(html) ? [] : ["ubicarGirar no llama a ubicarCurva"]),
]);

/* 7sexies. [PC] La barra horizontal arranca con la columna a (v0.136), no
   con la caja del SVG: medía el ancho del grupo y empezaba 22 a 28 px antes
   que las casillas. La pone `--izqCurva`, que calcula `ubicarGirar()` con la
   escala del tablero; `mirar` mide el desfasaje ("barra horizontal:"). */
chequear("la barra horizontal arranca con las casillas", [
  ...(/#zonaRevision > \.parriba > \.evalh \{ margin-left: var\(--izqCurva/.test(html) ? [] : ["falta el margen de la barra horizontal"]),
]);

/* 7septies. [PC] El Resumen va al ancho del grupo (v0.137): de la columna a
   al borde del panel, con los números que pone `ubicarResumen()`. Medía 1082
   fijo y centrado, y eran dos cajas de anchos distintos. `mirar` mide el
   desfasaje ("resumen al ancho del grupo:"). */
chequear("el resumen va al ancho del grupo", [
  ...(/#zonaResumen \{ max-width: none;\s+width: var\(--resAncho/.test(html) ? [] : ["falta el ancho del Resumen"]),
  ...(/window\.addEventListener\("resize", ubicarResumen\)/.test(html) ? [] : ["ubicarResumen no se recalcula al cambiar el ancho"]),
  ...(/ubicarResumen\(\);\n/.test(html) ? [] : ["ubicarGirar no llama a ubicarResumen"]),
  /* y en la compu va la tabla traspuesta, una fila por jugador; en el celu
     sigue escondida (no entran diez columnas en 386) */
  ...(/<div class="resAncho"><div class="tw"><table id="resumenAncho"/.test(html) ? [] : ["falta la tabla traspuesta"]),
  ...(/\n  \.resAncho \{ display: none; \}/.test(html) ? [] : ["la tabla traspuesta no arranca escondida"]),
]);

/* 7octies. "cambiar" no cambia la cabecera (v0.138): el renglón del usuario
   se queda con la tuerca, el enlace pasa a "cancelar" y vuelve a plegar, y
   el renglón se achica en vez de tirar la tuerca abajo con un nombre largo. */
chequear("cambiar no cambia la cabecera", [
  ...(/body\.cambiando #yaUsuario \{ display: none/.test(html) ? ["el renglón del usuario se esconde al cambiar"] : []),
  ...(/function cambiando\(si\)/.test(html) ? [] : ["falta cambiando()"]),
  ...(/#yaUsuario \{[^}]*flex: 1 1 0; min-width: 0;/.test(html) ? [] : ["el renglón del usuario no se achica"]),
]);

/* 7nonies. Lo que hace un mouse de verdad (v0.144): la previa no se arma con
   el aviso que manda el navegador cuando la lista se mueve debajo del puntero,
   el arrastre de la pieza y el de la tira capturan el puntero para enterarse
   de que se soltó afuera, las flechas recorren la variante y no se comen los
   atajos del navegador. `mirar` lo mide con el mouse ("mouse de verdad:"). */
chequear("el mouse quieto no pide la previa", [
  ...(/ev\.clientX === MOUSE_X && ev\.clientY === MOUSE_Y\) return;/.test(html) ? [] : ["la previa no descarta el aviso sin movimiento"]),
  ...(/if \(i === IDX && !PRUEBA\) return volverDeLaPrevia\(\);/.test(html) ? [] : ["la jugada elegida tiene previa"]),
  ...(/cont\.setPointerCapture\(ev\.pointerId\)/.test(html) ? [] : ["el arrastre de la pieza no captura el puntero"]),
  ...(/sc\.setPointerCapture\(e\.pointerId\)/.test(html) ? [] : ["el arrastre de la tira no captura el puntero"]),
  ...(/const sola = !ev\.ctrlKey && !ev\.altKey && !ev\.metaKey;\n\s+const nave = sola &&/.test(html) ? [] : ["las flechas se comen Alt+← del navegador"]),
  ...(/else pasarConVariante\(tecla === "ArrowRight" \? 1 : -1\);/.test(html) ? [] : ["las flechas no recorren la variante"]),
  ...(/pasarConVariante\(junta > 0 \? 1 : -1\);/.test(html) ? [] : ["la rueda no recorre la variante"]),
  ...(/if \(PRUEBA && !PRUEBA\.linea\.length\) return irA\(IDX \+ dir\);/.test(html) ? [] : ["una variante sin jugadas deja muertas las flechas"]),
]);

/* 8. La versión SUBIÓ respecto del último commit, si index.html cambió.
      La versión es lo que ubica un reporte del usuario en el historial (§10) y
      cada push es un deploy en vivo, así que dos deploys distintos no pueden
      decir lo mismo. Se compara contra HEAD y no contra una lista, para que no
      haya nada que mantener a mano. Si index.html no cambió no se pide nada:
      el archivo servido es idéntico y no hay reporte que ubicar. */
const previo = spawnSync("git", ["show", "HEAD:index.html"],
                         { encoding: "utf8", maxBuffer: 1 << 28 });
if (previo.status !== 0) {
  console.log("  --  la versión subió (sin git o sin HEAD: no se puede comparar)");
} else if (previo.stdout === html) {
  console.log("  ok  la versión subió (index.html no cambió: no hace falta)");
} else {
  const vAntes = norm((previo.stdout.match(/window\.VERSION = "(v[\d.]+)/) || [])[1]);
  /* compara de a números, así 0.56.1 > 0.56 y 0.100 > 0.99 */
  const mayor = (a, b) => {
    const pa = a.split(".").map(Number), pb = b.split(".").map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const d = (pa[i] || 0) - (pb[i] || 0);
      if (d) return d > 0;
    }
    return false;
  };
  chequear("la versión subió",
    vAntes && vHtml && mayor(vHtml, vAntes) ? []
      : [`index.html cambió pero la versión sigue en ${vHtml} (el último commit es ${vAntes})`]);
}

if (fallas.length) { console.error("\nFALLA:\n- " + fallas.join("\n- ")); process.exit(1); }
console.log("\nchequeos estáticos: todo bien");
