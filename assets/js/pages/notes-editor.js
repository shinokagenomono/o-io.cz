/* ===========================
   Poznámky — Editor

   Skica -> Excalidraw (kresba). Poznámka -> obyčejné textové pole.
   (Typ Diagram byl zrušen.)
=========================== */

var NotesEditor = {

  currentId: null,
  excalidrawAPI: null,

  typeColors: { skica: 'var(--yellow)', poznamka: 'var(--text-3)' },
  typeLabels: { skica: 'Skica', poznamka: 'Poznámka' },

  render(container, noteId) {
    this.currentId = noteId || null;
    this.excalidrawAPI = null;
    App.setActions('');

    if (!this.currentId) {
      container.innerHTML = this.emptyState('Vyber poznámku ze Seznamu.');
      return;
    }

    var notes = Store.get('notes') || [];
    var note  = notes.find(function(n) { return n.id === NotesEditor.currentId; });

    if (!note) {
      container.innerHTML = this.emptyState('Poznámka nenalezena.');
      return;
    }

    if (note.type === 'poznamka') {
      this.renderTextEditor(container, note);
    } else {
      this.renderSketchEditor(container, note);
    }
  },

  emptyState(msg) {
    return '<div style="color:var(--text-4);margin-top:40px;text-align:center;font-size:13px;">' + msg +
      '<br><button class="btn primary" onclick="App.navigate(\'notes-list\')" style="margin-top:10px;">' +
      '<i class="ti ti-notes"></i> Přejít na Seznam</button></div>';
  },

  headerHtml(note, saveOnclick) {
    return '<div style="display:flex;align-items:center;gap:12px;padding:12px 20px;border-bottom:0.5px solid var(--border);flex-shrink:0;">' +
      '<button class="btn" onclick="App.navigate(\'notes-list\')"><i class="ti ti-arrow-left"></i> Zpět</button>' +
      '<input id="ne-title" value="' + this.esc(note.title) + '" placeholder="Název poznámky..."' +
      ' style="flex:1;background:transparent;border:none;font-size:15px;color:var(--text-1);outline:none;" />' +
      '<span style="font-size:11px;padding:2px 8px;border-radius:4px;color:' + (this.typeColors[note.type] || 'var(--text-3)') + ';background:rgba(255,255,255,0.06);">' +
      (this.typeLabels[note.type] || 'Poznámka') + '</span>' +
      '<button class="btn primary" onclick="' + saveOnclick + '"><i class="ti ti-device-floppy"></i> Uložit</button>' +
      '</div>';
  },

  // --- Poznámka: obyčejný text ---

  renderTextEditor(container, note) {
    container.style.padding   = '0';
    container.style.overflow  = 'hidden';
    container.style.display   = 'flex';
    container.style.flexDirection = 'column';
    container.style.height    = '100%';

    container.innerHTML =
      this.headerHtml(note, 'NotesEditor.saveText()') +
      '<div style="flex:1;padding:20px;min-height:0;">' +
      '<textarea id="ne-text" placeholder="Napiš poznámku..." ' +
      'style="width:100%;height:100%;resize:none;background:transparent;border:none;outline:none;font-size:14px;line-height:1.6;color:var(--text-1);font-family:var(--font);">' +
      this.esc(typeof note.content === 'string' ? note.content : '') + '</textarea>' +
      '</div>';

    setTimeout(function() {
      var t = document.getElementById('ne-text');
      if (t) t.focus();
    }, 50);
  },

  saveText() {
    var titleInput = document.getElementById('ne-title');
    var textInput  = document.getElementById('ne-text');

    var notes = Store.get('notes') || [];
    var note = notes.find(function(n) { return n.id === NotesEditor.currentId; });
    if (note) {
      note.title   = titleInput ? titleInput.value.trim() : note.title;
      note.content = textInput ? textInput.value : '';
      note.updated = Date.now();
      Store.set('notes', notes);
    }
  },

  // --- Skica: Excalidraw ---

  renderSketchEditor(container, note) {
    container.style.padding   = '0';
    container.style.overflow  = 'hidden';
    container.style.display   = 'flex';
    container.style.flexDirection = 'column';
    container.style.height    = '100%';

    container.innerHTML =
      this.headerHtml(note, 'NotesEditor.saveSketch()') +
      '<div id="excalidraw-root" style="flex:1;position:relative;min-height:0;"></div>';

    this.mountExcalidraw();
  },

  mountExcalidraw() {
    var root = document.getElementById('excalidraw-root');
    if (!root) return;

    if (!window.React || !window.ReactDOM || !window.ExcalidrawLib) {
      root.innerHTML = '<div style="color:var(--text-4);text-align:center;margin-top:40px;font-size:13px;">Excalidraw se nepodařilo načíst (vendor soubory).</div>';
      return;
    }

    var saved = Store.get('note_' + this.currentId) || {};

    // Ukládáme a zpět načítáme jen elements + viewBackgroundColor —
    // ne celý appState. Excalidraw interně drží některá pole
    // (např. collaborators) jako Map, ale Store je ukládá jako
    // obyčejný objekt (JSON), a po zpětném vložení celého appState
    // do initialData to při dalším otevření shazovalo editor
    // (TypeError: o.forEach is not a function).
    var element = React.createElement(ExcalidrawLib.Excalidraw, {
      excalidrawAPI: function(api) { NotesEditor.excalidrawAPI = api; },
      initialData: {
        elements: saved.elements || [],
        appState: {
          theme: 'dark',
          viewBackgroundColor: saved.viewBackgroundColor || '#ffffff',
        },
      },
      theme: 'dark',
    });

    ReactDOM.createRoot(root).render(element);
  },

  saveSketch() {
    if (!this.excalidrawAPI || !this.currentId) return;

    var titleInput = document.getElementById('ne-title');
    var title = titleInput ? titleInput.value.trim() : '';

    var elements = this.excalidrawAPI.getSceneElements();
    var appState = this.excalidrawAPI.getAppState();

    Store.set('note_' + this.currentId, {
      elements: elements,
      viewBackgroundColor: appState.viewBackgroundColor,
    });

    var notes = Store.get('notes') || [];
    var note = notes.find(function(n) { return n.id === NotesEditor.currentId; });
    if (note) {
      note.title   = title;
      note.updated = Date.now();
      Store.set('notes', notes);
    }
  },

  esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

};
