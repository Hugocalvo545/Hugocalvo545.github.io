// intranet/properties-service.js
import { db } from '../registro/firebase.js';

// Devuelve un array de alojamientos ordenados
export async function fetchProperties() {
  const snap = await db
    .collection('apartamentos')
    .orderBy('orden')
    .get();

  return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
}

// Crea o actualiza alojamiento
export async function saveProperty(id, data) {
  const col = db.collection('apartamentos');

  if (id) {
    await col.doc(id).update(data);
    return id;
  } else {
    const ref = await col.add(data);
    return ref.id;
  }
}

// Borra alojamiento
export async function deleteProperty(id) {
  await db.collection('apartamentos').doc(id).delete();
}
