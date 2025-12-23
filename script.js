// 🔥 FIREBASE CONFIG
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

// CONSTANTS
const TARGET = 1000;
const EMOJI = "🔵";
const TELEGRAM_GROUP = "https://t.me/YOURGROUP";     // replace
const TELEGRAM_ADMIN = "https://t.me/YOURUSERNAME"; // replace

// ELEMENTS
const registeredEl = document.getElementById("registered");
const remainingEl = document.getElementById("remaining");
const circle = document.querySelector(".progress-circle");
const percentEl = document.getElementById("progressPercent");
const downloadBtn = document.getElementById("downloadVCF");

// 🔧 SUCCESS MESSAGE
const successMsg = document.createElement("div");
successMsg.style.display = "none";
successMsg.style.background = "#1f9d55";
successMsg.style.color = "#fff";
successMsg.style.padding = "15px";
successMsg.style.marginTop = "15px";
successMsg.style.borderRadius = "8px";
successMsg.style.textAlign = "center";
successMsg.innerHTML =
  "✅ Contact submitted successfully!<br>Join the Telegram group — the big drop will be shared there.";
document.querySelector(".container").appendChild(successMsg);

// 📊 LIVE COUNTER
db.collection("stats").doc("counter").onSnapshot(doc => {
  const reg = doc.exists ? doc.data().registered || 0 : 0;
  registeredEl.innerText = reg;
  remainingEl.innerText = TARGET - reg;
  const percent = Math.min(100, Math.floor((reg / TARGET) * 100));
  percentEl.innerText = percent + "%";

  // ✅ Correct conic-gradient syntax
  circle.style.background = conic-gradient(#00ffcc ${percent}%, #333 ${percent}%);

  if (reg >= TARGET) generateVCF();
});

// 📤 SUBMIT CONTACT
function submitContact() {
  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  if (!name || !phone) {
    alert("Fill all fields");
    return;
  }

  db.collection("contacts").where("phone", "==", phone).get()
    .then(snap => {
      if (!snap.empty) {
        alert("Contact already submitted");
        return;
      }

      return db.collection("contacts").add({
        name: EMOJI + " " + name,
        phone: phone
      }).then(() => {
        return db.collection("stats").doc("counter").update({
          registered: firebase.firestore.FieldValue.increment(1)
        });
      });
    })
    .then(() => {
      successMsg.style.display = "block";
      setTimeout(() => {
        window.location.href = TELEGRAM_GROUP;
      }, 3000);
    })
    .catch(err => {
      console.error("Error:", err);
      alert("Failed to submit. Check console for details.");
    });
}

// 📁 GENERATE VCF
function generateVCF() {
  db.collection("contacts").get().then(snapshot => {
    let vcf = "";
    snapshot.forEach(doc => {
      const d = doc.data();
      vcf +=
        "BEGIN:VCARD\n" +
        "VERSION:3.0\n" +
        "FN:" + d.name + "\n" +
        "TEL:" + d.phone + "\n" +
        "END:VCARD\n";
    });
    const blob = new Blob([vcf], { type: "text/vcard" });
    downloadBtn.href = URL.createObjectURL(blob);
    downloadBtn.download = "QUANTUM_VCF.vcf";
    downloadBtn.classList.remove("hidden");
  });
}

// 🔗 BUTTON REDIRECTS
function openAdmin() { window.location.href = TELEGRAM_ADMIN; }
function joinGroup() { window.location.href = TELEGRAM_GROUP; }

// ❌ POPUP CLOSE
function closePopup() {
  const popup = document.getElementById("popup");
  popup.style.display = "none";
  popup.style.pointerEvents = "none";
}

// 🔔 SHOW POPUP ON LOAD
document.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("popup");
  if (!popup) return;
  popup.style.display = "flex";
  popup.style.pointerEvents = "auto";
  setTimeout(() => {
    popup.style.display = "none";
    popup.style.pointerEvents = "none";
  }, 60000);
});
// 🔹 MAKE FUNCTIONS ACCESSIBLE TO HTML BUTTONS
window.submitContact = submitContact;
window.openAdmin = openAdmin;
window.joinGroup = joinGroup;
window.closePopup = closePopup;
