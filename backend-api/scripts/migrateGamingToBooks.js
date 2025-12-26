const db = require('../knexfile');

async function migrateGamingProductsToBooks() {
  try {
    console.log('\n=== Migrating Gaming Products to Books ===\n');

    // Check if gaming_products table exists
    const gamingExists = await db.schema.hasTable('gaming_products');
    if (!gamingExists) {
      console.log('⚠️  gaming_products table does not exist. Nothing to migrate.');
      process.exit(0);
    }

    // Get all gaming products
    const gamingProducts = await db('gaming_products').select();
    console.log(`Found ${gamingProducts.length} gaming products to migrate\n`);

    if (gamingProducts.length === 0) {
      console.log('ℹ️  No gaming products found. Skipping migration.');
      // Drop table if empty
      await db.schema.dropTable('gaming_products');
      console.log('✅ Dropped empty gaming_products table');
      process.exit(0);
    }

    // Check books table structure
    const booksColumns = await db.raw(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'books'
    `);
    const columnNames = booksColumns[0].map(col => col.COLUMN_NAME);
    console.log(`Books table columns: ${columnNames.join(', ')}\n`);

    // Prepare data for insertion
    const booksToInsert = gamingProducts.map(gp => {
      const book = {
        title: gp.name || gp.title,
        description: gp.description || '',
        image: gp.image || '',
        price: gp.price || 0,
        language: 'English',
        categories_id: 1, // Default category ID
        StockQuantity: gp.stock_quantity || gp.StockQuantity || 100,
        status: gp.status || 'active',
        created_at: gp.created_at || new Date(),
        updated_at: gp.updated_at || new Date(),
      };

      // Add optional fields if they exist in books table
      if (columnNames.includes('cost_price') && gp.cost_price) {
        book.cost_price = gp.cost_price;
      }
      if (columnNames.includes('rating') && gp.rating) {
        book.rating = gp.rating;
      }
      if (columnNames.includes('ratingCount') && gp.ratingCount) {
        book.ratingCount = gp.ratingCount;
      }

      return book;
    });

    // Insert into books table
    console.log(`Inserting ${booksToInsert.length} products into books table...\n`);
    const insertedIds = await db('books').insert(booksToInsert);
    console.log(`✅ Successfully inserted ${insertedIds.length} products into books table`);
    console.log(`   New book IDs: ${insertedIds.join(', ')}\n`);

    // Drop gaming_products table
    console.log('Dropping gaming_products table...\n');
    await db.schema.dropTable('gaming_products');
    console.log('✅ Successfully dropped gaming_products table\n');

    console.log('=== Migration Complete ===\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrateGamingProductsToBooks();
