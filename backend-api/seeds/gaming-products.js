exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('gaming_products').del();
  
  // Inserts seed entries
  await knex('gaming_products').insert([
    // Gaming PCs
    {
      id: 1,
      name: 'Gaming PC RTX 4070 Super',
      description: 'Máy tính gaming cao cấp với RTX 4070 Super, hiệu năng mạnh mẽ cho gaming 1440p',
      price: 28000000,
      category: 'gamingPCs',
      platform: 'PC',
      specs: JSON.stringify({
        cpu: 'Intel i7-13700K',
        gpu: 'RTX 4070 Super',
        ram: '32GB DDR5',
        storage: '1TB NVMe SSD',
        motherboard: 'Z790',
        psu: '750W 80+ Gold'
      }),
      resolution: '1440p',
      targetGames: JSON.stringify(['AAA Games', 'Competitive', 'Streaming']),
      stock: 5,
      rating: 4.8,
      ratingCount: 127,
      image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=Gaming+PC+RTX+4070',
      features: JSON.stringify(['RGB Lighting', 'High Performance', 'Gaming Ready']),
      compatibility: JSON.stringify(['PC']),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 2,
      name: 'Gaming PC RTX 4060 Ti',
      description: 'Máy tính gaming tầm trung với RTX 4060 Ti, phù hợp cho gaming 1080p',
      price: 22000000,
      category: 'gamingPCs',
      platform: 'PC',
      specs: JSON.stringify({
        cpu: 'Intel i5-13400F',
        gpu: 'RTX 4060 Ti',
        ram: '16GB DDR4',
        storage: '512GB NVMe SSD',
        motherboard: 'B760',
        psu: '650W 80+ Bronze'
      }),
      resolution: '1080p',
      targetGames: JSON.stringify(['Casual', 'Esports', 'AAA Games']),
      stock: 8,
      rating: 4.6,
      ratingCount: 89,
      image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=Gaming+PC+RTX+4060',
      features: JSON.stringify(['Compact Design', 'Value for Money', 'Gaming Ready']),
      compatibility: JSON.stringify(['PC']),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 3,
      name: 'Gaming PC RTX 4080',
      description: 'Máy tính gaming flagship với RTX 4080, hiệu năng cực mạnh cho gaming 4K',
      price: 45000000,
      category: 'gamingPCs',
      platform: 'PC',
      specs: JSON.stringify({
        cpu: 'Intel i9-13900K',
        gpu: 'RTX 4080',
        ram: '32GB DDR5',
        storage: '2TB NVMe SSD',
        motherboard: 'Z790',
        psu: '850W 80+ Platinum'
      }),
      resolution: '4K',
      targetGames: JSON.stringify(['AAA Games', '4K Gaming', 'Content Creation']),
      stock: 3,
      rating: 4.9,
      ratingCount: 45,
      image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=Gaming+PC+RTX+4080',
      features: JSON.stringify(['Premium Build', '4K Ready', 'Content Creation']),
      compatibility: JSON.stringify(['PC']),
      created_at: new Date(),
      updated_at: new Date()
    },

    // Consoles
    {
      id: 4,
      name: 'PlayStation 5',
      description: 'Console gaming thế hệ mới với SSD siêu nhanh và DualSense controller',
      price: 12000000,
      category: 'consoles',
      platform: 'PlayStation',
      specs: JSON.stringify({
        cpu: 'AMD Zen 2 8-core',
        gpu: 'AMD RDNA 2',
        storage: '825GB SSD',
        memory: '16GB GDDR6',
        optical: '4K UHD Blu-ray'
      }),
      resolution: '4K',
      targetGames: JSON.stringify(['Exclusive', 'AAA Games', 'VR']),
      stock: 3,
      rating: 4.9,
      ratingCount: 234,
      image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=PlayStation+5',
      features: JSON.stringify(['4K Gaming', 'Ray Tracing', 'DualSense']),
      compatibility: JSON.stringify(['PlayStation']),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 5,
      name: 'Xbox Series X',
      description: 'Console gaming mạnh nhất với Game Pass và backward compatibility',
      price: 11000000,
      category: 'consoles',
      platform: 'Xbox',
      specs: JSON.stringify({
        cpu: 'AMD Zen 2 8-core',
        gpu: 'AMD RDNA 2',
        storage: '1TB SSD',
        memory: '16GB GDDR6',
        optical: '4K UHD Blu-ray'
      }),
      resolution: '4K',
      targetGames: JSON.stringify(['Game Pass', 'AAA Games', 'Backward Compatible']),
      stock: 4,
      rating: 4.7,
      ratingCount: 189,
      image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=Xbox+Series+X',
      features: JSON.stringify(['Game Pass', 'Quick Resume', 'Backward Compatible']),
      compatibility: JSON.stringify(['Xbox']),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 6,
      name: 'Nintendo Switch OLED',
      description: 'Console handheld với màn hình OLED đẹp mắt và game độc quyền',
      price: 8000000,
      category: 'consoles',
      platform: 'Nintendo',
      specs: JSON.stringify({
        cpu: 'NVIDIA Tegra X1',
        gpu: 'NVIDIA Maxwell',
        storage: '64GB',
        memory: '4GB LPDDR4',
        display: '7-inch OLED'
      }),
      resolution: '1080p',
      targetGames: JSON.stringify(['Nintendo Exclusive', 'Indie Games', 'Family Games']),
      stock: 7,
      rating: 4.5,
      ratingCount: 156,
      image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=Nintendo+Switch+OLED',
      features: JSON.stringify(['OLED Display', 'Portable', 'Exclusive Games']),
      compatibility: JSON.stringify(['Nintendo']),
      created_at: new Date(),
      updated_at: new Date()
    },

    // Controllers
    {
      id: 7,
      name: 'DualSense Controller',
      description: 'Tay cầm PlayStation 5 với haptic feedback và adaptive triggers',
      price: 1800000,
      category: 'controllers',
      platform: 'PlayStation',
      specs: JSON.stringify({
        connectivity: 'Bluetooth, USB-C',
        battery: 'Built-in rechargeable',
        features: 'Haptic feedback, Adaptive triggers',
        microphone: 'Built-in microphone array'
      }),
      resolution: null,
      targetGames: JSON.stringify(['PlayStation Games', 'PC Games']),
      stock: 15,
      rating: 4.8,
      ratingCount: 98,
      image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=DualSense+Controller',
      features: JSON.stringify(['Haptic Feedback', 'Adaptive Triggers', 'Built-in Mic']),
      compatibility: JSON.stringify(['PS5', 'PC']),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 8,
      name: 'Xbox Wireless Controller',
      description: 'Tay cầm Xbox với impulse triggers và share button',
      price: 1500000,
      category: 'controllers',
      platform: 'Xbox',
      specs: JSON.stringify({
        connectivity: 'Bluetooth, Xbox Wireless',
        battery: 'AA batteries or rechargeable',
        features: 'Impulse triggers, Share button',
        audio: '3.5mm headset jack'
      }),
      resolution: null,
      targetGames: JSON.stringify(['Xbox Games', 'PC Games']),
      stock: 12,
      rating: 4.7,
      ratingCount: 87,
      image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=Xbox+Controller',
      features: JSON.stringify(['Impulse Triggers', 'Share Button', 'Bluetooth']),
      compatibility: JSON.stringify(['Xbox', 'PC']),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 9,
      name: 'Pro Controller Nintendo Switch',
      description: 'Tay cầm chuyên nghiệp cho Nintendo Switch với thiết kế ergonomic',
      price: 1200000,
      category: 'controllers',
      platform: 'Nintendo',
      specs: JSON.stringify({
        connectivity: 'Bluetooth',
        battery: 'Built-in rechargeable',
        features: 'HD Rumble, Motion controls',
        audio: '3.5mm headset jack'
      }),
      resolution: null,
      targetGames: JSON.stringify(['Nintendo Games', 'Fighting Games']),
      stock: 10,
      rating: 4.6,
      ratingCount: 76,
      image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=Pro+Controller',
      features: JSON.stringify(['HD Rumble', 'Motion Controls', 'Ergonomic']),
      compatibility: JSON.stringify(['Nintendo Switch']),
      created_at: new Date(),
      updated_at: new Date()
    },

    // Games
    {
      id: 10,
      name: 'Cyberpunk 2077',
      description: 'Game RPG cyberpunk với thế giới mở và câu chuyện hấp dẫn',
      price: 800000,
      category: 'games',
      platform: 'Multi-platform',
      specs: JSON.stringify({
        genre: 'RPG',
        developer: 'CD Projekt Red',
        publisher: 'CD Projekt',
        releaseDate: '2020-12-10'
      }),
      resolution: null,
      targetGames: JSON.stringify(['RPG', 'Open World', 'Story-driven']),
      stock: 20,
      rating: 4.2,
      ratingCount: 145,
      image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=Cyberpunk+2077',
      features: JSON.stringify(['Open World', 'Character Customization', 'Multiple Endings']),
      compatibility: JSON.stringify(['PC', 'PlayStation', 'Xbox']),
      genre: 'RPG',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 11,
      name: 'Call of Duty: Modern Warfare III',
      description: 'Game bắn súng FPS với chế độ multiplayer và campaign',
      price: 1200000,
      category: 'games',
      platform: 'Multi-platform',
      specs: JSON.stringify({
        genre: 'FPS',
        developer: 'Infinity Ward',
        publisher: 'Activision',
        releaseDate: '2023-11-10'
      }),
      resolution: null,
      targetGames: JSON.stringify(['FPS', 'Multiplayer', 'Competitive']),
      stock: 25,
      rating: 4.5,
      ratingCount: 198,
      image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=Call+of+Duty+MW3',
      features: JSON.stringify(['Multiplayer', 'Campaign', 'Warzone']),
      compatibility: JSON.stringify(['PC', 'PlayStation', 'Xbox']),
      genre: 'FPS',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 12,
      name: 'The Legend of Zelda: Tears of the Kingdom',
      description: 'Game phiêu lưu độc quyền Nintendo Switch với thế giới mở rộng lớn',
      price: 1500000,
      category: 'games',
      platform: 'Nintendo',
      specs: JSON.stringify({
        genre: 'Action-Adventure',
        developer: 'Nintendo EPD',
        publisher: 'Nintendo',
        releaseDate: '2023-05-12'
      }),
      resolution: null,
      targetGames: JSON.stringify(['Adventure', 'Open World', 'Puzzle']),
      stock: 18,
      rating: 4.9,
      ratingCount: 267,
      image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=Zelda+TOTK',
      features: JSON.stringify(['Open World', 'Puzzle Solving', 'Exploration']),
      compatibility: JSON.stringify(['Nintendo Switch']),
      genre: 'Action-Adventure',
      created_at: new Date(),
      updated_at: new Date()
    },

    // Accessories
    {
      id: 13,
      name: 'SteelSeries Arctis 7P',
      description: 'Tai nghe gaming không dây cho PlayStation với âm thanh 7.1 surround',
      price: 3500000,
      category: 'accessories',
      platform: 'Multi-platform',
      specs: JSON.stringify({
        connectivity: 'Wireless 2.4GHz',
        battery: '24 hours',
        microphone: 'Retractable noise-cancelling',
        audio: '7.1 Surround Sound'
      }),
      resolution: null,
      targetGames: JSON.stringify(['Gaming', 'Communication', 'Streaming']),
      stock: 8,
      rating: 4.6,
      ratingCount: 92,
      image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=Arctis+7P',
      features: JSON.stringify(['Wireless', '7.1 Surround', 'Discord Certified']),
      compatibility: JSON.stringify(['PS5', 'PC']),
      type: 'Gaming Headset',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 14,
      name: 'Corsair K70 RGB Pro',
      description: 'Bàn phím gaming cơ với Cherry MX switches và RGB lighting',
      price: 2500000,
      category: 'accessories',
      platform: 'PC',
      specs: JSON.stringify({
        switches: 'Cherry MX Red',
        connectivity: 'USB-C',
        lighting: 'RGB per-key',
        features: 'Volume roller, Media keys'
      }),
      resolution: null,
      targetGames: JSON.stringify(['Gaming', 'Typing', 'Streaming']),
      stock: 10,
      rating: 4.7,
      ratingCount: 134,
      image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=K70+RGB',
      features: JSON.stringify(['Mechanical', 'RGB', 'Cherry MX']),
      compatibility: JSON.stringify(['PC']),
      type: 'Gaming Keyboard',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 15,
      name: 'Logitech G Pro X Superlight',
      description: 'Chuột gaming không dây siêu nhẹ với sensor HERO 25K',
      price: 2000000,
      category: 'accessories',
      platform: 'PC',
      specs: JSON.stringify({
        sensor: 'HERO 25K DPI',
        connectivity: 'Wireless 2.4GHz',
        battery: '70 hours',
        weight: '63g'
      }),
      resolution: null,
      targetGames: JSON.stringify(['FPS', 'Competitive', 'Esports']),
      stock: 12,
      rating: 4.8,
      ratingCount: 156,
      image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=G+Pro+X',
      features: JSON.stringify(['Wireless', 'Lightweight', 'High DPI']),
      compatibility: JSON.stringify(['PC']),
      type: 'Gaming Mouse',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 16,
      name: 'ASUS ROG Swift PG27UQ',
      description: 'Màn hình gaming 4K 27 inch với G-Sync và HDR',
      price: 15000000,
      category: 'accessories',
      platform: 'PC',
      specs: JSON.stringify({
        resolution: '3840x2160',
        refreshRate: '144Hz',
        responseTime: '4ms',
        features: 'G-Sync, HDR10'
      }),
      resolution: '4K',
      targetGames: JSON.stringify(['4K Gaming', 'Competitive', 'Content Creation']),
      stock: 3,
      rating: 4.9,
      ratingCount: 67,
      image: 'https://via.placeholder.com/400x300/1a1a1d/ff6b35?text=ROG+Swift+PG27UQ',
      features: JSON.stringify(['4K', 'G-Sync', 'HDR10']),
      compatibility: JSON.stringify(['PC']),
      type: 'Gaming Monitor',
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
};







