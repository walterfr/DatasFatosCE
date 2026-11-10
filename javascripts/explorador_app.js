(function() {
  const MONTH_NAMES = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const state = {
    subtab: 'busca',
    selectedYear: 'all',
    selectedMonth: 'all',
    selectedCategory: 'all',
    searchQuery: '',
    onlyWithLinks: false,
    bookmarks: new Set(),
    entries: [],
    years: [],
    categoryTotals: {}
  };

  let chartYears = null;
  let chartCats = null;
  let toastTimeout = null;

  function htmlToPlain(htmlStr) {
    const tmp = document.createElement('div');
    tmp.innerHTML = htmlStr;
    return (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
  }

  function htmlToMarkdown(htmlStr) {
    let s = htmlStr;
    s = s.replace(/<a[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');
    s = s.replace(/<\/?(?:strong|b)>/gi, '**');
    s = s.replace(/<\/?(?:em|i)>/gi, '*');
    s = s.replace(/<li[^>]*>(.*?)<\/li>/gi, '\n  - $1');
    s = s.replace(/<\/?(?:ul|ol)[^>]*>/gi, '\n');
    s = s.replace(/<br\s*\/?>/gi, '\n');
    s = s.replace(/<[^>]+>/g, '');
    return s.trim();
  }

  function loadBookmarks() {
    try {
      const raw = localStorage.getItem('datasFatosCE_bookmarks');
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) arr.forEach(id => state.bookmarks.add(id));
      }
    } catch (e) {}
    updateBookmarkBadge();
  }

  function saveBookmarks() {
    try {
      localStorage.setItem('datasFatosCE_bookmarks', JSON.stringify(Array.from(state.bookmarks)));
    } catch (e) {}
    updateBookmarkBadge();
  }

  function updateBookmarkBadge() {
    const b = document.getElementById('ef-badge-fichario');
    if (b) b.textContent = String(state.bookmarks.size);
  }

  function showToast(msg) {
    const t = document.getElementById('ef-toast');
    if (!t) return;
    t.textContent = msg;
    t.style.display = 'block';
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      t.style.display = 'none';
    }, 2600);
  }

  function copyText(text, msg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => showToast(msg)).catch(() => fallbackCopy(text, msg));
    } else {
      fallbackCopy(text, msg);
    }
  }

  function fallbackCopy(text, msg) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showToast(msg);
    } catch (e) {}
    document.body.removeChild(ta);
  }

  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function highlightHtml(htmlStr, query) {
    if (!query || query.length < 2) return htmlStr;
    const escaped = escapeRegExp(query);
    const parts = htmlStr.split(/(<[^>]+>)/g);
    const regex = new RegExp('(' + escaped + ')', 'gi');
    return parts.map(p => p.startsWith('<') ? p : p.replace(regex, '<mark class="ef-mark">$1</mark>')).join('');
  }

  function getFiltered(ignoreYear, ignoreMonth) {
    const q = state.searchQuery.toLowerCase();
    return state.entries.filter(e => {
      if (!ignoreYear && state.selectedYear !== 'all' && e.year !== Number(state.selectedYear)) return false;
      if (!ignoreMonth && state.selectedMonth !== 'all' && e.monthIndex !== Number(state.selectedMonth)) return false;
      if (state.selectedCategory !== 'all' && !e.categories.includes(state.selectedCategory)) return false;
      if (state.onlyWithLinks && !e.hasLinks) return false;
      if (q) {
        const hay = (e.day + ' ' + e.plain + ' ' + e.monthName + ' ' + e.year + ' ' + e.categories.join(' ')).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function renderControls() {
    const yrBox = document.getElementById('ef-year-buttons');
    const mBox = document.getElementById('ef-month-buttons');
    if (!yrBox || !mBox) return;

    const byYearEntries = getFiltered(true, false);
    const yCounts = {};
    byYearEntries.forEach(e => { yCounts[e.year] = (yCounts[e.year] || 0) + 1; });

    let yHtml = `<button type="button" class="ef-pill ${state.selectedYear === 'all' ? 'active' : ''}" onclick="window.efSelectYear('all')">Todos (${byYearEntries.length})</button>`;
    state.years.forEach(yObj => {
      const y = yObj.year;
      const cnt = yCounts[y] || 0;
      yHtml += `<button type="button" class="ef-pill ${Number(state.selectedYear) === y ? 'active' : ''}" onclick="window.efSelectYear(${y})">${y} (${cnt})</button>`;
    });
    yrBox.innerHTML = yHtml;

    const byMonthEntries = getFiltered(false, true);
    const mCounts = {};
    byMonthEntries.forEach(e => { mCounts[e.monthIndex] = (mCounts[e.monthIndex] || 0) + 1; });

    let mHtml = `<button type="button" class="ef-pill ${state.selectedMonth === 'all' ? 'active' : ''}" onclick="window.efSelectMonth('all')">Ano Inteiro (${byMonthEntries.length})</button>`;
    MONTH_NAMES.forEach((mName, idx) => {
      const mIdx = idx + 1;
      const cnt = mCounts[mIdx] || 0;
      mHtml += `<button type="button" class="ef-pill ${Number(state.selectedMonth) === mIdx ? 'active' : ''}" onclick="window.efSelectMonth(${mIdx})">${mName.slice(0, 3)} (${cnt})</button>`;
    });
    mBox.innerHTML = mHtml;
  }

  function renderEntriesList() {
    const listEl = document.getElementById('ef-entries-list');
    const statusEl = document.getElementById('ef-status-text');
    if (!listEl) return;

    const filtered = getFiltered(false, false);
    const yrLabel = state.selectedYear === 'all' ? 'Todos os anos (2014–2025)' : 'Volume ' + state.selectedYear;
    const mLabel = state.selectedMonth === 'all' ? 'todos os meses' : MONTH_NAMES[Number(state.selectedMonth) - 1];
    const catLabel = state.selectedCategory === 'all' ? 'todos os eixos' : state.selectedCategory;

    if (statusEl) {
      statusEl.innerHTML = `Exibindo <strong>${filtered.length}</strong> verbete(s) em <strong>${yrLabel}</strong> • ${mLabel} • ${catLabel}`;
    }

    if (filtered.length === 0) {
      listEl.innerHTML = `<div class="ef-card" style="text-align:center;padding:2rem;">
        <p><strong>Nenhum verbete encontrado com os filtros atuais.</strong></p>
        <button type="button" class="ef-btn ef-btn-primary" onclick="window.efResetFilters()">Limpar Filtros</button>
      </div>`;
      return;
    }

    const groups = new Map();
    filtered.forEach(e => {
      const k = `${e.year}-${String(e.monthIndex).padStart(2, '0')}`;
      if (!groups.has(k)) {
        groups.set(k, { year: e.year, monthIndex: e.monthIndex, monthName: e.monthName, items: [] });
      }
      groups.get(k).items.push(e);
    });

    let html = '';
    groups.forEach(g => {
      const yObj = state.years.find(y => y.year === g.year);
            const pageUrl = yObj ? yObj.pageUrl : `../${g.year}/`;

      html += `<div class="ef-month-block">
        <div class="ef-month-header">
          <div>
            <span class="ef-year-badge">${g.year}</span>
            <strong>${g.monthName} / ${g.year}</strong>
            <span style="opacity:0.7;font-size:0.8rem;margin-left:0.4rem;">(${g.items.length})</span>
          </div>
          <div style="display:flex;gap:0.75rem;font-size:0.78rem;">
            <a href="${pageUrl}">Página do Ano →</a>
            
          </div>
        </div>
        <div class="ef-month-items">`;

      g.items.forEach(item => {
        const saved = state.bookmarks.has(item.id);
        const bodyHtml = highlightHtml(item.html, state.searchQuery);
        const catsHtml = item.categories.map(c =>
          `<button type="button" class="ef-tag" onclick="window.efSelectCategory('${c}')">${c}</button>`
        ).join('');

        html += `<div class="ef-entry-row">
          <div class="ef-entry-day">Dia ${item.day}</div>
          <div class="ef-entry-content">
            <div class="ef-entry-text">${bodyHtml}</div>
            <div class="ef-entry-footer">
              <div class="ef-tags">${catsHtml}</div>
              <div class="ef-actions">
                <button type="button" class="ef-mini-btn" onclick="window.efCopyEntry('${item.id}')">Copiar</button>
                <button type="button" class="ef-mini-btn ${saved ? 'saved' : ''}" onclick="window.efToggleBookmark('${item.id}')">${saved ? '★ Fichado' : '☆ Fichar'}</button>
              </div>
            </div>
          </div>
        </div>`;
      });

      html += `</div></div>`;
    });

    listEl.innerHTML = html;
  }

  function renderCharts() {
    if (typeof Chart === 'undefined') return;
    const cY = document.getElementById('ef-chart-years');
    if (cY) {
      if (chartYears) chartYears.destroy();
      chartYears = new Chart(cY, {
        type: 'bar',
        data: {
          labels: state.years.map(y => String(y.year)),
          datasets: [{
            label: 'Verbetes no Ano',
            data: state.years.map(y => y.entryCount),
            backgroundColor: '#b45309',
            borderRadius: 5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          onClick: (evt, els) => {
            if (els && els.length > 0) {
              const yr = state.years[els[0].index].year;
              window.efSelectYear(yr);
              window.efSwitchSubtab('busca');
            }
          },
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } }
        }
      });
    }

    const cC = document.getElementById('ef-chart-cats');
    if (cC) {
      if (chartCats) chartCats.destroy();
      const pairs = Object.entries(state.categoryTotals).sort((a, b) => b[1] - a[1]);
      chartCats = new Chart(cC, {
        type: 'bar',
        data: {
          labels: pairs.map(p => p[0]),
          datasets: [{
            label: 'Ocorrências',
            data: pairs.map(p => p[1]),
            backgroundColor: ['#1e3a8a', '#0f766e', '#6b21a8', '#b45309', '#44403c', '#15803d'],
            borderRadius: 5
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          onClick: (evt, els) => {
            if (els && els.length > 0) {
              const cat = pairs[els[0].index][0];
              window.efSelectCategory(cat);
              window.efSwitchSubtab('busca');
            }
          },
          plugins: { legend: { display: false } },
          scales: { x: { beginAtZero: true } }
        }
      });
    }
  }

  function renderFichario() {
    const box = document.getElementById('ef-fichario-list');
    if (!box) return;
    const saved = state.entries.filter(e => state.bookmarks.has(e.id));
    if (saved.length === 0) {
      box.innerHTML = `<p style="text-align:center;opacity:0.75;padding:1.5rem 0;">Nenhum verbete fichado ainda. Clique em <strong>"☆ Fichar"</strong> em qualquer verbete na aba de busca.</p>`;
      return;
    }
    box.innerHTML = saved.map(item => `
      <div class="ef-entry-row" style="border:1px solid rgba(120,113,108,0.25);border-radius:8px;margin-bottom:0.6rem;padding:0.75rem;">
        <div class="ef-entry-day">${item.day}/${String(item.monthIndex).padStart(2,'0')}/${item.year}</div>
        <div class="ef-entry-content">
          <div class="ef-entry-text">${item.html}</div>
          <div class="ef-entry-footer" style="justify-content:flex-end;margin-top:0.4rem;">
            <button type="button" class="ef-mini-btn" onclick="window.efCopyEntry('${item.id}')">Copiar</button>
            <button type="button" class="ef-mini-btn" onclick="window.efToggleBookmark('${item.id}')">Remover</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  // Global handlers
  window.efSwitchSubtab = function(tab) {
    state.subtab = tab;
    ['busca', 'graficos', 'fichario'].forEach(t => {
      const btn = document.getElementById('ef-tab-' + t);
      const view = document.getElementById('ef-view-' + t);
      if (btn) btn.classList.toggle('active', t === tab);
      if (view) view.style.display = (t === tab) ? 'block' : 'none';
    });
    if (tab === 'graficos') renderCharts();
    if (tab === 'fichario') renderFichario();
  };

  window.efSelectYear = function(yr) {
    state.selectedYear = yr;
    renderControls();
    renderEntriesList();
  };

  window.efSelectMonth = function(m) {
    state.selectedMonth = m;
    renderControls();
    renderEntriesList();
  };

  window.efSelectCategory = function(cat) {
    state.selectedCategory = cat;
    const sel = document.getElementById('ef-category-select');
    if (sel && sel.value !== cat) sel.value = cat;
    renderControls();
    renderEntriesList();
  };

  window.efHandleSearch = function(val) {
    state.searchQuery = (val || '').trim();
    renderControls();
    renderEntriesList();
  };

  window.efToggleLinks = function(checked) {
    state.onlyWithLinks = Boolean(checked);
    renderControls();
    renderEntriesList();
  };

  window.efResetFilters = function() {
    state.selectedYear = 'all';
    state.selectedMonth = 'all';
    state.selectedCategory = 'all';
    state.searchQuery = '';
    state.onlyWithLinks = false;
    const inp = document.getElementById('ef-search-input');
    if (inp) inp.value = '';
    const sel = document.getElementById('ef-category-select');
    if (sel) sel.value = 'all';
    const chk = document.getElementById('ef-chk-links');
    if (chk) chk.checked = false;
    renderControls();
    renderEntriesList();
  };

  window.efToggleBookmark = function(id) {
    if (state.bookmarks.has(id)) {
      state.bookmarks.delete(id);
      showToast('Removido do Fichário.');
    } else {
      state.bookmarks.add(id);
      showToast('Salvo no Fichário!');
    }
    saveBookmarks();
    renderEntriesList();
    if (state.subtab === 'fichario') renderFichario();
  };

  window.efCopyEntry = function(id) {
    const e = state.entries.find(x => x.id === id);
    if (!e) return;
    const txt = `**${e.day}/${String(e.monthIndex).padStart(2,'0')}/${e.year}** — ${htmlToMarkdown(e.html)}`;
    copyText(txt, 'Verbete copiado em Markdown!');
  };

  window.efExportFiltered = function() {
    const filtered = getFiltered(false, false);
    if (!filtered.length) return showToast('Nenhum verbete filtrado.');
    const lines = [`# Recorte — Datas e Fatos para a História do Ceará (${filtered.length} verbetes)`, ``];
    filtered.forEach(e => {
      lines.push(`- **${e.day}/${String(e.monthIndex).padStart(2,'0')}/${e.year}** — ${htmlToMarkdown(e.html)}`);
    });
    copyText(lines.join('\n'), `${filtered.length} verbete(s) copiados em Markdown!`);
  };

  window.efExportBookmarks = function() {
    const saved = state.entries.filter(e => state.bookmarks.has(e.id));
    if (!saved.length) return showToast('Seu Fichário está vazio.');
    const lines = [`# Fichário de Pesquisa — Datas e Fatos para a História do Ceará`, ``];
    saved.forEach(e => {
      lines.push(`**${e.day}/${String(e.monthIndex).padStart(2,'0')}/${e.year}** — ${htmlToMarkdown(e.html)}\n`);
    });
    copyText(lines.join('\n'), `${saved.length} verbete(s) do Fichário copiados!`);
  };

  window.efClearBookmarks = function() {
    state.bookmarks.clear();
    saveBookmarks();
    renderFichario();
    renderEntriesList();
    showToast('Fichário limpo.');
  };

  function bootExplorer() {
    const root = document.getElementById('ef-app-root');
    if (!root || !window.ACERVO_RAW_DATA) return;
    if (state.entries.length === 0) {
      const raw = window.ACERVO_RAW_DATA;
      state.years = raw.years || [];
      state.categoryTotals = raw.categoryTotals || {};
      state.entries = (raw.entries || []).map(e => ({
        id: e.id,
        year: e.y,
        monthIndex: e.m,
        monthName: MONTH_NAMES[e.m - 1],
        day: e.d,
        html: e.h,
        categories: e.c,
        hasLinks: Boolean(e.l),
        plain: htmlToPlain(e.h)
      }));
    }
    loadBookmarks();
    renderControls();
    renderEntriesList();
  }

  if (typeof document$ !== 'undefined') {
    document$.subscribe(function() {
      bootExplorer();
    });
  } else {
    window.addEventListener('DOMContentLoaded', bootExplorer);
  }
})();
