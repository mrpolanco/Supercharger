import React, { useMemo, useState } from "react";
import DuoIcon from "./DuoIcon.jsx";

const typeLabels = {
  incident: "Case file",
  response: "Written response",
  diagnosis: "Diagnosis checkpoint",
  compare: "Compare and explain",
  timeline: "Timeline drill",
  recall: "Recall drill",
};

function ListSection({ title, items }) {
  if (!items?.length) return null;
  return (
    <div className="practice-section">
      <h4>{title}</h4>
      <ul>
        {items.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    </div>
  );
}

function Timeline({ items }) {
  if (!items?.length) return null;
  return (
    <div className="practice-timeline">
      {items.map((item, i) => (
        <div className="practice-event" key={i}>
          <span>{item.time}</span>
          <p>{item.event}</p>
        </div>
      ))}
    </div>
  );
}

export default function PracticeBlock({ jsonText }) {
  const practice = useMemo(() => {
    try {
      return JSON.parse(jsonText);
    } catch {
      return null;
    }
  }, [jsonText]);
  const [draft, setDraft] = useState("");
  const [revealed, setRevealed] = useState(false);

  if (!practice) return <div className="error">Invalid practice block.</div>;

  const label = practice.label || typeLabels[practice.type] || "Practice";
  const needsDraft = practice.responseBox !== false && ["response", "diagnosis", "compare", "recall"].includes(practice.type);

  return (
    <section className={`practice practice-${practice.type || "general"}`}>
      <div className="practice-kicker">
        <DuoIcon name={practice.icon || "target"} />
        <span>{label}</span>
      </div>
      {practice.title && <h3>{practice.title}</h3>}
      {practice.prompt && <p className="practice-prompt">{practice.prompt}</p>}

      <ListSection title="Evidence" items={practice.evidence} />
      <Timeline items={practice.timeline} />
      <ListSection title="Choose or compare" items={practice.options} />
      <ListSection title="Deliverable" items={practice.deliverable} />
      <ListSection title="Rubric" items={practice.rubric} />

      {needsDraft && (
        <label className="practice-draft">
          <span>Your draft</span>
          <textarea
            rows={practice.rows || 6}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={practice.placeholder || "Write your answer before revealing the model notes."}
          />
        </label>
      )}

      {practice.modelAnswer && (
        <div className="practice-reveal">
          <button className="btn" type="button" onClick={() => setRevealed((v) => !v)}>
            <DuoIcon name={revealed ? "book" : "info"} />
            {revealed ? "Hide model notes" : "Reveal model notes"}
          </button>
          {revealed && <div className="practice-model">{practice.modelAnswer}</div>}
        </div>
      )}
    </section>
  );
}
