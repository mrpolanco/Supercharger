import { spawn } from "child_process";
import { RESTART_EXIT_CODE } from "../local-access-config.js";

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const baseEnv = {
  ...process.env,
  SUPERCHARGER_SUPERVISED: "1",
};

let serverChild = null;
let webChild = null;
let stopping = false;
let restarting = false;
let closedChildren = 0;
let finalExitCode = 0;

function spawnWorkspace(name, color, args) {
  const child = spawn(npmCmd, args, {
    stdio: ["inherit", "pipe", "pipe"],
    env: baseEnv,
  });

  child.stdout.on("data", (chunk) => process.stdout.write(`\x1b[${color}m[${name}]\x1b[0m ${chunk}`));
  child.stderr.on("data", (chunk) => process.stderr.write(`\x1b[${color}m[${name}]\x1b[0m ${chunk}`));
  return child;
}

function startChildren() {
  closedChildren = 0;
  serverChild = spawnWorkspace("server", "34", ["run", "dev", "-w", "server"]);
  webChild = spawnWorkspace("web", "32", ["run", "dev", "-w", "web"]);

  serverChild.on("exit", (code, signal) => onChildExit("server", code, signal));
  webChild.on("exit", (code, signal) => onChildExit("web", code, signal));
}

function killChild(child, signal = "SIGTERM") {
  if (!child || child.killed) return;
  try {
    child.kill(signal);
  } catch {}
}

function killBoth(signal = "SIGTERM") {
  killChild(serverChild, signal);
  killChild(webChild, signal);
}

function onChildExit(name, code, signal) {
  closedChildren += 1;

  if (stopping) {
    if (closedChildren === 1) killBoth("SIGTERM");
    if (closedChildren >= 2) process.exit(finalExitCode);
    return;
  }

  if (restarting) {
    if (closedChildren >= 2) {
      restarting = false;
      console.log("\n[launcher] restarting Supercharger…");
      startChildren();
    } else {
      killBoth("SIGTERM");
    }
    return;
  }

  if (name === "server" && code === RESTART_EXIT_CODE) {
    restarting = true;
    killBoth("SIGTERM");
    return;
  }

  stopping = true;
  finalExitCode = code ?? (signal ? 1 : 0);
  if (closedChildren === 1) killBoth("SIGTERM");
  if (name === "server" && finalExitCode === 0) {
    console.log("\n[launcher] server stopped");
  } else {
    console.error(`\n[launcher] ${name} exited${signal ? ` via ${signal}` : ` with code ${finalExitCode}`}`);
    if (finalExitCode === 0) finalExitCode = 1;
  }
}

process.on("SIGINT", () => {
  stopping = true;
  finalExitCode = 0;
  killBoth("SIGTERM");
});

process.on("SIGTERM", () => {
  stopping = true;
  finalExitCode = 0;
  killBoth("SIGTERM");
});

startChildren();
