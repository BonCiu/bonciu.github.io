# 🔐 System Licencji - Index Plików

## 📚 Dokumentacja (CZYTAJ NAJPIERW!)

| Plik | Zawartość |
|------|-----------|
| **QUICK_START.md** | ⚡ 5 minut do uruchomienia |
| **LICENSE_SYSTEM_README.md** | 📖 Pełna dokumentacja |
| **INTEGRATION_GUIDE.md** | 🔧 Jak zintegrować z index.html |

---

## 🔌 Backend

| Plik | Opis |
|------|------|
| `backend/server.js` | Główny serwer Node.js |
| `backend/package.json` | Zależności npm |
| `backend/.env` | 🔑 Konfiguracja (ZMIEŃ!) |
| `backend/.env.example` | Przykład .env |
| `backend/README.md` | Dokumentacja API |
| `backend/data/` | Baza danych (JSON) |

---

## 🌐 Frontend - Strony

| Plik | URL | Opis |
|------|-----|------|
| `login.html` | `/login.html` | Rejestracja & Logowanie |
| `admin-login.html` | `/admin-login.html` | Login Admina |
| `admin.html` | `/admin.html` | Panel Zarządzania Licencjami |
| `index.html` | `/index.html` | Aplikacja (chroniona) |

---

## 📁 Assets

| Plik | Opis |
|------|------|
| `assets/license-check.js` | Middleware ochrony (dodaj do index.html) |
| `assets/main.css` | Style strony |

---

## 🚀 Jak Uruchomić?

### 1. Konfiguracja
```bash
# Edytuj backend/.env
# Wstaw Gmail i hasło admina
```

### 2. Start
```bash
cd backend
npm install
npm start
```

### 3. Testy
- Login: http://localhost:5000/login.html
- Admin: http://localhost:5000/admin-login.html
- Panel: http://localhost:5000/admin.html

---

## 📊 Flow Licencji

```
UŻYTKOWNIK
│
├─→ 1. Rejestracja (login.html)
│   ├─ Email
│   └─ Hasło (min 8 znaków)
│
├─→ 2. Czeka na licencję
│   (Admin przypisuje w admin.html)
│
├─→ 3. Otrzymuje email
│   └─ Kod: LIC20260701ABC123
│
└─→ 4. Logowanie (login.html)
    ├─ Email
    ├─ Hasło
    └─ Kod licencji
    │
    └─→ ✅ DOSTĘP PRZYZNANY
        └─→ index.html (chroniona)
```

---

## 🔐 Admin Panel

```
ADMIN
│
├─→ admin-login.html
│   └─ Hasło (ADMIN_PASSWORD z .env)
│
├─→ admin.html
│   ├─ Wybierz użytkownika
│   ├─ Przypisz licencję
│   ├─ Wysyła email automatycznie
│   ├─ Dezaktywuj licencję
│   └─ Widok logów dostępu
│
└─→ Logi: backend/data/access-logs.json
    ├─ Email
    ├─ IP adres
    ├─ Czas dostępu
    └─ Kod licencji
```

---

## 🗄️ Baza Danych (JSON)

```
backend/data/
├── users.json
│   └─ {id, email, password_hash, license}
│
├── licenses.json
│   └─ {code, email, assignedAt, active}
│
└── access-logs.json
    └─ {email, timestamp, ipAddress, licenseCode}
```

---

## 🔑 Zmienne .env

```
PORT=5000                              # Port backendu
ADMIN_PASSWORD=...                     # Hasło admina
GMAIL_EMAIL=...                        # Email Google
GMAIL_APP_PASSWORD=...                 # Hasło App (Google)
CORS_ORIGIN=...                        # Domeny frontend
NODE_ENV=development|production        # Tryb
```

---

## 📞 API Endpoints

| Metoda | Endpoint | Opis |
|--------|----------|------|
| POST | `/api/register` | Rejestracja |
| POST | `/api/login` | Logowanie ze licencją |
| POST | `/api/admin/login` | Login admina |
| GET | `/api/admin/users` | Lista użytkowników |
| POST | `/api/admin/assign-license` | Przypisz licencję |
| POST | `/api/admin/deactivate-license` | Dezaktywuj licencję |
| GET | `/api/admin/access-logs` | Logi dostępu |

---

## ⚙️ Integracja z index.html

Dodaj do `<head>`:

```html
<script>
  (function() {
    const user = localStorage.getItem('user');
    if (!user) {
      window.location.href = '/login.html';
      return;
    }
  })();
</script>
```

Lub:

```html
<script src="assets/license-check.js"></script>
```

---

## ✅ Checklist Uruchomienia

- [ ] Gmail ma 2FA włączone
- [ ] `.env` ma poprawne dane
- [ ] `npm install` w `backend`
- [ ] `npm start` działa bez błędów
- [ ] Rejestracja działa
- [ ] Admin panel dostępny
- [ ] Email przychodz do skrzynki
- [ ] Login ze licencją działa
- [ ] index.html chroniony

---

## 🆘 Troubleshooting

| Problem | Rozwiązanie |
|---------|-------------|
| "Cannot GET /api/register" | Backend nie uruchomiony |
| "Invalid credentials" (email) | Hasło Gmail nieprawidłowe |
| "CORS error" | Dodaj domenę do CORS_ORIGIN |
| Email nie przychodzi | Czekaj 30s, spam folder |
| `npm: command not found` | Zainstaluj Node.js |

---

## 📖 Kolejne Kroki

1. Przeczytaj: `QUICK_START.md`
2. Skonfiguruj: `backend/.env`
3. Uruchom: `npm start` w `backend/`
4. Testuj: `login.html` → `admin.html`
5. Zintegruj: `license-check.js` w `index.html`

---

**Powodzenia! 🚀**
