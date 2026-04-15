const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

require('dotenv').config();
require('../Models/db');

const AptitudeQuestion = require('../Models/AptitudeQuestion');
const csvFilePaths = [
  path.join(__dirname, '..', 'questions.csv'),
  path.join(__dirname, '..', 'coding_questions.csv')
];

const FILE_MODULE_MAP = {
  'questions.csv': 'aptitude',
  'coding_questions.csv': 'coding',
};

const APTITUDE_CATEGORIES = new Set(['Quantitative', 'Logical', 'Verbal']);
const CODING_CATEGORIES = new Set(['C++', 'Java', 'Python']);

const normalizeValue = (value) => (value || '').trim();
const normalizeTitleCase = (value = '') => {
  const trimmed = normalizeValue(value);
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};
const normalizeQuestionKey = (value = '') => normalizeValue(value).toLowerCase().replace(/\s+/g, ' ');
const normalizeQuestion = (value = '') => normalizeValue(value).toLowerCase().replace(/\s+/g, ' ');

const resolveModuleFromPath = (filePath = '') => {
  const fileName = path.basename(filePath);
  return FILE_MODULE_MAP[fileName] || null;
};

const normalizeCategory = (value = '') => {
  const normalized = normalizeValue(value).toLowerCase();
  if (normalized === 'quantitative aptitude' || normalized === 'quantitative') return 'Quantitative';
  if (normalized === 'logical reasoning' || normalized === 'logical') return 'Logical';
  if (normalized === 'verbal ability' || normalized === 'verbal') return 'Verbal';
  if (normalized === 'c++' || normalized === 'c plus plus' || normalized === 'cpp') return 'C++';
  if (normalized === 'java') return 'Java';
  if (normalized === 'python') return 'Python';
  return '';
};

const normalizeDifficulty = (value = '') => {
  const normalized = normalizeTitleCase(value);
  if (normalized === 'Easy') return 'Easy';
  if (normalized === 'Medium') return 'Medium';
  if (normalized === 'Hard') return 'Hard';
  return '';
};

const inferModuleFromCategory = (category = '') => {
  if (CODING_CATEGORIES.has(category)) return 'coding';
  return 'aptitude';
};

const parseRow = (row, module) => {
  const values = Object.values(row).map((value) => normalizeValue(value));
  if (values.length < 9) return null;

  const explanation = values[values.length - 1];
  const difficulty = normalizeDifficulty(values[values.length - 2]);
  const category = normalizeCategory(values[values.length - 3]);
  const correctAnswer = values[values.length - 4];
  const optionD = values[values.length - 5];
  const optionC = values[values.length - 6];
  const optionB = values[values.length - 7];
  const optionA = values[values.length - 8];
  const question = values.slice(0, values.length - 8).join(', ').replace(/\s+,/g, ',').trim();

  if (!question || !optionA || !optionB || !optionC || !optionD || !correctAnswer || !category || !difficulty || !explanation) {
    return null;
  }

  const isValidCategory = module === 'coding'
    ? CODING_CATEGORIES.has(category)
    : APTITUDE_CATEGORIES.has(category);

  if (!isValidCategory) {
    return null;
  }

  if (![optionA, optionB, optionC, optionD].includes(correctAnswer)) {
    return null;
  }

  return {
    module,
    question,
    questionKey: normalizeQuestionKey(question),
    options: [optionA, optionB, optionC, optionD],
    correctAnswer,
    category,
    difficulty,
    explanation,
  };
};

const runImport = async () => {
  try {
    const parsedQuestions = [];

    for (const csvFilePath of csvFilePaths) {
      const module = resolveModuleFromPath(csvFilePath);
      if (!module) continue;

      await new Promise((resolve, reject) => {
        fs.createReadStream(csvFilePath)
          .pipe(csv())
          .on('data', (row) => {
            const parsedRow = parseRow(row, module);
            if (parsedRow) parsedQuestions.push(parsedRow);
          })
          .on('end', resolve)
          .on('error', reject);
      });
    }

    if (parsedQuestions.length === 0) {
      console.log('No valid questions found in CSV.');
      process.exit(0);
    }

    const existing = await AptitudeQuestion.find({}, { _id: 1, question: 1, category: 1, module: 1, createdAt: 1 }).sort({ createdAt: 1, _id: 1 }).lean();
    const existingMap = new Map();
    const duplicateIds = [];

    for (const item of existing) {
      const questionKey = normalizeQuestionKey(item.question);
      const module = item.module || inferModuleFromCategory(item.category);
      const key = `${module}::${questionKey}`;
      if (!key) continue;

      if (existingMap.has(key)) {
        duplicateIds.push(item._id);
      } else {
        existingMap.set(key, item._id);
      }
    }

    if (duplicateIds.length > 0) {
      await AptitudeQuestion.deleteMany({ _id: { $in: duplicateIds } });
    }

    const refreshDocs = await AptitudeQuestion.find({}, { _id: 1, question: 1, category: 1, module: 1 }).lean();
    if (refreshDocs.length > 0) {
      const keyBackfillOps = refreshDocs.map((item) => ({
        updateOne: {
          filter: { _id: item._id },
          update: {
            $set: {
              questionKey: normalizeQuestionKey(item.question),
              module: item.module || inferModuleFromCategory(item.category),
            },
          },
        },
      }));
      await AptitudeQuestion.bulkWrite(keyBackfillOps, { ordered: false });
    }

    await AptitudeQuestion.syncIndexes();

    const uniqueMap = new Map();
    for (const item of parsedQuestions) {
      const normalizedQuestion = normalizeQuestion(item.question);
      if (!normalizedQuestion) continue;

      const mapKey = `${item.module}::${normalizedQuestion}`;
      if (!uniqueMap.has(mapKey)) {
        uniqueMap.set(mapKey, {
          ...item,
          questionKey: normalizedQuestion,
        });
      }
    }

    const questions = [...uniqueMap.values()];
    const upsertOps = questions.map((item) => ({
      updateOne: {
        filter: { module: item.module, questionKey: item.questionKey },
        update: {
          $set: {
            module: item.module,
            question: item.question,
            questionKey: item.questionKey,
            options: item.options,
            correctAnswer: item.correctAnswer,
            category: item.category,
            difficulty: item.difficulty,
            explanation: item.explanation,
          },
        },
        upsert: true,
      },
    }));

    if (upsertOps.length > 0) {
      await AptitudeQuestion.bulkWrite(upsertOps, { ordered: false });
    }

    const moduleCounts = questions.reduce((acc, item) => {
      acc[item.module] = (acc[item.module] || 0) + 1;
      return acc;
    }, {});

    console.log(`Removed duplicate DB docs: ${duplicateIds.length}`);
    console.log(`Unique CSV questions processed: ${questions.length}`);
    console.log('Processed by module:', moduleCounts);
    console.log('Questions import sync completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to import questions:', error.message);
    process.exit(1);
  }
};

runImport();
