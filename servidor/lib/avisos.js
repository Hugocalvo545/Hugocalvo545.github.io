// Avisos: notificación push con ntfy y correos con Resend.

// Ninguna llamada externa puede colgar la función: Stripe reintenta si no respondemos a tiempo
export const TIEMPO_MAX_MS = 8000;

const NTFY_SERVER = () => (process.env.NTFY_SERVER || "https://ntfy.sh").replace(/\/$/, "");

// El aviso de ntfy lleva solo el tipo (pago o solicitud) y el servicio. Ni empresa, ni datos personales, ni datos de pago:
// ntfy.sh es un servicio público sin garantías de protección de datos. El detalle va solo por correo.
export const avisarNtfy = async ({ tipo, servicio }) => {
  const topic = process.env.NTFY_TOPIC;
  if (!topic) throw new Error("Falta NTFY_TOPIC");
  // Publicación JSON: admite tildes en el título sin codificar cabeceras
  const r = await fetch(NTFY_SERVER(), {
    method: "POST",
    signal: AbortSignal.timeout(TIEMPO_MAX_MS),
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      topic,
      title: `${tipo === "pago" ? "Nuevo pago" : "Nueva solicitud"}: ${servicio}`,
      message: "Detalle en el correo.",
      tags: [tipo === "pago" ? "moneybag" : "incoming_envelope"],
      priority: 4,
    }),
  });
  if (!r.ok) throw new Error(`ntfy HTTP ${r.status}`);
};

export const escapar = (t) =>
  String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// filas: [[etiqueta, valor], ...]; los valores vacíos no se muestran
export const tablaHtml = (filas) =>
  `<table cellpadding="6" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">${filas
    .filter(([, v]) => v != null && v !== "")
    .map(
      ([k, v]) =>
        `<tr><td style="color:#555;vertical-align:top;white-space:nowrap"><b>${escapar(k)}</b></td><td style="white-space:pre-wrap">${escapar(v)}</td></tr>`
    )
    .join("")}</table>`;

export const tablaTexto = (filas) =>
  filas
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");

export const enviarCorreo = async ({ to, subject, html, text, replyTo, idempotencia }) => {
  const clave = process.env.RESEND_API_KEY;
  if (!clave) throw new Error("Falta RESEND_API_KEY");
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    signal: AbortSignal.timeout(TIEMPO_MAX_MS),
    headers: {
      Authorization: `Bearer ${clave}`,
      "Content-Type": "application/json",
      ...(idempotencia ? { "Idempotency-Key": idempotencia.slice(0, 256) } : {}),
    },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || "Hugo Calvo <avisos@hugocalvo.dev>",
      to: [to],
      subject: subject.replace(/[\r\n]+/g, " ").slice(0, 200),
      html,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });
  if (!r.ok) throw new Error(`Resend HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
};

export const correoHugo = () => process.env.MAIL_TO || "hugocgarciat@gmail.com";

export const pie = `<p style="font-family:Arial,sans-serif;font-size:13px;color:#666">Hugo Calvo García · hugocalvo.dev · +34 638 091 795</p>`;
