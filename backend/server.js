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

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
};

const parseUserAgentInfo = (userAgent = '') => {
  const ua = userAgent.toLowerCase();
  let browser = 'Unknown';
  if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari')) browser = 'Safari';
  else if (ua.includes('opr/')) browser = 'Opera';
  else if (ua.includes('brave')) browser = 'Brave';

  let os = 'Unknown';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac os')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

  let device = 'Desktop';
  if (ua.includes('mobile')) device = 'Mobile';
  else if (ua.includes('tablet') || ua.includes('ipad')) device = 'Tablet';

  return { browser, os, device };
};

const getLocationFromIp = async (ipAddress) => {
  if (!ipAddress || ipAddress === 'unknown' || ipAddress.startsWith('::ffff:')) {
    return 'unknown';
  }

  const normalizedIp = ipAddress.startsWith('::ffff:') ? ipAddress.replace(/^::ffff:/, '') : ipAddress;

  try {
    const response = await fetch(`https://ipapi.co/${normalizedIp}/json/`);
    if (!response.ok) return 'unknown';
    const data = await response.json();
    if (data?.error) return 'unknown';

    const parts = [data.city, data.region, data.country_name].filter(Boolean);
    return parts.length ? parts.join(', ') : 'unknown';
  } catch (error) {
    return 'unknown';
  }
};

const getRequestMeta = (req) => ({
  method: req.method || 'GET',
  path: req.originalUrl || req.url || '',
  protocol: req.protocol || 'http',
  host: req.get('host') || '',
  referer: req.get('referer') || '',
  origin: req.get('origin') || '',
  acceptLanguage: req.get('accept-language') || '',
  acceptEncoding: req.get('accept-encoding') || '',
  forwardedFor: req.get('x-forwarded-for') || '',
  realIp: req.get('x-real-ip') || '',
  cfConnectingIp: req.get('cf-connecting-ip') || '',
  userAgent: req.get('user-agent') || '',
  headers: {
    accept: req.get('accept') || '',
    'accept-language': req.get('accept-language') || '',
    referer: req.get('referer') || '',
    origin: req.get('origin') || '',
    'user-agent': req.get('user-agent') || '',
    'sec-ch-ua': req.get('sec-ch-ua') || '',
    'sec-ch-platform': req.get('sec-ch-platform') || '',
    'x-forwarded-for': req.get('x-forwarded-for') || '',
    'x-real-ip': req.get('x-real-ip') || '',
    'cf-connecting-ip': req.get('cf-connecting-ip') || ''
  }
});

const logAccessEvent = async (req, payload = {}) => {
  const clientInfo = payload.clientInfo || {};
  const userAgent = clientInfo.userAgent || req.get('user-agent') || '';
  const ipAddress = getClientIp(req);
  const uaInfo = parseUserAgentInfo(userAgent);
  const location = await getLocationFromIp(ipAddress);
  const requestMeta = getRequestMeta(req);

  const accessLog = {
    email: payload.email || 'unknown',
    timestamp: new Date().toISOString(),
    ipAddress,
    fullIpAddress: ipAddress,
    location,
    userAgent,
    browser: clientInfo.browser || uaInfo.browser,
    os: clientInfo.os || uaInfo.os,
    device: clientInfo.device || uaInfo.device,
    platform: clientInfo.platform || uaInfo.os,
    language: clientInfo.language || req.get('accept-language') || '',
    timezone: clientInfo.timezone || '',
    screen: clientInfo.screen || '',
    deviceMemory: clientInfo.deviceMemory || '',
    hardwareConcurrency: clientInfo.hardwareConcurrency || '',
    cookiesEnabled: clientInfo.cookiesEnabled || '',
    doNotTrack: clientInfo.doNotTrack || '',
    referrer: clientInfo.referrer || requestMeta.referer || '',
    origin: clientInfo.origin || requestMeta.origin || '',
    method: requestMeta.method,
    path: requestMeta.path,
    requestHeaders: requestMeta.headers,
    host: requestMeta.host,
    protocol: requestMeta.protocol,
    acceptLanguage: requestMeta.acceptLanguage,
    acceptEncoding: requestMeta.acceptEncoding,
    forwardedFor: requestMeta.forwardedFor,
    realIp: requestMeta.realIp,
    cfConnectingIp: requestMeta.cfConnectingIp,
    licenseCode: payload.licenseCode || ''
  };

  const accessLogs = readJSONFile(accessLogsFile);
  accessLogs.push(accessLog);
  writeJSONFile(accessLogsFile, accessLogs);
};

// Data files
const getStorageDir = () => {
  const candidates = [
    process.env.DATA_DIR,
    process.env.RAILWAY_VOLUME_MOUNT_PATH,
    process.env.RAILWAY_VOLUME_PATH,
    process.env.PERSISTENT_STORAGE_PATH,
    process.env.VOLUME_PATH
  ].filter(Boolean);

  for (const candidate of candidates) {
    const resolved = path.resolve(candidate);
    if (resolved) {
      return resolved;
    }
  }

  return path.join(__dirname, 'data');
};

const dataDir = getStorageDir();
const usersFile = path.join(dataDir, 'users.json');
const licensesFile = path.join(dataDir, 'licenses.json');
const accessLogsFile = path.join(dataDir, 'access-logs.json');

const ensureDataDirectory = () => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

const migrateLegacyDataFiles = () => {
  const legacyDataDir = path.join(__dirname, 'data');
  if (legacyDataDir === dataDir) return;

  const filesToMigrate = ['users.json', 'licenses.json', 'access-logs.json'];
  filesToMigrate.forEach((fileName) => {
    const legacyFile = path.join(legacyDataDir, fileName);
    const targetFile = path.join(dataDir, fileName);

    if (!fs.existsSync(targetFile) && fs.existsSync(legacyFile)) {
      fs.copyFileSync(legacyFile, targetFile);
    }
  });
};

// Ensure data directory exists
ensureDataDirectory();
migrateLegacyDataFiles();

// Initialize data files
const initializeDataFiles = () => {
  ensureDataDirectory();

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
app.post('/api/login', async (req, res) => {
  const { email, password, licenseCode, clientInfo } = req.body;

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

  const licenses = readJSONFile(licensesFile);
  const license = licenses.find(l => l.code === user.license);

  if (!license || !license.active) {
    return res.status(403).json({ error: 'Twoja licencja nie jest aktywna' });
  }

  await logAccessEvent(req, {
    email,
    licenseCode: licenseCode || user.license,
    clientInfo
  });

  res.json({
    success: true,
    message: 'Zalogowanie pomyślne!',
    userId: user.id,
    email: user.email,
    license: user.license
  });
});

// 3. WERYFIKACJA LICENCJI - Dla frontendu
app.post('/api/verify-license', async (req, res) => {
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

  await logAccessEvent(req, {
    email,
    licenseCode,
    clientInfo: req.body.clientInfo || {}
  });

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
  res.json({
    status: 'OK',
    message: 'Backend działa prawidłowo',
    storageDir: dataDir
  });
});

// Initialize i start
initializeDataFiles();
app.listen(PORT, () => {
  console.log(`🚀 Backend uruchomiony na porcie ${PORT}`);
  console.log(`📦 Zapis danych: ${dataDir}`);
  console.log(`📧 Email: ${process.env.GMAIL_EMAIL}`);
});
