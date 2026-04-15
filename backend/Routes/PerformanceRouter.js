const router = require('express').Router();
const ensureAuthenticated = require('../Middlewares/Auth');
const { getStats, getAnalytics, getProgress } = require('../Controllers/PerformanceController');

router.get('/stats', ensureAuthenticated, getStats);
router.get('/analytics', ensureAuthenticated, getAnalytics);
router.get('/progress', ensureAuthenticated, getProgress);

module.exports = router;
