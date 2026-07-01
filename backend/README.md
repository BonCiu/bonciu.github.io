# 🔐 System Licencyjny - Backend

## Konfiguracja

### 1. Zainstaluj zależności
```bash
cd backend
npm install
```

### 2. Konfiguracja Gmail (WAŻNE!)

1. **Wejdź na Google Account**: https://myaccount.google.com
2. Przejdź do **Security** (Bezpieczeństwo)
3. Włącz **2-Step Verification** (Weryfikację dwustopniową)
4. Przejdź do **App Passwords** (Hasła aplikacji)
5. Wybierz: Mail → Windows Computer
6. Google wygeneruje **16-znakowe hasło** (ze spacjami)
7. Skopiuj je (bez spacji)

### 3. Skonfiguruj .env
Otwórz plik `backend/.env` i wpisz:

```
PORT=5000
ADMIN_PASSWORD=zmień_to_na_silne_haslo
GMAIL_EMAIL=twoj_email@gmail.com
GMAIL_APP_PASSWORD=XXXX-XXXX-XXXX-XXXX
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173,http://localhost:3000,http://localhost:5000
```

### 4. Uruchom backend
```bash
npm start
```

lub w trybie dev (automatyczne restartowanie):
```bash
npm run dev
```

## API Endpoints

### Rejestracja
```
POST /api/register
{
  "email": "user@example.com",
  "password": "hasło123"
}
```

### Logowanie
```
POST /api/login
{
  "email": "user@example.com",
  "password": "hasło123"
}
```

### Weryfikacja licencji
```
POST /api/verify-license
{
  "email": "user@example.com",
  "licenseCode": "LIC20260701ABC123"
}
```

### Panel Admina - Zalogowanie
```
POST /api/admin/login
{
  "password": "twoje_hasło_admina"
}
```

### Panel Admina - Lista użytkowników
```
GET /api/admin/users
Headers: Authorization: Bearer TOKEN
```

### Panel Admina - Przypisz licencję
```
POST /api/admin/assign-license
Headers: Authorization: Bearer TOKEN
{
  "email": "user@example.com"
}
```

### Panel Admina - Dezaktywuj licencję
```
POST /api/admin/deactivate-license
Headers: Authorization: Bearer TOKEN
{
  "email": "user@example.com"
}
```

### Panel Admina - Logi dostępu
```
GET /api/admin/access-logs
Headers: Authorization: Bearer TOKEN
```

## Struktura danych

### users.json
```json
[
  {
    "id": "uuid",
    "email": "user@example.com",
    "password": "hash_sha256",
    "createdAt": "2026-07-01T10:00:00Z",
    "license": "LIC20260701ABC123"
  }
]
```

### licenses.json
```json
[
  {
    "code": "LIC20260701ABC123",
    "email": "user@example.com",
    "assignedAt": "2026-07-01T10:00:00Z",
    "active": true
  }
]
```

### access-logs.json
```json
[
  {
    "email": "user@example.com",
    "timestamp": "2026-07-01T10:30:00Z",
    "ipAddress": "192.168.1.1",
    "licenseCode": "LIC20260701ABC123"
  }
]
```

## Troubleshooting

**Błąd: "Invalid credentials"**
- Sprawdź czy .env ma prawidłowe dane Gmail
- Upewnij się, że masz włączoną 2FA na Google Account
- Sprawdź czy hasło aplikacji jest bez spacji

**Błąd: "CORS error"**
- Dodaj domenę frontendu do `CORS_ORIGIN` w .env
- Rozdziel domenę przecinkami, np: `http://localhost:3000,https://example.com`

**Błąd: "Cannot send email"**
- Sprawdź połączenie internetowe
- Przejrzyj dziennik (logi) w konsoli
- Upewnij się, że hasło aplikacji jest prawidłowe
