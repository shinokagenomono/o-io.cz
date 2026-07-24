/* ===========================
   Poznámky — Seznam
=========================== */

var NotesList = {

  types: [
    { id: 'skica',    label: 'Skica',    color: 'var(--yellow)', bg: 'var(--yellow-bg)' },
    { id: 'poznamka', label: 'Poznámka', color: 'var(--text-3)', bg: 'var(--bg-hover)' },
  ],

  filter: 'all',
  projectFilter: 'all',
  search: '',
  _editingId: null,

  render(container) {
    App.setActions(`
      <button class="btn primary" onclick="NotesList.openNew()">
        <i class="ti ti-plus"></i> New note
      </button>
    `);

    container.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
        <div id="notes-filters" style="display:flex;gap:6px;flex-wrap:wrap;"></div>
        <input id="notes-search" placeholder="Hledat podle názvu..."
          style="margin-left:auto;width:220px;background:var(--bg-card);border:0.5px solid var(--border-2);border-radius:6px;padding:6px 10px;font-size:13px;color:var(--text-1);outline:none;"
          oninput="NotesList.onSearch(this.value)" />
      </div>
      <div id="notes-project-filters" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px;"></div>
      <div id="notes-grid" class="grid-5"></div>
      <div id="note-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:1000;align-items:center;justify-content:center;"></div>
    `;

    this.renderFilters();
    this.renderProjectFilters();
    this.refresh();
  },

  renderFilters() {
    var el = document.getElementById('notes-filters');
    if (!el) return;

    var opts = [{ id: 'all', label: 'Vše' }].concat(this.types);

    el.innerHTML = opts.map(function(o) {
      var active = NotesList.filter === o.id;
      return '<button class="btn' + (active ? ' primary' : '') + '" onclick="NotesList.setFilter(\'' + o.id + '\')">' + o.label + '</button>';
    }).join('');
  },

  setFilter(f) {
    this.filter = f;
    this.renderFilters();
    this.refresh();
  },

  // Filtr podle projektu — dynamicky sestavený z reálně použitých
  // hodnot (projekt je volný text, žádný pevný seznam).
  renderProjectFilters() {
    var el = document.getElementById('notes-project-filters');
    if (!el) return;

    var notes = Store.get('notes') || [];
    var projects = Array.from(new Set(notes.map(function(n) { return n.project; }).filter(Boolean)));

    if (!projects.length) { el.innerHTML = ''; return; }

    var opts = ['all'].concat(projects);

    el.innerHTML = opts.map(function(p) {
      var active = NotesList.projectFilter === p;
      var label  = p === 'all' ? 'Všechny projekty' : p;
      return '<button class="btn' + (active ? ' primary' : '') + '" onclick="NotesList.setProjectFilter(\'' + NotesList.esc(p).replace(/'/g, "\\'") + '\')">' + NotesList.esc(label) + '</button>';
    }).join('');
  },

  setProjectFilter(p) {
    this.projectFilter = p;
    this.renderProjectFilters();
    this.refresh();
  },

  onSearch(v) {
    this.search = (v || '').toLowerCase();
    this.refresh();
  },

  refresh() {
    var el = document.getElementById('notes-grid');
    if (!el) return;

    var notes = Store.get('notes') || [];

    if (this.filter !== 'all') {
      notes = notes.filter(function(n) { return n.type === NotesList.filter; });
    }
    if (this.projectFilter !== 'all') {
      notes = notes.filter(function(n) { return n.project === NotesList.projectFilter; });
    }
    if (this.search) {
      notes = notes.filter(function(n) { return (n.title || '').toLowerCase().indexOf(NotesList.search) !== -1; });
    }

    el.innerHTML = notes.map(function(n) { return NotesList.renderCard(n); }).join('') + this.renderNewCard();
  },

  renderNewCard() {
    return '<div onclick="NotesList.openNew()" ' +
      'style="border:0.5px dashed var(--border-2);border-radius:var(--radius-lg);min-height:120px;' +
      'display:flex;align-items:center;justify-content:center;gap:6px;color:var(--text-5);cursor:pointer;' +
      'font-size:13px;transition:border-color .1s,color .1s;" ' +
      'onmouseover="this.style.borderColor=\'var(--border-3)\';this.style.color=\'var(--text-3)\'" ' +
      'onmouseout="this.style.borderColor=\'var(--border-2)\';this.style.color=\'var(--text-5)\'">' +
      '<i class="ti ti-plus" style="font-size:16px;"></i> New note</div>';
  },

  renderCard(note) {
    var type = this.types.find(function(t) { return t.id === note.type; }) || this.types[1];
    var dateStr = this.relativeDate(note.updated || note.created || Date.now());

    return '<div class="card" onclick="NotesList.openEdit(\'' + note.id + '\')" ' +
      'style="cursor:pointer;min-height:120px;display:flex;flex-direction:column;gap:10px;">' +
      '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;">' +
      '<div style="font-size:13px;color:var(--text-1);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;">' +
      this.esc(note.title || '(bez názvu)') + '</div>' +
      '<span style="font-size:11px;padding:2px 8px;border-radius:4px;flex-shrink:0;color:' + type.color + ';background:' + type.bg + ';">' +
      type.label + '</span>' +
      '</div>' +
      '<div style="margin-top:auto;display:flex;align-items:center;justify-content:space-between;">' +
      '<span style="font-size:11px;color:var(--text-4);">' + dateStr + '</span>' +
      (note.project ? '<span style="font-size:10px;padding:2px 6px;border-radius:4px;color:var(--text-3);background:var(--bg-hover);">' + this.esc(note.project) + '</span>' : '<span></span>') +
      '</div>' +
      '</div>';
  },

  relativeDate(d) {
    var date = new Date(d);
    var now  = new Date();
    var startOfDay = function(x) { return new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime(); };
    var diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86400000);

    if (diffDays === 0) return 'dnes';
    if (diffDays === 1) return 'včera';
    return String(date.getDate()) + '. ' + String(date.getMonth() + 1) + '.';
  },

  openNew() {
    this.openModal({
      id: Store.uid(),
      title: '',
      type: 'poznamka',
      project: '',
      created: Date.now(),
      updated: Date.now(),
      content: null,
    }, true);
  },

  openEdit(id) {
    var notes = Store.get('notes') || [];
    var note = notes.find(function(n) { return n.id === id; });
    if (note) this.openModal(note, false);
  },

  openModal(note, isNew) {
    var modal = document.getElementById('note-modal');
    modal.style.display = 'flex';
    this._editingId = note.id;

    var typeOptions = this.types.map(function(t) {
      return '<option value="' + t.id + '"' + (note.type === t.id ? ' selected' : '') + '>' + t.label + '</option>';
    }).join('');

    // Jen projekty, které už uživatel sám někam zadal — žádné
    // přednastavené návrhy navíc (stejně jako u úkolů).
    var existingProjects = Array.from(new Set(
      (Store.get('notes') || []).map(function(n) { return n.project; }).filter(Boolean)
    ));
    var projDatalist = existingProjects.map(function(p) {
      return '<option value="' + p + '"></option>';
    }).join('');

    modal.innerHTML =
      '<div style="background:var(--bg-card);border:0.5px solid var(--border-2);border-radius:12px;width:420px;padding:24px;">' +

      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">' +
      '<div style="font-size:15px;font-weight:500;color:var(--text-1);">' + (isNew ? 'Nová poznámka' : 'Upravit poznámku') + '</div>' +
      '<i class="ti ti-x" style="font-size:18px;color:var(--text-4);cursor:pointer;" onclick="NotesList.closeModal()"></i>' +
      '</div>' +

      '<div style="margin-bottom:14px;">' +
      '<div style="font-size:11px;color:var(--text-4);text-transform:uppercase;letter-spacing:0.6px;margin-bottom:6px;">Název</div>' +
      '<input id="n-title" value="' + this.esc(note.title) + '" placeholder="Název poznámky..."' +
      ' style="width:100%;background:var(--bg);border:0.5px solid var(--border-2);border-radius:6px;padding:8px 10px;font-size:13px;color:var(--text-1);outline:none;" />' +
      '</div>' +

      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px;">' +
      '<div><div style="font-size:11px;color:var(--text-4);text-transform:uppercase;letter-spacing:0.6px;margin-bottom:6px;">Typ</div>' +
      '<select id="n-type" style="width:100%;background:var(--bg);border:0.5px solid var(--border-2);border-radius:6px;padding:8px 10px;font-size:13px;color:var(--text-1);outline:none;">' + typeOptions + '</select></div>' +
      '<div><div style="font-size:11px;color:var(--text-4);text-transform:uppercase;letter-spacing:0.6px;margin-bottom:6px;">Projekt</div>' +
      '<input id="n-project" list="n-project-list" autocomplete="off" value="' + this.esc(note.project || '') + '" placeholder="Napiš projekt..."' +
      ' style="width:100%;background:var(--bg);border:0.5px solid var(--border-2);border-radius:6px;padding:8px 10px;font-size:13px;color:var(--text-1);outline:none;" />' +
      '<datalist id="n-project-list">' + projDatalist + '</datalist></div>' +
      '</div>' +

      '<button class="btn" onclick="NotesList.openEditor()" style="width:100%;justify-content:center;margin-bottom:16px;">' +
      '<i class="ti ti-pencil"></i> Otevřít editor</button>' +

      '<div style="display:flex;align-items:center;justify-content:space-between;padding-top:16px;border-top:0.5px solid var(--border);">' +
      (!isNew ? '<button class="btn" onclick="NotesList.deleteNote(\'' + note.id + '\')" style="color:var(--red);border-color:var(--red-bg);"><i class="ti ti-trash"></i> Smazat</button>' : '<div></div>') +
      '<div style="display:flex;gap:8px;">' +
      '<button class="btn" onclick="NotesList.closeModal()">Zrušit</button>' +
      '<button class="btn primary" onclick="NotesList.saveNote(\'' + note.id + '\',' + isNew + ')"><i class="ti ti-device-floppy"></i> Uložit</button>' +
      '</div></div>' +

      '</div>';

    setTimeout(function() {
      var t = document.getElementById('n-title');
      if (t) t.focus();
    }, 100);
  },

  saveNote(id, isNew) {
    var title   = document.getElementById('n-title').value.trim();
    var type    = document.getElementById('n-type').value;
    var project = document.getElementById('n-project').value;

    var notes = Store.get('notes') || [];

    if (isNew) {
      notes.unshift({
        id: id,
        title: title,
        type: type,
        project: project,
        created: Date.now(),
        updated: Date.now(),
        content: null,
      });
    } else {
      var note = notes.find(function(n) { return n.id === id; });
      if (note) {
        note.title   = title;
        note.type    = type;
        note.project = project;
        note.updated = Date.now();
      }
    }

    Store.set('notes', notes);
    this.closeModal();
    this.renderProjectFilters();
    this.refresh();
  },

  deleteNote(id) {
    if (!confirm('Smazat poznámku?')) return;
    var notes = (Store.get('notes') || []).filter(function(n) { return n.id !== id; });
    Store.set('notes', notes);
    Store.remove('note_' + id);
    this.closeModal();
    this.renderProjectFilters();
    this.refresh();
  },

  // Uloží aktuální stav modalu (i rozepsanou novou poznámku) a přejde do Excalidraw editoru
  openEditor() {
    var id      = this._editingId;
    var title   = document.getElementById('n-title').value.trim();
    var type    = document.getElementById('n-type').value;
    var project = document.getElementById('n-project').value;

    var notes = Store.get('notes') || [];
    var note  = notes.find(function(n) { return n.id === id; });

    if (note) {
      note.title   = title;
      note.type    = type;
      note.project = project;
      note.updated = Date.now();
    } else {
      notes.unshift({
        id: id,
        title: title,
        type: type,
        project: project,
        created: Date.now(),
        updated: Date.now(),
        content: null,
      });
    }

    Store.set('notes', notes);
    this.closeModal();
    App.navigate('notes-editor', id);
  },

  closeModal() {
    var modal = document.getElementById('note-modal');
    if (modal) modal.style.display = 'none';
  },

  esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

};
