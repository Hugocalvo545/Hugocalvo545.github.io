function switchForm(tipo) {
  document.getElementById('btn-login').classList.toggle('active', tipo === 'login');
  document.getElementById('btn-registro').classList.toggle('active', tipo === 'registro');
  document.getElementById('form-login').classList.toggle('active', tipo === 'login');
  document.getElementById('form-registro').classList.toggle('active', tipo === 'registro');
}
