const express = require('express');
const { param, query } = require('express-validator');
const pnrController = require('../controllers/pnr.controller');
const validate = require('../middlewares/validate');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get(
  '/lookup',
  [
    query('reference')
      .trim()
      .isLength({ min: 6, max: 30 })
      .withMessage('reference query param is required'),
  ],
  validate,
  asyncHandler((req, res) => {
    req.params = { reference: req.query.reference };
    return pnrController.lookup(req, res);
  })
);

router.get(
  '/:reference',
  [
    param('reference')
      .trim()
      .isLength({ min: 6, max: 30 })
      .withMessage('Valid booking reference is required'),
  ],
  validate,
  asyncHandler(pnrController.lookup)
);

module.exports = router;
