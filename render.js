// ============================================================
// render.js — DOM rendering functions
// ============================================================

const Render = (() => {

  // ---- Summary Tiles ----------------------------------------

  function updateTiles(records) {
    const total     = records.reduce((s, r) => s + Number(r.total_income || 0), 0);
    const count     = records.length;
    const avg       = count ? total / count : 0;
    const active    = records.filter(r => r.status === 'active').length;
    const delivered = records.filter(r => r.status === 'delivered').length;

    document.getElementById('tile-income').textContent    = Utils.formatCurrency(total);
    document.getElementById('tile-deals').textContent     = count;
    document.getElementById('tile-avg').textContent       = Utils.formatCurrency(avg);
    document.getElementById('tile-active').textContent    = active;
    document.getElementById('tile-delivered').textContent = delivered;
  }

  // ---- Tables -----------------------------------------------

  function buildRow(r, isArchive) {
    const tr        = document.createElement('tr');
    const datePrimary = isArchive
      ? Utils.formatDate(r.delivered_date)
      : Utils.formatDate(r.estimated_delivery_date);

    tr.innerHTML = `
      <td>${Utils.formatDate(r.deal_date)}</td>
      <td>${datePrimary}</td>
      <td><strong>${escHtml(r.deal_number)}</strong></td>
      <td>${escHtml(r.customer_name)}</td>
      <td>${escHtml(r.salesperson_name || '—')}</td>
      <td>${escHtml(r.department)}</td>
      <td>${escHtml(r.vehicle_description)}</td>
      <td class="income-cell">${Utils.formatCurrency(r.total_income)}</td>
      <td><span class="badge badge-${r.record_type}">${r.record_type}</span></td>
      <td>
        <div class="row-actions">
          <button class="btn-icon" title="Edit" data-action="edit" data-id="${r.id}">✎</button>
          ${r.status === 'active'
            ? `<button class="btn-icon" title="Mark Delivered" data-action="deliver" data-id="${r.id}">✓</button>`
            : ''}
        </div>
      </td>
    `;
    return tr;
  }

  function renderTable(tbodyId, records, isArchive) {
    const tbody = document.getElementById(tbodyId);
    tbody.innerHTML = '';
    const cols = isArchive ? 10 : 10;
    if (!records.length) {
      tbody.innerHTML = `<tr><td colspan="${cols}" class="empty-row">No records found.</td></tr>`;
      return;
    }
    records.forEach(r => tbody.appendChild(buildRow(r, isArchive)));
  }

  function updateTables(records) {
    const active    = records.filter(r => r.status === 'active');
    const delivered = records.filter(r => r.status === 'delivered');

    renderTable('active-tbody', active, false);
    renderTable('delivered-tbody', delivered, true);

    document.getElementById('active-count').textContent    = active.length;
    document.getElementById('delivered-count').textContent = delivered.length;
  }

  // ---- Modal ------------------------------------------------

  function populateSalespersonSelect(elId, salesPeople) {
    const sel = document.getElementById(elId);
    // Preserve first "Select…" option
    const first = sel.options[0];
    sel.innerHTML = '';
    sel.appendChild(first);
    salesPeople.forEach(sp => {
      const opt = document.createElement('option');
      opt.value       = sp.id;
      opt.textContent = sp.full_name + (sp.department ? ` (${sp.department})` : '');
      opt.dataset.name = sp.full_name;
      sel.appendChild(opt);
    });
  }

  function populateDepartmentSelects(departments) {
    ['filter-department', 'modal-department'].forEach(id => {
      const sel = document.getElementById(id);
      const first = sel.options[0];
      sel.innerHTML = '';
      sel.appendChild(first);
      departments.forEach(d => {
        const opt = document.createElement('option');
        opt.value = opt.textContent = d;
        sel.appendChild(opt);
      });
    });
  }

  function openModal(record, role) {
    const isEdit   = !!record;
    const modal    = document.getElementById('record-modal');
    const titleEl  = document.getElementById('modal-title');

    titleEl.textContent = isEdit ? 'Edit Record' : 'Add Record';
    document.getElementById('modal-record-id').value = isEdit ? record.id : '';

    // Type field: lock based on role, or let admin/sales_manager choose
    const typeGroup = document.getElementById('modal-type-group');
    const typeSelect = document.getElementById('modal-type');
    if (role === 'finance_manager') {
      typeSelect.value = 'finance'; typeGroup.style.display = 'none';
    } else if (role === 'aftercare_manager') {
      typeSelect.value = 'aftercare'; typeGroup.style.display = 'none';
    } else {
      typeGroup.style.display = '';
    }

    if (isEdit) {
      typeSelect.value = record.record_type;
      document.getElementById('modal-status').value       = record.status;
      document.getElementById('modal-deal-date').value    = record.deal_date || '';
      document.getElementById('modal-est-delivery').value = record.estimated_delivery_date || '';
      document.getElementById('modal-delivered-date').value = record.delivered_date || '';
      document.getElementById('modal-deal-number').value  = record.deal_number;
      document.getElementById('modal-customer').value     = record.customer_name;
      document.getElementById('modal-department').value   = record.department;
      document.getElementById('modal-vehicle').value      = record.vehicle_description;
      document.getElementById('modal-income').value       = record.total_income;
      document.getElementById('modal-notes').value        = record.notes || '';

      // Set salesperson
      const spSel = document.getElementById('modal-salesperson');
      spSel.value = record.salesperson_id || '';
    } else {
      document.getElementById('modal-deal-date').value       = Utils.today();
      document.getElementById('modal-status').value          = 'active';
      document.getElementById('modal-est-delivery').value    = '';
      document.getElementById('modal-delivered-date').value  = '';
      document.getElementById('modal-deal-number').value     = '';
      document.getElementById('modal-customer').value        = '';
      document.getElementById('modal-department').value      = '';
      document.getElementById('modal-salesperson').value     = '';
      document.getElementById('modal-vehicle').value         = '';
      document.getElementById('modal-income').value          = '';
      document.getElementById('modal-notes').value           = '';
    }

    toggleDeliveredDateField();
    modal.classList.remove('hidden');
  }

  function closeModal() {
    document.getElementById('record-modal').classList.add('hidden');
    document.getElementById('modal-error').classList.add('hidden');
  }

  function toggleDeliveredDateField() {
    const status = document.getElementById('modal-status').value;
    const group  = document.getElementById('modal-delivered-date-group');
    group.style.display = status === 'delivered' ? '' : 'none';
    if (status !== 'delivered') {
      document.getElementById('modal-delivered-date').value = '';
    }
  }

  // ---- Filters visibility -----------------------------------

  function applyRoleVisibility(role) {
    const typeGroup = document.getElementById('filter-type-group');
    if (role === 'finance_manager' || role === 'aftercare_manager') {
      typeGroup.style.display = 'none';
    }

    const exportFinBtn = document.getElementById('export-finance-btn');
    const exportAfBtn  = document.getElementById('export-aftercare-btn');

    if (role === 'finance_manager' || role === 'admin' || role === 'sales_manager') {
      exportFinBtn.style.display = '';
    }
    if (role === 'aftercare_manager' || role === 'admin' || role === 'sales_manager') {
      exportAfBtn.style.display = '';
    }
  }

  // ---- Utils -----------------------------------------------

  function escHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return {
    updateTiles, updateTables,
    populateSalespersonSelect, populateDepartmentSelects,
    openModal, closeModal, toggleDeliveredDateField,
    applyRoleVisibility,
  };
})();
