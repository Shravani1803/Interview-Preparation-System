import React, { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { renderAsync } from "docx-preview";
import "./ResumeAnalysis.css";

// ✅ Stable worker (use fixed version)
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

const ResumeAnalysis = () => {
  const [fileData, setFileData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const docxRef = useRef(null);

  const targetSkills = [
    "React","JavaScript","Node.js","TypeScript",
    "CSS","HTML","Python","SQL","Git","AWS"
  ];

  const defaultSuggestions = [
    "Use strong action verbs in project and experience bullets.",
    "Add measurable results to show impact.",
    "Improve project descriptions with clear problem and outcome.",
    "Include missing technologies relevant to your target role.",
  ];

  useEffect(() => {
    return () => {
      if (fileData?.url) {
        URL.revokeObjectURL(fileData.url);
      }
    };
  }, [fileData]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (fileData?.url) {
      URL.revokeObjectURL(fileData.url);
    }

    const url = URL.createObjectURL(file);
    setFileData({ name: file.name, type: file.type, url });
    setAnalysis(null);
    setLoading(true);

    try {
      let text = "";

      if (file.type === "application/pdf") {
        text = await parsePDF(file);
      } else if (
        file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        const buffer = await file.arrayBuffer();

        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
        text = result.value;

        if (docxRef.current) {
          docxRef.current.innerHTML = "";
          await renderAsync(buffer, docxRef.current);
        }
      } else {
        alert("Upload PDF or DOCX only");
        return;
      }

      runAnalysis(text);

    } catch (err) {
      console.error(err);
      alert("Error reading file");
    } finally {
      setLoading(false);
    }
  };

  const parsePDF = async (file) => {
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

    let text = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      text += content.items.map(item => item.str).join(" ") + "\n";
    }

    if (!text || text.length < 20) {
      throw new Error("EMPTY_TEXT");
    }

    return text;
  };

  const runAnalysis = (text) => {
    const normalized = text.toLowerCase();

    const found = targetSkills.filter(skill =>
      normalized.includes(skill.toLowerCase())
    );

    const missing = targetSkills.filter(s => !found.includes(s));

    const skillsScore = Math.round((found.length / targetSkills.length) * 100);

    const keywordSignals = [
      "developed", "implemented", "designed", "optimized", "improved",
      "experience", "project", "leadership", "collaborated", "delivered",
    ];
    const matchedKeywords = keywordSignals.filter((word) => normalized.includes(word));
    const keywordScore = Math.round((matchedKeywords.length / keywordSignals.length) * 100);

    const hasEducation = normalized.includes("education");
    const hasExperience = normalized.includes("experience");
    const hasProjects = normalized.includes("project");
    const hasSkillsSection = normalized.includes("skills");

    let formatScore = 0;
    if (text.length >= 600) formatScore += 35;
    if (hasEducation) formatScore += 20;
    if (hasExperience) formatScore += 20;
    if (hasProjects) formatScore += 15;
    if (hasSkillsSection) formatScore += 10;

    const score = Math.round(
      (skillsScore * 0.45) +
      (keywordScore * 0.25) +
      (Math.min(formatScore, 100) * 0.30)
    );

    const suggestions = [...defaultSuggestions];

    if (missing.length > 0) {
      suggestions.push(`Add missing technologies: ${missing.slice(0, 4).join(", ")}.`);
    }

    if (!hasEducation) {
      suggestions.push("Add a clear Education section.");
    }

    if (!hasProjects) {
      suggestions.push("Add project bullets that mention tools and outcomes.");
    }

    if (text.length < 600) {
      suggestions.push("Increase resume depth with quantified achievements.");
    }

    setAnalysis({
      score: Math.max(0, Math.min(score, 100)),
      breakdown: {
        keywords: Math.max(0, Math.min(keywordScore, 100)),
        skills: Math.max(0, Math.min(skillsScore, 100)),
        format: Math.max(0, Math.min(formatScore, 100)),
      },
      found,
      missing,
      suggestions
    });
  };

  return (
    <div className="ats-container" aria-busy={loading}>

      <header className="ats-header">
        <h1>ATS Resume Analyzer</h1>
        <p>Upload your resume to review ATS alignment, skills, and improvement areas.</p>
      </header>

      <div className="upload-box">
        <input
          type="file"
          accept=".pdf,.docx"
          onChange={handleFileChange}
          id="fileInput"
          disabled={loading}
          hidden
        />
        <label
          htmlFor={loading ? undefined : "fileInput"}
          className={`upload-btn ${loading ? "is-disabled" : ""}`}
        >
          {loading ? "Analyzing..." : (fileData ? fileData.name : "Upload Resume")}
        </label>
      </div>

      {loading && (
        <div className="loader" role="status" aria-live="polite">
          <span className="loader-spinner" />
          <span>Analyzing resume...</span>
        </div>
      )}

      {fileData && (
        <div className="layout">

          {/* Preview */}
          <div className="preview">
            <h3>Resume Preview</h3>

            {fileData.type === "application/pdf" ? (
              <iframe src={fileData.url} title="pdf" />
            ) : (
              <div ref={docxRef} className="docx-preview"></div>
            )}
          </div>

          {/* Analysis */}
          {analysis && (
            <div className="analysis-grid">

              <div className="card score">
                <p className="card-title">ATS Score</p>
                <h2>{analysis.score}%</h2>
                <div className="progress">
                  <div style={{ width: `${analysis.score}%` }}></div>
                </div>
              </div>

              <div className="card">
                <h3>Score Breakdown</h3>
                <div className="breakdown-list">
                  <div className="breakdown-row"><span>Keywords</span><strong>{analysis.breakdown.keywords}%</strong></div>
                  <div className="breakdown-row"><span>Skills</span><strong>{analysis.breakdown.skills}%</strong></div>
                  <div className="breakdown-row"><span>Format</span><strong>{analysis.breakdown.format}%</strong></div>
                </div>
              </div>

              <div className="card">
                <h3>Skills Found</h3>
                <div className="tags">
                  {analysis.found.length > 0 ? (
                    analysis.found.map((s) => <span key={s}>{s}</span>)
                  ) : (
                    <p className="section-empty">No core skills were detected.</p>
                  )}
                </div>
              </div>

              <div className="card">
                <h3>Missing Skills</h3>
                <p className="section-note">Recommended skills</p>
                <div className="tags missing">
                  {analysis.missing.map((s) => <span key={s}>{s}</span>)}
                </div>
              </div>

              <div className="card suggestions-card">
                <h3>Suggestions to Improve Resume</h3>
                <ul>
                  {analysis.suggestions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default ResumeAnalysis;