const express = require('express');
const router = express.Router();
const knex = require('../knexfile');

// ChatBot API endpoints
router.post('/chatbot/recommend', async (req, res) => {
  try {
    const { message, preferences } = req.body;
    
    // Get all books
    const books = await knex('books').select('*');
    
    // Process the message and generate recommendations
    const recommendations = generateRecommendations(message, preferences, books);
    
    res.json({
      success: true,
      data: {
        message: recommendations.message,
        products: recommendations.products,
        quickReplies: recommendations.quickReplies
      }
    });
  } catch (error) {
    console.error('ChatBot recommendation error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo gợi ý sản phẩm'
    });
  }
});

router.get('/chatbot/categories', async (req, res) => {
  try {
    const categories = await knex('categories').select('*');
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('ChatBot categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách thể loại'
    });
  }
});

// Helper function to generate recommendations
function generateRecommendations(message, preferences, books) {
  const lowerMessage = message.toLowerCase();
  
  // Extract budget information with more patterns
  let budget = null;
  const budgetPatterns = [
    /(\d+)(?:k|000)/g,  // 100k, 50k, 200000
    /dưới\s*(\d+)(?:k|000)/g,  // dưới 100k
    /trên\s*(\d+)(?:k|000)/g,  // trên 200k
    /khoảng\s*(\d+)(?:k|000)/g,  // khoảng 150k
    /tầm\s*(\d+)(?:k|000)/g,  // tầm 100k
    /(\d+)\s*đồng/g,  // 100000 đồng
    /(\d+)\s*vnđ/g,  // 100000 vnđ
  ];
  
  for (const pattern of budgetPatterns) {
    const match = lowerMessage.match(pattern);
    if (match) {
      const amount = parseInt(match[1]);
      if (amount < 1000) {
        budget = amount * 1000; // Convert k to full amount
      } else {
        budget = amount;
      }
      break;
    }
  }
  
  // Extract category information with more keywords
  const categoryKeywords = {
    'keyboard': ['bàn phím', 'keyboard', 'phím', 'bàn phím cơ', 'mechanical keyboard'],
    'mouse': ['chuột', 'mouse', 'chuột gaming', 'chuột không dây'],
    'gaming': ['gaming', 'game', 'chơi game', 'game thủ', 'esports'],
    'wireless': ['không dây', 'wireless', 'bluetooth', 'wifi'],
    'mechanical': ['cơ', 'mechanical', 'switch', 'cherry mx'],
    'rgb': ['rgb', 'led', 'ánh sáng', 'màu sắc'],
    'office': ['văn phòng', 'office', 'làm việc', 'công việc'],
    'budget': ['rẻ', 'giá rẻ', 'tiết kiệm', 'phù hợp túi tiền'],
    'premium': ['cao cấp', 'premium', 'đắt', 'chất lượng cao']
  };
  
  let category = null;
  let categoryScore = 0;
  
  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    const matches = keywords.filter(keyword => lowerMessage.includes(keyword));
    if (matches.length > categoryScore) {
      category = cat;
      categoryScore = matches.length;
    }
  }
  
  // Extract specific features
  const features = [];
  const featureKeywords = {
    'backlight': ['đèn nền', 'backlight', 'led', 'ánh sáng'],
    'wireless': ['không dây', 'wireless', 'bluetooth'],
    'gaming': ['gaming', 'game', 'chơi game'],
    'rgb': ['rgb', 'màu sắc', 'led'],
    'mechanical': ['cơ', 'mechanical', 'switch'],
    'silent': ['im lặng', 'silent', 'yên tĩnh'],
    'ergonomic': ['ergonomic', 'thoải mái', 'tiện dụng']
  };
  
  for (const [feature, keywords] of Object.entries(featureKeywords)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      features.push(feature);
    }
  }
  
  // Smart filtering and scoring
  let filteredBooks = [...books];
  
  // Filter by budget
  if (budget) {
    filteredBooks = filteredBooks.filter(book => book.price <= budget);
  }
  
  // Filter by category
  if (category) {
    filteredBooks = filteredBooks.filter(book => {
      const title = book.title?.toLowerCase() || '';
      const description = book.description?.toLowerCase() || '';
      const genre = book.genre?.toLowerCase() || '';
      const author = book.author?.toLowerCase() || '';
      const publisher = book.publisher?.toLowerCase() || '';
      
      return title.includes(category) ||
             description.includes(category) ||
             genre.includes(category) ||
             author.includes(category) ||
             publisher.includes(category);
    });
  }
  
  // Filter by features
  if (features && features.length > 0) {
    filteredBooks = filteredBooks.filter(book => {
      const title = book.title?.toLowerCase() || '';
      const description = book.description?.toLowerCase() || '';
      
      return features.some(feature => 
        title.includes(feature) || description.includes(feature)
      );
    });
  }
  
  // Smart scoring system
  filteredBooks = filteredBooks.map(book => {
    let score = 0;
    
    // Budget score (closer to budget = higher score)
    if (budget && book.price) {
      const priceRatio = book.price / budget;
      if (priceRatio <= 1) {
        score += (1 - priceRatio) * 50;
      }
    }
    
    // Rating score
    if (book.rating) {
      score += book.rating * 20;
    }
    
    // Category match score
    if (category) {
      const title = book.title?.toLowerCase() || '';
      const description = book.description?.toLowerCase() || '';
      if (title.includes(category)) score += 30;
      if (description.includes(category)) score += 20;
    }
    
    // Feature match score
    if (features && features.length > 0) {
      const title = book.title?.toLowerCase() || '';
      const description = book.description?.toLowerCase() || '';
      features.forEach(feature => {
        if (title.includes(feature)) score += 15;
        if (description.includes(feature)) score += 10;
      });
    }
    
    // Popularity score
    if (book.ratingCount) {
      score += Math.min(book.ratingCount / 10, 20);
    }
    
    return { ...book, score };
  });
  
  // Sort by score (highest first)
  filteredBooks.sort((a, b) => (b.score || 0) - (a.score || 0));
  
  // Generate contextual response
  let responseMessage = '';
  let quickReplies = [];
  
  if (lowerMessage.includes('dưới') || lowerMessage.includes('rẻ') || budget) {
    responseMessage = budget ? 
      `Dựa trên ngân sách ${budget.toLocaleString('vi-VN')} VNĐ của bạn, tôi gợi ý những sản phẩm sau:` :
      `Dựa trên yêu cầu sản phẩm giá rẻ, tôi gợi ý những sản phẩm sau:`;
    quickReplies = ['Xem thêm sản phẩm', 'Tư vấn khác', 'Sản phẩm cao cấp hơn'];
  } else if (lowerMessage.includes('tốt nhất') || lowerMessage.includes('hay nhất') || lowerMessage.includes('chất lượng')) {
    responseMessage = `Đây là những sản phẩm được đánh giá cao nhất:`;
    quickReplies = ['Sản phẩm giá rẻ', 'Sản phẩm mới', 'Tư vấn khác'];
  } else if (lowerMessage.includes('phổ biến') || lowerMessage.includes('bán chạy') || lowerMessage.includes('nhiều người mua')) {
    responseMessage = `Những sản phẩm phổ biến nhất hiện tại:`;
    quickReplies = ['Sản phẩm mới', 'Sản phẩm giá rẻ', 'Tư vấn khác'];
  } else if (lowerMessage.includes('thể loại') || lowerMessage.includes('loại') || lowerMessage.includes('danh mục')) {
    responseMessage = `Chúng tôi có các thể loại sản phẩm sau. Bạn muốn tìm hiểu về loại nào?`;
    quickReplies = ['Gaming', 'Wireless', 'Mechanical', 'Budget'];
  } else if (category) {
    responseMessage = `Dựa trên sở thích ${category} của bạn, đây là những gợi ý phù hợp:`;
    quickReplies = ['Sản phẩm khác', 'Tư vấn theo giá', 'Sản phẩm mới'];
  } else if (features.length > 0) {
    responseMessage = `Dựa trên yêu cầu về ${features.join(', ')}, tôi gợi ý những sản phẩm sau:`;
    quickReplies = ['Sản phẩm khác', 'Tư vấn theo giá', 'Sản phẩm mới'];
  } else {
    responseMessage = `Tôi hiểu bạn đang tìm kiếm sản phẩm. Dựa trên yêu cầu của bạn, đây là một số gợi ý:`;
    quickReplies = ['Sản phẩm dưới 100k', 'Sản phẩm tốt nhất', 'Tư vấn theo thể loại'];
  }
  
  return {
    message: responseMessage,
    products: filteredBooks.slice(0, 3),
    quickReplies: quickReplies
  };
}

module.exports = router;
