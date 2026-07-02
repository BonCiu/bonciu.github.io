// Middleware do sprawdzania licencji
(function checkLicense() {
  const user = localStorage.getItem('user');
  const path = window.location.pathname.toLowerCase();
  const isLoginPage = path.endsWith('/login.html');
  const isAdminPage = path.includes('/admin');
  const isAdminLoginPage = path.endsWith('/admin-login.html');

  if (!user) {
    if (!isLoginPage && !isAdminLoginPage && !isAdminPage) {
      const returnUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      localStorage.setItem('redirect-after-login', returnUrl || '/');
      window.location.href = '/login.html';
    }
    return;
  }

  try {
    const userData = JSON.parse(user);
    console.log('✅ Użytkownik zalogowany:', userData.email);
  } catch (e) {
    localStorage.removeItem('user');
    if (!isLoginPage) {
      window.location.href = '/login.html';
    }
  }
})();

// Funkcja do wylogowania
function logout() {
  localStorage.removeItem('user');
  localStorage.removeItem('redirect-after-login');
  window.location.href = '/login.html';
}

// Pobierz dane użytkownika
function getUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}
