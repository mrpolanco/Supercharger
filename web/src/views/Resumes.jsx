import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import DuoIcon from "../components/DuoIcon.jsx";

export default function Resumes() {
  const [resumes, setResumes] = useState([]);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [viewing, setViewing] = useState(null); // { id, body }
  const [error, setError] = useState(null);

  const load = () => api.resumes().then(setResumes).catch(() => {});
  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    try {
      setError(null);
      await api.createResume(name, content);
      setName("");
      setContent("");
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const view = async (id) => {
    try {
      const { body } = await api.resume(id);
      setViewing({ id, body });
    } catch (e) {
      setError(e.message);
    }
  };

  const remove = async (id) => {
    if (!window.confirm(`Delete resume "${id}"? Preps that already copied it keep their copy.`)) return;
    try {
      await api.deleteResume(id);
      if (viewing?.id === id) setViewing(null);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="page narrow">
      <h1 className="page-title"><DuoIcon name="book" /> Resumes</h1>
      <p className="lead">
        Save a resume once and reuse it across job preps — pick it from the dropdown on the
        New job prep screen instead of pasting it every time. Each prep gets its own copy,
        so editing or deleting a saved resume never touches existing preps.
      </p>

      {error && <div className="error">{error}</div>}

      {resumes.map((r) => (
        <div className="resume-row" key={r.id}>
          <strong>{r.id}</strong>
          <span className="when">{r.updatedAt && `updated ${new Date(r.updatedAt).toLocaleDateString()}`}</span>
          <button className="btn small" onClick={() => (viewing?.id === r.id ? setViewing(null) : view(r.id))}>
            {viewing?.id === r.id ? "Hide" : "View"}
          </button>
          <button className="btn small" onClick={() => remove(r.id)}>Delete</button>
          {viewing?.id === r.id && <pre className="resume-preview">{viewing.body}</pre>}
        </div>
      ))}
      {resumes.length === 0 && <div className="empty-state">No saved resumes yet — add one below.</div>}

      <h2>Add a resume</h2>
      <label>Name (e.g. ios-engineer-2026)</label>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ios-engineer-2026" />
      <label>Resume</label>
      <textarea
        rows={12}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Paste your resume as plain text or markdown…"
      />
      <button className="btn primary" disabled={!name.trim() || !content.trim()} onClick={save}>
        <DuoIcon name="add" />
        Save resume
      </button>
    </div>
  );
}
