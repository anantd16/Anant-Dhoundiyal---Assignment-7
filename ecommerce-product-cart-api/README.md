# 🛒 E-Commerce Product & Shopping Cart API

A file-based (no database) REST API for a product catalog and shopping cart, built with **Node.js, Express, `fs/promises`, bcryptjs, and `express-session`**.

## Tech Stack

- Node.js + Express.js
- JSON files as the data store (`data/products.json`, `data/users.json`, `data/carts.json`), read/written via `fs/promises`
- `bcryptjs` for password hashing
- `express-session` for cookie-based session auth (no JWT here — sessions are server-side)
- `uuid` for generating product/user IDs

## Setup

```bash
npm install
cp .env.example .env   # fill in SESSION_SECRET
npm run dev            # nodemon, auto-restart
# or
npm start
```

Server runs at `http://localhost:5000` by default.

`data/products.json` ships pre-seeded with 5 products across categories (Electronics, Footwear, Home & Kitchen, Sports & Fitness) so you can test filtering immediately. `data/users.json` and `data/carts.json` start empty and populate as you register/shop.

## How Sessions Work Here

Login (`POST /api/auth/login`) sets `req.session.user`, and Express sends back a `connect.sid` cookie. Your HTTP client (Postman, curl `-c`/`-b`, or the browser) needs to store and resend that cookie on every subsequent request — that's what keeps you "logged in" for cart routes. `authGuard` middleware checks `req.session.user` on every `/api/cart/*` route and returns `401` if it's missing.

## Endpoints

**Auth**
- `POST /api/auth/register` — hash password, create user
- `POST /api/auth/login` — verify password, start session
- `POST /api/auth/logout` — destroy session

**Products** (catalog is public to read; write routes have no auth guard per the assignment spec — treat as "admin routes" conceptually)
- `GET /api/products` — supports `?category=&minPrice=&maxPrice=&inStock=true|false&sort=price_asc|price_desc|rating_asc|rating_desc|newest&search=`
- `GET /api/products/:id`
- `POST /api/products` — validated by `validateProduct` middleware
- `PUT /api/products/:id` — partial update, same validation
- `DELETE /api/products/:id`

**Cart** (all routes require an active session)
- `GET /api/cart` — current cart with live total
- `POST /api/cart/items` — `{ productId, quantity }`, rejects with `400` if requested quantity exceeds stock
- `DELETE /api/cart/items/:productId`
- `POST /api/cart/checkout` — re-validates stock for every item, decrements `products.json` stock, clears the cart, returns an order summary

## Key Design Notes

- **Write queueing**: `utils/fileHelper.js` queues writes per-file so two near-simultaneous requests can't clobber each other's changes to the same JSON file (there's no real DB transaction to rely on).
- **Checkout is two-phase**: first it verifies every cart item still has enough stock, and only if *all* pass does it commit the stock decrements — so a checkout never partially succeeds.
- **Passwords** are bcrypt-hashed (10 rounds) and stripped from every API response.

## Testing Checklist (from the assignment spec)

1. Seed data already includes 5 products across categories ✅
2. Register + login a user, confirm the session cookie is returned/stored
3. `POST /api/cart/items` with `quantity` greater than stock → expect `400 Bad Request: Insufficient stock`
4. `POST /api/cart/checkout` → confirm `data/products.json` stock decrements for purchased items

## Project Structure

```
ecommerce-product-cart-api/
├── data/
│   ├── carts.json
│   ├── products.json
│   └── users.json
├── controllers/
│   ├── authController.js
│   ├── cartController.js
│   └── productController.js
├── middleware/
│   ├── authGuard.js
│   ├── logger.js
│   └── validateProduct.js
├── routes/
│   ├── authRoutes.js
│   ├── cartRoutes.js
│   └── productRoutes.js
├── utils/
│   └── fileHelper.js
├── .env.example
├── .gitignore
├── package.json
├── server.js
└── README.md
```
