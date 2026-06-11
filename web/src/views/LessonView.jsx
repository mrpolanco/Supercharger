import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import Markdown from "../components/Markdown.jsx";
import Quiz from "../components/Quiz.jsx";
import PracticeBlock from "../components/PracticeBlock.jsx";
import Terminal from "../components/Terminal.jsx";
import FileEditor from "../components/FileEditor.jsx";
import DuoIcon from "../components/DuoIcon.jsx";

// Split lesson body into markdown and structured exercise blocks.
function splitBlocks(body) {
  const blocks = [];
  const re = /```(quiz|practice)\n([\s\S]*?)```/g;
  let last = 0;
  let m;
  while ((m = re.exec(body))) {
    if (m.index > last) blocks.push({ type: "md", text: body.slice(last, m.index) });
    blocks.push({ type: m[1], text: m[2] });
    last = m.index + m[0].length;
  }
  if (last < body.length) blocks.push({ type: "md", text: body.slice(last) });
  return blocks;
}

export default function LessonView({ track, lesson, progress, updateProgress }) {
  const [data, setData] = useState(null);
  const [lessons, setLessons] = useState([]); // ordered lesson ids for this track
  const [session, setSession] = useState(null); // sandbox session id
  const [activeTab, setActiveTab] = useState("terminal");
  const [starting, setStarting] = useState(false);
  const [buildSeconds, setBuildSeconds] = useState(0);
  const [checkResult, setCheckResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(null);

  const key = `${track}/${lesson}`;
  const complete = !!progress.lessons[key];

  useEffect(() => {
    api.track(track).then((t) => setLessons(t.lessons.map((l) => l.id))).catch(() => {});
    api.lesson(track, lesson).then(setData).catch((e) => setError(e.message));
    return () => {
      setSession((s) => {
        if (s) api.sandboxStop(s).catch(() => {});
        return null;
      });
    };
  }, [track, lesson]);

  // elapsed timer while building
  useEffect(() => {
    if (!starting) { setBuildSeconds(0); return; }
    setBuildSeconds(0);
    const t = setInterval(() => setBuildSeconds((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [starting]);

  // stop sandbox when tab/window closes
  useEffect(() => {
    const onUnload = () => { if (session) api.sandboxStop(session).catch(() => {}); };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [session]);

  const start = async () => {
    setStarting(true);
    setError(null);
    try {
      const { id } = await api.sandboxStart(track, lesson);
      setSession(id);
      setCheckResult(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setStarting(false);
    }
  };

  const reset = async () => {
    if (session) await api.sandboxStop(session).catch(() => {});
    setSession(null);
    setCheckResult(null);
    await start();
  };

  const check = async () => {
    setChecking(true);
    try {
      const result = await api.sandboxCheck(session);
      setCheckResult(result);
      if (result.checkpoints?.length && result.checkpoints.every((c) => c.pass)) {
        updateProgress((p) => {
          p.lessons[key] = true;
          return p;
        });
      }
    } catch (e) {
      setCheckResult({ error: e.message });
    } finally {
      setChecking(false);
    }
  };

  const toggleComplete = () =>
    updateProgress((p) => {
      if (p.lessons[key]) delete p.lessons[key];
      else p.lessons[key] = true;
      return p;
    });

  if (error && !data) return <div className="page">Error: {error}</div>;
  if (!data) return <div className="page muted">Loading…</div>;

  const blocks = splitBlocks(data.body);
  const lessonIdx = lessons.indexOf(lesson);
  const nextLesson = lessonIdx >= 0 && lessonIdx < lessons.length - 1 ? lessons[lessonIdx + 1] : null;
  const isLast = lessonIdx === lessons.length - 1;

  const content = (
    <div className="lesson-content">
      <a href={`#/track/${track}`} className="back">← Back to track</a>
      <h1>
        {data.meta.title} {complete && <span className="badge-done"><DuoIcon name="approved" /> complete</span>}
      </h1>
      {blocks.map((b, i) =>
        b.type === "md" ? (
          <Markdown key={i} text={b.text} />
        ) : b.type === "quiz" ? (
          <Quiz
            key={i}
            yamlText={b.text}
            quizKey={`${key}#${i}`}
            progress={progress}
            updateProgress={updateProgress}
          />
        ) : (
          <PracticeBlock key={i} jsonText={b.text} />
        )
      )}
      <div className="lesson-nav">
        {!data.sandbox && (
          <button className={complete ? "btn" : "btn primary"} onClick={toggleComplete}>
            <DuoIcon name={complete ? "book" : "approved"} />
            {complete ? "Mark incomplete" : "Mark complete"}
          </button>
        )}
        {isLast ? (
          <a className="btn primary" href={`#/track/${track}`}>
            <DuoIcon name="approved" /> Finish
          </a>
        ) : nextLesson ? (
          <a className="btn primary" href={`#/track/${track}/lesson/${nextLesson}`}>
            Next lesson →
          </a>
        ) : null}
      </div>
    </div>
  );

  if (!data.sandbox) return <div className="page">{content}</div>;

  return (
    <div className="split">
      <div className="split-left">{content}</div>
      <div className="split-right">
        <div className="term-bar">
          {!session ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <button className="btn primary" onClick={start} disabled={starting}>
                <DuoIcon name="rocket" />
                {starting ? `Building environment… ${buildSeconds}s` : "Start environment"}
              </button>
              {starting && buildSeconds >= 5 && (
                <span className="muted" style={{ fontSize: 12 }}>
                  First run pulls a Docker image — usually 30–60s.
                </span>
              )}
            </div>
          ) : (
            <>
              <button className="btn" onClick={reset}><DuoIcon name="rocket" /> Reset</button>
              <button className="btn primary" onClick={check} disabled={checking}>
                <DuoIcon name="approved" />
                {checking ? "Checking…" : "Check my work"}
              </button>
            </>
          )}
        </div>
        {error && <div className="error">{error}</div>}
        {session && (
          <>
            <div className="tab-bar">
              <button className={`tab-btn ${activeTab === "terminal" ? "active" : ""}`} onClick={() => setActiveTab("terminal")}>Terminal</button>
              <button className={`tab-btn ${activeTab === "files" ? "active" : ""}`} onClick={() => setActiveTab("files")}>Files</button>
            </div>
            {activeTab === "terminal" ? <Terminal session={session} /> : <FileEditor session={session} />}
          </>
        )}
        {checkResult && (
          <div className="check-results">
            {checkResult.error && <div className="error">{checkResult.error}</div>}
            {(checkResult.checkpoints || []).map((c, i) => (
              <div key={i} className={c.pass ? "cp pass" : "cp fail"}>
                <span>{c.pass ? <DuoIcon name="approved" /> : "✕"}</span>
                <div>
                  <strong>{c.name}</strong>
                  {!c.pass && c.hint && <div className="hint">{c.hint}</div>}
                </div>
              </div>
            ))}
            {checkResult.checkpoints?.every((c) => c.pass) && (
              <div className="all-pass"><DuoIcon name="approved" /> All checkpoints passed. Lesson complete.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
