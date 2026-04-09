const router = require('express').Router();
const ensureAuthenticated = require('../Middlewares/Auth');
const { getQuestions, getQuestionsCount, submitQuiz } = require('../Controllers/AptitudeController');

router.get('/questions/count', getQuestionsCount);
router.get('/questions', getQuestions);
router.post('/quiz/submit', ensureAuthenticated, submitQuiz);
router.post('/submit', ensureAuthenticated, submitQuiz);

module.exports = router;
