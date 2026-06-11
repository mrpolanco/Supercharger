import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import Markdown from "../components/Markdown.jsx";

export default function MarkdownPage({ track, file }) {
  const [body, setBody] = useState(null);

  useEffect(() => {
    api.trackFile(track, file).then((d) => setBody(d.body)).catch(() => setBody("Not found."));
  }, [track, file]);

  return (
    <div className="page">
      <a href={`#/track/${track}`} className="back">← Back to track</a>
      {body === null ? <p className="muted">Loading…</p> : <Markdown text={body} />}
    </div>
  );
}
