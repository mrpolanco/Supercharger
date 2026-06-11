import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import Markdown from "../components/Markdown.jsx";
import DuoIcon, { topicIcon } from "../components/DuoIcon.jsx";
import CopyButton from "../components/CopyButton.jsx";

// Completion-flow order: inputs first, then generated artifacts, then study.
const ORDER = ["job-posting.md", "resume.md", "analysis.md", "plan.md", "interview-prep.md"];
const FILE_ICONS = {
  "plan.md": "clipboard",
  "analysis.md": "chart",
  "interview-prep.md": "certificate",
  "job-posting.md": "briefcase",
  "resume.md": "user",
};
const LEVELS = [
  {
    id: "beginner",
    label: "Beginner",
    example: "Assume I know the job context, but not the tool or vocabulary yet.",
  },
  {
    id: "intermediate",
    label: "Intermediate",
    example: "I know the basics and need realistic support-ticket practice.",
  },
  {
    id: "advanced",
    label: "Advanced",
    example: "Skip basics; give me edge cases, tradeoffs, and harder screens.",
  },
];
const DOC_GOALS = [
  ["support-product", "Support this product"],
  ["debug-customer-issues", "Debug common customer issues"],
  ["learn-api", "Learn the API"],
  ["prepare-interview", "Prepare for interview"],
  ["create-onboarding", "Create onboarding material"],
];

function trackProgress(track, progress) {
  if (!track?.lessons?.length) return { done: 0, total: 0, complete: false };
  const done = track.lessons.filter((lesson) => progress.lessons[`${track.id}/${lesson}`]).length;
  return { done, total: track.lessons.length, complete: done === track.lessons.length };
}

function trackCreatePrompt(prep) {
  return `From the cloned Supercharger project folder, create the requested tracks marked creating in preps/${prep}/track-requests.json.
Follow SPEC.md and include createdBy and sourcePrep in each track.yaml.`;
}

function trackModifyPrompt(prep) {
  return `From the cloned Supercharger project folder, apply the track modification requests marked modify-requested in preps/${prep}/track-requests.json.
Follow SPEC.md and AGENTS.md, honor each request's modificationNotes, level, and mode (in-place updates the track and records modifiedFor in track.yaml; fork copies it to the request's forkTo id and repoints this prep's curriculum.json), and set each request's status back to created when done.`;
}

function docsCreatePrompt(prep) {
  return `From the cloned Supercharger project folder, create the product docs onboarding request marked creating in
preps/${prep}/onboarding-requests.json.
Use only the approved docs sources and flag unsupported assumptions.`;
}

function ResumeTab({ prep, body, hasResume, onChanged }) {
  const [saved, setSaved] = useState([]);
  const [selected, setSelected] = useState("");
  const [pasting, setPasting] = useState(false);
  const [pasted, setPasted] = useState("");
  const [saveName, setSaveName] = useState("");
  const [savingToLibrary, setSavingToLibrary] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    api.resumes().then(setSaved).catch(() => {});
  }, []);

  const apply = async (payload) => {
    setError(null);
    setNotice(null);
    try {
      await api.setPrepResume(prep, payload);
      setPasting(false);
      setPasted("");
      onChanged();
      const regenPrompt = `Re-run the prep for preps/${prep}/ — the resume changed, so redo the gap analysis.`;
      setNotice(
        <>
          {hasResume
            ? "Resume replaced. To update the gap analysis, paste this into your AI coding agent (opened in the Supercharger folder): "
            : "Resume attached. To get the gap analysis, paste this into your AI coding agent (opened in the Supercharger folder): "}
          <span className="copy-chip">
            <code>{regenPrompt}</code>
            <CopyButton text={regenPrompt} />
          </span>
        </>
      );
    } catch (e) {
      setError(e.message);
    }
  };

  const saveToLibrary = async () => {
    setError(null);
    setNotice(null);
    try {
      await api.createResume(saveName, body);
      setSavingToLibrary(false);
      setSaveName("");
      setSaved(await api.resumes());
      setNotice("Saved to the resume library — it will appear in the saved list on every prep.");
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <>
      {!hasResume && (
        <div className="callout">
          No resume attached to this prep yet. Attach one to enable the gap analysis — the
          assistant will mark each requirement as covered by your experience vs. a genuine gap.
        </div>
      )}
      <div className="callout">
        <span className="copy-chip">
          <select value={selected} onChange={(e) => setSelected(e.target.value)}>
            <option value="">Choose a saved resume…</option>
            {saved.map((r) => (
              <option key={r.id} value={r.id}>{r.id}</option>
            ))}
          </select>
          <button className="btn small" disabled={!selected} onClick={() => apply({ resumeId: selected })}>
            {hasResume ? "Replace with saved" : "Attach saved"}
          </button>
        </span>{" "}
        <button className="btn small" onClick={() => setPasting((v) => !v)}>
          {pasting ? "Cancel paste" : hasResume ? "Paste a replacement" : "Paste a resume"}
        </button>{" "}
        {hasResume && !savingToLibrary && (
          <button className="btn small" onClick={() => setSavingToLibrary(true)}>Save to resume library</button>
        )}
        {hasResume && savingToLibrary && (
          <span className="copy-chip">
            <input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Name, e.g. ios-engineer-2026"
            />
            <button className="btn small" disabled={!saveName.trim()} onClick={saveToLibrary}>Save</button>
            <button className="btn small" onClick={() => setSavingToLibrary(false)}>Cancel</button>
          </span>
        )}{" "}
        <a href="#/resumes">Manage saved resumes</a>
      </div>
      {pasting && (
        <div className="add-track-form">
          <label>Resume</label>
          <textarea
            rows={12}
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            placeholder="Paste your resume as plain text or markdown…"
          />
          <button className="btn primary" disabled={!pasted.trim()} onClick={() => apply({ content: pasted })}>
            <DuoIcon name="add" />
            {hasResume ? "Replace resume" : "Attach resume"}
          </button>
        </div>
      )}
      {error && <div className="error">{error}</div>}
      {notice && <div className="callout">{notice}</div>}
      {hasResume && body && <Markdown text={body} />}
    </>
  );
}

export default function PrepView({ prep, file, progress }) {
  const [files, setFiles] = useState([]);
  const [trackRequests, setTrackRequests] = useState([]);
  const [onboardingRequests, setOnboardingRequests] = useState([]);
  const [curriculum, setCurriculum] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [body, setBody] = useState(null);
  const [adding, setAdding] = useState(false);
  const [addingDocs, setAddingDocs] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [newTrack, setNewTrack] = useState({ title: "", reason: "", level: "beginner" });
  const [modifying, setModifying] = useState(null);
  const [modifyForm, setModifyForm] = useState({ reason: "", level: "intermediate", mode: "in-place" });
  const [allPreps, setAllPreps] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [deleteSelection, setDeleteSelection] = useState({});
  const [newDocs, setNewDocs] = useState({
    title: "",
    docsUrl: "",
    sourceMarkdown: "",
    goal: "support-product",
    level: "beginner",
    notes: "",
  });
  const [error, setError] = useState(null);

  const refresh = () => {
    setError(null);
    api.preps().then((preps) => {
      setAllPreps(preps);
      const p = preps.find((x) => x.id === prep);
      if (!p) throw new Error(`Prep "${prep}" was not found by the API.`);
      const sorted = (p?.files || []).sort(
        (a, b) =>
          (ORDER.indexOf(a) < 0 ? 99 : ORDER.indexOf(a)) -
          (ORDER.indexOf(b) < 0 ? 99 : ORDER.indexOf(b))
      );
      setFiles(sorted);
      setTrackRequests(p?.trackRequests || []);
      setOnboardingRequests(p?.onboardingRequests || []);
      setCurriculum(p?.curriculum || []);
    }).catch((e) => setError(e.message));
    api.tracks().then(setTracks).catch((e) => setError(e.message));
  };

  useEffect(() => {
    refresh();
  }, [prep]);

  const hasGeneratedPrep = files.some((f) => ["analysis.md", "plan.md", "interview-prep.md"].includes(f));

  // While anything is waiting on an agent — queued track work, or the initial
  // prep generation itself — poll so the page updates when the files land.
  const hasQueuedWork =
    trackRequests.some((request) => ["creating", "modify-requested"].includes(request.status)) ||
    onboardingRequests.some((request) => request.status === "creating") ||
    (files.length > 0 && !hasGeneratedPrep);

  useEffect(() => {
    if (!hasQueuedWork) return;
    const timer = setInterval(refresh, 5000);
    return () => clearInterval(timer);
  }, [hasQueuedWork, prep]);

  const active = file || files[0];
  const isCurriculum = active === "curriculum";

  useEffect(() => {
    if (isCurriculum) {
      setBody(null);
      return;
    }
    if (!active) return;
    api.prepFile(prep, active).then((d) => setBody(d.body)).catch(() => setBody("Not found."));
  }, [prep, active, isCurriculum]);

  const trackMap = new Map(tracks.map((track) => [track.id, track]));
  const requestMap = new Map(trackRequests.map((request) => [request.id, request]));
  const onboardingMap = new Map(onboardingRequests.map((request) => [request.id, request]));
  const orderedCurriculum = (curriculum.length
    ? curriculum
    : trackRequests.map((request, index) => ({ id: request.id, kind: "requested", order: index + 1 }))
  )
    .map((item) => ({
      ...item,
      track: trackMap.get(item.id),
      request: requestMap.get(item.id),
      onboarding: onboardingMap.get(item.id),
    }))
    .sort((a, b) => (Number(a.order) || 999) - (Number(b.order) || 999));

  const curriculumComplete =
    orderedCurriculum.length > 0 &&
    orderedCurriculum.every((item) => item.track && trackProgress(item.track, progress).complete);

  const addTrack = async () => {
    setError(null);
    try {
      await api.addTrackRequest(prep, newTrack);
      setNewTrack({ title: "", reason: "", level: "beginner" });
      setAdding(false);
      refresh();
      window.location.hash = `#/prep/${prep}/curriculum`;
    } catch (e) {
      setError(e.message);
    }
  };

  const addDocs = async () => {
    setError(null);
    try {
      await api.addOnboardingRequest(prep, newDocs);
      setNewDocs({
        title: "",
        docsUrl: "",
        sourceMarkdown: "",
        goal: "support-product",
        level: "beginner",
        notes: "",
      });
      setAddingDocs(false);
      refresh();
      window.location.hash = `#/prep/${prep}/curriculum`;
    } catch (e) {
      setError(e.message);
    }
  };

  const requestDeeper = async (track) => {
    const nextId = `${track.id}-advanced`;
    setError(null);
    try {
      await api.addTrackRequest(prep, {
        id: nextId,
        title: `${track.title} — Advanced Practice`,
        level: "advanced",
        depth: "deep-dive",
        parentTrack: track.id,
        insertAfter: track.id,
        priority: "medium",
        reason: `Learner completed ${track.title}. Create a deeper follow-up only with advanced scenarios, edge cases, and harder closed-book assessment.`,
      });
      refresh();
    } catch (e) {
      setError(e.message);
    }
  };

  const requestCreate = async (id) => {
    setError(null);
    try {
      await api.createTrackRequest(prep, id);
      refresh();
    } catch (e) {
      setError(e.message);
    }
  };

  const requestOnboardingCreate = async (id) => {
    setError(null);
    try {
      await api.createOnboardingRequest(prep, id);
      refresh();
    } catch (e) {
      setError(e.message);
    }
  };

  const prepsUsingTrack = (trackId) =>
    allPreps
      .filter(
        (p) =>
          p.id !== prep &&
          ((p.curriculum || []).some((c) => c.id === trackId) ||
            (p.trackRequests || []).some((r) => r.id === trackId))
      )
      .map((p) => p.id);

  const startModify = (item) => {
    const others = prepsUsingTrack(item.id);
    const ownedHere = item.track?.sourcePrep === prep;
    const shared = others.length > 0 || (item.track?.sourcePrep && !ownedHere);
    setModifying(item.id);
    setModifyForm({
      reason: "",
      level: item.track?.level || item.request?.level || "intermediate",
      mode: shared ? "fork" : "in-place",
    });
  };

  const submitModify = async () => {
    setError(null);
    try {
      await api.modifyTrackRequest(prep, modifying, {
        reason: modifyForm.reason || "Optimize this track for retake.",
        level: modifyForm.level,
        mode: modifyForm.mode,
      });
      setModifying(null);
      refresh();
    } catch (e) {
      setError(e.message);
    }
  };

  // Tracks that belong to this prep: created for it, or later tuned for it.
  const associatedTracks = tracks.filter(
    (t) => t.sourcePrep === prep || (t.modifiedFor || []).includes(prep)
  );

  const deletePrep = async () => {
    const toDelete = Object.keys(deleteSelection).filter((id) => deleteSelection[id]);
    const summary = toDelete.length
      ? `Delete this prep AND ${toDelete.length} track(s): ${toDelete.join(", ")}?`
      : "Delete this prep? All its tracks will be kept.";
    if (!window.confirm(summary)) return;
    setError(null);
    try {
      await api.deletePrep(prep, toDelete);
      window.location.hash = "#/";
    } catch (e) {
      setError(e.message);
    }
  };

  const moveCurriculumItem = async (id, direction) => {
    const index = orderedCurriculum.findIndex((item) => item.id === id);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= orderedCurriculum.length) return;
    const next = [...orderedCurriculum];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    const nextCurriculum = next.map(({ track, request, onboarding, ...item }, itemIndex) => ({
      ...item,
      order: itemIndex + 1,
    }));
    setCurriculum(nextCurriculum);
    setError(null);
    try {
      const result = await api.reorderCurriculum(prep, nextCurriculum.map((item) => item.id));
      setCurriculum(result.curriculum || nextCurriculum);
    } catch (e) {
      setError(e.message);
      refresh();
    }
  };

  return (
    <div className="page">
      <a href="#/" className="back">← Home</a>
      <div className="page-title-row">
        <h1 className="page-title"><DuoIcon name="target" /> {prep}</h1>
        <button className="btn" onClick={() => { setDeleting((value) => !value); setDeleteSelection({}); }}>
          <DuoIcon name="alert" />
          {deleting ? "Cancel delete" : "Delete prep"}
        </button>
      </div>
      {deleting && (
        <div className="add-track-form">
          <label>Delete this job prep</label>
          <p className="muted">
            The prep folder (posting, analysis, plan, interview prep) will be removed.
            {associatedTracks.length
              ? " These tracks were created or tuned for this prep — choose which to delete with it. Unchecked tracks stay in your library."
              : " No tracks were created or tuned for this prep, so the track library is untouched."}
          </p>
          {associatedTracks.map((t) => {
            const others = prepsUsingTrack(t.id);
            return (
              <label key={t.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={!!deleteSelection[t.id]}
                  onChange={(e) =>
                    setDeleteSelection((value) => ({ ...value, [t.id]: e.target.checked }))
                  }
                />
                <span>
                  Also delete <strong>{t.title || t.id}</strong>
                  {t.sourcePrep === prep ? " (created for this prep)" : " (tuned for this prep)"}
                  {others.length > 0 && (
                    <span className="muted"> — careful: also used by {others.join(", ")}</span>
                  )}
                </span>
              </label>
            );
          })}
          <div className="panel-actions">
            <button className="btn primary" onClick={deletePrep}>
              <DuoIcon name="alert" />
              Delete prep
              {Object.values(deleteSelection).filter(Boolean).length > 0 &&
                ` + ${Object.values(deleteSelection).filter(Boolean).length} track(s)`}
            </button>
            <button className="btn" onClick={() => setDeleting(false)}>Cancel</button>
          </div>
        </div>
      )}
      <div className="tabs">
        {ORDER.map((f) => {
          const exists = files.includes(f);
          const isActive = f === active;
          if (!exists && f !== "resume.md") {
            // Generated artifacts that don't exist yet: visible flow steps, not clickable.
            return (
              <span key={f} className="tab pending" title="Not generated yet — run the prep generation">
                <DuoIcon name={FILE_ICONS[f] || "file"} />
                {f.replace(".md", "")}
              </span>
            );
          }
          const cls = `tab${isActive ? " active" : ""}${exists ? " done" : ""}`;
          return (
            <a key={f} className={cls} href={`#/prep/${prep}/${f}`}>
              <DuoIcon name={exists ? "approved" : FILE_ICONS[f] || "file"} />
              {f.replace(".md", "")}
            </a>
          );
        })}
        <a
          className={`tab${isCurriculum ? " active" : ""}${curriculumComplete ? " done" : ""}`}
          href={`#/prep/${prep}/curriculum`}
        >
          <DuoIcon name={curriculumComplete ? "approved" : "target"} />
          curriculum
        </a>
      </div>
      {!hasGeneratedPrep && (
        <div className="callout">
          This prep has inputs, but no generated analysis or study plan yet. In an AI coding
          agent launched in the Supercharger project folder (Claude Code, Codex, Gemini CLI — not
          a chat website, which can't write files), say:{" "}
          <span className="copy-chip">
            <code>Generate the prep for preps/{prep}/</code>
            <CopyButton text={`Generate the prep for preps/${prep}/`} />
          </span>{" "}
          (or <code>/prep {prep}</code> if your CLI has the repo's slash commands) to get the analysis, study plan, and interview prep. If the prep finds gaps, it can also write <code>track-requests.json</code>
          so suggested tracks appear here.
        </div>
      )}
      {isCurriculum ? (
        <section className="panel curriculum-panel">
          <div className="panel-head">
            <div>
              <h2><DuoIcon name="target" /> Suggested curriculum</h2>
              <p>Study these in order. Existing tracks can be started now; requested tracks wait for an external AI assistant to create the folder.</p>
            </div>
            <div className="panel-actions">
              <button className="btn" onClick={() => setReordering((value) => !value)}>
                <DuoIcon name="target" />
                {reordering ? "Done" : "Reorder"}
              </button>
              <button className="btn" onClick={() => setAddingDocs((value) => !value)}>
                <DuoIcon name="book" />
                Add docs
              </button>
              <button className="btn" onClick={() => setAdding((value) => !value)}>
                <DuoIcon name="add" />
                Add track
              </button>
            </div>
          </div>
          {adding && (
            <div className="add-track-form">
              <label>Track idea</label>
              <input
                value={newTrack.title}
                onChange={(e) => setNewTrack((value) => ({ ...value, title: e.target.value }))}
                placeholder="How to use curl"
              />
              <label>Why add it?</label>
              <textarea
                rows={3}
                value={newTrack.reason}
                onChange={(e) => setNewTrack((value) => ({ ...value, reason: e.target.value }))}
                placeholder="I want hands-on practice reproducing API tickets from the command line."
              />
              <label>Confidence level</label>
              <div className="level-options">
                {LEVELS.map((level) => (
                  <button
                    key={level.id}
                    type="button"
                    className={newTrack.level === level.id ? "level-option active" : "level-option"}
                    onClick={() => setNewTrack((value) => ({ ...value, level: level.id }))}
                  >
                    <strong>{level.label}</strong>
                    <span>{level.example}</span>
                  </button>
                ))}
              </div>
              <button className="btn primary" disabled={!newTrack.title} onClick={addTrack}>
                <DuoIcon name="add" />
                Add to curriculum
              </button>
            </div>
          )}
          {addingDocs && (
            <div className="add-track-form">
              <label>Product or docs name</label>
              <input
                value={newDocs.title}
                onChange={(e) => setNewDocs((value) => ({ ...value, title: e.target.value }))}
                placeholder="ReadMe API docs"
              />
              <label>Docs URL</label>
              <input
                value={newDocs.docsUrl}
                onChange={(e) => setNewDocs((value) => ({ ...value, docsUrl: e.target.value }))}
                placeholder="https://docs.example.com"
              />
              <label>Approved markdown or excerpts</label>
              <textarea
                rows={6}
                value={newDocs.sourceMarkdown}
                onChange={(e) => setNewDocs((value) => ({ ...value, sourceMarkdown: e.target.value }))}
                placeholder="Paste selected docs, API examples, changelog notes, or support articles."
              />
              <label>Goal</label>
              <select value={newDocs.goal} onChange={(e) => setNewDocs((value) => ({ ...value, goal: e.target.value }))}>
                {DOC_GOALS.map(([id, label]) => (
                  <option key={id} value={id}>{label}</option>
                ))}
              </select>
              <label>Confidence level</label>
              <div className="level-options">
                {LEVELS.map((level) => (
                  <button
                    key={level.id}
                    type="button"
                    className={newDocs.level === level.id ? "level-option active" : "level-option"}
                    onClick={() => setNewDocs((value) => ({ ...value, level: level.id }))}
                  >
                    <strong>{level.label}</strong>
                    <span>{level.example}</span>
                  </button>
                ))}
              </div>
              <label>Notes for the agent</label>
              <textarea
                rows={3}
                value={newDocs.notes}
                onChange={(e) => setNewDocs((value) => ({ ...value, notes: e.target.value }))}
                placeholder="Focus on docs relevant to developer support, API references, auth setup, and common customer issues."
              />
              <button className="btn primary" disabled={!newDocs.title || (!newDocs.docsUrl && !newDocs.sourceMarkdown)} onClick={addDocs}>
                <DuoIcon name="book" />
                Add docs to curriculum
              </button>
            </div>
          )}
          {error && <div className="error">{error}</div>}
          <div className="callout agent-handoff">
            <strong>Create does not launch an AI client.</strong> It queues work in this prep folder so Codex, Claude Code,
            Gemini CLI, or another assistant can read the files and create the missing track. After you click Create, copy
            the prompt that appears and paste it into your assistant from the Supercharger project folder.
          </div>
          <div className="callout agent-handoff">
            <strong>Pace yourself — don't queue every track at once.</strong> Add all the tracks you think you'll need,
            use <strong>Reorder</strong> to put them in study order, then <strong>Create</strong> them one at a time as
            you reach them in the curriculum. Generating everything up front takes a long agent session, and tracks
            created later can be tuned with what you've learned (and asked for) along the way.
          </div>
          {!error && !orderedCurriculum.length && (
            <div className="callout">
              No curriculum items came back from the API. Restart the dev server after pulling or editing
              server code, then refresh this page.
            </div>
          )}
          <div className="curriculum-list">
            {orderedCurriculum.map((item, index) => {
              const track = item.track;
              const request = item.request;
              const onboarding = item.onboarding;
              const progressForTrack = trackProgress(track, progress);
              const ready = !!track;
              const isDocsOnboarding = item.kind === "docs-onboarding";
              const creating = request?.status === "creating" || request?.status === "modify-requested";
              const docsCreating = onboarding?.status === "creating";
              const level = track?.level || request?.level || onboarding?.level || item.level || "beginner";
              const canGoDeeper = ready && progressForTrack.complete && level !== "advanced";
              const deeperAlreadyRequested = trackRequests.some((candidate) => candidate.parentTrack === item.id && candidate.level === "advanced");
              return (
                <div className="curriculum-item" key={item.id}>
                  <div className="step-index">{index + 1}</div>
                  <div className="curriculum-main">
                    <h3>
                      <DuoIcon name={track?.icon || topicIcon(track?.title || request?.title || onboarding?.title, item.id, track?.description)} />{" "}
                      {track?.title || request?.title || onboarding?.title || item.id}
                    </h3>
                    {track?.description && <p>{track.description}</p>}
                    {!track?.description && request?.reason && <p>{request.reason}</p>}
                    {isDocsOnboarding && (
                      <p>
                        Build product fluency from approved docs: product map, glossary, support scenarios,
                        escalation practice, and track suggestions based on this prep.
                      </p>
                    )}
                    <div className="meta-row">
                      {isDocsOnboarding ? (
                        <span className="pill accent">{onboarding?.status || "suggested"}</span>
                      ) : ready ? (
                        <span className="pill green">ready</span>
                      ) : (
                        <span className="pill accent">{request?.status || "suggested"}</span>
                      )}
                      <span className="pill blue">{level}</span>
                      {track?.modifiedFor?.includes(prep) && (
                        <span className="pill green">tuned for this prep</span>
                      )}
                      {track?.modifiedFor?.length > 0 && !track.modifiedFor.includes(prep) && (
                        <span className="pill accent" title="This shared track was modified for another job prep.">
                          tuned for {track.modifiedFor.join(", ")}
                        </span>
                      )}
                      {request?.priority && <span className="pill">{request.priority}</span>}
                      {onboarding?.goal && <span className="pill">{onboarding.goal}</span>}
                      {(track?.createdBy || request?.createdBy) && <span className="pill">{ready ? "Created" : "Requested"} by {track?.createdBy || request?.createdBy}</span>}
                      {onboarding?.createdBy && <span className="pill">Requested by {onboarding.createdBy}</span>}
                      {ready && <span className="pill">{progressForTrack.done}/{progressForTrack.total} lessons</span>}
                    </div>
                  </div>
                  <div className="curriculum-actions">
                    {reordering && (
                      <div className="reorder-controls">
                        <button className="icon-btn" disabled={index === 0} onClick={() => moveCurriculumItem(item.id, -1)} title="Move up">
                          ↑
                        </button>
                        <button className="icon-btn" disabled={index === orderedCurriculum.length - 1} onClick={() => moveCurriculumItem(item.id, 1)} title="Move down">
                          ↓
                        </button>
                      </div>
                    )}
                    {progressForTrack.complete && <span className="badge-done"><DuoIcon name="approved" /> complete</span>}
                    {isDocsOnboarding ? (
                      docsCreating ? (
                        <div className="queued-agent">
                          <button className="btn" disabled>
                            <span className="spinner" />
                            Queued for agent
                          </button>
                          <div className="prompt-card">
                            <span>Paste this into your AI coding agent, opened in the Supercharger folder:</span>
                            <code>{docsCreatePrompt(prep)}</code>
                            <CopyButton text={docsCreatePrompt(prep)} />
                          </div>
                        </div>
                      ) : (
                        <button className="btn primary" onClick={() => requestOnboardingCreate(item.id)}>
                          <DuoIcon name="rocket" />
                          Generate practice
                        </button>
                      )
                    ) : ready ? (
                      <>
                        <a className="btn primary" href={`#/track/${item.id}`}>
                          <DuoIcon name="book" />
                          Start
                        </a>
                        {request?.status === "modify-requested" ? (
                          <div className="queued-agent">
                            <button className="btn" disabled>
                              <span className="spinner" />
                              Modification queued for agent
                            </button>
                            <div className="prompt-card">
                              <span>Paste this into your AI coding agent, opened in the Supercharger folder:</span>
                              <code>{trackModifyPrompt(prep)}</code>
                              <CopyButton text={trackModifyPrompt(prep)} />
                            </div>
                          </div>
                        ) : modifying === item.id ? (
                          <div className="add-track-form">
                            <label>What should change?</label>
                            {item.modificationHints && (
                              <button
                                type="button"
                                className="btn small"
                                title="Suggestion from this prep's job posting"
                                onClick={() => setModifyForm((value) => ({ ...value, reason: item.modificationHints }))}
                              >
                                <DuoIcon name="target" />
                                Suggested for this job: {item.modificationHints}
                              </button>
                            )}
                            <textarea
                              rows={3}
                              value={modifyForm.reason}
                              onChange={(e) => setModifyForm((value) => ({ ...value, reason: e.target.value }))}
                              placeholder="e.g. More WooCommerce scenarios, harder final assessment, shorter concept lessons…"
                            />
                            <label>Where should the change land?</label>
                            <div className="level-options">
                              <button
                                type="button"
                                className={modifyForm.mode === "in-place" ? "level-option active" : "level-option"}
                                onClick={() => setModifyForm((value) => ({ ...value, mode: "in-place" }))}
                              >
                                <strong>Update the shared track</strong>
                                <span>Change it for everyone, including other preps that use it.</span>
                              </button>
                              <button
                                type="button"
                                className={modifyForm.mode === "fork" ? "level-option active" : "level-option"}
                                onClick={() => setModifyForm((value) => ({ ...value, mode: "fork" }))}
                              >
                                <strong>Make a copy for this prep</strong>
                                <span>Keeps the original unchanged; this prep studies the tuned copy.</span>
                              </button>
                            </div>
                            {prepsUsingTrack(item.id).length > 0 && (
                              <p className="muted">
                                Also used by {prepsUsingTrack(item.id).join(", ")} — a copy keeps their version
                                (and progress) unchanged.
                              </p>
                            )}
                            <label>Target level</label>
                            <div className="level-options">
                              {LEVELS.map((level) => (
                                <button
                                  key={level.id}
                                  type="button"
                                  className={modifyForm.level === level.id ? "level-option active" : "level-option"}
                                  onClick={() => setModifyForm((value) => ({ ...value, level: level.id }))}
                                >
                                  <strong>{level.label}</strong>
                                  <span>{level.example}</span>
                                </button>
                              ))}
                            </div>
                            <div className="panel-actions">
                              <button className="btn primary" onClick={submitModify}>
                                <DuoIcon name="rocket" />
                                Queue modification
                              </button>
                              <button className="btn" onClick={() => setModifying(null)}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <button className="btn" onClick={() => startModify(item)}>
                            <DuoIcon name="rocket" />
                            Modify
                          </button>
                        )}
                        {canGoDeeper && !deeperAlreadyRequested && (
                          <button className="btn" onClick={() => requestDeeper(track)}>
                            <DuoIcon name="target" />
                            Go deeper
                          </button>
                        )}
                      </>
                    ) : creating ? (
                      <div className="queued-agent">
                        <button className="btn" disabled>
                          <span className="spinner" />
                          Queued for agent
                        </button>
                        <div className="prompt-card">
                          <span>Paste this into your AI coding agent, opened in the Supercharger folder:</span>
                          <code>{trackCreatePrompt(prep)}</code>
                          <CopyButton text={trackCreatePrompt(prep)} />
                        </div>
                      </div>
                    ) : (
                      <button className="btn primary" onClick={() => requestCreate(item.id)}>
                        <DuoIcon name="rocket" />
                        Create
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {!orderedCurriculum.length && <p className="muted">No curriculum yet. Add a track request or generate the prep with an agent.</p>}
          </div>
        </section>
      ) : active === "resume.md" ? (
        <ResumeTab
          prep={prep}
          body={body}
          hasResume={files.includes("resume.md")}
          onChanged={() => {
            refresh();
            api.prepFile(prep, "resume.md").then((d) => setBody(d.body)).catch(() => {});
          }}
        />
      ) : (
        body && <Markdown text={body} />
      )}
    </div>
  );
}
