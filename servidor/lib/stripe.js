// Verificación de la firma de los webhooks de Stripe sin el SDK.
// Cabecera Stripe-Signature: "t=<timestamp>,v1=<firma>[,v1=...]"; firma = HMAC-SHA256(secreto, `${t}.${cuerpo}`).
// https://docs.stripe.com/webhooks#verify-manually
import { createHmac, timingSafeEqual } from "node:crypto";
import { SERVICIOS } from "./catalogo.js";

const TOLERANCIA_S = 300;

export const verificarFirma = (cuerpo, cabecera, secreto, ahora = Math.floor(Date.now() / 1000)) => {
  if (!cabecera || !secreto) return false;
  const partes = cabecera.split(",").map((p) => p.split("="));
  const t = Number(partes.find(([k]) => k === "t")?.[1]);
  const firmas = partes.filter(([k]) => k === "v1").map(([, v]) => v);
  if (!Number.isFinite(t) || !firmas.length) return false;
  if (Math.abs(ahora - t) > TOLERANCIA_S) return false;
  const esperada = Buffer.from(createHmac("sha256", secreto).update(`${t}.${cuerpo}`, "utf8").digest("hex"));
  return firmas.some((f) => {
    const b = Buffer.from(f);
    return b.length === esperada.length && timingSafeEqual(b, esperada);
  });
};

export const firmar = (cuerpo, secreto, t = Math.floor(Date.now() / 1000)) =>
  `t=${t},v1=${createHmac("sha256", secreto).update(`${t}.${cuerpo}`, "utf8").digest("hex")}`;

// Datos útiles de una Checkout Session para el aviso (sin datos de tarjeta)
const importe = (centimos, moneda) =>
  centimos == null ? "" : `${(centimos / 100).toFixed(2).replace(".", ",")} ${String(moneda || "").toUpperCase()}`;

export const datosSesion = (s) => {
  const det = s.customer_details || {};
  const campo = (s.custom_fields || []).find((c) => /web/i.test(c.key) || /web/i.test(c.label?.custom || ""));
  const servicioId = s.metadata?.servicio;
  return {
    servicio: SERVICIOS[servicioId]?.nombre || "Pago con Stripe",
    empresa: det.business_name || s.collected_information?.business_name || "",
    nombre: det.individual_name || det.name || s.collected_information?.individual_name || "",
    email: det.email || "",
    nif: (det.tax_ids || []).map((t) => t.value).join(", "),
    web: campo?.text?.value || "",
    importe: importe(s.amount_total, s.currency),
    sesion: s.id,
    pago: s.payment_intent || "",
  };
};
