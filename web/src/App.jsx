import React, { useEffect, useState, useCallback } from "react";
import { api } from "./api.js";
import Home from "./views/Home.jsx";
import TrackView from "./views/TrackView.jsx";
import LessonView from "./views/LessonView.jsx";
import MarkdownPage from "./views/MarkdownPage.jsx";
import PrepView from "./views/PrepView.jsx";
import NewPrep from "./views/NewPrep.jsx";
import Resumes from "./views/Resumes.jsx";
import DuoIcon from "./components/DuoIcon.jsx";

const DOCS_BASE = "https://mrpolanco.github.io/Supercharger-docs";

// Map the current route to the most relevant docs page.
function helpUrl(route) {
  if (route[0] === "track" && route[2] === "lesson") return `${DOCS_BASE}/guides/lessons/`;
  if (route[0] === "track") return `${DOCS_BASE}/guides/generating-a-track/`;
  if (route[0] === "resumes") return `${DOCS_BASE}/guides/job-prep/#resume-tab-and-the-resume-library`;
  if (route[0] === "prep") return `${DOCS_BASE}/guides/job-prep/`;
  return `${DOCS_BASE}/introduction/quickstart/`;
}

function parseHash() {
  const parts = window.location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  return parts; // e.g. ["track", "sql-fundamentals", "lesson", "01-..."]
}

export default function App() {
  const [route, setRoute] = useState(parseHash());
  const [progress, setProgress] = useState({ lessons: {}, quizzes: {} });
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const [localAccess, setLocalAccess] = useState(null);
  const [savingLocalAccess, setSavingLocalAccess] = useState(false);
  const [restarting, setRestarting] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    api.progress().then(setProgress).catch(() => {});
  }, []);

  useEffect(() => {
    api.localAccess().then(setLocalAccess).catch(() => {});
  }, []);

  useEffect(() => {
    if (!restarting) return undefined;
    let cancelled = false;
    const timer = window.setInterval(async () => {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        if (!res.ok) return;
        if (cancelled) return;
        window.location.reload();
      } catch {}
    }, 1000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [restarting]);

  const updateProgress = useCallback((fn) => {
    setProgress((prev) => {
      const next = fn(structuredClone(prev));
      api.saveProgress(next).catch(() => {});
      return next;
    });
  }, []);

  let view;
  if (route[0] === "track" && route[2] === "lesson") {
    view = (
      <LessonView
        key={`${route[1]}/${route[3]}`}
        track={route[1]}
        lesson={route[3]}
        progress={progress}
        updateProgress={updateProgress}
      />
    );
  } else if (route[0] === "track" && route[2] === "file") {
    view = <MarkdownPage track={route[1]} file={route[3]} />;
  } else if (route[0] === "track") {
    view = <TrackView track={route[1]} progress={progress} />;
  } else if (route[0] === "resumes") {
    view = <Resumes />;
  } else if (route[0] === "prep" && route[1] === "new") {
    view = <NewPrep />;
  } else if (route[0] === "prep") {
    view = <PrepView prep={route[1]} file={route[2]} progress={progress} />;
  } else {
    view = <Home progress={progress} />;
  }

  const [stopping, setStopping] = useState(false);

  const shutdown = async () => {
    if (!confirm("Stop the Supercharger server? This will kill all running sandbox containers.")) return;
    setStopping(true);
    try { await api.shutdown(); } catch {}
    setStopping(false);
  };

  const toggleLocalAccess = async () => {
    if (!localAccess || localAccess.envManaged) return;
    const nextEnabled = !localAccess.enabled;
    if (nextEnabled) {
      const ok = confirm(
        "Allow other devices on your local network to open Supercharger after restart?\n\nOnly enable this on a trusted network. Anyone who can reach the app can view your local tracks and preps, import tracks, and start sandbox exercises."
      );
      if (!ok) return;
    }
    setSavingLocalAccess(true);
    try {
      setLocalAccess(await api.saveLocalAccess(nextEnabled));
    } catch (e) {
      alert(e.message);
    } finally {
      setSavingLocalAccess(false);
    }
  };

  const restart = async () => {
    if (!localAccess?.supervised) return;
    if (!confirm("Restart Supercharger now? Running sandbox terminals will disconnect and reconnect after the services come back.")) return;
    setRestarting(true);
    try {
      await api.restart();
    } catch (e) {
      setRestarting(false);
      alert(e.message);
    }
  };

  const localAccessLabel = localAccess?.enabled ? "Allowed" : "Blocked";
  let localAccessHint = "Checking access setting...";
  if (localAccess) {
    if (localAccess.envManaged) {
      localAccessHint = "Controlled by HOST or LOCAL_ACCESS_ENABLED.";
    } else if (localAccess.restartRequired && localAccess.enabled && localAccess.desiredUrl) {
      localAccessHint = `Other devices can use ${localAccess.desiredUrl} after restart.`;
    } else if (localAccess.restartRequired && !localAccess.enabled) {
      localAccessHint = "Only this machine can connect after restart.";
    } else if (localAccess.enabled && localAccess.currentUrl) {
      localAccessHint = `Other devices can use ${localAccess.currentUrl}`;
    } else {
      localAccessHint = "Only this machine can reach the app.";
    }
  }

  return (
    <div className="app">
      {restarting && (
        <div className="restart-banner">
          <DuoIcon name="clock" />
          Restarting Supercharger… the page will reload automatically when the server is back.
        </div>
      )}
      <header>
        <a href="#/" className="brand">
          <span className="brand-mark"><DuoIcon name="rocket" /></span>
          Supercharger
        </a>
        <nav>
          <a href="#/"><DuoIcon name="book" /> Tracks</a>
          <a href="#/prep/new"><DuoIcon name="target" /> New job prep</a>
          <a href="#/resumes"><DuoIcon name="app" /> Resumes</a>
          <a
            className="btn small"
            href={helpUrl(route)}
            target="_blank"
            rel="noreferrer"
            title="Open the docs page for this screen"
          >
            <DuoIcon name="info" /> Help
          </a>
          <div className="header-access">
            <button
              className={`btn small access-toggle ${localAccess?.enabled ? "active" : ""}`}
              onClick={toggleLocalAccess}
              disabled={!localAccess || savingLocalAccess || localAccess.envManaged}
              title={localAccess?.enabled ? "Block other devices on next restart" : "Allow other devices on next restart"}
            >
              <DuoIcon name="world" />
              {savingLocalAccess ? "Saving..." : `Other devices: ${localAccessLabel}`}
            </button>
            <span className={`header-access-hint ${localAccess?.restartRequired ? "pending" : ""}`}>
              {localAccessHint}
            </span>
          </div>
          <button
            className="btn small theme-toggle"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            disabled={restarting}
          >
            <DuoIcon name={theme === "dark" ? "sun" : "moon"} />
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <button
            className="btn small"
            onClick={restart}
            disabled={!localAccess?.supervised || restarting}
            title={localAccess?.supervised ? "Restart both the server and web services" : "Restart is available only when launched via npm run dev"}
          >
            <DuoIcon name="rocket" />
            {restarting ? "Restarting…" : "Restart service"}
          </button>
          <button className="btn small" onClick={shutdown} disabled={stopping} title="Kill all containers and stop the server">
            {stopping ? "Stopping…" : "Stop server"}
          </button>
        </nav>
      </header>
      <main>{view}</main>
    </div>
  );
}
