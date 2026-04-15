const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const AptitudeQuestion = require('../Models/AptitudeQuestion');
const QuizAttempt = require('../Models/QuizAttempt');

const APTITUDE_CSV_FILE_PATH = path.join(__dirname, '..', 'questions.csv');
const CODING_CSV_FILE_PATH = path.join(__dirname, '..', 'coding_questions.csv');
const VALID_MODULE_KEYS = new Set(['aptitude', 'coding']);
const CODING_CATEGORY_KEYS = new Set(['c++', 'java', 'python']);
const VALID_DIFFICULTY_KEYS = new Set(['easy', 'medium', 'hard']);

const csvCacheStore = new Map();

const getCacheEntry = (filePath) => {
    if (!csvCacheStore.has(filePath)) {
        csvCacheStore.set(filePath, {
            list: [],
            map: new Map(),
            loadPromise: null,
            meta: {
                mtimeMs: 0,
                size: 0,
            },
        });
    }

    return csvCacheStore.get(filePath);
};

const resolveCsvFilePath = (moduleKey = 'aptitude') => {
    return moduleKey === 'coding' ? CODING_CSV_FILE_PATH : APTITUDE_CSV_FILE_PATH;
};

const normalizeModule = (value = '') => {
    const normalized = String(value).trim().toLowerCase();
    return VALID_MODULE_KEYS.has(normalized) ? normalized : '';
};

const resolveRequestedModule = (moduleValue = '', categoryValue = '') => {
    const normalizedModule = normalizeModule(moduleValue);
    if (normalizedModule) return normalizedModule;

    const categoryKey = String(categoryValue).trim().toLowerCase();
    if (CODING_CATEGORY_KEYS.has(categoryKey)) return 'coding';
    return 'aptitude';
};

const normalizeCategory = (value = '') => {
    const normalized = String(value).trim().toLowerCase();

    if (normalized === 'quantitative aptitude' || normalized === 'quantitative') return 'Quantitative';
    if (normalized === 'logical reasoning' || normalized === 'logical') return 'Logical';
    if (normalized === 'verbal ability' || normalized === 'verbal') return 'Verbal';
    if (normalized === 'c++' || normalized === 'c plus plus' || normalized === 'cpp') return 'C++';
    if (normalized === 'java') return 'Java';
    if (normalized === 'python') return 'Python';
    return String(value).trim();
};

const normalizeDifficulty = (value = '') => {
    const normalized = String(value).trim().toLowerCase();

    if (normalized === 'easy') return 'Easy';
    if (normalized === 'medium') return 'Medium';
    if (normalized === 'hard') return 'Hard';
    return String(value).trim();
};

const getQuestionSignature = (question = '') => {
    return String(question)
        .toLowerCase()
        .replace(/\d+(\.\d+)?/g, '#')
        .replace(/[^a-z#\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

const pickDiverseQuestions = (items, count, usedSignatures = new Set()) => {
    const selected = [];
    const selectedIds = new Set();

    for (const item of items) {
        if (selected.length >= count) break;

        const itemId = String(item._id || '');
        const signature = getQuestionSignature(item.question || '');

        if (selectedIds.has(itemId)) continue;
        if (signature && usedSignatures.has(signature)) continue;

        selected.push(item);
        selectedIds.add(itemId);
        if (signature) usedSignatures.add(signature);
    }

    if (selected.length < count) {
        for (const item of items) {
            if (selected.length >= count) break;

            const itemId = String(item._id || '');
            if (selectedIds.has(itemId)) continue;

            selected.push(item);
            selectedIds.add(itemId);

            const signature = getQuestionSignature(item.question || '');
            if (signature) usedSignatures.add(signature);
        }
    }

    return selected;
};

const loadCsvQuestions = async (filePath) => {
    const cacheEntry = getCacheEntry(filePath);
    let fileStats;
    try {
        fileStats = await fs.promises.stat(filePath);
    } catch (error) {
        throw new Error(`Unable to read CSV file at ${filePath}`);
    }

    const isCacheFresh =
        cacheEntry.list.length > 0 &&
        cacheEntry.meta.mtimeMs === fileStats.mtimeMs &&
        cacheEntry.meta.size === fileStats.size;

    if (isCacheFresh) {
        return { list: cacheEntry.list, map: cacheEntry.map };
    }

    if (cacheEntry.loadPromise) {
        return cacheEntry.loadPromise;
    }

    cacheEntry.loadPromise = new Promise((resolve, reject) => {
        const rows = [];
        const rowMap = new Map();
        let index = 0;
        const isCodingFile = filePath === CODING_CSV_FILE_PATH;

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                const question = String(row.question || '').trim();
                const optionA = String(row.optionA || '').trim();
                const optionB = String(row.optionB || '').trim();
                const optionC = String(row.optionC || '').trim();
                const optionD = String(row.optionD || '').trim();
                const correctAnswer = String(row.correctAnswer || '').trim();
                const category = String(row.category || '').trim();
                const difficulty = String(row.difficulty || '').trim();
                const categoryKey = category.toLowerCase();
                const difficultyKey = difficulty.toLowerCase();
                const explanation = String(row.explanation || '').trim();
                const options = [optionA, optionB, optionC, optionD];

                if (!question || !optionA || !optionB || !optionC || !optionD || !correctAnswer || !category || !difficulty || !explanation) {
                    return;
                }

                if (isCodingFile && !CODING_CATEGORY_KEYS.has(categoryKey)) {
                    return;
                }

                if (!VALID_DIFFICULTY_KEYS.has(difficultyKey)) {
                    return;
                }

                if (!options.includes(correctAnswer)) {
                    return;
                }

                const csvId = `csv-${index}`;
                index += 1;

                const item = {
                    _id: csvId,
                    question,
                    options,
                    correctAnswer,
                    category,
                    difficulty,
                    categoryKey,
                    difficultyKey,
                    explanation,
                };

                rows.push(item);
                rowMap.set(csvId, item);
            })
            .on('end', () => {
                cacheEntry.list = rows;
                cacheEntry.map = rowMap;
                cacheEntry.meta = {
                    mtimeMs: fileStats.mtimeMs,
                    size: fileStats.size,
                };
                cacheEntry.loadPromise = null;
                resolve({ list: cacheEntry.list, map: cacheEntry.map });
            })
            .on('error', (error) => {
                cacheEntry.loadPromise = null;
                reject(error);
            });
    });

    return cacheEntry.loadPromise;
};

const filterCsvQuestions = (questions, category, difficulty) => {
    const requestedCategory = String(category || '').trim().toLowerCase();
    const requestedDifficulty = String(difficulty || '').trim().toLowerCase();

    return questions.filter((item) => {
        const itemCategory = String(item.categoryKey || item.category || '').trim().toLowerCase();
        const itemDifficulty = String(item.difficultyKey || item.difficulty || '').trim().toLowerCase();

        const categoryMatch = requestedCategory ? itemCategory === requestedCategory : true;
        const difficultyMatch = requestedDifficulty ? itemDifficulty === requestedDifficulty : true;
        return categoryMatch && difficultyMatch;
    });
};

const buildFilter = ({ category, difficulty }) => {
    const filter = {};
    const requestedCategory = String(category || '').trim();
    const requestedDifficulty = String(difficulty || '').trim();

    if (requestedCategory) {
        filter.category = requestedCategory;
    }

    if (requestedDifficulty) {
        filter.difficulty = requestedDifficulty;
    }

    return filter;
};

const getQuestionsCount = async (req, res) => {
    try {
        const categoryInput = String(req.query.category || '').trim();
        const difficultyInput = String(req.query.difficulty || '').trim();
        const normalizedCategory = normalizeCategory(categoryInput);
        const normalizedDifficulty = normalizeDifficulty(difficultyInput);
        const module = resolveRequestedModule(req.query.module, categoryInput);

        const matchFilter = buildFilter({
            category: normalizedCategory,
            difficulty: normalizedDifficulty,
        });
        matchFilter.module = module;

        const [countResult] = await AptitudeQuestion.aggregate([
            { $match: matchFilter },
            { $group: { _id: '$questionKey' } },
            { $count: 'count' },
        ]);

        const count = Number(countResult?.count || 0);

        res.status(200).json({
            success: true,
            count,
            module,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching question count', error: err.message });
    }
};

// GET all questions or filtered by category/difficulty
const getQuestions = async (req, res) => {
    try {
        const categoryInput = String(req.query.category || '').trim();
        const difficultyInput = String(req.query.difficulty || '').trim();
        const normalizedCategory = normalizeCategory(categoryInput);
        const normalizedDifficulty = normalizeDifficulty(difficultyInput);
        const module = resolveRequestedModule(req.query.module, categoryInput);
        const limit = Number.parseInt(req.query.limit, 10) || 15;

        const parsedLimit = limit;
        if (Number.isNaN(parsedLimit) || parsedLimit <= 0 || parsedLimit > 100) {
            return res.status(400).json({ success: false, message: 'Limit must be between 1 and 100' });
        }

        const matchFilter = buildFilter({
            category: normalizedCategory,
            difficulty: normalizedDifficulty,
        });
        matchFilter.module = module;

        const [totalResult] = await AptitudeQuestion.aggregate([
            { $match: matchFilter },
            { $group: { _id: '$questionKey' } },
            { $count: 'count' },
        ]);
        const totalAvailable = Number(totalResult?.count || 0);

        if (totalAvailable === 0) {
            return res.status(200).json({
                success: true,
                questions: [],
                totalAvailable: 0,
                requestedLimit: parsedLimit,
                actualCount: 0,
            });
        }

        const sampleSize = totalAvailable < parsedLimit ? totalAvailable : parsedLimit;

        const questions = await AptitudeQuestion.aggregate([
            { $match: matchFilter },
            { $group: { _id: '$questionKey', doc: { $first: '$$ROOT' } } },
            { $replaceRoot: { newRoot: '$doc' } },
            { $sample: { size: sampleSize } },
            {
                $project: {
                    questionKey: 0,
                    __v: 0,
                },
            },
        ]);

        console.log('Requested:', parsedLimit);
        console.log('Returned:', questions.length);

        res.status(200).json({
            success: true,
            questions,
            totalAvailable,
            requestedLimit: parsedLimit,
            actualCount: questions.length,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching questions', error: err.message });
    }
};

// POST submit quiz answers — evaluate and save performance
const submitQuiz = async (req, res) => {
    try {
        const { answers, questionIds, category, difficulty, totalQuestions } = req.body;
        const userId = req.user._id;

        if (!answers) {
            return res.status(400).json({ success: false, message: 'Answers are required' });
        }

        const isArrayAnswerPayload = Array.isArray(answers);
        const normalizedAnswerEntries = isArrayAnswerPayload
            ? answers
                .map((answer) => ({
                    questionId: String(answer?.questionId || '').trim(),
                    selectedOption: String(answer?.selectedOption || '').trim(),
                }))
                .filter((answer) => answer.questionId)
            : Object.entries(answers)
                .map(([questionId, selectedOption]) => ({
                    questionId: String(questionId || '').trim(),
                    selectedOption: String(selectedOption || '').trim(),
                }))
                .filter((answer) => answer.questionId);

        const explicitQuestionIds = Array.isArray(questionIds)
            ? questionIds.map((id) => String(id || '').trim()).filter(Boolean)
            : [];

        const mergedQuestionIds = [...new Set([
            ...explicitQuestionIds,
            ...normalizedAnswerEntries.map((entry) => entry.questionId),
        ])];

        if (mergedQuestionIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Question IDs are required' });
        }

        const answerLookup = normalizedAnswerEntries.reduce((acc, entry) => {
            acc[entry.questionId] = entry.selectedOption;
            return acc;
        }, {});

        const module = resolveRequestedModule(req.body?.module, category || '');
        const csvFilePath = resolveCsvFilePath(module);
        const { map: csvMap } = await loadCsvQuestions(csvFilePath);
        const questionMap = new Map();
        const dbQuestionIds = [];

        for (const questionId of mergedQuestionIds) {
            const normalizedQuestionId = String(questionId);
            if (csvMap.has(normalizedQuestionId)) {
                questionMap.set(normalizedQuestionId, csvMap.get(normalizedQuestionId));
            } else {
                dbQuestionIds.push(normalizedQuestionId);
            }
        }

        if (dbQuestionIds.length > 0) {
            const questions = await AptitudeQuestion.find({ _id: { $in: dbQuestionIds } });
            questions.forEach((question) => {
                questionMap.set(String(question._id), question);
            });
        }

        let score = 0;
        const review = [];
        const normalizedAnswers = {};
        const persistedQuestionIds = [];

        for (const questionId of mergedQuestionIds) {
            const normalizedQuestionId = String(questionId);
            const question = questionMap.get(normalizedQuestionId);
            if (!question) continue;

            const userAnswer = answerLookup[normalizedQuestionId] || '';
            normalizedAnswers[normalizedQuestionId] = userAnswer;

            const isCorrect = userAnswer === question.correctAnswer;
            if (isCorrect) score += 1;

            review.push({
                questionId: normalizedQuestionId,
                question: question.question,
                options: question.options,
                userAnswer,
                correctAnswer: question.correctAnswer,
                explanation: question.explanation,
                isCorrect,
            });

            if (!normalizedQuestionId.startsWith('csv-')) {
                persistedQuestionIds.push(normalizedQuestionId);
            }
        }

        const attemptedTotal = Number(totalQuestions) > 0 ? Number(totalQuestions) : review.length;
        const safeTotal = attemptedTotal > 0 ? attemptedTotal : review.length;
        const correctAnswers = score;
        const accuracy = safeTotal > 0 ? Number(((correctAnswers / safeTotal) * 100).toFixed(2)) : 0;

        await QuizAttempt.create({
            userId,
            module,
            answers: normalizedAnswers,
            score: correctAnswers,
            totalQuestions: safeTotal,
            correctAnswers,
            accuracy,
            category: normalizeCategory(category || 'Quantitative'),
            difficulty: normalizeDifficulty(difficulty || 'Medium'),
            questionIds: persistedQuestionIds,
        });

        const result = {
            score: correctAnswers,
            total: safeTotal,
            totalQuestions: safeTotal,
            correctAnswers,
            accuracy,
        };

        res.status(200).json({
            success: true,
            result,
            score: correctAnswers,
            totalQuestions: safeTotal,
            correctAnswers,
            accuracy,
            feedback: accuracy < 50 ? 'Needs Improvement' : 'Good Performance',
            review,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error submitting quiz', error: err.message });
    }
};

module.exports = { getQuestions, getQuestionsCount, submitQuiz };
