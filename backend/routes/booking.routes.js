/**
 * Booking routes — protected by JWT authentication.
 */
const express = require('express');
const { body, param } = require('express-validator');
const bookingController = require('../controllers/booking.controller');
const { authenticate } = require('../middlewares/auth');
const { forbidAdmin } = require('../middlewares/forbidAdmin');
const validate = require('../middlewares/validate');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate);

router.get('/user', asyncHandler(bookingController.getUserBookings));

router.use(forbidAdmin);

router.post(
  '/',
  [
    body('routeId').isInt({ min: 1 }).withMessage('Valid routeId is required'),
    body('travelDate')
      .trim()
      .isISO8601({ strict: true, strictSeparator: true })
      .withMessage('travelDate must be YYYY-MM-DD')
      .custom((value) => {
        const travel = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        travel.setHours(0, 0, 0, 0);
        if (travel < today) throw new Error('Travel date cannot be in the past');
        return true;
      }),
    body('passengers')
      .isArray({ min: 1, max: 10 })
      .withMessage('passengers must be an array (1–10)'),
    body('passengers.*.name')
      .trim()
      .isLength({ min: 2, max: 150 })
      .withMessage('Passenger name is required'),
    body('passengers.*.age')
      .isInt({ min: 1, max: 120 })
      .withMessage('Passenger age must be 1–120'),
    body('passengers.*.gender')
      .isIn(['male', 'female', 'other'])
      .withMessage('Gender must be male, female, or other'),
    body('passengers.*.seatNumber')
      .optional()
      .trim()
      .matches(/^S\d+$/i)
      .withMessage('seatNumber must be like S12'),
    body('fareClass')
      .optional()
      .isIn(['economy', 'business', 'first'])
      .withMessage('fareClass must be economy, business, or first'),
  ],
  validate,
  asyncHandler(bookingController.create)
);

router.delete(
  '/:id',
  [param('id').isInt({ min: 1 }).withMessage('Valid booking id is required')],
  validate,
  asyncHandler(bookingController.cancel)
);

module.exports = router;
