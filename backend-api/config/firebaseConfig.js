const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); //tệp json xác thực với firebase

//khởi tạo firebase-admin
admin.initializeApp({ 
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'glfood-7a992.appspot.com' //xác định tên bucket firebase storage, buckets lưu trữ các files trong firebase Storage
});

//lấy đối tượng buckets từ firebase storage
//bucket cho phép thực hiện các thao tác trên firebase storage như tải tệp lên/xuống, xóa tệp...
const bucket = admin.storage().bucket();

module.exports = bucket; 