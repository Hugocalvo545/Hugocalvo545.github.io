import { db } from './firebase.js';
import { state } from './state.js';
import { PRICE_PER_NIGHT, GOOGLE_SHEETS_URL } from './config.js';
import { nightsBetween, parseEsDate, sanitizeForFirestore } from './utils.js';
import {
  updateReservationDates,
  deleteActiveHold,
  renderCalendar
} from './calendar.js';
import {
  getUserLevel,
  getDiscountForLevel,
  updateLevelDisplay,
  updatePointsDisplay
} from './profile.js';
import {
  getAllGuestData,
  updateGuestForms
} from './guests.js';

// =============================================================
// Helpers (los tuyos)
// =============================================================

function formatPropertyName(propertyId, propertyName) {
  if (propertyName) return propertyName;
  switch (propertyId) {
    case 'atico-jerez':
      return 'Ático Dúplex en Jerez';
    default:
      return 'Alojamiento';
  }
}

function sortBookingsByProximity(bookings) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = [];
  const past = [];

  bookings.forEach(b => {
    const ci = parseEsDate(b.checkIn);
    if (!ci) {
      upcoming.push(b);
      return;
    }
    if (ci >= today) {
      upcoming.push({ ...b, _ci: ci });
    } else {
      past.push({ ...b, _ci: ci });
    }
  });

  upcoming.sort((a, b) => (a._ci || 0) - (b._ci || 0));
  past.sort((a, b) => (b._ci || 0) - (a._ci || 0));

  return [...upcoming, ...past].map(b => {
    delete b._ci;
    return b;
  });
}

function getBookingStatus(b) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const ci = parseEsDate(b.checkIn);
  const co = parseEsDate(b.checkOut);

  if (!ci || !co) {
    return { label: 'Confirmada', className: 'status-pending' };
  }
  if (today < ci) {
    return { label: 'Pendiente', className: 'status-pending' };
  }
  if (today >= ci && today <= co) {
    return { label: 'En curso', className: 'status-current' };
  }
  return { label: 'Expirada', className: 'status-expired' };
}

// Envío best-effort a Google Sheets (sin CORS)
async function sendToSheets(bookingData) {
  if (!GOOGLE_SHEETS_URL) return;
  try {
    const form = new FormData();
    form.append('payload', JSON.stringify(bookingData));
    await fetch(GOOGLE_SHEETS_URL, { method: 'POST', body: form, mode: 'no-cors' });
  } catch (err) {
    console.warn('[Sheets] No se pudo notificar (reserva ya guardada):', err);
  }
}

// =============================================================
// Precio y pasos (tuyos, sin cambios de lógica)
// =============================================================

export function calculatePrice() {
  const adultsSelect = document.getElementById('bookAdults');
  const childrenSelect = document.getElementById('bookChildren');

  const numAdults = parseInt(adultsSelect.value || '0', 10) || 0;
  const numChildren = parseInt(childrenSelect.value || '0', 10) || 0;
  if (!state.bookCheckInDate || !state.bookCheckOutDate ) return;

  const nights = nightsBetween(state.bookCheckInDate, state.bookCheckOutDate);
  if (nights <= 0) return;

  const pricePerNight = PRICE_PER_NIGHT;
  const subtotal = nights * pricePerNight;
  const service = subtotal * 0.1;
  const tax = (subtotal + service) * 0.21;
  const totalBeforeDiscount = subtotal + service + tax;
  const discountAmount = totalBeforeDiscount * (state.currentDiscount / 100);
  const total = totalBeforeDiscount - discountAmount;

  const guestsLabel =
    `${numAdults} adulto${numAdults > 1 ? 's' : ''}` +
    (numChildren ? ` + ${numChildren} niño${numChildren > 1 ? 's' : ''}` : '');

  const nightsCount = document.getElementById('nightsCount');
  const guestsCount = document.getElementById('guestsCount');
  const pricePerNightEl = document.getElementById('pricePerNight');
  const serviceFee = document.getElementById('serviceFee');
  const taxFee = document.getElementById('taxFee');
  const totalPriceEl = document.getElementById('totalPrice');
  const discountItem = document.getElementById('discountItem');
  const discountAmountEl = document.getElementById('discountAmount');

  if (nightsCount) nightsCount.innerText = nights;
  if (guestsCount) guestsCount.innerText = guestsLabel;
  if (pricePerNightEl) pricePerNightEl.innerText = '€' + pricePerNight.toFixed(2);
  if (serviceFee) serviceFee.innerText = '€' + service.toFixed(2);
  if (taxFee) taxFee.innerText = '€' + tax.toFixed(2);
  if (totalPriceEl) totalPriceEl.innerText = '€' + total.toFixed(2);

  if (discountItem && discountAmountEl) {
    if (state.currentDiscount > 0) {
      discountItem.style.display = 'flex';
      discountAmountEl.textContent = '-€' + discountAmount.toFixed(2);
    } else {
      discountItem.style.display = 'none';
    }
  }
}

export function changeGuests(type, delta) {
  const adultsInput = document.getElementById('bookAdults');
  const childrenInput = document.getElementById('bookChildren');
  if (!adultsInput || !childrenInput) return;

  let adults = parseInt(adultsInput.value || '0', 10) || 0;
  let children = parseInt(childrenInput.value || '0', 10) || 0;

  if (type === 'adults') {
    adults += delta;
  } else if (type === 'children') {
    children += delta;
  }

  // 🟨 Límite por separado
  adults = Math.min(Math.max(adults, 1), 4);     // 1 a 4
  children = Math.min(Math.max(children, 0), 4); // 0 a 4

  // 🟥 Límite total: máximo 4 personas entre adultos + niños
  if (adults + children > 4) {
    // Ajustamos el último cambio para no superar 4
    if (type === 'adults' && delta > 0) {
      adults = 4 - children;
    } else if (type === 'children' && delta > 0) {
      children = 4 - adults;
    }

    // Aseguramos límites de nuevo
    adults = Math.min(Math.max(adults, 1), 4);
    children = Math.min(Math.max(children, 0), 4);
  }

  adultsInput.value = adults;
  childrenInput.value = children;

  updateGuestForms();
  calculatePrice();
}

export function bookGoToStep(step) {
  if (step === 2) updateGuestForms();

  if (step === 3) {
    if (!state.bookCheckInDate || !state.bookCheckOutDate) {
      alert('Faltan fechas'); return;
    }

    const numAdults = parseInt(document.getElementById('bookAdults').value || '0', 10) || 0;
    const numChildren = parseInt(document.getElementById('bookChildren').value || '0', 10) || 0;
    const nights = nightsBetween(state.bookCheckInDate, state.bookCheckOutDate);

    const pricePerNight = numAdults * PRICE_PER_NIGHT;
    const subtotal = nights * pricePerNight;
    const service = subtotal * 0.1;
    const tax = (subtotal + service) * 0.21;
    const totalBeforeDiscount = subtotal + service + tax;
    const discountAmount = totalBeforeDiscount * (state.currentDiscount / 100);
    const total = totalBeforeDiscount - discountAmount;
    const points = Math.floor(total);

    const guestsText =
      `${numAdults} adulto${numAdults > 1 ? 's' : ''}` +
      (numChildren ? ` + ${numChildren} niño${numChildren > 1 ? 's' : ''}` : '');

    const ciText = state.bookCheckInDate.toLocaleDateString('es-ES');
    const coText = state.bookCheckOutDate.toLocaleDateString('es-ES');

    const confirmCheckIn = document.getElementById('confirmCheckIn');
    const confirmCheckOut = document.getElementById('confirmCheckOut');
    const confirmNights = document.getElementById('confirmNights');
    const confirmGuests = document.getElementById('confirmGuests');
    const confirmSubtotal = document.getElementById('confirmSubtotal');
    const confirmDiscount = document.getElementById('confirmDiscount');
    const confirmPrice = document.getElementById('confirmPrice');
    const confirmPoints = document.getElementById('confirmPoints');
    const discountRow = document.getElementById('discountRow');

    if (confirmCheckIn) confirmCheckIn.innerText = ciText;
    if (confirmCheckOut) confirmCheckOut.innerText = coText;
    if (confirmNights) confirmNights.innerText = nights;
    if (confirmGuests) confirmGuests.innerText = guestsText;
    if (confirmSubtotal) confirmSubtotal.innerText = '€' + totalBeforeDiscount.toFixed(2);
    if (confirmPrice) confirmPrice.innerText = '€' + total.toFixed(2);
    if (confirmPoints) confirmPoints.innerText = '+' + points + ' ⭐';

    if (discountRow && confirmDiscount) {
      if (state.currentDiscount > 0) {
        discountRow.style.display = 'flex';
        confirmDiscount.innerText = `-€${discountAmount.toFixed(2)} (${state.currentDiscount}%)`;
      } else {
        discountRow.style.display = 'none';
      }
    }
  }

  for (let i = 1; i <= 3; i++) {
    const content = document.getElementById('bookStep' + i);
    const stepEl = document.getElementById('bStep' + i);
    if (!content || !stepEl) continue;

    if (i === step) {
      content.classList.add('active');
      stepEl.classList.add('active');
      stepEl.classList.remove('completed', 'inactive');
    } else if (i < step) {
      content.classList.remove('active');
      stepEl.classList.add('completed');
      stepEl.classList.remove('active', 'inactive');
    } else {
      content.classList.remove('active');
      stepEl.classList.add('inactive');
      stepEl.classList.remove('active', 'completed');
    }
  }
}

// =============================================================
// Setup submit
// =============================================================

export function setupBookingForm() {
  let form = document.getElementById('bookingForm');
  if (!form) return;

  // Evitar múltiples listeners
  if (!form.dataset.cleaned) {
    const clone = form.cloneNode(true);
    form.parentNode.replaceChild(clone, form);
    form = clone;
    form.dataset.cleaned = 'true';
  }
  if (form.dataset.bound === 'true') return;
  form.dataset.bound = 'true';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById('submitBookingBtn');
    const msg = document.getElementById('bookingMessage');

    if (state.isSubmitting) return;
    state.isSubmitting = true;

    const resetBtn = () => {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Finalizar Reserva';
      }
      state.isSubmitting = false;
    };

    try {
      const terms = document.getElementById('bookTerms');
      if (!terms || !terms.checked) {
        if (msg) msg.innerHTML = '<div class="error-message">❌ Debes aceptar los términos.</div>';
        resetBtn(); return;
      }
      if (!state.bookCheckInDate || !state.bookCheckOutDate) {
        if (msg) msg.innerHTML = '<div class="error-message">❌ Selecciona Check-in y Check-out.</div>';
        resetBtn(); return;
      }

      const numAdults = parseInt(document.getElementById('bookAdults')?.value || '0', 10) || 0;
      const numChildren = parseInt(document.getElementById('bookChildren')?.value || '0', 10) || 0;
      if (!numAdults) {
        if (msg) msg.innerHTML = '<div class="error-message">❌ Debes indicar al menos 1 adulto.</div>';
        resetBtn(); return;
      }

      if (numAdults < 1 || numAdults > 4 || numChildren < 0 || numChildren > 4) {
        if (msg) {
          msg.innerHTML = '<div class="error-message">❌ Número de huéspedes no válido (adultos 1–4, niños 0–4).</div>';
        }
        resetBtn(); return;
      }

      if (numAdults + numChildren > 4) {
        if (msg) {
          msg.innerHTML = '<div class="error-message">❌ Máximo 4 personas en total (adultos + niños).</div>';
        }
        resetBtn(); return;
      }

      const nights = nightsBetween(state.bookCheckInDate, state.bookCheckOutDate);
      if (nights <= 0) {
        if (msg) msg.innerHTML = '<div class="error-message">❌ Las fechas seleccionadas no son válidas.</div>';
        resetBtn(); return;
      }

      if (!state.currentUser || !state.currentUser.uid) {
        if (msg) msg.innerHTML = '<div class="error-message">❌ Sesión no válida. Inicia sesión de nuevo.</div>';
        resetBtn(); return;
      }

      const observations = document.getElementById('bookObservations')?.value || '';

      const pricePerNight = state.currentPricePerNight || PRICE_PER_NIGHT;
      const subtotal = nights * pricePerNight;
      const service = subtotal * 0.1;
      const tax = (subtotal + service) * 0.21;
      const totalBeforeDiscount = subtotal + service + tax;
      const discountAmount = totalBeforeDiscount * (state.currentDiscount / 100);
      // 👇 evita NaN
      const totalPriceNum = Number.isFinite(totalBeforeDiscount - discountAmount)
        ? (totalBeforeDiscount - discountAmount) : 0;
      const pointsEarned = Math.floor(totalPriceNum);

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading-spinner"></span>Guardando...';
      }
      if (msg) {
        msg.innerHTML = '<div class="loading-message">Guardando tu reserva, por favor espera...</div>';
      }

      const guests = getAllGuestData() || [];
      const u = state.userData || {};

      // Generar ID de documento y usarlo en el payload
      const ref = db.collection('reservas').doc();
      const reservaId = ref.id;

      const bookingDataRaw = {
        userId: state.currentUser.uid,
        propertyId: state.currentPropertyId || 'atico-jerez',
        propertyName: state.currentPropertyName || 'Ático Dúplex en Jerez',
        reservaId,
        name: u.name || '',
        surname: u.surname || '',
        email: u.email || '',
        phone: u.phone || '',
        checkIn: state.bookCheckInDate.toLocaleDateString('es-ES'),
        checkOut: state.bookCheckOutDate.toLocaleDateString('es-ES'),
        nights,
        numAdults,
        numChildren,
        totalPrice: Number(totalPriceNum.toFixed(2)), // número, no string ni NaN
        discountApplied: state.currentDiscount,
        pointsEarned,
        observations,
        createdAt: new Date(),
        guests
      };

      const bookingData = sanitizeForFirestore(bookingDataRaw);

      // Guarda
      console.log('[BOOKING] payload =>', bookingData);
      await ref.set(bookingData);
      await sendToSheets(bookingData);
      try{ await deleteActiveHold(); }catch(_){}
      state.bookCheckInDate=null; state.bookCheckOutDate=null; state.ownHoldDatesSet.clear();
      updateReservationDates(); renderCalendar();

      try{
        state.userPoints=(state.userPoints||0)+pointsEarned;
        state.currentLevel=getUserLevel(state.userPoints);
        state.currentDiscount=getDiscountForLevel(state.currentLevel);
        await db.collection('usuarios').doc(state.currentUser.uid).update({ points: state.userPoints });
        updateLevelDisplay(); updatePointsDisplay();
      }catch(pErr){ console.warn('[PUNTOS] No se pudieron actualizar:',pErr); }

      const pointsGained=document.getElementById('pointsGained'); 
      if(pointsGained) pointsGained.innerText='+'+pointsEarned+' ⭐';

      if(msg) msg.innerHTML='<div class="success-message">✓ Reserva guardada correctamente.</div>';

      const successModal=document.getElementById('successModal'); 
      if(successModal) {
        // 👉 guardamos el ID de la reserva recién creada
        successModal.dataset.bookingId = reservaId;
        setTimeout(()=>successModal.classList.add('active'),200);
      }


      await loadBookingsHistory();
      resetBtn();
    } catch (err) {
      console.error('[RESERVA] Error crítico al guardar:', err);
      const msg = document.getElementById('bookingMessage');
      if (msg) {
        msg.innerHTML =
          '<div class="error-message">❌ Ha ocurrido un error al procesar tu reserva. No se ha completado.</div>';
      }
      resetBtn();
    }
  });
}

// =============================================================
// Historial / listado  (tuyo, sin cambios salvo estilo)
// =============================================================

function renderBookingsList() {
  const list = document.getElementById('bookingsList');
  if (!list) return;

  const bookings = state.bookingsDisplayCache || [];

  if (!bookings.length) {
    list.innerHTML = '<p style="color:#999;">No tienes reservas</p>';
    list.style.display = state.bookingsVisible ? 'block' : 'none';
    return;
  }

  let html = '';
  bookings.forEach((b, index) => {
    const guestLabel =
      `${b.numAdults} adulto${b.numAdults > 1 ? 's' : ''}` +
      (b.numChildren ? ` · ${b.numChildren} niño${b.numChildren > 1 ? 's' : ''}` : '');
    const propertyName = formatPropertyName(b.propertyId, b.propertyName);
    const { label: statusLabel, className: statusClass } = getBookingStatus(b);

    html += `
      <div class="booking-item" onclick="openBookingDetails(${index})">
        <h4>${propertyName}</h4>
        <p>${b.checkIn} → ${b.checkOut} · ${b.nights} noches</p>
        <p>👥 ${guestLabel} · 💰 €${b.totalPrice}</p>
        <span class="booking-status ${statusClass}">${statusLabel}</span>
      </div>
    `;
  });

  list.innerHTML = html;
  list.style.display = state.bookingsVisible ? 'block' : 'none';
}

function renderNextBookingHighlight() {
  const box = document.getElementById('nextBookingHighlight');
  if (!box) return;

  const bookings = state.bookingsHistoryCache || [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let next = null;
  for (const b of bookings) {
    const ci = parseEsDate(b.checkIn);
    if (ci && ci >= today) { next = b; break; }
  }

  if (!next) {
    box.innerHTML = '';
    box.style.display = 'none';
    return;
  }

  const guestLabel =
    `${next.numAdults} adulto${next.numAdults > 1 ? 's' : ''}` +
    (next.numChildren ? ` · ${next.numChildren} niño${next.numChildren > 1 ? 's' : ''}` : '');
  const propertyName = formatPropertyName(next.propertyId, next.propertyName);
  const { label: statusLabel, className: statusClass } = getBookingStatus(next);

  box.style.display = 'block';
  box.innerHTML = `
    <div class="booking-item next-booking-highlight" onclick="openBookingDetails(0)">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
        <div>
          <div style="font-size:0.75rem;color:#1a8b7d;margin-bottom:4px;">Próxima reserva</div>
          <h4>${propertyName}</h4>
          <p>${next.checkIn} → ${next.checkOut} · ${next.nights} noches</p>
          <p>👥 ${guestLabel} · 💰 €${next.totalPrice}</p>
        </div>
        <div style="text-align:right;">
          <span class="booking-status ${statusClass}">${statusLabel}</span>
        </div>
      </div>
    </div>
  `;
}

export async function loadBookingsHistory() {
  if (!state.currentUser) return;
  const list = document.getElementById('bookingsList');
  if (!list) return;

  try {
    const snap = await db.collection('reservas')
      .where('userId', '==', state.currentUser.uid)
      .orderBy('createdAt', 'desc')
      .get();

    const raw = [];
    snap.forEach(doc => raw.push(doc.data()));

    const sorted = sortBookingsByProximity(raw);
    state.bookingsHistoryCache = sorted;
    state.bookingsDisplayCache = [...sorted];

    renderNextBookingHighlight();
    renderBookingsList();
  } catch (err) {
    console.error('Error cargar reservas:', err);
  }
}

// =============================================================
// Toggle, filtro y modal (tuyos)
// =============================================================

export function toggleBookingsVisibility() {
  state.bookingsVisible = !state.bookingsVisible;
  const list = document.getElementById('bookingsList');
  const label = document.getElementById('bookingsToggleLabel');
  if (list) list.style.display = state.bookingsVisible ? 'block' : 'none';
  if (label) label.textContent = state.bookingsVisible ? '(Ocultar)' : '(Mostrar)';
}

export function filterBookings() {
  const input = document.getElementById('bookingsSearchInput');
  if (!input) return;

  const term = input.value.trim().toLowerCase();
  if (!term) {
    state.bookingsDisplayCache = [...state.bookingsHistoryCache];
    renderBookingsList();
    return;
  }

  state.bookingsDisplayCache = state.bookingsHistoryCache.filter(b => {
    const propertyName = (formatPropertyName(b.propertyId, b.propertyName) || '').toLowerCase();
    const dates = `${b.checkIn} ${b.checkOut}`.toLowerCase();
    const total = String(b.totalPrice || '').toLowerCase();
    return propertyName.includes(term) || dates.includes(term) || total.includes(term);
  });

  renderBookingsList();
}

export function openBookingDetails(index) {
  const b = state.bookingsDisplayCache[index];
  if (!b) return;

  const modal = document.getElementById('bookingDetailsModal');
  const content = document.getElementById('bookingDetailsContent');
  if (!modal || !content) return;

  const guestLabel =
    `${b.numAdults} adulto${b.numAdults > 1 ? 's' : ''}` +
    (b.numChildren ? ` · ${b.numChildren} niño${b.numChildren > 1 ? 's' : ''}` : '');
  const propertyName = formatPropertyName(b.propertyId, b.propertyName);
  const { label: statusLabel, className: statusClass } = getBookingStatus(b);

  let guestsHtml = '';
  if (Array.isArray(b.guests) && b.guests.length) {
    guestsHtml = '<h4 style="margin-top:12px;">Huéspedes</h4><ul style="padding-left:18px;font-size:0.9rem;">';
    b.guests.forEach(g => {
      guestsHtml += `<li>${g.isPrincipal ? '⭐ ' : ''}${g.type || ''} - ${g.name || ''} ${g.surname || ''}</li>`;
    });
    guestsHtml += '</ul>';
  }

  content.innerHTML = `
    <p><strong>Apartamento:</strong> ${propertyName}</p>
    <p><strong>Estado:</strong> <span class="booking-status ${statusClass}">${statusLabel}</span></p>
    <p><strong>Check-in:</strong> ${b.checkIn}</p>
    <p><strong>Check-out:</strong> ${b.checkOut}</p>
    <p><strong>Noches:</strong> ${b.nights}</p>
    <p><strong>Huéspedes:</strong> ${guestLabel}</p>
    <p><strong>Total:</strong> €${b.totalPrice} ${b.discountApplied ? '(descuento ' + b.discountApplied + '%)' : ''}</p>
    <p><strong>Puntos ganados:</strong> ${b.pointsEarned || 0} ⭐</p>
    ${b.observations ? `<p><strong>Observaciones:</strong> ${b.observations}</p>` : ''}
    ${guestsHtml}
  `;

  modal.classList.add('active');
}

export function openBookingDetailsFromObject(b){
  if(!b) return;
  const modal=document.getElementById('bookingDetailsModal');
  const content=document.getElementById('bookingDetailsContent');
  if(!modal||!content) return;

  const guestLabel=`${b.numAdults} adulto${b.numAdults>1?'s':''}`+
    (b.numChildren?` · ${b.numChildren} niño${b.numChildren>1?'s':''}`:'');

  let guestsHtml='';
  if(Array.isArray(b.guests)&&b.guests.length){
    guestsHtml='<h4 style="margin-top:12px;">Huéspedes</h4><ul style="padding-left:18px;font-size:.9rem;">';
    b.guests.forEach(g=>{
      guestsHtml+=`<li>${g.isPrincipal?'⭐ ':''}${g.type||''} - ${g.name||''} ${g.surname||''}</li>`;
    });
    guestsHtml+='</ul>';
  }

  content.innerHTML=`
    <p><strong>Check-in:</strong> ${b.checkIn}</p>
    <p><strong>Check-out:</strong> ${b.checkOut}</p>
    <p><strong>Noches:</strong> ${b.nights}</p>
    <p><strong>Huéspedes:</strong> ${guestLabel}</p>
    <p><strong>Total:</strong> €${b.totalPrice}</p>
    <p><strong>Puntos ganados:</strong> ${b.pointsEarned||0} ⭐</p>
    ${b.observations?`<p><strong>Observaciones:</strong> ${b.observations}</p>`:''}
    ${guestsHtml}
  `;
  modal.classList.add('active');
}

export async function viewLastBookingDetails(){
  const successModal=document.getElementById('successModal'); 
  if(!successModal) return;

  const bookingId=successModal.dataset.bookingId;
  if(!bookingId){
    alert('No se ha encontrado la reserva recién creada.');
    return;
  }

  try{
    const doc=await db.collection('reservas').doc(bookingId).get();
    if(!doc.exists){
      alert('No se han encontrado los datos de la reserva.');
      return;
    }
    const booking=doc.data();
    openBookingDetailsFromObject(booking);
    successModal.classList.remove('active');
  }catch(err){
    console.error('Error cargando reserva:',err);
    alert('Ha ocurrido un error al cargar los detalles de la reserva.');
  }
}


export function closeBookingDetails() {
  const modal = document.getElementById('bookingDetailsModal');
  const content = document.getElementById('bookingDetailsContent');
  if (modal) modal.classList.remove('active');
  if (content) content.innerHTML = '';
}
