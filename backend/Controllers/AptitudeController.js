const AptitudeQuestion = require('../Models/AptitudeQuestion');
const Performance = require('../Models/Performance');

// GET all questions or filtered by category/difficulty
const getQuestions = async (req, res) => {
    try {
        const { category, difficulty, limit = 10 } = req.query;
        const filter = {};
        if (category) filter.category = category;
        if (difficulty) filter.difficulty = difficulty;

        const questions = await AptitudeQuestion.find(filter).limit(Number(limit));
        // Remove correctAnswer from response so frontend can't cheat
        const safeQuestions = questions.map(q => ({
            _id: q._id,
            question: q.question,
            options: q.options,
            category: q.category,
            difficulty: q.difficulty
        }));
        res.status(200).json({ success: true, questions: safeQuestions });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching questions', error: err.message });
    }
};

// POST submit quiz answers — evaluate and save performance
const submitQuiz = async (req, res) => {
    try {
        const { answers, timeTaken, category, difficulty } = req.body;
        // answers: [{ questionId, selectedOption }]
        const userId = req.user._id;

        if (!answers || !Array.isArray(answers) || answers.length === 0) {
            return res.status(400).json({ success: false, message: 'No answers provided' });
        }

        let correct = 0;
        const results = [];

        for (const answer of answers) {
            const question = await AptitudeQuestion.findById(answer.questionId);
            if (!question) continue;
            const isCorrect = question.correctAnswer === answer.selectedOption;
            if (isCorrect) correct++;
            results.push({
                questionId: answer.questionId,
                question: question.question,
                selectedOption: answer.selectedOption,
                correctAnswer: question.correctAnswer,
                isCorrect
            });
        }

        // Save performance record
        await Performance.create({
            userId,
            type: 'aptitude',
            category: category || 'Mixed',
            difficulty: difficulty || 'Medium',
            quizScore: correct,
            quizTotal: answers.length,
            timeTaken: timeTaken || 0
        });

        res.status(200).json({
            success: true,
            score: correct,
            total: answers.length,
            percentage: Math.round((correct / answers.length) * 100),
            results
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error submitting quiz', error: err.message });
    }
};

module.exports = { getQuestions, submitQuiz };