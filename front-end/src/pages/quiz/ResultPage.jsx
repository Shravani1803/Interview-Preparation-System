import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './ResultPage.css';

function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state;
  
  // State to track which question is expanded. null = all collapsed.
  const [expandedIndex, setExpandedIndex] = useState(null);

  const safeAccuracy = result?.accuracy ?? 0;

  const performanceMeta = useMemo(() => {
    if (safeAccuracy >= 80) return 'excellent';
    if (safeAccuracy >= 50) return 'good';
    return 'needs-work';
  }, [safeAccuracy]);

  const bannerContent = useMemo(() => {
    const titles = {
      excellent: 'Excellent - Keep it up!',
      good: 'Good - Keep pushing!',
      'needs-work': 'Needs Improvement - Keep Practicing!'
    };
    return {
      title: titles[performanceMeta],
      icon: performanceMeta === 'excellent' ? '🏆' : performanceMeta === 'good' ? '📊' : '📉',
      subtitle: result?.feedback || 'Review your answers below to improve.'
    };
  }, [performanceMeta, result?.feedback]);

  const review = useMemo(() => result?.review || [], [result?.review]);

  const toggleExpand = (index) => {
    // If clicking the same index, collapse it. Otherwise, expand the new one.
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  if (!result) {
    return (
      <div className="result-page-shell">
        <div className="result-page-card" style={{ textAlign: 'center' }}>
          <p>No result found.</p>
          <button className="result-action-button primary" onClick={() => navigate('/aptitude')}>Go To Quiz</button>
        </div>
      </div>
    );
  }

  return (
    <div className="result-page-shell">
      <div className="result-page-card">
        
        {/* Banner */}
        <div className={`result-banner ${performanceMeta}`}>
          <div className="result-banner-icon">{bannerContent.icon}</div>
          <div className="result-banner-copy">
            <p className="result-banner-overline">Performance Summary</p>
            <h2>{bannerContent.title}</h2>
            <p>{bannerContent.subtitle}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <section className="result-summary-grid">
          <div className="result-summary-item">
            <span className="result-stat-label">Score</span>
            <strong>{result.score} / {result.totalQuestions}</strong>
          </div>
          <div className="result-summary-item">
            <span className="result-stat-label">Accuracy</span>
            <strong>{result.accuracy}%</strong>
          </div>
        </section>

        {/* Detailed Review */}
        <section className="result-review-section">
          <div className="result-review-header">
            <h2>Detailed Review</h2>
            <p className="result-review-count">{review.length} Questions</p>
          </div>

          <div className="result-review-list">
            {review.map((item, index) => {
              const isExpanded = expandedIndex === index;
              const isNotAnswered = !item.userAnswer;
              const statusClass = isNotAnswered ? 'unanswered' : (item.isCorrect ? 'correct' : 'wrong');
              
              return (
                <article key={index} className={`result-review-card ${statusClass}`}>
                  {/* Summary Row: Always Visible */}
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
                  
                  {/* Collapsible Details */}
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

        {/* Bottom Actions */}
        <div className="result-actions">
          <button className="result-action-button secondary" onClick={() => navigate('/home')}>Back to Dashboard</button>
          <button className="result-action-button primary" onClick={() => navigate('/aptitude')}>Retake Quiz</button>
        </div>
      </div>
    </div>
  );
}

export default ResultPage;