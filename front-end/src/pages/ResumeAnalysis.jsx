import React, { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import "./ResumeAnalysis.css";

// WORKER (CRA SAFE)
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";

GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

function ResumeAnalysis() {
  const [resumeText, setResumeText] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [score, setScore] = useState(null);
  const [missingSkills, setMissingSkills] = useState([]);
  const [foundSkills, setFoundSkills] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  // 📄 PDF Extract (FIXED)
  const extractPDF = async (file) => {
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const typedArray = new Uint8Array(reader.result);

        const pdf = await getDocument({ data: typedArray }).promise;

        let text = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();

          text += content.items.map((item) => item.str).join(" ") + " ";
        }

        setResumeText(text);
      } catch (err) {
        console.error(err);
        alert("Error reading PDF file");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // 📄 DOCX Extract
  const extractDOCX = async (file) => {
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const result = await mammoth.extractRawText({
          arrayBuffer: reader.result,
        });

        setResumeText(result.value);
      } catch (err) {
        console.error(err);
        alert("Error reading DOCX file");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // 📂 File Handler
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type === "application/pdf") {
      extractPDF(file);
    } else if (
      file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      extractDOCX(file);
    } else {
      alert("Only PDF or DOCX allowed");
    }
  };

  // 🧠 ANALYSIS
  const analyzeResume = () => {
    const resume = resumeText.toLowerCase();
    const jd = jobDesc.toLowerCase();

    const skills = [
      "javascript",
      "react",
      "node",
      "mongodb",
      "express",
      "sql",
      "html",
      "css",
      "c++",
      "java",
      "python",
    ];

    let scoreVal = 0;

    const found = skills.filter((s) => resume.includes(s));
    const missing = skills.filter((s) => !resume.includes(s));

    setFoundSkills(found);
    setMissingSkills(missing);

    scoreVal += (found.length / skills.length) * 40;

    let jdWords = jd.split(" ").filter((w) => w.length > 3);
    let matchCount = jdWords.filter((w) => resume.includes(w)).length;

    if (jdWords.length > 0) {
      scoreVal += (matchCount / jdWords.length) * 25;
    }

    if (resume.includes("education")) scoreVal += 5;
    if (resume.includes("experience")) scoreVal += 5;
    if (resume.includes("projects")) scoreVal += 5;
    if (resume.includes("skills")) scoreVal += 5;

    const actionWords = [
      "developed",
      "built",
      "designed",
      "implemented",
      "created",
      "optimized",
    ];

    let actionCount = actionWords.filter((w) => resume.includes(w)).length;
    scoreVal += Math.min(actionCount * 2, 10);

    setScore(Math.round(scoreVal));

    // 💡 Suggestions
    let sugg = [];

    if (!resume.includes("projects"))
      sugg.push("Add Projects section");

    if (!resume.includes("experience"))
      sugg.push("Add Experience section");

    if (!resume.match(/\d/))
      sugg.push("Add measurable achievements");

    if (missing.length > 0)
      sugg.push("Add missing technical skills");

    if (resume.length < 300)
      sugg.push("Expand resume content");

    if (!resume.includes("github"))
      sugg.push("Add GitHub/portfolio link");

    setSuggestions(sugg);
  };

  return (
    <div className="ra-container">
      <div className="ra-inner">
        <h2 className="ra-title">📄 Resume Analyzer</h2>

        <div className="ra-card">
          <input type="file" accept=".pdf,.docx" onChange={handleFile} />

          <textarea
            placeholder="Paste Job Description..."
            onChange={(e) => setJobDesc(e.target.value)}
          />

          <button onClick={analyzeResume}>Analyze Resume</button>
        </div>

        {score !== null && (
          <div className="ra-card">
            <h3>ATS Score: {score}%</h3>
            <div className="ra-bar">
              <div style={{ width: `${score}%` }}></div>
            </div>
          </div>
        )}

        {foundSkills.length > 0 && (
          <div className="ra-card">
            <h3>Found Skills</h3>
            <div className="ra-tags good">
              {foundSkills.map((s, i) => (
                <span key={i}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {missingSkills.length > 0 && (
          <div className="ra-card">
            <h3>Missing Skills</h3>
            <div className="ra-tags bad">
              {missingSkills.map((s, i) => (
                <span key={i}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="ra-card">
            <h3>Suggestions</h3>
            <ul>
              {suggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResumeAnalysis;