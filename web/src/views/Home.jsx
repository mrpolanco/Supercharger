import React, { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import DuoIcon, { topicIcon } from "../components/DuoIcon.jsx";
import CopyButton from "../components/CopyButton.jsx";

const TRACK_SORTS = [
  ["default", "Default order"],
  ["shortest", "Shortest first"],
  ["longest", "Longest first"],
  ["most-complete", "Closest to finished"],
  ["least-complete", "Least started"],
  ["title", "Title A–Z"],
];

const LEVELS = ["beginner", "intermediate", "advanced"];

const GLOBAL_CREATE_PROMPT = `From the cloned Supercharger project folder, create the requested tracks marked creating in track-requests.json at the repo root.
Follow SPEC.md and AGENTS.md, and include createdBy in each track.yaml.`;

export default function Home({ progress }) {
  const [tracks, setTracks] = useState([]);
  const [preps, setPreps] = useState([]);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);
  const [newTrack, setNewTrack] = useState({ title: "", reason: "", level: "beginner" });
  const [sort, setSort] = useState(() => localStorage.getItem("trackSort") || "default");
  const importInput = useRef(null);

  const changeSort = (value) => {
    setSort(value);
    localStorage.setItem("trackSort", value);
  };

  const refresh = () => {
    api.tracks().then(setTracks).catch(() => {});
    api.preps().then(setPreps).catch(() => {});
    api.globalTrackRequests().then(setRequests).catch(() => {});
  };

  useEffect(refresh, []);

  // Requests not yet satisfied by a track folder on disk.
  const trackIds = new Set(tracks.map((t) => t.id));
  const pendingRequests = requests.filter((r) => !trackIds.has(r.id));
  const hasQueuedWork = pendingRequests.some((r) => r.status === "creating");

  useEffect(() => {
    if (!hasQueuedWork) return;
    const timer = setInterval(refresh, 5000);
    return () => clearInterval(timer);
  }, [hasQueuedWork]);

  const done = (trackId, lessons) =>
    (lessons || []).filter((l) => progress.lessons[`${trackId}/${l}`]).length;

  const trackComplete = (trackId) => {
    const track = tracks.find((t) => t.id === trackId);
    if (!track || !(track.lessons || []).length) return false;
    return done(trackId, track.lessons) === track.lessons.length;
  };

  // "ready" when every curriculum item is a completed track; requested tracks
  // and docs-onboarding items that don't exist yet count as incomplete.
  const prepStatus = (prep) => {
    if (!prep.curriculum?.length) return null;
    return prep.curriculum.every((item) => trackComplete(item.id)) ? "ready" : "in-progress";
  };

  // Preps a track belongs to: referenced by their curriculum or track requests.
  const prepsForTrack = (trackId) =>
    preps
      .filter(
        (p) =>
          (p.curriculum || []).some((c) => c.id === trackId) ||
          (p.trackRequests || []).some((r) => r.id === trackId || r.forkTo === trackId)
      )
      .map((p) => p.id);

  const removeTrack = async (event, track) => {
    event.preventDefault();
    event.stopPropagation();
    const ok = window.confirm(`Delete "${track.title || track.id}"? This removes the track folder from disk.`);
    if (!ok) return;
    try {
      await api.deleteTrack(track.id);
      setTracks((items) => items.filter((item) => item.id !== track.id));
    } catch (e) {
      setError(e.message);
    }
  };

  const addTrack = async () => {
    setError(null);
    try {
      await api.addGlobalTrackRequest(newTrack);
      setNewTrack({ title: "", reason: "", level: "beginner" });
      setAdding(false);
      refresh();
    } catch (e) {
      setError(e.message);
    }
  };

  const queueRequest = async (id) => {
    setError(null);
    try {
      await api.createGlobalTrackRequest(id);
      refresh();
    } catch (e) {
      setError(e.message);
    }
  };

  const dismissRequest = async (event, id) => {
    event.preventDefault();
    event.stopPropagation();
    if (!window.confirm(`Remove the request "${id}"?`)) return;
    try {
      await api.deleteGlobalTrackRequest(id);
      refresh();
    } catch (e) {
      setError(e.message);
    }
  };

  const importTrack = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(null);
    setImporting(true);
    try {
      const result = await api.importTrack(file);
      refresh();
      window.alert(`Imported "${result.title || result.id}" as ${result.id}.`);
    } catch (e) {
      if (e.status === 409 && e.data?.existingId) {
        const rename = window.confirm(
          `Track "${e.data.existingId}" already exists.\n\nPress OK to import as "${e.data.suggestedId}", or Cancel to replace the existing track.`
        );
        const replace = !rename && window.confirm(`Replace the existing "${e.data.existingId}" track? This removes that track folder first.`);
        if (!rename && !replace) {
          setImporting(false);
          return;
        }
        try {
          const result = await api.importTrack(file, rename ? "rename" : "replace");
          refresh();
          window.alert(`${rename ? "Imported" : "Replaced"} track "${result.title || result.id}" as ${result.id}.`);
        } catch (retryError) {
          setError(retryError.message);
        }
      } else {
        setError(e.message);
      }
    } finally {
      setImporting(false);
    }
  };

  const pctDone = (t) => {
    const total = (t.lessons || []).length;
    return total ? done(t.id, t.lessons) / total : 0;
  };
  const sortedTracks = [...tracks].sort((a, b) => {
    switch (sort) {
      case "shortest": return (a.lessons || []).length - (b.lessons || []).length;
      case "longest": return (b.lessons || []).length - (a.lessons || []).length;
      case "most-complete": return pctDone(b) - pctDone(a);
      case "least-complete": return pctDone(a) - pctDone(b);
      case "title": return (a.title || a.id).localeCompare(b.title || b.id);
      default: return 0;
    }
  });

  return (
    <div className="page">
      <div className="section-head">
        <h1>Tracks</h1>
        {tracks.length > 0 && <span className="count">{tracks.length}</span>}
        <button className="btn small" onClick={() => setAdding((v) => !v)}>
          <DuoIcon name="add" />
          {adding ? "Cancel" : "Add track"}
        </button>
        <button className="btn small" onClick={() => importInput.current?.click()} disabled={importing}>
          <DuoIcon name="upload" />
          {importing ? "Importing..." : "Import track"}
        </button>
        <input
          ref={importInput}
          type="file"
          accept=".zip,.supercharger-track.zip,application/zip,application/octet-stream"
          onChange={importTrack}
          style={{ display: "none" }}
        />
        {tracks.length > 1 && (
          <select
            className="sort-select"
            value={sort}
            onChange={(e) => changeSort(e.target.value)}
            title="Sort tracks"
          >
            {TRACK_SORTS.map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
        )}
      </div>
      {error && <div className="error">{error}</div>}
      {adding && (
        <div className="add-track-form">
          <label>Track idea</label>
          <input
            value={newTrack.title}
            onChange={(e) => setNewTrack((v) => ({ ...v, title: e.target.value }))}
            placeholder="Regular expressions for log analysis"
          />
          <label>Why add it?</label>
          <textarea
            rows={2}
            value={newTrack.reason}
            onChange={(e) => setNewTrack((v) => ({ ...v, reason: e.target.value }))}
            placeholder="Not tied to a job prep — I just want the skill."
          />
          <label>Confidence level</label>
          <select
            value={newTrack.level}
            onChange={(e) => setNewTrack((v) => ({ ...v, level: e.target.value }))}
          >
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <button className="btn primary" disabled={!newTrack.title.trim()} onClick={addTrack}>
            <DuoIcon name="add" />
            Request track
          </button>
        </div>
      )}
      <div className="cards">
        {sortedTracks.map((t) => {
          const total = (t.lessons || []).length;
          const finished = done(t.id, t.lessons);
          const pct = total ? Math.round((finished / total) * 100) : 0;
          const usedBy = prepsForTrack(t.id);
          return (
            <a className="card" key={t.id} href={`#/track/${t.id}`}>
              <button
                className="icon-btn card-action"
                type="button"
                aria-label={`Delete ${t.title || t.id}`}
                title="Delete track"
                onClick={(event) => removeTrack(event, t)}
              >
                ✕
              </button>
              <div className="card-title">
                <span className="card-icon"><DuoIcon name={t.icon || topicIcon(t.title, t.id, t.description)} /></span>
                <h3>{t.title}</h3>
              </div>
              <p>{t.description}</p>
              <div className="card-footer">
                <div className={pct === 100 ? "progress complete" : "progress"}>
                  <i style={{ width: `${pct}%` }} />
                </div>
                <div className="meta">
                  <DuoIcon name="approved" />
                  {finished}/{total} lessons complete
                </div>
                {usedBy.length > 0 && (
                  <div className="meta subdued card-tags">
                    <DuoIcon name="target" />
                    {usedBy.map((p) => (
                      <span key={p} className="pill">{p}</span>
                    ))}
                  </div>
                )}
                {(t.createdBy || t.created_by || t.generator?.tool) && (
                  <div className="meta subdued">
                    <DuoIcon name="app" />
                    Created by {t.createdBy || t.created_by || t.generator.tool}
                  </div>
                )}
              </div>
            </a>
          );
        })}
        {pendingRequests.map((r) => (
          <div className="card card-requested" key={r.id}>
            <button
              className="icon-btn card-action"
              type="button"
              aria-label={`Remove request ${r.id}`}
              title="Remove request"
              onClick={(event) => dismissRequest(event, r.id)}
            >
              ✕
            </button>
            <div className="card-title">
              <span className="card-icon"><DuoIcon name={topicIcon(r.title, r.id, r.reason)} /></span>
              <h3>{r.title}</h3>
            </div>
            <p>{r.reason}</p>
            <div className="card-footer">
              <div className="meta subdued">
                <span className="pill accent">{r.status}</span>
                <span className="pill blue">{r.level}</span>
              </div>
              {r.status === "creating" ? (
                <div className="queued-agent">
                  <button className="btn" disabled>
                    <span className="spinner" />
                    Queued for agent
                  </button>
                  <div className="prompt-card">
                    <span>Paste this into your AI coding agent, opened in the Supercharger folder:</span>
                    <code>{GLOBAL_CREATE_PROMPT}</code>
                    <CopyButton text={GLOBAL_CREATE_PROMPT} />
                  </div>
                </div>
              ) : (
                <button className="btn primary" onClick={() => queueRequest(r.id)}>
                  <DuoIcon name="rocket" />
                  Create
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {tracks.length === 0 && pendingRequests.length === 0 && (
        <div className="empty-state">
          No tracks yet. Use <strong>Add track</strong> above, or ask your AI assistant to generate one — in Claude Code or Gemini CLI, try <code>/track</code>.
        </div>
      )}

      <div className="section-head">
        <h1>Job preps</h1>
        {preps.length > 0 && <span className="count">{preps.length}</span>}
      </div>
      <div className="cards">
        {preps.map((p) => (
          <a className="card" key={p.id} href={`#/prep/${p.id}`}>
            <div className="card-title">
              <span className="card-icon"><DuoIcon name="target" /></span>
              <h3>{p.id}</h3>
            </div>
            <div className="card-footer">
              {prepStatus(p) === "ready" && <div><span className="badge-done"><DuoIcon name="approved" /> Ready</span></div>}
              {prepStatus(p) === "in-progress" && <div><span className="badge-progress">In progress</span></div>}
              <div className="meta subdued"><DuoIcon name="app" /> {p.files.length} documents</div>
              {!!p.trackRequests?.length && (
                <div className="meta subdued"><DuoIcon name="target" /> {p.trackRequests.length} suggested tracks</div>
              )}
            </div>
          </a>
        ))}
        <a className="card card-new" href="#/prep/new">
          <div className="card-title">
            <span className="card-icon"><DuoIcon name="add" /></span>
            <h3>New job prep</h3>
          </div>
          <p>Paste a job posting, then hand it to your AI assistant to analyze and build your study plan.</p>
        </a>
      </div>
    </div>
  );
}
