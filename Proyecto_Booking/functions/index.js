const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.notifyOnNewChatMessage = functions.firestore
  .document("chats/{reservaId}/mensajes/{mensajeId}")
  .onCreate(async (snap, ctx) => {
    const msg = snap.data() || {};
    const sender = msg.sender; // "guest" | "host"
    const text = (msg.text || "").toString();

    const reservaId = ctx.params.reservaId;

    // --- 1) Si escribe el huésped: notificar al/los host (único admin) ---
    if (sender === "guest") {
      const tokensSnap = await admin.firestore()
        .collection("deviceTokens")
        .where("role", "==", "host")
        .get();

      const tokens = tokensSnap.docs.map(d => d.id).filter(Boolean);
      if (!tokens.length) return null;

      const notif = {
        notification: {
          title: "Nuevo mensaje del huésped",
          body: text.length > 120 ? text.slice(0, 120) + "…" : (text || "Te han escrito en una reserva")
        },
        data: { reservaId }
      };

      // Envío + limpieza de tokens inválidos
      const results = await Promise.allSettled(tokens.map(token =>
        admin.messaging().send({ ...notif, token })
      ));

      await cleanupBadTokens(results, tokens);
      return null;
    }

    // --- 2) Opcional: si escribe el host, notificar al huésped ---
    if (sender === "host") {
      const chatDoc = await admin.firestore().collection("chats").doc(reservaId).get();
      const chat = chatDoc.data() || {};
      const guestId = chat.guestId;
      if (!guestId) return null;

      const tokensSnap = await admin.firestore()
        .collection("deviceTokens")
        .where("uid", "==", guestId)
        .get();

      const tokens = tokensSnap.docs.map(d => d.id).filter(Boolean);
      if (!tokens.length) return null;

      const notif = {
        notification: {
          title: "Nuevo mensaje del alojamiento",
          body: text.length > 120 ? text.slice(0, 120) + "…" : (text || "Tienes un mensaje nuevo")
        },
        data: { reservaId }
      };

      const results = await Promise.allSettled(tokens.map(token =>
        admin.messaging().send({ ...notif, token })
      ));

      await cleanupBadTokens(results, tokens);
      return null;
    }

    return null;
  });

async function cleanupBadTokens(results, tokens) {
  // Borra tokens inválidos en Firestore (docId = token)
  const bad = [];
  results.forEach((r, i) => {
    if (r.status !== "fulfilled") {
      const code = r.reason?.errorInfo?.code || r.reason?.code || "";
      if (
        code.includes("registration-token-not-registered") ||
        code.includes("invalid-argument")
      ) bad.push(tokens[i]);
    }
  });

  if (!bad.length) return;
  const batch = admin.firestore().batch();
  bad.forEach(t => batch.delete(admin.firestore().collection("deviceTokens").doc(t)));
  await batch.commit();
}