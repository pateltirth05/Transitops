import React, { useState } from 'react';
import { 
  Truck, 
  MapPin, 
  Users, 
  Wrench, 
  Percent, 
  Map
} from 'lucide-react';
import { formatRupee } from '../App';

function Dashboard({ stats, trips, vehicles, drivers, refreshAllData, user, formatDistance, formatCurrency }) {
  const [regionFilter, setRegionFilter] = useState('All');

  if (!stats) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>Syncing dashboard data...</div>;
  }

  // Calculate region-specific metrics if a filter is set
  const filteredVehicles = vehicles.filter(v => regionFilter === 'All' || v.region === regionFilter);
  const totalV = filteredVehicles.length;
  const activeV = filteredVehicles.filter(v => v.status === 'On Trip').length;
  const availableV = filteredVehicles.filter(v => v.status === 'Available').length;
  const inShopV = filteredVehicles.filter(v => v.status === 'In Shop').length;

  const fleetUtilization = totalV > 0 ? Math.round((activeV / totalV) * 100) : 0;

  // Filter recent dispatches by vehicle region if needed
  const filteredTrips = trips.filter(t => {
    if (regionFilter === 'All') return true;
    const v = vehicles.find(veh => veh.id === t.vehicle_id);
    return v && v.region === regionFilter;
  });

  return (
    <div>
      <div className="content-header">
        <div className="header-title">
          <h1>Dashboard Overview</h1>
          <p>Real-time analytics, compliance counters, and regional fleet tracking.</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Map size={18} className="text-medium" />
          <span style={{ fontSize: '14px', fontWeight: 600 }}>Filter Region:</span>
          <select 
            className="filter-select" 
            value={regionFilter} 
            onChange={e => setRegionFilter(e.target.value)}
            style={{ fontWeight: 600, border: '1px solid var(--primary)' }}
          >
            <option value="All">All India</option>
            <option value="North">North Region</option>
            <option value="South">South Region</option>
            <option value="East">East Region</option>
            <option value="West">West Region</option>
          </select>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Fleet Utilization ({regionFilter})</span>
            <div className="stat-icon-wrapper purple">
              <Percent size={20} />
            </div>
          </div>
          <span className="stat-value">{fleetUtilization}%</span>
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill purple" 
              style={{ width: `${fleetUtilization}%` }}
            ></div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Active Dispatches</span>
            <div className="stat-icon-wrapper blue">
              <MapPin size={20} />
            </div>
          </div>
          <span className="stat-value">
            {regionFilter === 'All' ? stats.activeTrips : filteredTrips.filter(t => t.status === 'Dispatched').length}
          </span>
          <span style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
            {regionFilter === 'All' ? stats.pendingTrips : filteredTrips.filter(t => t.status === 'Draft').length} draft bookings
          </span>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Vehicles Registry ({regionFilter})</span>
            <div className="stat-icon-wrapper green">
              <Truck size={20} />
            </div>
          </div>
          <span className="stat-value">{activeV} / {totalV}</span>
          <span style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
            {availableV} available, {inShopV} in workshop
          </span>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Active Drivers</span>
            <div className="stat-icon-wrapper orange">
              <Users size={20} />
            </div>
          </div>
          <span className="stat-value">{stats.driversOnDuty} / {stats.totalDrivers}</span>
          <span style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>Total compliant workforce</span>
        </div>
      </div>

      {/* Dashboard Analytics & Recent Dispatches */}
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-title-row">
            <h3 className="card-title">Recent Trips & Statuses ({regionFilter})</h3>
            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={refreshAllData}>Sync Data</button>
          </div>

          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Route</th>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Cargo Weight</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrips.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: '#64748b', padding: '24px' }}>
                      No dispatches recorded for this region selection.
                    </td>
                  </tr>
                ) : (
                  filteredTrips.slice(0, 5).map(trip => (
                    <tr key={trip.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{trip.source} → {trip.destination}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{formatDistance(trip.planned_distance)}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{trip.vehicle_reg}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{trip.vehicle_name}</div>
                      </td>
                      <td>{trip.driver_name}</td>
                      <td>{trip.cargo_weight} kg</td>
                      <td>
                        <span className={`badge ${
                          trip.status === 'Completed' ? 'badge-success' :
                          trip.status === 'Dispatched' ? 'badge-info' :
                          trip.status === 'Cancelled' ? 'badge-danger' : 'badge-warning'
                        }`}>
                          {trip.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Breakdown bar chart */}
        <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 className="card-title" style={{ marginBottom: '16px' }}>Status Breakdown ({regionFilter})</h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>Visual count of vehicles per state:</p>
          </div>

          <div className="chart-container">
            <div className="chart-bar-wrapper">
              <div className="chart-bar" style={{ 
                height: `${totalV > 0 ? (availableV / totalV) * 100 : 0}%`, 
                backgroundColor: 'var(--success)' 
              }}>
                <div className="chart-tooltip">Available: {availableV}</div>
              </div>
              <span className="chart-label">Available</span>
            </div>

            <div className="chart-bar-wrapper">
              <div className="chart-bar" style={{ 
                height: `${totalV > 0 ? (activeV / totalV) * 100 : 0}%`, 
                backgroundColor: 'var(--info)' 
              }}>
                <div className="chart-tooltip">On Trip: {activeV}</div>
              </div>
              <span className="chart-label">On Trip</span>
            </div>

            <div className="chart-bar-wrapper">
              <div className="chart-bar" style={{ 
                height: `${totalV > 0 ? (inShopV / totalV) * 100 : 0}%`, 
                backgroundColor: 'var(--warning)' 
              }}>
                <div className="chart-tooltip">In Shop: {inShopV}</div>
              </div>
              <span className="chart-label">In Shop</span>
            </div>

            <div className="chart-bar-wrapper">
              <div className="chart-bar" style={{ 
                height: `${totalV > 0 ? ((totalV - availableV - activeV - inShopV) / totalV) * 100 : 0}%`, 
                backgroundColor: 'var(--danger)' 
              }}>
                <div className="chart-tooltip">Retired: {totalV - availableV - activeV - inShopV}</div>
              </div>
              <span className="chart-label">Retired</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
