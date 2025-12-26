const db = require('../knexfile.js');

const addShippingFieldsToOrders = async () => {
    try {
        // Kiểm tra xem cột shipping_address đã tồn tại chưa
        const columns = await db.raw(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'orders' 
            AND COLUMN_NAME IN ('shipping_address', 'payment_method')
        `);
        
        const existingColumns = columns[0].map(col => col.COLUMN_NAME);
        
        if (!existingColumns.includes('shipping_address')) {
            // Thêm cột shipping_address nếu chưa tồn tại
            await db.raw(`
                ALTER TABLE orders 
                ADD COLUMN shipping_address TEXT DEFAULT NULL
            `);
            console.log('Column "shipping_address" added to orders table.');
        } else {
            console.log('Column "shipping_address" already exists in orders table.');
        }
        
        if (!existingColumns.includes('payment_method')) {
            // Thêm cột payment_method nếu chưa tồn tại
            await db.raw(`
                ALTER TABLE orders 
                ADD COLUMN payment_method VARCHAR(255) DEFAULT 'cod'
            `);
            console.log('Column "payment_method" added to orders table.');
        } else {
            console.log('Column "payment_method" already exists in orders table.');
        }
    } catch (error) {
        console.error('Error adding shipping fields to orders:', error);
    }
};

// Chạy migration
addShippingFieldsToOrders().then(() => {
    console.log('Orders shipping fields migration completed.');
    process.exit(0);
}).catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
});









