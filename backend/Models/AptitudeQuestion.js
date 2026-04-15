const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const normalizeQuestionKey = (value = '') => String(value).trim().toLowerCase().replace(/\s+/g, ' ');

const AptitudeQuestionSchema = new Schema({
    module: {
        type: String,
        enum: ['aptitude', 'coding'],
        required: true
    },
    question: {
        type: String,
        required: true,
        trim: true
    },
    questionKey: {
        type: String,
        required: true,
        index: true
    },
    options: {
        type: [String],
        required: true,
        validate: {
            validator: function (value) {
                return Array.isArray(value) && value.length === 4;
            },
            message: 'Each question must have exactly 4 options'
        }
    },
    correctAnswer: {
        type: String,
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
        default: 'Medium'
    },
    explanation: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

AptitudeQuestionSchema.pre('validate', function (next) {
    this.questionKey = normalizeQuestionKey(this.question);
    next();
});

AptitudeQuestionSchema.index({ module: 1, questionKey: 1 }, { unique: true });

const AptitudeQuestionModel = mongoose.model('aptitudequestions', AptitudeQuestionSchema);
module.exports = AptitudeQuestionModel;
