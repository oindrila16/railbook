/**
 * Rule-based support chatbot with FAQ matching and session memory.
 */
const { randomUUID } = require('crypto');
const {
  FAQ_ENTRIES,
  GREETING_PATTERNS,
  THANKS_PATTERNS,
  BYE_PATTERNS,
  ACK_PATTERNS,
  SMALL_TALK_PATTERNS,
  WHO_ARE_YOU_PATTERNS,
  CAPABILITIES_PATTERNS,
  QUICK_LINKS,
  getWelcomeMessage,
  APP_NAME,
  SUPPORT_EMAIL,
} = require('../data/chatbotKnowledge');

const sessions = new Map();
const SESSION_TTL_MS = 60 * 60 * 1000;
const MAX_HISTORY = 20;

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\w\s৳]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const CANCEL_INTENT =
  /\b(cancel|cancelling|cancelled|cancellation|refund|unbook|void)\b/i;
const BOOK_INTENT = /\b(book|booking|reserve|reservation|purchase|buy)\b/i;

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Avoid "book" matching inside "booking" — use word boundaries for short terms. */
function keywordMatches(msg, kw) {
  const k = normalize(kw);
  if (!k) return false;
  if (k.includes(' ')) {
    const words = k.split(' ').filter(Boolean);
    return words.every((w) => keywordMatches(msg, w));
  }
  if (k.length <= 4) {
    return new RegExp(`\\b${escapeRegex(k)}\\b`, 'i').test(msg);
  }
  return msg.includes(k);
}

function scoreEntry(entry, message) {
  const msg = normalize(message);
  if (!msg) return 0;

  const wantsCancel = CANCEL_INTENT.test(msg);
  const wantsBook = BOOK_INTENT.test(msg);

  if (entry.id === 'booking' && wantsCancel) return 0;
  if (entry.id === 'cancel' && wantsCancel) {
    let score = 10;
    for (const kw of entry.keywords) {
      if (keywordMatches(msg, kw)) score += 3;
    }
    return score;
  }

  let score = 0;
  for (const kw of entry.keywords) {
    const k = normalize(kw);
    if (!k) continue;
    if (!keywordMatches(msg, kw)) continue;
    score += k.split(' ').length >= 2 ? 4 : 2;
  }

  const id = entry.id.replace(/_/g, ' ');
  if (keywordMatches(msg, id)) score += 3;

  if (entry.id === 'booking' && wantsBook && !wantsCancel) score += 2;

  return score;
}

function pickBestFaq(message) {
  let best = null;
  let bestScore = 0;

  for (const entry of FAQ_ENTRIES) {
    const s = scoreEntry(entry, message);
    if (s > bestScore) {
      bestScore = s;
      best = entry;
    }
  }

  return bestScore >= 2 ? best : null;
}

function mapSuggestions(labels) {
  return (labels || []).map((label) => ({
    label,
    path: QUICK_LINKS[label] ?? null,
  }));
}

function buildReply(text, suggestions = [], meta = {}) {
  return {
    reply: text,
    suggestions: mapSuggestions(suggestions),
    meta,
  };
}

function pruneSessions() {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.updatedAt > SESSION_TTL_MS) sessions.delete(id);
  }
}

function getOrCreateSession(sessionId) {
  pruneSessions();
  if (sessionId && sessions.has(sessionId)) {
    return sessions.get(sessionId);
  }
  const id = sessionId || randomUUID();
  const session = {
    id,
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  sessions.set(id, session);
  return session;
}

function generateResponse(message, session) {
  const trimmed = String(message || '').trim();

  if (!trimmed) {
    return buildReply('Please type a question and I will do my best to help.', [
      'How do I book?',
      'PNR status',
      'Contact support',
    ]);
  }

  if (GREETING_PATTERNS.test(trimmed)) {
    return buildReply(
      `Hi there! Welcome to **${APP_NAME}**. How can I help with your train journey today?`,
      ['How do I book?', 'Check prices', 'PNR status', 'Help page'],
      { intent: 'greeting' }
    );
  }

  if (SMALL_TALK_PATTERNS.test(trimmed)) {
    return buildReply(
      `I'm doing well, thanks for asking! I'm the **${APP_NAME}** assistant — always here to help with train bookings, PNR, fares, and trip questions.`,
      ['How do I book?', 'PNR status', 'Cancel a booking', 'Help page'],
      { intent: 'small_talk' }
    );
  }

  if (WHO_ARE_YOU_PATTERNS.test(trimmed)) {
    return buildReply(
      `I'm the **${APP_NAME}** support assistant — a friendly guide for booking trains, checking PNR, prices in ৳, cancellations, and more.`,
      ['What can you do?', 'How do I book?', 'Help page'],
      { intent: 'identity' }
    );
  }

  if (CAPABILITIES_PATTERNS.test(trimmed)) {
    return buildReply(
      `I can help you **book tickets**, check **PNR** status, understand **fares** and classes, **cancel** bookings, join the **waitlist**, verify **OTP**, and find **seat availability** or **live** train status.`,
      ['How do I book?', 'Check PNR status', 'Fare prices', 'Cancel a booking'],
      { intent: 'capabilities' }
    );
  }

  if (BYE_PATTERNS.test(trimmed)) {
    return buildReply(
      `Goodbye! Have a pleasant trip. Open chat again whenever you need help with ${APP_NAME}.`,
      ['Search trains', 'Help page'],
      { intent: 'bye' }
    );
  }

  if (THANKS_PATTERNS.test(trimmed)) {
    return buildReply(
      `You're welcome! Safe travels. Ask anytime if you need more help with ${APP_NAME}.`,
      ['Search trains', 'My bookings', 'Help page'],
      { intent: 'thanks' }
    );
  }

  if (ACK_PATTERNS.test(trimmed)) {
    return buildReply(
      `Sounds good! I'm here if you need help with bookings, PNR, or fares.`,
      ['How do I book?', 'PNR status', 'Help page'],
      { intent: 'ack' }
    );
  }

  const faq = pickBestFaq(trimmed);
  if (faq) {
    return buildReply(faq.answer, faq.suggestions, { intent: faq.id });
  }

  if (/help|faq|question/i.test(trimmed)) {
    return buildReply(
      `Visit our **Help** page for step-by-step guides, or try asking about: booking, PNR, prices, cancellations, OTP verification, waitlist, or live train status.`,
      ['How do I book?', 'Help page', 'Contact support'],
      { intent: 'help' }
    );
  }

  return buildReply(
    `I'm not sure about that yet. Try rephrasing, or ask about **booking**, **PNR**, **prices**, **cancellation**, or email **${SUPPORT_EMAIL}** for personal help.`,
    ['How do I book?', 'PNR status', 'Contact support', 'Help page'],
    { intent: 'fallback' }
  );
}

function processMessage({ message, sessionId }) {
  const session = getOrCreateSession(sessionId);
  const userText = String(message || '').trim().slice(0, 500);

  if (userText) {
    session.messages.push({ role: 'user', content: userText, at: Date.now() });
  }

  const response = userText ? generateResponse(userText, session) : getWelcomeMessage();
  const welcome = getWelcomeMessage();
  const payload = {
    sessionId: session.id,
    reply: response.reply,
    suggestions: response.suggestions,
    meta: response.meta,
    welcome: {
      reply: welcome.reply,
      suggestions: welcome.suggestions,
    },
  };

  session.messages.push({ role: 'assistant', content: payload.reply, at: Date.now() });
  if (session.messages.length > MAX_HISTORY) {
    session.messages = session.messages.slice(-MAX_HISTORY);
  }
  session.updatedAt = Date.now();

  return payload;
}

function getWelcome(sessionId) {
  const session = getOrCreateSession(sessionId);
  const welcome = getWelcomeMessage();
  return {
    sessionId: session.id,
    reply: welcome.reply,
    suggestions: mapSuggestions(welcome.suggestions),
    meta: welcome.meta,
  };
}

module.exports = {
  processMessage,
  getWelcome,
};
