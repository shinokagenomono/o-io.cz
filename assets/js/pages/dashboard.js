/* ===========================
   Dashboard
=========================== */

var Dashboard = {

  _clockInterval: null,

  render(container) {
    container.innerHTML = `

      <!-- Datum a čas -->
      <div style="margin-bottom: 24px;">
        <div id="dash-clock" style="font-size: 72px; font-weight: 500; color: var(--text-1); letter-spacing: -2px; line-height: 1;">--:--</div>
        <div id="dash-date" style="font-size: 14px; color: var(--text-4); margin-top: 6px;"></div>
      </div>

      <!-- Úkoly + Poznámky -->
      <div class="grid-2" style="margin-bottom: 12px;">

        <div class="card">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <div class="section-title" style="margin-bottom:0;">Aktivní úkoly</div>
            <button class="btn" onclick="App.navigate('tasks-board')" style="font-size:11px;padding:3px 8px;">
              <i class="ti ti-layout-kanban"></i> Board
            </button>
          </div>
          <div id="dash-tasks"></div>
        </div>

        <div class="card">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <div class="section-title" style="margin-bottom:0;">Poslední poznámky</div>
            <button class="btn" onclick="App.navigate('notes-list')" style="font-size:11px;padding:3px 8px;">
              <i class="ti ti-notes"></i> Vše
            </button>
          </div>
          <div id="dash-notes"></div>
        </div>

      </div>

      <!-- Homelab status -->
      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <div class="section-title" style="margin-bottom:0;">Homelab status</div>
          <span class="badge green" id="dash-homelab-badge">
            <span class="dot green"></span> Kontroluji...
          </span>
        </div>
        <div id="dash-homelab"></div>
      </div>

    `;

    this.startClock();
    this.renderTasks();
    this.renderNotes();
    this.renderHomelab();
  },

  startClock() {
    if (this._clockInterval) clearInterval(this._clockInterval);

    const days   = ['neděle','pondělí','úterý','středa','čtvrtek','pátek','sobota'];
    const months = ['ledna','února','března','dubna','května','června','července','srpna','září','října','listopadu','prosince'];

    const tick = () => {
      const now   = new Date();
      const h     = String(now.getHours()).padStart(2, '0');
      const m     = String(now.getMinutes()).padStart(2, '0');
      const clock = document.getElementById('dash-clock');
      const date  = document.getElementById('dash-date');
      if (clock) clock.textContent = `${h}:${m}`;
      if (date)  date.textContent  = `${days[now.getDay()]}, ${now.getDate()}. ${months[now.getMonth()]} ${now.getFullYear()}`;
    };

    tick();
    this._clockInterval = setInterval(tick, 10000);
  },

  renderTasks() {
    const el = document.getElementById('dash-tasks');
    if (!el) return;

    const tasks  = Store.get('tasks') || [];
    const active = tasks.filter(t => t.status !== 'done').slice(0, 6);

    if (active.length === 0) {
      el.innerHTML = `
        <div style="text-align:center;padding:20px 0;color:var(--text-4);font-size:13px;">
          Žádné aktivní úkoly.<br>
          <button class="btn primary" onclick="App.navigate('tasks-board')" style="margin-top:10px;">
            <i class="ti ti-plus"></i> Přidat úkol
          </button>
        </div>`;
      return;
    }

    el.innerHTML = active.map(t => `
      <div class="status-row" onclick="App.navigate('tasks-board')" style="cursor:pointer;">
        <span class="status-name">
          <span style="width:14px;height:14px;min-width:14px;border-radius:3px;border:0.5px solid var(--border-3);display:inline-block;"></span>
          <span style="font-size:13px;color:var(--text-2);">${this.esc(t.title)}</span>
        </span>
        <span class="tag ${this.esc(t.project || 'osobni')}">${this.esc(t.projectLabel || 'Osobní')}</span>
      </div>
    `).join('');
  },

  renderNotes() {
    const el = document.getElementById('dash-notes');
    if (!el) return;

    const notes  = Store.get('notes') || [];
    const recent = notes.slice(0, 4);

    if (recent.length === 0) {
      el.innerHTML = `
        <div style="text-align:center;padding:20px 0;color:var(--text-4);font-size:13px;">
          Žádné poznámky.<br>
          <button class="btn primary" onclick="App.navigate('notes-list')" style="margin-top:10px;">
            <i class="ti ti-plus"></i> Nová poznámka
          </button>
        </div>`;
      return;
    }

    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px;';
    grid.innerHTML = recent.map(n => `
      <div style="background:var(--bg);border:0.5px solid var(--border);border-radius:8px;padding:12px;cursor:pointer;transition:border-color 0.1s;"
           onmouseover="this.style.borderColor='var(--border-3)'"
           onmouseout="this.style.borderColor='var(--border)'"
           onclick="App.navigate('notes-list')">
        <div style="font-size:13px;color:var(--text-2);margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${this.esc(n.title)}</div>
        <div style="font-size:11px;color:var(--text-4);">${this.esc(n.type || 'poznámka')}</div>
      </div>
    `).join('');

    // Tlačítko nová poznámka
    const newBtn = document.createElement('div');
    newBtn.style.cssText = 'background:transparent;border:0.5px dashed var(--border-2);border-radius:8px;padding:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;font-size:13px;color:var(--text-5);transition:border-color 0.1s,color 0.1s;';
    newBtn.innerHTML = `<i class="ti ti-plus" style="font-size:14px;"></i> Nová`;
    newBtn.onmouseover = () => { newBtn.style.borderColor = 'var(--border-3)'; newBtn.style.color = 'var(--text-3)'; };
    newBtn.onmouseout  = () => { newBtn.style.borderColor = 'var(--border-2)'; newBtn.style.color = 'var(--text-5)'; };
    newBtn.onclick = () => App.navigate('notes-list');

    if (recent.length < 4) grid.appendChild(newBtn);
    el.appendChild(grid);
  },

  renderHomelab() {
    const el    = document.getElementById('dash-homelab');
    const badge = document.getElementById('dash-homelab-badge');
    if (!el) return;

    const services = [
      { name: 'Proxmox N150',         url: 'http://192.168.10.2:8006',   label: '192.168.10.2:8006' },
      { name: 'Proxmox Winterlegacy', url: 'http://192.168.10.20:8006',  label: '192.168.10.20:8006' },
      { name: 'Home Assistant',       url: 'https://home.o-io.cz',       label: 'home.o-io.cz' },
      { name: 'Nextcloud',            url: 'https://cloud.o-io.cz',      label: 'cloud.o-io.cz' },
      { name: 'BookStack',            url: 'https://work.o-io.cz',       label: 'work.o-io.cz' },
      { name: 'Jellyfin',             url: 'http://192.168.10.52:8096',  label: '192.168.10.52:8096' },
      { name: 'WoW server',           url: 'http://192.168.10.21',       label: '192.168.10.21' },
      { name: 'OPNsense',             url: 'http://192.168.10.1',        label: '192.168.10.1' },
      { name: 'Netdata N150',         url: 'http://192.168.10.2:19999',  label: ':19999' },
      { name: 'ESP32 displej',        url: 'http://192.168.10.60',       label: '192.168.10.60' },
    ];

    // Rozdel do dvou sloupců
    const half = Math.ceil(services.length / 2);
    const col1 = services.slice(0, half);
    const col2 = services.slice(half);

    const renderCol = (list) => list.map(s => `
      <div class="status-row">
        <span class="status-name">
          <span class="dot green"></span>
          ${this.esc(s.name)}
        </span>
        <a class="status-link" href="${s.url}" target="_blank" rel="noopener">${s.label}</a>
      </div>
    `).join('');

    el.innerHTML = `
      <div class="grid-2">
        <div>${renderCol(col1)}</div>
        <div>${renderCol(col2)}</div>
      </div>
    `;

    if (badge) {
      badge.innerHTML = `<span class="dot green"></span> online`;
    }
  },

  // Escape HTML
  esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

};