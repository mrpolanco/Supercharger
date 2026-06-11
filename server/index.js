import express from "express";
import { WebSocketServer } from "ws";
import { createServer } from "http";
import { spawn, execFile } from "child_process";
import pty from "node-pty";
import yaml from "js-yaml";
import fs from "fs/promises";
import os from "os";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import {
  API_PORT,
  RESTART_EXIT_CODE,
  WEB_PORT,
  envOverridesLocalAccess,
  getLanIpv4Addresses,
  listenerHostForEnabled,
  readLocalAccessConfig,
  resolveLocalAccessEnabled,
  writeLocalAccessConfig,
} from "../local-access-config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const TRACKS_DIR = path.join(ROOT, "tracks");
const PREPS_DIR = path.join(ROOT, "preps");
const RESUMES_DIR = path.join(ROOT, "resumes");
const PROGRESS_FILE = path.join(ROOT, "progress.json");
const LOCAL_ACCESS_ENABLED = resolveLocalAccessEnabled();
const HOST = process.env.HOST || listenerHostForEnabled(LOCAL_ACCESS_ENABLED);
const PORT = API_PORT;
const SUPERVISED = process.env.SUPERCHARGER_SUPERVISED === "1";

// node-pty's posix_spawnp doesn't reliably resolve commands via PATH —
// resolve the docker binary to an absolute path once at startup.
import { execSync } from "child_process";
let DOCKER_BIN = "docker";
try {
  DOCKER_BIN = execSync("command -v docker", { shell: "/bin/sh" }).toString().trim() || "docker";
} catch {}

const app = express();
app.use(express.json({ limit: "2mb" }));

// ---------- helpers ----------

// Minimal frontmatter parser: returns { meta, body }
function parseFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { meta: {}, body: text };
  return { meta: yaml.load(m[1]) || {}, body: text.slice(m[0].length) };
}

function safeName(s) {
  if (!/^[\w][\w.-]*$/.test(s)) throw new Error(`Invalid name: ${s}`);
  return s;
}

function slugify(s) {
  const id = String(s || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^\w]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return safeName(id || `track-${Date.now()}`);
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    return fallback;
  }
}

async function writeJson(file, value) {
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

async function readProgress() {
  try {
    return JSON.parse(await fs.readFile(PROGRESS_FILE, "utf8"));
  } catch {
    return { lessons: {}, quizzes: {} };
  }
}

async function getLocalAccessStatus() {
  const configured = await readLocalAccessConfig();
  const addresses = getLanIpv4Addresses();
  const currentUrl = LOCAL_ACCESS_ENABLED && addresses[0] ? `http://${addresses[0]}:${WEB_PORT}` : null;
  const desiredUrl = configured.enabled && addresses[0] ? `http://${addresses[0]}:${WEB_PORT}` : null;
  const envManaged = envOverridesLocalAccess();
  return {
    enabled: envManaged ? LOCAL_ACCESS_ENABLED : configured.enabled,
    currentEnabled: LOCAL_ACCESS_ENABLED,
    restartRequired: !envManaged && configured.enabled !== LOCAL_ACCESS_ENABLED,
    envManaged,
    supervised: SUPERVISED,
    host: HOST,
    webPort: WEB_PORT,
    apiPort: PORT,
    addresses,
    currentUrl,
    desiredUrl,
  };
}

function docker(args, opts = {}) {
  return new Promise((resolve, reject) => {
    execFile("docker", args, { maxBuffer: 10 * 1024 * 1024, ...opts }, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr || err.message));
      else resolve(stdout.trim());
    });
  });
}

function execFileP(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { maxBuffer: 20 * 1024 * 1024, ...opts }, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr || err.message));
      else resolve(stdout);
    });
  });
}

async function pathExists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function dirSize(dir) {
  let total = 0;
  let files = 0;
  async function walk(current) {
    for (const item of await fs.readdir(current, { withFileTypes: true })) {
      const full = path.join(current, item.name);
      if (item.isSymbolicLink()) throw new Error("Track packages may not contain symlinks");
      if (item.isDirectory()) {
        if (["node_modules", "__pycache__", "dist", "build", ".git"].includes(item.name)) {
          throw new Error(`Track package contains generated or unsafe directory: ${item.name}`);
        }
        await walk(full);
      } else if (item.isFile()) {
        const stat = await fs.stat(full);
        total += stat.size;
        files += 1;
        if (stat.size > 5 * 1024 * 1024) throw new Error(`Track package contains a large file: ${item.name}`);
      }
    }
  }
  await walk(dir);
  if (files > 250) throw new Error("Track package contains too many files");
  if (total > 50 * 1024 * 1024) throw new Error("Track package is larger than 50 MB");
  return { files, total };
}

function validateFencedJson(text, file) {
  const re = /```(quiz|practice)\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(text))) {
    try {
      JSON.parse(m[2]);
    } catch (e) {
      throw new Error(`${file} has invalid ${m[1]} JSON: ${e.message}`);
    }
  }
}

async function validateTrackDir(dir) {
  await dirSize(dir);
  const trackYaml = path.join(dir, "track.yaml");
  const track = yaml.load(await fs.readFile(trackYaml, "utf8"));
  if (!track || typeof track !== "object") throw new Error("track.yaml must contain a YAML object");
  if (!track.title) throw new Error("track.yaml is missing title");
  if (!Array.isArray(track.lessons) || track.lessons.length === 0) {
    throw new Error("track.yaml must include a non-empty lessons array");
  }
  for (const lesson of track.lessons) {
    if (typeof lesson !== "string") throw new Error("track.yaml lessons must be folder id strings");
    safeName(lesson);
    const lessonFile = path.join(dir, lesson, "lesson.md");
    const raw = await fs.readFile(lessonFile, "utf8");
    const { meta } = parseFrontmatter(raw);
    if (!meta.title) throw new Error(`${lesson}/lesson.md is missing frontmatter title`);
    validateFencedJson(raw, `${lesson}/lesson.md`);
    const sandbox = path.join(dir, lesson, "sandbox");
    if (await pathExists(sandbox)) {
      if (!(await pathExists(path.join(sandbox, "Dockerfile")))) {
        throw new Error(`${lesson}/sandbox exists but has no Dockerfile`);
      }
    }
  }
  for (const file of ["interview-prep.md", "resources.md"]) {
    const maybe = path.join(dir, file);
    if (await pathExists(maybe)) validateFencedJson(await fs.readFile(maybe, "utf8"), file);
  }
  return track;
}

function nextTrackId(base, existing) {
  let i = 2;
  let id = `${base}-${i}`;
  while (existing.has(id)) {
    i += 1;
    id = `${base}-${i}`;
  }
  return id;
}

// ---------- tracks ----------

app.get("/api/tracks", async (_req, res) => {
  const out = [];
  let dirs = [];
  try {
    dirs = await fs.readdir(TRACKS_DIR);
  } catch {}
  for (const dir of dirs) {
    try {
      const track = yaml.load(await fs.readFile(path.join(TRACKS_DIR, dir, "track.yaml"), "utf8"));
      out.push({ id: dir, ...track });
    } catch {}
  }
  res.json(out);
});

app.delete("/api/tracks/:track", async (req, res) => {
  try {
    const track = safeName(req.params.track);
    const dir = path.join(TRACKS_DIR, track);
    const stat = await fs.stat(dir);
    if (!stat.isDirectory()) throw new Error("not a track");
    await fs.rm(dir, { recursive: true, force: false });
    res.json({ ok: true });
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

app.get("/api/tracks/:track/export", async (req, res) => {
  let tmp;
  try {
    const trackId = safeName(req.params.track);
    const source = path.join(TRACKS_DIR, trackId);
    const stat = await fs.stat(source);
    if (!stat.isDirectory()) throw new Error("not a track");
    const track = await validateTrackDir(source);
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), "supercharger-export-"));
    const packageDir = path.join(tmp, "package");
    await fs.mkdir(packageDir);
    await fs.cp(source, path.join(packageDir, trackId), { recursive: true });
    await writeJson(path.join(packageDir, "supercharger-track.json"), {
      format: "supercharger-track",
      version: 1,
      id: trackId,
      title: track.title,
      exportedAt: new Date().toISOString(),
    });
    const zipFile = path.join(tmp, `${trackId}.supercharger-track.zip`);
    await execFileP("zip", ["-qr", zipFile, "supercharger-track.json", trackId], { cwd: packageDir });
    res.download(zipFile, `${trackId}.supercharger-track.zip`, async (err) => {
      if (err) console.error(err);
      if (tmp) await fs.rm(tmp, { recursive: true, force: true }).catch(() => {});
    });
  } catch (e) {
    if (tmp) await fs.rm(tmp, { recursive: true, force: true }).catch(() => {});
    res.status(400).json({ error: e.message });
  }
});

app.post("/api/tracks/import", express.raw({ type: ["application/zip", "application/octet-stream"], limit: "50mb" }), async (req, res) => {
  let tmp;
  try {
    const conflict = ["fail", "rename", "replace"].includes(req.query.conflict) ? req.query.conflict : "fail";
    if (!req.body?.length) throw new Error("No track package uploaded");
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), "supercharger-import-"));
    const zipFile = path.join(tmp, "track.zip");
    await fs.writeFile(zipFile, req.body);

    const list = (await execFileP("unzip", ["-Z1", zipFile]))
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (!list.length) throw new Error("Track package is empty");
    for (const entry of list) {
      if (entry.startsWith("/") || entry.includes("..") || entry.includes("\\") || entry.startsWith("__MACOSX/")) {
        throw new Error(`Unsafe zip entry: ${entry}`);
      }
    }

    const roots = new Set(list.map((entry) => entry.split("/")[0]).filter((root) => root !== "supercharger-track.json"));
    if (roots.size !== 1) throw new Error("Track package must contain exactly one track folder");
    const packagedId = safeName([...roots][0]);

    const extractDir = path.join(tmp, "extract");
    await fs.mkdir(extractDir);
    await execFileP("unzip", ["-q", zipFile, "-d", extractDir]);
    const extractedTrack = path.join(extractDir, packagedId);
    const track = await validateTrackDir(extractedTrack);

    let targetId = packagedId;
    const existing = new Set();
    for (const item of await fs.readdir(TRACKS_DIR).catch(() => [])) {
      try {
        existing.add(safeName(item));
      } catch {}
    }
    const target = () => path.join(TRACKS_DIR, targetId);
    if (existing.has(targetId)) {
      if (conflict === "fail") {
        return res.status(409).json({
          error: `Track "${targetId}" already exists`,
          existingId: targetId,
          suggestedId: nextTrackId(targetId, existing),
        });
      }
      if (conflict === "rename") {
        targetId = nextTrackId(targetId, existing);
      } else if (conflict === "replace") {
        await fs.rm(target(), { recursive: true, force: true });
      }
    }
    await fs.cp(extractedTrack, target(), { recursive: true });
    res.json({ id: targetId, title: track.title, replaced: conflict === "replace" && existing.has(packagedId) });
  } catch (e) {
    res.status(400).json({ error: e.message });
  } finally {
    if (tmp) await fs.rm(tmp, { recursive: true, force: true }).catch(() => {});
  }
});

app.get("/api/tracks/:track", async (req, res) => {
  try {
    const dir = path.join(TRACKS_DIR, safeName(req.params.track));
    const track = yaml.load(await fs.readFile(path.join(dir, "track.yaml"), "utf8"));
    const lessons = [];
    for (const lessonId of track.lessons || []) {
      const raw = await fs.readFile(path.join(dir, lessonId, "lesson.md"), "utf8");
      const { meta } = parseFrontmatter(raw);
      let hasSandbox = false;
      try {
        await fs.access(path.join(dir, lessonId, "sandbox", "Dockerfile"));
        hasSandbox = true;
      } catch {}
      lessons.push({ id: lessonId, title: meta.title || lessonId, sandbox: hasSandbox });
    }
    const extras = {};
    for (const f of ["interview-prep.md", "resources.md"]) {
      try {
        await fs.access(path.join(dir, f));
        extras[f.replace(".md", "")] = true;
      } catch {}
    }
    res.json({ id: req.params.track, ...track, lessons, extras });
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

app.get("/api/tracks/:track/lessons/:lesson", async (req, res) => {
  try {
    const dir = path.join(TRACKS_DIR, safeName(req.params.track), safeName(req.params.lesson));
    const raw = await fs.readFile(path.join(dir, "lesson.md"), "utf8");
    const { meta, body } = parseFrontmatter(raw);
    let hasSandbox = false;
    try {
      await fs.access(path.join(dir, "sandbox", "Dockerfile"));
      hasSandbox = true;
    } catch {}
    res.json({ meta, body, sandbox: hasSandbox });
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

app.get("/api/tracks/:track/files/:file", async (req, res) => {
  try {
    const file = req.params.file;
    if (!["interview-prep.md", "resources.md"].includes(file)) throw new Error("not allowed");
    const raw = await fs.readFile(path.join(TRACKS_DIR, safeName(req.params.track), file), "utf8");
    res.json({ body: raw });
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

// ---------- standalone track requests (not tied to a prep) ----------

const ROOT_REQUESTS_FILE = path.join(ROOT, "track-requests.json");

app.get("/api/track-requests", async (_req, res) => {
  let requests = await readJson(ROOT_REQUESTS_FILE, []);
  if (!Array.isArray(requests)) requests = [];
  res.json(requests);
});

app.post("/api/track-requests", async (req, res) => {
  try {
    let requests = await readJson(ROOT_REQUESTS_FILE, []);
    if (!Array.isArray(requests)) requests = [];
    const title = String(req.body.title || "").trim();
    if (!title) throw new Error("Track title is required");
    const id = slugify(req.body.id || title);
    if (requests.some((item) => item.id === id)) throw new Error("Track request already exists");
    const item = {
      id,
      title,
      level: req.body.level || "beginner",
      depth: req.body.depth || "standard",
      priority: req.body.priority || "medium",
      reason: req.body.reason || "User-added track request.",
      status: "suggested",
      createdBy: "User",
    };
    requests.push(item);
    await writeJson(ROOT_REQUESTS_FILE, requests);
    res.json({ item });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post("/api/track-requests/:id/create", async (req, res) => {
  try {
    const id = safeName(req.params.id);
    const requests = await readJson(ROOT_REQUESTS_FILE, []);
    const index = requests.findIndex((item) => item.id === id);
    if (index < 0) throw new Error("track request not found");
    requests[index] = { ...requests[index], status: "creating", requestedAt: new Date().toISOString() };
    await writeJson(ROOT_REQUESTS_FILE, requests);
    res.json({ item: requests[index] });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.delete("/api/track-requests/:id", async (req, res) => {
  try {
    const id = safeName(req.params.id);
    let requests = await readJson(ROOT_REQUESTS_FILE, []);
    if (!requests.some((item) => item.id === id)) throw new Error("track request not found");
    requests = requests.filter((item) => item.id !== id);
    await writeJson(ROOT_REQUESTS_FILE, requests);
    res.json({ ok: true });
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

// ---------- preps ----------

app.get("/api/preps", async (_req, res) => {
  const out = [];
  let dirs = [];
  try {
    dirs = await fs.readdir(PREPS_DIR);
  } catch {}
  for (const dir of dirs) {
    if (dir.startsWith(".") || dir === "README.md") continue;
    const stat = await fs.stat(path.join(PREPS_DIR, dir)).catch(() => null);
    if (!stat?.isDirectory()) continue;
    const prepDir = path.join(PREPS_DIR, dir);
    const files = (await fs.readdir(prepDir)).filter((f) => f.endsWith(".md"));
    let trackRequests = await readJson(path.join(prepDir, "track-requests.json"), []);
    if (!Array.isArray(trackRequests)) trackRequests = [];
    let curriculum = await readJson(path.join(prepDir, "curriculum.json"), null);
    if (!Array.isArray(curriculum)) curriculum = null;
    let onboardingRequests = await readJson(path.join(prepDir, "onboarding-requests.json"), []);
    if (!Array.isArray(onboardingRequests)) onboardingRequests = [];
    out.push({ id: dir, files, trackRequests, onboardingRequests, curriculum });
  }
  res.json(out);
});

app.get("/api/preps/:prep/files/:file", async (req, res) => {
  try {
    if (!req.params.file.endsWith(".md")) throw new Error("not allowed");
    const raw = await fs.readFile(
      path.join(PREPS_DIR, safeName(req.params.prep), safeName(req.params.file)),
      "utf8"
    );
    res.json({ body: raw });
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

app.put("/api/preps/:prep/curriculum", async (req, res) => {
  try {
    const prepDir = path.join(PREPS_DIR, safeName(req.params.prep));
    const curriculumFile = path.join(prepDir, "curriculum.json");
    const curriculum = await readJson(curriculumFile, []);
    if (!Array.isArray(curriculum)) throw new Error("curriculum.json must be an array");
    const ids = req.body.ids;
    if (!Array.isArray(ids) || !ids.length) throw new Error("ids must be a non-empty array");

    const byId = new Map(curriculum.map((item) => [item.id, item]));
    const reordered = [];
    for (const id of ids) {
      const safeId = safeName(id);
      const item = byId.get(safeId);
      if (item) {
        reordered.push(item);
        byId.delete(safeId);
      }
    }
    for (const item of byId.values()) reordered.push(item);
    const next = reordered.map((item, index) => ({ ...item, order: index + 1 }));
    await writeJson(curriculumFile, next);
    res.json({ curriculum: next });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post("/api/preps/:prep/track-requests", async (req, res) => {
  try {
    const prep = safeName(req.params.prep);
    const prepDir = path.join(PREPS_DIR, prep);
    const stat = await fs.stat(prepDir);
    if (!stat.isDirectory()) throw new Error("prep not found");

    const trackRequestsFile = path.join(prepDir, "track-requests.json");
    const curriculumFile = path.join(prepDir, "curriculum.json");
    let trackRequests = await readJson(trackRequestsFile, []);
    if (!Array.isArray(trackRequests)) trackRequests = [];
    let curriculum = await readJson(curriculumFile, []);
    if (!Array.isArray(curriculum)) curriculum = [];
    const title = String(req.body.title || "").trim();
    if (!title) throw new Error("Track title is required");
    const id = slugify(req.body.id || title);
    if (trackRequests.some((item) => item.id === id)) throw new Error("Track request already exists");

    const item = {
      id,
      title,
      level: req.body.level || "beginner",
      depth: req.body.depth || "standard",
      parentTrack: req.body.parentTrack || undefined,
      priority: req.body.priority || "medium",
      reason: req.body.reason || "User-added track request.",
      status: "suggested",
      createdBy: "User",
    };
    let order = Math.max(0, ...curriculum.map((entry) => Number(entry.order) || 0)) + 1;
    if (req.body.insertAfter) {
      const anchor = curriculum.find((entry) => entry.id === req.body.insertAfter);
      if (anchor) {
        order = (Number(anchor.order) || 0) + 1;
        for (const entry of curriculum) {
          if ((Number(entry.order) || 0) >= order) entry.order = (Number(entry.order) || 0) + 1;
        }
      }
    }
    trackRequests.push(item);
    curriculum.push({ id, kind: "requested", level: item.level, order });
    await writeJson(trackRequestsFile, trackRequests);
    await writeJson(curriculumFile, curriculum);
    res.json({ item, curriculum });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post("/api/preps/:prep/onboarding-requests", async (req, res) => {
  try {
    const prep = safeName(req.params.prep);
    const prepDir = path.join(PREPS_DIR, prep);
    const stat = await fs.stat(prepDir);
    if (!stat.isDirectory()) throw new Error("prep not found");

    const requestsFile = path.join(prepDir, "onboarding-requests.json");
    const curriculumFile = path.join(prepDir, "curriculum.json");
    const onboardingDir = path.join(prepDir, "onboarding");
    let requests = await readJson(requestsFile, []);
    if (!Array.isArray(requests)) requests = [];
    let curriculum = await readJson(curriculumFile, []);
    if (!Array.isArray(curriculum)) curriculum = [];
    const title = String(req.body.title || "").trim();
    if (!title) throw new Error("Product docs title is required");
    const id = slugify(req.body.id || title);
    if (requests.some((item) => item.id === id)) throw new Error("Onboarding request already exists");

    await fs.mkdir(path.join(onboardingDir, id), { recursive: true });
    let sourcePath;
    if (req.body.sourceMarkdown && String(req.body.sourceMarkdown).trim()) {
      sourcePath = `onboarding/${id}/source.md`;
      await fs.writeFile(path.join(prepDir, sourcePath), String(req.body.sourceMarkdown));
    }

    const item = {
      id,
      title,
      kind: "docs-onboarding",
      goal: req.body.goal || "support-product",
      level: req.body.level || "beginner",
      docsUrl: req.body.docsUrl || "",
      sourcePath,
      notes: req.body.notes || "",
      status: "suggested",
      createdBy: "User",
    };
    const order = Math.max(0, ...curriculum.map((entry) => Number(entry.order) || 0)) + 1;
    requests.push(item);
    curriculum.push({ id, kind: "docs-onboarding", level: item.level, order });
    await writeJson(requestsFile, requests);
    await writeJson(curriculumFile, curriculum);
    res.json({ item, curriculum });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post("/api/preps/:prep/onboarding-requests/:request/create", async (req, res) => {
  try {
    const prepDir = path.join(PREPS_DIR, safeName(req.params.prep));
    const request = safeName(req.params.request);
    const requestsFile = path.join(prepDir, "onboarding-requests.json");
    const requests = await readJson(requestsFile, []);
    const index = requests.findIndex((item) => item.id === request);
    if (index < 0) throw new Error("onboarding request not found");
    requests[index] = {
      ...requests[index],
      status: "creating",
      requestedAt: new Date().toISOString(),
    };
    await writeJson(requestsFile, requests);
    res.json({ item: requests[index] });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.patch("/api/preps/:prep/track-requests/:track", async (req, res) => {
  try {
    const prepDir = path.join(PREPS_DIR, safeName(req.params.prep));
    const track = safeName(req.params.track);
    const trackRequestsFile = path.join(prepDir, "track-requests.json");
    const trackRequests = await readJson(trackRequestsFile, []);
    const index = trackRequests.findIndex((item) => item.id === track);
    if (index < 0) throw new Error("track request not found");
    trackRequests[index] = {
      ...trackRequests[index],
      ...req.body,
      id: trackRequests[index].id,
    };
    await writeJson(trackRequestsFile, trackRequests);
    res.json({ item: trackRequests[index] });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post("/api/preps/:prep/track-requests/:track/create", async (req, res) => {
  try {
    const prepDir = path.join(PREPS_DIR, safeName(req.params.prep));
    const track = safeName(req.params.track);
    const trackRequestsFile = path.join(prepDir, "track-requests.json");
    const trackRequests = await readJson(trackRequestsFile, []);
    const index = trackRequests.findIndex((item) => item.id === track);
    if (index < 0) throw new Error("track request not found");
    trackRequests[index] = {
      ...trackRequests[index],
      status: "creating",
      requestedAt: new Date().toISOString(),
    };
    await writeJson(trackRequestsFile, trackRequests);
    res.json({ item: trackRequests[index] });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post("/api/preps/:prep/track-requests/:track/modify", async (req, res) => {
  try {
    const prepDir = path.join(PREPS_DIR, safeName(req.params.prep));
    const track = safeName(req.params.track);
    const trackRequestsFile = path.join(prepDir, "track-requests.json");
    const trackRequests = await readJson(trackRequestsFile, []);
    const index = trackRequests.findIndex((item) => item.id === track);
    const level = ["beginner", "intermediate", "advanced"].includes(req.body.level)
      ? req.body.level
      : undefined;
    const mode = req.body.mode === "fork" ? "fork" : "in-place";
    const forkTo = mode === "fork" ? safeName(`${track}-${safeName(req.params.prep)}`) : undefined;
    if (index < 0) {
      trackRequests.push({
        id: track,
        title: track,
        priority: "medium",
        reason: req.body.reason || "User requested an optimization pass.",
        ...(level ? { level } : {}),
        mode,
        ...(forkTo ? { forkTo } : {}),
        status: "modify-requested",
        createdBy: "User",
        requestedAt: new Date().toISOString(),
      });
    } else {
      trackRequests[index] = {
        ...trackRequests[index],
        status: "modify-requested",
        modificationNotes: req.body.reason || "Optimize this track for retake.",
        ...(level ? { level } : {}),
        mode,
        ...(forkTo ? { forkTo } : { forkTo: undefined }),
        requestedAt: new Date().toISOString(),
      };
    }
    await writeJson(trackRequestsFile, trackRequests);
    res.json({ item: trackRequests.find((item) => item.id === track) });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Delete a prep, optionally together with tracks created/tuned for it.
app.delete("/api/preps/:prep", async (req, res) => {
  try {
    const prep = safeName(req.params.prep);
    const prepDir = path.join(PREPS_DIR, prep);
    const stat = await fs.stat(prepDir);
    if (!stat.isDirectory()) throw new Error("prep not found");
    const deleteTracks = Array.isArray(req.body?.deleteTracks) ? req.body.deleteTracks : [];
    const deleted = [];
    for (const id of deleteTracks) {
      const trackDir = path.join(TRACKS_DIR, safeName(id));
      try {
        const trackStat = await fs.stat(trackDir);
        if (trackStat.isDirectory()) {
          await fs.rm(trackDir, { recursive: true, force: false });
          deleted.push(safeName(id));
        }
      } catch {}
    }
    await fs.rm(prepDir, { recursive: true, force: false });
    res.json({ ok: true, deletedTracks: deleted });
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

// Save a job posting; generation happens via Claude Code on the saved file.
app.post("/api/preps", async (req, res) => {
  try {
    const { name, posting, resume, resumeId } = req.body;
    const id = safeName(
      String(name || "").toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]/g, "")
    );
    let resumeText = resume && resume.trim() ? resume : "";
    if (resumeId) {
      resumeText = await fs.readFile(path.join(RESUMES_DIR, `${safeName(resumeId)}.md`), "utf8");
    }
    const dir = path.join(PREPS_DIR, id);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, "job-posting.md"), posting || "");
    if (resumeText) {
      await fs.writeFile(path.join(dir, "resume.md"), resumeText);
    }
    res.json({ id });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Set or replace a prep's resume, from pasted content or a saved resume.
app.put("/api/preps/:prep/resume", async (req, res) => {
  try {
    const prepDir = path.join(PREPS_DIR, safeName(req.params.prep));
    const stat = await fs.stat(prepDir);
    if (!stat.isDirectory()) throw new Error("prep not found");
    let content = String(req.body.content || "");
    if (req.body.resumeId) {
      content = await fs.readFile(path.join(RESUMES_DIR, `${safeName(req.body.resumeId)}.md`), "utf8");
    }
    if (!content.trim()) throw new Error("Resume content is required");
    await fs.writeFile(path.join(prepDir, "resume.md"), content);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ---------- resumes (saved once, reused across preps) ----------

app.get("/api/resumes", async (_req, res) => {
  let files = [];
  try {
    files = await fs.readdir(RESUMES_DIR);
  } catch {}
  const out = [];
  for (const f of files) {
    if (!f.endsWith(".md")) continue;
    const stat = await fs.stat(path.join(RESUMES_DIR, f)).catch(() => null);
    out.push({ id: f.replace(/\.md$/, ""), updatedAt: stat?.mtime?.toISOString() });
  }
  res.json(out);
});

app.post("/api/resumes", async (req, res) => {
  try {
    const content = String(req.body.content || "");
    if (!content.trim()) throw new Error("Resume content is required");
    if (!String(req.body.name || "").trim()) throw new Error("Resume name is required");
    const id = slugify(req.body.name);
    await fs.mkdir(RESUMES_DIR, { recursive: true });
    await fs.writeFile(path.join(RESUMES_DIR, `${id}.md`), content);
    res.json({ id });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get("/api/resumes/:id", async (req, res) => {
  try {
    const body = await fs.readFile(path.join(RESUMES_DIR, `${safeName(req.params.id)}.md`), "utf8");
    res.json({ body });
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

app.delete("/api/resumes/:id", async (req, res) => {
  try {
    await fs.rm(path.join(RESUMES_DIR, `${safeName(req.params.id)}.md`));
    res.json({ ok: true });
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

// ---------- progress ----------

app.get("/api/progress", async (_req, res) => res.json(await readProgress()));

app.put("/api/progress", async (req, res) => {
  await fs.writeFile(PROGRESS_FILE, JSON.stringify(req.body, null, 2));
  res.json({ ok: true });
});

app.get("/api/health", async (_req, res) => {
  res.json({ ok: true, supervised: SUPERVISED });
});

app.get("/api/local-access", async (_req, res) => {
  res.json(await getLocalAccessStatus());
});

app.put("/api/local-access", async (req, res) => {
  if (envOverridesLocalAccess()) {
    return res.status(409).json({ error: "Local access is currently controlled by HOST or LOCAL_ACCESS_ENABLED in the environment." });
  }
  if (typeof req.body?.enabled !== "boolean") {
    return res.status(400).json({ error: "enabled must be a boolean" });
  }
  await writeLocalAccessConfig(req.body.enabled);
  res.json(await getLocalAccessStatus());
});

app.post("/api/restart", async (_req, res) => {
  if (!SUPERVISED) {
    return res.status(409).json({ error: "Restart is only available when Supercharger is launched through the dev launcher." });
  }
  res.json({ ok: true });
  setTimeout(async () => {
    await cleanup();
    process.exit(RESTART_EXIT_CODE);
  }, 50);
});

// ---------- sandbox sessions ----------

const sessions = new Map(); // id -> { container, track, lesson }

async function buildAndRun(track, lesson) {
  const ctx = path.join(TRACKS_DIR, safeName(track), safeName(lesson), "sandbox");
  const tag = `supercharger-${track}-${lesson}`.toLowerCase();
  await new Promise((resolve, reject) => {
    const p = spawn("docker", ["build", "-t", tag, ctx]);
    let err = "";
    p.stderr.on("data", (d) => (err += d));
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(err.slice(-2000)))));
  });
  const container = await docker([
    "run", "-d", "--rm",
    "--memory", "512m", "--cpus", "1",
    "--label", "supercharger=1",
    tag,
  ]);
  // Sandboxes may declare where the terminal should open (defaults to /work)
  // via a `supercharger.workdir` image label — see SPEC.md.
  let workdir = "/work";
  try {
    const label = (
      await docker(["inspect", "-f", '{{ index .Config.Labels "supercharger.workdir" }}', tag])
    ).trim();
    if (label.startsWith("/")) workdir = label;
  } catch {}
  return { container, workdir };
}

app.post("/api/sandbox/start", async (req, res) => {
  try {
    const { track, lesson } = req.body;
    const { container, workdir } = await buildAndRun(track, lesson);
    const id = crypto.randomUUID();
    sessions.set(id, { container, workdir, track, lesson });
    res.json({ id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/sandbox/:id/files", async (req, res) => {
  const s = sessions.get(req.params.id);
  if (!s) return res.status(404).json({ error: "no session" });
  try {
    const out = await docker(["exec", s.container, "find", "/work", "-maxdepth", "3", "-not", "-name", ".*", "-not", "-path", "/work"], { timeout: 5000 });
    const files = out.split("\n").filter(Boolean).map((p) => p.replace(/^\/work\/?/, "")).filter(Boolean);
    res.json({ files });
  } catch (e) {
    res.json({ files: [] });
  }
});

app.get("/api/sandbox/:id/files/*", async (req, res) => {
  const s = sessions.get(req.params.id);
  if (!s) return res.status(404).json({ error: "no session" });
  const rel = req.params[0];
  if (!rel || rel.includes("..")) return res.status(400).json({ error: "bad path" });
  try {
    const out = await docker(["exec", s.container, "cat", `/work/${rel}`], { timeout: 5000 });
    res.json({ content: out });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/sandbox/:id/files/*", express.text({ type: "*/*", limit: "1mb" }), async (req, res) => {
  const s = sessions.get(req.params.id);
  if (!s) return res.status(404).json({ error: "no session" });
  const rel = req.params[0];
  if (!rel || rel.includes("..")) return res.status(400).json({ error: "bad path" });
  try {
    await new Promise((resolve, reject) => {
      const p = spawn("docker", ["exec", "-i", s.container, "sh", "-c", `cat > /work/${rel}`]);
      p.stdin.write(req.body ?? "");
      p.stdin.end();
      p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`exit ${code}`))));
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/sandbox/:id/check", async (req, res) => {
  const s = sessions.get(req.params.id);
  if (!s) return res.status(404).json({ error: "no session" });
  try {
    const out = await docker(["exec", s.container, "check"], { timeout: 30000 });
    res.json(JSON.parse(out));
  } catch (e) {
    res.status(500).json({ error: e.message.slice(0, 2000) });
  }
});

app.delete("/api/sandbox/:id", async (req, res) => {
  const s = sessions.get(req.params.id);
  if (s) {
    sessions.delete(req.params.id);
    docker(["rm", "-f", s.container]).catch(() => {});
  }
  res.json({ ok: true });
});

// ---------- server + terminal websocket ----------

const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/term" });

wss.on("connection", (ws, req) => {
  const id = new URL(req.url, "http://x").searchParams.get("session");
  const s = sessions.get(id);
  if (!s) return ws.close(4004, "no session");

  let term;
  try {
    term = pty.spawn(
      DOCKER_BIN,
      ["exec", "-it", "-w", s.workdir || "/work", s.container, "bash", "-l"],
      { name: "xterm-256color", cols: 80, rows: 24, cwd: ROOT, env: process.env }
    );
  } catch (e) {
    ws.send(`\r\n\x1b[31mFailed to attach terminal: ${e.message}\x1b[0m\r\n`);
    ws.close();
    return;
  }
  term.onData((d) => ws.readyState === 1 && ws.send(d));
  term.onExit(() => ws.close());
  ws.on("message", (msg) => {
    const str = msg.toString();
    if (str.startsWith("\x00resize:")) {
      const [cols, rows] = str.slice(8).split("x").map(Number);
      if (cols > 0 && rows > 0) term.resize(cols, rows);
    } else {
      term.write(str);
    }
  });
  ws.on("close", () => term.kill());
});

async function cleanup() {
  for (const s of sessions.values()) await docker(["rm", "-f", s.container]).catch(() => {});
}

app.post("/api/shutdown", async (_req, res) => {
  res.json({ ok: true });
  await cleanup();
  process.exit(0);
});

process.on("SIGINT", async () => { await cleanup(); process.exit(0); });
process.on("SIGTERM", async () => { await cleanup(); process.exit(0); });

// Kill any orphaned containers from a previous crash before accepting traffic.
docker(["ps", "-q", "--filter", "label=supercharger=1"]).then((out) => {
  const ids = out.split("\n").filter(Boolean);
  if (ids.length) {
    console.log(`Cleaning up ${ids.length} orphaned container(s)…`);
    return docker(["rm", "-f", ...ids]).catch(() => {});
  }
}).catch(() => {});

server.listen(PORT, HOST, () => console.log(`Supercharger server on http://${HOST}:${PORT}`));
