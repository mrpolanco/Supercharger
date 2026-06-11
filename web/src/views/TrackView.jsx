import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import DuoIcon, { topicIcon } from "../components/DuoIcon.jsx";

export default function TrackView({ track, progress }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    api.track(track).then(setData).catch((e) => setError(e.message));
  }, [track]);

  if (error && !data) return <div className="page">Track not found: {error}</div>;
  if (!data) return <div className="page muted">Loading…</div>;

  const total = data.lessons.length;
  const finished = data.lessons.filter((l) => progress.lessons[`${track}/${l.id}`]).length;
  const pct = total ? Math.round((finished / total) * 100) : 0;
  const shareMeta = [
    data.version && `v${data.version}`,
    data.author && `by ${data.author}`,
    data.license && `license: ${data.license}`,
  ].filter(Boolean);

  const exportTrack = async () => {
    setExporting(true);
    setError(null);
    try {
      const blob = await api.exportTrack(track);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${track}.supercharger-track.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="page">
      <a href="#/" className="back">← Home</a>
      <div className="track-head">
        <div>
          <h1 className="page-title"><DuoIcon name={data.icon || topicIcon(data.title, track, data.description)} /> {data.title}</h1>
          <p className="lead">{data.description}</p>
          {data.modifiedFor?.length > 0 && (
            <div className="meta-row">
              <span className="pill accent" title={`This track was tuned for the ${data.modifiedFor.join(", ")} job prep.`}>
                tuned for {data.modifiedFor.join(", ")}
              </span>
            </div>
          )}
          {(shareMeta.length > 0 || data.sourceUrl) && (
            <div className="meta-row">
              {shareMeta.map((item) => <span key={item} className="pill">{item}</span>)}
              {data.sourceUrl && <a className="pill" href={data.sourceUrl} target="_blank" rel="noreferrer">source</a>}
            </div>
          )}
        </div>
        <div className="track-progress">
          <div className={pct === 100 ? "progress complete" : "progress"}>
            <i style={{ width: `${pct}%` }} />
          </div>
          <span>{finished}/{total} complete</span>
          <button className="btn small" onClick={exportTrack} disabled={exporting}>
            <DuoIcon name="upload" />
            {exporting ? "Exporting..." : "Export track"}
          </button>
        </div>
      </div>
      {error && <div className="error">{error}</div>}
      {(data.extras["interview-prep"] || data.extras["resources"]) && (
        <div className="extras">
          {data.extras["interview-prep"] && (
            <a className="btn" href={`#/track/${track}/file/interview-prep.md`}>
              <DuoIcon name="target" /> Interview prep
            </a>
          )}
          {data.extras["resources"] && (
            <a className="btn" href={`#/track/${track}/file/resources.md`}>
              <DuoIcon name="book" /> Resources
            </a>
          )}
        </div>
      )}
      <ol className="lesson-list">
        {data.lessons.map((l, i) => {
          const complete = progress.lessons[`${track}/${l.id}`];
          return (
            <li key={l.id} className={complete ? "done" : ""}>
              <a href={`#/track/${track}/lesson/${l.id}`}>
                <span className="lesson-num">
                  {complete ? <DuoIcon name="approved" /> : i + 1}
                </span>
                <span className="lesson-title">{l.title}</span>
                {l.sandbox && <span className="tag"><DuoIcon name="app" /> terminal</span>}
              </a>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
