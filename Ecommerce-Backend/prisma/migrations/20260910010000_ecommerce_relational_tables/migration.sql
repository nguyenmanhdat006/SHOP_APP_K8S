CREATE TABLE "roles" (
  "id" SERIAL NOT NULL,
  "code" VARCHAR(50) NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

INSERT INTO "roles" ("code", "name") VALUES
  ('CUSTOMER', 'Customer'),
  ('SHOP_OWNER', 'Shop owner'),
  ('ADMIN', 'Administrator')
ON CONFLICT ("code") DO NOTHING;

ALTER TABLE "users" ADD COLUMN "role_id" INTEGER;
UPDATE "users" u
SET "role_id" = r."id"
FROM "roles" r
WHERE r."code" = CASE
  WHEN u."role" = 'ADMIN' THEN 'ADMIN'
  WHEN u."role" = 'SHOP_OWNER' THEN 'SHOP_OWNER'
  ELSE 'CUSTOMER'
END;

ALTER TABLE "users"
  ADD CONSTRAINT "users_role_id_fkey"
  FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "carts" (
  "id" SERIAL NOT NULL,
  "user_id" INTEGER NOT NULL,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "carts_user_id_key" ON "carts"("user_id");
ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "cart_items" (
  "id" SERIAL NOT NULL,
  "cart_id" INTEGER NOT NULL,
  "product_id" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unit_price" DECIMAL(12,2) NOT NULL,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "cart_items_cart_id_product_id_key" ON "cart_items"("cart_id", "product_id");
CREATE INDEX "cart_items_product_id_idx" ON "cart_items"("product_id");
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "orders" (
  "id" SERIAL NOT NULL,
  "user_id" INTEGER NOT NULL,
  "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  "total_amount" DECIMAL(12,2) NOT NULL,
  "shipping_name" VARCHAR(255) NOT NULL,
  "shipping_email" VARCHAR(255) NOT NULL,
  "shipping_address" VARCHAR(500) NOT NULL,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "orders_user_id_created_at_idx" ON "orders"("user_id", "created_at");
CREATE INDEX "orders_status_idx" ON "orders"("status");
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "order_items" (
  "id" SERIAL NOT NULL,
  "order_id" INTEGER NOT NULL,
  "product_id" INTEGER NOT NULL,
  "product_name" VARCHAR(255) NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unit_price" DECIMAL(12,2) NOT NULL,
  CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "order_items_product_id_idx" ON "order_items"("product_id");
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "products" ADD COLUMN "owner_id" INTEGER;
ALTER TABLE "products" ADD CONSTRAINT "products_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "products_owner_id_idx" ON "products"("owner_id");
