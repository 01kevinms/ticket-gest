/**
 * reports.js — analytics & metrics
 */
const ReportsPage = (() => {

  const render = () => {
    const tickets = Storage.getTickets();
    const clients = Storage.getClients();

    const total    = tickets.length;
    const open     = tickets.filter(t => t.status === 'open').length;
    const progress = tickets.filter(t => t.status === 'progress').length;
    const resolved = tickets.filter(t => t.status === 'resolved').length;
    const closed   = tickets.filter(t => t.status === 'closed').length;
    const pending  = open + progress;
    const done     = resolved + closed;
    const rate     = total ? Math.round(done / total * 100) : 0;

    setText('repTotal',     total);
    setText('repResolved',  done);
    setText('repPending',   pending);
    setText('repRate',      rate + '%');
    setText('repClients',   clients.length);

    _renderStatusBreakdown(tickets, total);
    _renderPriorityBreakdown(tickets, total);
    _renderTopClients(tickets, clients);
    _renderAssignees(tickets);
  };

  const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

  /* ─── STATUS BREAKDOWN ─── */
  const _renderStatusBreakdown = (tickets, total) => {
    const el = document.getElementById('repStatusBreakdown');
    if (!el) return;

    const statuses = [
      { key: 'open',     label: 'Aberto',        color: 'var(--clr-open)'   },
      { key: 'progress', label: 'Em andamento',   color: 'var(--clr-prog)'   },
      { key: 'resolved', label: 'Resolvido',      color: 'var(--clr-done)'   },
      { key: 'closed',   label: 'Fechado',        color: 'var(--clr-closed)' },
    ];

    el.innerHTML = statuses.map(s => {
      const cnt = tickets.filter(t => t.status === s.key).length;
      const pct = total ? (cnt / total * 100).toFixed(1) : '0.0';
      return `
        <div class="sb-row">
          <div class="sb-dot" style="background:${s.color}"></div>
          <div class="sb-label">${s.label}</div>
          <div class="sb-val">${cnt}</div>
          <div class="sb-pct">${pct}%</div>
        </div>
        <div class="sb-bar-wrap">
          <div class="sb-bar-track">
            <div class="sb-bar-fill" style="width:${pct}%;background:${s.color}"></div>
          </div>
        </div>`;
    }).join('');
  };

  /* ─── PRIORITY BREAKDOWN ─── */
  const _renderPriorityBreakdown = (tickets, total) => {
    const el = document.getElementById('repPriorityBreakdown');
    if (!el) return;

    const priorities = [
      { key: 'urgent', label: 'Urgente', color: 'var(--p-urgent)' },
      { key: 'high',   label: 'Alta',    color: 'var(--p-high)'   },
      { key: 'medium', label: 'Média',   color: 'var(--p-med)'    },
      { key: 'low',    label: 'Baixa',   color: 'var(--p-low)'    },
    ];

    el.innerHTML = priorities.map(p => {
      const cnt = tickets.filter(t => t.priority === p.key).length;
      const pct = total ? (cnt / total * 100).toFixed(1) : '0.0';
      return `
        <div class="sb-row">
          <div class="sb-dot" style="background:${p.color}"></div>
          <div class="sb-label">${p.label}</div>
          <div class="sb-val">${cnt}</div>
          <div class="sb-pct">${pct}%</div>
        </div>
        <div class="sb-bar-wrap">
          <div class="sb-bar-track">
            <div class="sb-bar-fill" style="width:${pct}%;background:${p.color}"></div>
          </div>
        </div>`;
    }).join('');
  };

  /* ─── TOP CLIENTS ─── */
  const _renderTopClients = (tickets, clients) => {
    const el = document.getElementById('repTopClients');
    if (!el) return;

    const counts = {};
    tickets.forEach(t => {
      if (t.clientId) counts[t.clientId] = (counts[t.clientId] || 0) + 1;
    });

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const max    = sorted[0]?.[1] || 1;

    if (!sorted.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">👥</div><div class="empty-title">Sem dados</div></div>`;
      return;
    }

    el.innerHTML = `<div class="pbar-group">` + sorted.map(([cid, cnt]) => {
      const c   = clients.find(cl => cl.id === cid);
      const lbl = c ? c.name.split(' ')[0] : cid;
      const pct = (cnt / max * 100).toFixed(1);
      return `
        <div class="pbar-row">
          <div class="pbar-label" style="width:72px;font-size:11px">${H.esc(lbl)}</div>
          <div class="pbar-track">
            <div class="pbar-fill" style="width:${pct}%;background:var(--accent)"></div>
          </div>
          <div class="pbar-count">${cnt}</div>
        </div>`;
    }).join('') + `</div>`;
  };

  /* ─── ASSIGNEES ─── */
  const _renderAssignees = tickets => {
    const el = document.getElementById('repAssignees');
    if (!el) return;

    const counts = {};
    tickets.forEach(t => {
      if (t.assignee) counts[t.assignee] = (counts[t.assignee] || 0) + 1;
    });

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);

    if (!sorted.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">👷</div><div class="empty-title">Sem dados</div></div>`;
      return;
    }

    el.innerHTML = `
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr>
            <th style="padding:8px 0;font-size:10px;color:var(--tx-4);text-transform:uppercase;letter-spacing:.7px;text-align:left">Responsável</th>
            <th style="padding:8px 0;font-size:10px;color:var(--tx-4);text-transform:uppercase;letter-spacing:.7px;text-align:right">Tickets</th>
          </tr>
        </thead>
        <tbody>
          ${sorted.map(([name, cnt]) => `
            <tr style="border-bottom:1px solid var(--bd-subtle)">
              <td style="padding:11px 0">
                <div style="display:flex;align-items:center;gap:9px">
                  <div style="width:26px;height:26px;border-radius:50%;background:${H.avatarGradient(name)};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#fff;flex-shrink:0">
                    ${H.initials(name)}
                  </div>
                  <span style="font-size:13px;font-weight:600">${H.esc(name)}</span>
                </div>
              </td>
              <td style="text-align:right;font-family:var(--mono);font-weight:700;font-size:15px">${cnt}</td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  };

  return { render };
})();