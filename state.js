// ============================================================
// state.js — Central app state
// ============================================================

const State = (() => {
  let _state = {
    user:        null,   // auth user object
    profile:     null,   // app_profiles row
    role:        null,   // shortcut to profile.role
    salesPeople: [],     // all active sales people
    records:     [],     // all fetched records (unfiltered from DB)
    filters: {
      month:          '',
      date_from:      '',
      date_to:        '',
      salesperson_id: '',
      department:     '',
      record_type:    '',
      status:         '',
    },
  };

  function get()                { return _state; }
  function getRole()            { return _state.role; }
  function setUser(u)           { _state.user = u; }
  function setProfile(p)        { _state.profile = p; _state.role = p.role; }
  function setSalesPeople(arr)  { _state.salesPeople = arr; }
  function setRecords(arr)      { _state.records = arr; }
  function setFilter(key, val)  { _state.filters[key] = val; }
  function clearFilters()       { Object.keys(_state.filters).forEach(k => _state.filters[k] = ''); }

  /**
   * Returns records filtered by current state.filters,
   * further constrained by user role.
   */
  function filteredRecords() {
    const { records, filters, role } = _state;
    return records.filter(r => {
      // Role guard (belt-and-suspenders on top of RLS)
      if (role === 'finance_manager'  && r.record_type !== 'finance')   return false;
      if (role === 'aftercare_manager'&& r.record_type !== 'aftercare') return false;

      if (filters.status        && r.status           !== filters.status)        return false;
      if (filters.record_type   && r.record_type      !== filters.record_type)   return false;
      if (filters.salesperson_id&& r.salesperson_id   !== filters.salesperson_id)return false;
      if (filters.department    && r.department        !== filters.department)    return false;

      if (filters.month) {
        const [y, m] = filters.month.split('-');
        const dealMonth = r.deal_date ? r.deal_date.slice(0, 7) : '';
        if (dealMonth !== `${y}-${m}`) return false;
      }
      if (filters.date_from && r.deal_date < filters.date_from) return false;
      if (filters.date_to   && r.deal_date > filters.date_to)   return false;

      return true;
    });
  }

  return {
    get, getRole, setUser, setProfile, setSalesPeople,
    setRecords, setFilter, clearFilters, filteredRecords,
  };
})();
