const db = require('../knexfile');

async function checkOrderData() {
  try {
    console.log('\n=== Checking Orders Data ===\n');
    
    // Get 1 order to see its structure
    const order = await db('orders').first();
    if (order) {
      console.log('✅ Sample order:');
      console.log(`   id=${order.id}, book_id field: ${order.book_id}`);
      
      // Try to parse book_id
      try {
        const parsed = JSON.parse(order.book_id || '[]');
        console.log(`   Parsed book_id: ${JSON.stringify(parsed, null, 2)}`);
      } catch (e) {
        console.log(`   Could not parse book_id: ${e.message}`);
      }
    } else {
      console.log('❌ No orders found in database');
    }

    console.log('\n=== Checking Books Data ===\n');
    const books = await db('books').select('id', 'title', 'image').limit(3);
    if (books.length > 0) {
      console.log(`✅ Sample books (${books.length}):`);
      for (const b of books) {
        console.log(`   id=${b.id}, title=${b.title}, image=${b.image}`);
      }
    } else {
      console.log('❌ No books found');
    }

    console.log('\n=== Checking Gaming Products Data ===\n');
    const gamingExists = await db.schema.hasTable('gaming_products');
    if (gamingExists) {
      const gaming = await db('gaming_products').select('id', 'name', 'image').limit(3);
      if (gaming.length > 0) {
        console.log(`✅ Sample gaming products (${gaming.length}):`);
        for (const g of gaming) {
          console.log(`   id=${g.id}, name=${g.name}, image=${g.image}`);
        }
      } else {
        console.log('⚠️  gaming_products table exists but is empty');
      }
    } else {
      console.log('⚠️  gaming_products table does not exist');
    }

    console.log('\n=== Done ===\n');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkOrderData();
