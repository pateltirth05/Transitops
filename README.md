 🚛 TransitOps - Smart Transport Operations Platform

A modern Transport Operations Management System built for the **Odoo Hackathon 2026**.

TransitOps helps organizations digitize their fleet operations by providing a centralized platform to manage vehicles, drivers, trips, maintenance, fuel consumption, operational expenses, and analytics.

---

## 📖 Overview

Many logistics companies still rely on spreadsheets and manual processes to manage transport operations, resulting in:

- Scheduling conflicts
- Underutilized vehicles
- Missed maintenance
- Expired driver licenses
- Inaccurate expense tracking
- Poor operational visibility

TransitOps addresses these challenges through an integrated web platform featuring real-time fleet monitoring, workflow automation, and operational insights.

---

## ✨ Features

### Authentication & RBAC
- Secure Login
- JWT Authentication
- Role-Based Access Control
- Protected Routes

### Dashboard
- Fleet KPIs
- Active Trips
- Fleet Utilization
- Vehicle Status Overview
- Charts & Analytics

### Vehicle Management
- Vehicle Registration
- Vehicle Lifecycle Management
- Status Tracking
- Capacity Management

### Driver Management
- Driver Profiles
- License Validation
- Safety Scores
- Driver Availability

### Trip Management
- Trip Creation
- Vehicle Assignment
- Driver Assignment
- Dispatch Workflow
- Trip Completion
- Cargo Validation

### Maintenance
- Maintenance Logs
- Service History
- Automatic Vehicle Status Updates

### Fuel & Expense Management
- Fuel Logs
- Operational Expenses
- Maintenance Costs
- Cost Tracking

### Reports & Analytics
- Fleet Utilization
- Fuel Efficiency
- Vehicle ROI
- Operational Cost Analysis
- CSV Export

---

## 🛠 Tech Stack

### Frontend
- NextJs

### Backend
- JWT Authentication
- Prisma ORM

### Database
- PostgreSQL

---

## 📂 Project Structure

```
TransitOps/
│
├── client/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── validations/
│   │
│   ├── prisma/
│   └── package.json
│
└── README.md
```

---

## 🚀 Core Modules

- Authentication
- Dashboard
- Vehicle Registry
- Driver Management
- Trip Management
- Maintenance
- Fuel Logs
- Expense Management
- Reports & Analytics

---

## 🔄 Workflow

```text
Vehicle Registration
        │
        ▼
Driver Registration
        │
        ▼
Create Trip
        │
        ▼
Validate Capacity
        │
        ▼
Dispatch Trip
        │
        ▼
Vehicle → On Trip
Driver → On Trip
        │
        ▼
Complete Trip
        │
        ▼
Vehicle → Available
Driver → Available
        │
        ▼
Maintenance
        │
        ▼
Vehicle → In Shop
```

---

## 🔒 Business Rules

- Unique vehicle registration numbers
- Prevent double vehicle assignment
- Prevent double driver assignment
- License expiry validation
- Cargo weight validation
- Automatic vehicle status transitions
- Automatic driver status transitions
- Maintenance workflow
- Operational cost calculation
- Fleet utilization tracking

---

## 📊 Dashboard KPIs

- Active Vehicles
- Available Vehicles
- Vehicles in Maintenance
- Active Trips
- Pending Trips
- Drivers On Duty
- Fleet Utilization
- Fuel Consumption
- Operational Cost

---

## 🎯 Project Goals

- Clean architecture
- Responsive UI
- Secure authentication
- Real-time dashboard
- Scalable backend
- Production-ready codebase

---

## 👥 Team

Developed as part of the **Odoo Hackathon 2026**.

---

## 📄 License

This project is developed for educational and hackathon purposes.