<template>
  <div class="gaming-chatbot-container">
    <!-- Chat Button -->
    <button @click="toggleChat" class="gaming-chatbot-toggle-btn">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
      <span>Gaming AI</span>
    </button>

    <!-- Chat Window -->
    <div v-if="isOpen" class="gaming-chatbot-window">
      <!-- Header -->
      <div class="gaming-chatbot-header">
        <div class="gaming-chatbot-title">
          <div class="gaming-chatbot-avatar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div class="gaming-chatbot-info">
            <h3>🎮 {{ $t('chatbot.title') }}</h3>
            <p>{{ $t('chatbot.subtitle') }}</p>
          </div>
        </div>
        <div class="gaming-chatbot-controls">
          <button @click="clearConversation" class="clear-btn" :title="$t('common.close')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </button>
          <button @click="toggleChat" class="gaming-chatbot-close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Messages -->
      <div class="gaming-chatbot-messages" ref="messagesContainer">
        <template v-for="message in messages" :key="message.id">
          <div
            v-if="hasMessageContent(message) || message.type === 'user'"
            :class="['message', message.type]"
          >
          <div v-if="message.type === 'bot'" class="message-avatar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div v-else class="message-avatar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
          <div v-if="hasMessageContent(message)" class="message-content">
            <!-- AI status message đã bị ẩn -->
            <!-- <div v-if="message.aiMessage" class="ai-status-message">
              {{ message.aiMessage }}
            </div> -->
            <div v-if="message.text && message.text.trim()" class="message-text" v-html="message.text"></div>
            
            <!-- Technical Support Info - Đã ẩn vì không cần thiết cho người dùng -->
            
            <!-- Product Recommendations -->
            <div v-if="message.products && message.products.length" class="message-products">
              <div
                v-for="product in message.products"
                :key="product.id"
                class="product-suggestion"
              >
                <img 
                  :src="getImageUrl(product.image) || 'https://via.placeholder.com/80?text=No+Image'" 
                  :alt="product.name || product.title"
                  @error="handleImageError"
                />
                <div class="product-info">
                  <h4>{{ product.name || product.title || 'Không có tên' }}</h4>
                  <p class="product-price">{{ formatPrice(product.price) }} VNĐ</p>
                  <p class="product-platform">{{ product.platform }}</p>
                  <div class="product-rating" v-if="product.rating">
                    <span class="stars">{{ getStars(product.rating) }}</span>
                    <span class="rating-count">({{ product.rating }})</span>
                  </div>
                  <div class="product-actions">
                    <button class="action-btn primary" @click.stop="viewProduct(product.id)">{{ $t('chatbot.products.viewDetails') }}</button>
                    <button class="action-btn" @click.stop="addProductToCart(product)">{{ $t('chatbot.products.addToCart') }}</button>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Quick Replies -->
            <div v-if="message.quickReplies && message.quickReplies.length" class="quick-replies">
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
        </template>
        
        <!-- Typing Indicator -->
        <div v-if="isTyping" class="message bot">
          <div class="message-avatar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div class="message-content">
            <div class="message-text typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Input -->
      <div class="gaming-chatbot-input">
        <input
          v-model="currentMessage"
          @keyup.enter="sendMessage"
          :placeholder="$t('chatbot.placeholder')"
        />
        <button @click="sendMessage">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { sendGamingMessage, clearGamingConversationContext } from '@/apis/gamingChatbotApi';
import { i18n } from '@/i18n';

export default {
  name: 'GamingChatBot',
  data() {
    return {
      isOpen: false,
      isTyping: false,
      currentMessage: '',
      userId: this.generateUserId(),
      messages: [],
      messageId: 1,
      userProfile: {
        budget: null,
        platform: null,
        gameGenre: null,
        gamingLevel: null
      }
    };
  },
  async mounted() {
    // Wait for translations to load
    await this.$nextTick();
    
    // Initialize welcome message
    const welcomeText = this.$t('chatbot.welcome');
    const quickReply1 = this.$t('chatbot.quickReplies.pcGamingUnder20M');
    const quickReply2 = this.$t('chatbot.quickReplies.playstation5');
    const quickReply3 = this.$t('chatbot.quickReplies.gamingController');
    const quickReply4 = this.$t('chatbot.quickReplies.gamingAccessories');
    
    // Only add welcome message if translations are loaded
    if (welcomeText !== 'chatbot.welcome') {
      this.messages = [{
        id: this.messageId++,
        type: 'bot',
        text: welcomeText,
        quickReplies: [quickReply1, quickReply2, quickReply3, quickReply4]
      }];
    } else {
      // Fallback welcome message
      const locale = i18n.getLocale();
      this.messages = [{
        id: this.messageId++,
        type: 'bot',
        text: locale === 'en' 
          ? 'Hello! I\'m a professional gaming AI consultant! 🎮 I can help you find gaming machines, controllers, games and gaming accessories that best suit you. What do you need advice on?'
          : 'Xin chào! Tôi là AI tư vấn gaming chuyên nghiệp! 🎮 Tôi có thể giúp bạn tìm máy chơi game, tay cầm, đĩa game và phụ kiện gaming phù hợp nhất. Bạn cần tư vấn gì?',
        quickReplies: locale === 'en'
          ? ['PC Gaming under 20 million', 'PlayStation 5', 'Gaming controller', 'Gaming accessories']
          : ['PC Gaming dưới 20 triệu', 'PlayStation 5', 'Tay cầm gaming', 'Phụ kiện gaming']
      }];
    }
    
    // Listen for locale changes to update UI
    window.addEventListener('locale-changed', this.handleLocaleChange);
  },
  beforeUnmount() {
    window.removeEventListener('locale-changed', this.handleLocaleChange);
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
    async addProductToCart(product) {
      try {
        const { addToCart } = await import('@/apis/cartApi');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user?.id) throw new Error('NOT_LOGIN');
        await addToCart({ user_id: user.id, book_id: product.id, quantity: 1 });
        this.messages.push({ 
          id: this.messageId++, 
          type: 'bot', 
          text: `✅ ${this.$t('chatbot.products.addedToCart', { productName: product.name || product.title })}`, 
          products: [], 
          quickReplies: [this.$t('chatbot.products.goToCart'), this.$t('chatbot.products.viewMoreProducts')] 
        });
      } catch (e) {
        const text = e.message === 'NOT_LOGIN' 
          ? `🔒 ${this.$t('chatbot.products.pleaseLogin')}` 
          : `❌ ${this.$t('chatbot.products.errorAdding')}`;
        this.messages.push({ 
          id: this.messageId++, 
          type: 'bot', 
          text, 
          products: [], 
          quickReplies: e.message === 'NOT_LOGIN' 
            ? [this.$t('chatbot.products.login'), this.$t('chatbot.products.register')] 
            : [this.$t('chatbot.products.tryAgain')] 
        });
      }
      this.$nextTick(this.scrollToBottom);
    },

    handleImageError(event) {
      event.target.src = 'https://via.placeholder.com/80?text=No+Image';
    },
    hasValidTechnicalInfo(technicalInfo) {
      // Chỉ hiển thị technical support nếu có ít nhất một trong: title, content, hoặc steps
      if (!technicalInfo) return false;
      if (typeof technicalInfo === 'string') return technicalInfo.trim().length > 0;
      if (typeof technicalInfo === 'object') {
        const hasTitle = technicalInfo.title && typeof technicalInfo.title === 'string' && technicalInfo.title.trim().length > 0;
        const hasContent = technicalInfo.content && typeof technicalInfo.content === 'string' && technicalInfo.content.trim().length > 0;
        const hasSteps = technicalInfo.steps && Array.isArray(technicalInfo.steps) && technicalInfo.steps.length > 0;
        return hasTitle || hasContent || hasSteps;
      }
      return false;
    },
    hasMessageContent(message) {
      // User messages luôn có text nên luôn hiển thị
      if (message.type === 'user') {
        return true;
      }
      // Bot messages chỉ hiển thị nếu có ít nhất một trong các nội dung sau
      const hasText = message.text && typeof message.text === 'string' && message.text.trim().length > 0;
      const hasProducts = message.products && Array.isArray(message.products) && message.products.length > 0;
      const hasQuickReplies = message.quickReplies && Array.isArray(message.quickReplies) && message.quickReplies.length > 0;
      // Không tính technicalInfo vì đây chỉ là metadata AI, không cần hiển thị cho người dùng
      
      return hasText || hasProducts || hasQuickReplies;
    },
    generateUserId() {
      return 'gaming_user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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
      this.processGamingMessage(userMessage.text);
    },

    async sendQuickReply(reply) {
      // Handle CTA quick replies
      const goToCartText = this.$t('chatbot.products.goToCart');
      const loginText = this.$t('chatbot.products.login');
      const registerText = this.$t('chatbot.products.register');
      
      if (reply === goToCartText || reply === 'Đi tới giỏ hàng') {
        this.$router.push('/cart');
        this.isOpen = false;
        return;
      }
      if (reply === loginText || reply === 'Đăng nhập') {
        this.$router.push('/login');
        this.isOpen = false;
        return;
      }
      if (reply === registerText || reply === 'Đăng ký') {
        this.$router.push('/register');
        this.isOpen = false;
        return;
      }
      this.currentMessage = reply;
      this.sendMessage();
    },

    handleLocaleChange() {
      // Clear conversation context when locale changes to ensure proper language handling
      clearGamingConversationContext(this.userId).catch(console.error);
      
      // Update welcome message when locale changes
      const currentLocale = i18n.getLocale();
      const welcomeText = currentLocale === 'en' 
        ? 'Hello! I\'m a professional gaming AI consultant! 🎮 I can help you find gaming machines, controllers, games and gaming accessories that best suit you. What do you need advice on?'
        : 'Xin chào! Tôi là AI tư vấn gaming chuyên nghiệp! 🎮 Tôi có thể giúp bạn tìm máy chơi game, tay cầm, đĩa game và phụ kiện gaming phù hợp nhất. Bạn cần tư vấn gì?';
      
      const quickReplies = currentLocale === 'en'
        ? ['PC Gaming under 20 million', 'PlayStation 5', 'Gaming controller', 'Gaming accessories']
        : ['PC Gaming dưới 20 triệu', 'PlayStation 5', 'Tay cầm gaming', 'Phụ kiện gaming'];
      
      this.messages = [{
        id: this.messageId++,
        type: 'bot',
        text: welcomeText,
        quickReplies: quickReplies
      }];
      
      // Reset message ID
      this.messageId = 2;
    },
    async processGamingMessage(message) {
      this.isTyping = true;

      try {
        // Get current locale and send it to backend
        const currentLocale = i18n.getLocale();
        const response = await sendGamingMessage(message, this.userId, currentLocale);

        // Normalize products để đảm bảo có name/title
        const products = (response.products || response.recommendedProducts || []).map(product => ({
          ...product,
          name: product.name || product.title || 'Không có tên',
          title: product.title || product.name || 'Không có tên',
          image: product.image || product.image_url || null
        }));

        console.log('📦 Products received:', products);

        // Đảm bảo message luôn có giá trị
        let messageText = response.message || response.text || '';
        if (!messageText || typeof messageText !== 'string' || messageText.trim().length === 0) {
          console.warn('⚠️ Response message is empty, using fallback');
          const currentLocale = i18n.getLocale();
          messageText = currentLocale === 'en'
            ? 'Sorry, I could not generate a response for this question. Could you ask something else?'
            : 'Xin lỗi, tôi không thể tạo câu trả lời cho câu hỏi này. Bạn có thể đặt câu hỏi khác không?';
        }

        const botMessage = {
          id: this.messageId++,
          type: 'bot',
          text: messageText.trim(),
          products: products,
          quickReplies: response.quickReplies || [],
          intent: response.intent || 'general',
          aiStatus: response.aiStatus || 'gaming',
          aiMessage: response.aiMessage || null,
          technicalInfo: response.technicalInfo || null
        };

        // Chỉ push message nếu có nội dung (text, products, quickReplies, hoặc technicalInfo)
        if (this.hasMessageContent(botMessage)) {
          this.messages.push(botMessage);
        } else {
          console.warn('⚠️ Skipping empty message:', botMessage);
        }
        this.lastProducts = botMessage.products;
        
        // Update user profile
        if (response.userProfile) {
          this.userProfile = { ...this.userProfile, ...response.userProfile };
        }
      } catch (error) {
        console.error('Gaming chatbot error:', error);
        
        const botMessage = {
          id: this.messageId++,
          type: 'bot',
          text: this.$t('chatbot.errors.technicalError'),
          products: [],
          quickReplies: [this.$t('chatbot.errors.tryAgain'), this.$t('chatbot.errors.otherConsultation')]
        };

        this.messages.push(botMessage);
      }

      this.isTyping = false;

      this.$nextTick(() => {
        this.scrollToBottom();
      });
    },

    viewProduct(productId) {
      // Navigate to product details page
      this.$router.push(`/book/${productId}`);
      // Close chatbot when viewing product
      this.isOpen = false;
    },

    formatPrice(price) {
      return new Intl.NumberFormat('vi-VN').format(price);
    },

    getStars(rating) {
      const fullStars = Math.floor(rating);
      const hasHalfStar = rating % 1 !== 0;
      let stars = '★'.repeat(fullStars);
      if (hasHalfStar) stars += '☆';
      return stars;
    },

    scrollToBottom() {
      const container = this.$refs.messagesContainer;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    },

    clearConversation() {
      this.messages = [
        {
          id: this.messageId++,
          type: 'bot',
          text: this.$t('chatbot.welcome'),
          quickReplies: [
            this.$t('chatbot.quickReplies.pcGamingUnder20M'),
            this.$t('chatbot.quickReplies.playstation5'),
            this.$t('chatbot.quickReplies.gamingController'),
            this.$t('chatbot.quickReplies.gamingAccessories')
          ]
        }
      ];
      this.userProfile = {
        budget: null,
        platform: null,
        gameGenre: null,
        gamingLevel: null
      };

      // Clear gaming context
      clearGamingConversationContext(this.userId).catch(console.error);
    }
  }
};
</script>

<style scoped>
.gaming-chatbot-container {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 1000;
}

.gaming-chatbot-toggle-btn {
  background: linear-gradient(135deg, #ff6b35, #f7931e);
  color: #000;
  border: none;
  border-radius: 30px;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(255, 107, 53, 0.3);
  transition: all 0.3s ease;
}

.gaming-chatbot-toggle-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 25px rgba(255, 107, 53, 0.4);
}

.gaming-chatbot-toggle-btn svg {
  width: 20px;
  height: 20px;
}

.gaming-chatbot-window {
  position: absolute;
  bottom: 70px;
  right: 0;
  width: 400px;
  height: 600px;
  background: #1a1a1d;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 2px solid #ff6b35;
}

.gaming-chatbot-header {
  background: linear-gradient(135deg, #ff6b35, #f7931e);
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #000;
}

.gaming-chatbot-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.gaming-chatbot-avatar {
  width: 40px;
  height: 40px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gaming-chatbot-info h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.gaming-chatbot-info p {
  margin: 0;
  font-size: 0.85rem;
  opacity: 0.8;
}

.gaming-chatbot-controls {
  display: flex;
  gap: 8px;
}

.clear-btn, .gaming-chatbot-close {
  background: rgba(0, 0, 0, 0.2);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.3s;
}

.clear-btn:hover, .gaming-chatbot-close:hover {
  background: rgba(0, 0, 0, 0.3);
}

.gaming-chatbot-messages {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  background: #1a1a1d;
}

.message {
  display: flex;
  margin-bottom: 16px;
  gap: 12px;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.message.user .message-avatar {
  background: #ff6b35;
  color: #000;
}

.message.bot .message-avatar {
  background: #4a90e2;
  color: #fff;
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-text {
  background: #2a2a2d;
  padding: 14px 18px;
  border-radius: 12px;
  color: #e8e8e8;
  line-height: 1.6;
  word-wrap: break-word;
  font-size: 0.95rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  letter-spacing: 0.01em;
}

.message.user .message-text {
  background: #ff6b35;
  color: #000;
  margin-left: auto;
  max-width: 80%;
}

.ai-status-message {
  background: #4a90e2;
  color: #fff;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.85rem;
  margin-bottom: 8px;
  text-align: center;
}

.technical-support {
  background: #2a2a2d;
  padding: 16px;
  border-radius: 12px;
  margin-top: 8px;
  border-left: 4px solid #ff6b35;
}

.technical-support h4 {
  color: #ff6b35;
  margin: 0 0 8px 0;
  font-size: 1rem;
}

.technical-support p {
  color: #ccc;
  margin: 0 0 12px 0;
  font-size: 0.9rem;
}

.technical-support ul {
  margin: 0;
  padding-left: 20px;
  color: #ccc;
}

.technical-support li {
  margin-bottom: 4px;
  font-size: 0.85rem;
}

.message-products {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.product-suggestion {
  background: #2a2a2d;
  padding: 12px;
  border-radius: 12px;
  display: flex;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #444;
}

.product-suggestion:hover {
  background: #3a3a3d;
  border-color: #ff6b35;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.2);
}

.product-suggestion img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}

.product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.product-info h4 {
  margin: 0;
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-actions {
  margin-top: auto;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn {
  background: #1a1a1d;
  color: #fff;
  border: 1px solid #555;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.2s ease;
  flex: 1;
  min-width: 100px;
}

.action-btn:hover {
  background: #ff6b35;
  border-color: #ff6b35;
  color: #000;
  transform: translateY(-1px);
}

.action-btn.primary {
  background: #4a90e2;
  border-color: #4a90e2;
  color: #fff;
}

.action-btn.primary:hover {
  background: #357abd;
  border-color: #357abd;
  color: #fff;
}

.product-price {
  margin: 0;
  color: #ff6b35;
  font-size: 0.9rem;
  font-weight: 700;
}

.product-platform {
  margin: 0;
  color: #4a90e2;
  font-size: 0.75rem;
  opacity: 0.9;
}

.product-rating {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stars {
  color: #ffcc00;
  font-size: 0.8rem;
}

.rating-count {
  color: #888;
  font-size: 0.75rem;
}

.quick-replies {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.quick-reply-btn {
  background: #2a2a2d;
  color: #ffffff;
  border: 1px solid #444;
  padding: 6px 12px;
  border-radius: 16px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.3s;
}

.quick-reply-btn:hover {
  background: #ff6b35;
  color: #000;
  border-color: #ff6b35;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  align-items: center;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #888;
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
    opacity: 0.5;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

.gaming-chatbot-input {
  padding: 16px;
  background: #2a2a2d;
  display: flex;
  gap: 12px;
  align-items: center;
}

.gaming-chatbot-input input {
  flex: 1;
  background: #1a1a1d;
  border: 1px solid #444;
  border-radius: 20px;
  padding: 10px 16px;
  color: #ffffff;
  font-size: 0.9rem;
  outline: none;
}

.gaming-chatbot-input input:focus {
  border-color: #ff6b35;
}

.gaming-chatbot-input input::placeholder {
  color: #888;
}

.gaming-chatbot-input button {
  background: #ff6b35;
  color: #000;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.3s;
}

.gaming-chatbot-input button:hover {
  background: #e55a2b;
}

/* Responsive Design */
@media (max-width: 768px) {
  .gaming-chatbot-window {
    width: 100vw;
    height: 100vh;
    bottom: 0;
    right: 0;
    border-radius: 0;
  }
  
  .gaming-chatbot-container {
    bottom: 20px;
    right: 20px;
  }
}
</style>





