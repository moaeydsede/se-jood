import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
} from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyBc-zCwcSNsVupzAAHWeUWKGHLdcrzg2iQ',
  authDomain: 'erp-pro-7307c.firebaseapp.com',
  projectId: 'erp-pro-7307c',
  storageBucket: 'erp-pro-7307c.firebasestorage.app',
  messagingSenderId: '481869823115',
  appId: '1:481869823115:web:68ea96d2a4ef5b732fa88e',
};

const ADMIN_UID = 'JxKXouwjdadht4wSMPf1qtbeW9n1';
const SECRET_TAPS = 7;
const SECRET_WINDOW_MS = 5000;
const COMPANY_DOC_PATH = ['settings', 'companyProfile'];

const defaultProfile = {
  companyName: 'Jood Kids',
  logoUrl: './assets/jood-logo.png',
  workingHours: 'السبت - الخميس | 9:00 ص - 10:00 م',
  phones: ['+966 500 000 000'],
  whatsappNumber: '+966500000000',
  email: 'info@joodkids.com',
  websiteUrl: '',
  seasons: ['رمضان', 'العيد', 'الصيف', 'الشتاء'],
  locations: [
    { title: 'الفرع الرئيسي', address: 'المدينة - الحي - العنوان', mapUrl: '' },
  ],
  facebookUrl: '',
  instagramUrl: '',
  xUrl: '',
  tiktokUrl: '',
  snapchatUrl: '',
  linkedinUrl: '',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const elements = {
  heroLogo: document.getElementById('heroLogo'),
  heroCompanyName: document.getElementById('heroCompanyName'),
  websiteLinkTop: document.getElementById('websiteLinkTop'),
  contactGrid: document.getElementById('contactGrid'),
  socialStrip: document.getElementById('socialStrip'),
  hoursCard: document.getElementById('hoursCard'),
  workingHoursText: document.getElementById('workingHoursText'),
  locationsCard: document.getElementById('locationsCard'),
  locationsList: document.getElementById('locationsList'),
  surveyForm: document.getElementById('surveyForm'),
  season: document.getElementById('season'),
  surveyStatus: document.getElementById('surveyStatus'),
  thankYouCard: document.getElementById('thankYouCard'),
  brandSecretButton: document.getElementById('brandSecretButton'),
  nextToStep2: document.getElementById('nextToStep2'),
  nextToStep3: document.getElementById('nextToStep3'),
  backToStep1: document.getElementById('backToStep1'),
  backToStep2: document.getElementById('backToStep2'),
  stepPanels: [...document.querySelectorAll('[data-step-panel]')],
  stepDots: [...document.querySelectorAll('[data-step-dot]')],
  adminModal: document.getElementById('adminModal'),
  adminBackdrop: document.getElementById('adminBackdrop'),
  closeAdminBtn: document.getElementById('closeAdminBtn'),
  adminGate: document.getElementById('adminGate'),
  adminDashboard: document.getElementById('adminDashboard'),
  adminLoginForm: document.getElementById('adminLoginForm'),
  adminLoginStatus: document.getElementById('adminLoginStatus'),
  adminUserUid: document.getElementById('adminUserUid'),
  logoutBtn: document.getElementById('logoutBtn'),
  adminTabs: [...document.querySelectorAll('[data-admin-tab]')],
  adminTabOverview: document.getElementById('adminTabOverview'),
  adminTabCompany: document.getElementById('adminTabCompany'),
  adminTabResponses: document.getElementById('adminTabResponses'),
  statResponses: document.getElementById('statResponses'),
  statProduct: document.getElementById('statProduct'),
  statService: document.getElementById('statService'),
  statUpdated: document.getElementById('statUpdated'),
  seasonAverages: document.getElementById('seasonAverages'),
  companySettingsForm: document.getElementById('companySettingsForm'),
  settingsStatus: document.getElementById('settingsStatus'),
  companyNameInput: document.getElementById('companyNameInput'),
  companyLogoInput: document.getElementById('companyLogoInput'),
  companyHoursInput: document.getElementById('companyHoursInput'),
  companyPhonesInput: document.getElementById('companyPhonesInput'),
  companyWhatsappInput: document.getElementById('companyWhatsappInput'),
  companyEmailInput: document.getElementById('companyEmailInput'),
  companyWebsiteInput: document.getElementById('companyWebsiteInput'),
  seasonsInput: document.getElementById('seasonsInput'),
  locationsInput: document.getElementById('locationsInput'),
  facebookInput: document.getElementById('facebookInput'),
  instagramInput: document.getElementById('instagramInput'),
  xInput: document.getElementById('xInput'),
  tiktokInput: document.getElementById('tiktokInput'),
  snapchatInput: document.getElementById('snapchatInput'),
  linkedinInput: document.getElementById('linkedinInput'),
  responseSeasonFilter: document.getElementById('responseSeasonFilter'),
  responseSearchInput: document.getElementById('responseSearchInput'),
  responsesTableBody: document.getElementById('responsesTableBody'),
  exportCsvBtn: document.getElementById('exportCsvBtn'),
};

let activeProfile = { ...defaultProfile };
let currentStep = 1;
let tapTimestamps = [];
let allResponses = [];

init();

async function init() {
  buildRatingButtons();
  bindEvents();
  await loadCompanyProfile();
  updateStepUI();
  listenToAuth();
}

function bindEvents() {
  elements.brandSecretButton.addEventListener('click', handleSecretTap);
  elements.surveyForm.addEventListener('submit', handleSurveySubmit);
  elements.nextToStep2.addEventListener('click', () => validateStepOne() && setStep(2));
  elements.nextToStep3.addEventListener('click', () => validateStepTwo() && setStep(3));
  elements.backToStep1.addEventListener('click', () => setStep(1));
  elements.backToStep2.addEventListener('click', () => setStep(2));
  document.getElementById('phone').addEventListener('input', formatPhoneInput);

  elements.closeAdminBtn.addEventListener('click', closeAdminModal);
  elements.adminBackdrop.addEventListener('click', closeAdminModal);
  elements.adminLoginForm.addEventListener('submit', handleAdminLogin);
  elements.logoutBtn.addEventListener('click', async () => { await signOut(auth); });
  elements.adminTabs.forEach((btn) => btn.addEventListener('click', () => setAdminTab(btn.dataset.adminTab)));
  elements.companySettingsForm.addEventListener('submit', saveCompanyProfile);
  elements.responseSeasonFilter.addEventListener('change', renderResponsesTable);
  elements.responseSearchInput.addEventListener('input', renderResponsesTable);
  elements.exportCsvBtn.addEventListener('click', exportResponsesCsv);
}

function buildRatingButtons() {
  document.querySelectorAll('.rating-scale').forEach((wrapper) => {
    const fieldId = wrapper.dataset.ratingField;
    for (let value = 1; value <= 5; value += 1) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'rating-btn';
      button.innerHTML = `${starIcon()}<span>${value}</span>`;
      button.addEventListener('click', () => setRating(fieldId, value));
      wrapper.appendChild(button);
    }
  });
}

function setRating(fieldId, value) {
  const input = document.getElementById(fieldId);
  input.value = value ? String(value) : '';
  const buttons = input.parentElement.querySelectorAll('.rating-btn');
  buttons.forEach((btn, index) => btn.classList.toggle('active', index < value));
}

function setStep(step) {
  currentStep = step;
  updateStepUI();
  hideStatus(elements.surveyStatus);
}

function updateStepUI() {
  elements.stepPanels.forEach((panel) => panel.classList.toggle('active', Number(panel.dataset.stepPanel) === currentStep));
  elements.stepDots.forEach((dot) => dot.classList.toggle('active', Number(dot.dataset.stepDot) === currentStep));
}

function validateStepOne() {
  const fields = [
    elements.season,
    document.getElementById('customerName'),
    document.getElementById('phone'),
    document.getElementById('address'),
  ];
  for (const field of fields) {
    if (!field.reportValidity()) return false;
  }
  const phone = document.getElementById('phone').value.trim();
  if (!/^\+?[0-9\s-]{7,20}$/.test(phone)) {
    showStatus(elements.surveyStatus, 'رقم الهاتف غير صالح.', 'error');
    return false;
  }
  return true;
}

function validateStepTwo() {
  const product = Number(document.getElementById('productRating').value);
  const service = Number(document.getElementById('serviceRating').value);
  if (!product || !service) {
    showStatus(elements.surveyStatus, 'اختر تقييمين.', 'error');
    return false;
  }
  return true;
}

async function handleSurveySubmit(event) {
  event.preventDefault();
  if (!validateStepOne() || !validateStepTwo()) return;

  const submitButton = document.getElementById('submitSurveyBtn');
  const payload = {
    season: elements.season.value,
    customerName: document.getElementById('customerName').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    address: document.getElementById('address').value.trim(),
    productRating: Number(document.getElementById('productRating').value),
    serviceRating: Number(document.getElementById('serviceRating').value),
    notes: document.getElementById('notes').value.trim(),
    createdAtMs: Date.now(),
    createdAtText: new Date().toLocaleString('ar-EG'),
  };

  try {
    submitButton.disabled = true;
    showStatus(elements.surveyStatus, 'جاري الإرسال...', 'info');
    await addDoc(collection(db, 'surveyResponses'), payload);
    elements.surveyForm.reset();
    setRating('productRating', 0);
    setRating('serviceRating', 0);
    setStep(1);
    showStatus(elements.surveyStatus, 'تم الإرسال بنجاح.', 'success');
    showThanks();
    if (auth.currentUser?.uid === ADMIN_UID) {
      await loadResponses();
    }
  } catch (error) {
    showStatus(elements.surveyStatus, humanizeFirebaseError(error), 'error');
  } finally {
    submitButton.disabled = false;
  }
}

function showThanks() {
  elements.thankYouCard.classList.remove('hidden');
  setTimeout(() => elements.thankYouCard.classList.add('hidden'), 2400);
}

function formatPhoneInput(event) {
  event.target.value = event.target.value.replace(/[^0-9+\-\s]/g, '');
}

function handleSecretTap() {
  const now = Date.now();
  tapTimestamps = tapTimestamps.filter((ts) => now - ts < SECRET_WINDOW_MS);
  tapTimestamps.push(now);
  if (tapTimestamps.length >= SECRET_TAPS) {
    tapTimestamps = [];
    openAdminModal();
  }
}

function openAdminModal() {
  elements.adminModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeAdminModal() {
  elements.adminModal.classList.add('hidden');
  document.body.style.overflow = '';
}

function listenToAuth() {
  onAuthStateChanged(auth, async (user) => {
    if (user && user.uid === ADMIN_UID) {
      elements.adminGate.classList.add('hidden');
      elements.adminDashboard.classList.remove('hidden');
      elements.adminUserUid.textContent = user.uid;
      hideStatus(elements.adminLoginStatus);
      await Promise.all([loadCompanyProfile(true), loadResponses()]);
      return;
    }

    elements.adminDashboard.classList.add('hidden');
    elements.adminGate.classList.remove('hidden');
    if (user && user.uid !== ADMIN_UID) {
      showStatus(elements.adminLoginStatus, 'هذا الحساب ليس الأدمن المعتمد.', 'error');
      await signOut(auth);
    }
  });
}

async function handleAdminLogin(event) {
  event.preventDefault();
  const email = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value;
  try {
    showStatus(elements.adminLoginStatus, 'جاري التحقق...', 'info');
    const credential = await signInWithEmailAndPassword(auth, email, password);
    if (credential.user.uid !== ADMIN_UID) {
      await signOut(auth);
      showStatus(elements.adminLoginStatus, 'UID غير مطابق.', 'error');
      return;
    }
    showStatus(elements.adminLoginStatus, 'تم الدخول.', 'success');
  } catch (error) {
    showStatus(elements.adminLoginStatus, humanizeFirebaseError(error), 'error');
  }
}

function setAdminTab(tab) {
  elements.adminTabs.forEach((btn) => btn.classList.toggle('active', btn.dataset.adminTab === tab));
  elements.adminTabOverview.classList.toggle('active', tab === 'overview');
  elements.adminTabCompany.classList.toggle('active', tab === 'company');
  elements.adminTabResponses.classList.toggle('active', tab === 'responses');
}

async function loadCompanyProfile(fillAdmin = false) {
  try {
    const snap = await getDoc(doc(db, ...COMPANY_DOC_PATH));
    activeProfile = snap.exists() ? normalizeProfile(snap.data()) : { ...defaultProfile };
  } catch (error) {
    console.error(error);
    activeProfile = { ...defaultProfile };
  }
  renderPublicProfile(activeProfile);
  if (fillAdmin) populateCompanyForm(activeProfile);
}

function normalizeProfile(data = {}) {
  const normalizedLocations = Array.isArray(data.locations) && data.locations.length
    ? data.locations.map((item) => ({
        title: item?.title?.trim?.() || 'فرع',
        address: item?.address?.trim?.() || '',
        mapUrl: item?.mapUrl?.trim?.() || '',
      })).filter((item) => item.address)
    : defaultProfile.locations;

  return {
    ...defaultProfile,
    ...data,
    phones: Array.isArray(data.phones) && data.phones.length ? data.phones.filter(Boolean) : defaultProfile.phones,
    seasons: Array.isArray(data.seasons) && data.seasons.length ? data.seasons.filter(Boolean) : defaultProfile.seasons,
    locations: normalizedLocations,
  };
}

function renderPublicProfile(profile) {
  elements.heroCompanyName.textContent = profile.companyName;
  elements.heroLogo.src = profile.logoUrl || defaultProfile.logoUrl;

  if (profile.websiteUrl) {
    elements.websiteLinkTop.classList.remove('hidden');
    elements.websiteLinkTop.href = profile.websiteUrl;
  } else {
    elements.websiteLinkTop.classList.add('hidden');
  }

  elements.hoursCard.classList.toggle('hidden', !profile.workingHours);
  elements.workingHoursText.textContent = profile.workingHours || '';

  renderContactActions(profile);
  renderSocialLinks(profile);
  renderLocations(profile.locations);
  renderSeasons(profile.seasons);
}

function renderContactActions(profile) {
  const actions = [];
  if (profile.phones?.[0]) actions.push({ label: 'اتصال', value: profile.phones[0], href: `tel:${profile.phones[0]}`, icon: phoneIcon() });
  if (profile.whatsappNumber) actions.push({ label: 'واتساب', value: profile.whatsappNumber, href: `https://wa.me/${profile.whatsappNumber.replace(/\D/g, '')}`, icon: whatsappIcon() });
  if (profile.email) actions.push({ label: 'بريد', value: profile.email, href: `mailto:${profile.email}`, icon: mailIcon() });
  if (profile.websiteUrl) actions.push({ label: 'الموقع', value: 'فتح', href: profile.websiteUrl, icon: globeIcon() });

  elements.contactGrid.innerHTML = actions.map((item) => `
    <a class="action-tile" href="${escapeAttribute(item.href)}" target="_blank" rel="noopener noreferrer">
      <span class="icon-holder">${item.icon}</span>
      <span class="action-tile__label">${escapeHtml(item.label)}</span>
      <span class="action-tile__value">${escapeHtml(item.value)}</span>
    </a>
  `).join('');
}

function renderSocialLinks(profile) {
  const links = [
    { href: profile.facebookUrl, label: 'Facebook', icon: facebookIcon() },
    { href: profile.instagramUrl, label: 'Instagram', icon: instagramIcon() },
    { href: profile.xUrl, label: 'X', icon: xIcon() },
    { href: profile.tiktokUrl, label: 'TikTok', icon: tiktokIcon() },
    { href: profile.snapchatUrl, label: 'Snapchat', icon: snapchatIcon() },
    { href: profile.linkedinUrl, label: 'LinkedIn', icon: linkedinIcon() },
  ].filter((item) => item.href);

  elements.socialStrip.innerHTML = links.map((item) => `
    <a class="social-link" href="${escapeAttribute(item.href)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeAttribute(item.label)}">
      ${item.icon}
    </a>
  `).join('');
}

function renderLocations(locations) {
  const safeLocations = locations?.length ? locations : defaultProfile.locations;
  elements.locationsCard.classList.toggle('hidden', !safeLocations.length);
  elements.locationsList.innerHTML = safeLocations.map((item) => `
    <article class="location-item">
      <div class="location-top">
        <div class="location-title">${escapeHtml(item.title || 'فرع')}</div>
        <div class="location-address">${escapeHtml(item.address || '')}</div>
      </div>
      ${item.mapUrl ? `<div class="location-action-row"><a class="map-link" href="${escapeAttribute(item.mapUrl)}" target="_blank" rel="noopener noreferrer"><span class="map-mini">${mapPinIcon()}</span><span>فتح على الخريطة</span></a></div>` : ''}
    </article>
  `).join('');
}

function renderSeasons(seasons) {
  const safeSeasons = seasons?.length ? seasons : defaultProfile.seasons;
  elements.season.innerHTML = safeSeasons.map((item) => `<option value="${escapeAttribute(item)}">${escapeHtml(item)}</option>`).join('');
  elements.responseSeasonFilter.innerHTML = '<option value="all">كل المواسم</option>' + safeSeasons.map((item) => `<option value="${escapeAttribute(item)}">${escapeHtml(item)}</option>`).join('');
}

function populateCompanyForm(profile) {
  elements.companyNameInput.value = profile.companyName || '';
  elements.companyLogoInput.value = profile.logoUrl || '';
  elements.companyHoursInput.value = profile.workingHours || '';
  elements.companyPhonesInput.value = (profile.phones || []).join('\n');
  elements.companyWhatsappInput.value = profile.whatsappNumber || '';
  elements.companyEmailInput.value = profile.email || '';
  elements.companyWebsiteInput.value = profile.websiteUrl || '';
  elements.seasonsInput.value = (profile.seasons || []).join('\n');
  elements.locationsInput.value = (profile.locations || []).map((item) => `${item.title} | ${item.address} | ${item.mapUrl || ''}`).join('\n');
  elements.facebookInput.value = profile.facebookUrl || '';
  elements.instagramInput.value = profile.instagramUrl || '';
  elements.xInput.value = profile.xUrl || '';
  elements.tiktokInput.value = profile.tiktokUrl || '';
  elements.snapchatInput.value = profile.snapchatUrl || '';
  elements.linkedinInput.value = profile.linkedinUrl || '';
}

async function saveCompanyProfile(event) {
  event.preventDefault();
  if (auth.currentUser?.uid !== ADMIN_UID) {
    showStatus(elements.settingsStatus, 'غير مصرح لك.', 'error');
    return;
  }

  const profile = {
    companyName: elements.companyNameInput.value.trim() || defaultProfile.companyName,
    logoUrl: elements.companyLogoInput.value.trim() || defaultProfile.logoUrl,
    workingHours: elements.companyHoursInput.value.trim(),
    phones: splitLines(elements.companyPhonesInput.value),
    whatsappNumber: elements.companyWhatsappInput.value.trim(),
    email: elements.companyEmailInput.value.trim(),
    websiteUrl: elements.companyWebsiteInput.value.trim(),
    seasons: splitLines(elements.seasonsInput.value).length ? splitLines(elements.seasonsInput.value) : defaultProfile.seasons,
    locations: parseLocations(elements.locationsInput.value),
    facebookUrl: elements.facebookInput.value.trim(),
    instagramUrl: elements.instagramInput.value.trim(),
    xUrl: elements.xInput.value.trim(),
    tiktokUrl: elements.tiktokInput.value.trim(),
    snapchatUrl: elements.snapchatInput.value.trim(),
    linkedinUrl: elements.linkedinInput.value.trim(),
  };

  try {
    showStatus(elements.settingsStatus, 'جاري الحفظ...', 'info');
    await setDoc(doc(db, ...COMPANY_DOC_PATH), profile, { merge: true });
    activeProfile = normalizeProfile(profile);
    renderPublicProfile(activeProfile);
    showStatus(elements.settingsStatus, 'تم الحفظ.', 'success');
  } catch (error) {
    showStatus(elements.settingsStatus, humanizeFirebaseError(error), 'error');
  }
}

async function loadResponses() {
  try {
    const q = query(collection(db, 'surveyResponses'), orderBy('createdAtMs', 'desc'), limit(300));
    const snapshot = await getDocs(q);
    allResponses = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  } catch (error) {
    console.error(error);
    allResponses = [];
  }
  renderDashboardStats();
  renderSeasonAverages();
  renderResponsesTable();
}

function renderDashboardStats() {
  const total = allResponses.length;
  const avgProduct = total ? average(allResponses.map((item) => Number(item.productRating) || 0)) : 0;
  const avgService = total ? average(allResponses.map((item) => Number(item.serviceRating) || 0)) : 0;
  elements.statResponses.textContent = String(total);
  elements.statProduct.textContent = avgProduct.toFixed(1);
  elements.statService.textContent = avgService.toFixed(1);
  elements.statUpdated.textContent = total ? allResponses[0].createdAtText : '—';
}

function renderSeasonAverages() {
  const grouped = groupBySeason(allResponses);
  const keys = Object.keys(grouped);
  if (!keys.length) {
    elements.seasonAverages.innerHTML = '<div class="empty-state">لا توجد بيانات</div>';
    return;
  }
  elements.seasonAverages.innerHTML = keys.map((season) => {
    const items = grouped[season];
    const avg = average(items.map((item) => (Number(item.productRating) + Number(item.serviceRating)) / 2));
    return `
      <div class="avg-row">
        <div class="avg-meta"><span>${escapeHtml(season)}</span><strong>${avg.toFixed(1)} / 5</strong></div>
        <div class="avg-track"><div class="avg-fill" style="width:${Math.min((avg / 5) * 100, 100)}%"></div></div>
      </div>
    `;
  }).join('');
}

function renderResponsesTable() {
  const seasonFilter = elements.responseSeasonFilter.value;
  const search = elements.responseSearchInput.value.trim().toLowerCase();
  const filtered = allResponses.filter((item) => {
    const seasonOk = !seasonFilter || seasonFilter === 'all' || item.season === seasonFilter;
    const searchOk = !search || `${item.customerName} ${item.phone} ${item.address}`.toLowerCase().includes(search);
    return seasonOk && searchOk;
  });

  if (!filtered.length) {
    elements.responsesTableBody.innerHTML = '<tr><td colspan="7" class="empty-state">لا توجد نتائج</td></tr>';
    return;
  }

  elements.responsesTableBody.innerHTML = filtered.map((item) => `
    <tr>
      <td>${escapeHtml(item.customerName || '—')}</td>
      <td>${escapeHtml(item.phone || '—')}</td>
      <td>${escapeHtml(item.season || '—')}</td>
      <td>${escapeHtml(String(item.productRating || '—'))}</td>
      <td>${escapeHtml(String(item.serviceRating || '—'))}</td>
      <td>${escapeHtml(item.notes || '—')}</td>
      <td>${escapeHtml(item.createdAtText || '—')}</td>
    </tr>
  `).join('');
}

function exportResponsesCsv() {
  const rows = [
    ['الاسم', 'الهاتف', 'العنوان', 'الموسم', 'البضاعة', 'الخدمة', 'الملاحظات', 'التاريخ'],
    ...allResponses.map((item) => [
      item.customerName || '',
      item.phone || '',
      item.address || '',
      item.season || '',
      item.productRating || '',
      item.serviceRating || '',
      item.notes || '',
      item.createdAtText || '',
    ]),
  ];
  const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'jood-feedback.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  const str = String(value ?? '');
  return `"${str.replaceAll('"', '""')}"`;
}

function parseLocations(text) {
  const parsed = text.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
    const [title = 'فرع', address = '', mapUrl = ''] = line.split('|').map((part) => part.trim());
    return { title, address, mapUrl };
  }).filter((item) => item.address);
  return parsed.length ? parsed : defaultProfile.locations;
}

function splitLines(value) {
  return value.split('\n').map((line) => line.trim()).filter(Boolean);
}

function groupBySeason(items) {
  return items.reduce((acc, item) => {
    const key = item.season || 'غير محدد';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function showStatus(element, message, type = 'info') {
  element.textContent = message;
  element.className = `status-box ${type}`;
}

function hideStatus(element) {
  element.textContent = '';
  element.className = 'status-box hidden';
}

function humanizeFirebaseError(error) {
  const map = {
    'auth/invalid-credential': 'بيانات الدخول غير صحيحة.',
    'auth/invalid-email': 'صيغة البريد الإلكتروني غير صحيحة.',
    'auth/user-not-found': 'المستخدم غير موجود.',
    'auth/wrong-password': 'كلمة المرور غير صحيحة.',
    'permission-denied': 'ليس لديك صلاحية.',
  };
  return map[error.code] || error.message || 'حدث خطأ غير متوقع.';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('`', '&#096;');
}

function phoneIcon() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07A19.5 19.5 0 0 1 5.15 12.8 19.8 19.8 0 0 1 2.08 4.11 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.63 2.62a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.46-1.15a2 2 0 0 1 2.11-.45c.84.3 1.72.51 2.62.63A2 2 0 0 1 22 16.92z"></path></svg>`; }
function whatsappIcon() { return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.52 3.48A11.86 11.86 0 0 0 12.02 0C5.4 0 .02 5.38.02 12c0 2.11.55 4.16 1.6 5.97L0 24l6.2-1.62A11.98 11.98 0 0 0 12.02 24h.01c6.61 0 11.99-5.38 11.99-12 0-3.2-1.25-6.2-3.5-8.52z"></path></svg>`; }
function mailIcon() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="m3 7 9 6 9-6"></path></svg>`; }
function globeIcon() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"></circle><path d="M3 12h18"></path><path d="M12 3a14 14 0 0 1 4 9 14 14 0 0 1-4 9 14 14 0 0 1-4-9 14 14 0 0 1 4-9z"></path></svg>`; }
function mapPinIcon() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M12 21s-6-5.1-6-10.5a6 6 0 1 1 12 0C18 15.9 12 21 12 21Z"></path><circle cx="12" cy="10.5" r="2.2"></circle></svg>`; }
function starIcon() { return `<svg class="star-icon" viewBox="0 0 24 24" fill="currentColor"><path d="m12 17.3-5.39 3.24 1.43-6.14L3 9.8l6.47-.55L12 3.5l2.53 5.75 6.47.55-5.04 4.6 1.43 6.14z"></path></svg>`; }
function facebookIcon() { return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.6 1.6-1.6H17V4.8c-.8-.1-1.6-.2-2.4-.2-2.4 0-4.1 1.5-4.1 4.2V11H8v3h2.5v8h3z"></path></svg>`; }
function instagramIcon() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle cx="17.5" cy="6.5" r="1"></circle></svg>`; }
function xIcon() { return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-6.8 7.77L23 22h-6.2l-4.86-6.35L6.36 22H3.24l7.28-8.32L1 2h6.35l4.4 5.8L18.9 2z"></path></svg>`; }
function tiktokIcon() { return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 3h3.02A5.98 5.98 0 0 0 21 7.98V11a8.9 8.9 0 0 1-4-1v6.45A5.45 5.45 0 1 1 11.55 11a5.4 5.4 0 0 1 1.45.2v3.18a2.3 2.3 0 1 0 1 1.9V3z"></path></svg>`; }
function snapchatIcon() { return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c3 0 5 2 5 5v3.1c0 .6.3 1.2.8 1.5.4.2.8.3 1.2.4.4.1.6.5.5.9-.2.5-.8.8-1.6 1-.5.1-.8.5-.9 1-.1.6-.4 1.3-1.2 1.5-.6.2-1.2.3-1.8.3-.3.9-.9 1.3-2 1.3s-1.7-.4-2-1.3c-.6 0-1.2-.1-1.8-.3-.8-.2-1.1-.9-1.2-1.5-.1-.5-.4-.9-.9-1-.8-.2-1.4-.5-1.6-1-.1-.4.1-.8.5-.9.4-.1.8-.2 1.2-.4.5-.3.8-.9.8-1.5V7c0-3 2-5 5-5z"></path></svg>`; }
function linkedinIcon() { return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.94 8.5H3.56V20h3.38V8.5zM5.25 3A1.97 1.97 0 1 0 5.3 6.94 1.97 1.97 0 0 0 5.25 3zM20.44 13.11c0-3.45-1.84-5.05-4.3-5.05-1.98 0-2.86 1.09-3.36 1.86V8.5H9.4c.04.94 0 11.5 0 11.5h3.38v-6.42c0-.34.02-.68.13-.92.27-.68.88-1.38 1.91-1.38 1.35 0 1.89 1.03 1.89 2.54V20h3.38v-6.89z"></path></svg>`; }
