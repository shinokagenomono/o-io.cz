/* ===========================
   Finance — Přehled / Roční plán / Spoření / Nákupy / Investice
=========================== */

var formatCzk = function(amount) {
  amount = amount || 0;
  return amount.toLocaleString('cs-CZ') + ' Kč';
};

var formatCzkDecimal = function(amount) {
  amount = amount || 0;
  return amount.toLocaleString('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Kč';
};

var financeAmountColor = function(n) {
  if (n > 0) return 'var(--green)';
  if (n < 0) return 'var(--red)';
  return 'var(--text-4)';
};

var financeFormatDate = function(d) {
  if (!d) return '—';
  var date = (typeof d === 'string' && d.indexOf('-') !== -1) ? new Date(d + 'T00:00:00') : new Date(d);
  if (isNaN(date.getTime())) return '—';
  return String(date.getDate()).padStart(2, '0') + '.' + String(date.getMonth() + 1).padStart(2, '0') + '.' + date.getFullYear();
};

var financeEsc = function(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

var financeBar = function(pct, colorClass) {
  pct = Math.max(0, Math.min(100, pct || 0));
  return '<div class="bar-wrap"><div class="bar ' + (colorClass || 'accent') + '" style="width:' + pct + '%;"></div></div>';
};


/* ===========================
   Modul 1 — Finance (Přehled)
=========================== */

var Finance = {

  render(container) {
    App.setActions('');

    var plans       = Store.get('finance_plans') || [];
    var savings     = Store.get('finance_savings') || [];
    var shopping    = Store.get('finance_shopping') || [];
    var investments = Store.get('finance_investments') || [];
    var balance     = this.computeBalance(plans, savings);

    container.innerHTML =
      '<div class="card" style="margin-bottom:20px;">' +
      '<div class="section-title">Zůstatek na účtu</div>' +
      '<div style="font-size:32px;font-weight:500;color:' + financeAmountColor(balance) + ';">' + formatCzk(balance) + '</div>' +
      '<div style="font-size:11px;color:var(--text-4);margin-top:4px;">Počítá se automaticky — součet zůstatků Ročních plánů a Spoření</div>' +
      '</div>' +

      '<div class="card" style="margin-bottom:16px;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
      '<div class="section-title" style="margin-bottom:0;">Roční plány</div>' +
      '<button class="btn" onclick="FinancePlan.addYear()"><i class="ti ti-plus"></i> Přidat</button>' +
      '</div>' +
      '<div id="fin-plans-list" class="grid-3"></div>' +
      '</div>' +

      '<div class="card" style="margin-bottom:16px;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
      '<div class="section-title" style="margin-bottom:0;">Spoření</div>' +
      '<button class="btn" onclick="FinanceSavings.openNew()"><i class="ti ti-plus"></i> Přidat</button>' +
      '</div>' +
      '<div id="fin-savings-list" class="grid-3"></div>' +
      '</div>' +

      '<div class="card" style="margin-bottom:16px;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
      '<div class="section-title" style="margin-bottom:0;">Nákupy</div>' +
      '<button class="btn" onclick="FinanceShopping.addAccount()"><i class="ti ti-plus"></i> Přidat</button>' +
      '</div>' +
      '<div id="fin-shopping-list" class="grid-3"></div>' +
      '</div>' +

      '<div class="card">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
      '<div class="section-title" style="margin-bottom:0;">Investice</div>' +
      '<button class="btn" onclick="FinanceInvest.addInvestment()"><i class="ti ti-plus"></i> Přidat</button>' +
      '</div>' +
      '<div id="fin-invest-list"></div>' +
      '</div>';

    this.renderPlans(plans);
    this.renderSavings(savings);
    this.renderShopping(shopping);
    this.renderInvest(investments);
  },

  // Zůstatek na účtu = součet zůstatků (příjmy - zaplaceno) všech
  // Ročních plánů + součet našetřeno ve Spoření. Nákupy a Investice
  // do toho záměrně nespadají (jsou to oddělené účty/portfolio).
  computeBalance(plans, savings) {
    var fromPlans = plans.reduce(function(sum, p) {
      var paid   = (p.categories || []).reduce(function(s, c) { return s + (c.paid || 0); }, 0);
      var income = (p.incomes || []).reduce(function(s, i) { return s + (i.amount || 0); }, 0);
      return sum + (income - paid);
    }, 0);
    var fromSavings = savings.reduce(function(sum, g) { return sum + (g.saved || 0); }, 0);
    return fromPlans + fromSavings;
  },

  renderPlans(plans) {
    var el = document.getElementById('fin-plans-list');
    if (!el) return;

    if (!plans.length) {
      el.innerHTML = '<div style="font-size:12px;color:var(--text-4);padding:8px 0;">Zatím žádný roční plán.</div>';
      return;
    }

    el.innerHTML = plans.slice().sort(function(a, b) { return a.year - b.year; }).map(function(p) {
      var planned = (p.categories || []).reduce(function(s, c) { return s + (c.planned || 0); }, 0);
      var paid    = (p.categories || []).reduce(function(s, c) { return s + (c.paid || 0); }, 0);
      var income  = (p.incomes || []).reduce(function(s, i) { return s + (i.amount || 0); }, 0);
      var zustatek = income - paid;

      return '<div class="card" style="cursor:pointer;" onclick="App.navigate(\'finance-plan\',' + p.year + ')">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
        '<span style="font-size:13px;color:var(--text-1);">Rok ' + p.year + '</span>' +
        '<i class="ti ti-trash" style="color:var(--text-5);cursor:pointer;" onclick="event.stopPropagation();Finance.deletePlan(\'' + p.id + '\')"></i>' +
        '</div>' +
        '<div class="mini-stat" style="margin-bottom:6px;"><span class="mini-stat-label">Celk. náklady</span><span class="mini-stat-val">' + formatCzk(planned) + '</span></div>' +
        '<div class="mini-stat" style="margin-bottom:6px;"><span class="mini-stat-label">Přijato</span><span class="mini-stat-val" style="color:var(--green);">' + formatCzk(income) + '</span></div>' +
        '<div class="mini-stat" style="margin-bottom:6px;"><span class="mini-stat-label">Zaplaceno</span><span class="mini-stat-val">' + formatCzk(paid) + '</span></div>' +
        '<div class="mini-stat"><span class="mini-stat-label">Zůstatek</span><span class="mini-stat-val" style="color:' + financeAmountColor(zustatek) + ';">' + formatCzk(zustatek) + '</span></div>' +
        '</div>';
    }).join('');
  },

  deletePlan(id) {
    if (!confirm('Smazat roční plán?')) return;
    var plans = (Store.get('finance_plans') || []).filter(function(p) { return p.id !== id; });
    Store.set('finance_plans', plans);
    this.render(document.getElementById('content'));
  },

  renderSavings(savings) {
    var el = document.getElementById('fin-savings-list');
    if (!el) return;

    if (!savings.length) {
      el.innerHTML = '<div style="font-size:12px;color:var(--text-4);padding:8px 0;">Zatím žádný cíl.</div>';
      return;
    }

    el.innerHTML = savings.map(function(g) {
      var pct      = g.target > 0 ? Math.round((g.saved / g.target) * 100) : 0;
      var dosetrit = Math.max(0, (g.target || 0) - (g.saved || 0));
      return '<div class="card" style="cursor:pointer;" onclick="App.navigate(\'finance-savings\')">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
        '<span style="font-size:13px;color:var(--text-1);">' + financeEsc(g.name) + '</span>' +
        '<i class="ti ti-trash" style="color:var(--text-5);cursor:pointer;" onclick="event.stopPropagation();Finance.deleteSavings(\'' + g.id + '\')"></i>' +
        '</div>' +
        financeBar(pct, 'green') +
        '<div class="mini-stat" style="margin-top:8px;margin-bottom:6px;"><span class="mini-stat-label">Cílová částka</span><span class="mini-stat-val">' + formatCzk(g.target) + '</span></div>' +
        '<div class="mini-stat" style="margin-bottom:6px;"><span class="mini-stat-label">Našetřeno</span><span class="mini-stat-val" style="color:var(--green);">' + formatCzk(g.saved) + ' (' + pct + ' %)</span></div>' +
        '<div class="mini-stat"><span class="mini-stat-label">Došetřit</span><span class="mini-stat-val" style="color:' + (dosetrit > 0 ? 'var(--red)' : 'var(--green)') + ';">' + formatCzk(dosetrit) + '</span></div>' +
        '</div>';
    }).join('');
  },

  deleteSavings(id) {
    if (!confirm('Smazat cíl?')) return;
    var savings = (Store.get('finance_savings') || []).filter(function(g) { return g.id !== id; });
    Store.set('finance_savings', savings);
    this.render(document.getElementById('content'));
  },

  renderShopping(shopping) {
    var el = document.getElementById('fin-shopping-list');
    if (!el) return;

    if (!shopping.length) {
      el.innerHTML = '<div style="font-size:12px;color:var(--text-4);padding:8px 0;">Zatím žádný účet.</div>';
      return;
    }

    el.innerHTML = shopping.map(function(a) {
      var incomes  = a.incomes  || (a.transactions || []).filter(function(t) { return t.amount > 0; });
      var expenses = a.expenses || (a.transactions || []).filter(function(t) { return t.amount < 0; });
      var income = incomes.reduce(function(s, t) { return s + Math.abs(t.amount || 0); }, 0);
      var paid   = expenses.reduce(function(s, t) { return s + Math.abs(t.amount || 0); }, 0);
      var balance = income - paid;

      return '<div class="card" style="cursor:pointer;" onclick="App.navigate(\'finance-shopping\',\'' + a.id + '\')">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
        '<span style="font-size:13px;color:var(--text-1);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + financeEsc(a.name) + '</span>' +
        '<i class="ti ti-trash" style="color:var(--text-5);cursor:pointer;flex-shrink:0;" onclick="event.stopPropagation();Finance.deleteShopping(\'' + a.id + '\')"></i>' +
        '</div>' +
        '<div class="mini-stat" style="margin-bottom:6px;"><span class="mini-stat-label">Na účtu</span><span class="mini-stat-val" style="color:' + financeAmountColor(balance) + ';">' + formatCzkDecimal(balance) + '</span></div>' +
        '<div class="mini-stat" style="margin-bottom:6px;"><span class="mini-stat-label">Přijato</span><span class="mini-stat-val" style="color:var(--green);">' + formatCzkDecimal(income) + '</span></div>' +
        '<div class="mini-stat"><span class="mini-stat-label">Uhrazeno</span><span class="mini-stat-val" style="color:var(--red);">' + formatCzkDecimal(paid) + '</span></div>' +
        '</div>';
    }).join('');
  },

  deleteShopping(id) {
    if (!confirm('Smazat účet?')) return;
    var shopping = (Store.get('finance_shopping') || []).filter(function(a) { return a.id !== id; });
    Store.set('finance_shopping', shopping);
    this.render(document.getElementById('content'));
  },

  renderInvest(investments) {
    var el = document.getElementById('fin-invest-list');
    if (!el) return;

    if (!investments.length) {
      el.innerHTML = '<div style="font-size:12px;color:var(--text-4);padding:8px 0;">Zatím žádná investice.</div>';
      return;
    }

    el.innerHTML = investments.map(function(inv) {
      var profit = (inv.value || 0) - (inv.deposited || 0);
      var pct = inv.deposited > 0 ? ((profit / inv.deposited) * 100).toFixed(1) : '0.0';

      return '<div class="status-row" style="cursor:pointer;align-items:center;" onclick="App.navigate(\'finance-invest\',\'' + inv.id + '\')">' +
        '<span class="status-name" style="min-width:170px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + financeEsc(inv.name) + '</span>' +
        '<div style="display:flex;gap:28px;flex:1;">' +
        '<div class="mini-stat"><span class="mini-stat-label">Vloženo</span><span class="mini-stat-val">' + formatCzk(inv.deposited) + '</span></div>' +
        '<div class="mini-stat"><span class="mini-stat-label">Hodnota</span><span class="mini-stat-val">' + formatCzk(inv.value) + '</span></div>' +
        '<div class="mini-stat"><span class="mini-stat-label">Zisk/Ztráta</span><span class="mini-stat-val" style="color:' + financeAmountColor(profit) + ';">' + formatCzk(profit) + ' (' + pct + ' %)</span></div>' +
        '</div>' +
        '<i class="ti ti-trash" style="color:var(--text-5);cursor:pointer;" onclick="event.stopPropagation();Finance.deleteInvest(\'' + inv.id + '\')"></i>' +
        '</div>';
    }).join('');
  },

  deleteInvest(id) {
    if (!confirm('Smazat investici?')) return;
    var investments = (Store.get('finance_investments') || []).filter(function(i) { return i.id !== id; });
    Store.set('finance_investments', investments);
    this.render(document.getElementById('content'));
  },

};


/* ===========================
   Modul 2 — FinancePlan (Roční plán)
=========================== */

var FinancePlan = {

  currentYear: null,
  container: null,
  editingCategoryId: null,
  editingIncomeId: null,

  render(container, year) {
    this.container = container;
    var plans = Store.get('finance_plans') || [];

    if (!plans.length) {
      App.setActions('<button class="btn primary" onclick="FinancePlan.addYear()"><i class="ti ti-plus"></i> Přidat rok</button>');
      container.innerHTML = '<div style="color:var(--text-4);margin-top:60px;text-align:center;font-size:13px;">' +
        '<i class="ti ti-calendar-stats" style="font-size:40px;color:var(--text-5);display:block;margin-bottom:14px;"></i>' +
        'Zatím žádný roční plán.<br>' +
        '<button class="btn primary" onclick="FinancePlan.addYear()" style="margin-top:14px;"><i class="ti ti-plus"></i> Přidat rok</button></div>';
      return;
    }

    var years = plans.map(function(p) { return p.year; }).sort(function(a, b) { return a - b; });
    if (year) this.currentYear = year;
    if (!this.currentYear || years.indexOf(this.currentYear) === -1) this.currentYear = years[years.length - 1];

    var plan = plans.find(function(p) { return p.year === FinancePlan.currentYear; });
    var idx = years.indexOf(this.currentYear);
    var prevYear = years[idx - 1];
    var nextYear = years[idx + 1];

    App.setActions(
      (prevYear ? '<button class="btn" onclick="FinancePlan.switchYear(' + prevYear + ')"><i class="ti ti-chevron-left"></i> ' + prevYear + '</button>' : '') +
      '<span style="font-size:14px;font-weight:500;color:var(--text-1);padding:0 10px;">' + this.currentYear + '</span>' +
      (nextYear ? '<button class="btn" onclick="FinancePlan.switchYear(' + nextYear + ')">' + nextYear + ' <i class="ti ti-chevron-right"></i></button>' : '') +
      '<button class="btn primary" onclick="FinancePlan.addYear()" style="margin-left:12px;"><i class="ti ti-plus"></i> Přidat rok</button>'
    );

    var categories = plan.categories || [];
    var incomes    = plan.incomes || [];
    var planned  = categories.reduce(function(s, c) { return s + (c.planned || 0); }, 0);
    var paid     = categories.reduce(function(s, c) { return s + (c.paid || 0); }, 0);
    var income   = incomes.reduce(function(s, i) { return s + (i.amount || 0); }, 0);
    var zbyva    = income - paid;
    var dosetrit = planned - income;

    container.innerHTML =
      '<div class="card" style="margin-bottom:16px;">' +
      '<div class="section-title">Přehled roku</div>' +
      '<div class="grid-5">' +
      '<div><div style="font-size:11px;color:var(--text-4);">Plánované náklady</div><div style="font-size:18px;color:var(--text-1);">' + formatCzk(planned) + '</div></div>' +
      '<div><div style="font-size:11px;color:var(--text-4);">Přijato</div><div style="font-size:18px;color:var(--text-1);">' + formatCzk(income) + '</div></div>' +
      '<div><div style="font-size:11px;color:var(--text-4);">Zaplaceno</div><div style="font-size:18px;color:var(--text-1);">' + formatCzk(paid) + '</div></div>' +
      '<div><div style="font-size:11px;color:var(--text-4);">Zbývá</div><div style="font-size:18px;color:' + financeAmountColor(zbyva) + ';">' + formatCzk(zbyva) + '</div></div>' +
      '<div><div style="font-size:11px;color:var(--text-4);">Došetřit</div><div style="font-size:18px;color:' + (dosetrit > 0 ? 'var(--red)' : 'var(--green)') + ';">' + formatCzk(dosetrit) + '</div></div>' +
      '</div></div>' +

      '<div class="card" style="margin-bottom:16px;">' +
      '<div class="section-title">Kategorie výdajů</div>' +
      '<div id="fp-categories"></div>' +
      '<div style="display:flex;gap:8px;align-items:center;margin-top:12px;padding-top:12px;border-top:0.5px solid var(--border);">' +
      '<input id="fp-cat-name" placeholder="Název kategorie..." style="flex:1;background:var(--bg);border:0.5px solid var(--border-2);border-radius:6px;padding:7px 10px;font-size:13px;color:var(--text-1);outline:none;" />' +
      '<input id="fp-cat-section" list="fp-section-list" placeholder="Sekce..." style="width:160px;background:var(--bg);border:0.5px solid var(--border-2);border-radius:6px;padding:7px 10px;font-size:13px;color:var(--text-1);outline:none;" autocomplete="off" />' +
      '<datalist id="fp-section-list">' + this.sectionDatalist() + '</datalist>' +
      '<input id="fp-cat-planned" type="number" placeholder="Plánováno Kč" style="width:130px;background:var(--bg);border:0.5px solid var(--border-2);border-radius:6px;padding:7px 10px;font-size:13px;color:var(--text-1);outline:none;" />' +
      '<button class="btn primary" onclick="FinancePlan.addCategory()"><i class="ti ti-plus"></i> Přidat</button>' +
      '</div></div>' +

      '<div class="card">' +
      '<div class="section-title">Příjmy</div>' +
      '<div id="fp-inc-header" style="display:flex;gap:10px;align-items:center;padding:4px 0;font-size:11px;color:var(--text-4);text-transform:uppercase;letter-spacing:0.5px;">' +
      '<span style="width:90px;">Datum</span><span style="flex:1;">Kdo</span><span style="width:110px;text-align:right;">Částka</span><span style="width:44px;"></span>' +
      '</div>' +
      '<div id="fp-incomes"></div>' +
      '<div style="display:flex;gap:8px;align-items:center;margin-top:12px;padding-top:12px;border-top:0.5px solid var(--border);">' +
      '<input id="fp-inc-date" type="date" style="width:150px;background:var(--bg);border:0.5px solid var(--border-2);border-radius:6px;padding:7px 10px;font-size:13px;color:var(--text-1);outline:none;" />' +
      '<input id="fp-inc-who" placeholder="Kdo..." style="flex:1;background:var(--bg);border:0.5px solid var(--border-2);border-radius:6px;padding:7px 10px;font-size:13px;color:var(--text-1);outline:none;" />' +
      '<input id="fp-inc-amount" type="number" placeholder="Částka Kč" style="width:130px;background:var(--bg);border:0.5px solid var(--border-2);border-radius:6px;padding:7px 10px;font-size:13px;color:var(--text-1);outline:none;" />' +
      '<button class="btn primary" onclick="FinancePlan.addIncome()"><i class="ti ti-plus"></i> Přidat</button>' +
      '</div></div>';

    this.renderCategories(categories);
    this.renderIncomes(incomes);
  },

  switchYear(y) {
    this.render(this.container, y);
  },

  addYear() {
    var y = prompt('Rok:', String(new Date().getFullYear()));
    if (!y) return;
    y = parseInt(y, 10);
    if (!y) return;

    var plans = Store.get('finance_plans') || [];
    if (plans.some(function(p) { return p.year === y; })) {
      this.currentYear = y;
      this.render(this.container || document.getElementById('content'), y);
      return;
    }

    plans.push({ id: Store.uid(), year: y, categories: [], incomes: [] });
    Store.set('finance_plans', plans);
    this.currentYear = y;
    App.navigate('finance-plan', y);
  },

  // Návrhy sekcí ze všech let, ne jen aktuálního roku — ať se
  // stejné názvy (Sport a zábava, Škola + kroužky...) nabízí
  // konzistentně rok od roku.
  sectionDatalist() {
    var plans = Store.get('finance_plans') || [];
    var sections = [];
    plans.forEach(function(p) {
      (p.categories || []).forEach(function(c) { if (c.section) sections.push(c.section); });
    });
    return Array.from(new Set(sections)).map(function(s) {
      return '<option value="' + financeEsc(s) + '"></option>';
    }).join('');
  },

  getCurrentPlan() {
    var plans = Store.get('finance_plans') || [];
    return plans.find(function(p) { return p.year === FinancePlan.currentYear; });
  },

  renderCategories(categories) {
    var el = document.getElementById('fp-categories');
    if (!el) return;

    if (!categories.length) {
      el.innerHTML = '<div style="font-size:12px;color:var(--text-4);padding:8px 0;">Zatím žádná kategorie.</div>';
      return;
    }

    var groups = {};
    categories.forEach(function(c) {
      var sec = c.section || '';
      groups[sec] = groups[sec] || [];
      groups[sec].push(c);
    });
    var sectionNames = Object.keys(groups).sort(function(a, b) {
      if (!a) return 1;
      if (!b) return -1;
      return a.localeCompare(b, 'cs');
    });

    var header = '<div style="display:flex;gap:10px;align-items:center;padding:4px 0;font-size:11px;color:var(--text-4);text-transform:uppercase;letter-spacing:0.5px;">' +
      '<span style="flex:1;">Název</span><span style="width:100px;text-align:right;">Plánováno</span><span style="width:100px;text-align:right;">Zaplaceno</span>' +
      '<span style="width:90px;text-align:right;">Zbývá</span><span style="width:90px;">Progress</span><span style="width:44px;"></span>' +
      '</div>';

    el.innerHTML = header + sectionNames.map(function(sec) {
      var groupHeader = '<div style="font-size:11px;color:var(--text-4);text-transform:uppercase;letter-spacing:0.5px;padding:10px 0 4px;">' +
        (sec ? financeEsc(sec) : 'Bez sekce') + '</div>';
      return groupHeader + groups[sec].map(function(c) { return FinancePlan.renderCategoryRow(c); }).join('');
    }).join('');
  },

  renderCategoryRow(c) {
    var zbyva = (c.planned || 0) - (c.paid || 0);
    var pct = c.planned > 0 ? Math.round((c.paid / c.planned) * 100) : 0;
    var isPaid = c.planned > 0 && c.paid >= c.planned;

    if (this.editingCategoryId === c.id) {
      return '<div style="display:flex;gap:8px;align-items:center;padding:8px 0;border-bottom:0.5px solid var(--border);font-size:13px;">' +
        '<input type="text" id="fp-edit-cat-name" value="' + financeEsc(c.name) + '" placeholder="Název"' +
        ' style="flex:1;background:var(--bg);border:0.5px solid var(--accent);border-radius:6px;padding:5px 8px;color:var(--text-1);font-size:13px;outline:none;" />' +
        '<input type="text" id="fp-edit-cat-section" list="fp-section-list" value="' + financeEsc(c.section || '') + '" placeholder="Sekce" autocomplete="off"' +
        ' style="width:140px;background:var(--bg);border:0.5px solid var(--accent);border-radius:6px;padding:5px 8px;color:var(--text-1);font-size:13px;outline:none;" />' +
        '<input type="number" id="fp-edit-cat-planned" value="' + (c.planned || 0) + '" title="Plánováno"' +
        ' style="width:100px;text-align:right;background:var(--bg);border:0.5px solid var(--green);border-radius:6px;padding:5px 8px;color:var(--text-1);font-size:13px;outline:none;" />' +
        '<input type="number" id="fp-edit-cat-paid" value="' + (c.paid || 0) + '" title="Zaplaceno"' +
        ' style="width:100px;text-align:right;background:var(--bg);border:0.5px solid var(--red);border-radius:6px;padding:5px 8px;color:var(--text-1);font-size:13px;outline:none;" />' +
        '<span style="width:44px;display:flex;gap:8px;">' +
        '<i class="ti ti-check" style="color:var(--green);cursor:pointer;" onclick="FinancePlan.saveCategoryEdit(\'' + c.id + '\')"></i>' +
        '<i class="ti ti-x" style="color:var(--text-5);cursor:pointer;" onclick="FinancePlan.cancelCategoryEdit()"></i>' +
        '</span></div>';
    }

    return '<div style="display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:0.5px solid var(--border);font-size:13px;">' +
      '<span style="flex:1;color:var(--text-2);">' + financeEsc(c.name) + '</span>' +
      '<span style="width:100px;text-align:right;color:var(--text-3);">' + formatCzk(c.planned) + '</span>' +
      '<span style="width:100px;text-align:right;color:var(--text-3);">' + formatCzk(c.paid) + '</span>' +
      '<span style="width:90px;text-align:right;color:' + financeAmountColor(zbyva) + ';">' + formatCzk(zbyva) + '</span>' +
      '<span style="width:90px;">' + financeBar(pct, isPaid ? 'green' : 'accent') + '</span>' +
      '<span style="width:44px;display:flex;gap:8px;">' +
      '<i class="ti ti-pencil" style="color:var(--text-5);cursor:pointer;" onclick="FinancePlan.editCategoryStart(\'' + c.id + '\')"></i>' +
      '<i class="ti ti-trash" style="color:var(--text-5);cursor:pointer;" onclick="FinancePlan.deleteCategory(\'' + c.id + '\')"></i>' +
      '</span></div>';
  },

  addCategory() {
    var name    = document.getElementById('fp-cat-name').value.trim();
    var section = document.getElementById('fp-cat-section').value.trim();
    var planned = parseFloat(document.getElementById('fp-cat-planned').value) || 0;
    if (!name) return;

    var plans = Store.get('finance_plans') || [];
    var plan  = plans.find(function(p) { return p.year === FinancePlan.currentYear; });
    plan.categories = plan.categories || [];
    plan.categories.push({ id: Store.uid(), name: name, section: section, planned: planned, paid: 0 });
    Store.set('finance_plans', plans);
    this.render(this.container, this.currentYear);
  },

  editCategoryStart(id) {
    this.editingCategoryId = id;
    this.renderCategories(this.getCurrentPlan().categories || []);
  },

  cancelCategoryEdit() {
    this.editingCategoryId = null;
    this.renderCategories(this.getCurrentPlan().categories || []);
  },

  saveCategoryEdit(id) {
    var name    = document.getElementById('fp-edit-cat-name').value.trim();
    var section = document.getElementById('fp-edit-cat-section').value.trim();
    var planned = parseFloat(document.getElementById('fp-edit-cat-planned').value) || 0;
    var paid    = parseFloat(document.getElementById('fp-edit-cat-paid').value) || 0;
    if (!name) return;

    var plans = Store.get('finance_plans') || [];
    var plan  = plans.find(function(p) { return p.year === FinancePlan.currentYear; });
    var cat   = (plan.categories || []).find(function(c) { return c.id === id; });
    if (cat) {
      cat.name    = name;
      cat.section = section;
      cat.planned = planned;
      cat.paid    = paid;
    }
    Store.set('finance_plans', plans);
    this.editingCategoryId = null;
    this.render(this.container, this.currentYear);
  },

  deleteCategory(id) {
    if (!confirm('Smazat kategorii?')) return;
    var plans = Store.get('finance_plans') || [];
    var plan  = plans.find(function(p) { return p.year === FinancePlan.currentYear; });
    plan.categories = (plan.categories || []).filter(function(c) { return c.id !== id; });
    Store.set('finance_plans', plans);
    this.render(this.container, this.currentYear);
  },

  renderIncomes(incomes) {
    var el = document.getElementById('fp-incomes');
    if (!el) return;

    if (!incomes.length) {
      el.innerHTML = '<div style="font-size:12px;color:var(--text-4);padding:8px 0;">Zatím žádný příjem.</div>';
      return;
    }

    el.innerHTML = incomes.slice().sort(function(a, b) { return (b.date || '').localeCompare(a.date || ''); })
      .map(function(i) { return FinancePlan.renderIncomeRow(i); }).join('');
  },

  renderIncomeRow(i) {
    if (this.editingIncomeId === i.id) {
      return '<div style="display:flex;gap:8px;align-items:center;padding:8px 0;border-bottom:0.5px solid var(--border);font-size:13px;">' +
        '<input type="date" id="fp-edit-inc-date" value="' + (i.date || '') + '"' +
        ' style="width:150px;background:var(--bg);border:0.5px solid var(--accent);border-radius:6px;padding:5px 8px;color:var(--text-1);font-size:13px;outline:none;" />' +
        '<input type="text" id="fp-edit-inc-who" value="' + financeEsc(i.who) + '" placeholder="Kdo"' +
        ' style="flex:1;background:var(--bg);border:0.5px solid var(--accent);border-radius:6px;padding:5px 8px;color:var(--text-1);font-size:13px;outline:none;" />' +
        '<input type="number" id="fp-edit-inc-amount" value="' + i.amount + '"' +
        ' style="width:110px;text-align:right;background:var(--bg);border:0.5px solid var(--accent);border-radius:6px;padding:5px 8px;color:var(--text-1);font-size:13px;outline:none;" />' +
        '<span style="width:44px;display:flex;gap:8px;">' +
        '<i class="ti ti-check" style="color:var(--green);cursor:pointer;" onclick="FinancePlan.saveIncomeEdit(\'' + i.id + '\')"></i>' +
        '<i class="ti ti-x" style="color:var(--text-5);cursor:pointer;" onclick="FinancePlan.cancelIncomeEdit()"></i>' +
        '</span></div>';
    }

    return '<div style="display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:0.5px solid var(--border);font-size:13px;">' +
      '<span style="width:90px;color:var(--text-3);">' + financeFormatDate(i.date) + '</span>' +
      '<span style="flex:1;color:var(--text-2);">' + financeEsc(i.who) + '</span>' +
      '<span style="width:110px;text-align:right;color:' + financeAmountColor(i.amount) + ';">' + formatCzk(i.amount) + '</span>' +
      '<span style="width:44px;display:flex;gap:8px;">' +
      '<i class="ti ti-pencil" style="color:var(--text-5);cursor:pointer;" onclick="FinancePlan.editIncomeStart(\'' + i.id + '\')"></i>' +
      '<i class="ti ti-trash" style="color:var(--text-5);cursor:pointer;" onclick="FinancePlan.deleteIncome(\'' + i.id + '\')"></i>' +
      '</span></div>';
  },

  addIncome() {
    var date   = document.getElementById('fp-inc-date').value;
    var who    = document.getElementById('fp-inc-who').value.trim();
    var amount = parseFloat(document.getElementById('fp-inc-amount').value) || 0;
    if (!who || !amount) return;

    var plans = Store.get('finance_plans') || [];
    var plan  = plans.find(function(p) { return p.year === FinancePlan.currentYear; });
    plan.incomes = plan.incomes || [];
    plan.incomes.push({ id: Store.uid(), date: date || null, who: who, amount: amount });
    Store.set('finance_plans', plans);
    this.render(this.container, this.currentYear);
  },

  editIncomeStart(id) {
    this.editingIncomeId = id;
    this.renderIncomes(this.getCurrentPlan().incomes || []);
  },

  cancelIncomeEdit() {
    this.editingIncomeId = null;
    this.renderIncomes(this.getCurrentPlan().incomes || []);
  },

  saveIncomeEdit(id) {
    var date   = document.getElementById('fp-edit-inc-date').value;
    var who    = document.getElementById('fp-edit-inc-who').value.trim();
    var amount = parseFloat(document.getElementById('fp-edit-inc-amount').value) || 0;
    if (!who) return;

    var plans = Store.get('finance_plans') || [];
    var plan  = plans.find(function(p) { return p.year === FinancePlan.currentYear; });
    var inc   = (plan.incomes || []).find(function(i) { return i.id === id; });
    if (inc) {
      inc.date   = date || null;
      inc.who    = who;
      inc.amount = amount;
    }
    Store.set('finance_plans', plans);
    this.editingIncomeId = null;
    this.render(this.container, this.currentYear);
  },

  deleteIncome(id) {
    if (!confirm('Smazat příjem?')) return;
    var plans = Store.get('finance_plans') || [];
    var plan  = plans.find(function(p) { return p.year === FinancePlan.currentYear; });
    plan.incomes = (plan.incomes || []).filter(function(i) { return i.id !== id; });
    Store.set('finance_plans', plans);
    this.render(this.container, this.currentYear);
  },

};


/* ===========================
   Modul 3 — FinanceSavings (Spoření)
=========================== */

var FinanceSavings = {

  render(container) {
    App.setActions('<button class="btn primary" onclick="FinanceSavings.openNew()"><i class="ti ti-plus"></i> Nový cíl</button>');

    var savings = Store.get('finance_savings') || [];

    if (!savings.length) {
      container.innerHTML = '<div style="color:var(--text-4);margin-top:60px;text-align:center;font-size:13px;">' +
        '<i class="ti ti-pig-money" style="font-size:40px;color:var(--text-5);display:block;margin-bottom:14px;"></i>' +
        'Zatím žádný spořící cíl.<br>' +
        '<button class="btn primary" onclick="FinanceSavings.openNew()" style="margin-top:14px;"><i class="ti ti-plus"></i> Nový cíl</button></div>';
      return;
    }

    container.innerHTML = '<div class="grid-2" id="fs-grid"></div><div id="fs-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:1000;align-items:center;justify-content:center;"></div>';

    var grid = document.getElementById('fs-grid');
    grid.innerHTML = savings.map(function(g) {
      var pct      = g.target > 0 ? Math.round((g.saved / g.target) * 100) : 0;
      var dosetrit = Math.max(0, (g.target || 0) - (g.saved || 0));
      return '<div class="card">' +
        '<div style="font-size:14px;color:var(--text-1);margin-bottom:10px;">' + financeEsc(g.name) + '</div>' +
        financeBar(pct, 'green') +
        '<div style="font-size:12px;color:var(--text-3);margin-top:8px;">Našetřeno: ' + formatCzk(g.saved) + ' z ' + formatCzk(g.target) + ' (' + pct + ' %)</div>' +
        '<div style="font-size:12px;color:' + (dosetrit > 0 ? 'var(--red)' : 'var(--green)') + ';margin-bottom:14px;">Došetřit: ' + formatCzk(dosetrit) + '</div>' +
        '<div style="display:flex;gap:8px;">' +
        '<button class="btn" onclick="FinanceSavings.openDeposit(\'' + g.id + '\')"><i class="ti ti-plus"></i> Vklad</button>' +
        '<button class="btn" onclick="FinanceSavings.openEdit(\'' + g.id + '\')"><i class="ti ti-pencil"></i> Upravit</button>' +
        '<button class="btn" onclick="FinanceSavings.deleteGoal(\'' + g.id + '\')" style="color:var(--red);border-color:var(--red-bg);margin-left:auto;"><i class="ti ti-trash"></i></button>' +
        '</div></div>';
    }).join('');
  },

  openNew() {
    this.openModal(null);
  },

  openEdit(id) {
    var savings = Store.get('finance_savings') || [];
    var goal = savings.find(function(g) { return g.id === id; });
    if (goal) this.openModal(goal);
  },

  openModal(goal) {
    var modal = document.getElementById('fs-modal');
    if (!modal) {
      // stránka byla prázdná (žádné cíle) — musíme si vytvořit modal element
      var container = document.getElementById('content');
      container.insertAdjacentHTML('beforeend', '<div id="fs-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:1000;align-items:center;justify-content:center;"></div>');
      modal = document.getElementById('fs-modal');
    }
    modal.style.display = 'flex';
    var isNew = !goal;

    modal.innerHTML =
      '<div style="background:var(--bg-card);border:0.5px solid var(--border-2);border-radius:12px;width:360px;padding:24px;">' +
      '<div style="font-size:15px;font-weight:500;color:var(--text-1);margin-bottom:20px;">' + (isNew ? 'Nový cíl' : 'Upravit cíl') + '</div>' +
      '<div style="margin-bottom:14px;"><div style="font-size:11px;color:var(--text-4);text-transform:uppercase;margin-bottom:6px;">Název</div>' +
      '<input id="fs-name" value="' + (goal ? financeEsc(goal.name) : '') + '" style="width:100%;background:var(--bg);border:0.5px solid var(--border-2);border-radius:6px;padding:8px 10px;font-size:13px;color:var(--text-1);outline:none;" /></div>' +
      '<div style="margin-bottom:20px;"><div style="font-size:11px;color:var(--text-4);text-transform:uppercase;margin-bottom:6px;">Cílová částka (Kč)</div>' +
      '<input id="fs-target" type="number" value="' + (goal ? goal.target : '') + '" style="width:100%;background:var(--bg);border:0.5px solid var(--border-2);border-radius:6px;padding:8px 10px;font-size:13px;color:var(--text-1);outline:none;" /></div>' +
      '<div style="display:flex;justify-content:flex-end;gap:8px;">' +
      '<button class="btn" onclick="FinanceSavings.closeModal()">Zrušit</button>' +
      '<button class="btn primary" onclick="FinanceSavings.saveGoal(' + (goal ? '\'' + goal.id + '\'' : 'null') + ')">Uložit</button>' +
      '</div></div>';
  },

  saveGoal(id) {
    var name   = document.getElementById('fs-name').value.trim();
    var target = parseFloat(document.getElementById('fs-target').value) || 0;
    if (!name) return;

    var savings = Store.get('finance_savings') || [];

    if (id) {
      var goal = savings.find(function(g) { return g.id === id; });
      if (goal) { goal.name = name; goal.target = target; }
    } else {
      savings.push({ id: Store.uid(), name: name, target: target, saved: 0, created: Date.now(), entries: [] });
    }

    Store.set('finance_savings', savings);
    this.closeModal();
    this.render(document.getElementById('content'));
  },

  deleteGoal(id) {
    if (!confirm('Smazat cíl?')) return;
    var savings = (Store.get('finance_savings') || []).filter(function(g) { return g.id !== id; });
    Store.set('finance_savings', savings);
    this.render(document.getElementById('content'));
  },

  openDeposit(id) {
    var modal = document.getElementById('fs-modal');
    modal.style.display = 'flex';

    modal.innerHTML =
      '<div style="background:var(--bg-card);border:0.5px solid var(--border-2);border-radius:12px;width:360px;padding:24px;">' +
      '<div style="font-size:15px;font-weight:500;color:var(--text-1);margin-bottom:20px;">Přidat vklad</div>' +
      '<div style="margin-bottom:14px;"><div style="font-size:11px;color:var(--text-4);text-transform:uppercase;margin-bottom:6px;">Datum</div>' +
      '<input id="fs-dep-date" type="date" style="width:100%;background:var(--bg);border:0.5px solid var(--border-2);border-radius:6px;padding:8px 10px;font-size:13px;color:var(--text-1);outline:none;" /></div>' +
      '<div style="margin-bottom:14px;"><div style="font-size:11px;color:var(--text-4);text-transform:uppercase;margin-bottom:6px;">Částka (Kč)</div>' +
      '<input id="fs-dep-amount" type="number" style="width:100%;background:var(--bg);border:0.5px solid var(--border-2);border-radius:6px;padding:8px 10px;font-size:13px;color:var(--text-1);outline:none;" /></div>' +
      '<div style="margin-bottom:20px;"><div style="font-size:11px;color:var(--text-4);text-transform:uppercase;margin-bottom:6px;">Poznámka</div>' +
      '<input id="fs-dep-note" style="width:100%;background:var(--bg);border:0.5px solid var(--border-2);border-radius:6px;padding:8px 10px;font-size:13px;color:var(--text-1);outline:none;" /></div>' +
      '<div style="display:flex;justify-content:flex-end;gap:8px;">' +
      '<button class="btn" onclick="FinanceSavings.closeModal()">Zrušit</button>' +
      '<button class="btn primary" onclick="FinanceSavings.saveDeposit(\'' + id + '\')">Uložit</button>' +
      '</div></div>';
  },

  saveDeposit(id) {
    var date   = document.getElementById('fs-dep-date').value;
    var amount = parseFloat(document.getElementById('fs-dep-amount').value) || 0;
    var note   = document.getElementById('fs-dep-note').value.trim();
    if (!amount) return;

    var savings = Store.get('finance_savings') || [];
    var goal = savings.find(function(g) { return g.id === id; });
    if (goal) {
      goal.entries = goal.entries || [];
      goal.entries.push({ id: Store.uid(), date: date || null, amount: amount, note: note });
      goal.saved = goal.entries.reduce(function(s, e) { return s + (e.amount || 0); }, 0);
    }

    Store.set('finance_savings', savings);
    this.closeModal();
    this.render(document.getElementById('content'));
  },

  closeModal() {
    var modal = document.getElementById('fs-modal');
    if (modal) modal.style.display = 'none';
  },

};


/* ===========================
   Modul 4 — FinanceShopping (Nákupy)
=========================== */

var FinanceShopping = {

  currentId: null,
  container: null,
  editingIncomeId: null,
  editingExpenseId: null,

  render(container, id) {
    this.container = container;
    var accounts = Store.get('finance_shopping') || [];

    if (!accounts.length) {
      App.setActions('<button class="btn primary" onclick="FinanceShopping.addAccount()"><i class="ti ti-plus"></i> Nový účet</button>');
      container.innerHTML = '<div style="color:var(--text-4);margin-top:60px;text-align:center;font-size:13px;">' +
        '<i class="ti ti-shopping-cart" style="font-size:40px;color:var(--text-5);display:block;margin-bottom:14px;"></i>' +
        'Zatím žádný účet.<br>' +
        '<button class="btn primary" onclick="FinanceShopping.addAccount()" style="margin-top:14px;"><i class="ti ti-plus"></i> Nový účet</button></div>';
      return;
    }

    if (id) this.currentId = id;
    if (!this.currentId || !accounts.some(function(a) { return a.id === FinanceShopping.currentId; })) {
      this.currentId = accounts[0].id;
    }

    var account = accounts.find(function(a) { return a.id === FinanceShopping.currentId; });

    // Migrace ze starého jednotného seznamu transakcí (kladná/záporná
    // částka) na dva oddělené seznamy Příjmy/Výdaje s kladnými částkami.
    if (!account.incomes && !account.expenses) {
      var old = account.transactions || [];
      account.incomes  = old.filter(function(t) { return t.amount > 0; })
        .map(function(t) { return { id: t.id, date: t.date, description: t.description, amount: t.amount }; });
      account.expenses = old.filter(function(t) { return t.amount < 0; })
        .map(function(t) { return { id: t.id, date: t.date, description: t.description, amount: Math.abs(t.amount) }; });
      delete account.transactions;
      delete account.balance;
      Store.set('finance_shopping', accounts);
    }

    var options = accounts.map(function(a) {
      return '<option value="' + a.id + '"' + (a.id === account.id ? ' selected' : '') + '>' + financeEsc(a.name) + '</option>';
    }).join('');

    App.setActions(
      '<select onchange="FinanceShopping.switchAccount(this.value)" style="background:var(--bg-card);border:0.5px solid var(--border-2);border-radius:6px;padding:6px 10px;font-size:13px;color:var(--text-1);outline:none;">' + options + '</select>' +
      '<button class="btn primary" onclick="FinanceShopping.addAccount()" style="margin-left:8px;"><i class="ti ti-plus"></i> Nový účet</button>'
    );

    var incomes  = account.incomes || [];
    var expenses = account.expenses || [];
    var income  = incomes.reduce(function(s, t) { return s + (t.amount || 0); }, 0);
    var paid    = expenses.reduce(function(s, t) { return s + (t.amount || 0); }, 0);
    var balance = income - paid;

    container.innerHTML =
      '<div class="card" style="margin-bottom:16px;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">' +
      '<div class="section-title" style="margin-bottom:0;">Přehled účtu</div>' +
      '<button class="btn" onclick="FinanceShopping.resetAccount()" style="color:var(--red);border-color:var(--red-bg);font-size:11px;padding:3px 8px;"><i class="ti ti-refresh-alert"></i> Reset</button>' +
      '</div>' +
      '<div class="grid-3">' +
      '<div><div style="font-size:11px;color:var(--text-4);">Na účtu</div><div style="font-size:18px;color:' + financeAmountColor(balance) + ';">' + formatCzkDecimal(balance) + '</div></div>' +
      '<div><div style="font-size:11px;color:var(--text-4);">Přijato</div><div style="font-size:18px;color:var(--green);">' + formatCzkDecimal(income) + '</div></div>' +
      '<div><div style="font-size:11px;color:var(--text-4);">Uhrazeno</div><div style="font-size:18px;color:var(--red);">' + formatCzkDecimal(paid) + '</div></div>' +
      '</div></div>' +

      '<div class="grid-2">' +

      '<div class="card">' +
      '<div class="section-title">Příjmy</div>' +
      '<div style="display:flex;gap:8px;align-items:center;padding:4px 0;font-size:11px;color:var(--text-4);text-transform:uppercase;letter-spacing:0.5px;">' +
      '<span style="width:80px;">Datum</span><span style="flex:1;">Popis</span><span style="width:90px;text-align:right;">Částka</span><span style="width:44px;"></span>' +
      '</div>' +
      '<div id="fsh-incomes"></div>' +
      '<div style="display:flex;gap:6px;align-items:center;margin-top:12px;padding-top:12px;border-top:0.5px solid var(--border);flex-wrap:wrap;">' +
      '<input id="fsh-inc-date" type="date" style="width:130px;background:var(--bg);border:0.5px solid var(--border-2);border-radius:6px;padding:6px 8px;font-size:12px;color:var(--text-1);outline:none;" />' +
      '<input id="fsh-inc-desc" placeholder="Popis..." style="flex:1;min-width:80px;background:var(--bg);border:0.5px solid var(--border-2);border-radius:6px;padding:6px 8px;font-size:12px;color:var(--text-1);outline:none;" />' +
      '<input id="fsh-inc-amount" type="number" step="0.01" placeholder="Kč" style="width:90px;background:var(--bg);border:0.5px solid var(--border-2);border-radius:6px;padding:6px 8px;font-size:12px;color:var(--text-1);outline:none;" />' +
      '<button class="btn primary" onclick="FinanceShopping.addIncome()"><i class="ti ti-plus"></i></button>' +
      '</div></div>' +

      '<div class="card">' +
      '<div class="section-title">Výdaje</div>' +
      '<div style="display:flex;gap:8px;align-items:center;padding:4px 0;font-size:11px;color:var(--text-4);text-transform:uppercase;letter-spacing:0.5px;">' +
      '<span style="width:80px;">Datum</span><span style="flex:1;">Popis</span><span style="width:90px;text-align:right;">Částka</span><span style="width:44px;"></span>' +
      '</div>' +
      '<div id="fsh-expenses"></div>' +
      '<div style="display:flex;gap:6px;align-items:center;margin-top:12px;padding-top:12px;border-top:0.5px solid var(--border);flex-wrap:wrap;">' +
      '<input id="fsh-exp-date" type="date" style="width:130px;background:var(--bg);border:0.5px solid var(--border-2);border-radius:6px;padding:6px 8px;font-size:12px;color:var(--text-1);outline:none;" />' +
      '<input id="fsh-exp-desc" placeholder="Popis..." style="flex:1;min-width:80px;background:var(--bg);border:0.5px solid var(--border-2);border-radius:6px;padding:6px 8px;font-size:12px;color:var(--text-1);outline:none;" />' +
      '<input id="fsh-exp-amount" type="number" step="0.01" placeholder="Kč" style="width:90px;background:var(--bg);border:0.5px solid var(--border-2);border-radius:6px;padding:6px 8px;font-size:12px;color:var(--text-1);outline:none;" />' +
      '<button class="btn primary" onclick="FinanceShopping.addExpense()"><i class="ti ti-plus"></i></button>' +
      '</div></div>' +

      '</div>';

    this.renderIncomes(incomes);
    this.renderExpenses(expenses);
  },

  switchAccount(id) {
    this.render(this.container, id);
  },

  addAccount() {
    var name = prompt('Název účtu:');
    if (!name) return;

    var accounts = Store.get('finance_shopping') || [];
    var acc = { id: Store.uid(), name: name, incomes: [], expenses: [] };
    accounts.push(acc);
    Store.set('finance_shopping', accounts);
    this.currentId = acc.id;
    App.navigate('finance-shopping', acc.id);
  },

  resetAccount() {
    if (!confirm('Opravdu vynulovat celý účet? Smažou se všechny příjmy i výdaje.')) return;
    var accounts = Store.get('finance_shopping') || [];
    var acc = accounts.find(function(a) { return a.id === FinanceShopping.currentId; });
    if (acc) {
      acc.incomes = [];
      acc.expenses = [];
    }
    Store.set('finance_shopping', accounts);
    this.render(this.container, this.currentId);
  },

  getCurrentAccount() {
    var accounts = Store.get('finance_shopping') || [];
    return accounts.find(function(a) { return a.id === FinanceShopping.currentId; });
  },

  // --- Příjmy ---

  renderIncomes(incomes) {
    var el = document.getElementById('fsh-incomes');
    if (!el) return;

    if (!incomes.length) {
      el.innerHTML = '<div style="font-size:12px;color:var(--text-4);padding:8px 0;">Zatím žádný příjem.</div>';
      return;
    }

    el.innerHTML = incomes.slice().sort(function(a, b) { return (b.date || '').localeCompare(a.date || ''); })
      .map(function(t) { return FinanceShopping.renderIncomeRow(t); }).join('');
  },

  renderIncomeRow(t) {
    if (this.editingIncomeId === t.id) {
      return '<div style="display:flex;gap:6px;align-items:center;padding:8px 0;border-bottom:0.5px solid var(--border);font-size:12px;">' +
        '<input type="date" id="fsh-edit-inc-date" value="' + (t.date || '') + '"' +
        ' style="width:130px;background:var(--bg);border:0.5px solid var(--accent);border-radius:6px;padding:4px 6px;color:var(--text-1);font-size:12px;outline:none;" />' +
        '<input type="text" id="fsh-edit-inc-desc" value="' + financeEsc(t.description) + '" placeholder="Popis"' +
        ' style="flex:1;background:var(--bg);border:0.5px solid var(--accent);border-radius:6px;padding:4px 6px;color:var(--text-1);font-size:12px;outline:none;" />' +
        '<input type="number" step="0.01" id="fsh-edit-inc-amount" value="' + t.amount + '"' +
        ' style="width:90px;text-align:right;background:var(--bg);border:0.5px solid var(--accent);border-radius:6px;padding:4px 6px;color:var(--text-1);font-size:12px;outline:none;" />' +
        '<span style="width:44px;display:flex;gap:8px;">' +
        '<i class="ti ti-check" style="color:var(--green);cursor:pointer;" onclick="FinanceShopping.saveIncomeEdit(\'' + t.id + '\')"></i>' +
        '<i class="ti ti-x" style="color:var(--text-5);cursor:pointer;" onclick="FinanceShopping.cancelIncomeEdit()"></i>' +
        '</span></div>';
    }

    return '<div style="display:flex;gap:8px;align-items:center;padding:8px 0;border-bottom:0.5px solid var(--border);font-size:12px;">' +
      '<span style="width:80px;color:var(--text-3);">' + financeFormatDate(t.date) + '</span>' +
      '<span style="flex:1;color:var(--text-2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + financeEsc(t.description) + '</span>' +
      '<span style="width:90px;text-align:right;color:var(--green);">' + formatCzkDecimal(t.amount) + '</span>' +
      '<span style="width:44px;display:flex;gap:8px;">' +
      '<i class="ti ti-pencil" style="color:var(--text-5);cursor:pointer;" onclick="FinanceShopping.editIncomeStart(\'' + t.id + '\')"></i>' +
      '<i class="ti ti-trash" style="color:var(--text-5);cursor:pointer;" onclick="FinanceShopping.deleteIncome(\'' + t.id + '\')"></i>' +
      '</span></div>';
  },

  addIncome() {
    var date   = document.getElementById('fsh-inc-date').value;
    var desc   = document.getElementById('fsh-inc-desc').value.trim();
    var amount = parseFloat(document.getElementById('fsh-inc-amount').value) || 0;
    if (!desc || !amount) return;

    var accounts = Store.get('finance_shopping') || [];
    var acc = accounts.find(function(a) { return a.id === FinanceShopping.currentId; });
    acc.incomes = acc.incomes || [];
    acc.incomes.push({ id: Store.uid(), date: date || null, description: desc, amount: amount });
    Store.set('finance_shopping', accounts);
    this.render(this.container, this.currentId);
  },

  editIncomeStart(id) {
    this.editingIncomeId = id;
    this.renderIncomes(this.getCurrentAccount().incomes || []);
  },

  cancelIncomeEdit() {
    this.editingIncomeId = null;
    this.renderIncomes(this.getCurrentAccount().incomes || []);
  },

  saveIncomeEdit(id) {
    var date   = document.getElementById('fsh-edit-inc-date').value;
    var desc   = document.getElementById('fsh-edit-inc-desc').value.trim();
    var amount = parseFloat(document.getElementById('fsh-edit-inc-amount').value) || 0;
    if (!desc) return;

    var accounts = Store.get('finance_shopping') || [];
    var acc = accounts.find(function(a) { return a.id === FinanceShopping.currentId; });
    var t = (acc.incomes || []).find(function(x) { return x.id === id; });
    if (t) {
      t.date = date || null;
      t.description = desc;
      t.amount = amount;
    }
    Store.set('finance_shopping', accounts);
    this.editingIncomeId = null;
    this.render(this.container, this.currentId);
  },

  deleteIncome(id) {
    if (!confirm('Smazat příjem?')) return;
    var accounts = Store.get('finance_shopping') || [];
    var acc = accounts.find(function(a) { return a.id === FinanceShopping.currentId; });
    acc.incomes = (acc.incomes || []).filter(function(t) { return t.id !== id; });
    Store.set('finance_shopping', accounts);
    this.render(this.container, this.currentId);
  },

  // --- Výdaje ---

  renderExpenses(expenses) {
    var el = document.getElementById('fsh-expenses');
    if (!el) return;

    if (!expenses.length) {
      el.innerHTML = '<div style="font-size:12px;color:var(--text-4);padding:8px 0;">Zatím žádný výdaj.</div>';
      return;
    }

    el.innerHTML = expenses.slice().sort(function(a, b) { return (b.date || '').localeCompare(a.date || ''); })
      .map(function(t) { return FinanceShopping.renderExpenseRow(t); }).join('');
  },

  renderExpenseRow(t) {
    if (this.editingExpenseId === t.id) {
      return '<div style="display:flex;gap:6px;align-items:center;padding:8px 0;border-bottom:0.5px solid var(--border);font-size:12px;">' +
        '<input type="date" id="fsh-edit-exp-date" value="' + (t.date || '') + '"' +
        ' style="width:130px;background:var(--bg);border:0.5px solid var(--accent);border-radius:6px;padding:4px 6px;color:var(--text-1);font-size:12px;outline:none;" />' +
        '<input type="text" id="fsh-edit-exp-desc" value="' + financeEsc(t.description) + '" placeholder="Popis"' +
        ' style="flex:1;background:var(--bg);border:0.5px solid var(--accent);border-radius:6px;padding:4px 6px;color:var(--text-1);font-size:12px;outline:none;" />' +
        '<input type="number" step="0.01" id="fsh-edit-exp-amount" value="' + t.amount + '"' +
        ' style="width:90px;text-align:right;background:var(--bg);border:0.5px solid var(--accent);border-radius:6px;padding:4px 6px;color:var(--text-1);font-size:12px;outline:none;" />' +
        '<span style="width:44px;display:flex;gap:8px;">' +
        '<i class="ti ti-check" style="color:var(--green);cursor:pointer;" onclick="FinanceShopping.saveExpenseEdit(\'' + t.id + '\')"></i>' +
        '<i class="ti ti-x" style="color:var(--text-5);cursor:pointer;" onclick="FinanceShopping.cancelExpenseEdit()"></i>' +
        '</span></div>';
    }

    return '<div style="display:flex;gap:8px;align-items:center;padding:8px 0;border-bottom:0.5px solid var(--border);font-size:12px;">' +
      '<span style="width:80px;color:var(--text-3);">' + financeFormatDate(t.date) + '</span>' +
      '<span style="flex:1;color:var(--text-2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + financeEsc(t.description) + '</span>' +
      '<span style="width:90px;text-align:right;color:var(--red);">' + formatCzkDecimal(t.amount) + '</span>' +
      '<span style="width:44px;display:flex;gap:8px;">' +
      '<i class="ti ti-pencil" style="color:var(--text-5);cursor:pointer;" onclick="FinanceShopping.editExpenseStart(\'' + t.id + '\')"></i>' +
      '<i class="ti ti-trash" style="color:var(--text-5);cursor:pointer;" onclick="FinanceShopping.deleteExpense(\'' + t.id + '\')"></i>' +
      '</span></div>';
  },

  addExpense() {
    var date   = document.getElementById('fsh-exp-date').value;
    var desc   = document.getElementById('fsh-exp-desc').value.trim();
    var amount = parseFloat(document.getElementById('fsh-exp-amount').value) || 0;
    if (!desc || !amount) return;

    var accounts = Store.get('finance_shopping') || [];
    var acc = accounts.find(function(a) { return a.id === FinanceShopping.currentId; });
    acc.expenses = acc.expenses || [];
    acc.expenses.push({ id: Store.uid(), date: date || null, description: desc, amount: amount });
    Store.set('finance_shopping', accounts);
    this.render(this.container, this.currentId);
  },

  editExpenseStart(id) {
    this.editingExpenseId = id;
    this.renderExpenses(this.getCurrentAccount().expenses || []);
  },

  cancelExpenseEdit() {
    this.editingExpenseId = null;
    this.renderExpenses(this.getCurrentAccount().expenses || []);
  },

  saveExpenseEdit(id) {
    var date   = document.getElementById('fsh-edit-exp-date').value;
    var desc   = document.getElementById('fsh-edit-exp-desc').value.trim();
    var amount = parseFloat(document.getElementById('fsh-edit-exp-amount').value) || 0;
    if (!desc) return;

    var accounts = Store.get('finance_shopping') || [];
    var acc = accounts.find(function(a) { return a.id === FinanceShopping.currentId; });
    var t = (acc.expenses || []).find(function(x) { return x.id === id; });
    if (t) {
      t.date = date || null;
      t.description = desc;
      t.amount = amount;
    }
    Store.set('finance_shopping', accounts);
    this.editingExpenseId = null;
    this.render(this.container, this.currentId);
  },

  deleteExpense(id) {
    if (!confirm('Smazat výdaj?')) return;
    var accounts = Store.get('finance_shopping') || [];
    var acc = accounts.find(function(a) { return a.id === FinanceShopping.currentId; });
    acc.expenses = (acc.expenses || []).filter(function(t) { return t.id !== id; });
    Store.set('finance_shopping', accounts);
    this.render(this.container, this.currentId);
  },

};


/* ===========================
   Modul 5 — FinanceInvest (Investice)
=========================== */

var FinanceInvest = {

  currentId: null,
  container: null,

  render(container, id) {
    this.container = container;
    var investments = Store.get('finance_investments') || [];

    if (!investments.length) {
      App.setActions('<button class="btn primary" onclick="FinanceInvest.addInvestment()"><i class="ti ti-plus"></i> Nová investice</button>');
      container.innerHTML = '<div style="color:var(--text-4);margin-top:60px;text-align:center;font-size:13px;">' +
        '<i class="ti ti-trending-up" style="font-size:40px;color:var(--text-5);display:block;margin-bottom:14px;"></i>' +
        'Zatím žádná investice.<br>' +
        '<button class="btn primary" onclick="FinanceInvest.addInvestment()" style="margin-top:14px;"><i class="ti ti-plus"></i> Nová investice</button></div>';
      return;
    }

    if (id) this.currentId = id;
    if (!this.currentId || !investments.some(function(i) { return i.id === FinanceInvest.currentId; })) {
      this.currentId = investments[0].id;
    }

    var inv = investments.find(function(i) { return i.id === FinanceInvest.currentId; });

    var options = investments.map(function(i) {
      return '<option value="' + i.id + '"' + (i.id === inv.id ? ' selected' : '') + '>' + financeEsc(i.name) + '</option>';
    }).join('');

    App.setActions(
      '<select onchange="FinanceInvest.switchInvestment(this.value)" style="background:var(--bg-card);border:0.5px solid var(--border-2);border-radius:6px;padding:6px 10px;font-size:13px;color:var(--text-1);outline:none;">' + options + '</select>' +
      '<button class="btn primary" onclick="FinanceInvest.addInvestment()" style="margin-left:8px;"><i class="ti ti-plus"></i> Nová investice</button>'
    );

    var entries = inv.entries || [];
    var deposited = entries.reduce(function(s, e) { return s + (e.deposited || 0); }, 0);
    var value = entries.length ? entries.slice().sort(function(a, b) { return (a.date || '').localeCompare(b.date || ''); })[entries.length - 1].value : 0;
    var profit = value - deposited;
    var pct = deposited > 0 ? ((profit / deposited) * 100).toFixed(1) : '0.0';

    container.innerHTML =
      '<div class="card" style="margin-bottom:16px;">' +
      '<div class="section-title">Přehled</div>' +
      '<div class="grid-3">' +
      '<div><div style="font-size:11px;color:var(--text-4);">Celkem vloženo</div><div style="font-size:18px;color:var(--text-1);">' + formatCzk(deposited) + '</div></div>' +
      '<div><div style="font-size:11px;color:var(--text-4);">Aktuální hodnota</div><div style="font-size:18px;color:var(--text-1);">' + formatCzk(value) + '</div></div>' +
      '<div><div style="font-size:11px;color:var(--text-4);">Zisk/Ztráta</div><div style="font-size:18px;color:' + financeAmountColor(profit) + ';">' + formatCzk(profit) + ' (' + pct + ' %)</div></div>' +
      '</div></div>' +

      '<div class="card">' +
      '<div class="section-title">Historie vkladů</div>' +
      '<div style="display:flex;gap:10px;align-items:center;padding:4px 0;font-size:11px;color:var(--text-4);text-transform:uppercase;letter-spacing:0.5px;">' +
      '<span style="width:90px;">Datum</span><span style="flex:1;">Vloženo</span><span style="flex:1;">Hodnota portfolia</span><span style="flex:1;text-align:right;">Zisk/Ztráta</span><span style="width:20px;"></span>' +
      '</div>' +
      '<div id="fi-entries"></div>' +
      '<div style="display:flex;gap:8px;align-items:center;margin-top:12px;padding-top:12px;border-top:0.5px solid var(--border);">' +
      '<input id="fi-e-date" type="date" style="width:150px;background:var(--bg);border:0.5px solid var(--border-2);border-radius:6px;padding:7px 10px;font-size:13px;color:var(--text-1);outline:none;" />' +
      '<input id="fi-e-deposited" type="number" placeholder="Vloženo Kč" style="flex:1;background:var(--bg);border:0.5px solid var(--border-2);border-radius:6px;padding:7px 10px;font-size:13px;color:var(--text-1);outline:none;" />' +
      '<input id="fi-e-value" type="number" placeholder="Hodnota portfolia Kč" style="flex:1;background:var(--bg);border:0.5px solid var(--border-2);border-radius:6px;padding:7px 10px;font-size:13px;color:var(--text-1);outline:none;" />' +
      '<button class="btn primary" onclick="FinanceInvest.addEntry()"><i class="ti ti-plus"></i> Přidat</button>' +
      '</div></div>';

    this.renderEntries(entries);
  },

  switchInvestment(id) {
    this.render(this.container, id);
  },

  addInvestment() {
    var name = prompt('Název investice:');
    if (!name) return;

    var investments = Store.get('finance_investments') || [];
    var inv = { id: Store.uid(), name: name, deposited: 0, value: 0, entries: [] };
    investments.push(inv);
    Store.set('finance_investments', investments);
    this.currentId = inv.id;
    App.navigate('finance-invest', inv.id);
  },

  renderEntries(entries) {
    var el = document.getElementById('fi-entries');
    if (!el) return;

    if (!entries.length) {
      el.innerHTML = '<div style="font-size:12px;color:var(--text-4);padding:8px 0;">Zatím žádný záznam.</div>';
      return;
    }

    var sorted = entries.slice().sort(function(a, b) { return (b.date || '').localeCompare(a.date || ''); });

    el.innerHTML = sorted.map(function(e) {
      var profit = (e.value || 0) - (e.deposited || 0);
      return '<div style="display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:0.5px solid var(--border);font-size:13px;">' +
        '<span style="width:90px;color:var(--text-3);">' + financeFormatDate(e.date) + '</span>' +
        '<span style="flex:1;color:var(--text-2);">' + formatCzk(e.deposited) + '</span>' +
        '<span style="flex:1;color:var(--text-2);">' + formatCzk(e.value) + '</span>' +
        '<span style="flex:1;text-align:right;color:' + financeAmountColor(profit) + ';">' + formatCzk(profit) + '</span>' +
        '<span style="width:20px;"><i class="ti ti-trash" style="color:var(--text-5);cursor:pointer;" onclick="FinanceInvest.deleteEntry(\'' + e.id + '\')"></i></span>' +
        '</div>';
    }).join('');
  },

  addEntry() {
    var date      = document.getElementById('fi-e-date').value;
    var deposited = parseFloat(document.getElementById('fi-e-deposited').value) || 0;
    var value     = parseFloat(document.getElementById('fi-e-value').value) || 0;
    if (!date) return;

    var investments = Store.get('finance_investments') || [];
    var inv = investments.find(function(i) { return i.id === FinanceInvest.currentId; });
    inv.entries = inv.entries || [];
    inv.entries.push({ id: Store.uid(), date: date, deposited: deposited, value: value });

    this.recalc(inv);
    Store.set('finance_investments', investments);
    this.render(this.container, this.currentId);
  },

  deleteEntry(id) {
    if (!confirm('Smazat záznam?')) return;
    var investments = Store.get('finance_investments') || [];
    var inv = investments.find(function(i) { return i.id === FinanceInvest.currentId; });
    inv.entries = (inv.entries || []).filter(function(e) { return e.id !== id; });

    this.recalc(inv);
    Store.set('finance_investments', investments);
    this.render(this.container, this.currentId);
  },

  recalc(inv) {
    var entries = inv.entries || [];
    inv.deposited = entries.reduce(function(s, e) { return s + (e.deposited || 0); }, 0);
    var sorted = entries.slice().sort(function(a, b) { return (a.date || '').localeCompare(b.date || ''); });
    inv.value = sorted.length ? sorted[sorted.length - 1].value : 0;
  },

};
