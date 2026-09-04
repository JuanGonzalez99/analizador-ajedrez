/* Extrae el bloque de análisis de analizador.html y lo devuelve como módulo.
   El bloque no toca el DOM ni el motor, así que corre tal cual en node.
   Los dos marcadores son contrato: si se mueven, esto se rompe. */
import fs from "node:fs";
import { Chess } from "../chess.js";

const INICIO = "/* ============ evaluación ============ */";
const FIN = "/* ===================== fin del bloque de análisis";

const html = fs.readFileSync(new URL("../analizador.html", import.meta.url), "utf8");
const ini = html.indexOf(INICIO), fin = html.indexOf(FIN);
if (ini < 0 || fin < 0) throw new Error("no están los marcadores del bloque de análisis");

const bloque = html.slice(ini, fin);
const nombres = [...bloque.matchAll(/^(?:function|const|let|class)\s+([A-Za-z_$][\w$]*)/gm)]
  .map(m => m[1]);

export default new Function("Chess", bloque + `\nreturn { ${nombres.join(", ")} };`)(Chess);
export { nombres };
