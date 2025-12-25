import { MS_PER_DAY } from './config.js';

export function normalizeDate(dateLike) {
  const d = new Date(dateLike);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function toISO(date) {
  const d = normalizeDate(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${da}`;
}

export function addDays(date, n) {
  const d = normalizeDate(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function parseEsDate(dmy) {
  if (!dmy) return null;
  const parts = dmy.split('/');
  if (parts.length !== 3) return null;
  const dd = parseInt(parts[0], 10);
  const mm = parseInt(parts[1], 10);
  const yy = parseInt(parts[2], 10);
  if (!dd || !mm || !yy) return null;
  const dt = new Date(yy, mm - 1, dd);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

/** Parseo LOCAL de 'YYYY-MM-DD' (evita el desfase por UTC). */
export function parseISODateLocal(iso) {
  if (!iso || typeof iso !== 'string') return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

export function daysBetweenExclusiveEnd(start, endExclusive) {
  const out = [];
  let d = normalizeDate(start);
  const end = normalizeDate(endExclusive);
  while (d < end) {
    out.push(toISO(d));
    d = addDays(d, 1);
  }
  return out;
}

export function nightsBetween(start, end) {
  if (!start || !end) return 0;
  return Math.round((normalizeDate(end) - normalizeDate(start)) / MS_PER_DAY);
}

/** Sanitiza para Firestore: elimina 'undefined' en profundidad. */
export function sanitizeForFirestore(value) {
  if (value === undefined) return undefined;
  if (value instanceof Date) return value;
  if (Array.isArray(value)) {
    return value.map(v => sanitizeForFirestore(v)).filter(v => v !== undefined);
  }
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      const sv = sanitizeForFirestore(v);
      if (sv !== undefined) out[k] = sv;
    }
    return out;
  }
  return value;
}
