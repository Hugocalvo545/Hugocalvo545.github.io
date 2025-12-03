// Estado compartido entre módulos

export const state = {
  currentUser: null,
  userData: {},
  userPoints: 0,
  currentLevel: 1,
  currentDiscount: 0,

  frequentGuestToSave: null,
  currentAdultIndexToFill: null,

  autocompleteService: null,

  calendarCurrentDate: new Date(),
  bookCheckInDate: null,
  bookCheckOutDate: null,

  reservedDatesSet: new Set(),
  holdDatesSet: new Set(),
  ownHoldDatesSet: new Set(),

  checkInDatesSet: new Set(),
  checkOutDatesSet: new Set(),

  reservasUnsub: null,
  holdsUnsub: null,
  activeHoldId: null,

  bookingsHistoryCache: [],     // todas las reservas (ordenadas por proximidad)
  bookingsDisplayCache: [],     // reservas actualmente mostradas (filtradas/buscadas)
  bookingsVisible: true
};