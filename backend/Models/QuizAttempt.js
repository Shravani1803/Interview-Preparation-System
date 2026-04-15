const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const QuizAttemptSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    answers: {
        type: Map,
        of: String,
        required: true
    },
    score: {
        type: Number,
        required: true
    },
    module: {
        type: String,
        enum: ['aptitude', 'coding'],
        default: 'aptitude'
    },
    totalQuestions: {
        type: Number,
        default: 0
    },
    correctAnswers: {
        type: Number,
        default: 0
    },
    accuracy: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        enum: ['Quantitative', 'Logical', 'Verbal', 'C++', 'Java', 'Python'],
        required: true
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        required: true
    },
    questionIds: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'aptitudequestions',
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const QuizAttemptModel = mongoose.model('quizattempts', QuizAttemptSchema);
module.exports = QuizAttemptModel;
