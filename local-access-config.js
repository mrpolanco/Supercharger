import fs from "fs";
import fsp from "fs/promises";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname);

export const LOCAL_ACCESS_CONFIG_FILE = path.join(ROOT, ".supercharger-local-access.json");
export const DEFAULT_LOCAL_ACCESS_ENABLED = false;
export const API_PORT = Number(process.env.PORT) || 4400;
export const WEB_PORT = Number(process.env.WEB_PORT) || 4401;
export const RESTART_EXIT_CODE = 75;
export const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);
export const FALSE_VALUES = new Set(["0", "false", "no", "off"]);

function normalizeEnabled(value) {
  return value === true;
}

export function readLocalAccessConfigSync() {
  try {
    const raw = fs.readFileSync(LOCAL_ACCESS_CONFIG_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return { enabled: normalizeEnabled(parsed.enabled) };
  } catch {
    return { enabled: DEFAULT_LOCAL_ACCESS_ENABLED };
  }
}

export async function readLocalAccessConfig() {
  try {
    const raw = await fsp.readFile(LOCAL_ACCESS_CONFIG_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return { enabled: normalizeEnabled(parsed.enabled) };
  } catch {
    return { enabled: DEFAULT_LOCAL_ACCESS_ENABLED };
  }
}

export async function writeLocalAccessConfig(enabled) {
  await fsp.writeFile(
    LOCAL_ACCESS_CONFIG_FILE,
    `${JSON.stringify({ enabled: normalizeEnabled(enabled) }, null, 2)}\n`,
  );
}

export function listenerHostForEnabled(enabled) {
  return enabled ? "0.0.0.0" : "127.0.0.1";
}

export function envOverridesLocalAccess() {
  return Boolean(process.env.HOST || process.env.LOCAL_ACCESS_ENABLED);
}

export function resolveLocalAccessEnabled() {
  if (typeof process.env.LOCAL_ACCESS_ENABLED === "string") {
    const value = process.env.LOCAL_ACCESS_ENABLED.toLowerCase();
    if (TRUE_VALUES.has(value)) return true;
    if (FALSE_VALUES.has(value)) return false;
    return DEFAULT_LOCAL_ACCESS_ENABLED;
  }
  if (typeof process.env.HOST === "string" && process.env.HOST.length > 0) {
    return !["127.0.0.1", "localhost"].includes(process.env.HOST);
  }
  return readLocalAccessConfigSync().enabled;
}

export function getLanIpv4Addresses() {
  const seen = new Set();
  const out = [];
  for (const entries of Object.values(os.networkInterfaces())) {
    for (const entry of entries || []) {
      const family = typeof entry.family === "string" ? entry.family : String(entry.family);
      if (family !== "IPv4" || entry.internal) continue;
      if (seen.has(entry.address)) continue;
      seen.add(entry.address);
      out.push(entry.address);
    }
  }
  return out;
}
