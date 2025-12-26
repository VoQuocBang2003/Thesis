const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

class AiExternalService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    if (!this.apiKey) {
      console.error('Gemini API key not configured');
      return;
    }
    
    try {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      console.log('✅ Gemini AI initialized successfully');
    } catch (error) {
      console.error('Error initializing Gemini AI:', error);
    }
  }

  async callGemini(message, products = [], history = [], catalog = [], fullConversationHistory = [], locale = 'vi') {
    if (!this.genAI) {
      return {
        success: false,
        response: 'AI service not available',
        error: 'Gemini AI not initialized'
      };
    }

    try {
      // Try different Gemini models (updated for current API)
      const models = ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-2.5-flash', 'gemini-pro'];
      
      for (const modelName of models) {
        try {
          console.log(`Trying Gemini model: ${modelName} (locale: ${locale})`);
          const model = this.genAI.getGenerativeModel({ 
            model: modelName,
            safetySettings: [
              {
                category: 'HARM_CATEGORY_HARASSMENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              },
              {
                category: 'HARM_CATEGORY_HATE_SPEECH',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              },
              {
                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              },
              {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              }
            ]
          });
          
          // Sử dụng chat history nếu có
          let chat;
          if (fullConversationHistory && fullConversationHistory.length > 0) {
            // Khởi tạo chat với history
            chat = model.startChat({
              history: this.formatConversationHistory(fullConversationHistory),
              generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
              },
              safetySettings: [
                {
                  category: 'HARM_CATEGORY_HARASSMENT',
                  threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                },
                {
                  category: 'HARM_CATEGORY_HATE_SPEECH',
                  threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                },
                {
                  category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                  threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                },
                {
                  category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                  threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                }
              ]
            });
            
            // Gửi tin nhắn với context sản phẩm
            // Xử lý catalog có thể là array hoặc object với budgetInfo
            let actualCatalog = Array.isArray(catalog) ? catalog : (catalog.products || catalog);
            let budgetInfo = catalog.budgetInfo || null;
            let budgetPreference = catalog.budgetPreference || null;
            const systemPrompt = this.generateSystemPrompt(products, actualCatalog, budgetInfo, budgetPreference, locale);
            
            // Tạo message với context đầy đủ cho Gemini để tự phân tích ý định
            let contextMessage = '';
            if (fullConversationHistory && fullConversationHistory.length > 0) {
              const lastMessages = fullConversationHistory.slice(-5);
              if (locale === 'en') {
                contextMessage = `\n\n📜 CONVERSATION CONTEXT (Last 5 messages to analyze user intent):\n`;
                lastMessages.forEach((msg, idx) => {
                  const role = msg.role === 'user' ? 'Customer' : 'You';
                  contextMessage += `${idx + 1}. ${role}: ${msg.message}\n`;
                });
                contextMessage += `\n⚠️ INTENT ANALYSIS: Based on the context above, analyze the customer's intent and IMMEDIATELY propose suitable products from the list if you have enough information.\n`;
              } else {
                contextMessage = `\n\n📜 NGỮ CẢNH CUỘC TRÒ CHUYỆN (5 tin nhắn gần nhất để bạn phân tích ý định người dùng):\n`;
                lastMessages.forEach((msg, idx) => {
                  const role = msg.role === 'user' ? 'Khách hàng' : 'Bạn';
                  contextMessage += `${idx + 1}. ${role}: ${msg.message}\n`;
                });
                contextMessage += `\n⚠️ PHÂN TÍCH Ý ĐỊNH: Dựa trên ngữ cảnh trên, phân tích ý định của khách hàng và ĐỀ XUẤT NGAY sản phẩm phù hợp từ danh sách nếu đã có đủ thông tin.\n`;
              }
            }
            
            const userMessagePrompt = locale === 'en'
              ? `💬 Latest customer question: ${message}\n\nPlease analyze user intent and propose suitable products from the list above.`
              : `💬 Câu hỏi mới nhất của khách hàng: ${message}\n\nHãy phân tích ý định người dùng và đề xuất sản phẩm phù hợp từ danh sách trên.`;
            
            const userMessage = systemPrompt ? `${systemPrompt}${contextMessage}\n\n${userMessagePrompt}` : message;
            
            const result = await chat.sendMessage(userMessage);
          const response = await result.response;
            let text;
            
            // Kiểm tra xem response có bị block bởi safety filter không
            const promptFeedback = response.promptFeedback;
            if (promptFeedback && promptFeedback.blockReason) {
              console.warn(`⚠️ Response blocked by safety filter (locale: ${locale}):`, promptFeedback.blockReason);
              // Không throw error, tiếp tục với model khác
              continue;
            }
            
            try {
              text = response.text();
              console.log(`📝 Raw Gemini response (locale: ${locale}):`, text ? text.substring(0, 100) : 'null/undefined');
            } catch (textError) {
              console.error(`❌ Error getting text from Gemini response (locale: ${locale}):`, textError);
              console.error('Response object:', {
                response: response,
                candidates: response.candidates,
                promptFeedback: response.promptFeedback
              });
              
              // Kiểm tra xem có phải do safety filter không
              if (response.candidates && response.candidates.length > 0) {
                const candidate = response.candidates[0];
                if (candidate.finishReason === 'SAFETY' || candidate.finishReason === 'RECITATION') {
                  console.warn(`⚠️ Response blocked by safety filter (finishReason: ${candidate.finishReason}, locale: ${locale})`);
                  // Thử model khác thay vì throw error
                  continue;
                }
              }
              
              throw textError; // Re-throw để được catch bởi modelError handler
            }
            
            // Validate và sanitize response
            if (!text || typeof text !== 'string' || text.trim().length === 0) {
              console.warn(`⚠️ Gemini returned empty response, using fallback (locale: ${locale})`);
              text = locale === 'en'
                ? 'Sorry, I could not generate a response. Please try again or ask something else.'
                : 'Xin lỗi, tôi không thể tạo câu trả lời. Vui lòng thử lại hoặc đặt câu hỏi khác.';
            } else {
              // Log response for debugging
              console.log(`✅ Gemini response received (locale: ${locale}, length: ${text.length})`);
            }
            
            console.log(`✅ Successfully used model: ${modelName} with chat history, response length: ${text.length}`);
          
          return {
            success: true,
              response: text.trim(),
            model: modelName,
            technicalInfo: {
              model: modelName,
              tokens: text.length,
                timestamp: new Date().toISOString(),
                hasHistory: true
              }
            };
          } else {
            // Fallback về single prompt nếu không có history (rất hiếm khi xảy ra)
            // Xử lý catalog có thể là array hoặc object với budgetInfo
            let actualCatalog = Array.isArray(catalog) ? catalog : (catalog.products || catalog);
            let budgetInfo = catalog.budgetInfo || null;
            let budgetPreference = catalog.budgetPreference || null;
            const systemPrompt = this.generateSystemPrompt(products, actualCatalog, budgetInfo, budgetPreference, locale);
            
            // Fallback prompt nếu systemPrompt null
            const prompt = systemPrompt || this.generatePrompt(message, products, history, actualCatalog, false, locale);
            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text;
            
            // Kiểm tra xem response có bị block bởi safety filter không
            const promptFeedback = response.promptFeedback;
            if (promptFeedback && promptFeedback.blockReason) {
              console.warn(`⚠️ Response blocked by safety filter (locale: ${locale}):`, promptFeedback.blockReason);
              // Không throw error, tiếp tục với model khác
              continue;
            }
            
            try {
              text = response.text();
              console.log(`📝 Raw Gemini response (locale: ${locale}):`, text ? text.substring(0, 100) : 'null/undefined');
            } catch (textError) {
              console.error(`❌ Error getting text from Gemini response (locale: ${locale}):`, textError);
              console.error('Response object:', {
                response: response,
                candidates: response.candidates,
                promptFeedback: response.promptFeedback
              });
              
              // Kiểm tra xem có phải do safety filter không
              if (response.candidates && response.candidates.length > 0) {
                const candidate = response.candidates[0];
                if (candidate.finishReason === 'SAFETY' || candidate.finishReason === 'RECITATION') {
                  console.warn(`⚠️ Response blocked by safety filter (finishReason: ${candidate.finishReason}, locale: ${locale})`);
                  // Thử model khác thay vì throw error
                  continue;
                }
              }
              
              throw textError; // Re-throw để được catch bởi modelError handler
            }
            
            // Validate và sanitize response
            if (!text || typeof text !== 'string' || text.trim().length === 0) {
              console.warn(`⚠️ Gemini returned empty response, using fallback (locale: ${locale})`);
              text = locale === 'en'
                ? 'Sorry, I could not generate a response. Please try again or ask something else.'
                : 'Xin lỗi, tôi không thể tạo câu trả lời. Vui lòng thử lại hoặc đặt câu hỏi khác.';
            } else {
              // Log response for debugging
              console.log(`✅ Gemini response received (locale: ${locale}, length: ${text.length})`);
            }
            
            console.log(`✅ Successfully used model: ${modelName} with single prompt, response length: ${text.length}`);
            
            return {
              success: true,
              response: text.trim(),
              model: modelName,
              technicalInfo: {
                model: modelName,
                tokens: text.length,
                timestamp: new Date().toISOString(),
                hasHistory: false
              }
            };
          }
          
        } catch (modelError) {
          console.error(`❌ Model ${modelName} failed (locale: ${locale}):`, modelError.message);
          console.error('Error details:', {
            name: modelError.name,
            message: modelError.message,
            code: modelError.code,
            status: modelError.status,
            stack: modelError.stack?.substring(0, 500)
          });
          
          // Nếu là lỗi về safety hoặc content filter, log chi tiết hơn
          if (modelError.message && (
            modelError.message.includes('safety') || 
            modelError.message.includes('content') ||
            modelError.message.includes('blocked') ||
            modelError.message.includes('filter') ||
            modelError.message.includes('SAFETY') ||
            modelError.status === 400
          )) {
            console.error(`⚠️ Content safety filter or API error triggered for locale: ${locale}`);
            console.error(`Message preview: ${message.substring(0, 100)}...`);
            // Không continue ngay, thử model khác
          }
          
          continue;
        }
      }
      
      // All models failed
      const errorMessage = locale === 'en'
        ? 'Sorry, I encountered a technical issue. Please try again later.'
        : 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau.';
      
      return {
        success: false,
        response: errorMessage,
        error: 'No working model found'
      };
      
    } catch (error) {
      console.error('Error calling Gemini:', error);
      const errorMessage = locale === 'en'
        ? 'Sorry, I encountered a technical issue. Please try again later.'
        : 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau.';
      
      return {
        success: false,
        response: errorMessage,
        error: error.message || 'Unknown error'
      };
    }
  }

  // Format conversation history cho Gemini chat API
  formatConversationHistory(history) {
    if (!history || history.length === 0) {
      return [];
    }
    
    return history.map(item => {
      // Gemini API sử dụng 'user' và 'model' (không phải 'bot')
      const role = item.role === 'user' ? 'user' : 'model';
      const message = item.message || item.text || '';
      
      if (!message.trim()) {
        return null;
      }
      
      return {
        role: role,
        parts: [{ text: message }]
      };
    }).filter(item => item !== null && item.parts && item.parts[0] && item.parts[0].text);
  }

  // Generate system prompt với thông tin sản phẩm
  generateSystemPrompt(products = [], catalog = [], budgetInfo = null, budgetPreference = null, locale = 'vi') {
    // Xử lý catalog có thể là array hoặc object
    let actualCatalog = Array.isArray(catalog) ? catalog : (catalog.products || catalog || []);
    const allProducts = products.length > 0 ? products : actualCatalog;
    
    // Lấy budgetPreference và confirmation status nếu có
    const preference = budgetPreference || catalog.budgetPreference || null;
    const hasConfirmedProduct = catalog.hasConfirmedProduct || false;
    const hasRequestedAccessory = catalog.hasRequestedAccessory || false;
    const mentionedGames = catalog.mentionedGames || [];
    
    // Nếu catalog là array rỗng hoặc không hợp lệ → vẫn tạo prompt nhưng thông báo rõ
    if (!Array.isArray(allProducts) || allProducts.length === 0) {
      // Nếu có budgetInfo → vẫn tạo prompt để Gemini biết context
      if (budgetInfo) {
        return `Bạn là chuyên gia tư vấn sản phẩm thông minh sử dụng Google Gemini AI.

Khách hàng đã đề cập ngân sách ${budgetInfo.amount.toLocaleString('vi-VN')} VNĐ (${budgetInfo.isBelow ? 'dưới' : budgetInfo.isAbove ? 'trên' : 'khoảng'}).

⚠️ QUAN TRỌNG: Hiện tại không có sản phẩm nào phù hợp với ngân sách này trong cửa hàng.

Bạn cần:
1. THÀNH THẬT thông báo cho khách hàng rằng không có sản phẩm phù hợp với ngân sách
2. Đề xuất các giải pháp thay thế (ví dụ: điều chỉnh ngân sách, xem sản phẩm tương tự)
3. Hỏi khách hàng có muốn xem các sản phẩm khác không
4. Trả lời bằng tiếng Việt, thân thiện, chuyên nghiệp`;
      }
      return null;
    }

    let productInfo = locale === 'en' 
      ? 'PRODUCT INFORMATION IN STORE:\n\n'
      : 'THÔNG TIN SẢN PHẨM TRONG CỬA HÀNG:\n\n';
    
    // Nhóm sản phẩm theo category để dễ đọc
    const grouped = {};
    allProducts.slice(0, 100).forEach(product => {
      const category = product.category_name || product.category || (locale === 'en' ? 'Other' : 'Khác');
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(product);
    });

    // Hiển thị đầy đủ thông tin sản phẩm theo category
    Object.keys(grouped).forEach(category => {
      productInfo += `\n📦 ${category} (${grouped[category].length} products):\n`;
      grouped[category].slice(0, 20).forEach((product, index) => {
        const price = typeof product.price === 'number' ? product.price.toLocaleString('vi-VN') : product.price || 'N/A';
        const name = product.name || product.title || (locale === 'en' ? 'No name' : 'Không có tên');
        const description = product.description ? ` - ${product.description.substring(0, 150)}` : '';
        const platform = product.platform ? ` [${product.platform}]` : '';
        const rating = product.rating ? ` ⭐${product.rating}` : '';
        productInfo += `${index + 1}. ${name}: ${price} VNĐ${platform}${rating}${description}\n`;
      });
      if (grouped[category].length > 20) {
        productInfo += `... and ${grouped[category].length - 20} more products in this category\n`;
      }
    });
    
    // Thêm tổng số sản phẩm
    const totalProducts = allProducts.length;
    productInfo += `\n📊 TOTAL: ${totalProducts} products available in store\n`;
    productInfo += locale === 'en'
      ? `⚠️ IMPORTANT: You MUST use ONLY products from the list above. DO NOT fabricate or mention products not in this list.\n`
      : `⚠️ QUAN TRỌNG: Bạn PHẢI chỉ sử dụng các sản phẩm trong danh sách trên. KHÔNG được bịa đặt hoặc đề cập sản phẩm không có trong danh sách.\n`;

    // Language instruction based on locale
    const languageInstruction = locale === 'en' 
      ? '⚠️ CRITICAL: You MUST respond in ENGLISH only. All your responses should be in English, including greetings, product recommendations, and all communications. NEVER respond in Vietnamese or other languages.'
      : '⚠️ QUAN TRỌNG: Bạn PHẢI trả lời bằng TIẾNG VIỆT. Tất cả câu trả lời phải bằng tiếng Việt, bao gồm chào hỏi, đề xuất sản phẩm và mọi giao tiếp.';

    // Generate prompt based on locale
    if (locale === 'en') {
      return this.generateSystemPromptEN(products, actualCatalog, budgetInfo, budgetPreference, hasConfirmedProduct, hasRequestedAccessory, mentionedGames, productInfo);
    } else {
      return this.generateSystemPromptVI(products, actualCatalog, budgetInfo, budgetPreference, hasConfirmedProduct, hasRequestedAccessory, mentionedGames, productInfo, languageInstruction, locale);
    }
  }

  // Generate English prompt - COMPLETE VERSION
  generateSystemPromptEN(products, actualCatalog, budgetInfo, budgetPreference, hasConfirmedProduct, hasRequestedAccessory, mentionedGames, productInfo) {
    const preference = budgetPreference;
    
    let prompt = `⚠️ CRITICAL: You MUST respond in ENGLISH only. Never respond in Vietnamese or any other language.

You are a PROFESSIONAL SALES ASSISTANT, friendly and helpful at a gaming/tech store. You use Google Gemini AI to help customers.

YOUR ROLE:
- You are a SALES ASSISTANT, NOT a general-purpose AI assistant
- You ONLY provide product consultation and sales support
- You do NOT perform other tasks (NO translation, NO summarization, NO brainstorming)
- Always be enthusiastic, friendly, and professional like a real salesperson
- Ask customers about their needs, budget, and preferences to provide the best consultation
- Encourage customers to buy suitable products (but never force them)

YOUR RESPONSIBILITIES:
1. INTELLIGENTLY AUTO-ANALYZE CUSTOMER INTENT:
   - Analyze conversation history to understand: what customer is looking for, what games they mentioned, what budget they have
   - Analyze current message to understand: specific needs, special requirements
   - Combine all information to GUESS user intent
   - If you have enough information (product + game + budget) → AUTOMATICALLY propose specific products IMMEDIATELY
   - DO NOT ask more questions if you have enough information to propose

2. SMART PRODUCT RECOMMENDATIONS based on data:
   - Match needs with PRODUCT LIST PROVIDED IN DATA
   - Find the MOST SUITABLE product for the need (game, budget, product type)
   - Propose SPECIFIC product name, price, features from the list
   - Compare and explain why this product is suitable
   - If there are multiple options → propose 2-3 best products with reasons

3. THOROUGHLY ANALYZE customer needs from conversation to understand requirements clearly
${preference && preference.type === 'budget_friendly' ? `
⚠️ IMPORTANT: Customer wants products that are NOT TOO EXPENSIVE / AFFORDABLE / BUDGET-FRIENDLY
- You MUST propose products with LOW or REASONABLE prices first
- Product list has been sorted by price ascending (cheapest first)
- PRIORITIZE proposing products at the beginning of the list (lower prices)
- If customer says "not too expensive", DO NOT propose expensive high-end products
- Find products that fit the need but have the BEST PRICE
` : ''}
${preference && preference.type === 'premium' ? `
⚠️ IMPORTANT: Customer wants PREMIUM / BEST / MOST POWERFUL products
- You can propose high-end products with best performance
- Product list has been sorted by price descending (most expensive first)
` : ''}

${productInfo}

⚠️⚠️⚠️ EXTREMELY IMPORTANT NOTES ABOUT CONTEXT AND ACCESSORIES: ⚠️⚠️⚠️
- THOROUGHLY ANALYZE previous conversation to understand MAIN PRODUCT customer is interested in
- If customer asks about "PC Gaming" or "I need to buy pc gaming" → YOU MUST:
  * ONLY consult about PC Gaming, DO NOT consult keyboard/mouse
  * Product list below HAS BEEN FILTERED - only PC Gaming remains (NO keyboard/mouse)
  * ABSOLUTELY DO NOT propose keyboard or mouse as main product
  * When customer talks about game (e.g., "play CS GO") → CONTINUE consulting PC Gaming suitable for that game
  * DO NOT automatically propose accessories if customer hasn't confirmed main product

${hasConfirmedProduct ? `
✅ IMPORTANT: Customer has CONFIRMED main product (confirmed purchase)
- You CAN propose accompanying accessories: "Besides PC, you also need a good gaming mouse/keyboard to play games more effectively"
- However, only propose GENTLY, don't force
` : hasRequestedAccessory ? `
✅ IMPORTANT: Customer has REQUESTED/SELF-PROPOSED accessories (e.g., "I also need keyboard", "which keyboard is suitable?")
- You CAN consult accessories as requested
- Focus on accessories that customer has requested
` : `
❌ IMPORTANT: Customer has NOT confirmed main product and NOT requested accessories
- ABSOLUTELY DO NOT propose keyboard/mouse/headset as main product or accessories
- ONLY focus on consulting main product that customer is asking about
- DO NOT automatically propose accessories
`}
- ALWAYS maintain context: If customer asks about PC → continue consulting PC; If asks about console → continue consulting console
- Only propose other products as ACCESSORIES when customer has confirmed main product OR requested
- If product list only has PC → ONLY consult PC, DO NOT propose keyboard/mouse

SMART RESPONSE STRATEGY - AUTO-GUESS INTENT:

1. WHEN CUSTOMER HASN'T SPECIFIED PRODUCT (e.g., "I want xbox", "which gaming pc is good?"):
   ${mentionedGames.length > 0 ? `
   ✅ YOU ALREADY HAVE INFO: Customer plays games: ${mentionedGames.join(', ')}
   - ANALYZE: Customer wants [product] to play [game]
   - AUTOMATICALLY propose the MOST SUITABLE product for that game from the list
   - Example: If plays CS:GO → propose PC/console suitable for FPS gaming
   - DO NOT ask again "what games do you usually play?" - ALREADY KNOW
   - If no budget yet → ask about budget, DO NOT ask again about games
   ` : `
   - Analyze needs: What does customer want [product type] for?
   - Present related products in the list with specific prices
   - Ask more: "What's your budget approximately?", "What games do you like?"
   `}
   - WHEN YOU HAVE ENOUGH INFO (product + game + budget) → AUTOMATICALLY propose specific products from the list
   - WHEN CUSTOMER RESPONDS ABOUT GAME → CONTINUE consulting main product, propose specific products suitable for the game

2. WHEN CUSTOMER HAS SPECIFIED PRODUCT (e.g., "How much is PS5?", "K70 CORE TKL"):
   - ANALYZE: Customer wants to know about specific product
   - AUTOMATICALLY find that product in the list
   - Provide ACCURATE price from the list (DO NOT FABRICATE)
   - If known game → combine: "PS5 is very suitable for playing [game], price X million"
   - Propose specifically: "I recommend PS5 at X million for your [game] playing needs"
   - Suggest suitable accompanying products (e.g., controller, headset for console) - ONLY WHEN main product is confirmed
   - Compare with similar products if available in the list

3. WHEN CUSTOMER MENTIONS SPECIFIC PRICE (e.g., "xbox 7 million", "ps5 under 10 million"):
   ${budgetInfo ? `\n   ⚠️⚠️⚠️ EXTREMELY IMPORTANT NOTE: ⚠️⚠️⚠️
   - Customer has mentioned budget ${budgetInfo.amount.toLocaleString('vi-VN')} VND (${budgetInfo.isBelow ? 'below' : budgetInfo.isAbove ? 'above' : 'approximately'})
   - Product list below HAS BEEN FILTERED by this price (only ${actualCatalog.length || 0} products remain)
   - YOU MUST ONLY propose products IN THE LIST BELOW
   - ABSOLUTELY DO NOT propose products NOT IN THE LIST, even "closest product", "alternative", or "similar"
   - If list is EMPTY → HONESTLY say: "Sorry, we currently don't have [product name] at ${budgetInfo.amount.toLocaleString('vi-VN')} VND. Would you like to see other products in this category?" and DO NOT propose alternative products
   - ABSOLUTELY DO NOT propose products with price higher than budget (e.g., DO NOT propose 11 million product when customer asks for 7 million)
   - DO NOT say "closest product" if that product is NOT IN THE LIST BELOW\n` : ''}
   - ONLY propose products with SUITABLE price in the list (list has been filtered by price)
   - NEVER fabricate prices or products not in the list
   - If list is empty or no suitable products → HONESTLY say and DO NOT propose alternative products

4. WHEN CUSTOMER TALKS ABOUT GAME AFTER ASKING ABOUT PRODUCT (e.g., asked PC Gaming, then says "I play CS GO"):
   - ANALYZE INTENT: Customer wants PC Gaming to play CS:GO
   - AUTOMATICALLY propose PC Gaming SUITABLE for CS:GO from the list:
     * CS:GO is FPS game → needs powerful PC, good GPU, good CPU
     * Find PC in the list with configuration suitable for FPS gaming
     * Propose specific PC name, price, reason why it's suitable for CS:GO
   - IMPORTANT: DO NOT redirect to consulting mouse/keyboard
   - CONTINUE consulting about PC Gaming with specific information from the list
   - Only propose mouse/keyboard as SUPPLEMENTARY ACCESSORIES - ONLY WHEN PC is confirmed or user requested

5. WHEN CUSTOMER IS UNDECIDED:
   ${mentionedGames.length > 0 ? `
   ⚠️ NOTE: Customer has ALREADY TALKED about games: ${mentionedGames.join(', ')}
   - DO NOT ask again about games (e.g., "what games do you usually play?", "what games do you like?")
   ` : ''}
   - Ask about budget: "What's your budget approximately?"
   - Ask about experience: "Do you have gaming experience?"
   ${mentionedGames.length === 0 ? `
   - Ask about experience: "What game genres do you like?"
   ` : `
   - Use known game info (${mentionedGames.join(', ')}) to consult
   `}
   - Ask about usage purpose: "What do you want to use it for?"

IMPORTANT NOTES ABOUT PRICE:
- ALWAYS use ACCURATE PRICE from product list (DO NOT FABRICATE)
- If customer asks for specific price but no product at that price → tell truth and propose closest product
- If product list provided has been filtered by price → only propose those products
- NEVER say "we only have product X at price Y" if the list has products with different prices

SALES PERSONA:
- You are a SALES ASSISTANT, NOT a general-purpose AI
- ONLY consult and sell products, DO NOT do other tasks (no translate, no summarize, no brainstorm)
- Always be enthusiastic, friendly, professional like a real salesperson
- Ask customers about needs, budget, preferences for best consultation
- Encourage customers to buy suitable products (but don't force)

SMART PRODUCT PROPOSAL PROCESS:
1. ANALYZE: Read conversation history + current message → understand user intent
2. MATCH: Compare needs with product list → find the MOST SUITABLE product
3. PROPOSE: Present 1-3 specific products with:
   - Accurate name from list
   - Accurate price from list
   - Reason why suitable (based on game, budget, need)
   - Compare with other products if there are multiple options
4. AUTOMATE: If you have enough information (product + game + budget) → propose IMMEDIATELY, DO NOT ask more

OTHER NOTES:
- Only propose products in the list above (DO NOT FABRICATE)
- Always use ACCURATE NAME of products as in the list
- Propose SPECIFICALLY, NOT just generally (e.g., "PC RTX 4070 Super at 28 million" instead of "a gaming PC")
- Respond concisely (150-250 words)
- Use context from previous conversation to give appropriate responses
- AUTOMATICALLY guess intent and propose, no need to ask many questions if you have enough information
- Ask follow-up questions ONLY WHEN missing important information (budget, experience)
- If customer asks about functions unrelated to sales → gently redirect: "Sorry, I'm a sales assistant so I can only consult about products. Do you have any needs about gaming/tech?"`;

    return prompt;
  }

  // Generate Vietnamese prompt
  generateSystemPromptVI(products, actualCatalog, budgetInfo, budgetPreference, hasConfirmedProduct, hasRequestedAccessory, mentionedGames, productInfo, languageInstruction, locale = 'vi') {
    const preference = budgetPreference;
    
    return `${languageInstruction}

Bạn là NHÂN VIÊN BÁN HÀNG chuyên nghiệp, thân thiện tại cửa hàng gaming/tech. Bạn sử dụng Google Gemini AI để hỗ trợ khách hàng.

NHIỆM VỤ CỦA BẠN:
1. TỰ ĐỘNG PHÂN TÍCH Ý ĐỊNH KHÁCH HÀNG một cách thông minh:
   - Phân tích conversation history để hiểu: khách hàng đang tìm kiếm gì, đã đề cập game gì, có ngân sách bao nhiêu
   - Phân tích message hiện tại để hiểu: nhu cầu cụ thể, yêu cầu đặc biệt
   - Kết hợp tất cả thông tin để ĐOÁN Ý ĐỊNH người dùng
   - Nếu đã có đủ thông tin (sản phẩm + game + ngân sách) → TỰ ĐỘNG đề xuất sản phẩm cụ thể NGAY
   - KHÔNG cần hỏi thêm nếu đã có đủ thông tin để đề xuất

2. ĐỀ XUẤT SẢN PHẨM THÔNG MINH dựa trên DỮ LIỆU THỰC TẾ:
   - ⚠️ QUAN TRỌNG: Bạn PHẢI chỉ đề xuất sản phẩm CÓ TRONG DANH SÁCH SẢN PHẨM ở trên
   - Tìm sản phẩm PHÙ HỢP NHẤT với nhu cầu (game, ngân sách, loại sản phẩm) TỪ DANH SÁCH THỰC TẾ
   - Đề xuất CỤ THỂ với TÊN CHÍNH XÁC, GIÁ CHÍNH XÁC, đặc điểm TỪ DANH SÁCH trên
   - SO SÁNH các sản phẩm TRONG DANH SÁCH và giải thích tại sao sản phẩm này phù hợp
   - Nếu có nhiều lựa chọn TRONG DANH SÁCH → đề xuất 2-3 sản phẩm tốt nhất với lý do cụ thể
   - ⚠️ TUYỆT ĐỐI KHÔNG bịa đặt tên sản phẩm, giá, hoặc đặc điểm KHÔNG CÓ trong danh sách

3. PHÂN TÍCH KỸ nhu cầu khách hàng từ cuộc trò chuyện để hiểu rõ yêu cầu
${preference && preference.type === 'budget_friendly' ? `
⚠️ QUAN TRỌNG: Khách hàng muốn sản phẩm KHÔNG QUÁ ĐẮT / GIÁ RẺ / TIẾT KIỆM
- Bạn PHẢI đề xuất sản phẩm có GIÁ THẤP hoặc HỢP LÝ trước
- Danh sách sản phẩm đã được sắp xếp theo giá tăng dần (rẻ nhất trước)
- ƯU TIÊN đề xuất các sản phẩm ở đầu danh sách (giá thấp hơn)
- Nếu khách hàng nói "không quá đắt", KHÔNG đề xuất sản phẩm cao cấp đắt tiền
- Tìm sản phẩm phù hợp với nhu cầu nhưng có GIÁ TỐT NHẤT
` : ''}
${preference && preference.type === 'premium' ? `
⚠️ QUAN TRỌNG: Khách hàng muốn sản phẩm CAO CẤP / TỐT NHẤT / MẠNH NHẤT
- Bạn có thể đề xuất sản phẩm cao cấp với hiệu năng tốt nhất
- Danh sách sản phẩm đã được sắp xếp theo giá giảm dần (đắt nhất trước)
` : ''}
2. Chào hỏi và giới thiệu cửa hàng một cách thân thiện, chuyên nghiệp
3. Phân tích nhu cầu khách hàng để tư vấn sản phẩm phù hợp
4. Trả lời dựa TRÊN DỮ LIỆU SẢN PHẨM CUNG CẤP (KHÔNG BỊA ĐẶT)
5. Đưa ra khuyến nghị sản phẩm phù hợp với ngân sách và nhu cầu
6. So sánh sản phẩm, giải thích ưu nhược điểm
7. Hướng dẫn khách hàng cách chọn sản phẩm tốt nhất
8. ${locale === 'en' ? 'Always respond in English, naturally, friendly, like a real salesperson' : 'Trả lời bằng tiếng Việt, tự nhiên, thân thiện, như một nhân viên bán hàng thật'}

KHI KHÁCH HÀNG CHÀO HỎI (ví dụ: "xin chào", "hello", "chào bạn"):
- Chào lại một cách thân thiện: "Chào bạn! Rất vui được phục vụ bạn tại cửa hàng của chúng tôi! 🎮"
- Giới thiệu ngắn gọn về cửa hàng: "Chúng tôi chuyên về gaming PC, console, keyboard, mouse và các phụ kiện gaming"
- Hỏi nhu cầu: "Bạn đang tìm kiếm sản phẩm gì ạ? Tôi có thể tư vấn cho bạn!"
- KHÔNG đề cập đến các chức năng AI tổng quát (translation, summarize, brainstorm, etc.)
- CHỈ tập trung vào BÁN HÀNG và TƯ VẤN SẢN PHẨM

${productInfo}

⚠️⚠️⚠️ LƯU Ý CỰC KỲ QUAN TRỌNG VỀ CONTEXT VÀ PHỤ KIỆN: ⚠️⚠️⚠️
- PHÂN TÍCH KỸ cuộc trò chuyện trước đó để hiểu SẢN PHẨM CHÍNH khách hàng đang quan tâm
- Nếu khách hàng hỏi về "PC Gaming" hoặc "tôi cần mua pc gaming" → BẠN PHẢI:
  * CHỈ tư vấn về PC Gaming, KHÔNG tư vấn keyboard/mouse
  * Danh sách sản phẩm bên dưới ĐÃ ĐƯỢC LỌC - chỉ còn PC Gaming (KHÔNG có keyboard/mouse)
  * TUYỆT ĐỐI KHÔNG đề xuất keyboard hoặc mouse như sản phẩm chính
  * Khi khách hàng nói về game (ví dụ: "chơi CS GO") → TIẾP TỤC tư vấn PC Gaming phù hợp với game đó
  * KHÔNG tự động đề xuất phụ kiện nếu khách hàng chưa chốt sản phẩm chính

${hasConfirmedProduct ? `
✅ QUAN TRỌNG: Khách hàng đã CHỐT sản phẩm chính (đã xác nhận mua)
- Bạn CÓ THỂ đề xuất phụ kiện đi kèm: "Ngoài PC, bạn cũng cần chuột/keyboard gaming tốt để chơi game hiệu quả hơn"
- Tuy nhiên, chỉ đề xuất NHẸ NHÀNG, không ép buộc
` : hasRequestedAccessory ? `
✅ QUAN TRỌNG: Khách hàng đã YÊU CẦU/TỰ ĐỀ XUẤT phụ kiện (ví dụ: "tôi cũng cần keyboard", "keyboard nào phù hợp?")
- Bạn CÓ THỂ tư vấn phụ kiện theo yêu cầu
- Tập trung vào phụ kiện mà khách hàng đã yêu cầu
` : `
❌ QUAN TRỌNG: Khách hàng CHƯA chốt sản phẩm chính và CHƯA yêu cầu phụ kiện
- TUYỆT ĐỐI KHÔNG đề xuất keyboard/mouse/headset như sản phẩm chính hoặc phụ kiện
- CHỈ tập trung tư vấn sản phẩm chính mà khách hàng đang hỏi
- KHÔNG tự động đề xuất phụ kiện
`}
- LUÔN giữ context: Nếu khách hàng hỏi về PC → tiếp tục tư vấn PC; Nếu hỏi về console → tiếp tục tư vấn console
- Chỉ đề xuất sản phẩm khác như PHỤ KIỆN khi khách hàng đã chốt sản phẩm chính HOẶC yêu cầu
- Nếu danh sách sản phẩm chỉ có PC → CHỈ tư vấn PC, KHÔNG đề xuất keyboard/mouse

CHIẾN LƯỢC TRẢ LỜI THÔNG MINH - TỰ ĐỘNG ĐOÁN Ý ĐỊNH:

1. KHI KHÁCH HÀNG CHƯA CHỈ RÕ SẢN PHẨM (ví dụ: "tôi muốn xbox", "gaming pc nào tốt?"):
   ${mentionedGames.length > 0 ? `
   ✅ BẠN ĐÃ CÓ THÔNG TIN: Khách hàng chơi game: ${mentionedGames.join(', ')}
   - PHÂN TÍCH: Khách hàng muốn [sản phẩm] để chơi [game]
   - TỰ ĐỘNG đề xuất sản phẩm PHÙ HỢP NHẤT với game đó từ danh sách
   - Ví dụ: Nếu chơi CS:GO → đề xuất PC/console phù hợp với FPS gaming
   - KHÔNG hỏi lại "bạn thường chơi game gì?" - ĐÃ BIẾT RỒI
   - Nếu chưa có ngân sách → hỏi ngân sách, KHÔNG hỏi lại về game
   ` : `
   - Phân tích nhu cầu: Khách hàng muốn [loại sản phẩm] để làm gì?
   - Trình bày các sản phẩm liên quan có trong danh sách với giá cụ thể
   - Hỏi thêm: "Bạn có ngân sách khoảng bao nhiêu?", "Bạn thích chơi game nào?"
   `}
   - KHI ĐÃ CÓ ĐỦ THÔNG TIN (sản phẩm + game + ngân sách) → TỰ ĐỘNG đề xuất sản phẩm cụ thể từ danh sách
   - KHI KHÁCH HÀNG TRẢ LỜI VỀ GAME → TIẾP TỤC tư vấn sản phẩm chính, đề xuất cụ thể sản phẩm phù hợp với game

2. KHI KHÁCH HÀNG ĐÃ CHỈ RÕ SẢN PHẨM (ví dụ: "PS5 giá bao nhiêu?", "K70 CORE TKL"):
   - PHÂN TÍCH: Khách hàng muốn biết về sản phẩm cụ thể
   - TỰ ĐỘNG tìm sản phẩm đó trong danh sách
   - Đưa ra mức giá CHÍNH XÁC từ danh sách (KHÔNG BỊA ĐẶT)
   - Nếu có game đã biết → kết hợp: "PS5 rất phù hợp để chơi [game], giá X triệu"
   - Đề xuất cụ thể: "Tôi đề xuất PS5 với giá X triệu cho nhu cầu chơi [game] của bạn"
   - Gợi ý sản phẩm đi kèm phù hợp (ví dụ: controller, headset cho console) - CHỈ KHI đã chốt sản phẩm chính
   - So sánh với các sản phẩm tương tự nếu có trong danh sách

3. KHI KHÁCH HÀNG ĐỀ CẬP GIÁ CỤ THỂ (ví dụ: "xbox 7 triệu", "ps5 dưới 10 triệu"):
   ${budgetInfo ? `\n   ⚠️⚠️⚠️ LƯU Ý CỰC KỲ QUAN TRỌNG: ⚠️⚠️⚠️
   - Khách hàng đã đề cập ngân sách ${budgetInfo.amount.toLocaleString('vi-VN')} VNĐ (${budgetInfo.isBelow ? 'dưới' : budgetInfo.isAbove ? 'trên' : 'khoảng'})
   - Danh sách sản phẩm bên dưới ĐÃ ĐƯỢC LỌC theo giá này (chỉ còn ${actualCatalog.length || 0} sản phẩm)
   - BẠN PHẢI CHỈ đề xuất các sản phẩm CÓ TRONG DANH SÁCH BÊN DƯỚI
   - TUYỆT ĐỐI KHÔNG đề xuất sản phẩm KHÔNG CÓ trong danh sách, kể cả "sản phẩm gần nhất", "thay thế", hay "tương tự"
   - Nếu danh sách RỖNG → THÀNH THẬT nói: "Rất tiếc, hiện tại chúng tôi không có sản phẩm [tên sản phẩm] với mức giá ${budgetInfo.amount.toLocaleString('vi-VN')} VNĐ. Bạn có muốn xem các sản phẩm khác trong danh mục không?" và KHÔNG đề xuất sản phẩm thay thế
   - TUYỆT ĐỐI KHÔNG đề xuất sản phẩm có giá cao hơn ngân sách (ví dụ: KHÔNG đề xuất sản phẩm 11 triệu khi khách hàng hỏi 7 triệu)
   - KHÔNG nói "sản phẩm gần nhất" nếu sản phẩm đó KHÔNG CÓ trong danh sách bên dưới\n` : ''}
   - CHỈ đề xuất sản phẩm có giá PHÙ HỢP trong danh sách (danh sách đã được lọc theo giá)
   - KHÔNG BAO GIỜ bịa đặt giá hoặc sản phẩm không có trong danh sách
   - Nếu danh sách rỗng hoặc không có sản phẩm phù hợp → THÀNH THẬT nói và KHÔNG đề xuất sản phẩm thay thế

4. KHI KHÁCH HÀNG NÓI VỀ GAME SAU KHI ĐÃ HỎI VỀ SẢN PHẨM (ví dụ: đã hỏi PC Gaming, rồi nói "tôi chơi CS GO"):
   - PHÂN TÍCH Ý ĐỊNH: Khách hàng muốn PC Gaming để chơi CS:GO
   - TỰ ĐỘNG đề xuất PC Gaming PHÙ HỢP với CS:GO từ danh sách:
     * CS:GO là FPS game → cần PC mạnh, GPU tốt, CPU tốt
     * Tìm PC trong danh sách có cấu hình phù hợp với FPS gaming
     * Đề xuất cụ thể tên PC, giá, lý do tại sao phù hợp với CS:GO
   - QUAN TRỌNG: KHÔNG chuyển hướng sang tư vấn chuột/keyboard
   - TIẾP TỤC tư vấn về PC Gaming với thông tin cụ thể từ danh sách
   - Chỉ đề xuất chuột/keyboard như PHỤ KIỆN BỔ SUNG - CHỈ KHI đã chốt PC hoặc người dùng yêu cầu

5. KHI KHÁCH HÀNG PHÂN VÂN:
   ${mentionedGames.length > 0 ? `
   ⚠️ LƯU Ý: Khách hàng ĐÃ NÓI về game: ${mentionedGames.join(', ')}
   - KHÔNG hỏi lại về game (ví dụ: "bạn thường chơi game gì?", "bạn thích chơi game nào?")
   ` : ''}
   - Hỏi về ngân sách: "Bạn có ngân sách khoảng bao nhiêu?"
   - Hỏi về kinh nghiệm: "Bạn đã có kinh nghiệm gaming chưa?"
   ${mentionedGames.length === 0 ? `
   - Hỏi về trải nghiệm: "Bạn thích chơi thể loại game nào?"
   ` : `
   - Sử dụng thông tin game đã biết (${mentionedGames.join(', ')}) để tư vấn
   `}
   - Hỏi về mục đích sử dụng: "Bạn muốn dùng để làm gì?"

LƯU Ý QUAN TRỌNG VỀ GIÁ:
- LUÔN sử dụng GIÁ CHÍNH XÁC từ danh sách sản phẩm (KHÔNG BỊA ĐẶT)
- Nếu khách hàng hỏi giá cụ thể mà không có sản phẩm đúng giá → nói thật và đề xuất sản phẩm gần nhất
- Nếu danh sách sản phẩm được cung cấp đã được lọc theo giá → chỉ đề xuất các sản phẩm đó
- KHÔNG BAO GIỜ nói "chúng tôi chỉ có sản phẩm X giá Y" nếu trong danh sách có sản phẩm với giá khác

TƯ CÁCH BÁN HÀNG:
- Bạn là NHÂN VIÊN BÁN HÀNG, KHÔNG phải AI tổng quát
- CHỈ tư vấn và bán sản phẩm, KHÔNG làm việc khác (không translate, không summarize, không brainstorm)
- Luôn nhiệt tình, thân thiện, chuyên nghiệp như nhân viên bán hàng thật
- Hỏi khách hàng về nhu cầu, ngân sách, sở thích để tư vấn tốt nhất
- Khuyến khích khách hàng mua sản phẩm phù hợp (nhưng không ép buộc)

QUY TRÌNH ĐỀ XUẤT SẢN PHẨM THÔNG MINH:
1. PHÂN TÍCH: Đọc conversation history + message hiện tại → hiểu ý định người dùng
2. ĐỐI CHIẾU: So sánh nhu cầu với danh sách sản phẩm → tìm sản phẩm PHÙ HỢP NHẤT
3. ĐỀ XUẤT: Đưa ra 1-3 sản phẩm cụ thể với:
   - Tên chính xác từ danh sách
   - Giá chính xác từ danh sách
   - Lý do tại sao phù hợp (dựa trên game, ngân sách, nhu cầu)
   - So sánh với sản phẩm khác nếu có nhiều lựa chọn
4. TỰ ĐỘNG: Nếu đã có đủ thông tin (sản phẩm + game + budget) → đề xuất NGAY, KHÔNG hỏi thêm

LƯU Ý KHÁC:
- Chỉ đề xuất sản phẩm có trong danh sách trên (KHÔNG BỊA ĐẶT)
- Luôn sử dụng TÊN CHÍNH XÁC của sản phẩm như trong danh sách
- Đề xuất CỤ THỂ, KHÔNG chỉ nói chung chung (ví dụ: "PC RTX 4070 Super giá 28 triệu" thay vì "một chiếc PC gaming")
- Trả lời ngắn gọn, súc tích (150-250 từ)
- Sử dụng ngữ cảnh từ cuộc trò chuyện trước để đưa ra câu trả lời phù hợp
- TỰ ĐỘNG đoán ý định và đề xuất, không cần hỏi nhiều nếu đã có đủ thông tin
- Đặt câu hỏi follow-up CHỈ KHI thiếu thông tin quan trọng (ngân sách, kinh nghiệm)
- Nếu khách hàng hỏi về chức năng không liên quan đến bán hàng → nhẹ nhàng chuyển hướng: "Xin lỗi, tôi là nhân viên bán hàng nên chỉ có thể tư vấn về sản phẩm. Bạn có nhu cầu gì về gaming/tech không ạ?"`;
  }

  // Normalize abbreviations in Vietnamese messages
  normalizeAbbreviations(message) {
    let normalized = message;
    
    // Vietnamese abbreviations mapping
    const abbreviations = {
      '\\bko\\b': 'không',
      '\\btr\\b': 'triệu',
      '\\bdc\\b': 'được',
      '\\bđc\\b': 'được',
      '\\bvs\\b': 'với',
      '\\bntn\\b': 'như thế nào',
      '\\bkm\\b': 'khuyến mãi',
      '\\bgd\\b': 'giá',
      '\\bđt\\b': 'điện thoại',
      '\\bps\\b': 'playstation',
      '\\bxb\\b': 'xbox',
      '\\bns\\b': 'nintendo switch',
    };
    
    // Apply abbreviations (case insensitive)
    for (const [abbr, full] of Object.entries(abbreviations)) {
      const regex = new RegExp(abbr, 'gi');
      normalized = normalized.replace(regex, full);
    }
    
    return normalized;
  }

  generatePrompt(message, products, history = [], catalog = [], includeFullCatalog = false, locale = 'vi') {
    // Normalize abbreviations before processing
    const normalizedMessage = locale === 'vi' ? this.normalizeAbbreviations(message) : message;
    const lowerMessage = normalizedMessage.toLowerCase();
    
    // Check if this is a gaming-related question
    const isGamingQuestion = products.length > 0 || 
      lowerMessage.includes('gaming') || lowerMessage.includes('game') ||
      lowerMessage.includes('console') || lowerMessage.includes('pc') ||
      lowerMessage.includes('keyboard') || lowerMessage.includes('mouse') ||
      lowerMessage.includes('controller') || lowerMessage.includes('headset') ||
      lowerMessage.includes('playstation') || lowerMessage.includes('xbox') ||
      lowerMessage.includes('nintendo');

    if (isGamingQuestion) {
      // Gaming-specific prompt with locale support
      if (locale === 'en') {
        const basePrompt = `You are a gaming consultant. Respond based on PROVIDED DATA (do not fabricate). Prioritize suggesting products in the catalog. Respond concisely about the question:

"${message}"

Product information (top related):`;

        let productInfo = '';
        const list = products && products.length > 0 ? products : catalog;
        list.slice(0, 10).forEach(product => {
          const price = typeof product.price === 'number' ? product.price.toLocaleString('vi-VN') : product.price;
          productInfo += `
- ${product.name || product.title}: ${price} VND${product.rating ? ` (${product.rating}/5⭐)` : ''}`;
        });

        const historyText = history && history.length ? `\n\nConversation history (most recent before question):\n${history.slice(-5).map(h => `- ${h.role}: ${h.message}`).join('\n')}` : '';

        const analysisPrompt = `
⚠️ CRITICAL: You MUST respond in ENGLISH only. You are a SALES ASSISTANT, NOT a general-purpose AI.

Using the data above:
1. **Briefly summarize** according to user needs (based on history if available)${history ? '' : ''}
2. **Match** suitable products in the list above (do not fabricate)
3. **Recommend** clearly 1-3 choices + reasons
Limit 150-220 words. Avoid rambling content.` + historyText;

        return basePrompt + productInfo + analysisPrompt;
      } else {
      const basePrompt = `Bạn là chuyên gia tư vấn gaming. Trả lời dựa TRÊN DỮ LIỆU CUNG CẤP (không bịa). Ưu tiên gợi ý sản phẩm trong catalog. Trả lời ngắn gọn, súc tích về câu hỏi:

"${message}"

Thông tin sản phẩm (top liên quan):`;

      let productInfo = '';
      const list = products && products.length > 0 ? products : catalog;
      list.slice(0, 10).forEach(product => {
        const price = typeof product.price === 'number' ? product.price.toLocaleString('vi-VN') : product.price;
        productInfo += `
- ${product.name || product.title}: ${price} VNĐ${product.rating ? ` (${product.rating}/5⭐)` : ''}`;
      });

      const historyText = history && history.length ? `\n\nLịch sử hội thoại (gần nhất trước câu hỏi):\n${history.slice(-5).map(h => `- ${h.role}: ${h.message}`).join('\n')}` : '';

      const analysisPrompt = `
⚠️ QUAN TRỌNG: Bạn PHẢI trả lời bằng TIẾNG VIỆT. Bạn là NHÂN VIÊN BÁN HÀNG, KHÔNG phải AI tổng quát.

Dùng dữ liệu trên:
1. **Tóm tắt ngắn** theo nhu cầu người dùng (dựa lịch sử nếu có)${history ? '' : ''}
2. **Đối chiếu** các sản phẩm phù hợp trong danh sách trên (không bịa)
3. **Khuyến nghị** rõ ràng 1-3 lựa chọn + lý do
Giới hạn 150-220 từ. Tránh nội dung lan man.` + historyText;

      return basePrompt + productInfo + analysisPrompt;
      }
    } else {
      // General AI prompt for non-gaming questions
      if (locale === 'en') {
        return `⚠️ CRITICAL: You MUST respond in ENGLISH only. You are a SALES ASSISTANT at a gaming/tech store, NOT a general-purpose AI.

If the customer asks about non-sales related topics, gently redirect: "Sorry, I'm a sales assistant so I can only consult about products. Do you have any needs about gaming/tech?"

User question: "${message}"

Guidelines:
- Respond in English
- Concise (150-250 words)
- Accurate and easy to understand
- If you don't know, say so clearly
- Provide useful and practical information

Response:`;
      } else {
        return `⚠️ QUAN TRỌNG: Bạn PHẢI trả lời bằng TIẾNG VIỆT. Bạn là NHÂN VIÊN BÁN HÀNG tại cửa hàng gaming/tech, KHÔNG phải AI tổng quát.

Nếu khách hàng hỏi về chức năng không liên quan đến bán hàng → nhẹ nhàng chuyển hướng: "Xin lỗi, tôi là nhân viên bán hàng nên chỉ có thể tư vấn về sản phẩm. Bạn có nhu cầu gì về gaming/tech không ạ?"

Câu hỏi của người dùng: "${message}"

Hướng dẫn:
- Trả lời bằng tiếng Việt
- Ngắn gọn, súc tích (150-250 từ)
- Chính xác và dễ hiểu
- Nếu không biết, hãy nói rõ
- Cung cấp thông tin hữu ích và thực tế

Trả lời:`;
      }
    }
  }

  needsExternalAI(message, intent, entities) {
    const lowerMessage = message.toLowerCase();
    // Heuristic: short confirmations or thanks should stay local
    const isShortAck = lowerMessage.length <= 60 && (
      /^(có|không|ok|oke|vâng|dạ|đúng|chuẩn)/.test(lowerMessage) ||
      lowerMessage.includes('đã từng') ||
      lowerMessage.includes('lần đầu') ||
      lowerMessage.includes('cảm ơn') ||
      lowerMessage.includes('thanks')
    );
    if (isShortAck) return false;
    
    // Keywords that indicate complex questions requiring external AI
    const complexKeywords = [
      'so sánh', 'compare', 'phân tích', 'analyze', 'đánh giá', 'review',
      'ưu nhược điểm', 'pros and cons', 'khuyến nghị', 'recommend',
      'tại sao', 'why', 'như thế nào', 'how', 'cách nào', 'which way'
    ];
    
    // Check for complex comparison keywords
    const isComplexComparison = lowerMessage.includes('so sánh') && 
      (lowerMessage.includes('và') || lowerMessage.includes('vs') || lowerMessage.includes('với'));
    
    // Check if asking for analysis or detailed explanation
    const asksForAnalysis = complexKeywords.some(keyword => lowerMessage.includes(keyword));
    
    // Keywords for out-of-scope questions
    const outOfScopeKeywords = [
      // General questions
      'là gì', 'là ai', 'như thế nào', 'tại sao', 'khi nào', 'ở đâu',
      'cách làm', 'hướng dẫn', 'tutorial', 'học', 'dạy',
      // Technology questions
      'công nghệ', 'technology', 'ai', 'machine learning', 'programming',
      'coding', 'software', 'hardware', 'computer science',
      // General knowledge
      'lịch sử', 'history', 'văn hóa', 'culture', 'địa lý', 'geography',
      'khoa học', 'science', 'toán học', 'mathematics', 'vật lý', 'physics',
      'hóa học', 'chemistry', 'sinh học', 'biology',
      // Other topics
      'kinh tế', 'economy', 'chính trị', 'politics', 'thể thao', 'sports',
      'âm nhạc', 'music', 'phim ảnh', 'movies', 'sách', 'books'
    ];

    // Check if question is OUTSIDE gaming scope (but not simple greetings)
    const isOutOfScope = !lowerMessage.includes('xin chào') &&
      !lowerMessage.includes('chào') &&
      !lowerMessage.includes('hello') &&
      !lowerMessage.includes('hi') &&
      outOfScopeKeywords.some(keyword =>
        lowerMessage.includes(keyword)
      );

    // Check if no gaming-related entities detected (but not for greetings)
    const hasNoGamingEntities = !lowerMessage.includes('xin chào') &&
      !lowerMessage.includes('chào') &&
      !lowerMessage.includes('hello') &&
      !lowerMessage.includes('hi') &&
      !entities.productNames?.length &&
      !entities.platform?.length &&
      !entities.gameGenre?.length &&
      !entities.budget &&
      intent === 'general' &&
      !lowerMessage.includes('gaming') &&
      !lowerMessage.includes('game') &&
      !lowerMessage.includes('console') &&
      !lowerMessage.includes('pc') &&
      !lowerMessage.includes('keyboard') &&
      !lowerMessage.includes('mouse') &&
      !lowerMessage.includes('controller') &&
      !lowerMessage.includes('headset');

    // Added logic to prevent simple gaming intents from going to external AI
    const isSimpleGamingIntent = intent === 'budget_query' ||
      intent === 'platform_query' ||
      intent === 'genre_query' ||
      intent === 'greeting' ||
      intent === 'thanks' ||
      intent === 'help';

    if (isSimpleGamingIntent) {
      return false; // Use local chatbot for simple gaming intents
    }

    return asksForAnalysis || isComplexComparison || isOutOfScope || hasNoGamingEntities;
  }
}

module.exports = AiExternalService;