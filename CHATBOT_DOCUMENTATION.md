# Tài liệu Chatbot - Hệ thống Tư vấn Sản phẩm AI

## Tổng quan

Hệ thống chatbot sử dụng **Google Gemini AI** để tư vấn sản phẩm cho khách hàng. Chatbot hỗ trợ cả tiếng Việt và tiếng Anh, có khả năng hiểu ngôn ngữ tự nhiên và xử lý từ viết tắt phổ biến.

## Nguyên lý hoạt động

### 1. Kiến trúc tổng thể

```
User Input → Frontend (Vue.js) 
    ↓
Backend API (Node.js/Express)
    ↓
AI Service (Google Gemini AI)
    ↓
Product Database (Knex.js/SQL)
    ↓
Response → Frontend → User
```

### 2. Luồng xử lý tin nhắn

1. **Nhận tin nhắn từ user** (Frontend)
2. **Chuẩn hóa tin nhắn**:
   - Xử lý từ viết tắt (ko → không, tr → triệu, ...)
   - Phân tích intent (greeting, product_inquiry, budget_query, ...)
   - Trích xuất thông tin (ngân sách, sở thích, platform, ...)

3. **Tìm kiếm sản phẩm**:
   - Lọc sản phẩm theo tiêu chí
   - Sắp xếp theo độ phù hợp
   - Giới hạn số lượng kết quả

4. **Tạo prompt cho AI**:
   - Hệ thống prompt với context sản phẩm
   - Lịch sử hội thoại (nếu có)
   - Hướng dẫn trả lời theo ngôn ngữ

5. **Gọi Gemini AI**:
   - Sử dụng Google Generative AI
   - Models: gemini-2.0-flash-exp, gemini-1.5-pro, gemini-2.5-flash
   - Fallback nếu model không khả dụng

6. **Xử lý và trả về kết quả**:
   - Parse response từ AI
   - Đính kèm sản phẩm gợi ý
   - Tạo câu hỏi gợi ý (quick replies)

## Cách cài đặt

### 1. Cài đặt dependencies

```bash
cd backend-api
npm install @google/generative-ai dotenv
```

### 2. Cấu hình API Key

Tạo file `.env` trong thư mục `backend-api`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
BASE_URL=http://localhost:3100
JWT_ACCESS_KEY=your_jwt_secret
```

Lấy API key từ: https://aistudio.google.com/app/apikey

### 3. Khởi động server

```bash
# Backend
cd backend-api
npm start

# Frontend (terminal khác)
cd frontend/client
npm run serve
```

## Cách huấn luyện và cấu hình

### 1. Cấu hình từ viết tắt

File: `backend-api/routers/gamingChatbotRouter.js`

```javascript
normalizeAbbreviations(message) {
  const abbreviations = {
    '\\bko\\b': 'không',
    '\\btr\\b': 'triệu',
    '\\bdc\\b': 'được',
    '\\bvs\\b': 'với',
    // ... thêm các từ viết tắt khác
  };
  // ...
}
```

### 2. Cấu hình intent detection

File: `backend-api/routers/gamingChatbotRouter.js`

```javascript
detectIntent(message) {
  const intentScores = {
    greeting: 0,
    product_inquiry: 0,
    budget_query: 0,
    // ... thêm các intent khác
  };
  // Logic phát hiện intent
}
```

### 3. Cấu hình prompt cho AI

File: `backend-api/services/aiExternalService.js`

```javascript
generateSystemPrompt(products, catalog, budgetInfo, locale) {
  // Tạo prompt với:
  // - Thông tin sản phẩm
  // - Ngân sách (nếu có)
  // - Hướng dẫn trả lời
  // - Ngôn ngữ (vi/en)
}
```

### 4. Thêm câu hỏi gợi ý

File: `frontend/client/src/components/GamingChatBot.vue`

```javascript
quickReplies: [
  'PC Gaming dưới 20 triệu',
  'PlayStation 5',
  'Tư vấn theo ngân sách',
  'So sánh sản phẩm'
]
```

## Cách set câu hỏi và câu trả lời

### 1. Câu hỏi gợi ý (Quick Replies)

Cập nhật trong file:
- `frontend/client/src/components/GamingChatBot.vue` (dòng 169-172)
- `frontend/client/src/i18n/locales/vi.json` (section chatbot.quickReplies)
- `frontend/client/src/i18n/locales/en.json` (section chatbot.quickReplies)

### 2. Template câu trả lời

File: `backend-api/routers/gamingChatbotRouter.js`

```javascript
generateGamingResponse(intent, entities, context, userId, currentMessage) {
  // Tạo response message dựa trên intent và context
  // Ví dụ: greeting, product_inquiry, budget_query
}
```

### 3. Prompt cho AI

File: `backend-api/services/aiExternalService.js`

Prompt được tạo động dựa trên:
- Tin nhắn của user
- Danh sách sản phẩm phù hợp
- Lịch sử hội thoại
- Ngân sách (nếu có)
- Ngôn ngữ (vi/en)

## Thế mạnh so với các chatbot khác

### 1. Hỗ trợ đa ngôn ngữ
- ✅ Tự động phát hiện và chuyển đổi ngôn ngữ
- ✅ Hỗ trợ tiếng Việt và tiếng Anh
- ✅ Prompt được tối ưu cho từng ngôn ngữ

### 2. Xử lý từ viết tắt
- ✅ Tự động chuẩn hóa từ viết tắt phổ biến
- ✅ Hỗ trợ: ko → không, tr → triệu, dc → được, ...
- ✅ Xử lý cả ngữ cảnh số (7tr = 7 triệu)

### 3. Tích hợp dữ liệu sản phẩm thực
- ✅ Kết nối trực tiếp với database sản phẩm
- ✅ Lọc và sắp xếp sản phẩm theo độ phù hợp
- ✅ AI chỉ đề xuất sản phẩm có thật trong hệ thống

### 4. Context-aware responses
- ✅ Nhớ lịch sử hội thoại
- ✅ Hiểu ngữ cảnh (ngân sách, sở thích, platform)
- ✅ Tư vấn theo từng giai đoạn

### 5. Tích hợp với giỏ hàng
- ✅ Thêm sản phẩm trực tiếp từ chatbot
- ✅ Chuyển hướng đến trang sản phẩm
- ✅ Quản lý giỏ hàng trong chatbot

### 6. Câu hỏi gợi ý thông minh
- ✅ Quick replies dựa trên context
- ✅ Gợi ý câu hỏi tiếp theo
- ✅ Hỗ trợ điều hướng người dùng

## So sánh với các chatbot khác

| Tính năng | Chatbot này | ChatGPT Plugin | Dialogflow | Rasa |
|-----------|-------------|----------------|------------|------|
| Hỗ trợ tiếng Việt | ✅ Tốt | ⚠️ Hạn chế | ✅ Có | ⚠️ Cần train |
| Xử lý từ viết tắt | ✅ Tự động | ❌ Không | ⚠️ Cần config | ⚠️ Cần train |
| Tích hợp DB | ✅ Trực tiếp | ⚠️ Qua API | ✅ Có | ⚠️ Cần code |
| Context memory | ✅ Có | ✅ Có | ✅ Có | ✅ Có |
| Chi phí | ✅ Miễn phí (Gemini free tier) | 💰 Trả phí | 💰 Trả phí | ✅ Open source |
| Dễ cấu hình | ✅ Đơn giản | ⚠️ Phức tạp | ⚠️ Phức tạp | ❌ Khó |

## API Endpoints

### 1. Gaming Chatbot

```http
POST /api/gaming-chatbot/chat
Content-Type: application/json

{
  "message": "Tôi muốn mua PC gaming dưới 20 triệu",
  "userId": "user_123",
  "locale": "vi"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "message": "Dựa trên ngân sách của bạn...",
    "products": [...],
    "quickReplies": [...],
    "intent": "product_inquiry"
  }
}
```

### 2. Clear Conversation

```http
DELETE /api/gaming-chatbot/context/:userId
```

## Troubleshooting

### 1. Chatbot không trả lời

**Nguyên nhân:**
- API key chưa được cấu hình
- Model Gemini không khả dụng
- Lỗi kết nối database

**Giải pháp:**
- Kiểm tra file `.env` có `GEMINI_API_KEY`
- Kiểm tra console log backend
- Kiểm tra kết nối database

### 2. Chatbot không hiểu từ viết tắt

**Nguyên nhân:**
- Từ viết tắt chưa được thêm vào dictionary

**Giải pháp:**
- Thêm vào `normalizeAbbreviations()` function
- Test với regex pattern

### 3. Chatbot trả lời sai ngôn ngữ

**Nguyên nhân:**
- Locale không được truyền đúng
- Prompt không có language instruction

**Giải pháp:**
- Kiểm tra `locale` parameter
- Kiểm tra `generateSystemPrompt()` có language instruction

## Tài liệu tham khảo

- [Google Gemini AI Documentation](https://ai.google.dev/docs)
- [Vue.js Documentation](https://vuejs.org/)
- [Express.js Documentation](https://expressjs.com/)

## Liên hệ

Nếu có vấn đề hoặc câu hỏi, vui lòng tạo issue trên repository.













