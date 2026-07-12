import React, { useState } from 'react';
import { Play, Check, X, AlertTriangle, AlertCircle, MapPin, Truck, User } from 'lucide-react';

function Trips({ trips, vehicles, drivers, fetchWithAuth, showToast, refreshAllData, user, formatDistance, formatCurrency }) {
  // Form states
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [cargoWeight, setCargoWeight] = useState('');
  const [plannedDistance, setPlannedDistance] = useState('');

  // Dispatch wizard state
  const [step, setStep] = useState(1); // 1 = Draft details, 2 = Validation Review

  // Completion modal state
  const [completingTrip, setCompletingTrip] = useState(null);
  const [actualDistance, setActualDistance] = useState('');
  const [fuelConsumed, setFuelConsumed] = useState('');
  const [finalOdometer, setFinalOdometer] = useState('');

  const canWrite = user?.role === 'fleet_manager' || user?.role === 'driver';

  const getVehicleDetails = (id) => vehicles.find(v => v.id === parseInt(id));
  const getDriverDetails = (id) => drivers.find(d => d.id === parseInt(id));

  // Client side validation checks (highly reactive)
  const activeVehicle = getVehicleDetails(selectedVehicleId);
  const activeDriver = getDriverDetails(selectedDriverId);

  const isOverweight = activeVehicle && parseFloat(cargoWeight) > parseFloat(activeVehicle.max_load_capacity);
  
  const isLicenseExpired = (expiryDateStr) => {
    if (!expiryDateStr) return false;
    const expiry = new Date(expiryDateStr);
    const today = new Date();
    today.setHours(0,0,0,0);
    expiry.setHours(0,0,0,0);
    return expiry < today;
  };

  const isDriverSuspended = activeDriver?.status === 'Suspended';
  const isDriverExpired = activeDriver && isLicenseExpired(activeDriver.license_expiry_date);
  const isDriverBusy = activeDriver?.status === 'On Trip';
  
  const isVehicleBusy = activeVehicle?.status === 'On Trip';
  const isVehicleInShop = activeVehicle?.status === 'In Shop';
  const isVehicleRetired = activeVehicle?.status === 'Retired';

  const hasValidationErrors = 
    isOverweight || 
    isDriverSuspended || 
    isDriverExpired || 
    isDriverBusy || 
    isVehicleBusy || 
    isVehicleInShop || 
    isVehicleRetired;

  const handleCreateDraft = async (e) => {
    e.preventDefault();
    if (!source || !destination || !selectedVehicleId || !selectedDriverId || !cargoWeight || !plannedDistance) {
      return showToast('Please complete the dispatch form details', 'warning');
    }

    if (isOverweight) {
      return showToast('Cannot create draft: Cargo weight exceeds capacity', 'danger');
    }

    const payload = {
      source,
      destination,
      vehicle_id: parseInt(selectedVehicleId),
      driver_id: parseInt(selectedDriverId),
      cargo_weight: parseFloat(cargoWeight),
      planned_distance: parseFloat(plannedDistance)
    };

    const res = await fetchWithAuth('/trips', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (res) {
      showToast('Trip Draft created successfully', 'success');
      setStep(2);
      refreshAllData();
    }
  };

  const handleDispatch = async (tripId) => {
    const res = await fetchWithAuth(`/trips/${tripId}/dispatch`, {
      method: 'POST'
    });

    if (res) {
      showToast('Trip Dispatched! Vehicle and driver are now marked On Trip.', 'success');
      refreshAllData();
      resetWizard();
    }
  };

  const handleCancelTrip = async (tripId) => {
    if (!window.confirm('Are you sure you want to cancel this trip?')) return;
    const res = await fetchWithAuth(`/trips/${tripId}/cancel`, {
      method: 'POST'
    });
    if (res) {
      showToast('Trip status marked as Cancelled.', 'info');
      refreshAllData();
    }
  };

  const openCompletionModal = (trip) => {
    const veh = getVehicleDetails(trip.vehicle_id);
    setCompletingTrip(trip);
    setActualDistance(trip.planned_distance); 
    setFuelConsumed('');
    setFinalOdometer(veh ? (parseFloat(veh.odometer) + parseFloat(trip.planned_distance)).toString() : '');
  };

  const handleCompleteTrip = async (e) => {
    e.preventDefault();
    if (!actualDistance || !fuelConsumed || !finalOdometer) {
      return showToast('Please enter all completion values', 'warning');
    }

    const veh = getVehicleDetails(completingTrip.vehicle_id);
    if (veh && parseFloat(finalOdometer) < parseFloat(veh.odometer)) {
      return showToast(`Final odometer cannot be less than vehicle's current odometer (${veh.odometer} km).`, 'danger');
    }

    const payload = {
      actual_distance: parseFloat(actualDistance),
      fuel_consumed: parseFloat(fuelConsumed),
      final_odometer: parseFloat(finalOdometer)
    };

    const res = await fetchWithAuth(`/trips/${completingTrip.id}/complete`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (res) {
      showToast('Trip Completed! Vehicle metrics and fuel logs updated.', 'success');
      setCompletingTrip(null);
      refreshAllData();
    }
  };

  const resetWizard = () => {
    setSource('');
    setDestination('');
    setSelectedVehicleId('');
    setSelectedDriverId('');
    setCargoWeight('');
    setPlannedDistance('');
    setStep(1);
  };

  return (
    <div>
      <div className="content-header">
        <div className="header-title">
          <h1>Trip Dispatcher</h1>
          <p>Create dispatches, double check driver license compliance, and track active deliveries.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Left Side: Create & Dispatch Panel */}
        <div className="card-section">
          <div className="card-header">
            <h3 className="card-title">Schedule New Dispatch</h3>
            {step === 2 && <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={resetWizard}>Back to Form</button>}
          </div>

          <div style={{ padding: '24px' }}>
            {/* Steps indicator */}
            <div className="wizard-steps">
              <div className={`wizard-step ${step === 1 ? 'active' : 'completed'}`}>
                <div className="wizard-step-circle">1</div>
                <div className="wizard-step-label">Draft Details</div>
              </div>
              <div className={`wizard-step ${step === 2 ? 'active' : ''}`}>
                <div className="wizard-step-circle">2</div>
                <div className="wizard-step-label">Compliance Review</div>
              </div>
            </div>

            {!canWrite ? (
              <div className="danger-box">
                <AlertCircle size={20} />
                <div>
                  <strong>Access Restricted</strong>
                  <p>Your current account role does not have authorization to dispatch new trips. Fleet Manager or Driver account required.</p>
                </div>
              </div>
            ) : step === 1 ? (
              <form onSubmit={handleCreateDraft}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Source City *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. Mumbai, MH" 
                      value={source} 
                      onChange={e => setSource(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Destination City *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. Pune, MH" 
                      value={destination} 
                      onChange={e => setDestination(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Assign Vehicle *</label>
                    <select className="form-control" value={selectedVehicleId} onChange={e => setSelectedVehicleId(e.target.value)} required>
                      <option value="">-- Choose Available Vehicle --</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id} disabled={v.status !== 'Available'}>
                          {v.registration_number} - {v.name_model} ({v.status})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Assign Driver *</label>
                    <select className="form-control" value={selectedDriverId} onChange={e => setSelectedDriverId(e.target.value)} required>
                      <option value="">-- Choose Available Driver --</option>
                      {drivers.map(d => (
                        <option key={d.id} value={d.id} disabled={d.status !== 'Available' || isLicenseExpired(d.license_expiry_date)}>
                          {d.name} ({d.status === 'Available' && isLicenseExpired(d.license_expiry_date) ? 'License Expired' : d.status})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Cargo Weight (kg) *</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      placeholder="e.g. 450" 
                      value={cargoWeight} 
                      onChange={e => setCargoWeight(e.target.value)} 
                      required 
                    />
                    {activeVehicle && (
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                        Vehicle Maximum Capacity: <strong>{activeVehicle.max_load_capacity} kg</strong>
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Planned Distance (km) *</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      placeholder="e.g. 350" 
                      value={plannedDistance} 
                      onChange={e => setPlannedDistance(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                {isOverweight && (
                  <div className="danger-box">
                    <AlertCircle size={18} />
                    <span><strong>Weight Violation:</strong> Cargo weight exceeds selected vehicle load capacity ({activeVehicle.max_load_capacity} kg). Dispatch disabled.</span>
                  </div>
                )}

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isOverweight}>
                  Create Trip Draft
                </button>
              </form>
            ) : (
              // Step 2: Preview & Dispatch
              <div>
                <h4 style={{ marginBottom: '16px', fontWeight: 600 }}>Review Dispatch Compliance Rules</h4>
                
                <div style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '24px', backgroundColor: '#f8fafc' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <MapPin size={18} className="text-info" />
                    <span>Route: <strong>{source}</strong> to <strong>{destination}</strong> ({formatDistance(plannedDistance)})</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <Truck size={18} className="text-info" />
                    <span>Vehicle: <strong>{activeVehicle?.registration_number}</strong> (Max load capacity: {activeVehicle?.max_load_capacity} kg)</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <User size={18} className="text-info" />
                    <span>Driver: <strong>{activeDriver?.name}</strong> (License Expiry: {activeDriver?.license_expiry_date?.split('T')[0]})</span>
                  </div>
                </div>

                {hasValidationErrors ? (
                  <div className="danger-box">
                    <AlertTriangle size={20} />
                    <div>
                      <strong>Compliance Failure:</strong>
                      <ul style={{ paddingLeft: '20px', marginTop: '6px', fontSize: '13px' }}>
                        {isOverweight && <li>Cargo weight exceeds vehicle capacity.</li>}
                        {isDriverExpired && <li>Driver license is expired.</li>}
                        {isDriverSuspended && <li>Driver status is Suspended.</li>}
                        {isDriverBusy && <li>Driver is currently on another trip.</li>}
                        {isVehicleBusy && <li>Vehicle is currently on another trip.</li>}
                        {isVehicleInShop && <li>Vehicle is in maintenance shop.</li>}
                        {isVehicleRetired && <li>Vehicle has been retired from active duty.</li>}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="toast success" style={{ width: '100%', marginBottom: '20px', boxShadow: 'none', border: '1px solid #a7f3d0' }}>
                    <Check size={20} className="text-success" />
                    <span className="toast-message" style={{ color: '#065f46' }}>All business validations passed. Ready to dispatch.</span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={resetWizard}>Reset</button>
                  <button 
                    className="btn btn-primary" 
                    style={{ flex: 2 }}
                    disabled={hasValidationErrors}
                    onClick={() => {
                      const latestTrip = trips[0]; 
                      if (latestTrip && latestTrip.status === 'Draft') {
                        handleDispatch(latestTrip.id);
                      } else {
                        showToast('Error finding latest trip draft', 'danger');
                      }
                    }}
                  >
                    Confirm & Dispatch
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Active/Recent Dispatch List */}
        <div className="card-section">
          <div className="card-header">
            <h3 className="card-title">Dispatch Operations Log</h3>
          </div>

          <div style={{ padding: '24px' }}>
            {trips.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>No active dispatches.</div>
            ) : (
              <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
                {trips.map(trip => (
                  <div key={trip.id} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', backgroundColor: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span className="badge badge-info" style={{ 
                        backgroundColor: trip.status === 'Completed' ? 'var(--success-light)' : 
                                        trip.status === 'Dispatched' ? 'var(--info-light)' :
                                        trip.status === 'Cancelled' ? 'var(--danger-light)' : 'var(--warning-light)',
                        color: trip.status === 'Completed' ? 'var(--success)' : 
                               trip.status === 'Dispatched' ? 'var(--info)' :
                               trip.status === 'Cancelled' ? 'var(--danger)' : 'var(--warning)'
                      }}>
                        {trip.status}
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>Trip #{trip.id}</span>
                    </div>

                    <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>{trip.source} → {trip.destination}</div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                      Cargo: <strong>{trip.cargo_weight} kg</strong> | Distance: <strong>{formatDistance(trip.planned_distance)}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                      <span>Reg: <strong>{trip.vehicle_reg}</strong></span>
                      <span>Driver: <strong>{trip.driver_name}</strong></span>
                    </div>

                    {trip.status === 'Draft' && canWrite && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '13px', flex: 1 }} onClick={() => handleDispatch(trip.id)}>
                          <Play size={14} /> Dispatch
                        </button>
                        <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={() => handleCancelTrip(trip.id)}>
                          Cancel
                        </button>
                      </div>
                    )}

                    {trip.status === 'Dispatched' && canWrite && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '13px', backgroundColor: 'var(--success)', flex: 1 }} onClick={() => openCompletionModal(trip)}>
                          <Check size={14} /> Complete Trip
                        </button>
                        <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={() => handleCancelTrip(trip.id)}>
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Completion Modal */}
      {completingTrip && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Complete Delivery: Trip #{completingTrip.id}</h3>
              <button className="modal-close-btn" onClick={() => setCompletingTrip(null)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCompleteTrip}>
              <div className="modal-body">
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', padding: '12px', backgroundColor: 'var(--success-light)', borderRadius: '8px', color: '#065f46', fontSize: '14px' }}>
                  <Check size={18} />
                  <span>Entering details will restore vehicle <strong>{completingTrip.vehicle_reg}</strong> and driver <strong>{completingTrip.driver_name}</strong> to <strong>Available</strong>.</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Actual Odometer Reading (km) *</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={finalOdometer} 
                    onChange={e => setFinalOdometer(e.target.value)} 
                    placeholder="Enter final vehicle odometer reading"
                    required 
                  />
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    Current vehicle odometer reading is: <strong>{formatDistance(getVehicleDetails(completingTrip.vehicle_id)?.odometer)}</strong>. Value must be equal or higher.
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Actual Distance Driven (km) *</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={actualDistance} 
                      onChange={e => setActualDistance(e.target.value)} 
                      required 
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Fuel Consumed (Liters) *</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={fuelConsumed} 
                      onChange={e => setFuelConsumed(e.target.value)} 
                      placeholder="e.g. 45"
                      required 
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setCompletingTrip(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--success)' }}>Complete & Log Metrics</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Trips;
