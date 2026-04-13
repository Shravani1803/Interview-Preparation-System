const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const AptitudeQuestion = require('../Models/AptitudeQuestion');
const QuizAttempt = require('../Models/QuizAttempt');

const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const CSV_FILE_PATH = path.join(__dirname, '..', 'questions.csv');

let csvQuestionCache = [];
let csvQuestionMap = new Map();
let csvLoadPromise = null;
let csvCacheMeta = {
    mtimeMs: 0,
    size: 0,
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

const buildCategoryRegex = (value = '') => {
    const normalized = normalizeCategory(value);

    if (normalized === 'Quantitative') {
        return /^(Quantitative|Quantitative Aptitude)$/i;
    }

    if (normalized === 'Logical') {
        return /^(Logical|Logical Reasoning)$/i;
    }

    if (normalized === 'Verbal') {
        return /^(Verbal|Verbal Ability)$/i;
    }

    if (normalized === 'C++') {
        return /^(C\+\+|CPP|C Plus Plus)$/i;
    }

    if (normalized === 'Java') {
        return /^Java$/i;
    }

    if (normalized === 'Python') {
        return /^Python$/i;
    }

    return new RegExp(`^${escapeRegex(normalized)}$`, 'i');
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

const loadCsvQuestions = async () => {
    let fileStats;
    try {
        fileStats = await fs.promises.stat(CSV_FILE_PATH);
    } catch (error) {
        throw new Error(`Unable to read CSV file at ${CSV_FILE_PATH}`);
    }

    const isCacheFresh =
        csvQuestionCache.length > 0 &&
        csvCacheMeta.mtimeMs === fileStats.mtimeMs &&
        csvCacheMeta.size === fileStats.size;

    if (isCacheFresh) {
        return { list: csvQuestionCache, map: csvQuestionMap };
    }

    if (csvLoadPromise) {
        return csvLoadPromise;
    }

    csvLoadPromise = new Promise((resolve, reject) => {
        const rows = [];
        const rowMap = new Map();
        let index = 0;

        fs.createReadStream(CSV_FILE_PATH)
            .pipe(csv())
            .on('data', (row) => {
                const question = String(row.question || '').trim();
                const optionA = String(row.optionA || '').trim();
                const optionB = String(row.optionB || '').trim();
                const optionC = String(row.optionC || '').trim();
                const optionD = String(row.optionD || '').trim();
                const correctAnswer = String(row.correctAnswer || '').trim();
                const category = normalizeCategory(row.category || '');
                const difficulty = normalizeDifficulty(row.difficulty || '');
                const explanation = String(row.explanation || '').trim();
                const options = [optionA, optionB, optionC, optionD];

                if (!question || !optionA || !optionB || !optionC || !optionD || !correctAnswer || !category || !difficulty || !explanation) {
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
                    explanation,
                };

                rows.push(item);
                rowMap.set(csvId, item);
            })
            .on('end', () => {
                csvQuestionCache = rows;
                csvQuestionMap = rowMap;
                csvCacheMeta = {
                    mtimeMs: fileStats.mtimeMs,
                    size: fileStats.size,
                };
                csvLoadPromise = null;
                resolve({ list: csvQuestionCache, map: csvQuestionMap });
            })
            .on('error', (error) => {
                csvLoadPromise = null;
                reject(error);
            });
    });

    return csvLoadPromise;
};

const filterCsvQuestions = (questions, category, difficulty) => {
    const requestedCategory = String(category || '').trim().toLowerCase();
    const requestedDifficulty = String(difficulty || '').trim().toLowerCase();

    return questions.filter((item) => {
        const categoryMatch = requestedCategory ? item.category.toLowerCase() === requestedCategory : true;
        const difficultyMatch = requestedDifficulty ? item.difficulty.toLowerCase() === requestedDifficulty : true;
        return categoryMatch && difficultyMatch;
    });
};

const buildCaseInsensitiveFieldFilter = (value = '') => {
    const normalized = String(value).trim();
    if (!normalized) return null;

    return {
        $regex: `^${escapeRegex(normalized)}$`,
        $options: 'i',
    };
};

const buildFilter = ({ category, difficulty }) => {
    const filter = {};

    if (category) {
        filter.category = buildCaseInsensitiveFieldFilter(category);
    }

    if (difficulty) {
        filter.difficulty = buildCaseInsensitiveFieldFilter(difficulty);
    }

    return filter;
};

const getQuestionsCount = async (req, res) => {
    try {
        const category = req.query.category;
        const difficulty = req.query.difficulty;

        const filter = buildFilter({ category, difficulty });

        console.log('Count request values:', category, difficulty);

        const dbQuestionDocs = await AptitudeQuestion.find(filter, { question: 1, _id: 0 }).lean();
        const { list } = await loadCsvQuestions();
        const csvFiltered = filterCsvQuestions(list, category, difficulty);

        const uniqueQuestionSet = new Set();

        dbQuestionDocs.forEach((item) => {
            const key = String(item.question || '').trim().toLowerCase();
            if (key) uniqueQuestionSet.add(key);
        });

        csvFiltered.forEach((item) => {
            const key = String(item.question || '').trim().toLowerCase();
            if (key) uniqueQuestionSet.add(key);
        });

        const dbCount = dbQuestionDocs.length;
        const csvCount = csvFiltered.length;
        const finalCount = uniqueQuestionSet.size;

        console.log('Count result from DB:', dbCount, 'CSV:', csvCount, 'Final:', finalCount);

        res.status(200).json({
            success: true,
            count: finalCount,
            source: dbCount >= csvCount ? 'db' : 'csv',
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching question count', error: err.message });
    }
};

// GET all questions or filtered by category/difficulty
const getQuestions = async (req, res) => {
    try {
        console.log('Requested:', req.query);
        const category = req.query.category;
        const difficulty = req.query.difficulty;
        const limit = Number.parseInt(req.query.limit, 10) || 15;

        const parsedLimit = limit;
        if (Number.isNaN(parsedLimit) || parsedLimit <= 0 || parsedLimit > 100) {
            return res.status(400).json({ success: false, message: 'Limit must be between 1 and 100' });
        }

        const filter = buildFilter({ category, difficulty });

        console.log('Query values:', category, difficulty);

        const dbCount = await AptitudeQuestion.countDocuments(filter);
        const { list } = await loadCsvQuestions();
        const filteredCsv = filterCsvQuestions(list, category, difficulty);
        const csvCount = filteredCsv.length;

        const dbSampleSize = dbCount > 0 ? Math.min(parsedLimit, dbCount) : 0;
        const dbCandidates = dbSampleSize > 0
            ? await AptitudeQuestion.aggregate([
                { $match: filter },
                { $sample: { size: dbSampleSize } },
                {
                    $project: {
                        question: 1,
                        options: 1,
                        category: 1,
                        difficulty: 1,
                    },
                },
            ])
            : [];

        const usedSignatures = new Set();
        const dbQuestions = pickDiverseQuestions(dbCandidates, Math.min(parsedLimit, dbCandidates.length), usedSignatures);

        let questions = [...dbQuestions];
        const requiredFromCsv = Math.max(parsedLimit - questions.length, 0);

        if (requiredFromCsv > 0 && csvCount > 0) {
            const dbQuestionTextSet = new Set(dbQuestions.map((item) => String(item.question || '').trim().toLowerCase()));
            const csvCandidates = filteredCsv
                .filter((item) => !dbQuestionTextSet.has(String(item.question || '').trim().toLowerCase()))
                .sort(() => Math.random() - 0.5)
                .map((item) => ({
                    _id: item._id,
                    question: item.question,
                    options: item.options,
                    category: item.category,
                    difficulty: item.difficulty,
                }));

            const csvQuestions = pickDiverseQuestions(csvCandidates, requiredFromCsv, usedSignatures);

            questions = [...dbQuestions, ...csvQuestions];
        }

        const dbQuestionDocs = await AptitudeQuestion.find(filter, { question: 1, _id: 0 }).lean();
        const uniqueQuestionSet = new Set();

        dbQuestionDocs.forEach((item) => {
            const key = String(item.question || '').trim().toLowerCase();
            if (key) uniqueQuestionSet.add(key);
        });

        filteredCsv.forEach((item) => {
            const key = String(item.question || '').trim().toLowerCase();
            if (key) uniqueQuestionSet.add(key);
        });

        const totalAvailable = uniqueQuestionSet.size;
        const finalLimit = Math.min(parsedLimit, totalAvailable);
        const source = dbQuestions.length > 0 && questions.length > dbQuestions.length
            ? 'db+csv'
            : dbQuestions.length > 0
                ? 'db'
                : 'csv';

        console.log('Limit received:', parsedLimit);
        console.log('Found questions:', questions.length, 'Requested:', parsedLimit, 'Available(DB):', dbCount, 'Available(CSV):', csvCount, 'Source:', source);

        res.status(200).json({
            success: true,
            questions,
            requestedLimit: parsedLimit,
            finalLimit,
            totalAvailable,
            actualCount: questions.length,
            source,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching questions', error: err.message });
    }
};

// POST submit quiz answers — evaluate and save performance
const submitQuiz = async (req, res) => {
    try {
        const { answers, questionIds, category, difficulty } = req.body;
        const userId = req.user._id;

        if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
            return res.status(400).json({ success: false, message: 'Answers must be an object of questionId to selected option' });
        }

        if (!Array.isArray(questionIds) || questionIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Question IDs are required' });
        }

        const { map: csvMap } = await loadCsvQuestions();
        const questionMap = new Map();
        const dbQuestionIds = [];

        for (const questionId of questionIds) {
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

        for (const questionId of questionIds) {
            const normalizedQuestionId = String(questionId);
            const question = questionMap.get(normalizedQuestionId);
            if (!question) continue;

            const userAnswer = answers[normalizedQuestionId] || '';
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

        const totalQuestions = review.length;
        const accuracy = totalQuestions > 0 ? Number(((score / totalQuestions) * 100).toFixed(2)) : 0;

        await QuizAttempt.create({
            userId,
            answers: normalizedAnswers,
            score,
            accuracy,
            category: normalizeCategory(category || 'Quantitative'),
            difficulty: normalizeDifficulty(difficulty || 'Medium'),
            questionIds: persistedQuestionIds,
        });

        res.status(200).json({
            success: true,
            score,
            totalQuestions,
            correctAnswers: score,
            accuracy,
            feedback: accuracy < 50 ? 'Needs Improvement' : 'Good Performance',
            review,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error submitting quiz', error: err.message });
    }
};

module.exports = { getQuestions, getQuestionsCount, submitQuiz };
