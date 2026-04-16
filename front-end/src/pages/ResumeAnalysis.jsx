import React, { useState, useRef } from "react";
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

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setFileData({ name: file.name, type: file.type, url });
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

    let score = (found.length / targetSkills.length) * 70;

    if (text.length > 800) score += 15;
    if (normalized.includes("experience")) score += 15;

    let suggestions = [];

    if (missing.length > 2) {
      suggestions.push(`Add skills: ${missing.slice(0, 3).join(", ")}`);
    }

    if (!normalized.includes("education")) {
      suggestions.push("Add a clear Education section");
    }

    if (text.length < 800) {
      suggestions.push("Increase resume content and include measurable achievements");
    }

    if (suggestions.length === 0) {
      suggestions.push("Your resume looks strong. Tailor it for specific job roles.");
    }

    setAnalysis({
      score: Math.round(score),
      found,
      missing,
      suggestions
    });
  };

  return (
    <div className="ats-container">

      <header className="ats-header">
        <h1>🚀 ATS Resume Analyzer</h1>
        <p>Upload your resume and get instant feedback like real job portals</p>
      </header>

      <div className="upload-box">
        <input
          type="file"
          accept=".pdf,.docx"
          onChange={handleFileChange}
          id="fileInput"
          hidden
        />
        <label htmlFor="fileInput" className="upload-btn">
          {fileData ? fileData.name : "Upload Resume"}
        </label>
      </div>

      {loading && <div className="loader">Analyzing Resume...</div>}

      {fileData && (
        <div className="layout">

          {/* Preview */}
          <div className="preview">
            <h3>📄 Resume Preview</h3>

            {fileData.type === "application/pdf" ? (
              <iframe src={fileData.url} title="pdf" />
            ) : (
              <div ref={docxRef} className="docx-preview"></div>
            )}
          </div>

          {/* Analysis */}
          {analysis && (
            <div className="analysis">

              <div className="card score">
                <h2>{analysis.score}%</h2>
                <p>ATS Match Score</p>
                <div className="progress">
                  <div style={{ width: `${analysis.score}%` }}></div>
                </div>
              </div>

              <div className="card">
                <h3>✅ Skills Found</h3>
                <div className="tags">
                  {analysis.found.map(s => <span key={s}>{s}</span>)}
                </div>
              </div>

              <div className="card">
                <h3>❌ Missing Skills</h3>
                <div className="tags missing">
                  {analysis.missing.map(s => <span key={s}>{s}</span>)}
                </div>
              </div>

              <div className="card">
                <h3>💡 Suggestions</h3>
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