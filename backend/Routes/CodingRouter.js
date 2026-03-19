const router = require('express').Router();
const ensureAuthenticated = require('../Middlewares/Auth');
const { getProblems, getProblemById, submitCode } = require('../Controllers/CodingController');

router.get('/problems', ensureAuthenticated, getProblems);
router.get('/problems/:id', ensureAuthenticated, getProblemById);
router.post('/submit', ensureAuthenticated, submitCode);

module.exports = router;
