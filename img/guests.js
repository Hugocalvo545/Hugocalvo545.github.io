import { db } from './firebase.js';
import { state } from './state.js';

export function openAddGuestModal() {
  document.getElementById('addGuestModal')?.classList.add('active');
}

export function closeAddGuestModal() {
  document.getElementById('addGuestModal')?.classList.remove('active');
  document.getElementById('addGuestForm')?.reset();
}

export function openSelectFrequentGuestModal(adultIndex) {
  state.currentAdultIndexToFill = adultIndex;
  loadFrequentGuestsForSelection();
  document.getElementById('selectFrequentGuestModal')?.classList.add('active');
}

export function closeSelectGuestModal() {
  document.getElementById('selectFrequentGuestModal')?.classList.remove('active');
}

export async function loadFrequentGuests() {
  if (!state.currentUser) return;
  try {
    const snap = await db.collection('usuarios')
      .doc(state.currentUser.uid)
      .collection('huespedes_frecuentes')
      .get();

    let html = '';
    if (snap.empty) {
      html = '<p style="color:#999;text-align:center;">No tienes huéspedes guardados</p>';
    } else {
      snap.forEach(doc => {
        const g = doc.data();
        html += `
          <div class="frequent-guest-item">
            <div>
              <p style="font-weight:500;">${g.name} ${g.surname}</p>
              <p style="font-size:0.85rem;color:#666;">${g.email}</p>
            </div>
            <div>
              <button style="padding:4px 8px;font-size:0.8rem;background:#e74c3c;color:white;border:none;border-radius:4px;cursor:pointer;"
                onclick="deleteFrequentGuest('${doc.id}')">
                Borrar
              </button>
            </div>
          </div>
        `;
      });
    }
    const list = document.getElementById('frecuentGuestsList');
    if (list) list.innerHTML = html;
  } catch (err) {
    console.error('Error loadFrequentGuests:', err);
  }
}

async function loadFrequentGuestsForSelection() {
  if (!state.currentUser) return;
  const container = document.getElementById('frequentGuestsSelectList');
  if (!container) return;

  try {
    const snap = await db.collection('usuarios')
      .doc(state.currentUser.uid)
      .collection('huespedes_frecuentes')
      .get();

    let html = '';
    if (snap.empty) {
      html = '<p style="color:#999;text-align:center;">No tienes huéspedes guardados</p>';
    } else {
      snap.forEach(doc => {
        const g = doc.data();
        html += `
          <div style="background:#f9f9f9;padding:12px;border-radius:8px;margin-bottom:8px;border-left:4px solid #f3c669;cursor:pointer;"
            onclick="selectAndFillGuest(${state.currentAdultIndexToFill},
              '${(g.name || '').replace(/'/g, "\\'")}',
              '${(g.surname || '').replace(/'/g, "\\'")}',
              '${g.email || ''}',
              '${g.phone || ''}',
              '${g.docType || ''}',
              '${g.docNumber || ''}',
              '${g.nationality || ''}',
              '${g.birthDate || ''}',
              '${g.country || ''}',
              '${(g.address || '').replace(/'/g, "\\'")}',
              '${g.city || ''}',
              '${g.zipcode || ''}',
              '${g.province || ''}'
            )">
            <p style="font-weight:500;margin:0 0 4px 0;">${g.name} ${g.surname}</p>
            <p style="font-size:0.85rem;color:#666;margin:0;">${g.email} · ${g.phone}</p>
          </div>`;
      });
    }
    container.innerHTML = html;
  } catch (err) {
    console.error('Error loadFrequentGuestsForSelection:', err);
  }
}

export function selectAndFillGuest(index, name, surname, email, phone, docType, docNumber, nationality, birthDate, country, address, city, zipcode, province) {
  const nameInputs = document.querySelectorAll('.guestName');
  if (!nameInputs[index]) {
    alert('Error al cargar datos');
    return;
  }

  document.querySelectorAll('.guestName')[index].value = name;
  document.querySelectorAll('.guestSurname')[index].value = surname;
  document.querySelectorAll('.guestEmail')[index].value = email;
  document.querySelectorAll('.guestPhone')[index].value = phone;
  document.querySelectorAll('.guestDocType')[index].value = docType;
  document.querySelectorAll('.guestDocNumber')[index].value = docNumber;
  document.querySelectorAll('.guestNationality')[index].value = nationality;
  document.querySelectorAll('.guestBirthDate')[index].value = birthDate;
  document.querySelectorAll('.guestCountry')[index].value = country;
  document.querySelectorAll('.guestAddress')[index].value = address;
  document.querySelectorAll('.guestCity')[index].value = city;
  document.querySelectorAll('.guestZipcode')[index].value = zipcode;
  document.querySelectorAll('.guestProvince')[index].value = province;

  closeSelectGuestModal();
  alert('✓ Datos del huésped cargados');
}

export async function deleteFrequentGuest(guestId) {
  if (!state.currentUser) return;
  if (!confirm('¿Eliminar huésped frecuente?')) return;
  try {
    await db.collection('usuarios')
      .doc(state.currentUser.uid)
      .collection('huespedes_frecuentes')
      .doc(guestId)
      .delete();
    loadFrequentGuests();
  } catch (err) {
    alert('❌ Error: ' + err.message);
  }
}

export function showSaveGuestForm(index) {
  const nameInputs = document.querySelectorAll('.guestName');
  if (!nameInputs[index] || !nameInputs[index].value) {
    alert('Rellena los datos primero');
    return;
  }

  state.frequentGuestToSave = {
    name: nameInputs[index].value,
    surname: document.querySelectorAll('.guestSurname')[index].value,
    email: document.querySelectorAll('.guestEmail')[index].value,
    phone: document.querySelectorAll('.guestPhone')[index].value,
    docType: document.querySelectorAll('.guestDocType')[index].value,
    docNumber: document.querySelectorAll('.guestDocNumber')[index].value,
    nationality: document.querySelectorAll('.guestNationality')[index].value,
    birthDate: document.querySelectorAll('.guestBirthDate')[index].value,
    country: document.querySelectorAll('.guestCountry')[index].value,
    address: document.querySelectorAll('.guestAddress')[index].value,
    city: document.querySelectorAll('.guestCity')[index].value,
    zipcode: document.querySelectorAll('.guestZipcode')[index].value,
    province: document.querySelectorAll('.guestProvince')[index].value,
    createdAt: new Date().toISOString()
  };

  if (confirm('¿Guardar como huésped frecuente?')) {
    saveTemporaryGuest();
  }
}

async function saveTemporaryGuest() {
  if (!state.currentUser || !state.frequentGuestToSave) return;
  try {
    await db.collection('usuarios')
      .doc(state.currentUser.uid)
      .collection('huespedes_frecuentes')
      .add(state.frequentGuestToSave);
    alert('✓ Huésped guardado');
    loadFrequentGuests();
  } catch (err) {
    alert('❌ Error: ' + err.message);
  }
}

export function updateGuestForms() {
  const numAdults = parseInt(document.getElementById('bookAdults')?.value || '0', 10) || 0;
  const numChildren = parseInt(document.getElementById('bookChildren')?.value || '0', 10) || 0;

  const container = document.getElementById('guestFormsContainer');
  if (!container) return;

  let html = '';

  // Titular (usuario)
  const u = state.userData || {};
  html += `
    <div class="guest-section principal">
      <h4>👤 Titular (Tú) - Adulto</h4>
      <p style="color:#27ae60;font-size:0.85rem;margin-bottom:12px;">✓ Datos completados</p>
      <div class="form-row">
        <div class="form-group">
          <label>Nombre</label>
          <input type="text" value="${u.name || ''}" disabled>
        </div>
        <div class="form-group">
          <label>Apellidos</label>
          <input type="text" value="${u.surname || ''}" disabled>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Email</label>
          <input type="email" value="${u.email || ''}" disabled>
        </div>
        <div class="form-group">
          <label>Teléfono</label>
          <input type="tel" value="${u.phone || ''}" disabled>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Documento</label>
          <input type="text" value="${(u.docType || '') + ' ' + (u.docNumber || '')}" disabled>
        </div>
      </div>
    </div>
  `;

  // Adultos extra
  for (let i = 1; i < numAdults; i++) {
    html += `
      <div class="guest-section">
        <h4>👤 Adulto ${i + 1}</h4>
        <p style="margin:0 0 12px 0;display:flex;gap:8px;">
          <button type="button" class="btn-save-guest" onclick="openSelectFrequentGuestModal(${i - 1})">📋 Usar Frecuente</button>
          <button type="button" class="btn-save-guest" style="background:#27ae60;" onclick="showSaveGuestForm(${i - 1})">💾 Guardar</button>
        </p>
        <div class="form-row">
          <div class="form-group">
            <label>Nombre <span class="required">*</span></label>
            <input type="text" class="guestName" placeholder="Nombre" required>
          </div>
          <div class="form-group">
            <label>Apellidos <span class="required">*</span></label>
            <input type="text" class="guestSurname" placeholder="Apellidos" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Email</label>
            <input type="email" class="guestEmail" placeholder="Email">
          </div>
          <div class="form-group">
            <label>Teléfono <span class="required">*</span></label>
            <input type="tel" class="guestPhone" placeholder="+34..." required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Tipo de Documento <span class="required">*</span></label>
            <select class="guestDocType" required>
              <option value="">Selecciona</option>
              <option value="DNI">DNI</option>
              <option value="NIE">NIE</option>
              <option value="Pasaporte">Pasaporte</option>
            </select>
          </div>
          <div class="form-group">
            <label>Número <span class="required">*</span></label>
            <input type="text" class="guestDocNumber" placeholder="12345678A" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Nacionalidad <span class="required">*</span></label>
            <input type="text" class="guestNationality" placeholder="Ej: Española" required>
          </div>
          <div class="form-group">
            <label>Fecha (DD/MM/YYYY) <span class="required">*</span></label>
            <input type="text" class="guestBirthDate" placeholder="01/01/1990" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>País</label>
            <input type="text" class="guestCountry" placeholder="España">
          </div>
          <div class="form-group">
            <label>Dirección</label>
            <input type="text" class="guestAddress" placeholder="">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Ciudad</label>
            <input type="text" class="guestCity" placeholder="">
          </div>
          <div class="form-group">
            <label>CP</label>
            <input type="text" class="guestZipcode" placeholder="">
          </div>
        </div>
        <div class="form-group">
          <label>Provincia</label>
          <input type="text" class="guestProvince" placeholder="">
        </div>
      </div>
    `;
  }

  if (numChildren > 0) {
    html += `
      <div class="guest-section children">
        <h4>👧 ${numChildren} Niño${numChildren > 1 ? 's' : ''} (&lt;16 años)</h4>
        <p style="color:#3498db;font-size:0.9rem;margin:0;">✓ No requieren registro policial</p>
      </div>
    `;
  }

  container.innerHTML = html;

  const guestsLabel = numAdults
    ? `${numAdults} adulto${numAdults > 1 ? 's' : ''}` +
      (numChildren ? ` + ${numChildren} niño${numChildren > 1 ? 's' : ''}` : '')
    : '-';
  const guestsCount = document.getElementById('guestsCount');
  if (guestsCount) guestsCount.textContent = guestsLabel;
}

export function getAllGuestData() {
  const guests = [];
  const u = state.userData || {};
  const numAdults = parseInt(document.getElementById('bookAdults').value) || 0;
  const numChildren = parseInt(document.getElementById('bookChildren').value) || 0;

  // Titular
  guests.push({
    order: 1,
    isPrincipal: true,
    type: 'Adulto',
    name: u.name || '',
    surname: u.surname || '',
    email: u.email || '',
    phone: u.phone || '',
    docType: u.docType || '',
    docNumber: u.docNumber || '',
    nationality: u.nationality || '',
    birthDate: u.birthDate || '',
    country: u.country || '',
    address: u.address || '',
    city: u.city || '',
    zipcode: u.zipcode || '',
    province: u.province || ''
  });

  // Adultos extra (rellenos desde los campos .guest*)
  const names = document.querySelectorAll('.guestName');
  const surnames = document.querySelectorAll('.guestSurname');
  const emails = document.querySelectorAll('.guestEmail');
  const phones = document.querySelectorAll('.guestPhone');
  const docTypes = document.querySelectorAll('.guestDocType');
  const docNumbers = document.querySelectorAll('.guestDocNumber');
  const nationalities = document.querySelectorAll('.guestNationality');
  const births = document.querySelectorAll('.guestBirthDate');
  const countries = document.querySelectorAll('.guestCountry');
  const addresses = document.querySelectorAll('.guestAddress');
  const cities = document.querySelectorAll('.guestCity');
  const zips = document.querySelectorAll('.guestZipcode');
  const provinces = document.querySelectorAll('.guestProvince');

  for (let i = 0; i < numAdults - 1; i++) {
    if (!names[i] || !names[i].value.trim()) continue;

    guests.push({
      order: guests.length + 1,
      isPrincipal: false,
      type: 'Adulto',
      name: names[i].value.trim(),
      surname: surnames[i]?.value.trim() || '',
      email: emails[i]?.value.trim() || '',
      phone: phones[i]?.value.trim() || '',
      docType: docTypes[i]?.value || '',
      docNumber: docNumbers[i]?.value.trim() || '',
      nationality: nationalities[i]?.value.trim() || '',
      birthDate: births[i]?.value.trim() || '',
      country: countries[i]?.value.trim() || u.country || '',
      address: addresses[i]?.value.trim() || u.address || '',
      city: cities[i]?.value.trim() || u.city || '',
      zipcode: zips[i]?.value.trim() || u.zipcode || '',
      province: provinces[i]?.value.trim() || u.province || ''
    });
  }

  // Niños (solo contamos, no datos sensibles)
  for (let i = 0; i < numChildren; i++) {
    guests.push({
      order: guests.length + 1,
      isPrincipal: false,
      type: 'Niño',
      name: 'Niño/a',
      surname: u.surname || ''
    });
  }

  return guests;
}

export function setupAddGuestForm() {
  const form = document.getElementById('addGuestForm');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!state.currentUser) {
      alert('❌ Debes iniciar sesión');
      return;
    }

    const frequentGuest = {
      name: document.getElementById('frequentGuestName').value.trim(),
      surname: document.getElementById('frequentGuestSurname').value.trim(),
      email: document.getElementById('frequentGuestEmail').value.trim(),
      phone: document.getElementById('frequentGuestPhone').value.trim(),
      docType: document.getElementById('frequentGuestDocType').value,
      docNumber: document.getElementById('frequentGuestDocNumber').value.trim(),
      nationality: document.getElementById('frequentGuestNationality').value.trim(),
      birthDate: document.getElementById('frequentGuestBirthDate').value.trim(),
      country: document.getElementById('frequentGuestCountry').value.trim(),
      address: document.getElementById('frequentGuestAddress').value.trim(),
      city: document.getElementById('frequentGuestCity').value.trim(),
      zipcode: document.getElementById('frequentGuestZipcode').value.trim(),
      province: document.getElementById('frequentGuestProvince').value.trim(),
      createdAt: new Date().toISOString()
    };

    if (!frequentGuest.name || !frequentGuest.surname || !frequentGuest.email || !frequentGuest.phone) {
      alert('Completa los campos obligatorios');
      return;
    }

    try {
      await db.collection('usuarios')
        .doc(state.currentUser.uid)
        .collection('huespedes_frecuentes')
        .add(frequentGuest);

      alert('✓ Huésped guardado');
      closeAddGuestModal();
      loadFrequentGuests();
    } catch (err) {
      alert('❌ Error: ' + err.message);
    }
  });
}
