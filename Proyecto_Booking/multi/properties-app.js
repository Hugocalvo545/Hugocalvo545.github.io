// multi/properties-app.js
import { subscribeApartamentosActivos, subscribePacksActivos } from './properties-service.js'

let allItems = [];
let filteredItems = [];

// mapa & marcadores
let map = null;
let infoWindow = null;
let markersMap = new Map();  // id -> { marker, item }
let mapReady = false;

const ui = {
  grid: null,
  results: null,
  filterType: null,
  filterCity: null,
  filterGuests: null,
};

const state = {
  tipo: 'all',
  ciudad: 'all',
  guests: 2,
};

/* =========================
   ICONOS DE PRECIO (SVG)
   ========================= */

function createPriceIcon(price, isActive = false) {
  const displayPrice =
    typeof price === 'number' ? `€${price.toFixed(0)}` : '€–';

  const bg = isActive ? '#000000' : '#F2B544';
  const textColor = isActive ? '#ffffff' : '#000000';

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="36">
      <rect x="2" y="2" rx="18" ry="18" width="76" height="32"
            fill="${bg}" stroke="rgba(0,0,0,0.3)" stroke-width="1" />
      <text x="50%" y="54%" text-anchor="middle"
            font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            font-size="14" font-weight="600" fill="${textColor}">
        ${displayPrice}
      </text>
    </svg>
  `.trim();

  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    scaledSize: new google.maps.Size(80, 36),
    anchor: new google.maps.Point(40, 18),
  };
}

/* =========================
   MAPA: INIT + MARCADORES
   ========================= */

// Google Maps llamará a esto por el callback del script
window.initMap = function initMap() {
  const mapEl = document.getElementById('map');
  if (!mapEl) {
    console.warn('No se encontró #map en este index, initMap no hace nada');
    return;
  }

  map = new google.maps.Map(mapEl, {
    center: { lat: 36.685, lng: -6.126 }, // centro por defecto (ajusta a tu zona)
    zoom: 13,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
  });

  infoWindow = new google.maps.InfoWindow();
  mapReady = true;

  // si ya tenemos alojamientos cargados, pintamos
  if (filteredItems && filteredItems.length) {
    rebuildMarkers();
  }
};

function rebuildMarkers() {
  if (!map) return;

  // limpiar marcadores anteriores
  markersMap.forEach(({ marker }) => marker.setMap(null));
  markersMap.clear();

  filteredItems.forEach((item) => {
    if (typeof item.lat !== 'number' || typeof item.lng !== 'number') return;

    const marker = new google.maps.Marker({
      position: { lat: item.lat, lng: item.lng },
      map,
      icon: createPriceIcon(item.precioBase, false),
      zIndex: 1,
    });

    marker.addListener('click', () => {
      setActiveItem(item.id, {
        panTo: true,
        openPopup: true,
        scrollToCard: true,
      });
    });

    markersMap.set(item.id, { marker, item });
  });

  fitMapToMarkers();
}

function fitMapToMarkers() {
  if (!map || markersMap.size === 0) return;

  const bounds = new google.maps.LatLngBounds();
  markersMap.forEach(({ marker }) => bounds.extend(marker.getPosition()));
  map.fitBounds(bounds);

  // si el zoom queda muy cerca, lo limitamos un poco
  const listener = google.maps.event.addListenerOnce(map, 'idle', () => {
    if (map.getZoom() > 16) map.setZoom(16);
  });
}

/* =========================
   POPUP / ITEM ACTIVO
   ========================= */

function buildPopupContent(item) {
  const fotos = Array.isArray(item.images) ? item.images : (Array.isArray(item.fotos) ? item.fotos : []);
  const foto = item.imageMain || fotos[0] || './img/placeholder-alojamiento.jpg';


  const noches = item.capacidadTotal ?? item.capacidad ?? null;
  const precio =
    typeof item.precioBase === 'number' ? `${item.precioBase.toFixed(0)} €` : 'Consultar';

  const detalleUrl = `./detalle.html?id=${encodeURIComponent(
    item.id
  )}&tipo=${encodeURIComponent(item._tipo)}`;

  return `
    <div class="map-popup">
      <img src="${foto}" alt="${item.nombre || ''}">
      <h4>${item.nombre || 'Alojamiento'}</h4>
      <p style="margin:0; font-size:0.83rem; color:#555;">
        ${item.ciudad || ''}${
    noches ? ` · Hasta ${noches} huéspedes` : ''
  }
      </p>
      <p style="margin:4px 0 6px; font-size:0.9rem;">
        <strong>${precio}</strong> / noche
      </p>
      <a href="${detalleUrl}" class="btn-primary" style="
          display:inline-block;
          padding:6px 10px;
          border-radius:999px;
          font-size:0.8rem;
          text-decoration:none;
          color:#fff;
          background:#c6933b;
        ">
        Ver detalles
      </a>
    </div>
  `;
}

function setActiveItem(itemId, options = {}) {
  const {
    panTo = false,
    openPopup = false,
    scrollToCard = false,
  } = options;

  // reset de todos
  markersMap.forEach(({ marker, item }) => {
    marker.setIcon(createPriceIcon(item.precioBase, false));
    marker.setZIndex(1);
  });
  document
    .querySelectorAll('.property-card')
    .forEach((c) => c.classList.remove('active'));

  const entry = markersMap.get(itemId);
  if (!entry) return;
  const { marker, item } = entry;

  // icono activo + zIndex
  marker.setIcon(createPriceIcon(item.precioBase, true));
  marker.setZIndex(1000);

  // resaltar card
  const card = document.querySelector(`.property-card[data-id="${itemId}"]`);
  if (card) {
    card.classList.add('active');
  }

  // centrar mapa suavemente
  if (panTo && map) {
    map.panTo(marker.getPosition());
  }

  // popup con mini card estilo Airbnb
  if (openPopup && infoWindow && map) {
    infoWindow.setContent(buildPopupContent(item));
    infoWindow.open(map, marker);
  }

  // scroll al card
  if (scrollToCard && card) {
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

/* =========================
   UI: CARDS
   ========================= */

function createPropertyCard(item) {
  const card = document.createElement('article');
  card.className = 'property-card';
  card.dataset.id = item.id;

  const fotos = Array.isArray(item.images) ? item.images : (Array.isArray(item.fotos) ? item.fotos : []);
  const foto = item.imageMain || fotos[0] || './img/placeholder-alojamiento.jpg';


  const capacidad = item.capacidadTotal ?? item.capacidad ?? null;
  const precio =
    typeof item.precioBase === 'number' ? item.precioBase.toFixed(0) : null;
  const ciudad = item.ciudad || '';
  const groupKey = item.groupKey || '';
  const tipoLabel = item._tipo === 'apto' ? 'Apartamento' : 'Pack';

  const descCorta =
    item.descripcionCorta ||
    (item.descripcion
      ? String(item.descripcion).split('.').shift()
      : '');

  card.innerHTML = `
    <div class="property-image-wrap">
      <img src="${foto}" class="property-image" alt="${item.nombre || ''}">
      <div class="property-pill">${tipoLabel}</div>
    </div>
    <div class="property-content">
      <div class="property-header">
        <h3 class="property-title">${item.nombre || 'Alojamiento'}</h3>
        ${
          ciudad
            ? `<span class="property-chip">${ciudad}</span>`
            : ''
        }
        ${
          groupKey
            ? `<span class="property-chip property-chip-soft">${groupKey}</span>`
            : ''
        }
      </div>
      <p class="property-meta">
        ${
          capacidad
            ? `<strong>${capacidad}</strong> huéspedes máx.`
            : ''
        }
      </p>
      ${
        descCorta
          ? `<p class="property-desc">${descCorta}</p>`
          : ''
      }
      <div class="property-footer">
        ${
          precio
            ? `<div class="property-price">
                <span>Desde</span>
                <strong>${precio} €</strong>
                <span>/noche</span>
              </div>`
            : '<div class="property-price property-price-noinfo">Precio según fechas</div>'
        }
        <button class="btn-ghost" type="button">Ver detalles</button>
      </div>
    </div>
  `;

  // Hover → resalta marcador y abre popup
  card.addEventListener('mouseenter', () => {
    setActiveItem(item.id, { panTo: true, openPopup: true });
  });

  // Click en card o botón → ir a detalle
  card.addEventListener('click', (ev) => {
    ev.preventDefault();
    const url = `./detalle.html?id=${encodeURIComponent(
      item.id
    )}&tipo=${encodeURIComponent(item._tipo)}`;
    window.location.href = url;
  });

  return card;
}

/* =========================
   FILTROS + RENDER
   ========================= */

function buildCityOptions() {
  if (!ui.filterCity) return;
  const ciudades = new Set();
  allItems.forEach((i) => {
    if (i.ciudad) ciudades.add(i.ciudad);
  });

  ui.filterCity.innerHTML = '<option value="all">Todas</option>';
  Array.from(ciudades)
    .sort((a, b) => a.localeCompare(b, 'es'))
    .forEach((city) => {
      const opt = document.createElement('option');
      opt.value = city;
      opt.textContent = city;
      ui.filterCity.appendChild(opt);
    });
}

function applyFilters() {
  const tipo = ui.filterType?.value || 'all';
  const city = ui.filterCity?.value || 'all';
  const guests = parseInt(ui.filterGuests?.value || '1', 10) || 1;

  state.tipo = tipo;
  state.ciudad = city;
  state.guests = guests;

  filteredItems = allItems.filter((item) => {
    if (tipo !== 'all' && item._tipo !== tipo) return false;
    if (city !== 'all' && item.ciudad !== city) return false;

    const cap = item.capacidadTotal ?? item.capacidad ?? null;
    if (cap && guests > cap) return false;

    return true;
  });

  renderGrid();

  if (mapReady) {
    rebuildMarkers();
  }
}

function renderGrid() {
  if (!ui.grid) return;

  if (!filteredItems.length) {
    ui.grid.innerHTML = `
      <div class="empty-state">
        <p>No hay alojamientos que cumplan los filtros seleccionados.</p>
      </div>
    `;
  } else {
    ui.grid.innerHTML = '';
    filteredItems.forEach((item) => {
      ui.grid.appendChild(createPropertyCard(item));
    });
  }

  if (ui.results) {
    const n = filteredItems.length;
    ui.results.textContent = n === 1 ? '1 Resultado' : `${n} Resultados`;
  }
}

/* =========================
   INIT
   ========================= */

let unsubAptos = null;
let unsubPacks = null;

function normalizeItem(x) {
  const images = Array.isArray(x.images)
    ? x.images
    : (Array.isArray(x.fotos) ? x.fotos : []);

  const imageMain = x.imageMain || images[0] || "";

  return {
    ...x,
    images,
    imageMain,
    // para que la card muestre lo nuevo sin romper lo viejo
    descripcionCorta:
      x.tagline ||
      x.descripcionCorta ||
      (x.descripcion ? String(x.descripcion).split('.').shift() : '') ||
      ''
  };
}

function rebuildAllItemsFromRT(aptos, packs) {
  allItems = [
    ...aptos.map((a) => ({ ...normalizeItem(a), _tipo: 'apto' })),
    ...packs.map((p) => ({ ...normalizeItem(p), _tipo: 'pack' })),
  ];

  buildCityOptions();
  applyFilters();

  if (mapReady) rebuildMarkers();
}

async function init() {
  ui.grid = document.getElementById('propertiesGrid');
  ui.results = document.getElementById('resultsCount');
  ui.filterType = document.getElementById('filterType');
  ui.filterCity = document.getElementById('filterCity');
  ui.filterGuests = document.getElementById('filterGuests');

  if (!ui.grid) return;
  ui.grid.innerHTML = '<p>Cargando alojamientos...</p>';

  // Listeners filtros (una sola vez)
  ui.filterType?.addEventListener('change', applyFilters);
  ui.filterCity?.addEventListener('change', applyFilters);
  ui.filterGuests?.addEventListener('input', () => {
    let val = parseInt(ui.filterGuests.value || '1', 10) || 1;
    if (val < 1) val = 1;
    if (val > 8) val = 8;
    ui.filterGuests.value = String(val);
    applyFilters();
  });

  // Realtime: vamos actualizando según lleguen snapshots
  let rtAptos = [];
  let rtPacks = [];

  unsubAptos?.();
  unsubPacks?.();

  unsubAptos = subscribeApartamentosActivos(
    (list) => {
      rtAptos = list;
      rebuildAllItemsFromRT(rtAptos, rtPacks);
    },
    (err) => {
      console.error("RT apartamentos:", err);
      ui.grid.innerHTML = '<p>Error cargando alojamientos.</p>';
      if (ui.results) ui.results.textContent = 'Error al cargar';
    }
  );

  unsubPacks = subscribePacksActivos(
    (list) => {
      rtPacks = list;
      rebuildAllItemsFromRT(rtAptos, rtPacks);
    },
    (err) => {
      console.error("RT packs:", err);
      ui.grid.innerHTML = '<p>Error cargando alojamientos.</p>';
      if (ui.results) ui.results.textContent = 'Error al cargar';
    }
  );

  window.addEventListener("beforeunload", () => {
    unsubAptos?.();
    unsubPacks?.();
  });
}

document.addEventListener('DOMContentLoaded', init);

