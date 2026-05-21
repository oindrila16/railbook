/**
 * Auth routes: register, verify OTP, login.
 */
const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

/** Require at least one of email or phone */
const requireContact = (req, res, next) => {
  if (!req.body.email && !req.body.phone) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: [{ field: 'contact', message: 'Either email or phone is required' }],
    });
  }
  next();
};

const emailRule = body('email')
  .optional()
  .isEmail()
  .withMessage('Valid email is required')
  .normalizeEmail();

const phoneRule = body('phone')
  .optional()
  .matches(/^\+?[1-9]\d{7,14}$/)
  .withMessage('Valid phone number is required (E.164 format)');

const passwordRule = body('password')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters')
  .matches(/[A-Za-z]/)
  .withMessage('Password must contain at least one letter')
  .matches(/\d/)
  .withMessage('Password must contain at least one number');

router.post(
  '/register',
  requireContact,
  [
    emailRule,
    phoneRule,
    passwordRule,
    body('fullName')
      .trim()
      .isLength({ min: 2, max: 150 })
      .withMessage('Full name must be 2–150 characters'),
  ],
  validate,
  asyncHandler(authController.register)
);

router.post(
  '/verify-otp',
  requireContact,
  [
    emailRule,
    phoneRule,
    body('otp')
      .trim()
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be exactly 6 digits')
      .isNumeric()
      .withMessage('OTP must be numeric'),
  ],
  validate,
  asyncHandler(authController.verifyOtp)
);

router.post(
  '/login',
  requireContact,
  [emailRule, phoneRule, body('password').notEmpty().withMessage('Password is required')],
  validate,
  asyncHandler(authController.login)
);

module.exports = router;
