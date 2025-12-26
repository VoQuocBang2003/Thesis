const knex = require('../knexfile');

async function addMoreGamingProducts() {
  try {
    console.log('Adding more gaming products for better chatbot testing...');
    
    // Get category IDs
    const gamingPCId = await knex('categories').where('name', 'Gaming PC').first();
    const consoleId = await knex('categories').where('name', 'Console').first();
    const controllerId = await knex('categories').where('name', 'Controller').first();
    const gameId = await knex('categories').where('name', 'Game').first();
    const headsetId = await knex('categories').where('name', 'Gaming Headset').first();
    const monitorId = await knex('categories').where('name', 'Gaming Monitor').first();
    
    // More gaming products for comprehensive testing
    const moreGamingProducts = [
      // More Gaming PCs
      {
        title: 'Gaming PC RTX 4060 Ti',
        language: 'Tiếng Việt',
        image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=Gaming+PC+RTX+4060',
        categories_id: gamingPCId?.id,
        description: 'Máy tính gaming tầm trung với RTX 4060 Ti, Intel i5-13400F, 16GB DDR4, 512GB NVMe SSD. Phù hợp cho gaming 1080p và esports.',
        price: 22000000,
        StockQuantity: 8,
        status: 'available'
      },
      {
        title: 'Gaming PC RTX 4080',
        language: 'Tiếng Việt',
        image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=Gaming+PC+RTX+4080',
        categories_id: gamingPCId?.id,
        description: 'Máy tính gaming flagship với RTX 4080, Intel i9-13900K, 32GB DDR5, 2TB NVMe SSD. Hiệu năng cực mạnh cho gaming 4K.',
        price: 45000000,
        StockQuantity: 2,
        status: 'available'
      },
      {
        title: 'Gaming PC RTX 3060',
        language: 'Tiếng Việt',
        image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=Gaming+PC+RTX+3060',
        categories_id: gamingPCId?.id,
        description: 'Máy tính gaming entry-level với RTX 3060, AMD Ryzen 5 5600X, 16GB DDR4, 1TB SSD. Phù hợp cho gaming 1080p.',
        price: 18000000,
        StockQuantity: 6,
        status: 'available'
      },

      // More Consoles
      {
        title: 'Nintendo Switch OLED',
        language: 'Tiếng Việt',
        image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=Nintendo+Switch+OLED',
        categories_id: consoleId?.id,
        description: 'Console handheld với màn hình OLED đẹp mắt, game độc quyền Nintendo và khả năng chơi portable.',
        price: 8000000,
        StockQuantity: 7,
        status: 'available'
      },
      {
        title: 'PlayStation 5 Digital Edition',
        language: 'Tiếng Việt',
        image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=PS5+Digital',
        categories_id: consoleId?.id,
        description: 'PlayStation 5 phiên bản Digital không có ổ đĩa, SSD 825GB, DualSense controller và hỗ trợ 4K gaming.',
        price: 10000000,
        StockQuantity: 4,
        status: 'available'
      },
      {
        title: 'Xbox Series S',
        language: 'Tiếng Việt',
        image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=Xbox+Series+S',
        categories_id: consoleId?.id,
        description: 'Xbox Series S compact với Game Pass, hỗ trợ 1440p gaming và backward compatibility.',
        price: 7000000,
        StockQuantity: 5,
        status: 'available'
      },

      // More Controllers
      {
        title: 'Xbox Wireless Controller',
        language: 'Tiếng Việt',
        image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=Xbox+Controller',
        categories_id: controllerId?.id,
        description: 'Tay cầm Xbox với impulse triggers, share button, Bluetooth và tương thích PC.',
        price: 1500000,
        StockQuantity: 12,
        status: 'available'
      },
      {
        title: 'Pro Controller Nintendo Switch',
        language: 'Tiếng Việt',
        image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=Pro+Controller',
        categories_id: controllerId?.id,
        description: 'Tay cầm chuyên nghiệp cho Nintendo Switch với thiết kế ergonomic và HD Rumble.',
        price: 1200000,
        StockQuantity: 10,
        status: 'available'
      },
      {
        title: 'DualShock 4 Controller',
        language: 'Tiếng Việt',
        image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=DualShock+4',
        categories_id: controllerId?.id,
        description: 'Tay cầm PlayStation 4 với touchpad, light bar và tương thích PS5.',
        price: 1000000,
        StockQuantity: 8,
        status: 'available'
      },

      // More Games
      {
        title: 'Call of Duty: Modern Warfare III',
        language: 'Tiếng Việt',
        image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=Call+of+Duty+MW3',
        categories_id: gameId?.id,
        description: 'Game bắn súng FPS với chế độ multiplayer, campaign và Warzone.',
        price: 1200000,
        StockQuantity: 25,
        status: 'available'
      },
      {
        title: 'The Legend of Zelda: Tears of the Kingdom',
        language: 'Tiếng Việt',
        image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=Zelda+TOTK',
        categories_id: gameId?.id,
        description: 'Game phiêu lưu độc quyền Nintendo Switch với thế giới mở rộng lớn.',
        price: 1500000,
        StockQuantity: 18,
        status: 'available'
      },
      {
        title: 'Spider-Man 2',
        language: 'Tiếng Việt',
        image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=Spider-Man+2',
        categories_id: gameId?.id,
        description: 'Game hành động độc quyền PlayStation 5 với đồ họa đẹp mắt và gameplay mượt mà.',
        price: 1300000,
        StockQuantity: 15,
        status: 'available'
      },
      {
        title: 'Forza Horizon 5',
        language: 'Tiếng Việt',
        image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=Forza+Horizon+5',
        categories_id: gameId?.id,
        description: 'Game đua xe mở với đồ họa đẹp, nhiều xe và track đa dạng.',
        price: 1000000,
        StockQuantity: 12,
        status: 'available'
      },

      // More Gaming Headsets
      {
        title: 'HyperX Cloud Alpha S',
        language: 'Tiếng Việt',
        image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=HyperX+Cloud+Alpha',
        categories_id: headsetId?.id,
        description: 'Tai nghe gaming với âm thanh 7.1 surround, microphone detachable và tương thích đa platform.',
        price: 2800000,
        StockQuantity: 10,
        status: 'available'
      },
      {
        title: 'Razer BlackShark V2 Pro',
        language: 'Tiếng Việt',
        image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=Razer+BlackShark',
        categories_id: headsetId?.id,
        description: 'Tai nghe gaming không dây với THX Spatial Audio và microphone noise-cancelling.',
        price: 3200000,
        StockQuantity: 6,
        status: 'available'
      },
      {
        title: 'Corsair HS80 RGB Wireless',
        language: 'Tiếng Việt',
        image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=Corsair+HS80',
        categories_id: headsetId?.id,
        description: 'Tai nghe gaming không dây với RGB lighting, microphone broadcast-quality và battery 20 giờ.',
        price: 3000000,
        StockQuantity: 8,
        status: 'available'
      },

      // More Gaming Monitors
      {
        title: 'ASUS ROG Strix XG27AQ',
        language: 'Tiếng Việt',
        image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=ROG+Strix+XG27AQ',
        categories_id: monitorId?.id,
        description: 'Màn hình gaming 27 inch 1440p với G-Sync, tần số quét 170Hz và response time 1ms.',
        price: 12000000,
        StockQuantity: 5,
        status: 'available'
      },
      {
        title: 'LG UltraGear 24GN60R',
        language: 'Tiếng Việt',
        image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=LG+UltraGear+24GN60R',
        categories_id: monitorId?.id,
        description: 'Màn hình gaming 24 inch 1080p với FreeSync, tần số quét 144Hz và response time 1ms.',
        price: 6000000,
        StockQuantity: 8,
        status: 'available'
      },
      {
        title: 'Samsung Odyssey G7',
        language: 'Tiếng Việt',
        image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=Samsung+Odyssey+G7',
        categories_id: monitorId?.id,
        description: 'Màn hình gaming curved 32 inch 1440p với FreeSync Premium Pro và tần số quét 240Hz.',
        price: 18000000,
        StockQuantity: 3,
        status: 'available'
      }
    ];

    await knex('books').insert(moreGamingProducts);
    console.log(`✅ Inserted ${moreGamingProducts.length} more gaming products successfully!`);

    // Verify total products
    const totalProducts = await knex('books')
      .join('categories', 'books.categories_id', 'categories.id')
      .select('categories.name as category_name')
      .whereIn('categories.name', ['Gaming PC', 'Console', 'Controller', 'Game', 'Gaming Headset', 'Gaming Monitor']);
    
    console.log('\n📊 Updated Gaming Products Summary:');
    const categoryCounts = {};
    totalProducts.forEach(p => {
      categoryCounts[p.category_name] = (categoryCounts[p.category_name] || 0) + 1;
    });
    
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} products`);
    });
    
    console.log(`\nTotal gaming products: ${totalProducts.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await knex.destroy();
  }
}

// Run the function
addMoreGamingProducts();







