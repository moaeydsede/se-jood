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
const SECRET_TAPS = 6;
const SECRET_WINDOW_MS = 5000;
const COMPANY_DOC_PATH = ['settings', 'companyProfile'];
const defaultProfile = {
  companyName: 'اسم الشركة',
  shortDescription: 'منصة تقييم احترافية لجمع رأي العملاء.',
  address: 'المدينة - الحي - العنوان',
  googleMapsLink: '',
  workingHours: 'السبت - الخميس | 9:00 ص - 10:00 م',
  phones: ['+966 500 000 000'],
  email: 'info@company.com',
  whatsappNumber: '+966500000000',
  websiteUrl: '',
  logoUrl: './assets/logo-placeholder.svg',
  seasons: ['رمضان', 'العيد', 'الصيف', 'الشتاء'],
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
  heroDescription: document.getElementById('heroDescription'),
  contactGrid: document.getElementById('contactGrid'),
  socialStrip: document.getElementById('socialStrip'),
  locationText: document.getElementById('locationText'),
  workingHoursText: document.getElementById('workingHoursText'),
  mapsLink: document.getElementById('mapsLink'),
  websiteLinkTop: document.getElementById('websiteLinkTop'),
  surveyForm: document.getElementById('surveyForm'),
  surveyStatus: document.getElementById('surveyStatus'),
  thankYouCard: document.getElementById('thankYouCard'),
  season: document.getElementById('season'),
  brandSecretButton: document.getElementById('brandSecretButton'),
  adminModal: document.getElementById('adminModal'),
  adminBackdrop: document.getElementById('adminBackdrop'),
  closeAdminBtn: document.getElementById('closeAdminBtn'),
  adminGate: document.getElementById('adminGate'),
  adminDashboard: document.getElementById('adminDashboard'),
  adminLoginForm: document.getElementById('adminLoginForm'),
  adminLoginStatus: document.getElementById('adminLoginStatus'),
  adminUserUid: document.getElementById('adminUserUid'),
  logoutBtn: document.getElementById('logoutBtn'),
  companySettingsForm: document.getElementById('companySettingsForm'),
  settingsStatus: document.getElementById('settingsStatus'),
  responseSeasonFilter: document.getElementById('responseSeasonFilter'),
  responseSearchInput: document.getElementById('responseSearchInput'),
  responsesTableBody: document.getElementById('responsesTableBody'),
  seasonAverages: document.getElementById('seasonAverages'),
  statResponses: document.getElementById('statResponses'),
  statProduct: document.getElementById('statProduct'),
  statService: document.getElementById('statService'),
  statUpdated: document.getElementById('statUpdated'),
  companyNameInput: document.getElementById('companyNameInput'),
  companyDescriptionInput: document.getElementById('companyDescriptionInput'),
  companyAddressInput: document.getElementById('companyAddressInput'),
  companyMapsInput: document.getElementById('companyMapsInput'),
  companyHoursInput: document.getElementById('companyHoursInput'),
  companyPhonesInput: document.getElementById('companyPhonesInput'),
  companyEmailInput: document.getElementById('companyEmailInput'),
  companyWhatsappInput: document.getElementById('companyWhatsappInput'),
  companyWebsiteInput: document.getElementById('companyWebsiteInput'),
  seasonsInput: document.getElementById('seasonsInput'),
  companyLogoInput: document.getElementById('companyLogoInput'),
  facebookInput: document.getElementById('facebookInput'),
  instagramInput: document.getElementById('instagramInput'),
  xInput: document.getElementById('xInput'),
  tiktokInput: document.getElementById('tiktokInput'),
  snapchatInput: document.getElementById('snapchatInput'),
  linkedinInput: document.getElementById('linkedinInput'),
  nextToStep2: document.getElementById('nextToStep2'),
  nextToStep3: document.getElementById('nextToStep3'),
  backToStep1: document.getElementById('backToStep1'),
  backToStep2: document.getElementById('backToStep2'),
  stepPanels: [...document.querySelectorAll('[data-step-panel]')],
  stepDots: [...document.querySelectorAll('[data-step-dot]')],
  adminTabs: [...document.querySelectorAll('[data-admin-tab]')],
  adminTabOverview: document.getElementById('adminTabOverview'),
  adminTabCompany: document.getElementById('adminTabCompany'),
  adminTabResponses: document.getElementById('adminTabResponses'),
};

let activeProfile = { ...defaultProfile };
let allResponses = [];
let tapTimestamps = [];
let currentStep = 1;

init();

async function init() {
  buildRatingButtons();
  bindEvents();
  await loadCompanyProfile();
  updateStepUI();
  listenToAuth();
}

function bindEvents() {
  elements.surveyForm.addEventListener('submit', handleSurveySubmit);
  elements.brandSecretButton.addEventListener('click', handleSecretTap);
  elements.closeAdminBtn.addEventListener('click', closeAdminModal);
  elements.adminBackdrop.addEventListener('click', closeAdminModal);
  elements.adminLoginForm.addEventListener('submit', handleAdminLogin);
  elements.logoutBtn.addEventListener('click', async () => {
    await signOut(auth);
    showStatus(elements.adminLoginStatus, 'تم تسجيل الخروج.', 'info');
  });
  elements.companySettingsForm.addEventListener('submit', saveCompanyProfile);
  elements.responseSeasonFilter.addEventListener('change', renderResponsesTable);
  elements.responseSearchInput.addEventListener('input', renderResponsesTable);
  elements.nextToStep2.addEventListener('click', () => {
    if (validateStepOne()) setStep(2);
  });
  elements.nextToStep3.addEventListener('click', () => {
    if (validateStepTwo()) setStep(3);
  });
  elements.backToStep1.addEventListener('click', () => setStep(1));
  elements.backToStep2.addEventListener('click', () => setStep(2));
  elements.adminTabs.forEach((btn) => btn.addEventListener('click', () => setAdminTab(btn.dataset.adminTab)));
  document.getElementById('phone').addEventListener('input', formatPhoneInput);
}

function buildRatingButtons() {
  document.querySelectorAll('.stars').forEach((wrapper) => {
    const fieldId = wrapper.dataset.ratingField;
    for (let value = 1; value <= 5; value += 1) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'star-btn';
      button.textContent = value;
      button.addEventListener('click', () => setRating(fieldId, value));
      wrapper.appendChild(button);
    }
  });
}

function setRating(fieldId, value) {
  const hiddenInput = document.getElementById(fieldId);
  hiddenInput.value = value ? String(value) : '';
  const buttons = hiddenInput.parentElement.querySelectorAll('.star-btn');
  buttons.forEach((btn, index) => btn.classList.toggle('active', index < value));
}

function setStep(step) {
  currentStep = step;
  updateStepUI();
  hideStatus(elements.surveyStatus);
}

function updateStepUI() {
  elements.stepPanels.forEach((panel) => {
    panel.classList.toggle('active', Number(panel.dataset.stepPanel) === currentStep);
  });
  elements.stepDots.forEach((dot) => {
    dot.classList.toggle('active', Number(dot.dataset.stepDot) === currentStep);
  });
}

function validateStepOne() {
  const fields = [elements.season, document.getElementById('customerName'), document.getElementById('phone'), document.getElementById('address')];
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
    showStatus(elements.surveyStatus, 'اختر تقييم البضاعة والخدمة.', 'error');
    return false;
  }
  return true;
}

function setAdminTab(tab) {
  elements.adminTabs.forEach((btn) => btn.classList.toggle('active', btn.dataset.adminTab === tab));
  elements.adminTabOverview.classList.toggle('active', tab === 'overview');
  elements.adminTabCompany.classList.toggle('active', tab === 'company');
  elements.adminTabResponses.classList.toggle('active', tab === 'responses');
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
      showStatus(elements.adminLoginStatus, 'UID غير مطابق للمستخدم الإداري.', 'error');
      return;
    }
    showStatus(elements.adminLoginStatus, 'تم الدخول.', 'success');
  } catch (error) {
    showStatus(elements.adminLoginStatus, humanizeFirebaseError(error), 'error');
  }
}

async function loadCompanyProfile(fillAdminForm = false) {
  try {
    const companySnap = await getDoc(doc(db, ...COMPANY_DOC_PATH));
    activeProfile = companySnap.exists() ? normalizeProfile(companySnap.data()) : { ...defaultProfile };
  } catch (error) {
    console.error(error);
    activeProfile = { ...defaultProfile };
  }
  renderPublicProfile(activeProfile);
  if (fillAdminForm) populateAdminForm(activeProfile);
}

function normalizeProfile(data = {}) {
  return {
    ...defaultProfile,
    ...data,
    phones: Array.isArray(data.phones) && data.phones.length ? data.phones : defaultProfile.phones,
    seasons: Array.isArray(data.seasons) && data.seasons.length ? data.seasons : defaultProfile.seasons,
  };
}

function renderPublicProfile(profile) {
  elements.heroCompanyName.textContent = profile.companyName;
  elements.heroLogo.src = profile.logoUrl || './assets/logo-placeholder.svg';
  elements.heroDescription.textContent = profile.shortDescription || '';
  elements.locationText.textContent = profile.address || 'سيتم تحديث العنوان قريبًا';
  elements.workingHoursText.textContent = profile.workingHours || 'ساعات العمل غير محددة';

  if (profile.googleMapsLink) {
    elements.mapsLink.classList.remove('hidden');
    elements.mapsLink.href = profile.googleMapsLink;
  } else {
    elements.mapsLink.classList.add('hidden');
    elements.mapsLink.removeAttribute('href');
  }

  if (profile.websiteUrl) {
    elements.websiteLinkTop.href = profile.websiteUrl;
    elements.websiteLinkTop.target = '_blank';
    elements.websiteLinkTop.rel = 'noopener noreferrer';
  } else {
    elements.websiteLinkTop.href = '#surveyCard';
    elements.websiteLinkTop.removeAttribute('target');
  }

  renderQuickActions(profile);
  renderSocialLinks(profile);
  renderSeasons(profile.seasons);
}

function renderQuickActions(profile) {
  const actions = [];
  if (profile.phones?.[0]) {
    actions.push({ href: `tel:${profile.phones[0]}`, label: 'اتصال', value: profile.phones[0], icon: phoneIcon() });
  }
  if (profile.whatsappNumber) {
    actions.push({ href: `https://wa.me/${profile.whatsappNumber.replace(/\D/g, '')}`, label: 'واتساب', value: profile.whatsappNumber, icon: whatsappIcon() });
  }
  if (profile.email) {
    actions.push({ href: `mailto:${profile.email}`, label: 'بريد', value: profile.email, icon: mailIcon() });
  }
  if (profile.websiteUrl) {
    actions.push({ href: profile.websiteUrl, label: 'الموقع', value: 'فتح', icon: globeIcon() });
  }

  elements.contactGrid.innerHTML = actions
    .map(
      (item) => `
        <a class="quick-action" href="${item.href}" target="_blank" rel="noopener noreferrer">
          <span class="quick-action__icon">${item.icon}</span>
          <span class="quick-action__label">${escapeHtml(item.label)}</span>
          <span class="quick-action__value">${escapeHtml(item.value)}</span>
        </a>
      `,
    )
    .join('');
}

function renderSocialLinks(profile) {
  const socialLinks = [
    { href: profile.facebookUrl, name: 'Facebook', icon: facebookIcon() },
    { href: profile.instagramUrl, name: 'Instagram', icon: instagramIcon() },
    { href: profile.xUrl, name: 'X', icon: xIcon() },
    { href: profile.tiktokUrl, name: 'TikTok', icon: tiktokIcon() },
    { href: profile.snapchatUrl, name: 'Snapchat', icon: snapchatIcon() },
    { href: profile.linkedinUrl, name: 'LinkedIn', icon: linkedinIcon() },
  ].filter((item) => Boolean(item.href));

  elements.socialStrip.innerHTML = socialLinks
    .map(
      (item) => `
        <a class="social-link" href="${item.href}" target="_blank" rel="noopener noreferrer" aria-label="${item.name}">
          <span class="social-icon">${item.icon}</span>
        </a>
      `,
    )
    .join('');
}

function renderSeasons(seasons) {
  const options = seasons.length ? seasons : defaultProfile.seasons;
  elements.season.innerHTML = options.map((season) => `<option value="${escapeAttribute(season)}">${escapeHtml(season)}</option>`).join('');
  elements.responseSeasonFilter.innerHTML = '<option value="all">كل المواسم</option>' +
    options.map((season) => `<option value="${escapeAttribute(season)}">${escapeHtml(season)}</option>`).join('');
}

function populateAdminForm(profile) {
  elements.companyNameInput.value = profile.companyName || '';
  elements.companyDescriptionInput.value = profile.shortDescription || '';
  elements.companyAddressInput.value = profile.address || '';
  elements.companyMapsInput.value = profile.googleMapsLink || '';
  elements.companyHoursInput.value = profile.workingHours || '';
  elements.companyPhonesInput.value = (profile.phones || []).join('\n');
  elements.companyEmailInput.value = profile.email || '';
  elements.companyWhatsappInput.value = profile.whatsappNumber || '';
  elements.companyWebsiteInput.value = profile.websiteUrl || '';
  elements.seasonsInput.value = (profile.seasons || []).join('\n');
  elements.companyLogoInput.value = profile.logoUrl || '';
  elements.facebookInput.value = profile.facebookUrl || '';
  elements.instagramInput.value = profile.instagramUrl || '';
  elements.xInput.value = profile.xUrl || '';
  elements.tiktokInput.value = profile.tiktokUrl || '';
  elements.snapchatInput.value = profile.snapchatUrl || '';
  elements.linkedinInput.value = profile.linkedinUrl || '';
}

async function saveCompanyProfile(event) {
  event.preventDefault();
  if (!auth.currentUser || auth.currentUser.uid !== ADMIN_UID) {
    showStatus(elements.settingsStatus, 'غير مصرح لك.', 'error');
    return;
  }

  const profile = {
    companyName: elements.companyNameInput.value.trim() || defaultProfile.companyName,
    shortDescription: elements.companyDescriptionInput.value.trim() || defaultProfile.shortDescription,
    address: elements.companyAddressInput.value.trim(),
    googleMapsLink: elements.companyMapsInput.value.trim(),
    workingHours: elements.companyHoursInput.value.trim(),
    phones: splitLines(elements.companyPhonesInput.value),
    email: elements.companyEmailInput.value.trim(),
    whatsappNumber: elements.companyWhatsappInput.value.trim(),
    websiteUrl: elements.companyWebsiteInput.value.trim(),
    seasons: splitLines(elements.seasonsInput.value).length ? splitLines(elements.seasonsInput.value) : defaultProfile.seasons,
    logoUrl: elements.companyLogoInput.value.trim() || defaultProfile.logoUrl,
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
    showStatus(elements.settingsStatus, 'تم الحفظ بنجاح.', 'success');
  } catch (error) {
    showStatus(elements.settingsStatus, humanizeFirebaseError(error), 'error');
  }
}

async function handleSurveySubmit(event) {
  event.preventDefault();
  if (!validateStepOne() || !validateStepTwo()) return;
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
    const submitButton = document.getElementById('submitSurveyBtn');
    submitButton.disabled = true;
    showStatus(elements.surveyStatus, 'جاري الإرسال...', 'info');
    await addDoc(collection(db, 'surveyResponses'), payload);
    elements.surveyForm.reset();
    setRating('productRating', 0);
    setRating('serviceRating', 0);
    setStep(1);
    showStatus(elements.surveyStatus, 'تم الإرسال بنجاح.', 'success');
    elements.thankYouCard.classList.remove('hidden');
    if (auth.currentUser && auth.currentUser.uid === ADMIN_UID) {
      await loadResponses();
    }
  } catch (error) {
    showStatus(elements.surveyStatus, humanizeFirebaseError(error), 'error');
  } finally {
    document.getElementById('submitSurveyBtn').disabled = false;
  }
}

async function loadResponses() {
  try {
    const snapshot = await getDocs(query(collection(db, 'surveyResponses'), orderBy('createdAtMs', 'desc'), limit(300)));
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
  const seasons = Object.keys(grouped);
  if (!seasons.length) {
    elements.seasonAverages.innerHTML = '<div class="muted">لا توجد بيانات بعد.</div>';
    return;
  }
  elements.seasonAverages.innerHTML = seasons
    .map((season) => {
      const items = grouped[season];
      const avg = average(items.map((item) => (Number(item.productRating) + Number(item.serviceRating)) / 2));
      return `
        <div class="avg-bar">
          <div class="avg-bar-top">
            <strong>${escapeHtml(season)}</strong>
            <span>${avg.toFixed(1)} / 5</span>
          </div>
          <div class="avg-track"><div class="avg-fill" style="width:${Math.min((avg / 5) * 100, 100)}%"></div></div>
        </div>
      `;
    })
    .join('');
}

function renderResponsesTable() {
  const seasonFilter = elements.responseSeasonFilter.value;
  const searchValue = elements.responseSearchInput.value.trim().toLowerCase();
  const filtered = allResponses.filter((item) => {
    const seasonOk = seasonFilter === 'all' || item.season === seasonFilter;
    const searchOk = !searchValue || `${item.customerName} ${item.phone}`.toLowerCase().includes(searchValue);
    return seasonOk && searchOk;
  });
  if (!filtered.length) {
    elements.responsesTableBody.innerHTML = '<tr><td colspan="7" class="empty-state">لا توجد نتائج.</td></tr>';
    return;
  }
  elements.responsesTableBody.innerHTML = filtered
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.customerName || '—')}</td>
          <td>${escapeHtml(item.phone || '—')}</td>
          <td>${escapeHtml(item.season || '—')}</td>
          <td>${escapeHtml(String(item.productRating || '—'))}</td>
          <td>${escapeHtml(String(item.serviceRating || '—'))}</td>
          <td>${escapeHtml(item.notes || '—')}</td>
          <td>${escapeHtml(item.createdAtText || '—')}</td>
        </tr>
      `,
    )
    .join('');
}

function groupBySeason(items) {
  return items.reduce((acc, item) => {
    const key = item.season || 'غير محدد';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

function splitLines(value) {
  return value.split('\n').map((line) => line.trim()).filter(Boolean);
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatPhoneInput(event) {
  event.target.value = event.target.value.replace(/[^0-9+\-\s]/g, '');
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
    'auth/missing-password': 'يرجى إدخال كلمة المرور.',
    'auth/user-not-found': 'المستخدم غير موجود.',
    'auth/wrong-password': 'كلمة المرور غير صحيحة.',
    'permission-denied': 'ليس لديك صلاحية.',
  };
  return map[error.code] || error.message || 'حدث خطأ غير متوقع.';
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('`', '&#096;');
}

function phoneIcon() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07A19.5 19.5 0 0 1 5.15 12.8 19.8 19.8 0 0 1 2.08 4.11 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.63 2.62a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.46-1.15a2 2 0 0 1 2.11-.45c.84.3 1.72.51 2.62.63A2 2 0 0 1 22 16.92z"></path></svg>';
}
function mailIcon() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="m3 7 9 6 9-6"></path></svg>';
}
function whatsappIcon() {
  return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.52 3.48A11.86 11.86 0 0 0 12.02 0C5.4 0 .02 5.38.02 12c0 2.11.55 4.16 1.6 5.97L0 24l6.2-1.62A11.98 11.98 0 0 0 12.02 24h.01c6.61 0 11.99-5.38 11.99-12 0-3.2-1.25-6.2-3.5-8.52zM12.03 21.8a9.8 9.8 0 0 1-5-1.37l-.36-.22-3.68.96.98-3.58-.24-.37a9.8 9.8 0 1 1 8.3 4.58zm5.36-7.35c-.29-.14-1.72-.85-1.99-.95-.27-.1-.46-.14-.66.14-.19.29-.76.95-.93 1.15-.17.19-.34.22-.63.07-.29-.14-1.23-.45-2.34-1.45-.86-.77-1.44-1.72-1.61-2.01-.17-.29-.02-.44.13-.58.13-.13.29-.34.43-.51.14-.17.19-.29.29-.48.1-.19.05-.36-.03-.5-.07-.14-.66-1.59-.91-2.17-.24-.58-.48-.5-.66-.5h-.56c-.19 0-.5.07-.77.36-.26.29-1.01.99-1.01 2.42s1.03 2.81 1.18 3c.14.19 2.01 3.07 4.87 4.3.68.29 1.22.47 1.64.6.69.22 1.32.19 1.82.12.55-.08 1.72-.7 1.96-1.38.24-.68.24-1.27.17-1.39-.08-.12-.27-.19-.56-.34z"></path></svg>';
}
function globeIcon() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"></circle><path d="M3 12h18"></path><path d="M12 3a14 14 0 0 1 4 9 14 14 0 0 1-4 9 14 14 0 0 1-4-9 14 14 0 0 1 4-9z"></path></svg>';
}
function facebookIcon() {
  return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.6 1.6-1.6H17V4.8c-.8-.1-1.6-.2-2.4-.2-2.4 0-4.1 1.5-4.1 4.2V11H8v3h2.5v8h3z"></path></svg>';
}
function instagramIcon() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle cx="17.5" cy="6.5" r="1"></circle></svg>';
}
function xIcon() {
  return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-6.8 7.77L23 22h-6.2l-4.86-6.35L6.36 22H3.24l7.28-8.32L1 2h6.35l4.4 5.8L18.9 2zm-1.08 18h1.72L6.4 3.9H4.55L17.82 20z"></path></svg>';
}
function tiktokIcon() {
  return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 3h3.02A5.98 5.98 0 0 0 21 7.98V11a8.9 8.9 0 0 1-4-1v6.45A5.45 5.45 0 1 1 11.55 11a5.4 5.4 0 0 1 1.45.2v3.18a2.3 2.3 0 1 0 1 1.9V3z"></path></svg>';
}
function snapchatIcon() {
  return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c3 0 5 2 5 5v3.1c0 .6.3 1.2.8 1.5.4.2.8.3 1.2.4.4.1.6.5.5.9-.2.5-.8.8-1.6 1-.5.1-.8.5-.9 1-.1.6-.4 1.3-1.2 1.5-.6.2-1.2.3-1.8.3-.3.9-.9 1.3-2 1.3s-1.7-.4-2-1.3c-.6 0-1.2-.1-1.8-.3-.8-.2-1.1-.9-1.2-1.5-.1-.5-.4-.9-.9-1-.8-.2-1.4-.5-1.6-1-.1-.4.1-.8.5-.9.4-.1.8-.2 1.2-.4.5-.3.8-.9.8-1.5V7c0-3 2-5 5-5z"></path></svg>';
}
function linkedinIcon() {
  return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.94 8.5H3.56V20h3.38V8.5zM5.25 3A1.97 1.97 0 1 0 5.3 6.94 1.97 1.97 0 0 0 5.25 3zM20.44 13.11c0-3.45-1.84-5.05-4.3-5.05-1.98 0-2.86 1.09-3.36 1.86V8.5H9.4c.04.94 0 11.5 0 11.5h3.38v-6.42c0-.34.02-.68.13-.92.27-.68.88-1.38 1.91-1.38 1.35 0 1.89 1.03 1.89 2.54V20h3.38v-6.89z"></path></svg>';
}
