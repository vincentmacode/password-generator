// Password generator script

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = "~`!@#$%^&*()_-+={}[]|:;<>.?/,";

// Secure random integer in range [0, max) using window.crypto with rejection sampling
function getSecureRandomInt(max) {
  if (max <= 0) return 0;
  // Use crypto if available
  if (window.crypto && window.crypto.getRandomValues) {
    const uint32Max = 0xffffffff;
    const rand = new Uint32Array(1);
    const bound = Math.floor(uint32Max / max) * max;
    while (true) {
      window.crypto.getRandomValues(rand);
      if (rand[0] < bound) return rand[0] % max;
    }
  }
  // Fallback to Math.random (less secure)
  return Math.floor(Math.random() * max);
}

function pickRandomChar(str) {
  return str.charAt(getSecureRandomInt(str.length));
}

// Fisher-Yates shuffle (uses secure random)
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = getSecureRandomInt(i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Generate password with guaranteed inclusion of each selected type
function generatePassword(length, { upper, lower, numbers, symbols }) {
  const pools = [];
  if (upper) pools.push(UPPER);
  if (lower) pools.push(LOWER);
  if (numbers) pools.push(NUMBERS);
  if (symbols) pools.push(SYMBOLS);

  if (pools.length === 0) return '';
  if (length < pools.length) {
    // Not enough length to include every selected type
    throw new Error('Length too short for selected character types');
  }

  // Start with one guaranteed character from each selected pool
  const result = [];
  pools.forEach(pool => result.push(pickRandomChar(pool)));

  // Build a combined pool for remaining picks
  const combined = pools.join('');
  for (let i = result.length; i < length; i++) {
    result.push(pickRandomChar(combined));
  }

  // Shuffle to avoid predictable positions
  return shuffleArray(result).join('');
}

// DOM wiring
const lengthInput = document.getElementById('length');
const upperCheckbox = document.getElementById('uppercase');
const lowerCheckbox = document.getElementById('lowercase');
const numbersCheckbox = document.getElementById('numbers');
const symbolsCheckbox = document.getElementById('symbols');
const generateBtn = document.getElementById('generate');
const passwordField = document.getElementById('password');
const copyBtn = document.getElementById('copy');

function showTemporaryMessage(button, text, ms = 1400) {
  const original = button.textContent;
  button.textContent = text;
  button.disabled = true;
  setTimeout(() => {
    button.textContent = original;
    button.disabled = false;
  }, ms);
}

generateBtn.addEventListener('click', () => {
  const length = parseInt(lengthInput.value, 10) || 0;
  const opts = {
    upper: upperCheckbox.checked,
    lower: lowerCheckbox.checked,
    numbers: numbersCheckbox.checked,
    symbols: symbolsCheckbox.checked,
  };

  try {
    if (length < parseInt(lengthInput.min || '4', 10) || length > parseInt(lengthInput.max || '128', 10)) {
      alert('Please choose a length between ' + lengthInput.min + ' and ' + lengthInput.max + '.');
      return;
    }
    if (!opts.upper && !opts.lower && !opts.numbers && !opts.symbols) {
      alert('Please select at least one character type.');
      return;
    }

    const password = generatePassword(length, opts);
    passwordField.value = password;
    // select for convenience
    passwordField.focus();
    passwordField.select();
    showTemporaryMessage(generateBtn, 'Generated!');
  } catch (err) {
    alert(err.message || 'Could not generate password.');
  }
});

copyBtn.addEventListener('click', async () => {
  const text = passwordField.value;
  if (!text) {
    showTemporaryMessage(copyBtn, 'No password');
    return;
  }
  // Try navigator.clipboard first
  try {
    await navigator.clipboard.writeText(text);
    showTemporaryMessage(copyBtn, 'Copied!');
  } catch (e) {
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showTemporaryMessage(copyBtn, 'Copied!');
    } catch (err) {
      alert('Copy failed. Select the password and press Ctrl+C.');
    }
    document.body.removeChild(textarea);
  }
});

// Optional: generate an initial password on load
window.addEventListener('load', () => {
  generateBtn.click();
});
