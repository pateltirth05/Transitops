import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, AlertTriangle } from 'lucide-react';
import { formatRupee } from '../App';

function Vehicles({ vehicles, fetchWithAuth, showToast, refreshAllData, user, formatDistance, formatCurrency }) {
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  
  // Form values
  const [regNo, setRegNo] = useState('');
  const [model, setModel] = useState('');
  const [type, setType] = useState('Truck');
  const [maxCapacity, setMaxCapacity] = useState('');
  const [odometer, setOdometer] = useState('0');
  const [acqCost, setAcqCost] = useState('0');
  const [region, setRegion] = useState('North');
  const [status, setStatus] = useState('Available');

  const isManager = user?.role === 'fleet_manager';

  const resetForm = () => {
    setRegNo('');
    setModel('');
    setType('Truck');
    setMaxCapacity('');
    setOdometer('0');
    setAcqCost('0');
    setRegion('North');
    setStatus('Available');
    setEditingVehicle(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (vehicle) => {
    setEditingVehicle(vehicle);
    setRegNo(vehicle.registration_number);
    setModel(vehicle.name_model);
    setType(vehicle.type);
    setMaxCapacity(vehicle.max_load_capacity);
    setOdometer(vehicle.odometer);
    setAcqCost(vehicle.acquisition_cost);
    setRegion(vehicle.region || 'North');
    setStatus(vehicle.status);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!regNo || !model || !maxCapacity) {
      return showToast('Please fill all required fields', 'warning');
    }

    // Alphanumeric Indian Registration Number Validation
    const cleanReg = regNo.toUpperCase().replace(/\s+/g, '');
    const regPattern = /^[A-Z]{2}-?\d{2}-?[A-Z]{1,2}-?\d{4}$/;
    if (!regPattern.test(cleanReg)) {
      return showToast('Invalid Registration format. Please use standard Indian format (e.g. MH-12-PQ-5020).', 'danger');
    }

    const payload = {
      registration_number: regNo.toUpperCase().trim(),
      name_model: model,
      type,
      max_load_capacity: parseFloat(maxCapacity),
      odometer: parseFloat(odometer || 0),
      acquisition_cost: parseFloat(acqCost || 0),
      region,
      status
    };

    let result;
    if (editingVehicle) {
      result = await fetchWithAuth(`/vehicles/${editingVehicle.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
    } else {
      result = await fetchWithAuth('/vehicles', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }

    if (result) {
      showToast(
        editingVehicle ? 'Vehicle updated successfully' : 'Vehicle added successfully',
        'success'
      );
      setIsModalOpen(false);
      resetForm();
      refreshAllData();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    
    const result = await fetchWithAuth(`/vehicles/${id}`, {
      method: 'DELETE'
    });

    if (result) {
      showToast('Vehicle deleted successfully', 'success');
      refreshAllData();
    }
  };

  // Filtering Logic
  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = 
      v.registration_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.name_model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All' || v.type === typeFilter;
    const matchesStatus = statusFilter === 'All' || v.status === statusFilter;
    const matchesRegion = regionFilter === 'All' || v.region === regionFilter;
    return matchesSearch && matchesType && matchesStatus && matchesRegion;
  });

  return (
    <div>
      <div className="content-header">
        <div className="header-title">
          <h1>Vehicle Registry</h1>
          <p>Maintain fleet databases, regional assignments, and compliance statuses.</p>
        </div>
        
        {isManager ? (
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} />
            <span>Add Vehicle</span>
          </button>
        ) : (
          <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={16} className="text-warning" />
            <span>Required Role: Fleet Manager to edit records</span>
          </div>
        )}
      </div>

      {/* Filter / Search Bar */}
      <div className="card-section" style={{ padding: '16px 24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search by reg number or model..." 
              style={{ paddingLeft: '38px' }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Type:</span>
              <select className="filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option value="All">All Types</option>
                <option value="Truck">Truck</option>
                <option value="Van">Van</option>
                <option value="Car">Car</option>
                <option value="Semi-Trailer">Semi-Trailer</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Region:</span>
              <select className="filter-select" value={regionFilter} onChange={e => setRegionFilter(e.target.value)}>
                <option value="All">All Regions</option>
                <option value="North">North</option>
                <option value="South">South</option>
                <option value="East">East</option>
                <option value="West">West</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Status:</span>
              <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="All">All Statuses</option>
                <option value="Available">Available</option>
                <option value="On Trip">On Trip</option>
                <option value="In Shop">In Shop</option>
                <option value="Retired">Retired</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Registry Table */}
      <div className="card-section">
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Reg Number</th>
                <th>Model / Name</th>
                <th>Type</th>
                <th>Region</th>
                <th>Max Capacity</th>
                <th>Odometer</th>
                <th>Acquisition Cost</th>
                <th>Status</th>
                {isManager && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={isManager ? 9 : 8} style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
                    No vehicles registered matching the filter.
                  </td>
                </tr>
              ) : (
                filteredVehicles.map(v => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{v.registration_number}</td>
                    <td style={{ fontWeight: 600 }}>{v.name_model}</td>
                    <td>{v.type}</td>
                    <td><span style={{ fontWeight: 500, color: 'var(--text-medium)' }}>{v.region || 'North'}</span></td>
                    <td>{v.max_load_capacity} kg</td>
                    <td>{formatDistance(v.odometer)}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(v.acquisition_cost)}</td>
                    <td>
                      <span className={`badge ${
                        v.status === 'Available' ? 'badge-success' :
                        v.status === 'On Trip' ? 'badge-info' :
                        v.status === 'In Shop' ? 'badge-warning' : 'badge-danger'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    {isManager && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 10px' }}
                            onClick={() => openEditModal(v)}
                            title="Edit Vehicle"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: '6px 10px' }}
                            onClick={() => handleDelete(v.id)}
                            title="Delete Vehicle"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingVehicle ? 'Edit Vehicle Profile' : 'Add New Vehicle'}</h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Registration Number (Indian Format) *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. MH-12-PQ-5020" 
                    value={regNo}
                    onChange={e => setRegNo(e.target.value)}
                    required
                    disabled={!!editingVehicle}
                  />
                  <small style={{ color: '#64748b', fontSize: '11px' }}>Format: SS-RR-XX-NNNN (State code, RTO code, alphanumeric series, unique numbers)</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Vehicle Name / Model *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Tata Prima 2825.K" 
                    value={model}
                    onChange={e => setModel(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Vehicle Type *</label>
                    <select className="form-control" value={type} onChange={e => setType(e.target.value)}>
                      <option value="Truck">Truck</option>
                      <option value="Van">Van</option>
                      <option value="Car">Car</option>
                      <option value="Semi-Trailer">Semi-Trailer</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Regional Hub *</label>
                    <select className="form-control" value={region} onChange={e => setRegion(e.target.value)}>
                      <option value="North">North India</option>
                      <option value="South">South India</option>
                      <option value="East">East India</option>
                      <option value="West">West India</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Max Load Capacity (kg) *</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      placeholder="e.g. 15000" 
                      value={maxCapacity}
                      onChange={e => setMaxCapacity(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Acquisition Cost (INR ₹) *</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      placeholder="e.g. 2400000"
                      value={acqCost}
                      onChange={e => setAcqCost(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Initial Odometer (km)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={odometer}
                      onChange={e => setOdometer(e.target.value)}
                    />
                  </div>

                  {editingVehicle && (
                    <div className="form-group">
                      <label className="form-label">Vehicle Status</label>
                      <select className="form-control" value={status} onChange={e => setStatus(e.target.value)}>
                        <option value="Available">Available</option>
                        <option value="On Trip">On Trip</option>
                        <option value="In Shop">In Shop</option>
                        <option value="Retired">Retired</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Vehicles;
