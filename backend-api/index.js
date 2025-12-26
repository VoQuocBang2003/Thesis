require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2'); 
const app = express();
const _CONST = require('./config/constant')
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const db = require('./knexfile.js');
const path = require('path');
const fs = require('fs');



app.use(express.urlencoded({ extended: true }));
// Cấu hình CORS cho phép tất cả localhost và local network IPs trong development
app.use(cors({
  origin: (origin, callback) => {
    // Cho phép requests không có origin (Postman, curl, server-side requests, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    // Trong môi trường development, cho phép:
    // - localhost với bất kỳ port nào
    // - 127.0.0.1, ::1
    // - Các địa chỉ IP private (local network): 192.168.x.x, 10.x.x.x, 172.16-31.x.x
    try {
      const url = new URL(origin);
      const hostname = url.hostname.toLowerCase();
      
      // Kiểm tra localhost
      const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
      
      // Kiểm tra địa chỉ IP private (local network)
      let isPrivateIP = false;
      if (hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
        const parts = hostname.split('.').map(Number);
        // 192.168.x.x
        if (parts[0] === 192 && parts[1] === 168) {
          isPrivateIP = true;
        }
        // 10.x.x.x
        else if (parts[0] === 10) {
          isPrivateIP = true;
        }
        // 172.16.x.x - 172.31.x.x
        else if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) {
          isPrivateIP = true;
        }
      }
      
      if (isLocalhost || isPrivateIP) {
        callback(null, true);
      } else {
        console.warn(`CORS: Origin not allowed: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    } catch (error) {
      // Nếu URL không hợp lệ, từ chối
      console.warn(`CORS: Invalid origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Centralized uploads directory (shared by admin & client)
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created central uploads directory at:', uploadsDir);
}

// Serve uploads at /uploads
app.use('/uploads', express.static(uploadsDir));

const authRoute = require('./routers/auth');
const userRoute = require('./routers/user');
const categoriesRouter = require('./routers/categoriesRouter');
const booksRouter = require('./routers/booksRouter');
const ordersRouter = require('./routers/ordersRouter');
const wishlistsRouter = require('./routers/wishlistsRouter');
const imageUploadRouter = require('./routers/imageUploadRouter');
const chatbotRouter = require('./routers/chatbotRouter');
const gamingChatbotRouter = require('./routers/gamingChatbotRouter');
const vouchersRouter = require('./routers/vouchersRouter');
const statisticsRouter = require('./routers/statisticsRouter');
const reviewsRouter = require('./routers/reviewsRouter');

app.use('/api/auth', authRoute);
app.use('/api/user', userRoute);
app.use('/api/categories', categoriesRouter);
app.use('/api/books', booksRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/wishlists', wishlistsRouter);
app.use('/api/upload', imageUploadRouter);
app.use('/api/chatbot', chatbotRouter);
app.use('/api/gaming-chatbot', gamingChatbotRouter);
app.use('/api/vouchers', vouchersRouter);
app.use('/api/statistics', statisticsRouter);
app.use('/api/reviews', reviewsRouter);
const cartRouter = require('./routers/cartRouter');
app.use('/api/cart', cartRouter);


const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'API Documentation',
            version: '1.0.0',
            description: 'API documentation for the bookstore application',
        },
        servers: [
            {
                url: 'http://localhost:3100',
            },
        ],
    },
    apis: ['./routers/*.js'],
};


const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

const PORT = process.env.PORT || _CONST.PORT;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});
