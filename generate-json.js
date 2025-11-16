// generate-json.js
const fs = require('fs');
const CryptoJS = require('crypto-js');

// --- AES key & salt ---
const AES_KEY = "MySecretAESKey123";
const SALT = "MyUniqueSalt123";

// --- Read raw barcodes ---
const rawBarcodes = fs.readFileSync('raw-barcodes.txt', 'utf-8')
  .split(/\r?\n/)
  .filter(line => line.trim() !== '');

// --- Encrypt each barcode ---
const encryptedBarcodes = rawBarcodes.map(code => {
  return CryptoJS.AES.encrypt(SALT + code, AES_KEY).toString();
});

// --- Save to barcodes.json ---
fs.writeFileSync('barcodes.json', JSON.stringify(encryptedBarcodes, null, 2));

console.log(`✅ Encrypted ${encryptedBarcodes.length} barcodes and saved to barcodes.json`);
