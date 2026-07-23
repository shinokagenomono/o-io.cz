/* ===========================
   Homelab — Přehled

   Poznámka: stránka je servírovaná přes HTTPS (GitHub Pages), ale
   spousta lokálních služeb běží na obyčejném HTTP (Proxmox, Jellyfin,
   WoW SOAP). Prohlížeč takové "mixed content" fetch požadavky ze
   zásady blokuje bez ohledu na to, jestli je host reálně dostupný
   (doma / přes Tailscale) — proto se u nich reálně vždy zobrazí
   šedá tečka / "nedostupné", i když server běží. Fetch je přesto
   napsaný "na férovku" (fetchWithTimeout), aby to fungovalo, pokud
   se stránka někdy bude servírovat i přes HTTP nebo se lokální
   služby dostanou za HTTPS reverse proxy.
=========================== */

var Homelab = {

  proxmoxNodes: [
    { name: 'Proxmox N150',         host: '192.168.10.2',  port: 8006 },
    { name: 'Proxmox Winterlegacy', host: '192.168.10.20', port: 8006 },
  ],

  services: [
    { name: 'Nextcloud',      url: 'https://cloud.o-io.cz',      icon: 'ti-cloud' },
    { name: 'Home Assistant', url: 'https://home.o-io.cz',       icon: 'ti-smart-home' },
    { name: 'BookStack',      url: 'https://work.o-io.cz',       icon: 'ti-book' },
    { name: 'Jellyfin',       url: 'http://192.168.10.52:8096',  icon: 'ti-movie' },
  ],

  status: {},

  async fetchWithTimeout(url, options, ms) {
    ms = ms || 3000;
    var controller = new AbortController();
    var timer = setTimeout(function() { controller.abort(); }, ms);
    try {
      var opts = Object.assign({}, options, { signal: controller.signal });
      var res = await fetch(url, opts);
      clearTimeout(timer);
      return res;
    } catch (e) {
      clearTimeout(timer);
      return null;
    }
  },

  render(container) {
    this.status = {};

    App.setActions('<span class="badge green" id="homelab-badge"><span class="dot green"></span> Kontroluji...</span>');

    container.innerHTML = `
      <div class="section-title">Proxmox servery</div>
      <div class="grid-2" id="hl-proxmox" style="margin-bottom:20px;"></div>

      <div class="section-title">Služby</div>
      <div class="grid-4" id="hl-services" style="margin-bottom:20px;"></div>

      <div class="section-title">Síť</div>
      <div class="card" id="hl-network" style="margin-bottom:20px;"></div>

      <div class="grid-2" style="margin-bottom:20px;">
        <div class="card" id="hl-wow" onclick="window.open('http://192.168.10.21','_blank','noopener')" style="cursor:pointer;"></div>
        <div class="card" id="hl-ups"></div>
      </div>

      <div class="section-title">Zálohy</div>
      <div class="card" id="hl-backups"></div>

      <div id="backup-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:1000;align-items:center;justify-content:center;"></div>
    `;

    this.renderProxmox();
    this.renderServices();
    this.renderNetwork();
    this.renderWow();
    this.renderUps();
    this.renderBackups();
  },

  // --- Sekce 1: Proxmox ---

  renderProxmox() {
    var el = document.getElementById('hl-proxmox');
    if (!el) return;

    el.innerHTML = this.proxmoxNodes.map(function(n) {
      var url = 'http://' + n.host + ':' + n.port;
      return '<div class="card" onclick="window.open(\'' + url + '\',\'_blank\',\'noopener\')" style="cursor:pointer;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">' +
        '<div style="font-size:13px;color:var(--text-1);">' + n.name + '</div>' +
        '<span class="dot gray" id="pmx-dot-' + n.host.replace(/\./g, '-') + '"></span>' +
        '</div>' +
        '<div style="font-size:11px;color:var(--text-4);margin-bottom:10px;">' + n.host + ':' + n.port + '</div>' +
        '<div class="status-row"><span class="status-name">CPU</span><span class="status-val">— % · — °C</span></div>' +
        '<div class="status-row"><span class="status-name">RAM</span><span class="status-val">— / —</span></div>' +
        '<div class="status-row"><span class="status-name">Disk</span><span class="status-val">— / —</span></div>' +
        '<div style="font-size:10px;color:var(--text-5);margin-top:8px;">data se načítají lokálně</div>' +
        '</div>';
    }).join('');

    this.proxmoxNodes.forEach(function(n) {
      var key = 'pmx-' + n.host;
      var url = 'http://' + n.host + ':' + n.port + '/api2/json/nodes';
      Homelab.fetchWithTimeout(url, { mode: 'no-cors' }, 3000).then(function(res) {
        var dot = document.getElementById('pmx-dot-' + n.host.replace(/\./g, '-'));
        if (dot) dot.className = 'dot ' + (res ? 'green' : 'gray');
        Homelab.status[key] = !!res;
        Homelab.updateBadge();
      });
    });
  },

  // --- Sekce 2: Služby ---

  renderServices() {
    var el = document.getElementById('hl-services');
    if (!el) return;

    el.innerHTML = this.services.map(function(s, i) {
      return '<div class="card" onclick="window.open(\'' + s.url + '\',\'_blank\',\'noopener\')" style="cursor:pointer;text-align:center;">' +
        '<i class="ti ' + s.icon + '" style="font-size:22px;color:var(--text-2);"></i>' +
        '<div style="font-size:12px;color:var(--text-2);margin-top:10px;">' + s.name + '</div>' +
        '<div style="display:flex;align-items:center;justify-content:center;gap:5px;margin-top:8px;">' +
        '<span class="dot gray" id="svc-dot-' + i + '"></span>' +
        '<span style="font-size:10px;color:var(--text-5);">' + s.url.replace(/^https?:\/\//, '') + '</span>' +
        '</div>' +
        '</div>';
    }).join('');

    this.services.forEach(function(s, i) {
      var key = 'svc-' + i;
      Homelab.fetchWithTimeout(s.url, { mode: 'no-cors' }, 3000).then(function(res) {
        var dot = document.getElementById('svc-dot-' + i);
        if (dot) dot.className = 'dot ' + (res ? 'green' : 'gray');
        Homelab.status[key] = !!res;
        Homelab.updateBadge();
      });
    });
  },

  updateBadge() {
    var badge = document.getElementById('homelab-badge');
    if (!badge) return;

    var vals = Object.keys(this.status).map(function(k) { return Homelab.status[k]; });
    var expected = this.proxmoxNodes.length + this.services.length;
    if (vals.length < expected) return; // ještě neproběhly všechny kontroly

    var allOnline = vals.every(function(v) { return v; });
    if (allOnline) {
      badge.className = 'badge green';
      badge.innerHTML = '<span class="dot green"></span> Vše online';
    } else {
      badge.className = 'badge yellow';
      badge.innerHTML = '<span class="dot yellow"></span> Částečně offline';
    }
  },

  // --- Sekce 3: Síť ---

  renderNetwork() {
    var el = document.getElementById('hl-network');
    if (!el) return;

    var rows = [
      { name: 'OPNsense',            val: '192.168.10.1',       url: 'http://192.168.10.1' },
      { name: 'Cloudflare Tunnel',   val: 'tunnel.o-io.cz',     url: null },
      { name: 'Tailscale',           val: 'aktivní',             url: null },
      { name: 'Dnsmasq',             val: '11 host overrides',   url: null },
      { name: 'Netdata N150',        val: '192.168.10.2:19999',  url: 'http://192.168.10.2:19999' },
      { name: 'Netdata Winterlegacy', val: '192.168.10.21:19999', url: 'http://192.168.10.21:19999' },
      { name: 'ESP32 displej',       val: '192.168.10.60',       url: 'http://192.168.10.60' },
    ];

    el.innerHTML = rows.map(function(r) {
      var valHtml = r.url
        ? '<a class="status-link" href="' + r.url + '" target="_blank" rel="noopener">' + r.val + '</a>'
        : '<span class="status-val">' + r.val + '</span>';
      return '<div class="status-row"><span class="status-name"><span class="dot green"></span>' + r.name + '</span>' + valHtml + '</div>';
    }).join('');
  },

  // --- Sekce 4: WoW server ---
  // SOAP přihlašovací údaje se zatím nikam neukládají ani nehardcodují —
  // dokud nebude vyřešené bezpečné zadání (viz Store 'wow_soap_user' /
  // 'wow_soap_pass', analogicky k ha_token), sekce jen zobrazí kostru.

  renderWow() {
    var el = document.getElementById('hl-wow');
    if (!el) return;

    var user = Store.get('wow_soap_user');
    var pass = Store.get('wow_soap_pass');

    el.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">' +
      '<div style="font-size:13px;color:var(--text-1);">WoW server</div>' +
      '<span class="dot gray" id="wow-dot"></span>' +
      '</div>' +
      '<div class="status-row"><span class="status-name">Status</span><span class="status-val" id="wow-status">—</span></div>' +
      '<div class="status-row"><span class="status-name">Update diff</span><span class="status-val" id="wow-diff">—</span></div>' +
      '<div class="status-row"><span class="status-name">Hráči / boti</span><span class="status-val" id="wow-players">—</span></div>' +
      '<div class="status-row"><span class="status-name">Uptime</span><span class="status-val" id="wow-uptime">—</span></div>' +
      '<div class="status-row"><span class="status-name">Verze</span><span class="status-val">3.3.5a</span></div>' +
      '<div style="font-size:10px;color:var(--text-5);margin-top:8px;">' +
      (user && pass ? 'SOAP přihlášení nastaveno.' : 'SOAP přihlášení zatím nenastaveno — živá data se dodělají později.') +
      '</div>';

    if (user && pass) this.fetchWowStatus(user, pass);
  },

  async fetchWowStatus(user, pass) {
    var statusEl  = document.getElementById('wow-status');
    var diffEl    = document.getElementById('wow-diff');
    var playersEl = document.getElementById('wow-players');
    var uptimeEl  = document.getElementById('wow-uptime');
    var dotEl     = document.getElementById('wow-dot');

    var body =
      '<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns1="urn:AC">' +
      '<SOAP-ENV:Body><ns1:executeCommand><command>.server info</command></ns1:executeCommand></SOAP-ENV:Body>' +
      '</SOAP-ENV:Envelope>';

    var res = await this.fetchWithTimeout('http://192.168.10.21:7878', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml',
        'Authorization': 'Basic ' + btoa(user + ':' + pass),
      },
      body: body,
    }, 3000);

    if (!res || !res.ok) {
      if (statusEl) statusEl.textContent = 'nedostupný';
      if (dotEl) dotEl.className = 'dot gray';
      return;
    }

    try {
      var text = await res.text();
      // Odpověď je SOAP/XML text s výstupem ".server info" — parsování
      // konkrétního formátu (diff/hráči/uptime) doladíme, až bude mít
      // smysl to zkoušet proti reálnému serveru.
      if (statusEl)  statusEl.textContent  = 'online';
      if (dotEl)     dotEl.className       = 'dot green';
      if (diffEl)    diffEl.textContent    = '—';
      if (playersEl) playersEl.textContent = '—';
      if (uptimeEl)  uptimeEl.textContent  = '—';
    } catch (e) {
      if (statusEl) statusEl.textContent = 'chyba parsování';
    }
  },

  // --- Sekce 5: UPS (NUT přes Home Assistant) ---

  renderUps() {
    var el = document.getElementById('hl-ups');
    if (!el) return;

    var token = Store.get('ha_token');

    if (!token) {
      el.innerHTML =
        '<div style="font-size:13px;color:var(--text-1);margin-bottom:12px;">UPS</div>' +
        '<div style="font-size:12px;color:var(--text-4);margin-bottom:10px;">Pro živá data zadej Home Assistant Long-Lived Access Token.</div>' +
        '<input id="ha-token-input" type="password" placeholder="HA token..." ' +
        'style="width:100%;background:var(--bg);border:0.5px solid var(--border-2);border-radius:6px;padding:8px 10px;font-size:13px;color:var(--text-1);outline:none;margin-bottom:8px;" ' +
        'onkeydown="if(event.key===\'Enter\') Homelab.saveHaToken()" />' +
        '<button class="btn primary" onclick="Homelab.saveHaToken()" style="width:100%;justify-content:center;"><i class="ti ti-key"></i> Uložit token</button>';
      return;
    }

    el.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">' +
      '<div style="font-size:13px;color:var(--text-1);">UPS</div>' +
      '<button class="btn" onclick="Homelab.refreshUps()" style="font-size:11px;padding:3px 8px;"><i class="ti ti-refresh"></i> Refresh</button>' +
      '</div>' +
      '<div class="status-row"><span class="status-name">Kapacita baterie</span><span class="status-val" id="ups-charge">—</span></div>' +
      '<div class="status-row"><span class="status-name">Stav</span><span class="status-val" id="ups-status">—</span></div>' +
      '<div class="status-row"><span class="status-name">Odhad. záloha</span><span class="status-val" id="ups-runtime">—</span></div>';

    this.refreshUps();
  },

  saveHaToken() {
    var input = document.getElementById('ha-token-input');
    var token = input ? input.value.trim() : '';
    if (!token) return;
    Store.set('ha_token', token);
    this.renderUps();
  },

  async refreshUps() {
    var token = Store.get('ha_token');
    if (!token) return;

    var chargeEl  = document.getElementById('ups-charge');
    var statusEl  = document.getElementById('ups-status');
    var runtimeEl = document.getElementById('ups-runtime');

    if (chargeEl)  chargeEl.textContent  = '...';
    if (statusEl)  statusEl.textContent  = '...';
    if (runtimeEl) runtimeEl.textContent = '...';

    var entities = {
      charge:  { el: chargeEl,  id: 'sensor.ups_battery_charge', suffix: ' %' },
      status:  { el: statusEl,  id: 'sensor.ups_status',         suffix: '' },
      runtime: { el: runtimeEl, id: 'sensor.ups_runtime',        suffix: ' min' },
    };

    var self = this;
    await Promise.all(Object.keys(entities).map(async function(key) {
      var e = entities[key];
      if (!e.el) return;

      var res = await self.fetchWithTimeout('https://home.o-io.cz/api/states/' + e.id, {
        headers: { 'Authorization': 'Bearer ' + token },
      }, 5000);

      if (!res || !res.ok) {
        e.el.textContent = 'nedostupné';
        return;
      }

      try {
        var data = await res.json();
        e.el.textContent = data.state + e.suffix;
      } catch (err) {
        e.el.textContent = 'chyba';
      }
    }));
  },

  // --- Sekce 6: Zálohy ---

  backupDefaults: [
    { id: 'vm200',     name: 'WoW server (VM200)' },
    { id: 'vm201',     name: 'Desktop (VM201)' },
    { id: 'nextcloud', name: 'Nextcloud (LXC 101)' },
    { id: 'tunnel',    name: 'Cloudflare Tunnel (LXC 102)' },
    { id: 'ha',        name: 'Home Assistant (VM 103)' },
    { id: 'jellyfin',  name: 'Jellyfin (LXC 104)' },
    { id: 'bookstack', name: 'BookStack (LXC 105)' },
    { id: 'samba',     name: 'Samba (LXC 106)' },
  ],

  getBackups() {
    var stored = Store.get('backup_status');
    if (stored && stored.length) return stored;

    var fresh = this.backupDefaults.map(function(d) {
      return { id: d.id, name: d.name, lastBackup: null, status: 'unknown' };
    });
    Store.set('backup_status', fresh);
    return fresh;
  },

  backupStatusFor(lastBackup) {
    if (!lastBackup) return 'unknown';
    var days = (Date.now() - new Date(lastBackup).getTime()) / 86400000;
    if (days < 7) return 'ok';
    if (days <= 30) return 'warning';
    return 'error';
  },

  formatDate(d) {
    var date = new Date(d);
    if (isNaN(date.getTime())) return '—';
    return String(date.getDate()).padStart(2, '0') + '.' + String(date.getMonth() + 1).padStart(2, '0') + '.' + date.getFullYear();
  },

  renderBackups() {
    var el = document.getElementById('hl-backups');
    if (!el) return;

    var backups = this.getBackups();
    var dotClass = { ok: 'green', warning: 'yellow', error: 'red', unknown: 'gray' };

    el.innerHTML = backups.map(function(b) {
      var status  = Homelab.backupStatusFor(b.lastBackup);
      var dateStr = b.lastBackup ? Homelab.formatDate(b.lastBackup) : 'Nezadáno';

      return '<div class="status-row">' +
        '<span class="status-name"><span class="dot ' + dotClass[status] + '"></span>' + b.name + '</span>' +
        '<span style="display:flex;gap:12px;align-items:center;">' +
        '<span class="status-val">' + dateStr + '</span>' +
        '<button class="btn" onclick="Homelab.openBackupModal(\'' + b.id + '\')" style="font-size:11px;padding:3px 8px;"><i class="ti ti-refresh"></i> Aktualizovat</button>' +
        '</span></div>';
    }).join('');
  },

  openBackupModal(id) {
    var backups = this.getBackups();
    var b = backups.find(function(x) { return x.id === id; });
    if (!b) return;

    var modal = document.getElementById('backup-modal');
    modal.style.display = 'flex';

    var dateVal = b.lastBackup ? new Date(b.lastBackup).toISOString().slice(0, 10) : '';

    modal.innerHTML =
      '<div style="background:var(--bg-card);border:0.5px solid var(--border-2);border-radius:12px;width:360px;padding:24px;">' +
      '<div style="font-size:15px;font-weight:500;color:var(--text-1);margin-bottom:20px;">' + b.name + '</div>' +
      '<div style="margin-bottom:20px;">' +
      '<div style="font-size:11px;color:var(--text-4);text-transform:uppercase;letter-spacing:0.6px;margin-bottom:6px;">Datum poslední zálohy</div>' +
      '<input id="backup-date-input" type="date" value="' + dateVal + '" ' +
      'style="width:100%;background:var(--bg);border:0.5px solid var(--border-2);border-radius:6px;padding:8px 10px;font-size:13px;color:var(--text-1);outline:none;" />' +
      '</div>' +
      '<div style="display:flex;justify-content:flex-end;gap:8px;">' +
      '<button class="btn" onclick="Homelab.closeBackupModal()">Zrušit</button>' +
      '<button class="btn primary" onclick="Homelab.saveBackup(\'' + id + '\')">Uložit</button>' +
      '</div></div>';
  },

  saveBackup(id) {
    var input = document.getElementById('backup-date-input');
    var dateStr = input ? input.value : '';

    var backups = this.getBackups();
    var b = backups.find(function(x) { return x.id === id; });
    if (b) {
      b.lastBackup = dateStr ? new Date(dateStr + 'T00:00:00').getTime() : null;
      b.status = this.backupStatusFor(b.lastBackup);
    }

    Store.set('backup_status', backups);
    this.closeBackupModal();
    this.renderBackups();
  },

  closeBackupModal() {
    var modal = document.getElementById('backup-modal');
    if (modal) modal.style.display = 'none';
  },

};
