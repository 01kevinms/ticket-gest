/**
 * modal.js — modal manager & toast notifications
 */

/* ═══════════════════════════════════════════════════════════
   MODAL MANAGER
═══════════════════════════════════════════════════════════ */
const Modal = (() => {
  const open = id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  const close = id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('open');
    if (!document.querySelector('.modal-backdrop.open')) {
      document.body.style.overflow = '';
    }
  };

  const closeAll = () => {
    document.querySelectorAll('.modal-backdrop.open').forEach(el => el.classList.remove('open'));
    document.body.style.overflow = '';
  };

  /* Confirm dialog helper */
  const confirm = ({ title, text, confirmLabel = 'Confirmar', danger = true, onConfirm }) => {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmText').textContent  = text;
    const btn = document.getElementById('confirmOkBtn');
    btn.textContent = confirmLabel;
    btn.className   = `btn ${danger ? 'btn-danger' : 'btn-primary'}`;
    btn.onclick = () => { closeAll(); onConfirm(); };
    open('confirmModal');
  };

  /* Close when clicking the backdrop or a .modal-close button */
  document.addEventListener('click', e => {
    if (e.target.classList.contains('modal-backdrop')) closeAll();
    if (e.target.closest('.modal-close')) closeAll();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeAll();
  });

  return { open, close, closeAll, confirm };
})();

/* ═══════════════════════════════════════════════════════════
   TOAST SYSTEM
═══════════════════════════════════════════════════════════ */
const Toast = (() => {
  let container = null;

  const getContainer = () => {
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  };

  const ICONS = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };

  const show = (type, title, sub = '', duration = 3500) => {
    const el = document.createElement('div');
    el.className = `toast t-${type}`;
    el.innerHTML = `
      <span class="toast-icon">${ICONS[type] || 'ℹ️'}</span>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        ${sub ? `<div class="toast-sub">${sub}</div>` : ''}
      </div>`;
    getContainer().appendChild(el);

    setTimeout(() => {
      el.classList.add('removing');
      setTimeout(() => el.remove(), 300);
    }, duration);
  };

  return {
    success: (t, s) => show('success', t, s),
    error:   (t, s) => show('error',   t, s),
    info:    (t, s) => show('info',    t, s),
    warning: (t, s) => show('warning', t, s),
  };
})();