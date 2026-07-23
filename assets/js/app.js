/* ===========================
   o-io.cz — hlavní aplikace
   Router + navigace
=========================== */

const App = {

  // Aktuální stránka
  currentPage: null,

  // Mapování stránek na tituly a moduly
  pages: {
    'dashboard':       { title: 'Dashboard',    module: 'Dashboard' },
    'tasks-board':     { title: 'Board',         module: 'TasksBoard' },
    'tasks-list':      { title: 'Seznam',        module: 'TasksList' },
    'notes-list':      { title: 'Poznámky',      module: 'NotesList' },
    'notes-editor':    { title: 'Editor',        module: 'NotesEditor' },
    'homelab':         { title: 'Homelab',       module: 'Homelab' },
    'finance':         { title: 'Finance',       module: 'Finance' },
    'finance-plan':    { title: 'Roční plán',    module: 'FinancePlan' },
    'finance-savings': { title: 'Spoření',       module: 'FinanceSavings' },
    'finance-shopping':{ title: 'Nákupy',        module: 'FinanceShopping' },
    'finance-invest':  { title: 'Investice',     module: 'FinanceInvest' },
  },

  // Inicializace
  init() {
    this.bindNav();

    const start = () => {
      document.getElementById('app').style.display = 'flex';
      const startPage = location.hash.replace('#', '') || 'dashboard';
      this.navigate(startPage);
    };

    if (!Auth.isLoggedIn()) {
      Auth.showLogin(() => start());
    } else {
      start();
    }
  },

  // Navigace na stránku
  navigate(page) {
    if (!this.pages[page]) page = 'dashboard';

    // Aktualizuj URL hash
    location.hash = page;
    this.currentPage = page;

    // Aktualizuj sidebar
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });

    // Aktualizuj titulek
    document.getElementById('page-title').textContent = this.pages[page].title;

    // Vyčisti topbar actions
    document.getElementById('topbar-actions').innerHTML = '';

    // Načti modul stránky
    const moduleName = this.pages[page].module;
    if (window[moduleName] && typeof window[moduleName].render === 'function') {
      const content = document.getElementById('content');
      content.innerHTML = '';
      window[moduleName].render(content);
    } else {
      document.getElementById('content').innerHTML = `
        <div style="color: var(--text-4); margin-top: 40px; text-align: center;">
          Stránka <strong>${page}</strong> se připravuje...
        </div>`;
    }
  },

  // Bindování kliků na nav-item
  bindNav() {
    document.querySelectorAll('.nav-item[data-page]').forEach(el => {
      el.addEventListener('click', () => {
        this.navigate(el.dataset.page);
      });
    });

    // Hashchange (zpět/vpřed v prohlížeči)
    window.addEventListener('hashchange', () => {
      const page = location.hash.replace('#', '');
      if (page && page !== this.currentPage) {
        this.navigate(page);
      }
    });
  },

  // Helper: nastav topbar akce
  setActions(html) {
    document.getElementById('topbar-actions').innerHTML = html;
  },

};

// Spuštění po načtení stránky
document.addEventListener('DOMContentLoaded', () => App.init());
