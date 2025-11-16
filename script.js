// script.js - Secure version with AES encryption - MULTIPLE PREFIXES + AUTO-AUTHENTICATE
const VALID_PREFIXES = ["7561097010000001", "7561097010000002"];
const CODE_LEN = 28;
const encryptedDataUrl = 'encrypted-barcodes.json';
const ENCRYPTION_KEY = "my-super-secret-key-32-chars-long!"; // CHANGE THIS!

const codeInput = document.getElementById('code');
const checkBtn = document.getElementById('check');
const clearBtn = document.getElementById('clear');
const resultDiv = document.getElementById('result');
const countSpan = document.getElementById('count');
const loadingDiv = document.getElementById('loading');

let decryptedCodesSet = new Set();
let isDatabaseLoaded = false;
let autoCheckTimeout = null;

// Show/hide loading
function showLoading(show) {
    loadingDiv.style.display = show ? 'block' : 'none';
}

// Show result
function showResult(isGenuine, message) {
  resultDiv.style.display = 'block';
  resultDiv.style.background = isGenuine ? 'var(--green)' : 'var(--red)';
  resultDiv.textContent = message;
}

// Decrypt a single barcode
function decryptBarcode(encryptedBarcode) {
    try {
        const decrypted = CryptoJS.AES.decrypt(encryptedBarcode, ENCRYPTION_KEY);
        return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        console.error('Decryption error:', error);
        return null;
    }
}

// Load and decrypt encrypted barcodes
async function loadEncryptedCodes() {
    showLoading(true);
    
    try {
        const response = await fetch(encryptedDataUrl, {cache: "no-store"});
        if (!response.ok) throw new Error('Failed to load encrypted database');
        
        const encryptedData = await response.json();
        
        if (!encryptedData.encrypted) {
            throw new Error('Data file is not encrypted format');
        }
        
        // Decrypt each barcode
        let validCount = 0;
        let prefix1Count = 0;
        let prefix2Count = 0;
        
        for (const encryptedBarcode of encryptedData.data) {
            const decrypted = decryptBarcode(encryptedBarcode);
            if (decrypted && decrypted.length === CODE_LEN) {
                decryptedCodesSet.add(decrypted);
                validCount++;
                
                // Count by prefix for debugging
                if (decrypted.startsWith("7561097010000001")) {
                    prefix1Count++;
                } else if (decrypted.startsWith("7561097010000002")) {
                    prefix2Count++;
                }
            }
        }
        
        countSpan.textContent = validCount;
        isDatabaseLoaded = true;
        console.log(`Decrypted and loaded ${validCount} barcodes (Prefix1: ${prefix1Count}, Prefix2: ${prefix2Count})`);
        
    } catch (error) {
        console.error('Database loading error:', error);
        showResult(false, 'Error: Could not load encrypted database');
        countSpan.textContent = '0';
    } finally {
        showLoading(false);
    }
}

// Validate format with multiple prefixes
function basicFormatOkay(code) {
  if (!code || code.length !== CODE_LEN) return false;
  
  // Check if code starts with any valid prefix
  const hasValidPrefix = VALID_PREFIXES.some(prefix => code.startsWith(prefix));
  if (!hasValidPrefix) return false;
  
  // Validate the remaining characters
  const remainingChars = code.slice(16);
  return /^[0-9a-z]+$/.test(remainingChars);
}

// Get prefix type for analytics
function getPrefixType(code) {
    if (code.startsWith("7561097010000001")) return "Type-1";
    if (code.startsWith("7561097010000002")) return "Type-2";
    return "Unknown";
}

// Auto-check function with debouncing
function autoCheck() {
    if (!isDatabaseLoaded) return;
    
    const raw = codeInput.value.trim();
    const code = raw.toLowerCase();
    
    // Clear previous timeout
    if (autoCheckTimeout) {
        clearTimeout(autoCheckTimeout);
    }
    
    // Set new timeout for auto-check (300ms after user stops typing)
    autoCheckTimeout = setTimeout(() => {
        if (code && code.length === CODE_LEN) {
            performCheck();
        }
    }, 300);
}

// Perform check
function performCheck() {
  if (!isDatabaseLoaded) {
    showResult(false, 'Database not ready. Please wait.');
    return;
  }

  const raw = codeInput.value.trim();
  const code = raw.toLowerCase();

  if (!code) {
    resultDiv.style.display = 'none';
    return;
  }
  
  if (!basicFormatOkay(code)) {
    showResult(false, 'COUNTERFEIT ✗ — invalid format or prefix');
    logAnalytics(code, 'format-invalid');
    return;
  }

  const isGenuine = decryptedCodesSet.has(code);
  if (isGenuine) {
    const prefixType = getPrefixType(code);
    showResult(true, `GENUINE ✓ (${prefixType})`);
    logAnalytics(code, 'genuine', prefixType);
  } else {
    showResult(false, 'COUNTERFEIT ✗');
    logAnalytics(code, 'counterfeit');
  }
}

// Enhanced analytics logging with prefix type
function logAnalytics(code, result, prefixType = null) {
  if (typeof gtag === 'function') {
    try {
      gtag('event', 'barcode_check', {
        'barcode_prefix': code.substring(0, 16),
        'barcode_type': prefixType || getPrefixType(code),
        'result': result,
        'page_location': window.location.href,
        'auto_authenticated': 'true'
      });
    } catch (e) { /* ignore analytics errors */ }
  }
}

// Clear function
function clearInput() {
    codeInput.value = '';
    resultDiv.style.display = 'none';
    codeInput.focus();
    
    // Clear any pending auto-check
    if (autoCheckTimeout) {
        clearTimeout(autoCheckTimeout);
    }
}

// Event listeners
checkBtn.addEventListener('click', performCheck);
clearBtn.addEventListener('click', clearInput);

// Auto-authentication events
codeInput.addEventListener('input', autoCheck);
codeInput.addEventListener('paste', autoCheck);

// Scanner detection - many scanners send Enter key after scanning
codeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        // If we already auto-checked, don't check again
        // If not, perform the check
        if (resultDiv.style.display === 'none') {
            performCheck();
        }
        e.preventDefault();
    }
});

// Focus the input field when page loads
window.addEventListener('load', () => {
    codeInput.focus();
});

// Initialize
loadEncryptedCodes();}

// Perform check
function performCheck() {
  if (!isDatabaseLoaded) {
    showResult(false, 'Database not ready. Please wait.');
    return;
  }

  const raw = codeInput.value.trim();
  const code = raw.toLowerCase();

  if (!code) return;
  
  if (!basicFormatOkay(code)) {
    showResult(false, 'COUNTERFEIT ✗ — invalid format or prefix');
    logAnalytics(code, 'format-invalid');
    return;
  }

  const isGenuine = decryptedCodesSet.has(code);
  if (isGenuine) {
    const prefixType = getPrefixType(code);
    showResult(true, `GENUINE ✓ (Type: ${prefixType})`);
    logAnalytics(code, 'genuine', prefixType);
  } else {
    showResult(false, 'COUNTERFEIT ✗');
    logAnalytics(code, 'counterfeit');
  }
}

// Enhanced analytics logging with prefix type
function logAnalytics(code, result, prefixType = null) {
  if (typeof gtag === 'function') {
    try {
      gtag('event', 'barcode_check', {
        'barcode_prefix': code.substring(0, 16),
        'barcode_type': prefixType || getPrefixType(code),
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

codeInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    performCheck();
    e.preventDefault();
  }
});

// Initialize
loadEncryptedCodes();

