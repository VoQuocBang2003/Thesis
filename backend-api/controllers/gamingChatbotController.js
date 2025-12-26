const db = require('../knexfile');
const { GamingChatbotService } = require('../routers/gamingChatbotRouter');

// Save a chat message to DB
async function saveMessage({ userId, sessionId, role, message, intent, entities, metadata }) {
  try {
    await db('chat_conversations').insert({
      user_id: userId,
      session_id: sessionId,
      role,
      message,
      intent: intent ? JSON.stringify(intent) : null,
      entities: entities ? JSON.stringify(entities) : null,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });
  } catch (e) {
    console.error('Failed to save chat message:', e.message);
  }
}

// Load last N messages for a user/session
async function loadConversation(userId, sessionId, limit = 20) {
  const rows = await db('chat_conversations')
    .where({ user_id: userId, session_id: sessionId })
    .orderBy('created_at', 'asc')
    .limit(limit);
  return rows.map(r => ({
    role: r.role,
    message: r.message,
    intent: safeParse(r.intent),
    entities: safeParse(r.entities),
    metadata: safeParse(r.metadata),
    createdAt: r.created_at,
  }));
}

function safeParse(v) {
  if (!v) return null;
  try { return typeof v === 'object' ? v : JSON.parse(v); } catch { return null; }
}

// Main handler using persistent conversation
exports.handleGamingChat = async (req, res) => {
  try {
    const { message, userId } = req.body;
    if (!message || !userId) {
      return res.status(400).json({ success: false, message: 'Message and userId are required' });
    }

    const sessionId = req.body.sessionId || userId; // simple session grouping

    // Load conversation history (if needed you can pass to service)
    const history = await loadConversation(userId, sessionId, 20);

    const bot = new GamingChatbotService();
    const result = await bot.processGamingMessage(message, userId);

    // Persist both user message and bot response
    await saveMessage({ userId, sessionId, role: 'user', message, intent: result.intent, entities: result.userProfile, metadata: { source: 'ui' } });
    await saveMessage({ userId, sessionId, role: 'bot', message: result.message, intent: { intent: result.intent }, entities: null, metadata: { quickReplies: result.quickReplies, aiStatus: result.aiStatus } });

    return res.json({ success: true, ...result, history });
  } catch (error) {
    console.error('handleGamingChat error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Clear a conversation
exports.clearGamingContext = async (req, res) => {
  const { userId } = req.params;
  const sessionId = req.query.sessionId || userId;
  try {
    await db('chat_conversations').where({ user_id: userId, session_id: sessionId }).del();
    return res.json({ success: true, message: 'Cleared conversation' });
  } catch (e) {
    console.error('clearGamingContext error:', e);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};




