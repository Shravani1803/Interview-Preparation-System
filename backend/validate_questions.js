const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'questions.csv');
const content = fs.readFileSync(file, 'utf8').trimEnd();
const lines = content.split('\n');

function parseCSVLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

const header = lines[0];
const expectedHeader = 'question,optionA,optionB,optionC,optionD,correctAnswer,category,difficulty,explanation';
if (header !== expectedHeader) {
  console.log(`Header mismatch: ${header}`);
}

const data = lines.slice(1).map(parseCSVLine);
const allowedCategories = new Set(['Quantitative', 'Logical Reasoning', 'Verbal Ability']);
const allowedDifficulties = new Set(['Easy', 'Medium', 'Hard']);

let categoryCounts = { Quantitative: 0, 'Logical Reasoning': 0, 'Verbal Ability': 0 };
let difficultyCounts = { Easy: 0, Medium: 0, Hard: 0 };
let invalidCatDiffCount = 0;
let invalidCorrectInOptions = 0;

const questionMap = new Map();
for (const row of data) {
  const [question, optionA, optionB, optionC, optionD, correctAnswer, category, difficulty] = row;

  questionMap.set(question, (questionMap.get(question) || 0) + 1);

  if (categoryCounts[category] !== undefined) categoryCounts[category]++;
  if (difficultyCounts[difficulty] !== undefined) difficultyCounts[difficulty]++;

  if (!allowedCategories.has(category) || !allowedDifficulties.has(difficulty)) invalidCatDiffCount++;

  const options = [optionA, optionB, optionC, optionD];
  if (!options.includes(correctAnswer)) invalidCorrectInOptions++;
}

let duplicateQuestionCount = 0;
for (const cnt of questionMap.values()) {
  if (cnt > 1) duplicateQuestionCount += (cnt - 1);
}

console.log('1) total rows:', data.length);
console.log('2) category counts:', categoryCounts);
console.log('3) difficulty counts:', difficultyCounts);
console.log('4) duplicate question count:', duplicateQuestionCount);
console.log('5) invalid category/difficulty count:', invalidCatDiffCount);
console.log('6) rows where correctAnswer not in options:', invalidCorrectInOptions);
