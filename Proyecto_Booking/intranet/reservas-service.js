// intranet/reservas-service.js
import { db } from '../registro/firebase.js';

// Suscripción en tiempo real a reservas (últimas 100)
export function subscribeToReservas(onData, onError) {
  return db
    .collection('reservas')
    .orderBy('createdAt', 'desc')
    .limit(100)
    .onSnapshot(
      (snapshot) => {
        const reservas = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        onData(reservas, snapshot);
      },
      (err) => {
        if (onError) onError(err);
      }
    );
}

// Suscripción al chat de una reserva
export function subscribeToChat(reservaId, onData, onError) {
  return db
    .collection('chats')
    .doc(reservaId)
    .collection('mensajes')
    .orderBy('createdAt', 'asc')
    .onSnapshot(
      (snapshot) => {
        const mensajes = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        onData(mensajes);
      },
      (err) => {
        if (onError) onError(err);
      }
    );
}

// Enviar mensaje como host
export async function sendHostMessage(reservaId, text) {
  await db
    .collection('chats')
    .doc(reservaId)
    .collection('mensajes')
    .add({
      text,
      sender: 'host',
      createdAt: new Date(),
    });
}