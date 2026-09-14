-- DropIndex
DROP INDEX "products_owner_id_idx";

-- AlterTable
ALTER TABLE "cart_items" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "carts" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "audit_events" (
    "id" SERIAL NOT NULL,
    "occurred_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "request_id" VARCHAR(64),
    "actor_id" INTEGER,
    "actor_role" VARCHAR(50),
    "action" VARCHAR(64) NOT NULL,
    "target_type" VARCHAR(32),
    "target_id" VARCHAR(64),
    "result" VARCHAR(16) NOT NULL DEFAULT 'success',
    "client_ip" VARCHAR(45),
    "detail" JSONB,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_events_occurred_at_idx" ON "audit_events"("occurred_at" DESC);

-- CreateIndex
CREATE INDEX "audit_events_actor_id_occurred_at_idx" ON "audit_events"("actor_id", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "audit_events_request_id_idx" ON "audit_events"("request_id");
