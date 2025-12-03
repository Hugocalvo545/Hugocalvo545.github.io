import { state } from './state.js';

// Inicializa el servicio de Autocomplete de Google Places
export function initPlaces() {
  if (window.google?.maps?.places) {
    state.autocompleteService = new google.maps.places.AutocompleteService();
  } else {
    console.warn('Google Places no disponible todavía. Asegúrate de cargar la librería con &libraries=places');
  }
}

// Configura el autocomplete del campo de dirección del registro
export function setupAddressAutocomplete() {
  const input = document.getElementById('address');
  const list = document.getElementById('addressList');
  if (!input || !list) return;

  input.addEventListener('input', (e) => {
    const value = e.target.value.trim();

    // Si hay poco texto o no tenemos servicio, limpiamos
    if (!value || value.length <= 3 || !state.autocompleteService) {
      list.classList.remove('active');
      list.innerHTML = '';
      return;
    }

    state.autocompleteService.getPlacePredictions(
      {
        input: value,
        componentRestrictions: { country: 'es' },
        types: ['geocode']
      },
      (predictions, status) => {
        list.innerHTML = '';

        if (status !== 'OK' || !predictions || predictions.length === 0) {
          list.classList.remove('active');
          return;
        }

        predictions.slice(0, 5).forEach((prediction) => {
          const item = document.createElement('div');
          item.className = 'autocomplete-item';
          item.textContent = prediction.description;
          item.addEventListener('click', () => handleAddressSelected(prediction));
          list.appendChild(item);
        });

        list.classList.add('active');
      }
    );
  });

  // Cerrar la lista si clicas fuera
  document.addEventListener('click', (e) => {
    if (!list.contains(e.target) && e.target !== input) {
      list.classList.remove('active');
    }
  });
}

// Maneja la selección de una sugerencia y autocompleta campos
function handleAddressSelected(prediction) {
  const input = document.getElementById('address');
  const list = document.getElementById('addressList');
  if (!input || !list) return;

  input.value = prediction.description;
  list.classList.remove('active');
  list.innerHTML = '';

  // Geocodificar para sacar CP, ciudad, provincia
  if (!window.google?.maps?.Geocoder) return;

  const geocoder = new google.maps.Geocoder();

  // Usamos place_id para ser más precisos
  const geocodeRequest = prediction.place_id
    ? { placeId: prediction.place_id }
    : { address: prediction.description };

  geocoder.geocode(geocodeRequest, (results, status) => {
    if (status !== 'OK' || !results || !results[0]) return;

    const comps = results[0].address_components;

    const getComponent = (types) => {
      const c = comps.find((comp) =>
        types.every((t) => comp.types.includes(t))
      );
      return c ? c.long_name : '';
    };

    const zipcode =
      getComponent(['postal_code']);
    const city =
      getComponent(['locality']) ||
      getComponent(['postal_town']);
    const province =
      getComponent(['administrative_area_level_2']) ||
      getComponent(['administrative_area_level_1']);

    const zipcodeEl = document.getElementById('zipcode');
    const cityEl = document.getElementById('city');
    const provinceEl = document.getElementById('province');

    if (zipcodeEl && zipcode && !zipcodeEl.value) zipcodeEl.value = zipcode;
    if (cityEl && city && !cityEl.value) cityEl.value = city;
    if (provinceEl && province && !provinceEl.value) provinceEl.value = province;
  });
}

// Export para compatibilidad si en algún sitio se usa selectAddress directamente
export function selectAddress(description) {
  // Fallback simple por si alguien lo llama con el texto
  handleAddressSelected({ description });
}
