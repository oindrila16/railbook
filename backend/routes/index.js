/**
 * Route aggregator — mounts feature routers under /api.
 * Individual route modules (auth, trains, bookings, waitlist) added in Step 3+.
 */
const express = require('express');

const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/pnr', require('./pnr.routes'));
router.use('/trains', require('./train.routes'));
router.use('/bookings', require('./booking.routes'));
router.use('/waitlist', require('./waitlist.routes'));
router.use('/pricing', require('./pricing.routes'));
router.use('/recommendations', require('./recommendation.routes'));
router.use('/chat', require('./chat.routes'));
router.use('/admin', require('./admin.routes'));

module.exports = router;
