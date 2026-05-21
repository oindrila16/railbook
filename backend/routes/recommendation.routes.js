/**
 * Train recommendation routes — rule-based suggestions from booking history.
 */
const express = require('express');
const { query } = require('express-validator');
const recommendationController = require('../controllers/recommendation.controller');
const { authenticate } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

const dateRule = query('date')
  .optional()
  .isISO8601({ strict: true, strictSeparator: true })
  .withMessage('date must be YYYY-MM-DD');

const limitRule = query('limit')
  .optional()
  .isInt({ min: 1, max: 20 })
  .withMessage('limit must be 1–20');

/** Personalized — requires JWT + booking history */
router.get(
  '/',
  authenticate,
  [dateRule, limitRule],
  validate,
  asyncHandler(recommendationController.getForUser)
);

/** Trending routes — public */
router.get(
  '/popular',
  [dateRule, limitRule],
  validate,
  asyncHandler(recommendationController.getPopular)
);

module.exports = router;
