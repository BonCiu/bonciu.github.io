const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*'
}));
app.use(bodyParser.json());

// Data files
const dataDir = path.join(__dirname, 'data');
const usersFile = path.join(dataDir, 'users.json');
const licensesFile = path.join(dataDir, 'licenses.json');
const accessLogsFile = path.join(dataDir, 'access-logs.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize data files
const initializeDataFiles = () => {
  if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(licensesFile)) {
    fs.writeFileSync(licensesFile, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(accessLogsFile)) {
    fs.writeFileSync(accessLogsFile, JSON.stringify([], null, 2));
  }
};

// Helper functions
const readJSONFile = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return [];
  }
};

const writeJSONFile = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

const generateLicenseCode = () => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `LIC${dateStr}${randomStr}`;
};

// Email setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

const sendLicenseEmail = async (email, licenseCode) => {
  const mailOptions = {
    from: process.env.GMAIL_EMAIL,
    to: email,
    subject: '🔐 Twój kod licencji - Aplikacja',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #026eff;">Twój kod licencji</h2>
        <p>Cześć,</p>
        <p>Poniżej znajdziesz Twój kod licencji do aplikacji:</p>
        <div style="background: #f0f0f0; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
          <h1 style="color: #026eff; letter-spacing: 2px; margin: 0;">${licenseCode}</h1>
        </div>
        <p><strong>Instrukcja:</strong></p>
        <ol>
          <li>Wejdź na <strong>stronę logowania</strong></li>
          <li>Wpisz swój email</li>
          <li>Wpisz otrzymany kod licencji</li>
          <li>Kliknij "Zaloguj się"</li>
        </ol>
        <p style="color: #666; font-size: 12px;">Kod jest ważny bezterminowo. Nie udostępniaj go innym osobom.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Błąd wysyłania emailu:', error);
    return { success: false, error: error.message };
  }
};

// Routes

// 1. REJESTRACJA - Nowy użytkownik
app.post('/api/register', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email i hasło są wymagane' });
  }

  const users = readJSONFile(usersFile);

  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'Ten email jest już zarejestrowany' });
  }

  const newUser = {
    id: crypto.randomUUID(),
    email,
    password: crypto.createHash('sha256').update(password).digest('hex'),
    createdAt: new Date().toISOString(),
    license: null
  };

  users.push(newUser);
  writeJSONFile(usersFile, users);

  res.status(201).json({ 
    success: true, 
    message: 'Rejestracja pomyślna! Możesz się teraz zalogować.',
    userId: newUser.id 
  });
});

// 2. LOGOWANIE - Sprawdzenie emailu i hasła
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email i hasło są wymagane' });
  }

  const users = readJSONFile(usersFile);
  const user = users.find(u => u.email === email);

  if (!user) {
    return res.status(401).json({ error: 'Nieprawidłowy email lub hasło' });
  }

  const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
  if (user.password !== passwordHash) {
    return res.status(401).json({ error: 'Nieprawidłowy email lub hasło' });
  }

  if (!user.license) {
    return res.status(403).json({ error: 'Nie masz przypisanej licencji' });
  }

  // Sprawdzenie czy licencja jest aktywna
  const licenses = readJSONFile(licensesFile);
  const license = licenses.find(l => l.code === user.license);

  if (!license || !license.active) {
    return res.status(403).json({ error: 'Twoja licencja nie jest aktywna' });
  }

  // Zapis dostępu do logów
  const accessLogs = readJSONFile(accessLogsFile);
  accessLogs.push({
    email,
    timestamp: new Date().toISOString(),
    ipAddress: req.ip || 'unknown',
    userAgent: req.get('user-agent'),
    licenseCode: user.license
  });
  writeJSONFile(accessLogsFile, accessLogs);

  res.json({
    success: true,
    message: 'Zalogowanie pomyślne!',
    userId: user.id,
    email: user.email,
    license: user.license
  });
});

// 3. WERYFIKACJA LICENCJI - Dla frontendu
app.post('/api/verify-license', (req, res) => {
  const { email, licenseCode } = req.body;

  if (!email || !licenseCode) {
    return res.status(400).json({ error: 'Email i kod licencji są wymagane' });
  }

  const users = readJSONFile(usersFile);
  const user = users.find(u => u.email === email);

  if (!user) {
    return res.status(401).json({ error: 'Użytkownik nie znaleziony' });
  }

  if (user.license !== licenseCode) {
    return res.status(403).json({ error: 'Nieprawidłowy kod licencji' });
  }

  const licenses = readJSONFile(licensesFile);
  const license = licenses.find(l => l.code === licenseCode);

  if (!license || !license.active) {
    return res.status(403).json({ error: 'Licencja nie jest aktywna' });
  }

  // Zapis dostępu
  const accessLogs = readJSONFile(accessLogsFile);
  accessLogs.push({
    email,
    timestamp: new Date().toISOString(),
    ipAddress: req.ip || 'unknown',
    licenseCode
  });
  writeJSONFile(accessLogsFile, accessLogs);

  res.json({ success: true, message: 'Licencja jest aktywna' });
});

// 4. PANEL ADMINA - Zalogowanie admina
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Nieprawidłowe hasło admina' });
  }

  res.json({ 
    success: true, 
    message: 'Zalogowanie do panelu admina pomyślne',
    token: crypto.randomBytes(32).toString('hex')
  });
});

// 5. PANEL ADMINA - Lista użytkowników
app.get('/api/admin/users', (req, res) => {
  const adminToken = req.headers.authorization?.split(' ')[1];
  if (!adminToken) {
    return res.status(401).json({ error: 'Brak autoryzacji' });
  }

  const users = readJSONFile(usersFile);
  const usersWithoutPassword = users.map(u => ({
    id: u.id,
    email: u.email,
    license: u.license,
    createdAt: u.createdAt
  }));

  res.json(usersWithoutPassword);
});

// 6. PANEL ADMINA - Przypisz licencję użytkownikowi
app.post('/api/admin/assign-license', (req, res) => {
  const { email } = req.body;
  const adminToken = req.headers.authorization?.split(' ')[1];

  if (!adminToken) {
    return res.status(401).json({ error: 'Brak autoryzacji' });
  }

  const users = readJSONFile(usersFile);
  const user = users.find(u => u.email === email);

  if (!user) {
    return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
  }

  if (user.license) {
    return res.status(400).json({ error: 'Użytkownik ma już przypisaną licencję' });
  }

  // Wygeneruj nowy kod licencji
  const licenseCode = generateLicenseCode();

  // Dodaj licencję do bazy
  const licenses = readJSONFile(licensesFile);
  licenses.push({
    code: licenseCode,
    email,
    assignedAt: new Date().toISOString(),
    active: true
  });
  writeJSONFile(licensesFile, licenses);

  // Przypisz licencję do użytkownika
  user.license = licenseCode;
  writeJSONFile(usersFile, users);

  // Wyślij email
  sendLicenseEmail(email, licenseCode).then(result => {
    if (result.success) {
      res.json({
        success: true,
        message: `Kod licencji wysłany na email: ${email}`,
        licenseCode
      });
    } else {
      res.status(500).json({
        error: `Błąd wysyłania emailu: ${result.error}`,
        licenseCode
      });
    }
  });
});

// 7. PANEL ADMINA - Dezaktywuj licencję
app.post('/api/admin/deactivate-license', (req, res) => {
  const { email } = req.body;
  const adminToken = req.headers.authorization?.split(' ')[1];

  if (!adminToken) {
    return res.status(401).json({ error: 'Brak autoryzacji' });
  }

  const users = readJSONFile(usersFile);
  const user = users.find(u => u.email === email);

  if (!user || !user.license) {
    return res.status(404).json({ error: 'Licencja nie znaleziona' });
  }

  const licenses = readJSONFile(licensesFile);
  const license = licenses.find(l => l.code === user.license);

  if (license) {
    license.active = false;
  }

  writeJSONFile(licensesFile, licenses);

  res.json({ success: true, message: 'Licencja została dezaktywowana' });
});

// 8. PANEL ADMINA - Logi dostępu
app.get('/api/admin/access-logs', (req, res) => {
  const adminToken = req.headers.authorization?.split(' ')[1];

  if (!adminToken) {
    return res.status(401).json({ error: 'Brak autoryzacji' });
  }

  const logs = readJSONFile(accessLogsFile);
  res.json(logs.slice(-100)); // Ostatnie 100 logów
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend działa prawidłowo' });
});

// Initialize i start
initializeDataFiles();
app.listen(PORT, () => {
  console.log(`🚀 Backend uruchomiony na porcie ${PORT}`);
  console.log(`📧 Email: ${process.env.GMAIL_EMAIL}`);
});
