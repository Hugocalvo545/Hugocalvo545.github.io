import { state } from './state.js';
import { LEVELS } from './config.js';

export function getUserLevel(points) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].min) return LEVELS[i].nivel;
  }
  return 1;
}

export function getLevelInfo(levelNum) {
  return LEVELS.find(l => l.nivel === levelNum) || LEVELS[0];
}

export function getDiscountForLevel(levelNum) {
  const l = LEVELS.find(x => x.nivel === levelNum);
  return l ? l.discount : 0;
}

export function updateLevelDisplay() {
  const level = getLevelInfo(state.currentLevel);
  const nextLevel = LEVELS.find(l => l.nivel === state.currentLevel + 1);
  const levelRange = nextLevel ? (nextLevel.min - level.min) : 1000;
  const pointsInLevel = state.userPoints - level.min;
  const pct = Math.min(Math.max((pointsInLevel / levelRange) * 100, 0), 100);

  const levelNumber = document.getElementById('levelNumber');
  const levelName = document.getElementById('levelName');
  const levelReward = document.getElementById('levelReward');
  const levelBadge = document.getElementById('levelBadge');
  const progressBar = document.getElementById('levelProgressBar');
  const discountBadge = document.getElementById('discountBadge');

  if (!levelNumber) return;

  levelNumber.textContent = level.nivel;
  levelName.textContent = level.nombre;
  levelReward.textContent = '🎁 ' + level.recompensa;
  levelBadge.textContent = level.nombre;
  progressBar.style.width = pct + '%';

  if (level.discount > 0) {
    discountBadge.textContent = '🎉 Descuento ' + level.discount + '%';
    discountBadge.style.background = '#27ae60';
  } else {
    discountBadge.textContent = 'Sin descuento';
    discountBadge.style.background = '#95a5a6';
  }
}

export function updatePointsDisplay() {
  const el = document.getElementById('pointsDisplay');
  if (el) el.textContent = state.userPoints || 0;
}

export function displayUserProfile() {
  const u = state.userData || {};
  const fullName =
    ((u.name || '') + ' ' + (u.surname || '')).trim() || 'Usuario';

  const profileFullName = document.getElementById('profileFullName');
  const profileEmail = document.getElementById('profileEmail');
  if (profileFullName) profileFullName.textContent = fullName;
  if (profileEmail) profileEmail.textContent = u.email || '-';

  const set = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.textContent = v || '-';
  };

  set('pEmail', u.email);
  set('pPhone', u.phone);
  set('pDocType', u.docType);
  set('pDocNumber', u.docNumber);
  set('pNationality', u.nationality);
  set('pBirthDate', u.birthDate);

  set('pCountry', u.country);
  set('pAddress', u.address);
  set('pCity', u.city);
  set('pZipcode', u.zipcode);
  set('pProvince', u.province);

  updateLevelDisplay();
  updatePointsDisplay();
}

export function showProfileScreen() {
  const login = document.getElementById('loginScreen');
  const profile = document.getElementById('profileScreen');
  const booking = document.getElementById('bookingScreen');
  if (login) login.classList.remove('active');
  if (profile) profile.classList.add('active');
  if (booking) booking.style.display = 'none';
}
