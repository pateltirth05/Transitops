import React, { useState } from 'react';
import { Wrench, Plus, X, AlertTriangle } from 'lucide-react';
import { formatRupee } from '../App';

function Maintenance({ maintenance, vehicles, fetchWithAuth, showToast, refreshAllData, user, formatDistance, formatCurrency }) {
  // Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('0');

  // Close log modal state
  const [closingLog, setClosingLog] = useState(null);
  const [finalCost, setFinalCost] = useState('');

  const isManager = user?.role === 'fleet_manager';

  const handleCreateLog = async (e) => {
    e.preventDefault();
    if (!selectedVehicleId || !description) {
      return showToast('Vehicle and description are required.', 'warning');
    }

    const payload = {
      vehicle_id: parseInt(selectedVehicleId),
      description,
      cost: parseFloat(cost || 0)
    };

    const res = await fetchWithAuth('/maintenance', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (res) {
      showToast('Vehicle logged in maintenance shop. Status set to In Shop.', 'success');
      setIsModalOpen(false);
      setSelectedVehicleId('');
      setDescription('');
      setCost('0');
      refreshAllData();
    }
  };

  const openCloseModal = (log) => {
    setClosingLog(log);
    setFinalCost(log.cost);
  };

  const handleCloseMaintenance = async (e) => {
    e.preventDefault();
    const res = await fetchWithAuth(`/maintenance/${closingLog.id}/close`, {
      method: 'POST',
      body: JSON.stringify({ cost: parseFloat(finalCost) })
    });

    if (res) {
      showToast('Maintenance closed! Vehicle status restored to Available.', 'success');
      setClosingLog(null);
      refreshAllData();
    }
  };

  // Only Available vehicles can go into shop
  const eligibleVehicles = vehicles.filter(v => v.status === 'Available');

  return (
    <div>
      <div className="content-header">
        <div className="header-title">
          <h1>Maintenance Logs</h1>
          <p>Register shop repairs, track active breakdowns, and release vehicles back to available pools.</p>
        </div>

        {isManager ? (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} />
            <span>Log Service Repair</span>
          </button>
        ) : (
          <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={16} className="text-warning" />
            <span>Required Role: Fleet Manager to write logbooks</span>
          </div>
        )}
      </div>

      {/* Maintenance Logs List */}
      <div className="card-section">
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Vehicle Reg</th>
                <th>Vehicle Model</th>
                <th>Description</th>
                <th>Logged Date</th>
                <th>Completed Date</th>
                <th>Invoice Cost</th>
                <th>Status</th>
                {isManager && <th style={{ textAlign: 'right' }}>Action</th>}
              </tr>
            </thead>
            <tbody>
              {maintenance.length === 0 ? (
                <tr>
                  <td colSpan={isManager ? 8 : 7} style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
                    No maintenance records logged.
                  </td>
                </tr>
              ) : (
                maintenance.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontWeight: 700 }}>{log.vehicle_reg}</td>
                    <td>{log.vehicle_name}</td>
                    <td>{log.description}</td>
                    <td>{new Date(log.created_at).toLocaleDateString()}</td>
                    <td>{log.completed_at ? new Date(log.completed_at).toLocaleDateString() : '—'}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(log.cost)}</td>
                    <td>
                      <span className={`badge ${log.status === 'Completed' ? 'badge-success' : 'badge-warning'}`}>
                        {log.status === 'Completed' ? 'Closed' : 'Active'}
                      </span>
                    </td>
                    {isManager && (
                      <td style={{ textAlign: 'right' }}>
                        {log.status === 'Active' ? (
                          <button 
                            className="btn btn-primary" 
                            style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: 'var(--success)' }}
                            onClick={() => openCloseModal(log)}
                          >
                            Close Service
                          </button>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Completed</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Maintenance Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Log New Service Repair</h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateLog}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Select Vehicle *</label>
                  <select className="form-control" value={selectedVehicleId} onChange={e => setSelectedVehicleId(e.target.value)} required>
                    <option value="">-- Choose Available Vehicle --</option>
                    {eligibleVehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.registration_number} - {v.name_model}
                      </option>
                    ))}
                  </select>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    Note: Placing a vehicle in shop switches its status to <strong>In Shop</strong>, removing it from trip dispatches.
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Service Description *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Ashok Leyland Dost+ engine tune-up"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Estimated Cost (INR ₹)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={cost}
                    onChange={e => setCost(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Move to Shop</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Maintenance Modal */}
      {closingLog && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Complete Service: Vehicle {closingLog.vehicle_reg}</h3>
              <button className="modal-close-btn" onClick={() => setClosingLog(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCloseMaintenance}>
              <div className="modal-body">
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', padding: '12px', backgroundColor: 'var(--success-light)', borderRadius: '8px', color: '#065f46', fontSize: '14px' }}>
                  <Wrench size={18} />
                  <span>Closing this log releases vehicle <strong>{closingLog.vehicle_reg}</strong> back to active duty (Available).</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Final Maintenance Invoice Cost (INR ₹) *</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={finalCost}
                    onChange={e => setFinalCost(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setClosingLog(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--success)' }}>Complete Service</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Maintenance;
