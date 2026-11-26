/* Junta los pedazos de src/ en el index.html de siempre (etapa 2, v1.0.9).

   Correr:  npm run juntar        (escribe index.html)
            npm run juntar -- --ver   (solo dice si index.html está al día)

   POR QUÉ ASÍ (TRASPASO.md §2): las sesiones leen y editan los pedazos
   chicos de src/, y el teléfono sigue recibiendo un solo archivo, que es lo
   que evita que GitHub Pages le sirva un index.html nuevo con un pedazo viejo.
   Los pedazos NO son módulos: son tramos del mismo archivo, cortados en
   renglones enteros, y se pegan uno atrás del otro sin agregar nada. Un
   pedazo de JS puede abrir un bloque que cierra el siguiente (el `try {` del
   arranque vive en motor.js y se cierra en revision.js).

   LA GUARDA: si index.html tiene cambios que no salieron de juntar (alguien
   lo editó a mano), no se pisa: avisa y sale con error. Lo que escribió la
   última vez queda anotado en el sello (`git rev-parse --git-path juntado`,
   que en un worktree no es .git/juntado). Lo del último commit se acepta
   solo si ese commit es coherente: su index.html es juntar sus src/ (si no,
   el commit trae index.html tocado a mano y pisarlo lo perdería). */
import fs from "node:fs";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { pathToFileURL, fileURLToPath } from "node:url";

/* EL ORDEN ES EL DEL ARCHIVO. Un pedazo nuevo se suma acá donde va. */
export const ORDEN = [
  "cabeza.html",              /* doctype, head, <style> */
  "estilos.css",              /* el CSS del celu (y lo común) */
  "estilos-compu.css",        /* [PC] las media queries de pantalla ancha, hover */
  "cuerpo-arriba.html",       /* </style>, el arranque del <body>, <script> clásico */
  "registro.js",              /* script clásico: registro, errores, diagnóstico */
  "cuerpo.html",              /* el HTML de las tres pantallas y Ajustes, <script type=module> */
  "analisis-evaluacion.js",   /* bloque de análisis: evaluación, geometría, categorías, curva */
  "analisis-explicacion.js",  /* bloque de análisis: la explicación de la jugada */
  "analisis-posicion.js",     /* bloque de análisis: la posición, la apertura (cierra el bloque) */
  "motor.js",                 /* arranque, caché, motor, aperturas, analizar una partida */
  "tablero.js",               /* el tablero SVG */
  "interfaz.js",              /* interfaz: el estado global (PARTIDAS, R, IDX…), la tira, irA */
  "variante.js",              /* probar jugadas: la variante */
  "inicio.js",                /* preferencias guardadas, el inicio: cargar el mes, la lista, abrir una partida */
  "mes.js",                   /* el mes, banco de pruebas, todo lo analizado */
  "tablas.js",                /* bloque de tablas */
  "mes-pintar.js",            /* pintar el Mes y la lista */
  "posicion.js",              /* Posiciones: jugar contra el motor desde un link */
  "revision.js",              /* la revisión de una partida (cierra el módulo) */
  "pie.html",                 /* </script></html> */
];

const SRC = new URL("./src/", import.meta.url);
const INDEX = new URL("./index.html", import.meta.url);
const RAIZ = fileURLToPath(new URL(".", import.meta.url));
const git = (...a) => spawnSync("git", ["-C", RAIZ, ...a], { encoding: "utf8", maxBuffer: 1 << 28 });
const hash = t => crypto.createHash("sha1").update(t).digest("hex");

export function juntar() {
  const sobran = fs.readdirSync(SRC).filter(f => !ORDEN.includes(f));
  if (sobran.length) throw new Error(`src/ tiene pedazos que no están en ORDEN: ${sobran.join(", ")}`);
  return ORDEN.map(f => {
    const t = fs.readFileSync(new URL(f, SRC), "utf8");
    if (!t.endsWith("\n")) throw new Error(`src/${f} no termina en salto de renglón`);
    return t;
  }).join("");
}

/* con la ruta resuelta: un espacio (%20) o un enlace simbólico hacían que
   no corriera nada, sin avisar (revisor de código, 25-nov) */
const esPrincipal = (() => {
  try { return import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href; }
  catch (e) { return false; }
})();

if (esPrincipal) {
  const nuevo = juntar();
  const actual = fs.existsSync(INDEX) ? fs.readFileSync(INDEX, "utf8") : "";
  if (actual === nuevo) { console.log("index.html ya está al día"); process.exit(0); }
  if (process.argv.includes("--ver")) {
    console.error("index.html NO está al día con src/: correr npm run juntar"); process.exit(1);
  }
  /* index.html distinto de lo que sale de src/: se pisa solo si es lo que
     escribió juntar la última vez o lo del último commit. Si no, lo editó
     alguien a mano y esos cambios se perderían. */
  const ps = git("rev-parse", "--git-path", "juntado");
  const SELLO = ps.status === 0 ? new URL(ps.stdout.trim(), pathToFileURL(RAIZ)) : null;
  const sello = SELLO && fs.existsSync(SELLO) ? fs.readFileSync(SELLO, "utf8").trim() : "";
  const head = git("show", "HEAD:index.html");
  const headCoherente = () => head.status === 0 && head.stdout ===
    ORDEN.map(f => { const r = git("show", `HEAD:src/${f}`); return r.status === 0 ? r.stdout : "\0"; }).join("");
  if (hash(actual) !== sello && !(head.status === 0 && head.stdout === actual && headCoherente())) {
    console.error(head.status === 0 && head.stdout === actual
      ? "el último commit trae index.html tocado a mano (no es juntar sus src/). No lo piso: pasá ese cambio a src/ y volvé a correr."
      : "index.html tiene cambios hechos a mano, que no salieron de src/. No lo piso: pasá esos cambios a src/ (o descartalos) y volvé a correr. " +
        "Si src/ ya está bien: git checkout HEAD -- index.html && npm run juntar");
    process.exit(1);
  }
  fs.writeFileSync(INDEX, nuevo, "utf8");
  if (SELLO) try { fs.writeFileSync(SELLO, hash(nuevo)); } catch (e) { /* sin sello: la próxima entra por HEAD */ }
  console.log(`index.html juntado: ${ORDEN.length} pedazos, ${Buffer.byteLength(nuevo)} bytes`);
}
