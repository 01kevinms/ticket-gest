/**
 * tickets.js — full ticket management
 */
const TicketsPage = (() => {
  let _editing  = null;   // ticket id being edited
  let _filters  = { status: '', priority: '', search: '' };

  /* ─── RENDER TABLE ─── */
  const render = () => {
    _populateClientDropdown();
    _renderTable();
  };

  const _renderTable = () => {
    const tbody = document.getElementById('ticketsTbody');
    const countEl = document.getElementById('ticketsCount');
    if (!tbody) return;

    let list = Storage.getTickets();

    // Apply filters
    if (_filters.status)   list = list.filter(t => t.status   === _filters.status);
    if (_filters.priority) list = list.filter(t => t.priority === _filters.priority);
    if (_filters.search) {
      const q = _filters.search.toLowerCase();
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        (t.assignee || '').toLowerCase().includes(q) ||
        H.clientName(t.clientId).toLowerCase().includes(q)
      );
    }

    if (countEl) countEl.textContent = `${list.length} ticket${list.length !== 1 ? 's' : ''}`;

    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="7">
        <div class="empty-state">
          <div class="empty-icon">🎫</div>
          <div class="empty-title">Nenhum ticket encontrado</div>
          <div class="empty-sub">Ajuste os filtros ou crie um novo ticket.</div>
        </div>
      </td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(t => `
      <tr>
        <td class="td-id">${H.esc(t.id)}</td>
        <td class="td-title">
          <div class="td-title-wrap" title="${H.esc(t.title)}">${H.esc(t.title)}</div>
        </td>
        <td>${H.esc(H.clientName(t.clientId))}</td>
        <td>${H.statusBadge(t.status)}</td>
        <td>${H.priorityBadge(t.priority)}</td>
        <td class="td-date">${H.fmtDate(t.createdAt)}</td>
        <td class="td-actions">
          <button class="icon-btn" title="Ver detalhes"  onclick="TicketsPage.openDetail('${t.id}')">👁</button>
          <button class="icon-btn" title="Editar ticket" onclick="TicketsPage.openEdit('${t.id}')">✏️</button>
          <button class="icon-btn danger" title="Excluir" onclick="TicketsPage.confirmDelete('${t.id}')">🗑</button>
        </td>
      </tr>`).join('');
  };

  /* ─── DROPDOWN HELPERS ─── */
  const _populateClientDropdown = () => {
    const sel = document.getElementById('tkClientId');
    if (!sel) return;
    const saved = sel.value;
    sel.innerHTML = `<option value="">Selecione o cliente...</option>` +
      Storage.getClients().map(c => `<option value="${H.esc(c.id)}">${H.esc(c.name)}</option>`).join('');
    if (saved) sel.value = saved;
  };

  /* ─── OPEN CREATE ─── */
  const openCreate = () => {
    _editing = null;
    document.getElementById('ticketModalTitle').textContent = '🎫 Novo Ticket';
    document.getElementById('tkForm').reset();
    _populateClientDropdown();
    Modal.open('ticketModal');
  };

  /* ─── OPEN EDIT ─── */
  const openEdit = id => {
    const t = Storage.getTicket(id);
    if (!t) return;
    _editing = id;

    document.getElementById('ticketModalTitle').textContent = '✏️ Editar Ticket';
    _populateClientDropdown();

    document.getElementById('tkTitle').value       = t.title       || '';
    document.getElementById('tkDescription').value = t.description || '';
    document.getElementById('tkClientId').value    = t.clientId    || '';
    document.getElementById('tkPriority').value    = t.priority    || 'medium';
    document.getElementById('tkStatus').value      = t.status      || 'open';
    document.getElementById('tkAssignee').value    = t.assignee    || '';

    Modal.open('ticketModal');
  };

  /* ─── SAVE (create or update) ─── */
  const save = () => {
    const title       = document.getElementById('tkTitle').value.trim();
    const description = document.getElementById('tkDescription').value.trim();
    const clientId    = document.getElementById('tkClientId').value;
    const priority    = document.getElementById('tkPriority').value;
    const status      = document.getElementById('tkStatus').value;
    const assignee    = document.getElementById('tkAssignee').value.trim();

    if (!title) { Toast.warning('Campo obrigatório', 'Informe o título do ticket.'); return; }

    const data = { title, description, clientId, priority, status, assignee };

    if (_editing) {
      Storage.updateTicket(_editing, data);
      Toast.success('Ticket atualizado!', `"${title}" foi salvo com sucesso.`);
    } else {
      const t = Storage.addTicket(data);
      Toast.success('Ticket criado!', `${t.id} — "${title}"`);
    }

    Modal.closeAll();
    _renderTable();
    App.refreshBadge();
  };

  /* ─── DETAIL MODAL ─── */
  const openDetail = id => {
    const t = Storage.getTicket(id);
    if (!t) return;

    const clientName = H.clientName(t.clientId);

    document.getElementById('detailContent').innerHTML = `
      <div class="detail-title">${H.esc(t.title)}</div>
      <div class="detail-badges">
        ${H.statusBadge(t.status)}
        ${H.priorityBadge(t.priority)}
      </div>
      <div class="detail-meta">
        <div class="meta-item">
          <div class="meta-label">ID do Ticket</div>
          <div class="meta-value" style="font-family:var(--mono)">${H.esc(t.id)}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Cliente</div>
          <div class="meta-value">${H.esc(clientName)}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Responsável</div>
          <div class="meta-value">${H.esc(t.assignee || '—')}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Data de criação</div>
          <div class="meta-value">${H.fmtDate(t.createdAt)}</div>
        </div>
      </div>
      <div class="detail-desc-label">Descrição</div>
      <div class="detail-desc">
        ${t.description ? H.esc(t.description).replace(/\n/g, '<br>') : '<em style="color:var(--tx-4)">Sem descrição.</em>'}
      </div>
      <div class="detail-actions">
        <div class="detail-actions-label">Alterar Status</div>
        <div class="status-btns">
          ${['open','progress','resolved','closed'].map(s => `
            <button
              class="btn btn-sm ${t.status === s ? 'btn-primary' : 'btn-ghost'}"
              onclick="TicketsPage.changeStatus('${t.id}','${s}')"
            >${H.statusLabel(s)}</button>`).join('')}
        </div>
      </div>`;

    Modal.open('detailModal');
  };

  /* ─── CHANGE STATUS ─── */
  const changeStatus = (id, newStatus) => {
    Storage.updateTicket(id, { status: newStatus });
    Toast.success('Status alterado!', `Ticket marcado como "${H.statusLabel(newStatus)}".`);
    Modal.closeAll();
    _renderTable();
    App.refreshBadge();
  };

  /* ─── CONFIRM DELETE ─── */
  const confirmDelete = id => {
    const t = Storage.getTicket(id);
    if (!t) return;
    Modal.confirm({
      title: 'Excluir ticket?',
      text:  `O ticket "${t.title}" (${t.id}) será removido permanentemente. Esta ação não pode ser desfeita.`,
      confirmLabel: '🗑 Excluir ticket',
      danger: true,
      onConfirm: () => {
        Storage.deleteTicket(id);
        Toast.info('Ticket excluído', t.id);
        _renderTable();
        App.refreshBadge();
      },
    });
  };

  /* ─── FILTER SETTERS ─── */
  const setFilter = (key, val) => {
    _filters[key] = val;
    _renderTable();
  };

  return { render, openCreate, openEdit, save, openDetail, changeStatus, confirmDelete, setFilter };
})();