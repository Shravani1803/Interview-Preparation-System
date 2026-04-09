import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './ResultPage.css';

function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state;

  const safeAccuracy = result?.accuracy ?? 0;

  const performanceMeta = useMemo(() => {
    if (safeAccuracy >= 80) return 'excellent';
    if (safeAccuracy >= 50) return 'good';
    return 'needs-work';
  }, [safeAccuracy]);

  const bannerContent = useMemo(() => {
    if (performanceMeta === 'excellent') {
      return {
        title: 'Excellent',
        icon: '🏆',
        subtitle: 'Outstanding focus and accuracy.',
      };
    }

    if (performanceMeta === 'good') {
      return {
        title: 'Good',
        icon: '📊',
        subtitle: 'Solid result with room to improve.',
      };
    }

    return {
      title: 'Needs Improvement',
      icon: '📉',
      subtitle: 'Keep practicing and try another attempt.',
    };
  }, [performanceMeta]);

  const scorePercentage = useMemo(() => {
    if (!result?.totalQuestions) return 0;
    return Math.round(((result?.score || 0) / result.totalQuestions) * 100);
  }, [result?.score, result?.totalQuestions]);

  const review = useMemo(() => result?.review || [], [result?.review]);

  const bannerLine = useMemo(() => {
    if (performanceMeta === 'excellent') return 'Excellent - Keep it up!';
    if (performanceMeta === 'good') return 'Good - Keep pushing!';
    return 'Needs Improvement - Keep Practicing!';
  }, [performanceMeta]);

  if (!result) {
    return (
      <div className="result-page-shell">
        <div className="result-page-card">
          <p>No result found. Please take a quiz first.</p>
          <button type="button" className="result-action-button" onClick={() => navigate('/aptitude')}>
            Go To Quiz Setup
          </button>
        </div>
      </div>
    );
  }

  const {
    score = 0,
    accuracy = 0,
    totalQuestions = 0,
    correctAnswers = 0,
    feedback,
  } = result;

  const statusMessage = feedback || (accuracy < 50 ? 'Needs Improvement' : 'Good Performance');
  const statCards = [
    { label: 'Score', value: `${score} / ${totalQuestions}`, icon: '🏁' },
    { label: 'Accuracy', value: `${accuracy}%`, icon: '🎯' },
    { label: 'Correct', value: correctAnswers, icon: '✅' },
    { label: 'Completion', value: `${scorePercentage}%`, icon: '⚡' },
  ];

  return (
    <div className="result-page-shell">
      <div className="result-page-card">
        <div className={`result-banner ${performanceMeta}`}>
          <div className="result-banner-icon" aria-hidden="true">{bannerContent.icon}</div>
          <div className="result-banner-copy">
            <p className="result-banner-overline">Performance Summary</p>
            <h2>{bannerLine}</h2>
            <p>{statusMessage || bannerContent.subtitle}</p>
          </div>
        </div>

        <header className="result-page-header">
          <div>
            <h1>Quiz Results</h1>
            <p className="result-header-subtitle">Detailed insights from your latest aptitude attempt</p>
          </div>
          <button type="button" className="result-action-button primary" onClick={() => navigate('/aptitude')}>
            Retake Quiz
          </button>
        </header>

        <section className="result-summary-grid">
          {statCards.map((card) => (
            <article key={card.label} className="result-summary-item">
              <span className="result-stat-icon" aria-hidden="true">{card.icon}</span>
              <span className="result-stat-label">{card.label}</span>
              <strong>{card.value}</strong>
            </article>
          ))}
        </section>

        <section className="result-review-section">
          <div className="result-review-header">
            <h2>Detailed Review</h2>
            <p className="result-review-count">{review.length} questions reviewed</p>
          </div>

          <div className="result-review-list">
            {review.map((item, index) => {
              const statusClass = item.isCorrect ? 'correct' : 'wrong';
              return (
                <article key={`${item.questionId}-${index}`} className={`result-review-card ${statusClass}`}>
                  <p className="review-question-index">Question {index + 1}</p>
                  <h3 className="review-question-title">{item.question}</h3>
                  <p className="review-answer-row">
                    <span className="answer-label">Your Answer: </span>
                    <span className={`answer-value ${statusClass}`}>{item.userAnswer || 'Not Answered'}</span>
                  </p>
                  <p className="review-answer-row">
                    <span className="answer-label">Correct Answer: </span>
                    <span className="answer-value correct">{item.correctAnswer}</span>
                  </p>
                  <p className="review-answer-row review-explanation">
                    <span className="answer-label">Explanation: </span>
                    <span className="answer-value">{item.explanation || 'No explanation available.'}</span>
                  </p>
                </article>
              );
            })}

            {review.length === 0 && (
              <article className="review-empty-state">
                <p>No questions found for this filter.</p>
              </article>
            )}
          </div>
        </section>

        <div className="result-actions">
          <button type="button" className="result-action-button primary" onClick={() => navigate('/aptitude')}>
            Retake Quiz
          </button>
          <button type="button" className="result-action-button secondary" onClick={() => navigate('/home')}>
            Back To Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResultPage;