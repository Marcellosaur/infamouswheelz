# InfamousWheelz 🏍️

> A premium, full-stack marketplace platform for buying, selling, and managing high-end motorcycles.

InfamousWheelz is designed with a sleek, modern UI utilizing a comprehensive role-based architecture. Built robustly with Angular and Node.js/Express, it offers dedicated experiences tailored uniquely to Buyers, Sellers, and Platform Administrators.

## 🌟 Key Features

### 🛡️ Role-Based Access Control (RBAC)
- **Three Account Tiers**: Authenticate dynamically as a **Buyer**, **Seller**, or **Admin**. 
- **Route Guarding**: Frontend Angular `AuthGuard` securely ensures users cannot access unauthorized pages.
- **Backend Middleware**: Express token verification and `authorize()` middleware aggressively protects sensitive API endpoints.

### 👥 Dashboards
- **Buyer Garage**: Browse exclusive listings, add motorcycles to your personal Garage (Favorites list), and initiate inquiries with sellers.
- **Seller Workspace**: A dedicated layout precisely for dealerships and sellers to manage their inventory pipeline, review direct inquiries, and easily track buyer statuses.
- **Admin Command Center**: A super-admin suite calculating live database statistics (e.g. Total Users, Active Listings), with a powerful tabular view for managing and enabling/suspending community members seamlessly.

### ⚡ Technical Highlights
- **Dynamic JWT Authentication**: Safe, encrypted stateless token authentication protecting application entry points.
- **Responsive Aesthetics**: Powered deeply by **TailwindCSS**, rendering dynamic dark/light interface systems with butter-smooth micro-animations.
- **Real-time Statistics**: Raw SQL metric extraction running in Node to compute live platform metrics rapidly. 

---

## 💻 Tech Stack

- **Frontend**: Angular 14, TypeScript, TailwindCSS, RxJS
- **Backend**: Node.js, Express.js
- **Database**: MySQL (Raw SQL/`mysql2`)
- **Security**: JWT (`jsonwebtoken`), Password Hashing (`bcryptjs`)

---

## 🚀 Getting Started

Ensure you have **Node.js** and **MySQL** installed locally.

### 1. Database Configuration
1. Start your local MySQL server.
2. Initialize the schema using the provided database configurations within your setup (ensure tables `users`, `motorcycles`, `favorites`, and `inquiries` are created based on the models).
3. If applicable, update the MySQL credentials dynamically mapped within `server/src/config/db.js` or via your `.env` variables if configured.

### 2. Backend Setup
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd server
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the Express API server:
   ```bash
   npm start
   # Server usually runs aggressively on http://localhost:3000
   ```

### 3. Frontend Setup
1. Open up a second terminal and navigate to the client folder:
   ```bash
   cd client
   ```
2. Install Angular dependencies:
   ```bash
   npm install
   ```
3. Boot up the Angular Development Server:
   ```bash
   ng serve
   # Application will compile and serve on http://localhost:4200
   ```

### 4. Admin Access
To securely test Admin features:
If an `admin` account does not exist natively, use a root database GUI tool (like MySQL Workbench) or script to change the `role` property of a specific user inside the `users` table from `'buyer'` to `'admin'`. Upon logging into the web app using that account, the platform will automatically detect the shield protocol and grant Super Admin Dashboard access!
