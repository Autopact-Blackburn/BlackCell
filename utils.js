// ============================================================
// utils.js — Shared helper functions
// ============================================================

const Utils = (() => {

  /** Format number as AUD currency string */
  function formatCurrency(value) {
    if (value === null || value === undefined || value === '') return '—';
    return new Intl.NumberFormat('en-AU', {
      style: 'currency', currency: 'AUD', minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(Number(value));
  }

  /** Format ISO date string as DD/MM/YYYY */
  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('T')[0].split('-');
    return `${d}/${m}/${y}`;
  }

  /** Show or hide the full-page loading overlay */
  function setLoading(visible) {
    document.getElementById('loading-overlay').classList.toggle('hidden', !visible);
  }

  /** Display an error message in a given element */
  function showError(elementId, message) {
    const el = document.getElementById(elementId);
    el.textContent = message;
    el.classList.remove('hidden');
  }

  function hideError(elementId) {
    const el = document.getElementById(elementId);
    el.textContent = '';
    el.classList.add('hidden');
  }

  /** Today's date as YYYY-MM-DD */
  function today() {
    return new Date().toISOString().split('T')[0];
  }

  /** Current YYYY-MM */
  function currentMonth() {
    return new Date().toISOString().slice(0, 7);
  }

  return { formatCurrency, formatDate, setLoading, showError, hideError, today, currentMonth };
})();
