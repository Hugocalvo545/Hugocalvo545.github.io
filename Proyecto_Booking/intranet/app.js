// intranet/app.js
import { auth, db, storage, serverTimestamp, increment } from '../registro/firebase.js';
import { fetchProperties, saveProperty, deleteProperty } from './properties-service.js';
import { fetchPacks, savePack, deletePack } from './packs-service.js';
import {subscribeToReservas, subscribeToChat, sendHostMessage } from './reservas-service.js';


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
const propertyPhotosInput = document.getElementById('propertyPhotos');
const photoPreview        = document.getElementById('photoPreview');

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

let hostUnreadUnsub = null;
let unreadHostMap = new Map();

let reservasCache = [];
let reservasUnsubscribe = null;

let currentChatReservaId = null;
let chatUnsubscribe = null;

let firstReservasSnapshot = true;

let photoItems = []; 
// cada item: { type:'existing', url } o { type:'new', file, tempUrl }

let originalExistingUrls = [];
let imageMainUrl = "";

// Campos form

const latInput = document.getElementById('lat');
const lngInput = document.getElementById('lng');
const taglineInput = document.getElementById('tagline');
const highlightsInput = document.getElementById('highlights');
const checkInTimeInput = document.getElementById('checkInTime');
const checkOutTimeInput = document.getElementById('checkOutTime');
const normasInput = document.getElementById('normas');
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

let saveToastTimer = null;

function showSuccess(msg = "✅ Guardado correctamente.") {
  clearTimeout(saveToastTimer);
  formMessage.textContent = msg;
  formMessage.classList.remove("error-msg");
  formMessage.classList.add("info-msg");
  saveToastTimer = setTimeout(() => {
    formMessage.textContent = "";
  }, 3000);
}

function showError(msg) {
  clearTimeout(saveToastTimer);
  formMessage.textContent = msg;
  formMessage.classList.remove("info-msg");
  formMessage.classList.add("error-msg");
}


// =========================
// FOTOS ALOJAMIENTOS
// =========================

// cuando se seleccionan fotos nuevas
propertyPhotosInput?.addEventListener('change', () => {
  const files = Array.from(propertyPhotosInput.files || []);
  if (!files.length) return;

  for (const file of files) {
    photoItems.push({
      type: 'new',
      file,
      tempUrl: URL.createObjectURL(file)
    });
  }

  // si no hay principal aún, ponemos la primera
  if (!imageMainUrl && photoItems.length) {
    imageMainUrl = photoItems[0].type === 'existing' ? photoItems[0].url : photoItems[0].tempUrl;
  }

  propertyPhotosInput.value = "";
  renderPhotoPreview();
});


/* -------- Tabs -------- */

tabButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;

    // Activar botón
    tabButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    // Activar contenido
    tabContents.forEach((c) => {
      c.classList.toggle('active', c.id === `tab-${tab}`);
    });

    // Extra: al entrar en Reservas, oculta badge (tipo Booking)
    if (tab === 'reservas') {
      const badge = document.getElementById('hostMsgBadge');
      if (badge) badge.style.display = 'none';
    }
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
    initHostUnreadListener();
    // registerServiceWorkerAndNotifications();
    enableHostPush();
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
    paintUnreadHostInTable();
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

  taglineInput.value           = prop.tagline ?? '';
  highlightsInput.value        = Array.isArray(prop.highlights) ? prop.highlights.join('\n') : (prop.highlights ?? '');
  checkInTimeInput.value       = prop.checkInTime ?? '';
  checkOutTimeInput.value      = prop.checkOutTime ?? '';
  normasInput.value            = prop.normas ?? '';
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

  const urls = Array.isArray(prop.images) ? prop.images : [];
  originalExistingUrls = [...urls];

  photoItems = urls.map((u) => ({ type: "existing", url: u }));
  imageMainUrl = prop.imageMain || (urls[0] || "");
  renderPhotoPreview();
}

function resetForm() {
  formTitle.textContent = 'Nuevo alojamiento';
  propertyIdInput.value = '';
  propertyForm.reset();
  formMessage.textContent = '';
  existingPhotoUrls = [];
  photosToUpload = [];
  photosToDelete = new Set();
  photoItems = [];
  originalExistingUrls = [];
  imageMainUrl = '';
  renderPhotoPreview();
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

  const id               = propertyIdInput.value.trim();

  const tagline = taglineInput.value.trim();
  const highlights       = highlightsInput.value
                         ? highlightsInput.value.split('\n').map(s => s.trim()).filter(Boolean)
                         : [];
  const checkInTime      = checkInTimeInput.value.trim();
  const checkOutTime     = checkOutTimeInput.value.trim();
  const normas           = normasInput.value.trim();
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
    tagline,
    highlights,
    checkInTime,
    checkOutTime,
    normas,
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
    const submitBtn = propertyForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    let docRef;

    // 1) Crear/actualizar apartamento (para tener ID)
    if (id) {
      docRef = db.collection('apartamentos').doc(id);
      await docRef.set(dataToSave, { merge: true });
    } else {
      docRef = db.collection('apartamentos').doc();
      await docRef.set(dataToSave);
      propertyIdInput.value = docRef.id; // importante para editar después
    }

    const apartmentId = docRef.id;

    // URLs existentes que quedan (en el orden actual)
    const keptExistingUrls = photoItems
      .filter(i => i.type === 'existing')
      .map(i => i.url);

    // Nuevas fotos en el orden actual
    const newFilesInOrder = photoItems
      .filter(i => i.type === 'new')
      .map(i => i.file);

    // subir nuevas fotos (en el orden que están)
    let newUrls = [];
    if (photosToUpload.length) {
      formMessage.textContent = 'Subiendo fotos... 0%';

      // Timeout (por si se queda colgado)
      const uploadPromise = uploadPhotosForApartment(apartmentId, photosToUpload, ({ fileName, pct }) => {
        formMessage.textContent = `Subiendo: ${fileName}… ${pct}%`;
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout subiendo fotos (comprueba conexión/tamaño).")), 120000)
      );

      newUrls = await Promise.race([uploadPromise, timeoutPromise]);
    }

    // reconstruir lista final en orden (existing+new según photoItems)
    let finalImages = [];
    let uploadCursor = 0;

    for (const item of photoItems) {
      if (item.type === 'existing') finalImages.push(item.url);
      else finalImages.push(newUrls[uploadCursor++]);
    }

    // principal: si era una tempUrl, la convertimos a la url subida correspondiente
    let finalMain = imageMainUrl;

    // si principal es una tempUrl, buscamos su índice en photoItems y cogemos finalImages[idx]
    const mainIdx = photoItems.findIndex(i => i.type === 'new' && i.tempUrl === imageMainUrl);
    if (mainIdx >= 0) finalMain = finalImages[mainIdx];

    // si principal era existing pero se borró, fallback
    if (!finalMain || !finalImages.includes(finalMain)) {
      finalMain = finalImages[0] || "";
    }

    // guardar en Firestore
    await docRef.set({
      images: finalImages,
      imageMain: finalMain,
      updatedAt: serverTimestamp()
    }, { merge: true });

    // borrar físicamente del Storage las existentes eliminadas
    const removedExisting = originalExistingUrls.filter(u => !keptExistingUrls.includes(u));
    await Promise.allSettled(
      removedExisting.map(u => window.firebase.storage().refFromURL(u).delete())
    );
    console.log("🧹 borrando del storage:", removedExisting);

    // actualizar estado local tras guardar
    originalExistingUrls = [...finalImages];
    photoItems = finalImages.map(u => ({ type:'existing', url: u }));
    imageMainUrl = finalMain;
    renderPhotoPreview();
    if (submitBtn) submitBtn.disabled = false;

  } catch (err) {
    if (submitBtn) submitBtn.disabled = true;
    console.error(err);
    formMessage.textContent = 'Error al guardar o subir fotos: ${err?.message || err}';
  }
});

/* -------- CRUD Packs -------- */

async function loadPacks() {
  if (!packsBody) return;
  packsBody.innerHTML = '<tr><td colspan="7">Cargando...</td></tr>';

  try {
    packsCache = await fetchPacks();
    renderPacksTable();
  } catch (err) {
    console.error(err);
    packsBody.innerHTML = '<tr><td colspan="7">Error al cargar.</td></tr>';
  }
}

function renderPhotoPreview() {
  if (!photoPreview) return;

  // Si sigues usando existingPhotoUrls/photosToUpload/photosToDelete:
  // montamos una “lista visual” simple para poder ordenar y elegir principal
  const keptExisting = existingPhotoUrls.filter((u) => !photosToDelete.has(u));

  // Si no hay imageMain guardado, lo ponemos como primera
  if (!window.__imageMainUrl) window.__imageMainUrl = keptExisting[0] || "";

  const items = [
    ...keptExisting.map((url) => ({ type: "existing", url })),
    ...photosToUpload.map((file) => ({ type: "new", file, tmp: URL.createObjectURL(file) })),
  ];

  photoPreview.innerHTML = items.map((it, idx) => {
    const url = it.type === "existing" ? it.url : it.tmp;
    const isMain = url === window.__imageMainUrl;

    return `
      <div class="photo-item">
        <img src="${url}" alt="Foto alojamiento" />
        <div class="photo-actions">
          <button type="button" class="photo-btn" data-main="${idx}" title="Principal">${isMain ? "⭐" : "☆"}</button>
          <button type="button" class="photo-btn" data-left="${idx}" title="Mover">←</button>
          <button type="button" class="photo-btn" data-right="${idx}" title="Mover">→</button>
          <button type="button" class="photo-btn danger" data-del="${idx}" title="Eliminar">×</button>
        </div>
      </div>
    `;
  }).join("");

  // principal
  photoPreview.querySelectorAll("[data-main]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.getAttribute("data-main"));
      const it = items[idx];
      window.__imageMainUrl = it.type === "existing" ? it.url : it.tmp;
      renderPhotoPreview();
    });
  });

  // mover izq
  photoPreview.querySelectorAll("[data-left]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.getAttribute("data-left"));
      if (idx <= 0) return;

      // reordenar en keptExisting/photosToUpload según el bloque
      if (idx < keptExisting.length) {
        // existing
        const [m] = keptExisting.splice(idx, 1);
        keptExisting.splice(idx - 1, 0, m);
        existingPhotoUrls = keptExisting;
      } else {
        // new
        const ni = idx - keptExisting.length;
        const [m] = photosToUpload.splice(ni, 1);
        photosToUpload.splice(ni - 1, 0, m);
      }
      renderPhotoPreview();
    });
  });

  // mover der
  photoPreview.querySelectorAll("[data-right]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.getAttribute("data-right"));
      if (idx >= items.length - 1) return;

      if (idx < keptExisting.length - 1) {
        // existing swap
        [keptExisting[idx], keptExisting[idx + 1]] = [keptExisting[idx + 1], keptExisting[idx]];
        existingPhotoUrls = keptExisting;
      } else if (idx >= keptExisting.length) {
        // new swap
        const ni = idx - keptExisting.length;
        if (ni >= photosToUpload.length - 1) return;
        [photosToUpload[ni], photosToUpload[ni + 1]] = [photosToUpload[ni + 1], photosToUpload[ni]];
      }
      renderPhotoPreview();
    });
  });

  // eliminar
  photoPreview.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.getAttribute("data-del"));
      if (idx < keptExisting.length) {
        const url = keptExisting[idx];
        photosToDelete.add(url);
        existingPhotoUrls = keptExisting.filter((u) => u !== url);
        if (window.__imageMainUrl === url) window.__imageMainUrl = existingPhotoUrls[0] || "";
      } else {
        const ni = idx - keptExisting.length;
        photosToUpload.splice(ni, 1);
      }
      renderPhotoPreview();
    });
  });
}

function safeFileName(name) {
  return (name || "foto").replace(/[^\w.\-]+/g, "_");
}

async function uploadPhotosForApartment(apartmentId, files, onProgress) {
  const urls = [];

  for (const file of files) {
    const path = `apartamentos/${apartmentId}/${Date.now()}-${safeFileName(file.name)}`;
    const ref = storage.ref().child(path);

    const uploadTask = ref.put(file);

    // Espera a que termine con progreso
    const snapshot = await new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snap) => {
          if (typeof onProgress === "function") {
            const pct = snap.totalBytes ? Math.round((snap.bytesTransferred / snap.totalBytes) * 100) : 0;
            onProgress({ fileName: file.name, pct });
          }
        },
        (err) => reject(err),
        () => resolve(uploadTask.snapshot)
      );
    });

    const url = await snapshot.ref.getDownloadURL();
    urls.push(url);
  }

  return urls;
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

function initHostUnreadListener() {
  if (hostUnreadUnsub) hostUnreadUnsub();

  hostUnreadUnsub = db.collection('chats')
    .where('unreadHost', '>', 0)
    .onSnapshot((snap) => {
      unreadHostMap.clear();
      let total = 0;

      snap.docs.forEach((d) => {
        const n = Number(d.data().unreadHost || 0);
        if (n > 0) {
          unreadHostMap.set(d.id, n); // d.id = reservaId
          total += n;
        }
      });

      // Badge en el botón "Reservas"
      const badge = document.getElementById('hostMsgBadge');
      if (badge) {
        badge.textContent = total > 9 ? '9+' : String(total);
        badge.style.display = total ? 'inline-flex' : 'none';
      }

      // Si ya hay tabla pintada, marcamos filas
      paintUnreadHostInTable();
    },
    (err) => console.error('Error unreadHost listener', err)
  );
}

function paintUnreadHostInTable() {
  document.querySelectorAll('.reserva-row').forEach((row) => {
    const id = row.dataset.reservaId;
    const unread = unreadHostMap.get(id);

    row.classList.toggle('has-unread', !!unread);

    let badge = row.querySelector('.row-badge');
    if (unread) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'row-badge';
        row.querySelector('td:last-child')?.appendChild(badge);
      }
      badge.textContent = unread;
    } else if (badge) {
      badge.remove();
    }
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
    // usamos el servicio que habla con Firestore
    const newId = await savePack(id || null, dataToSave);

    packFormMessage.textContent = 'Guardado correctamente.';
    await loadPacks();

    // si era nuevo, rellenamos el hidden con el id creado
    if (!id) packIdInput.value = newId;
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

  db.collection('chats').doc(currentChatReservaId).set(
    { unreadHost: 0 },
    { merge: true }
  ).catch(()=>{});

  if (!chatMessagesBox) return;

  chatMessagesBox.innerHTML = '<p class="muted">Cargando chat...</p>';

  // Cerrar listener anterior si había
  if (chatUnsubscribe) {
    chatUnsubscribe();
  }

  chatUnsubscribe = subscribeToChat(
    reservaId,
    (mensajes) => {
      if (!mensajes.length) {
        chatMessagesBox.innerHTML =
          '<p class="muted">No hay mensajes aún. Escribe el primero.</p>';
        return;
      }

      const html = mensajes
        .map((m) => {
          const sender = m.sender || 'guest';
          const text   = m.text || '';
          const date   = m.createdAt && m.createdAt.toDate
            ? m.createdAt.toDate().toLocaleString()
            : '';

          return `
            <div class="chat-bubble ${sender === 'host' ? 'host' : 'guest'}">
              <div>${text}</div>
              <div class="chat-meta">
                ${sender === 'host' ? 'Tú' : 'Huésped'} · ${date}
              </div>
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
    if (!currentChatReservaId || !isAdmin) return;

    const text = chatInput.value.trim();
    if (!text) return;

    try {
      const chatRef = db.collection('chats').doc(currentChatReservaId);
      const msgRef  = chatRef.collection('mensajes').doc();

      const batch = db.batch();

      batch.set(msgRef, {
        text,
        sender: 'host',
        createdAt: serverTimestamp()
      });

      batch.set(chatRef, {
        lastMessage: text,
        lastSender: 'host',
        lastAt: serverTimestamp(),
        unreadGuest: increment(1)
      }, { merge: true });

      await batch.commit();
      chatInput.value = '';
    } catch (err) {
      console.error('Error enviando mensaje (host)', err);
    }
  });
}



/* -------- PWA: SW + notificaciones (preparado) -------- */

const VAPID_KEY = "BKJkrLtN0dRnBJ7T68UVHYpYIBncqlubfKPXxvfpa2gw4YOeAIZIWXM2yiziu54lxrhtPj8Zl5tzvXl3is7sHic";

async function enableHostPush() {
  try {
    if (!("serviceWorker" in navigator)) return;
    if (!("Notification" in window)) return;

    if (!VAPID_KEY || VAPID_KEY.length < 60) {
      console.warn("VAPID key inválida o incompleta, no se activa Push.");
      return;
    }

    // Registra el SW (el mismo que usas para cache + push)
    const swReg = await navigator.serviceWorker.register("./service-worker.js");

    const perm = await Notification.requestPermission();
    if (perm !== "granted") return;

    const messaging = window.firebase.messaging();

    const token = await messaging.getToken({
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg
    });

    if (!token || !auth.currentUser) return;

    await db.collection("deviceTokens").doc(token).set({
      token,
      uid: auth.currentUser.uid,
      role: "host",
      updatedAt: serverTimestamp(),
      userAgent: navigator.userAgent
    }, { merge: true });

    console.log("✅ Push activado. Token guardado.");
  } catch (e) {
    console.warn("⚠️ Push desactivado (pero intranet OK):", e);
  }
}

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
