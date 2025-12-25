// intranet/app.js
import { auth, db } from '../registro/firebase.js';
import { fetchProperties, saveProperty, deleteProperty } from './properties-service.js';

// Vistas
const loginView       = document.getElementById('loginView');
const noAccessView    = document.getElementById('noAccessView');
const mainView        = document.getElementById('mainView');

const loginForm       = document.getElementById('loginForm');
const loginEmail      = document.getElementById('loginEmail');
const loginPassword   = document.getElementById('loginPassword');
const loginError      = document.getElementById('loginError');

const userEmailSpan   = document.getElementById('userEmail');
const logoutBtn       = document.getElementById('logoutBtn');
const noAccessLogoutBtn = document.getElementById('noAccessLogoutBtn');

// Tabs
const tabButtons = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

// Alojamientos
const propertiesBody   = document.getElementById('propertiesBody');
const newPropertyBtn   = document.getElementById('newPropertyBtn');
const propertyForm     = document.getElementById('propertyForm');
const formTitle        = document.getElementById('formTitle');
const resetFormBtn     = document.getElementById('resetFormBtn');
const formMessage      = document.getElementById('formMessage');

// Packs
const packsBody          = document.getElementById('packsBody');
const newPackBtn         = document.getElementById('newPackBtn');
const packForm           = document.getElementById('packForm');
const packFormTitle      = document.getElementById('packFormTitle');
const resetPackFormBtn   = document.getElementById('resetPackFormBtn');
const packFormMessage    = document.getElementById('packFormMessage');

const packIdInput        = document.getElementById('packId');
const packNombreInput    = document.getElementById('packNombre');
const packGroupKeyInput  = document.getElementById('packGroupKey');
const packDescripcionInput      = document.getElementById('packDescripcion');
const packDescripcionLargaInput = document.getElementById('packDescripcionLarga');
const packCapacidadInput = document.getElementById('packCapacidad');
const packPrecioBaseInput = document.getElementById('packPrecioBase');
const packActivaInput    = document.getElementById('packActiva');
const packServiciosInput = document.getElementById('packServicios');


// ===== RESERVAS + CHAT =====
const reservasBody     = document.getElementById('reservasBody');
const reservasBadge    = document.getElementById('reservasBadge');
const reservaDetailBox = document.getElementById('reservaDetail');
const chatMessagesBox  = document.getElementById('chatMessages');
const chatForm         = document.getElementById('chatForm');
const chatInput        = document.getElementById('chatInput');

let reservasCache = [];
let reservasUnsubscribe = null;

let currentChatReservaId = null;
let chatUnsubscribe = null;

let firstReservasSnapshot = true;

// Campos form
const propertyIdInput      = document.getElementById('propertyId');
const nombreInput          = document.getElementById('nombre');
const direccionInput       = document.getElementById('direccion');
const ciudadInput          = document.getElementById('ciudad');
const capacidadInput       = document.getElementById('capacidad');
const dormitoriosInput     = document.getElementById('dormitorios');
const banosInput           = document.getElementById('banos');
const descripcionInput     = document.getElementById('descripcion');
const descripcionLargaInput = document.getElementById('descripcionLarga');
const precioBaseInput      = document.getElementById('precioBase');
const activaInput          = document.getElementById('activa');
const serviciosInput       = document.getElementById('servicios');

// Estado
let propertiesCache = [];
let packsCache = [];
let currentUser = null;
let isAdmin = false;

/* -------- Tabs -------- */

tabButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;

    tabButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    tabContents.forEach((c) => {
      c.classList.toggle('active', c.id === `tab-${tab}`);
    });
  });
});

/* -------- Auth + roles -------- */

auth.onAuthStateChanged(async (user) => {
  currentUser = user;

  if (!user) {
    isAdmin = false;
    showView('login');
    return;
  }

  userEmailSpan.textContent = user.email || '';

  // MISMO criterio que en las reglas isAdmin()
  const adminEmails = [
    "hugocalvogarcia123@gmail.com"
    // , "otroadmin@loquesea.com"
  ];

  isAdmin = adminEmails.includes(user.email);

  if (isAdmin) {
    showView('main');
    await loadProperties();
    await loadPacks();
    initReservasListener();
    // registerServiceWorkerAndNotifications();
  } else {
    showView('noAccess');
  }
});

function showView(view) {
  loginView.style.display    = view === 'login' ? 'flex' : 'none';
  noAccessView.style.display = view === 'noAccess' ? 'flex' : 'none';
  mainView.style.display     = view === 'main' ? 'block' : 'none';

  logoutBtn.style.display        = currentUser ? 'inline-flex' : 'none';
  userEmailSpan.textContent      = currentUser?.email || '';
}

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';

    const email = loginEmail.value.trim();
    const pass  = loginPassword.value.trim();

    try {
      await auth.signInWithEmailAndPassword(email, pass);
      // onAuthStateChanged se encarga del resto
    } catch (err) {
      console.error(err);
      loginError.textContent = 'Error al iniciar sesión. Revisa email y contraseña.';
    }
  });
}

logoutBtn?.addEventListener('click', async () => {
  await auth.signOut();
});

noAccessLogoutBtn?.addEventListener('click', async () => {
  await auth.signOut();
});

/* -------- CRUD Alojamientos -------- */

async function loadProperties() {
  try {
    propertiesCache = await fetchProperties();
    renderPropertiesTable();
  } catch (err) {
    console.error(err);
  }
}

function renderPropertiesTable() {
  if (!propertiesCache.length) {
    propertiesBody.innerHTML = '<tr><td colspan="7">No hay alojamientos todavía.</td></tr>';
    return;
  }

  propertiesBody.innerHTML = propertiesCache
    .map((p) => {
      const precio = typeof p.precioBase === 'number' ? `${p.precioBase.toFixed(0)} €` : '-';
      return `
        <tr>
          <td>${p.orden ?? ''}</td>
          <td>${p.nombre ?? ''}</td>
          <td>${p.ciudad ?? ''}</td>
          <td>${p.capacidad ?? ''}</td>
          <td>${precio}</td>
          <td>${p.activa ? 'Sí' : 'No'}</td>
          <td><button class="btn-secondary" data-edit-id="${p.id}">Editar</button></td>
        </tr>
      `;
    })
    .join('');

  propertiesBody.querySelectorAll('[data-edit-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-edit-id');
      const prop = propertiesCache.find((p) => p.id === id);
      if (prop) fillFormWithProperty(prop);
    });
  });
}

function fillFormWithProperty(prop) {
  formTitle.textContent = 'Editar alojamiento';
  formMessage.textContent = '';

  propertyIdInput.value        = prop.id;
  nombreInput.value            = prop.nombre ?? '';
  direccionInput.value         = prop.direccion ?? '';
  ciudadInput.value            = prop.ciudad ?? '';
  capacidadInput.value         = prop.capacidad ?? '';
  dormitoriosInput.value       = prop.dormitorios ?? '';
  banosInput.value             = prop.banos ?? '';
  descripcionInput.value       = prop.descripcion ?? '';
  descripcionLargaInput.value  = prop.descripcionLarga ?? '';
  precioBaseInput.value        = prop.precioBase ?? '';
  activaInput.checked          = !!prop.activa;

  serviciosInput.value = Array.isArray(prop.servicios)
    ? prop.servicios.join(', ')
    : '';
}

function resetForm() {
  formTitle.textContent = 'Nuevo alojamiento';
  propertyIdInput.value = '';
  propertyForm.reset();
  formMessage.textContent = '';
}

newPropertyBtn?.addEventListener('click', resetForm);
resetFormBtn?.addEventListener('click', resetForm);

propertyForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  formMessage.textContent = '';

  if (!isAdmin) {
    formMessage.textContent = 'No tienes permisos para guardar.';
    return;
  }

  const id = propertyIdInput.value.trim();

  const nombre           = nombreInput.value.trim();
  const direccion        = direccionInput.value.trim();
  const ciudad           = ciudadInput.value.trim();
  const capacidad        = capacidadInput.value ? Number(capacidadInput.value) : null;
  const dormitorios      = dormitoriosInput.value ? Number(dormitoriosInput.value) : null;
  const banos            = banosInput.value ? Number(banosInput.value) : null;
  const descripcion      = descripcionInput.value.trim();
  const descripcionLarga = descripcionLargaInput.value.trim();
  const precioBase       = precioBaseInput.value ? Number(precioBaseInput.value) : null;
  const activa           = activaInput.checked;

  const serviciosStr = serviciosInput.value.trim();
  const servicios = serviciosStr
    ? serviciosStr.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  if (!nombre) {
    formMessage.textContent = 'El nombre es obligatorio.';
    return;
  }

  let orden;
  if (id) {
    const existing = propertiesCache.find((p) => p.id === id);
    orden = existing?.orden ?? null;
  } else {
    const ordenes = propertiesCache
      .map((p) => (typeof p.orden === 'number' ? p.orden : 0));
    const maxOrden = ordenes.length ? Math.max(...ordenes) : 0;
    orden = maxOrden + 1;
  }

  const dataToSave = {
    nombre,
    direccion,
    ciudad,
    capacidad,
    dormitorios,
    banos,
    descripcion,
    descripcionLarga,
    precioBase,
    activa,
    servicios,
    orden,
  };

  try {
    let docRef;
    if (id) {
      docRef = db.collection('apartamentos').doc(id);
      await docRef.set(dataToSave, { merge: true });
    } else {
      docRef = db.collection('apartamentos').doc();
      await docRef.set(dataToSave);
    }

    formMessage.textContent = 'Guardado correctamente.';
    await loadProperties();
    if (!id) propertyIdInput.value = docRef.id;
  } catch (err) {
    console.error(err);
    formMessage.textContent = 'Error al guardar.';
  }
});

/* -------- CRUD Packs -------- */

async function loadPacks() {
  if (!packsBody) return;
  packsBody.innerHTML = '<tr><td colspan="7">Cargando...</td></tr>';

  try {
    const snap = await db.collection('packs').orderBy('orden', 'asc').get();
    packsCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderPacksTable();
  } catch (err) {
    console.error(err);
    packsBody.innerHTML = '<tr><td colspan="7">Error al cargar.</td></tr>';
  }
}

function renderPacksTable() {
  if (!packsCache.length) {
    packsBody.innerHTML = '<tr><td colspan="7">No hay packs todavía.</td></tr>';
    return;
  }

  packsBody.innerHTML = packsCache
    .map(p => {
      const precio = typeof p.precioBase === 'number' ? `${p.precioBase.toFixed(0)} €` : '-';
      return `
        <tr>
          <td>${p.orden ?? ''}</td>
          <td>${p.nombre ?? ''}</td>
          <td>${p.groupKey ?? ''}</td>
          <td>${p.capacidadTotal ?? ''}</td>
          <td>${precio}</td>
          <td>${p.activa ? 'Sí' : 'No'}</td>
          <td><button class="btn-secondary" data-pack-edit-id="${p.id}">Editar</button></td>
        </tr>
      `;
    })
    .join('');

  packsBody.querySelectorAll('[data-pack-edit-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-pack-edit-id');
      const pack = packsCache.find(p => p.id === id);
      if (pack) fillPackForm(pack);
    });
  });
}

function fillPackForm(pack) {
  packFormTitle.textContent = 'Editar pack';
  packFormMessage.textContent = '';

  packIdInput.value                = pack.id;
  packNombreInput.value            = pack.nombre ?? '';
  packGroupKeyInput.value          = pack.groupKey ?? '';
  packDescripcionInput.value       = pack.descripcion ?? '';
  packDescripcionLargaInput.value  = pack.descripcionLarga ?? '';
  packCapacidadInput.value         = pack.capacidadTotal ?? '';
  packPrecioBaseInput.value        = pack.precioBase ?? '';
  packActivaInput.checked          = !!pack.activa;

  packServiciosInput.value = Array.isArray(pack.servicios)
    ? pack.servicios.join(', ')
    : '';
}

function resetPackForm() {
  packFormTitle.textContent = 'Nuevo pack';
  packIdInput.value = '';
  packForm?.reset();
  packFormMessage.textContent = '';
}

newPackBtn?.addEventListener('click', resetPackForm);
resetPackFormBtn?.addEventListener('click', resetPackForm);

packForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  packFormMessage.textContent = '';

  if (!isAdmin) {
    packFormMessage.textContent = 'No tienes permisos para guardar.';
    return;
  }

  const id = packIdInput.value.trim();

  const nombre      = packNombreInput.value.trim();
  const groupKey    = packGroupKeyInput.value.trim();
  const descripcion = packDescripcionInput.value.trim();
  const descripcionLarga = packDescripcionLargaInput.value.trim();
  const capacidadTotal   = packCapacidadInput.value ? Number(packCapacidadInput.value) : null;
  const precioBase = packPrecioBaseInput.value ? Number(packPrecioBaseInput.value) : null;
  const activa     = packActivaInput.checked;

  const serviciosStr = packServiciosInput.value.trim();
  const servicios = serviciosStr
    ? serviciosStr.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  if (!nombre) {
    packFormMessage.textContent = 'El nombre es obligatorio.';
    return;
  }

  let orden;
  if (id) {
    const existing = packsCache.find(p => p.id === id);
    orden = existing?.orden ?? null;
  } else {
    const ordenes = packsCache.map(p => (typeof p.orden === 'number' ? p.orden : 0));
    const maxOrden = ordenes.length ? Math.max(...ordenes) : 0;
    orden = maxOrden + 1;
  }

  const dataToSave = {
    nombre,
    groupKey,
    descripcion,
    descripcionLarga,
    capacidadTotal,
    precioBase,
    activa,
    servicios,
    orden,
  };

  try {
    let docRef;
    if (id) {
      docRef = db.collection('packs').doc(id);
      await docRef.set(dataToSave, { merge: true });
    } else {
      docRef = db.collection('packs').doc();
      await docRef.set(dataToSave);
    }

    packFormMessage.textContent = 'Guardado correctamente.';
    await loadPacks();
    if (!id) packIdInput.value = docRef.id;
  } catch (err) {
    console.error(err);
    packFormMessage.textContent = 'Error al guardar.';
  }
});

/* =========================
   RESERVAS (LISTADO + AVISO)
   ========================= */

function initReservasListener() {
  if (!reservasBody) return;

  // Cerrar listener anterior si existía
  if (reservasUnsubscribe) {
    reservasUnsubscribe();
  }

  reservasBody.innerHTML = '<tr><td colspan="6">Cargando reservas...</td></tr>';
  firstReservasSnapshot = true;

  reservasUnsubscribe = db
    .collection('reservas')
    .orderBy('createdAt', 'desc')
    .limit(100)
    .onSnapshot(
      (snapshot) => {
        reservasCache = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        renderReservasTable(snapshot);
      },
      (err) => {
        console.error('Error cargando reservas', err);
        reservasBody.innerHTML = '<tr><td colspan="6">Error al cargar reservas.</td></tr>';
      }
    );
}

function renderReservasTable(snapshot) {
  if (!reservasCache.length) {
    reservasBody.innerHTML = '<tr><td colspan="6">No hay reservas todavía.</td></tr>';
    return;
  }

  reservasBody.innerHTML = reservasCache
    .map((r) => {
      const checkIn  = r.checkIn  || '';
      const checkOut = r.checkOut || '';

      const total = r.totalPrice
        ? `${r.totalPrice} €`
        : r.totalPrice === 0
        ? '0 €'
        : '-';

      const nombre = r.name || r.nombre || '';
      const apell  = r.surname || '';
      const huesped = (nombre || apell)
        ? `${nombre} ${apell}`.trim()
        : r.email || '';

      const fechaCreacion = r.createdAt && r.createdAt.toDate
        ? r.createdAt.toDate().toLocaleString()
        : '';

      return `
        <tr class="reserva-row" data-reserva-id="${r.id}">
          <td title="${fechaCreacion}">${fechaCreacion.split(',')[0]}</td>
          <td>${r.propertyName || r.propertyId || ''}</td>
          <td>${huesped}</td>
          <td>${checkIn}</td>
          <td>${checkOut}</td>
          <td>${total}</td>
        </tr>
      `;
    })
    .join('');

  // Click en fila -> detalle + chat
    reservasBody.querySelectorAll('.reserva-row').forEach((row) => {
      row.addEventListener('click', () => {
        const id = row.getAttribute('data-reserva-id');
        const reserva = reservasCache.find((r) => r.id === id);
        if (reserva) {
          selectReserva(reserva);
        }
        hideReservasBadge(); // al entrar a reservas, quitamos aviso
      });
    });

    // Aviso de "nueva reserva" (en snapshots posteriores al primero)
    if (!firstReservasSnapshot && snapshot) {
      const hasNew = snapshot.docChanges().some(
        (change) => change.type === 'added' && !change.doc.metadata.hasPendingWrites
      );
      if (hasNew) {
        showReservasBadge();
      }
    }

    firstReservasSnapshot = false;
  }

  function showReservasBadge() {
    if (reservasBadge) reservasBadge.style.display = 'inline-block';
  }

  function hideReservasBadge() {
    if (reservasBadge) reservasBadge.style.display = 'none';
  }

  function selectReserva(r) {
  if (!reservaDetailBox) return;

  const checkIn  = r.checkIn  || '';
  const checkOut = r.checkOut || '';
  const noches   = r.nights   ?? r.noches ?? '';

  const nombre   = r.name || r.nombre || '';
  const apell    = r.surname || '';
  const email    = r.email || '';
  const phone    = r.phone || '';

  const total = r.totalPrice
    ? `${r.totalPrice} €`
    : r.totalPrice === 0
    ? '0 €'
    : '-';

  const principalGuest = Array.isArray(r.guests) && r.guests.length
    ? r.guests.find((g) => g.isPrincipal) || r.guests[0]
    : null;

  reservaDetailBox.innerHTML = `
    <p><strong>Alojamiento:</strong> ${r.propertyName || r.propertyId || ''}</p>
    <p><strong>Reserva ID:</strong> ${r.reservaId || r.id}</p>
    <p><strong>Check-in:</strong> ${checkIn}</p>
    <p><strong>Check-out:</strong> ${checkOut}</p>
    <p><strong>Noches:</strong> ${noches}</p>
    <p><strong>Total:</strong> ${total}</p>
    <hr style="margin: 0.5rem 0;" />
    <p><strong>Huésped principal:</strong> ${
      principalGuest
        ? `${principalGuest.name || ''} ${principalGuest.surname || ''}`.trim()
        : `${nombre} ${apell}`.trim()
    }</p>
    <p><strong>Email:</strong> ${principalGuest?.email || email}</p>
    <p><strong>Teléfono:</strong> ${principalGuest?.phone || phone}</p>
    <p><strong>Adultos / Niños:</strong> ${r.numAdults ?? '-'} / ${r.numChildren ?? '-'}</p>
    ${
      r.observations
        ? `<p><strong>Observaciones:</strong> ${r.observations}</p>`
        : ''
    }
  `;

  openChatForReserva(r.reservaId || r.id);
}

/* =========================
   CHAT POR RESERVA
   ========================= */

function openChatForReserva(reservaId) {
  currentChatReservaId = reservaId;

  if (!chatMessagesBox) return;

  chatMessagesBox.innerHTML = '<p class="muted">Cargando chat...</p>';

  // Cerrar listener anterior si había
  if (chatUnsubscribe) {
    chatUnsubscribe();
  }

  // Estructura: /chats/{reservaId}/mensajes/{mensajeId}
  chatUnsubscribe = db
    .collection('chats')
    .doc(reservaId)
    .collection('mensajes')
    .orderBy('createdAt', 'asc')
    .onSnapshot(
      (snapshot) => {
        if (snapshot.empty) {
          chatMessagesBox.innerHTML =
            '<p class="muted">No hay mensajes aún. Escribe el primero.</p>';
          return;
        }

        const html = snapshot.docs
          .map((doc) => {
            const m = doc.data();
            const sender = m.sender || 'guest'; // 'host' o 'guest'
            const text   = m.text || '';
            const date   = m.createdAt && m.createdAt.toDate
              ? m.createdAt.toDate().toLocaleString()
              : '';

            return `
              <div class="chat-bubble ${sender === 'host' ? 'host' : 'guest'}">
                <div>${text}</div>
                <div class="chat-meta">${sender === 'host' ? 'Tú' : 'Huésped'} · ${date}</div>
              </div>
            `;
          })
          .join('');

        chatMessagesBox.innerHTML = html;
        chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight;
      },
      (err) => {
        console.error('Error en chat', err);
        chatMessagesBox.innerHTML =
          '<p class="muted">Error al cargar el chat.</p>';
      }
    );
}

// Enviar mensaje desde intranet (host)
if (chatForm) {
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentChatReservaId) return;
    if (!isAdmin) return; // solo tú escribes desde intranet

    const text = chatInput.value.trim();
    if (!text) return;

    try {
      await db
        .collection('chats')
        .doc(currentChatReservaId)
        .collection('mensajes')
        .add({
          text,
          sender: 'host',
          createdAt: new Date(), // suficiente por ahora
        });

      chatInput.value = '';
    } catch (err) {
      console.error('Error enviando mensaje', err);
    }
  });
}



/* -------- PWA: SW + notificaciones (preparado) -------- */

async function registerServiceWorkerAndNotifications() {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('./service-worker.js');
    } catch (err) {
      console.error('Error registrando SW', err);
    }
  }

  // Notificaciones push con FCM (solo en https y en móvil/escritorio compatible)
  if (messaging && Notification && Notification.permission !== 'denied') {
    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        const token = await messaging.getToken();
        if (token && currentUser) {
          await db.collection('deviceTokens').doc(token).set({
            uid: currentUser.uid,
            email: currentUser.email || '',
            createdAt: new Date(),
          });
        }
      }
    } catch (err) {
      console.error('Error obteniendo token FCM', err);
    }
  }
}
