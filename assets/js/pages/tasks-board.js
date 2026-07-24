/* ===========================
   Úkoly — Kanban Board
=========================== */

var TasksBoard = {

  columns: [
    { id: 'backlog',    label: 'Backlog' },
    { id: 'todo',       label: 'Todo' },
    { id: 'inprogress', label: 'In progress' },
    { id: 'done',       label: 'Done' },
  ],

  projects: [
    { id: 'homelab', label: 'Homelab' },
    { id: 'wow',     label: 'WoW' },
    { id: 'goat',    label: 'GoatPatrik' },
    { id: 'forge',   label: 'StrokeForge' },
    { id: 'osobni',  label: 'Osobní' },
  ],

  dragSrc: null,
  _modalTaskId: null,
  _modalSubtasks: [],

  render(container) {
    App.setActions(`
      <button class="btn primary" onclick="TasksBoard.openNewTask()">
        <i class="ti ti-plus"></i> New task
      </button>
    `);

    container.style.padding = '20px';
    container.style.overflow = 'auto';

    container.innerHTML = `
      <div id="board" style="display:flex;gap:12px;min-height:calc(100vh - 120px);align-items:flex-start;">
        ${this.columns.map(col => this.renderColumn(col)).join('')}
      </div>
      <div id="task-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:1000;align-items:center;justify-content:center;"></div>
    `;

    this.refresh();
  },

  renderColumn(col) {
    return `
      <div class="board-col" data-col="${col.id}"
        style="flex:1 1 0;min-width:220px;display:flex;flex-direction:column;gap:8px;"
        ondragover="event.preventDefault()"
        ondrop="TasksBoard.onDrop(event,'${col.id}')">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:0 4px 8px;">
          <div style="font-size:12px;font-weight:500;color:var(--text-3);text-transform:uppercase;letter-spacing:0.6px;display:flex;align-items:center;gap:8px;">
            ${col.label}
            <span id="count-${col.id}" style="font-size:11px;background:var(--bg-hover);color:var(--text-4);padding:1px 6px;border-radius:10px;">0</span>
          </div>
          <span style="font-size:20px;color:var(--text-5);cursor:pointer;line-height:1;"
                onclick="TasksBoard.openNewTask('${col.id}')">+</span>
        </div>
        <div id="col-${col.id}" style="display:flex;flex-direction:column;gap:8px;min-height:40px;"></div>
      </div>
    `;
  },

  refresh() {
    const tasks = Store.get('tasks') || [];

    this.columns.forEach(col => {
      const colEl = document.getElementById('col-' + col.id);
      const count = document.getElementById('count-' + col.id);
      if (!colEl) return;

      const colTasks = tasks.filter(t => t.status === col.id);
      if (count) count.textContent = colTasks.length;

      colEl.innerHTML = colTasks.map(t => this.renderCard(t)).join('');

      colEl.querySelectorAll('.task-card').forEach(card => {
        card.addEventListener('dragstart', e => {
          this.dragSrc = card.dataset.id;
          e.dataTransfer.effectAllowed = 'move';
        });
        card.addEventListener('click', () => this.openEditTask(card.dataset.id));
      });
    });
  },

  // Projekt je teď volný text (uživatel si ho píše sám), ale pro
  // pár známých názvů si necháváme barevný tag jako dřív. Pro
  // cokoliv jiného se zobrazí neutrální šedý tag s napsaným textem.
  projectTagHtml(value) {
    if (!value) return '';
    const known = this.projects.find(p => p.id === value || p.label.toLowerCase() === value.toLowerCase());
    if (known) return '<span class="tag ' + known.id + '">' + known.label + '</span>';
    return '<span class="tag osobni">' + this.esc(value) + '</span>';
  },

  renderCard(task) {
    const subs = task.subtasks || [];
    const done = subs.filter(s => s.done).length;
    const prio = task.priority || 'medium';
    const prioColor = prio === 'high' ? 'var(--red)' : prio === 'medium' ? 'var(--yellow)' : 'var(--border-3)';

    return '<div class="task-card" data-id="' + task.id + '" draggable="true"' +
      ' style="background:var(--bg-card);border:0.5px solid var(--border);border-left:2px solid ' + prioColor + ';' +
      'border-radius:8px;padding:12px;cursor:pointer;">' +
      '<div style="font-size:13px;color:var(--text-2);line-height:1.4;margin-bottom:8px;">' + this.esc(task.title) + '</div>' +
      '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">' +
      this.projectTagHtml(task.project) +
      (subs.length > 0 ? '<span style="font-size:10px;color:var(--text-4);">' + done + '/' + subs.length + '</span>' : '') +
      '</div>' +
      (task.due ? '<div style="font-size:11px;color:var(--text-4);margin-top:6px;">' + this.esc(task.due) + '</div>' : '') +
      '</div>';
  },

  onDrop(e, targetCol) {
    e.preventDefault();
    if (!this.dragSrc) return;
    const tasks = Store.get('tasks') || [];
    const task  = tasks.find(t => t.id === this.dragSrc);
    if (task) {
      task.status = targetCol;
      Store.set('tasks', tasks);
      this.refresh();
    }
    this.dragSrc = null;
  },

  openNewTask(defaultStatus) {
    defaultStatus = defaultStatus || 'todo';
    this.openModal({
      id: Store.uid(),
      title: '',
      status: defaultStatus,
      priority: 'medium',
      project: '',
      subtasks: [],
      due: '',
      description: '',
    }, true);
  },

  openEditTask(id) {
    const tasks = Store.get('tasks') || [];
    const task  = tasks.find(t => t.id === id);
    if (task) this.openModal(task, false);
  },

  openModal(task, isNew) {
    const modal = document.getElementById('task-modal');
    modal.style.display = 'flex';

    this._modalTaskId = task.id;
    this._modalSubtasks = (task.subtasks || []).map(function(s) { return { title: s.title, done: !!s.done }; });

    const existingProjects = Array.from(new Set(
      (Store.get('tasks') || []).map(function(t) { return t.project; }).filter(Boolean)
        .concat(this.projects.map(function(p) { return p.label; }))
    ));
    const projDatalist = existingProjects.map(function(p) {
      return '<option value="' + p + '"></option>';
    }).join('');

    const colOptions = this.columns.map(function(c) {
      return '<option value="' + c.id + '"' + (task.status === c.id ? ' selected' : '') + '>' + c.label + '</option>';
    }).join('');

    const priorities = [
      { id: 'high',   label: 'Vysoká' },
      { id: 'medium', label: 'Střední' },
      { id: 'low',    label: 'Nízká' },
    ];
    const prioOptions = priorities.map(function(p) {
      return '<option value="' + p.id + '"' + ((task.priority || 'medium') === p.id ? ' selected' : '') + '>' + p.label + '</option>';
    }).join('');

    modal.innerHTML =
      '<div style="background:var(--bg-card);border:0.5px solid var(--border-2);border-radius:12px;width:480px;max-height:85vh;overflow-y:auto;padding:24px;">' +

      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">' +
      '<div style="font-size:15px;font-weight:500;color:var(--text-1);">' + (isNew ? 'Nový úkol' : 'Upravit úkol') + '</div>' +
      '<i class="ti ti-x" style="font-size:18px;color:var(--text-4);cursor:pointer;" onclick="TasksBoard.closeModal()"></i>' +
      '</div>' +

      '<div style="margin-bottom:10px;">' +
      '<div style="font-size:11px;color:var(--text-4);text-transform:uppercase;letter-spacing:0.6px;margin-bottom:6px;">Název</div>' +
      '<input id="t-title" value="' + this.esc(task.title) + '" placeholder="Název úkolu..."' +
      ' style="width:100%;background:var(--bg);border:0.5px solid var(--border-2);border-radius:6px;padding:8px 10px;font-size:13px;color:var(--text-1);outline:none;" />' +
      '</div>' +

      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:10px;">' +
      '<div><div style="font-size:11px;color:var(--text-4);text-transform:uppercase;letter-spacing:0.6px;margin-bottom:6px;">Status</div>' +
      '<select id="t-status" style="width:100%;background:var(--bg);border:0.5px solid var(--border-2);border-radius:6px;padding:8px 10px;font-size:13px;color:var(--text-1);outline:none;">' + colOptions + '</select></div>' +
      '<div><div style="font-size:11px;color:var(--text-4);text-transform:uppercase;letter-spacing:0.6px;margin-bottom:6px;">Projekt</div>' +
      '<input id="t-project" list="t-project-list" value="' + this.esc(task.project || '') + '" placeholder="Napiš projekt..."' +
      ' style="width:100%;background:var(--bg);border:0.5px solid var(--border-2);border-radius:6px;padding:8px 10px;font-size:13px;color:var(--text-1);outline:none;" />' +
      '<datalist id="t-project-list">' + projDatalist + '</datalist></div>' +
      '<div><div style="font-size:11px;color:var(--text-4);text-transform:uppercase;letter-spacing:0.6px;margin-bottom:6px;">Priorita</div>' +
      '<select id="t-priority" style="width:100%;background:var(--bg);border:0.5px solid var(--border-2);border-radius:6px;padding:8px 10px;font-size:13px;color:var(--text-1);outline:none;">' + prioOptions + '</select></div>' +
      '</div>' +

      '<div style="margin-bottom:10px;">' +
      '<div style="font-size:11px;color:var(--text-4);text-transform:uppercase;letter-spacing:0.6px;margin-bottom:6px;">Popis</div>' +
      '<textarea id="t-desc" rows="8" placeholder="Volitelný popis..."' +
      ' style="width:100%;background:var(--bg);border:0.5px solid var(--border-2);border-radius:6px;padding:8px 10px;font-size:13px;color:var(--text-1);outline:none;resize:vertical;">' +
      this.esc(task.description || '') + '</textarea>' +
      '</div>' +

      '<div style="margin-bottom:10px;">' +
      '<div style="font-size:11px;color:var(--text-4);text-transform:uppercase;letter-spacing:0.6px;margin-bottom:6px;">Podúkoly</div>' +
      '<div id="t-subtasks">' + this.renderSubtasksHtml() + '</div>' +
      '<div style="display:flex;gap:8px;margin-top:8px;">' +
      '<input id="t-sub-new" placeholder="Přidat podúkol..."' +
      ' style="flex:1;background:var(--bg);border:0.5px solid var(--border-2);border-radius:6px;padding:6px 10px;font-size:13px;color:var(--text-1);outline:none;"' +
      ' onkeydown="if(event.key===\'Enter\'){event.preventDefault();TasksBoard.addSub();}" />' +
      '<button class="btn" onclick="TasksBoard.addSub()"><i class="ti ti-plus"></i></button>' +
      '</div></div>' +

      '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:20px;padding-top:16px;border-top:0.5px solid var(--border);">' +
      (!isNew ? '<button class="btn" onclick="TasksBoard.deleteTask(\'' + task.id + '\')" style="color:var(--red);border-color:var(--red-bg);"><i class="ti ti-trash"></i> Smazat</button>' : '<div></div>') +
      '<div style="display:flex;gap:8px;">' +
      '<button class="btn" onclick="TasksBoard.closeModal()">Zrušit</button>' +
      '<button class="btn primary" onclick="TasksBoard.saveTask(\'' + task.id + '\',' + isNew + ')"><i class="ti ti-device-floppy"></i> Uložit</button>' +
      '</div></div>' +

      '</div>';

    setTimeout(function() {
      var t = document.getElementById('t-title');
      if (t) t.focus();
    }, 100);
  },

  saveTask(id, isNew) {
    var title = document.getElementById('t-title').value.trim();
    if (!title) { alert('Zadej název úkolu.'); return; }

    var tasks = Store.get('tasks') || [];

    if (isNew) {
      tasks.unshift({
        id: id,
        title: title,
        status:      document.getElementById('t-status').value,
        project:     document.getElementById('t-project').value,
        priority:    document.getElementById('t-priority').value,
        description: document.getElementById('t-desc').value,
        subtasks:    this._modalSubtasks,
        due:         '',
      });
    } else {
      var task = tasks.find(function(t) { return t.id === id; });
      if (task) {
        task.title       = title;
        task.status      = document.getElementById('t-status').value;
        task.project     = document.getElementById('t-project').value;
        task.priority    = document.getElementById('t-priority').value;
        task.description = document.getElementById('t-desc').value;
        task.subtasks    = this._modalSubtasks;
      }
    }

    Store.set('tasks', tasks);
    this.closeModal();
    this.notifyTasksChanged();
  },

  deleteTask(id) {
    if (!confirm('Smazat úkol?')) return;
    var tasks = (Store.get('tasks') || []).filter(function(t) { return t.id !== id; });
    Store.set('tasks', tasks);
    this.closeModal();
    this.notifyTasksChanged();
  },

  // Modal (a task-modal DOM element) sdílí s TasksBoard i stránka
  // TasksList (Seznam) — po uložení/smazání se musí obnovit ta
  // stránka, která je zrovna aktivní, ne vždy jen Board.
  notifyTasksChanged() {
    if (App.currentPage === 'tasks-list' && window.TasksList) {
      TasksList.refresh();
    } else {
      this.refresh();
    }
  },

  // Podúkoly se drží jen v paměti modalu (this._modalSubtasks), dokud
  // se úkol neuloží tlačítkem Uložit — stejně jako název/popis/status.
  // Dřív se zapisovaly rovnou do Store podle ID úkolu, což u NOVÉHO
  // (ještě neuloženého) úkolu tiše selhalo, protože v Store žádný
  // záznam s tím ID ještě neexistoval.

  renderSubtasksHtml() {
    return this._modalSubtasks.map(function(s, i) {
      return '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:0.5px solid var(--border);">' +
        '<input type="checkbox"' + (s.done ? ' checked' : '') + ' onchange="TasksBoard.toggleSub(' + i + ',this.checked)" style="cursor:pointer;" />' +
        '<span style="font-size:13px;color:var(--text-2);flex:1;' + (s.done ? 'text-decoration:line-through;color:var(--text-4);' : '') + '">' + TasksBoard.esc(s.title) + '</span>' +
        '<i class="ti ti-x" style="font-size:13px;color:var(--text-5);cursor:pointer;" onclick="TasksBoard.removeSub(' + i + ')"></i>' +
        '</div>';
    }).join('');
  },

  refreshSubtasksList() {
    var el = document.getElementById('t-subtasks');
    if (el) el.innerHTML = this.renderSubtasksHtml();
  },

  addSub() {
    var input = document.getElementById('t-sub-new');
    var title = input.value.trim();
    if (!title) return;

    this._modalSubtasks.push({ title: title, done: false });
    input.value = '';
    this.refreshSubtasksList();
    input.focus();
  },

  toggleSub(index, done) {
    if (this._modalSubtasks[index]) {
      this._modalSubtasks[index].done = done;
      this.refreshSubtasksList();
    }
  },

  removeSub(index) {
    this._modalSubtasks.splice(index, 1);
    this.refreshSubtasksList();
  },

  closeModal() {
    var modal = document.getElementById('task-modal');
    if (modal) modal.style.display = 'none';
  },

  esc: function(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

};