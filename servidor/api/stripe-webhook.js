// POST /api/stripe-webhook: aviso cuando entra un pago de un Payment Link.
// Eventos: checkout.session.completed y checkout.session.async_payment_succeeded.
// Para saber qué servicio es, pon en el Payment Link el metadato servicio=auditoria-ia.
import { verificarFirma, datosSesion } from "../lib/stripe.js";
import { primeraVez, olvidar } from "../lib/redis.js";
import { avisarNtfy, enviarCorreo, correoHugo, tablaHtml, tablaTexto, escapar, pie } from "../lib/avisos.js";

const responder = (status, cuerpo = { received: true }) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { "Content-Type": "application/json" } });

export async function POST(request) {
  const secreto = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secreto) {
    console.error("Falta STRIPE_WEBHOOK_SECRET");
    return responder(500, { error: "config" });
  }
  // La firma se calcula sobre el cuerpo tal cual llega: hay que leerlo como texto, sin parsear antes
  const cuerpo = await request.text();
  if (!verificarFirma(cuerpo, request.headers.get("stripe-signature"), secreto)) {
    return responder(400, { error: "firma" });
  }

  const evento = JSON.parse(cuerpo);
  const sesion = evento.data?.object || {};
  const relevante =
    (evento.type === "checkout.session.completed" && sesion.payment_status === "paid") ||
    evento.type === "checkout.session.async_payment_succeeded";
  if (!relevante) return responder(200);

  // Stripe reintenta los eventos: solo avisamos una vez por sesión
  const marca = `stripe:sesion:${sesion.id}`;
  if (!(await primeraVez(marca))) return responder(200, { received: true, duplicado: true });

  const d = datosSesion(sesion);
  const resumen = [
    ["Servicio", d.servicio],
    ["Empresa", d.empresa],
    ["Nombre", d.nombre],
    ["Email", d.email],
    ["NIF", d.nif],
    ["Web a auditar", d.web],
    ["Importe", d.importe],
    ["Sesión de Stripe", d.sesion],
  ];
  const enlace = d.pago ? `https://dashboard.stripe.com/payments/${encodeURIComponent(d.pago)}` : "https://dashboard.stripe.com/payments";

  const [ntfy, aHugo] = await Promise.allSettled([
    avisarNtfy({ tipo: "pago", servicio: d.servicio, empresa: d.empresa }),
    enviarCorreo({
      to: correoHugo(),
      replyTo: d.email || undefined,
      subject: `Pago recibido: ${d.servicio} · ${d.empresa || d.nombre}`,
      html: `<h2 style="font-family:Arial,sans-serif">Pago recibido: ${escapar(d.servicio)}</h2>${tablaHtml(resumen)}<p style="font-family:Arial,sans-serif"><a href="${escapar(enlace)}">Ver el pago en Stripe</a></p>`,
      text: `Pago recibido: ${d.servicio}\n\n${tablaTexto(resumen)}\n\n${enlace}`,
      idempotencia: `pago-hugo-${sesion.id}`,
    }),
  ]);
  if (ntfy.status === "rejected") console.error("ntfy:", ntfy.reason?.message);
  if (aHugo.status === "rejected") console.error("Correo a Hugo:", aHugo.reason?.message);
  if (ntfy.status === "rejected" && aHugo.status === "rejected") {
    // Sin ningún aviso: quitamos la marca y pedimos a Stripe que reintente
    await olvidar(marca);
    return responder(500, { error: "avisos" });
  }

  if (d.email) {
    try {
      await enviarCorreo({
        to: d.email,
        replyTo: correoHugo(),
        subject: `Pago recibido: ${d.servicio}`,
        html: `<p style="font-family:Arial,sans-serif;font-size:15px">Hola${d.nombre ? `, ${escapar(d.nombre)}` : ""}:</p>
<p style="font-family:Arial,sans-serif;font-size:15px">He recibido tu pago de <b>${escapar(d.servicio)}</b>. Te escribo en menos de 24 h laborables para arrancar y pedirte lo que necesito.</p>
<p style="font-family:Arial,sans-serif;font-size:15px">Si quieres adelantarme algo (las preguntas que te importan o los competidores que conoces), responde a este correo.</p>${pie}`,
        text: `Hola${d.nombre ? `, ${d.nombre}` : ""}:\n\nHe recibido tu pago de ${d.servicio}. Te escribo en menos de 24 h laborables para arrancar y pedirte lo que necesito.\n\nSi quieres adelantarme algo, responde a este correo.\n\nHugo Calvo García · hugocalvo.dev`,
        idempotencia: `pago-cliente-${sesion.id}`,
      });
    } catch (e) {
      console.error("Correo al cliente:", e.message);
    }
  }
  return responder(200);
}
