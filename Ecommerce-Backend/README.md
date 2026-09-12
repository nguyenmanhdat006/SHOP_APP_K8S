# Shopee Ecommerce Backend

Backend cho ứng dụng Shopee, xây dựng với Node.js, Express, Prisma và
PostgreSQL. Backend cung cấp API sản phẩm, authentication, phân quyền, giỏ
hàng, đơn hàng và Prometheus metrics.

## 1. Cài đặt và chạy

### Yêu cầu

- Node.js 18+
- PostgreSQL
- Biến môi trường `DATABASE_URL`

### Cài đặt

```bash
npm install
npx prisma generate
npx prisma migrate deploy
```

Chạy môi trường development:

```bash
npm run dev
```

Chạy production:

```bash
npm start
```

Ví dụ biến môi trường:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/ecommerce_db?schema=public
JWT_SECRET=change-this-in-production
PORT=8080
FRONTEND_ORIGIN=http://localhost:5173
ADMIN_EMAIL=admin@shopee.local
```

## 2. Tài khoản demo và seed

Tạo dữ liệu mẫu:

```bash
npm run seed
```

Tài khoản demo:

| Role | Email | Password |
|---|---|---|
| Customer | `customer@shopee.local` | `customer123` |
| Shop owner | `owner@shopee.local` | `owner123` |
| Admin | `admin@shopee.local` | `admin123` |

Seed có thể chạy lặp lại. Tài khoản được cập nhật theo email; các sản phẩm demo
được thay thế theo tên. Không sử dụng mật khẩu demo trong production.

## 3. Phân quyền

| Role | Quyền chính |
|---|---|
| `CUSTOMER` | Xem sản phẩm, quản lý cart, checkout và xem đơn hàng của mình |
| `SHOP_OWNER` | Thêm, sửa, xoá và quản lý sản phẩm |
| `ADMIN` | Toàn quyền sản phẩm và quản lý role người dùng |

Các API cần đăng nhập nhận header:

```http
Authorization: Bearer <jwt-token>
```

Đăng ký công khai luôn tạo tài khoản `CUSTOMER`. Role `SHOP_OWNER` và `ADMIN`
chỉ được cấp bởi admin hoặc cơ chế cấu hình admin ban đầu.

## 4. API chính

Base URL local: `http://localhost:8080`

### 4.1 Health check

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| `GET` | `/health` | Không | Kiểm tra backend đang hoạt động |

### 4.2 Authentication

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| `POST` | `/api/auth/register` | Không | Tạo tài khoản customer |
| `POST` | `/api/auth/login` | Không | Đăng nhập và nhận JWT |
| `POST` | `/api/auth/logout` | Không | Kết thúc phiên phía client |
| `GET` | `/api/auth/me` | Có | Lấy thông tin user hiện tại |
| `GET` | `/api/auth/users` | `ADMIN` | Danh sách tài khoản |
| `PATCH` | `/api/auth/users/:id/role` | `ADMIN` | Đổi role tài khoản |

Request đăng ký:

```json
{
	"name": "Mia Customer",
	"email": "customer@example.com",
	"password": "strong-password"
}
```

Request đổi role:

```json
{
	"role": "SHOP_OWNER"
}
```

### 4.3 Products

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| `GET` | `/api/products` | Không | Lấy danh sách sản phẩm |
| `GET` | `/api/products/search?keyword=phone` | Không | Tìm kiếm sản phẩm |
| `GET` | `/api/product/:id` | Không | Lấy chi tiết sản phẩm |
| `GET` | `/api/product/:id/image` | Không | Lấy ảnh sản phẩm |
| `POST` | `/api/product` | `SHOP_OWNER`, `ADMIN` | Tạo sản phẩm |
| `PUT` | `/api/product/:id` | `SHOP_OWNER`, `ADMIN` | Cập nhật sản phẩm |
| `DELETE` | `/api/product/:id` | `SHOP_OWNER`, `ADMIN` | Xoá sản phẩm |

API tạo/cập nhật sản phẩm sử dụng `multipart/form-data` với:

- `imageFile`: file ảnh sản phẩm
- `product`: JSON blob chứa thông tin sản phẩm

### 4.4 Cart

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| `GET` | `/api/cart` | Có | Lấy cart của user hiện tại |
| `POST` | `/api/cart/items` | Có | Thêm sản phẩm vào cart |
| `PATCH` | `/api/cart/items/:productId` | Có | Cập nhật số lượng |
| `DELETE` | `/api/cart/items/:productId` | Có | Xoá sản phẩm khỏi cart |

Request thêm/cập nhật item:

```json
{
	"productId": 1,
	"quantity": 2
}
```

Mỗi user có một cart riêng. Quan hệ này được quản lý bằng `carts.user_id` và
`cart_items.cart_id`.

### 4.5 Orders

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| `POST` | `/api/orders/checkout` | Có | Tạo order từ cart hiện tại |
| `GET` | `/api/orders` | Có | Lấy các order của user hiện tại |

Checkout thực hiện trong transaction:

1. Đọc các item trong cart.
2. Kiểm tra tồn kho.
3. Trừ tồn kho.
4. Tạo `orders` và `order_items`.
5. Xoá các item trong cart.

Nếu một bước thất bại, transaction được rollback.

## 5. Entity và database tables

Schema chính nằm tại `prisma/schema.prisma`; migration nằm tại
`prisma/migrations/`. Entity domain được expose trong `src/entities/`.

| Table | Mục đích |
|---|---|
| `roles` | Danh sách role hệ thống |
| `users` | Tài khoản và thông tin xác thực |
| `products` | Catalog sản phẩm và tồn kho |
| `carts` | Cart riêng của từng user |
| `cart_items` | Các sản phẩm trong cart |
| `orders` | Thông tin đơn hàng |
| `order_items` | Snapshot sản phẩm trong đơn hàng |

Prisma chịu trách nhiệm query, migration và foreign key; entity classes chuẩn
hóa dữ liệu domain và document tên table cho service layer.

## 6. Prometheus metrics

Backend expose endpoint:

```http
GET /metrics
```

Endpoint này không yêu cầu authentication để Prometheus trong cluster có thể
scrape trực tiếp.

### 6.1 Runtime metrics

`src/config/metrics.js` tạo một `Registry` riêng và bật
`collectDefaultMetrics`, gồm các metric runtime của Node.js như CPU, memory,
event loop và garbage collection.

### 6.2 HTTP RED metrics

| Metric | Type | Labels |
|---|---|---|
| `http_requests_total` | Counter | `method`, `route`, `status` |
| `http_request_duration_seconds` | Histogram | `method`, `route` |
| `http_requests_in_flight` | Gauge | Không có |

Histogram sử dụng bucket cố định theo giây:

```text
0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10
```

### 6.3 Security metrics

| Metric | Type | Labels |
|---|---|---|
| `login_failed_total` | Counter | `reason` |
| `auth_token_invalid_total` | Counter | `reason` |

Các giá trị `reason` được giới hạn trong tập cố định:

- `wrong_password`
- `user_not_found`
- `account_locked`
- `token_expired`
- `token_malformed`

### 6.4 Cardinality và route normalization

Metrics không dùng URL thật làm label. Express route được chuẩn hóa theo route
pattern:

```text
/api/product/:id
```

Vì vậy `/api/product/1` và `/api/product/2` dùng cùng một chuỗi metrics.
Request 404 không match route được gom vào:

```text
route="unmatched"
```

Không đưa vào label các thông tin có cardinality cao như user ID, product ID,
order ID, email, IP, query string, request ID hoặc error message tự do.

### 6.5 Request ID

`src/middlewares/requestId.middleware.js`:

- Đọc `X-Request-ID` do ingress cung cấp.
- Tự sinh UUID nếu request chưa có ID.
- Trả lại ID qua response header `X-Request-ID`.
- Ghi request ID vào error log.

Request ID không được đưa vào Prometheus label.

### 6.6 Files triển khai metrics

- `src/config/metrics.js`: registry và metric definitions.
- `src/middlewares/metrics.middleware.js`: đo request bằng `res.on("finish")`.
- `src/middlewares/requestId.middleware.js`: quản lý request ID.
- `src/app.js`: đăng ký middleware và endpoint `/metrics`.
- `src/middlewares/auth.middleware.js`: ghi token invalid metrics.
- `src/services/auth.service.js`: ghi login failure metrics.

### 6.7 Kiểm tra local

```bash
npm start
curl -s http://localhost:8080/metrics | head -30
curl -s -D- -o /dev/null http://localhost:8080/health
```

Kiểm tra route cardinality:

```bash
curl -s http://localhost:8080/api/product/1 > /dev/null
curl -s http://localhost:8080/api/product/2 > /dev/null
curl -s http://localhost:8080/api/product/99 > /dev/null
curl -s http://localhost:8080/metrics | grep 'http_requests_total'
```

Kết quả phải gom các request product vào route pattern, không tạo route riêng
cho từng product ID.

## 7. Cấu trúc chính

```text
src/
	config/          Prisma và Prometheus registry
	controllers/     HTTP request handlers
	entities/        Domain entity mappings
	middlewares/     Auth, metrics, request ID và error handling
	routes/          API route definitions
	services/        Business logic và database operations
prisma/
	schema.prisma    Database schema
	migrations/      Versioned database migrations
	seed.js          Demo accounts và products
```
