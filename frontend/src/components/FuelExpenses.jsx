import React, { useState } from 'react';
import { Fuel, DollarSign, Plus, X, AlertTriangle } from 'lucide-react';
import { formatRupee } from '../App';

function FuelExpenses({ fuelLogs, expenses, vehicles, fetchWithAuth, showToast, refreshAllData, user, formatDistance, formatCurrency }) {
  // Modals state
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Fuel Form state
  const [fuelVehicleId, setFuelVehicleId] = useState('');
  const [fuelLiters, setFuelLiters] = useState('');
  const [fuelCost, setFuelCost] = useState('');

  // Expense Form state
  const [expenseVehicleId, setExpenseVehicleId] = useState('');
  const [expenseType, setExpenseType] = useState('Toll');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');

  const isAllowed = user?.role === 'fleet_manager' || user?.role === 'financial_analyst';

  const handleLogFuel = async (e) => {
    e.preventDefault();
    if (!fuelVehicleId || !fuelLiters || !fuelCost) {
      return showToast('Please enter all fuel logs details', 'warning');
    }

    const payload = {
      vehicle_id: parseInt(fuelVehicleId),
      liters: parseFloat(fuelLiters),
      cost: parseFloat(fuelCost)
    };

    const res = await fetchWithAuth('/fuel-logs', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (res) {
      showToast('Fuel log recorded successfully', 'success');
      setIsFuelModalOpen(false);
      setFuelVehicleId('');
      setFuelLiters('');
      setFuelCost('');
      refreshAllData();
    }
  };

  const handleLogExpense = async (e) => {
    e.preventDefault();
    if (!expenseVehicleId || !expenseType || !expenseAmount) {
      return showToast('Please enter all expense details', 'warning');
    }

    const payload = {
      vehicle_id: parseInt(expenseVehicleId),
      type: expenseType,
      amount: parseFloat(expenseAmount),
      description: expenseDesc
    };

    const res = await fetchWithAuth('/expenses', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (res) {
      showToast('Operational expense recorded successfully', 'success');
      setIsExpenseModalOpen(false);
      setExpenseVehicleId('');
      setExpenseAmount('');
      setExpenseDesc('');
      refreshAllData();
    }
  };

  return (
    <div>
      <div className="content-header">
        <div className="header-title">
          <h1>Fuel & Expense Management</h1>
          <p>Record fuel fills, toll fees, and other general fleet overheads.</p>
        </div>

        {isAllowed ? (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-secondary" onClick={() => setIsFuelModalOpen(true)}>
              <Fuel size={16} />
              <span>Log Fuel Receipt</span>
            </button>
            <button className="btn btn-primary" onClick={() => setIsExpenseModalOpen(true)}>
              <DollarSign size={16} />
              <span>Record Expense</span>
            </button>
          </div>
        ) : (
          <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={16} className="text-warning" />
            <span>Required Role: Financial Analyst or Fleet Manager to add</span>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px', alignItems: 'start' }}>
        {/* Left Side: Fuel Logs */}
        <div className="card-section">
          <div className="card-header">
            <h3 className="card-title">Fuel Logs Registry</h3>
          </div>
          
          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Refuel Date</th>
                  <th>Quantity (L)</th>
                  <th>Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {fuelLogs.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: '#64748b', padding: '24px' }}>No fuel entries logged.</td>
                  </tr>
                ) : (
                  fuelLogs.map(log => (
                    <tr key={log.id}>
                      <td>
                        <strong>{log.vehicle_reg}</strong>
                      </td>
                      <td>{new Date(log.log_date).toISOString().split('T')[0]}</td>
                      <td>{parseFloat(log.liters).toFixed(1)} L</td>
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{formatCurrency(log.cost)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Other Expenses */}
        <div className="card-section">
          <div className="card-header">
            <h3 className="card-title">General Fleet Expenses</h3>
          </div>

          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Date</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: '#64748b', padding: '24px' }}>No general expenses logged.</td>
                  </tr>
                ) : (
                  expenses.map(exp => (
                    <tr key={exp.id}>
                      <td><strong>{exp.vehicle_reg}</strong></td>
                      <td>
                        <span className={`badge ${
                          exp.type === 'Maintenance' ? 'badge-warning' : 'badge-info'
                        }`}>
                          {exp.type}
                        </span>
                      </td>
                      <td style={{ fontSize: '13px' }}>{exp.description || '—'}</td>
                      <td>{new Date(exp.date).toISOString().split('T')[0]}</td>
                      <td style={{ fontWeight: 700, color: 'var(--danger)' }}>{formatCurrency(exp.amount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Log Fuel Modal */}
      {isFuelModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Log Fuel Fill-Up</h3>
              <button className="modal-close-btn" onClick={() => setIsFuelModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleLogFuel}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Select Vehicle *</label>
                  <select className="form-control" value={fuelVehicleId} onChange={e => setFuelVehicleId(e.target.value)} required>
                    <option value="">-- Choose Vehicle --</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.registration_number} - {v.name_model}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Fuel Quantity (Liters) *</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      placeholder="e.g. 50"
                      value={fuelLiters}
                      onChange={e => setFuelLiters(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Receipt Amount (INR ₹) *</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      placeholder="e.g. 4800"
                      value={fuelCost}
                      onChange={e => setFuelCost(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsFuelModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Log Fuel Receipt</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Expense Modal */}
      {isExpenseModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Log Operating Expense</h3>
              <button className="modal-close-btn" onClick={() => setIsExpenseModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleLogExpense}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Select Vehicle *</label>
                    <select className="form-control" value={expenseVehicleId} onChange={e => setExpenseVehicleId(e.target.value)} required>
                      <option value="">-- Choose Vehicle --</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.registration_number} - {v.name_model}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Expense Category *</label>
                    <select className="form-control" value={expenseType} onChange={e => setExpenseType(e.target.value)}>
                      <option value="Toll">Toll Tax Charge</option>
                      <option value="Insurance">Insurance Payment</option>
                      <option value="Tax">RTO Tax / Permitting</option>
                      <option value="Other">Other Expenses</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Amount (INR ₹) *</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    placeholder="e.g. 1500"
                    value={expenseAmount}
                    onChange={e => setExpenseAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Short Description / Notes</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Pune Express highway toll"
                    value={expenseDesc}
                    onChange={e => setExpenseDesc(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsExpenseModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Record Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default FuelExpenses;
