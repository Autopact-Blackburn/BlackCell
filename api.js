// ============================================================
// api.js — All Supabase data operations
// ============================================================

const API = (() => {

  // ---- Sales People ----------------------------------------

  async function getSalesPeople() {
    const { data, error } = await supabase
      .from('sales_people')
      .select('*')
      .eq('active', true)
      .order('full_name');
    if (error) throw error;
    return data;
  }

  // ---- Performance Records ---------------------------------

  /**
   * Fetch records with optional filters.
   * RLS on the table already enforces role-based access.
   * @param {Object} filters
   */
  async function getRecords(filters = {}) {
    let query = supabase
      .from('performance_records')
      .select('*')
      .order('deal_date', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.record_type) {
      query = query.eq('record_type', filters.record_type);
    }

    if (filters.salesperson_id) {
      query = query.eq('salesperson_id', filters.salesperson_id);
    }

    if (filters.department) {
      query = query.eq('department', filters.department);
    }

    // Date range filtering: use deal_date for active, delivered_date for delivered
    // We apply a broad OR so month filters work across both date columns.
    if (filters.date_from) {
      query = query.gte('deal_date', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('deal_date', filters.date_to);
    }

    // Month filter — filter by deal_date month
    if (filters.month) {
      const [year, month] = filters.month.split('-');
      const from = `${year}-${month}-01`;
      const to   = lastDayOfMonth(year, month);
      query = query.gte('deal_date', from).lte('deal_date', to);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  /**
   * Insert a new performance record.
   */
  async function createRecord(payload) {
    const { data, error } = await supabase
      .from('performance_records')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  /**
   * Update an existing performance record by id.
   */
  async function updateRecord(id, payload) {
    const { data, error } = await supabase
      .from('performance_records')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // Records are NEVER deleted — this is intentionally omitted.

  // ---- Helpers ---------------------------------------------

  function lastDayOfMonth(year, month) {
    return new Date(Number(year), Number(month), 0).toISOString().split('T')[0];
  }

  return { getSalesPeople, getRecords, createRecord, updateRecord };
})();
