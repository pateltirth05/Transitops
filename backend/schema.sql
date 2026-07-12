-- TransitOps Schema (Indian Format with Security Logs)

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'fleet_manager', 'driver', 'safety_officer', 'financial_analyst'
    failed_attempts INT DEFAULT 0,
    is_locked BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    name_model VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'Truck', 'Van', 'Car', 'Semi-Trailer'
    max_load_capacity DECIMAL(10, 2) NOT NULL, -- in kg
    odometer DECIMAL(12, 2) NOT NULL DEFAULT 0.0, -- in km
    acquisition_cost DECIMAL(12, 2) NOT NULL DEFAULT 0.0, -- in ₹
    region VARCHAR(50) NOT NULL DEFAULT 'North', -- 'North', 'South', 'East', 'West'
    status VARCHAR(50) NOT NULL DEFAULT 'Available' -- 'Available', 'On Trip', 'In Shop', 'Retired'
);

CREATE TABLE IF NOT EXISTS drivers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    license_category VARCHAR(10) NOT NULL,
    license_expiry_date DATE NOT NULL,
    contact_number VARCHAR(20) NOT NULL, -- Indian Mobile: +91 98765 43210
    safety_score DECIMAL(5, 2) NOT NULL DEFAULT 100.00,
    status VARCHAR(50) NOT NULL DEFAULT 'Available' -- 'Available', 'On Trip', 'Off Duty', 'Suspended'
);

CREATE TABLE IF NOT EXISTS trips (
    id SERIAL PRIMARY KEY,
    source VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    vehicle_id INT REFERENCES vehicles(id) ON DELETE SET NULL,
    driver_id INT REFERENCES drivers(id) ON DELETE SET NULL,
    cargo_weight DECIMAL(10, 2) NOT NULL,
    planned_distance DECIMAL(10, 2) NOT NULL,
    actual_distance DECIMAL(10, 2),
    fuel_consumed DECIMAL(10, 2), -- in liters
    status VARCHAR(50) NOT NULL DEFAULT 'Draft', -- 'Draft', 'Dispatched', 'Completed', 'Cancelled'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS maintenance_logs (
    id SERIAL PRIMARY KEY,
    vehicle_id INT REFERENCES vehicles(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    cost DECIMAL(10, 2) NOT NULL DEFAULT 0.0,
    status VARCHAR(50) NOT NULL DEFAULT 'Active', -- 'Active', 'Completed'
    created_at DATE NOT NULL DEFAULT CURRENT_DATE,
    completed_at DATE
);

CREATE TABLE IF NOT EXISTS fuel_logs (
    id SERIAL PRIMARY KEY,
    vehicle_id INT REFERENCES vehicles(id) ON DELETE CASCADE,
    liters DECIMAL(10, 2) NOT NULL,
    cost DECIMAL(10, 2) NOT NULL,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    vehicle_id INT REFERENCES vehicles(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL, -- 'Toll', 'Insurance', 'Tax', 'Other'
    amount DECIMAL(10, 2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    description VARCHAR(255)
);

-- Store general app configuration settings
CREATE TABLE IF NOT EXISTS app_settings (
    id SERIAL PRIMARY KEY,
    depot_name VARCHAR(100) NOT NULL DEFAULT 'Mumbai Central Depot',
    distance_unit VARCHAR(10) NOT NULL DEFAULT 'KM', -- 'KM', 'Miles'
    currency VARCHAR(10) NOT NULL DEFAULT 'INR' -- 'INR', 'USD'
);
