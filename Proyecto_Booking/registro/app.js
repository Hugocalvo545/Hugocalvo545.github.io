// Punto de entrada: une todos los módulos y expone funciones globales para los onclick del HTML.

import { auth, db } from './firebase.js';
import { state } from './state.js';
import { initPlaces, setupAddressAutocomplete } from './places.js';
import {
  renderCalendar,
  previousMonth,
  nextMonth,
  selectCalendarDate,
  validateAndGoToStep2,
  setUpRealtimeAvailability,
  updateReservationDates,
  cleanupExpiredHoldsOnLoad,
  deleteActiveHold
} from './calendar.js';
import {  
  openAddGuestModal,
  closeAddGuestModal,
  openSelectFrequentGuestModal,
  closeSelectGuestModal,
  selectAndFillGuest,
  deleteFrequentGuest,
  showSaveGuestForm,
  updateGuestForms,
  loadFrequentGuests,
  setupAddGuestForm
} from './guests.js';
import {
  displayUserProfile,
  showProfileScreen as showProfileScreenFromProfile,
  getUserLevel,
  getDiscountForLevel,
  updateLevelDisplay,
  updatePointsDisplay
} from './profile.js';
import {
  calculatePrice,
  bookGoToStep,
  setupBookingForm,
  loadBookingsHistory,
  toggleBookingsVisibility,
  openBookingDetails,
  closeBookingDetails,
  filterBookings,
  openBookingDetailsFromObject,
  viewLastBookingDetails,
  changeGuests
} from './bookings.js';
import { initAuth, switchTab, regNextStep, regPrevStep } from './auth.js';
import { PRICE_PER_NIGHT } from './config.js';

// =============================
// Summary: mostrar / ocultar
// =============================

function showSummary() {
  const col = document.getElementById('summaryColumn');
  if (col) col.style.display = 'block';
}

function hideSummary() {
  const col = document.getElementById('summaryColumn');
  if (col) col.style.display = 'none';
}

// ------ Carga de datos usuario cuando hay sesión ------
async function loadUserData() {
  if (!state.currentUser) return;

  try {
    const docSnap = await db.collection('usuarios').doc(state.currentUser.uid).get();
    if (docSnap.exists) {
      state.userData = docSnap.data();
      state.userPoints = state.userData.points || 0;
      state.currentLevel = getUserLevel(state.userPoints);
      state.currentDiscount = getDiscountForLevel(state.currentLevel);
    } else {
      state.userData = { email: state.currentUser.email };
      state.userPoints = 0;
      state.currentLevel = 1;
      state.currentDiscount = 0;
    }

    displayUserProfile();
    updateLevelDisplay();
    updatePointsDisplay();
    await loadFrequentGuests();
    await loadBookingsHistory();
  } catch (err) {
    console.error('Error loadUserData:', err);
  }
}

// ------ Navegación / flujo ------

// Empieza una nueva reserva desde el perfil
function startNewBooking() {
  state.bookCheckInDate = null;
  state.bookCheckOutDate = null;
  state.ownHoldDatesSet.clear();
  state.calendarCurrentDate = new Date();

  const profile = document.getElementById('profileScreen');
  const booking = document.getElementById('bookingScreen');
  if (profile) profile.classList.remove('active');
  if (booking) booking.style.display = 'block';

  setUpRealtimeAvailability();
  updateReservationDates();
  bookGoToStep(1);
  renderCalendar();

  // Summary solo visible durante el flujo de reserva
  showSummary();
}

// Cancela el flujo de reserva y vuelve al perfil
function cancelBooking() {
  if (state.reservasUnsub) state.reservasUnsub();
  if (state.holdsUnsub) state.holdsUnsub();
  deleteActiveHold();

  state.bookCheckInDate = null;
  state.bookCheckOutDate = null;
  state.ownHoldDatesSet.clear();

  const booking = document.getElementById('bookingScreen');
  const profile = document.getElementById('profileScreen');
  if (booking) booking.style.display = 'none';
  if (profile) profile.classList.add('active');

  renderCalendar();
  hideSummary();
}

// Ir al perfil (por ejemplo desde el modal de éxito)
function goToProfile() {
  const successModal = document.getElementById('successModal');
  if (successModal) successModal.classList.remove('active');

  if (state.reservasUnsub) state.reservasUnsub();
  if (state.holdsUnsub) state.holdsUnsub();
  deleteActiveHold();

  const booking = document.getElementById('bookingScreen');
  const profile = document.getElementById('profileScreen');
  if (booking) booking.style.display = 'none';
  if (profile) profile.classList.add('active');

  hideSummary();
  loadBookingsHistory();
  loadUserData();
}

// Cerrar modal de éxito pero seguir en modo reserva (para crear otra)
function closeSuccessModal() {
  const modal = document.getElementById('successModal');
  if (modal) modal.classList.remove('active');

  const bookingForm = document.getElementById('bookingForm');
  if (bookingForm) bookingForm.reset();

  state.bookCheckInDate = null;
  state.bookCheckOutDate = null;
  state.ownHoldDatesSet.clear();

  bookGoToStep(1);
  updateReservationDates();
  renderCalendar();

  // Seguimos en flujo de reserva → summary visible
  showSummary();
}

// Logout global
function logout() {
  auth.signOut();
  if (state.reservasUnsub) state.reservasUnsub();
  if (state.holdsUnsub) state.holdsUnsub();
  deleteActiveHold();

  state.bookCheckInDate = null;
  state.bookCheckOutDate = null;
  state.ownHoldDatesSet.clear();
  state.currentUser = null;

  const login = document.getElementById('loginScreen');
  const profile = document.getElementById('profileScreen');
  const booking = document.getElementById('bookingScreen');

  if (login) login.classList.add('active');
  if (profile) profile.classList.remove('active');
  if (booking) booking.style.display = 'none';

  hideSummary();
}

async function setupPropertyContextFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const id   = params.get('id');
  const tipo = params.get('tipo') || 'apto';

  // Caso 1: sin parámetros → seguimos como antes (Ático por defecto)
  if (!id) {
    state.currentPropertyId    = 'atico-jerez';
    state.currentPropertyName  = 'Ático Dúplex en Jerez';
    state.currentPricePerNight = PRICE_PER_NIGHT;
    return;
  }

  try {
    const col  = tipo === 'pack' ? 'packs' : 'apartamentos';
    const snap = await db.collection(col).doc(id).get();

    if (snap.exists) {
      const data = snap.data();
      state.currentPropertyId    = snap.id;                        // p.ej. rendona-1
      state.currentPropertyName  = data.nombre || 'Alojamiento';
      state.currentPricePerNight =
        typeof data.precioBase === 'number' ? data.precioBase : PRICE_PER_NIGHT;
    } else {
      // fallback si no encontramos doc
      state.currentPropertyId    = id;
      state.currentPropertyName  = 'Alojamiento';
      state.currentPricePerNight = PRICE_PER_NIGHT;
    }
  } catch (err) {
    console.error('Error cargando alojamiento desde URL:', err);
    state.currentPropertyId    = id || 'atico-jerez';
    state.currentPropertyName  = 'Alojamiento';
    state.currentPricePerNight = PRICE_PER_NIGHT;
  }
}

// ------ DOM READY ------
document.addEventListener('DOMContentLoaded', async () => {
  // Summary oculto al cargar
  hideSummary();

  await setupPropertyContextFromUrl();

  initPlaces();
  setupAddressAutocomplete();
  setupAddGuestForm();
  setupBookingForm();
  await cleanupExpiredHoldsOnLoad();
  renderCalendar();

  // initAuth se encarga de escuchar onAuthStateChanged.
  // Cuando hay usuario, cargamos datos y mostramos perfil.
  initAuth(async () => {
    await loadUserData();
    showProfileScreenFromProfile(); // función de profile.js que activa la pantalla de perfil
    hideSummary(); // en perfil no mostramos summary
  });
});

// ------ Exponer funciones globales para onclick del HTML ------
window.switchTab = switchTab;
window.regNextStep = regNextStep;
window.regPrevStep = regPrevStep;

window.previousMonth = previousMonth;
window.nextMonth = nextMonth;
window.selectCalendarDate = selectCalendarDate;
window.validateAndGoToStep2 = () => {
  if (validateAndGoToStep2()) {
    bookGoToStep(2);
  }
};

window.openAddGuestModal = openAddGuestModal;
window.closeAddGuestModal = closeAddGuestModal;
window.openSelectFrequentGuestModal = openSelectFrequentGuestModal;
window.closeSelectGuestModal = closeSelectGuestModal;
window.selectAndFillGuest = selectAndFillGuest;
window.deleteFrequentGuest = deleteFrequentGuest;
window.showSaveGuestForm = showSaveGuestForm;

window.updateGuestForms = updateGuestForms;
window.calculatePrice = calculatePrice;

window.bookGoToStep = bookGoToStep;
window.loadBookingsHistory = loadBookingsHistory;
window.toggleBookingsVisibility = toggleBookingsVisibility;
window.openBookingDetails = openBookingDetails;
window.openBookingDetailsFromObject = openBookingDetailsFromObject;
window.viewLastBookingDetails = viewLastBookingDetails;
window.closeBookingDetails = closeBookingDetails;
window.filterBookings = filterBookings;
window.changeGuests = changeGuests;

window.startNewBooking = startNewBooking;
window.cancelBooking = cancelBooking;
window.goToProfile = goToProfile;
window.closeSuccessModal = closeSuccessModal;
window.logout = logout;
