/* ===========================
   o-io.cz — hlavní aplikace
   Router + navigace
=========================== */

const App = {

  currentPage: null,

  pages: {
    'dashboard':        { title: 'Dashboard',   module: 'Dashboard' },
    'tasks-board':      { title: 'Board',        module: 'TasksBoard' },
    'tasks-list':       { title: 'Seznam',       module: 'TasksList' },
    'notes-list':       { title: 'Poznámky',     module: 'NotesList' },
    'notes-editor':     { title: 'Editor',       module: 'NotesEditor' },
    'homelab':          { title: 'Homelab',      module: 'Homelab' },
    'finance':          { title: 'Finance',      module: 'Finance' },
    'finance-plan':     { title: 'Roční plán',   module: 'FinancePlan' },
    'finance-savings':  { title: 'Spoření',      module: 'FinanceSavings' },
    'finance-shopping': { title: 'Nákupy',       module: 'FinanceShopping' },
    'finance-invest':   { title: 'Investice',    module: 'FinanceInvest' },
  },

  init() {
    if (!Auth.isLoggedIn()) {
      Auth.showLogin(() => this.start());
    } else {
      this.start();
    }
  },

  start() {
    document.getElementById('app').style.display = 'flex';
    this.bindNav();
    const startPage = location.hash.replace('#', '') || 'dashboard';
    this.navigate(startPage);
  },

  navigate(page) {
    if (!this.pages[page]) page = 'dashboard';

    location.hash = page;
    this.currentPage = page;

    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });

    document.getElementById('page-title').textContent = this.pages[page].title;
    document.getElementById('topbar-actions').innerHTML = '';

    const moduleName = this.pages[page].module;
    const content = document.getElementById('content');
    content.innerHTML = '';

    if (window[moduleName] && typeof window[moduleName].render === 'function') {
      window[moduleName].render(content);
    } else {
      content.innerHTML = `<div style="color:var(--text-4);margin-top:40px;text-align:center;font-size:13px;">
        Stránka <strong>${page}</strong> se připravuje...
      </div>`;
    }
  },

  bindNav() {
    document.querySelectorAll('.nav-item[data-page]').forEach(el => {
      el.addEventListener('click', () => this.navigate(el.dataset.page));
    });

    window.addEventListener('hashchange', () => {
      const page = location.hash.replace('#', '');
      if (page && page !== this.currentPage) this.navigate(page);
    });
  },

  setActions(html) {
    document.getElementById('topbar-actions').innerHTML = html;
  },

};

document.addEventListener('DOMContentLoaded', () => App.init());
