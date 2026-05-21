/**
 * Support chatbot HTTP handlers.
 */
const chatbotService = require('../services/chatbot.service');

async function postMessage(req, res) {
  const { message, sessionId } = req.body;
  const result = chatbotService.processMessage({ message, sessionId });
  res.json({ success: true, data: result });
}

async function getWelcome(req, res) {
  const sessionId = req.query.sessionId || undefined;
  const result = chatbotService.getWelcome(sessionId);
  res.json({ success: true, data: result });
}

module.exports = { postMessage, getWelcome };
