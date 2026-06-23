// Layer 5 — Views
// Renders the authentication screen (Email + Password only).
// Magic link and public sign-up removed — user is pre-created in Supabase dashboard.

export const AuthView = {
  showLoading() {
    const app = document.getElementById('router-outlet');
    app.innerHTML = `
      <div class="loading-container">
        <div class="spinner"></div>
        <p>Entrando no seu espaço...</p>
      </div>
    `;
  },

  showError(message) {
    const errorEl = document.getElementById('auth-error');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }
  },

  hideError() {
    const errorEl = document.getElementById('auth-error');
    if (errorEl) errorEl.style.display = 'none';
  },

  render({ onLogin }) {
    const app = document.getElementById('router-outlet');
    app.innerHTML = `
      <div class="auth-card glass">
        <div class="auth-header">
          <div class="auth-logo">🌱</div>
          <h1>Plataforma de Mudança</h1>
          <p>Seu espaço seguro para evoluir sem cobranças ou pressões</p>
        </div>

        <div id="auth-error" class="error-box" style="display: none;"></div>

        <form id="form-login" class="auth-form">
          <div class="form-group">
            <label for="login-email">E-mail</label>
            <input
              type="email"
              id="login-email"
              placeholder="nome@exemplo.com"
              required
              autocomplete="email"
            />
          </div>
          <div class="form-group">
            <label for="login-password">Senha</label>
            <input
              type="password"
              id="login-password"
              placeholder="Sua senha"
              required
              autocomplete="current-password"
            />
          </div>
          <button type="submit" id="btn-login" class="btn btn-primary btn-full">
            Entrar
          </button>
        </form>

        <div class="auth-footer">
          <p>Foco no progresso, não na perfeição. 🌿</p>
        </div>
      </div>
    `;

    document.getElementById('form-login').addEventListener('submit', async (e) => {
      e.preventDefault();
      AuthView.hideError();

      const email    = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const btn      = document.getElementById('btn-login');

      btn.disabled    = true;
      btn.textContent = 'Autenticando...';

      try {
        await onLogin({ email, password });
      } catch (err) {
        AuthView.showError(err.message ?? 'Credenciais inválidas. Tente novamente.');
        btn.disabled    = false;
        btn.textContent = 'Entrar';
      }
    });
  },
};
