const db = require('../knexfile.js');

const addAddressToUsers = async () => {
    try {
        // Kiểm tra xem cột address đã tồn tại chưa
        const columns = await db.raw(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'users' 
            AND COLUMN_NAME = 'address'
        `);
        
        if (columns[0].length === 0) {
            // Thêm cột address nếu chưa tồn tại
            await db.raw(`
                ALTER TABLE users 
                ADD COLUMN address TEXT DEFAULT NULL
            `);
            console.log('Column "address" added to users table.');
        } else {
            console.log('Column "address" already exists in users table.');
        }
    } catch (error) {
        console.error('Error adding address column:', error);
    }
};

// Chạy migration
addAddressToUsers().then(() => {
    console.log('Address migration completed.');
    process.exit(0);
}).catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
});









