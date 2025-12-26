# Hướng dẫn tạo dữ liệu mẫu để test

## 📋 Tổng quan

Các script seed này giúp tạo dữ liệu mẫu để test các tính năng:
- Quản lý mã giảm giá (Vouchers)
- Quản lý doanh thu (Revenue Management)
- Thống kê và báo cáo

## 🚀 Cách sử dụng

### 1. Tạo dữ liệu mẫu Vouchers

```bash
cd backend-api
node seeds/sample-vouchers.js
```

Script này sẽ tạo 6 vouchers mẫu:
- **WELCOME10**: Giảm 10% (tối đa 50k) cho đơn hàng từ 100k
- **SAVE50K**: Giảm 50k cho đơn hàng từ 500k
- **SUMMER20**: Giảm 20% (tối đa 200k) cho đơn hàng từ 1M
- **VIP30**: Giảm 30% (tối đa 500k) cho đơn hàng từ 2M
- **FREESHIP**: Giảm 30k (phí ship) cho đơn hàng từ 300k
- **NEWUSER**: Giảm 15% (tối đa 100k) cho người dùng mới

### 2. Tạo dữ liệu mẫu Orders với Vouchers

**Lưu ý**: Cần có users và books trong database trước khi chạy script này.

```bash
cd backend-api
node seeds/sample-orders-with-vouchers.js
```

Script này sẽ:
- Tạo 50 orders mẫu
- 60% orders có áp dụng voucher
- 40% orders không có voucher
- Orders được tạo trong khoảng 3 tháng gần đây
- Các orders có status khác nhau: pending, processing, completed, cancelled
- Tự động cập nhật `used_count` cho vouchers
- Tạo records trong `user_voucher_usage` table

### 3. Chạy tất cả seeds cùng lúc

```bash
cd backend-api
node scripts/seed-all-sample-data.js
```

Script này sẽ chạy tất cả các seeds theo thứ tự và hiển thị tổng kết.

## 📊 Dữ liệu được tạo

### Vouchers
- 6 vouchers với các loại khác nhau (percentage, fixed)
- Các điều kiện khác nhau (min_order_amount, max_discount, usage_limit)

### Orders
- 50 orders mẫu
- Phân bố ngẫu nhiên trong 3 tháng gần đây
- Khoảng 30 orders có voucher (60%)
- Khoảng 20 orders không có voucher (40%)
- Các status: pending, processing, completed, cancelled
- Tự động tính discount và final price

## 🧪 Test các tính năng

Sau khi chạy seeds, bạn có thể test:

### 1. Test Voucher Management (Admin)
- Vào `/vouchers` trong admin panel
- Xem danh sách vouchers
- Kiểm tra số lần sử dụng (used_count)
- Tạo/sửa/xóa vouchers

### 2. Test Revenue Management (Admin)
- Vào `/statistics` → tab "Quản lý Doanh thu"
- Chọn khoảng thời gian (ví dụ: 3 tháng gần đây)
- Xem:
  - Tổng doanh thu
  - Tổng giảm giá
  - Doanh thu theo thời gian
  - Thống kê sử dụng voucher
  - Doanh thu theo sản phẩm

### 3. Test Voucher Application (Client)
- Vào trang giỏ hàng
- Nhập mã voucher (ví dụ: WELCOME10, SAVE50K)
- Kiểm tra discount được áp dụng
- Hoàn tất đơn hàng

## ⚠️ Lưu ý

1. **Cần có dữ liệu cơ bản trước**:
   - Users (ít nhất 1 user)
   - Books (ít nhất 1 book)
   - Vouchers (chạy sample-vouchers.js trước)

2. **Không xóa dữ liệu hiện có**:
   - Scripts sẽ skip nếu dữ liệu đã tồn tại
   - Để xóa và tạo lại, cần xóa thủ công trong database

3. **Database phải có các bảng**:
   - `vouchers`
   - `orders`
   - `user_voucher_usage`
   - `users`
   - `books`

## 🔄 Xóa và tạo lại dữ liệu

Nếu muốn xóa và tạo lại dữ liệu mẫu:

### Cách 1: Dùng SQL (Khuyến nghị)

```sql
-- Xóa orders mẫu (cẩn thận!)
DELETE FROM orders WHERE shipping_address LIKE '123 Đường ABC%';

-- Reset voucher used_count
UPDATE vouchers SET used_count = 0;

-- Xóa user_voucher_usage
DELETE FROM user_voucher_usage;

-- Sau đó chạy lại seeds
node seeds/sample-orders-with-vouchers.js
```

### Cách 2: Sửa script (Nâng cao)

Uncomment phần code trong `sample-orders-with-vouchers.js` (dòng 14-21) và chạy với flag `--fresh`:

```bash
node seeds/sample-orders-with-vouchers.js --fresh
```

## 📈 Kiểm tra kết quả

Sau khi chạy seeds, kiểm tra:

```sql
-- Tổng số vouchers
SELECT COUNT(*) FROM vouchers;

-- Tổng số orders
SELECT COUNT(*) FROM orders;

-- Orders với voucher
SELECT COUNT(*) FROM orders WHERE voucher_id IS NOT NULL;

-- Tổng doanh thu (completed orders)
SELECT SUM(total_price - COALESCE(discount_amount, 0)) 
FROM orders 
WHERE status = 'completed';

-- Top vouchers được sử dụng
SELECT v.code, v.name, v.used_count
FROM vouchers v
ORDER BY v.used_count DESC
LIMIT 10;
```

## 🐛 Troubleshooting

### Lỗi: "Vouchers table does not exist"
- Chạy migration: `node migrations/create-vouchers.js`

### Lỗi: "No users found"
- Tạo ít nhất 1 user trong database

### Lỗi: "No books found"
- Tạo ít nhất 1 book trong database

### Lỗi: "Duplicate entry" hoặc tất cả orders bị skip
- Dữ liệu đã tồn tại, script sẽ skip
- **Giải pháp**: Xóa orders cũ trước khi chạy lại:
  ```sql
  DELETE FROM orders WHERE shipping_address LIKE '123 Đường ABC%';
  UPDATE vouchers SET used_count = 0;
  DELETE FROM user_voucher_usage;
  ```

### Lỗi: "Column 'status' doesn't exist" hoặc "Column 'order_date' doesn't exist"
- Script sẽ tự động bỏ qua các cột không tồn tại
- Orders vẫn được tạo nhưng không có status/order_date
- Để thêm các cột này, chạy migrations tương ứng

### Lỗi SQL syntax trong summary
- Đã được sửa trong phiên bản mới nhất
- Nếu vẫn gặp lỗi, kiểm tra phiên bản MariaDB/MySQL

