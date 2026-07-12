import React from 'react';
import { Download, TrendingUp, TrendingDown, DollarSign, Calculator } from 'lucide-react';
import { formatRupee } from '../App';

function Reports({ analytics, fetchWithAuth, showToast, refreshAllData, user, formatDistance, formatCurrency }) {

  const handleExportCSV = () => {
    if (analytics.length === 0) return showToast('No data available to export', 'warning');

    const headers = [
      'Registration Number',
      'Vehicle Model',
      'Acquisition Cost (INR)',
      'Total Trips',
      'Distance Driven (km)',
      'Fuel Efficiency (km/L)',
      'Fuel Cost (INR)',
      'Maintenance Cost (INR)',
      'Other Expenses (INR)',
      'Total Operational Cost (INR)',
      'Simulated Revenue (INR)',
      'ROI (%)'
    ];

    const rows = analytics.map(v => [
      v.registration_number,
      v.name_model,
      v.acquisition_cost,
      v.trip_count,
      v.total_distance,
      v.fuel_efficiency,
      v.fuel_cost,
      v.maintenance_cost,
      v.expenses_cost,
      v.operational_cost,
      v.simulated_revenue,
      v.roi
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `transitops_fleet_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('CSV Report exported successfully!', 'success');
  };

  const averageROI = analytics.length > 0 
    ? (analytics.reduce((acc, curr) => acc + parseFloat(curr.roi), 0) / analytics.length).toFixed(2)
    : '0.00';

  const totalFleetCost = analytics.reduce((acc, curr) => acc + parseFloat(curr.operational_cost), 0);

  return (
    <div>
      <div className="content-header">
        <div className="header-title">
          <h1>Reports & Fleet Analytics</h1>
          <p>Analyze business returns, fuel metrics, maintenance charges, and vehicle ROI.</p>
        </div>

        <button className="btn btn-primary" onClick={handleExportCSV}>
          <Download size={16} />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* Analytics KPI Row */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Average Fleet ROI</span>
            <div className="stat-icon-wrapper purple">
              <TrendingUp size={20} />
            </div>
          </div>
          <span className="stat-value" style={{ color: parseFloat(averageROI) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            {averageROI}%
          </span>
          <span style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>Return on asset purchase cost</span>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Total Operational Cost</span>
            <div className="stat-icon-wrapper red">
              <DollarSign size={20} />
            </div>
          </div>
          <span className="stat-value">{formatCurrency(totalFleetCost)}</span>
          <span style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>Fuel + Maintenance + Toll taxes</span>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">ROI Calculation Formula</span>
            <div className="stat-icon-wrapper blue">
              <Calculator size={20} />
            </div>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-medium)', fontWeight: 600, marginTop: '12px', lineHeight: '1.4' }}>
            ROI = ((Revenue - Expenses) / Acquisition Cost) &times; 100
          </div>
        </div>
      </div>

      {/* Main Analytics Sheet */}
      <div className="card-section">
        <div className="card-header">
          <h3 className="card-title">Vehicle-by-Vehicle Fleet Performance Matrix</h3>
          <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={refreshAllData}>Refresh Report</button>
        </div>

        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Vehicle Reg</th>
                <th>Model</th>
                <th>Trips</th>
                <th>Distance</th>
                <th>Fuel Efficiency</th>
                <th>Operational Cost</th>
                <th>Simulated Revenue</th>
                <th>Acquisition Cost</th>
                <th>Asset ROI</th>
              </tr>
            </thead>
            <tbody>
              {analytics.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
                    No analytics calculated. Try registering some completed trips.
                  </td>
                </tr>
              ) : (
                analytics.map(v => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 700 }}>{v.registration_number}</td>
                    <td style={{ fontWeight: 500 }}>{v.name_model}</td>
                    <td style={{ textAlign: 'center' }}>{v.trip_count}</td>
                    <td>{formatDistance(v.total_distance)}</td>
                    <td>
                      <strong>{v.fuel_efficiency}</strong> {v.fuel_efficiency !== 'N/A' && 'km/L'}
                    </td>
                    <td style={{ color: 'var(--danger)', fontWeight: 600 }}>
                      {formatCurrency(v.operational_cost)}
                    </td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>
                      {formatCurrency(v.simulated_revenue)}
                    </td>
                    <td>{formatCurrency(v.acquisition_cost)}</td>
                    <td style={{ fontWeight: 800, color: parseFloat(v.roi) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {parseFloat(v.roi) >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        <span>{v.roi}%</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Reports;
