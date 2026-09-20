# Betoch (ቤቶች)

> **"Find a place you can trust."**  
> High-performance, production-grade residential home rental marketplace designed for Ethiopia and emerging markets.

[![CI Pipeline](https://github.com/Ezradestaw/Betoch/actions/workflows/ci.yml/badge.svg)](https://github.com/Ezradestaw/Betoch/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![PostgreSQL 18](https://img.shields.io/badge/PostgreSQL-18-blue.svg)](https://www.postgresql.org/)
[![Node.js 20 LTS](https://img.shields.io/badge/Node.js-20_LTS-green.svg)](https://nodejs.org/)
[![Fastify](https://img.shields.io/badge/Backend-Fastify-black.svg)](https://www.fastify.io/)
[![React 18](https://img.shields.io/badge/Frontend-React_18-cyan.svg)](https://reactjs.org/)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict_Mode-blue.svg)](https://www.typescriptlang.org/)

---

## 1. Overview & Ethiopian Market Solution

In urban Ethiopia (particularly Addis Ababa), the residential rental process has historically been monopolized by informal street brokers (*Delalas*). This created widespread friction:
- **Ghost Listings & Advance Deposit Scams:** Phantom houses listed with fake photos, asking for viewing fees or illegal deposits.
- **Excessive Broker Fees:** Informants demanding 50% to 100% of the first month's rent without legal recourse or contract guarantees.
- **Arbitrary Deposit Demands:** Demands for 6 to 12 months' rent in advance, causing housing lockouts.

**Betoch** transforms this market by introducing:
1. **Title Deed & Ownership Verification (*Carta*):** Eliminates ghost listings through human & document verification.
2. **Fayda National Digital ID Integration (FIN):** Authenticates landlords and tenants with cryptographic duplicate protection.
3. **Proclamation No. 1320/2024 Compliance:** Advance deposits are capped at a maximum of **2 months' rent**, and lease agreements are formatted for mandatory Woreda Housing office registration.
4. **Transparent Platform Commission:** Configurable 10% platform fee, saving landlords up to 80% compared to informal brokers.
5. **Telebirr & CBE Digital Payments:** Cryptographic RSA SHA256 payment initiation, webhook verification, and simulated sandbox testing.

---

## 2. Architecture & Monorepo Structure

```text
betoch/
├── apps/
│   ├── web/                     # React 18 + TypeScript + Vite + Tailwind CSS SPA
│   └── api/                     # Node.js 20 + Fastify + TypeScript modular monolith
├── packages/
│   ├── shared/                  # Domain types, Enums, Addis Ababa sub-cities, amenities
│   ├── validation/              # Zod schemas for forms, APIs, and legal constraints
│   └── config/                  # Validated environment configuration
├── database/
│   ├── migrations/              # PostgreSQL 18 schema migration scripts
│   └── seeds/                   # Realistic Ethiopian seed data (users, listings, contracts)
├── docs/                        # In-depth architectural & operational manuals
├── infrastructure/              # Dockerfiles, Nginx configurations, deployment manifests
├── tests/                       # Automated test suite (Commissions, Telebirr, Zod)
├── .github/workflows/           # CI/CD test and build pipelines
├── docker-compose.yml           # Multi-container local/production orchestration
└── package.json                 # Workspace orchestrator
```

---

## 3. Quick Start (Local Development)

### Prerequisites
- Node.js 20 LTS or higher
- PostgreSQL 18+ (or Docker)
- Git

### Installation & Run

```bash
# 1. Clone the repository
git clone git@github.com:Ezradestaw/Betoch.git
cd Betoch

# 2. Install workspace dependencies
npm install

# 3. Setup environment configuration
cp .env.example .env

# 4. Run database migrations and realistic Ethiopian seed data
npm run db:migrate
npm run db:seed

# 5. Run automated test suite
npm test

# 6. Start development servers (API on 4000, Web on 5173)
npm run dev
```

Visit the application at `http://localhost:5173`.  
Explore interactive OpenAPI / Swagger documentation at `http://localhost:4000/documentation`.

---

## 4. Default Demo Evaluation Accounts

All seeded accounts have the default password: `Password123!`

| Role | Email | Phone | Verification Status | Features |
| :--- | :--- | :--- | :--- | :--- |
| **Platform Admin** | `admin@betoch.et` | `+251911000001` | **VERIFIED** | Verification queues, analytics, audit trail, reports |
| **Verified Owner** | `owner@betoch.et` | `+251911223344` | **VERIFIED** | Active listings, application approvals, lease completion |
| **Verified Renter** | `renter@betoch.et` | `+251922334455` | **VERIFIED** | Saved homes, rental applications, in-app messaging |

---

## 5. Automated Testing

The platform includes comprehensive test suites covering:
- **Commission Calculations:** Verified 10% platform fee, rounding accuracy, and currency formatting.
- **Rent Control Proclamation 1320/2024:** Enforces rejection of deposits exceeding 2 months' rent.
- **Telebirr RSA Signing:** Validates SHA256 cryptographic signatures and rejects tampered webhooks.
- **Input Validation:** Ethiopian phone format checking (`+251 9...` / `09...`) and password strength.

Run the tests at any time:
```bash
npm test
```

---

## 6. Documentation Index

- [Architecture Guide (ARCHITECTURE.md)](docs/ARCHITECTURE.md)
- [Security & OWASP Assessment (SECURITY.md)](docs/SECURITY.md)
- [Threat Model (THREAT_MODEL.md)](docs/THREAT_MODEL.md)
- [Database Schema & ERD (DATABASE.md)](docs/DATABASE.md)
- [REST API Specification (API.md)](docs/API.md)
- [Production Deployment Guide (DEPLOYMENT.md)](docs/DEPLOYMENT.md)
- [Contributing Guidelines (CONTRIBUTING.md)](docs/CONTRIBUTING.md)
