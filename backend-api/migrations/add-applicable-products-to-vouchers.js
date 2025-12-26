const db = require('../knexfile.js');

/**
 * Migration: Thêm cột applicable_products vào bảng vouchers
 * Cho phép voucher áp dụng cho các sản phẩm cụ thể
 */

const addApplicableProductsToVouchers = async () => {
  try {
    // Kiểm tra xem cột đã tồn tại chưa
    const columns = await db.raw(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'vouchers' 
      AND COLUMN_NAME = 'applicable_products'
    `);
    
    const hasColumn = columns[0] && columns[0].length > 0;
    
    if (!hasColumn) {
      // Thêm cột applicable_products (JSON) để lưu danh sách book_id được phép áp dụng
      // null = áp dụng cho tất cả sản phẩm
      await db.raw(`
        ALTER TABLE vouchers 
        ADD COLUMN applicable_products JSON DEFAULT NULL
      `);
      console.log('✅ Column "applicable_products" added to vouchers table.');
    } else {
      console.log('✅ Column "applicable_products" already exists in vouchers table.');
    }
  } catch (error) {
    console.error('Error adding applicable_products column:', error);
    throw error;
  }
};

// Run migration
addApplicableProductsToVouchers().then(() => {
  console.log('✅ Applicable products migration completed!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Applicable products migration failed:', error);
  process.exit(1);
});





