const CodingQuestion = require('../Models/CodingQuestion');
const Performance = require('../Models/Performance');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// GET all coding problems or by difficulty
const getProblems = async (req, res) => {
    try {
        const { difficulty, category } = req.query;
        const filter = {};
        if (difficulty) filter.difficulty = difficulty;
        if (category) filter.category = category;

        // Don't expose test cases to frontend
        const problems = await CodingQuestion.find(filter).select(
            'title description inputFormat outputFormat sampleInput sampleOutput difficulty category'
        );
        res.status(200).json({ success: true, problems });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching problems', error: err.message });
    }
};

// GET single problem by ID
const getProblemById = async (req, res) => {
    try {
        const problem = await CodingQuestion.findById(req.params.id).select(
            'title description inputFormat outputFormat sampleInput sampleOutput difficulty category'
        );
        if (!problem) return res.status(404).json({ success: false, message: 'Problem not found' });
        res.status(200).json({ success: true, problem });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching problem', error: err.message });
    }
};

// POST evaluate JavaScript code against test cases
const submitCode = async (req, res) => {
    try {
        const { questionId, code } = req.body;
        const userId = req.user._id;

        if (!questionId || !code) {
            return res.status(400).json({ success: false, message: 'Question ID and code are required' });
        }

        const question = await CodingQuestion.findById(questionId);
        if (!question) return res.status(404).json({ success: false, message: 'Question not found' });

        const testResults = [];
        let allPassed = true;

        // Run each test case
        for (const testCase of question.testCases) {
            try {
                // Write code to temp file and execute with Node.js
                const tmpDir = path.join(__dirname, '../tmp');
                if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

                const tmpFile = path.join(tmpDir, `solution_${Date.now()}.js`);
                // Inject input and capture output
                const wrappedCode = `
const input = ${JSON.stringify(testCase.input)};
${code}
`;
                fs.writeFileSync(tmpFile, wrappedCode);

                const output = await new Promise((resolve, reject) => {
                    exec(`node "${tmpFile}"`, { timeout: 5000 }, (error, stdout, stderr) => {
                        fs.unlinkSync(tmpFile); // cleanup
                        if (error || stderr) reject(stderr || error.message);
                        else resolve(stdout.trim());
                    });
                });

                const passed = output === testCase.expectedOutput.trim();
                if (!passed) allPassed = false;
                testResults.push({ passed, output, expected: testCase.expectedOutput });
            } catch (execErr) {
                allPassed = false;
                testResults.push({ passed: false, output: 'Runtime Error', expected: testCase.expectedOutput });
            }
        }

        const status = allPassed ? 'Solved' : testResults.some(t => t.passed) ? 'Attempted' : 'Failed';

        // Save performance
        await Performance.create({
            userId,
            type: 'coding',
            codingQuestionId: questionId,
            codingStatus: status,
            submittedCode: code
        });

        res.status(200).json({
            success: true,
            status,
            passed: testResults.filter(t => t.passed).length,
            total: testResults.length,
            testResults
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error evaluating code', error: err.message });
    }
};

module.exports = { getProblems, getProblemById, submitCode };
