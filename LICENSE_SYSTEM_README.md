# 🔐 System Licencyjny - Kompletna Instrukcja

## 📋 Przegląd

Kompletny system zarządzania licencjami dla aplikacji z:
- ✅ Rejestracja i logowanie użytkowników
- ✅ Generowanie kodów licencji
- ✅ Wysyłanie kodów na email (Gmail)
- ✅ Panel administratora do zarządzania licencjami
- ✅ Śledzenie dostępów (IP, email, czas)

---

## 🚀 Szybki Start

### 1. Konfiguracja Gmail (WAŻNE!)

#### Krok 1: Włącz 2FA
1. Wejdź na https://myaccount.google.com
2. Przejdź do **Security** (Bezpieczeństwo)
3. Jeśli nie masz 2FA, kliknij **Enable 2-Step Verification**
4. Postępuj zgodnie z instrukcjami

#### Krok 2: Generuj hasło aplikacji
1. Wróć do Security
2. Szukaj **App Passwords** (Hasła aplikacji)
3. Wybierz: **Mail** → **Windows Computer**
4. Google wygeneruje 16-znakowe hasło (ze spacjami)
5. **Skopiuj bez spacji!** np: `XXXXXXXXXXXX` (12 znaków bez spacji)

#### Krok 3: Skonfiguruj .env
Otwórz `backend/.env` i zmień:

```
PORT=5000
ADMIN_PASSWORD=TWOJE_SILNE_HASLO_ADMINA
GMAIL_EMAIL=twoj_email@gmail.com
GMAIL_APP_PASSWORD=HASLO_Z_GOOGLE_BEZ_SPACJI
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000,http://localhost:5173,http://localhost:5000
```

### 2. Instalacja Backendu

```bash
cd backend
npm install
npm start
```

Backend uruchomi się na `http://localhost:5000`

### 3. Strony Frontend (już gotowe!)

| Strona | URL | Opis |
|--------|-----|------|
| Logowanie | `/login.html` | Rejestracja i logowanie użytkowników |
| Panel admina | `/admin-login.html` | Login do panelu admina |
| Zarządzanie | `/admin.html` | Panel do przypisywania licencji |
| Aplikacja | `/index.html` | Strona główna (chroniona licencją) |

---

## 📖 Instrukcja Użytkowania

### Dla użytkownika:

1. **Rejestracja**
   - Wejdź na `/login.html`
   - Kliknij "Rejestracja"
   - Wpisz email i hasło (min 8 znaków)

2. **Czekanie na licencję**
   - Admin musi przypisać Ci licencję
   - Otrzymasz email z kodem

3. **Logowanie**
   - Wróć do `/login.html`
   - Przełącz na "Logowanie"
   - Wpisz email, hasło i kod licencji
   - Kliknij "Zaloguj się"
   - Zyskasz dostęp do aplikacji

### Dla administratora:

1. **Login do panelu**
   - Wejdź na `/admin-login.html`
   - Wpisz hasło z `.env` (ADMIN_PASSWORD)

2. **Przypisanie licencji**
   - Odśwież listę użytkowników
   - Wybierz użytkownika z listy
   - Kliknij "Przypisz licencję"
   - System automatycznie wysyła kod na email
   - Kod pojawi się na ekranie

3. **Zarządzanie licencjami**
   - Widzisz listę wszystkich użytkowników
   - Obok każdego użytkownika przyciski akcji
   - Możesz dezaktywować licencję (🗑️)

4. **Monitoring**
   - W dolnej części widzisz logi dostępu
   - IP, email, czas zalogowania
   - Automatycznie się odświeża co 30 sekund

---

## 🗂️ Struktura plików

```
backend/
├── server.js              ← Główny backend
├── package.json           ← Zależności
├── .env                   ← Konfiguracja (Gmail, hasło)
├── README.md              ← Dokumentacja backendu
└── data/                  ← Baza danych (tworzy się automatycznie)
    ├── users.json         ← Użytkownicy
    ├── licenses.json      ← Licencje
    └── access-logs.json   ← Logi dostępu

Frontend (główny folder):
├── login.html             ← Rejestracja i logowanie
├── admin-login.html       ← Login admina
├── admin.html             ← Panel zarządzania
├── index.html             ← Aplikacja (chroniona)
└── assets/
    └── license-check.js   ← Sprawdzanie licencji
```

---

## 🔌 API Endpoints

### Rejestracja
```
POST /api/register
{
  "email": "user@example.com",
  "password": "haslo123"
}
```

### Logowanie
```
POST /api/login
{
  "email": "user@example.com",
  "password": "haslo123",
  "licenseCode": "LIC20260701ABC123"
}
```

### Admin - Login
```
POST /api/admin/login
{
  "password": "TWOJE_HASLO_ADMINA"
}
```

### Admin - Lista użytkowników
```
GET /api/admin/users
Headers: Authorization: Bearer TOKEN
```

### Admin - Przypisz licencję
```
POST /api/admin/assign-license
Headers: Authorization: Bearer TOKEN
{
  "email": "user@example.com"
}
```

---

## 🐛 Troubleshooting

### "Cannot GET /api/register"
- Backend nie uruchomiony
- Sprawdź: `npm start` w folderze `backend`

### "Invalid credentials" (email)
- Sprawdź czy hasło aplikacji Google jest prawidłowe
- Spróbuj regenerować hasło w Google Account
- Upewnij się, że w .env nie ma spacji

### "CORS error"
- Dodaj domenę do `CORS_ORIGIN` w `.env`
- Jeśli testujesz lokalnie, powinno być: `http://localhost:3000` (lub twój port)

### Email nie przychodzi
- Sprawdź folder spam
- Czekaj do 30 sekund
- Sprawdź czy Gmail ma włączone "Less secure app access" (jeśli stara wersja)

### Kod nie wysyła się z panelu admina
- Backend musi być uruchomiony
- Sprawdź konsolę (F12) czy są błędy
- Sprawdź czy .env ma poprawny email i hasło

---

## 🔒 Bezpieczeństwo

- Hasła są hashowane (SHA-256)
- Kody licencji generowane losowo
- Logi zawierają IP każdego dostępu
- Każda licencja powiązana z emailem
- Można dezaktywować licencję bez usuwania

---

## 📝 FAQ

**P: Czy mogę zmienić format kodu licencji?**
A: Tak! W `backend/server.js` zmień funkcję `generateLicenseCode()`

**P: Jak usunąć użytkownika?**
A: Ręcznie otwórz `backend/data/users.json` i usuń linię

**P: Czy jest limit licencji na użytkownika?**
A: Nie, jeden użytkownik = jedna licencja. Aby dać więcej, stwórz konta dla każdej osoby

**P: Jak zrobić backup licencji?**
A: Skopiuj folder `backend/data` na pendrive

**P: Czy mogę uruchomić to na produkcji?**
A: Tak! Odpali się na dowolnym serwerze z Node.js. Pamiętaj o zmianie `CORS_ORIGIN` na twój domen

---

## 🎯 Następne kroki

1. **Testowanie lokalne** - sprawdź czy wszystko działa
2. **Wdrożenie** - wrzuć na serwer
3. **Backup** - regularnie kopiuj `backend/data`
4. **Monitorowanie** - sprawdzaj logi dostępu

Powodzenia! 🚀
