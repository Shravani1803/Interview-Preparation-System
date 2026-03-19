const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PerformanceSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    type: {
        type: String,
        enum: ['aptitude', 'coding'],
        required: true
    },
    // For aptitude quiz session
    category: {
        type: String
    },
    quizScore: {
        type: Number   // correct answers
    },
    quizTotal: {
        type: Number   // total questions attempted
    },
    timeTaken: {
        type: Number   // seconds
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard']
    },
    // For coding
    codingQuestionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'codingquestions'
    },
    codingStatus: {
        type: String,
        enum: ['Solved', 'Attempted', 'Failed']
    },
    submittedCode: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const PerformanceModel = mongoose.model('performances', PerformanceSchema);
module.exports = PerformanceModel;
