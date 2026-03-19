const router = require('express').Router();
const ensureAuthenticated = require('../Middlewares/Auth');
const { getQuestions, submitQuiz } = require('../Controllers/AptitudeController');

// All routes require authentication
router.get('/questions', ensureAuthenticated, getQuestions);
router.post('/submit', ensureAuthenticated, submitQuiz);

module.exports = router;
