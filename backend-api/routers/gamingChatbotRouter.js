const express = require('express');
const router = express.Router();
const AiExternalService = require('../services/aiExternalService');
const db = require('../knexfile');

class GamingChatbotService {
  constructor() {
    this.products = {};
    this.loadGamingProducts();
  }

  async loadGamingProducts() {
    try {
      const db = require('../knexfile');
      
      // Load ALL products from database with categories
      const allProducts = await db('books')
        .select('books.*', 'categories.name as category_name')
        .leftJoin('categories', 'books.categories_id', 'categories.id');

      // Load all gaming products (for backward compatibility)
      const gamingPCs = allProducts.filter(p => 
        (p.category_name && (p.category_name.toLowerCase().includes('gaming pc') || p.category_name.toLowerCase().includes('pc gaming'))) ||
        (p.title && (p.title.toLowerCase().includes('gaming pc') || p.title.toLowerCase().includes('pc gaming')))
      );
      const consoles = allProducts.filter(p => 
        (p.category_name && (p.category_name.toLowerCase().includes('console') || p.category_name.toLowerCase().includes('playstation') || p.category_name.toLowerCase().includes('xbox'))) ||
        (p.title && (p.title.toLowerCase().includes('console') || p.title.toLowerCase().includes('playstation') || p.title.toLowerCase().includes('xbox')))
      );
      const controllers = allProducts.filter(p => 
        (p.category_name && (p.category_name.toLowerCase().includes('controller') || p.category_name.toLowerCase().includes('tay cầm'))) ||
        (p.title && (p.title.toLowerCase().includes('controller') || p.title.toLowerCase().includes('tay cầm')))
      );
      const games = allProducts.filter(p => 
        (p.category_name && p.category_name.toLowerCase().includes('game')) ||
        (p.title && p.title.toLowerCase().includes('game'))
      );
      const accessories = allProducts.filter(p => 
        (p.category_name && (p.category_name.toLowerCase().includes('phụ kiện') || p.category_name.toLowerCase().includes('accessory'))) ||
        (p.title && (p.title.toLowerCase().includes('phụ kiện') || p.title.toLowerCase().includes('accessory')))
      );
      const keyboards = allProducts.filter(p => 
        (p.category_name && (p.category_name.toLowerCase().includes('keyboard') || p.category_name.toLowerCase().includes('bàn phím'))) ||
        (p.title && (p.title.toLowerCase().includes('keyboard') || p.title.toLowerCase().includes('bàn phím')))
      );
      const mice = allProducts.filter(p => 
        (p.category_name && (p.category_name.toLowerCase().includes('mouse') || p.category_name.toLowerCase().includes('chuột'))) ||
        (p.title && (p.title.toLowerCase().includes('mouse') || p.title.toLowerCase().includes('chuột')))
      );

      this.products = {
        gamingPCs,
        consoles,
        controllers,
        games,
        accessories,
        keyboards,
        mice,
        all: allProducts // Store all products for full catalog
      };

      console.log('✅ All products loaded from database:');
      console.log(`  Total products: ${allProducts.length}`);
      console.log(`  Gaming PCs: ${gamingPCs.length}`);
      console.log(`  Consoles: ${consoles.length}`);
      console.log(`  Controllers: ${controllers.length}`);
      console.log(`  Games: ${games.length}`);
      console.log(`  Accessories: ${accessories.length}`);
      console.log(`  Keyboards: ${keyboards.length}`);
      console.log(`  Mice: ${mice.length}`);

    } catch (error) {
      console.error('Error loading gaming products:', error);
      // Use mock data when database is not available
    this.products = {
      gamingPCs: [
          { id: 1, name: 'Gaming PC RTX 4060', price: 15000000, rating: 4.5, category: 'gaming pc' },
          { id: 2, name: 'Gaming PC RTX 4070', price: 20000000, rating: 4.7, category: 'gaming pc' }
      ],
      consoles: [
          { id: 3, name: 'PlayStation 5', price: 12000000, rating: 4.6, category: 'console' },
          { id: 4, name: 'Xbox Series X', price: 11000000, rating: 4.8, category: 'console' }
        ],
        controllers: [
          { id: 5, name: 'DualSense Controller', price: 1500000, rating: 4.5, category: 'controller' },
          { id: 6, name: 'Xbox Controller', price: 1400000, rating: 4.4, category: 'controller' }
        ],
        games: [
          { id: 7, name: 'God of War Ragnarok', price: 1200000, rating: 4.9, category: 'game' },
          { id: 8, name: 'Elden Ring', price: 1100000, rating: 4.8, category: 'game' }
        ],
        accessories: [
          { id: 9, name: 'Gaming Headset', price: 2000000, rating: 4.3, category: 'accessory' },
          { id: 10, name: 'Gaming Mouse Pad', price: 500000, rating: 4.2, category: 'accessory' }
        ],
        keyboards: [
          { id: 11, name: 'Mechanical Keyboard', price: 3000000, rating: 4.6, category: 'keyboard' },
          { id: 12, name: 'RGB Gaming Keyboard', price: 2500000, rating: 4.4, category: 'keyboard' }
        ],
        mice: [
          { id: 13, name: 'Gaming Mouse', price: 1500000, rating: 4.5, category: 'mouse' },
          { id: 14, name: 'Wireless Gaming Mouse', price: 2000000, rating: 4.3, category: 'mouse' }
        ]
      };
      console.log('✅ Using mock gaming products data');
    }
  }

  // User context management
  getUserContext(userId) {
    if (!this.userContexts) {
      this.userContexts = {};
    }
    if (!this.userContexts[userId]) {
      this.userContexts[userId] = {
        previousMessages: [],
        userProfile: {}
      };
    }
    return this.userContexts[userId];
  }

  // NLP Processing
  processMessage(message) {
    // Normalize abbreviations first
    const normalizedMessage = this.normalizeAbbreviations(message);
    const lowerMessage = normalizedMessage.toLowerCase();
    
    // Intent detection
    const intentScores = {
      greeting: 0,
      budget_query: 0,
      platform_query: 0,
      product_inquiry: 0,
      comparison_query: 0,
      genre_query: 0,
      general: 0
    };

    // Greeting detection
    if (lowerMessage.includes('xin chào') || lowerMessage.includes('chào') || 
        lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      intentScores.greeting = 0.9;
    }

    // Budget detection
    if (lowerMessage.includes('ngân sách') || lowerMessage.includes('budget') || 
        lowerMessage.includes('tiền') || lowerMessage.includes('giá') ||
        /\d+.*triệu|\d+.*million|\d+.*k|\d+.*000/.test(lowerMessage)) {
      intentScores.budget_query = 0.8;
    }

    // Platform detection
    if (lowerMessage.includes('pc') || lowerMessage.includes('console') || 
        lowerMessage.includes('playstation') || lowerMessage.includes('xbox') ||
        lowerMessage.includes('nintendo') || lowerMessage.includes('platform')) {
      intentScores.platform_query = 0.8;
    }

    // Product inquiry
    if (lowerMessage.includes('mua') || lowerMessage.includes('tư vấn') || 
        lowerMessage.includes('gợi ý') || lowerMessage.includes('recommend')) {
      intentScores.product_inquiry = 0.7;
    }

    // Comparison detection
    if (lowerMessage.includes('so sánh') || lowerMessage.includes('compare')) {
      intentScores.comparison_query = 0.9;
    }

    // Genre detection
    if (lowerMessage.includes('fps') || lowerMessage.includes('rpg') || 
        lowerMessage.includes('action') || lowerMessage.includes('strategy') ||
        lowerMessage.includes('game')) {
      intentScores.genre_query = 0.6;
    }

    // General fallback
    if (Object.values(intentScores).every(score => score < 0.5)) {
      intentScores.general = 0.5;
    }

    // Find highest scoring intent
    let detectedIntent = 'general';
    let confidence = 0.5;
    
    for (const [intent, score] of Object.entries(intentScores)) {
      if (score > confidence) {
        detectedIntent = intent;
        confidence = score;
      }
    }

    // Special case: prioritize comparison for explicit "so sánh"
    if (lowerMessage.includes('so sánh') && intentScores.comparison_query > 0) {
      detectedIntent = 'comparison_query';
      confidence = Math.min(0.95, 0.8 + (intentScores.comparison_query * 0.1));
    }

    // Entity extraction
    const entities = this.extractEntities(message);
          
          return {
      intent: detectedIntent,
      confidence: confidence,
      entities: entities
    };
  }

        // Extract requested number of products from user message (e.g., '1 sản phẩm', 'hai sản phẩm')
        extractRequestedCount(message) {
          if (!message || typeof message !== 'string') return null;
          const lower = message.toLowerCase();
          // Numeric digits
          const digitMatch = lower.match(/(\d+)\s*(sản phẩm|sp|cái|items|product|products)?/i);
          if (digitMatch && digitMatch[1]) {
            const n = parseInt(digitMatch[1], 10);
            if (!isNaN(n) && n > 0 && n <= 20) return n;
          }
          // Word numbers (simple)
          const words = { 'một':1, 'mot':1, 'hai':2, 'ba':3, 'bốn':4, 'bon':4, 'năm':5, 'nam':5 };
          for (const [w, v] of Object.entries(words)) {
            if (lower.includes(w + ' sản phẩm') || lower.includes(w + ' sp') || lower.includes(w + ' cái')) return v;
          }
          return null;
        }

  extractEntities(message) {
    const lowerMessage = message.toLowerCase();
    const entities = {
      productNames: [],
      platform: [],
      gameGenre: [],
      budget: null
    };

    // Extract product names
    entities.productNames = this.extractProductNames(lowerMessage);

    // Extract platform
    if (lowerMessage.includes('pc') || lowerMessage.includes('computer')) {
      entities.platform.push('PC');
    }
    if (lowerMessage.includes('playstation') || lowerMessage.includes('ps5') || lowerMessage.includes('ps4')) {
      entities.platform.push('PlayStation');
    }
    if (lowerMessage.includes('xbox')) {
      entities.platform.push('Xbox');
    }
    if (lowerMessage.includes('nintendo') || lowerMessage.includes('switch')) {
      entities.platform.push('Nintendo');
    }
    if (lowerMessage.includes('console')) {
      entities.platform.push('Console');
    }

    // Extract game genre
    if (lowerMessage.includes('fps') || lowerMessage.includes('shooter')) {
      entities.gameGenre.push('FPS');
    }
    if (lowerMessage.includes('rpg') || lowerMessage.includes('role playing')) {
      entities.gameGenre.push('RPG');
    }
    if (lowerMessage.includes('action')) {
      entities.gameGenre.push('Action');
    }
    if (lowerMessage.includes('strategy')) {
      entities.gameGenre.push('Strategy');
    }

    // Extract budget
    const budgetMatch = lowerMessage.match(/(\d+)\s*(triệu|million|k|000)/);
    if (budgetMatch) {
      let amount = parseInt(budgetMatch[1]);
      const unit = budgetMatch[2];
      
      if (unit === 'k' || unit === '000') {
        amount = amount * 1000;
      } else if (unit === 'million') {
        amount = amount * 1000000;
      } else if (unit === 'triệu') {
        amount = amount * 1000000;
      }
      
      entities.budget = amount;
    }

    return entities;
  }

  extractProductNames(message) {
    const productNames = [];
    
    // Gaming product patterns
    const patterns = [
      /playstation\s*(\d+)/gi,
      /ps(\d+)/gi,
      /xbox\s*series\s*[xs]/gi,
      /xbox\s*x/gi,
      /xbox\s*s/gi,
      /nintendo\s*switch/gi,
      /gaming\s*pc/gi,
      /keyboard\s*gaming/gi,
      /mouse\s*gaming/gi,
      /controller\s*gaming/gi,
      /headset\s*gaming/gi,
      // Added more general patterns
      /ps5/gi,
      /ps4/gi,
      /xbox/gi
    ];

    patterns.forEach(pattern => {
      const matches = message.match(pattern);
      if (matches) {
        matches.forEach(match => {
          if (!productNames.includes(match.toLowerCase())) {
            productNames.push(match.toLowerCase());
          }
        });
      }
    });

    return productNames;
  }

  // Response generation
  generateGamingResponse(intent, entities, context, userId, currentMessage = '') {
    const userProfile = context.userProfile || {};
    let responseMessage = '';
    let recommendedProducts = [];
    let quickReplies = [];
    const lowerMessage = currentMessage.toLowerCase();

    // Generate response based on intent and context
    let templates;
    if (intent === 'general' && context.previousMessages.length > 0) {
      // Continue conversation based on context
      if (userProfile.platform === 'Console') {
        templates = [
          'Tôi thấy bạn quan tâm đến console gaming! ⭐',
          'Console gaming là lựa chọn tuyệt vời! 🎮',
          'Tôi hiểu bạn thích console! 🚀'
        ];
      } else if (userProfile.budget) {
        templates = [
          `Với ngân sách ${userProfile.budget.toLocaleString('vi-VN')} VNĐ, tôi có thể gợi ý setup gaming chất lượng! 💰`,
          `Ngân sách ${userProfile.budget.toLocaleString('vi-VN')} VNĐ rất hợp lý cho gaming! ⭐`,
          `Tôi sẽ tư vấn setup gaming với ngân sách này! 🎮`
        ];
          } else {
        templates = [
          'Tôi sẽ giúp bạn tìm setup gaming phù hợp! 🚀',
          'Hãy để tôi tư vấn gaming cho bạn! ⭐',
          'Tôi có thể gợi ý setup gaming tốt nhất! 🎮'
        ];
      }
          } else {
      // Use intent-specific templates
    switch (intent) {
        case 'greeting':
          templates = [
            'Chào bạn! Tôi là chuyên gia tư vấn gaming! 🚀 Tôi có thể giúp bạn setup gaming station hoàn hảo.',
            'Xin chào! Tôi sẽ giúp bạn tìm setup gaming phù hợp nhất! ⭐',
            'Chào bạn! Tôi có thể tư vấn gaming cho bạn! 🎮'
          ];
          break;
        case 'budget_query':
          // Check if user said they don't have budget
          const hasNoBudget = (lowerMessage.includes('không') || lowerMessage.includes('chưa')) && 
                              (lowerMessage.includes('ngân sách') || lowerMessage.includes('budget'));
          const hasSpecificBudget = entities.budget && entities.budget > 0;
          
          if (hasNoBudget && !hasSpecificBudget) {
            templates = [
              'Không sao! Tôi có thể gợi ý setup gaming phù hợp với nhiều mức giá khác nhau. 💰 Bạn thích platform nào?',
              'Tôi hiểu! Tôi sẽ tư vấn setup gaming phù hợp với ngân sách của bạn. 🎮 Bạn thường chơi game gì?',
              'Không vấn đề! Tôi có thể gợi ý từ setup gaming giá rẻ đến cao cấp. ⭐ Bạn đã có kinh nghiệm gaming chưa?'
            ];
          } else {
            templates = [
              'Tuyệt vời! Với ngân sách này, tôi có thể gợi ý setup gaming chất lượng. 💰 Bạn thích platform nào?',
              'Tôi hiểu rồi! Ngân sách này khá tốt để có setup gaming đáng giá. 🎮 Bạn thường chơi game gì?',
              'Rất tốt! Với mức giá này, bạn có thể có sản phẩm gaming cao cấp. ⭐ Bạn đã có kinh nghiệm gaming chưa?'
            ];
          }
          break;
      case 'platform_query':
          templates = [
            'Tuyệt vời! Tôi thấy bạn quan tâm đến platform này. 🎮 Đây là một lựa chọn rất tốt! Bạn có ngân sách cụ thể nào không? Và bạn thích chơi thể loại game gì?',
            'Rất tốt! Platform này có những ưu điểm riêng. 🚀 Bạn đã từng sử dụng platform này chưa? Hay đây là lần đầu tiên?',
            'Tôi hiểu sở thích platform của bạn rồi! ⭐ Để tôi tư vấn chi tiết hơn. Bạn có quan tâm đến phụ kiện đi kèm không?'
          ];
          break;
      case 'product_inquiry':
          templates = [
            'Tuyệt vời! Tôi sẽ giúp bạn tìm sản phẩm gaming phù hợp nhất. 🚀 Bạn có sở thích platform nào đặc biệt không?',
            'Tôi sẽ chọn những sản phẩm gaming tốt nhất cho bạn! ⭐ Trước tiên, bạn có sở thích platform nào đặc biệt không?',
            'Tôi rất vui được gợi ý cho bạn! 🎮 Để tôi hiểu rõ hơn về nhu cầu của bạn. Bạn có ngân sách cụ thể nào không? Và bạn thích chơi game gì?'
          ];
          break;
      case 'comparison_query':
          templates = [
            'Tôi sẽ so sánh chi tiết các sản phẩm này cho bạn! 🔍 Bạn có ngân sách cụ thể nào không?',
            'So sánh này sẽ giúp bạn chọn được sản phẩm phù hợp! ⭐ Bạn thích platform nào?',
            'Tôi sẽ phân tích ưu nhược điểm của từng sản phẩm! 🎮 Bạn có kinh nghiệm gaming chưa?'
          ];
          break;
        case 'genre_query':
          templates = [
            'Tuyệt vời! Thể loại game này rất thú vị! 🎮 Bạn có sở thích platform nào không?',
            'Tôi hiểu bạn thích thể loại này! ⭐ Bạn có ngân sách cụ thể nào không?',
            'Thể loại game này có những yêu cầu riêng! 🚀 Bạn đã có kinh nghiệm gaming chưa?'
          ];
          break;
        default:
          templates = [
            'Tôi sẽ giúp bạn tìm setup gaming phù hợp! 🚀',
            'Hãy để tôi tư vấn gaming cho bạn! ⭐',
            'Tôi có thể gợi ý setup gaming tốt nhất! 🎮'
          ];
      }
    }

    // Select random template
    responseMessage = templates[Math.floor(Math.random() * templates.length)];

    // Add personalized touches based on CURRENT entities only - No userProfile
    // Only add information from current message entities to avoid repetition
    if (entities.budget) {
      responseMessage += `\n\n💰 Ngân sách ${entities.budget.toLocaleString('vi-VN')} VNĐ rất hợp lý cho gaming!`;
    } else if (entities.platform && entities.platform.length > 0) {
      responseMessage += `\n\n🎮 ${entities.platform[0]} là lựa chọn tuyệt vời!`;
    } else if (entities.productNames && entities.productNames.length > 0) {
      responseMessage += `\n\n🔍 Tôi sẽ tư vấn về ${entities.productNames.join(', ')}.`;
    }

    // Add simple follow-up question only if not already asking something and not asked before
    if (!responseMessage.includes('?') && !responseMessage.includes('bạn có')) {
      const currentUserProfile = context.userProfile || {};
      
      // Check what questions have been asked before
      const askedQuestions = context.previousMessages.map(msg => {
        if (msg.message && msg.message.includes('?')) {
          if (msg.message.includes('ngân sách')) return 'budget';
          if (msg.message.includes('platform')) return 'platform';
          if (msg.message.includes('game')) return 'game';
    }
    return null;
      }).filter(q => q !== null);
      
      // Only ask questions that haven't been asked before
      if (!entities.budget && !currentUserProfile.budget && !askedQuestions.includes('budget')) {
        responseMessage += `\n\n💬 Bạn có ngân sách cụ thể nào không?`;
      } else if (!entities.platform && !currentUserProfile.platform && !askedQuestions.includes('platform')) {
        responseMessage += `\n\n💬 Bạn thích platform nào?`;
      } else if (!entities.gameGenre && !currentUserProfile.gameGenre && !askedQuestions.includes('game')) {
        responseMessage += `\n\n💬 Bạn thích chơi game gì?`;
      }
    }

    // Sort and filter products by user's saved budget if available
    const savedBudget = context.userProfile?.budget;
    if (savedBudget && Array.isArray(recommendedProducts) && recommendedProducts.length > 0) {
      recommendedProducts = recommendedProducts
        .filter(p => typeof p.price === 'number' ? p.price <= savedBudget : true)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    // Set default quick replies based on intent
      switch (intent) {
      case 'budget_query':
        quickReplies = ['Tôi muốn PC gaming', 'Tôi thích Console', 'Tôi cần phụ kiện', 'Tư vấn thêm'];
            recommendedProducts = this.getPopularGamingProducts();
          break;
      case 'platform_query':
        quickReplies = ['Tôi có ngân sách...', 'Tôi thích game FPS', 'Tôi thích game RPG', 'Tư vấn thêm'];
        recommendedProducts = this.getPopularGamingProducts();
          break;
      case 'product_inquiry':
        quickReplies = ['Tôi có ngân sách...', 'Tôi thích game FPS', 'Tôi thích game RPG', 'Tư vấn thêm'];
        recommendedProducts = this.getPopularGamingProducts();
          break;
      case 'comparison_query':
        quickReplies = ['Tôi muốn so sánh sản phẩm khác', 'Tôi cần tư vấn thêm', 'Cảm ơn bạn', 'Tôi có ngân sách...'];
        recommendedProducts = this.getPopularGamingProducts();
          break;
      case 'general':
        // For general greetings, don't show products unless it's a gaming-related question
        if (entities.productNames?.length > 0 || entities.platform?.length > 0 || 
            entities.gameGenre?.length > 0 || lowerMessage.includes('gaming') ||
            lowerMessage.includes('game') || lowerMessage.includes('console') ||
            lowerMessage.includes('pc') || lowerMessage.includes('keyboard') ||
            lowerMessage.includes('mouse') || lowerMessage.includes('controller') ||
            lowerMessage.includes('headset')) {
          recommendedProducts = this.getPopularGamingProducts();
          quickReplies = ['Tôi muốn PC gaming', 'Tôi thích Console', 'Tôi có ngân sách...', 'Tôi cần tư vấn'];
          } else {
          // For pure greetings, no products
          recommendedProducts = [];
          quickReplies = ['Tôi muốn tư vấn gaming', 'Tôi có ngân sách...', 'Tôi thích platform nào?', 'Cảm ơn bạn'];
          }
          break;
        default:
        quickReplies = ['Tôi muốn tư vấn gaming', 'Tôi có ngân sách...', 'Tôi thích platform nào?', 'Cảm ơn bạn'];
          recommendedProducts = this.getPopularGamingProducts();
    }
    
    // Add purchase CTAs
    const ctaReplies = ['Thêm vào giỏ', 'Chat tư vấn', 'Xem chi tiết'];
    ctaReplies.forEach(cta => { if (!quickReplies.includes(cta)) quickReplies.push(cta); });

    return {
      message: responseMessage,
      // keep old key for compatibility
      recommendedProducts: recommendedProducts,
      quickReplies: quickReplies,
      products: recommendedProducts
    };
  }

  getPopularGamingProducts() {
    const allProducts = Object.values(this.products).flat();
    return allProducts.slice(0, 3);
  }

  // Phát hiện khi người dùng đã chốt sản phẩm (xác nhận mua)
  detectProductConfirmation(message, conversationHistory = []) {
    const lowerMessage = message.toLowerCase();
    const confirmationKeywords = [
      'tôi muốn mua', 'tôi chọn', 'tôi quyết định', 'ok', 'được', 'tôi lấy',
      'tôi mua', 'mình lấy', 'mình mua', 'tôi sẽ mua', 'đồng ý', 'được rồi',
      'tôi đã quyết định', 'tôi sẽ lấy', 'tôi chọn cái này', 'tôi lấy cái này'
    ];
    
    // Kiểm tra trong message hiện tại
    if (confirmationKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return true;
    }
    
    // Kiểm tra trong conversation history - nếu có câu như "tôi mua" ở trước đó
    if (conversationHistory && conversationHistory.length > 0) {
      const lastMessages = conversationHistory.slice(-5).map(msg => (msg.message || msg.text || '').toLowerCase());
      if (lastMessages.some(msg => confirmationKeywords.some(keyword => msg.includes(keyword)))) {
        return true;
      }
    }
    
    return false;
  }

  // Phát hiện game đã được đề cập trong conversation history
  extractMentionedGames(message, conversationHistory = []) {
    const lowerMessage = message.toLowerCase();
    const mentionedGames = [];
    
    // Danh sách game phổ biến
    const gameKeywords = [
      { games: ['cs go', 'cs:go', 'counter-strike', 'csgo'], name: 'CS:GO' },
      { games: ['valorant', 'valo'], name: 'Valorant' },
      { games: ['league of legends', 'lol', 'league'], name: 'League of Legends' },
      { games: ['dota', 'dota 2'], name: 'Dota 2' },
      { games: ['pubg', 'playerunknown'], name: 'PUBG' },
      { games: ['apex', 'apex legends'], name: 'Apex Legends' },
      { games: ['fortnite'], name: 'Fortnite' },
      { games: ['call of duty', 'cod', 'warzone'], name: 'Call of Duty' },
      { games: ['fifa', 'ea sports'], name: 'FIFA' },
      { games: ['pes', 'efootball'], name: 'PES/eFootball' },
      { games: ['gta', 'grand theft auto'], name: 'GTA' },
      { games: ['cyberpunk', 'cyberpunk 2077'], name: 'Cyberpunk 2077' },
      { games: ['elden ring'], name: 'Elden Ring' },
      { games: ['minecraft'], name: 'Minecraft' },
      { games: ['among us'], name: 'Among Us' },
      { games: ['rocket league'], name: 'Rocket League' },
      { games: ['overwatch'], name: 'Overwatch' },
      { games: ['world of warcraft', 'wow'], name: 'World of Warcraft' },
    ];
    
    // Kiểm tra trong message hiện tại
    for (const gameGroup of gameKeywords) {
      for (const gameKeyword of gameGroup.games) {
        if (lowerMessage.includes(gameKeyword)) {
          if (!mentionedGames.includes(gameGroup.name)) {
            mentionedGames.push(gameGroup.name);
          }
        }
      }
    }
    
    // Kiểm tra trong conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      const lastMessages = conversationHistory.slice(-10).map(msg => (msg.message || msg.text || '').toLowerCase());
      for (const historyMsg of lastMessages) {
        for (const gameGroup of gameKeywords) {
          for (const gameKeyword of gameGroup.games) {
            if (historyMsg.includes(gameKeyword)) {
              if (!mentionedGames.includes(gameGroup.name)) {
                mentionedGames.push(gameGroup.name);
              }
            }
          }
        }
      }
    }
    
    return mentionedGames;
  }

  // Phát hiện khi người dùng yêu cầu/tự đề xuất phụ kiện
  detectAccessoryRequest(message) {
    const lowerMessage = message.toLowerCase();
    const accessoryRequestKeywords = [
      'tôi cũng cần', 'mình cũng cần', 'keyboard nào', 'mouse nào', 'chuột nào',
      'bàn phím nào', 'phụ kiện', 'sản phẩm đi kèm', 'đi kèm', 'kèm theo',
      'cần thêm', 'muốn thêm', 'còn cần', 'tư vấn keyboard', 'tư vấn mouse',
      'tư vấn chuột', 'tư vấn bàn phím', 'keyboard phù hợp', 'mouse phù hợp'
    ];
    
    return accessoryRequestKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  // Extract budget preference (không quá đắt, rẻ, giá rẻ, tiết kiệm)
  extractBudgetPreference(message) {
    const lowerMessage = message.toLowerCase();
    const budgetFriendlyKeywords = [
      'không quá đắt', 'không đắt', 'rẻ', 'giá rẻ', 'tiết kiệm', 'phù hợp túi tiền',
      'budget', 'affordable', 'cheap', 'inexpensive', 'không cần đắt', 'vừa túi tiền'
    ];
    
    const premiumKeywords = [
      'đắt', 'cao cấp', 'premium', 'tốt nhất', 'mạnh nhất', 'top', 'high-end'
    ];
    
    if (budgetFriendlyKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return { type: 'budget_friendly', priority: 'low_price' };
    }
    
    if (premiumKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return { type: 'premium', priority: 'high_performance' };
    }
    
    return null;
  }

  // Normalize abbreviations in message before processing
  normalizeAbbreviations(message) {
    let normalized = message;
    
    // Vietnamese abbreviations
    const abbreviations = {
      '\\bko\\b': 'không',
      '\\bk\\b': 'k', // Keep 'k' for thousand, but normalize context
      '\\btr\\b': 'triệu',
      '\\bđ\\b': 'đồng',
      '\\bvnđ\\b': 'vnđ',
      '\\bdc\\b': 'được',
      '\\bdc\\b': 'được',
      '\\bvs\\b': 'với',
      '\\bvs\\b': 'với',
      '\\bđc\\b': 'được',
      '\\bđc\\b': 'được',
      '\\bntn\\b': 'như thế nào',
      '\\bntn\\b': 'như thế nào',
      '\\bkm\\b': 'khuyến mãi',
      '\\bkm\\b': 'khuyến mãi',
      '\\bgd\\b': 'giá',
      '\\bgd\\b': 'giá',
      '\\bđt\\b': 'điện thoại',
      '\\bđt\\b': 'điện thoại',
      '\\bpc\\b': 'pc', // Keep PC as is
      '\\bps\\b': 'playstation',
      '\\bxb\\b': 'xbox',
      '\\bns\\b': 'nintendo switch',
      '\\bns\\b': 'nintendo switch',
    };
    
    // Apply abbreviations (case insensitive)
    for (const [abbr, full] of Object.entries(abbreviations)) {
      const regex = new RegExp(abbr, 'gi');
      normalized = normalized.replace(regex, full);
    }
    
    return normalized;
  }

  // Extract giá từ tin nhắn (ví dụ: "7 triệu", "7 triệu đồng", "7tr", "7000000")
  extractBudget(message) {
    // Normalize abbreviations first
    const normalizedMessage = this.normalizeAbbreviations(message);
    const lowerMessage = normalizedMessage.toLowerCase();
    
    const budgetPatterns = [
      /(\d+)\s*triệu\s*đồng/i,  // 7 triệu đồng
      /(\d+)\s*triệu/i,  // 7 triệu
      /(\d+)\s*tr/i,  // 7tr (after normalization, this should be "triệu")
      /(\d+)\s*million/i,  // 7 million
      /(\d+)\s*k\s*đồng/i,  // 7000k đồng
      /(\d+)\s*k/i,  // 7000k (thousand)
      /(\d{1,3}(?:\.\d{3})*(?:,\d{3})*)\s*vnđ/i,  // 7.000.000 vnđ
      /(\d{1,3}(?:\.\d{3})*(?:,\d{3})*)\s*đồng/i,  // 7.000.000 đồng
      /khoảng\s*(\d+)\s*triệu/i,  // khoảng 7 triệu
      /tầm\s*(\d+)\s*triệu/i,  // tầm 7 triệu
      /dưới\s*(\d+)\s*triệu/i,  // dưới 7 triệu
      /trên\s*(\d+)\s*triệu/i,  // trên 7 triệu
      /(\d+)\s*tr\s*đồng/i,  // 7tr đồng (after normalization)
    ];

    for (const pattern of budgetPatterns) {
      const match = lowerMessage.match(pattern);
      if (match) {
        let amount = parseFloat(match[1].replace(/\./g, '').replace(/,/g, ''));
        
        // Convert triệu sang đồng
        if (pattern.toString().includes('triệu') || pattern.toString().includes('million') || pattern.toString().includes('tr')) {
          amount = amount * 1000000;
        }
        // Convert k sang đồng
        else if (pattern.toString().includes('k')) {
          amount = amount * 1000;
        }
        
        // Nếu có "dưới" → giữ nguyên amount làm max
        // Nếu có "trên" → giữ nguyên amount làm min
        // Nếu không có → amount là giá chính xác, cho phép dao động ±10%
        
        const isBelow = lowerMessage.includes('dưới');
        const isAbove = lowerMessage.includes('trên');
        
        return {
          amount: amount,
          isBelow: isBelow,
          isAbove: isAbove,
          tolerance: 0.1 // 10% tolerance
        };
      }
    }
    
    return null;
  }

  // Tìm sản phẩm được đề cập trong tin nhắn
  // Nếu khách hàng chưa chỉ rõ sản phẩm cụ thể → trả về TẤT CẢ sản phẩm liên quan
  // Nếu đã chỉ rõ → chỉ trả về sản phẩm đó + sản phẩm đi kèm
  // Nếu có đề cập giá → lọc sản phẩm theo giá
  findMentionedProducts(userMessage, geminiResponse, catalog) {
    const mentionedProducts = [];
    const allText = `${userMessage} ${geminiResponse}`.toLowerCase();
    const userMessageLower = userMessage.toLowerCase();
    
    // Extract budget từ message
    const budget = this.extractBudget(userMessage);
    console.log(`💰 Extracted budget:`, budget);
    
    // Danh sách keywords phổ biến và patterns để tìm sản phẩm
    const productKeywords = [
      // Consoles - specific
      { keywords: ['ps5', 'playstation 5'], category: 'console', specific: true, priority: 1 },
      { keywords: ['ps4', 'playstation 4'], category: 'console', specific: true, priority: 1 },
      { keywords: ['xbox series x', 'xbox x'], category: 'console', specific: true, priority: 1 },
      { keywords: ['xbox series s', 'xbox s'], category: 'console', specific: true, priority: 1 },
      { keywords: ['nintendo switch', 'switch'], category: 'console', specific: true, priority: 1 },
      
      // Consoles - general
      { keywords: ['playstation'], category: 'console', specific: false, priority: 2 },
      { keywords: ['xbox'], category: 'console', specific: false, priority: 2 },
      { keywords: ['console', 'máy chơi game'], category: 'console', specific: false, priority: 3 },
      
      // Gaming PCs - ưu tiên cao nhất
      { keywords: ['gaming pc', 'pc gaming', 'máy tính gaming'], category: 'pc', specific: true, priority: 1, excludeCategories: ['keyboard', 'mouse', 'headset', 'controller'] },
      { keywords: ['pc', 'máy tính'], category: 'pc', specific: true, priority: 1, excludeCategories: ['keyboard', 'mouse', 'headset', 'controller'] },
      { keywords: ['rtx', 'nvidia', 'graphics card', 'card đồ họa'], category: 'pc', specific: false, priority: 2 },
      
      // Keyboards - specific
      { keywords: ['k70', 'corsair k70'], category: 'keyboard', specific: true, priority: 1 },
      { keywords: ['k65', 'corsair k65'], category: 'keyboard', specific: true, priority: 1 },
      { keywords: ['k100', 'corsair k100'], category: 'keyboard', specific: true, priority: 1 },
      
      // Keyboards - general
      { keywords: ['keyboard', 'bàn phím'], category: 'keyboard', specific: false, priority: 2 },
      { keywords: ['mechanical keyboard', 'bàn phím cơ'], category: 'keyboard', specific: false, priority: 2 },
      
      // Mice
      { keywords: ['mouse', 'chuột'], category: 'mouse', specific: false, priority: 1 },
      { keywords: ['gaming mouse', 'chuột gaming'], category: 'mouse', specific: false, priority: 1 },
      
      // Controllers
      { keywords: ['controller', 'tay cầm', 'gamepad'], category: 'controller', specific: false, priority: 1 },
      
      // Headsets
      { keywords: ['headset', 'tai nghe'], category: 'headset', specific: false, priority: 1 },
      { keywords: ['gaming headset', 'tai nghe gaming'], category: 'headset', specific: false, priority: 1 },
    ];
    
    // Tìm keywords đã match
    const foundKeywords = [];
    let hasSpecificProduct = false;
    
    for (const item of productKeywords) {
      for (const keyword of item.keywords) {
        if (userMessageLower.includes(keyword.toLowerCase())) {
          foundKeywords.push({ 
            keyword: keyword, 
            priority: item.priority,
            category: item.category,
            specific: item.specific,
            excludeCategories: item.excludeCategories || []
          });
          if (item.specific) {
            hasSpecificProduct = true;
          }
          break;
        }
      }
    }
    
    // Kiểm tra xem có phải hỏi về PC không (nếu có "pc" hoặc "máy tính" thì ưu tiên PC)
    const hasPCMention = userMessageLower.includes('pc') || userMessageLower.includes('máy tính');
    
    // Nếu không tìm thấy keyword, tìm các keyword chung (gaming, console, etc.)
    if (foundKeywords.length === 0) {
      const generalKeywords = [
        { keywords: ['console', 'máy chơi game'], category: 'console', excludeCategories: [] },
        { keywords: ['keyboard', 'bàn phím'], category: 'keyboard', excludeCategories: ['pc'] },
        { keywords: ['mouse', 'chuột'], category: 'mouse', excludeCategories: ['pc'] },
        // Chỉ match "gaming" chung nếu KHÔNG có "pc" trong message
        { keywords: ['gaming', 'game'], category: hasPCMention ? 'pc' : 'all', excludeCategories: hasPCMention ? ['keyboard', 'mouse', 'headset', 'controller'] : [] },
      ];
      
      for (const item of generalKeywords) {
        for (const keyword of item.keywords) {
          if (userMessageLower.includes(keyword.toLowerCase())) {
            // Nếu có "pc" trong message và keyword là "gaming", chỉ match PC
            if (hasPCMention && keyword === 'gaming') {
              foundKeywords.push({ 
                keyword: keyword, 
                priority: 2, // Priority cao hơn để ưu tiên PC
                category: 'pc',
                specific: true,
                excludeCategories: item.excludeCategories || []
              });
            } else {
              foundKeywords.push({ 
                keyword: keyword, 
                priority: 5,
                category: item.category,
                specific: false,
                excludeCategories: item.excludeCategories || []
              });
            }
            break;
          }
        }
      }
    }
    
    // Tìm sản phẩm trong catalog
    for (const product of catalog) {
      const productName = (product.title || product.name || '').toLowerCase();
      const productDescription = (product.description || '').toLowerCase();
      const productCategory = (product.category_name || product.category || '').toLowerCase();
      
      let matched = false;
      
      // Nếu có sản phẩm cụ thể được đề cập → chỉ tìm sản phẩm đó
      if (hasSpecificProduct) {
        for (const found of foundKeywords) {
          if (!found.specific) continue;
          
          const keywordLower = found.keyword.toLowerCase();
          
          // Match exact trong tên sản phẩm
          if (productName.includes(keywordLower) || keywordLower.includes(productName.split(' ')[0])) {
            matched = true;
            break;
          }
        }
      } else {
        // Nếu KHÔNG có sản phẩm cụ thể → tìm TẤT CẢ sản phẩm liên quan
        for (const found of foundKeywords) {
          const keywordLower = found.keyword.toLowerCase();
          
          // Match trong tên hoặc description hoặc category
          if (productName.includes(keywordLower) || 
              productDescription.includes(keywordLower) ||
              productCategory.includes(keywordLower) ||
              keywordLower.includes(productName.split(' ')[0])) {
            matched = true;
            break;
          }
        }
      }
      
      // Tìm trực tiếp tên sản phẩm đầy đủ trong tin nhắn (nếu có)
      const productNameWords = productName.split(' ').filter(w => w.length > 4);
      for (const word of productNameWords) {
        if (userMessageLower.includes(word)) {
          matched = true;
          hasSpecificProduct = true;
          break;
        }
      }
      
      if (matched && !mentionedProducts.find(p => (p.id || p.title || p.name) === (product.id || product.title || product.name))) {
        // Kiểm tra exclude categories - nếu có excludeCategories thì không thêm sản phẩm thuộc category đó
        let shouldExclude = false;
        for (const found of foundKeywords) {
          if (found.excludeCategories && found.excludeCategories.length > 0) {
            const productCategoryLower = productCategory.toLowerCase();
            const productNameLower = productName.toLowerCase();
            
            for (const excludeCat of found.excludeCategories) {
              if (productCategoryLower.includes(excludeCat.toLowerCase()) || 
                  productNameLower.includes(excludeCat.toLowerCase())) {
                shouldExclude = true;
                break;
              }
            }
            if (shouldExclude) break;
          }
        }
        
        // Nếu không bị exclude, tiếp tục kiểm tra budget
        if (!shouldExclude) {
          // Lọc theo giá nếu có budget
          if (budget) {
            const productPrice = parseFloat(product.price) || 0;
            
            if (budget.isBelow) {
              // Dưới X triệu → chỉ lấy sản phẩm có giá <= X
              if (productPrice <= budget.amount) {
                mentionedProducts.push(product);
              }
            } else if (budget.isAbove) {
              // Trên X triệu → chỉ lấy sản phẩm có giá >= X
              if (productPrice >= budget.amount) {
                mentionedProducts.push(product);
              }
            } else {
              // Khoảng X triệu → lấy sản phẩm có giá trong khoảng ±10%
              const minPrice = budget.amount * (1 - budget.tolerance);
              const maxPrice = budget.amount * (1 + budget.tolerance);
              
              if (productPrice >= minPrice && productPrice <= maxPrice) {
                mentionedProducts.push(product);
              }
            }
          } else {
            // Không có budget filter → thêm sản phẩm
            mentionedProducts.push(product);
          }
        }
      }
    }
    
    // Nếu không tìm thấy sản phẩm nào nhưng có keyword → tìm tất cả sản phẩm trong category
    if (mentionedProducts.length === 0 && foundKeywords.length > 0) {
      const categories = [...new Set(foundKeywords.map(f => f.category).filter(c => c !== 'all'))];
      
      for (const product of catalog) {
        const productName = (product.title || product.name || '').toLowerCase();
        const productCategory = (product.category_name || product.category || '').toLowerCase();
        const productPrice = parseFloat(product.price) || 0;
        
        let categoryMatched = false;
        
        for (const category of categories) {
          if (productCategory.includes(category) || productName.includes(category)) {
            categoryMatched = true;
            break;
          }
        }
        
        // Nếu category là 'all' → thêm tất cả gaming products
        if (categories.includes('all') || categories.length === 0) {
          if (productName.includes('gaming') || productName.includes('game')) {
            categoryMatched = true;
          }
        }
        
        if (categoryMatched && !mentionedProducts.find(p => (p.id || p.title || p.name) === (product.id || product.title || product.name))) {
          // Kiểm tra exclude categories
          let shouldExclude = false;
          for (const found of foundKeywords) {
            if (found.excludeCategories && found.excludeCategories.length > 0) {
              const productCategoryLower = productCategory.toLowerCase();
              const productNameLower = productName.toLowerCase();
              
              for (const excludeCat of found.excludeCategories) {
                if (productCategoryLower.includes(excludeCat.toLowerCase()) || 
                    productNameLower.includes(excludeCat.toLowerCase())) {
                  shouldExclude = true;
                  break;
                }
              }
              if (shouldExclude) break;
            }
          }
          
          // Nếu không bị exclude, tiếp tục kiểm tra budget
          if (!shouldExclude) {
            // Lọc theo giá nếu có budget
            if (budget) {
              if (budget.isBelow && productPrice <= budget.amount) {
                mentionedProducts.push(product);
              } else if (budget.isAbove && productPrice >= budget.amount) {
                mentionedProducts.push(product);
              } else if (!budget.isBelow && !budget.isAbove) {
                const minPrice = budget.amount * (1 - budget.tolerance);
                const maxPrice = budget.amount * (1 + budget.tolerance);
                if (productPrice >= minPrice && productPrice <= maxPrice) {
                  mentionedProducts.push(product);
                }
              }
            } else {
              mentionedProducts.push(product);
            }
          }
        }
      }
    }
    
    // Sắp xếp theo priority và limit (nếu có sản phẩm cụ thể → giới hạn 5, nếu không → giới hạn 10)
    mentionedProducts.sort((a, b) => {
      const aName = (a.title || a.name || '').toLowerCase();
      const bName = (b.title || b.name || '').toLowerCase();
      
      const aPriority = foundKeywords.find(f => aName.includes(f.keyword.toLowerCase()))?.priority || 10;
      const bPriority = foundKeywords.find(f => bName.includes(f.keyword.toLowerCase()))?.priority || 10;
      
      return aPriority - bPriority;
    });
    
    // Giới hạn: Nếu có sản phẩm cụ thể → 5 sản phẩm, nếu không → 10 sản phẩm để khách hàng xem nhiều lựa chọn
    const maxProducts = hasSpecificProduct ? 5 : 10;
    return mentionedProducts.slice(0, maxProducts);
  }

  // Generate smart quick replies dựa trên context
  generateSmartQuickReplies(userMessage, geminiResponse, productCount, locale = 'vi') {
    const userMessageLower = userMessage.toLowerCase();
    const responseLower = geminiResponse.toLowerCase();
    
    // Translation map for quick replies
    const translations = {
      vi: {
        haveBudget: 'Tôi có ngân sách khoảng...',
        wantMoreConsultation: 'Tôi muốn tư vấn thêm',
        viewAllProducts: 'Xem tất cả sản phẩm',
        compareProducts: 'So sánh sản phẩm',
        wantDetailPrice: 'Tôi muốn biết giá chi tiết',
        suitableAccessories: 'Sản phẩm đi kèm nào phù hợp?',
        compareWithOthers: 'So sánh với sản phẩm khác',
        moreConsultation: 'Tư vấn thêm',
        wantToKnowMore: 'Tôi muốn biết thêm',
        consultOtherProducts: 'Tư vấn sản phẩm khác',
        thankYou: 'Cảm ơn bạn',
        haveOtherQuestion: 'Tôi có câu hỏi khác'
      },
      en: {
        haveBudget: 'I have a budget around...',
        wantMoreConsultation: 'I want more consultation',
        viewAllProducts: 'View all products',
        compareProducts: 'Compare products',
        wantDetailPrice: 'I want to know detailed price',
        suitableAccessories: 'What accessories are suitable?',
        compareWithOthers: 'Compare with other products',
        moreConsultation: 'More consultation',
        wantToKnowMore: 'I want to know more',
        consultOtherProducts: 'Consult other products',
        thankYou: 'Thank you',
        haveOtherQuestion: 'I have another question'
      }
    };
    
    const t = translations[locale] || translations.vi;
    
    // Nếu khách hàng chưa chỉ rõ sản phẩm và có nhiều sản phẩm → hỏi về ngân sách, kinh nghiệm
    if (productCount > 5) {
      // Nhiều sản phẩm → khách hàng chưa chỉ rõ, cần hỏi thêm
      const budgetKeywords = locale === 'vi' ? ['ngân sách', 'giá'] : ['budget', 'price'];
      const hasBudget = budgetKeywords.some(keyword => 
        userMessageLower.includes(keyword) || responseLower.includes(keyword)
      );
      
      if (!hasBudget) {
        return [
          t.haveBudget,
          t.wantMoreConsultation,
          t.viewAllProducts,
          t.compareProducts
        ];
      }
    }
    
    // Nếu có sản phẩm cụ thể được đề cập → hỏi về sản phẩm đi kèm, giá cả
    if (productCount > 0 && productCount <= 3) {
      return [
        t.wantDetailPrice,
        t.suitableAccessories,
        t.compareWithOthers,
        t.moreConsultation
      ];
    }
    
    // Default replies
    return [
      t.wantToKnowMore,
      t.consultOtherProducts,
      t.thankYou,
      t.haveOtherQuestion
    ];
  }

  // Main processing method - CHỈ SỬ DỤNG GEMINI, BỎ HẲN LOCAL CHATBOT
  async processGamingMessage(message, userId, sessionId = null, locale = 'vi') {
    const originalMessage = message;
    
    console.log('🤖 Sử dụng Gemini AI để xử lý tin nhắn:', originalMessage);
    
    try {
      // 1. Load full conversation history from database
      let fullConversationHistory = [];
      try {
        const historyFromDB = await db('chat_conversations')
          .where({ user_id: userId, session_id: sessionId || userId })
          .orderBy('created_at', 'asc')
          .limit(20); // Get last 20 messages for context
        
        fullConversationHistory = historyFromDB.map(msg => ({
          role: msg.role, // 'user' or 'bot'
          message: msg.message
        }));
        console.log(`📜 Loaded ${fullConversationHistory.length} messages from conversation history`);
      } catch (e) {
        console.error('Error loading full conversation history:', e.message);
      }
      
      // 2. Load TẤT CẢ sản phẩm từ database
      const catalog = this.products.all || Object.values(this.products).flat();
      console.log(`📦 Loaded ${catalog.length} products for Gemini context`);
      
      // Extract budget và budget preference từ message trước khi gọi Gemini
      const budget = this.extractBudget(originalMessage);
      const budgetPreference = this.extractBudgetPreference(originalMessage);
      
      // Phát hiện khi người dùng đã chốt sản phẩm hoặc yêu cầu phụ kiện
      const hasConfirmedProduct = this.detectProductConfirmation(originalMessage, fullConversationHistory);
      const hasRequestedAccessory = this.detectAccessoryRequest(originalMessage);
      
      // Phát hiện game đã được đề cập
      const mentionedGames = this.extractMentionedGames(originalMessage, fullConversationHistory);
      
      console.log(`💰 Budget preference:`, budgetPreference);
      console.log(`✅ Product confirmed:`, hasConfirmedProduct);
      console.log(`🎁 Accessory requested:`, hasRequestedAccessory);
      console.log(`🎮 Mentioned games:`, mentionedGames);
      
      // QUAN TRỌNG: Lọc catalog theo sản phẩm chính TRƯỚC KHI gọi Gemini
      // Nếu khách hàng hỏi về PC → chỉ truyền PC, không truyền keyboard/mouse
      const userMessageLower = originalMessage.toLowerCase();
      let filteredCatalog = catalog;
      
      // Kiểm tra sản phẩm chính khách hàng muốn
      const wantsPC = userMessageLower.includes('pc gaming') || userMessageLower.includes('gaming pc') || 
                       userMessageLower.includes('pc') || userMessageLower.includes('máy tính');
      const wantsConsole = userMessageLower.includes('console') || userMessageLower.includes('playstation') ||
                          userMessageLower.includes('xbox') || userMessageLower.includes('nintendo');
      const wantsKeyboard = userMessageLower.includes('keyboard') || userMessageLower.includes('bàn phím');
      const wantsMouse = userMessageLower.includes('mouse') || userMessageLower.includes('chuột');
      
      // Lọc catalog theo sản phẩm chính
      // Nếu người dùng YÊU CẦU phụ kiện → thêm phụ kiện vào catalog
      if (hasRequestedAccessory) {
        // Người dùng yêu cầu phụ kiện → lấy cả sản phẩm chính (nếu có) và phụ kiện được yêu cầu
        if (wantsKeyboard) {
          // Thêm keyboard vào catalog
          filteredCatalog = catalog.filter(product => {
            const productName = (product.title || product.name || '').toLowerCase();
            const productCategory = (product.category_name || product.category || '').toLowerCase();
            
            // Lấy PC nếu đang hỏi về PC
            const isPC = wantsPC && (productName.includes('pc') || productName.includes('gaming pc') || 
                        productCategory.includes('pc') || productName.includes('máy tính'));
            
            // Lấy keyboard
            const isKeyboard = productName.includes('keyboard') || productName.includes('bàn phím') ||
                               productCategory.includes('keyboard');
            
            return isPC || isKeyboard;
          });
          console.log(`⌨️ Added keyboard to catalog due to accessory request`);
        } else if (wantsMouse) {
          // Thêm mouse vào catalog
          filteredCatalog = catalog.filter(product => {
            const productName = (product.title || product.name || '').toLowerCase();
            const productCategory = (product.category_name || product.category || '').toLowerCase();
            
            // Lấy PC nếu đang hỏi về PC
            const isPC = wantsPC && (productName.includes('pc') || productName.includes('gaming pc') || 
                        productCategory.includes('pc') || productName.includes('máy tính'));
            
            // Lấy mouse
            const isMouse = productName.includes('mouse') || productName.includes('chuột') ||
                            productCategory.includes('mouse');
            
            return isPC || isMouse;
          });
          console.log(`🖱️ Added mouse to catalog due to accessory request`);
        } else {
          // Yêu cầu phụ kiện chung → thêm tất cả phụ kiện
          filteredCatalog = catalog.filter(product => {
            const productName = (product.title || product.name || '').toLowerCase();
            const productCategory = (product.category_name || product.category || '').toLowerCase();
            
            // Lấy PC nếu đang hỏi về PC
            const isPC = wantsPC && (productName.includes('pc') || productName.includes('gaming pc') || 
                        productCategory.includes('pc') || productName.includes('máy tính'));
            
            // Lấy phụ kiện
            const isAccessory = productName.includes('keyboard') || productName.includes('mouse') ||
                               productName.includes('bàn phím') || productName.includes('chuột') ||
                               productName.includes('headset') || productName.includes('controller') ||
                               productCategory.includes('keyboard') || productCategory.includes('mouse') ||
                               productCategory.includes('accessory');
            
            return isPC || isAccessory;
          });
          console.log(`🎁 Added accessories to catalog due to accessory request`);
        }
      } else if (wantsPC && !wantsKeyboard && !wantsMouse) {
        // Chỉ lấy PC, loại bỏ keyboard/mouse/headset/controller (KHI CHƯA YÊU CẦU PHỤ KIỆN)
        filteredCatalog = catalog.filter(product => {
          const productName = (product.title || product.name || '').toLowerCase();
          const productCategory = (product.category_name || product.category || '').toLowerCase();
          
          // Chỉ lấy PC gaming
          const isPC = productName.includes('pc') || productName.includes('gaming pc') || 
                      productCategory.includes('pc') || productName.includes('máy tính');
          
          // Loại bỏ keyboard, mouse, headset, controller
          const isPeripheral = productName.includes('keyboard') || productName.includes('mouse') ||
                              productName.includes('bàn phím') || productName.includes('chuột') ||
                              productName.includes('headset') || productName.includes('controller') ||
                              productName.includes('tay cầm') || productCategory.includes('keyboard') ||
                              productCategory.includes('mouse') || productCategory.includes('accessory');
          
          return isPC && !isPeripheral;
        });
        console.log(`🖥️ Filtered to PC products only: ${catalog.length} → ${filteredCatalog.length} products`);
      } else if (wantsConsole && !wantsKeyboard && !wantsMouse) {
        // Chỉ lấy console
        filteredCatalog = catalog.filter(product => {
          const productName = (product.title || product.name || '').toLowerCase();
          const productCategory = (product.category_name || product.category || '').toLowerCase();
          
          return productName.includes('console') || productName.includes('playstation') ||
                 productName.includes('xbox') || productName.includes('nintendo') ||
                 productCategory.includes('console');
        });
        console.log(`🎮 Filtered to Console products only: ${catalog.length} → ${filteredCatalog.length} products`);
      } else if (wantsKeyboard && !wantsPC && !wantsConsole) {
        // Chỉ lấy keyboard
        filteredCatalog = catalog.filter(product => {
          const productName = (product.title || product.name || '').toLowerCase();
          const productCategory = (product.category_name || product.category || '').toLowerCase();
          
          return productName.includes('keyboard') || productName.includes('bàn phím') ||
                 productCategory.includes('keyboard');
        });
        console.log(`⌨️ Filtered to Keyboard products only: ${catalog.length} → ${filteredCatalog.length} products`);
      } else if (wantsMouse && !wantsPC && !wantsConsole) {
        // Chỉ lấy mouse
        filteredCatalog = catalog.filter(product => {
          const productName = (product.title || product.name || '').toLowerCase();
          const productCategory = (product.category_name || product.category || '').toLowerCase();
          
          return productName.includes('mouse') || productName.includes('chuột') ||
                 productCategory.includes('mouse');
        });
        console.log(`🖱️ Filtered to Mouse products only: ${catalog.length} → ${filteredCatalog.length} products`);
      }
      
      // Nếu không lọc được sản phẩm nào → dùng catalog gốc (có thể do keyword không match)
      if (filteredCatalog.length === 0 && (wantsPC || wantsConsole || wantsKeyboard || wantsMouse)) {
        console.warn(`⚠️ No products found for requested type, using original catalog`);
        filteredCatalog = catalog;
      }
      
      // Lọc sản phẩm theo budget TRƯỚC KHI gọi Gemini
      // Đảm bảo Gemini CHỈ nhận danh sách sản phẩm đã được lọc theo giá
      let budgetFilteredCatalog = filteredCatalog;
      if (budget) {
        budgetFilteredCatalog = filteredCatalog.filter(product => {
          const productPrice = parseFloat(product.price) || 0;
          
          if (budget.isBelow) {
            return productPrice <= budget.amount;
          } else if (budget.isAbove) {
            return productPrice >= budget.amount;
          } else {
            // Khoảng X triệu → ±10%
            const minPrice = budget.amount * (1 - budget.tolerance);
            const maxPrice = budget.amount * (1 + budget.tolerance);
            return productPrice >= minPrice && productPrice <= maxPrice;
          }
        });
        
        console.log(`💰 Filtered catalog by budget ${budget.amount.toLocaleString('vi-VN')} VNĐ: ${filteredCatalog.length} → ${budgetFilteredCatalog.length} products`);
        
        // Nếu không có sản phẩm nào sau khi lọc → vẫn truyền filtered catalog để Gemini có context
        if (budgetFilteredCatalog.length === 0) {
          console.warn(`⚠️ No products found for budget ${budget.amount.toLocaleString('vi-VN')} VNĐ, using filtered catalog for context`);
          budgetFilteredCatalog = filteredCatalog.slice(0, 20); // Lấy 20 sản phẩm đầu tiên để có context
        }
        filteredCatalog = budgetFilteredCatalog;
      }
      
      // 3. Luôn sử dụng Gemini AI cho mọi tin nhắn
      // Không cần phân tích local, để Gemini tự phân tích và trả lời thông minh
      // Truyền catalog ĐÃ LỌC với budgetInfo nếu có
      // Sắp xếp sản phẩm dựa trên budget preference
      if (budgetPreference && budgetPreference.type === 'budget_friendly') {
        // Ưu tiên sản phẩm giá thấp hơn
        filteredCatalog.sort((a, b) => {
          const priceA = parseFloat(a.price) || 0;
          const priceB = parseFloat(b.price) || 0;
          return priceA - priceB; // Sắp xếp tăng dần (rẻ nhất trước)
        });
        console.log(`💸 Sorted products by price (low to high) for budget-friendly request`);
      } else if (budgetPreference && budgetPreference.type === 'premium') {
        // Ưu tiên sản phẩm giá cao hơn (performance cao)
        filteredCatalog.sort((a, b) => {
          const priceA = parseFloat(a.price) || 0;
          const priceB = parseFloat(b.price) || 0;
          return priceB - priceA; // Sắp xếp giảm dần (đắt nhất trước)
        });
        console.log(`💎 Sorted products by price (high to low) for premium request`);
      }
      
      const catalogWithBudget = budget ? {
        products: filteredCatalog, // Catalog đã lọc và sắp xếp theo preference
        budgetInfo: budget,
        budgetPreference: budgetPreference,
        hasConfirmedProduct: hasConfirmedProduct,
        hasRequestedAccessory: hasRequestedAccessory,
        mentionedGames: mentionedGames,
        originalCatalogCount: catalog.length,
        filteredCatalogCount: filteredCatalog.length,
        isEmpty: filteredCatalog.length === 0 || (budget && filteredCatalog.every(p => {
          const price = parseFloat(p.price) || 0;
          if (budget.isBelow) return price > budget.amount;
          if (budget.isAbove) return price < budget.amount;
          const minPrice = budget.amount * (1 - budget.tolerance);
          const maxPrice = budget.amount * (1 + budget.tolerance);
          return price < minPrice || price > maxPrice;
        }))
      } : {
        products: filteredCatalog,
        budgetPreference: budgetPreference,
        hasConfirmedProduct: hasConfirmedProduct,
        hasRequestedAccessory: hasRequestedAccessory,
        mentionedGames: mentionedGames
      };
      
      const geminiResponse = await this.aiExternalService.callGemini(
        originalMessage, 
        [], // Không cần productsForContext riêng, Gemini sẽ phân tích từ catalog
        [], // Không cần historyForAI riêng, dùng fullConversationHistory
        catalogWithBudget, // Catalog ĐÃ LỌC theo giá (nếu có) với budgetInfo
        fullConversationHistory, // Full conversation history cho Gemini
        locale // Language preference (vi/en)
      );
      
      if (geminiResponse.success) {
        // Gemini đã trả lời thành công
        let responseMessage = geminiResponse.response;
        
        // Đảm bảo responseMessage luôn có giá trị, không được rỗng hoặc undefined
        if (!responseMessage || typeof responseMessage !== 'string' || responseMessage.trim().length === 0) {
          console.warn('⚠️ Gemini response is empty, using fallback message');
          responseMessage = 'Xin lỗi, tôi không thể tạo câu trả lời cho câu hỏi này. Bạn có thể đặt câu hỏi khác không?';
        } else {
          responseMessage = responseMessage.trim();
        }
        
          // Extract product names từ tin nhắn của user và response của Gemini
          // Sử dụng filteredCatalog (đã lọc theo giá) để tìm sản phẩm
          let recommendedProducts = this.findMentionedProducts(originalMessage, responseMessage, filteredCatalog);

          // Ensure we always return structured product recommendations.
          // Detect if user explicitly requested a number of products (e.g., '1 sản phẩm', '2 sp')
          const requestedCount = this.extractRequestedCount(originalMessage);

          // If no products were detected by findMentionedProducts, fallback to popular products
          if ((!recommendedProducts || recommendedProducts.length === 0)) {
            // Determine intent from the message to decide default behavior
            try {
              const intentInfo = this.processMessage(originalMessage) || { intent: 'product_inquiry' };
              // For product-related intents, return a default set
              if (['product_inquiry', 'budget_query', 'platform_query', 'comparison_query', 'general'].includes(intentInfo.intent)) {
                recommendedProducts = this.getPopularGamingProducts();
              } else {
                recommendedProducts = this.getPopularGamingProducts();
              }
            } catch (e) {
              recommendedProducts = this.getPopularGamingProducts();
            }
          }

          // If user requested a specific small number, respect it
          if (requestedCount && recommendedProducts && recommendedProducts.length > 0) {
            recommendedProducts = recommendedProducts.slice(0, requestedCount);
          }
        
        // Normalize products để đảm bảo có cả 'name' và 'title' cho frontend
        recommendedProducts = recommendedProducts.map(product => ({
          ...product,
          name: product.name || product.title || 'Không có tên',
          title: product.title || product.name || 'Không có tên',
          image: product.image || product.image_url || null,
          price: product.price || 0
        }));
        
        console.log(`🔍 Found ${recommendedProducts.length} products mentioned:`, recommendedProducts.map(p => p.title || p.name));
        
        // Generate smart quick replies dựa trên context
        const quickReplies = this.generateSmartQuickReplies(originalMessage, responseMessage, recommendedProducts.length, locale);
        
        // Đảm bảo trả về đúng field name cho frontend
    return {
      message: responseMessage,
      quickReplies: quickReplies,
          recommendedProducts: recommendedProducts,
          products: recommendedProducts, // Frontend có thể expect field 'products'
          intent: 'gemini_response',
          technicalInfo: geminiResponse.technicalInfo,
          externalAI: geminiResponse,
          aiMessage: '🤖 Đang sử dụng Google Gemini AI để trả lời câu hỏi của bạn',
          aiStatus: 'gemini'
        };
    } else {
        // Nếu Gemini lỗi, trả về thông báo lỗi
        console.error('Gemini AI failed:', geminiResponse.error);
        const errorTranslations = {
          vi: {
            message: 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau.',
            tryAgain: 'Thử lại',
            needOtherSupport: 'Tôi cần hỗ trợ khác'
          },
          en: {
            message: 'Sorry, I encountered a technical issue. Please try again later.',
            tryAgain: 'Try Again',
            needOtherSupport: 'I need other support'
          }
        };
        const errorT = errorTranslations[locale] || errorTranslations.vi;
        return {
          message: errorT.message,
          quickReplies: [errorT.tryAgain, errorT.needOtherSupport],
          recommendedProducts: [],
          intent: 'error',
          aiMessage: '⚠️ Đang gặp sự cố kỹ thuật',
          aiStatus: 'error'
        };
      }
      
  } catch (error) {
      console.error('Error in processGamingMessage:', error);
      return {
        message: 'Xin lỗi, đã xảy ra lỗi khi xử lý tin nhắn của bạn. Vui lòng thử lại.',
        quickReplies: ['Thử lại', 'Tôi cần hỗ trợ khác'],
        recommendedProducts: [],
        intent: 'error',
        aiMessage: '⚠️ Đang gặp sự cố',
        aiStatus: 'error'
      };
    }
  }
}

// Initialize AI external service
const aiService = new AiExternalService();

// Add to GamingChatbotService
GamingChatbotService.prototype.aiExternalService = aiService;

// API Routes
router.post('/chatbot', async (req, res) => {
  try {
    const { message, userId, locale } = req.body;
    
    if (!message || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Message and userId are required'
      });
    }

    const sessionId = req.body.sessionId || userId;

    // Initialize chatbot
    const chatbot = new GamingChatbotService();

    // Không cần prefill context nữa - Gemini sẽ tự phân tích từ conversation history trong database
    // Chỉ cần gọi processGamingMessage, nó sẽ tự load history từ DB
    // Pass locale to processGamingMessage (default to 'vi' if not provided)
    const result = await chatbot.processGamingMessage(message, userId, sessionId, locale || 'vi');

    // Persist conversation (user and bot messages)
    try {
      await db('chat_conversations').insert({
        user_id: userId,
        session_id: sessionId,
        role: 'user',
        message: message,
        intent: JSON.stringify({ intent: result.intent || 'gemini_response' }),
        entities: null, // Không cần entities nữa, Gemini sẽ tự phân tích
        metadata: JSON.stringify({ source: 'gemini-ai' }),
      });
      await db('chat_conversations').insert({
        user_id: userId,
        session_id: sessionId,
        role: 'bot',
        message: result.message,
        intent: JSON.stringify({ intent: result.intent }),
        entities: null,
        metadata: JSON.stringify({ quickReplies: result.quickReplies }),
      });
    } catch (e) {
      console.error('Save conversation failed:', e.message);
    }
    
    res.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error('Error processing gaming chatbot message:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xử lý tin nhắn gaming chatbot',
      error: error.message
    });
  }
});

// Clear conversation context in DB
router.delete('/context/:userId', async (req, res) => {
  const { userId } = req.params;
  const sessionId = req.query.sessionId || userId;
  try {
    await db('chat_conversations').where({ user_id: userId, session_id: sessionId }).del();
    return res.json({ success: true, message: 'Cleared conversation' });
  } catch (e) {
    console.error('Clear conversation error:', e.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
module.exports.GamingChatbotService = GamingChatbotService;