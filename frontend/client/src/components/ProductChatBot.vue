<template>
  <div class="chatbot-container">
    <!-- Chat Button -->
    <div 
      v-if="!isOpen" 
      class="chatbot-toggle"
      @click="toggleChat"
    >
      <div class="chatbot-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
        </svg>
      </div>
      <span class="chatbot-text">Tư vấn sản phẩm</span>
    </div>

    <!-- Chat Window -->
    <div v-if="isOpen" class="chatbot-window">
      <!-- Header -->
      <div class="chatbot-header">
        <div class="chatbot-title">
          <div class="chatbot-avatar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div class="chatbot-info">
                   <h3>{{ aiMode ? 'Gemini AI Tư vấn' : 'AI Local Thông minh' }}</h3>
                   <p>{{ aiMode ? 'Google Gemini AI đang hoạt động' : 'AI Local với NLP tiếng Việt' }}</p>
          </div>
        </div>
        <div class="chatbot-controls">
          <button @click="toggleAIMode" :class="['ai-toggle', { active: aiMode }]" :title="aiMode ? 'Tắt AI Mode' : 'Bật AI Mode'">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </button>
          <button @click="clearConversation" class="clear-btn" title="Xóa cuộc trò chuyện">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
          <button @click="toggleChat" class="chatbot-close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Messages -->
      <div class="chatbot-messages" ref="messagesContainer">
        <div 
          v-for="message in messages" 
          :key="message.id"
          :class="['message', message.type]"
        >
          <div v-if="message.type === 'bot'" class="message-avatar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
                 <div class="message-content">
                   <!-- AI status message đã bị ẩn -->
                   <!-- <div v-if="message.aiMessage" class="ai-status-message">
                     {{ message.aiMessage }}
                   </div> -->
                   <div class="message-text" v-html="message.text"></div>
            <div v-if="message.products && message.products.length > 0" class="message-products">
              <div 
                v-for="product in message.products" 
                :key="product.id"
                class="product-suggestion"
                @click="viewProduct(product.id)"
              >
                <img :src="getImageUrl(product.image) || 'https://via.placeholder.com/80'" :alt="product.title" />
                <div class="product-info">
                  <h4>{{ product.title }}</h4>
                  <p class="product-price">{{ formatPrice(product.price) }} VNĐ</p>
                </div>
              </div>
            </div>
            <div v-if="message.quickReplies" class="quick-replies">
              <button 
                v-for="reply in message.quickReplies"
                :key="reply"
                @click="sendQuickReply(reply)"
                class="quick-reply-btn"
              >
                {{ reply }}
              </button>
            </div>
          </div>
        </div>
        
        <!-- Typing Indicator -->
        <div v-if="isTyping" class="message bot">
          <div class="message-avatar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div class="message-content">
            <div class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Input -->
      <div class="chatbot-input">
        <input
          v-model="currentMessage"
          @keyup.enter="sendMessage"
          placeholder="Nhập tin nhắn của bạn..."
          :disabled="isTyping"
        />
        <button @click="sendMessage" :disabled="!currentMessage.trim() || isTyping">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { getChatbotRecommendation } from '@/apis/chatbotApi';
import { sendAIMessage, clearConversationContext } from '@/apis/aiChatbotApi';

export default {
  name: 'ProductChatBot',
  props: {
    products: {
      type: Array,
      default: () => []
    },
    categories: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      isOpen: false,
      isTyping: false,
      currentMessage: '',
             aiMode: false, // Temporarily disable until valid Gemini API key
      userId: this.generateUserId(),
      messages: [
        {
          id: 1,
          type: 'bot',
                 text: 'Xin chào! Tôi là AI tư vấn sản phẩm thông minh với NLP tiếng Việt. Tôi có thể hiểu ngôn ngữ tự nhiên, phân tích sentiment và đưa ra gợi ý chính xác. Bạn có thể hỏi tôi bất cứ điều gì về sản phẩm!',
          quickReplies: [
            'Sản phẩm dưới 100k',
            'Sản phẩm bán chạy nhất',
            'Tư vấn theo ngân sách',
            'Tìm sản phẩm theo thể loại'
          ]
        }
      ],
      messageId: 2,
      userPreferences: {
        budget: null,
        category: null,
        features: []
      }
    };
  },
  methods: {
    getImageUrl(image) {
      if (!image) return '';
      // If image is already a full URL (http/https), return as-is
      if (typeof image === 'string' && (image.startsWith('http://') || image.startsWith('https://'))) {
        return image;
      }
      // If image starts with /uploads, prepend base URL
      if (typeof image === 'string' && image.startsWith('/uploads')) {
        try {
          const apiUrl = import.meta?.env?.VITE_API_URL || 'http://127.0.0.1:3100';
          return `${apiUrl}${image}`;
        } catch (e) {
          return `http://127.0.0.1:3100${image}`;
        }
      }
      // Otherwise return as-is
      return image;
    },
    generateUserId() {
      // Generate a unique user ID for conversation context
      return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },
    
    toggleChat() {
      this.isOpen = !this.isOpen;
      if (this.isOpen) {
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      }
    },
    
    sendMessage() {
      if (!this.currentMessage.trim() || this.isTyping) return;
      
      const userMessage = {
        id: this.messageId++,
        type: 'user',
        text: this.currentMessage
      };
      
      this.messages.push(userMessage);
      this.currentMessage = '';
      
      this.scrollToBottom();
      this.processUserMessage(userMessage.text);
    },
    
    sendQuickReply(reply) {
      this.currentMessage = reply;
      this.sendMessage();
    },
    
    async processUserMessage(message) {
      this.isTyping = true;
      
      try {
        let response;
        
        if (this.aiMode) {
          // Use AI service for intelligent processing
          response = await sendAIMessage(message, this.userId);
        } else {
          // Fallback to regular chatbot
          try {
            response = await getChatbotRecommendation(message, this.userPreferences);
          } catch (error) {
            console.error('Regular chatbot error:', error);
            response = this.generateResponse(message);
          }
        }
        
        const botMessage = {
          id: this.messageId++,
          type: 'bot',
          text: response.message || response.text,
          products: response.products || [],
          quickReplies: response.quickReplies || [],
          intent: response.intent || 'general',
          aiStatus: response.aiStatus || (this.aiMode ? 'openai' : 'local'),
          aiMessage: response.aiMessage || null
        };
        
        this.messages.push(botMessage);
      } catch (error) {
        console.error('AI Error:', error);
        // Fallback to local logic if AI fails
        const response = this.generateResponse(message);
        
        const botMessage = {
          id: this.messageId++,
          type: 'bot',
          text: response.text,
          products: response.products || [],
          quickReplies: response.quickReplies || []
        };
        
        this.messages.push(botMessage);
      }
      
      this.isTyping = false;
      
      this.$nextTick(() => {
        this.scrollToBottom();
      });
    },
    
    generateResponse(message) {
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
      
      // Update user preferences
      if (budget) this.userPreferences.budget = budget;
      if (category) this.userPreferences.category = category;
      if (features.length > 0) this.userPreferences.features = features;
      
      // Generate recommendations based on analysis
      let recommendations = this.getSmartRecommendations(budget, category, features);
      
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
        text: responseMessage,
        products: recommendations.slice(0, 3),
        quickReplies: quickReplies
      };
    },
    
    getSmartRecommendations(budget, category, features) {
      let filtered = [...this.products];
      
      // Filter by budget
      if (budget) {
        filtered = filtered.filter(product => product.price <= budget);
      }
      
      // Filter by category
      if (category) {
        filtered = filtered.filter(product => {
          const title = product.title?.toLowerCase() || '';
          const description = product.description?.toLowerCase() || '';
          const genre = product.genre?.toLowerCase() || '';
          const author = product.author?.toLowerCase() || '';
          const publisher = product.publisher?.toLowerCase() || '';
          
          return title.includes(category) ||
                 description.includes(category) ||
                 genre.includes(category) ||
                 author.includes(category) ||
                 publisher.includes(category);
        });
      }
      
      // Filter by features
      if (features && features.length > 0) {
        filtered = filtered.filter(product => {
          const title = product.title?.toLowerCase() || '';
          const description = product.description?.toLowerCase() || '';
          
          return features.some(feature => 
            title.includes(feature) || description.includes(feature)
          );
        });
      }
      
      // Smart scoring system
      filtered = filtered.map(product => {
        let score = 0;
        
        // Budget score (closer to budget = higher score)
        if (budget && product.price) {
          const priceRatio = product.price / budget;
          if (priceRatio <= 1) {
            score += (1 - priceRatio) * 50; // Higher score for products closer to budget
          }
        }
        
        // Rating score
        if (product.rating) {
          score += product.rating * 20;
        }
        
        // Category match score
        if (category) {
          const title = product.title?.toLowerCase() || '';
          const description = product.description?.toLowerCase() || '';
          if (title.includes(category)) score += 30;
          if (description.includes(category)) score += 20;
        }
        
        // Feature match score
        if (features && features.length > 0) {
          const title = product.title?.toLowerCase() || '';
          const description = product.description?.toLowerCase() || '';
          features.forEach(feature => {
            if (title.includes(feature)) score += 15;
            if (description.includes(feature)) score += 10;
          });
        }
        
        // Popularity score
        if (product.ratingCount) {
          score += Math.min(product.ratingCount / 10, 20); // Cap at 20 points
        }
        
        return { ...product, score };
      });
      
      // Sort by score (highest first)
      return filtered.sort((a, b) => (b.score || 0) - (a.score || 0));
    },
    
    getRecommendations() {
      let filtered = [...this.products];
      
      if (this.userPreferences.budget) {
        filtered = filtered.filter(product => product.price <= this.userPreferences.budget);
      }
      
      if (this.userPreferences.category) {
        filtered = filtered.filter(product => 
          product.title.toLowerCase().includes(this.userPreferences.category) ||
          product.description?.toLowerCase().includes(this.userPreferences.category)
        );
      }
      
      return filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    },
    
    getBudgetRecommendations() {
      return [...this.products]
        .filter(product => product.price <= 100000)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0));
    },
    
    getBestRecommendations() {
      return [...this.products]
        .filter(product => (product.rating || 0) >= 4)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0));
    },
    
    getPopularRecommendations() {
      return [...this.products]
        .sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0));
    },
    
    viewProduct(productId) {
      this.$router.push(`/book/${productId}`);
    },
    
    formatPrice(price) {
      return new Intl.NumberFormat('vi-VN').format(price);
    },
    
    scrollToBottom() {
      const container = this.$refs.messagesContainer;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    },
    
           toggleAIMode() {
             this.aiMode = !this.aiMode;
             const modeText = this.aiMode ? 'AI Mode: ON' : 'AI Mode: OFF';

             // Add a system message
             const systemMessage = {
               id: this.messageId++,
               type: 'bot',
               text: `${modeText}. ${this.aiMode ? 'Tôi sẽ sử dụng Google Gemini AI để hiểu và trả lời bạn tốt hơn.' : 'Tôi sẽ sử dụng AI Local thông minh với NLP tiếng Việt để trả lời.'}`,
               products: [],
               quickReplies: [],
               aiStatus: this.aiMode ? 'gemini' : 'local',
               aiMessage: this.aiMode ? '🤖 Đã bật Gemini AI Mode' : '🧠 Đang sử dụng AI Local với NLP tiếng Việt'
             };

             this.messages.push(systemMessage);
             this.$nextTick(() => {
               this.scrollToBottom();
             });
           },
    
    clearConversation() {
      this.messages = [
        {
          id: 1,
          type: 'bot',
                 text: this.aiMode ?
                   'Xin chào! Tôi là AI tư vấn sản phẩm thông minh sử dụng Google Gemini. Cuộc trò chuyện đã được làm mới.' :
                   'Xin chào! Tôi là AI tư vấn sản phẩm thông minh với NLP tiếng Việt. Cuộc trò chuyện đã được làm mới.',
          quickReplies: [
            'Sản phẩm dưới 100k',
            'Sản phẩm tốt nhất',
            'Tư vấn theo thể loại'
          ]
        }
      ];
      this.messageId = 2;
      this.userPreferences = {
        budget: null,
        category: null,
        features: []
      };
      
      // Clear AI context if in AI mode
      if (this.aiMode) {
        clearConversationContext(this.userId).catch(console.error);
      }
    }
  }
};
</script>

<style scoped>
.chatbot-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}

.chatbot-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #ffcc00, #ff6b35);
  color: #000;
  padding: 12px 20px;
  border-radius: 50px;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(255, 204, 0, 0.3);
  transition: all 0.3s ease;
  font-weight: 600;
}

.chatbot-toggle:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(255, 204, 0, 0.4);
}

.chatbot-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.chatbot-window {
  width: 380px;
  height: 500px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chatbot-header {
  background: linear-gradient(135deg, #ffcc00, #ff6b35);
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chatbot-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chatbot-avatar {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000;
}

.chatbot-info h3 {
  margin: 0;
  color: #000;
  font-size: 16px;
  font-weight: 600;
}

.chatbot-info p {
  margin: 0;
  color: #000;
  font-size: 12px;
  opacity: 0.8;
}

.chatbot-close {
  background: none;
  border: none;
  color: #000;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background 0.3s;
}

.chatbot-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.chatbot-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.ai-toggle, .clear-btn {
  background: none;
  border: none;
  color: #000;
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  transition: background 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-toggle:hover, .clear-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.ai-toggle.active {
  background: rgba(255, 255, 255, 0.3);
  color: #ff6b35;
}

.chatbot-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: #f8f9fa;
}

.message {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 32px;
  height: 32px;
  background: #ffcc00;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000;
  flex-shrink: 0;
}

.message.user .message-avatar {
  background: #007bff;
  color: #fff;
}

.message-content {
  flex: 1;
  max-width: 80%;
}

.message.user .message-content {
  text-align: right;
}

.message-text {
  background: #ffffff;
  color: #333333;
  padding: 12px 16px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.4;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.ai-status-message {
  background: #fff3cd;
  color: #856404;
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 12px;
  margin-bottom: 8px;
  border-left: 3px solid #ffc107;
  font-weight: 500;
}

.message.user .message-text {
  background: #007bff;
  color: #ffffff;
}

.message-products {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.product-suggestion {
  display: flex;
  gap: 12px;
  background: #ffffff;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid #e9ecef;
}

.product-suggestion:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.product-suggestion img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
}

.product-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.product-price {
  margin: 0;
  color: #ffcc00;
  font-weight: 600;
  font-size: 13px;
}

.quick-replies {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-reply-btn {
  background: #ffffff;
  border: 1px solid #e9ecef;
  color: #333333;
  padding: 8px 12px;
  border-radius: 20px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.quick-reply-btn:hover {
  background: #ffcc00;
  border-color: #ffcc00;
  color: #000;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #999;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
}

.chatbot-input {
  padding: 16px 20px;
  background: #ffffff;
  border-top: 1px solid #e9ecef;
  display: flex;
  gap: 12px;
}

.chatbot-input input {
  flex: 1;
  border: 1px solid #e9ecef;
  background: #ffffff;
  color: #333333;
  padding: 12px 16px;
  border-radius: 24px;
  font-size: 14px;
  outline: none;
}

.chatbot-input input:focus {
  border-color: #ffcc00;
}

.chatbot-input input::placeholder {
  color: #999999;
}

.chatbot-input button {
  background: #ffcc00;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: #000;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.chatbot-input button:hover:not(:disabled) {
  background: #e6b800;
  transform: scale(1.05);
}

.chatbot-input button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 480px) {
  .chatbot-container {
    bottom: 10px;
    right: 10px;
    left: 10px;
  }
  
  .chatbot-window {
    width: 100%;
    height: 400px;
  }
  
  .chatbot-toggle {
    padding: 10px 16px;
    font-size: 14px;
  }
  
  .chatbot-text {
    display: none;
  }
}
</style>
