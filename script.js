// CONSTANTS
const TARGET = 1000;
const EMOJI = "🔵";

// ELEMENTS
const registeredEl = document.getElementById("registered");
const remainingEl = document.getElementById("remaining");
const circle = document.querySelector(".progress-circle");
const percentEl = document.getElementById("progressPercent");
const downloadBtn = document.getElementById("downloadVCF");

// SUCCESS MESSAGE
const successMsg = document.createElement("div");
successMsg.style.display = "none";
successMsg.style.background = "#1f9d55";
successMsg.style.color = "#fff";
successMsg.style.padding = "15px";
successMsg.style.marginTop = "15px";
successMsg.style.borderRadius = "8px";
successMsg.style.textAlign = "center";
successMsg.innerHTML = "✅ Contact submitted successfully!";
document.querySelector(".container").appendChild(successMsg);

// SIMULATED COUNTER
let registered = 0;

// UPDATE COUNTER FUNCTION
function updateCounter() {
  registeredEl.innerText = registered;
  remainingEl.innerText = TARGET - registered;
  const percent = Math.min(100, Math.floor((registered / TARGET) * 100));
  percentEl.innerText = percent + "%";
  circle.style.background = conic-gradient(#00ffcc ${percent}%, #333 ${percent}%);
}

// SUBMIT CONTACT (SIMULATED)
function submitContact() {
  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  if (!name || !phone) {
    alert("Fill all fields");
    return;
  }

  // Simulate already submitted check (skipped for simplicity)
  registered++; // increment counter
  updateCounter();

  // Show success message
  successMsg.style.display = "block";

  // Simulate redirect (comment out if you just want to see message)
  setTimeout(() => {
    alert("Would redirect to Telegram group here");
  }, 1000);
}

// INITIALIZE COUNTER
updateCounter();
