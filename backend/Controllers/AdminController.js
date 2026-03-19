const AptitudeQuestion = require('../Models/AptitudeQuestion');
const CodingQuestion = require('../Models/CodingQuestion');
const Performance = require('../Models/Performance');
const UserModel = require('../Models/User');

// ---- Aptitude Question CRUD ----

const addAptitudeQuestion = async (req, res) => {
    try {
        const { question, options, correctAnswer, category, difficulty } = req.body;
        if (!question || !options || options.length !== 4 || correctAnswer === undefined) {
            return res.status(400).json({ success: false, message: 'question, 4 options, and correctAnswer are required' });
        }
        const newQ = await AptitudeQuestion.create({ question, options, correctAnswer, category, difficulty });
        res.status(201).json({ success: true, message: 'Aptitude question added', question: newQ });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error adding question', error: err.message });
    }
};

const updateAptitudeQuestion = async (req, res) => {
    try {
        const updated = await AptitudeQuestion.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ success: false, message: 'Question not found' });
        res.status(200).json({ success: true, message: 'Question updated', question: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error updating question', error: err.message });
    }
};

const deleteAptitudeQuestion = async (req, res) => {
    try {
        const deleted = await AptitudeQuestion.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ success: false, message: 'Question not found' });
        res.status(200).json({ success: true, message: 'Question deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error deleting question', error: err.message });
    }
};

const getAllAptitudeQuestions = async (req, res) => {
    try {
        const questions = await AptitudeQuestion.find();
        res.status(200).json({ success: true, questions });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching questions' });
    }
};

// ---- Coding Question CRUD ----

const addCodingQuestion = async (req, res) => {
    try {
        const { title, description, inputFormat, outputFormat, sampleInput, sampleOutput, testCases, difficulty, category } = req.body;
        if (!title || !description || !testCases || testCases.length === 0) {
            return res.status(400).json({ success: false, message: 'title, description, and testCases are required' });
        }
        const newQ = await CodingQuestion.create({ title, description, inputFormat, outputFormat, sampleInput, sampleOutput, testCases, difficulty, category });
        res.status(201).json({ success: true, message: 'Coding question added', question: newQ });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error adding coding question', error: err.message });
    }
};

const updateCodingQuestion = async (req, res) => {
    try {
        const updated = await CodingQuestion.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ success: false, message: 'Question not found' });
        res.status(200).json({ success: true, message: 'Coding question updated', question: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error updating coding question', error: err.message });
    }
};

const deleteCodingQuestion = async (req, res) => {
    try {
        const deleted = await CodingQuestion.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ success: false, message: 'Question not found' });
        res.status(200).json({ success: true, message: 'Coding question deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error deleting coding question', error: err.message });
    }
};

const getAllCodingQuestions = async (req, res) => {
    try {
        const questions = await CodingQuestion.find();
        res.status(200).json({ success: true, questions });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching coding questions' });
    }
};

// ---- Admin Dashboard Stats ----
const getAdminStats = async (req, res) => {
    try {
        const totalUsers = await UserModel.countDocuments();
        const totalAptitude = await AptitudeQuestion.countDocuments();
        const totalCoding = await CodingQuestion.countDocuments();
        const totalAttempts = await Performance.countDocuments();
        res.status(200).json({
            success: true,
            totalUsers,
            totalAptitude,
            totalCoding,
            totalAttempts
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching admin stats' });
    }
};

module.exports = {
    addAptitudeQuestion, updateAptitudeQuestion, deleteAptitudeQuestion, getAllAptitudeQuestions,
    addCodingQuestion, updateCodingQuestion, deleteCodingQuestion, getAllCodingQuestions,
    getAdminStats
};