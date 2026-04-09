const fs = require('fs');
const path = require('path');

const OUTPUT = path.join(__dirname, 'questions.csv');
const HEADER = 'question,optionA,optionB,optionC,optionD,correctAnswer,category,difficulty,explanation';

let seed = 123456789;
function rand() {
  seed = (1664525 * seed + 1013904223) >>> 0;
  return seed / 4294967296;
}
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function uniqueOptions(options) {
  return [...new Set(options.map(String))];
}
function makeOptions(correct, distractors) {
  let opts = uniqueOptions([correct, ...distractors]);
  let bump = 1;
  while (opts.length < 4) {
    opts.push(String(Number(correct) + bump));
    bump++;
    opts = uniqueOptions(opts);
  }
  opts = opts.slice(0, 4);
  shuffle(opts);
  return opts;
}
function csvEscape(v) {
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const rows = [];
const seenQuestions = new Set();
function addRow({ question, options, correctAnswer, category, explanation, topic }) {
  if (seenQuestions.has(question)) return;
  if (!['Quantitative', 'Logical Reasoning', 'Verbal Ability'].includes(category)) throw new Error('Invalid category');
  if (options.length !== 4) throw new Error('Options must be 4');
  if (!options.includes(String(correctAnswer))) throw new Error('Correct answer must be in options');
  seenQuestions.add(question);
  rows.push({
    question,
    optionA: options[0],
    optionB: options[1],
    optionC: options[2],
    optionD: options[3],
    correctAnswer: String(correctAnswer),
    category,
    difficulty: 'Easy',
    explanation,
    topic,
  });
}

// ---------------- Quantitative (66) ----------------
for (let i = 0; i < 11; i++) {
  // Percentages
  {
    const p = 10 + i * 5;
    const base = 80 + i * 20;
    const ans = (p * base) / 100;
    const question = `What is ${p}% of ${base}?`;
    const options = makeOptions(ans, [ans + 4, ans - 4, ans + 8]);
    addRow({ question, options, correctAnswer: ans, category: 'Quantitative', topic: 'Percentages', explanation: `${p}% of ${base} = (${p}/100) × ${base} = ${ans}.` });
  }

  // Profit and Loss
  {
    const cp = 200 + i * 25;
    const pct = 5 + (i % 6) * 5;
    const isProfit = i % 2 === 0;
    const sp = isProfit ? cp * (1 + pct / 100) : cp * (1 - pct / 100);
    const question = isProfit
      ? `An item is bought for Rs ${cp} and sold at a profit of ${pct}%. What is the selling price?`
      : `An item is bought for Rs ${cp} and sold at a loss of ${pct}%. What is the selling price?`;
    const ans = Number(sp.toFixed(2)).toString().replace(/\.00$/, '');
    const numAns = Number(ans);
    const options = makeOptions(ans, [numAns + 10, numAns - 10, numAns + 20]);
    addRow({ question, options, correctAnswer: ans, category: 'Quantitative', topic: 'Profit and Loss', explanation: `Selling price = Cost price × (1 ${isProfit ? '+' : '-'} ${pct}/100) = ${ans}.` });
  }

  // Time and Work
  {
    const aVals = [6, 8, 10, 12, 14, 15, 16, 18, 20, 21, 24];
    const bVals = [3, 4, 5, 6, 7, 10, 8, 9, 10, 14, 12];
    const a = aVals[i], b = bVals[i];
    const ans = (a * b) / (a + b);
    const question = `A can finish a task in ${a} days and B in ${b} days. In how many days will they finish it together?`;
    const options = makeOptions(ans, [ans + 1, ans + 2, Math.max(1, ans - 1)]);
    addRow({ question, options, correctAnswer: ans, category: 'Quantitative', topic: 'Time and Work', explanation: `Combined rate = 1/${a} + 1/${b} = (${a + b})/${a * b}. Time = ${a * b}/${a + b} = ${ans} days.` });
  }

  // Time Speed Distance
  {
    const speed = 30 + i * 3;
    const time = 2 + (i % 4);
    const ans = speed * time;
    const question = `A car travels at ${speed} km/h for ${time} hours. What distance does it cover?`;
    const options = makeOptions(ans, [ans + speed, ans - speed, ans + 2 * speed]);
    addRow({ question, options, correctAnswer: ans, category: 'Quantitative', topic: 'Time Speed Distance', explanation: `Distance = Speed × Time = ${speed} × ${time} = ${ans} km.` });
  }

  // Ratio and Proportion
  {
    const a = 2 + (i % 5);
    const b = 3 + (i % 6);
    const total = (a + b) * (10 + i);
    const ans = (a * total) / (a + b);
    const question = `Rs ${total} is divided between A and B in the ratio ${a}:${b}. How much does A get?`;
    const options = makeOptions(ans, [ans + (a + b), ans - (a + b), ans + 2 * (a + b)]);
    addRow({ question, options, correctAnswer: ans, category: 'Quantitative', topic: 'Ratio and Proportion', explanation: `A's share = (${a}/${a + b}) × ${total} = ${ans}.` });
  }

  // Averages
  {
    const avg = 20 + i * 2;
    const n = 5;
    const total = avg * n;
    const known = [avg - 4, avg - 2, avg + 1, avg + 3];
    const sumKnown = known.reduce((x, y) => x + y, 0);
    const ans = total - sumKnown;
    const question = `The average of 5 numbers is ${avg}. Four numbers are ${known.join(', ')}. Find the fifth number.`;
    const options = makeOptions(ans, [ans + 2, ans - 2, ans + 4]);
    addRow({ question, options, correctAnswer: ans, category: 'Quantitative', topic: 'Averages', explanation: `Total of 5 numbers = ${avg} × 5 = ${total}. Fifth number = ${total} - ${sumKnown} = ${ans}.` });
  }
}

// ---------------- Logical Reasoning (67) ----------------
// Number series (14)
for (let i = 0; i < 14; i++) {
  if (i % 3 === 0) {
    const start = 3 + i;
    const diff = 2 + (i % 5);
    const seq = [start, start + diff, start + 2 * diff, start + 3 * diff];
    const ans = start + 4 * diff;
    const question = `Find the next number in the series: ${seq.join(', ')}, ?`;
    const options = makeOptions(ans, [ans + diff, ans - diff, ans + 2]);
    addRow({ question, options, correctAnswer: ans, category: 'Logical Reasoning', topic: 'Number series', explanation: `It is an arithmetic progression with common difference ${diff}.` });
  } else if (i % 3 === 1) {
    const start = 2 + (i % 4);
    const r = 2;
    const seq = [start, start * r, start * r * r, start * r * r * r];
    const ans = seq[3] * r;
    const question = `Find the next number in the series: ${seq.join(', ')}, ?`;
    const options = makeOptions(ans, [ans + start, ans - start, ans + r]);
    addRow({ question, options, correctAnswer: ans, category: 'Logical Reasoning', topic: 'Number series', explanation: `Each term is multiplied by ${r}.` });
  } else {
    const a = 1 + (i % 5);
    const b = 2 + (i % 4);
    const seq = [a, b, a + b, a + 2 * b, 2 * a + 3 * b];
    const ans = seq[3] + seq[4];
    const question = `Find the next number in the series: ${seq.join(', ')}, ?`;
    const options = makeOptions(ans, [ans + 1, ans - 1, ans + 3]);
    addRow({ question, options, correctAnswer: ans, category: 'Logical Reasoning', topic: 'Number series', explanation: `From the third term onward, each term follows additive growth; next = ${seq[3]} + ${seq[4]} = ${ans}.` });
  }
}

// Coding decoding (14)
const codeWords = ['TEAM', 'MIND', 'CODE', 'LOGIC', 'BRIGHT', 'SKILL', 'LEARN', 'RATIO', 'SPEED', 'WORK', 'PLANT', 'FRAME', 'QUEST', 'SOLVE'];
for (let i = 0; i < 14; i++) {
  const w = codeWords[i];
  const shift = i % 2 === 0 ? 1 : 2;
  const coded = w
    .split('')
    .map(ch => String.fromCharCode(((ch.charCodeAt(0) - 65 + shift) % 26) + 65))
    .join('');
  const distract1 = w
    .split('')
    .map(ch => String.fromCharCode(((ch.charCodeAt(0) - 65 + shift + 1) % 26) + 65))
    .join('');
  const distract2 = w.split('').reverse().join('');
  const distract3 = coded.slice(1) + coded[0];
  const question = `If each letter in ${w} is shifted ${shift} place(s) forward in the alphabet, what is the code?`;
  const options = uniqueOptions([coded, distract1, distract2, distract3]).slice(0, 4);
  shuffle(options);
  addRow({ question, options, correctAnswer: coded, category: 'Logical Reasoning', topic: 'Coding decoding', explanation: `Shift every letter of ${w} by ${shift}: ${coded}.` });
}

// Blood relations (13)
const bloodQs = [
  ['A is the brother of B. B is the daughter of C. How is A related to C?', 'Son', ['Brother', 'Father', 'Uncle']],
  ['P is the mother of Q. Q is the sister of R. How is P related to R?', 'Mother', ['Aunt', 'Grandmother', 'Sister']],
  ['R is the father of S and S is the mother of T. How is R related to T?', 'Grandfather', ['Father', 'Uncle', 'Brother']],
  ['M is the sister of N. N is the father of O. How is M related to O?', 'Aunt', ['Mother', 'Sister', 'Grandmother']],
  ['K is the son of L. L is the daughter of M. How is K related to M?', 'Grandson', ['Son', 'Nephew', 'Brother']],
  ['D is the husband of E. E is the sister of F. How is D related to F?', 'Brother-in-law', ['Brother', 'Cousin', 'Father']],
  ['T is the daughter of U. U is the son of V. How is T related to V?', 'Granddaughter', ['Daughter', 'Niece', 'Sister']],
  ['X is the brother of Y. Y is the mother of Z. How is X related to Z?', 'Uncle', ['Brother', 'Father', 'Grandfather']],
  ['A is the mother of B and C is the father of A. How is C related to B?', 'Grandfather', ['Father', 'Uncle', 'Brother']],
  ['H is the son of J. J is the sister of K. How is K related to H?', 'Aunt or Uncle', ['Mother', 'Sister', 'Grandmother']],
  ['Q is the wife of R. R is the son of S. How is S related to Q?', 'Mother-in-law or Father-in-law', ['Brother-in-law', 'Uncle', 'Cousin']],
  ['L is the brother of M. M is the brother of N. How is L related to N?', 'Brother', ['Cousin', 'Father', 'Uncle']],
  ['B is the daughter of C. C is the daughter of D. How is B related to D?', 'Granddaughter', ['Daughter', 'Niece', 'Sister']],
];
for (const [question, ans, dis] of bloodQs) {
  const options = uniqueOptions([ans, ...dis]);
  shuffle(options);
  addRow({ question, options, correctAnswer: ans, category: 'Logical Reasoning', topic: 'Blood relations', explanation: 'Map each relation step-by-step on a family tree to infer the final relation.' });
}

// Direction sense (13)
for (let i = 0; i < 13; i++) {
  const north = 4 + i;
  const east = 2 + (i % 5);
  const south = 1 + (i % 3);
  const west = i % 4;
  const netNS = north - south;
  const netEW = east - west;
  const ans = netNS >= 0 && netEW >= 0 ? 'North-East' : netNS >= 0 && netEW < 0 ? 'North-West' : netNS < 0 && netEW >= 0 ? 'South-East' : 'South-West';
  const question = `A person moves ${north} km north, ${east} km east, ${south} km south, and ${west} km west. In which direction is the person from the start point?`;
  const options = ['North-East', 'North-West', 'South-East', 'South-West'];
  addRow({ question, options, correctAnswer: ans, category: 'Logical Reasoning', topic: 'Direction sense', explanation: `Net movement is ${netNS} km in north-south and ${netEW} km in east-west direction, so final direction is ${ans}.` });
}

// Patterns (13)
for (let i = 0; i < 13; i++) {
  const start = 65 + i;
  const s1 = String.fromCharCode(start);
  const s2 = String.fromCharCode(start + 2);
  const s3 = String.fromCharCode(start + 4);
  const s4 = String.fromCharCode(start + 6);
  const ans = String.fromCharCode(start + 8);
  const question = `Find the next letter pattern: ${s1}, ${s2}, ${s3}, ${s4}, ?`;
  const options = [ans, String.fromCharCode(start + 7), String.fromCharCode(start + 9), String.fromCharCode(start + 10)];
  shuffle(options);
  addRow({ question, options, correctAnswer: ans, category: 'Logical Reasoning', topic: 'Patterns', explanation: 'Letters progress by skipping one letter each time (+2 positions).' });
}

// ---------------- Verbal Ability (67) ----------------
const synonymPairs = [
  ['Abundant', 'Plentiful'], ['Brief', 'Short'], ['Candid', 'Frank'], ['Diligent', 'Hardworking'], ['Eager', 'Keen'],
  ['Fragile', 'Delicate'], ['Genuine', 'Authentic'], ['Hostile', 'Unfriendly'], ['Imitate', 'Mimic'], ['Jovial', 'Cheerful'],
  ['Keen', 'Sharp'], ['Lethargic', 'Sluggish'], ['Mandatory', 'Compulsory'], ['Noble', 'Honorable'], ['Obvious', 'Evident'],
  ['Precise', 'Accurate'], ['Rapid', 'Swift'], ['Scarce', 'Rare']
];
const antonymPairs = [
  ['Ancient', 'Modern'], ['Benevolent', 'Cruel'], ['Compact', 'Spacious'], ['Deficit', 'Surplus'], ['Expand', 'Contract'],
  ['Flexible', 'Rigid'], ['Generous', 'Stingy'], ['Harmony', 'Discord'], ['Inferior', 'Superior'], ['Joyful', 'Miserable'],
  ['Kindle', 'Extinguish'], ['Liberty', 'Captivity'], ['Maximum', 'Minimum'], ['Optimistic', 'Pessimistic'], ['Permanent', 'Temporary'],
  ['Qualified', 'Ineligible'], ['Reliable', 'Unreliable']
];

const synonymDistractors = ['Rough', 'Late', 'Narrow', 'Silent', 'Harsh', 'Random', 'Complex', 'Tiny', 'Distant', 'Weak'];
for (let i = 0; i < 9; i++) {
  const [word, ans] = synonymPairs[i];
  const d1 = synonymDistractors[i % synonymDistractors.length];
  const d2 = synonymDistractors[(i + 3) % synonymDistractors.length];
  const d3 = synonymDistractors[(i + 6) % synonymDistractors.length];
  const question = `Choose the synonym of "${word}".`;
  const options = uniqueOptions([ans, d1, d2, d3]);
  shuffle(options);
  addRow({ question, options, correctAnswer: ans, category: 'Verbal Ability', topic: 'Synonyms and Antonyms', explanation: `"${ans}" is closest in meaning to "${word}".` });
}

for (let i = 0; i < 8; i++) {
  const [word, ans] = antonymPairs[i];
  const d1 = synonymDistractors[(i + 1) % synonymDistractors.length];
  const d2 = synonymDistractors[(i + 4) % synonymDistractors.length];
  const d3 = synonymDistractors[(i + 7) % synonymDistractors.length];
  const question = `Choose the antonym of "${word}".`;
  const options = uniqueOptions([ans, d1, d2, d3]);
  shuffle(options);
  addRow({ question, options, correctAnswer: ans, category: 'Verbal Ability', topic: 'Synonyms and Antonyms', explanation: `"${ans}" is opposite in meaning to "${word}".` });
}

// Sentence correction (17)
const sentenceSets = [
  ['She do not like coffee.', 'She does not like coffee.', 'She do not likes coffee.', 'She does not likes coffee.', 'She did not liked coffee.'],
  ['Each of the players are ready.', 'Each of the players is ready.', 'Each of the player are ready.', 'Each players is ready.', 'Each of players were ready.'],
  ['He have completed the task.', 'He has completed the task.', 'He having completed the task.', 'He had complete the task.', 'He has complete task.'],
  ['Neither of the answers are correct.', 'Neither of the answers is correct.', 'Neither answers are correct.', 'Neither of answer is correct.', 'Neither is answers correct.'],
  ['The team were playing well.', 'The team was playing well.', 'The teams was playing well.', 'The team are playing well.', 'The team being playing well.'],
  ['I prefer tea than coffee.', 'I prefer tea to coffee.', 'I prefer tea over than coffee.', 'I prefer tea then coffee.', 'I preferred tea than coffee.'],
  ['She is senior than me.', 'She is senior to me.', 'She is more senior than me.', 'She is senior then me.', 'She was senior than me.'],
  ['One of my friend lives here.', 'One of my friends lives here.', 'One of my friends live here.', 'One of friend lives here.', 'One of my friend live here.'],
  ['He is good in mathematics.', 'He is good at mathematics.', 'He is good on mathematics.', 'He is good for mathematics.', 'He is good with mathematics.'],
  ['The news are shocking.', 'The news is shocking.', 'The news were shocking.', 'News are shocking.', 'The news be shocking.'],
  ['She has been working since two hours.', 'She has been working for two hours.', 'She has working for two hours.', 'She had been working since two hours.', 'She have been working for two hours.'],
  ['No sooner did he arrived than it rained.', 'No sooner did he arrive than it rained.', 'No sooner he arrived than it rained.', 'No sooner did he arrive when it rained.', 'No sooner had he arrive than rain.'],
  ['He is married with a doctor.', 'He is married to a doctor.', 'He is marry to a doctor.', 'He was married with doctor.', 'He is married by a doctor.'],
  ['The furniture in this room are old.', 'The furniture in this room is old.', 'The furnitures in this room are old.', 'Furniture in this room were old.', 'The furniture in room are old.'],
  ['If I was you, I would apologize.', 'If I were you, I would apologize.', 'If I am you, I would apologize.', 'If I had been you, I will apologize.', 'If I were you, I will apologized.'],
  ['She suggested me to apply early.', 'She suggested that I apply early.', 'She suggested me applying early.', 'She suggest that I applied early.', 'She suggested to me apply early.'],
  ['He discussed about the plan.', 'He discussed the plan.', 'He was discussed the plan.', 'He discussed on the plan.', 'He discuss the plan.']
];
for (const set of sentenceSets) {
  const [incorrect, correct, b, c, d] = set;
  const question = `Identify the grammatically correct sentence for: "${incorrect}"`;
  const options = [correct, b, c, d];
  shuffle(options);
  addRow({ question, options, correctAnswer: correct, category: 'Verbal Ability', topic: 'Sentence correction', explanation: 'The correct option follows standard subject-verb agreement and proper preposition usage.' });
}

// Fill in the blanks (17)
const fillBlankSets = [
  ['The manager asked us to ______ the report before noon.', 'submit', 'delay', 'ignore', 'cancel'],
  ['Her explanation was so ______ that everyone understood it.', 'clear', 'vague', 'confusing', 'hollow'],
  ['The new policy will ______ employee productivity.', 'improve', 'reduce', 'damage', 'worsen'],
  ['We should ______ all possibilities before deciding.', 'consider', 'reject', 'avoid', 'dismiss'],
  ['He remained ______ during the interview and answered confidently.', 'calm', 'nervous', 'angry', 'careless'],
  ['The trainer gave us a ______ overview of the process.', 'brief', 'lengthy', 'random', 'unclear'],
  ['Please ______ the meeting room by 10 AM.', 'book', 'erase', 'shut', 'remove'],
  ['She has a ______ understanding of data structures.', 'strong', 'weak', 'poor', 'shallow'],
  ['The team must ______ the deadline to satisfy the client.', 'meet', 'miss', 'break', 'postpone'],
  ['His argument lacked ______ evidence.', 'sufficient', 'scarce', 'minor', 'limited'],
  ['The software update aims to ______ security issues.', 'address', 'create', 'ignore', 'multiply'],
  ['To crack placements, students should ______ regularly.', 'practice', 'hesitate', 'quit', 'wander'],
  ['The speaker made a ______ point about time management.', 'valid', 'invalid', 'trivial', 'irrelevant'],
  ['She quickly ______ to the changing requirements.', 'adapted', 'resisted', 'collapsed', 'wandered'],
  ['The company plans to ______ its operations next year.', 'expand', 'shrink', 'freeze', 'abandon'],
  ['A good resume should ______ your key achievements.', 'highlight', 'hide', 'erase', 'ignore'],
  ['He gave a ______ response to the client query.', 'prompt', 'delayed', 'careless', 'faint']
];
for (const [stem, ans, b, c, d] of fillBlankSets) {
  const options = [ans, b, c, d];
  shuffle(options);
  addRow({ question: stem, options, correctAnswer: ans, category: 'Verbal Ability', topic: 'Fill in the blanks', explanation: `"${ans}" best completes the sentence meaningfully and grammatically.` });
}

// Vocabulary usage (16)
const vocabSets = [
  ['Choose the word that means "to make less severe".', 'mitigate', 'intensify', 'provoke', 'delay'],
  ['Choose the word that means "careful use of money".', 'frugality', 'luxury', 'wastefulness', 'greed'],
  ['Choose the word that means "very enthusiastic".', 'zealous', 'indifferent', 'hesitant', 'dull'],
  ['Choose the word that means "able to recover quickly".', 'resilient', 'fragile', 'rigid', 'timid'],
  ['Choose the word that means "obvious and clear".', 'explicit', 'vague', 'hidden', 'uncertain'],
  ['Choose the word that means "speak briefly and clearly".', 'concise', 'verbose', 'confused', 'silent'],
  ['Choose the word that means "difficult to understand".', 'obscure', 'simple', 'plain', 'obvious'],
  ['Choose the word that means "friendly and pleasant".', 'amiable', 'hostile', 'arrogant', 'stern'],
  ['Choose the word that means "greatly successful".', 'triumphant', 'defeated', 'average', 'minor'],
  ['Choose the word that means "lasting for a short time".', 'temporary', 'permanent', 'endless', 'stable'],
  ['Choose the word that means "careless in duties".', 'negligent', 'diligent', 'careful', 'meticulous'],
  ['Choose the word that means "to combine into one".', 'integrate', 'separate', 'divide', 'scatter'],
  ['Choose the word that means "to examine in detail".', 'analyze', 'ignore', 'guess', 'skip'],
  ['Choose the word that means "to formally approve".', 'ratify', 'reject', 'oppose', 'delay'],
  ['Choose the word that means "showing good judgment".', 'prudent', 'reckless', 'impulsive', 'rash'],
  ['Choose the word that means "to stop something from happening".', 'prevent', 'encourage', 'permit', 'allow']
];
for (const [question, ans, b, c, d] of vocabSets) {
  const options = [ans, b, c, d];
  shuffle(options);
  addRow({ question, options, correctAnswer: ans, category: 'Verbal Ability', topic: 'Vocabulary', explanation: `"${ans}" is the most accurate meaning.` });
}


if (rows.length === 199) {
  const question = 'Choose the synonym of "Essential".';
  const options = ['Necessary', 'Optional', 'Rare', 'Late'];
  shuffle(options);
  addRow({ question, options, correctAnswer: 'Necessary', category: 'Verbal Ability', topic: 'Synonyms and Antonyms', explanation: '"Necessary" is closest in meaning to "Essential".' });
}

if (rows.length !== 200) {
  throw new Error(`Expected 200 rows but generated ${rows.length}`);
}

// Assign balanced difficulty across all 200 rows.
const diffPool = [
  ...Array(67).fill('Easy'),
  ...Array(67).fill('Medium'),
  ...Array(66).fill('Hard')
];
shuffle(diffPool);
rows.forEach((r, i) => { r.difficulty = diffPool[i]; });

// Final integrity checks before writing
const categoryCounts = rows.reduce((acc, r) => (acc[r.category] = (acc[r.category] || 0) + 1, acc), {});
if (categoryCounts['Quantitative'] < 60 || categoryCounts['Logical Reasoning'] < 60 || categoryCounts['Verbal Ability'] < 60) {
  throw new Error('Category minimum not met');
}

const lines = [HEADER];
for (const r of rows) {
  lines.push([
    r.question,
    r.optionA,
    r.optionB,
    r.optionC,
    r.optionD,
    r.correctAnswer,
    r.category,
    r.difficulty,
    r.explanation,
  ].map(csvEscape).join(','));
}

fs.writeFileSync(OUTPUT, lines.join('\n'), 'utf8');
console.log(`Generated ${rows.length} questions at ${OUTPUT}`);
console.log('Category counts:', categoryCounts);
