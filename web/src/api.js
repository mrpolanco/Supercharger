async function j(url, opts) {
  const res = await fetch(url, opts);
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(res.ok ? "Server returned a non-JSON response" : `${res.status} ${res.statusText} — try restarting the server`);
  }
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

async function download(url) {
  const res = await fetch(url);
  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = await res.json();
      message = data.error || message;
    } catch {}
    throw new Error(message);
  }
  return res.blob();
}

async function uploadTrackPackage(file, conflict = "fail") {
  const res = await fetch(`/api/tracks/import?conflict=${encodeURIComponent(conflict)}`, {
    method: "POST",
    headers: { "Content-Type": file.type || "application/zip" },
    body: await file.arrayBuffer(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error || res.statusText);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

export const api = {
  tracks: () => j("/api/tracks"),
  track: (id) => j(`/api/tracks/${id}`),
  exportTrack: (id) => download(`/api/tracks/${id}/export`),
  importTrack: uploadTrackPackage,
  deleteTrack: (id) => j(`/api/tracks/${id}`, { method: "DELETE" }),
  lesson: (track, lesson) => j(`/api/tracks/${track}/lessons/${lesson}`),
  trackFile: (track, file) => j(`/api/tracks/${track}/files/${file}`),
  globalTrackRequests: () => j("/api/track-requests"),
  addGlobalTrackRequest: (request) =>
    j("/api/track-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    }),
  createGlobalTrackRequest: (id) => j(`/api/track-requests/${id}/create`, { method: "POST" }),
  deleteGlobalTrackRequest: (id) => j(`/api/track-requests/${id}`, { method: "DELETE" }),
  preps: () => j("/api/preps"),
  deletePrep: (prep, deleteTracks) =>
    j(`/api/preps/${prep}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deleteTracks }),
    }),
  prepFile: (prep, file) => j(`/api/preps/${prep}/files/${file}`),
  reorderCurriculum: (prep, ids) =>
    j(`/api/preps/${prep}/curriculum`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    }),
  addTrackRequest: (prep, request) =>
    j(`/api/preps/${prep}/track-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    }),
  addOnboardingRequest: (prep, request) =>
    j(`/api/preps/${prep}/onboarding-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    }),
  createOnboardingRequest: (prep, request) =>
    j(`/api/preps/${prep}/onboarding-requests/${request}/create`, { method: "POST" }),
  updateTrackRequest: (prep, track, request) =>
    j(`/api/preps/${prep}/track-requests/${track}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    }),
  createTrackRequest: (prep, track) => j(`/api/preps/${prep}/track-requests/${track}/create`, { method: "POST" }),
  modifyTrackRequest: (prep, track, payload) =>
    j(`/api/preps/${prep}/track-requests/${track}/modify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  createPrep: (name, posting, resume, resumeId) =>
    j("/api/preps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, posting, resume, resumeId }),
    }),
  setPrepResume: (prep, payload) =>
    j(`/api/preps/${prep}/resume`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  resumes: () => j("/api/resumes"),
  resume: (id) => j(`/api/resumes/${id}`),
  createResume: (name, content) =>
    j("/api/resumes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, content }),
    }),
  deleteResume: (id) => j(`/api/resumes/${id}`, { method: "DELETE" }),
  progress: () => j("/api/progress"),
  saveProgress: (p) =>
    j("/api/progress", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    }),
  localAccess: () => j("/api/local-access"),
  saveLocalAccess: (enabled) =>
    j("/api/local-access", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    }),
  health: () => j("/api/health"),
  sandboxStart: (track, lesson) =>
    j("/api/sandbox/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ track, lesson }),
    }),
  sandboxCheck: (id) => j(`/api/sandbox/${id}/check`, { method: "POST" }),
  sandboxStop: (id) => j(`/api/sandbox/${id}`, { method: "DELETE" }),
  sandboxFiles: (id) => j(`/api/sandbox/${id}/files`),
  sandboxReadFile: (id, path) => j(`/api/sandbox/${id}/files/${path}`),
  sandboxWriteFile: (id, path, content) =>
    j(`/api/sandbox/${id}/files/${path}`, {
      method: "PUT",
      headers: { "Content-Type": "text/plain" },
      body: content,
    }),
  restart: () => j("/api/restart", { method: "POST" }),
  shutdown: () => j("/api/shutdown", { method: "POST" }),
};
