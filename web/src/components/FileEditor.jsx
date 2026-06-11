import React, { useEffect, useState, useCallback } from "react";
import { api } from "../api.js";

export default function FileEditor({ session }) {
  const [files, setFiles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [content, setContent] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  const refresh = useCallback(() => {
    api.sandboxFiles(session).then(({ files }) => setFiles(files));
  }, [session]);

  useEffect(() => { refresh(); }, [refresh]);

  const open = async (path) => {
    if (dirty && !confirm("Discard unsaved changes?")) return;
    setSelected(path);
    setDirty(false);
    setSaveMsg(null);
    try {
      const { content } = await api.sandboxReadFile(session, path);
      setContent(content);
    } catch {
      setContent("");
    }
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.sandboxWriteFile(session, selected, content);
      setDirty(false);
      setSaveMsg("Saved");
      setTimeout(() => setSaveMsg(null), 2000);
    } catch (e) {
      setSaveMsg(`Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const onKey = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); save(); }
  };

  const dirs = [...new Set(files.filter((f) => f.includes("/")).map((f) => f.split("/")[0]))];
  const rootFiles = files.filter((f) => !f.includes("/"));

  return (
    <div className="file-editor">
      <div className="file-tree">
        <div className="file-tree-header">
          <span>/work</span>
          <button className="icon-btn" onClick={refresh} title="Refresh">↺</button>
        </div>
        {files.length === 0 && <div className="muted" style={{ padding: "8px 12px", fontSize: 13 }}>Empty</div>}
        {rootFiles.map((f) => (
          <div key={f} className={`file-entry ${selected === f ? "active" : ""}`} onClick={() => open(f)}>{f}</div>
        ))}
        {dirs.map((d) => (
          <div key={d}>
            <div className="file-dir">{d}/</div>
            {files.filter((f) => f.startsWith(d + "/")).map((f) => (
              <div key={f} className={`file-entry sub ${selected === f ? "active" : ""}`} onClick={() => open(f)}>
                {f.slice(d.length + 1)}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="file-pane">
        {selected ? (
          <>
            <div className="file-pane-bar">
              <span className="muted" style={{ fontSize: 13 }}>/work/{selected}</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {saveMsg && <span className={saveMsg.startsWith("Error") ? "error" : "muted"} style={{ fontSize: 13 }}>{saveMsg}</span>}
                <button className="btn small primary" onClick={save} disabled={saving || !dirty}>
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
            <textarea
              className="file-textarea"
              value={content}
              onChange={(e) => { setContent(e.target.value); setDirty(true); setSaveMsg(null); }}
              onKeyDown={onKey}
              spellCheck={false}
            />
          </>
        ) : (
          <div className="muted" style={{ padding: 20, fontSize: 14 }}>Select a file to edit</div>
        )}
      </div>
    </div>
  );
}
