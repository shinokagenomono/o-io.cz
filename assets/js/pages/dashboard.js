/* ===========================
   Dashboard
=========================== */

var Dashboard = {

  _clockInterval: null,

  render(container) {
    container.innerHTML = `
      <div style="display:flex;flex-direction:column;height:100%;">

        <!-- Datum a čas -->
        <div style="margin-bottom: 24px;flex-shrink:0;">
          <div id="dash-clock" style="font-size: 48px; font-weight: 500; color: var(--text-1); letter-spacing: -2px; line-height: 1;">--:--</div>
          <div id="dash-date" style="font-size: 14px; color: var(--text-4); margin-top: 6px;"></div>
        </div>

        <!-- Úkoly + Poznámky -->
        <div class="grid-2" style="flex:1;min-height:0;">

          <div class="card" style="display:flex;flex-direction:column;min-height:0;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-shrink:0;">
              <div class="section-title" style="margin-bottom:0;">Aktivní úkoly</div>
              <button class="btn" onclick="App.navigate('tasks-board')" style="font-size:11px;padding:3px 8px;">
                <i class="ti ti-layout-kanban"></i> Board
              </button>
            </div>
            <div id="dash-tasks" style="flex:1;overflow-y:auto;"></div>
          </div>

          <div class="card" style="display:flex;flex-direction:column;min-height:0;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-shrink:0;">
              <div class="section-title" style="margin-bottom:0;">Poslední poznámky</div>
              <button class="btn" onclick="App.navigate('notes-list')" style="font-size:11px;padding:3px 8px;">
                <i class="ti ti-notes"></i> Vše
              </button>
            </div>
            <div id="dash-notes" style="flex:1;overflow-y:auto;"></div>
          </div>

        </div>

      </div>
    `;

    this.startClock();
    this.renderTasks();
    this.renderNotes();
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
        ${TasksBoard.projectTagHtml(t)}
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

    const typeMeta = {
      skica:    { label: 'Skica',    color: 'var(--yellow)', bg: 'var(--yellow-bg)' },
      diagram:  { label: 'Diagram',  color: 'var(--accent)', bg: 'var(--accent-bg)' },
      poznamka: { label: 'Poznámka', color: 'var(--text-3)', bg: 'var(--bg-hover)' },
    };

    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px;';
    grid.innerHTML = recent.map(n => {
      const t = typeMeta[n.type] || typeMeta.poznamka;
      return `
      <div style="background:var(--bg);border:0.5px solid var(--border);border-radius:8px;padding:12px;cursor:pointer;transition:border-color 0.1s;display:flex;flex-direction:column;gap:8px;"
           onmouseover="this.style.borderColor='var(--border-3)'"
           onmouseout="this.style.borderColor='var(--border)'"
           onclick="App.navigate('notes-list')">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:6px;">
          <div style="font-size:13px;color:var(--text-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;">${this.esc(n.title)}</div>
          <span style="font-size:10px;padding:2px 6px;border-radius:4px;flex-shrink:0;color:${t.color};background:${t.bg};">${t.label}</span>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span style="font-size:11px;color:var(--text-4);">${this.relativeDate(n.updated || n.created)}</span>
          <span class="tag ${this.esc(n.project || 'osobni')}">${this.esc(this.projectLabel(n.project))}</span>
        </div>
      </div>
    `;
    }).join('');

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

  // Escape HTML
  esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  projectLabel(id) {
    const labels = { homelab: 'Homelab', wow: 'WoW', goat: 'GoatPatrik', forge: 'StrokeForge', osobni: 'Osobní' };
    return labels[id] || 'Osobní';
  },

  relativeDate(d) {
    if (!d) return '—';
    const date = new Date(d);
    const now  = new Date();
    const startOfDay = x => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86400000);

    if (diffDays === 0) return 'dnes';
    if (diffDays === 1) return 'včera';
    return String(date.getDate()) + '. ' + String(date.getMonth() + 1) + '.';
  },

};