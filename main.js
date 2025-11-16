let decryptedBarcodes = [];
const AES_KEY = "MySecretAESKey123";
const SALT = "MyUniqueSalt123";

// --- Load encrypted barcodes and decrypt ---
async function loadBarcodes() {
  try {
    const response = await fetch('barcodes.json');
    const encryptedBarcodes = await response.json();
    decryptedBarcodes = encryptedBarcodes.map(enc => {
      const bytes = CryptoJS.AES.decrypt(enc, AES_KEY);
      return bytes.toString(CryptoJS.enc.Utf8).slice(SALT.length);
    });
    console.log("Loaded decrypted barcodes:", decryptedBarcodes);
  } catch (err) {
    console.error("Error loading barcodes.json:", err);
  }
}

// --- Check scanned barcode ---
function checkBarcode(scanned) {
  const resultDiv = document.getElementById('result');
  const isGenuine = decryptedBarcodes.includes(scanned);

  document.body.style.backgroundColor = isGenuine ? "green" : "red";
  resultDiv.textContent = isGenuine ? "Genuine ✅" : "Counterfeit ❌";

  // --- Google Analytics event ---
  if (typeof gtag === "function") {
    gtag('event', 'barcode_scan', {
      'barcode': scanned,
      'location': window.location.href,
      'result': isGenuine ? 'genuine' : 'counterfeit'
    });
  }
}

// --- Initialize QuaggaJS ---
function startScanner() {
  Quagga.init({
    inputStream: {
      name: "Live",
      type: "LiveStream",
      target: document.querySelector('#video'),
      constraints: { facingMode: "environment" }
    },
    decoder: { readers: ["code_128_reader", "ean_reader", "ean_13_reader"] }
  }, function(err) {
    if (err) {
      console.error(err);
      return;
    }
    Quagga.start();
  });

  Quagga.onDetected(function(data) {
    const code = data.codeResult.code;
    console.log("Detected code:", code);
    Quagga.pause();
    checkBarcode(code);
    setTimeout(() => Quagga.start(), 2000);
  });
}

// --- On page load ---
window.addEventListener('DOMContentLoaded', async () => {
  await loadBarcodes();
  startScanner();
});
