/* Segundo bloque extraíble: las funciones que arman las tablas. Son puras salvo
   las dos que escriben en el DOM, que acá solo se declaran y nunca se llaman;
   por eso alcanza con un $ de mentira. Mismos marcadores-contrato que el otro.
   `mediana` vive en el bloque de análisis y la usa `tasa`: se inyecta igual que
   el $, porque los dos bloques son el mismo script en el navegador. */
import fs from "node:fs";
import A from "./extraer.mjs";

const INICIO = "/* ============ tablas ============ */";
const FIN = "/* ================== fin del bloque de tablas";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const ini = html.indexOf(INICIO), fin = html.indexOf(FIN);
if (ini < 0 || fin < 0) throw new Error("no están los marcadores del bloque de tablas");

const bloque = html.slice(ini, fin);
const nombres = [...bloque.matchAll(/^(?:function|const|let|class)\s+([A-Za-z_$][\w$]*)/gm)]
  .map(m => m[1]);

const $ = () => { throw new Error("el bloque de tablas no debería tocar el DOM acá"); };
export default new Function("$", "mediana",
  bloque + `\nreturn { ${nombres.join(", ")} };`)($, A.mediana);
