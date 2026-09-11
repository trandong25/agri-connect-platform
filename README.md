# AgriConnect

AgriConnect là ứng dụng thương mại điện tử nông sản hướng đến người dùng còn hạn chế về kỹ năng số. Hệ thống hỗ trợ người tiêu dùng mua nông sản trực tuyến, nông dân đăng và quản lý sản phẩm, KOC quảng bá sản phẩm và theo dõi hoa hồng, đồng thời cung cấp trang quản trị cho quản trị viên.

## Kiến trúc tổng quan

Hệ thống được xây dựng theo mô hình Client–Server:

- **Mobile client:** React Native + Expo + TypeScript.
- **Backend:** Django + Django REST Framework.
- **Cơ sở dữ liệu:** MySQL.
- **Lưu trữ media:** Cloudinary.
- **Xác thực:** JWT với Simple JWT.
- **Computer Vision:** OpenCV và YOLO, được tích hợp trong luồng xử lý hình ảnh sản phẩm của backend.

Ứng dụng di động giao tiếp với backend thông qua REST API và trao đổi dữ liệu dưới dạng JSON.

## Nhóm người dùng

- **Consumer:** tìm kiếm sản phẩm, quản lý giỏ hàng, đặt hàng, theo dõi đơn hàng và đánh giá sản phẩm.
- **Farmer:** đăng và quản lý sản phẩm, quản lý hình ảnh, xử lý SellerOrder và theo dõi doanh thu.
- **KOC:** lựa chọn sản phẩm để quảng bá, tạo bài quảng bá và theo dõi hoa hồng.
- **Admin:** xét duyệt hồ sơ, quản lý dữ liệu hệ thống và xem thông tin thống kê thông qua Django Admin.

## Chức năng chính

### Consumer

- Đăng ký, đăng nhập và quản lý tài khoản.
- Tìm kiếm và xem chi tiết sản phẩm.
- Quản lý giỏ hàng.
- Đặt hàng với COD hoặc thanh toán ONLINE mô phỏng.
- Theo dõi trạng thái đơn hàng.
- Đánh giá sản phẩm sau khi đơn hoàn thành.

### Farmer

- Đăng ký tài khoản Farmer và chờ xét duyệt.
- Tạo sản phẩm ở trạng thái `DRAFT`.
- Quản lý sản phẩm và hình ảnh.
- Đánh giá chất lượng hình ảnh trước khi đăng bán.
- Chuyển sản phẩm sang `AVAILABLE` khi đáp ứng điều kiện.
- Xem và cập nhật trạng thái SellerOrder theo thứ tự:
  `PENDING -> CONFIRMED -> SHIPPING -> COMPLETED`.
- Theo dõi doanh thu.

### KOC

- Đăng ký tài khoản KOC và chờ xét duyệt.
- Lựa chọn sản phẩm đang bán để quảng bá.
- Tạo AffiliateLink và PromotionPost.
- Theo dõi hoa hồng từ các đơn hàng có nguồn tiếp thị liên kết.

### Admin

- Quản lý người dùng và dữ liệu hệ thống.
- Xét duyệt hồ sơ Farmer và KOC.
- Quản lý sản phẩm, đơn hàng, thanh toán và tiếp thị liên kết.
- Xem các số liệu tổng quan thông qua Django Admin.

## Computer Vision

Computer Vision không được triển khai thành một service riêng mà nằm trong phần xử lý sản phẩm của backend.

Các xử lý chính gồm:

- OpenCV đánh giá độ mờ, độ sáng, độ tương phản, vùng quá tối và quá sáng.
- YOLO hỗ trợ đánh giá bố cục dựa trên bounding box khi có kết quả phát hiện phù hợp.
- Nếu ảnh có lỗi chất lượng nghiêm trọng, hệ thống trả trạng thái yêu cầu chụp hoặc chọn lại ảnh.
- Việc YOLO không phát hiện được đối tượng không tự động làm ảnh bị từ chối.

## Công nghệ sử dụng

### Backend

- Python 3.11.6
- Django 5.2.16
- Django REST Framework 3.17.1
- Simple JWT 5.5.1
- MySQL
- Cloudinary 1.45.0
- pytest 9.1.1
- pytest-django 4.12.0

### Mobile

- React Native 0.86.3
- React 19.2.3
- TypeScript 6.0.3
- Expo 57.0.19
- Axios 1.20.0
- Redux Toolkit 2.12.0
- React Navigation

## Cấu trúc chính

```text
agri-connect-platform/
├── backend/
│   ├── accounts/
│   ├── products/
│   ├── orders/
│   ├── payments/
│   ├── reviews/
│   ├── affiliates/
│   ├── notifications/
│   ├── config/
│   ├── ml_models/
│   ├── manage.py
│   └── requirements.txt
│
└── mobile/
    ├── screens/
    ├── components/
    ├── navigation/
    ├── services/
    ├── store/
    ├── types/
    └── package.json
```

> Cấu trúc trên chỉ liệt kê các thư mục chính phục vụ việc đọc và chạy dự án.

## Cài đặt backend

### 1. Di chuyển vào dự án và kích hoạt môi trường ảo

Trên Windows:

```bash
cd D:\agri-connect-platform
.venv\Scripts\activate
cd backend
```

### 2. Cài thư viện

```bash
pip install -r requirements.txt
```

### 3. Cấu hình môi trường

Đảm bảo các thông tin kết nối MySQL, Cloudinary và các khóa cấu hình cần thiết đã được khai báo trong file cấu hình môi trường của backend.

Không commit khóa bí mật, mật khẩu hoặc thông tin xác thực lên Git.

### 4. Kiểm tra project

```bash
python manage.py check
```

### 5. Migration cơ sở dữ liệu

Chỉ thực hiện khi cần tạo mới cơ sở dữ liệu hoặc có thay đổi model:

```bash
python manage.py migrate
```

### 6. Chạy backend

```bash
python manage.py runserver
```

Backend local mặc định:

```text
http://127.0.0.1:8000
```

## Cài đặt mobile

### 1. Di chuyển vào thư mục mobile

```bash
cd mobile
```

### 2. Cài dependency

```bash
npm install
```

### 3. Cấu hình địa chỉ backend

Kiểm tra file `.env` hoặc file cấu hình API đang được project sử dụng và đặt địa chỉ backend phù hợp với môi trường chạy:

- Chạy web trên cùng máy: có thể sử dụng `http://127.0.0.1:8000`.
- Chạy trên điện thoại thật: sử dụng địa chỉ IP LAN của máy chạy Django.

### 4. Chạy ứng dụng

```bash
npm start
```

Hoặc:

```bash
npm run android
npm run web
```

## Kiểm thử backend

```bash
cd backend
python manage.py test
```

Các nhóm chức năng đã có test gồm Accounts, Products, Cart/Orders, Payments, Affiliates, Reviews và các kiểm tra về phân quyền/phạm vi dữ liệu.

## Quy tắc nghiệp vụ đáng chú ý

- Farmer và KOC chỉ sử dụng chức năng nghiệp vụ sau khi hồ sơ được duyệt.
- Product mới được tạo ở trạng thái `DRAFT`.
- Product chỉ được chuyển sang `AVAILABLE` khi đáp ứng điều kiện hình ảnh.
- Một Order có thể được tách thành nhiều SellerOrder theo từng Farmer.
- SellerOrder phải cập nhật trạng thái theo đúng thứ tự.
- Payment hỗ trợ `COD` và `ONLINE`; ONLINE hiện là nghiệp vụ mô phỏng.
- AffiliateLink được dùng để giữ nguồn quảng bá từ quá trình mua hàng đến OrderItem.
- Commission được ghi nhận khi SellerOrder tương ứng hoàn thành.
- Notification của hệ thống được lưu trong cơ sở dữ liệu và truy cập thông qua REST API.

## Giới hạn hiện tại

Phiên bản hiện tại chưa triển khai đầy đủ:

- Cổng thanh toán trực tuyến thực tế.
- Đơn vị vận chuyển thực tế.
- Nghiệp vụ hủy, đổi hoặc hoàn trả đơn hàng đầy đủ.
- Kiểm thử tải lớn và đánh giá trên số lượng người dùng thực tế lớn.
- Đánh giá chất lượng thực tế của nông sản bằng Computer Vision.

Computer Vision chỉ hỗ trợ đánh giá cách hình ảnh được chụp và trình bày.

## Tác giả

Đồ án ngành Công nghệ Thông tin – Trường Đại học Mở TP.HCM, 2026.
