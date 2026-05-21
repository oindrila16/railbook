/**
 * Admin routes — JWT + admin role required.
 */
const express = require('express');
const { body, param, query } = require('express-validator');
const adminController = require('../controllers/admin.controller');
const { authenticate } = require('../middlewares/auth');
const { requireAdmin } = require('../middlewares/requireAdmin');
const validate = require('../middlewares/validate');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate, requireAdmin);

router.get('/stats', asyncHandler(adminController.getStats));
router.get('/users', asyncHandler(adminController.getUsers));
router.get('/bookings', asyncHandler(adminController.getBookings));
router.get('/trains', asyncHandler(adminController.getTrains));

router.patch(
  '/trains/:id',
  [
    param('id').isInt({ min: 1 }),
    body('basePrice').optional().isFloat({ min: 0 }),
    body('isActive').optional().isBoolean(),
    body('totalSeats').optional().isInt({ min: 1 }),
  ],
  validate,
  asyncHandler(adminController.patchTrain)
);

router.get('/routes', asyncHandler(adminController.getRoutes));

router.patch(
  '/routes/:id',
  [
    param('id').isInt({ min: 1 }),
    body('departureTime')
      .optional()
      .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
      .withMessage('departureTime must be HH:MM'),
    body('arrivalTime')
      .optional()
      .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
      .withMessage('arrivalTime must be HH:MM'),
    body('economyPrice').optional().isFloat({ min: 0 }),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  asyncHandler(adminController.patchRoute)
);

module.exports = router;
