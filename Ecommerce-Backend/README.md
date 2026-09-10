# Ecommerce Backend

Node.js + Express + Prisma + PostgreSQL backend for the ecommerce frontend.

## Setup

1. Configure `.env` so `DATABASE_URL` points to the database you want the backend to use for both reads and writes.
2. Install dependencies with `npm install`.
3. Run `npx prisma generate`.
4. Apply the schema with `npx prisma migrate dev --name init`.
5. Start the server with `npm run dev`.
6. Seed demo accounts and products with `npm run seed`.

Demo accounts:

- Customer: `customer@shopee.local` / `customer123`
- Shop owner: `owner@shopee.local` / `owner123`
- Admin: `admin@shopee.local` / `admin123`

The seed is repeatable. It updates these accounts and replaces only products
with the same demo names. Do not use these passwords outside local development.

## Entity layer

The database entities are defined in `prisma/schema.prisma` and exposed through
`src/entities/`. The entity registry covers `roles`, `users`, `products`,
`carts`, `cart_items`, `orders`, and `order_items`. Prisma remains responsible
for migrations and queries, while the entity classes normalize database rows
and document the domain table names used by services.

Example values:

- `DATABASE_URL=postgresql://postgres:SuperSecurePassword123!@192.168.253.11:5000/ecommerce_db?schema=public`

## API

- `GET /api/products`
- `GET /api/products/search?keyword=...`
- `GET /api/product/:id`
- `GET /api/product/:id/image`
- `POST /api/product`
- `PUT /api/product/:id`
- `DELETE /api/product/:id`
- `GET /api/cart`
- `POST /api/cart/items`
- `PATCH /api/cart/items/:productId`
- `DELETE /api/cart/items/:productId`
- `POST /api/orders/checkout`
- `GET /api/orders`
