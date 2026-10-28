// POST /api/solicitud: formulario "Solicitar alta" (servicios de solicitar y luego pagar)
import { manejador } from "../lib/formulario.js";

const h = manejador("solicitud");

export function OPTIONS(request) {
  return h.OPTIONS(request);
}

export async function POST(request) {
  return h.POST(request);
}
