// calendar.js
import { db, firebase } from './firebase.js';
import { state } from './state.js';

const PROPERTY_ID   = 'atico-jerez';
const HOLD_MINUTES  = 15;
const MS_PER_DAY    = 24 * 60 * 60 * 1000;

// =====================
// Utilidades de fecha
// =====================

function normalizeDate(dateLike) {
  const d = new Date(dateLike);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toISO(date) {
  const d  = normalizeDate(date);
  const y  = d.getFullYear();
  const m  = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${da}`;
}

function addDays(date, n) {
  const d = normalizeDate(date);
  d.setDate(d.getDate() + n);
  return d;
}

function parseEsDate(dmy) {
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

// Parsear YYYY-MM-DD en local (sin líos de UTC)
function parseISODateLocal(iso) {
  if (!iso || typeof iso !== 'string') return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

// Devuelve array de isos desde start (incluido) hasta endExclusive (excluido)
function daysBetweenExclusiveEnd(start, endExclusive) {
  const out = [];
  let d = normalizeDate(start);
  const end = normalizeDate(endExclusive);
  while (d < end) {
    out.push(toISO(d));
    d = addDays(d, 1);
  }
  return out;
}

// =====================
// Calendario
// =====================

export function renderCalendar() {
  const year  = state.calendarCurrentDate.getFullYear();
  const month = state.calendarCurrentDate.getMonth();

  const label      = state.calendarCurrentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const monthLabel = label.charAt(0).toUpperCase() + label.slice(1);

  const monthEl = document.getElementById('calendarMonth');
  if (monthEl) monthEl.innerText = monthLabel;

  const grid = document.getElementById('calendarGrid');
  if (!grid) return;

  const firstDay           = new Date(year, month, 1);
  const lastDay            = new Date(year, month + 1, 0);
  const daysInMonth        = lastDay.getDate();
  const startingDayOfWeek  = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // lunes = 0

  const today = normalizeDate(new Date());
  let html    = '';

  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  dayNames.forEach(d => {
    html += `<div class="day-header">${d}</div>`;
  });

  // Días del mes anterior
  const prevMonth       = new Date(year, month, 0);
  const daysInPrevMonth = prevMonth.getDate();
  for (let i = daysInPrevMonth - startingDayOfWeek + 1; i <= daysInPrevMonth; i++) {
    html += `<div class="calendar-day other-month">${i}</div>`;
  }

  // Días del mes actual
  for (let day = 1; day <= daysInMonth; day++) {
    const currentDayDate = normalizeDate(new Date(year, month, day));
    const iso            = toISO(currentDayDate);

    const isReserved    = state.reservedDatesSet.has(iso);    // noches ocupadas
    const hasCheckIn    = state.checkInDatesSet.has(iso);     // existe check-in de alguna reserva
    const hasCheckOut   = state.checkOutDatesSet.has(iso);    // existe check-out de alguna reserva
    const isHold        = state.holdDatesSet.has(iso);

    const isFullyBlocked = hasCheckIn && hasCheckOut;         // día con check-in y check-out ya ocupados
    const isOccupied     = isReserved && !hasCheckIn;         // noche ocupada, pero no es día de entrada

    const isCheckIn =
      state.bookCheckInDate &&
      normalizeDate(state.bookCheckInDate).getTime() === currentDayDate.getTime();

    const isCheckOut =
      state.bookCheckOutDate &&
      normalizeDate(state.bookCheckOutDate).getTime() === currentDayDate.getTime();

    const isInRange =
      state.bookCheckInDate &&
      state.bookCheckOutDate &&
      currentDayDate > normalizeDate(state.bookCheckInDate) &&
      currentDayDate < normalizeDate(state.bookCheckOutDate);

    const isPast = currentDayDate < today;


    let classes = 'calendar-day';

    if (isPast) {
      classes += ' other-month';
    } else if (isCheckIn) {
      classes += ' selected';
    } else if (isCheckOut) {
      classes += ' checkout';
    } else if (isInRange) {
      classes += ' range';
    } else if (isFullyBlocked) {
      // Día con check-in y check-out: no hay margen para ninguna reserva → rojo
      classes += ' occupied';
    } else if (isOccupied) {
      classes += ' occupied';
    } else if (isHold) {
      classes += ' hold';
    } else {
      classes += ' available';

      // Marca visualmente los días que son check-in de otra reserva
      // pero que no están totalmente bloqueados
      if (hasCheckIn && !hasCheckOut) {
        classes += ' checkin-foreign';
      }
    }


    let onclick = '';
    let cursor  = 'not-allowed';

    // No permitir click en días totalmente bloqueados ni en holds
    if (!isPast && !isHold && !isFullyBlocked) {
      onclick = `onclick="selectCalendarDate(${year},${month},${day})"`;
      cursor  = 'pointer';
    }

    html += `<div class="${classes}" style="cursor:${cursor};" ${onclick}>${day}</div>`;
  }

  // Relleno siguiente mes (hasta 6 filas)
  const totalCells = 42; // 7x6
  const usedCells  = daysInMonth + startingDayOfWeek + dayNames.length;
  const remaining  = totalCells - (usedCells - dayNames.length);
  for (let i = 1; i <= remaining; i++) {
    html += `<div class="calendar-day other-month">${i}</div>`;
  }

  grid.innerHTML = html;
  updateCalendarInfo();
}

export function previousMonth() {
  state.calendarCurrentDate.setMonth(state.calendarCurrentDate.getMonth() - 1);
  renderCalendar();
}

export function nextMonth() {
  state.calendarCurrentDate.setMonth(state.calendarCurrentDate.getMonth() + 1);
  renderCalendar();
}

function updateCalendarInfo() {
  const infoEl = document.getElementById('calendarInfo');
  if (!infoEl) return;

  let info = '';
  if (state.bookCheckInDate && state.bookCheckOutDate) {
    const nights =
      (normalizeDate(state.bookCheckOutDate) - normalizeDate(state.bookCheckInDate)) /
      MS_PER_DAY;
    info = `✅ ${nights} noches reservadas`;
  } else if (state.bookCheckInDate) {
    info = `📍 Check-in: ${state.bookCheckInDate.toLocaleDateString(
      'es-ES'
    )} → Elige Check-out`;
  } else {
    info = `👆 Clickea una fecha verde para comenzar`;
  }
  infoEl.innerText = info;
}

// =====================
// Validación de rango
// =====================

export function isRangeFree(startInclusive, endInclusive, ignoreOwnHold = false) {
  if (!startInclusive || !endInclusive) return false;

  const start = normalizeDate(startInclusive);
  const end   = normalizeDate(endInclusive);
  if (end <= start) return false;

  const days = daysBetweenExclusiveEnd(start, end);
  for (const iso of days) {
    if (state.reservedDatesSet.has(iso)) return false;
    if (state.holdDatesSet.has(iso)) {
      if (ignoreOwnHold && state.ownHoldDatesSet.has(iso)) continue;
      return false;
    }
  }
  return true;
}

// =====================
// Selección en calendario
// =====================

export function selectCalendarDate(y, m, d) {
  const date  = normalizeDate(new Date(y, m, d));
  const today = normalizeDate(new Date());
  if (date < today) return;

  const iso        = toISO(date);
  const isReserved = state.reservedDatesSet.has(iso);
  const isHold     = state.holdDatesSet.has(iso);
  const hasCheckIn = state.checkInDatesSet.has(iso);
  const hasCheckOut= state.checkOutDatesSet.has(iso);

  const isFullyBlocked = hasCheckIn && hasCheckOut;
  const isOccupied     = isReserved && !hasCheckIn;


  // Primer clic: no se puede empezar una reserva el día que ya es check-in de otra
  if (!state.bookCheckInDate && state.checkInDatesSet.has(iso)) {
    alert('❌ Ese día ya tiene entrada de otro huésped. Puedes reservar desde el día siguiente.');
    return;
  }

  // Día ocupado (por noches o por hold) ⇒ no lo dejamos usar
  if (isOccupied || isHold || isFullyBlocked) {
    state.bookCheckInDate  = null;
    state.bookCheckOutDate = null;
    alert('❌ Esta fecha no está disponible. Elige otra.');
    state.bookCheckInDate  = null;
    state.bookCheckOutDate = null;
    state.ownHoldDatesSet.clear();
    deleteActiveHold();
    updateReservationDates();
    renderCalendar();
    return;
  }

  // Click sobre el mismo check-in ⇒ resetea selección
  if (
    state.bookCheckInDate &&
    normalizeDate(state.bookCheckInDate).getTime() === date.getTime()
  ) {
    state.bookCheckInDate  = null;
    state.bookCheckOutDate = null;
    state.ownHoldDatesSet.clear();
    deleteActiveHold();
    updateReservationDates();
    renderCalendar();
    return;
  }

  // Definir inicio (o redefinirlo)
  if (
    !state.bookCheckInDate ||
    (state.bookCheckInDate && state.bookCheckOutDate) ||
    date < state.bookCheckInDate
  ) {
    state.bookCheckInDate  = date;
    state.bookCheckOutDate = null;
    state.ownHoldDatesSet.clear();
    deleteActiveHold();
  } else if (state.bookCheckInDate && !state.bookCheckOutDate) {
    // Intento de definir salida
    if (!isRangeFree(state.bookCheckInDate, date)) {
      state.bookCheckInDate  = null;
      state.bookCheckOutDate = null;
      state.ownHoldDatesSet.clear();
      deleteActiveHold();
      updateReservationDates();
      renderCalendar();
      alert('⚠️ No puedes reservar este rango.');
      return;
    }

    state.bookCheckOutDate = date;

    createOrRefreshHold().catch(err => {
      console.error('Error creando hold:', err);
      state.bookCheckOutDate = null;
      state.ownHoldDatesSet.clear();
      renderCalendar();
    });
  }

  updateReservationDates();
  renderCalendar();
}

// =====================
// Holds
// =====================

async function createOrRefreshHold() {
  if (!state.bookCheckInDate || !state.bookCheckOutDate) return;

  if (!isRangeFree(state.bookCheckInDate, state.bookCheckOutDate)) {
    alert('⚠️ El rango ya no está disponible.');
    state.bookCheckOutDate = null;
    state.ownHoldDatesSet.clear();
    renderCalendar();
    return;
  }

  await deleteActiveHold();
  await new Promise(r => setTimeout(r, 100));

  const start        = normalizeDate(state.bookCheckInDate);
  const endExclusive = normalizeDate(state.bookCheckOutDate); // checkout no se ocupa
  const expiresAt    = firebase.firestore.Timestamp.fromDate(
    new Date(Date.now() + HOLD_MINUTES * 60000)
  );

  const days = daysBetweenExclusiveEnd(start, endExclusive);
  state.ownHoldDatesSet = new Set(days);

  if (!state.currentUser || !state.currentUser.uid) {
    console.error('No hay usuario autenticado para crear hold');
    return;
  }

  const holdId =
    state.activeHoldId ||
    `${state.currentUser.uid}_${toISO(start)}_${toISO(endExclusive)}`;

  const holdDoc = {
    propertyId: PROPERTY_ID,
    startISO: toISO(start),
    endExclusiveISO: toISO(endExclusive),
    startES: start.toLocaleDateString('es-ES'),
    endExclusiveES: endExclusive.toLocaleDateString('es-ES'),
    createdAt: firebase.firestore.Timestamp.now(),
    expiresAt,
    userId: state.currentUser.uid
  };

  const ref = db.collection('holds').doc(holdId);
  await ref.set(holdDoc, { merge: true });
  state.activeHoldId = ref.id;
}

export async function deleteActiveHold() {
  try {
    if (state.activeHoldId) {
      await db.collection('holds').doc(state.activeHoldId).delete().catch(() => {});
    }
  } finally {
    state.activeHoldId = null;
    state.ownHoldDatesSet.clear();
  }
}

// =====================
// Construir sets + realtime
// =====================

function buildSetsAndRender(reservasSnap, holdsSnap) {
  // ---------- RESERVAS ----------
  if (reservasSnap) {
    const reserved  = new Set(); // noches realmente ocupadas
    const checkIns  = new Set(); // fechas que son check-in
    const checkOuts = new Set(); // fechas que son check-out

    reservasSnap.forEach(doc => {
      const b = doc.data();
      if (!b.checkIn || !b.checkOut) return;

      const ci = parseEsDate(b.checkIn);
      const co = parseEsDate(b.checkOut);
      if (!ci || !co) return;

      checkIns.add(toISO(ci));
      checkOuts.add(toISO(co));

      // noches ocupadas: desde check-in incluido hasta día anterior a check-out
      const days = daysBetweenExclusiveEnd(ci, co);
      days.forEach(iso => reserved.add(iso));
    });

    state.reservedDatesSet   = reserved;
    state.checkInDatesSet    = checkIns;
    state.checkOutDatesSet   = checkOuts;
  }

  // ---------- HOLDS ----------
  if (holdsSnap) {
    const tmpH = new Set();
    const now  = new Date();

    holdsSnap.forEach(doc => {
      const h = doc.data();
      let start        = null;
      let endExclusive = null;

      if (h.startES && h.endExclusiveES) {
        start        = parseEsDate(h.startES);
        endExclusive = parseEsDate(h.endExclusiveES);
      } else if (h.startISO && h.endExclusiveISO) {
        start        = parseISODateLocal(h.startISO);
        endExclusive = parseISODateLocal(h.endExclusiveISO);
      }

      let expireTime = null;
      if (h.expiresAt && typeof h.expiresAt.toDate === 'function') {
        expireTime = h.expiresAt.toDate();
      } else if (h.expiresAt instanceof Date) {
        expireTime = h.expiresAt;
      } else if (typeof h.expiresAt === 'string') {
        const p = new Date(h.expiresAt);
        if (!isNaN(p)) expireTime = p;
      }

      if (!start || !endExclusive || !expireTime) return;
      if (expireTime <= now) {
        doc.ref.delete().catch(() => {});
        return;
      }

      const days = daysBetweenExclusiveEnd(start, endExclusive);
      days.forEach(iso => tmpH.add(iso));
    });

    state.holdDatesSet = tmpH;
  }

  renderCalendar();
}

export function setUpRealtimeAvailability() {
  if (state.reservasUnsub) state.reservasUnsub();
  if (state.holdsUnsub) state.holdsUnsub();

  state.reservasUnsub = db
    .collection('reservas')
    .where('propertyId', '==', PROPERTY_ID)
    .onSnapshot(
      snap => buildSetsAndRender(snap, null),
      err => console.error('Error reservas listener:', err)
    );

  state.holdsUnsub = db
    .collection('holds')
    .where('propertyId', '==', PROPERTY_ID)
    .onSnapshot(
      snap => buildSetsAndRender(null, snap),
      err => console.error('Error holds listener:', err)
    );
}

// =====================
// Actualizar inputs / resumen
// =====================

export function updateReservationDates() {
  const ciInput    = document.getElementById('bookCheckIn');
  const coInput    = document.getElementById('bookCheckOut');
  const ciDisplay  = document.getElementById('bookCheckInDisplay');
  const coDisplay  = document.getElementById('bookCheckOutDisplay');
  const summaryCi  = document.getElementById('summaryCheckIn');
  const summaryCo  = document.getElementById('summaryCheckOut');
  const nightsEl   = document.getElementById('nightsCount');

  if (state.bookCheckInDate) {
    const ciES  = state.bookCheckInDate.toLocaleDateString('es-ES');
    const ciISO = toISO(state.bookCheckInDate);
    if (ciDisplay) ciDisplay.value = ciES;
    if (ciInput)   ciInput.value   = ciISO;
    if (summaryCi) summaryCi.innerText = ciES;
  } else {
    if (ciDisplay) ciDisplay.value    = '';
    if (ciInput)   ciInput.value      = '';
    if (summaryCi) summaryCi.innerText = '-';
  }

  if (state.bookCheckOutDate) {
    const coES  = state.bookCheckOutDate.toLocaleDateString('es-ES');
    const coISO = toISO(state.bookCheckOutDate);
    if (coDisplay) coDisplay.value = coES;
    if (coInput)   coInput.value   = coISO;
    if (summaryCo) summaryCo.innerText = coES;
  } else {
    if (coDisplay) coDisplay.value    = '';
    if (coInput)   coInput.value      = '';
    if (summaryCo) summaryCo.innerText = '-';
  }

  if (state.bookCheckInDate && state.bookCheckOutDate) {
    const nights =
      (normalizeDate(state.bookCheckOutDate) - normalizeDate(state.bookCheckInDate)) /
      MS_PER_DAY;
    if (nightsEl) nightsEl.innerText = nights;
  } else {
    if (nightsEl) nightsEl.innerText = '-';
  }
}

// =====================
// Validación step 1 -> 2
// =====================

export function validateAndGoToStep2() {
  if (!state.bookCheckInDate || !state.bookCheckOutDate) {
    alert('⚠️ Selecciona ambas fechas en el calendario');
    return false;
  }

  const adultsSelect = document.getElementById('bookAdults');
  const adults       = adultsSelect ? adultsSelect.value : '';
  if (!adults) {
    alert('⚠️ Selecciona el número de adultos');
    return false;
  }

  if (!isRangeFree(state.bookCheckInDate, state.bookCheckOutDate, true)) {
    alert('❌ El rango ya NO está disponible.\nOtra persona lo reservó mientras seleccionabas.');
    state.bookCheckInDate  = null;
    state.bookCheckOutDate = null;
    state.ownHoldDatesSet.clear();
    deleteActiveHold();
    updateReservationDates();
    renderCalendar();
    return false;
  }
  return true;
}

// =====================
// Limpieza holds expirados al cargar
// =====================

export async function cleanupExpiredHoldsOnLoad() {
  try {
    const snap = await db
      .collection('holds')
      .where('propertyId', '==', PROPERTY_ID)
      .get();

    const now   = new Date();
    const batch = db.batch();

    snap.forEach(doc => {
      const h = doc.data();
      let expireTime = null;

      if (h.expiresAt && typeof h.expiresAt.toDate === 'function') {
        expireTime = h.expiresAt.toDate();
      } else if (h.expiresAt instanceof Date) {
        expireTime = h.expiresAt;
      } else if (typeof h.expiresAt === 'string') {
        const parsed = new Date(h.expiresAt);
        if (!isNaN(parsed.getTime())) expireTime = parsed;
      }

      if (!expireTime || expireTime <= now) {
        batch.delete(doc.ref);
      }
    });

    await batch.commit();
  } catch (err) {
    console.error('Error limpiando holds:', err);
  }
}
