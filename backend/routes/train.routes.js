/**
 * Train routes: search and station listing.
 */
const express = require('express');
const { query } = require('express-validator');
const trainController = require('../controllers/train.controller');
const validate = require('../middlewares/validate');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

const stationCodeRule = (field) =>
  query(field)
    .trim()
    .notEmpty()
    .withMessage(`${field} station code is required`)
    .isLength({ min: 2, max: 10 })
    .withMessage(`${field} must be a valid station code`)
    .matches(/^[A-Za-z0-9]+$/)
    .withMessage(`${field} must contain only letters and numbers`);

const futureDateRule = (field = 'date') =>
  query(field)
    .trim()
    .notEmpty()
    .withMessage('Travel date is required (YYYY-MM-DD)')
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage('Date must be in YYYY-MM-DD format')
    .custom((value) => {
      const travel = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      travel.setHours(0, 0, 0, 0);
      if (travel < today) {
        throw new Error('Travel date cannot be in the past');
      }
      return true;
    });

router.get('/stations', asyncHandler(trainController.getStations));
router.get('/list', asyncHandler(trainController.listTrains));

router.get(
  '/live',
  [
    query('trainNumber')
      .optional()
      .trim()
      .isLength({ min: 1, max: 20 })
      .withMessage('trainNumber must be valid'),
    query('date')
      .optional()
      .isISO8601({ strict: true, strictSeparator: true })
      .withMessage('date must be YYYY-MM-DD'),
  ],
  validate,
  asyncHandler((req, res, next) => {
    if (req.query.trainNumber) {
      return trainController.getLiveStatus(req, res, next);
    }
    return trainController.getLiveOverview(req, res, next);
  })
);

router.get(
  '/seats',
  [
    stationCodeRule('source'),
    stationCodeRule('destination'),
    futureDateRule('date'),
    query('class')
      .optional()
      .isIn(['economy', 'business', 'first'])
      .withMessage('class must be economy, business, or first'),
  ],
  validate,
  asyncHandler(trainController.getSeatAvailability)
);

router.get(
  '/search',
  [
    stationCodeRule('source'),
    stationCodeRule('destination'),
    futureDateRule('date'),
    query('class')
      .optional()
      .isIn(['economy', 'business', 'first'])
      .withMessage('class must be economy, business, or first'),
  ],
  validate,
  asyncHandler(trainController.search)
);

router.get(
  '/seat-map/:routeId',
  [
    futureDateRule('date'),
    query('class')
      .optional()
      .isIn(['economy', 'business', 'first'])
      .withMessage('class must be economy, business, or first'),
  ],
  validate,
  asyncHandler(trainController.getSeatMap)
);

router.get(
  '/availability/:routeId',
  [
    futureDateRule('date'),
    query('class')
      .optional()
      .isIn(['economy', 'business', 'first'])
      .withMessage('class must be economy, business, or first'),
  ],
  validate,
  asyncHandler(trainController.getAvailability)
);

module.exports = router;
