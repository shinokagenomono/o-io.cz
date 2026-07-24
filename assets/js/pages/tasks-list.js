/* ===========================
   Úkoly — Seznam

   Sdílí modal (přidání/úprava/mazání úkolu, podúkoly) s TasksBoard —
   proto v render() vykresluje vlastní #task-modal element a volá
   TasksBoard.openNewTask()/openEditTask(). Po uložení/smazání
   TasksBoard.notifyTasksChanged() pozná, že je aktivní tahle
   stránka, a zavolá TasksList.refresh() místo TasksBoard.refresh().
=========================== */

var TasksList = {

  statuses: [
    { id: 'backlog',    label: 'Backlog',     color: 'var(--text-4)', bg: 'var(--bg-hover)' },
    { id: 'todo',       label: 'Todo',        color: 'var(--accent)', bg: 'var(--accent-bg)' },
    { id: 'inprogress', label: 'In progress', color: 'var(--yellow)', bg: 'var(--yellow-bg)' },
    { id: 'done',       label: 'Done',        color: 'var(--green)',  bg: 'var(--green-bg)' },
  ],

  search: '',
  filter: 'all',

  render(container) {
    App.setActions('<button class="btn primary" onclick="TasksBoard.openNewTask()"><i class="ti ti-plus"></i> New task</button>');

    container.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
        <div style="position:relative;width:220px;">
          <input id="tl-search" placeholder="Hledat úkol..." value="${this.esc(this.search)}"
            oninput="TasksList.onSearch(this.value)"
            style="width:100%;background:var(--bg-card);border:0.5px solid var(--border-2);border-radius:6px;padding:6px 10px;font-size:13px;color:var(--text-1);outline:none;" />
        </div>
        <div id="tl-filters" style="display:flex;gap:6px;flex-wrap:wrap;"></div>
      </div>
      <div id="tl-table"></div>
      <div id="task-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:1000;align-items:center;justify-content:center;"></div>
    `;

    this.renderFilters();
    this.refresh();
  },

  renderFilters() {
    var el = document.getElementById('tl-filters');
    if (!el) return;

    var tasks = Store.get('tasks') || [];
    var projects = Array.from(new Set(tasks.map(function(t) { return t.project; }).filter(Boolean)));

    var opts = ['all'].concat(projects);

    el.innerHTML = opts.map(function(p) {
      var active = TasksList.filter === p;
      var label  = p === 'all' ? 'Vše' : p;
      return '<button class="btn' + (active ? ' primary' : '') + '" onclick="TasksList.setFilter(\'' + TasksList.esc(p).replace(/'/g, "\\'") + '\')">' + TasksList.esc(label) + '</button>';
    }).join('');
  },

  setFilter(f) {
    this.filter = f;
    this.renderFilters();
    this.refresh();
  },

  onSearch(v) {
    this.search = v || '';
    this.refresh();
  },

  refresh() {
    var el = document.getElementById('tl-table');
    if (!el) return;

    var tasks = Store.get('tasks') || [];
    var search = this.search.toLowerCase();

    if (this.filter !== 'all') {
      tasks = tasks.filter(function(t) { return t.project === TasksList.filter; });
    }
    if (search) {
      tasks = tasks.filter(function(t) { return (t.title || '').toLowerCase().indexOf(search) !== -1; });
    }

    el.innerHTML = this.statuses.map(function(s) {
      var group = tasks.filter(function(t) { return t.status === s.id; });
      if (!group.length) return '';

      return '<div style="margin-bottom:20px;">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
        '<span style="font-size:11px;font-weight:600;color:var(--text-4);text-transform:uppercase;letter-spacing:0.6px;">' + s.label + '</span>' +
        '<span style="font-size:11px;background:var(--bg-hover);color:var(--text-4);padding:1px 6px;border-radius:10px;">' + group.length + '</span>' +
        '</div>' +
        '<div class="card" style="padding:0;">' +
        group.map(function(t, i) { return TasksList.renderRow(t, i < group.length - 1); }).join('') +
        '</div></div>';
    }).join('');

    if (!tasks.length) {
      el.innerHTML = '<div style="color:var(--text-4);margin-top:40px;text-align:center;font-size:13px;">Žádné úkoly neodpovídají filtru.</div>';
    }
  },

  renderRow(task, withBorder) {
    var subs = task.subtasks || [];
    var done = subs.filter(function(s) { return s.done; }).length;
    var isDone = task.status === 'done';

    return '<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;' +
      (withBorder ? 'border-bottom:0.5px solid var(--border);' : '') + '">' +
      '<input type="checkbox"' + (isDone ? ' checked' : '') + ' onchange="TasksList.toggleDone(\'' + task.id + '\',this.checked)" style="cursor:pointer;" />' +
      '<span onclick="TasksBoard.openEditTask(\'' + task.id + '\')" style="flex:1;font-size:13px;cursor:pointer;color:' + (isDone ? 'var(--text-4);text-decoration:line-through;' : 'var(--text-2);') + '">' +
      this.esc(task.title) + '</span>' +
      TasksBoard.projectTagHtml(task.project) +
      (subs.length > 0 ? '<span style="font-size:11px;color:var(--text-4);white-space:nowrap;"><i class="ti ti-subtask" style="font-size:12px;"></i> ' + done + '/' + subs.length + '</span>' : '') +
      '</div>';
  },

  toggleDone(id, checked) {
    var tasks = Store.get('tasks') || [];
    var task  = tasks.find(function(t) { return t.id === id; });
    if (task) {
      task.status = checked ? 'done' : 'todo';
      Store.set('tasks', tasks);
      this.refresh();
    }
  },

  esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

};
