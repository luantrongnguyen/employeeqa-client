# Database Design — Employee Q&A Platform

## Overview

- **Database**: PostgreSQL
- **Conventions**: UUID primary keys, `TIMESTAMPTZ` for all timestamps, snake_case naming
- **Scale**: ~50–100 employees, low-traffic internal tool

---

## Entity Relationship Summary

```
admins ─────────────────────────────────────────────┐
  │                                                  │
  │ (published_by)                                   │ (admin_id)
  ▼                                                  ▼
featured_questions ◄──── question_threads ◄──── messages
                              │                      │
                              │ (M2M)                │ (1:1)
                              ▼                      ▼
                           thread_tags           notifications
                              │                      │
                              ▼                      ▼
                            tags            notification_reads ◄── admins
```

---

## Tables

### 1. `admins`
Tài khoản quản trị viên.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK, default gen_random_uuid() | |
| `username` | VARCHAR(50) | UNIQUE, NOT NULL | Tên đăng nhập |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt hash |
| `display_name` | VARCHAR(100) | NOT NULL | Tên hiển thị |
| `is_active` | BOOLEAN | DEFAULT true | Có thể vô hiệu hóa admin |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | |

---

### 2. `tags`
Danh mục/nhãn phân loại câu hỏi.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | |
| `name_vi` | VARCHAR(100) | NOT NULL | Tên tiếng Việt |
| `name_en` | VARCHAR(100) | NOT NULL | Tên tiếng Anh |
| `color` | VARCHAR(7) | DEFAULT '#6B7280' | Màu hex cho UI |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |

---

### 3. `question_threads`
Mỗi thread đại diện cho một phiên hỏi–đáp ẩn danh (linked bởi access_token).

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | |
| `access_token` | VARCHAR(64) | UNIQUE, NOT NULL | Token ngẫu nhiên tạo link cho employee |
| `status` | VARCHAR(20) | CHECK IN ('open','answered','hidden','closed') | Trạng thái thread |
| `is_featured` | BOOLEAN | DEFAULT false | Đã được chọn vào danh sách câu hỏi hay |
| `expires_at` | TIMESTAMPTZ | NULLABLE | NULL nếu is_featured = true; ngược lại = created_at + 30 ngày |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | |

**Notes:**
- `access_token` được sinh khi employee submit câu hỏi đầu tiên. Link employee nhận được: `/q/{access_token}`
- Khi `is_featured` được set = true, `expires_at` được set = NULL (không hết hạn)
- `status = 'hidden'`: thread bị admin ẩn, employee truy cập link sẽ thấy thông báo "không tìm thấy"

---

### 4. `messages`
Từng tin nhắn trong thread — bao gồm cả câu hỏi của employee và câu trả lời của admin.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | |
| `thread_id` | UUID | FK → question_threads.id, ON DELETE CASCADE | |
| `sender_type` | VARCHAR(10) | CHECK IN ('employee','admin'), NOT NULL | |
| `admin_id` | UUID | FK → admins.id, ON DELETE SET NULL, NULLABLE | NULL nếu sender_type = 'employee' |
| `content` | TEXT | NOT NULL | Nội dung tin nhắn |
| `image_url` | VARCHAR(500) | NULLABLE | Đường dẫn file ảnh đã upload |
| `image_original_name` | VARCHAR(255) | NULLABLE | Tên file gốc |
| `image_size_bytes` | INTEGER | NULLABLE | Kích thước file (max 5MB = 5,242,880 bytes) |
| `is_hidden` | BOOLEAN | DEFAULT false | Admin ẩn tin nhắn này |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |

**Notes:**
- Tin nhắn đầu tiên (message #1) của thread luôn là `sender_type = 'employee'`
- Sau đó employee và admin có thể luân phiên nhắn tiếp
- Mỗi tin nhắn chỉ đính kèm được 1 ảnh, tối đa 5MB

---

### 5. `thread_tags`
Quan hệ nhiều–nhiều giữa thread và tag. Admin gán tag cho thread để phân loại.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `thread_id` | UUID | FK → question_threads.id, ON DELETE CASCADE | |
| `tag_id` | UUID | FK → tags.id, ON DELETE CASCADE | |
| **PK** | | (thread_id, tag_id) | |

---

### 6. `featured_questions`
Phiên bản công khai của câu hỏi hay — admin có thể chỉnh sửa nội dung trước khi publish.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | |
| `thread_id` | UUID | FK → question_threads.id, UNIQUE, ON DELETE CASCADE | Mỗi thread chỉ có 1 featured version |
| `published_question` | TEXT | NOT NULL | Câu hỏi hiển thị công khai (gốc hoặc đã chỉnh sửa) |
| `published_answer` | TEXT | NOT NULL | Câu trả lời hiển thị công khai |
| `published_image_url` | VARCHAR(500) | NULLABLE | Ảnh hiển thị công khai (nếu có) |
| `published_by` | UUID | FK → admins.id, ON DELETE SET NULL | Admin tạo/cập nhật |
| `is_visible` | BOOLEAN | DEFAULT true | Ẩn/hiện trên trang public |
| `display_order` | INTEGER | DEFAULT 0 | Thứ tự hiển thị (admin có thể sắp xếp) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | |

**Notes:**
- Tags của featured question được lấy từ `thread_tags` thông qua `thread_id`
- Khi featured question được tạo, `question_threads.is_featured` = true và `expires_at` = NULL

---

### 7. `notifications`
Mỗi sự kiện phát sinh (câu hỏi mới, reply mới) tạo ra 1 notification record.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | |
| `thread_id` | UUID | FK → question_threads.id, ON DELETE CASCADE | |
| `message_id` | UUID | FK → messages.id, ON DELETE CASCADE | Tin nhắn gây ra notification |
| `type` | VARCHAR(20) | CHECK IN ('new_question','new_reply'), NOT NULL | |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | |

---

### 8. `notification_reads`
Theo dõi trạng thái đã đọc/chưa đọc của từng admin cho từng notification.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `notification_id` | UUID | FK → notifications.id, ON DELETE CASCADE | |
| `admin_id` | UUID | FK → admins.id, ON DELETE CASCADE | |
| `read_at` | TIMESTAMPTZ | DEFAULT NOW() | |
| **PK** | | (notification_id, admin_id) | |

**Notes:**
- Nếu một admin chưa có record trong bảng này cho notification đó → notification chưa đọc
- Unread count = tổng notification chưa có record trong notification_reads với admin_id tương ứng

---

## Indexes

```sql
-- Lookup employee link
CREATE INDEX idx_threads_access_token ON question_threads(access_token);

-- Admin filter by date
CREATE INDEX idx_threads_created_at ON question_threads(created_at DESC);

-- Admin filter by status
CREATE INDEX idx_threads_status ON question_threads(status);

-- Featured questions for public page
CREATE INDEX idx_threads_featured ON question_threads(is_featured) WHERE is_featured = true;

-- Expiry check (scheduled cleanup job)
CREATE INDEX idx_threads_expires_at ON question_threads(expires_at) WHERE expires_at IS NOT NULL;

-- Fetch messages in a thread
CREATE INDEX idx_messages_thread_id ON messages(thread_id, created_at ASC);

-- Admin notification list
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Unread count per admin
CREATE INDEX idx_notification_reads_admin_id ON notification_reads(admin_id);

-- Featured questions display order
CREATE INDEX idx_featured_visible ON featured_questions(is_visible, display_order);
```

---

## Luồng dữ liệu chính

### Employee đặt câu hỏi lần đầu
1. Employee submit form → Backend tạo `question_threads` (generate `access_token`, set `expires_at = NOW() + 30 days`)
2. Tạo `messages` record đầu tiên (`sender_type = 'employee'`)
3. Tạo `notifications` record (`type = 'new_question'`)
4. Trả về link: `/q/{access_token}`

### Admin trả lời
1. Admin POST reply → Tạo `messages` record (`sender_type = 'admin'`, `admin_id`)
2. Cập nhật `question_threads.status = 'answered'`, `updated_at = NOW()`
3. Tạo `notifications` record (`type = 'new_reply'`) → **không** tạo notification khi admin reply

### Employee hỏi thêm
1. Employee vào link → GET `/q/{access_token}` (kiểm tra `expires_at`, `status`)
2. Employee submit thêm → Tạo `messages` record (`sender_type = 'employee'`)
3. Cập nhật `question_threads.status = 'open'`, `updated_at = NOW()`
4. Tạo `notifications` record (`type = 'new_reply'`)

### Admin feature câu hỏi
1. Admin chọn "Add to featured" → Mở form chỉnh sửa nội dung
2. Admin confirm → Tạo `featured_questions` record
3. Cập nhật `question_threads.is_featured = true`, `expires_at = NULL`
4. Gán tags qua `thread_tags` (nếu chưa có)

### Thread hết hạn
- Scheduled job chạy hàng ngày: `DELETE FROM question_threads WHERE expires_at < NOW() AND is_featured = false`
- Cascade delete: messages, thread_tags, notifications, notification_reads tự động xóa
