export const LEVELS = [
  { nivel: 1, nombre: "Viajero Novato", min: 0, max: 100, recompensa: "Bienvenida al club", desc: "Comienza tu aventura", discount: 0 },
  { nivel: 2, nombre: "Viajero Plata", min: 100, max: 300, recompensa: "Descuento 5% permanente", desc: "¡Ya eres parte de la comunidad!", discount: 5 },
  { nivel: 3, nombre: "Viajero Oro", min: 300, max: 600, recompensa: "Descuento 5% permanente + Bombones", desc: "Tus viajes son nuestros favoritos", discount: 5 },
  { nivel: 4, nombre: "Viajero Platino", min: 600, max: 1000, recompensa: "Descuento 10% permanente + Bombones", desc: "Elite de nuestros viajeros", discount: 10 },
  { nivel: 5, nombre: "Viajero VIP", min: 1000, max: 3000, recompensa: "Descuento 10% permanente + Detallito al llegar", desc: "Eres nuestro cliente especial", discount: 10 },
  { nivel: 6, nombre: "Viajero Leyenda", min: 3000, max: 999999, recompensa: "Descuento 15% permanente + Sorpresa al llegar", desc: "¡Eres nuestra leyenda viviente!", discount: 15 }
];

export const GOOGLE_SHEETS_URL =
  'https://script.google.com/macros/s/AKfycbyl4auWVmsJX5ReQKzdpDNxD51DKM1cOLftTJ-Q10vtuK_UJ19_rFTBM08Av94Q_8TK/exec';

export const PRICE_PER_NIGHT = 68;
export const PROPERTY_ID = "atico-jerez";
export const HOLD_MINUTES = 15;
export const MS_PER_DAY = 24 * 60 * 60 * 1000;
