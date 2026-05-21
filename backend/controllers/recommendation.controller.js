/**
 * AI-style recommendation HTTP handlers (rule-based engine).
 */
const recommendationService = require('../services/recommendation.service');

async function getForUser(req, res) {
  const { date, limit } = req.query;
  const result = await recommendationService.getPersonalizedRecommendations(req.user.id, {
    travelDate: date,
    limit: limit ? parseInt(limit, 10) : 5,
  });
  res.json({ success: true, data: result });
}

async function getPopular(req, res) {
  const { date, limit } = req.query;
  const result = await recommendationService.getPopularRecommendations({
    travelDate: date,
    limit: limit ? parseInt(limit, 10) : 5,
  });
  res.json({ success: true, data: result });
}

module.exports = { getForUser, getPopular };
