// ============================================================
// export.js — CSV export for filtered records
// ============================================================

const Export = (() => {

  const COLUMNS = [
    { key: 'deal_date',               label: 'Deal Date' },
    { key: 'estimated_delivery_date', label: 'Est. Delivery Date' },
    { key: 'delivered_date',          label: 'Delivered Date' },
    { key: 'deal_number',             label: 'Deal Number' },
    { key: 'customer_name',           label: 'Customer Name' },
    { key: 'salesperson_name',        label: 'Salesperson' },
    { key: 'department',              label: 'Department' },
    { key: 'vehicle_description',     label: 'Vehicle' },
    { key: 'total_income',            label: 'Total Income' },
    { key: 'record_type',             label: 'Type' },
    { key: 'status',                  label: 'Status' },
    { key: 'notes',                   label: 'Notes' },
  ];

  function toCSV(rows) {
    const header = COLUMNS.map(c => `"${c.label}"`).join(',');
    const lines  = rows.map(r =>
      COLUMNS.map(c => {
        const val = r[c.key] ?? '';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',')
    );
    return [header, ...lines].join('\r\n');
  }

  function download(csvString, filename) {
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportByType(recordType) {
    const all      = State.filteredRecords();
    const filtered = all.filter(r => r.record_type === recordType);
    if (!filtered.length) { alert(`No ${recordType} records to export.`); return; }
    const csv      = toCSV(filtered);
    const date     = Utils.today();
    download(csv, `${recordType}-records-${date}.csv`);
  }

  return { exportByType };
})();
