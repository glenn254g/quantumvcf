// 🔥 FIREBASE CONFIG (PASTE YOUR REAL CONFIG HERE)
const firebaseConfig = {
  apiKey: "AIzaSyBIJ-8jROkaw8WeZvUYXu-w0shxZRT706I",
  authDomain: "quantum-vcf.firebaseapp.com",
  projectId: "quantum-vcf",
  storageBucket: "quantum-vcf.firebasestorage.app",
  messagingSenderId: "628852383928",
  appId: "1:628852383928:web:03bb582e76cf2aa6fa144d"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const TARGET = 1000;
const EMOJI = "🔵";
const TELEGRAM_GROUP = "https://t.me/YOURGROUP";      // replace
const TELEGRAM_ADMIN = "https://t.me/YOURUSERNAME";  // replace

const registeredEl = document.getElementById("registered");
const remainingEl = document.getElementById("remaining");
const circle = document.querySelector(".progress-circle");
const percentEl = document.getElementById("progressPercent");
const downloadBtn = document.getElementById("downloadVCF");

// 🔧 MODIFIED: success message element (created dynamically, NOT HTML change)
const successMsg = document.createElement("div");
successMsg.style.display = "none";
successMsg.style.background = "#1f9d55";
successMsg.style.color = "#fff";
successMsg.style.padding = "15px";
successMsg.style.marginTop = "15px";
successMsg.style.borderRadius = "8px";
successMsg.style.textAlign = "center";
successMsg.innerHTML =
  "✅ Contact submitted successfully!<br>Join the Telegram group — the big will drop there.";

document.querySelector(".container").appendChild(successMsg);

// LIVE COUNTER
db.collection("stats").doc("counter").onSnapshot(doc => {
  let reg = doc.data().registered || 0;

  registeredEl.innerText = reg;
  remainingEl.innerText = TARGET - reg;

  let percent = Math.floor((reg / TARGET) * 100);
  percentEl.innerText = percent + "%";

  // 🔧 MODIFIED: fixed invalid CSS syntax
  circle.style.background = conic-gradient(#00ffcc ${percent}%, #333 ${percent}%);

  if (reg >= TARGET) generateVCF();
});

// SUBMIT CONTACT
function submitContact() {
  let name = document.getElementById("name").value.trim();
  let phone = document.getElementById("phone").value.trim();

  if (!name || !phone) return alert("Fill all fields");

  db.collection("contacts").where("phone", "==", phone).get()
    .then(snap => {
      if (!snap.empty) return alert("Contact already submitted");

      // Add contact
      db.collection("contacts").add({
        name: EMOJI + " " + name,
        phone
      });

      // Increment counter
      db.collection("stats").doc("counter").update({
        registered: firebase.firestore.FieldValue.increment(1)
      });

      // 🔧 MODIFIED: replace alert + instant redirect
      successMsg.style.display = "block";

      // 🔧 MODIFIED: redirect after 3 seconds
      setTimeout(() => {
        window.location.href = TELEGRAM_GROUP;
      }, 3000);
    })
    .catch(err => console.error("Error adding contact:", err));
}

// GENERATE VCF FILE
function generateVCF() {
  db.collection("contacts").get().then(snapshot => {
    let vcf = "";

    snapshot.forEach(doc => {
      let d = doc.data();
      vcf += BEGIN:VCARD
VERSION:3.0
FN:${d.name}
TEL:${d.phone}
END:VCARD
;
    });

    let blob = new Blob([vcf], { type: "text/vcard" });
    downloadBtn.href = URL.createObjectURL(blob);
    downloadBtn.download = "QUANTUM_VCF.vcf";
    downloadBtn.classList.remove("hidden");
  });
}

// REDIRECTS
function openAdmin() { window.location.href = TELEGRAM_ADMIN; }
function joinGroup() { window.location.href = TELEGRAM_GROUP; }

// POPUP CLOSE
function closePopup() {
  document.getElementById("popup").style.display = "none";
}

// 🔧 MODIFIED: popup auto-hide after 1 minute
window.onload = () => {
  const popup = document.getElementById("popup");
  if (popup) {
    popup.style.display = "flex";

    setTimeout(() => {
      popup.style.display = "none";
    }, 60000); // 1 minute
  }
};
