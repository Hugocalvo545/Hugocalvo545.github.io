// Formularios "solicitud" (Solicitar alta) y "briefing": validación, Turnstile, límite y avisos.
import { SERVICIOS, PROYECTOS, FUNCIONALIDADES, PLAZOS, PRESUPUESTOS } from "./catalogo.js";
import { json, preflight, origenPermitido, ipCliente, leerTexto, hostnamesPermitidos } from "./http.js";
import { dentroDelLimite } from "./redis.js";
import { avisarNtfy, enviarCorreo, correoHugo, tablaHtml, tablaTexto, escapar, pie, TIEMPO_MAX_MS } from "./avisos.js";

const EMAIL_RE = /^[^\s@<>()]+@[^\s@<>()]+\.[^\s@<>()]{2,}$/;
const WEB_RE = /^(https?:\/\/)?([\p{L}\p{N}-]+\.)+[\p{L}]{2,}(\/\S*)?$/iu; // admite dominios con tildes o ñ
const TEL_RE = /^[0-9 +().-]{6,30}$/;
const TIEMPO_MINIMO_MS = 2000; // un envío más rápido que esto es de un bot

class ErrorValidacion extends Error {}

const texto = (v, { campo, min = 0, max, requerido = false }) => {
  const t = typeof v === "string" ? v.trim() : "";
  if (requerido && t.length < Math.max(min, 1)) throw new ErrorValidacion(`Revisa el campo «${campo}».`);
  if (t && t.length < min) throw new ErrorValidacion(`El campo «${campo}» es demasiado corto.`);
  if (t.length > max) throw new ErrorValidacion(`El campo «${campo}» es demasiado largo.`);
  return t;
};
const deLista = (v, lista, campo) => {
  if (!Object.hasOwn(lista, v)) throw new ErrorValidacion(`Elige una opción en «${campo}».`);
  return v;
};

const validarContacto = (d) => {
  const contacto = {
    nombre: texto(d.nombre, { campo: "Nombre", min: 2, max: 100, requerido: true }),
    empresa: texto(d.empresa, { campo: "Empresa o negocio", max: 120 }),
    email: texto(d.email, { campo: "Email", max: 160, requerido: true }).toLowerCase(),
    telefono: texto(d.telefono, { campo: "Teléfono", max: 30 }),
  };
  if (!EMAIL_RE.test(contacto.email)) throw new ErrorValidacion("Revisa el email.");
  if (contacto.telefono && !TEL_RE.test(contacto.telefono)) throw new ErrorValidacion("Revisa el teléfono.");
  if (d.privacidad !== true) throw new ErrorValidacion("Necesito que aceptes la política de privacidad.");
  return contacto;
};

const validarWeb = (v, requerido, campo) => {
  const web = texto(v, { campo, max: 200, requerido });
  if (web && !WEB_RE.test(web)) throw new ErrorValidacion(`Revisa la dirección de «${campo}».`);
  return web;
};

const validarServicio = (d, nivel) => {
  const servicio = SERVICIOS[d.servicio];
  if (!servicio || servicio.nivel !== nivel) throw new ErrorValidacion("Servicio no válido.");
  if (!Object.hasOwn(servicio.paquetes, d.paquete)) throw new ErrorValidacion("Plan no válido.");
  return { servicioId: d.servicio, servicio: servicio.nombre, paquete: servicio.paquetes[d.paquete] };
};

export const validar = (tipo, d) => {
  if (tipo === "solicitud") {
    return {
      ...validarServicio(d, "solicitar"),
      web: validarWeb(d.web, true, "Tu web"),
      necesidad: texto(d.necesidad, { campo: "¿Qué necesitas?", min: 5, max: 1500, requerido: true }),
      ...validarContacto(d),
    };
  }
  const funcionalidades = Array.isArray(d.funcionalidades) ? d.funcionalidades : [];
  if (funcionalidades.length > Object.keys(FUNCIONALIDADES).length) throw new ErrorValidacion("Revisa las funcionalidades.");
  return {
    ...validarServicio(d, "presupuesto"),
    proyecto: PROYECTOS[deLista(d.proyecto, PROYECTOS, "Tipo de proyecto")],
    objetivo: texto(d.objetivo, { campo: "¿Qué quieres conseguir?", min: 5, max: 1500, requerido: true }),
    funcionalidades: [...new Set(funcionalidades)].map((f) => FUNCIONALIDADES[deLista(f, FUNCIONALIDADES, "Funcionalidades")]),
    detalle: texto(d.funcionalidades_detalle, { campo: "Cuéntame más", max: 1500 }),
    web: validarWeb(d.web, false, "Web actual"),
    plazo: PLAZOS[deLista(d.plazo, PLAZOS, "Plazo")],
    presupuesto: PRESUPUESTOS[deLista(d.presupuesto, PRESUPUESTOS, "Presupuesto")],
    ...validarContacto(d),
  };
};

const verificarTurnstile = async (token, ip) => {
  const secreto = process.env.TURNSTILE_SECRET;
  if (!secreto) throw new Error("Falta TURNSTILE_SECRET");
  if (typeof token !== "string" || !token || token.length > 2048) return false;
  const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    signal: AbortSignal.timeout(TIEMPO_MAX_MS),
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret: secreto, response: token, remoteip: ip }),
  });
  // Un fallo de Cloudflare no es culpa del usuario: lanza para responder 503, no "eres un robot"
  if (!r.ok) throw new Error(`siteverify HTTP ${r.status}`);
  const res = await r.json();
  if (!res.success) return false;
  // Las claves de prueba de Cloudflare no devuelven el dominio real
  const esPrueba = secreto.startsWith("1x0000000000000000000000000000000");
  return esPrueba || hostnamesPermitidos().includes(res.hostname);
};

const filas = (tipo, v) =>
  tipo === "solicitud"
    ? [
        ["Servicio", v.servicio],
        ["Plan", v.paquete],
        ["Web", v.web],
        ["Qué necesita", v.necesidad],
      ]
    : [
        ["Servicio", v.servicio],
        ["Paquete de partida", v.paquete],
        ["Tipo de proyecto", v.proyecto],
        ["Objetivo", v.objetivo],
        ["Funcionalidades", v.funcionalidades.join(", ")],
        ["Más detalle", v.detalle],
        ["Web actual", v.web],
        ["Plazo", v.plazo],
        ["Presupuesto orientativo", v.presupuesto],
      ];

const filasContacto = (v) => [
  ["Nombre", v.nombre],
  ["Empresa", v.empresa],
  ["Email", v.email],
  ["Teléfono", v.telefono],
];

// Para el cliente: solo valores de listas cerradas. El texto libre (nombre, web, necesidad...) no se reenvía
// a la dirección indicada, para que nadie use el formulario para enviar mensajes a terceros desde hugocalvo.dev.
const filasCliente = (tipo, v) =>
  tipo === "solicitud"
    ? [
        ["Servicio", v.servicio],
        ["Plan", v.paquete],
      ]
    : [
        ["Servicio", v.servicio],
        ["Tipo de proyecto", v.proyecto],
        ["Funcionalidades", v.funcionalidades.join(", ")],
        ["Plazo", v.plazo],
        ["Presupuesto orientativo", v.presupuesto],
      ];

const correos = (tipo, v) => {
  const resumen = [...filas(tipo, v), ...filasContacto(v)];
  const resumenCliente = filasCliente(tipo, v);
  const titulo = tipo === "solicitud" ? "Solicitud de alta" : "Briefing";
  const respuesta =
    tipo === "solicitud"
      ? "Reviso tu caso y te respondo en menos de 24 h laborables. Si encaja, te envío el enlace de pago; si no, te lo digo y no pagas nada."
      : "Lo estudio y en 48 h laborables tienes un presupuesto cerrado por escrito. Si me falta algo, te escribo.";
  return {
    hugo: {
      to: correoHugo(),
      replyTo: v.email,
      subject: `${titulo}: ${v.servicio} · ${v.empresa || v.nombre}`,
      html: `<h2 style="font-family:Arial,sans-serif">${escapar(titulo)}: ${escapar(v.servicio)}</h2>${tablaHtml(resumen)}`,
      text: `${titulo}: ${v.servicio}\n\n${tablaTexto(resumen)}`,
    },
    cliente: {
      to: v.email,
      replyTo: correoHugo(),
      subject: `He recibido tu ${tipo === "solicitud" ? "solicitud" : "briefing"}: ${v.servicio}`,
      html: `<p style="font-family:Arial,sans-serif;font-size:15px">Hola:</p>
<p style="font-family:Arial,sans-serif;font-size:15px">Gracias por escribirme. ${escapar(respuesta)}</p>
<p style="font-family:Arial,sans-serif;font-size:15px">Resumen de tu ${tipo === "solicitud" ? "solicitud" : "briefing"}:</p>
${tablaHtml(resumenCliente)}
<p style="font-family:Arial,sans-serif;font-size:15px">Tengo también lo que me has contado en el formulario. Si quieres añadir algo, responde a este correo.</p>
<p style="font-family:Arial,sans-serif;font-size:13px;color:#666">Si no has enviado tú este formulario, ignora este correo.</p>${pie}`,
      text: `Hola:\n\nGracias por escribirme. ${respuesta}\n\nResumen:\n${tablaTexto(resumenCliente)}\n\nTengo también lo que me has contado en el formulario. Si quieres añadir algo, responde a este correo.\n\nSi no has enviado tú este formulario, ignora este correo.\n\nHugo Calvo García · hugocalvo.dev`,
    },
  };
};

export const manejador = (tipo) => ({
  OPTIONS: (request) => preflight(request),

  POST: async (request) => {
    const origen = origenPermitido(request);
    if (!origen) return json({ ok: false, error: "Origen no permitido." }, 403);
    try {
      return await procesar(tipo, request, origen);
    } catch (e) {
      console.error(`${tipo}:`, e);
      return json({ ok: false, error: "No se ha podido enviar." }, 500, origen);
    }
  },
});

const procesar = async (tipo, request, origen) => {

    const crudo = await leerTexto(request);
    if (crudo == null) return json({ ok: false, error: "El mensaje es demasiado largo." }, 413, origen);
    let d;
    try {
      d = JSON.parse(crudo);
    } catch {
      return json({ ok: false, error: "Datos no válidos." }, 400, origen);
    }
    if (!d || typeof d !== "object" || Array.isArray(d)) return json({ ok: false, error: "Datos no válidos." }, 400, origen);

    // Campo trampa o envío instantáneo: respondemos ok sin hacer nada
    if (d.website || Number(d.ms) < TIEMPO_MINIMO_MS) return json({ ok: true }, 200, origen);

    let v;
    try {
      v = validar(tipo, d);
    } catch (e) {
      if (e instanceof ErrorValidacion) return json({ ok: false, error: e.message }, 400, origen);
      throw e;
    }

    // Solo cuentan los envíos válidos: corregir un campo no agota los intentos
    const ip = ipCliente(request);
    if (!(await dentroDelLimite(`rl:${tipo}:${ip}`))) {
      return json({ ok: false, error: "Has enviado varias solicitudes seguidas. Espera un rato." }, 429, origen);
    }

    try {
      if (!(await verificarTurnstile(d.turnstile, ip))) {
        return json({ ok: false, error: "No se ha podido verificar que no eres un robot. Recarga la página." }, 400, origen);
      }
    } catch (e) {
      console.error("Turnstile:", e.message);
      return json({ ok: false, error: "El formulario no está disponible ahora mismo." }, 503, origen);
    }

    const { hugo, cliente } = correos(tipo, v);
    const [ntfy, aHugo] = await Promise.allSettled([
      avisarNtfy({ tipo: "solicitud", servicio: tipo === "briefing" ? `${v.servicio} (briefing)` : v.servicio }),
      enviarCorreo(hugo),
    ]);
    if (ntfy.status === "rejected") console.error("ntfy:", ntfy.reason?.message);
    if (aHugo.status === "rejected") console.error("Correo a Hugo:", aHugo.reason?.message);
    // Si no me ha llegado ningún aviso, que el cliente lo sepa y use otra vía
    if (ntfy.status === "rejected" && aHugo.status === "rejected") {
      return json({ ok: false, error: "No se ha podido enviar." }, 502, origen);
    }
    try {
      await enviarCorreo(cliente);
    } catch (e) {
      console.error("Correo al cliente:", e.message);
    }
    return json({ ok: true }, 200, origen);
};
