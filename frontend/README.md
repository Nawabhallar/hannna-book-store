# Book Store — Frontend

This file documents the frontend application for the Book Store project. It explains what the app is, the technologies used, how it is structured, how it communicates with the backend, its features, important files, and troubleshooting tips for developers.

## What is this project?

This is the frontend application for a full-stack Book Store. The UI is a single-page application (SPA) built with React and Vite. It lets visitors browse books, add them to a cart, checkout (create orders), and view order history. It also contains a dashboard used by both regular users and administrators. The admin dashboard includes book management (create/update/delete) and order management (update order status).

The frontend pairs with the Node.js + Express backend located in the repository's `backend/` folder, which exposes REST endpoints under `/api` and provides features such as server-side image uploads, order persistence, and Server-Sent Events (SSE) for near-real-time updates.

## Tech stack

- React (functional components + hooks)
- Vite (dev server + build)
- Tailwind CSS (utility CSS)
- Redux Toolkit & RTK Query (global state + data fetching/caching)
- React Router (routing)
- Axios (HTTP requests for some admin actions)
- React Hook Form (forms)
- Firebase (optional, used in `AuthContext.jsx` if configured)

## How to run (developer)

1. Install dependencies in `frontend/`:

```powershell
npm install
```

2. Start dev server:

```powershell
npm run dev
```

3. Production build:

```powershell
npm run build
```

4. Preview production build:

```powershell
npm run preview
```

Note: The frontend expects the backend API to be available. By default the client uses `src/utils/baseURL.js` to construct API calls (usually prefixing `/api`). If your backend runs on a different host/port, update `baseURL` accordingly.

## High-level architecture

- The SPA routes are defined in `src/routers/router.jsx`.
- `src/context/AuthContext.jsx` provides authentication and currentUser across the app.
- RTK Query (in `src/redux/features/`) is used for orders API and other server operations as appropriate.
- Axios is used where a direct HTTP client is simpler (particularly in admin pages that attach Authorization headers).
- Static assets live in `src/assets/` and book images often point to `/uploads/` served by the backend.

## Main features

- Browse and search books by category
- View book details and book lists
- Add items to a cart and manage quantities
- Checkout: create an order (with a product snapshot to preserve title/price)
- User pages: view orders, order details, delivery estimates
- Admin dashboard: manage books (create/update/delete), manage orders (change status)
- Server-side image upload & processing (backend `uploads` and sharp conversion)
- Near-real-time order status updates via Server-Sent Events (SSE)

## How the frontend communicates with the backend

All API calls are sent to endpoints under `/api`. The app uses two primary mechanisms:

1. RTK Query — for some APIs (notably orders). The orders API is located in `src/redux/features/orders/ordersApi.js`.

   - POST /api/orders — create an order (checkout)
   - GET /api/orders?email=<email> — get orders for a user
   - GET /api/orders/all — admin: get all orders
   - PUT /api/orders/:id — admin: update order status
   - GET /api/orders/subscribe?email=<email> — SSE endpoint for order events

2. Axios — used directly for some admin calls and file uploads.
   - POST /api/books/upload — upload book cover image (multipart/form-data)
   - POST /api/books — create book (admin)
   - PUT /api/books/:id — update book (admin)
   - DELETE /api/books/:id — delete book (admin)

Admin endpoints require a JWT token sent in the `Authorization: Bearer <token>` header. The app stores this token in localStorage (or uses the auth provider) and attaches it to admin requests where needed.

### Order snapshot and why it exists

When creating an order the frontend sends both `productIds` and a `products` snapshot array containing objects like `{ bookId, title, price }`. That snapshot ensures an order remains readable even if the referenced book documents change later (title/price updates or deletions). Frontend UI components prefer `order.products` for display and fall back to populated `productIds` if necessary.

## Important pages and components

Files are relative to `frontend/src/`.

- Entry & routing

  - `main.jsx` — app entry, wraps providers (Redux, Router, Auth)
  - `routers/router.jsx` — route definitions

- Auth

  - `context/AuthContext.jsx` — currentUser, auth helpers
  - `components/Login.jsx`, `Register.jsx`, `AdminLogin.jsx` — auth forms

- Catalog & Book pages

  - `pages/home/*` — home and catalog pages (listing, featured)
  - `pages/books/BookCard.jsx` — book card UI
  - `pages/books/CartPage.jsx` — cart management
  - `pages/books/CheckoutPage.jsx` — checkout form: constructs the order payload and calls POST /api/orders
  - `pages/books/OrderPage.jsx` — user orders; subscribes to SSE and shows delivery estimates

- Dashboard

  - `pages/dashboard/DashboardLayout.jsx` — dashboard layout and UserMenu. If an admin token is detected the header shows the admin identity (the project sets a clear admin display name).
  - `pages/dashboard/orders/AdminOrders.jsx` — admin order list and status actions. Calls admin endpoints (GET /api/orders/all, PUT /api/orders/:id) and expects populated order responses. After changing an order the backend emits an SSE event which notifies subscribed users.
  - `pages/dashboard/books/*` — admin pages for managing books (create/update/delete) and uploading cover images.

- Redux / RTK Query

  - `redux/store.js` — store configuration
  - `redux/features/orders/ordersApi.js` — RTK Query endpoints for orders

- Utilities
  - `utils/baseURL.js` — resolves API base URL
  - `utils/getImgUrl.js` — helper for resolving image URL paths

## Realtime: Server-Sent Events (SSE)

The frontend opens an EventSource to `/api/orders/subscribe?email=user@example.com` to receive push notifications about order events. Typical event names include `order-created` and `order-updated`. When a relevant event arrives the UI refetches orders or updates local state so the user sees near-real-time status changes.

Note: SSE in this project uses an in-memory registry of subscribers on the backend. This is fine for a single-server development setup but won't scale across multiple backend instances. For production use Redis Pub/Sub or socket.io.

## Typical request mappings (UI -> backend)

- Books

  - GET /api/books
  - GET /api/books/:id
  - POST /api/books (admin)
  - PUT /api/books/:id (admin)
  - DELETE /api/books/:id (admin)
  - POST /api/books/upload (multipart form-data)

- Orders

  - POST /api/orders
  - GET /api/orders?email=<email>
  - GET /api/orders/all (admin)
  - PUT /api/orders/:id (admin)
  - GET /api/orders/subscribe?email=<email> (SSE)

- Admin auth
  - POST /api/admin/login — return JWT for admin actions

## Useful debugging tips

- Dev server exits with code 1: run `npm run dev` and inspect the terminal for a stack trace. Common causes: syntax error, import path mismatch, or a missing dependency.
- SSE not delivering events: make sure the backend is running and `GET /api/orders/subscribe` returns 200 and keeps the connection open. Check browser console and Network tab for EventSource frames.
- 401/403 from admin endpoints: check stored token in localStorage and validate the token on the backend.

## Development notes & extensions

- Add or edit RTK Query endpoints in `src/redux/features/` to keep data fetching consistent and take advantage of caching and invalidation.
- If you need persistent real-time updates across multiple backend instances, swap the in-memory SSE registry for Redis Pub/Sub or use a socket-based server.

## Where to look next (backend)

The backend contains important logic you should also know about: order model (including product snapshot), SSE subscribe and notification implementation, image upload endpoint (Multer + Sharp), admin user creation script, and seed scripts. See `backend/README.md` or the `backend/` folder for details.

---

If you'd like, I can also generate a top-level README that documents both backend and frontend together, or add a developer diagram of routes and data flow.

Happy hacking!
