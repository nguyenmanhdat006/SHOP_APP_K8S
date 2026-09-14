# CLAUDE.md - Trien khai audit_events

Tai lieu nay la huong dan chuan bi trien khai audit cho backend Node.js/Express 5/Prisma 6, ES module. Audit o day la audit nghiep vu o tang ung dung, khac voi Falco o tang ha tang/container.

## 1. Hien trang backend

| Thanh phan | Hien trang | Vi tri |
|---|---|---|
| Request ID | Da co, gan `req.requestId` va tra header `X-Request-ID` | `src/middlewares/requestId.middleware.js` |
| Prisma client | Da co | `src/config/prisma.js` |
| Metric dang nhap that bai | Da co | `src/config/metrics.js`, `src/services/auth.service.js` |
| Audit helper | Da co, ghi bang `audit_events`, khong throw khi ghi loi | `src/services/audit.service.js` |
| Bang audit | Da migrate, khong co foreign key toi `users` | `prisma/schema.prisma` |
| Audit call trong service | Chua co trong code hien tai | Can trien khai theo ma tran ben duoi |

Khong duoc gia dinh `auth.service.js` da nhan `req` hoac da goi `logAudit`; code hien tai chua lam dieu do.

## 2. Nguyen tac chon case

Audit khi hanh dong co it nhat mot dac diem:

- Tao hau qua tai chinh hoac thay doi ton kho.
- Thay doi quyen, role hoac tai khoan.
- Thay doi du lieu quan tri quan trong.
- That bai bao mat hoac truy cap khong du quyen.

Khong audit mac dinh cac request chi doc thong thuong vi se tao nhieu log khong co gia tri dieu tra.

## 3. Ma tran endpoint thuc te

### Auth va user

| Endpoint/action | Muc do | Action | Detail toi thieu |
|---|---|---|---|
| `POST /api/auth/register` thanh cong | Bat buoc | `user.register` | `userId`, role |
| Register that bai | Bat buoc | `user.register_failed` | reason huu han |
| Login thanh cong | Bat buoc | `user.login_success` | `userId` |
| Login that bai | Bat buoc | `user.login_failed` | `user_not_found`, `wrong_password` hoac `invalid_input` |
| `POST /api/auth/logout` | Bat buoc | `user.logout` | actor neu co |
| `GET /api/auth/me` | Khong mac dinh | - | Chi audit neu co compliance truy cap du lieu |
| `GET /api/auth/users` | Nen audit neu can truy vet | `user.list_view` | actor admin |
| `PATCH /api/auth/users/:id/role` | Bat buoc | `user.role_change` | target user, `oldRole`, `newRole` |

### Product

| Endpoint/action | Muc do | Action | Detail toi thieu |
|---|---|---|---|
| `POST /api/product` | Bat buoc | `product.create` | product id |
| `PUT /api/product/:id` doi gia | Bat buoc | `product.price_change` | `oldPrice`, `newPrice` |
| `PUT /api/product/:id` doi ton kho | Bat buoc | `product.inventory_change` | ton kho cu/moi |
| `PUT /api/product/:id` doi availability | Bat buoc | `product.availability_change` | gia tri cu/moi |
| `PUT /api/product/:id` doi thong tin khac | Nen audit | `product.update` | danh sach field da doi |
| `PUT /api/product/:id` thay anh | Nen audit | `product.image_change` | ten/type, khong ghi binary |
| `DELETE /api/product/:id` | Bat buoc | `product.delete` | product id |
| `POST /api/product/:id/purchase` | Bat buoc | `product.direct_purchase` | quantity, ton kho neu can |

`GET /api/products`, search, chi tiet va anh san pham khong audit mac dinh.

### Cart

Cart chua tao giao dich tai chinh; cac action nay la tuy chon, chi bat khi can truy vet hanh vi user:

| Endpoint/action | Action |
|---|---|
| `POST /api/cart/items` | `cart.item_add` |
| `PATCH /api/cart/items/:productId` | `cart.item_update` |
| `DELETE /api/cart/items/:productId` | `cart.item_remove` |

`GET /api/cart` khong audit mac dinh.

### Order

| Endpoint/action | Muc do | Action | Detail toi thieu |
|---|---|---|---|
| Checkout thanh cong | Bat buoc | `order.create` | order id, total, item count |
| Checkout that bai | Bat buoc | `order.checkout_failed` | reason huu han |
| `GET /api/orders` | Khong mac dinh | - | Chi audit neu co compliance |

Hien tai chua co API cap nhat status, huy don hoac hoan tien. Khi them cac route nay phai audit:

- `order.status_change` voi `oldStatus`, `newStatus`.
- `order.cancel` khi huy don.
- `order.refund` khi hoan tien.

## 4. Cac case bao mat va that bai

Phai ghi `failure` cho cac case quan trong:

- Auth: thieu input, email da ton tai, user khong ton tai, sai mat khau.
- Token: thieu token, token sai format, token het han, token khong hop le.
- Authorization: role khong du quyen, action `ACCESS_DENIED`.
- Product: payload sai, product khong ton tai, quantity/gia/tồn kho khong hop le, het hang, xoa that bai.
- Cart: product hoac item khong ton tai, quantity khong hop le.
- Order: cart rong, het hang, shipping input khong hop le, transaction checkout that bai.

Dung `result: "success"` hoac `result: "failure"`. `detail.reason` phai la tap ma huu han; khong ghi nguyen van error message, stack trace, request body, password, JWT, refresh token, payment data, dia chi day du hoac file binary.

Moi action chi co mot noi chiu trach nhiem ghi failure de tranh log trung lap giua service va error middleware.

## 5. Contract khi goi `logAudit`

```javascript
await logAudit({
  requestId: req.requestId,
  actorId: req.user?.id ?? null,
  actorRole: req.user?.role ?? null,
  action: "product.price_change",
  targetType: "product",
  targetId: productId,
  result: "success",
  clientIp: req.ip,
  detail: { oldPrice, newPrice },
});
```

Quy tac:

1. Luon `await logAudit(...)`; helper tu bat loi va khong lam fail nghiep vu chinh.
2. `actorId`/`actorRole` la nguoi thuc hien, khong phai target.
3. `requestId` lay tu `req.requestId`, khong tu tao lai trong service.
4. `targetId` co the la so nhung helper phai luu dang string.
5. `clientIp` chi dang tin neu da cau hinh `app.set("trust proxy", true)` phu hop voi ingress.
6. Service can context phai nhan `req` hoac mot object context rieng, khong doc request tu bien global.

## 6. Quy tac cho cac mutation

- Product price: chi ghi `product.price_change` khi gia thuc su thay doi.
- Product update: so sanh gia tri cu/moi; khong ghi toan bo request body.
- Product purchase: ghi sau khi tru ton kho thanh cong.
- Checkout: ghi sau khi transaction tao order thanh cong; neu transaction rollback thi ghi failure.
- Role change: lay role cu truoc update va ghi ca role cu/moi.
- Khong ghi audit truoc mutation thanh cong voi `result: success`.

## 7. Bang `audit_events`

```prisma
model audit_events {
  id          Int      @id @default(autoincrement())
  occurred_at DateTime @default(now()) @db.Timestamp(6)
  request_id  String?  @db.VarChar(64)
  actor_id    Int?
  actor_role  String?  @db.VarChar(50)
  action      String   @db.VarChar(64)
  target_type String?  @db.VarChar(32)
  target_id   String?  @db.VarChar(64)
  result      String   @default("success") @db.VarChar(16)
  client_ip   String?  @db.VarChar(45)
  detail      Json?
}
```

Khong them foreign key toi `users`: login fail co the khong co user id, va audit phai giu duoc actor id sau khi user bi xoa.

## 8. Thu tu trien khai

1. Them `logAudit` vao auth service/controller: register, login success/failure, logout va role change.
2. Truyen `req` hoac audit context tu controller xuong product/order service.
3. Them audit product create, price/inventory/availability update, delete va direct purchase.
4. Them audit checkout success/failure.
5. Them failure audit cho auth middleware va authorization, khong ghi trung voi error middleware.
6. Chi them cart audit neu yeu cau nghiep vu/compliance can.
7. Kiem tra `trust proxy` truoc khi tin vao `clientIp`.

## 9. Checklist kiem thu

- [ ] Register thanh cong va that bai tao event dung action/result.
- [ ] Login thanh cong, user khong ton tai va sai password tao event dung reason.
- [ ] Token het han, token sai va access denied duoc ghi.
- [ ] Role change ghi actor admin va old/new role.
- [ ] Product create/delete/purchase duoc ghi sau mutation thanh cong.
- [ ] Update product chi ghi price/inventory khi gia tri thuc su doi.
- [ ] Checkout thanh cong ghi order id; cart rong va het hang ghi failure.
- [ ] GET endpoint thong thuong khong tao audit thua.
- [ ] Audit failure khong lam request nghiep vu that bai them.
- [ ] `request_id` trong audit khop voi access log.
- [ ] Khong co password, token, payment data hoac binary trong `detail`.
