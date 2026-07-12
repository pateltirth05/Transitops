import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Shield, Unlock, Check, AlertTriangle } from 'lucide-react';

function Settings({ settings, fetchWithAuth, showToast, refreshAllData, user }) {
  const [depotName, setDepotName] = useState(settings.depot_name);
  const [distanceUnit, setDistanceUnit] = useState(settings.distance_unit);
  const [currency, setCurrency] = useState(settings.currency);
  const [saving, setSaving] = useState(false);

  // Unlock state
  const [unlockEmail, setUnlockEmail] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  const isManager = user?.role === 'fleet_manager';

  useEffect(() => {
    setDepotName(settings.depot_name);
    setDistanceUnit(settings.distance_unit);
    setCurrency(settings.currency);
  }, [settings]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!depotName) return showToast('Depot name is required.', 'warning');
    
    setSaving(true);
    const res = await fetchWithAuth('/settings', {
      method: 'PUT',
      body: JSON.stringify({
        depot_name: depotName,
        distance_unit: distanceUnit,
        currency: currency
      })
    });
    setSaving(false);

    if (res) {
      showToast('Configuration settings updated globally.', 'success');
      refreshAllData();
    }
  };

  const handleUnlockUser = async (e) => {
    e.preventDefault();
    if (!unlockEmail) return showToast('Please enter the user email to unlock.', 'warning');

    setUnlocking(true);
    const res = await fetchWithAuth('/auth/unlock', {
      method: 'POST',
      body: JSON.stringify({ email: unlockEmail })
    });
    setUnlocking(false);

    if (res) {
      showToast(`User account ${unlockEmail} has been unlocked successfully.`, 'success');
      setUnlockEmail('');
    }
  };

  // Static RBAC Permissions Matrix mapping for visualization (matching mock page 8)
  const permissions = [
    { role: 'Fleet Manager', vehicles: 'Full CRUD', drivers: 'Full CRUD', trips: 'Create/Dispatch', maintenance: 'Open/Close', financial: 'Log Expenses' },
    { role: 'Driver', vehicles: 'Read Only', drivers: 'Read Only', trips: 'Create/Complete', maintenance: 'Restricted', financial: 'Restricted' },
    { role: 'Safety Officer', vehicles: 'Read Only', drivers: 'Full CRUD', trips: 'Restricted', maintenance: 'Restricted', financial: 'Restricted' },
    { role: 'Financial Analyst', vehicles: 'Restricted', drivers: 'Restricted', trips: 'Restricted', maintenance: 'Restricted', financial: 'Log Expenses' }
  ];

  return (
    <div>
      <div className="content-header">
        <div className="header-title">
          <h1>Settings & System Controls</h1>
          <p>Configure metrics formatting, manage access control parameters, and release locked accounts.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px', alignItems: 'start' }}>
        {/* Left Side: App Settings Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card-section">
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SettingsIcon size={18} />
                <span>General Options</span>
              </h3>
            </div>

            <div style={{ padding: '24px' }}>
              {!isManager && (
                <div className="warning-box" style={{ marginBottom: '20px' }}>
                  <AlertTriangle size={18} />
                  <span><strong>Viewing mode only:</strong> You must be logged in as a Fleet Manager to save changes to these settings.</span>
                </div>
              )}

              <form onSubmit={handleSaveSettings}>
                <div className="form-group">
                  <label className="form-label">Depot Name / Base Branch *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={depotName} 
                    onChange={e => setDepotName(e.target.value)} 
                    disabled={!isManager}
                    required 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Distance Unit *</label>
                    <select 
                      className="form-control" 
                      value={distanceUnit} 
                      onChange={e => setDistanceUnit(e.target.value)}
                      disabled={!isManager}
                    >
                      <option value="KM">Kilometers (KM)</option>
                      <option value="Miles">Miles (mi)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Currency Symbol *</label>
                    <select 
                      className="form-control" 
                      value={currency} 
                      onChange={e => setCurrency(e.target.value)}
                      disabled={!isManager}
                    >
                      <option value="INR">Indian Rupee (₹)</option>
                      <option value="USD">US Dollar ($)</option>
                    </select>
                  </div>
                </div>

                {isManager && (
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Configuration'}
                  </button>
                )}
              </form>
            </div>
          </div>

          {/* Locked Accounts Controller */}
          <div className="card-section">
            <div className="card-header">
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Unlock size={18} />
                <span>Unlock User Accounts</span>
              </h3>
            </div>

            <div style={{ padding: '24px' }}>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                If an employee's account gets locked due to 5 consecutive invalid password login attempts, enter their email address below to unlock it.
              </p>

              {!isManager ? (
                <div className="danger-box" style={{ margin: 0 }}>
                  <AlertTriangle size={18} />
                  <span><strong>Access Denied:</strong> Contact a Fleet Manager to release locked employee accounts.</span>
                </div>
              ) : (
                <form onSubmit={handleUnlockUser} style={{ display: 'flex', gap: '12px' }}>
                  <input 
                    type="email" 
                    className="form-control" 
                    placeholder="e.g. driver@transitops.com"
                    value={unlockEmail}
                    onChange={e => setUnlockEmail(e.target.value)}
                    required 
                  />
                  <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }} disabled={unlocking}>
                    {unlocking ? 'Processing...' : 'Unlock Account'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Role Permissions Summary Matrix */}
        <div className="card-section">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} />
              <span>Role Permissions Summary Matrix</span>
            </h3>
          </div>

          <div style={{ padding: '24px' }}>
            <div className="table-wrapper">
              <table className="custom-table" style={{ fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th>System Role</th>
                    <th>Vehicles</th>
                    <th>Drivers</th>
                    <th>Trips</th>
                    <th>Maintenance</th>
                    <th>Expenses</th>
                  </tr>
                </thead>
                <tbody>
                  {permissions.map((p, idx) => (
                    <tr key={idx} style={user?.role === p.role.toLowerCase().replace(' ', '_') ? { backgroundColor: 'var(--primary-light)', fontWeight: 600 } : {}}>
                      <td>
                        <strong>{p.role}</strong>
                        {user?.role === p.role.toLowerCase().replace(' ', '_') && <span style={{ fontSize: '10px', display: 'block', color: 'var(--primary)' }}>(Active Session)</span>}
                      </td>
                      <td>{p.vehicles}</td>
                      <td>{p.drivers}</td>
                      <td>{p.trips}</td>
                      <td>{p.maintenance}</td>
                      <td>{p.financial}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
