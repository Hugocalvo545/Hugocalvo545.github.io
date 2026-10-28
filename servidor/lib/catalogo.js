// Ids y nombres de servicios y paquetes que acepta la API.
// Fuente de verdad: assets/data/servicios.json (el proyecto de Vercel no puede leer fuera de servidor/).
// test/catalogo.test.js comprueba que ambos coinciden: ejecuta `npm test` tras cambiar el JSON.

export const SERVICIOS = {
  "auditoria-ia": {
    nombre: "Auditoría de visibilidad en IA",
    nivel: "pago-directo",
    paquetes: { auditoria: "Auditoría completa" },
  },
  "visibilidad-ia": {
    nombre: "Visibilidad en IA mensual",
    nivel: "solicitar",
    paquetes: { esencial: "Esencial", pro: "Pro", avanzado: "Avanzado" },
  },
  webs: {
    nombre: "Webs y landings",
    nivel: "presupuesto",
    paquetes: { landing: "Landing", corporativa: "Web corporativa", completa: "Web completa" },
  },
  apps: {
    nombre: "Apps y plataformas a medida",
    nivel: "presupuesto",
    paquetes: { "a-medida": "Proyecto a medida" },
  },
  automatizaciones: {
    nombre: "Automatizaciones con IA",
    nivel: "presupuesto",
    paquetes: { hora: "Por horas", "bolsa-10": "Bolsa de 10 h", "bolsa-20": "Bolsa de 20 h" },
  },
  mantenimiento: {
    nombre: "Mantenimiento, hosting y SEO técnico",
    nivel: "solicitar",
    paquetes: { basico: "Básico", pro: "Pro" },
  },
};

// Opciones del briefing (mismos valores que js/servicios.js)
export const PROYECTOS = {
  landing: "Landing (1 página)",
  corporativa: "Web corporativa (hasta 5 páginas)",
  completa: "Web completa (hasta 10 páginas)",
  app: "App o plataforma a medida",
  automatizacion: "Automatización con IA",
  otro: "Otra cosa o no lo tengo claro",
};

export const FUNCIONALIDADES = {
  formulario: "Formulario de contacto",
  blog: "Blog",
  idiomas: "Varios idiomas",
  reservas: "Reservas o citas",
  pagos: "Pagos online",
  "area-clientes": "Área de clientes",
  panel: "Panel de gestión",
  integraciones: "Conexión con otras herramientas",
  ia: "Funciones con IA",
};

export const PLAZOS = {
  urgente: "Lo antes posible",
  "1-mes": "En 1 mes",
  "2-3-meses": "En 2 o 3 meses",
  "sin-prisa": "Sin prisa",
};

export const PRESUPUESTOS = {
  "menos-1000": "Menos de 1.000 €",
  "1000-2500": "De 1.000 a 2.500 €",
  "2500-5000": "De 2.500 a 5.000 €",
  "5000-10000": "De 5.000 a 10.000 €",
  "mas-10000": "Más de 10.000 €",
  "no-se": "No lo sé todavía",
};
