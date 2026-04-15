const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const FILES = [
  { filePath: path.join(__dirname, 'questions.csv'), module: 'aptitude' },
  { filePath: path.join(__dirname, 'coding_questions.csv'), module: 'coding' },
];

const ALLOWED = {
  aptitude: new Set(['Quantitative', 'Logical', 'Verbal']),
  coding: new Set(['C++', 'Java', 'Python']),
  difficulty: new Set(['Easy', 'Medium', 'Hard']),
};

const CATEGORY_KEYWORDS = {
  Quantitative: ['%', 'ratio', 'profit', 'loss', 'km', 'speed', 'interest', 'probability', 'average', 'distance'],
  Logical: ['series', 'pattern', 'puzzle', 'code', 'direction', 'blood relation', 'statement', 'conclusion', 'odd one'],
  Verbal: ['synonym', 'antonym', 'grammar', 'sentence', 'spelling', 'voice', 'fill in the blank', 'meaning'],
  'C++': ['cout', 'cin', 'pointer', 'virtual', 'destructor', 'header', 'scope resolution', 'template'],
  Java: ['system.out', 'extends', 'interface', 'jvm', 'string', 'thread', 'garbage collection'],
  Python: ['print(', 'def ', 'lambda', 'list', 'tuple', 'dictionary', 'docstring', 'yield', 'import'],
};

const COMPLEXITY_MARKERS = ['except', 'edge', 'multi-step', 'runtime', 'polymorphism', 'probability', 'derive', 'inference'];

const normalize = (value = '') => String(value).trim();
const normalizeQuestion = (value = '') => normalize(value).toLowerCase().replace(/\s+/g, ' ');

const tokenize = (value = '') =>
  normalize(value)
    .toLowerCase()
    .replace(/[^a-z0-9%+\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

const parseCsvFile = (filePath) =>
  new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });

const containsAnyKeyword = (text, keywords) => {
  const lower = normalize(text).toLowerCase();
  return keywords.some((word) => lower.includes(word));
};

const inferDifficulty = (row) => {
  const question = normalize(row.question).toLowerCase();
  const explanation = normalize(row.explanation).toLowerCase();
  const options = [row.optionA, row.optionB, row.optionC, row.optionD].map((item) => normalize(item));

  let score = 0;
  if (/\d/.test(question)) score += 1;
  if (question.includes(' and ') || question.includes(' if ')) score += 1;
  if (question.includes('find') || question.includes('which') || question.includes('what is the output')) score += 1;
  if (containsAnyKeyword(question, COMPLEXITY_MARKERS) || containsAnyKeyword(explanation, COMPLEXITY_MARKERS)) score += 2;
  if (options.some((opt) => opt.length > 24)) score += 1;

  if (score <= 2) return 'Easy';
  if (score <= 4) return 'Medium';
  return 'Hard';
};

const sharedTokenCount = (a, b) => {
  const aSet = new Set(tokenize(a));
  const bSet = new Set(tokenize(b));
  let count = 0;
  for (const token of aSet) {
    if (bSet.has(token)) count += 1;
  }
  return count;
};

const validateRows = (rows, module, report, filePath) => {
  const seenInFile = new Map();

  for (const row of rows) {
    const question = normalize(row.question);
    const category = normalize(row.category);
    const difficulty = normalize(row.difficulty);
    const explanation = normalize(row.explanation);
    const options = [normalize(row.optionA), normalize(row.optionB), normalize(row.optionC), normalize(row.optionD)];
    const correctAnswer = normalize(row.correctAnswer);
    const questionKey = normalizeQuestion(question);

    report.total += 1;
    report.categoryCounts[category] = (report.categoryCounts[category] || 0) + 1;
    report.difficultyCounts[difficulty] = (report.difficultyCounts[difficulty] || 0) + 1;

    if (!question || !category || !difficulty || !explanation || options.some((opt) => !opt) || !correctAnswer) {
      report.invalidStructure.push({ filePath, question });
      continue;
    }

    if (!ALLOWED[module].has(category)) {
      report.invalidCategory.push({ filePath, question, category });
    }

    if (!ALLOWED.difficulty.has(difficulty)) {
      report.invalidDifficultyValue.push({ filePath, question, difficulty });
    }

    if (!options.includes(correctAnswer)) {
      report.invalidCorrectAnswer.push({ filePath, question, correctAnswer });
    }

    const ownKeywords = CATEGORY_KEYWORDS[category] || [];
    const otherCategoryWords = Object.entries(CATEGORY_KEYWORDS)
      .filter(([name]) => name !== category)
      .flatMap(([, words]) => words);

    const ownHits = containsAnyKeyword(question, ownKeywords) ? 1 : 0;
    const wrongHits = containsAnyKeyword(question, otherCategoryWords) ? 1 : 0;

    if (ownHits === 0 && wrongHits > 0) {
      report.categoryMismatches.push({ filePath, question, category });
      console.log('❌ Wrong category:', question);
    }

    const inferredDifficulty = inferDifficulty(row);
    if (difficulty !== inferredDifficulty) {
      report.difficultyMismatches.push({ filePath, question, difficulty, inferredDifficulty });
    }

    const overlap = sharedTokenCount(question, explanation);
    if (overlap < 2) {
      report.explanationMismatches.push({ filePath, question });
    }

    if (seenInFile.has(questionKey)) {
      report.duplicates.push({
        filePath,
        question,
        firstAt: seenInFile.get(questionKey),
      });
    } else {
      seenInFile.set(questionKey, filePath);
    }

    if (report.globalQuestionMap.has(questionKey)) {
      report.globalDuplicates.push({
        question,
        current: filePath,
        previous: report.globalQuestionMap.get(questionKey),
      });
    } else {
      report.globalQuestionMap.set(questionKey, filePath);
    }
  }
};

const run = async () => {
  const report = {
    total: 0,
    categoryCounts: {},
    difficultyCounts: {},
    invalidStructure: [],
    invalidCategory: [],
    invalidDifficultyValue: [],
    invalidCorrectAnswer: [],
    categoryMismatches: [],
    difficultyMismatches: [],
    duplicates: [],
    globalDuplicates: [],
    explanationMismatches: [],
    globalQuestionMap: new Map(),
  };

  for (const entry of FILES) {
    const rows = await parseCsvFile(entry.filePath);
    validateRows(rows, entry.module, report, path.basename(entry.filePath));
  }

  console.log('\n===== VALIDATION SUMMARY =====');
  console.log('Total rows scanned:', report.total);
  console.log('Category counts:', report.categoryCounts);
  console.log('Difficulty counts:', report.difficultyCounts);
  console.log('Invalid structure rows:', report.invalidStructure.length);
  console.log('Invalid category values:', report.invalidCategory.length);
  console.log('Invalid difficulty values:', report.invalidDifficultyValue.length);
  console.log('Correct answer not in options:', report.invalidCorrectAnswer.length);
  console.log('Category heuristic mismatches:', report.categoryMismatches.length);
  console.log('Difficulty heuristic mismatches:', report.difficultyMismatches.length);
  console.log('File-level duplicate questions:', report.duplicates.length);
  console.log('Cross-file duplicate questions:', report.globalDuplicates.length);
  console.log('Question-explanation weak alignment:', report.explanationMismatches.length);

  if (report.duplicates.length > 0) {
    console.log('\nPotential duplicate questions:');
    report.duplicates.slice(0, 25).forEach((item) => {
      console.log(`- [${item.filePath}] ${item.question}`);
    });
  }

  if (report.difficultyMismatches.length > 0) {
    console.log('\nPotential difficulty mismatches:');
    report.difficultyMismatches.slice(0, 25).forEach((item) => {
      console.log(`- [${item.filePath}] (${item.difficulty} -> ${item.inferredDifficulty}) ${item.question}`);
    });
  }
};

run().catch((error) => {
  console.error('Validation failed:', error.message);
  process.exit(1);
});
