/* Segundo bloque extraíble: las funciones que arman las tablas. Son puras salvo
   las dos que escriben en el DOM, que acá solo se declaran y nunca se llaman;
   por eso alcanza con un $ de mentira. Mismos marcadores-contrato que el otro. */
import fs from "node:fs";

const INICIO = "/* ============ tablas ============ */";
const FIN = "/* ================== fin del bloque de tablas";

const html = fs.readFileSync(new URL("../analizador.html", import.meta.url), "utf8");
const ini = html.indexOf(INICIO), fin = html.indexOf(FIN);
if (ini < 0 || fin < 0) throw new Error("no están los marcadores del bloque de tablas");

const bloque = html.slice(ini, fin);
const nombres = [...bloque.matchAll(/^(?:function|const|let|class)\s+([A-Za-z_$][\w$]*)/gm)]
  .map(m => m[1]);

const $ = () => { throw new Error("el bloque de tablas no debería tocar el DOM acá"); };
export default new Function("$", bloque + `\nreturn { ${nombres.join(", ")} };`)($);
