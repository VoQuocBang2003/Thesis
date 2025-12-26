const db = require('../knexfile.js');

const addVoucherToOrders = async () => {
  try {
    // First check if vouchers table exists
    const vouchersTableExists = await db.schema.hasTable('vouchers');
    if (!vouchersTableExists) {
      console.log('⚠️ Vouchers table does not exist. Please run create-vouchers.js migration first.');
      return;
    }

    // Check if columns exist
    const columns = await db.raw(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'orders' 
      AND COLUMN_NAME IN ('voucher_id', 'discount_amount', 'voucher_code')
    `);
    
    const existingColumns = columns[0].map(col => col.COLUMN_NAME);
    
    // Add voucher_id column first (without foreign key)
    if (!existingColumns.includes('voucher_id')) {
      // Check the type of vouchers.id to match it
      const vouchersIdType = await db.raw(`
        SELECT DATA_TYPE, COLUMN_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'vouchers' 
        AND COLUMN_NAME = 'id'
      `);
      
      const idType = vouchersIdType[0] && vouchersIdType[0][0] ? vouchersIdType[0][0].COLUMN_TYPE : 'INT UNSIGNED';
      
      await db.raw(`
        ALTER TABLE orders 
        ADD COLUMN voucher_id ${idType} DEFAULT NULL
      `);
      console.log('✅ Column "voucher_id" added to orders table.');
      
      // Add foreign key constraint separately
      try {
        // Check if foreign key already exists
        const fkExists = await db.raw(`
          SELECT CONSTRAINT_NAME 
          FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
          WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'orders' 
          AND COLUMN_NAME = 'voucher_id'
          AND REFERENCED_TABLE_NAME = 'vouchers'
        `);
        
        if (!fkExists[0] || fkExists[0].length === 0) {
          await db.raw(`
            ALTER TABLE orders 
            ADD CONSTRAINT fk_orders_voucher 
            FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE SET NULL
          `);
          console.log('✅ Foreign key constraint added for voucher_id.');
        } else {
          console.log('✅ Foreign key constraint already exists for voucher_id.');
        }
      } catch (fkError) {
        console.warn('⚠️ Could not add foreign key constraint (this is OK if it already exists):', fkError.message);
      }
    } else {
      console.log('✅ Column "voucher_id" already exists in orders table.');
      
      // Try to add foreign key if column exists but FK doesn't
      try {
        const fkExists = await db.raw(`
          SELECT CONSTRAINT_NAME 
          FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
          WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'orders' 
          AND COLUMN_NAME = 'voucher_id'
          AND REFERENCED_TABLE_NAME = 'vouchers'
        `);
        
        if (!fkExists[0] || fkExists[0].length === 0) {
          // Check if column type matches vouchers.id type
          const ordersVoucherIdType = await db.raw(`
            SELECT COLUMN_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'orders' 
            AND COLUMN_NAME = 'voucher_id'
          `);
          
          const vouchersIdType = await db.raw(`
            SELECT COLUMN_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'vouchers' 
            AND COLUMN_NAME = 'id'
          `);
          
          // If types don't match, modify the column first
          if (ordersVoucherIdType[0] && ordersVoucherIdType[0][0] && 
              vouchersIdType[0] && vouchersIdType[0][0] &&
              ordersVoucherIdType[0][0].COLUMN_TYPE !== vouchersIdType[0][0].COLUMN_TYPE) {
            console.log('⚠️ Modifying voucher_id column type to match vouchers.id...');
            await db.raw(`
              ALTER TABLE orders 
              MODIFY COLUMN voucher_id ${vouchersIdType[0][0].COLUMN_TYPE} DEFAULT NULL
            `);
          }
          
          await db.raw(`
            ALTER TABLE orders 
            ADD CONSTRAINT fk_orders_voucher 
            FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE SET NULL
          `);
          console.log('✅ Foreign key constraint added for voucher_id.');
        } else {
          console.log('✅ Foreign key constraint already exists for voucher_id.');
        }
      } catch (fkError) {
        console.warn('⚠️ Could not add foreign key constraint:', fkError.message);
      }
    }
    
    if (!existingColumns.includes('discount_amount')) {
      await db.raw(`
        ALTER TABLE orders 
        ADD COLUMN discount_amount DECIMAL(10, 2) DEFAULT 0
      `);
      console.log('✅ Column "discount_amount" added to orders table.');
    } else {
      console.log('✅ Column "discount_amount" already exists in orders table.');
    }
    
    if (!existingColumns.includes('voucher_code')) {
      await db.raw(`
        ALTER TABLE orders 
        ADD COLUMN voucher_code VARCHAR(255) DEFAULT NULL
      `);
      console.log('✅ Column "voucher_code" added to orders table.');
    } else {
      console.log('✅ Column "voucher_code" already exists in orders table.');
    }
  } catch (error) {
    console.error('Error adding voucher fields to orders:', error);
    throw error;
  }
};

// Run migration
addVoucherToOrders().then(() => {
  console.log('✅ Voucher fields migration completed!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Voucher fields migration failed:', error);
  process.exit(1);
});

