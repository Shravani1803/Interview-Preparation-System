import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './QuizSetup.css';

const API_BASE_URL = 'http://localhost:8080';

function CodingQuizSetup() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('C++');
  const [difficulty, setDifficulty] = useState('Easy');
  const [limit, setLimit] = useState(15);
  const [loading, setLoading] = useState(false);
  const [countLoading, setCountLoading] = useState(false);
  const [availableCount, setAvailableCount] = useState(0);
  const [error, setError] = useState('');

  const maxSelectable = useMemo(() => {
    if (availableCount > 0) return Math.min(100, availableCount);
    return 100;
  }, [availableCount]);

  // Fetch count whenever category or difficulty changes to ensure proper filtering
  useEffect(() => {
    const fetchAvailableCount = async () => {
      try {
        setCountLoading(true);
        setError('');
        const response = await axios.get(`${API_BASE_URL}/api/questions/count`, {
          params: { module: 'coding', category, difficulty }
        });
        const count = Number(response.data?.count || 0);
        setAvailableCount(count);
        
        // Adjust limit if it exceeds available count
        setLimit((prev) => Math.min(prev, count || 15));
      } catch (err) {
        setAvailableCount(0);
      } finally {
        setCountLoading(false);
      }
    };
    fetchAvailableCount();
  }, [category, difficulty]);

  const handleStartQuiz = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError('');

      const parsedLimit = Math.min(100, Math.max(1, Number(limit) || 15));

      const response = await axios.get(`${API_BASE_URL}/api/questions?module=coding&category=${encodeURIComponent(category)}&difficulty=${encodeURIComponent(difficulty)}&limit=${parsedLimit}`);
      console.log('Fetched questions:', response.data);

      const fetchedQuestions = response.data?.questions || [];
      const uniqueQuestions = Array.from(
        new Map(fetchedQuestions.map((question) => [String(question?.question || ''), question])).values()
      ).filter((question) => question?.question);

      if (uniqueQuestions.length === 0) {
        setError('No questions found for these specific filters.');
        return;
      }

      navigate('/coding-quiz/quiz', {
        state: {
          category,
          difficulty,
          questions: uniqueQuestions,
          requestedCount: parsedLimit,
          totalAvailable: availableCount,
        },
      });
    } catch (err) {
      setError('Unable to start quiz. Check your server connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="quiz-setup-shell">
      <div className="quiz-setup-card">
        <div className="quiz-setup-header">
          <span className="quiz-setup-icon">💻</span>
          <div>
            <h1 className="quiz-setup-title">Coding MCQs Setup</h1>
            <p className="quiz-setup-subtitle">Select language and difficulty for your test.</p>
          </div>
        </div>

        <form className="quiz-setup-form" onSubmit={handleStartQuiz}>
          <div className="quiz-setup-group">
            <label htmlFor="category">Category</label>
            <select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="C++">C++</option>
              <option value="Java">Java</option>
              <option value="Python">Python</option>
            </select>
          </div>

          <div className="quiz-setup-group">
            <label htmlFor="difficulty">Difficulty</label>
            <select id="difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          <div className="quiz-setup-group">
            <label htmlFor="limit">Number of Questions</label>
            <input
              id="limit"
              type="number"
              value={limit}
              onChange={(e) => setLimit(Math.min(maxSelectable, Math.max(1, Number(e.target.value))))}
            />
            <span className="quiz-setup-hint">
              {countLoading ? 'Checking questions...' : `Available for selected filters: ${availableCount} questions`}
            </span>
          </div>

          {error && <p className="quiz-setup-error">{error}</p>}
          <button type="submit" className="quiz-setup-button" disabled={loading || countLoading}>
            {loading ? 'Loading Questions...' : 'Start Quiz'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CodingQuizSetup;