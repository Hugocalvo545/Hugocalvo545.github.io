const firebaseConfig = {
  apiKey: "AIzaSyDSYAhAuc0HTgoQBRK1ofwIqNTRdNtcegY",
  authDomain: "booking-viajeros.firebaseapp.com",
  projectId: "booking-viajeros",
  storageBucket: "booking-viajeros.firebasestorage.app",
  messagingSenderId: "42042931651",
  appId: "1:42042931651:web:50d6da6f4366d07ea7a576"
};

const firebaseApp = window.firebase;

if (!firebaseApp.apps || firebaseApp.apps.length === 0) {
  firebaseApp.initializeApp(firebaseConfig);
}

if (window.firebase && firebase.firestore && firebase.firestore.setLogLevel) {
  firebase.firestore.setLogLevel('error');
}

const auth = firebaseApp.auth();
const db = firebaseApp.firestore();

// ✅ AÑADE ESTO
const FieldValue = firebaseApp.firestore.FieldValue;
const serverTimestamp = () => FieldValue.serverTimestamp();
const increment = (n) => FieldValue.increment(n);

const storage = firebaseApp.storage();
export { auth, db, storage, firebaseApp as firebase, FieldValue, serverTimestamp, increment };