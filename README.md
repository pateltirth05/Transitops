# TransitOps - Smart Transport Operations Platform

TransitOps is a production-grade, highly secure Fleet Management and Trip Dispatching platform built to digitize transport operations, vehicle lifecycles, and driver compliance parameters. 

Designed with an **MVC (Model-View-Controller) Backend** and a dynamic React frontend, the system strictly enforces business validation rules (overweight checks, license expirations, vehicle availability, maintenance state lockdowns) alongside robust security systems (failed login account lockouts and role-based access control).

---

## 🚀 Key Features

### 1. Robust MVC Backend Architecture
* **Config (`config/db.js`)**: Auto-initializes database schemas and seeds default demo data.
* **Controllers**: Decoupled handlers isolating business operations (`auth`, `vehicles`, `drivers`, `trips`, `maintenance`, `expenses`, `settings`).
* **Middlewares**: 
  * JWT authentications and strict Role-Based Access Control (RBAC).
  * Compliance check engines (verifies license validity and vehicle load limitations).
* **Routes**: Modular routing scopes (`authRoutes.js`, `vehicleRoutes.js`, etc.) grouped under standard HTTP verbs.

### 2. Strict Business Rules Engine
* **Safety Lockouts**: Blockades dispatch requests if a driver's license is expired, or if the driver/vehicle is already assigned to an active trip.
* **Maintenance Locks**: Automatically sets a vehicle's status to `In Shop` when a repair ticket is raised, preventing it from being assigned to any dispatch until the ticket is resolved and closed by a manager.
* **Cargo Capacities**: Rejects dispatch scheduling if cargo load weight exceeds a vehicle's max structural limit.

### 3. Dynamic Unit & Currency Converters
* **Distance Formatting**: Real-time conversion between Kilometers (KM) and Miles (mi) using standard mathematical scales (`0.621371`), converting odometer data, trip logs, and stats instantly.
* **Currency Symbols**: Instantly translates financial reports, fuel expenses, and repair costs between Indian Rupees (₹) and US Dollars ($) using a live-simulated exchange scale (`1 USD = 85 INR`).
* **Permissions Summary Matrix**: Visualizes system privileges across employee roles directly on the settings page.

### 4. Enterprise Security Controls
* **Invalid Login Lockout**: Automatically locks user accounts after **5 consecutive failed password attempts**, alerting the user to prevent brute-force entries.
* **Admin Release Control**: Fleet Managers can release and unlock locked employee accounts immediately by typing their email address in the Settings panel.

---

## 🛠️ Technology Stack

* **Frontend**: React (Vite, CSS Variables, Lucide icons, responsive layout)
* **Backend**: Node.js (Express, JWT, Bcrypt.js, CORS)
* **Database**: PostgreSQL (relational schemas with constraints and foreign keys)

---

## ⚙️ Project Installation & Setup

### Prerequisites
* **PostgreSQL** running locally (e.g., via pgAdmin)
* **Node.js** installed (version 16+)

---

### Step 1: Database Setup
Create a PostgreSQL database named `transitops`. 

Update the environment settings inside your backend `.env` file to match your credentials:
```env
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=your_pg_password
PGDATABASE=transitops
JWT_SECRET=supersecretkeyfortransitops
PORT=3000
```

---

### Step 2: Backend Installation & Boot
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install node dependencies:
   ```bash
   npm install
   ```
3. Start the API server:
   ```bash
   npm run dev
   ```
   *Note: On startup, the server will check for tables, build the schema, and seed default profiles.*

---

### Step 3: Frontend Installation & Boot
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install client dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to **`http://localhost:5173`**.

---

## 🔑 Demo Account Credentials

Use the autofill presets on the login screen or enter manually:
1. **Fleet Manager**: `manager@transitops.com` (password: `password123`) — *Full CRUD and access to all screens/configurations.*
2. **Driver**: `driver@transitops.com` (password: `password123`) — *Accesses dispatches, marks deliveries completed, views registry logs (read-only).*
3. **Safety Officer**: `safety@transitops.com` (password: `password123`) — *Accesses Drivers Profiles and Vehicles Registry.*
4. **Financial Analyst**: `finance@transitops.com` (password: `password123`) — *Accesses Fuel logs, Expenses register, and ROI Reports.*

---

## 🧪 Testing Verification Guide

### 1. Test Login Account Lockout
* Go to the login screen.
* Enter a preset email (e.g. `driver@transitops.com`) and type a **wrong password**.
* Submit 5 times. On the 5th attempt, the system locks the account.
* Try logging in with the correct password now — access will be blocked with a locked warning.
* Log in as the **Fleet Manager** on a different browser/tab. Go to **Settings & RBAC**, type `driver@transitops.com` under **Unlock User Accounts**, and click **Unlock**. The driver can now sign in successfully!

### 2. Test Dynamic Settings Converter
* Log in as the **Fleet Manager**.
* Navigate to **Settings & RBAC**.
* Toggle **Distance Unit** to `Miles` and **Currency** to `USD`. Click **Save Configuration**.
* Navigate back to **Dashboard**, **Vehicles**, or **Reports** and watch every distance unit convert to `mi` and every monetary valuation convert to `$` instantly!

### 3. Test Trip Validation Errors
* Log in as the **Fleet Manager**.
* Go to **Trip Dispatcher** and click **Draft Trip**.
* Select a vehicle marked **In Shop** (e.g. `HR-55-AA-7722`) or try assigning cargo weight that exceeds the vehicle's capacity.
* The compliance review page will instantly list the violations and block the **Confirm & Dispatch** action, preventing unsafe operations.
