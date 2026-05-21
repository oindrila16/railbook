/**
 * Live support chatbot routes (public).
 */
const express = require('express');
const { body, query } = require('express-validator');
const chatController = require('../controllers/chat.controller');
const validate = require('../middlewares/validate');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get(
  '/welcome',
  [
    query('sessionId')
      .optional()
      .isString()
      .isLength({ max: 64 })
      .withMessage('sessionId must be a valid string'),
  ],
  validate,
  asyncHandler(chatController.getWelcome)
);

router.post(
  '/message',
  [
    body('message')
      .trim()
      .notEmpty()
      .withMessage('message is required')
      .isLength({ max: 500 })
      .withMessage('message must be at most 500 characters'),
    body('sessionId')
      .optional()
      .isString()
      .isLength({ max: 64 })
      .withMessage('sessionId must be a valid string'),
  ],
  validate,
  asyncHandler(chatController.postMessage)
);

module.exports = router;
