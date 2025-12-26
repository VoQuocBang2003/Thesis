const knex = require('../knexfile');

async function addGamingCategories() {
  try {
    console.log('Adding gaming categories to database...');
    
    // Thêm các category gaming mới
    const gamingCategories = [
      {
        name: 'Gaming PC',
        description: 'Máy tính gaming cao cấp với card đồ họa mạnh mẽ',
        image: 'https://via.placeholder.com/300x200/1a1a1d/ff6b35?text=Gaming+PC'
      },
      {
        name: 'Console',
        description: 'Máy chơi game console PlayStation, Xbox, Nintendo',
        image: 'https://via.placeholder.com/300x200/1a1a1d/ff6b35?text=Console'
      },
      {
        name: 'Controller',
        description: 'Tay cầm game cho các platform khác nhau',
        image: 'https://via.placeholder.com/300x200/1a1a1d/ff6b35?text=Controller'
      },
      {
        name: 'Game',
        description: 'Đĩa game và game số cho các platform',
        image: 'https://via.placeholder.com/300x200/1a1a1d/ff6b35?text=Game'
      },
      {
        name: 'Gaming Headset',
        description: 'Tai nghe gaming với âm thanh surround',
        image: 'https://via.placeholder.com/300x200/1a1a1d/ff6b35?text=Gaming+Headset'
      },
      {
        name: 'Gaming Monitor',
        description: 'Màn hình gaming với tần số quét cao',
        image: 'https://via.placeholder.com/300x200/1a1a1d/ff6b35?text=Gaming+Monitor'
      }
    ];

    // Kiểm tra và thêm category nếu chưa tồn tại
    for (const category of gamingCategories) {
      const existing = await knex('categories').where('name', category.name).first();
      if (!existing) {
        await knex('categories').insert(category);
        console.log(`✅ Added category: ${category.name}`);
      } else {
        console.log(`⚠️ Category already exists: ${category.name}`);
      }
    }

    // Thêm một số sản phẩm gaming mẫu
    const gamingProducts = [
      {
        title: 'Gaming PC RTX 4070 Super',
        language: 'Tiếng Việt',
        image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=Gaming+PC+RTX+4070',
        categories_id: 3, // Gaming PC category
        description: 'Máy tính gaming cao cấp với RTX 4070 Super, Intel i7-13700K, 32GB DDR5, 1TB NVMe SSD. Hiệu năng mạnh mẽ cho gaming 1440p và streaming.',
        price: 28000000,
        StockQuantity: 5,
        status: 'available'
      },
      {
        title: 'PlayStation 5',
        language: 'Tiếng Việt',
        image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=PlayStation+5',
        categories_id: 4, // Console category
        description: 'Console gaming thế hệ mới với SSD siêu nhanh, DualSense controller, hỗ trợ 4K gaming và ray tracing.',
        price: 12000000,
        StockQuantity: 3,
        status: 'available'
      },
      {
        title: 'Xbox Series X',
        language: 'Tiếng Việt',
        image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=Xbox+Series+X',
        categories_id: 4, // Console category
        description: 'Console gaming mạnh nhất với Game Pass, backward compatibility, Quick Resume và hỗ trợ 4K gaming.',
        price: 11000000,
        StockQuantity: 4,
        status: 'available'
      },
      {
        title: 'DualSense Controller',
        language: 'Tiếng Việt',
        image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=DualSense+Controller',
        categories_id: 5, // Controller category
        description: 'Tay cầm PlayStation 5 với haptic feedback, adaptive triggers, built-in microphone và Bluetooth.',
        price: 1800000,
        StockQuantity: 15,
        status: 'available'
      },
      {
        title: 'Cyberpunk 2077',
        language: 'Tiếng Việt',
        image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=Cyberpunk+2077',
        categories_id: 6, // Game category
        description: 'Game RPG cyberpunk với thế giới mở, câu chuyện hấp dẫn, character customization và multiple endings.',
        price: 800000,
        StockQuantity: 20,
        status: 'available'
      },
      {
        title: 'SteelSeries Arctis 7P',
        language: 'Tiếng Việt',
        image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=Arctis+7P',
        categories_id: 7, // Gaming Headset category
        description: 'Tai nghe gaming không dây cho PlayStation với âm thanh 7.1 surround, Discord certified và battery 24 giờ.',
        price: 3500000,
        StockQuantity: 8,
        status: 'available'
      },
      {
        title: 'ASUS ROG Swift PG27UQ',
        language: 'Tiếng Việt',
        image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=ROG+Swift+PG27UQ',
        categories_id: 8, // Gaming Monitor category
        description: 'Màn hình gaming 4K 27 inch với G-Sync, HDR10, tần số quét 144Hz và response time 4ms.',
        price: 15000000,
        StockQuantity: 3,
        status: 'available'
      }
    ];

    // Thêm sản phẩm gaming mới
    for (const product of gamingProducts) {
      const existing = await knex('books').where('title', product.title).first();
      if (!existing) {
        await knex('books').insert(product);
        console.log(`✅ Added product: ${product.title}`);
      } else {
        console.log(`⚠️ Product already exists: ${product.title}`);
      }
    }

    console.log('\n📊 Database Summary:');
    const categories = await knex('categories').select('*');
    console.log('Categories:');
    categories.forEach(cat => {
      console.log(`  ${cat.id}. ${cat.name} - ${cat.description}`);
    });

    const totalProducts = await knex('books').count('* as count');
    console.log(`\nTotal products: ${totalProducts[0].count}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await knex.destroy();
  }
}

// Run the function
addGamingCategories();







