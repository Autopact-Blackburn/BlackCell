// ============================================================
// dashboard.js — App bootstrap, event wiring, CRUD handlers
// ============================================================

(async () => {

  // ---- Startup ---------------------------------------------

  Utils.setLoading(true);

  try {
    const session = await Auth.getSession();
    if (session) {
      await bootApp(session.user);
    } else {
      showLogin();
    }
  } catch (err) {
    console.error('Startup error:', err);
    showLogin();
  } finally {
    Utils.setLoading(false);
  }

  // ---- Login -----------------------------------------------

  function showLogin() {
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('app-shell').classList.add('hidden');
  }

  function showApp() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-shell').classList.remove('hidden');
  }

  document.getElementById('login-btn').addEventListener('click', async () => {
    Utils.hideError('login-error');
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    if (!email || !password) {
      Utils.showError('login-error', 'Please enter your email and password.');
      return;
    }
    Utils.setLoading(true);
    try {
      const user = await Auth.signIn(email, password);
      await bootApp(user);
    } catch (err) {
      Utils.showError('login-error', err.message || 'Sign-in failed. Please try again.');
    } finally {
      Utils.setLoading(false);
    }
  });

  // Allow Enter key in password field
  document.getElementById('login-password').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('login-btn').click();
  });

  // ---- Logout ----------------------------------------------

  document.getElementById('logout-btn').addEventListener('click', async () => {
    await Auth.signOut();
    State.setUser(null);
    showLogin();
  });

  // ---- Boot App --------------------------------------------

  async function bootApp(user) {
    State.setUser(user);

    const profile = await Auth.getProfile(user.id);
    State.setProfile(profile);

    // Header
    document.getElementById('header-user').textContent = profile.full_name || user.email;
    document.getElementById('header-role').textContent = profile.role.replace('_', ' ');

    // Sales people
    const salesPeople = await API.getSalesPeople();
    State.setSalesPeople(salesPeople);
    Render.populateSalespersonSelect('filter-salesperson', salesPeople);
    Render.populateSalespersonSelect('modal-salesperson', salesPeople);

    // Departments
    Render.populateDepartmentSelects(DEPARTMENTS);

    // Role visibility
    Render.applyRoleVisibility(profile.role);

    // Set default month filter to current month
    document.getElementById('filter-month').value = Utils.currentMonth();
    State.setFilter('month', Utils.currentMonth());

    showApp();
    await loadAndRender();
  }

  // ---- Load & Render ----------------------------------------

  async function loadAndRender() {
    Utils.setLoading(true);
    try {
      const filters  = State.get().filters;
      const role     = State.getRole();

      // Force record_type for restricted roles
      const apiFilters = { ...filters };
      if (role === 'finance_manager')  apiFilters.record_type = 'finance';
      if (role === 'aftercare_manager') apiFilters.record_type = 'aftercare';

      const records = await API.getRecords(apiFilters);
      State.setRecords(records);
      renderAll();
    } catch (err) {
      console.error('Load error:', err);
      alert('Failed to load records: ' + err.message);
    } finally {
      Utils.setLoading(false);
    }
  }

  function renderAll() {
    const filtered = State.filteredRecords();
    Render.updateTiles(filtered);
    Render.updateTables(filtered);
  }

  // ---- Filters ---------------------------------------------

  document.getElementById('filter-apply-btn').addEventListener('click', async () => {
    State.setFilter('month',          document.getElementById('filter-month').value);
    State.setFilter('date_from',      document.getElementById('filter-date-from').value);
    State.setFilter('date_to',        document.getElementById('filter-date-to').value);
    State.setFilter('salesperson_id', document.getElementById('filter-salesperson').value);
    State.setFilter('department',     document.getElementById('filter-department').value);
    State.setFilter('record_type',    document.getElementById('filter-type').value);
    State.setFilter('status',         document.getElementById('filter-status').value);
    await loadAndRender();
  });

  document.getElementById('filter-clear-btn').addEventListener('click', async () => {
    State.clearFilters();
    document.getElementById('filter-month').value        = '';
    document.getElementById('filter-date-from').value    = '';
    document.getElementById('filter-date-to').value      = '';
    document.getElementById('filter-salesperson').value  = '';
    document.getElementById('filter-department').value   = '';
    document.getElementById('filter-type').value         = '';
    document.getElementById('filter-status').value       = '';
    await loadAndRender();
  });

  // ---- Archive Toggle --------------------------------------

  document.getElementById('archive-toggle').addEventListener('click', () => {
    const panel  = document.getElementById('archive-panel');
    const toggle = document.getElementById('archive-toggle');
    const open   = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    panel.classList.toggle('hidden', open);
  });

  // ---- Add Record Button ------------------------------------

  document.getElementById('add-record-btn').addEventListener('click', () => {
    Render.openModal(null, State.getRole());
  });

  // ---- Export Buttons --------------------------------------

  document.getElementById('export-finance-btn').addEventListener('click', () => {
    Export.exportByType('finance');
  });

  document.getElementById('export-aftercare-btn').addEventListener('click', () => {
    Export.exportByType('aftercare');
  });

  // ---- Table Row Actions (delegated) -----------------------

  document.getElementById('active-tbody').addEventListener('click', handleRowAction);
  document.getElementById('delivered-tbody').addEventListener('click', handleRowAction);

  function handleRowAction(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const { action, id } = btn.dataset;
    const record = State.get().records.find(r => r.id === id);
    if (!record) return;

    if (action === 'edit') {
      Render.openModal(record, State.getRole());
    } else if (action === 'deliver') {
      quickDeliver(record);
    }
  }

  async function quickDeliver(record) {
    const date = prompt('Enter delivered date (YYYY-MM-DD):', Utils.today());
    if (!date) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { alert('Invalid date format.'); return; }
    Utils.setLoading(true);
    try {
      await API.updateRecord(record.id, { status: 'delivered', delivered_date: date });
      await loadAndRender();
    } catch (err) {
      alert('Failed to mark as delivered: ' + err.message);
    } finally {
      Utils.setLoading(false);
    }
  }

  // ---- Modal Events ----------------------------------------

  document.getElementById('modal-close-btn').addEventListener('click', Render.closeModal);
  document.getElementById('modal-cancel-btn').addEventListener('click', Render.closeModal);

  // Close modal on backdrop click
  document.getElementById('record-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('record-modal')) Render.closeModal();
  });

  // Show/hide delivered date field based on status
  document.getElementById('modal-status').addEventListener('change', Render.toggleDeliveredDateField);

  // Save record
  document.getElementById('modal-save-btn').addEventListener('click', saveRecord);

  async function saveRecord() {
    Utils.hideError('modal-error');

    const id     = document.getElementById('modal-record-id').value;
    const role   = State.getRole();

    // Build payload
    const spSelect = document.getElementById('modal-salesperson');
    const spId     = spSelect.value;
    const spName   = spId ? spSelect.options[spSelect.selectedIndex].dataset.name : null;

    const payload = {
      record_type:             getTypeForRole(role),
      status:                  document.getElementById('modal-status').value,
      deal_date:               document.getElementById('modal-deal-date').value,
      estimated_delivery_date: document.getElementById('modal-est-delivery').value || null,
      delivered_date:          document.getElementById('modal-delivered-date').value || null,
      deal_number:             document.getElementById('modal-deal-number').value.trim(),
      customer_name:           document.getElementById('modal-customer').value.trim(),
      salesperson_id:          spId || null,
      salesperson_name:        spName,
      department:              document.getElementById('modal-department').value,
      vehicle_description:     document.getElementById('modal-vehicle').value.trim(),
      total_income:            parseFloat(document.getElementById('modal-income').value) || 0,
      notes:                   document.getElementById('modal-notes').value.trim() || null,
    };

    // Validation
    if (!payload.record_type)         return Utils.showError('modal-error', 'Record type is required.');
    if (!payload.deal_date)           return Utils.showError('modal-error', 'Deal date is required.');
    if (!payload.deal_number)         return Utils.showError('modal-error', 'Deal number is required.');
    if (!payload.customer_name)       return Utils.showError('modal-error', 'Customer name is required.');
    if (!payload.department)          return Utils.showError('modal-error', 'Department is required.');
    if (!payload.vehicle_description) return Utils.showError('modal-error', 'Vehicle description is required.');
    if (payload.status === 'delivered' && !payload.delivered_date) {
      return Utils.showError('modal-error', 'Delivered date is required when status is Delivered.');
    }

    Utils.setLoading(true);
    try {
      if (id) {
        await API.updateRecord(id, payload);
      } else {
        await API.createRecord(payload);
      }
      Render.closeModal();
      await loadAndRender();
    } catch (err) {
      Utils.showError('modal-error', err.message || 'Save failed. Please try again.');
    } finally {
      Utils.setLoading(false);
    }
  }

  function getTypeForRole(role) {
    if (role === 'finance_manager')  return 'finance';
    if (role === 'aftercare_manager') return 'aftercare';
    return document.getElementById('modal-type').value;
  }

})();
