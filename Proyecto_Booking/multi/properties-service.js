// multi/properties-service.js
import { db } from '../registro/firebase.js';

// Realtime: apartamentos activos
export function subscribeApartamentosActivos(onChange, onError) {
  return db
    .collection('apartamentos')
    .where('activa', '==', true)
    .orderBy('orden')
    .onSnapshot(
      (snap) => {
        const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        onChange(list);
      },
      (err) => onError?.(err)
    );
}

// Realtime: packs activos
export function subscribePacksActivos(onChange, onError) {
  return db
    .collection('packs')
    .where('activa', '==', true)
    .orderBy('orden')
    .onSnapshot(
      (snap) => {
        const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        onChange(list);
      },
      (err) => onError?.(err)
    );
}