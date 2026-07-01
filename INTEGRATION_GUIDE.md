# ⚙️ Integracja ochrony licencji z istniejącym index.html

## Jak chronić Twoją aplikację

### Opcja 1: Dodaj to bezpośrednio do `index.html`

W sekcji `<head>` dodaj:

```html
<script>
  // Sprawdzenie licencji - MUSISZ TO DODAĆ!
  (function() {
    const user = localStorage.getItem('user');
    if (!user) {
      window.location.href = '/login.html';
      return;
    }
    try {
      const userData = JSON.parse(user);
      console.log('✅ Dostęp przyznany dla:', userData.email);
    } catch (e) {
      localStorage.removeItem('user');
      window.location.href = '/login.html';
    }
  })();
</script>
```

### Opcja 2: Użyj zewnętrznego skryptu

W sekcji `</head>` dodaj:

```html
<script src="assets/license-check.js"></script>
```

(Plik już istnieje!)

### Opcja 3: Dodaj opcję wylogowania

Gdzieś w swoim HTML (np. w stopce):

```html
<button onclick="logout()">Wyloguj</button>
```

```javascript
<script>
function logout() {
  localStorage.removeItem('user');
  window.location.href = '/login.html';
}
</script>
```

---

## 🧪 Test

1. **Usuń dane logowania z localStorage:**
   - Otwórz DevTools (F12)
   - Console → `localStorage.removeItem('user')`
   - Odśwież stronę
   - Powinno Cię przeskoczyć na `/login.html`

2. **Zaloguj się**
   - Wpisz istniejące konto (albo utwórz nowe na `/login.html`)
   - Wpisz kod licencji (jak go nie masz - idź do `/admin-login.html` i przypisz)
   - Powinno Cię wpuścić na aplikację

---

## 🔄 Flow logowania

```
User bez dostępu
    ↓
/login.html (rejestracja/logowanie)
    ↓
Email + hasło + kod licencji
    ↓
Backend weryfikuje
    ↓
localStorage.setItem('user', {...})
    ↓
Przekierowanie na /index.html
    ↓
license-check.js sprawdza czy user istnieje
    ↓
✅ Dostęp przyznany
```

---

## 📱 Mobilne dostępy

Jeśli chcesz, aby mobilne aplikacje mogły się logować:

1. **Aplikacja na telefonie wysyła request:**
```
POST /api/login
{
  "email": "user@example.com",
  "password": "...",
  "licenseCode": "LIC..."
}
```

2. **Otrzymuje:**
```json
{
  "success": true,
  "email": "user@example.com",
  "license": "LIC...",
  "userId": "..."
}
```

3. **Zapisuje w appData** i używa do weryfikacji dalej

---

## ❌ Przy problemach

Jeśli ktoś próbuje wejść bez licencji:

1. Konsola przeglądarki (F12):
```javascript
localStorage.getItem('user')  // null = brak dostępu
```

2. Backend logi (`backend/data/access-logs.json`):
```json
{
  "email": "hacker@example.com",
  "timestamp": "2026-07-01T...",
  "ipAddress": "192.168.1.x",
  "licenseCode": "LIC..."
}
```

---

## 🎉 Gotowe!

Teraz tylko zalogowani użytkownicy z ważną licencją mogą korzystać z aplikacji!
