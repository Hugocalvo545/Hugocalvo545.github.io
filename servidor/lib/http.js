// Utilidades HTTP comunes: CORS limitado a la web, respuestas JSON e IP del cliente.

const origenes = () =>
  (process.env.ALLOWED_ORIGIN || "https://hugocalvo.dev")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

export const hostnamesPermitidos = () => origenes().map((o) => new URL(o).hostname);

export const origenPermitido = (request) => {
  const origen = request.headers.get("origin");
  return origen && origenes().includes(origen) ? origen : null;
};

const cabecerasCors = (origen) =>
  origen
    ? {
        "Access-Control-Allow-Origin": origen,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
        Vary: "Origin",
      }
    : { Vary: "Origin" };

export const json = (cuerpo, status = 200, origen = null) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...cabecerasCors(origen) },
  });

export const preflight = (request) => {
  const origen = origenPermitido(request);
  return new Response(null, { status: origen ? 204 : 403, headers: cabecerasCors(origen) });
};

export const ipCliente = (request) =>
  (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || request.headers.get("x-real-ip") || "desconocida";

// Lee el cuerpo como texto con un tope de tamaño (los formularios ocupan unos pocos KB)
export const leerTexto = async (request, max = 20_000) => {
  const largo = Number(request.headers.get("content-length") || 0);
  if (largo > max) return null;
  const texto = await request.text();
  return texto.length > max ? null : texto;
};
