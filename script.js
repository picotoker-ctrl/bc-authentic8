// script.js
// Strict exact-match barcode checker using raw-barcodes.txt

const CODE_LEN = 28;
const PREFIX = "7561097010000002"; // fixed prefix (16 chars)
const rawUrl = 'raw-barcodes.txt'; // file must be in same folder
const codeInput = document.getElementById('code');
const checkBtn = document.getElementById('check');
const clearBtn = document.getElementById('clear');
const resultDiv = document.getElementById('result');
const countSpan = document.getElementById('count');

let codesSet = new Set();

// Utility: show result
function showResult(isGenuine, message) {
  resultDiv.style.display = 'block';
  resultDiv.style.background = isGenuine ? 'var(--green)' : 'var(--red)';
  resultDiv.textContent = message;
}

// Load raw-barcodes.txt and put into Set
async function loadCodes() {
  try {
    const res = await fetch(rawUrl, {cache: "no-store"});
    if (!res.ok) throw new Error('Failed to load raw-barcodes.txt');
    const text = await res.text();
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length);
    // Only keep valid length/format lines (defensive)
    for (const l of lines) {
      if (l.length === CODE_LEN) codesSet.add(l);
    }
    countSpan.textContent = codesSet.size;
    console.log(`Loaded ${codesSet.size} codes`);
  } catch (err) {
    console.error(err);
    countSpan.textContent = '0';
    showResult(false, 'Error loading codes file. Check raw-barcodes.txt');
  }
}

// Validate format quick checks (length + prefix + allowed chars)
function basicFormatOkay(code) {
  if (!code || code.length !== CODE_LEN) return false;
  if (!code.startsWith(PREFIX)) return false;
  // allowed characters: digits 0-9 and lowercase a-z and maybe leading zeros. We'll enforce lowercase.
  // convert to lowercase for comparisons
  const tail = code.slice(PREFIX.length);
  // tail should be 12 chars: 1 letter a-z then 5 digits then 6 digits (per your spec)
  // But we will be permissive: ensure only [0-9a-z]
  return /^[0-9a-z]+$/.test(tail);
}

// Perform check
function performCheck() {
  const raw = codeInput.value.trim();
  const code = raw.toLowerCase();

  if (!code) return;
  // basic format validation
  if (!basicFormatOkay(code)) {
    showResult(false, 'COUNTERFEIT ✗ — format invalid');
    logAnalytics(code, 'format-invalid');
    return;
  }

  const isGenuine = codesSet.has(code);
  if (isGenuine) {
    showResult(true, 'GENUINE ✓');
    logAnalytics(code, 'genuine');
  } else {
    showResult(false, 'COUNTERFEIT ✗');
    logAnalytics(code, 'counterfeit');
  }
}

// Simple analytics logging (Google Analytics gtag)
// logs event 'barcode_check' with params barcode, result, page
function logAnalytics(code, result) {
  if (typeof gtag === 'function') {
    try {
      gtag('event', 'barcode_check', {
        'barcode': code,
        'result': result,
        'page_location': window.location.href
      });
    } catch (e) { /* ignore analytics errors */ }
  }
}

// Event listeners
checkBtn.addEventListener('click', performCheck);
clearBtn.addEventListener('click', () => {
  codeInput.value = '';
  resultDiv.style.display = 'none';
  codeInput.focus();
});

// allow Enter key to trigger
codeInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    performCheck();
    e.preventDefault();
  }
});

// load on start
loadCodes();
