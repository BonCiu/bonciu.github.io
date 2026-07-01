var encodedAccessCode = "MDQyMDY5";
var accessFlagName = "access_granted";
var dbName = "mObywatelDB";
var storeName = "accessCodes";
var encryptionKey = "mObywatel_secure_key_2026";
var codeLength = 6;

var db = null;

function initDB() {
  return new Promise(function(resolve) {
    if (db) {
      resolve();
      return;
    }
    var request = indexedDB.open(dbName, 1);
    request.onerror = function() {
      resolve();
    };
    request.onsuccess = function() {
      db = request.result;
      resolve();
    };
    request.onupgradeneeded = function(event) {
      db = event.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: "id" });
      }
    };
  });
}

function decryptData(ciphertext) {
  try {
    var decrypted = CryptoJS.AES.decrypt(ciphertext, encryptionKey);
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    return null;
  }
}

function getDefaultAccessCodes() {
  return [atob(encodedAccessCode)];
}

function getStoredAccessCodes() {
  return new Promise(function(resolve) {
    if (!db) {
      resolve(null);
      return;
    }
    var transaction = db.transaction([storeName], "readonly");
    var objectStore = transaction.objectStore(storeName);
    var request = objectStore.get("codes");
    request.onerror = function() {
      resolve(null);
    };
    request.onsuccess = function() {
      var result = request.result;
      if (result && result.encrypted) {
        var decrypted = decryptData(result.encrypted);
        if (decrypted) {
          try {
            var parsed = JSON.parse(decrypted);
            if (Array.isArray(parsed)) {
              resolve(parsed.filter(function(code) { return typeof code === "string"; }));
            } else {
              resolve(null);
            }
          } catch (e) {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      } else {
        resolve(null);
      }
    };
  });
}

function getAccessCodes() {
  return getStoredAccessCodes().then(function(stored) {
    if (stored && stored.length) {
      return stored;
    }
    return getDefaultAccessCodes();
  });
}

function hasAccess() {
  return sessionStorage.getItem(accessFlagName) === "true";
}

function createStyle() {
  var style = document.createElement("style");
  style.textContent = `
    .access-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0,0,0,0.7);
      backdrop-filter: blur(8px);
      padding: 24px;
      color: #fff;
      font-family: system-ui, sans-serif;
    }
    .access-panel {
      width: min(520px, 100%);
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 24px;
      box-shadow: 0 24px 80px rgba(0,0,0,0.4);
      padding: 28px 28px 24px;
      display: grid;
      gap: 20px;
    }
    .access-panel h2 {
      margin: 0;
      font-size: 1.7rem;
      line-height: 1.1;
      letter-spacing: -0.03em;
    }
    .access-panel p {
      margin: 0;
      color: rgba(255,255,255,0.75);
      line-height: 1.6;
    }
    .access-code-row {
      display: flex;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .access-code-row input {
      width: 52px;
      height: 60px;
      border-radius: 16px;
      border: 1px solid rgba(255,255,255,0.18);
      background: rgba(255,255,255,0.08);
      color: #fff;
      font-size: 2rem;
      text-align: center;
      outline: none;
      transition: border-color 0.2s ease, background 0.2s ease;
    }
    .access-code-row input:focus {
      border-color: #00ffd0;
      background: rgba(0,255,208,0.12);
    }
    .access-submit {
      width: 100%;
      min-height: 56px;
      border: none;
      border-radius: 999px;
      background: linear-gradient(90deg, #00ffd0 0%, #0d93ec 100%);
      color: #101820;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      transition: transform 0.2s ease, filter 0.2s ease;
    }
    .access-submit:hover {
      transform: translateY(-1px);
      filter: brightness(1.03);
    }
    .access-error {
      min-height: 20px;
      color: #ff6b6b;
      text-align: center;
      font-size: 0.95rem;
    }
    .access-help {
      display: flex;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
      color: rgba(255,255,255,0.65);
      font-size: 0.95rem;
    }
    .access-help a {
      color: #7fdcff;
      text-decoration: none;
    }
    .access-error-input {
      border-color: #ff6b6b !important;
      box-shadow: 0 0 0 2px rgba(255,107,107,0.35);
    }
  `;
  document.head.appendChild(style);
}

function createOverlay() {
  var overlay = document.createElement("div");
  overlay.className = "access-overlay";

  var panel = document.createElement("div");
  panel.className = "access-panel";

  panel.innerHTML = `
    <div>
      <h2>Wprowadź kod dostępu</h2>
      <p>Aby kontynuować, wpisz unikalny kod dostępu. Kod musi być wprowadzony przed przejściem do tej strony.</p>
    </div>
    <div class="access-code-row"></div>
    <button class="access-submit">Potwierdź kod</button>
    <div class="access-error"></div>
  `;

  overlay.appendChild(panel);
  document.body.appendChild(overlay);
  return overlay;
}

function buildCodeInputs(container) {
  var inputs = [];
  for (var i = 0; i < codeLength; i++) {
    var input = document.createElement("input");
    input.setAttribute("type", "text");
    input.setAttribute("inputmode", "numeric");
    input.setAttribute("maxlength", "1");
    input.className = "access-code-cell";
    input.addEventListener("keydown", handleKeyDown);
    input.addEventListener("input", handleInput);
    input.addEventListener("paste", handlePaste);
    inputs.push(input);
    container.appendChild(input);
  }
  return inputs;
}

function handleKeyDown(event) {
  var target = event.target;
  if (event.key === "Backspace") {
    if (target.value === "") {
      var prev = target.previousElementSibling;
      if (prev) {
        prev.focus();
      }
    }
    return;
  }
  if (event.key === "ArrowLeft") {
    var prev = target.previousElementSibling;
    if (prev) prev.focus();
    event.preventDefault();
    return;
  }
  if (event.key === "ArrowRight") {
    var next = target.nextElementSibling;
    if (next) next.focus();
    event.preventDefault();
    return;
  }
}

function handleInput(event) {
  var target = event.target;
  var value = target.value.replace(/[^0-9]/g, "");
  target.value = value;
  if (value.length > 0) {
    var next = target.nextElementSibling;
    if (next) next.focus();
  }
}

function handlePaste(event) {
  event.preventDefault();
  var paste = event.clipboardData.getData("text").replace(/[^0-9]/g, "");
  if (!paste) return;
  var inputs = event.target.parentNode.querySelectorAll("input");
  for (var i = 0; i < inputs.length; i++) {
    inputs[i].value = paste[i] || "";
  }
  var nextIndex = Math.min(paste.length, inputs.length - 1);
  inputs[nextIndex].focus();
}

function getCodeFromInputs(inputs) {
  return Array.from(inputs).map(function(input) {
    return input.value.trim();
  }).join("");
}

function showAccessOverlay() {
  createStyle();
  var overlay = createOverlay();
  var codeContainer = overlay.querySelector(".access-code-row");
  var inputs = buildCodeInputs(codeContainer);
  var submit = overlay.querySelector(".access-submit");
  var error = overlay.querySelector(".access-error");

  inputs[0].focus();

  function validate() {
    var code = getCodeFromInputs(inputs);
    getAccessCodes().then(function(validCodes) {
      if (validCodes.includes(code)) {
        sessionStorage.setItem(accessFlagName, "true");
        document.body.removeChild(overlay);
        return true;
      } else {
        error.textContent = "Błędny kod dostępu. Spróbuj ponownie.";
        inputs.forEach(function(input) {
          input.classList.add("access-error-input");
        });
      }
    });
  }

  submit.addEventListener("click", validate);
  inputs.forEach(function(input) {
    input.addEventListener("keydown", function(event) {
      if (event.key === "Enter") {
        event.preventDefault();
        validate();
      }
    });
  });
}

function isDomReady() {
  return document.readyState === "complete" || document.readyState === "interactive";
}

initDB().then(function() {
  if (!hasAccess()) {
    if (isDomReady()) {
      showAccessOverlay();
    } else {
      document.addEventListener("DOMContentLoaded", showAccessOverlay);
    }
  }
});
