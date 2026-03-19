const router = require('express').Router();
const ensureAuthenticated = require('../Middlewares/Auth');
const { getStats, getAnalytics } = require('../Controllers/PerformanceController');

router.get('/stats', ensureAuthenticated, getStats);
router.get('/analytics', ensureAuthenticated, getAnalytics);

module.exports = router;
