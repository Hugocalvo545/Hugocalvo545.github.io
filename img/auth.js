import { auth, db } from './firebase.js';
import { state } from './state.js';

export function switchTab(tab) {
  const tabs = document.querySelectorAll('.login-tab');
  const loginTab = document.getElementById('loginTab');
  const registerTab = document.getElementById('registerTab');

  tabs.forEach(t => t.classList.remove('active'));

  if (tab === 'login') {
    tabs[0]?.classList.add('active');
    if (loginTab) {
      loginTab.classList.add('active');
      loginTab.style.display = 'block';
    }
    if (registerTab) {
      registerTab.classList.remove('active');
      registerTab.style.display = 'none';
    }
  } else {
    tabs[1]?.classList.add('active');
    if (loginTab) {
      loginTab.classList.remove('active');
      loginTab.style.display = 'none';
    }
    if (registerTab) {
      registerTab.classList.add('active');
      registerTab.style.display = 'block';
    }
  }
}

export function regNextStep() {
  const name = document.getElementById('regName').value.trim();
  const surname = document.getElementById('regSurname').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const password = document.getElementById('regPassword').value;
  const passwordConfirm = document.getElementById('regPasswordConfirm').value;
  const msg = document.getElementById('regStep1Message');

  if (!name || !surname || !email || !phone || !password || !passwordConfirm) {
    msg.innerHTML = '<div class="error-message">⚠️ Completa todos los campos</div>';
    return;
  }
  if (password.length < 8) {
    msg.innerHTML = '<div class="error-message">⚠️ Mínimo 8 caracteres</div>';
    return;
  }
  if (password !== passwordConfirm) {
    msg.innerHTML = '<div class="error-message">❌ Las contraseñas no coinciden</div>';
    return;
  }

  localStorage.setItem('regTemp', JSON.stringify({ name, surname, email, phone, password }));

  document.getElementById('regStep1Form').classList.remove('active');
  document.getElementById('regStep2Form').classList.add('active');
  document.getElementById('regStep1').classList.remove('active');
  document.getElementById('regStep1').classList.add('completed');
  document.getElementById('regStep2').classList.add('active');
  document.getElementById('regLine').classList.add('active');
}

export function regPrevStep() {
  document.getElementById('regStep2Form').classList.remove('active');
  document.getElementById('regStep1Form').classList.add('active');
  document.getElementById('regStep1').classList.add('active');
  document.getElementById('regStep2').classList.remove('active');
  document.getElementById('regLine').classList.remove('active');
}

export function initAuth(onUserLoggedIn) {
  const loginForm = document.getElementById('loginForm');
  const loginMsg = document.getElementById('loginMessage');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;

      try {
        loginMsg.innerHTML = '<div class="loading-message"><span class="loading-spinner"></span>Iniciando sesión...</div>';
        await auth.signInWithEmailAndPassword(email, password);
      } catch (err) {
        loginMsg.innerHTML = '<div class="error-message">❌ ' + err.message + '</div>';
      }
    });
  }

  const registerForm = document.getElementById('registerForm');
  const registerMsg = document.getElementById('registerMessage');

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const temp = JSON.parse(localStorage.getItem('regTemp') || '{}');

      if (!document.getElementById('regTerms').checked) {
        registerMsg.innerHTML = '<div class="error-message">❌ Acepta los términos</div>';
        return;
      }

      try {
        const cred = await auth.createUserWithEmailAndPassword(temp.email, temp.password);
        const user = cred.user;

        const profile = {
          name: temp.name,
          surname: temp.surname,
          email: temp.email,
          phone: temp.phone,
          docType: document.getElementById('docType').value,
          docNumber: document.getElementById('docNumber').value,
          nationality: document.getElementById('nationality').value,
          birthDate: `${document.getElementById('birthDay').value}/${document.getElementById('birthMonth').value}/${document.getElementById('birthYear').value}`,
          country: document.getElementById('country').value,
          address: document.getElementById('address').value,
          city: document.getElementById('city').value,
          zipcode: document.getElementById('zipcode').value,
          province: document.getElementById('province').value,
          points: 0,
          createdAt: new Date()
        };

        await db.collection('usuarios').doc(user.uid).set(profile);
        localStorage.removeItem('regTemp');

        registerMsg.innerHTML = '<div class="success-message">✓ Cuenta creada</div>';
      } catch (err) {
        registerMsg.innerHTML = '<div class="error-message">❌ ' + err.message + '</div>';
      }
    });
  }

  auth.onAuthStateChanged((user) => {
    if (user) {
      state.currentUser = { uid: user.uid, email: user.email };
      onUserLoggedIn(user);
    } else {
      state.currentUser = null;
    }
  });
}
