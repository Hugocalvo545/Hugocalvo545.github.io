// POST /api/briefing: briefing por pasos (servicios de briefing y presupuesto)
import { manejador } from "../lib/formulario.js";

const h = manejador("briefing");

export function OPTIONS(request) {
  return h.OPTIONS(request);
}

export async function POST(request) {
  return h.POST(request);
}
