

const Auth = (() => {
  const USERS = { admin: { password: 'admin', role: 'Administrador', display: 'Admin' } };

  const login = (username, password) => {
    const user = USERS[username.toLowerCase()];
    if (user && user.password === password) {
      Storage.setSession({ username, role: user.role, display: user.display, loginAt: Date.now() });
      return true;
    }
    return false;
  };

  const logout = () => {
    Storage.clearSession();
    window.location.href = 'login.html';
  };

  const requireAuth = () => {
    if (!Storage.getSession()) {
      window.location.href = 'login.html';
      return null;
    }
    return Storage.getSession();
  };

  const getUser = () => Storage.getSession();

  return { login, logout, requireAuth, getUser };
})();

/* ─── Login page bootstrap ─── */
(function () {
  const form = document.getElementById('loginForm');
  if (!form) return;

  // Already logged in → go to app
  if (Storage.getSession()) {
    window.location.href = './';
    return;
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errBox   = document.getElementById('loginError');

    if (Auth.login(username, password)) {
      const btn = document.getElementById('loginBtn');
      btn.textContent = '✓ Entrando...';
      btn.style.background = 'var(--p-low)';
      btn.disabled = true;
      setTimeout(() => (window.location.href = 'index.html'), 700);
    } else {
      errBox.classList.add('visible');
      document.getElementById('loginPassword').value = '';
      document.getElementById('loginPassword').focus();
      setTimeout(() => errBox.classList.remove('visible'), 4000);
    }
  });
})();