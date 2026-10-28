// Upstash Redis por REST: límite de envíos por IP y marca de eventos de Stripe ya procesados.
// Las variables las crea la integración de Upstash en Vercel (KV_REST_API_* o UPSTASH_REDIS_REST_*).
// Si no está configurado, se deja pasar (fail open): Turnstile sigue protegiendo los formularios.

const URL_REDIS = () => process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN_REDIS = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

export const redisConfigurado = () => Boolean(URL_REDIS() && TOKEN_REDIS());

const pipeline = async (comandos) => {
  const r = await fetch(`${URL_REDIS()}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN_REDIS()}`, "Content-Type": "application/json" },
    body: JSON.stringify(comandos),
  });
  if (!r.ok) throw new Error(`Redis HTTP ${r.status}`);
  return r.json();
};

// Ventana fija: como mucho `max` envíos por IP y hora
export const dentroDelLimite = async (clave, max = 5, segundos = 3600) => {
  if (!redisConfigurado()) return true;
  try {
    const [{ result: cuenta }, expira] = await pipeline([
      ["INCR", clave],
      ["EXPIRE", clave, String(segundos), "NX"],
    ]);
    if (expira?.error) await pipeline([["EXPIRE", clave, String(segundos)]]);
    return Number(cuenta) <= max;
  } catch (e) {
    console.warn("Límite no disponible:", e.message);
    return true;
  }
};

// Devuelve true la primera vez que se ve la clave (SET NX con caducidad)
export const primeraVez = async (clave, segundos = 7 * 24 * 3600) => {
  if (!redisConfigurado()) return true;
  try {
    const [{ result }] = await pipeline([["SET", clave, "1", "NX", "EX", String(segundos)]]);
    return result === "OK";
  } catch (e) {
    console.warn("Redis no disponible:", e.message);
    return true;
  }
};

export const olvidar = async (clave) => {
  if (!redisConfigurado()) return;
  try {
    await pipeline([["DEL", clave]]);
  } catch {
    // Sin Redis no hay marca que borrar
  }
};
