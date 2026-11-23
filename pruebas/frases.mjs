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

   Sin motor: la fila se arma como "buena" y sin pérdida, así que cubre lo que
   sale de mirar la posición (`observarJugada`: colgadas, salvadas, clavadas,
   ataques, estructura) y no lo que depende de la evaluación. */
import fs from "node:fs";
import { execSync } from "node:child_process";
import { Chess } from "../chess.js";
import A, { desde } from "./extraer.mjs";

const ref = process.argv[2] || "HEAD";
const viejo = desde(execSync(`git show ${ref}:index.html`, { maxBuffer: 1 << 26 }).toString());
const dir = new URL("./", import.meta.url);
const pgns = fs.readdirSync(dir).filter(n => n.endsWith(".pgn"));

const decir = (M, antes, m, despues) => {
  const f = { fen: despues, uci: m.from + m.to + (m.promotion || ""), turno: m.color,
              pieza: m.piece, san: m.san, cat: "buena", mejor: m.from + m.to };
  try {
    const obs = M.observarJugada(f, antes);
    return M.explicarJugada(f, null, true, null, obs) || "";
  } catch (e) { return "ERROR: " + e.message; }
};

let jugadas = 0, distintas = 0;
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
      const a = decir(viejo, antes, m, despues), b = decir(A, antes, m, despues);
      if (a === b) continue;
      distintas++;
      console.log(`${antes}  ${m.san}\n  antes: ${a}\n  ahora: ${b}`);
    }
  }
}
console.log(`\n${jugadas} jugadas legales en ${vistas.size} posiciones de ${pgns.length} partidas; ` +
            `${distintas} dicen otra cosa que ${ref}.`);
