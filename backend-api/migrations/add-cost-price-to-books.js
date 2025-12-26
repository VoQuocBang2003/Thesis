const db = require('../knexfile.js');

const addCostPriceToBooks = async () => {
  try {
    // Check if column exists
    const columns = await db.raw(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'books' 
      AND COLUMN_NAME = 'cost_price'
    `);
    
    const columnExists = columns[0] && columns[0].length > 0;
    
    if (!columnExists) {
      await db.raw(`
        ALTER TABLE books 
        ADD COLUMN cost_price DECIMAL(15, 2) DEFAULT 0
      `);
      console.log('✅ Column "cost_price" added to books table.');
      
      // Update existing books: set cost_price = 70% of price (as default)
      await db.raw(`
        UPDATE books 
        SET cost_price = ROUND(price * 0.7, 2)
        WHERE cost_price = 0 OR cost_price IS NULL
      `);
      console.log('✅ Updated cost_price for existing books (70% of price as default).');
    } else {
      console.log('✅ Column "cost_price" already exists in books table.');
    }
  } catch (error) {
    console.error('Error adding cost_price field to books:', error);
    throw error;
  }
};

// Run migration
addCostPriceToBooks().then(() => {
  console.log('✅ Cost price migration completed!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Cost price migration failed:', error);
  process.exit(1);
});


