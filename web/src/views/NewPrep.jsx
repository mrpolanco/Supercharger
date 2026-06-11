import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import DuoIcon from "../components/DuoIcon.jsx";

export default function NewPrep() {
  const [name, setName] = useState("");
  const [posting, setPosting] = useState("");
  const [resume, setResume] = useState("");
  const [resumes, setResumes] = useState([]);
  const [resumeChoice, setResumeChoice] = useState("none"); // "none" | "paste" | saved resume id
  const [error, setError] = useState(null);

  useEffect(() => {
    api.resumes().then(setResumes).catch(() => {});
  }, []);

  const save = async () => {
    try {
      const oneTime = resumeChoice === "paste" ? resume : "";
      const resumeId = resumeChoice !== "none" && resumeChoice !== "paste" ? resumeChoice : undefined;
      const { id } = await api.createPrep(name, posting, oneTime, resumeId);
      window.location.hash = `#/prep/${id}`;
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="page narrow">
      <h1 className="page-title"><DuoIcon name="target" /> New job prep</h1>
      <p className="lead">
        Paste the job posting (and optionally your resume) below. Saving only stores the
        inputs — the next screen gives you a prompt to paste into your AI assistant
        (Claude Code, Codex, Gemini CLI, …), which maps the requirements to tracks, compares
        them against your background to find the real gaps, and writes your study plan and
        role-specific interview prep.
      </p>
      <label>Name (e.g. company-role)</label>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="acme-tse" />
      <label>Job posting</label>
      <textarea
        rows={12}
        value={posting}
        onChange={(e) => setPosting(e.target.value)}
        placeholder="Paste the full job description here…"
      />
      <label>Resume (optional — enables gap analysis)</label>
      <select value={resumeChoice} onChange={(e) => setResumeChoice(e.target.value)}>
        <option value="none">No resume</option>
        {resumes.map((r) => (
          <option key={r.id} value={r.id}>Saved: {r.id}</option>
        ))}
        <option value="paste">Paste a resume for this prep only</option>
      </select>
      <p className="muted">
        Reusing the same resume across preps? <a href="#/resumes">Save it in the Resumes tab</a> first
        and it will appear in this list.
      </p>
      {resumeChoice === "paste" && (
        <textarea
          rows={10}
          value={resume}
          onChange={(e) => setResume(e.target.value)}
          placeholder="Paste your resume as plain text. The analysis will mark each requirement as covered by your experience vs. a genuine gap, and prioritize tracks accordingly."
        />
      )}
      {error && <div className="error">{error}</div>}
      <button className="btn primary" disabled={!name || !posting} onClick={save}>
        <DuoIcon name="add" />
        Save prep
      </button>
    </div>
  );
}
