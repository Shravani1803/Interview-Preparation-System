import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './QuizPage.css';

const API_BASE_URL = 'http://localhost:8080';
const TOTAL_QUIZ_SECONDS = 10 * 60;

function QuizPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { category, difficulty, questions, requestedCount = 15, totalAvailable = 0 } = location.state || {};
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(TOTAL_QUIZ_SECONDS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const hasAutoSubmittedRef = useRef(false);

  useEffect(() => {
    if (!Array.isArray(questions) || questions.length === 0) {
      navigate('/aptitude');
    }
  }, [questions, navigate]);

  const questionList = useMemo(() => (Array.isArray(questions) ? questions : []), [questions]);
  const currentQuestion = questionList[currentQuestionIndex];

  const completionPercent = useMemo(() => {
    if (questionList.length === 0) return 0;
    return Math.round(((currentQuestionIndex + 1) / questionList.length) * 100);
  }, [currentQuestionIndex, questionList.length]);

  const answeredCount = useMemo(() => {
    return Object.keys(selectedAnswers).filter((questionId) => selectedAnswers[questionId]).length;
  }, [selectedAnswers]);

  const formattedTime = useMemo(() => {
    const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
    const seconds = String(Math.max(timeLeft % 60, 0)).padStart(2, '0');
    return `${minutes}:${seconds}`;
  }, [timeLeft]);

  const timerStateClass = useMemo(() => {
    if (timeLeft <= 120) return 'quiz-timer-danger';
    if (timeLeft <= 300) return 'quiz-timer-warning';
    return 'quiz-timer-safe';
  }, [timeLeft]);

  const showAvailabilityNotice = useMemo(() => {
    if (!requestedCount || questionList.length === 0) return false;
    return questionList.length < requestedCount;
  }, [questionList.length, requestedCount]);

  const submitQuiz = useCallback(async () => {
    if (isSubmitting || questionList.length === 0) return;

    try {
      setIsSubmitting(true);
      setError('');

      const token = localStorage.getItem('token');
      const questionIds = questionList.map((question) => question._id);
      const payload = {
        category,
        difficulty,
        questionIds,
        answers: selectedAnswers,
      };

      const response = await axios.post(`${API_BASE_URL}/api/quiz/submit`, payload, {
        headers: {
          Authorization: token,
        },
      });

      navigate('/aptitude/result', {
        state: {
          ...response.data,
        },
      });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to submit quiz.');
      setIsSubmitting(false);
      hasAutoSubmittedRef.current = false;
    }
  }, [category, difficulty, isSubmitting, navigate, questionList, selectedAnswers]);

  useEffect(() => {
    if (questionList.length === 0 || isSubmitting) return;

    if (timeLeft <= 0 && !hasAutoSubmittedRef.current) {
      hasAutoSubmittedRef.current = true;
      submitQuiz();
      return;
    }

    const intervalId = setInterval(() => {
      setTimeLeft((previousValue) => previousValue - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timeLeft, questionList.length, isSubmitting, submitQuiz]);

  useEffect(() => {
    const preventDefault = (event) => event.preventDefault();
    window.addEventListener('copy', preventDefault);
    window.addEventListener('cut', preventDefault);
    window.addEventListener('paste', preventDefault);

    return () => {
      window.removeEventListener('copy', preventDefault);
      window.removeEventListener('cut', preventDefault);
      window.removeEventListener('paste', preventDefault);
    };
  }, []);

  const handleOptionSelect = (questionId, selectedOptionValue) => {
    setSelectedAnswers((previousAnswers) => ({
      ...previousAnswers,
      [questionId]: selectedOptionValue,
    }));
  };

  if (questionList.length === 0) {
    return null;
  }

  return (
    <div className="quiz-page-shell">
      <div className="quiz-page-card">
        <div className="quiz-progress-wrap" aria-label="Quiz Progress">
          <div className="quiz-progress-meta">
            <span>{completionPercent}% completed</span>
            <span>
              {answeredCount} / {questionList.length} answered
            </span>
          </div>
          <div className="quiz-progress-track">
            <div className="quiz-progress-fill" style={{ width: `${completionPercent}%` }}></div>
          </div>
        </div>

        <header className="quiz-page-header">
          <div>
            <h1>Aptitude Quiz</h1>
            <p>
              Question {currentQuestionIndex + 1} of {questionList.length}
            </p>
            <p className="quiz-count-info">Showing {questionList.length} questions</p>
            {showAvailabilityNotice && (
              <p className="quiz-availability-note">
                Only {totalAvailable || questionList.length} questions available for selected filters
              </p>
            )}
          </div>
          <div className={`quiz-timer ${timerStateClass}`}>{formattedTime}</div>
        </header>

        {error && <p className="quiz-error-text">{error}</p>}

        <section className="quiz-question-section">
          <h2>{currentQuestion.question}</h2>

          <div className="quiz-options-list">
            {currentQuestion.options.map((option, optionIndex) => (
              <label
                key={`${currentQuestion._id}-${optionIndex}`}
                className={`quiz-option-item ${selectedAnswers[currentQuestion._id] === option ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name={currentQuestion._id}
                  value={option}
                  checked={selectedAnswers[currentQuestion._id] === option}
                  onChange={() => handleOptionSelect(currentQuestion._id, option)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </section>

        <aside className="quiz-palette" aria-label="Question Palette">
          {questionList.map((question, index) => {
            const isActive = index === currentQuestionIndex;
            const isAnswered = Boolean(selectedAnswers[question._id]);
            return (
              <button
                key={question._id}
                type="button"
                className={`quiz-palette-item ${isActive ? 'active' : ''} ${isAnswered ? 'answered' : ''}`}
                onClick={() => setCurrentQuestionIndex(index)}
              >
                {index + 1}
              </button>
            );
          })}
        </aside>

        <div className="quiz-controls">
          <button
            type="button"
            className="quiz-control-button secondary"
            onClick={() => setCurrentQuestionIndex((previous) => Math.max(previous - 1, 0))}
            disabled={currentQuestionIndex === 0 || isSubmitting}
          >
            ← Previous
          </button>

          <button
            type="button"
            className="quiz-control-button secondary"
            onClick={() => setCurrentQuestionIndex((previous) => Math.min(previous + 1, questionList.length - 1))}
            disabled={currentQuestionIndex === questionList.length - 1 || isSubmitting}
          >
            Next →
          </button>

          <button type="button" className="quiz-control-button primary" onClick={submitQuiz} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuizPage;