// multi/detalle-app.js
import { db } from '../registro/firebase.js';
import { state } from '../registro/state.js';
import {
  renderCalendar,
  previousMonth,
  nextMonth,
  selectCalendarDate,
  setUpRealtimeAvailability,
  cleanupExpiredHoldsOnLoad,
  updateReservationDates
} from '../registro/calendar.js';

function getParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    id: params.get('id'),
    tipo: params.get('tipo') || 'apto'
  };
}

function renderDetail(data, tipo) {
  const container = document.getElementById('detailContent');
  const actions   = document.getElementById('detailActions');
  const titleEl   = document.getElementById('detailTitle');
  const taglineEl = document.getElementById('detailTagline');
  if (!container || !actions) return;

  const capacidad = data.capacidad || data.capacidadTotal || '-';
  const precio    =
    typeof data.precioBase === 'number' && data.precioBase > 0
      ? data.precioBase
      : null;
  const servicios = Array.isArray(data.servicios) ? data.servicios : [];
  const fotos     = Array.isArray(data.fotos) ? data.fotos : [];
  const ciudad    = data.ciudad || '';
  const groupKey  = data.groupKey || '';

  const nombre = data.nombre || 'Alojamiento';
  const descripcionCorta =
    data.descripcionCorta ||
    (data.descripcion ? data.descripcion.split('.').shift() : '') ||
    'Tu base perfecta para descubrir la zona.';

  // Rellenamos cabecera (fuera del bloque main)
  if (titleEl) titleEl.textContent = nombre;
  if (taglineEl) taglineEl.textContent = descripcionCorta;

  const tipoLabel = tipo === 'pack' ? 'Pack' : 'Apartamento';

  container.innerHTML = `
    <div class="detail-main">
      <div class="detail-meta">
        <div class="detail-tags">
          <span class="detail-badge">${tipoLabel}</span>
          ${ciudad ? `<span class="detail-badge">${ciudad}</span>` : ''}
          ${groupKey ? `<span class="detail-badge">${groupKey}</span>` : ''}
        </div>

        <p><strong>Capacidad:</strong> ${capacidad} personas</p>
        ${data.camas ? `<p><strong>Camas:</strong> ${data.camas}</p>` : ''}
        ${data.dormitorios ? `<p><strong>Dormitorios:</strong> ${data.dormitorios}</p>` : ''}
        ${data.banos ? `<p><strong>Baños:</strong> ${data.banos}</p>` : ''}
        ${
          precio !== null
            ? `<p class="detail-price"><strong>Desde:</strong> ${precio.toFixed(
                0
              )} €/noche</p>`
            : ''
        }
        ${
          data.direccion
            ? `<p class="detail-address">
                 <strong>Dirección:</strong> ${data.direccion}${
                 ciudad ? ', ' + ciudad : ''
               }
               </p>`
            : ''
        }
      </div>

      ${
        data.descripcionLarga || data.descripcion
          ? `
        <div class="detail-description">
          <h2>Sobre este alojamiento</h2>
          <p>${
            (data.descripcionLarga || data.descripcion || '')
              .replace(/\n/g, '<br>')
          }</p>
        </div>
      `
          : ''
      }

      ${
        servicios.length
          ? `
        <div class="detail-services">
          <h3>Lo que incluye</h3>
          <ul>
            ${servicios.map((s) => `<li>${s}</li>`).join('')}
          </ul>
        </div>
      `
          : ''
      }

      ${
        fotos.length
          ? `
        <div class="detail-gallery">
          <h3>Galería</h3>
          <div class="detail-gallery-grid">
            ${fotos
              .filter(
                (f) =>
                  f.nombreArchivo &&
                  !f.nombreArchivo.toLowerCase().endsWith('.mp4')
              )
              .map(
                (f) => `
                <figure>
                  <img src="${f.url || '#'}" alt="${f.alt || ''}">
                  ${f.alt ? `<figcaption>${f.alt}</figcaption>` : ''}
                </figure>
              `
              )
              .join('')}
          </div>
        </div>
      `
          : ''
      }
    </div>
  `;

  actions.style.display = 'block';
}

/**
 * Inicializa el contexto de calendario para este alojamiento
 * (igual que haces en registro/app.js pero simplificado)
 */
async function initCalendarForProperty(id, tipo, data) {
  // Contexto de propiedad
  state.currentPropertyId    = id || 'atico-jerez';
  state.currentPropertyName  = (data && data.nombre) || 'Alojamiento';
  state.currentPricePerNight =
    data && typeof data.precioBase === 'number' ? data.precioBase : state.currentPricePerNight;

  // Reset de selección de fechas para esta vista
  state.calendarCurrentDate = new Date();
  state.bookCheckInDate     = null;
  state.bookCheckOutDate    = null;
  state.ownHoldDatesSet.clear();

  // Limpia holds caducados y suscribe disponibilidad en tiempo real
  await cleanupExpiredHoldsOnLoad();
  setUpRealtimeAvailability();
  updateReservationDates();
  renderCalendar();

  // Exponemos funciones para los onclick del HTML
  window.previousMonth      = previousMonth;
  window.nextMonth          = nextMonth;
  window.selectCalendarDate = selectCalendarDate;
}

async function loadDetail() {
  const { id, tipo } = getParams();
  const container    = document.getElementById('detailContent');

  if (!id) {
    if (container) container.innerHTML = '<p>Falta el ID del alojamiento.</p>';
    return;
  }

  try {
    const col  = tipo === 'pack' ? 'packs' : 'apartamentos';
    const snap = await db.collection(col).doc(id).get();

    if (!snap.exists) {
      if (container) container.innerHTML = '<p>No se ha encontrado este alojamiento.</p>';
      return;
    }

    const data = snap.data();
    renderDetail(data, tipo);

    // Calendario para este alojamiento concreto
    await initCalendarForProperty(snap.id, tipo, data);

    // Botón reservar → lleva al flujo de registro con id y tipo
    const reserveBtn = document.getElementById('reserveBtn');
    if (reserveBtn) {
      reserveBtn.addEventListener('click', () => {
        const params = new URLSearchParams({ id: snap.id, tipo });
        window.location.href = `../registro/index.html?${params.toString()}`;
      });
    }
  } catch (err) {
    console.error(err);
    if (container) container.innerHTML = '<p>Error cargando el alojamiento.</p>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = './index.html';
    });
  }

  loadDetail();
});