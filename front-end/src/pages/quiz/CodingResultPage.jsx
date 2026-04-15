import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './ResultPage.css';

function CodingResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state;
  
  // Track which question is expanded (only one at a time)
  const [expandedIndex, setExpandedIndex] = useState(null);

  const safeAccuracy = result?.accuracy ?? 0;

  const performanceMeta = useMemo(() => {
    if (safeAccuracy >= 80) return 'excellent';
    if (safeAccuracy >= 50) return 'good';
    return 'needs-work';
  }, [safeAccuracy]);

  const bannerContent = useMemo(() => {
    const config = {
      excellent: { title: 'Excellent - Keep it up!', icon: '🏆' },
      good: { title: 'Good - Keep pushing!', icon: '📊' },
      'needs-work': { title: 'Needs Improvement - Keep Practicing!', icon: '📉' }
    };
    return {
      ...config[performanceMeta],
      subtitle: result?.feedback || 'Review your coding logic below.'
    };
  }, [performanceMeta, result?.feedback]);

  const review = useMemo(() => result?.review || [], [result?.review]);

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  if (!result) {
    return (
      <div className="result-page-shell">
        <div className="result-page-card no-result">
          <p>No result found. Please take the coding quiz first.</p>
          <button className="result-action-button primary" onClick={() => navigate('/coding-quiz')}>
            Go To Quiz
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="result-page-shell">
      <div className="result-page-card">
        
        {/* Banner Section */}
        <div className={`result-banner ${performanceMeta}`}>
          <div className="result-banner-icon">{bannerContent.icon}</div>
          <div className="result-banner-copy">
            <p className="result-banner-overline">Performance Summary</p>
            <h2>{bannerContent.title}</h2>
            <p>{bannerContent.subtitle}</p>
          </div>
        </div>

        {/* Header Section */}
        <header className="result-page-header">
          <div>
            <h1>Coding MCQs Results</h1>
            <p className="result-header-subtitle">Mode: Coding | Detailed insights</p>
          </div>
        </header>

        {/* Stats Section */}
        <section className="result-summary-grid">
          <div className="result-summary-item">
            <span className="result-stat-label">Score</span>
            <strong>{result.score} / {result.totalQuestions}</strong>
          </div>
          <div className="result-summary-item">
            <span className="result-stat-label">Accuracy</span>
            <strong>{result.accuracy}%</strong>
          </div>
          <div className="result-summary-item">
            <span className="result-stat-label">Correct</span>
            <strong>{result.correctAnswers}</strong>
          </div>
        </section>

        {/* Accordion Review Section */}
        <section className="result-review-section">
          <div className="result-review-header">
            <h2>Detailed Review</h2>
            <p className="result-review-count">{review.length} questions</p>
          </div>

          <div className="result-review-list">
            {review.map((item, index) => {
              const isExpanded = expandedIndex === index;
              const isNotAnswered = !item.userAnswer || item.userAnswer === "";
              const statusClass = isNotAnswered ? 'unanswered' : (item.isCorrect ? 'correct' : 'wrong');
              
              return (
                <article key={index} className={`result-review-card ${statusClass}`}>
                  {/* Summary: Always Visible */}
                  <div className="review-card-summary" onClick={() => toggleExpand(index)}>
                    <div className="summary-left">
                      <span className="review-question-index">Q{index + 1}.</span>
                      <h3 className="review-question-title">{item.question}</h3>
                    </div>
                    <div className="summary-right">
                      <span className={`status-badge ${statusClass}`}>
                        {item.isCorrect ? '✔ Correct' : isNotAnswered ? '○ Skipped' : '✖ Wrong'}
                      </span>
                      <button className="view-details-btn">
                        {isExpanded ? 'Hide ▲' : 'View ▼'}
                      </button>
                    </div>
                  </div>
                  
                  {/* Details: Expands on Click */}
                  <div className={`review-card-details ${isExpanded ? 'show' : ''}`}>
                    <div className="details-content">
                      <div className="review-answer-row">
                        <span className="answer-label">Your Answer:</span>
                        <span className={`answer-value ${statusClass}`}>{item.userAnswer || 'Not Answered'}</span>
                      </div>
                      <div className="review-answer-row">
                        <span className="answer-label">Correct Answer:</span>
                        <span className="answer-value correct">{item.correctAnswer}</span>
                      </div>
                      {item.explanation && (
                        <div className="review-explanation">
                          <span className="answer-label">Explanation:</span>
                          <p>{item.explanation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Footer Actions */}
        <div className="result-actions">
          <button className="result-action-button secondary" onClick={() => navigate('/home')}>
            Back To Dashboard
          </button>
          <button className="result-action-button primary" onClick={() => navigate('/coding-quiz')}>
            Retake Quiz
          </button>
        </div>
      </div>
    </div>
  );
}

export default CodingResultPage;