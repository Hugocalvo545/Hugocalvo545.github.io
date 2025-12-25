// registro/user-area.js
import { auth, db, serverTimestamp, increment } from './firebase.js';

/* ========== Tabs de usuario (Mis datos / Mis reservas y chat) ========== */

function initUserTabs() {
  const tabButtons = document.querySelectorAll('.user-tab');
  const tabContents = document.querySelectorAll('.user-tab-content');

  if (!tabButtons.length || !tabContents.length) return;

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-user-tab');

      tabButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      tabContents.forEach((section) => {
        const id = section.id.replace('userTab-', '');
        section.classList.toggle('active', id === target);
      });
    });
  });
}

/* ===== Constante de imágenes por apartamento (ajústala a tus IDs reales) ===== */

const PROPERTY_IMAGES = {
  'atico-jerez':
    'https://l.icdbcdn.com/oh82997477-4b45-4cbe-a6c4-3db4f9f5e2a3.jpg?w=600',
  // Añade aquí más ids => url
  // 'otro-apto-id': 'https://tuimagen.com/loquesea.jpg'
};

function getPropertyImage(propertyId) {
  if (!propertyId) return 'https://via.placeholder.com/600x400?text=Alojamiento';
  return (
    PROPERTY_IMAGES[propertyId] ||
    'https://via.placeholder.com/600x400?text=Alojamiento'
  );
}

/* ========== Mis reservas + chat (pestaña 2) ========== */

const reservasBody     = document.getElementById('userReservasBody');
const reservasInfo     = document.getElementById('userReservasInfo');
const reservaDetailBox = document.getElementById('userReservaDetail');
const chatSection      = document.getElementById('userChatSection');
const chatMessagesBox  = document.getElementById('userChatMessages');
const chatForm         = document.getElementById('userChatForm');
const chatInput        = document.getElementById('userChatInput');

let unreadUnsubscribe  = null;
let unreadMap = new Map();
let reservasCache       = [];
let reservasUnsubscribe = null;
let currentReservaId    = null;
let chatUnsubscribe     = null;

// Escuchar reservas del usuario logueado
function initUserReservationsListener(uid) {
  if (!reservasBody) return;

  if (reservasUnsubscribe) reservasUnsubscribe();

  reservasBody.innerHTML = '<tr><td colspan="4">Cargando reservas...</td></tr>';
  reservasInfo.textContent = '';

  reservasUnsubscribe = db
    .collection('reservas')
    .where('userId', '==', uid)
    .orderBy('createdAt', 'desc')
    .onSnapshot(
      (snapshot) => {
        reservasCache = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        renderUserReservasTable();
      },
      (err) => {
        console.error('Error cargando reservas del usuario', err);
        reservasBody.innerHTML = '<tr><td colspan="4">Error al cargar reservas.</td></tr>';
      }
    );
}

function initUserUnreadListener(uid) {
  if (unreadUnsubscribe) unreadUnsubscribe();

  unreadUnsubscribe = db
    .collection('chats')
    .where('guestId', '==', uid)
    .where('unreadGuest', '>', 0)
    .onSnapshot(
      (snap) => {
        unreadMap = new Map();
        let total = 0;

        snap.docs.forEach((d) => {
          const data = d.data() || {};
          const n = Number(data.unreadGuest || 0);
          if (n > 0) {
            unreadMap.set(d.id, n); // d.id = reservaId (docId)
            total += n;
          }
        });

        // Badge global (tipo Booking)
        const badge = document.getElementById('userMsgBadge');
        if (badge) {
          badge.textContent = total > 9 ? '9+' : String(total);
          badge.style.display = total ? 'inline-flex' : 'none';
        }

        // Repinta tabla con puntos rojos si ya está renderizada
        paintUnreadMarksInTable();
      },
      (err) => console.error('Error listener unreadGuest', err)
    );
}

function paintUnreadMarksInTable() {
  document.querySelectorAll('.user-reserva-row').forEach((row) => {
    const id = row.getAttribute('data-reserva-id');
    const hasUnread = unreadMap.has(id);
    row.classList.toggle('has-unread', hasUnread);

    // Si quieres mostrar numerito dentro de la tabla (opcional)
    // podríamos meterlo en una celda extra, pero con el punto rojo ya queda Booking total.
  });
}

function renderUserReservasTable() {
  if (!reservasCache.length) {
    reservasBody.innerHTML = '<tr><td colspan="4">Todavía no tienes reservas.</td></tr>';
    reservasInfo.textContent = '';
    reservaDetailBox.textContent =
      'Cuando tengas reservas, podrás ver aquí el detalle y chatear con el alojamiento.';
    chatSection.style.display = 'none';
    return;
  }

  reservasInfo.textContent = `Tienes ${reservasCache.length} reserva(s).`;

  reservasBody.innerHTML = reservasCache
    .map((r) => {
      const fecha = r.createdAt && r.createdAt.toDate
        ? r.createdAt.toDate().toLocaleDateString()
        : '';

      const propName = r.propertyName || r.propertyId || '';
      const checkIn  = r.checkIn  || '';
      const checkOut = r.checkOut || '';

      return `
        <tr class="user-reserva-row" data-reserva-id="${r.id}">
          <td>${fecha}</td>
          <td>${propName}</td>
          <td>${checkIn}</td>
          <td>${checkOut}</td>
        </tr>
      `;
    })
    .join('');

  reservasBody.querySelectorAll('.user-reserva-row').forEach((row) => {
    row.addEventListener('click', () => {
        const id = row.getAttribute('data-reserva-id');
        const reserva = reservasCache.find((r) => r.id === id);
        if (reserva) {
        seleccionarReservaUsuario(reserva);

        // marcar visualmente la fila seleccionada
        document.querySelectorAll('.user-reserva-row').forEach((rRow) => {
            rRow.classList.toggle(
            'selected',
            rRow.getAttribute('data-reserva-id') === id
            );
        });
        }
    });
  });

  paintUnreadMarksInTable();

}

function seleccionarReservaUsuario(r) {
  currentReservaId = r.id;

  const propName = r.propertyName || r.propertyId || '';
  const propImage = getPropertyImage(r.propertyId);

  const checkIn  = r.checkIn  || '';
  const checkOut = r.checkOut || '';
  const noches   = r.nights   ?? r.noches ?? '';
  const total    = r.totalPrice
    ? `${r.totalPrice} €`
    : r.totalPrice === 0
    ? '0 €'
    : '-';

  const nombre   = r.name || r.nombre || '';
  const apell    = r.surname || '';
  const email    = r.email || '';
  const phone    = r.phone || '';

  reservaDetailBox.innerHTML = `
  <div class="reserva-apto-card">
    <img src="${propImage}" alt="${propName}">
    <div>
      <h4>${propName || 'Alojamiento'}</h4>
      <small>ID: ${r.propertyId || '-'}</small>
    </div>
  </div>

  <div class="reserva-chips">
    <span class="reserva-chip">Entrada: ${checkIn || '-'}</span>
    <span class="reserva-chip">Salida: ${checkOut || '-'}</span>
    <span class="reserva-chip">Noches: ${noches || '-'}</span>
    <span class="reserva-chip">Total: ${total}</span>
  </div>

  <p><strong>Reserva:</strong> ${r.reservaId || r.id}</p>
  <p><strong>Nombre:</strong> ${(nombre + ' ' + apell).trim() || '—'}</p>
  <p><strong>Email de contacto:</strong> ${email || '—'}</p>
  <p><strong>Teléfono:</strong> ${phone || '—'}</p>
  ${
    r.observations
      ? `<p><strong>Observaciones:</strong> ${r.observations}</p>`
      : ''
  }
  <div style="margin-top:0.4rem;">
    <button type="button" class="btn-primary btn-sm" onclick="window.scrollTo({top: document.body.scrollHeight, behavior:'smooth'});">
      Ir al chat de esta reserva
    </button>
  </div>
`;

  chatSection.style.display = 'block';
  abrirChatUsuario(currentReservaId);
}

function abrirChatUsuario(reservaId) {

    // Marcar como leído para el cliente
  db.collection('chats').doc(reservaId).set(
    { unreadGuest: 0 },
    { merge: true }
  ).catch((e) => console.warn('No se pudo marcar chat como leído', e));
  
  if (!chatMessagesBox) return;

  chatMessagesBox.innerHTML = '<p class="muted">Cargando chat...</p>';

  if (chatUnsubscribe) chatUnsubscribe();

  chatUnsubscribe = db
    .collection('chats')
    .doc(reservaId)
    .collection('mensajes')
    .orderBy('createdAt', 'asc')
    .onSnapshot(
      (snapshot) => {
        if (snapshot.empty) {
          chatMessagesBox.innerHTML =
            '<p class="muted">Todavía no hay mensajes. Escribe el primero si quieres contactar con el alojamiento.</p>';
          return;
        }

        const html = snapshot.docs
          .map((doc) => {
            const m = doc.data();
            const sender = m.sender || 'guest'; // 'guest' o 'host'
            const text   = m.text || '';
            const date   = m.createdAt && m.createdAt.toDate
              ? m.createdAt.toDate().toLocaleString()
              : '';

            return `
              <div class="chat-bubble ${sender === 'guest' ? 'guest' : 'host'}">
                <div>${text}</div>
                <div class="chat-meta">
                  ${sender === 'guest' ? 'Tú' : 'Alojamiento'} · ${date}
                </div>
              </div>
            `;
          })
          .join('');

        chatMessagesBox.innerHTML = html;
        chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight;
      },
      (err) => {
        console.error('Error en chat usuario', err);
        chatMessagesBox.innerHTML =
          '<p class="muted">Error al cargar los mensajes.</p>';
      }
    );
}

// Envío de mensajes (cliente)
if (chatForm) {
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text || !currentReservaId) return;

    try {
      const user = auth.currentUser;
      if (!user) return;

      const chatRef = db.collection('chats').doc(currentReservaId);
      const msgRef  = chatRef.collection('mensajes').doc();

      const batch = db.batch();

      batch.set(msgRef, {
        text,
        sender: 'guest',
        createdAt: new Date()
      });

      // Metadata para notificaciones (tipo Booking)
      batch.set(chatRef, {
        reservaId: currentReservaId,
        guestId: user.uid,
        lastMessage: text,
        lastSender: 'guest',
        lastAt: new Date(),
        // Este mensaje queda pendiente para el propietario
        unreadHost: (window.firebase?.firestore?.FieldValue)
          ? window.firebase.firestore.FieldValue.increment(1)
          : 1
      }, { merge: true });

      await batch.commit();

      chatInput.value = '';
    } catch (err) {
      console.error('Error enviando mensaje (usuario)', err);
    }
  });
}


// Inicio: tabs + listener de reservas cuando el usuario esté logueado
document.addEventListener('DOMContentLoaded', () => {
  initUserTabs();

    auth.onAuthStateChanged((user) => {
      if (user) {
        initUserReservationsListener(user.uid);
        initUserUnreadListener(user.uid);
      }
    });
});