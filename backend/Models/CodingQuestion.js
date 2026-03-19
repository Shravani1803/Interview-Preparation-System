const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TestCaseSchema = new Schema({
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true }
});

const CodingQuestionSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    inputFormat: {
        type: String,
        required: true
    },
    outputFormat: {
        type: String,
        required: true
    },
    sampleInput: {
        type: String,
        required: true
    },
    sampleOutput: {
        type: String,
        required: true
    },
    testCases: {
        type: [TestCaseSchema],
        required: true
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        default: 'Medium'
    },
    category: {
        type: String,
        enum: ['Arrays', 'Strings', 'Linked List', 'Trees', 'Dynamic Programming', 'Math', 'Sorting', 'Searching'],
        default: 'Arrays'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const CodingQuestionModel = mongoose.model('codingquestions', CodingQuestionSchema);
module.exports = CodingQuestionModel;
