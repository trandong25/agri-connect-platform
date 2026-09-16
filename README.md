# AgriConnect

## Giới thiệu

AgriConnect là ứng dụng thương mại điện tử nông sản hướng đến người dùng còn hạn chế về kỹ năng số. Hệ thống hỗ trợ người tiêu dùng mua nông sản, nông dân đăng và quản lý sản phẩm, KOC quảng bá sản phẩm và quản trị viên quản lý dữ liệu hệ thống.

Ứng dụng được xây dựng theo mô hình Client-Server. Mobile giao tiếp với backend thông qua REST API và trao đổi dữ liệu dưới dạng JSON.

## Chức năng chính

### **Consumer**

- Đăng ký, đăng nhập và quản lý tài khoản.
- Tìm kiếm và xem chi tiết sản phẩm.
- Quản lý giỏ hàng và địa chỉ nhận hàng.
- Đặt hàng bằng COD hoặc thanh toán ONLINE mô phỏng.
- Theo dõi trạng thái đơn hàng.
- Đánh giá sản phẩm sau khi đơn hàng hoàn thành.

### **Farmer**

- Đăng ký tài khoản nông dân và chờ quản trị viên xét duyệt.
- Tạo và quản lý sản phẩm.
- Tải lên và đánh giá hình ảnh sản phẩm.
- Cập nhật giá bán và số lượng tồn kho.
- Đăng bán sản phẩm khi đáp ứng điều kiện hình ảnh.
- Xử lý các SellerOrder thuộc phạm vi của mình theo đúng trình tự trạng thái.

### **KOC**

- Đăng ký tài khoản KOC và chờ xét duyệt.
- Tìm kiếm và lựa chọn sản phẩm để quảng bá.
- Tạo AffiliateLink và PromotionPost.
- Theo dõi hoa hồng phát sinh từ hoạt động tiếp thị liên kết.

### **Admin**

- Quản lý tài khoản và dữ liệu hệ thống bằng Django Admin.
- Xét duyệt hồ sơ Farmer và KOC.
- Khóa hoặc mở tài khoản.
- Quản lý sản phẩm, đơn hàng, thanh toán và hoa hồng.
- Xem thông tin thống kê tổng quan.

## Công nghệ sử dụng

### **Backend**

- Python 3.11.
- Django và Django REST Framework.
- Simple JWT.
- MySQL.
- Cloudinary.
- OpenCV, NumPy và YOLO11.
- pytest và pytest-django.

### **Mobile**

- React Native.
- React.
- Expo SDK 57.
- TypeScript.
- Axios.
- Redux Toolkit.
- React Navigation.

Phiên bản cụ thể của các thư viện được khai báo trong `backend/requirements.txt`, `mobile/package.json` và `mobile/package-lock.json`.

## Computer Vision

Computer Vision được tích hợp trong backend và xử lý ảnh theo hai bước:

1. OpenCV kiểm tra độ mờ, độ sáng, độ tương phản, vùng quá tối, vùng quá sáng và độ phân giải.
2. Nếu ảnh không có lỗi nghiêm trọng, YOLO11 lấy bounding box để hỗ trợ đánh giá kích thước, vị trí và khoảng cách của sản phẩm đến cạnh ảnh.

Nếu YOLO không phát hiện được đối tượng phù hợp, hệ thống vẫn giữ kết quả OpenCV và đánh dấu bố cục là `NOT_ANALYZED` thay vì tự động từ chối ảnh.

Checkpoint `yolo11_v6_best.pt` hỗ trợ 13 lớp trái cây: táo, chuối, cam, xoài, ổi, dứa, dưa hấu, dâu tây, lê, nho, đào, chanh và bưởi.

Computer Vision chỉ đánh giá kỹ thuật chụp và cách trình bày ảnh, không kết luận độ tươi, độ an toàn hoặc chất lượng thực tế của nông sản.

## Cấu trúc dự án

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
│   │   ├── opencv_quality_config.json
│   │   └── yolo11_v6_best.pt
│   ├── .env.example
│   ├── manage.py
│   ├── requirements.txt
│   ├── seed_demo.py
│   └── verify_cv_model.py
│
└── mobile/
    ├── assets/
    ├── src/
    │   ├── components/
    │   ├── navigation/
    │   ├── screens/
    │   ├── services/
    │   ├── store/
    │   ├── theme/
    │   └── types/
    ├── App.tsx
    ├── app.json
    ├── package.json
    └── package-lock.json
```

## Yêu cầu trước khi chạy

- Windows 11.
- Python 3.11.x.
- Node.js LTS và npm.
- MySQL Server hoặc MySQL Workbench.
- Tài khoản Cloudinary.
- Điện thoại Android đã cài Expo Go.
- Laptop và điện thoại kết nối cùng một mạng Wi-Fi.

## Cài đặt backend

### **1. Di chuyển vào thư mục dự án**

```bash
cd D:\agri-connect-platform
```

Nếu dự án nằm ở thư mục khác, thay đường dẫn trên bằng đường dẫn thực tế.

### **2. Tạo và kích hoạt môi trường ảo**

```bash
py -3.11 -m venv .venv
.venv\Scripts\activate
```

Nếu máy không nhận `py -3.11`, kiểm tra phiên bản Python:

```bash
python --version
```

Sau đó tạo môi trường bằng lệnh:

```bash
python -m venv .venv
.venv\Scripts\activate
```

### **3. Cài thư viện backend**

```bash
python -m pip install --upgrade pip
pip install -r backend\requirements.txt
```

### **4. Tạo file cấu hình môi trường**

```bash
copy backend\.env.example backend\.env
```

Tạo một `DJANGO_SECRET_KEY` mới:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Sao chép toàn bộ giá trị được in ra và gán vào `DJANGO_SECRET_KEY` trong `backend/.env`.

Mở `backend/.env` và điền các giá trị phù hợp:

```env
DJANGO_SECRET_KEY=khoa_bi_mat_vua_tao
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost,192.168.1.10

DB_NAME=agri_connect_db
DB_USER=agri_connect_user
DB_PASSWORD=mat_khau_mysql
DB_HOST=127.0.0.1
DB_PORT=3306

CLOUDINARY_CLOUD_NAME=cloud_name
CLOUDINARY_API_KEY=api_key
CLOUDINARY_API_SECRET=api_secret
```

Không commit file `backend/.env` lên GitHub.

### **5. Lấy địa chỉ IPv4 của laptop**

```bash
ipconfig
```

Trong kết quả, tìm `IPv4 Address` của bộ điều hợp Wi-Fi đang sử dụng. Ví dụ:

```text
192.168.1.10
```

Thay IP ví dụ trong `DJANGO_ALLOWED_HOSTS` bằng IP thực tế của laptop.

### **6. Tạo cơ sở dữ liệu MySQL**

Mở MySQL Workbench hoặc MySQL Command Line và chạy:

```sql
CREATE DATABASE agri_connect_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'agri_connect_user'@'localhost'
IDENTIFIED BY 'mat_khau_mysql';

GRANT ALL PRIVILEGES ON agri_connect_db.*
TO 'agri_connect_user'@'localhost';

FLUSH PRIVILEGES;
```

Tên database, tài khoản và mật khẩu phải khớp với `backend/.env`.

### **7. Kiểm tra model YOLO**

Model đã có sẵn tại:

```text
backend/ml_models/yolo11_v6_best.pt
```

Kiểm tra checkpoint:

```bash
cd backend
python verify_cv_model.py
```

Khi script thông báo checkpoint hợp lệ, backend đã sẵn sàng sử dụng OpenCV và YOLO.

### **8. Kiểm tra project và migration**

Tại thư mục `backend`:

```bash
python manage.py check
python manage.py migrate
```

Tạo tài khoản quản trị:

```bash
python manage.py createsuperuser
```

### **9. Tạo dữ liệu demo (tùy chọn)**

```bash
python seed_demo.py
```

Script cần `DJANGO_DEBUG=True`, cấu hình Cloudinary hợp lệ và sẽ tạo lại các tài khoản có username bắt đầu bằng `demo_`.

### **10. Chạy backend cho điện thoại trong cùng mạng Wi-Fi**

```bash
python manage.py runserver 0.0.0.0:8000
```

Giữ cửa sổ này hoạt động trong khi sử dụng ứng dụng.

Các địa chỉ dùng trên laptop:

- Django Admin: `http://127.0.0.1:8000/admin/`
- Swagger API: `http://127.0.0.1:8000/docs/`

Nếu Windows Firewall hỏi quyền truy cập, cho phép Python sử dụng **Private networks**.

## Cài đặt mobile

### **1. Cấu hình địa chỉ backend**

Mở file:

```text
mobile/src/services/api/apiClient.ts
```

Thay `API_BASE_URL` bằng IPv4 của laptop. Ví dụ:

```typescript
const API_BASE_URL = "http://192.168.1.10:8000/";
```

Địa chỉ này phải khớp với IP đã thêm vào `DJANGO_ALLOWED_HOSTS`.

Không sử dụng `127.0.0.1` trên điện thoại vì địa chỉ đó trỏ về chính điện thoại.

### **2. Cài thư viện mobile**

Mở một cửa sổ Command Prompt khác:

```bash
cd D:\agri-connect-platform\mobile
npm ci
```

### **3. Kiểm tra project mobile**

```bash
npx tsc --noEmit
npx expo-doctor
```

Nếu Expo Doctor báo package lệch phiên bản:

```bash
npx expo install --fix
npx expo-doctor
```

Sau khi dependency thay đổi, cần commit lại `package.json` và `package-lock.json`.

### **4. Chạy ứng dụng trên điện thoại**

```bash
npx expo start --clear
```

Sau khi mã QR xuất hiện:

1. Bảo đảm laptop và điện thoại kết nối cùng một mạng Wi-Fi.
2. Mở Expo Go trên điện thoại.
3. Quét mã QR để mở ứng dụng.
4. Giữ cả cửa sổ Django và Expo hoạt động trong quá trình sử dụng.

## Lệnh chạy lại dự án ở những lần sau

### **Backend**

```bash
cd D:\agri-connect-platform
.venv\Scripts\activate
cd backend
python manage.py runserver 0.0.0.0:8000
```

### **Mobile**

Mở một cửa sổ Command Prompt khác:

```bash
cd D:\agri-connect-platform\mobile
npx expo start --clear
```

## Kiểm thử

### **Backend**

Kích hoạt môi trường ảo, bảo đảm MySQL đang chạy và thực hiện tại thư mục `backend`:

```bash
python manage.py check
python -m pytest
python verify_cv_model.py
```

### **Mobile**

```bash
npx tsc --noEmit
npx expo-doctor
```

Khi kiểm tra Computer Vision, nên thử ảnh đạt yêu cầu, ảnh mờ, quá tối, cháy sáng, độ tương phản thấp và ảnh có sản phẩm lệch khỏi trung tâm.

## Quy tắc nghiệp vụ chính

- Farmer và KOC chỉ sử dụng chức năng nghiệp vụ sau khi hồ sơ được duyệt.
- Product mới được tạo ở trạng thái `DRAFT`.
- Product chỉ được chuyển sang `AVAILABLE` khi đáp ứng điều kiện hình ảnh.
- Một Order có thể được tách thành nhiều SellerOrder theo từng Farmer.
- SellerOrder cập nhật trạng thái theo thứ tự:

```text
PENDING -> CONFIRMED -> SHIPPING -> COMPLETED
```

- Payment hỗ trợ `COD` và `ONLINE`; ONLINE hiện chỉ là nghiệp vụ mô phỏng.
- Commission được ghi nhận khi SellerOrder tương ứng hoàn thành.
- Người tiêu dùng chỉ được đánh giá sản phẩm thuộc đơn hàng của mình đã hoàn thành.

## Lỗi thường gặp

### **Điện thoại báo Network Error**

Kiểm tra:

- Laptop và điện thoại đang dùng cùng Wi-Fi.
- Django đang chạy bằng `python manage.py runserver 0.0.0.0:8000`.
- `API_BASE_URL` sử dụng đúng IPv4 của laptop.
- IP đó đã được thêm vào `DJANGO_ALLOWED_HOSTS`.
- Windows Firewall cho phép Python sử dụng mạng riêng.
- Wi-Fi không bật chế độ cô lập các thiết bị trong cùng mạng.

Có thể mở địa chỉ sau trên trình duyệt điện thoại để kiểm tra kết nối:

```text
http://IP_LAPTOP:8000/docs/
```

Ví dụ:

```text
http://192.168.1.10:8000/docs/
```

### **Không kết nối được MySQL**

Kiểm tra MySQL Server đang chạy và các giá trị sau trong `backend/.env`:

```text
DB_NAME
DB_USER
DB_PASSWORD
DB_HOST
DB_PORT
```

### **Upload ảnh thất bại**

Kiểm tra cấu hình Cloudinary, kết nối Internet và file ảnh. API hỗ trợ JPEG, PNG và WEBP với dung lượng tối đa 5 MB.

### **Bố cục luôn là NOT_ANALYZED**

Kiểm tra file model:

```text
backend/ml_models/yolo11_v6_best.pt
```

Sau đó chạy lại:

```bash
python verify_cv_model.py
```

YOLO không phát hiện được đối tượng không làm ảnh tự động bị từ chối nếu bước OpenCV đã đạt.

## Giới hạn hiện tại

- Thanh toán ONLINE chỉ là mô phỏng.
- Chưa tích hợp đơn vị vận chuyển thực tế.
- Chưa triển khai đầy đủ quy trình hủy, đổi hoặc hoàn trả đơn hàng.
- Chưa kiểm thử tải lớn và đánh giá trên số lượng lớn người dùng thực tế.
- Computer Vision đôi khi vẫn có thể đưa ra cảnh báo chưa chính xác.
- Computer Vision không đánh giá chất lượng thực tế của nông sản.

## Lưu ý bảo mật

- Không commit `backend/.env` lên repository.
- Không chia sẻ `DJANGO_SECRET_KEY`.
- Không commit mật khẩu MySQL hoặc khóa Cloudinary.
- Chỉ sử dụng tài khoản demo khi trình diễn hệ thống.