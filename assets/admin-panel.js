var adminPassword = "admin2026";
var adminAuthKey = "admin_authenticated";
var dbName = "mObywatelDB";
var storeName = "accessCodes";
var encryptionKey = "mObywatel_secure_key_2026";
var defaultEncodedCode = "MDQyMDY5";

var db = null;

function initDatabase() {
  return new Promise(function(resolve, reject) {
    var request = indexedDB.open(dbName, 1);
    request.onerror = function() {
      reject("IndexedDB error");
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

function encryptData(plaintext) {
  return CryptoJS.AES.encrypt(plaintext, encryptionKey).toString();
}

function decryptData(ciphertext) {
  try {
    var decrypted = CryptoJS.AES.decrypt(ciphertext, encryptionKey);
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    console.warn("Błąd deszyfrowania:", e);
    return null;
  }
}

function getDefaultAccessCodes() {
  return [atob(defaultEncodedCode)];
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
            console.warn("Niepoprawne dane kodów:", e);
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

function saveAccessCodes(codes) {
  return new Promise(function(resolve) {
    if (!db) {
      resolve();
      return;
    }
    var encrypted = encryptData(JSON.stringify(codes));
    var transaction = db.transaction([storeName], "readwrite");
    var objectStore = transaction.objectStore(storeName);
    var request = objectStore.put({ id: "codes", encrypted: encrypted });
    request.onerror = function() {
      console.warn("Błąd zapisu kodów");
    };
    request.onsuccess = function() {
      resolve();
    };
  });
}

function ensureDefaultAccessCodes() {
  getStoredAccessCodes().then(function(stored) {
    if (!stored) {
      saveAccessCodes(getDefaultAccessCodes());
    }
  });
}

function isAdminAuthenticated() {
  return localStorage.getItem(adminAuthKey) === "true";
}

function authenticateAdmin(password) {
  if (password === adminPassword) {
    localStorage.setItem(adminAuthKey, "true");
    return true;
  }
  return false;
}

function logoutAdmin() {
  localStorage.removeItem(adminAuthKey);
}

function renderCodes() {
  getAccessCodes().then(function(codes) {
    var list = document.getElementById("codes-list");
    list.innerHTML = "";
    codes.forEach(function(code) {
      var item = document.createElement("li");
      item.textContent = code;
      var removeButton = document.createElement("button");
      removeButton.textContent = "Usuń";
      removeButton.addEventListener("click", function() {
        var filtered = codes.filter(function(value) {
          return value !== code;
        });
        if (!filtered.length) {
          filtered = getDefaultAccessCodes();
        }
        saveAccessCodes(filtered).then(function() {
          renderCodes();
          showPanelMessage("Kod został usunięty.", false);
        });
      });
      item.appendChild(removeButton);
      list.appendChild(item);
    });
  });
}

function showAuthSection() {
  document.getElementById("admin-auth").style.display = "grid";
  document.getElementById("admin-panel").style.display = "none";
}

function showPanelSection() {
  document.getElementById("admin-auth").style.display = "none";
  document.getElementById("admin-panel").style.display = "grid";
  renderCodes();
}

function showAuthMessage(message, isError) {
  var element = document.getElementById("admin-auth-message");
  element.textContent = message;
  element.className = isError ? "admin-error" : "admin-message";
}

function showPanelMessage(message, isError) {
  var element = document.getElementById("admin-panel-message");
  element.textContent = message;
  element.className = isError ? "admin-error" : "admin-message";
}

function addAccessCode() {
  var input = document.getElementById("new-access-code");
  var code = input.value.trim();
  if (!/^\d{6}$/.test(code)) {
    showPanelMessage("Kod musi składać się z 6 cyfr.", true);
    return;
  }
  getAccessCodes().then(function(codes) {
    if (codes.includes(code)) {
      showPanelMessage("Ten kod już istnieje.", true);
      return;
    }
    codes.push(code);
    saveAccessCodes(codes).then(function() {
      input.value = "";
      renderCodes();
      showPanelMessage("Kod został dodany.", false);
    });
  });
}

function initAdminPage() {
  initDatabase().then(function() {
    ensureDefaultAccessCodes();

    var loginButton = document.getElementById("admin-login");
    var logoutButton = document.getElementById("admin-logout");
    var addCodeButton = document.getElementById("add-access-code");

    loginButton.addEventListener("click", function() {
      var passwordInput = document.getElementById("admin-password");
      var password = passwordInput.value.trim();
      if (authenticateAdmin(password)) {
        passwordInput.value = "";
        showPanelSection();
        showAuthMessage("", false);
      } else {
        showAuthMessage("Niepoprawne hasło.", true);
      }
    });

    logoutButton.addEventListener("click", function() {
      logoutAdmin();
      showAuthSection();
      showPanelMessage("", false);
      showAuthMessage("Wylogowano.", false);
    });

    addCodeButton.addEventListener("click", addAccessCode);

    if (isAdminAuthenticated()) {
      showPanelSection();
    } else {
      showAuthSection();
    }
  });
}

document.addEventListener("DOMContentLoaded", initAdminPage);
