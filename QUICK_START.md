# 🚀 Szybki Start - 5 minut

## 1️⃣ Konfiguracja Gmail (1 min)

```
1. Wejdź: https://myaccount.google.com
2. Security → 2-Step Verification (włącz)
3. Security → App Passwords
4. Mail → Windows Computer
5. Skopiuj 16-znakowe hasło (BEZ SPACJI)
```

## 2️⃣ Edytuj `.env` (1 min)

Otwórz `backend/.env` i zmień:

```
ADMIN_PASSWORD=zmien_to_na_silne_haslo
GMAIL_EMAIL=twoj_email@gmail.com
GMAIL_APP_PASSWORD=XXXXXXXXXXXX
```

## 3️⃣ Start backendu (1 min)

```bash
cd backend
npm install
npm start
```

Czekaj aż ujrzysz: `🚀 Backend uruchomiony na porcie 5000`

## 4️⃣ Testy (2 min)

### Test 1: Rejestracja
- Wejdź: `http://localhost:5000/login.html`
- "Rejestracja" → email + hasło

### Test 2: Admin panel
- Wejdź: `http://localhost:5000/admin-login.html`
- Hasło: `zmien_to_na_silne_haslo` (z .env)
- Kliknij: "Przypisz licencję"
- Sprawdź email - powinien być kod licencji

### Test 3: Login ze licencją
- Wróć na `login.html`
- "Logowanie" → email + hasło + kod z emaila

## 🎉 Gotowe!

System licencji działa! 

---

## 📱 Ścieżki:

| Użytkownik | Link | Hasło? |
|-----------|------|--------|
| Rejestracja | `/login.html` | - |
| Logowanie | `/login.html` | email + hasło + kod |
| Admin | `/admin-login.html` | hasło z .env |
| Zarządzanie | `/admin.html` | przypisanie licencji |

---

## ⚠️ Jeśli coś nie działa:

1. **Backend nie startuje**
   - `npm install` w `backend`
   - Sprawdź czy Node.js zainstalowany: `node -v`

2. **"Invalid credentials" (email)**
   - Hasło z Google App Passwords bez spacji
   - Sprawdź czy 2FA włączone

3. **Email nie przychodzi**
   - Spam folder
   - Czekaj 30 sekund
   - Sprawdź konsolę (F12)

---

**Potrzebujesz pomocy? Czytaj `LICENSE_SYSTEM_README.md` lub `INTEGRATION_GUIDE.md`**
