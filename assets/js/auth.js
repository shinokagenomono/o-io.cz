/* ===========================
   Auth — PIN + GitHub PAT
=========================== */

const Auth = {

  // Ověř jestli je uživatel přihlášen
  isLoggedIn() {
    return sessionStorage.getItem('oiocz_session') === '1';
  },

  // Má zařízení uložený token?
  hasToken() {
    return !!localStorage.getItem('oiocz_token');
  },

  // Má zařízení nastavený PIN?
  hasPin() {
    return !!localStorage.getItem('oiocz_pin');
  },

  // Uložení tokenu
  saveToken(token) {
    localStorage.setItem('oiocz_token', token);
  },

  // Získání tokenu
  getToken() {
    return localStorage.getItem('oiocz_token');
  },

  // Hash PINu (jednoduchý, pro localStorage)
  async hashPin(pin) {
    const buf  = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pin + 'oiocz'));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  },

  // Uložení PINu
  async savePin(pin) {
    const hash = await this.hashPin(pin);
    localStorage.setItem('oiocz_pin', hash);
  },

  // Ověření PINu
  async verifyPin(pin) {
    const hash    = await this.hashPin(pin);
    const stored  = localStorage.getItem('oiocz_pin');
    return hash === stored;
  },

  // Přihlášení do session
  login() {
    sessionStorage.setItem('oiocz_session', '1');
  },

  // Odhlášení — smaže jen session, token a PIN zůstanou
  logout() {
    sessionStorage.removeItem('oiocz_session');
    location.reload();
  },

  // Ověření GitHub PAT tokenu
  async verifyToken(token) {
    try {
      const res = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
        }
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  // Zobraz přihlašovací obrazovku
  showLogin(onSuccess) {
    const overlay = document.createElement('div');
    overlay.id = 'auth-overlay';
    overlay.style.cssText = `
      position: fixed; inset: 0; background: #0f0f0f;
      display: flex; align-items: center; justify-content: center;
      z-index: 9999; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;

    if (!this.hasToken()) {
      this.renderSetup(overlay, onSuccess);
    } else {
      this.renderPin(overlay, onSuccess);
    }

    document.body.appendChild(overlay);
  },

  // Fáze 1: První spuštění — zadání tokenu + PINu
  renderSetup(overlay, onSuccess) {
    overlay.innerHTML = `
      <div style="width:360px;">

        <div style="text-align:center;margin-bottom:32px;">
          <div style="font-size:22px;font-weight:500;color:#e8e8e8;letter-spacing:-0.5px;">o-io.cz</div>
          <div style="font-size:13px;color:#555;margin-top:6px;">První spuštění — nastavení přístupu</div>
        </div>

        <div id="auth-step-1">
          <div style="margin-bottom:16px;">
            <div style="font-size:11px;color:#555;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:8px;">GitHub Personal Access Token</div>
            <input id="auth-token" type="password" placeholder="ghp_xxxxxxxxxxxx"
              style="width:100%;background:#141414;border:0.5px solid #2a2a2a;border-radius:6px;padding:10px 12px;font-size:13px;color:#e8e8e8;outline:none;"
              onfocus="this.style.borderColor='#7c8cf8'"
              onblur="this.style.borderColor='#2a2a2a'"
            />
            <div style="font-size:11px;color:#444;margin-top:6px;">
              GitHub → Settings → Developer settings → Personal access tokens → Fine-grained → repo scope
            </div>
          </div>
          <div id="auth-token-error" style="font-size:12px;color:#ef4444;margin-bottom:12px;display:none;"></div>
          <button id="auth-token-btn" onclick="Auth._submitToken()"
            style="width:100%;padding:10px;background:#1a1a2e;border:0.5px solid #7c8cf8;border-radius:6px;color:#7c8cf8;font-size:13px;cursor:pointer;">
            Ověřit token
          </button>
        </div>

        <div id="auth-step-2" style="display:none;">
          <div style="margin-bottom:16px;">
            <div style="font-size:11px;color:#555;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:8px;">Nastavit PIN</div>
            <input id="auth-pin-new" type="password" inputmode="numeric" maxlength="6" placeholder="4–6 číslic"
              style="width:100%;background:#141414;border:0.5px solid #2a2a2a;border-radius:6px;padding:10px 12px;font-size:20px;color:#e8e8e8;outline:none;letter-spacing:8px;text-align:center;"
              onfocus="this.style.borderColor='#7c8cf8'"
              onblur="this.style.borderColor='#2a2a2a'"
              onkeydown="if(event.key==='Enter') Auth._submitPinSetup()"
            />
          </div>
          <div style="margin-bottom:16px;">
            <div style="font-size:11px;color:#555;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:8px;">Potvrdit PIN</div>
            <input id="auth-pin-confirm" type="password" inputmode="numeric" maxlength="6" placeholder="4–6 číslic"
              style="width:100%;background:#141414;border:0.5px solid #2a2a2a;border-radius:6px;padding:10px 12px;font-size:20px;color:#e8e8e8;outline:none;letter-spacing:8px;text-align:center;"
              onfocus="this.style.borderColor='#7c8cf8'"
              onblur="this.style.borderColor='#2a2a2a'"
              onkeydown="if(event.key==='Enter') Auth._submitPinSetup()"
            />
          </div>
          <div id="auth-pin-error" style="font-size:12px;color:#ef4444;margin-bottom:12px;display:none;"></div>
          <button onclick="Auth._submitPinSetup()"
            style="width:100%;padding:10px;background:#1a1a2e;border:0.5px solid #7c8cf8;border-radius:6px;color:#7c8cf8;font-size:13px;cursor:pointer;">
            Nastavit PIN a vstoupit
          </button>
        </div>

      </div>
    `;

    this._onSuccess = onSuccess;
  },

  // Fáze 2: Běžné přihlášení — PIN
  renderPin(overlay, onSuccess) {
    overlay.innerHTML = `
      <div style="width:320px;text-align:center;">

        <div style="margin-bottom:32px;">
          <div style="font-size:22px;font-weight:500;color:#e8e8e8;letter-spacing:-0.5px;">o-io.cz</div>
          <div style="font-size:13px;color:#555;margin-top:6px;">Zadej PIN pro přístup</div>
        </div>

        <input id="auth-pin" type="password" inputmode="numeric" maxlength="6" placeholder="• • • •"
          autofocus
          style="width:100%;background:#141414;border:0.5px solid #2a2a2a;border-radius:6px;padding:14px;font-size:28px;color:#e8e8e8;outline:none;letter-spacing:12px;text-align:center;margin-bottom:12px;"
          onfocus="this.style.borderColor='#7c8cf8'"
          onblur="this.style.borderColor='#2a2a2a'"
          onkeydown="if(event.key==='Enter') Auth._submitPin()"
        />

        <div id="auth-error" style="font-size:12px;color:#ef4444;margin-bottom:12px;min-height:18px;"></div>

        <button onclick="Auth._submitPin()"
          style="width:100%;padding:10px;background:#1a1a2e;border:0.5px solid #7c8cf8;border-radius:6px;color:#7c8cf8;font-size:13px;cursor:pointer;margin-bottom:16px;">
          Vstoupit
        </button>

        <div style="font-size:11px;color:#333;cursor:pointer;" onclick="Auth._resetDevice()">
          Jiné zařízení / reset tokenu
        </div>

      </div>
    `;

    this._onSuccess = onSuccess;

    setTimeout(() => {
      const input = document.getElementById('auth-pin');
      if (input) input.focus();
    }, 100);
  },

  // Submit tokenu
  async _submitToken() {
    const btn   = document.getElementById('auth-token-btn');
    const input = document.getElementById('auth-token');
    const err   = document.getElementById('auth-token-error');
    const token = input.value.trim();

    if (!token) return;

    btn.textContent = 'Ověřuji...';
    btn.disabled = true;
    err.style.display = 'none';

    const ok = await this.verifyToken(token);

    if (ok) {
      this.saveToken(token);
      // Přejdi na nastavení PINu
      document.getElementById('auth-step-1').style.display = 'none';
      document.getElementById('auth-step-2').style.display = 'block';
      setTimeout(() => document.getElementById('auth-pin-new').focus(), 100);
    } else {
      err.textContent = 'Token není platný nebo nemá přístup k repozitáři.';
      err.style.display = 'block';
      btn.textContent = 'Ověřit token';
      btn.disabled = false;
    }
  },

  // Submit nového PINu
  async _submitPinSetup() {
    const pin1 = document.getElementById('auth-pin-new').value;
    const pin2 = document.getElementById('auth-pin-confirm').value;
    const err  = document.getElementById('auth-pin-error');

    err.style.display = 'none';

    if (pin1.length < 4) {
      err.textContent = 'PIN musí mít alespoň 4 číslice.';
      err.style.display = 'block';
      return;
    }

    if (pin1 !== pin2) {
      err.textContent = 'PINy se neshodují.';
      err.style.display = 'block';
      return;
    }

    await this.savePin(pin1);
    this.login();
    document.getElementById('auth-overlay').remove();
    if (this._onSuccess) this._onSuccess();
  },

  // Submit PINu při přihlášení
  async _submitPin() {
    const input = document.getElementById('auth-pin');
    const err   = document.getElementById('auth-error');
    const pin   = input.value;

    err.textContent = '';

    const ok = await this.verifyPin(pin);

    if (ok) {
      this.login();
      document.getElementById('auth-overlay').remove();
      if (this._onSuccess) this._onSuccess();
    } else {
      err.textContent = 'Nesprávný PIN.';
      input.value = '';
      input.focus();
    }
  },

  // Reset zařízení (smaže token, zobrazí setup)
  _resetDevice() {
    if (!confirm('Smazat token z tohoto zařízení?')) return;
    localStorage.removeItem('oiocz_token');
    localStorage.removeItem('oiocz_pin');
    location.reload();
  },

};
