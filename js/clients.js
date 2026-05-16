/**
 * clients.js — client management
 */
const ClientsPage = (() => {
  let _editing = null;
  let _search  = '';

  /* ─── RENDER GRID ─── */
  const render = () => _renderGrid();

  const _renderGrid = () => {
    const grid    = document.getElementById('clientsGrid');
    const countEl = document.getElementById('clientsCount');
    if (!grid) return;

    let clients = Storage.getClients();

    if (_search) {
      const q = _search.toLowerCase();
      clients = clients.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.email   || '').toLowerCase().includes(q) ||
        (c.company || '').toLowerCase().includes(q)
      );
    }

    if (countEl) countEl.textContent = `${clients.length} cliente${clients.length !== 1 ? 's' : ''}`;

    if (!clients.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-icon">👥</div>
          <div class="empty-title">Nenhum cliente encontrado</div>
          <div class="empty-sub">Cadastre um cliente para começar.</div>
        </div>`;
      return;
    }

    grid.innerHTML = clients.map(c => {
      const tickets  = Storage.getTicketsByClient(c.id);
      const resolved = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
      const pending  = tickets.length - resolved;

      return `
        <div class="client-card">
          <div class="client-card-top">
            <div class="client-avatar" style="background:${H.avatarGradient(c.name)}">
              ${H.initials(c.name)}
            </div>
            <div>
              <div class="client-name">${H.esc(c.name)}</div>
              <div class="client-email">${H.esc(c.email || '—')}</div>
            </div>
          </div>
          ${c.phone ? `<div style="font-size:12px;color:var(--tx-3);margin-bottom:10px">📞 ${H.esc(c.phone)}</div>` : ''}
          <div class="client-stats">
            <div class="cst">
              <div class="cst-num">${tickets.length}</div>
              <div class="cst-lbl">Total</div>
            </div>
            <div class="cst">
              <div class="cst-num" style="color:var(--p-low)">${resolved}</div>
              <div class="cst-lbl">Resolvidos</div>
            </div>
            <div class="cst">
              <div class="cst-num" style="color:var(--p-med)">${pending}</div>
              <div class="cst-lbl">Pendentes</div>
            </div>
          </div>
          <div class="client-actions">
            <button class="btn btn-ghost btn-sm" style="flex:1" onclick="ClientsPage.openHistory('${c.id}')">📋 Histórico</button>
            <button class="icon-btn" title="Editar" onclick="ClientsPage.openEdit('${c.id}')">✏️</button>
            <button class="icon-btn danger" title="Excluir" onclick="ClientsPage.confirmDelete('${c.id}')">🗑</button>
          </div>
        </div>`;
    }).join('');
  };

  /* ─── OPEN CREATE ─── */
  const openCreate = () => {
    _editing = null;
    document.getElementById('clientModalTitle').textContent = '👤 Novo Cliente';
    document.getElementById('cliForm').reset();
    Modal.open('clientModal');
  };

  /* ─── OPEN EDIT ─── */
  const openEdit = id => {
    const c = Storage.getClient(id);
    if (!c) return;
    _editing = id;

    document.getElementById('clientModalTitle').textContent = '✏️ Editar Cliente';
    document.getElementById('cliName').value    = c.name    || '';
    document.getElementById('cliEmail').value   = c.email   || '';
    document.getElementById('cliPhone').value   = c.phone   || '';
    document.getElementById('cliCompany').value = c.company || '';

    Modal.open('clientModal');
  };

  /* ─── SAVE ─── */
  const save = () => {
    const name    = document.getElementById('cliName').value.trim();
    const email   = document.getElementById('cliEmail').value.trim();
    const phone   = document.getElementById('cliPhone').value.trim();
    const company = document.getElementById('cliCompany').value.trim();

    if (!name) { Toast.warning('Campo obrigatório', 'Informe o nome do cliente.'); return; }

    const data = { name, email, phone, company };

    if (_editing) {
      Storage.updateClient(_editing, data);
      Toast.success('Cliente atualizado!', `"${name}" foi salvo com sucesso.`);
    } else {
      const c = Storage.addClient(data);
      Toast.success('Cliente cadastrado!', `${c.id} — "${name}"`);
    }

    Modal.closeAll();
    _renderGrid();
  };

  /* ─── HISTORY MODAL ─── */
  const openHistory = id => {
    const c = Storage.getClient(id);
    if (!c) return;
    const tickets = Storage.getTicketsByClient(id);

    document.getElementById('historyContent').innerHTML = `
      <div class="history-header">
        <div class="client-avatar" style="background:${H.avatarGradient(c.name)};width:44px;height:44px;font-size:16px">
          ${H.initials(c.name)}
        </div>
        <div>
          <div class="history-client-name">${H.esc(c.name)}</div>
          <div class="history-client-email">${H.esc(c.email || '—')}</div>
        </div>
      </div>
      <div style="font-size:12px;font-weight:700;color:var(--tx-3);text-transform:uppercase;letter-spacing:.7px;margin-bottom:12px">
        Histórico de Tickets (${tickets.length})
      </div>
      ${tickets.length
        ? tickets.map(t => `
            <div class="hist-ticket">
              <span class="hist-id">${H.esc(t.id)}</span>
              <span class="hist-title">${H.esc(t.title)}</span>
              ${H.statusBadge(t.status)}
              ${H.priorityBadge(t.priority)}
            </div>`).join('')
        : `<div class="empty-state" style="padding:40px 0">
            <div class="empty-icon">🎫</div>
            <div class="empty-title">Nenhum ticket</div>
            <div class="empty-sub">Este cliente ainda não possui tickets.</div>
          </div>`}`;

    Modal.open('historyModal');
  };

  /* ─── CONFIRM DELETE ─── */
  const confirmDelete = id => {
    const c = Storage.getClient(id);
    if (!c) return;
    const tCount = Storage.getTicketsByClient(id).length;
    Modal.confirm({
      title: 'Excluir cliente?',
      text:  `"${c.name}" será removido permanentemente.${tCount ? ` Este cliente possui ${tCount} ticket(s) associado(s).` : ''}`,
      confirmLabel: '🗑 Excluir cliente',
      danger: true,
      onConfirm: () => {
        Storage.deleteClient(id);
        Toast.info('Cliente excluído', c.name);
        _renderGrid();
      },
    });
  };

  /* ─── SEARCH ─── */
  const setSearch = q => { _search = q; _renderGrid(); };

  return { render, openCreate, openEdit, save, openHistory, confirmDelete, setSearch };
})();