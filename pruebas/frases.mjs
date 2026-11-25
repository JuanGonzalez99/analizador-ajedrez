/* Qué dice la tarjeta distinto de la versión anterior, en TODAS las jugadas
   legales de las partidas de prueba. Correr: npm run frases [-- ref]
   (ref de git, por defecto HEAD; con el árbol sucio compara lo editado contra
   el último commit).

   Por qué existe (APRENDIZAJES.md, v1.0.4): una frase nueva se probó en las
   posiciones que se le ocurrieron a quien la escribió, y el revisor de ajedrez
   la cazó recorriendo las legales de los PGN contra la versión anterior —Bxd4
   de la partida de prueba decía "Defiende" cuando había comido al atacante—.
   Esto hace ese recorrido en un comando, antes de pasarle el cambio al
   revisor. Cada diferencia se mira en el tablero: que cambie no es que esté
   mal, pero cada una es una posición que la frase nueva tiene que aguantar.

   CON `--frase texto` (v1.0.6) lista además TODAS las jugadas donde la
   tarjeta de ahora dice ese texto, cambien o no. Por qué: el arreglo de la
   pareja de alfiles se probó con lo que cambiaba, y Nxc4 de partida-doble
   —que la decía antes y después, con el otro alfil colgado— no podía salir
   en la lista de diferencias (APRENDIZAJES.md, v1.0.6). Una frase que se
   arregla se mira entera: npm run frases -- --frase pareja

   Sin motor: cada jugada se dice DOS veces, como "buena" sin pérdida y como
   "error" con un peón de pérdida. Cubre lo que sale de mirar la posición
   (`observarJugada`: colgadas, salvadas, clavadas, ataques, estructura) y no
   lo que depende de la evaluación de verdad. La segunda pasada es de la
   v1.0.7: hasta ahí la fila iba sin pérdida y ninguna frase de la jugada
   mala ("queda comible", "queda sin defender", "Destapa", "Pierde material
   en el cambio") podía salir nunca; el traspaso leyó "no cambia nada" como
   cobertura (APRENDIZAJES.md, v1.0.7). Las líneas de la segunda llevan
   [error] adelante. */
import fs from "node:fs";
import { execSync } from "node:child_process";
import { Chess } from "../chess.js";
import A, { desde } from "./extraer.mjs";

const args = process.argv.slice(2);
const iF = args.indexOf("--frase");
const frase = iF >= 0 ? args.splice(iF, 2)[1] : null;
const ref = args[0] || "HEAD";
const viejo = desde(execSync(`git show ${ref}:index.html`, { maxBuffer: 1 << 26 }).toString());
const dir = new URL("./", import.meta.url);
const pgns = fs.readdirSync(dir).filter(n => n.endsWith(".pgn"));

const decir = (M, antes, m, despues, mala) => {
  const f = { fen: despues, uci: m.from + m.to + (m.promotion || ""), turno: m.color,
              pieza: m.piece, san: m.san, cat: mala ? "error" : "buena",
              mejor: mala ? null : m.from + m.to, perdida: mala ? 1 : 0 };
  try {
    const obs = M.observarJugada(f, antes);
    return M.explicarJugada(f, null, true, null, obs) || "";
  } catch (e) { return "ERROR: " + e.message; }
};

let jugadas = 0, distintas = 0, conFrase = 0;
const vistas = new Set();
for (const n of pgns) {
  const { fens } = A.prepararPartida(fs.readFileSync(new URL(n, dir), "utf8"));
  for (const antes of fens) {
    const r = new Chess(antes);
    if (vistas.has(antes)) continue;
    vistas.add(antes);
    for (const m of r.moves({ verbose: true })) {
      const k = new Chess(antes); k.move(m.san);
      const despues = k.fen();
      jugadas++;
      for (const mala of [false, true]) {
        const et = mala ? "[error] " : "";
        const a = decir(viejo, antes, m, despues, mala), b = decir(A, antes, m, despues, mala);
        if (frase && b.includes(frase)) {
          conFrase++;
          console.log(`[${frase}] ${et}${antes}  ${m.san}\n  ${b}`);
        }
        if (a === b) continue;
        distintas++;
        console.log(`${et}${antes}  ${m.san}\n  antes: ${a}\n  ahora: ${b}`);
      }
    }
  }
}
console.log(`\n${jugadas} jugadas legales en ${vistas.size} posiciones de ${pgns.length} partidas; ` +
            `${distintas} frases (de ${jugadas * 2}: buena y error) dicen otra cosa que ${ref}.` +
            (frase ? ` "${frase}" sale en ${conFrase}.` : ""));
