# Book Store — Backend

This README documents the backend for the Book Store application. It explains what the backend does, technologies used, required environment variables, main endpoints, SSE behavior, upload handling, administration scripts, and how to run the server for development and production.

## What is this backend?

The backend is a Node.js + Express application that provides REST APIs and real-time server push (SSE) for the Book Store frontend. It stores data in MongoDB using Mongoose models and handles server-side image uploads (Multer + Sharp). It also includes admin-only scripts for seeding the DB and creating an admin user.

## Tech stack

- Node.js (Express)
- MongoDB with Mongoose
- Multer (multipart uploads)
- Sharp (image processing / .webp conversion)
- dotenv (env config)
- cors, morgan, bcrypt, jsonwebtoken (common middleware/utilities)

## Environment variables

The server loads configuration from a `.env` file at the repository root of the `backend/` folder. Example (sensitive values redacted here):

```properties
DB_URL="mongodb+srv://<db_user>:<password>@<cluster>/..."
JWT_SECRET_KEY="<long-random-secret>"

VITE_API_KEY=...                # used by frontend when hosted together; exported to frontend when building
VITE_AUTH_DOMAIN=...
VITE_PROJECT_ID=...
VITE_STORAGE_BUCKET=...
VITE_MESSAGING_SENDER_ID=...
VITE_APP_ID=...
VITE_MEASUREMENT_ID=...         # optional
```

Important notes:

- `DB_URL` must point to your MongoDB cluster. For development we recommend a non-SRV connection string if you're experiencing DNS issues; otherwise the provided SRV URI may work.
- `JWT_SECRET_KEY` is used to sign and verify admin JWTs. Keep it secret in production.
- The `VITE_` variables are included because the frontend expects them when using Firebase (optional). They are safe only if you understand the values and remove secrets.
  The repository contains an `.env` file (do not commit secrets).

## How to run

1. Install dependencies in `backend/`:

```powershell
npm install
```

2. Start development server (nodemon or node):

```powershell
npm run dev
# or
node index.js
```

3. Production start (after build if you containerize):

```powershell
npm run start
```

The server listens on the configured port (see `index.js` for default). The backend serves API routes under `/api` (for example `/api/books`, `/api/orders`). It also serves uploaded images under a static `/uploads` path when configured.

## Key features & endpoints

This list summarizes important endpoints exposed by the backend. The exact route filenames live under `backend/src/`.
Books

- GET /api/books — list books
- GET /api/books/:id — get a book
- POST /api/books — admin: create a book
- PUT /api/books/:id — admin: update a book
- DELETE /api/books/:id — admin: delete a book
- POST /api/books/upload — upload cover image (multipart/form-data). The server processes the image (Sharp) and returns the stored filename/URL.

Orders

- POST /api/orders — create a new order. The frontend sends the order with `productIds` and a `products` snapshot (each item: bookId, title, price) and `totalPrice`.
- GET /api/orders?email=<email> — get orders for a user (or GET /api/orders/:email depending on implementation)
- GET /api/orders/all — admin: get all orders
- PUT /api/orders/:id — admin: update order `status` (e.g. pending, shipped, delivered). When status is updated, the server emits an SSE `order-updated` event to subscribed clients.
- GET /api/orders/subscribe?email=<email> — Server-Sent Events endpoint. Clients use EventSource to receive `order-created` and `order-updated` events. NOTE: the server keeps an in-memory registry of connections keyed by email.

Auth / Admin

- POST /api/admin/login — admin authentication; returns a JWT for admin-only routes
- Admin routes require `Authorization: Bearer <token>` header

Utilities / Scripts

- `scripts/seed-books.js` — seed some sample books into the DB (useful for local development)
- `scripts/create-admin.js` — create an admin user in the database using an environment-provided password or prompt

Models & important server files

- `src/books/book.model.js` — Mongoose schema for books (title, description, category, price, coverImage, ...)
- `src/orders/order.model.js` — Mongoose schema for orders. Important: it stores both `productIds` (refs) and a `products` snapshot array so order history remains readable.
- `src/orders/order.controller.js` — handlers for creating orders, fetching orders, updating status, and emitting SSE events. Also contains logic to backfill `products` snapshots for older orders.
- `src/users/user.model.js` — user schema (if used)
- `src/middleware/verifyAdminToken.js` — middleware that checks `Authorization` header and verifies JWT
- `src/books/upload.route.js` or similar — route that handles Multer uploads and calls Sharp to produce `.webp` images and save them under `uploads/`.

## Server-Sent Events (SSE)

The backend offers an SSE endpoint so the frontend can open an EventSource and receive one-way push notifications. Typical flow:

1. Frontend (user orders page) opens EventSource to `/api/orders/subscribe?email=user@example.com`.
2. Backend stores the response (SSE connection) in memory keyed by the email.
3. When an order is created or updated, the backend writes an event to the matching connections (for that email), e.g. `event: order-updated\ndata: <json>`.

Caveats and production recommendations:

- The current SSE registry is in-memory and will not work across multiple backend instances. For production use, implement a pub/sub system (Redis) and a centralized event distributor or use a socket-based service.

## Uploads & image processing

- The server accepts multipart/form-data uploads for book cover images using Multer.
- Uploaded images are processed with Sharp and converted to `.webp` (or resized) to save storage and serve optimized images.
- Processed images are stored under `backend/uploads/` and served as static files via express.static (check `index.js`).

## Database notes

- Mongoose models live under `src/` and map directly to JSON returned to the frontend.
- Orders contain a `products` snapshot array so that even if a book's title or price changes later, the order keeps the original snapshot. New orders created by the frontend should include that snapshot — the backend will also backfill it on read/update if missing.

## Scripts

- `npm run dev` — start dev server (typically with nodemon)
- `node index.js` — run the server directly
- `node scripts/seed-books.js` — run the seeding script (ensure DB_URL is set)
- `node scripts/create-admin.js` — create an admin user in the DB

## Security notes

- Keep `.env` out of version control and store secrets securely in production.
- Protect admin endpoints using JWT verification in `verifyAdminToken` middleware.
- Validate and sanitize all user-provided fields on the server.

## Troubleshooting

- MongoDB connection errors (DNS SRV, ESERVFAIL):

  - Try a non-SRV connection string if your environment has DNS issues.
  - Ensure `DB_URL` is correct and the network allows outbound connections to MongoDB.

- Uploads fail:

  - Confirm Multer is configured and the client sends `multipart/form-data`.
  - Check folder permissions for `uploads/`.

- SSE connections close or never arrive:
  - Confirm the SSE endpoint `/api/orders/subscribe` responds with `200` and keeps the connection open.
  - Check CORS configuration and that EventSource isn't blocked by the browser.

## Where to look in the code

- `index.js` — server entry: express setup, middleware, route mounting, static file serving
- `src/books/` — book model, controller and routes
- `src/orders/` — order model and controller (SSE logic and product snapshotting)
- `src/users/` — user model and routes
- `src/middleware/verifyAdminToken.js` — admin auth middleware
- `scripts/` — seed and create-admin helper scripts

## Next steps / improvements

- Replace in-memory SSE registry with Redis Pub/Sub and scale to multiple instances.
- Add automated migration to backfill `products` snapshots for all existing orders.
- Add stronger tests around order lifecycle and SSE notifications.

---

If you want, I can also:

- Add a short quick-start section with exact `index.js` port and example curl commands for endpoints
- Generate a migration script to backfill `products` snapshots
- Add an environment-check script to validate `.env` values before starting

Tell me which of those you'd like next and I'll implement it.

# book-app-backend
