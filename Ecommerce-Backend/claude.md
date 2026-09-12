# CLAUDE.md — Instrument backend cho Prometheus

Nhiệm vụ: thêm metric Prometheus vào `Ecommerce-Backend` (Node.js + Express + Prisma).

Không chỉ là cài thư viện. Có bốn phần: thư viện, middleware ghi nhận mỗi request,
endpoint `/metrics`, và **chuẩn hoá tên route**. Phần cuối dễ làm sai nhất và hậu quả
nghiêm trọng nhất.

---

## Bối cảnh

| Hạng mục | Giá trị |
|---|---|
| Backend | Node.js, Express, Prisma ORM |
| Cấu trúc | `src/{config,controllers,entities,middlewares,routes,services}`, `app.js`, `index.js` |
| Cụm | Kubernetes 1.30, 3 node, namespace `dev` / `staging` / `prod` |
| Giám sát | kube-prometheus-stack, release `monitoring` |
| Ingress | ingress-nginx, đã bật `generate-request-id` |

Prometheus đang giữ khoảng 54.000 chuỗi dữ liệu với giới hạn 3GB và chạy trên vùng nhớ
tạm. Quy tắc cardinality bên dưới là ràng buộc cứng — vi phạm sẽ làm sập hệ thống giám sát.

---

## RÀNG BUỘC BẮT BUỘC

### 1. Dùng mẫu route, không dùng đường dẫn thật

```
ĐÚNG:  route="/api/products/:id"      → 1 chuỗi dữ liệu cho mọi sản phẩm
SAI:   route="/api/products/12847"    → 1 chuỗi dữ liệu cho MỖI sản phẩm
```

Với Express, mẫu route lấy từ `req.route.path`, **không** lấy `req.path` hay
`req.originalUrl`. Nếu router được mount ở tiền tố thì phải ghép thêm `req.baseUrl`.

### 2. Cấm đưa các giá trị sau vào nhãn

Mã người dùng, mã đơn hàng, mã sản phẩm, email, số điện thoại, địa chỉ IP, URL có query
string, thông báo lỗi tự do, hoặc bất kỳ giá trị nào do người dùng nhập.

Những thông tin này thuộc về log, không thuộc về nhãn metric.

### 3. Request không khớp route phải gom về nhãn cố định

Khi Express không tìm được route (mã 404), `req.route` là `undefined`. Phải gán
`route = "unmatched"`, tuyệt đối không lấy đường dẫn thật — một đợt dò quét endpoint sẽ
tạo hàng nghìn chuỗi dữ liệu rác.

### 4. Loại trừ chính endpoint metric

Không đo request tới `/metrics` và các endpoint kiểm tra sức khoẻ.

---

## Thư viện

```bash
npm install prom-client
```

Không cần thư viện nào khác. `prom-client` là thư viện chính thức cho Node.js.

---

## Các tệp cần tạo hoặc sửa

### `src/config/metrics.js` — tạo mới

Nơi khai báo registry và toàn bộ metric. Khai báo **một lần** ở đây, không tạo metric
mới trong mỗi request.

Nội dung cần có:

- Tạo `Registry` riêng, gọi `collectDefaultMetrics({ register })` để bật metric runtime
  của Node (bộ nhớ heap, độ trễ vòng lặp sự kiện, thu gom rác)
- Khai báo ba metric bắt buộc bên dưới
- Export registry và các metric

**Metric bắt buộc:**

| Tên | Kiểu | Nhãn |
|---|---|---|
| `http_requests_total` | Counter | `method`, `route`, `status` |
| `http_request_duration_seconds` | Histogram | `method`, `route` |
| `http_requests_in_flight` | Gauge | — |

Metric thứ ba không thuộc RED nhưng phải có: khi nó tăng mà tần suất request không tăng,
đó là dấu hiệu sớm nhất cho thấy ứng dụng đang chậm dần.

Bucket cho histogram — dùng đúng bộ này, không dùng mặc định của thư viện:

```js
buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
```

Đơn vị là **giây**, không phải mili giây. Mỗi bucket là một chuỗi dữ liệu riêng nên
không thêm bucket ngoài danh sách trên.

**Metric bảo mật** — nên có, phục vụ Mục 7.1.3 của tài liệu giám sát:

| Tên | Kiểu | Nhãn |
|---|---|---|
| `login_failed_total` | Counter | `reason` |
| `auth_token_invalid_total` | Counter | `reason` |

Nhãn `reason` phải là tập hữu hạn định nghĩa sẵn: `wrong_password`, `user_not_found`,
`account_locked`, `token_expired`, `token_malformed`. Không truyền thông báo lỗi vào đó.

Gọi các counter này từ `src/services` hoặc `src/controllers` tương ứng, tại đúng chỗ xử
lý đăng nhập và xác thực token.

### `src/middlewares/metrics.middleware.js` — tạo mới

Middleware đo mỗi request. Logic:

1. Bỏ qua nếu `req.path` là `/metrics` hoặc endpoint kiểm tra sức khoẻ
2. Tăng `http_requests_in_flight`
3. Ghi mốc thời gian bắt đầu
4. Đăng ký `res.on('finish', ...)` — **không** dùng `res.on('close')` vì nó kích hoạt cả
   khi client ngắt kết nối giữa chừng
5. Trong callback: giảm gauge, tính thời gian, lấy mẫu route, ghi vào counter và histogram

**Lấy mẫu route đúng cách** — phần quan trọng nhất của toàn bộ nhiệm vụ:

```js
function getRoutePattern(req) {
  if (!req.route) return 'unmatched';
  const base = req.baseUrl || '';
  return (base + req.route.path) || '/';
}
```

`req.route` chỉ có giá trị **sau khi** Express đã khớp route, nên bắt buộc đọc trong
callback `finish`, không đọc lúc middleware chạy.

Với router mount kiểu `app.use('/api/products', productRouter)` và route
`router.get('/:id', ...)`, kết quả là `/api/products/:id` — đúng như mong muốn.

### `src/middlewares/requestId.middleware.js` — tạo mới

Đọc mã định danh do ingress-nginx sinh ra:

1. Đọc tiêu đề `x-request-id`
2. Nếu trống thì tự sinh bằng `crypto.randomUUID()`
3. Gán vào `req.requestId`
4. Đặt lại vào tiêu đề phản hồi: `res.setHeader('X-Request-ID', requestId)`
5. Ghi vào mọi dòng log của request đó

Bước 4 quan trọng: khi người dùng báo lỗi, họ cung cấp được mã này và việc tra cứu trở
nên trực tiếp.

**Không** đưa `requestId` vào nhãn metric — nó có số giá trị không giới hạn.

### `src/app.js` — sửa

Thứ tự đăng ký quan trọng:

```
1. requestId middleware        sớm nhất, để mọi thứ sau đó dùng được
2. metrics middleware          trước các route
3. các route hiện có
4. GET /metrics                sau route, trước error handler
5. error handler
```

Endpoint `/metrics`:

- Đường dẫn `/metrics`, phương thức GET
- Đặt `Content-Type` theo `register.contentType`
- Trả về `await register.metrics()`
- **Không** đặt xác thực — Prometheus scrape từ trong cụm

---

## Metric của Prisma — tuỳ chọn nhưng nên làm

Prisma Client có sẵn khả năng xuất metric ở định dạng Prometheus, gồm số kết nối trong bể
và độ trễ truy vấn. Đây chính là nhóm metric phụ thuộc mà tài liệu giám sát nêu ở Mục 4.6.3.

Bật trong `prisma/schema.prisma`:

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["metrics"]
}
```

Chạy lại `npx prisma generate`.

Trong endpoint `/metrics`, nối output của Prisma vào sau output của `prom-client`:

```js
const appMetrics = await register.metrics();
const prismaMetrics = await prisma.$metrics.prometheus();
res.end(appMetrics + prismaMetrics);
```

Lưu ý: đây là tính năng preview của Prisma, tên metric có thể đổi giữa các phiên bản. Nếu
bản Prisma đang dùng không hỗ trợ thì bỏ qua phần này, không phải lỗi.

Giá trị mang lại: phát hiện được bể kết nối cạn — sự cố không để lại dấu vết ở metric tài
nguyên, vì CPU và bộ nhớ đều thấp trong khi mọi request xếp hàng chờ kết nối.

---

## Thay đổi phía Kubernetes

Hai thay đổi này nằm ở repo hạ tầng, không phải repo backend.

### 1. Đặt tên cho port trong Service

ServiceMonitor tham chiếu port theo **TÊN**, không theo số. Đây là lỗi bị bỏ sót nhiều nhất.

Trong `app/base/backend.yaml`:

```yaml
spec:
  ports:
    - name: http          # BẮT BUỘC
      port: 8080
      targetPort: 8080
```

Thay `8080` bằng cổng thật của backend.

### 2. Tạo `app/base/servicemonitor.yaml`

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: backend
spec:
  selector:
    matchLabels:
      app: backend        # phải khớp metadata.labels của Service
  endpoints:
    - port: http          # TÊN port, không phải số
      path: /metrics
      interval: 30s
```

Kiểm tra nhãn thật trước khi viết:

```bash
kubectl -n ecommerce get svc backend -o jsonpath='{.metadata.labels}'
```

Thêm `- servicemonitor.yaml` vào `resources` của `app/base/kustomization.yaml`.

### 3. Không cần làm thêm

Prometheus đã được cấu hình `serviceMonitorSelectorNilUsesHelmValues: false`, nên
ServiceMonitor không cần nhãn `release`.

---

## Cách kiểm chứng

Theo thứ tự, mỗi bước loại bớt một nhóm nguyên nhân.

### 1. Chạy cục bộ, endpoint hoạt động

```bash
npm start
curl localhost:8080/metrics | head -30
```

Phải thấy `# HELP`, `# TYPE` và tên metric đã khai báo.

### 2. Kiểm tra cardinality — bước quan trọng nhất

```bash
curl -s localhost:8080/metrics | grep -c "^http_requests_total"

# Goi vai duong dan co tham so khac nhau
curl -s localhost:8080/api/products/1  > /dev/null
curl -s localhost:8080/api/products/2  > /dev/null
curl -s localhost:8080/api/products/99 > /dev/null

curl -s localhost:8080/metrics | grep -c "^http_requests_total"
```

Số dòng **không được tăng** theo số sản phẩm. Nếu tăng thì `getRoutePattern` sai và phải
sửa trước khi triển khai lên cụm.

Kiểm tra thêm với đường dẫn không tồn tại:

```bash
curl -s localhost:8080/khong-ton-tai > /dev/null
curl -s localhost:8080/metrics | grep "^http_requests_total" | grep unmatched
```

Phải thấy đúng một dòng có `route="unmatched"`.

### 3. Tiêu đề request id được trả về

```bash
curl -s -D- -o /dev/null localhost:8080/ | grep -i request-id
```

### 4. Sau khi triển khai lên cụm

```bash
kubectl -n ecommerce get endpoints backend
# Cot ENDPOINTS phai co IP pod

curl -s http://localhost:30090/api/v1/targets \
  | jq -r '.data.activeTargets[] | select(.labels.job|test("backend")) | "\(.health) \(.scrapeUrl)"'

curl -sG --data-urlencode 'query=count by (namespace) (http_requests_total)' \
  http://localhost:30090/api/v1/query | jq -r '.data.result[] | "\(.metric.namespace) \(.value[1])"'
```

### 5. Truy vấn RED chạy được

```promql
sum(rate(http_requests_total{status=~"5.."}[5m]))
  / sum(rate(http_requests_total[5m]))

histogram_quantile(0.99, sum by (le, route) (
  rate(http_request_duration_seconds_bucket[5m])))

http_requests_in_flight
```

---

## Những điều KHÔNG được làm

- Không dùng `req.path` hay `req.originalUrl` làm nhãn `route`
- Không đưa giá trị do người dùng nhập vào nhãn
- Không đặt xác thực trên `/metrics`
- Không đo chính request tới `/metrics`
- Không tạo metric mới trong mỗi request — khai báo một lần ở `src/config/metrics.js`
- Không dùng `res.on('close')` thay cho `res.on('finish')`
- Không dùng mili giây cho histogram thời gian — quy ước Prometheus là giây
- Không đặt hậu tố `_total` cho gauge, không bỏ `_total` ở counter
- Không đưa `requestId` vào nhãn metric

---

## Tiêu chí hoàn thành

- [ ] `npm install prom-client` đã chạy, có trong `package.json`
- [ ] `src/config/metrics.js` khai báo registry và ba metric bắt buộc
- [ ] `src/middlewares/metrics.middleware.js` đo đúng qua `res.on('finish')`
- [ ] `getRoutePattern` trả về mẫu route, không phải đường dẫn thật
- [ ] Request 404 gom về `route="unmatched"`
- [ ] `src/middlewares/requestId.middleware.js` đọc và trả lại `X-Request-ID`
- [ ] `GET /metrics` trả đúng `Content-Type`
- [ ] `/metrics` bị loại khỏi middleware đo lường
- [ ] Metric runtime của Node đã bật
- [ ] Số chuỗi `http_requests_total` không tăng theo số bản ghi dữ liệu
- [ ] Service có `name` cho port
- [ ] `app/base/servicemonitor.yaml` đã tạo và thêm vào kustomization

---

## Tham chiếu tài liệu giám sát

| Mục | Nội dung |
|---|---|
| 4.6.1 | Nhóm RED và quy tắc nhãn |
| 4.6.3 | Metric phụ thuộc bên ngoài (Prisma, cơ sở dữ liệu) |
| 5.6 | Access log tại Ingress, cơ chế sinh mã định danh |
| 7.1.3 | Metric bảo mật từ ứng dụng |
| 8.1 | Điều kiện tiên quyết của chuỗi truy vết |