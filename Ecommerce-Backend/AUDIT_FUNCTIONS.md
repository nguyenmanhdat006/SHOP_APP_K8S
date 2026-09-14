 # Backend Audit Functions

Tai lieu nay liet ke cac chuc nang backend can ghi audit moi khi user thuc hien thao tac.

Backend hien co `src/services/audit.service.js` de ghi vao bang `audit_events`. Neu can ghi vao file rieng, co the dung cung contract ben duoi voi file `logs/audit-events.jsonl`.

## 1. Nguyen tac ghi audit

- Ghi ca ket qua thanh cong va that bai.
- Ghi audit sau khi thao tac thanh cong.
- Ghi audit trong `catch` truoc khi goi `next(error)` doi voi thao tac that bai.
- Khong ghi password, JWT, refresh token, thong tin the thanh toan hoac toan bo request body.
- Su dung JSON Lines: moi dong la mot object JSON doc lap.
- Audit khong duoc lam request chinh that bai neu viec ghi log gap loi.

## 2. Cac action bat buoc

### Authentication va user management

| Action | Mo ta | Target |
|---|---|---|
| `REGISTER` | Tao tai khoan moi | `USER` |
| `LOGIN_SUCCESS` | Dang nhap thanh cong | `USER` |
| `LOGIN_FAILED` | Dang nhap that bai | `USER` hoac null |
| `LOGOUT` | Dang xuat | `USER` |
| `VIEW_PROFILE` | Xem thong tin ca nhan | `USER` |
| `VIEW_USER_LIST` | Admin xem danh sach user | `USER` |
| `CHANGE_USER_ROLE` | Admin thay doi role | `USER` |

Cac controller lien quan: `src/controllers/auth.controller.js` va `src/routes/auth.routes.js`.

### Product management

| Action | Mo ta | Target |
|---|---|---|
| `CREATE_PRODUCT` | Tao san pham | `PRODUCT` |
| `UPDATE_PRODUCT` | Cap nhat san pham | `PRODUCT` |
| `DELETE_PRODUCT` | Xoa san pham | `PRODUCT` |
| `PURCHASE_PRODUCT` | Mua truc tiep mot san pham | `PRODUCT` |
| `UPLOAD_PRODUCT_IMAGE` | Them hoac cap nhat anh san pham | `PRODUCT` |

`GET_PRODUCTS`, `SEARCH_PRODUCTS` va `VIEW_PRODUCT` chi can audit neu co yeu cau truy vet viec truy cap du lieu.

Controller lien quan: `src/controllers/product.controller.js`.

### Cart

| Action | Mo ta | Target |
|---|---|---|
| `VIEW_CART` | Xem gio hang | `CART` |
| `ADD_CART_ITEM` | Them san pham vao gio hang | `CART_ITEM` |
| `UPDATE_CART_ITEM` | Cap nhat so luong | `CART_ITEM` |
| `REMOVE_CART_ITEM` | Xoa san pham khoi gio hang | `CART_ITEM` |

Controller lien quan: `src/controllers/cart.controller.js`.

### Orders

| Action | Mo ta | Target |
|---|---|---|
| `CHECKOUT` | Tao don hang tu gio hang | `ORDER` |
| `VIEW_MY_ORDERS` | Xem cac don hang cua minh | `ORDER` |
| `CANCEL_ORDER` | Huy don hang, neu co API | `ORDER` |
| `UPDATE_ORDER_STATUS` | Cap nhat trang thai don hang, neu co API | `ORDER` |
| `REFUND_ORDER` | Hoan tien, neu co API | `ORDER` |

Controller lien quan: `src/controllers/order.controller.js`.

## 3. Action bao mat va phan quyen

Nen ghi audit ngay trong middleware de bao phu moi endpoint:

| Action | Dieu kien |
|---|---|
| `INVALID_TOKEN` | Token thieu, sai format hoac khong hop le |
| `TOKEN_EXPIRED` | JWT da het han |
| `ACCESS_DENIED` | User khong co role phu hop |
| `VALIDATION_FAILED` | Du lieu dau vao khong hop le |
| `INTERNAL_ERROR` | Loi he thong trong thao tac quan trong |

Middleware lien quan: `src/middlewares/auth.middleware.js` va `src/middlewares/error.middleware.js`.

## 4. Cac ham nen co trong audit service

### `writeAuditLog(event)`

Append mot dong JSON vao file `logs/audit-events.jsonl`. Ham nay phai bat loi noi bo va khong lam request that bai.

### `getAuditContext(req)`

Lay context chung tu request:

- `requestId` tu `req.requestId`
- `actorId` tu `req.user.id` neu da dang nhap
- `actorRole` tu `req.user.role`
- `clientIp` tu request
- HTTP method
- URL hoac route pattern
- User-Agent

### `sanitizeAuditDetail(data)`

Loai bo cac truong nhay cam truoc khi ghi log:

- `password`
- `token`
- `accessToken`
- `refreshToken`
- thong tin the thanh toan
- du lieu upload khong can thiet

### `logSuccess(req, action, target, detail)`

Ghi event voi `result: "success"` sau khi service thuc hien thanh cong.

### `logFailure(req, action, error, target, detail)`

Ghi event voi `result: "failure"`, chi ghi ma loi an toan, khong ghi stack trace hoac thong bao loi co the chua du lieu nhay cam.

### `ensureAuditDirectory()`

Tao thu muc `logs/` neu chua ton tai truoc khi ghi file.

### `rotateAuditFile()`

Nen co khi file audit lon. Co the rotate theo dung luong hoac theo ngay, vi du:

- `audit-events-2026-09-14.jsonl`
- `audit-events-2026-09-15.jsonl`

## 5. Vi tri goi audit

- `auth.controller.js`: `register`, `login`, `logout`, `me`, `users`, `changeUserRole`.
- `product.controller.js`: `createProduct`, `updateProduct`, `deleteProduct`, `purchaseProduct`.
- `cart.controller.js`: `addItem`, `updateItem`, `removeItem`, va tuy chon `getCurrentCart`.
- `order.controller.js`: `checkout`, `getMyOrders`.
- `auth.middleware.js`: token sai, token het han va truy cap khong du quyen.
- `error.middleware.js`: loi he thong va request that bai neu chua duoc ghi o controller.

De tranh ghi trung lap, moi action chi nen co mot noi chiu trach nhiem ghi audit.

## 6. Format mot audit event

```json
{
	"occurredAt": "2026-09-14T10:00:00.000Z",
	"requestId": "request-id",
	"actorId": 12,
	"actorRole": "ADMIN",
	"action": "UPDATE_PRODUCT",
	"targetType": "PRODUCT",
	"targetId": "45",
	"result": "success",
	"clientIp": "127.0.0.1",
	"method": "PUT",
	"path": "/api/product/45",
	"detail": {
		"changedFields": ["price", "stock_quantity"]
	}
}
```

## 7. Mapping voi audit_events hien tai

| File audit | Bang `audit_events` |
|---|---|
| `occurredAt` | `occurred_at` |
| `requestId` | `request_id` |
| `actorId` | `actor_id` |
| `actorRole` | `actor_role` |
| `action` | `action` |
| `targetType` | `target_type` |
| `targetId` | `target_id` |
| `result` | `result` |
| `clientIp` | `client_ip` |
| `detail` | `detail` |

Nen giu ca file audit va bang database neu can vua debug nhanh vua truy van, thong ke va bao cao audit.
