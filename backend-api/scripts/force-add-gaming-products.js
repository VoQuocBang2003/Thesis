const knex = require('../knexfile');

async function forceAddGamingProducts() {
  try {
    console.log('Force adding gaming products to database...');
    
    // Get category IDs
    const gamingPCId = await knex('categories').where('name', 'Gaming PC').first();
    const consoleId = await knex('categories').where('name', 'Console').first();
    const controllerId = await knex('categories').where('name', 'Controller').first();
    const gameId = await knex('categories').where('name', 'Game').first();
    const headsetId = await knex('categories').where('name', 'Gaming Headset').first();
    const monitorId = await knex('categories').where('name', 'Gaming Monitor').first();
    
    console.log('Category IDs:', {
      gamingPC: gamingPCId?.id,
      console: consoleId?.id,
      controller: controllerId?.id,
      game: gameId?.id,
      headset: headsetId?.id,
      monitor: monitorId?.id
    });
    
    // Clear existing gaming products first
    await knex('books').whereIn('categories_id', [
      gamingPCId?.id, consoleId?.id, controllerId?.id, 
      gameId?.id, headsetId?.id, monitorId?.id
    ].filter(Boolean)).del();
    
    console.log('✅ Cleared existing gaming products');
    
    // Insert gaming products
    const gamingProducts = [
      {
        title: 'Gaming PC RTX 4070 Super',
        language: 'Tiếng Việt',
        image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=Gaming+PC+RTX+4070',
        categories_id: gamingPCId?.id,
        description: 'Máy tính gaming cao cấp với RTX 4070 Super, Intel i7-13700K, 32GB DDR5, 1TB NVMe SSD. Hiệu năng mạnh mẽ cho gaming 1440p và streaming.',
        price: 28000000,
        StockQuantity: 5,
        status: 'available'
      },
      {
        title: 'PlayStation 5',
        language: 'Tiếng Việt',
        image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=PlayStation+5',
        categories_id: consoleId?.id,
        description: 'Console gaming thế hệ mới với SSD siêu nhanh, DualSense controller, hỗ trợ 4K gaming và ray tracing.',
        price: 12000000,
        StockQuantity: 3,
        status: 'available'
      },
      {
        title: 'Xbox Series X',
        language: 'Tiếng Việt',
        image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=Xbox+Series+X',
        categories_id: consoleId?.id,
        description: 'Console gaming mạnh nhất với Game Pass, backward compatibility, Quick Resume và hỗ trợ 4K gaming.',
        price: 11000000,
        StockQuantity: 4,
        status: 'available'
      },
      {
        title: 'DualSense Controller',
        language: 'Tiếng Việt',
        image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=DualSense+Controller',
        categories_id: controllerId?.id,
        description: 'Tay cầm PlayStation 5 với haptic feedback, adaptive triggers, built-in microphone và Bluetooth.',
        price: 1800000,
        StockQuantity: 15,
        status: 'available'
      },
      {
        title: 'Cyberpunk 2077',
        language: 'Tiếng Việt',
        image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=Cyberpunk+2077',
        categories_id: gameId?.id,
        description: 'Game RPG cyberpunk với thế giới mở, câu chuyện hấp dẫn, character customization và multiple endings.',
        price: 800000,
        StockQuantity: 20,
        status: 'available'
      },
      {
        title: 'SteelSeries Arctis 7P',
        language: 'Tiếng Việt',
        image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=Arctis+7P',
        categories_id: headsetId?.id,
        description: 'Tai nghe gaming không dây cho PlayStation với âm thanh 7.1 surround, Discord certified và battery 24 giờ.',
        price: 3500000,
        StockQuantity: 8,
        status: 'available'
      },
      {
        title: 'ASUS ROG Swift PG27UQ',
        language: 'Tiếng Việt',
        image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=ROG+Swift+PG27UQ',
        categories_id: monitorId?.id,
        description: 'Màn hình gaming 4K 27 inch với G-Sync, HDR10, tần số quét 144Hz và response time 4ms.',
        price: 15000000,
        StockQuantity: 3,
        status: 'available'
      }
    ];

    await knex('books').insert(gamingProducts);
    console.log(`✅ Inserted ${gamingProducts.length} gaming products successfully!`);

    // Verify insertion
    const insertedProducts = await knex('books')
      .join('categories', 'books.categories_id', 'categories.id')
      .select('books.title', 'categories.name as category_name')
      .whereIn('categories.name', ['Gaming PC', 'Console', 'Controller', 'Game', 'Gaming Headset', 'Gaming Monitor']);
    
    console.log('\n📊 Gaming Products Verification:');
    insertedProducts.forEach(p => console.log(`- ${p.title} (${p.category_name})`));
    console.log(`Total gaming products: ${insertedProducts.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await knex.destroy();
  }
}

// Run the function
forceAddGamingProducts();







