# Luồng Hoạt Động (Workflows) Hệ Thống Personal Time Manager

Tài liệu này mô tả tổng quan luồng hoạt động của hệ thống Personal Time Manager, bao gồm kiến trúc chung và các luồng chức năng (functional workflows) chính. Tài liệu này rất hữu ích để đính kèm vào báo cáo đồ án tốt nghiệp.

## 1. Kiến trúc Tổng quan (High-level Architecture)

Hệ thống được thiết kế theo mô hình Client-Server:
- **Client (Frontend):** Ứng dụng Single Page Application (SPA) xây dựng bằng React.js (Vite), tương tác với người dùng.
- **Server (Backend):** Cung cấp các RESTful APIs được xây dựng bằng Spring Boot (Java), xử lý logic nghiệp vụ và giao tiếp với cơ sở dữ liệu.
- **Database:** CSDL Quan hệ MySQL, dùng để lưu trữ dữ liệu người dùng, công việc, thói quen, và phiên làm việc Pomodoro.

```mermaid
sequenceDiagram
    participant User as Người dùng
    participant UI as Giao diện (React)
    participant API as Backend API (Spring Boot)
    participant DB as Database (MySQL)

    User->>UI: Thao tác (Click, nhập liệu, v.v.)
    UI->>API: Gửi HTTP Request (kèm JWT Token)
    API->>API: Xác thực (Authentication) & Phân quyền (Authorization)
    API->>DB: Truy vấn/Cập nhật dữ liệu
    DB-->>API: Trả kết quả dữ liệu
    API-->>UI: Trả về HTTP Response (JSON)
    UI-->>User: Cập nhật giao diện hiển thị
```

## 2. Các Luồng Chức Năng Chính (Main Functional Workflows)

### 2.1. Luồng Xác Thực và Phân Quyền (Authentication & Authorization)
Bảo vệ tài nguyên hệ thống, đảm bảo mỗi người dùng chỉ truy cập được dữ liệu của mình.

```mermaid
sequenceDiagram
    participant U as Người dùng
    participant F as Frontend (React)
    participant B as Backend (Spring Boot)
    participant DB as Cơ sở dữ liệu

    U->>F: Nhập Email & Mật khẩu (Trang Login)
    F->>B: POST /api/auth/login
    B->>DB: Kiểm tra thông tin người dùng
    alt Thông tin hợp lệ
        B->>B: Tạo Access Token (JWT)
        B-->>F: Trả về 200 OK (JWT Token + Thông tin cơ bản)
        F->>F: Lưu Token vào Local Storage / Context
        F-->>U: Chuyển hướng đến màn hình Dashboard
    else Không hợp lệ
        B-->>F: Trả về 401 Unauthorized
        F-->>U: Hiển thị thông báo lỗi "Sai tài khoản/mật khẩu"
    end
```

### 2.2. Luồng Quản Lý Công Việc (Task Management Workflow)
Luồng này chịu trách nhiệm cho các thao tác CRUD (Tạo, Đọc, Sửa, Xóa) trên đối tượng Công việc (Task).

```mermaid
sequenceDiagram
    participant User as Người dùng
    participant React as Frontend (React)
    participant Spring as Backend (Spring Boot)
    participant DB as MySQL Database

    %% 1. Lấy danh sách
    User->>React: Truy cập trang Danh sách/Lịch
    React->>Spring: GET /api/tasks (Kèm JWT Token)
    Spring->>DB: SELECT * FROM tasks WHERE user_id = ?
    DB-->>Spring: Kết quả danh sách Task
    Spring-->>React: Trả về JSON Array chứa Tasks
    React-->>User: Hiển thị giao diện danh sách/lịch

    %% 2. Tạo mới
    User->>React: Nhập thông tin & Nhấn "Thêm công việc"
    React->>React: Validate dữ liệu (Kiểm tra Tiêu đề trống...)
    React->>Spring: POST /api/tasks (Body: Task DTO)
    Spring->>Spring: Kiểm tra hợp lệ dữ liệu tại Backend
    Spring->>DB: INSERT INTO tasks (...)
    DB-->>Spring: Trả về ID công việc mới
    Spring-->>React: Trả về Object Task vừa tạo (201 Created)
    React-->>User: Tự động chèn công việc mới vào màn hình

    %% 3. Sửa / Xóa / Trạng thái
    User->>React: Bấm Sửa / Xóa / Checkbox Hoàn thành
    React->>Spring: PUT /api/tasks/{id} (hoặc DELETE, PUT .../status)
    Spring->>DB: UPDATE hoặc DELETE dữ liệu
    DB-->>Spring: Xác nhận hoàn tất
    Spring-->>React: Trả về 200 OK
    React-->>User: Làm mới giao diện (Xóa khỏi list/Gạch ngang tên)
```

**Mô tả chi tiết các tiến trình:**
- **Khởi tạo trang (View/Read):** Khi người dùng vào trang `TaskList` hoặc `CalendarView`, Frontend tự động gọi API `GET /api/tasks`. (Riêng trang Lịch sẽ gửi thêm tham số `start_date` và `end_date` để lọc công việc theo tháng hiện tại).
- **Thêm mới (Create):** Dữ liệu nhập từ Form được Frontend kiểm tra sơ bộ (chặn lỗi bỏ trống tiêu đề), sau đó gửi `POST /api/tasks`. Backend nhận Request, lưu DB, và trả về bản ghi mới để Frontend thêm vào State, làm giao diện cập nhật ngay lập tức mà không bị chớp trang (reload).
- **Cập nhật nội dung (Update):** Khi bấm sửa, hệ thống mở Form chứa dữ liệu cũ. Sau khi thay đổi và lưu, gọi `PUT /api/tasks/{id}`.
- **Xóa (Delete):** Người dùng bấm xóa, hiển thị hộp thoại xác nhận. Nếu đồng ý, gọi `DELETE /api/tasks/{id}` và loại bỏ công việc đó khỏi State của Frontend.
- **Chuyển đổi trạng thái (Toggle Status):** Click trực tiếp vào Checkbox hoàn thành, Frontend lập tức gạch ngang chữ và làm mờ (Optimistic UI Update), đồng thời chạy ngầm API `PUT /api/tasks/{id}/status` lên Backend để đồng bộ trạng thái `COMPLETED` hoặc `PENDING`.

### 2.3. Luồng Theo Dõi Thói Quen (Habit Tracking Workflow)
Giúp người dùng xây dựng và duy trì các thói quen tốt hằng ngày.

```mermaid
flowchart TD
    A[Người dùng truy cập Habit Tracker] --> B{Đã có thói quen?}
    B -- Không --> C[Tạo thói quen mới]
    C --> D[Lưu vào Database]
    B -- Có --> E[Hiển thị danh sách thói quen]
    E --> F[Người dùng 'Check-in' thói quen trong ngày]
    F --> G[Cập nhật chuỗi (Streak) & Tiến độ]
    G --> H[Lưu log thói quen vào Database]
    H --> I[Cập nhật lại UI: Thanh Progress, Streak Count]
```

### 2.4. Luồng Kỹ Thuật Pomodoro (Pomodoro Timer Workflow)
Hỗ trợ quản lý thời gian tập trung làm việc/học tập và liên kết trực tiếp với công việc (task).

1. **Khởi tạo:** Người dùng truy cập `PomodoroPage` và chọn một công việc (task) cần tập trung thực hiện.
2. **Đếm ngược:** Người dùng bấm "Start". Frontend bắt đầu bộ đếm ngược (thường là 25 phút làm việc).
3. **Hoàn thành phiên:** Khi hết thời gian, Frontend hiển thị thông báo (Notification/Âm thanh).
4. **Lưu dữ liệu:** Frontend tự động gọi API `POST /api/pomodoros` để lưu phiên làm việc (lưu thời lượng, ID của task).
5. **Nghỉ ngơi:** Hệ thống tự động chuyển sang khoảng thời gian nghỉ ngơi (Short Break - 5 phút hoặc Long Break - 15 phút) trước khi bắt đầu vòng mới.

### 2.5. Luồng Báo Cáo & Thống Kê (Dashboard & Reporting Workflow)
Hệ thống tính toán và hiển thị các số liệu thống kê để người dùng theo dõi sự tiến bộ và năng suất.

- **Màn hình chính (Dashboard):** Khi load trang `Dashboard`, Frontend gửi request đến `DashboardController` để lấy các thẻ thông tin tổng quan (KPIs): Tổng số công việc trong ngày, số công việc đã hoàn thành, tổng thời gian đã dùng cho Pomodoro.
- **Báo cáo chi tiết (ReportPage):** Người dùng có thể phân tích thời gian làm việc theo tuần/tháng. Frontend gọi `GET /api/reports/pomodoro?period=week`. Backend nhóm dữ liệu (thực hiện truy vấn GROUP BY theo ngày/tuần) và gửi về mảng số liệu. Frontend dùng `Chart.js` để render các biểu đồ Cột/Tròn sinh động trực quan.

---
*Tài liệu này được sinh ra nhằm mục đích hỗ trợ quá trình phát triển dự án và làm tư liệu cho báo cáo đồ án tốt nghiệp môn học.*
