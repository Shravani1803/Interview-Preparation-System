const router = require('express').Router();
const ensureAuthenticated = require('../Middlewares/Auth');
const {
    addAptitudeQuestion, updateAptitudeQuestion, deleteAptitudeQuestion, getAllAptitudeQuestions,
    addCodingQuestion, updateCodingQuestion, deleteCodingQuestion, getAllCodingQuestions,
    getAdminStats
} = require('../Controllers/AdminController');

// Simple admin check middleware — checks if user's email matches ADMIN_EMAIL in .env
const ensureAdmin = (req, res, next) => {
    if (req.user.email !== process.env.ADMIN_EMAIL) {
        return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
    }
    next();
};

// All admin routes need both auth + admin check
router.use(ensureAuthenticated, ensureAdmin);

// Stats
router.get('/stats', getAdminStats);

// Aptitude questions
router.get('/aptitude', getAllAptitudeQuestions);
router.post('/aptitude', addAptitudeQuestion);
router.put('/aptitude/:id', updateAptitudeQuestion);
router.delete('/aptitude/:id', deleteAptitudeQuestion);

// Coding questions
router.get('/coding', getAllCodingQuestions);
router.post('/coding', addCodingQuestion);
router.put('/coding/:id', updateCodingQuestion);
router.delete('/coding/:id', deleteCodingQuestion);

module.exports = router;