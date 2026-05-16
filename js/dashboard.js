/**
 * dashboard.js — app shell, navigation, sidebar & dashboard page
 */

/* ═══════════════════════════════════════════════════════════
   HELPERS (shared across all modules)
═══════════════════════════════════════════════════════════ */
const H = {
  esc: s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'),

  fmtDate: d => {
    if (!d) return '—';
    try {
      const dt = new Date(d.length === 10 ? d + 'T12:00:00' : d);
      return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return d; }
  },

  statusBadge: s => {
    const map = {
      open:     ['b-open',     'Aberto'],
      progress: ['b-progress', 'Em andamento'],
      resolved: ['b-resolved', 'Resolvido'],
      closed:   ['b-closed',   'Fechado'],
    };
    const [cls, lbl] = map[s] || ['b-closed', s];
    return `<span class="badge ${cls}">${lbl}</span>`;
  },

  priorityBadge: p => {
    const map = {
      low:    ['pil-low',    '↓ Baixa'],
      medium: ['pil-med',    '→ Média'],
      high:   ['pil-high',   '↑ Alta'],
      urgent: ['pil-urgent', '🔴 Urgente'],
    };
    const [cls, lbl] = map[p] || ['pil-low', p];
    return `<span class="pil ${cls}">${lbl}</span>`;
  },

  statusLabel:   s => ({ open:'Aberto', progress:'Em andamento', resolved:'Resolvido', closed:'Fechado' }[s] || s),
  priorityLabel: p => ({ low:'Baixa', medium:'Média', high:'Alta', urgent:'Urgente' }[p] || p),

  avatarGradient: name => {
    const palette = [
      'linear-gradient(135deg,#5b8af4,#9b7ef8)',
      'linear-gradient(135deg,#27c98f,#22d3ee)',
      'linear-gradient(135deg,#f5a623,#ff6b35)',
      'linear-gradient(135deg,#e84545,#f5a623)',
      'linear-gradient(135deg,#9b7ef8,#e84585)',
      'linear-gradient(135deg,#22d3ee,#5b8af4)',
    ];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return palette[Math.abs(h) % palette.length];
  },

  initials: name => name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase(),

  clientName: id => {
    const c = Storage.getClient(id);
    return c ? c.name : (id || '—');
  },
};

/* ═══════════════════════════════════════════════════════════
   APP SHELL
═══════════════════════════════════════════════════════════ */
const App = (() => {
  const PAGE_META = {
    dashboard: { title: 'Dashboard',   sub: 'Visão geral do sistema'      },
    tickets:   { title: 'Tickets',     sub: 'Gerenciar chamados'          },
    clients:   { title: 'Clientes',    sub: 'Gerenciar clientes'          },
    reports:   { title: 'Relatórios',  sub: 'Análises e métricas'         },
  };

  const init = () => {
    const user = Auth.requireAuth();
    if (!user) return;

    Storage.seed();

    // Fill user info
    const display = user.display || user.username;
    document.getElementById('userDisplayName').textContent = display;
    document.getElementById('userRoleLabel').textContent   = user.role;
    document.getElementById('userAvatarText').textContent  = H.initials(display);

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => Auth.logout());

    // Nav links
    document.querySelectorAll('.nav-item[data-page]').forEach(el => {
      el.addEventListener('click', () => {
        navigateTo(el.dataset.page);
        closeSidebar();
      });
    });

    // Mobile sidebar toggle
    const toggleBtn  = document.getElementById('sidebarToggle');
    const sidebarEl  = document.getElementById('appSidebar');
    const overlayEl  = document.getElementById('sidebarOverlay');

    if (toggleBtn) toggleBtn.addEventListener('click', openSidebar);
    if (overlayEl) overlayEl.addEventListener('click', closeSidebar);

    // Initial page from hash
    const hash = (location.hash || '#dashboard').replace('#', '');
    navigateTo(PAGE_META[hash] ? hash : 'dashboard');
    refreshBadge();
  };

  const navigateTo = pageId => {
    // Pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const pg = document.getElementById('page-' + pageId);
    if (pg) pg.classList.add('active');

    // Nav items
    document.querySelectorAll('.nav-item[data-page]').forEach(el => {
      el.classList.toggle('active', el.dataset.page === pageId);
    });

    // Topbar
    const meta = PAGE_META[pageId] || {};
    document.getElementById('topbarPageTitle').textContent = meta.title || '';
    document.getElementById('topbarPageSub').textContent   = meta.sub   || '';

    location.hash = pageId;

    // Render page module
    if (pageId === 'dashboard') DashPage.render();
    if (pageId === 'tickets')   TicketsPage.render();
    if (pageId === 'clients')   ClientsPage.render();
    if (pageId === 'reports')   ReportsPage.render();
  };

  const refreshBadge = () => {
    const openCount = Storage.getTickets().filter(t => t.status === 'open').length;
    const badge = document.getElementById('ticketNavBadge');
    if (badge) badge.textContent = openCount;
  };

  const openSidebar = () => {
    document.getElementById('appSidebar').classList.add('mobile-open');
    document.getElementById('sidebarOverlay').style.display = 'block';
  };

  const closeSidebar = () => {
    document.getElementById('appSidebar').classList.remove('mobile-open');
    document.getElementById('sidebarOverlay').style.display = 'none';
  };

  return { init, navigateTo, refreshBadge };
})();

/* ═══════════════════════════════════════════════════════════
   DASHBOARD PAGE
═══════════════════════════════════════════════════════════ */
const DashPage = (() => {
  const render = () => {
    const tickets = Storage.getTickets();
    const clients = Storage.getClients();

    const total    = tickets.length;
    const open     = tickets.filter(t => t.status === 'open').length;
    const resolved = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
    const urgent   = tickets.filter(t => t.priority === 'urgent').length;

    setText('statTotal',    total);
    setText('statOpen',     open);
    setText('statResolved', resolved);
    setText('statClients',  clients.length);

    renderRecentTable(tickets.slice(0, 7));
    renderActivity(tickets.slice(0, 8));
    renderPriorityChart(tickets);
  };

  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  const renderRecentTable = tickets => {
    const tbody = document.getElementById('dashRecentTbody');
    if (!tbody) return;

    if (!tickets.length) {
      tbody.innerHTML = `<tr><td colspan="5">${emptyState('🎫','Sem tickets','Crie o primeiro ticket.')}</td></tr>`;
      return;
    }

    tbody.innerHTML = tickets.map(t => `
      <tr>
        <td class="td-id">${H.esc(t.id)}</td>
        <td class="td-title"><div class="td-title-wrap" title="${H.esc(t.title)}">${H.esc(t.title)}</div></td>
        <td>${H.statusBadge(t.status)}</td>
        <td>${H.priorityBadge(t.priority)}</td>
        <td class="td-date">${H.fmtDate(t.createdAt)}</td>
      </tr>`).join('');
  };

  const renderActivity = tickets => {
    const el = document.getElementById('dashActivity');
    if (!el) return;

    const DOT_COLORS = {
      open: 'var(--clr-open)', progress: 'var(--clr-prog)',
      resolved: 'var(--clr-done)', closed: 'var(--clr-closed)',
    };

    if (!tickets.length) {
      el.innerHTML = emptyState('📋', 'Sem atividades', '');
      return;
    }

    el.innerHTML = tickets.map(t => `
      <div class="activity-item">
        <div class="activity-dot" style="background:${DOT_COLORS[t.status] || 'var(--tx-3)'}"></div>
        <div class="activity-body">
          <div class="activity-title">${H.esc(t.title)}</div>
          <div class="activity-meta">${H.statusLabel(t.status)} · ${H.clientName(t.clientId)} · ${H.fmtDate(t.createdAt)}</div>
        </div>
      </div>`).join('');
  };

  const renderPriorityChart = tickets => {
    const el = document.getElementById('dashPriorityChart');
    if (!el) return;

    const counts = { urgent: 0, high: 0, medium: 0, low: 0 };
    tickets.forEach(t => { if (counts[t.priority] !== undefined) counts[t.priority]++; });

    const max = Math.max(...Object.values(counts), 1);
    const COLORS = { urgent: 'var(--p-urgent)', high: 'var(--p-high)', medium: 'var(--p-med)', low: 'var(--p-low)' };
    const LABELS = { urgent: 'Urgente', high: 'Alta', medium: 'Média', low: 'Baixa' };

    el.innerHTML = Object.entries(counts).map(([p, cnt]) => `
      <div class="pbar-row">
        <div class="pbar-label">${LABELS[p]}</div>
        <div class="pbar-track">
          <div class="pbar-fill" style="width:${cnt ? (cnt/max*100).toFixed(1) : 0}%;background:${COLORS[p]}"></div>
        </div>
        <div class="pbar-count">${cnt}</div>
      </div>`).join('');
  };

  const emptyState = (icon, title, sub) => `
    <div class="empty-state">
      <div class="empty-icon">${icon}</div>
      <div class="empty-title">${title}</div>
      ${sub ? `<div class="empty-sub">${sub}</div>` : ''}
    </div>`;

  return { render };
})();

/* ─── Boot ─── */
document.addEventListener('DOMContentLoaded', () => App.init());