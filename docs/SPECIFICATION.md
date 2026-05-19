# Software Requirement Specification — Employee Q&A Platform

## 1. Tổng quan hệ thống

### 1.1 Mục đích
Ứng dụng cho phép nhân viên (employee) đặt câu hỏi ẩn danh tới ban quản trị (admin) mà không cần đăng nhập hoặc để lại danh tính. Admin có thể nhận, trả lời, phân loại câu hỏi và publish các câu hỏi hay lên trang công khai.

### 1.2 Đối tượng sử dụng

| Đối tượng | Mô tả |
|---|---|
| **Employee** | Nhân viên công ty, không cần tài khoản |
| **Admin** | Quản trị viên, có tài khoản riêng, nhiều admin cùng lúc |

### 1.3 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript |
| Backend | Node.js (Express hoặc Fastify) |
| Database | PostgreSQL |
| File Storage | Local disk hoặc S3-compatible (ảnh đính kèm) |
| Auth | JWT (access token + refresh token) |

### 1.4 Hai site chính

| Site | URL pattern | Đối tượng |
|---|---|---|
| **Employee Site** | `/` | Nhân viên — không cần đăng nhập |
| **Admin Site** | `/admin/*` | Quản trị viên — bắt buộc đăng nhập |

---

## 2. Yêu cầu chức năng

---

### 2.1 Employee Site

#### 2.1.1 Trang chủ (`/`)

**Mô tả:** Giao diện chính cho employee gồm 2 phần: form đặt câu hỏi và danh sách câu hỏi hay công khai.

**Form đặt câu hỏi ẩn danh:**
- Textarea nhập nội dung câu hỏi (bắt buộc, tối thiểu 10 ký tự)
- Upload ảnh đính kèm (tùy chọn, 1 ảnh, tối đa 5MB, định dạng: JPG/PNG/GIF/WEBP)
- Preview ảnh trước khi submit
- Nút Submit
- Sau khi submit thành công:
  - Hiển thị modal/banner thông báo thành công
  - Hiển thị link duy nhất (ví dụ: `https://domain.com/q/abc123...`) kèm nút Copy
  - Cảnh báo rõ ràng: *"Hãy lưu lại link này. Nếu mất link, bạn sẽ không thể xem lại câu hỏi và câu trả lời."*

**Danh sách câu hỏi hay (Featured Questions):**
- Hiển thị các câu hỏi được admin chọn publish, sắp xếp theo thứ tự admin đặt
- Mỗi item hiển thị: tag(s), câu hỏi, câu trả lời, ảnh (nếu có)
- Có thể lọc theo tag
- Chỉ hiển thị các câu hỏi có `is_visible = true`

---

#### 2.1.2 Trang theo dõi thread (`/q/:accessToken`)

**Mô tả:** Employee dùng link này để xem câu hỏi và theo dõi câu trả lời.

**Trạng thái hiển thị:**

| Trường hợp | Hiển thị |
|---|---|
| Token hợp lệ, chưa hết hạn | Hiển thị thread đầy đủ |
| Token không tồn tại | Trang 404: "Không tìm thấy câu hỏi" |
| Thread đã hết hạn (> 30 ngày, không featured) | Trang thông báo: "Link này đã hết hạn sau 30 ngày" |
| Thread bị admin ẩn | Trang 404: "Không tìm thấy câu hỏi" (không tiết lộ lý do) |

**Nội dung trang (nếu hợp lệ):**
- Hiển thị toàn bộ lịch sử hội thoại theo thứ tự thời gian (dạng chat/thread)
  - Tin nhắn employee: căn trái, nhãn "Bạn" hoặc "Employee"
  - Tin nhắn admin: căn phải, nhãn "Ban quản lý" / "Admin"
  - Hiển thị thời gian tương đối (ví dụ: "2 giờ trước")
  - Hiển thị ảnh đính kèm nếu có
- Form reply (chỉ hiện nếu thread chưa đóng):
  - Textarea nhập câu hỏi tiếp theo
  - Upload ảnh đính kèm (1 ảnh, max 5MB)
  - Nút gửi
- Trạng thái thread:
  - `open`: đang chờ admin trả lời — hiển thị badge "Đang chờ phản hồi"
  - `answered`: admin đã trả lời — hiển thị badge "Đã phản hồi"
  - `closed`: thread đã đóng — ẩn form reply, hiển thị "Cuộc hội thoại đã kết thúc"
- Thời gian còn lại đến khi hết hạn (nếu không phải featured thread)

---

### 2.2 Admin Site

#### 2.2.1 Đăng nhập (`/admin/login`)

- Form: username + password
- Xử lý sai thông tin: hiển thị lỗi chung "Tên đăng nhập hoặc mật khẩu không đúng"
- Đăng nhập thành công → redirect đến `/admin/questions`
- Dùng JWT: access token (15 phút) + refresh token (7 ngày) lưu trong httpOnly cookie

---

#### 2.2.2 Dashboard — Danh sách câu hỏi (`/admin/questions`)

**Bộ lọc:**

| Bộ lọc | Loại | Mô tả |
|---|---|---|
| Ngày | Date picker | Lọc theo ngày tạo thread |
| Trạng thái | Dropdown | all / open / answered / hidden / closed |
| Tag | Multi-select | Lọc theo tag đã gán |
| Từ khóa | Search box | Tìm trong nội dung tin nhắn đầu tiên |

**Danh sách thread:**
- Sắp xếp mặc định: mới nhất trước (có thể thay đổi)
- Mỗi item hiển thị:
  - Preview nội dung câu hỏi đầu tiên (tối đa 100 ký tự)
  - Tags đã gán
  - Badge trạng thái (open / answered / hidden / closed)
  - Số lượng tin nhắn trong thread
  - Thời gian tạo
  - Icon ảnh nếu có đính kèm
  - Badge "Câu hỏi hay" nếu `is_featured = true`
  - Thời gian hết hạn (nếu áp dụng)
- Click vào item → mở trang chi tiết thread
- Pagination (20 items/trang)

---

#### 2.2.3 Chi tiết thread (`/admin/questions/:threadId`)

**Phần hiển thị hội thoại:**
- Hiển thị toàn bộ lịch sử tin nhắn (tương tự employee view)
- Phân biệt rõ tin nhắn employee và admin
- Mỗi tin nhắn hiển thị: nội dung, ảnh (nếu có), thời gian, tên admin (nếu là admin)

**Actions trên thread:**

| Action | Mô tả |
|---|---|
| Reply | Textarea + upload ảnh → gửi tin nhắn admin |
| Gán tag | Multi-select tags, áp dụng ngay |
| Ẩn thread | Đổi status = 'hidden'; employee xem link sẽ thấy 404 |
| Hiện lại | Đổi status về trạng thái trước (open/answered) |
| Đóng thread | Đổi status = 'closed'; employee không reply được nữa |
| Add to Featured | Mở form featured (xem 2.2.4) |
| Remove from Featured | Xóa khỏi danh sách câu hỏi hay, link trở lại có expiry |

---

#### 2.2.4 Form thêm câu hỏi hay (modal/drawer)

Mở khi admin click "Add to Featured" trên thread.

**Các trường:**
- **Câu hỏi hiển thị công khai**: textarea, pre-fill = nội dung tin nhắn đầu tiên, admin có thể chỉnh sửa
- **Câu trả lời hiển thị công khai**: textarea, pre-fill = nội dung tin nhắn admin gần nhất, admin có thể chỉnh sửa
- **Ảnh đính kèm**: chọn từ ảnh trong thread hoặc upload mới
- **Tags**: multi-select từ danh sách tags (inherit từ thread_tags hoặc thêm mới)
- **Hiển thị ngay**: toggle (is_visible)
- Nút: Lưu / Hủy

---

#### 2.2.5 Quản lý câu hỏi hay (`/admin/featured`)

- Danh sách tất cả featured questions
- Bộ lọc: tag, is_visible
- Mỗi item: preview câu hỏi, câu trả lời, tags, trạng thái visible
- Actions: Chỉnh sửa nội dung | Ẩn/Hiện | Xóa khỏi featured | Kéo thả sắp xếp thứ tự

---

#### 2.2.6 Quản lý tags (`/admin/tags`)

- Danh sách tags
- Tạo tag mới: name_vi, name_en, color (color picker)
- Chỉnh sửa tag
- Xóa tag (cảnh báo nếu tag đang được dùng)

---

#### 2.2.7 Thông báo (Notification)

**In-app notification bell (hiển thị trên header admin):**
- Badge số lượng unread
- Dropdown hiển thị danh sách 20 notifications gần nhất
- Mỗi item: icon type, preview nội dung, thời gian, trạng thái đọc/chưa đọc
- Click vào notification → điều hướng tới thread tương ứng + mark as read
- Nút "Mark all as read"

**Trigger tạo notification:**

| Event | Type | Cho ai |
|---|---|---|
| Employee submit câu hỏi mới | `new_question` | Tất cả admins |
| Employee reply thêm trong thread | `new_reply` | Tất cả admins |

**Lưu ý:** Admin reply KHÔNG tạo notification (chỉ employee action mới trigger).

**Real-time:** Dùng polling (mỗi 30 giây) hoặc WebSocket/SSE để cập nhật unread count.

---

#### 2.2.8 Quản lý tài khoản admin (`/admin/accounts`)

- Danh sách admins
- Tạo tài khoản admin mới: username, display_name, password
- Vô hiệu hóa/kích hoạt tài khoản (`is_active`)
- Đổi mật khẩu
- Xóa tài khoản (không xóa được tài khoản đang đăng nhập)

**Lưu ý:** Mọi admin đều có quyền ngang nhau, bao gồm quản lý tài khoản admin khác.

---

## 3. Yêu cầu phi chức năng

### 3.1 Bảo mật

| Yêu cầu | Chi tiết |
|---|---|
| Password | Bcrypt với salt rounds = 12 |
| JWT | Access token 15 phút, Refresh token 7 ngày (httpOnly cookie) |
| Access token | `access_token` của thread phải đủ ngẫu nhiên (crypto random, 48+ bytes → 64 ký tự hex) |
| Rate limiting | POST /api/questions: tối đa 5 requests/IP/15 phút |
| File upload | Validate MIME type server-side, không chỉ dựa vào extension |
| Hidden thread | Trả về 404, không phân biệt "bị ẩn" hay "không tồn tại" |
| SQL injection | Dùng parameterized queries |
| XSS | Sanitize input, Content-Security-Policy header |

### 3.2 Hiệu năng

| Yêu cầu | Chi tiết |
|---|---|
| Response time | API response < 500ms (p95) |
| Image | Resize/compress ảnh về tối đa 1920px chiều dài khi upload |
| Pagination | Admin question list: 20 items/trang |

### 3.3 Đa ngôn ngữ (i18n)

- Hỗ trợ Tiếng Việt (`vi`) và Tiếng Anh (`en`)
- Ngôn ngữ mặc định: Tiếng Việt
- Language toggle trên cả Employee Site và Admin Site
- Dùng thư viện: `react-i18next`

### 3.4 Dọn dẹp dữ liệu

- Scheduled job chạy hàng ngày lúc 02:00 AM server time
- Xóa các thread có `expires_at < NOW()` và `is_featured = false`
- Xóa file ảnh tương ứng khỏi storage

---

## 4. API Endpoints

### Public API (Employee — không cần auth)

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/questions` | Tạo thread + gửi câu hỏi đầu tiên |
| GET | `/api/questions/:accessToken` | Lấy thread và toàn bộ messages |
| POST | `/api/questions/:accessToken/messages` | Employee gửi reply |
| GET | `/api/featured` | Lấy danh sách featured questions công khai |
| GET | `/api/tags` | Lấy danh sách tags (dùng để filter featured) |
| POST | `/api/upload/image` | Upload ảnh, trả về URL |

### Admin API (Yêu cầu JWT)

**Auth:**
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/admin/auth/login` | Đăng nhập |
| POST | `/api/admin/auth/logout` | Đăng xuất |
| POST | `/api/admin/auth/refresh` | Refresh access token |
| GET | `/api/admin/auth/me` | Lấy thông tin admin hiện tại |

**Questions:**
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/admin/questions` | Danh sách threads (filter: date, status, tag, keyword, page) |
| GET | `/api/admin/questions/:threadId` | Chi tiết thread + messages |
| PATCH | `/api/admin/questions/:threadId/status` | Đổi status (hidden, closed, open) |
| POST | `/api/admin/questions/:threadId/messages` | Admin gửi reply |
| POST | `/api/admin/questions/:threadId/tags` | Gán tags cho thread |
| DELETE | `/api/admin/questions/:threadId/tags/:tagId` | Xóa tag khỏi thread |

**Featured:**
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/admin/featured` | Danh sách featured questions |
| POST | `/api/admin/questions/:threadId/feature` | Thêm vào featured |
| PUT | `/api/admin/featured/:featuredId` | Chỉnh sửa nội dung/visibility |
| DELETE | `/api/admin/featured/:featuredId` | Xóa khỏi featured |
| PUT | `/api/admin/featured/reorder` | Cập nhật thứ tự hiển thị |

**Tags:**
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/admin/tags` | Danh sách tags |
| POST | `/api/admin/tags` | Tạo tag mới |
| PUT | `/api/admin/tags/:tagId` | Cập nhật tag |
| DELETE | `/api/admin/tags/:tagId` | Xóa tag |

**Notifications:**
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/admin/notifications` | Danh sách notifications (unread count, recent 20) |
| POST | `/api/admin/notifications/:notificationId/read` | Mark một notification là đã đọc |
| POST | `/api/admin/notifications/read-all` | Mark tất cả là đã đọc |

**Admin Accounts:**
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/admin/accounts` | Danh sách admin accounts |
| POST | `/api/admin/accounts` | Tạo tài khoản admin mới |
| PUT | `/api/admin/accounts/:adminId` | Cập nhật thông tin |
| PATCH | `/api/admin/accounts/:adminId/password` | Đổi mật khẩu |
| PATCH | `/api/admin/accounts/:adminId/toggle-active` | Vô hiệu hóa / kích hoạt |
| DELETE | `/api/admin/accounts/:adminId` | Xóa tài khoản |

---

## 5. Màn hình UI

### Employee Site

| Màn hình | Route | Mô tả |
|---|---|---|
| Trang chủ | `/` | Form đặt câu hỏi + danh sách câu hỏi hay |
| Thread của tôi | `/q/:accessToken` | Xem hội thoại, reply tiếp |
| 404 / Hết hạn | — | Trang thông báo lỗi |

### Admin Site

| Màn hình | Route | Mô tả |
|---|---|---|
| Đăng nhập | `/admin/login` | Form login |
| Danh sách câu hỏi | `/admin/questions` | Dashboard chính |
| Chi tiết câu hỏi | `/admin/questions/:threadId` | Xem + reply + manage |
| Câu hỏi hay | `/admin/featured` | Quản lý featured questions |
| Tags | `/admin/tags` | Quản lý tags |
| Tài khoản | `/admin/accounts` | Quản lý admin accounts |

---

## 6. Cấu trúc project đề xuất

```
/
├── client/                    # React + TypeScript frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── employee/      # Employee site pages
│   │   │   └── admin/         # Admin site pages
│   │   ├── components/        # Shared components
│   │   ├── hooks/             # Custom hooks
│   │   ├── services/          # API calls
│   │   ├── i18n/              # Translations (vi.json, en.json)
│   │   └── types/             # TypeScript types
│   └── package.json
│
├── server/                    # Node.js backend
│   ├── src/
│   │   ├── routes/            # API route handlers
│   │   ├── middleware/        # Auth, rate limit, error handler
│   │   ├── services/          # Business logic
│   │   ├── db/                # Database queries / migrations
│   │   ├── utils/             # Helpers (token gen, file upload...)
│   │   └── types/             # TypeScript types
│   └── package.json
│
├── docs/
│   ├── SPECIFICATION.md       # File này
│   └── DATABASE_DESIGN.md     # Thiết kế database
│
└── README.md
```

---

## 7. Luồng hoạt động chính (User Flows)

### Flow 1: Employee đặt câu hỏi lần đầu
```
Employee vào trang chủ (/)
  → Nhập câu hỏi (+ ảnh tùy chọn)
  → Submit
  → Hệ thống tạo thread + access_token
  → Hiển thị link /q/{access_token}
  → Employee copy link, lưu lại
```

### Flow 2: Employee theo dõi và hỏi thêm
```
Employee mở link /q/{access_token}
  → Hệ thống kiểm tra: tồn tại? hết hạn? bị ẩn?
  → Nếu hợp lệ: hiển thị thread
  → Employee thấy câu trả lời của admin
  → Employee gửi câu hỏi tiếp nếu chưa thỏa mãn
```

### Flow 3: Admin xử lý câu hỏi
```
Admin nhận notification (bell icon)
  → Vào /admin/questions
  → Lọc theo ngày / status
  → Mở thread chi tiết
  → Gán tags cho thread
  → Gửi reply
  → (Tùy chọn) Ẩn thread nếu không phù hợp
  → (Tùy chọn) Add to Featured nếu câu hỏi hay
```

### Flow 4: Admin publish câu hỏi hay
```
Admin mở thread đã có câu trả lời
  → Click "Add to Featured"
  → Chỉnh sửa/xác nhận nội dung câu hỏi và trả lời
  → Chọn tags
  → Toggle "Hiển thị ngay" = ON
  → Lưu → thread không còn hết hạn
  → Câu hỏi xuất hiện trên trang chủ Employee Site
```
