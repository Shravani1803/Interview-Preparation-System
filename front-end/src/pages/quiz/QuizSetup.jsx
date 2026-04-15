import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './QuizSetup.css';

function QuizSetup() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('Quantitative');
  const [difficulty, setDifficulty] = useState('Easy');
  const [limit, setLimit] = useState(15);
  const [loading, setLoading] = useState(false);
  const [countLoading, setCountLoading] = useState(false);
  const [availableCount, setAvailableCount] = useState(0);
  const [hasFetched, setHasFetched] = useState(false);
  const [error, setError] = useState('');

  const maxSelectable = useMemo(() => {
    if (availableCount > 0) return Math.min(100, availableCount);
    return 100;
  }, [availableCount]);

  useEffect(() => {
    let ignore = false;

    const fetchAvailableCount = async () => {
      try {
        setCountLoading(true);
        setError('');
        const countUrl = `/api/questions/count?module=aptitude&category=${encodeURIComponent(category)}&difficulty=${encodeURIComponent(difficulty)}`;
        const response = await axios.get(countUrl);

        if (ignore) return;
        const totalAvailable = Number(response.data?.count || 0);
        setAvailableCount(totalAvailable);
        setLimit((previous) => {
          const parsed = Number(previous) || 15;
          if (totalAvailable <= 0) return parsed;
          return Math.min(parsed, Math.min(100, totalAvailable));
        });
      } catch (requestError) {
        if (ignore) return;

        try {
          const fallbackUrl = `/api/questions?module=aptitude&category=${encodeURIComponent(category)}&difficulty=${encodeURIComponent(difficulty)}&limit=1`;
          const fallbackResponse = await axios.get(fallbackUrl);

          if (ignore) return;
          const fallbackCount = Number(fallbackResponse.data?.totalAvailable || 0);
          setAvailableCount(fallbackCount);
        } catch (fallbackError) {
          if (ignore) return;
          setAvailableCount(0);
        }
      } finally {
        if (!ignore) setCountLoading(false);
      }
    };

    fetchAvailableCount();

    return () => {
      ignore = true;
    };
  }, [category, difficulty]);

  const resetFetchState = () => {
    setHasFetched(false);
    setError('');
  };

  const handleStartQuiz = async (event) => {
    event.preventDefault();

    const parsedLimit = Math.min(100, Math.max(1, Number(limit) || 15));

    try {
      setLoading(true);
      setHasFetched(false);
      setError('');

      console.log('Frontend request params:', {
        category,
        difficulty,
        limit: parsedLimit,
      });
      console.log('Selected limit:', parsedLimit);

      const requestUrl = `/api/questions?module=aptitude&category=${encodeURIComponent(category)}&difficulty=${encodeURIComponent(difficulty)}&limit=${parsedLimit}`;
      const response = await axios.get(requestUrl);

      const fetchedQuestions = response.data?.questions || [];
      const uniqueQuestions = Array.from(
        new Map(fetchedQuestions.map((question) => [String(question?.question || ''), question])).values()
      ).filter((question) => question?.question);
      console.log('Fetched questions:', response.data);

      const totalAvailable = Number(response.data?.totalAvailable || 0);
      const actualCount = Number(response.data?.actualCount || uniqueQuestions.length);
      const requestedCount = Number(response.data?.requestedLimit || parsedLimit);

      console.log('Frontend questions received:', uniqueQuestions.length);
      setHasFetched(true);

      if (uniqueQuestions.length === 0) {
        setError('No questions found for selected filters.');
        return;
      }

      navigate('/aptitude/quiz', {
        state: {
          category,
          difficulty,
          questions: uniqueQuestions,
          requestedCount,
          actualCount,
          totalAvailable,
        },
      });
    } catch (requestError) {
      setHasFetched(true);
      setError(requestError.response?.data?.message || 'Unable to start quiz.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="quiz-setup-shell">
      <div className="quiz-setup-card">
        <div className="quiz-setup-header">
          <span className="quiz-setup-icon" aria-hidden="true">🧠</span>
          <div>
            <h1 className="quiz-setup-title">Aptitude Quiz Setup</h1>
            <p className="quiz-setup-subtitle">Select quiz preferences and begin your timed test.</p>
          </div>
        </div>

        <form className="quiz-setup-form" onSubmit={handleStartQuiz}>
          <div className="quiz-setup-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                resetFetchState();
              }}
            >
              <option value="Quantitative">Quantitative</option>
              <option value="Logical">Logical</option>
              <option value="Verbal">Verbal</option>
            </select>
          </div>

          <div className="quiz-setup-group">
            <label htmlFor="difficulty">Difficulty</label>
            <select
              id="difficulty"
              value={difficulty}
              onChange={(event) => {
                setDifficulty(event.target.value);
                resetFetchState();
              }}
            >
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
              min="1"
              max="100"
              value={limit}
              onChange={(event) => {
                const nextValue = event.target.value;
                const parsed = Number(nextValue);

                if (!nextValue) {
                  setLimit('');
                } else if (Number.isNaN(parsed)) {
                  setLimit(1);
                } else {
                  setLimit(Math.min(100, Math.max(1, parsed)));
                }

                resetFetchState();
              }}
            />
            <span className="quiz-setup-hint">Choose between 1 and {maxSelectable} questions</span>
            <span className="quiz-setup-hint availability">
              {countLoading
                ? 'Checking available questions in CSV...'
                : `Available for selected filters: ${availableCount} questions`}
            </span>
          </div>

          {loading && (
            <div className="quiz-setup-loading" aria-live="polite">
              <span className="quiz-spinner" aria-hidden="true"></span>
              <span>Loading questions...</span>
            </div>
          )}
          {hasFetched && error && <p className="quiz-setup-error" role="alert">{error}</p>}

          <button
            type="submit"
            className="quiz-setup-button"
            disabled={loading || countLoading}
          >
            {loading ? 'Loading Questions...' : 'Start Quiz'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default QuizSetup;