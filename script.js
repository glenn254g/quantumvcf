// app.js - module
// --- IMPORTANT ---
// Paste your Firebase config in the firebaseConfig object below.

const firebaseConfig = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME",
  databaseURL: "REPLACE_ME",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME"
};

// You can change these
const CHANNEL_URL = "https://whatsapp.com/channel/0029VbCSudtFCCoNGIVy2F2Q";
const ADMIN_URL = "https://wa.link/iltssr";
const DEFAULT_TARGET = 800;
const NAME_PREFIX = "🏝"; // prefix stored name with this emoji

// Import Firebase modular SDK via CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase, ref, onValue, get, child, set, runTransaction } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// DOM refs
const valRegistered = document.getElementById('val-registered');
const valRemaining = document.getElementById('val-remaining');
const valTarget = document.getElementById('val-target');
const arcRegistered = document.getElementById('arc-registered');
const arcRemaining = document.getElementById('arc-remaining');
const arcTarget = document.getElementById('arc-target');

const fullnameInput = document.getElementById('fullname');
const phoneInput = document.getElementById('phone');
const submitBtn = document.getElementById('submitBtn');
const joinBtn = document.getElementById('joinBtn');
const adminBtn = document.getElementById('adminBtn');
const successAlert = document.getElementById('success');
const existsAlert = document.getElementById('exists');
const errAlert = document.getElementById('err');

const popup = document.getElementById('popup');
const closePopup = document.getElementById('closePopup');
closePopup.addEventListener('click', () => popup.style.display = 'none');

joinBtn.href = CHANNEL_URL;
adminBtn.href = ADMIN_URL;

// Utilities
function phoneKey(phone){
  return phone.replace(/\+/g,'plus').replace(/[^\w]/g,'_');
}

// sanitize and check name - allow Unicode letters, numbers, space, apostrophe, hyphen, dot
// This will reject most emoji because emoji are not in the \p{L} set.
function isValidName(name){
  if(typeof name !== 'string') return false;
  name = name.trim();
  if(name.length < 2 || name.length > 100) return false;
  // Regex: only letters (any script), digits, spaces, apostrophe, hyphen, dot
  const re = /^[\p{L}0-9 '\.\-]+$/u;
  return re.test(name);
}

function isValidPhone(phone){
  if(typeof phone !== 'string') return false;
  phone = phone.trim();
  // must start with plus and have digits and optionally spaces/hyphens
  return /^\+\d[\d\s\-]{6,20}$/.test(phone);
}

function showAlert(which){
  // which: 'success' | 'exists' | 'err'
  successAlert.style.display = 'none';
  existsAlert.style.display = 'none';
  errAlert.style.display = 'none';
  if(which === 'success') successAlert.style.display = 'block';
  if(which === 'exists') existsAlert.style.display = 'block';
  if(which === 'err') errAlert.style.display = 'block';
}

function setArc(pathEl, percent, gradientId){
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  // use stroke-dasharray trick (percent out of 100)
  pathEl.setAttribute('d', 'M18 2.0845a15.9155 15.9155 0 1 1 0 31.831a15.9155 15.9155 0 1 1 0-31.831');
  pathEl.style.strokeDasharray = ${p} 100;
  pathEl.style.transition = 'stroke-dasharray 600ms ease';
  // set stroke to gradient by applying an id; we create gradients once below
}

// create SVG gradients for arcs
function createGradients(){
  // registered gradient (purple -> aqua)
  arcRegistered.setAttribute('stroke', 'url(#gr-reg)');
  arcRemaining.setAttribute('stroke', 'url(#gr-rem)');
  arcTarget.setAttribute('stroke', 'url(#gr-tar)');

  // Append SVG defs to the document for each gradient (loose approach)
  const svgDefs = `
  <svg style="position:absolute;width:0;height:0;" aria-hidden="true">
    <defs>
      <linearGradient id="gr-reg" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#7c4dff"/>
        <stop offset="100%" stop-color="#00e5d1"/>
      </linearGradient>

      <linearGradient id="gr-rem" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#ffd86a"/>
        <stop offset="100%" stop-color="#ff6b6b"/>
      </linearGradient>

      <linearGradient id="gr-tar" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#cf9bff"/>
        <stop offset="100%" stop-color="#7be495"/>
      </linearGradient>
    </defs>
  </svg>
  `;
  document.body.insertAdjacentHTML('beforeend', svgDefs);
}

// Initialize gradients
createGradients();

// Ensure stats exist
async function ensureStats(){
  const root = ref(db, '/');
  const snap = await get(child(root, 'vcf_stats'));
  if(!snap.exists()){
    await set(ref(db, 'vcf_stats'), { target: DEFAULT_TARGET, createdAt: Date.now(), registeredCount: 0 });
  }
}

await ensureStats();

// Live listener: update counts whenever vcf_stats or vcf_contacts change
const statsRef = ref(db, 'vcf_stats');
onValue(statsRef, (snapshot) => {
  const data = snapshot.val() || {};
  const target = data.target || DEFAULT_TARGET;

  // get contacts count
  get(ref(db, 'vcf_contacts')).then(csnap => {
    const contacts = csnap.exists() ? csnap.val() : {};
    const registeredCount = Object.keys(contacts).length;
    const remaining = Math.max(0, target - registeredCount);

    valRegistered.textContent = registeredCount;
    valRemaining.textContent = remaining;
    valTarget.textContent = target;

    const regPercent = Math.min(100, Math.round((registeredCount / target) * 100));
    const remPercent = Math.min(100, Math.round((remaining / target) * 100));
    setArc(arcRegistered, regPercent);
    setArc(arcRemaining, remPercent);
    setArc(arcTarget, 100);
  });
});

// submit contact to Firebase with prefix; prevent duplicates
async function submitContact(fullname, phone){
  if(!isValidName(fullname)) {
    throw new Error('Name invalid or contains emoji — please use plain letters and numbers only.');
  }
  if(!isValidPhone(phone)) {
    throw new Error('Phone number invalid. Must start with + and include country code.');
  }
  const pk = phoneKey(phone);
  const contactRef = ref(db, vcf_contacts/${pk});
  const snap = await get(contactRef);
  if(snap.exists()){
    return { ok:false, reason:'exists' };
  } else {
    // store with emoji prefix
    const storedName = ${NAME_PREFIX}${fullname.trim()};
    await set(contactRef, { fullname: storedName, phone: phone, createdAt: Date.now() });
    // increment registeredCount atomically (best-effort)
    await runTransaction(ref(db, 'vcf_stats/registeredCount'), (cur) => (cur || 0) + 1).catch(()=>{});
    return { ok:true };
  }
}

submitBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  showAlert(null);
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';

  const fullname = fullnameInput.value.trim();
  const phone = phoneInput.value.trim();

  try {
    if(!fullname || !phone) throw new Error('Provide fullname and phone.');

    const res = await submitContact(fullname, phone);
    if(!res.ok && res.reason === 'exists'){
      showAlert('exists');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit';
      return;
    }

    showAlert('success');

    // after 1.5 seconds redirect to channel
    setTimeout(() => { window.location.href = CHANNEL_URL; }, 1500);

  } catch(err){
    // validation or other error
    errAlert.textContent = err.message || 'Submission failed';
    showAlert('err');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit';
  }
});

// allow enter on phone to submit
phoneInput.addEventListener('keydown', (ev) => {
  if(ev.key === 'Enter') submitBtn.click();
});
