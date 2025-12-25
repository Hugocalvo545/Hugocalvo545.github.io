// intranet/packs-service.js
import { db } from '../registro/firebase.js';

// Leer packs
export async function fetchPacks() {
  const snap = await db
    .collection('packs')
    .orderBy('orden', 'asc')
    .get();

  return snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
  }));
}

// Crear o actualizar pack
export async function savePack(id, data) {
  const col = db.collection('packs');
  let docRef;

  if (id) {
    docRef = col.doc(id);
    await docRef.set(data, { merge: true });
  } else {
    docRef = col.doc();
    await docRef.set(data);
  }

  return docRef.id;
}

// (Opcional) borrar pack
export async function deletePack(id) {
  await db.collection('packs').doc(id).delete();
}
