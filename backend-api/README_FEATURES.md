# Hướng dẫn Test các Tính năng Mới

## 📋 Tổng quan

Các tính năng mới đã được thêm vào hệ thống:
1. ✅ Mã giảm giá và Vouchers
2. ✅ Trang thống kê
3. ✅ Đánh giá sau khi mua hàng
4. ✅ Hiển thị thông tin sản phẩm còn/hết
5. ✅ Sửa chatbot tiếng Việt

## 🗄️ Database Migrations

Đã chạy các migrations sau:
- ✅ `create-vouchers.js` - Tạo bảng vouchers và user_voucher_usage
- ✅ `add-voucher-to-orders.js` - Thêm cột voucher vào bảng orders
- ✅ `create-reviews.js` - Tạo bảng reviews
- ✅ `add-rating-to-books.js` - Thêm cột rating vào bảng books

## 📊 Dữ liệu Mẫu

### Vouchers
Đã thêm 6 vouchers mẫu:
- **WELCOME10**: Giảm 10% (tối đa 50k) cho đơn hàng từ 100k
- **SAVE50K**: Giảm 50k cho đơn hàng từ 500k
- **SUMMER20**: Giảm 20% (tối đa 200k) cho đơn hàng từ 1M
- **VIP30**: Giảm 30% (tối đa 500k) cho đơn hàng từ 2M
- **FREESHIP**: Giảm 30k (phí ship) cho đơn hàng từ 300k
- **NEWUSER**: Giảm 15% (tối đa 100k) cho người dùng mới

### Reviews
Đã thêm 16 reviews mẫu cho các sản phẩm.

## 🧪 Cách Test

### 1. Test Vouchers API

```bash
# Get active vouchers
curl http://localhost:3100/api/vouchers/active

# Get voucher by code
curl http://localhost:3100/api/vouchers/code/WELCOME10

# Validate voucher
curl -X POST http://localhost:3100/api/vouchers/validate \
  -H "Content-Type: application/json" \
  -d '{
    "code": "WELCOME10",
    "orderAmount": 500000,
    "userId": 1
  }'
```

### 2. Test Reviews API

```bash
# Get reviews by product
curl http://localhost:3100/api/reviews/product/1

# Get reviews by user
curl http://localhost:3100/api/reviews/user/1
```

### 3. Test Statistics API (Requires Admin Auth)

```bash
# Get dashboard statistics
curl http://localhost:3100/api/statistics/dashboard \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 4. Chạy Script Test Tự động

```bash
cd backend-api
node scripts/test-features.js
```

**Lưu ý**: Script test yêu cầu server đang chạy. Hãy đảm bảo server đã được khởi động:

```bash
cd backend-api
npm start
```

## 🎯 Frontend Testing

### Admin Panel

1. **Voucher Management**: 
   - Truy cập: `/vouchers`
   - Tạo, sửa, xóa vouchers
   - Xem danh sách vouchers

2. **Statistics Dashboard**:
   - Truy cập: `/statistics`
   - Xem thống kê tổng quan
   - Xem biểu đồ doanh thu

3. **Product Management**:
   - Truy cập: `/products`
   - Thêm sản phẩm mới
   - Kiểm tra hiển thị trạng thái còn/hết hàng

### Client Side

1. **Vouchers**:
   - Áp dụng voucher khi checkout
   - Validate voucher code

2. **Reviews**:
   - Xem đánh giá sản phẩm
   - Tạo đánh giá sau khi mua hàng

3. **Chatbot**:
   - Test chuyển đổi ngôn ngữ Việt/Anh
   - Kiểm tra chatbot vẫn hoạt động sau khi đổi ngôn ngữ

## 📝 API Endpoints

### Vouchers
- `GET /api/vouchers/active` - Lấy danh sách vouchers đang hoạt động
- `GET /api/vouchers/code/:code` - Lấy voucher theo code
- `POST /api/vouchers/validate` - Validate voucher
- `GET /api/vouchers` - Lấy tất cả vouchers (Admin)
- `POST /api/vouchers` - Tạo voucher mới (Admin)
- `PUT /api/vouchers/:id` - Cập nhật voucher (Admin)
- `DELETE /api/vouchers/:id` - Xóa voucher (Admin)

### Reviews
- `GET /api/reviews/product/:bookId` - Lấy reviews theo sản phẩm
- `GET /api/reviews/user/:userId` - Lấy reviews theo user
- `POST /api/reviews` - Tạo review mới (Auth)
- `PUT /api/reviews/:id` - Cập nhật review (Auth)
- `DELETE /api/reviews/:id` - Xóa review (Auth)
- `GET /api/reviews` - Lấy tất cả reviews (Admin)

### Statistics
- `GET /api/statistics/dashboard` - Lấy thống kê dashboard (Admin)

## ✅ Checklist Test

- [ ] Vouchers được tạo thành công
- [ ] Vouchers API hoạt động đúng
- [ ] Reviews được tạo thành công
- [ ] Reviews API hoạt động đúng
- [ ] Statistics API hoạt động đúng
- [ ] Admin panel hiển thị vouchers
- [ ] Admin panel hiển thị statistics
- [ ] Product management hiển thị trạng thái còn/hết hàng
- [ ] Chatbot hoạt động sau khi đổi ngôn ngữ

## 🐛 Troubleshooting

### Lỗi kết nối database
- Kiểm tra file `.env` có cấu hình database đúng
- Kiểm tra MySQL đang chạy

### Lỗi migration
- Chạy migrations theo thứ tự:
  1. `create-vouchers.js`
  2. `add-voucher-to-orders.js`
  3. `create-reviews.js`
  4. `add-rating-to-books.js`

### Lỗi API
- Kiểm tra server đang chạy
- Kiểm tra routes đã được đăng ký trong `index.js`
- Kiểm tra middleware authentication

