// Pruebas sin red: fetch simulado. Ejecuta `npm test` dentro de servidor/.
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { verificarFirma, firmar } from "../lib/stripe.js";
import { SERVICIOS, PROYECTOS, FUNCIONALIDADES, PLAZOS, PRESUPUESTOS } from "../lib/catalogo.js";

const ORIGEN = "https://hugocalvo.dev";
const SECRETO_WH = "whsec_prueba";
let llamadas = [];
let respuestaTurnstile = { success: true, hostname: "hugocalvo.dev" };
const fetchOriginal = globalThis.fetch;

beforeEach(() => {
  llamadas = [];
  respuestaTurnstile = { success: true, hostname: "hugocalvo.dev" };
  Object.assign(process.env, {
    ALLOWED_ORIGIN: ORIGEN,
    STRIPE_WEBHOOK_SECRET: SECRETO_WH,
    TURNSTILE_SECRET: "0x-secreto-real",
    RESEND_API_KEY: "re_prueba",
    MAIL_FROM: "Hugo Calvo <avisos@hugocalvo.dev>",
    MAIL_TO: "hugo@example.com",
    NTFY_TOPIC: "tema-prueba",
  });
  delete process.env.KV_REST_API_URL;
  delete process.env.UPSTASH_REDIS_REST_URL;
  globalThis.fetch = async (url, opts = {}) => {
    const body = opts.body ? JSON.parse(opts.body) : null;
    llamadas.push({ url: String(url), body, headers: opts.headers || {} });
    if (String(url).includes("turnstile")) return Response.json(respuestaTurnstile);
    if (String(url).includes("resend")) return Response.json({ id: "x" });
    if (String(url).includes("ntfy")) return Response.json({ id: "n" });
    throw new Error(`fetch inesperado: ${url}`);
  };
});
afterEach(() => {
  globalThis.fetch = fetchOriginal;
});

// ---------- catálogo sincronizado con la web ----------
test("catalogo.js coincide con assets/data/servicios.json", () => {
  const web = JSON.parse(readFileSync(new URL("../../assets/data/servicios.json", import.meta.url), "utf8"));
  assert.deepEqual(Object.keys(SERVICIOS).sort(), web.servicios.map((s) => s.id).sort());
  for (const s of web.servicios) {
    assert.equal(SERVICIOS[s.id].nombre, s.nombre, s.id);
    assert.equal(SERVICIOS[s.id].nivel, s.nivel, s.id);
    assert.deepEqual(Object.keys(SERVICIOS[s.id].paquetes).sort(), s.paquetes.map((p) => p.id).sort(), s.id);
  }
});

test("las opciones del briefing coinciden con js/servicios.js", () => {
  const js = readFileSync(new URL("../../js/servicios.js", import.meta.url), "utf8");
  for (const lista of [PROYECTOS, FUNCIONALIDADES, PLAZOS, PRESUPUESTOS]) {
    for (const [valor, texto] of Object.entries(lista)) assert.ok(js.includes(`["${valor}", "${texto}"]`), `${valor} / ${texto}`);
  }
});

// ---------- firma de Stripe ----------
test("verificarFirma acepta una firma válida y rechaza las demás", () => {
  const cuerpo = '{"id":"evt_1"}';
  const ahora = 1_800_000_000;
  const cab = firmar(cuerpo, SECRETO_WH, ahora);
  assert.equal(verificarFirma(cuerpo, cab, SECRETO_WH, ahora), true);
  assert.equal(verificarFirma(cuerpo + " ", cab, SECRETO_WH, ahora), false, "cuerpo alterado");
  assert.equal(verificarFirma(cuerpo, cab, "whsec_otro", ahora), false, "otro secreto");
  assert.equal(verificarFirma(cuerpo, cab, SECRETO_WH, ahora + 301), false, "fuera de tolerancia");
  assert.equal(verificarFirma(cuerpo, "t=abc,v1=", SECRETO_WH, ahora), false, "cabecera rota");
  assert.equal(verificarFirma(cuerpo, null, SECRETO_WH, ahora), false, "sin cabecera");
});

// ---------- webhook ----------
const sesionPagada = {
  id: "cs_test_1",
  object: "checkout.session",
  payment_status: "paid",
  amount_total: 42229,
  currency: "eur",
  payment_intent: "pi_1",
  metadata: { servicio: "auditoria-ia" },
  customer_details: { name: "María López", business_name: "Clínica López SL", email: "maria@clinica.es", tax_ids: [{ type: "es_cif", value: "B12345678" }] },
  custom_fields: [{ key: "webaauditar", label: { type: "custom", custom: "Web a auditar" }, type: "text", text: { value: "clinica.es" } }],
};
const peticionWebhook = (evento, secreto = SECRETO_WH) => {
  const cuerpo = JSON.stringify(evento);
  return new Request("https://api.hugocalvo.dev/api/stripe-webhook", {
    method: "POST",
    headers: { "stripe-signature": firmar(cuerpo, secreto), "content-type": "application/json" },
    body: cuerpo,
  });
};

test("webhook: pago válido avisa por ntfy sin datos de pago y envía dos correos", async () => {
  const { POST } = await import("../api/stripe-webhook.js");
  const r = await POST(peticionWebhook({ id: "evt_1", type: "checkout.session.completed", data: { object: sesionPagada } }));
  assert.equal(r.status, 200);
  const ntfy = llamadas.filter((l) => l.url.includes("ntfy"));
  assert.equal(ntfy.length, 1);
  assert.deepEqual(Object.keys(ntfy[0].body).sort(), ["message", "priority", "tags", "title", "topic"]);
  assert.equal(ntfy[0].body.title, "Nuevo pago: Auditoría de visibilidad en IA");
  assert.equal(ntfy[0].body.message, "Detalle en el correo.");
  const textoNtfy = JSON.stringify(ntfy[0].body);
  for (const prohibido of ["422", "maria@", "B12345678", "pi_1", "cs_test", "María", "Clínica"]) assert.ok(!textoNtfy.includes(prohibido), prohibido);
  const correos = llamadas.filter((l) => l.url.includes("resend"));
  assert.equal(correos.length, 2);
  assert.deepEqual(correos[0].body.to, ["hugo@example.com"]);
  assert.match(correos[0].body.text, /Web a auditar: clinica\.es/);
  assert.match(correos[0].body.text, /NIF: B12345678/);
  assert.match(correos[0].body.text, /Importe: 422,29 EUR/);
  assert.match(correos[0].body.text, /emitir la factura en Gestolio/);
  assert.match(correos[1].body.text, /factura con el IVA desglosado te la envío yo/);
  assert.deepEqual(correos[1].body.to, ["maria@clinica.es"]);
});

test("webhook: firma inválida devuelve 400 y no avisa", async () => {
  const { POST } = await import("../api/stripe-webhook.js");
  const r = await POST(peticionWebhook({ id: "evt_2", type: "checkout.session.completed", data: { object: sesionPagada } }, "whsec_falso"));
  assert.equal(r.status, 400);
  assert.equal(llamadas.length, 0);
});

test("webhook: sesión aún sin pagar (pago diferido) se ignora", async () => {
  const { POST } = await import("../api/stripe-webhook.js");
  const r = await POST(peticionWebhook({ id: "evt_3", type: "checkout.session.completed", data: { object: { ...sesionPagada, payment_status: "unpaid" } } }));
  assert.equal(r.status, 200);
  assert.equal(llamadas.length, 0);
});

test("webhook: si fallan ntfy y el correo, devuelve 500 para que Stripe reintente", async () => {
  const { POST } = await import("../api/stripe-webhook.js");
  globalThis.fetch = async () => new Response("caído", { status: 503 });
  const r = await POST(peticionWebhook({ id: "evt_4", type: "checkout.session.completed", data: { object: sesionPagada } }));
  assert.equal(r.status, 500);
});

// ---------- formularios ----------
const solicitudValida = {
  servicio: "mantenimiento",
  paquete: "pro",
  web: "clinica.es",
  necesidad: "Quiero olvidarme de las actualizaciones.",
  nombre: "María López",
  empresa: "Clínica López",
  email: "maria@clinica.es",
  telefono: "600 000 000",
  privacidad: true,
  website: "",
  turnstile: "token",
  ms: 9000,
};
const briefingValido = {
  servicio: "webs",
  paquete: "corporativa",
  proyecto: "corporativa",
  objetivo: "Que los pacientes reserven cita online.",
  funcionalidades: ["reservas", "blog"],
  funcionalidades_detalle: "",
  web: "",
  plazo: "1-mes",
  presupuesto: "1000-2500",
  nombre: "María López",
  empresa: "",
  email: "maria@clinica.es",
  telefono: "",
  privacidad: true,
  website: "",
  turnstile: "token",
  ms: 60000,
};
const peticionForm = (ruta, datos, origen = ORIGEN) =>
  new Request(`https://api.hugocalvo.dev/api/${ruta}`, {
    method: "POST",
    headers: { origin: origen, "content-type": "application/json" },
    body: JSON.stringify(datos),
  });

test("solicitud válida: Turnstile, ntfy solo con tipo y servicio y dos correos", async () => {
  const { POST } = await import("../api/solicitud.js");
  const r = await POST(peticionForm("solicitud", solicitudValida));
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { ok: true });
  assert.equal(r.headers.get("access-control-allow-origin"), ORIGEN);
  assert.equal(llamadas[0].body.secret, "0x-secreto-real");
  const ntfy = llamadas.find((l) => l.url.includes("ntfy")).body;
  assert.equal(ntfy.title, "Nueva solicitud: Mantenimiento, hosting y SEO técnico");
  assert.equal(ntfy.message, "Detalle en el correo.");
  for (const prohibido of ["maria@", "Clínica", "María"]) assert.ok(!JSON.stringify(ntfy).includes(prohibido), prohibido);
  const correos = llamadas.filter((l) => l.url.includes("resend"));
  assert.equal(correos.length, 2);
  assert.equal(correos[0].body.reply_to, "maria@clinica.es");
  assert.match(correos[1].body.text, /Plan: Pro/);
});

test("briefing válido: etiquetas legibles en el correo", async () => {
  const { POST } = await import("../api/briefing.js");
  const r = await POST(peticionForm("briefing", briefingValido));
  assert.equal(r.status, 200);
  const ntfy = llamadas.find((l) => l.url.includes("ntfy")).body;
  assert.equal(ntfy.title, "Nueva solicitud: Webs y landings (briefing)");
  const aHugo = llamadas.find((l) => l.url.includes("resend")).body;
  assert.match(aHugo.text, /Funcionalidades: Reservas o citas, Blog/);
  assert.match(aHugo.text, /Presupuesto orientativo: De 1\.000 a 2\.500 €/);
});

test("formularios: origen no permitido, trampa, envío instantáneo y preflight", async () => {
  const { POST, OPTIONS } = await import("../api/solicitud.js");
  assert.equal((await POST(peticionForm("solicitud", solicitudValida, "https://malo.example"))).status, 403);
  const trampa = await POST(peticionForm("solicitud", { ...solicitudValida, website: "http://spam" }));
  assert.equal(trampa.status, 200);
  const rapido = await POST(peticionForm("solicitud", { ...solicitudValida, ms: 300 }));
  assert.equal(rapido.status, 200);
  assert.equal(llamadas.length, 0, "ni Turnstile ni avisos");
  const pre = await OPTIONS(new Request("https://api.hugocalvo.dev/api/solicitud", { method: "OPTIONS", headers: { origin: ORIGEN } }));
  assert.equal(pre.status, 204);
  assert.equal(pre.headers.get("access-control-allow-methods"), "POST, OPTIONS");
});

test("formularios: validación con mensajes en español", async () => {
  const { POST } = await import("../api/solicitud.js");
  const casos = [
    [{ email: "no-es-email" }, /email/],
    [{ privacidad: false }, /privacidad/],
    [{ servicio: "webs" }, /Servicio no válido/], // webs va por briefing, no por solicitud
    [{ paquete: "avanzado" }, /Plan no válido/],
    [{ web: "esto no es una web" }, /web/],
    [{ necesidad: "x".repeat(1501) }, /largo/],
    [{ nombre: "" }, /Nombre/],
  ];
  for (const [cambio, error] of casos) {
    const r = await POST(peticionForm("solicitud", { ...solicitudValida, ...cambio }));
    assert.equal(r.status, 400, JSON.stringify(cambio));
    assert.match((await r.json()).error, error);
  }
  assert.equal(llamadas.length, 0);
});

test("formularios: Turnstile fallido u otro dominio devuelve 400", async () => {
  const { POST } = await import("../api/briefing.js");
  respuestaTurnstile = { success: false };
  assert.equal((await POST(peticionForm("briefing", briefingValido))).status, 400);
  respuestaTurnstile = { success: true, hostname: "otro.example" };
  assert.equal((await POST(peticionForm("briefing", briefingValido))).status, 400);
  assert.equal(llamadas.filter((l) => !l.url.includes("turnstile")).length, 0);
});

test("formularios: cuerpo demasiado grande devuelve 413", async () => {
  const { POST } = await import("../api/briefing.js");
  const r = await POST(peticionForm("briefing", { ...briefingValido, objetivo: "x".repeat(30000) }));
  assert.equal(r.status, 413);
});

// ---------- arreglos tras la revisión ----------
test("correo al cliente: sin texto libre ni nombre (no sirve para mandar mensajes a terceros)", async () => {
  const { POST } = await import("../api/solicitud.js");
  const cebo = "Verifique su cuenta en https://phish.example";
  await POST(peticionForm("solicitud", { ...solicitudValida, necesidad: cebo, nombre: cebo.slice(0, 40), empresa: cebo.slice(0, 40) }));
  const [aHugo, aCliente] = llamadas.filter((l) => l.url.includes("resend")).map((l) => l.body);
  assert.match(aHugo.text, /phish\.example/, "Hugo sí recibe todo");
  assert.ok(!aCliente.html.includes("phish") && !aCliente.text.includes("phish"), "el cliente no recibe el texto libre");
  assert.match(aCliente.text, /Plan: Pro/);
});

test("web con tildes o ñ se acepta", async () => {
  const { POST } = await import("../api/solicitud.js");
  const r = await POST(peticionForm("solicitud", { ...solicitudValida, web: "peluqueríamaría.es" }));
  assert.equal(r.status, 200);
});

test("límite por IP: los envíos inválidos no gastan intentos", async () => {
  process.env.KV_REST_API_URL = "https://redis.example";
  process.env.KV_REST_API_TOKEN = "t";
  let incr = 0;
  const base = globalThis.fetch;
  globalThis.fetch = async (url, o) => {
    if (String(url).startsWith("https://redis.example")) {
      incr++;
      return Response.json([{ result: incr }, { result: 1 }]);
    }
    return base(url, o);
  };
  const { POST } = await import("../api/solicitud.js");
  for (let i = 0; i < 3; i++) await POST(peticionForm("solicitud", { ...solicitudValida, email: "mal" }));
  assert.equal(incr, 0);
  await POST(peticionForm("solicitud", solicitudValida));
  assert.equal(incr, 1);
});

test("Turnstile caído (5xx) responde 503, no «eres un robot»", async () => {
  const { POST } = await import("../api/briefing.js");
  const base = globalThis.fetch;
  globalThis.fetch = async (url, o) => (String(url).includes("turnstile") ? new Response("<html>", { status: 502 }) : base(url, o));
  const r = await POST(peticionForm("briefing", briefingValido));
  assert.equal(r.status, 503);
});

test("error inesperado en un formulario mantiene CORS", async () => {
  const { POST } = await import("../api/briefing.js");
  globalThis.fetch = async () => {
    throw new Error("boom");
  };
  respuestaTurnstile = null;
  const r = await POST(peticionForm("briefing", briefingValido));
  assert.ok([500, 503].includes(r.status));
  assert.equal(r.headers.get("access-control-allow-origin"), ORIGEN);
});

test("webhook: pago sin metadato de servicio avisa a Hugo pero no escribe al cliente", async () => {
  const { POST } = await import("../api/stripe-webhook.js");
  const r = await POST(peticionWebhook({ id: "evt_5", type: "checkout.session.completed", data: { object: { ...sesionPagada, id: "cs_otro", metadata: {} } } }));
  assert.equal(r.status, 200);
  const correos = llamadas.filter((l) => l.url.includes("resend"));
  assert.equal(correos.length, 1);
  assert.deepEqual(correos[0].body.to, ["hugo@example.com"]);
  assert.equal(llamadas.find((l) => l.url.includes("ntfy")).body.title, "Nuevo pago: servicio sin identificar");
});

test("webhook: error inesperado tras marcar la sesión la desmarca y pide reintento", async () => {
  process.env.KV_REST_API_URL = "https://redis.example";
  process.env.KV_REST_API_TOKEN = "t";
  const comandos = [];
  globalThis.fetch = async (url, o) => {
    if (String(url).startsWith("https://redis.example")) {
      comandos.push(JSON.parse(o.body)[0][0]);
      return Response.json([{ result: "OK" }]);
    }
    throw new Error("red caída");
  };
  const { POST } = await import("../api/stripe-webhook.js");
  // custom_fields roto: datosSesion lanza después de marcar
  const r = await POST(peticionWebhook({ id: "evt_6", type: "checkout.session.completed", data: { object: { ...sesionPagada, id: "cs_roto", custom_fields: 42 } } }));
  assert.equal(r.status, 500);
  assert.deepEqual(comandos, ["SET", "DEL"]);
});
