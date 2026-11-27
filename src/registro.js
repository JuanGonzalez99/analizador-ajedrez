  window.VERSION = "v1.7.1 · 27-11";

  /* El modo se decide acá arriba, antes de que se dibuje nada, para que no se
     vea un parpadeo de las perillas.
     La URL es como se PRENDE y localStorage es como se QUEDA prendido: el link
     guardado en el celular no lleva el parámetro, así que sin recordarlo habría
     que escribir ?dev en cada visita. ?dev=0 apaga, igual que el botón. */
  window.DEV = false;
  try {
    var par = new URLSearchParams(location.search);
    if (par.has("dev")) {
      window.DEV = par.get("dev") !== "0";
      localStorage.setItem("dev", window.DEV ? "1" : "0");
    } else {
      window.DEV = localStorage.getItem("dev") === "1";
    }
  } catch (e) { /* incógnito, o URL rara: se queda en modo simple */ }
  if (window.DEV) document.documentElement.classList.add("dev");

  /* La version al pie, visible en los dos modos. Se escribe acá y no en el
     módulo a propósito: si el módulo no arranca, la versión igual se ve, y es
     el primer dato que hace falta para diagnosticar desde un teléfono.
     La línea de diagnóstico es otra cosa: arrastra el registro y solo aparece
     en modo dev, o sola cuando hubo un error. */
  /* al DOMContentLoaded y no acá derecho: este script corre en la cabeza, y el
     pie todavía no existe. Igual no depende del módulo: si el módulo no
     arranca, la versión se ve lo mismo. */
  document.addEventListener("DOMContentLoaded", function () {
    var pie = document.getElementById("verPie");
    if (pie) pie.textContent = window.VERSION.split(" ")[0];
    /* también en la hoja: para saber si llegó el deploy sin salir de la partida */
    var enHoja = document.getElementById("verAjustes");
    if (enHoja) enHoja.textContent = "Versión " + window.VERSION;
  });
  var diag = document.getElementById("diag");
  var caja = document.getElementById("errores");
  var panel = document.getElementById("panelLog");
  var logTexto = document.getElementById("logTexto");

  /* ============ registro ============
     Vive en localStorage y no en IndexedDB a propósito: escribir es sincrónico,
     así que sobrevive a un cierre abrupto de la pestaña. Se escribe con un
     retardo para no frenar el análisis, y a la fuerza al haber un error. */
  var LOG = window.LOG = {
    lineas: [], TOPE: 500, t0: Date.now(), pendiente: null,

    add: function (nivel, txt) {
      var t = ((Date.now() - this.t0) / 1000).toFixed(1);
      this.lineas.push(t + "s " + nivel + " " + txt);
      if (this.lineas.length > this.TOPE) this.lineas.splice(0, this.lineas.length - this.TOPE);
      if (!panel.classList.contains("oculto")) this.pintar();
      if (nivel === "ERR") {
        this.guardar();
        /* hay errores que solo pasan por el registro y nunca por mostrarError:
           también tienen que destapar el diagnóstico */
        document.documentElement.classList.add("hubo-error");
      }
      else if (!this.pendiente) this.pendiente = setTimeout(function () { LOG.guardar(); }, 2000);
    },
    texto: function () {
      return window.VERSION + " · " + navigator.userAgent + "\n" +
             "nucleos=" + (navigator.hardwareConcurrency || "?") + "\n\n" +
             this.lineas.join("\n");
    },
    pintar: function () { logTexto.textContent = this.texto(); },
    guardar: function () {
      clearTimeout(this.pendiente); this.pendiente = null;
      try { localStorage.setItem("log_analizador", this.lineas.join("\n")); } catch (e) {}
    },
    cargar: function () {
      try {
        var v = localStorage.getItem("log_analizador");
        if (v) this.lineas = v.split("\n");
      } catch (e) {}
      var d = new Date();
      this.lineas.push("──── sesión de las " +
        d.toLocaleTimeString() + " del " + d.toLocaleDateString() + " ────");
      if (this.lineas.length > this.TOPE) this.lineas.splice(0, this.lineas.length - this.TOPE);
    }
  };
  LOG.cargar();
  LOG.add("i", "arranca la página");

  /* el console sigue funcionando igual, pero además queda en el registro */
  ["log", "warn", "error"].forEach(function (m) {
    var orig = console[m].bind(console);
    console[m] = function () {
      var a = Array.prototype.slice.call(arguments).map(function (x) {
        if (x instanceof Error) return x.message;
        if (typeof x === "object") { try { return JSON.stringify(x); } catch (e) { return String(x); } }
        return String(x);
      });
      LOG.add(m === "error" ? "ERR" : m === "warn" ? "!" : "·", a.join(" "));
      orig.apply(null, arguments);
    };
  });

  diag.textContent = window.VERSION + " · cargando el módulo…";
  diag.title = "tocá para ver el registro";
  diag.onclick = function () {
    panel.classList.toggle("oculto");
    if (!panel.classList.contains("oculto")) LOG.pintar();
  };

  document.getElementById("logCopiar").onclick = function () {
    var t = LOG.texto();
    if (navigator.clipboard) navigator.clipboard.writeText(t).then(
      function () { diag.textContent = window.VERSION + " · registro copiado"; },
      function () { alert(t); });
    else alert(t);
  };
  document.getElementById("logBajar").onclick = function () {
    var b = new Blob([LOG.texto()], { type: "text/plain" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(b);
    a.download = "registro-analizador.txt";
    a.click();
  };
  document.getElementById("logLimpiar").onclick = function () {
    LOG.lineas = []; LOG.guardar(); LOG.pintar();
  };
  window.addEventListener("pagehide", function () { LOG.guardar(); });

  window.mostrarError = function (donde, e) {
    var t = (e && (e.message || e.reason && e.reason.message || e.reason)) || e;
    document.documentElement.classList.add("hubo-error");
    caja.classList.remove("oculto");
    caja.textContent = (caja.textContent ? caja.textContent + "\n" : "") + donde + ": " + t;
    console.error(donde, e);
  };
  window.addEventListener("error", function (ev) {
    if (ev.error || ev.message) {
      var d = "error";
      if (ev.filename) d += " en " + ev.filename.split("/").pop() + ":" + ev.lineno + ":" + ev.colno;
      window.mostrarError(d, ev.error || ev.message);
      if (ev.error && ev.error.stack) {
        caja.textContent += "\n" + ev.error.stack.split("\n").slice(0, 3).join("\n");
        LOG.add("ERR", ev.error.stack.split("\n").slice(0, 3).join(" | "));
      }
    } else if (ev.target && ev.target.tagName === "SCRIPT") {
      window.mostrarError("no cargó " + (ev.target.src || "un script embebido"),
        "importación fallida o error de sintaxis");
    }
  }, true);
  window.addEventListener("unhandledrejection", function (ev) {
    window.mostrarError("promesa rechazada", ev.reason);
  });
  /* EL TOQUE DE ANTES DE QUE ARRANQUE EL MÓDULO (v1.0.10; revisor de UX,
     v1.0.9). Con mala señal el módulo tarda ~10 s y el inicio ya se ve
     listo, pero los botones los engancha el módulo: un toque en Buscar no
     hacía nada y no avisaba. Ahora el renglón del estado lo dice, y solo
     Buscar con un nombre escrito se guarda y lo corre el módulo al final de
     su arranque (`revision.js`, después del usuario guardado): es la única
     intención clara. Los otros (la tuerca, el PGN) no se repiten solos 10 s
     después —abrirían algo sin que nadie toque, revisor de UX— y el aviso
     pide probar de nuevo. Los del registro (#panelLog) ya andan desde acá y
     no se tocan. Sin la palabra "Cargando…": esa la usa la app para un mes
     que baja, y el mono le pone plazo. */
  /* con un error de verdad no hay "arrancando" que valga: el aviso dice qué
     hacer (revisor de UX; el cartel rojo es técnico y Juan lee este) */
  var NO_ARRANCO = "La app no pudo arrancar: recargá la página.";
  document.addEventListener("click", function (ev) {
    if (window.MODULO_OK) return;
    var b = ev.target && ev.target.closest && ev.target.closest("button[id]");
    if (!b || b.closest("#panelLog")) return;
    var est = document.getElementById("estado"), u = document.getElementById("usuario");
    var busca = b.id === "buscar" && u && u.value.trim();
    var fallo = document.documentElement.classList.contains("hubo-error");
    window.TOQUE_PENDIENTE = busca && !fallo ? "buscar" : null;
    if (est) est.textContent = fallo ? NO_ARRANCO : busca
      ? "La app todavía está arrancando: busco apenas esté."
      : "La app todavía está arrancando: probá de nuevo en un momento.";
    LOG.add("!", "toque en #" + b.id + " antes del módulo" + (busca ? ": queda guardado" : ""));
  }, true);
  /* A LOS 6 S SIN MÓDULO NO ES UN ERROR TODAVÍA (v1.0.9; revisor de código,
     25-nov). Con mala señal el módulo arranca más tarde (a 200 kbps, a los
     10,7 s), y esto pintaba el cartel rojo con los tres archivos respondiendo
     bien, y no se iba nunca. Ahora la línea dice que tarda, cada archivo se
     pide con HEAD (antes bajaba aperturas.json entero, 942 KB, compitiéndole
     al módulo), y el cartel sale solo si uno falla de verdad: no responde,
     no es 2xx o viene con otro tipo (una página de error en vez del JS). Lo
     que responde bien va al registro. Si el módulo arranca, `listo` pisa la
     línea. */
  setTimeout(function () {
    if (!window.MODULO_OK) {
      /* si el módulo llega mientras se prueban los archivos, un HEAD que
         falla por un corte no pisa "listo" ni saca el cartel (revisor de UX) */
      var roto = function () {
        if (window.MODULO_OK) return;
        diag.textContent = window.VERSION + " · el módulo no arrancó";
        /* el toque guardado no va a correr: el aviso no puede seguir prometiéndolo */
        window.TOQUE_PENDIENTE = null;
        var est = document.getElementById("estado");
        if (est) est.textContent = NO_ARRANCO;
      };
      /* si ya hubo un error de verdad (el import falló), no tarda: no arrancó */
      if (document.documentElement.classList.contains("hubo-error")) roto();
      else diag.textContent = window.VERSION + " · el módulo tarda…";
      LOG.add("!", "a los 6 s el módulo no arrancó: pruebo los archivos");
      /* pruebo cada archivo por separado para poder nombrar el que falta */
      [["./chess.js", /javascript/], ["./aperturas.json", /json/],
       ["./stockfish-18-lite-single.js", /javascript/]].forEach(function (a) {
        var f = a[0];
        fetch(f, { method: "HEAD" }).then(function (r) {
          if (window.MODULO_OK) return;
          var tipo = r.headers.get("content-type") || "sin tipo";
          if (!r.ok) { roto(); window.mostrarError(f, "el servidor devolvió " + r.status); }
          else if (!a[1].test(tipo)) { roto(); window.mostrarError(f, "responde " + r.status + " como " + tipo); }
          else LOG.add("!", f + " responde " + r.status + " como " + tipo);
        }).catch(function (e) { if (!window.MODULO_OK) { roto(); window.mostrarError(f, "no se pudo pedir: " + e.message); } });
      });
    }
  }, 6000);
