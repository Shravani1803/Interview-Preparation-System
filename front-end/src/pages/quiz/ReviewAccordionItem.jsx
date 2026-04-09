import React, { useEffect, useMemo, useRef, useState } from 'react';

const STATUS_META = {
  correct: {
    label: 'Correct',
    icon: '✔',
  },
  wrong: {
    label: 'Wrong',
    icon: '✖',
  },
  'not-answered': {
    label: 'Not Answered',
    icon: '⚪',
  },
};

function ReviewAccordionItem({ item, index, isExpanded, onToggle }) {
  const [maxHeight, setMaxHeight] = useState('0px');
  const contentRef = useRef(null);

  const status = useMemo(() => {
    const userAnswer = item.userAnswer?.trim();
    if (!userAnswer) return 'not-answered';
    return item.isCorrect ? 'correct' : 'wrong';
  }, [item.isCorrect, item.userAnswer]);

  const statusMeta = STATUS_META[status];

  useEffect(() => {
    if (isExpanded && contentRef.current) {
      setMaxHeight(`${contentRef.current.scrollHeight}px`);
      return;
    }

    setMaxHeight('0px');
  }, [isExpanded, item.correctAnswer, item.explanation, item.userAnswer]);

  return (
    <article className={`review-accordion-item ${status} ${isExpanded ? 'expanded' : ''}`}>
      <button type="button" className="review-accordion-trigger" onClick={onToggle}>
        <div className="review-accordion-title-wrap">
          <p className="review-question-index">Question {index + 1}</p>
          <h3>{item.question}</h3>
        </div>

        <div className="review-accordion-right">
          <span className={`status-badge ${status}`}>
            <span aria-hidden="true">{statusMeta.icon}</span>
            {statusMeta.label}
          </span>
          <span className="review-arrow" aria-hidden="true">⌄</span>
        </div>
      </button>

      <div className="review-accordion-content" style={{ maxHeight }}>
        <div className="review-accordion-content-inner" ref={contentRef}>
          <div className={`answer-row answer-row-user ${status}`}>
            <p className="answer-label">Your Answer</p>
            <p className="answer-value">{item.userAnswer || 'Not Answered'}</p>
          </div>

          <div className="answer-row answer-row-correct">
            <p className="answer-label">Correct Answer</p>
            <p className="answer-value">{item.correctAnswer}</p>
          </div>

          <div className="explanation-box">
            <p className="answer-label">Explanation</p>
            <p>{item.explanation || 'No explanation available.'}</p>
          </div>
        </div>
      </div>
    </article>
  );
}

export default ReviewAccordionItem;
