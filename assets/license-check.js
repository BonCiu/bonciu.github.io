// Middleware do sprawdzania licencji
(function checkLicense() {
  const user = localStorage.getItem('user');
  
  if (!user) {
    // Nie zalogowany - przejdź do logowania
    if (window.location.pathname !== '/login.html' && !window.location.pathname.includes('admin')) {
      window.location.href = '/login.html';
    }
    return;
  }

  try {
    const userData = JSON.parse(user);
    console.log('✅ Użytkownik zalogowany:', userData.email);
  } catch (e) {
    // Nieprawidłowe dane - wyczyść i przejdź do logowania
    localStorage.removeItem('user');
    window.location.href = '/login.html';
  }
})();

// Funkcja do wylogowania
function logout() {
  localStorage.removeItem('user');
  window.location.href = '/login.html';
}

// Pobierz dane użytkownika
function getUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}
