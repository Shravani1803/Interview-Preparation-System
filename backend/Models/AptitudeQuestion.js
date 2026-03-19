const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AptitudeQuestionSchema = new Schema({
    question: {
        type: String,
        required: true
    },
    options: {
        type: [String],   // Array of 4 options
        required: true
    },
    correctAnswer: {
        type: Number,     // Index of correct option (0-3)
        required: true
    },
    category: {
        type: String,
        enum: ['Logical Reasoning', 'Quantitative Aptitude', 'Verbal Ability'],
        required: true
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        default: 'Medium'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const AptitudeQuestionModel = mongoose.model('aptitudequestions', AptitudeQuestionSchema);
module.exports = AptitudeQuestionModel;
