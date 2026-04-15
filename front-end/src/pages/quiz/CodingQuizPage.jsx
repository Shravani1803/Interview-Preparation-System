import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './QuizPage.css';

const API_BASE_URL = 'http://localhost:8080';
const TOTAL_QUIZ_SECONDS = 10 * 60;

function CodingQuizPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { category, difficulty, questions, requestedCount = 15, totalAvailable = 0 } = location.state || {};

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(TOTAL_QUIZ_SECONDS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const hasAutoSubmittedRef = useRef(false);

  // Safety redirect
  useEffect(() => {
    if (!Array.isArray(questions) || questions.length === 0) {
      navigate('/coding-quiz');
    }
  }, [questions, navigate]);

  /** * FIX: Group CSV fields into 'options' array so they display in the UI */
  const questionList = useMemo(() => {
    if (!Array.isArray(questions)) return [];
    return questions.map(q => ({
      ...q,
      // Maps optionA, optionB, etc., into a single options array
      options: q.options || [q.optionA, q.optionB, q.optionC, q.optionD].filter(Boolean)
    }));
  }, [questions]);

  const currentQuestion = questionList[currentQuestionIndex];

  const completionPercent = useMemo(() => {
    if (questionList.length === 0) return 0;
    return Math.round(((currentQuestionIndex + 1) / questionList.length) * 100);
  }, [currentQuestionIndex, questionList.length]);

  const answeredCount = useMemo(() => {
    return Object.keys(selectedAnswers).filter(id => selectedAnswers[id]).length;
  }, [selectedAnswers]);

  const showAvailabilityNotice = useMemo(() => {
    if (!requestedCount || questionList.length === 0) return false;
    return questionList.length < requestedCount;
  }, [questionList.length, requestedCount]);

  const submitQuiz = useCallback(async () => {
    if (isSubmitting || questionList.length === 0) return;
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      const userAnswers = questionList.map(q => ({
        questionId: q._id,
        selectedOption: selectedAnswers[q._id] || null,
      }));

      const response = await axios.post(`${API_BASE_URL}/api/quiz/submit`, {
        module: 'coding',
        answers: userAnswers,
        category,
        difficulty,
        totalQuestions: questionList.length,
      }, { headers: { Authorization: `Bearer ${token}` } });

      navigate('/coding-quiz/result', { state: { ...response.data } });
    } catch (err) {
      setError('Error submitting quiz');
      setIsSubmitting(false);
    }
  }, [category, difficulty, isSubmitting, navigate, questionList, selectedAnswers]);

  // Timer effect
  useEffect(() => {
    if (timeLeft <= 0 && !hasAutoSubmittedRef.current) {
      hasAutoSubmittedRef.current = true;
      submitQuiz();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, submitQuiz]);

  const handleOptionSelect = (id, value) => {
    setSelectedAnswers(prev => ({ ...prev, [id]: value }));
  };

  if (!currentQuestion) return null;

  return (
    <div className="quiz-page-shell">
      <div className="quiz-page-card">
        <div className="quiz-progress-wrap">
          <div className="quiz-progress-meta">
            <span>{completionPercent}% completed</span>
            <span>{answeredCount}/{questionList.length} answered</span>
          </div>
          <div className="quiz-progress-track">
            <div className="quiz-progress-fill" style={{ width: `${completionPercent}%` }} />
          </div>
        </div>

        <header className="quiz-page-header">
          <div>
            <h1>{category} - {difficulty}</h1>
            <p>Question {currentQuestionIndex + 1} of {questionList.length}</p>
            {showAvailabilityNotice && (
              <p className="quiz-availability-note">
                Only {totalAvailable || questionList.length} questions available for selected filters
              </p>
            )}
          </div>
          <div className="quiz-timer">
            {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
          </div>
        </header>

        {error && <p className="quiz-error-text">{error}</p>}

        <section className="quiz-question-section">
          <h2>{currentQuestion.question}</h2>
          <div className="quiz-options-list">
            {currentQuestion.options.map((opt, i) => (
              <label key={i} className={`quiz-option-item ${selectedAnswers[currentQuestion._id] === opt ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name={currentQuestion._id}
                  checked={selectedAnswers[currentQuestion._id] === opt}
                  onChange={() => handleOptionSelect(currentQuestion._id, opt)}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </section>

        <aside className="quiz-palette">
          {questionList.map((q, i) => (
            <button
              key={q._id}
              className={`quiz-palette-item ${i === currentQuestionIndex ? 'active' : ''} ${selectedAnswers[q._id] ? 'answered' : ''}`}
              onClick={() => setCurrentQuestionIndex(i)}
            >
              {i + 1}
            </button>
          ))}
        </aside>

        <div className="quiz-controls">
          <button
            type="button"
            className="quiz-control-button secondary"
            onClick={() => setCurrentQuestionIndex((i) => Math.max(i - 1, 0))}
            disabled={currentQuestionIndex === 0 || isSubmitting}
          >
            ← Previous
          </button>

          <button
            type="button"
            className="quiz-control-button primary"
            onClick={submitQuiz}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
          </button>

          <button
            type="button"
            className="quiz-control-button secondary"
            onClick={() => setCurrentQuestionIndex((i) => Math.min(i + 1, questionList.length - 1))}
            disabled={currentQuestionIndex === questionList.length - 1 || isSubmitting}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

export default CodingQuizPage;