const jwt = require('jsonwebtoken');
const _const = require('./config/constant.js');
const multer = require("multer");
const path = require("path");
const fs = require('fs');

// ======== Middleware xác thực ==========
const checkLogin = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).send('Access Denied');

  try {
    const verified = jwt.verify(token, _const.JWT_ACCESS_KEY);
    req.user = verified.user; // cần thiết nếu bạn dùng req.user sau này
    console.log('✅ Token verified:', verified);
    next();
  } catch (err) {
    return res.status(400).send('Invalid Token');
  }
};

const checkRole = (role) => async (req, res, next) => {
  if (req.user.role !== role) {
    return res.status(403).send('Forbidden');
  }
  next();
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Tách "Bearer " ra khỏi token
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : authHeader;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  jwt.verify(token, _const.JWT_ACCESS_KEY, (err, decodedToken) => {
    if (err) {
      console.error('❌ Token verification failed:', err.message);
      return res.status(401).json({ error: "Invalid token" });
    }

    req.user = decodedToken.user;
    console.log('✅ Token verified. User:', { id: req.user.id, username: req.user.username, role: req.user.role });
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (!req.user) {
    console.error('❌ isAdmin check failed: No user in request');
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Chấp nhận cả 'admin' và 'isAdmin' role
  if (req.user.role !== 'admin' && req.user.role !== 'isAdmin') {
    console.error('❌ isAdmin check failed: User role is', req.user.role, 'but required admin/isAdmin');
    return res.status(403).json({ 
      error: "Forbidden: Admin access required",
      userRole: req.user.role 
    });
  }

  console.log('✅ Admin access granted for user:', req.user.username, 'with role:', req.user.role);
  next();
};

// ======== Cấu hình upload ảnh ==========
// Use centralized backend uploads directory so both admin and client share the same files
const uploadDir = path.resolve(__dirname, 'uploads');

// Tạo thư mục nếu chưa có
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('📁 Created central uploads folder:', uploadDir);
} else {
  console.log('📁 Central uploads folder exists:', uploadDir);
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('📂 Saving file to:', uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = uniqueSuffix + path.extname(file.originalname);
    console.log("📝 Saving as:", filename);
    cb(null, filename);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    console.log("❌ Invalid file type:", file.mimetype);
    cb(new Error("Chỉ cho phép file ảnh (JPEG, PNG, JPG, WEBP)"), false);
  }
};

// File size limit (5MB)
const limits = {
  fileSize: 5 * 1024 * 1024 // 5MB
};

// Tạo instance upload
const upload = multer({ storage, fileFilter, limits });

// ======== Export tất cả middleware ==========
module.exports = {
  checkLogin,
  checkRole,
  authenticateToken,
  isAdmin,
  upload
};
