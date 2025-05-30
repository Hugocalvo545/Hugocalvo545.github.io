// 1. Configuración de Firebase
document.addEventListener('DOMContentLoaded', function() {
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
  const auth = firebase.auth();

  // 2. Cambia entre formularios
  function switchForm(tipo) {
    document.getElementById('btn-login').classList.toggle('active', tipo === 'login');
    document.getElementById('btn-registro').classList.toggle('active', tipo === 'registro');
    document.getElementById('form-login').classList.toggle('active', tipo === 'login');
    document.getElementById('form-registro').classList.toggle('active', tipo === 'registro');
    // Limpia errores al cambiar de formulario
    document.getElementById('login-error').style.display = 'none';
    document.getElementById('registro-error').style.display = 'none';
  };

  // 3. Registro con Firebase
  const formRegistro = document.getElementById('form-registro');
  if (formRegistro) {
    formRegistro.addEventListener('submit', function(e) {
      e.preventDefault();
      const nombre = document.getElementById('registro-nombre').value;
      const email = document.getElementById('registro-email').value;
      const password = document.getElementById('registro-password').value;

      auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
          return userCredential.user.updateProfile({
            displayName: nombre
          });
        })
        .then(() => {
          return auth.currentUser.reload();
        })
        .then(() => {
          alert('¡Registro exitoso! Ahora puedes iniciar sesión.');
          switchForm('login');
        })
        .catch(error => {
          const mensajeError = traducirError(error);
          document.getElementById('registro-error').textContent = mensajeError;
          document.getElementById('registro-error').style.display = 'block';
        });
    });
  }


  // 4. Login con Firebase
  const formLogin = document.getElementById('form-login');
  if (formLogin) {
    formLogin.addEventListener('submit', function(e) {
      e.preventDefault();
      document.getElementById('form-login').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        auth.signInWithEmailAndPassword(email, password)
          .then(() => {
            window.location.href = "perfil.html";
          })
          .catch(error => {
            const mensajeError = traducirError(error);
            document.getElementById('login-error').textContent = mensajeError;
            document.getElementById('login-error').style.display = 'block';
          });
      });
    });
  }

  // 5. Observador de estado de sesión (onAuthStateChanged)
    auth.onAuthStateChanged(function(user) {
      const userLink = document.querySelector('.usuario-icono');
      const path = window.location.pathname;

      if (user) {
        if (userLink) {
          userLink.setAttribute('href', 'perfil.html');
          userLink.setAttribute('title', 'Mi perfil (' + (user.displayName || user.email) + ')');
        }
        if (path.endsWith('login.html')) {
          window.location.href = "index.html";
        }
      } else {
        if (userLink) {
          userLink.setAttribute('href', 'login.html');
          userLink.setAttribute('title', 'Accede o regístrate');
        }
      }
    });
  // 6. Función para traducir errores de Firebase
  function traducirError(error) {
    switch (error.code) {
      case 'auth/invalid-email':
        return 'El formato del email no es válido.';
      case 'auth/user-not-found':
        return 'No existe un usuario con este email.';
      case 'auth/wrong-password':
        return 'Contraseña incorrecta.';
      case 'auth/weak-password':
        return 'La contraseña debe tener al menos 6 caracteres.';
      case 'auth/email-already-in-use':
        return 'Este email ya está registrado.';
      default:
        return 'Ocurrió un error. Inténtalo de nuevo.';
    }
  }
});
