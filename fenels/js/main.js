/* ============ FENELS — main.js ============ */

// ---------- Configuración ----------
// Opción A (por defecto): endpoint serverless propio en /api/waitlist (Vercel).
// Opción B: si rellenas FORMSPREE_ID (ej. "mqkvabcd"), el formulario se envía
// a Formspree y el contador usa un número base local.
const CONFIG = {
  FORMSPREE_ID: '',            // ej. 'mqkvabcd' → https://formspree.io/f/mqkvabcd
  ENDPOINT: '/api/waitlist',
  BASE_COUNT: 0,               // súmalo al contador si quieres arrancar con base
  FALLBACK_COUNT: 17,          // lo que se enseña si el endpoint no responde
};

const form = document.getElementById('waitlist-form');
const successBox = document.getElementById('success-box');
const errorBox = document.getElementById('form-error');
const submitBtn = document.getElementById('submit-btn');
const counterEl = document.getElementById('counter');
const tallaSelect = document.getElementById('f-talla');

// El select se ve gris (placeholder) hasta que eligen talla.
tallaSelect.addEventListener('change', () => {
  tallaSelect.classList.toggle('filled', tallaSelect.value !== '');
});

// ---------- Validación + envío ----------

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.hidden = false;
}

function clearError() {
  errorBox.hidden = true;
  errorBox.textContent = '';
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();

  const nombre = form.nombre.value.trim();
  const email = form.email.value.trim();
  const talla = form.talla.value;
  const consent = form.consent.checked;
  const honeypot = form.web.value; // si tiene algo, es un bot

  if (!isValidEmail(email)) {
    showError('Ese email no cuela. Revísalo 👀');
    form.email.focus();
    return;
  }

  if (!consent) {
    showError('Marca la casilla para que podamos avisarte.');
    return;
  }

  // Los bots rellenan el honeypot: fingimos éxito y no enviamos nada.
  if (honeypot) {
    showSuccess();
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'ENVIANDO…';

  try {
    if (CONFIG.FORMSPREE_ID) {
      const res = await fetch(`https://formspree.io/f/${CONFIG.FORMSPREE_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ nombre, email, talla }),
      });
      if (!res.ok) throw new Error('formspree');
    } else {
      const res = await fetch(CONFIG.ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, talla, web: honeypot }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'endpoint');
      if (typeof data.count === 'number') renderCount(data.count);
    }

    showSuccess();
  } catch (err) {
    submitBtn.disabled = false;
    submitBtn.textContent = 'APÚNTAME A LA LISTA';
    showError('Algo ha fallado al enviarlo. Prueba otra vez en un momento.');
  }
});

function showSuccess() {
  form.hidden = true;
  successBox.hidden = false;
  successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ---------- Contador de reservas ----------

function renderCount(n) {
  const total = n + CONFIG.BASE_COUNT;
  animateCount(total);
}

function animateCount(target) {
  const duration = 900;
  const start = performance.now();
  function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    counterEl.textContent = Math.round(target * eased).toLocaleString('es-ES');
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

async function loadCount() {
  try {
    const res = await fetch(CONFIG.ENDPOINT);
    if (!res.ok) throw new Error();
    const data = await res.json();
    renderCount(typeof data.count === 'number' ? data.count : CONFIG.FALLBACK_COUNT);
  } catch {
    // Sin endpoint (Formspree o vista local): número base para no dejar un hueco.
    renderCount(CONFIG.FALLBACK_COUNT);
  }
}

// Solo animamos el contador cuando entra en pantalla.
const counterSection = document.getElementById('lista');
const counterObserver = new IntersectionObserver(
  (entries) => {
    if (entries[0].isIntersecting) {
      loadCount();
      counterObserver.disconnect();
    }
  },
  { threshold: 0.3 }
);
counterObserver.observe(counterSection);

// ---------- Aparición al hacer scroll ----------

const revealObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.15 }
);

document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));
