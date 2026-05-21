/**
 * Dynamic pricing routes.
 */
const express = require('express');
const { query } = require('express-validator');
const pricingController = require('../controllers/pricing.controller');
const validate = require('../middlewares/validate');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/rules', asyncHandler(pricingController.getRules));

router.get('/fare-classes', asyncHandler(pricingController.getFareClasses));

router.get(
  '/matrix',
  [
    query('days')
      .optional()
      .isInt({ min: 1, max: 14 })
      .withMessage('days must be 1–14'),
    query('fromDate')
      .optional()
      .isISO8601({ strict: true, strictSeparator: true })
      .withMessage('fromDate must be YYYY-MM-DD'),
  ],
  validate,
  asyncHandler(pricingController.getMatrix)
);

router.get(
  '/quote',
  [
    query('routeId').isInt({ min: 1 }).withMessage('routeId is required'),
    query('date')
      .trim()
      .isISO8601({ strict: true, strictSeparator: true })
      .withMessage('date must be YYYY-MM-DD'),
    query('passengers')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('passengers must be 1–10'),
    query('fareClass')
      .optional()
      .isIn(['economy', 'business', 'first'])
      .withMessage('fareClass must be economy, business, or first'),
    query('class')
      .optional()
      .isIn(['economy', 'business', 'first'])
      .withMessage('class must be economy, business, or first'),
  ],
  validate,
  asyncHandler(pricingController.getQuote)
);

module.exports = router;
