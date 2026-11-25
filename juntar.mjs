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
   última vez queda anotado en .git/juntado. */
import fs from "node:fs";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

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
  "revision.js",              /* la revisión de una partida (cierra el módulo) */
  "pie.html",                 /* </script></html> */
];

const SRC = new URL("./src/", import.meta.url);
const INDEX = new URL("./index.html", import.meta.url);
const SELLO = new URL("./.git/juntado", import.meta.url);
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

if (import.meta.url === `file://${process.argv[1]}`) {
  const nuevo = juntar();
  const actual = fs.existsSync(INDEX) ? fs.readFileSync(INDEX, "utf8") : "";
  if (actual === nuevo) { console.log("index.html ya está al día"); process.exit(0); }
  if (process.argv.includes("--ver")) {
    console.error("index.html NO está al día con src/: correr npm run juntar"); process.exit(1);
  }
  /* index.html distinto de lo que sale de src/: se pisa solo si es lo que
     escribió juntar la última vez o lo del último commit. Si no, lo editó
     alguien a mano y esos cambios se perderían. */
  const sello = fs.existsSync(SELLO) ? fs.readFileSync(SELLO, "utf8").trim() : "";
  const head = spawnSync("git", ["show", "HEAD:index.html"], { encoding: "utf8", maxBuffer: 1 << 28 });
  if (hash(actual) !== sello && !(head.status === 0 && head.stdout === actual)) {
    console.error("index.html tiene cambios hechos a mano, que no salieron de src/. " +
                  "No lo piso: pasá esos cambios a src/ (o descartalos) y volvé a correr.");
    process.exit(1);
  }
  fs.writeFileSync(INDEX, nuevo, "utf8");
  try { fs.writeFileSync(SELLO, hash(nuevo)); } catch (e) { /* sin .git: no hay sello */ }
  console.log(`index.html juntado: ${ORDEN.length} pedazos, ${Buffer.byteLength(nuevo)} bytes`);
}
