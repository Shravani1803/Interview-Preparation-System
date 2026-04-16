import React, { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import './ResumeAnalysis.css';

// Set up the worker for PDF parsing
pdfjsLib.GlobalWorkerOptions.workerSrc = `//://cloudflare.com{pdfjsLib.version}/pdf.worker.min.js`;

const ResumeAnalysis = () => {
  const [fileData, setFileData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  // Example skill database - you can expand this
  const targetSkills = ['React', 'JavaScript', 'Node.js', 'TypeScript', 'CSS', 'HTML', 'Python', 'SQL', 'Git', 'AWS'];

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setFileData({ name: file.name, type: file.type, url });
    setLoading(true);

    try {
      let extractedText = "";
      if (file.type === "application/pdf") {
        extractedText = await parsePDF(file);
      } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        extractedText = await parseDocx(file);
      } else {
        alert("Please upload a PDF or DOCX file.");
        return;
      }
      runAnalysis(extractedText);
    } catch (error) {
      console.error("Error processing file:", error);
    } finally {
      setLoading(false);
    }
  };

  const parsePDF = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(s => s.str).join(" ");
    }
    return text;
  };

  const parseDocx = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };

  const runAnalysis = (text) => {
    const normalizedText = text.toLowerCase();
    const found = targetSkills.filter(skill => normalizedText.includes(skill.toLowerCase()));
    const missing = targetSkills.filter(skill => !found.includes(skill));
    
    // Scoring logic
    let score = (found.length / targetSkills.length) * 70; // 70% based on skills
    if (text.length > 1200) score += 15; // 15% for detail/length
    if (normalizedText.includes("experience") || normalizedText.includes("projects")) score += 15;

    const suggestions = [];
    if (missing.length > 2) suggestions.push(`Add technical keywords: ${missing.slice(0, 3).join(", ")}.`);
    if (text.length < 800) suggestions.push("Your resume seems brief. Expand on your project impact.");
    if (!normalizedText.includes("education")) suggestions.push("Ensure your 'Education' section is clearly labeled.");

    setAnalysis({
      score: Math.round(score),
      found,
      missing,
      suggestions
    });
  };

  return (
    <div className="resume-container">
      <header className="header">
        <h1>ATS Optimizer</h1>
        <p>Upload your resume to see how it performs</p>
      </header>

      <div className="upload-box">
        <input type="file" accept=".pdf,.docx" onChange={handleFileChange} id="fileInput" hidden />
        <label htmlFor="fileInput" className="upload-label">
          {fileData ? `Selected: ${fileData.name}` : "Click to upload PDF or DOCX"}
        </label>
      </div>

      {loading && <div className="loader">Analyzing your profile...</div>}

      {fileData && !loading && (
        <div className="main-layout">
          <section className="preview-pane">
            <div className="pane-header">Document Preview</div>
            <iframe src={fileData.url} title="Resume Preview" className="viewer" />
          </section>

          <section className="analysis-pane">
            {analysis && (
              <>
                <div className="score-card">
                  <h3>ATS Match Score</h3>
                  <div className="score-circle">{analysis.score}%</div>
                  <div className="progress-bg">
                    <div className="progress-fill" style={{ width: `${analysis.score}%`, backgroundColor: analysis.score > 70 ? '#10b981' : '#f59e0b' }}></div>
                  </div>
                </div>

                <div className="skills-grid">
                  <div className="skill-box">
                    <h4>Identified Skills</h4>
                    {analysis.found.map(s => <span key={s} className="tag tag-found">{s}</span>)}
                  </div>
                  <div className="skill-box">
                    <h4>Missing Skills</h4>
                    {analysis.missing.map(s => <span key={s} className="tag tag-missing">{s}</span>)}
                  </div>
                </div>

                <div className="suggestions">
                  <h4>Key Suggestions</h4>
                  <ul>
                    {analysis.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default ResumeAnalysis;
