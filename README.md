# Mini ERP + CRM Operations Portal

A Full-Stack Mini ERP & CRM Operations Portal built strictly according to the specifications, fields, roles, business logic, and deliverables outlined in the **Full Stack Developer Case Study**.

---

## 🚀 Architecture Summary

The repository is cleanly divided into two subdirectories:

```text
/ (workspace root)
├── backend/                  # Express.js + TypeScript + Prisma ORM REST API
│   ├── src/
│   │   ├── config/           # Environment & Prisma client singletons
│   │   ├── controllers/      # Handlers for Auth, Customers, Products & Challans
│   │   ├── middlewares/      # JWT Authentication & RBAC authorization
│   │   ├── routes/           # REST API Route definitions
│   │   ├── types/            # TypeScript interface definitions & Express extensions
│   │   ├── app.ts            # Express App configuration
│   │   └── server.ts         # Server entrypoint (Port 5000)
│   ├── prisma/
│   │   ├── schema.prisma     # SQLite/PostgreSQL Database Schema
│   │   └── seed.ts           # Database Seed Script for 4 roles & test data
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                 # React + TypeScript + Vite Single Page Application
│   ├── src/
│   │   ├── components/       # Layout, Modals (Customer, Product, Stock, Challan)
│   │   ├── context/          # AuthContext session & JWT state management
│   │   ├── pages/            # Login, Customer CRM, Inventory & Sales Challans pages
│   │   ├── services/         # Fetch API client with Bearer Token interceptor
│   │   ├── styles/           # Modern Glassmorphic CSS design system
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
├── postman_collection.json   # Exported Postman API collection for all endpoints
└── README.md                 # Setup & documentation guide
```

---

## 🔑 Pre-Seeded Test Credentials

All test user accounts use the default password: **`password123`**

| Role | Email | Name | System Permissions Summary |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@company.com` | System Admin | Full access to all modules, settings, and transactions |
| **Sales** | `sales@company.com` | Sales Executive | Manage Customers, Add Follow-ups, Create & Confirm Sales Challans |
| **Warehouse** | `warehouse@company.com` | Warehouse Manager | Manage Products, Minimum stock alerts, Manual Stock IN/OUT |
| **Accounts** | `accounts@company.com` | Accounts Specialist | Read-only access across Customers, Inventory, and Sales Challans |

---

## 🛡️ Role-Based Access Control (RBAC) Matrix

| Module / Endpoint | Admin | Sales | Warehouse | Accounts |
| :--- | :---: | :---: | :---: | :---: |
| **POST /api/auth/login** | ✅ | ✅ | ✅ | ✅ |
| **GET /api/customers** | ✅ Read | ✅ Read | ✅ Read | ✅ Read |
| **POST / PUT /api/customers** | ✅ Write | ✅ Write | ❌ Denied | ❌ Denied |
| **POST /api/customers/:id/follow-ups** | ✅ Write | ✅ Write | ❌ Denied | ❌ Denied |
| **GET /api/products** | ✅ Read | ✅ Read | ✅ Read | ✅ Read |
| **POST / PUT /api/products** | ✅ Write | ❌ Denied | ✅ Write | ❌ Denied |
| **POST /api/products/:id/stock** | ✅ Write | ❌ Denied | ✅ Write | ❌ Denied |
| **GET /api/sales-challans** | ✅ Read | ✅ Read | ✅ Read | ✅ Read |
| **POST / PUT /api/sales-challans** | ✅ Write | ✅ Write | ❌ Denied | ❌ Denied |

---

## ⚡ Quick Start & Local Setup

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm or yarn

---

### Step 1: Backend Setup & Database Initialization

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Environment Variables (`backend/.env`):
   ```env
   PORT=5000
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="mini_erp_crm_super_secret_jwt_key_2026"
   JWT_EXPIRES_IN="7d"
   ```

4. Push database schema and generate Prisma client:
   ```bash
   npx prisma db push
   ```

5. Seed database with test users for all 4 roles, customers, products, and challans:
   ```bash
   npm run seed
   ```

6. Start the Backend Development Server:
   ```bash
   npm run dev
   ```
   The backend API will run on **`http://localhost:5000`**.

---

### Step 2: Frontend Setup

1. In a new terminal window, navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Frontend Development Server:
   ```bash
   npm run dev
   ```
   The frontend UI will run on **`http://localhost:3000`**.

---

## 💼 Business Logic Highlights

1. **Snapshot Pricing Retention on Sales Challans**:
   - When a Sales Challan is created, the system captures **snapshot data** (`productName` and `unitPrice`) for each item at creation time rather than relying solely on current product table prices.

2. **Atomic Stock Transactions & Non-Negative Balance Rules**:
   - When a Sales Challan status transitions to `CONFIRMED`:
     - Available stock is checked for every line item.
     - If stock is insufficient, the operation immediately rolls back and returns an explicit HTTP 400 error: `"Insufficient stock for product '<Name>'. Available: X, Requested: Y. Stock cannot go negative."`
     - Upon confirmation, stock is automatically reduced and an `OUT` stock movement log is created inside an **atomic Prisma database transaction** (`$transaction`).

3. **Customer Follow-up Timeline**:
   - Customer detail views render a complete chronological timeline of follow-up call notes, tracking which employee added each note.

---

## 🧪 Postman API Testing

An exported Postman Collection is provided in the project root: **`postman_collection.json`**.

1. Open Postman $\to$ **Import** $\to$ Select `postman_collection.json`.
2. Environment Variable Setup:
   - `baseUrl`: `http://localhost:5000`
   - `jwtToken`: `<Paste token returned from POST /api/auth/login>`
3. Contains 18 pre-configured REST API requests for all 4 roles.

---

## 📝 Assumptions & Limitations

- **Database Provider**: SQLite (`file:./dev.db`) is configured for zero-setup local execution. For production deployment (Render/AWS), the `DATABASE_URL` and Prisma schema provider can be switched to PostgreSQL without changing any application code.
