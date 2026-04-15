import React from "react";
import { Link } from "react-router-dom";
import './landingpage.css';

function LandingPage() {
  return (
    <div className="landing">
      
      

      {/* Hero Section */}
      <div className="hero">
        <h1>Master Aptitude with Smart Practice</h1>
        <p>
          Boost your problem-solving skills with structured aptitude questions,
          real-time analysis, and performance tracking. Prepare smarter, not harder.
        </p>

        <div className="hero-buttons">
          <Link to="/signup">
            <button className="btn-primary big">Get Started</button>
          </Link>
          <Link to="/login">
            <button className="btn-outline big">Login</button>
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="features">
        <div className="card">
          <h3>📄 ResumeAnalysis</h3>
          <p>Track your progress and identify weak areas instantly.</p>
        </div>
        <div className="card">
          <h3>🧠 Smart Practice</h3>
          <p>Practice questions tailored to improve your aptitude skills.</p>
        </div>
        <div className="card">
          <h3>⏱ Timed Tests</h3>
          <p>Simulate real exam conditions with time-based quizzes.</p>
        </div>
      </div>

    </div>
  );
}

export default LandingPage;