import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, AlertTriangle, Calendar } from 'lucide-react';

function Drivers({ drivers, fetchWithAuth, showToast, refreshAllData, user }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);

  // Form fields
  const [name, setName] = useState('');
  const [licenseNo, setLicenseNo] = useState('');
  const [licenseCategory, setLicenseCategory] = useState('Class A');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [safetyScore, setSafetyScore] = useState('100');
  const [status, setStatus] = useState('Available');

  const hasWriteAccess = user?.role === 'fleet_manager' || user?.role === 'safety_officer';

  const resetForm = () => {
    setName('');
    setLicenseNo('');
    setLicenseCategory('Class A');
    setLicenseExpiry('');
    setContactNo('');
    setSafetyScore('100');
    setStatus('Available');
    setEditingDriver(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (driver) => {
    setEditingDriver(driver);
    setName(driver.name);
    setLicenseNo(driver.license_number);
    setLicenseCategory(driver.license_category);
    const dateObj = new Date(driver.license_expiry_date);
    const formattedDate = dateObj.toISOString().split('T')[0];
    setLicenseExpiry(formattedDate);
    setContactNo(driver.contact_number);
    setSafetyScore(driver.safety_score);
    setStatus(driver.status);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !licenseNo || !licenseExpiry || !contactNo) {
      return showToast('Please fill all required fields', 'warning');
    }

    // Alphanumeric Indian License Validation: SS-RRYYYYYNNNNNNN
    const cleanLicense = licenseNo.toUpperCase().replace(/\s+/g, '');
    const dlPattern = /^[A-Z]{2}-\d{2}\d{4}\d{7}$|^[A-Z]{2}\d{13}$/;
    if (!dlPattern.test(cleanLicense)) {
      return showToast('Invalid Driving License format. Must be like MH-1220190123456 or DL-0420230123456.', 'danger');
    }

    // Indian Mobile phone validation
    const cleanMobile = contactNo.replace(/\s+/g, '');
    const mobilePattern = /^(?:\+91|0)?[6-9]\d{9}$/;
    if (!mobilePattern.test(cleanMobile)) {
      return showToast('Invalid Indian Mobile Number. Must be a valid 10-digit number optionally prefixed with +91.', 'danger');
    }

    const payload = {
      name,
      license_number: licenseNo.toUpperCase().trim(),
      license_category: licenseCategory,
      license_expiry_date: licenseExpiry,
      contact_number: contactNo.trim(),
      safety_score: parseFloat(safetyScore || 100),
      status
    };

    let result;
    if (editingDriver) {
      result = await fetchWithAuth(`/drivers/${editingDriver.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
    } else {
      result = await fetchWithAuth('/drivers', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }

    if (result) {
      showToast(
        editingDriver ? 'Driver profile updated' : 'Driver profile created',
        'success'
      );
      setIsModalOpen(false);
      resetForm();
      refreshAllData();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this driver profile?')) return;
    const result = await fetchWithAuth(`/drivers/${id}`, {
      method: 'DELETE'
    });
    if (result) {
      showToast('Driver profile deleted', 'success');
      refreshAllData();
    }
  };

  const isLicenseExpired = (expiryDateStr) => {
    const expiry = new Date(expiryDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    return expiry < today;
  };

  const filteredDrivers = drivers.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.license_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="content-header">
        <div className="header-title">
          <h1>Driver Management</h1>
          <p>Enforce licensing compliance check, contact logs, and driver safety audits.</p>
        </div>

        {hasWriteAccess ? (
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} />
            <span>Add Driver</span>
          </button>
        ) : (
          <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={16} className="text-warning" />
            <span>Required Role: Safety Officer or Fleet Manager to edit</span>
          </div>
        )}
      </div>

      {/* Search Filter Bar */}
      <div className="card-section" style={{ padding: '16px 24px', marginBottom: '24px' }}>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search driver name or license..." 
            style={{ paddingLeft: '38px' }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Drivers Table */}
      <div className="card-section">
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Driver Name</th>
                <th>License Details</th>
                <th>License Expiry</th>
                <th>Contact Number</th>
                <th>Safety Score</th>
                <th>Status</th>
                {hasWriteAccess && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan={hasWriteAccess ? 7 : 6} style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
                    No drivers registered matching your search.
                  </td>
                </tr>
              ) : (
                filteredDrivers.map(d => {
                  const expired = isLicenseExpired(d.license_expiry_date);
                  return (
                    <tr key={d.id} style={expired ? { backgroundColor: 'var(--danger-light)' } : {}}>
                      <td style={{ fontWeight: 600 }}>{d.name}</td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{d.license_number}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>Category: {d.license_category}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: expired ? 700 : 500, color: expired ? 'var(--danger)' : 'inherit' }}>
                          <Calendar size={14} />
                          <span>{new Date(d.license_expiry_date).toISOString().split('T')[0]}</span>
                          {expired && <span style={{ fontSize: '11px', textTransform: 'uppercase' }}>(EXPIRED)</span>}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{d.contact_number}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ fontWeight: 700, color: d.safety_score >= 90 ? 'var(--success)' : d.safety_score >= 75 ? 'var(--warning)' : 'var(--danger)' }}>
                            {d.safety_score}%
                          </div>
                          <div className="progress-bar-container" style={{ width: '60px', height: '6px', marginTop: 0 }}>
                            <div 
                              className={`progress-bar-fill ${d.safety_score >= 90 ? 'green' : d.safety_score >= 75 ? 'purple' : 'danger'}`} 
                              style={{ width: `${d.safety_score}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${
                          d.status === 'Available' ? 'badge-success' :
                          d.status === 'On Trip' ? 'badge-info' :
                          d.status === 'Suspended' ? 'badge-danger' : 'badge-warning'
                        }`}>
                          {d.status}
                        </span>
                      </td>
                      {hasWriteAccess && (
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '6px 10px' }}
                              onClick={() => openEditModal(d)}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              className="btn btn-danger" 
                              style={{ padding: '6px 10px' }}
                              onClick={() => handleDelete(d.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
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
              <h3>{editingDriver ? 'Edit Driver Profile' : 'Add New Driver'}</h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Driver Full Name *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Rajesh Kumar" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">License Number (Indian format) *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. DL-0420210123456" 
                      value={licenseNo}
                      onChange={e => setLicenseNo(e.target.value)}
                      required
                    />
                    <small style={{ color: '#64748b', fontSize: '11px' }}>Format: SS-RRYYYYYNNNNNNN</small>
                  </div>

                  <div className="form-group">
                    <label className="form-label">License Category *</label>
                    <select className="form-control" value={licenseCategory} onChange={e => setLicenseCategory(e.target.value)}>
                      <option value="Class A">Class A (Heavy Transport)</option>
                      <option value="Class B">Class B (Commercial Light)</option>
                      <option value="Class C">Class C (LMV/Standard Motor)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">License Expiry Date *</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={licenseExpiry}
                      onChange={e => setLicenseExpiry(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Indian Contact Number (+91) *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. +91 98765 43210" 
                      value={contactNo}
                      onChange={e => setContactNo(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Safety Compliance Score (%)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      placeholder="0-100" 
                      value={safetyScore}
                      onChange={e => setSafetyScore(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Driver Status</label>
                    <select className="form-control" value={status} onChange={e => setStatus(e.target.value)}>
                      <option value="Available">Available</option>
                      <option value="On Trip">On Trip</option>
                      <option value="Off Duty">Off Duty</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Drivers;
