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
const sinLeyenda = tablas.filter((m, i) => {
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
const num = t => (t.match(/^v0?\.?(\d+)/) || [])[1];
const vHtml = num((html.match(/window\.VERSION = "(v[\d.]+)/) || [])[1] || "");
const vDoc = num((doc.match(/al día en la \*\*(v[\d.]+)\*\*/) || [])[1] || "");
chequear("el traspaso está al día",
  vHtml && vHtml === vDoc ? [] : [`index.html es ${vHtml} y TRASPASO.md dice ${vDoc}`]);

if (fallas.length) { console.error("\nFALLA:\n- " + fallas.join("\n- ")); process.exit(1); }
console.log("\nchequeos estáticos: todo bien");
