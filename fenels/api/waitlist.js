// ============ FENELS — /api/waitlist (función serverless de Vercel) ============
//
// POST { nombre, email, talla, web }  → guarda la reserva y devuelve { ok, count }
// GET                                 → devuelve { count } para el contador
//
// Almacenamiento: Upstash Redis vía REST (la integración "Upstash for Redis" /
// Vercel KV define las variables KV_REST_API_URL y KV_REST_API_TOKEN).
// Sin base de datos que mantener: un set para emails únicos + una lista con el detalle.
//
// Si Redis no está configurado, la función responde igualmente (stored: false)
// para que la página no se rompa en previews.

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const KEY_EMAILS = 'fenels:emails';   // set de emails únicos → el contador
const KEY_ENTRIES = 'fenels:entries'; // lista con el detalle de cada reserva

async function redis(command) {
  const res = await fetch(REDIS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(command),
  });
  if (!res.ok) throw new Error(`Redis HTTP ${res.status}`);
  const data = await res.json();
  return data.result;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  const configured = Boolean(REDIS_URL && REDIS_TOKEN);

  // ---- GET: contador ----
  if (req.method === 'GET') {
    if (!configured) return res.status(200).json({ count: 0, stored: false });
    try {
      const count = await redis(['SCARD', KEY_EMAILS]);
      return res.status(200).json({ count: Number(count) || 0 });
    } catch {
      return res.status(200).json({ count: 0 });
    }
  }

  // ---- POST: nueva reserva ----
  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? safeParse(req.body) : req.body || {};
    const { nombre = '', email = '', talla = '', web = '' } = body;

    // Honeypot: los bots lo rellenan → fingimos éxito sin guardar nada.
    if (web) return res.status(200).json({ ok: true });

    const cleanEmail = String(email).trim().toLowerCase().slice(0, 120);
    if (!EMAIL_RE.test(cleanEmail)) {
      return res.status(400).json({ error: 'Email no válido' });
    }

    const cleanNombre = String(nombre).trim().slice(0, 80);
    const cleanTalla = ['S', 'M', 'L', 'XL'].includes(talla) ? talla : '';

    if (!configured) {
      console.warn('[fenels] Redis sin configurar: reserva no guardada', cleanEmail);
      return res.status(200).json({ ok: true, stored: false });
    }

    try {
      const added = await redis(['SADD', KEY_EMAILS, cleanEmail]);
      if (added === 1) {
        const entry = JSON.stringify({
          nombre: cleanNombre,
          email: cleanEmail,
          talla: cleanTalla,
          ts: new Date().toISOString(),
        });
        await redis(['RPUSH', KEY_ENTRIES, entry]);
      }
      const count = await redis(['SCARD', KEY_EMAILS]);
      return res.status(200).json({ ok: true, count: Number(count) || 0 });
    } catch (err) {
      console.error('[fenels] Error guardando reserva:', err.message);
      return res.status(500).json({ error: 'Error del servidor' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Método no permitido' });
}

function safeParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return {};
  }
}
