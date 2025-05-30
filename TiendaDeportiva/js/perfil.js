document.addEventListener('DOMContentLoaded', function() {
  // Inicializa Firebase solo si no está inicializado
  if (!firebase.apps.length) {
    const firebaseConfig = {
      apiKey: "AIzaSyCnMqHAkR9WTVpPOrVLfTTvi068w0x9QaI",
      authDomain: "digideporte.firebaseapp.com",
      projectId: "digideporte",
      storageBucket: "digideporte.firebasestorage.app",
      messagingSenderId: "412954853887",
      appId: "1:412954853887:web:b65b18b181d057cb51e7ca",
      measurementId: "G-88JXMY13QZ"
    };
    firebase.initializeApp(firebaseConfig);
  }
  const auth = firebase.auth();

  // Traduce errores de Firebase
  function traducirError(error) {
    switch (error.code) {
      case 'auth/invalid-email': return 'El formato del email no es válido.';
      case 'auth/user-not-found': return 'No existe un usuario con este email.';
      case 'auth/wrong-password': return 'Contraseña incorrecta.';
      case 'auth/weak-password': return 'La contraseña debe tener al menos 6 caracteres.';
      case 'auth/email-already-in-use': return 'Este email ya está registrado.';
      case 'auth/requires-recent-login': return 'Debes volver a iniciar sesión para cambiar datos sensibles.';
      default: return 'Ocurrió un error. Inténtalo de nuevo.';
    }
  }

  // Mostrar datos de usuario
  auth.onAuthStateChanged(function(user) {
    if (user) {
      user.reload().then(() => {
        document.getElementById('perfil-email').textContent = user.email;
        document.getElementById('perfil-nombre').textContent = user.displayName || "(Sin nombre)";
        document.getElementById('perfil-fecha').textContent = new Date(user.metadata.creationTime).toLocaleDateString();
      });
    } else {
      window.location.href = "login.html";
    }
  });  

  // Guardar cambios de perfil
  const formEditar = document.getElementById('form-editar-perfil');
  if (formEditar) {
    formEditar.addEventListener('submit', async function(e) {
      e.preventDefault();
      const user = auth.currentUser;
      const nuevoNombre = document.getElementById('nuevo-nombre').value.trim();
      const nuevaPassword = document.getElementById('nueva-password').value.trim();
      const errorDiv = document.getElementById('perfil-error');
      errorDiv.style.display = 'none';

      try {
        if (nuevoNombre && nuevoNombre !== user.displayName) {
          await user.updateProfile({ displayName: nuevoNombre });
        }
        if (nuevaPassword) {
          await user.updatePassword(nuevaPassword);
        }
        alert('¡Perfil actualizado!');
        window.location.reload();
      } catch (error) {
        errorDiv.textContent = traducirError(error);
        errorDiv.style.display = 'block';
      }
    });
  }

  // Cerrar sesión
  const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');
  if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener('click', function() {
      auth.signOut().then(() => window.location.href = "login.html");
    });
  }
});
