# 🏪 Manikanta Supermarket - Customer Ordering & Management System

A modern, responsive full-stack **Supermarket Customer Ordering and Store Management Web Application** customized for **Manikanta Supermarket**:
- **Customer**: Browse dynamic weight/volume variants (e.g. 250g, 500g, 1kg, 5kg), shopping cart, place counter-pickup orders, live order tracking with 5-step visual timeline, and in-app notifications.
- **Store Operations**: Live order counter alerts via Socket.IO, order status lifecycle management (Accept → Pack → Complete), dynamic multi-unit pricing creator, inventory & low-stock warnings.

---

## 🌟 Key Features

### 👤 Customer Experience
- **Registration & Authentication**: Sign up with name, 10-digit mobile number, email, address, and password with full validation.
- **Flexible Login**: Login using **either email or mobile number**.
- **Dynamic Selling Units**:
  - Weight: 250g, 500g, 1kg, 5kg, 10kg
  - Volume: 250ml, 500ml, 1 Liter, 2 Liters, 5 Liters
  - Quantity: 1 Piece, Pack of 5, 12 Pieces
  - Product price and stock adjust immediately on selecting different units.
- **Search & Filter**:
  - Real-time keyword search across names and descriptions.
  - Filter by category, price range, and in-stock availability.
  - Sort by Newest, Popularity, Price (Low → High, High → Low).
- **Interactive Cart & Checkout**:
  - Itemized table with unit label, unit price, quantity stepper `[-] 1 [+]`, line totals, and grand total.
  - Review customer mobile and pickup instructions.
  - **Pay at Store / Cash on Pickup** payment workflow.
- **Celebration & Live Order Tracking**:
  - Unique Order ID format: `# ORD-YYYYMMDD-001`.
  - Festive confetti on order placement.
  - **5-Step Visual Timeline**: `Order Placed` → `Order Accepted` → `Order Packed` → `Ready for Pickup` → `Order Completed`.
- **In-App Notifications**:
  - Notification bell with unread count badge.
  - Instant popup toasts for order status changes and pickup alerts.

### 🛡️ Shop Owner / Admin Dashboard
- **Analytics & KPIs**:
  - Total Products, Customers, New Orders, Pending Orders, Packed Orders, Completed Orders, and Total Sales (₹).
  - Daily sales trend area chart and top staple products bar chart using Recharts.
- **Counter Order Queue**:
  - Status tabs: *All Orders*, *New Orders*, *Accepted*, *Ready for Pickup*, *Completed*, *Rejected*.
  - Status progression buttons: `Accept Order`, `Mark as Packed`, `Mark Completed`.
  - Real-time customer pickup notification: *"Your items are packed. Please come to the shop for pickup."*
- **Inventory & Automated Stock Reduction**:
  - Automatically deducts stock from the specific unit variant when the order is marked `COMPLETED`.
  - Automated low-stock alerts (e.g. `⚠️ Rice stock is low`) emitted via Socket.IO and recorded in notifications.
- **Dynamic Product & Pricing Manager**:
  - Add/Edit product form with dynamic unit repeater (`+ Add Another Unit`).
  - Pre-defined quick unit buttons + custom unit input.
  - File upload with image preview or direct image URL.
- **Store Configuration**:
  - Customize Shop Name, Tagline, Owner Name, Phone, Email, Address, Business Hours, and Pickup Instructions.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Recharts, Socket.IO Client, Axios, Canvas Confetti.
- **Backend**: Node.js, Express.js, Socket.IO, Mongoose, JWT (`jsonwebtoken`), `bcryptjs`, Multer (image uploads), CORS, Dotenv.
- **Database**: MongoDB (Local or MongoDB Atlas).

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18 or higher)
- MongoDB running on `mongodb://127.0.0.1:27017` (or MongoDB Atlas connection string)

### 1. Installation
Install all root, backend, and frontend dependencies:
```bash
# In the project root
npm run install:all
```

### 2. Configure Environment Variables
A `.env` file is prepared in `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/kirana_store
JWT_SECRET=kirana_secret_jwt_token_super_secure_key_2026
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### 3. Seed Sample Database
Populate authentic Kirana categories, products with multi-unit pricing, test accounts, and sample orders:
```bash
npm run seed
```

### 4. Run the Full-Stack Application
Start both the Express API (port 5000) and Vite React Frontend (port 5173) concurrently:
```bash
npm run dev
```

Open your browser at:
**`http://localhost:5173`**

---

## 🔑 Default Test Accounts

| Role | Email / Login | Password | Capabilities |
|---|---|---|---|
| **Shop Owner / Admin** | `admin@kirana.com` (or `9876543210`) | `admin123` | Dashboard analytics, order fulfillment, product creation, stock alerts, settings |
| **Customer** | `customer@example.com` (or `9812345678`) | `customer123` | Browse catalog, select units, add to cart, counter pickup orders, live tracking |

*(You can also use the **Quick Test Accounts** one-click buttons on the Login page!)*

---

## 📡 REST API Summary

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a customer
- `POST /api/auth/login` — Login with email/mobile and password
- `GET /api/auth/profile` — Get profile (Protected)
- `PUT /api/auth/profile` — Update name, phone, address, or password

### Products (`/api/products`)
- `GET /api/products` — Browse with search, category, inStock, and price filters
- `GET /api/products/:id` — Single product details with variants
- `POST /api/products` — Add product with dynamic unit variants (Admin only)
- `PUT /api/products/:id` — Edit product (Admin only)
- `DELETE /api/products/:id` — Delete product (Admin only)
- `PATCH /api/products/:id/toggle-status` — Enable/Disable product (Admin only)
- `POST /api/products/upload-image` — Multer image upload (Admin only)

### Orders (`/api/orders`)
- `POST /api/orders` — Place counter pickup order (Customer)
- `GET /api/orders/my-orders` — Customer's orders with timeline
- `GET /api/orders/:id` — Order details
- `GET /api/orders/admin/all` — Tabbed order management list (Admin only)
- `PUT /api/orders/admin/:id/status` — Accept, reject, pack, or complete order (Admin only)

### Notifications & Store (`/api/notifications`, `/api/admin`)
- `GET /api/notifications` — In-app alerts and unread count
- `PUT /api/notifications/:id/read` — Mark notification read
- `GET /api/admin/dashboard-stats` — Sales, orders, low stock, and charts
- `GET /api/admin/customers` — Registered customers with spending
- `GET /api/admin/settings` & `PUT /api/admin/settings` — Store timing & details

---

## 📦 Project Structure

```
general store/
├── backend/
│   ├── config/             # DB connection
│   ├── controllers/        # Auth, Products, Orders, Admin, Categories, Notifications
│   ├── middleware/         # JWT Auth, Admin check, Multer Upload, ErrorHandler
│   ├── models/             # User, Product, Category, Order, Notification, Setting
│   ├── routes/             # Express API route declarations
│   ├── services/           # Socket.IO service & real-time broadcasts
│   ├── utils/              # Order ID generator, token generator, seedData.js
│   ├── uploads/            # Uploaded product images storage
│   ├── server.js           # Server entry point
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/     # Navbar, BottomNav, Footer, ProductCard, OrderTimeline, Modals, Toast
│   │   ├── context/        # AuthContext, CartContext, SocketContext, NotificationContext
│   │   ├── layouts/        # CustomerLayout
│   │   ├── pages/
│   │   │   ├── customer/   # Home, Products, ProductDetail, Cart, Checkout, OrderSuccess, MyOrders, Profile, Login, Register
│   │   │   └── admin/      # AdminLayout, Dashboard, Orders, Products, AddEditProduct, Categories, Customers, Settings
│   │   ├── services/       # Axios API client
│   │   ├── App.jsx         # Routes & guards
│   │   └── main.jsx
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── package.json            # Root orchestrator (npm run dev)
└── README.md
```
