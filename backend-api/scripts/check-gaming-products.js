const knex = require('../knexfile');

async function checkGamingProducts() {
  try {
    console.log('Checking gaming products in database...');
    
    // Check categories
    const categories = await knex('categories').whereIn('name', [
      'Gaming PC', 'Console', 'Controller', 'Game', 'Gaming Headset', 'Gaming Monitor'
    ]);
    
    console.log('\nGaming categories found:');
    categories.forEach(cat => console.log(`- ${cat.name} (ID: ${cat.id})`));
    
    // Check products in gaming categories
    const products = await knex('books')
      .join('categories', 'books.categories_id', 'categories.id')
      .select('books.title', 'categories.name as category_name', 'books.categories_id')
      .whereIn('categories.name', [
        'Gaming PC', 'Console', 'Controller', 'Game', 'Gaming Headset', 'Gaming Monitor'
      ]);
    
    console.log('\nGaming products found:');
    products.forEach(p => console.log(`- ${p.title} (${p.category_name}, ID: ${p.categories_id})`));
    
    console.log(`\nTotal gaming products: ${products.length}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await knex.destroy();
  }
}

checkGamingProducts();
